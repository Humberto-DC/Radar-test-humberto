const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM ADM.CIDADES LIMIT 1`);
        console.log("ADM.CIDADES encontrada!");
    } catch (e) {
        console.error("ADM.CIDADES erro:", e.message);
    } finally {
        pool.end();
    }
}
run();
