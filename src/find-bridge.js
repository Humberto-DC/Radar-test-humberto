const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findBridge() {
    try {
        const res = await radarPool.query(`
      SELECT t1.table_name, t1.column_name as col1, t2.column_name as col2
      FROM information_schema.columns t1
      JOIN information_schema.columns t2 ON t1.table_name = t2.table_name
      WHERE t1.column_name LIKE '%orcamento_id%' 
        AND (t2.column_name LIKE '%produto_id%' OR t2.column_name LIKE '%item%')
        AND t1.table_schema = 'public'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findBridge();
