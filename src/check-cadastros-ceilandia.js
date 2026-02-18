const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT * FROM public.cadastros 
      WHERE nome_razao_social ILIKE '%CEILANDIA%'
         OR logradouro ILIKE '%CEILANDIA%'
         OR logradouro_cobranca ILIKE '%CEILANDIA%'
      LIMIT 1
    `);
        console.log("Exemplo de linha em cadastros com CEILANDIA:", res.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
