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

            if (cols.rows.length === 0) continue;

            const colNames = cols.rows.map(c => `"${c.column_name}"`);
            const whereClause = colNames.map(c => `${c} ILIKE '%${searchString}%'`).join(' OR ');

            try {
                const check = await pool.query(`SELECT 1 FROM public."${table}" WHERE ${whereClause} LIMIT 1`);
                if (check.rowCount > 0) {
                    console.log(`✅ Achado em: public.${table}`);
                }
            } catch (e) { }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
