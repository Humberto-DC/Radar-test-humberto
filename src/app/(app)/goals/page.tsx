// app/(app)/goals/page.tsx
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";
import GoalsDashboardClient, {
  type GoalsHeaderData,
  type SellerGoalsRow,
  type WeekMetaItem,
} from "@/components/goals/GoalsEditorClient";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Semana (Seg–Sex) igual ao ranking (date_trunc('week') = segunda no Postgres)
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

function fmtMonthBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

type SP = { weekOffset?: string };

export default async function GoalsPage({ searchParams }: { searchParams?: Promise<SP> }) {
  noStore();
  const sp = await searchParams; // ✅ Next 15
  const weekOffset = clampInt(Number(sp?.weekOffset ?? 0), -104, 104);

  const session = await getServerSession();
  if (!session) redirect("/select-user");
  if (session.role !== "admin") redirect("/dashboard");

  // mesmos sellers do ranking (ajuste livre)
  const sellerIds = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];

  // filtros da meta geral (5 filiais)
  const empresaIds = [1, 2, 3, 5, 6];

  // semana de referência (permite navegar)
  const dataRef = new Date();
  dataRef.setDate(dataRef.getDate() + weekOffset * 7);

  const { monday: refMonday, friday: refFriday } = getWeekRangeFromRef(dataRef);
  const weekLabel = `${fmtBRShort(refMonday)} — ${fmtBRShort(refFriday)}`;

  // mês SEMPRE é o mês do monday da semana (igual ao ranking)
  const monthLabel = fmtMonthBR(refMonday);
  const yearMonth =
    refMonday.getFullYear() * 100 + (refMonday.getMonth() + 1);

  // semanas (últimas 3) relativas ao weekOffset: [ref, ref-1, ref-2]
  const weekRefs = [0, -4, -8, -12].map((delta) => {
    const d = new Date(refMonday);
    d.setDate(d.getDate() + delta * 7);
    const { monday, friday } = getWeekRangeFromRef(d);
    return {
      idx: delta, 
      monday,
      friday,
      label: `${fmtBRShort(monday)} — ${fmtBRShort(friday)}`,
    };
  });

  // =========================================
  // (A) Metas do mês (empresa + filiais)
  // =========================================
  const sqlCompanyGoals = `
  WITH
    params AS (
      SELECT $2::date AS ref_monday
    ),
    periodo AS (
      SELECT
        date_trunc('month', p.ref_monday)::date AS dt_ini,
        (date_trunc('month', p.ref_monday) + interval '1 month - 1 day')::date AS dt_fim
      FROM params p
    ),

    -- metas do mês por filial
    metas_filial AS (
      SELECT
        m.empresa_id::bigint AS empresa_id,
        COALESCE(SUM(COALESCE(m.meta, 0)), 0)::numeric AS meta
      FROM public.metas m
      WHERE m.empresa_id = ANY($1::bigint[])
        AND m.ano_mes = $3::bigint
      GROUP BY 1
    ),

    -- vendas do mês por filial
    vendas AS (
      SELECT
        o.empresa_id::bigint AS empresa_id,
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
        AND o.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),

    -- devoluções do mês por filial
    dev AS (
      SELECT
        rd.empresa_id::bigint AS empresa_id,
        SUM(COALESCE(ird.quantidade * ird.preco_venda, 0))::numeric AS total_dev_valor
      FROM public.itens_requisicoes_devolucoes ird
      JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
      CROSS JOIN periodo p
      WHERE ird.data_hora_alteracao >= p.dt_ini
        AND ird.data_hora_alteracao < (p.dt_fim + 1)
        AND rd.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),

    realizado AS (
      SELECT
        v.empresa_id,
        COALESCE(
          (
            (COALESCE(v.valor_bruto_total, 0) - COALESCE(d.total_dev_valor, 0) - COALESCE(v.ajuste_desp_estorno, 0))
            - COALESCE(v.despesa_operacional, 0)
            - COALESCE(v.total_frete, 0)
          ),
          0
        )::numeric AS net_sales
      FROM vendas v
      LEFT JOIN dev d ON d.empresa_id = v.empresa_id
    )

  SELECT
    e.empresa_id::bigint AS empresa_id,
    COALESCE(e.nome_resumido, '')::text AS nome_resumido,

    COALESCE(mf.meta, 0)::numeric AS meta,
    COALESCE(r.net_sales, 0)::numeric AS realized,

    CASE
      WHEN COALESCE(mf.meta, 0) > 0
      THEN (COALESCE(r.net_sales, 0) / mf.meta) * 100
      ELSE 0
    END::numeric AS pct
  FROM public.empresas e
  LEFT JOIN metas_filial mf ON mf.empresa_id = e.empresa_id
  LEFT JOIN realizado r ON r.empresa_id = e.empresa_id
  WHERE e.empresa_id = ANY($1::bigint[])
  ORDER BY e.empresa_id;
  `;


  const { rows: companyGoalRows } = await radarPool.query(sqlCompanyGoals, [
    empresaIds,
    new Date(refMonday.getFullYear(), refMonday.getMonth(), refMonday.getDate()),
    BigInt(yearMonth),
  ]);


  const byBranch = companyGoalRows.map((r: any) => ({
    empresa_id: Number(r.empresa_id),
    name: String(r.nome_resumido ?? ""),
    goal: toNumber(r.meta),
    realized: toNumber(r.realized),
    pct: toNumber(r.pct),
  }));
  const totalCompanyGoal = byBranch.reduce((acc, b) => acc + (Number.isFinite(b.goal) ? b.goal : 0), 0);

  // =========================================
  // (B) KPIs de vendido no mês (net_sales total) para % e falta
  //     (mesma lógica do ranking, mas agregada)
  // =========================================

  const sqlMonthSold = `
  WITH
    params AS (
      SELECT
        $1::date AS ref_monday
    ),
    periodo AS (
      SELECT
        date_trunc('month', p.ref_monday)::date AS dt_ini,
        (date_trunc('month', p.ref_monday) + interval '1 month - 1 day')::date AS dt_fim
      FROM params p
    ),
    vendas AS (
      SELECT
        o.vendedor_id::int AS seller_id,
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
        AND o.vendedor_id IS NOT NULL
        AND (o.vendedor_id)::int = ANY($2::int[])
      GROUP BY 1
    ),
    dev AS (
      SELECT
        rd.vendedor_id::int AS seller_id,
        SUM(COALESCE(ird.quantidade * ird.preco_venda, 0))::numeric AS total_dev_valor
      FROM public.itens_requisicoes_devolucoes ird
      JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
      CROSS JOIN periodo p
      WHERE ird.data_hora_alteracao >= p.dt_ini
        AND ird.data_hora_alteracao < (p.dt_fim + 1)
        AND rd.vendedor_id IS NOT NULL
        AND (rd.vendedor_id)::int = ANY($2::int[])
      GROUP BY 1
    )
  SELECT
    COALESCE(SUM(
      (COALESCE(v.valor_bruto_total, 0) - COALESCE(d.total_dev_valor, 0) - COALESCE(v.ajuste_desp_estorno, 0))
      - COALESCE(v.despesa_operacional, 0)
      - COALESCE(v.total_frete, 0)
    ), 0)::numeric AS total_net_sales
  FROM vendas v
  LEFT JOIN dev d ON d.seller_id = v.seller_id;
  `;

  const { rows: monthSoldRows } = await radarPool.query(sqlMonthSold, [
    new Date(refMonday.getFullYear(), refMonday.getMonth(), refMonday.getDate()),
    sellerIds,
  ]);

  const totalMonthSold = toNumber(monthSoldRows?.[0]?.total_net_sales);
  const totalMonthPct = totalCompanyGoal > 0 ? (totalMonthSold / totalCompanyGoal) * 100 : 0;
  const totalMissing = Math.max(totalCompanyGoal - totalMonthSold, 0);

  // =========================================
  // (C) Dados por vendedor:
  //  - nome (funcionarios)
  //  - meta mensal (itens_metas)
  //  - metas semanais últimas 3 semanas (metas_semanal)
  //  - meta semanal acumulada no mês (somando semanas do mês)
  // =========================================
  const sqlSellersGoals = `
WITH
  sellers AS (
    SELECT
      f.funcionario_id::int AS seller_id,
      f.nome AS seller_name
    FROM public.funcionarios f
    WHERE f.funcionario_id IS NOT NULL
      AND f.funcionario_id::int = ANY($1::int[])
      AND upper(coalesce(f.ativo,'S')) NOT IN ('N','NAO','0','F','FALSE')
  ),

  -- mês do ref_monday
  periodo AS (
    SELECT
      date_trunc('month', $2::date)::date AS dt_ini,
      (date_trunc('month', $2::date) + interval '1 month - 1 day')::date AS dt_fim,
      (extract(year from date_trunc('month', $2::date))::int * 100
        + extract(month from date_trunc('month', $2::date))::int) AS ano_mes
  ),

  -- meta mensal por vendedor (somatório do itens_metas)
  metas_mensais AS (
    SELECT
      im.funcionario_id::int AS seller_id,
      COALESCE(SUM(COALESCE(im.meta, 0)), 0)::numeric AS monthly_meta
    FROM public.itens_metas im
    CROSS JOIN periodo p
    WHERE im.ano_mes = p.ano_mes
      AND im.funcionario_id IS NOT NULL
      AND im.funcionario_id::int = ANY($1::int[])
    GROUP BY 1
  ),

  -- três semanas: usamos as datas prontas do server via args (w1,w2,w3)
  weeks AS (
    SELECT 1 AS ord, $3::date AS week_ini, $4::date AS week_fim   -- w0
    UNION ALL
    SELECT 2 AS ord, $5::date AS week_ini, $6::date AS week_fim   -- w4
    UNION ALL
    SELECT 3 AS ord, $7::date AS week_ini, $8::date AS week_fim   -- w8
    UNION ALL
    SELECT 4 AS ord, $9::date AS week_ini, $10::date AS week_fim  -- w12
  ),

  metas_3semanas AS (
    SELECT
      s.seller_id,
      w.ord,
      w.week_ini,
      w.week_fim,
      COALESCE(SUM(COALESCE(ms.valor_meta, 0)), 0)::numeric AS weekly_meta
    FROM sellers s
    CROSS JOIN weeks w
    LEFT JOIN public.metas_semanal ms
      ON ms.vendedor_id::int = s.seller_id
     AND ms.data_inicio <= w.week_ini
     AND ms.data_fim    >= w.week_fim
    GROUP BY 1,2,3,4
  ),

  -- semanas do mês (segunda-feira de cada semana dentro do mês)
  month_weeks AS (
    SELECT
      gs::date AS week_ini,
      (gs::date + 4)::date AS week_fim
    FROM periodo p
    CROSS JOIN LATERAL generate_series(
      date_trunc('week', p.dt_ini)::date,
      date_trunc('week', p.dt_fim)::date,
      interval '7 day'
    ) gs
    -- garante que a "semana" pertence ao mês (pela segunda)
    WHERE date_trunc('month', gs::date) = date_trunc('month', p.dt_ini)
  ),

  meta_semanal_mes AS (
    SELECT
      s.seller_id,
      COALESCE(SUM(COALESCE(ms.valor_meta, 0)), 0)::numeric AS weekly_meta_month_accum
    FROM sellers s
    CROSS JOIN month_weeks mw
    LEFT JOIN public.metas_semanal ms
      ON ms.vendedor_id::int = s.seller_id
     AND ms.data_inicio <= mw.week_ini
     AND ms.data_fim    >= mw.week_fim
    GROUP BY 1
  )

SELECT
  s.seller_id,
  s.seller_name,
  COALESCE(mm.monthly_meta, 0)::numeric AS monthly_meta,
  COALESCE(wm.weekly_meta_month_accum, 0)::numeric AS weekly_meta_month_accum,

  -- pivot das 3 semanas
  COALESCE(MAX(CASE WHEN m3.ord = 1 THEN m3.weekly_meta END), 0)::numeric AS w0_meta,
  COALESCE(MAX(CASE WHEN m3.ord = 2 THEN m3.weekly_meta END), 0)::numeric AS w4_meta,
  COALESCE(MAX(CASE WHEN m3.ord = 3 THEN m3.weekly_meta END), 0)::numeric AS w8_meta,
  COALESCE(MAX(CASE WHEN m3.ord = 4 THEN m3.weekly_meta END), 0)::numeric AS w12_meta

FROM sellers s
LEFT JOIN metas_mensais mm ON mm.seller_id = s.seller_id
LEFT JOIN meta_semanal_mes wm ON wm.seller_id = s.seller_id
LEFT JOIN metas_3semanas m3 ON m3.seller_id = s.seller_id
GROUP BY 1,2,3,4
ORDER BY s.seller_name NULLS LAST;
  `;

  // args das 3 semanas
  const w0 = weekRefs[0];
  const w4 = weekRefs[1];
  const w8 = weekRefs[2];
  const w12 = weekRefs[3];

  const { rows: sellersRowsRaw } = await radarPool.query(sqlSellersGoals, [
    sellerIds,
    new Date(refMonday.getFullYear(), refMonday.getMonth(), refMonday.getDate()),

    new Date(w0.monday.getFullYear(), w0.monday.getMonth(), w0.monday.getDate()),
    new Date(w0.friday.getFullYear(), w0.friday.getMonth(), w0.friday.getDate()),

    new Date(w4.monday.getFullYear(), w4.monday.getMonth(), w4.monday.getDate()),
    new Date(w4.friday.getFullYear(), w4.friday.getMonth(), w4.friday.getDate()),

    new Date(w8.monday.getFullYear(), w8.monday.getMonth(), w8.monday.getDate()),
    new Date(w8.friday.getFullYear(), w8.friday.getMonth(), w8.friday.getDate()),

    new Date(w12.monday.getFullYear(), w12.monday.getMonth(), w12.monday.getDate()),
    new Date(w12.friday.getFullYear(), w12.friday.getMonth(), w12.friday.getDate()),
  ]);


  const sellers: SellerGoalsRow[] = (sellersRowsRaw as any[]).map((r) => {
    const weeklyLast3: WeekMetaItem[] = [
      { label: w4.label,  week_ini: w4.monday.toISOString(),  week_fim: w4.friday.toISOString(),  weekly_meta: toNumber(r.w4_meta) },
      { label: w8.label,  week_ini: w8.monday.toISOString(),  week_fim: w8.friday.toISOString(),  weekly_meta: toNumber(r.w8_meta) },
      { label: w12.label, week_ini: w12.monday.toISOString(), week_fim: w12.friday.toISOString(), weekly_meta: toNumber(r.w12_meta) },
    ];

    return {
      seller_id: Number(r.seller_id),
      seller_name: r.seller_name ?? null,
      monthly_meta: toNumber(r.monthly_meta),
      weekly_meta_month_accum: toNumber(r.weekly_meta_month_accum),
      weekly_last3: weeklyLast3,

      // ✅ input sempre na semana atual da tela
      current_week_start: new Date(w0.monday.getFullYear(), w0.monday.getMonth(), w0.monday.getDate()).toISOString(),
      current_week_end: new Date(w0.friday.getFullYear(), w0.friday.getMonth(), w0.friday.getDate()).toISOString(),
      current_week_meta: toNumber(r.w0_meta),
    };
  });



  const totalWeeklyMetaMonth = sellers.reduce(
    (acc, s) => acc + (Number.isFinite(s.weekly_meta_month_accum) ? s.weekly_meta_month_accum : 0),
    0
  );

  const header: GoalsHeaderData = {
    weekOffset,
    weekLabel,
    monthLabel,
    totalCompanyGoal,
    byBranch,
    totalWeeklyMetaMonth,
    totalMonthSold,
    totalMonthPct,
    totalMissing,
  };

  return <GoalsDashboardClient header={header} sellers={sellers} />;
}
