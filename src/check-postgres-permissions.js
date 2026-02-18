const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const u = await pool.query('SELECT current_user');
        console.log('Connected as:', u.rows[0].current_user);

        // 1. Schemas
        const s = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
        console.log('Schemas:', s.rows.map(r => r.nspname).sort().join(', '));

        // 2. Tables in ADM (Case insensitive check)
        const t = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema ILIKE 'adm' ORDER BY table_name");
        if (t.rows.length) {
            console.log('Tables in ADM:', t.rows.map(r => r.table_name).join(', '));
        } else {
            console.log('No tables found in ADM via ILIKE check.');
        }

        // 3. View Definition
        const v = await pool.query("SELECT pg_get_viewdef('public.vw_web_clientes', true) as def");
        console.log('View Def:\n', v.rows[0]?.def);

    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
