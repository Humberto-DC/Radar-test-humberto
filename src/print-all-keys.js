const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.clientes LIMIT 1`);
        const keys = Object.keys(res.rows[0]).sort();
        keys.forEach(k => console.log(k));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
