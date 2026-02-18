const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM public.clientes LIMIT 1`);
        console.log("=== UM REGISTRO DE public.clientes ===");
        const row = res.rows[0];
        for (const k in row) {
            if (k.toLowerCase().includes('bloq') || k.toLowerCase().includes('sit') || k.toLowerCase().includes('stat') || k.toLowerCase().includes('ativo')) {
                console.log(`${k}: ${row[k]}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
