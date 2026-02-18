const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    const tests = ['ativo', 'bloqueado', 'situacao', 'status', 'liberado'];
    for (const t of tests) {
        try {
            await pool.query(`SELECT ${t} FROM public.clientes LIMIT 1`);
            console.log(`✅ Coluna encontrada: ${t}`);
        } catch (e) { }
    }
    pool.end();
}
run();
