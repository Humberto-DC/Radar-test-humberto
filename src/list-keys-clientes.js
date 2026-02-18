const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.clientes LIMIT 1`);
        const row = res.rows[0];
        console.log(Object.keys(row).sort().join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
