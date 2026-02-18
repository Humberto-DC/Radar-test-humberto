const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.cadastros WHERE logradouro ILIKE '%CEILANDIA%' LIMIT 1`);
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("Nenhum 'logradouro' com CEILANDIA.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
