import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";
import type { Row, ContatoRow, OpenBudgetCard, SellerKpiRow } from "@/types/dashboard";
import DashboardClient from "@/components/dashboard/DashboardClient";

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function pickClientName(r: Row) {
  const nf = (r.nome_fantasia ?? "").trim();
  if (nf) return nf;
  const rs = (r.nome_razao_social ?? "").trim();
  return rs || "Sem nome";
}

function isActiveFlag(v?: string | null) {
  const s = (v ?? "").trim().toUpperCase();
  if (!s) return true;
  if (s === "N" || s === "0" || s === "F") return false;
  return true;
}

export default async function Page() {
  noStore();

  const session = await getServerSession();
  if (!session) redirect("/select-user");

  const sellerIds =
    session.role === "admin"
      ? [244, 12, 17, 200, 110, 193, 114, 215, 108, 163]
      : null;

  // -----------------------------
  // (A) Open Budgets (cards)
  // -----------------------------
  const openBudgetArgs: any[] = [];
  let openBudgetWhere = `1=1`;

  if (session.role === "seller") {
    openBudgetArgs.push(session.sellerId);
    openBudgetWhere += ` AND (o.vendedor_id)::int = $${openBudgetArgs.length}::int`;
  } else if (session.role === "admin") {
    openBudgetArgs.push(sellerIds);
    openBudgetWhere += ` AND o.vendedor_id IS NOT NULL AND (o.vendedor_id)::int = ANY($${openBudgetArgs.length}::int[])`;
  }

  const sqlOpenBudgets = `
    WITH contatos AS (
      SELECT
        cc.cadastro_id,
        jsonb_agg(
          jsonb_build_object(
            'id_contato', cc.id_contato,
            'id_cliente', cc.cadastro_id,
            'nome_contato', cc.nome,
            'funcao', cc.funcao,
            'telefone', NULLIF(BTRIM(cc.telefone), ''),
            'celular', NULLIF(BTRIM(cc.celular), ''),
            'criado_em', cc.data_hora_alteracao
          )
          ORDER BY cc.ordem NULLS LAST, cc.id_contato
        ) AS contatos_json
      FROM (
        SELECT
          cadastro_id,
          nome,
          funcao,
          telefone,
          celular,
          data_hora_alteracao,
          ordem,
          ROW_NUMBER() OVER (
            PARTITION BY cadastro_id
            ORDER BY ordem NULLS LAST, data_hora_alteracao DESC NULLS LAST, nome
          )::int AS id_contato
        FROM public.contatos_cadastros
      ) cc
      GROUP BY cc.cadastro_id
    ),
    open_budgets AS (
      SELECT
        o.cadastro_id,
        MAX(o.orcamento_id)::bigint AS open_budget_id,
        MIN(o.data_validade_orcamento) AS validade_orcamento_min
      FROM public.orcamentos o
      WHERE
        ${openBudgetWhere}
        AND COALESCE(o.pedido_fechado,'N') = 'N'
        AND COALESCE(o.cancelado,'N') = 'N'
        AND COALESCE(o.bloqueado,'N') = 'N'
        AND o.data_validade_orcamento IS NOT NULL
      GROUP BY o.cadastro_id
    )
    SELECT
      c.cadastro_id,
      c.nome_razao_social,
      c.nome_fantasia,
      c.nome_cidade,
      c.estado_id,
      c.nome_vendedor,
      c.vendedor_id,
      c.limite_credito_aprovado,
      c.cliente_ativo,

      ob.open_budget_id,
      ob.validade_orcamento_min,

      COALESCE(ct.contatos_json, '[]'::jsonb) AS contatos_json
    FROM open_budgets ob
    JOIN public.vw_web_clientes c ON c.cadastro_id = ob.cadastro_id
    LEFT JOIN contatos ct ON ct.cadastro_id = ob.cadastro_id
    WHERE COALESCE(c.cliente_ativo,'S') <> 'N'
    ORDER BY ob.validade_orcamento_min ASC NULLS LAST
    LIMIT 2000;
  `;

  const { rows: openBudgetRows } = await radarPool.query<Row>(sqlOpenBudgets, openBudgetArgs);

  const openBudgetClients: OpenBudgetCard[] = openBudgetRows.map((r) => {
    const clientId = Number(r.cadastro_id);
    const sellerId = r.vendedor_id == null ? null : Number(r.vendedor_id);
    const isCarteira = session.role === "seller" ? sellerId === session.sellerId : true;

    const contatos: ContatoRow[] = (r.contatos_json ?? []).map((c) => ({
      id_contato: c.id_contato,
      id_cliente: clientId,
      nome_contato: (c.nome_contato ?? "").trim(),
      funcao: c.funcao ?? null,
      telefone: (c.celular ?? c.telefone) ?? null,
      criado_em: c.criado_em ? new Date(c.criado_em).toISOString() : null,
    }));

    const primaryPhone = contatos.find((c) => c.telefone)?.telefone ?? null;

    return {
      id_cliente: clientId,
      Cliente: pickClientName(r),
      Razao_social: (r.nome_razao_social ?? "").trim(),
      Cidade: (r.nome_cidade ?? "").trim(),
      Estado: (r.estado_id ?? "").trim(),
      Vendedor: (r.nome_vendedor ?? "").trim(),
      Limite: Number(r.limite_credito_aprovado ?? 0),

      telefone: primaryPhone,
      tel_celular: primaryPhone,

      id_vendedor: sellerId,
      ativo: isActiveFlag(r.cliente_ativo),

      open_budget_id: r.orcamento_id == null ? null : Number(r.orcamento_id),
      validade_orcamento_min: r.validade_orcamento_min ? new Date(r.validade_orcamento_min).toISOString() : null,

      contatos,
      is_carteira: isCarteira,
    };
  });

  // -----------------------------
  // (B) KPIs (mensal + semanal)
  // -----------------------------
  const kpiArgs: any[] = [];
  let kpiWhere = `1=1`;
  let kpiWhereWeekly = `1=1`;

  if (session.role === "seller") {
    kpiArgs.push(session.sellerId);
    kpiWhere = `v.vendedor_id::int = $${kpiArgs.length}::int`;
    kpiWhereWeekly = `f.funcionario_id::int = $${kpiArgs.length}::int`;
  } else if (session.role === "admin") {
    kpiArgs.push(sellerIds);
    kpiWhere = `v.vendedor_id IS NOT NULL AND v.vendedor_id::int = ANY($${kpiArgs.length}::int[])`;
    kpiWhereWeekly = `f.funcionario_id IS NOT NULL AND f.funcionario_id::int = ANY($${kpiArgs.length}::int[])`;
  }
  const sqlKpisNetSales = `
    WITH
    /* =========================
       MENSAL (já existia)
       ========================= */
    periodo AS (
      SELECT
        date_trunc('month', CURRENT_DATE)::date AS dt_ini,
        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date AS dt_fim,
        (extract(year from date_trunc('month', CURRENT_DATE))::int * 100
          + extract(month from date_trunc('month', CURRENT_DATE))::int) AS ano_mes
    ),
feriados_periodo AS (
  SELECT feriado_id::date AS dt_feriado
  FROM public.feriados
  CROSS JOIN periodo p
  WHERE feriado_id::date BETWEEN p.dt_ini AND p.dt_fim
),
  calendario AS (
    SELECT
      COUNT(*) FILTER (
        WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
          AND NOT EXISTS (
            SELECT 1 FROM feriados_periodo fp
            WHERE fp.dt_feriado = d::date
          )
      )::int AS uteis_mes,

      COUNT(*) FILTER (
        WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
          AND d <= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM feriados_periodo fp
            WHERE fp.dt_feriado = d::date
          )
      )::int AS uteis_corridos,

      COUNT(*) FILTER (
        WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
          AND d > CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM feriados_periodo fp
            WHERE fp.dt_feriado = d::date
          )
      )::int AS uteis_restantes
    FROM periodo p
    CROSS JOIN LATERAL generate_series(p.dt_ini, p.dt_fim, '1 day'::interval) d
  ),

    vendas_consolidadas AS (
      SELECT
        o.vendedor_id,
        COUNT(DISTINCT o.orcamento_id)::int AS qtd_vendas,
        SUM(COALESCE(o.valor_pedido, 0))::numeric AS valor_bruto_total,
        SUM(
          CASE WHEN COALESCE(o.totalmente_devolvido,'N') = 'N'
               THEN COALESCE(o.valor_outras_desp_manual, 0)
               ELSE 0 END
        )::numeric AS despesa_operacional,
        SUM(
          CASE WHEN COALESCE(o.totalmente_devolvido,'N') = 'S'
               THEN COALESCE(o.valor_outras_desp_manual, 0)
               ELSE 0 END
        )::numeric AS ajuste_desp_estorno,
        SUM(
          COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0)
        )::numeric AS total_frete
      FROM public.orcamentos o
      CROSS JOIN periodo p
      WHERE o.data_recebimento >= p.dt_ini
        AND o.data_recebimento < (p.dt_fim + 1)
        AND COALESCE(o.cancelado,'N') = 'N'
      GROUP BY 1
    ),
    devolucoes_itens AS (
      SELECT
        rd.vendedor_id,
        COUNT(DISTINCT rd.requisicao_id)::int AS qtd_devolucoes,
        SUM(COALESCE(ird.quantidade * ird.preco_venda, 0))::numeric AS total_dev_valor
      FROM public.itens_requisicoes_devolucoes ird
      JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
      CROSS JOIN periodo p
      WHERE ird.data_hora_alteracao >= p.dt_ini
        AND ird.data_hora_alteracao < (p.dt_fim + 1)
      GROUP BY 1
    ),
    metas AS (
      SELECT im.funcionario_id, SUM(im.meta)::numeric AS v_meta
      FROM public.itens_metas im
      CROSS JOIN periodo p
      WHERE im.ano_mes = p.ano_mes
      GROUP BY 1
    ),

    mensal AS (
      SELECT
        v.vendedor_id::int AS seller_id,
        f.nome AS seller_name,

        c.uteis_mes,
        c.uteis_corridos,
        c.uteis_restantes,

        COALESCE(v.qtd_vendas, 0)::int AS qtd_vendas,
        COALESCE(d.qtd_devolucoes, 0)::int AS qtd_devolucoes,

        COALESCE(v.valor_bruto_total, 0)::numeric AS gross_total,
        COALESCE(v.total_frete, 0)::numeric AS freight_total,
        COALESCE(v.despesa_operacional, 0)::numeric AS operational_expense,

        (COALESCE(v.valor_bruto_total, 0) - COALESCE(d.total_dev_valor, 0) - COALESCE(v.ajuste_desp_estorno, 0))::numeric AS system_total,

        (
          (COALESCE(v.valor_bruto_total, 0) - COALESCE(d.total_dev_valor, 0) - COALESCE(v.ajuste_desp_estorno, 0))
          - COALESCE(v.despesa_operacional, 0)
          - COALESCE(v.total_frete, 0)
        )::numeric AS net_sales,

        COALESCE(d.total_dev_valor, 0)::numeric AS total_dev_valor,

        CASE
          WHEN COALESCE(v.valor_bruto_total, 0) > 0
          THEN ROUND((COALESCE(d.total_dev_valor, 0) / v.valor_bruto_total * 100)::numeric, 2)
          ELSE 0
        END AS taxa_devolucao_pct,

        COALESCE(m.v_meta, 0)::numeric AS goal_meta,

        CASE
          WHEN COALESCE(m.v_meta, 0) > 0
          THEN ROUND(
            (
              (
                (COALESCE(v.valor_bruto_total, 0) - COALESCE(d.total_dev_valor, 0) - COALESCE(v.ajuste_desp_estorno, 0))
                - COALESCE(v.despesa_operacional, 0)
                - COALESCE(v.total_frete, 0)
              ) / m.v_meta * 100
            )::numeric
          , 2)
          ELSE 0
        END AS pct_achieved
      FROM vendas_consolidadas v
      CROSS JOIN calendario c
      LEFT JOIN devolucoes_itens d ON v.vendedor_id = d.vendedor_id
      LEFT JOIN metas m ON v.vendedor_id = m.funcionario_id
      LEFT JOIN public.funcionarios f ON v.vendedor_id = f.funcionario_id
      WHERE ${kpiWhere}
        AND COALESCE(v.valor_bruto_total, 0) > 0
    ),

    /* =========================
       SEMANAL (igual sua query)
       ========================= */
  /* =========================
   SEMANAL (query do chefe / semana atual)
   ========================= */
params AS (
  SELECT CURRENT_DATE::date AS data_ref
),

semana_ref AS (
  SELECT
    date_trunc('week', p.data_ref)::date AS semana_ini,
    (date_trunc('week', p.data_ref)::date + 4) AS semana_fim
  FROM params p
),

vendas_semana AS (
  SELECT
    o.vendedor_id::bigint AS vendedor_id,

    SUM(COALESCE(o.valor_pedido, 0)) AS valor_bruto_total,

    SUM(
      CASE
        WHEN o.totalmente_devolvido = 'N'
          THEN COALESCE(o.valor_outras_desp_manual, 0)
        ELSE 0
      END
    ) AS despesa_operacional,

    SUM(
      CASE
        WHEN o.totalmente_devolvido = 'S'
          THEN COALESCE(o.valor_outras_desp_manual, 0)
        ELSE 0
      END
    ) AS ajuste_desp_estorno,

    SUM(
      COALESCE(o.valor_frete_processado, 0)
      + COALESCE(o.valor_frete_extra_manual, 0)
    ) AS total_frete

  FROM public.orcamentos o
  JOIN semana_ref sr ON TRUE
  WHERE o.data_recebimento::date BETWEEN sr.semana_ini AND sr.semana_fim
    AND upper(coalesce(o.cancelado,'N')) NOT IN ('S','SIM','1','T','TRUE')
  GROUP BY o.vendedor_id
),

devolucoes_semana AS (
  SELECT
    rd.vendedor_id::bigint AS vendedor_id,
    SUM(COALESCE(rd.valor_credito_gerado, 0)) AS total_credito_devolucao
  FROM public.requisicoes_devolucoes rd
  JOIN semana_ref sr ON TRUE
  WHERE rd.data_hora_alteracao::date BETWEEN sr.semana_ini AND sr.semana_fim
    AND rd.vendedor_id IS NOT NULL
  GROUP BY rd.vendedor_id
),

meta_semanal AS (
  SELECT
    ms.vendedor_id::bigint AS vendedor_id,
    SUM(ms.valor_meta)::numeric AS meta
  FROM public.metas_semanal ms
  JOIN semana_ref sr
    ON ms.data_inicio::date = sr.semana_ini
   AND ms.data_fim::date    = sr.semana_fim
  GROUP BY ms.vendedor_id
),

semanal AS (
  SELECT
    f.funcionario_id::int AS seller_id,
    COALESCE(m.meta, 0)::numeric AS weekly_meta,

    (
      COALESCE(v.valor_bruto_total, 0)
      - COALESCE(d.total_credito_devolucao, 0)
      - COALESCE(v.ajuste_desp_estorno, 0)
      - COALESCE(v.despesa_operacional, 0)
      - COALESCE(v.total_frete, 0)
    )::numeric AS weekly_realized

  FROM meta_semanal m
  JOIN public.funcionarios f ON f.funcionario_id = m.vendedor_id
  LEFT JOIN vendas_semana v ON v.vendedor_id = m.vendedor_id
  LEFT JOIN devolucoes_semana d ON d.vendedor_id = m.vendedor_id
  WHERE upper(coalesce(f.ativo,'S')) NOT IN ('N','NAO','0','F','FALSE')
    AND (${kpiWhereWeekly})
)




    SELECT
      m.*,

      /* semana */
      COALESCE(s.weekly_meta, 0)::numeric AS weekly_meta,
      COALESCE(s.weekly_realized, 0)::numeric AS weekly_realized,

      CASE
        WHEN COALESCE(s.weekly_meta, 0) > 0
        THEN ROUND((COALESCE(s.weekly_realized, 0) / NULLIF(s.weekly_meta, 0) * 100)::numeric, 2)
        ELSE 0
      END AS weekly_pct_achieved,

      GREATEST(COALESCE(s.weekly_meta, 0) - COALESCE(s.weekly_realized, 0), 0)::numeric AS weekly_missing_value,

      CASE
        WHEN COALESCE(s.weekly_realized, 0) >= COALESCE(s.weekly_meta, 0)
        THEN ROUND((COALESCE(s.weekly_realized, 0) * 0.0005)::numeric, 2)
        ELSE 0
      END AS weekly_bonus

    FROM mensal m
    LEFT JOIN semanal s ON s.seller_id = m.seller_id
    ORDER BY m.net_sales DESC;
  `;

  const { rows: kpiRowsRaw } = await radarPool.query(sqlKpisNetSales, kpiArgs);

  const sellerKpis: SellerKpiRow[] = (kpiRowsRaw as any[]).map((r) => ({
    seller_id: Number(r.seller_id),
    seller_name: r.seller_name ?? null,

    business_days_month: Number(r.uteis_mes ?? 0),
    business_days_elapsed: Number(r.uteis_corridos ?? 0),
    business_days_remaining: Number(r.uteis_restantes ?? 0),

    total_sales_count: Number(r.qtd_vendas ?? 0),
    total_returns_count: Number(r.qtd_devolucoes ?? 0),

    gross_total: toNumber(r.gross_total),
    freight_total: toNumber(r.freight_total),
    operational_expense: toNumber(r.operational_expense),
    system_total: toNumber(r.system_total),
    net_sales: toNumber(r.net_sales),

    total_returns_value: toNumber(r.total_dev_valor),
    return_rate_pct: toNumber(r.taxa_devolucao_pct),

    goal_meta: toNumber(r.goal_meta),
    pct_achieved: toNumber(r.pct_achieved),

    // ✅ novos campos semanais
    weekly_meta: toNumber(r.weekly_meta),
    weekly_realized: toNumber(r.weekly_realized),
    weekly_pct_achieved: toNumber(r.weekly_pct_achieved),
    weekly_missing_value: toNumber(r.weekly_missing_value),
    weekly_bonus: toNumber(r.weekly_bonus),
  }));

  return (
    <DashboardClient openBudgetClients={openBudgetClients} sellerKpis={sellerKpis} />
  );
}
