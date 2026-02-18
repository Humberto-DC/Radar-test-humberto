const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findTables() {
    try {
        // Procurar tabelas de cidades/estados
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%cidade%' OR table_name LIKE '%estado%' OR table_name LIKE '%ibge%')
      ORDER BY table_name
    `);
        console.log("Tabelas Lugares:", res.rows.map(r => r.table_name).join(', '));

        // Verificar colunas de limite em clientes
        const res2 = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      AND column_name LIKE '%limite%'
      ORDER BY column_name
    `);
        console.log("Colunas limite em clientes:", res2.rows.map(r => r.column_name).join(', '));

        // Verificar colunas de cidade/estado em cadastros
        const res3 = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' 
      AND (column_name LIKE '%cidade%' OR column_name LIKE '%municipio%' OR column_name LIKE '%estado%' OR column_name LIKE '%uf%')
      ORDER BY column_name
    `);
        console.log("Colunas lugar em cadastros:", res3.rows.map(r => r.column_name).join(', '));

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findTables();
