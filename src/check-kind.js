const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT n.nspname, c.relname, 
             CASE c.relkind 
               WHEN 'r' THEN 'TABLE' 
               WHEN 'v' THEN 'VIEW' 
               WHEN 'm' THEN 'MAT_VIEW' 
               ELSE c.relkind::text 
             END as kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'vw_web_clientes'
    `);
        console.log(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
