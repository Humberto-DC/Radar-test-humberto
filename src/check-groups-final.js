const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkGroups() {
    try {
        const res = await radarPool.query(`
      SELECT grupo_produtos_id, COUNT(*) 
      FROM public.produtos 
      WHERE grupo_produtos_id LIKE '%6%'
      GROUP BY 1
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkGroups();
