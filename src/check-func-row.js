const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkRow() {
    try {
        const res = await radarPool.query(`
      SELECT * FROM public.funcionarios LIMIT 1;
    `);
        if (res.rows.length > 0) {
            console.log("Colunas em funcionarios:", Object.keys(res.rows[0]).sort().join(', '));
        }
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkRow();
