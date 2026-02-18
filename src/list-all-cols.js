const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkColumns() {
    try {
        const res = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'funcionarios' ORDER BY column_name
    `);
        console.log("Funcionarios columns:", res.rows.map(r => r.column_name).join(', '));

        const res2 = await radarPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes' ORDER BY column_name
    `);
        console.log("VW_WEB_CLIENTES columns:", res2.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkColumns();
