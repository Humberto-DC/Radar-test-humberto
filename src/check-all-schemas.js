const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkSchemas() {
    try {
        const res = await radarPool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%cidade%'
    `);
        console.log("Tabelas de cidade em TODOS OS SCHEMAS:");
        res.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));

        // Lista de schemas
        const resSchemas = await radarPool.query(`
      SELECT schema_name 
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);
        console.log("\nSchemas disponíveis:");
        resSchemas.rows.forEach(r => console.log(r.schema_name));

    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkSchemas();
