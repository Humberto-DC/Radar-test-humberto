const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkLimite() {
    try {
        const res = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name LIKE '%limite%'
      AND table_name != 'vw_web_clientes'
      ORDER BY table_name, column_name
    `);
        console.log("Colunas limite no sistema:", res.rows.map(r => `${r.table_name}.${r.column_name}`).join('\n'));

        // Check cadastros for more details
        const res2 = await radarPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros'
      ORDER BY column_name
    `);
        console.log("Colunas de Cadastros:", res2.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkLimite();
