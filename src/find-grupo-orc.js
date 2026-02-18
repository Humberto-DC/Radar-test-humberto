const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function findGrupoInOrc() {
    try {
        const res = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orcamentos' AND column_name LIKE '%grupo%'
    `);
        console.log(res.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
findGrupoInOrc();
