const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const val = 10207;
        const res = await pool.query(`SELECT * FROM public.clientes_limite_credito LIMIT 1`);
        const cols = Object.keys(res.rows[0]);
        for (const col of cols) {
            try {
                const check = await pool.query(`SELECT 1 FROM public.clientes_limite_credito WHERE CAST("${col}" AS TEXT) = '10207' LIMIT 1`);
                if (check.rowCount > 0) console.log(`✅ Coluna: ${col}`);
            } catch (e) { }
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
