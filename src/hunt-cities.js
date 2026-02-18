const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.columns 
      WHERE column_name ILIKE 'cidade_id'
      AND table_name NOT ILIKE 'vw_web%'
      AND table_name NOT ILIKE 'bairros%'
      AND table_schema = 'public'
    `);
        console.log("Tabelas em public com cidade_id:", res.rows);

        const res2 = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.columns 
      WHERE column_name ILIKE '%nome%'
      AND table_schema = 'public'
      AND table_name NOT ILIKE 'vw_web%'
    `);
        console.log("Tabelas em public com coluna nome:", res2.rows.map(r => r.table_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
