const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT viewname, definition 
      FROM pg_views 
      WHERE definition ILIKE '%CIDADES%'
      OR definition ILIKE '%BAIRROS%'
    `);
        console.log("Views que mencionam CIDADES ou BAIRROS:");
        console.log(res.rows.map(r => r.viewname));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
