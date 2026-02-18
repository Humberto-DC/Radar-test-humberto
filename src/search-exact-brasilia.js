const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const searchString = 'BRASILIA';
        const res = await pool.query(`
      SELECT n.nspname, c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r' AND n.nspname = 'public'
    `);

        for (const row of res.rows) {
            const table = row.relname;
            const cols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${table}' 
        AND data_type IN ('text', 'character varying')
      `);

            for (const col of cols.rows) {
                const colName = col.column_name;
                try {
                    const check = await pool.query(`SELECT 1 FROM public."${table}" WHERE "${colName}" = 'BRASILIA' LIMIT 1`);
                    if (check.rowCount > 0) {
                        console.log(`✅ EXATO em: public.${table} (coluna: ${colName})`);
                    }
                } catch (e) { }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
