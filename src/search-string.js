const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const searchString = 'CEILANDIA';
        console.log(`Buscando por '${searchString}' em todas as tabelas...`);

        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

        for (const row of tables.rows) {
            const tableName = row.table_name;
            const cols = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND data_type IN ('text', 'character varying')
      `);

            if (cols.rows.length === 0) continue;

            const colNames = cols.rows.map(c => c.column_name);
            const whereClause = colNames.map(c => `"${c}" ILIKE '%${searchString}%'`).join(' OR ');

            try {
                const check = await pool.query(`SELECT 1 FROM public."${tableName}" WHERE ${whereClause} LIMIT 1`);
                if (check.rowCount > 0) {
                    console.log(`✅ Achado em: public.${tableName}`);
                }
            } catch (e) {
                // ignore errors on specific tables
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
