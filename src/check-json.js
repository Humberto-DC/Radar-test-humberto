const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkJson() {
    try {
        const res = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orcamentos' 
        AND (data_type LIKE '%json%' OR data_type LIKE '%text%')
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkJson();
