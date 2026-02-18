const { Pool } = require('pg');
const fs = require('fs');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function rowCounts() {
    try {
        const res = await radarPool.query(`
      SELECT relname as table_name, n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);
        fs.writeFileSync('row_counts.txt', JSON.stringify(res.rows, null, 2));
        console.log("Done");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
rowCounts();
