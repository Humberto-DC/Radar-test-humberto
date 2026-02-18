const { Pool } = require('pg');
const fs = require('fs');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function listAllTables() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        const names = res.rows.map(r => r.table_name).join(', ');
        fs.writeFileSync('all_tables.txt', names);
        console.log("Done");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
listAllTables();
