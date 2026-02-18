const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public' AND column_name = 'cliente_ativo'`);
        if (res.rowCount > 0) console.log("✅ 'cliente_ativo' existe em public.clientes");
        else console.log("❌ 'cliente_ativo' NÃO existe em public.clientes");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
