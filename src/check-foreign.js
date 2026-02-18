const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT count(*) FROM pg_foreign_table`);
        console.log("Número de tabelas estrangeiras:", res.rows[0].count);

        const res2 = await pool.query(`
      SELECT ft.ftrelid::regclass as table_name, s.srvname as server
      FROM pg_foreign_table ft
      JOIN pg_foreign_server s ON s.oid = ft.ftserver
    `);
        console.log("Tabelas estrangeiras:", res2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
