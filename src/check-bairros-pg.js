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
      WHERE table_name = 'bairros' AND table_schema = 'public'
    `);
        console.log("Colunas de public.bairros:");
        console.log(res.rows.map(r => r.column_name).join(', '));

        const res2 = await pool.query(`SELECT * FROM public.bairros LIMIT 1`);
        console.log("Exemplo de linha em bairros:", res2.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
