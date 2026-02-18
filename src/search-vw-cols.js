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
      WHERE table_name = 'vw_web_clientes' 
      AND (column_name ILIKE '%nome%' OR column_name ILIKE '%cidade%' OR column_name ILIKE '%bairro%')
    `);
        console.log("Colunas interessantes em vw_web_clientes:", res.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
