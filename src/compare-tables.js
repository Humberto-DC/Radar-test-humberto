const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function compareColumns() {
    try {
        // Colunas da view
        const viewCols = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes' 
      ORDER BY column_name
    `);

        // Colunas da tabela
        const tableCols = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cadastros' 
      ORDER BY column_name
    `);

        console.log("\n=== COLUNAS EM vw_web_clientes ===");
        console.log(viewCols.rows.map(r => r.column_name).join(', '));

        console.log("\n\n=== COLUNAS EM cadastros ===");
        console.log(tableCols.rows.map(r => r.column_name).join(', '));

        // Verificar campos específicos que usamos
        console.log("\n\n=== CAMPOS QUE USAMOS ===");
        const fieldsWeUse = ['cadastro_id', 'vendedor_id', 'cliente_ativo'];

        for (const field of fieldsWeUse) {
            const inView = viewCols.rows.some(r => r.column_name === field);
            const inTable = tableCols.rows.some(r => r.column_name === field);
            console.log(`${field}: view=${inView}, table=${inTable}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}
compareColumns();
