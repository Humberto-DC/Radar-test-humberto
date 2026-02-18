const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findOrderItems() {
    try {
        const res = await radarPool.query(`
      SELECT t1.table_name
      FROM information_schema.columns t1
      JOIN information_schema.columns t2 ON t1.table_name = t2.table_name
      WHERE t1.column_name = 'produto_id' 
        AND (t2.column_name = 'orcamento_id' OR t2.column_name = 'vendedor_id')
        AND t1.table_schema = 'public'
    `);
        console.log(res.rows.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findOrderItems();
