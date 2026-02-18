const { Pool } = require('pg');
const fs = require('fs');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function dumpCom() {
    try {
        const res = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comissoes'
    `);
        const cols = res.rows.map(r => r.column_name).join(', ');
        fs.writeFileSync('comissoes_cols.txt', cols);
        console.log("Done");
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
dumpCom();
