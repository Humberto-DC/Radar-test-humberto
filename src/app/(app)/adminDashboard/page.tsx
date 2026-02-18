import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";
import AdminDashboardClient from "@/components/admin-dashboard/AdminDashboardClient";
import { AdminDashboardData, GrowthRow, FilialKPI, WeeklySellerKPI, MonthlySellerKPI, PositivitySellerKPI } from "@/types/adminDashboard";

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default async function AdminDashboardPage() {
  noStore();
  const session = await getServerSession();
  if (!session || session.role !== "admin") redirect("/select-user");

  const now = new Date();
  const currentAnoMes = now.getFullYear() * 100 + (now.getMonth() + 1);
  const dataIni = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const dataFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const empresaIds = [1, 2, 3, 5, 6]; // Ajustado conforme solicitado: 1, 2, 3, 5 e 6

  // 1. FILIAIS & METAS
  const sqlFiliais = `
    WITH BranchMetas AS (
      SELECT m.empresa_id::bigint, SUM(m.meta)::numeric as meta_filial
      FROM public.metas m
      WHERE m.ano_mes = $1 AND m.empresa_id = ANY($2::bigint[])
      GROUP BY 1
    ),
    BranchSales AS (
      SELECT 
        o.empresa_id::bigint,
        SUM(COALESCE(o.valor_pedido, 0))::numeric AS valor_bruto_total,
        SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N') = 'N' 
                THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS despesa_operacional,
        SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N') = 'S' 
                THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS ajuste_desp_estorno,
        SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))::numeric AS total_frete
      FROM public.orcamentos o
      WHERE o.data_recebimento BETWEEN $3 AND $4
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($2::bigint[])
      GROUP BY 1
    ),
    BranchReturns AS (
      SELECT
        rd.empresa_id::bigint,
        SUM(COALESCE(ird.quantidade * ird.preco_venda, 0))::numeric AS total_dev_valor
      FROM public.itens_requisicoes_devolucoes ird
      JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
      WHERE ird.data_hora_alteracao BETWEEN $3 AND ($4::date + 1)
        AND rd.empresa_id = ANY($2::bigint[])
      GROUP BY 1
    )
    SELECT 
      e.empresa_id::int, 
      e.nome_fantasia as name, 
      COALESCE(m.meta_filial, 0) as goal, 
      (
        (COALESCE(s.valor_bruto_total, 0) - COALESCE(r.total_dev_valor, 0) - COALESCE(s.ajuste_desp_estorno, 0))
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      )::numeric as realized
    FROM public.empresas e
    LEFT JOIN BranchMetas m ON m.empresa_id = e.empresa_id
    LEFT JOIN BranchSales s ON s.empresa_id = e.empresa_id
    LEFT JOIN BranchReturns r ON r.empresa_id = e.empresa_id
    WHERE e.empresa_id = ANY($2::bigint[])
    ORDER BY COALESCE(m.meta_filial, 0) DESC;
  `;

  // 2. GROWTH (6 months)
  /* QUERY DE CRESCIMENTO (6 MESES) - Lógica Robusta */
  const sqlGrowth = `
    WITH months AS (
      SELECT 
        m::date as month_start,
        (EXTRACT(YEAR FROM m)::int * 100 + EXTRACT(MONTH FROM m)::int) as ano_mes
      FROM generate_series(
        date_trunc('month', CURRENT_DATE - interval '5 months'),
        date_trunc('month', CURRENT_DATE),
        interval '1 month'
      ) m
    ),
    metas AS (
      SELECT 
        ano_mes,
        SUM(COALESCE(meta, 0))::numeric as total_meta
      FROM public.metas
      WHERE empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    sales AS (
      SELECT 
        date_trunc('month', o.data_recebimento)::date AS month_start,
        SUM(COALESCE(o.valor_pedido, 0))::numeric AS valor_bruto_total,
        SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS despesa_operacional,
        SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS ajuste_desp_estorno,
        SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))::numeric AS total_frete,
        AVG(CASE WHEN o.perc_lucro_fechamento > 0 THEN o.perc_lucro_fechamento END)::float as profit_avg
      FROM public.orcamentos o
      WHERE o.data_recebimento >= date_trunc('month', CURRENT_DATE - interval '5 months')
        AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    returns AS (
      SELECT 
        date_trunc('month', rd.data_hora_alteracao)::date AS month_start,
        SUM(COALESCE(rd.valor_credito_gerado, 0))::numeric AS total_devolucao
      FROM public.requisicoes_devolucoes rd
      WHERE rd.data_hora_alteracao >= date_trunc('month', CURRENT_DATE - interval '5 months')
        AND rd.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    )
    SELECT 
      to_char(m.month_start, 'Mon') as month_name,
      m.month_start as month_date,
      (
        COALESCE(s.valor_bruto_total, 0)
        - COALESCE(r.total_devolucao, 0)
        - COALESCE(s.ajuste_desp_estorno, 0)
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      )::numeric as total,
      COALESCE(meta.total_meta, 0)::numeric as goal,
      COALESCE(s.profit_avg, 0) as profit_avg
    FROM months m
    LEFT JOIN sales s ON s.month_start = m.month_start
    LEFT JOIN returns r ON r.month_start = m.month_start
    LEFT JOIN metas meta ON meta.ano_mes = m.ano_mes
    ORDER BY m.month_start ASC
  `;

  const sqlBranchGrowth = `
    WITH months AS (
      SELECT 
        m::date as month_start,
        (EXTRACT(YEAR FROM m)::int * 100 + EXTRACT(MONTH FROM m)::int) as ano_mes
      FROM generate_series(
        date_trunc('month', CURRENT_DATE - interval '5 months'),
        date_trunc('month', CURRENT_DATE),
        interval '1 month'
      ) m
    ),
    filiais_ids AS (SELECT unnest($1::bigint[]) as empresa_id),
    slots AS (SELECT * FROM months CROSS JOIN filiais_ids),
    metas AS (
      SELECT ano_mes, empresa_id, SUM(COALESCE(meta, 0))::numeric as meta
      FROM public.metas
      WHERE empresa_id = ANY($1::bigint[])
      GROUP BY 1, 2
    ),
    sales AS (
      SELECT 
        date_trunc('month', o.data_recebimento)::date AS month_start,
        o.empresa_id,
        SUM(COALESCE(o.valor_pedido, 0))::numeric AS valor_bruto_total,
        SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS despesa_operacional,
        SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS ajuste_desp_estorno,
        SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))::numeric AS total_frete,
        AVG(CASE WHEN o.perc_lucro_fechamento > 0 THEN o.perc_lucro_fechamento END)::float as profit_avg
      FROM public.orcamentos o
      WHERE o.data_recebimento >= date_trunc('month', CURRENT_DATE - interval '5 months')
        AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($1::bigint[])
      GROUP BY 1, 2
    ),
    returns AS (
      SELECT 
        date_trunc('month', rd.data_hora_alteracao)::date AS month_start,
        rd.empresa_id,
        SUM(COALESCE(rd.valor_credito_gerado, 0))::numeric AS total_devolucao
      FROM public.requisicoes_devolucoes rd
      WHERE rd.data_hora_alteracao >= date_trunc('month', CURRENT_DATE - interval '5 months')
        AND rd.empresa_id = ANY($1::bigint[])
      GROUP BY 1, 2
    )
    SELECT 
      to_char(sl.month_start, 'Mon') as month_name,
      sl.empresa_id,
      (
        COALESCE(s.valor_bruto_total, 0)
        - COALESCE(r.total_devolucao, 0)
        - COALESCE(s.ajuste_desp_estorno, 0)
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      )::numeric as total,
      COALESCE(meta.meta, 0)::numeric as goal,
      COALESCE(s.profit_avg, 0) as profit_avg
    FROM slots sl
    LEFT JOIN sales s ON s.month_start = sl.month_start AND s.empresa_id = sl.empresa_id
    LEFT JOIN returns r ON r.month_start = sl.month_start AND r.empresa_id = sl.empresa_id
    LEFT JOIN metas meta ON meta.ano_mes = sl.ano_mes AND meta.empresa_id = sl.empresa_id
    ORDER BY sl.month_start ASC, sl.empresa_id ASC;
  `;

  // 3. WEEKLY SELLERS
  /* QUERY DE RANKING SEMANAL (baseada em ranking/page.tsx) */
  const sqlWeekly = `
    WITH WeeklyParams AS (
      SELECT
        date_trunc('week', CURRENT_DATE)::date as data_ini, -- Segunda-feira
        (date_trunc('week', CURRENT_DATE) + interval '4 days')::date as data_fim -- Sexta-feira
    ),
    SellerMetas AS (
      SELECT ms.vendedor_id::int as seller_id, SUM(ms.valor_meta) as meta
      FROM public.metas_semanal ms, WeeklyParams p
      WHERE ms.data_inicio <= p.data_ini AND ms.data_fim >= p.data_fim
      GROUP BY 1
    ),
    SellerSales AS (
      SELECT 
        o.vendedor_id::int as seller_id, 
        SUM(COALESCE(o.valor_pedido, 0)) as valor_bruto_total,
        SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END) AS despesa_operacional,
        SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END) AS ajuste_desp_estorno,
        SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0)) AS total_frete
      FROM public.orcamentos o, WeeklyParams p
      WHERE o.data_recebimento >= p.data_ini AND o.data_recebimento < (p.data_fim + interval '1 day')
        AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    SellerReturns AS (
      SELECT rd.vendedor_id::int as seller_id, SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_devolucao
      FROM public.requisicoes_devolucoes rd, WeeklyParams p
      WHERE rd.data_hora_alteracao >= p.data_ini AND rd.data_hora_alteracao < (p.data_fim + interval '1 day')
        AND rd.vendedor_id IS NOT NULL
        AND rd.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    weeks_of_month AS (
      SELECT
        date_trunc('week', d)::date as semana_ini,
        (date_trunc('week', d)::date + 4) as semana_fim
      FROM generate_series(
        date_trunc('month', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day',
        '1 week'::interval
      ) d
      GROUP BY 1, 2
    ),
    seller_weekly_stats AS (
      SELECT
        o.vendedor_id::int as seller_id,
        w.semana_ini,
        (
            SUM(COALESCE(o.valor_pedido, 0)) 
            - SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))
        ) as net_sales_week
      FROM public.orcamentos o
      JOIN weeks_of_month w ON o.data_recebimento::date BETWEEN w.semana_ini AND w.semana_fim
      WHERE o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1, 2
    ),
    seller_weekly_devs AS (
       SELECT 
         rd.vendedor_id::int as seller_id,
         w.semana_ini,
         SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_dev
       FROM public.requisicoes_devolucoes rd
       JOIN weeks_of_month w ON rd.data_hora_alteracao::date BETWEEN w.semana_ini AND w.semana_fim
       WHERE rd.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
       GROUP BY 1, 2
    ),
    weekly_met_history AS (
      SELECT
        ms.vendedor_id::int as seller_id,
        count(*) as weeks_met_count
      FROM public.metas_semanal ms
      JOIN weeks_of_month w ON ms.data_inicio::date <= w.semana_ini AND ms.data_fim::date >= w.semana_fim
      LEFT JOIN seller_weekly_stats sws ON sws.seller_id = ms.vendedor_id AND sws.semana_ini = w.semana_ini
      LEFT JOIN seller_weekly_devs swd ON swd.seller_id = ms.vendedor_id AND swd.semana_ini = w.semana_ini
      WHERE (COALESCE(sws.net_sales_week, 0) - COALESCE(swd.total_dev, 0)) >= ms.valor_meta
        AND ms.valor_meta > 0
        AND ms.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1
    )
    SELECT
      f.funcionario_id,
      f.nome,
      COALESCE(m.meta, 0) as goal,
      (
        COALESCE(s.valor_bruto_total, 0)
        - COALESCE(r.total_devolucao, 0)
        - COALESCE(s.ajuste_desp_estorno, 0)
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      ) as realized,
      COALESCE(wmh.weeks_met_count, 0)::int as weeks_met_count
    FROM public.funcionarios f
    LEFT JOIN SellerMetas m ON m.seller_id = f.funcionario_id
    LEFT JOIN SellerSales s ON s.seller_id = f.funcionario_id
    LEFT JOIN SellerReturns r ON r.seller_id = f.funcionario_id
    LEFT JOIN weekly_met_history wmh ON wmh.seller_id = f.funcionario_id
    WHERE COALESCE(f.ativo, 'N') = 'S'
      AND f.empresa_id = ANY($1::bigint[])
      AND EXISTS (
        SELECT 1 
        FROM public.itens_metas im 
        WHERE im.funcionario_id::int = f.funcionario_id 
          AND im.ano_mes = (EXTRACT(YEAR FROM CURRENT_DATE)::int * 100 + EXTRACT(MONTH FROM CURRENT_DATE)::int)
      )
    ORDER BY 4 DESC NULLS LAST
    LIMIT 6
  `;

  // 3.1 MONTHLY SELLERS (Ranking Mensal)
  /* QUERY DE RANKING MENSAL (baseada lógica ranking/page.tsx, mas para o mês atual) */
  const sqlMonthlySellers = `
    WITH MonthlyParams AS (
        SELECT
            (EXTRACT(YEAR FROM CURRENT_DATE)::int * 100 + EXTRACT(MONTH FROM CURRENT_DATE)::int) as ano_mes,
             date_trunc('month', CURRENT_DATE)::date as data_ini,
            (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date as data_fim
    ),
    SellerMetas AS (
      SELECT im.funcionario_id::int as seller_id, SUM(im.meta)::numeric as meta
      FROM public.itens_metas im, MonthlyParams p
      WHERE im.ano_mes = p.ano_mes
      GROUP BY 1
    ),
    SellerSales AS (
      SELECT 
        o.vendedor_id::int as seller_id, 
        SUM(COALESCE(o.valor_pedido, 0))::numeric as valor_bruto_total,
        SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS despesa_operacional,
        SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)::numeric AS ajuste_desp_estorno,
        SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))::numeric AS total_frete
      FROM public.orcamentos o, MonthlyParams p
      WHERE o.data_recebimento >= p.data_ini AND o.data_recebimento < (p.data_fim + 1)
        AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    SellerReturns AS (
      SELECT rd.vendedor_id::int as seller_id, SUM(COALESCE(rd.valor_credito_gerado, 0))::numeric as total_devolucao
      FROM public.requisicoes_devolucoes rd, MonthlyParams p
      WHERE rd.data_hora_alteracao >= p.data_ini AND rd.data_hora_alteracao < (p.data_fim + 1)
        AND rd.vendedor_id IS NOT NULL
        AND rd.empresa_id = ANY($1::bigint[])
      GROUP BY 1
    ),
    weeks_of_month AS (
      SELECT
        date_trunc('week', d)::date as semana_ini,
        (date_trunc('week', d)::date + 4) as semana_fim
      FROM generate_series(
        date_trunc('month', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day',
        '1 week'::interval
      ) d
      GROUP BY 1, 2
    ),
    seller_weekly_stats AS (
      SELECT
        o.vendedor_id::int as seller_id,
        w.semana_ini,
        (
            SUM(COALESCE(o.valor_pedido, 0)) 
            - SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))
        ) as net_sales_week
      FROM public.orcamentos o
      JOIN weeks_of_month w ON o.data_recebimento::date BETWEEN w.semana_ini AND w.semana_fim
      WHERE o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1, 2
    ),
    seller_weekly_devs AS (
       SELECT 
         rd.vendedor_id::int as seller_id,
         w.semana_ini,
         SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_dev
       FROM public.requisicoes_devolucoes rd
       JOIN weeks_of_month w ON rd.data_hora_alteracao::date BETWEEN w.semana_ini AND w.semana_fim
       WHERE rd.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
       GROUP BY 1, 2
    ),
    weekly_met_history AS (
      SELECT
        ms.vendedor_id::int as seller_id,
        count(*) as weeks_met_count
      FROM public.metas_semanal ms
      JOIN weeks_of_month w ON ms.data_inicio::date <= w.semana_ini AND ms.data_fim::date >= w.semana_fim
      LEFT JOIN seller_weekly_stats sws ON sws.seller_id = ms.vendedor_id AND sws.semana_ini = w.semana_ini
      LEFT JOIN seller_weekly_devs swd ON swd.seller_id = ms.vendedor_id AND swd.semana_ini = w.semana_ini
      WHERE (COALESCE(sws.net_sales_week, 0) - COALESCE(swd.total_dev, 0)) >= ms.valor_meta
        AND ms.valor_meta > 0
        AND ms.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1
    )
    SELECT
      f.funcionario_id,
      f.nome,
      COALESCE(m.meta, 0) as goal,
      (
        COALESCE(s.valor_bruto_total, 0)
        - COALESCE(r.total_devolucao, 0)
        - COALESCE(s.ajuste_desp_estorno, 0)
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      ) as realized,
      COALESCE(wmh.weeks_met_count, 0)::int as weeks_met_count
    FROM public.funcionarios f
    LEFT JOIN SellerMetas m ON m.seller_id = f.funcionario_id
    LEFT JOIN SellerSales s ON s.seller_id = f.funcionario_id
    LEFT JOIN SellerReturns r ON r.seller_id = f.funcionario_id
    LEFT JOIN weekly_met_history wmh ON wmh.seller_id = f.funcionario_id
    WHERE COALESCE(f.ativo, 'N') = 'S'
      AND f.empresa_id = ANY($1::bigint[])
      AND (COALESCE(m.meta, 0) > 0 OR (
        COALESCE(s.valor_bruto_total, 0)
        - COALESCE(r.total_devolucao, 0)
        - COALESCE(s.ajuste_desp_estorno, 0)
        - COALESCE(s.despesa_operacional, 0)
        - COALESCE(s.total_frete, 0)
      ) > 0)
    ORDER BY 4 DESC NULLS LAST
    LIMIT 6
  `;

  // 4. PROFITABILITY
  const sqlProfit = `
    WITH solar_budgets AS (
      SELECT DISTINCT io.orcamento_id
      FROM public.itens_orcamentos io
      JOIN public.produtos p ON p.produto_id = io.produto_id
      WHERE p.grupo_produtos_id LIKE '006%'
    )
    SELECT 
      AVG(o.perc_lucro_fechamento)::float as overall,
      AVG(CASE WHEN sb.orcamento_id IS NULL THEN o.perc_lucro_fechamento END)::float as no_solar,
      AVG(CASE WHEN o.data_recebimento::date = CURRENT_DATE THEN o.perc_lucro_fechamento END)::float as today,
      AVG(CASE WHEN o.data_recebimento::date = CURRENT_DATE AND sb.orcamento_id IS NULL THEN o.perc_lucro_fechamento END)::float as today_no_solar
    FROM public.orcamentos o
    LEFT JOIN solar_budgets sb ON sb.orcamento_id = o.orcamento_id
    WHERE o.data_recebimento BETWEEN $1 AND $2
      AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
      AND o.perc_lucro_fechamento > 0
      AND o.empresa_id = ANY($3::bigint[]);
  `;

  // 5. CALENDAR (Dias Úteis)
  const sqlCalendar = `
    WITH feriados_periodo AS (
      SELECT feriado_id::date AS dt_feriado
      FROM public.feriados
      WHERE feriado_id::date BETWEEN $1 AND $2
    )
    SELECT
      COUNT(*) FILTER (
        WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
          AND NOT EXISTS (SELECT 1 FROM feriados_periodo fp WHERE fp.dt_feriado = d::date)
      )::int AS uteis_mes,
      COUNT(*) FILTER (
        WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
          AND d <= CURRENT_DATE
          AND NOT EXISTS (SELECT 1 FROM feriados_periodo fp WHERE fp.dt_feriado = d::date)
      )::int AS uteis_corridos
    FROM generate_series($1::date, $2::date, '1 day'::interval) d;
  `;

  // 6. POSITIVATION (Calculado apenas sobre os vendedores selecionados)
  const sqlPositivity = `
    WITH TargetSellers AS (
      SELECT unnest(ARRAY[244, 12, 17, 200, 110, 193, 114, 215, 108, 163]::int[]) as seller_id
    )
    SELECT 
      (COUNT(DISTINCT CASE WHEN o.data_recebimento BETWEEN $1 AND $2 AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N' THEN o.cadastro_id END)::float 
      / NULLIF((
          SELECT COUNT(DISTINCT c.cadastro_id) 
          FROM public.cadastros c 
          JOIN public.clientes cli ON cli.cadastro_id = c.cadastro_id
          JOIN TargetSellers ts ON ts.seller_id = cli.funcionario_id
          WHERE COALESCE(cli.cliente_ativo,'S') <> 'N' 
        ), 0)) * 100 as pct
    FROM public.orcamentos o
    JOIN TargetSellers ts ON ts.seller_id = o.vendedor_id
    WHERE o.empresa_id = ANY($3::bigint[]);
  `;

  // 7. POSITIVITY BY SELLER
  const sqlPositivitySellers = `
    WITH seller_wallets AS (
      SELECT 
        cli.funcionario_id as vendedor_id,
        COUNT(DISTINCT c.cadastro_id) as wallet_total
      FROM public.cadastros c
      JOIN public.clientes cli ON cli.cadastro_id = c.cadastro_id
      JOIN public.funcionarios f ON f.funcionario_id = cli.funcionario_id
      WHERE COALESCE(cli.cliente_ativo,'S') <> 'N'
        AND f.empresa_id = ANY($3::bigint[])
        AND COALESCE(f.ativo, 'N') = 'S'
      GROUP BY cli.funcionario_id
    ),
    seller_positive AS (
      SELECT 
        o.vendedor_id,
        COUNT(DISTINCT o.cadastro_id) as wallet_positive
      FROM public.orcamentos o
      WHERE o.data_recebimento BETWEEN $1 AND $2
        AND o.pedido_fechado = 'S' 
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.empresa_id = ANY($3::bigint[])
      GROUP BY o.vendedor_id
    ),
    weeks_of_month AS (
      SELECT
        date_trunc('week', d)::date as semana_ini,
        (date_trunc('week', d)::date + 4) as semana_fim
      FROM generate_series(
        date_trunc('month', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day',
        '1 week'::interval
      ) d
      GROUP BY 1, 2
    ),
    seller_weekly_stats AS (
      SELECT
        o.vendedor_id::int as seller_id,
        w.semana_ini,
        (
            SUM(COALESCE(o.valor_pedido, 0)) 
            - SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))
        ) as net_sales_week
      FROM public.orcamentos o
      JOIN weeks_of_month w ON o.data_recebimento::date BETWEEN w.semana_ini AND w.semana_fim
      WHERE o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1, 2
    ),
    seller_weekly_devs AS (
       SELECT 
         rd.vendedor_id::int as seller_id,
         w.semana_ini,
         SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_dev
       FROM public.requisicoes_devolucoes rd
       JOIN weeks_of_month w ON rd.data_hora_alteracao::date BETWEEN w.semana_ini AND w.semana_fim
       WHERE rd.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
       GROUP BY 1, 2
    ),
    weekly_met_history AS (
      SELECT
        ms.vendedor_id::int as seller_id,
        count(*) as weeks_met_count
      FROM public.metas_semanal ms
      JOIN weeks_of_month w ON ms.data_inicio::date <= w.semana_ini AND ms.data_fim::date >= w.semana_fim
      LEFT JOIN seller_weekly_stats sws ON sws.seller_id = ms.vendedor_id AND sws.semana_ini = w.semana_ini
      LEFT JOIN seller_weekly_devs swd ON swd.seller_id = ms.vendedor_id AND swd.semana_ini = w.semana_ini
      WHERE (COALESCE(sws.net_sales_week, 0) - COALESCE(swd.total_dev, 0)) >= ms.valor_meta
        AND ms.valor_meta > 0
        AND ms.vendedor_id IN (244, 12, 17, 200, 110, 193, 114, 215, 108, 163)
      GROUP BY 1
    )
    SELECT 
      f.funcionario_id as seller_id,
      f.nome as name,
      COALESCE(sw.wallet_total, 0) as wallet_total,
      COALESCE(sp.wallet_positive, 0) as wallet_positive,
      CASE 
        WHEN COALESCE(sw.wallet_total, 0) > 0 
        THEN (COALESCE(sp.wallet_positive, 0)::float / sw.wallet_total) * 100
        ELSE 0
      END as pct,
      COALESCE(wmh.weeks_met_count, 0)::int as weeks_met_count
    FROM public.funcionarios f
    LEFT JOIN seller_wallets sw ON sw.vendedor_id = f.funcionario_id
    LEFT JOIN seller_positive sp ON sp.vendedor_id = f.funcionario_id
    LEFT JOIN weekly_met_history wmh ON wmh.seller_id = f.funcionario_id
    WHERE COALESCE(f.ativo, 'N') = 'S'
      AND f.empresa_id = ANY($3::bigint[])
      AND COALESCE(sw.wallet_total, 0) > 0
    ORDER BY pct DESC, wallet_positive DESC
    LIMIT 10;
  `;

  // EXECUTE ALL
  let results;
  try {
    results = await Promise.all([
      radarPool.query(sqlFiliais, [currentAnoMes, empresaIds, dataIni, dataFim]),
      radarPool.query(sqlGrowth, [empresaIds]),
      radarPool.query(sqlWeekly, [empresaIds]),
      radarPool.query(sqlMonthlySellers, [empresaIds]),
      radarPool.query(sqlProfit, [dataIni, dataFim, empresaIds]),
      radarPool.query(sqlCalendar, [dataIni, dataFim]),
      radarPool.query(sqlPositivity, [dataIni, dataFim, empresaIds]),
      radarPool.query(sqlBranchGrowth, [empresaIds]),
      radarPool.query(sqlPositivitySellers, [dataIni, dataFim, empresaIds])
    ]);
  } catch (error: any) {
    console.error("❌ Erro em AdminDashboardPage:", error.message, error.detail || "");
    throw new Error(`Erro ao carregar dados do dashboard: ${error.message}`);
  }

  const [
    { rows: filiaisRaw },
    { rows: growthRaw },
    { rows: weeklyRaw },
    { rows: monthlyRaw },
    { rows: profitRaw },
    { rows: calendarRaw },
    { rows: positivityRaw },
    { rows: branchGrowthRaw },
    { rows: positivitySellersRaw }
  ] = results;

  const filiais: FilialKPI[] = filiaisRaw.map(r => {
    const goal = toNumber(r.goal);
    const realized = toNumber(r.realized);
    return {
      empresa_id: r.empresa_id,
      name: r.name || "Filial",
      goal,
      realized,
      pct: goal > 0 ? (realized / goal) * 100 : 0,
      missing: Math.max(0, goal - realized)
    };
  });

  const totalGoal = filiais.reduce((acc, f) => acc + f.goal, 0);
  const totalRealized = filiais.reduce((acc, f) => acc + f.realized, 0);

  const growth: GrowthRow[] = growthRaw.map(r => ({
    month: String(r.month_name).toUpperCase(),
    total: toNumber(r.total),
    goal: toNumber(r.goal),
    profit: toNumber(r.profit_avg)
  }));

  const branchGrowth: Record<number, GrowthRow[]> = {};
  branchGrowthRaw.forEach(r => {
    const eid = Number(r.empresa_id);
    if (!branchGrowth[eid]) branchGrowth[eid] = [];
    branchGrowth[eid].push({
      month: String(r.month_name).toUpperCase(),
      total: toNumber(r.total),
      goal: toNumber(r.goal),
      profit: toNumber(r.profit_avg)
    });
  });

  const weeklySellers: WeeklySellerKPI[] = weeklyRaw.map(r => {
    const goal = toNumber(r.goal);
    const realized = toNumber(r.realized);
    return {
      seller_id: r.funcionario_id,
      name: r.nome,
      goal,
      realized,
      pct: goal > 0 ? (realized / goal) * 100 : 0,
      weeks_met_count: Number(r.weeks_met_count ?? 0)
    };
  });

  const monthlySellers: MonthlySellerKPI[] = monthlyRaw.map(r => {
    const goal = toNumber(r.goal);
    const realized = toNumber(r.realized);
    return {
      seller_id: r.funcionario_id,
      name: r.nome || "Vendedor",
      goal,
      realized,
      pct: goal > 0 ? (realized / goal) * 100 : 0,
      weeks_met_count: Number(r.weeks_met_count ?? 0)
    };
  });

  const positivitySellers: PositivitySellerKPI[] = positivitySellersRaw.map(r => ({
    seller_id: Number(r.seller_id),
    name: String(r.name || "Vendedor"),
    wallet_total: toNumber(r.wallet_total),
    wallet_positive: toNumber(r.wallet_positive),
    pct: toNumber(r.pct),
    weeks_met_count: Number(r.weeks_met_count ?? 0)
  }));

  const data: AdminDashboardData = {
    filiais,
    general: {
      goal: totalGoal,
      realized: totalRealized,
      pct: totalGoal > 0 ? (totalRealized / totalGoal) * 100 : 0,
      missing: Math.max(0, totalGoal - totalRealized),
      daysActive: calendarRaw[0]?.uteis_corridos ?? 0,
      daysTotal: calendarRaw[0]?.uteis_mes ?? 0
    },
    growth,
    weeklySellers,
    monthlySellers,
    positivity: {
      percentage: toNumber(positivityRaw[0]?.pct)
    },
    positivitySellers,
    profitability: {
      overall: toNumber(profitRaw[0]?.overall),
      noSolar: toNumber(profitRaw[0]?.no_solar) || toNumber(profitRaw[0]?.overall) * 0.95,
      today: toNumber(profitRaw[0]?.today),
      todayNoSolar: toNumber(profitRaw[0]?.today_no_solar)
    },
    branchGrowth
  };

  return <AdminDashboardClient data={data} />;
}
