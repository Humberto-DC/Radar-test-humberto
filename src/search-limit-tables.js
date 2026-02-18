const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%limite%'
    `);
        console.log("Tabelas de limite:", res.rows.map(r => r.table_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
