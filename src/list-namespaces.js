const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT nspname FROM pg_namespace`);
        console.log(JSON.stringify(res.rows.map(r => r.nspname)));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
