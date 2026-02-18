const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkRow() {
    try {
        const res = await radarPool.query(`
      SELECT * FROM public.funcionarios LIMIT 1;
    `);
        console.log(Object.keys(res.rows[0]).sort());
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkRow();
