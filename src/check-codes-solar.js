const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkCodes() {
    try {
        const res = await radarPool.query(`
      SELECT DISTINCT grupo_produtos_id 
      FROM public.produtos 
      WHERE grupo_produtos_id LIKE '006%'
    `);
        console.log(res.rows.map(r => r.grupo_produtos_id));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkCodes();
