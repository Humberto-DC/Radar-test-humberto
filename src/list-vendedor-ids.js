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
      AND column_name LIKE '%vendedor%'
    `);
        console.log("Colunas 'vendedor' em clientes:");
        console.log(res.rows);

        const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND table_schema = 'public'
      AND column_name LIKE '%_id%'
    `);
        console.log("Todas as colunas IDs em clientes:");
        res2.rows.forEach(r => console.log(r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
