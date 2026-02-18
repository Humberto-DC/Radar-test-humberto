const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkFields() {
    try {
        // Verificar se os campos existem
        const checkView = await radarPool.query(`
      SELECT cadastro_id, vendedor_id, cliente_ativo 
      FROM public.vw_web_clientes 
      LIMIT 1
    `);
        console.log("✓ vw_web_clientes tem os campos:", Object.keys(checkView.rows[0]));

        const checkTable = await radarPool.query(`
      SELECT cadastro_id, vendedor_id 
      FROM public.cadastros 
      LIMIT 1
    `);
        console.log("✓ cadastros tem os campos:", Object.keys(checkTable.rows[0]));

        // Verificar se existe campo de status ativo
        const statusFields = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' 
      AND (column_name LIKE '%ativo%' OR column_name LIKE '%status%' OR column_name LIKE '%inativo%')
    `);
        console.log("\nCampos de status em cadastros:", statusFields.rows.map(r => r.column_name));

    } catch (e) {
        console.error("Erro:", e.message);
    } finally {
        await radarPool.end();
    }
}
checkFields();
