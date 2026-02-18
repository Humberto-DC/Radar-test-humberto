const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT n.nspname, c.relname, c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 1, 2
    `);

        console.log("=== TODAS AS TABELAS/VIEWS NO BANCO ===");
        res.rows.forEach(r => {
            let type = r.relkind === 'r' ? 'TABLE' : r.relkind === 'v' ? 'VIEW' : r.relkind === 'm' ? 'MAT_VIEW' : r.relkind;
            console.log(`${r.nspname}.${r.relname} (${type})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
