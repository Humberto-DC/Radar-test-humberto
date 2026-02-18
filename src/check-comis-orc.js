const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkComissoesOrc() {
    try {
        const res = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comissoes' AND column_name LIKE '%orc%'
    `);
        console.log(res.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkComissoesOrc();
