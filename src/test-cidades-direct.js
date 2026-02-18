const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.cidades LIMIT 1`);
        console.log("public.cidades encontrada!");
        console.log(res.rows[0]);

    } catch (e) {
        console.error("public.cidades não encontrada:", e.message);
    } finally {
        pool.end();
    }
}
run();
