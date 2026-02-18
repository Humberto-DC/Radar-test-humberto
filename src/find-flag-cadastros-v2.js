const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' AND table_schema = 'public'
      AND data_type IN ('text', 'character varying', 'character')
    `);

        for (const col of res.rows) {
            const name = col.column_name;
            const check = await pool.query(`SELECT COUNT(DISTINCT "${name}") as count FROM public.cadastros WHERE "${name}" = 'S' OR "${name}" = 'N'`);
            if (parseInt(check.rows[0].count) > 0) {
                console.log(`🚩 Flag em cadastros: ${name}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
