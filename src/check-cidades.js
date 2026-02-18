const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkCidades() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cidades'
    `);
        console.log("Cidades existe?", res.rowCount > 0);
    } catch (e) {
        console.log(e);
    } finally {
        await radarPool.end();
    }
}
checkCidades();
