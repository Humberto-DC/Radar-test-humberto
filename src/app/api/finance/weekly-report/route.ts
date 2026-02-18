// src/app/api/finance/weekly-report/route.ts
import { NextResponse } from "next/server";
import { radarPool } from "@/lib/Db";
import { getServerSession } from "@/lib/serverSession";

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM
        if (!month) {
            return NextResponse.json({ ok: false, error: "Month is required" }, { status: 400 });
        }

        const [year, monthNum] = month.split("-").map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);

        const empresaIds = [1, 2, 3, 5, 6];
        const sellerIds = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];

        // Query para pegar todas as semanas que começam no mês selecionado
        const sql = `
      WITH weeks_of_month AS (
        SELECT
          date_trunc('week', d)::date as semana_ini,
          (date_trunc('week', d)::date + 4)::date as semana_fim
        FROM generate_series(
          date_trunc('month', $1::date),
          date_trunc('month', $1::date) + interval '1 month - 1 day',
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
          AND o.vendedor_id = ANY($2::int[])
          AND o.empresa_id = ANY($3::bigint[])
        GROUP BY 1, 2
      ),
      seller_weekly_devs AS (
         SELECT 
           rd.vendedor_id::int as seller_id,
           w.semana_ini,
           SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_dev
         FROM public.requisicoes_devolucoes rd
         JOIN weeks_of_month w ON rd.data_hora_alteracao::date BETWEEN w.semana_ini AND w.semana_fim
         WHERE rd.vendedor_id = ANY($2::int[])
           AND rd.empresa_id = ANY($3::bigint[])
         GROUP BY 1, 2
      ),
      seller_performance AS (
        SELECT
          f.funcionario_id as seller_id,
          f.nome as seller_name,
          w.semana_ini,
          w.semana_fim,
          COALESCE(ms.valor_meta, 0) as meta,
          (COALESCE(sws.net_sales_week, 0) - COALESCE(swd.total_dev, 0)) as realized
        FROM public.funcionarios f
        CROSS JOIN weeks_of_month w
        LEFT JOIN public.metas_semanal ms ON ms.vendedor_id = f.funcionario_id 
          AND ms.data_inicio <= w.semana_ini AND ms.data_fim >= w.semana_fim
        LEFT JOIN seller_weekly_stats sws ON sws.seller_id = f.funcionario_id AND sws.semana_ini = w.semana_ini
        LEFT JOIN seller_weekly_devs swd ON swd.seller_id = f.funcionario_id AND swd.semana_ini = w.semana_ini
        WHERE f.funcionario_id = ANY($2::int[])
      )
      SELECT * FROM seller_performance
      ORDER BY seller_name, semana_ini;
    `;

        const { rows } = await radarPool.query(sql, [startDate, sellerIds, empresaIds]);

        // Agrupar por vendedor
        const report: any[] = [];
        const sellersMap = new Map();

        rows.forEach((row: any) => {
            if (!sellersMap.has(row.seller_id)) {
                sellersMap.set(row.seller_id, {
                    seller_id: row.seller_id,
                    seller_name: row.seller_name,
                    weeks: [],
                });
                report.push(sellersMap.get(row.seller_id));
            }

            const sellerData = sellersMap.get(row.seller_id);
            const isMet = row.meta > 0 && row.realized >= row.meta;

            // Cálculo da premiação: 0,05% do realizado se bateu a meta
            const rewardValue = isMet ? Number(row.realized) * 0.0005 : 0;

            sellerData.weeks.push({
                week_start: row.semana_ini,
                week_end: row.semana_fim,
                meta: Number(row.meta),
                realized: Number(row.realized),
                is_met: isMet,
                reward: rewardValue,
            });
        });

        return NextResponse.json({ ok: true, data: report });

    } catch (error: any) {
        console.error("Finance Weekly Report API Error:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
