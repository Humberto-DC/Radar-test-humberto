const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkTable() {
    try {
        const res = await radarPool.query(`SELECT * FROM public.itens_orcamentos LIMIT 1`);
        console.log("Found");
    } catch (e) { console.error(e.message); } finally { await radarPool.end(); }
}
checkTable();
