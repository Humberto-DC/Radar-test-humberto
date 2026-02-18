const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkPerformance() {
    try {
        const t0 = Date.now();
        const res = await radarPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.orcamentos) as orc_count,
        (SELECT COUNT(*) FROM public.itens_orcamentos) as itens_count,
        (SELECT COUNT(*) FROM public.produtos) as prod_count
    `);
        console.log("Counts:", res.rows[0]);
        console.log("Time:", Date.now() - t0, "ms");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkPerformance();
