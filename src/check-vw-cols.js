const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes' AND table_schema = 'public'
    `);
        console.log("Colunas de vw_web_clientes:", res.rows.map(r => r.column_name).join(', '));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
