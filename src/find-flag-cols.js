const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND table_schema = 'public'
      AND (data_type = 'character' OR data_type = 'character varying' OR data_type = 'text')
    `);

        for (const col of res.rows) {
            const name = col.column_name;
            const check = await pool.query(`SELECT COUNT(DISTINCT "${name}") as count FROM public.clientes WHERE "${name}" IN ('S', 'N')`);
            if (parseInt(check.rows[0].count) === 2) {
                console.log(`🚩 Possível coluna de flag (S/N): ${name}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
