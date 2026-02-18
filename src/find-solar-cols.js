const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findSolarCols() {
    try {
        const res = await radarPool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name LIKE '%solar%'
        AND table_schema = 'public'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findSolarCols();
