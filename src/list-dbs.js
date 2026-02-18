const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT datname FROM pg_database WHERE datistemplate = false`);
        console.log("Databases:", res.rows.map(r => r.datname));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
