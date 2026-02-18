const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function checkOwner() {
    try {
        const res = await radarPool.query(`
      SELECT n.nspname AS schema_name, c.relname AS table_name, pg_get_userbyid(c.relowner) AS owner_name 
      FROM pg_class c 
      JOIN pg_namespace n ON n.oid = c.relnamespace 
      WHERE c.relname = 'metas_semanal';
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

checkOwner();
