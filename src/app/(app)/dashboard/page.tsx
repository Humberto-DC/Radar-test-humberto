import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";
import type { Row, ContatoRow, OpenBudgetCard } from "@/types/dashboard";
import DashboardClient from "@/components/dashboard/DashboardClient";



type SellerKpiRow = {
  vendedor_id: number | string;
  vendedor: string | null;

  uteis_mes: number;
  corridos: number;
  restam: number;

  faturamento_bruto: string | number | null;
  devolucoes: string | number | null;
  venda_liquida: string | number | null;

  taxa_dev: string | null;
  meta: string | number | null;
  pct_ating: string | null;
};

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

  // -----------------------------
  // (A) Open Budgets (cards)
  // -----------------------------
  const params: any[] = [];
  let where = `1=1`;

  // ✅ só orçamentos do vendedor logado
  if (session.role === "seller") {
    params.push(session.sellerId);
    where += ` AND (o.vendedor_id)::int = $${params.length}::int`;
  } else if (session.role === "admin") {
    const ADMIN_SELLER_IDS = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];
    params.push(ADMIN_SELLER_IDS);
    where += ` AND o.vendedor_id IS NOT NULL AND (o.vendedor_id)::int = ANY($${params.length}::int[])`;
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
    open_budgets_raw AS (
      SELECT
        o.cadastro_id,
        o.orcamento_id::bigint AS orcamento_id,
        o.data_validade_orcamento
      FROM public.orcamentos o
      WHERE
        ${where}
        AND COALESCE(o.pedido_fechado,'N') = 'N'
        AND COALESCE(o.cancelado,'N') = 'N'
        AND COALESCE(o.bloqueado,'N') = 'N'
        AND UPPER(BTRIM(o.processo_alteracao)) = 'ATUALIZAR_ORCAMENTO'

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

      ob.orcamento_id,
      ob.data_validade_orcamento,

      ${
        session.role === "seller"
          ? `(COALESCE(c.vendedor_id::int, -999) = $1::int) AS is_carteira`
          : `(
              c.vendedor_id IS NOT NULL
              AND c.vendedor_id::int = ANY($1::int[])
            ) AS is_carteira`
      },

      COALESCE(ct.contatos_json, '[]'::jsonb) AS contatos_json
    FROM open_budgets_raw ob
    JOIN public.vw_web_clientes c
      ON c.cadastro_id = ob.cadastro_id
    LEFT JOIN contatos ct
      ON ct.cadastro_id = ob.cadastro_id
    WHERE COALESCE(c.cliente_ativo,'S') <> 'N'
    ORDER BY
      ob.data_validade_orcamento ASC NULLS LAST,
      c.cadastro_id::bigint ASC,
      ob.orcamento_id DESC
    LIMIT 5000;
  `;


  const { rows } = await radarPool.query<Row>(sqlOpenBudgets, params);

  const budgetsClients: OpenBudgetCard[] = rows.map((r) => {
    const clientId = Number(r.cadastro_id);
    const sellerId = r.vendedor_id == null ? null : Number(r.vendedor_id);

    const contatos: ContatoRow[] = (r.contatos_json ?? []).map((c) => ({
      id_contato: c.id_contato,
      id_cliente: clientId,
      nome_contato: (c.nome_contato ?? "").trim(),
      funcao: c.funcao ?? null,
      telefone: (c.celular ?? c.telefone) ?? null,
      criado_em: c.criado_em ? new Date(c.criado_em).toISOString() : null,
    }));

    const principal = contatos.find((c) => c.telefone)?.telefone ?? null;

    return {
      id_cliente: clientId,
      Cliente: pickClientName(r),
      Razao_social: (r.nome_razao_social ?? "").trim(),
      Cidade: (r.nome_cidade ?? "").trim(),
      Estado: (r.estado_id ?? "").trim(),
      Vendedor: (r.nome_vendedor ?? "").trim(),

      Limite: Number(r.limite_credito_aprovado ?? 0),

      telefone: principal,
      tel_celular: principal,

      id_vendedor: sellerId,
      ativo: isActiveFlag(r.cliente_ativo),

      open_budget_id: r.orcamento_id == null ? null : Number(r.orcamento_id),
      validade_orcamento_min: r.data_validade_orcamento
        ? new Date(r.data_validade_orcamento).toISOString()
        : null,

      contatos,
      is_carteira: Boolean(r.is_carteira),
    };
  });


  // -----------------------------
  // (B) KPIs (mês atual)
  // -----------------------------
  const kpiParams: any[] = [];
  let kpiFilter = `1=1`;

  if (session.role === "seller") {
    kpiParams.push(session.sellerId);
    kpiFilter = `v.vendedor_id::int = $${kpiParams.length}::int`;
  } else if (session.role === "admin") {
    const ADMIN_SELLER_IDS = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];
    kpiParams.push(ADMIN_SELLER_IDS);
    kpiFilter = `v.vendedor_id IS NOT NULL AND v.vendedor_id::int = ANY($${kpiParams.length}::int[])`;
  }

  const sqlKpis = `
    WITH periodo AS (
      SELECT
        date_trunc('month', CURRENT_DATE)::date AS dt_ini,
        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date AS dt_fim,
        (extract(year from date_trunc('month', CURRENT_DATE))::int * 100
          + extract(month from date_trunc('month', CURRENT_DATE))::int) AS ano_mes
    ),
    Calendario AS (
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5) as total_uteis,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d <= CURRENT_DATE) as uteis_corridos,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d > CURRENT_DATE) as uteis_restantes
      FROM periodo p
      CROSS JOIN generate_series(p.dt_ini, p.dt_fim, '1 day'::interval) d
    ),
    Vendas AS (
      SELECT
        o.vendedor_id,
        COUNT(*) as qtd_pedidos,
        SUM(COALESCE(o.valor_pedido, 0)) as total_bruto
      FROM orcamentos o
      CROSS JOIN periodo p
      WHERE o.data_recebimento >= p.dt_ini
        AND o.data_recebimento < (p.dt_fim + 1)
        AND COALESCE(o.cancelado,'N') = 'N'
      GROUP BY 1
    ),
    Devolucoes_Itens AS (
      SELECT
        rd.vendedor_id,
        SUM(COALESCE(ird.quantidade * ird.preco_venda, 0)) as total_dev
      FROM itens_requisicoes_devolucoes ird
      JOIN requisicoes_devolucoes rd
        ON ird.requisicao_id = rd.requisicao_id
      CROSS JOIN periodo p
      WHERE ird.data_hora_alteracao >= p.dt_ini
        AND ird.data_hora_alteracao < (p.dt_fim + 1)
      GROUP BY 1
    ),
    Metas AS (
      SELECT im.funcionario_id, SUM(im.meta) as v_meta
      FROM itens_metas im
      CROSS JOIN periodo p
      WHERE im.ano_mes = p.ano_mes
      GROUP BY 1
    )
    SELECT
      v.vendedor_id,
      f.nome as vendedor,

      (SELECT total_uteis FROM Calendario) as uteis_mes,
      (SELECT uteis_corridos FROM Calendario) as corridos,
      (SELECT uteis_restantes FROM Calendario) as restam,

      v.total_bruto as faturamento_bruto,
      COALESCE(d.total_dev, 0) as devolucoes,
      (v.total_bruto - COALESCE(d.total_dev, 0)) as venda_liquida,

      CASE
        WHEN v.total_bruto > 0
        THEN ROUND((COALESCE(d.total_dev, 0) / v.total_bruto * 100)::numeric, 2)::text || '%'
        ELSE '0.00%'
      END as taxa_dev,

      COALESCE(m.v_meta, 0) as meta,

      CASE
        WHEN COALESCE(m.v_meta, 0) > 0
        THEN ROUND((((v.total_bruto - COALESCE(d.total_dev, 0)) / m.v_meta) * 100)::numeric, 2)::text || '%'
        ELSE '0.00%'
      END as pct_ating
    FROM Vendas v
    LEFT JOIN Devolucoes_Itens d ON v.vendedor_id = d.vendedor_id
    LEFT JOIN Metas m ON v.vendedor_id = m.funcionario_id
    LEFT JOIN funcionarios f ON v.vendedor_id = f.funcionario_id
    WHERE ${kpiFilter}
      AND v.total_bruto > 0
    ORDER BY (v.total_bruto - COALESCE(d.total_dev, 0)) DESC;
  `;

  const { rows: kpiRows } = await radarPool.query<SellerKpiRow>(sqlKpis, kpiParams);

  return <DashboardClient openBudgetClients={budgetsClients} sellerKpis={kpiRows} />;
}
