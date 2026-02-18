const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name ILIKE 'nome'
      AND table_name IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND column_name ILIKE 'estado_id'
      )
    `);
        console.log("Tabelas que têm NOME e ESTADO_ID:", res.rows.map(r => r.table_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
