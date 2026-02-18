const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkOrcColumns() {
    try {
        const res = await radarPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orcamentos'
    `);
        const solarCols = res.rows.filter(r => r.column_name.includes('grupo') || r.column_name.includes('solar') || r.column_name.includes('tipo'));
        console.log(JSON.stringify(solarCols, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkOrcColumns();
