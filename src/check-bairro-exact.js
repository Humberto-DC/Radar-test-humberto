const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkBairroExact() {
    try {
        // 1. Procurar tabela 'bairro' (exata, em qualquer schema)
        const res = await radarPool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'bairro'
    `);

        if (res.rows.length === 0) {
            console.log("❌ Tabela 'bairro' NÃO encontrada em nenhum schema visível.");

            // Listar tabelas parecidas
            const res2 = await radarPool.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name ILIKE '%bairro%'
      `);
            console.log("Tabelas parecidas com 'bairro':", res2.rows.map(r => `${r.table_schema}.${r.table_name}`).join(', '));

        } else {
            console.log("✅ Tabela 'bairro' encontrada:", res.rows.map(r => `${r.table_schema}.${r.table_name}`).join(', '));

            // Listar colunas da tabela encontrada
            const schema = res.rows[0].table_schema;
            const table = res.rows[0].table_name;

            const res3 = await radarPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY column_name
      `, [schema, table]);

            console.log(`\nColunas de ${schema}.${table}:`);
            console.log(res3.rows.map(r => ` - ${r.column_name} (${r.data_type})`).join('\n'));
        }

        // Tentar listar 'cidade' também, já que o usuário falou de bairro
        const resCidade = await radarPool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'cidade'
    `);
        if (resCidade.rows.length > 0) {
            console.log("\n✅ Tabela 'cidade' encontrada:", resCidade.rows.map(r => `${r.table_schema}.${r.table_name}`).join(', '));
        }

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkBairroExact();
