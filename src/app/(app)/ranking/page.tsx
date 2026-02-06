// app/(app)/ranking/page.tsx
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import RankingClient from "@/components/ranking/RankingClient";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";

function fmtMonthBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Semana (Seg–Sex) alinhada com seu SQL (date_trunc('week') = segunda)
function getWeekRangeFromRef(ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const jsDay = d.getDay(); // 0 dom ... 6 sáb
  const diffToMonday = (jsDay + 6) % 7; // seg=0 ... dom=6
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return { monday, friday };
}

function fmtBRShort(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

export type RankingSellerRow = {
  seller_id: number;
  seller_name: string | null;

  // mensal
  goal_meta: number;
  net_sales: number;
  pct_achieved: number;

  // semanal
  weekly_meta: number;
  weekly_realized: number;
  weekly_pct_achieved: number;
  weekly_missing_value: number;
  weekly_bonus: number;

  wallet_total: number;            // total de clientes na carteira
  wallet_positive_month: number;   // clientes positivados no mês (compraram no mês)
  wallet_positive_pct: number;     // % positivação
  need_message: number;            // precisa mandar mensagem
  follow_up: number;               // acompanhar
  open_budgets: number;   
};

type SP = Record<string, string | string[] | undefined> | undefined;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
export default async function AdminRankingPage({
  searchParams,
}: {
  searchParams?: SP | Promise<SP>;
}) {
  noStore();

  const session = await getServerSession();
  if (!session) redirect("/select-user");
  if (session.role !== "admin") redirect("/dashboard");

  // mesmos sellers do dashboard (ajuste se quiser dinâmico)
  const sellerIds = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];

  const sp = await Promise.resolve(searchParams as any as SP);

  const raw = first(sp?.weekOffset);
  const parsed = Number.parseInt(raw ?? "0", 10);
  const weekOffset = clampInt(Number.isFinite(parsed) ? parsed : 0, -104, 104); 

  
  const dataRef = new Date();
  dataRef.setDate(dataRef.getDate() + weekOffset * 7);

  const { monday, friday } = getWeekRangeFromRef(dataRef);

  const args: any[] = [];
  // $1 -> lista de sellers
  args.push(sellerIds);
  // $2 -> data_ref (semana)
  args.push(new Date(dataRef.getFullYear(), dataRef.getMonth(), dataRef.getDate()));

  const whereSellersMonthly = `f.funcionario_id IS NOT NULL AND f.funcionario_id::int = ANY($1::int[])`;
  const whereSellersWeekly = `f.funcionario_id IS NOT NULL AND f.funcionario_id::int = ANY($1::int[])`;

  const sql = `
 WITH
  params AS ( SELECT $2::date AS data_ref ),

  semana_ref AS (
    SELECT
      date_trunc('week', p.data_ref)::date AS semana_ini,
      (date_trunc('week', p.data_ref)::date + 4) AS semana_fim
    FROM params p
  ),

  ref AS (
    SELECT
      sr.semana_ini::date AS data_ref,
      LEAST(sr.semana_ini::date, CURRENT_DATE)::date AS today_ref
    FROM semana_ref sr
  ),


  periodo AS (
    SELECT
      date_trunc('month', r.data_ref)::date AS dt_ini,
      (date_trunc('month', r.data_ref) + interval '1 month - 1 day')::date AS dt_fim,
      LEAST(
        (date_trunc('month', r.data_ref) + interval '1 month - 1 day')::date,
        r.today_ref
      )::date AS dt_fim_ref,
      (extract(year from date_trunc('month', r.data_ref))::int * 100
        + extract(month from date_trunc('month', r.data_ref))::int) AS ano_mes
    FROM ref r
),


-- ✅ calendário “histórico”: corridos/restantes dependem do today_ref
calendario AS (
  SELECT
    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5)::int AS uteis_mes,
    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d <= r.today_ref)::int AS uteis_corridos,
    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND d >  r.today_ref)::int AS uteis_restantes
  FROM periodo p
  CROSS JOIN ref r
  CROSS JOIN LATERAL generate_series(p.dt_ini, p.dt_fim, '1 day'::interval) d
),

monthly_base AS (
  SELECT
    f.funcionario_id::int AS seller_id,
    f.nome AS seller_name
  FROM public.funcionarios f
  WHERE upper(coalesce(f.ativo,'S')) NOT IN ('N','NAO','0','F','FALSE')
    AND (${whereSellersMonthly})
),

vendas_consolidadas AS (
  SELECT
    o.vendedor_id::int AS seller_id,
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
    rd.vendedor_id::int AS seller_id,
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
  SELECT im.funcionario_id::int AS seller_id, SUM(im.meta)::numeric AS v_meta
  FROM public.itens_metas im
  CROSS JOIN periodo p
  WHERE im.ano_mes = p.ano_mes
  GROUP BY 1
),

mensal AS (
  SELECT
    b.seller_id,
    b.seller_name,

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
  FROM monthly_base b
  CROSS JOIN calendario c
  LEFT JOIN vendas_consolidadas v ON v.seller_id = b.seller_id
  LEFT JOIN devolucoes_itens d ON d.seller_id = b.seller_id
  LEFT JOIN metas m ON m.seller_id = b.seller_id
),

/* =========================
   SEMANAL (semana do data_ref)
   ========================= */


weekly_base AS (
  SELECT
    f.funcionario_id::int AS seller_id
  FROM public.funcionarios f
  WHERE upper(coalesce(f.ativo,'S')) NOT IN ('N','NAO','0','F','FALSE')
    AND (${whereSellersWeekly})
),

vendas_semana AS (
  SELECT
    o.vendedor_id::int AS seller_id,
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
  GROUP BY 1
),

devolucoes_semana AS (
  SELECT
    rd.vendedor_id::int AS seller_id,
    SUM(COALESCE(rd.valor_credito_gerado, 0)) AS total_credito_devolucao
  FROM public.requisicoes_devolucoes rd
  JOIN semana_ref sr ON TRUE
  WHERE rd.data_hora_alteracao::date BETWEEN sr.semana_ini AND sr.semana_fim
    AND rd.vendedor_id IS NOT NULL
  GROUP BY 1
),

meta_semanal AS (
  SELECT
    ms.vendedor_id::int AS seller_id,
    SUM(COALESCE(ms.valor_meta, 0))::numeric AS meta
  FROM public.metas_semanal ms
  JOIN semana_ref sr
    ON ms.data_inicio::date <= sr.semana_ini
   AND ms.data_fim::date    >= sr.semana_fim
  GROUP BY 1
),

semanal AS (
  SELECT
    b.seller_id,
    COALESCE(m.meta, 0)::numeric AS weekly_meta,
    (
      COALESCE(v.valor_bruto_total, 0)
      - COALESCE(d.total_credito_devolucao, 0)
      - COALESCE(v.ajuste_desp_estorno, 0)
      - COALESCE(v.despesa_operacional, 0)
      - COALESCE(v.total_frete, 0)
    )::numeric AS weekly_realized
  FROM weekly_base b
  LEFT JOIN meta_semanal m ON m.seller_id = b.seller_id
  LEFT JOIN vendas_semana v ON v.seller_id = b.seller_id
  LEFT JOIN devolucoes_semana d ON d.seller_id = b.seller_id
),

/* =========================
   CARTEIRA / POSITIVAÇÃO (MÊS do data_ref)
   ========================= */
carteira_base AS (
  SELECT
    c.vendedor_id::int AS seller_id,
    c.cadastro_id::bigint AS cliente_id
  FROM public.vw_web_clientes c
  WHERE COALESCE(c.cliente_ativo,'S') <> 'N'
    AND c.vendedor_id IS NOT NULL
    AND (c.vendedor_id)::int = ANY($1::int[])
    AND COALESCE(TRIM(c.nome_vendedor), '') <> ''
    AND UPPER(TRIM(c.nome_vendedor)) NOT LIKE 'GRUPO%'
    AND UPPER(TRIM(c.nome_vendedor)) NOT LIKE 'VENDEDOR%'
),

-- ✅ positivado no mês (mês do periodo)
  last_sale_month AS (
    SELECT
      o.vendedor_id::int AS seller_id,
      o.cadastro_id::bigint AS cliente_id
    FROM public.orcamentos o
    CROSS JOIN periodo p
    WHERE o.pedido_fechado = 'S'
      AND COALESCE(o.cancelado,'N') = 'N'
      AND COALESCE(o.bloqueado,'N') = 'N'
      AND o.data_recebimento::date >= p.dt_ini
      AND o.data_recebimento::date <= p.dt_fim_ref
      AND o.vendedor_id IS NOT NULL
      AND o.cadastro_id IS NOT NULL
    GROUP BY 1,2
  ),


-- ✅ última/próxima interação “até a data de referência”
interacoes AS (
  SELECT
    i.cliente_id::bigint AS cliente_id,
    MAX(i.ultima_interacao) FILTER (WHERE i.ultima_interacao::date <= r.today_ref) AS ultima_interacao,
    MAX(i.proxima_interacao) FILTER (WHERE i.proxima_interacao::date <= r.today_ref) AS proxima_interacao
  FROM public.crm_interacoes_radar i
  CROSS JOIN ref r
  WHERE i.cliente_id IS NOT NULL
  GROUP BY 1
),

-- ✅ orçamentos “abertos no tempo” (válidos em today_ref)
  open_budgets_carteira AS (
    SELECT
      o.vendedor_id::int AS seller_id,
      o.cadastro_id::bigint AS cliente_id
    FROM public.orcamentos o
    CROSS JOIN periodo p
    WHERE COALESCE(o.pedido_fechado,'N') = 'N'
      AND COALESCE(o.cancelado,'N') = 'N'
      AND COALESCE(o.bloqueado,'N') = 'N'
      AND o.data_validade_orcamento IS NOT NULL
      AND o.data_validade_orcamento::date >= p.dt_ini
      AND o.data_validade_orcamento::date <= p.dt_fim_ref
      AND o.vendedor_id IS NOT NULL
      AND o.cadastro_id IS NOT NULL
    GROUP BY 1,2
  ),


carteira_stats AS (
  SELECT
    b.seller_id,

    COUNT(DISTINCT b.cliente_id)::int AS wallet_total,
    COUNT(DISTINCT ls.cliente_id)::int AS wallet_positive_month,

    CASE
      WHEN COUNT(DISTINCT b.cliente_id) > 0
      THEN ROUND(
        (COUNT(DISTINCT ls.cliente_id)::numeric / COUNT(DISTINCT b.cliente_id)::numeric) * 100
      , 2)
      ELSE 0
    END AS wallet_positive_pct,

    -- ✅ precisa mensagem na data (today_ref)
    COUNT(DISTINCT b.cliente_id) FILTER (
      WHERE it.ultima_interacao IS NULL
         OR (
           it.ultima_interacao::date <= (r.today_ref - 7)
           AND (it.proxima_interacao IS NULL OR it.proxima_interacao::date <= r.today_ref)
         )
    )::int AS need_message,

    -- ✅ acompanhar (teve interação até hoje_ref, mas não positivou no mês)
    COUNT(DISTINCT b.cliente_id) FILTER (
      WHERE it.ultima_interacao IS NOT NULL
        AND ls.cliente_id IS NULL
    )::int AS follow_up,

    COUNT(DISTINCT ob.cliente_id)::int AS open_budgets

  FROM carteira_base b
  CROSS JOIN ref r
  LEFT JOIN last_sale_month ls
    ON ls.seller_id = b.seller_id AND ls.cliente_id = b.cliente_id
  LEFT JOIN interacoes it
    ON it.cliente_id = b.cliente_id
  LEFT JOIN open_budgets_carteira ob
    ON ob.seller_id = b.seller_id AND ob.cliente_id = b.cliente_id
  GROUP BY 1
)

/* =========================
   RESULTADO FINAL
   ========================= */
SELECT
  m.seller_id,
  m.seller_name,

  COALESCE(m.goal_meta, 0)::numeric AS goal_meta,
  COALESCE(m.net_sales, 0)::numeric AS net_sales,
  COALESCE(m.pct_achieved, 0)::numeric AS pct_achieved,

  COALESCE(s.weekly_meta, 0)::numeric AS weekly_meta,
  COALESCE(s.weekly_realized, 0)::numeric AS weekly_realized,

  COALESCE(cs.wallet_total, 0)::int AS wallet_total,
  COALESCE(cs.wallet_positive_month, 0)::int AS wallet_positive_month,
  COALESCE(cs.wallet_positive_pct, 0)::numeric AS wallet_positive_pct,
  COALESCE(cs.need_message, 0)::int AS need_message,
  COALESCE(cs.follow_up, 0)::int AS follow_up,
  COALESCE(cs.open_budgets, 0)::int AS open_budgets,

  CASE
    WHEN COALESCE(s.weekly_meta, 0) > 0
    THEN ROUND((COALESCE(s.weekly_realized, 0) / NULLIF(s.weekly_meta, 0) * 100)::numeric, 2)
    ELSE 0
  END AS weekly_pct_achieved,

  GREATEST(COALESCE(s.weekly_meta, 0) - COALESCE(s.weekly_realized, 0), 0)::numeric AS weekly_missing_value,

  CASE
    WHEN COALESCE(s.weekly_realized, 0) >= COALESCE(s.weekly_meta, 0)
      AND COALESCE(s.weekly_meta, 0) > 0
    THEN ROUND((COALESCE(s.weekly_realized, 0) * 0.0005)::numeric, 2)
    ELSE 0
  END AS weekly_bonus

  FROM mensal m
  LEFT JOIN semanal s ON s.seller_id = m.seller_id
  LEFT JOIN carteira_stats cs ON cs.seller_id = m.seller_id
  ORDER BY weekly_pct_achieved DESC, weekly_realized DESC, net_sales DESC;

  `;

  const sqlTotalMonthGoal = `
    SELECT
      COALESCE(SUM(COALESCE(m.meta, 0)), 0)::numeric AS total_goal
    FROM public.metas m
    WHERE m.empresa_id = ANY($1::bigint[])
      AND m.ano_mes =
        (EXTRACT(YEAR FROM $2::date)::bigint * 100
          + EXTRACT(MONTH FROM $2::date)::bigint)
  `;
   const empresaIds = [1, 2, 3, 5, 6];
  const { rows: totalGoalRows } = await radarPool.query(sqlTotalMonthGoal, [
    empresaIds,
    args[1], 
  ]);
   const totalMonthGoal = toNumber(totalGoalRows?.[0]?.total_goal);

  


  const { rows } = await radarPool.query(sql, args);

  const sellers: RankingSellerRow[] = (rows as any[]).map((r) => ({
    seller_id: Number(r.seller_id),
    seller_name: r.seller_name ?? null,

    goal_meta: toNumber(r.goal_meta),
    net_sales: toNumber(r.net_sales),
    pct_achieved: toNumber(r.pct_achieved),

    weekly_meta: toNumber(r.weekly_meta),
    weekly_realized: toNumber(r.weekly_realized),
    weekly_pct_achieved: toNumber(r.weekly_pct_achieved),
    weekly_missing_value: toNumber(r.weekly_missing_value),
    weekly_bonus: toNumber(r.weekly_bonus),

    wallet_total: Number(r.wallet_total ?? 0),
    wallet_positive_month: Number(r.wallet_positive_month ?? 0),
    wallet_positive_pct: toNumber(r.wallet_positive_pct),
    need_message: Number(r.need_message ?? 0),
    follow_up: Number(r.follow_up ?? 0),
    open_budgets: Number(r.open_budgets ?? 0),
  }));

  const totalMonthSold = sellers.reduce((acc, s) => acc + (Number.isFinite(s.net_sales) ? s.net_sales : 0), 0);

  const totalMonthPct = totalMonthGoal > 0
    ? (totalMonthSold / totalMonthGoal) * 100
    : 0;


  const weekLabel = `${fmtBRShort(monday)} — ${fmtBRShort(friday)}`;
  const monthLabel = fmtMonthBR(monday); 

  return (
    <RankingClient
      weekOffset={weekOffset}
      weekLabel={weekLabel}
      monthLabel={monthLabel}
      totalMonthGoal={totalMonthGoal}
      totalMonthSold={totalMonthSold}
      totalMonthPct={totalMonthPct}
      sellers={sellers}
    />
  );
}
