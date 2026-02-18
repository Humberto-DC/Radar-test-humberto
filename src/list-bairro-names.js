const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT nome FROM public.bairros LIMIT 10`);
        console.log("Nomes de bairros:", res.rows.map(r => r.nome));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
