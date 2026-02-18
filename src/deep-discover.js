const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        console.log("=== DESCOBERTA AVANÇADA ===");

        // 1. Verificar o que é vw_web_clientes
        const resClass = await pool.query(`
      SELECT n.nspname as schema, c.relname as name, c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'vw_web_clientes'
    `);
        console.log("Tipo de vw_web_clientes:", resClass.rows);

        // 2. Se for view, pegar a definição de outro jeito
        if (resClass.rows.length > 0) {
            const vDef = await pool.query(`SELECT definition FROM pg_views WHERE viewname = 'vw_web_clientes'`);
            console.log("Definição da View (pg_views):", vDef.rows[0]?.definition ? "Encontrada!" : "Não encontrada.");
            if (vDef.rows[0]?.definition) {
                console.log("--- DEFINIÇÃO ---\n", vDef.rows[0].definition);
            }
        }

        // 3. Procurar por tabelas CIDADES e BAIRROS em qualquer lugar
        const resSearch = await pool.query(`
      SELECT n.nspname as schema, c.relname as name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname ILIKE '%cidade%' OR c.relname ILIKE '%bairro%'
      AND c.relkind = 'r'
    `);
        console.log("Tabelas encontradas (qualquer schema):", resSearch.rows);

        // 4. Listar TODOS os schemas novamente, sem filtro
        const resSchemas = await pool.query("SELECT nspname FROM pg_namespace");
        console.log("Todos os Schemas no banco:", resSchemas.rows.map(r => r.nspname));

    } catch (e) {
        console.error("Erro:", e.message);
    } finally {
        pool.end();
    }
}
run();
