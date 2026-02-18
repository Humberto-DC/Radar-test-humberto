const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.bairros WHERE bairro_id = '1'`);
        console.log("Bairro ID 1:", res.rows[0]);

        const res2 = await pool.query(`SELECT * FROM public.bairros WHERE nome ILIKE '%CEILANDIA%' LIMIT 5`);
        console.log("Bairros com CEILANDIA:", res2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
