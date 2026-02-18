const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT nome FROM public.bairros LIMIT 1`);
        console.log("Bairro nome:", res.rows[0].nome);
    } catch (e) {
        console.error("Erro ao acessar campo nome:", e.message);
    } finally {
        pool.end();
    }
}
run();
