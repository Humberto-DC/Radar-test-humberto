const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

        for (const row of res.rows) {
            const table = row.table_name;
            const cols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${table}' 
        AND (column_name ILIKE '%id%' OR column_name ILIKE '%cidade%')
      `);

            if (cols.rows.length === 0) continue;

            const colNames = cols.rows.map(c => `"${c.column_name}"`);
            const whereClause = colNames.map(c => {
                // check if column is numeric or can be cast
                return `(CAST("${c}" AS TEXT) = '1886')`;
            }).join(' OR ');

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
