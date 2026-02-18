const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' 
      AND (column_name ILIKE '%cidade%' OR column_name ILIKE '%municipio%')
    `);
        console.log("Colunas de cidade em cadastros:", res.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
