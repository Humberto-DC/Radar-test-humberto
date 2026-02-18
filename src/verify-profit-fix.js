const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function verifyProfit() {
    try {
        const start = '2026-02-01';
        const end = '2026-02-28';

        const res = await radarPool.query(`
      SELECT 
        AVG(perc_lucro_fechamento)::float as overall,
        AVG(CASE WHEN NOT EXISTS (
          SELECT 1 FROM public.itens_orcamentos io
          JOIN public.produtos p ON p.produto_id = io.produto_id
          WHERE io.orcamento_id = public.orcamentos.orcamento_id
            AND p.grupo_produtos_id LIKE '006%'
        ) THEN perc_lucro_fechamento END)::float as no_solar
      FROM public.orcamentos
      WHERE data_recebimento BETWEEN $1 AND $2
        AND pedido_fechado = 'S' AND COALESCE(cancelado, 'N') = 'N'
        AND perc_lucro_fechamento > 0
    `, [start, end]);

        console.log("Profit Results:", JSON.stringify(res.rows[0], null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

verifyProfit();
