const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findAllTables() {
    try {
        const res = await radarPool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      ORDER BY table_schema, table_name
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findAllTables();
