const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_schema, table_name, column_name
      FROM information_schema.columns 
      WHERE column_name ILIKE '%cidade_id%'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    `);

        console.log("Tabelas com coluna cidade_id:");
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
