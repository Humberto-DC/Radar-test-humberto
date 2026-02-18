const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function verifyWeuler() {
    try {
        const id = 163; // Weuler Lima
        const start = '2026-02-09';
        const end = '2026-02-13'; // Friday

        // Simulating the exact logic from the dashboard
        const res = await radarPool.query(`
        WITH WeeklyParams AS (
          SELECT
            $2::date as data_ini,
            $3::date as data_fim
        ),
        SellerSales AS (
          SELECT 
            o.vendedor_id::int as seller_id, 
            SUM(COALESCE(o.valor_pedido, 0)) as valor_bruto_total,
            SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END) AS despesa_operacional,
            SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END) AS ajuste_desp_estorno,
            SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0)) AS total_frete
          FROM public.orcamentos o, WeeklyParams p
          WHERE o.vendedor_id = $1
            AND o.data_recebimento >= p.data_ini AND o.data_recebimento < (p.data_fim + interval '1 day')
            AND o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
          GROUP BY 1
        ),
        SellerReturns AS (
          SELECT rd.vendedor_id::int as seller_id, SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_devolucao
          FROM public.requisicoes_devolucoes rd, WeeklyParams p
          WHERE rd.vendedor_id = $1
            AND rd.data_hora_alteracao >= p.data_ini AND rd.data_hora_alteracao < (p.data_fim + interval '1 day')
            AND rd.vendedor_id IS NOT NULL
          GROUP BY 1
        )
        SELECT
          (
            COALESCE(s.valor_bruto_total, 0)
            - COALESCE(r.total_devolucao, 0)
            - COALESCE(s.ajuste_desp_estorno, 0)
            - COALESCE(s.despesa_operacional, 0)
            - COALESCE(s.total_frete, 0)
          ) as realized
        FROM (SELECT $1 as seller_id) b
        LEFT JOIN SellerSales s ON s.seller_id = b.seller_id
        LEFT JOIN SellerReturns r ON r.seller_id = b.seller_id
    `, [id, start, end]);

        console.log("Calculated Realized for Weuler (09-13):", res.rows[0].realized);

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

verifyWeuler();
