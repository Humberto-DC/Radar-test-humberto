const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'cadastros' AND table_schema = 'public' AND column_name = 'ativo'`);
        if (res.rowCount > 0) console.log("✅ 'ativo' existe em public.cadastros");

        const res2 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public' AND column_name = 'ativo'`);
        if (res2.rowCount > 0) console.log("✅ 'ativo' existe em public.clientes");

        // Se nenhum existe, vamos ver o que tem em clientes que pareça ativo
        const res3 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public'`);
        const cols = res3.rows.map(r => r.column_name);
        console.log("Colunas em clientes:", cols.join(', '));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
