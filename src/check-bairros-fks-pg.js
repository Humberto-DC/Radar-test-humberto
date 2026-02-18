const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table_name
      FROM pg_constraint
      WHERE conrelid = 'public.bairros'::regclass
      AND contype = 'f'
    `);
        console.log("FKs de public.bairros:", res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
