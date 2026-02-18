const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findTableWithBoth() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'orcamento_id'
        AND table_name IN (
            SELECT table_name FROM information_schema.columns WHERE column_name = 'produto_id'
        )
    `);
        console.log("Tables with both orcamento_id and produto_id:", res.rows.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findTableWithBoth();
