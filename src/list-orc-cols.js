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
      WHERE table_name = 'orcamentos' AND table_schema = 'public'
      AND (column_name ILIKE '%vendedor%' OR column_name ILIKE '%funcio%')
    `);
        console.log(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
