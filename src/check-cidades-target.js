const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkCidadesTable() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'cidade' OR table_name = 'cidades')
    `);

        if (res.rows.length === 0) {
            console.log("❌ Tabela 'cidade' ou 'cidades' NÃO encontrada.");
            return;
        }

        const tableName = res.rows[0].table_name;
        console.log(`✅ Tabela encontrada: public.${tableName}`);

        const resCols = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY column_name
    `, [tableName]);

        console.log(`Colunas de ${tableName}:`);
        console.log(resCols.rows.map(r => ` - ${r.column_name}`).join('\n'));

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}
checkCidadesTable();
