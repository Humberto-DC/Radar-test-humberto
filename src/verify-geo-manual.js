const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function verifyTables() {
    try {
        // 1. Procurar colunas de texto em cadastros que possam ser Cidade/Bairro
        const res = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' 
      AND (column_name LIKE '%cidade%' OR column_name LIKE '%municipio%' OR column_name LIKE '%bairro%' OR column_name LIKE '%nome%')
      ORDER BY column_name
    `);
        console.log("Colunas potenciais em cadastros:", res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        // 2. Verificar se existe tabela 'estado' ou 'estados' ou 'uf'
        const res2 = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'estado' OR table_name = 'estados' OR table_name = 'uf')
    `);
        console.log("Tabela de estado encontrada:", res2.rows.map(r => r.table_name).join(', '));

        // 3. Se encontrar tabela estado, listar colunas
        if (res2.rows.length > 0) {
            const tableName = res2.rows[0].table_name;
            const res3 = await radarPool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
      `);
            console.log(`Colunas da tabela ${tableName}:`, res3.rows.map(r => r.column_name).join(', '));
        }

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
verifyTables();
