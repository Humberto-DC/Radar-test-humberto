const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findCidadesTable() {
    try {
        const res2 = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%cidade%' OR table_name ILIKE '%municipio%')
      ORDER BY table_name
    `);
        console.log("Tabelas parecidas com 'cidade':", res2.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}
findCidadesTable();
