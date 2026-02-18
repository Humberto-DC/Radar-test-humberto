const { Pool } = require('pg');
const fs = require('fs');

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
        fs.writeFileSync('all_tables_full.txt', JSON.stringify(res.rows, null, 2));
        console.log("Done");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findAllTables();
