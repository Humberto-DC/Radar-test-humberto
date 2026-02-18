const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function listSchemas() {
    try {
        const res = await radarPool.query(`
      SELECT schema_name 
      FROM information_schema.schemata
      ORDER BY schema_name
    `);
        console.log("=== SCHEMAS EXISTENTES ===");
        res.rows.forEach(r => console.log(r.schema_name));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}
listSchemas();
