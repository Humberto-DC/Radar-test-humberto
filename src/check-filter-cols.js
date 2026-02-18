const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkColumns() {
    try {
        const res = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'funcionarios'
      AND column_name LIKE '%empresa%'
    `);
        console.log("Empresa cols in funcionarios:", res.rows);

        const res2 = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes'
      AND column_name LIKE '%empresa%'
    `);
        console.log("Empresa cols in vw_web_clientes:", res2.rows);

        const res3 = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vw_web_clientes'
      AND column_name LIKE '%unidade%'
    `);
        console.log("Unidade cols in vw_web_clientes:", res3.rows);
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkColumns();
