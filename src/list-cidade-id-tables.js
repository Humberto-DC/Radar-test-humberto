const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_name, array_agg(column_name) as cols
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      GROUP BY table_name
      HAVING 'cidade_id' = ANY(array_agg(column_name))
    `);
        console.log("Tabelas com cidade_id:", res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
