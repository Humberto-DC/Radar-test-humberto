const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND table_schema = 'public'
      ORDER BY column_name
    `);
        console.log("=== COLUNAS public.clientes ===");
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' AND table_schema = 'public'
      ORDER BY column_name
    `);
        console.log("\n=== COLUNAS public.cadastros ===");
        res2.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
