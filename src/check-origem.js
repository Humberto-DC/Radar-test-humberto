const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkOrigem() {
    try {
        const res = await radarPool.query(`
      SELECT origem_venda_id, COUNT(*) 
      FROM public.orcamentos 
      GROUP BY 1 
      ORDER BY 2 DESC
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkOrigem();
