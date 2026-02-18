const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function debugWeulerDaily() {
    try {
        const id = 163; // Weuler Lima
        const start = '2026-02-09';
        const end = '2026-02-15';

        const res = await radarPool.query(`
        SELECT 
            data_recebimento::date as data,
            SUM(valor_pedido) as bruto
        FROM public.orcamentos
        WHERE vendedor_id = $1 
          AND data_recebimento BETWEEN $2::timestamp AND $3::timestamp
          AND pedido_fechado = 'S' 
          AND COALESCE(cancelado, 'N') = 'N'
        GROUP BY 1
        ORDER BY 1
    `, [id, start, end]);

        console.log("Weuler Daily Bruto:");
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

debugWeulerDaily();
