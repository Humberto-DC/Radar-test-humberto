const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        console.log("Testando acesso a ADM.CIDADES e ADM.BAIRROS...");

        const resBairros = await pool.query('SELECT * FROM "ADM"."BAIRROS" LIMIT 1');
        console.log("✅ Sucesso ao ler ADM.BAIRROS. Colunas:", Object.keys(resBairros.rows[0]));

        const resCidades = await pool.query('SELECT * FROM "ADM"."CIDADES" LIMIT 1');
        console.log("✅ Sucesso ao ler ADM.CIDADES. Colunas:", Object.keys(resCidades.rows[0]));

        const testJoin = await pool.query(`
      SELECT 
        c.cadastro_id,
        b.NOME as bairro_nome,
        cid.NOME as cidade_nome
      FROM public.cadastros c
      JOIN "ADM"."BAIRROS" b ON b.BAIRRO_ID = c.bairro_id
      JOIN "ADM"."CIDADES" cid ON cid.CIDADE_ID = b.CIDADE_ID
      LIMIT 1
    `);
        console.log("✅ Join teste bem sucedido:", testJoin.rows[0]);

    } catch (e) {
        console.error("❌ Erro no teste de acesso:", e.message);
        if (e.message.includes('schema "ADM" does not exist')) {
            console.log("Tentando sem aspas ou em minúsculo...");
            // Tentativa fallback se o acima falhar
        }
    } finally {
        pool.end();
    }
}
run();
