const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findCityTable() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'mun%' OR table_name LIKE 'loc%' OR table_name LIKE 'cid%')
    `);
        console.log("Tabelas candidatas a Cidade:", res.rows.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findCityTable();
