const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const searchVal = 12;
        console.log(`Buscando por vendedor_id=${searchVal} em public.clientes...`);

        const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND table_schema = 'public'
    `);

        for (const col of columns.rows) {
            if (['integer', 'bigint', 'numeric', 'smallint'].includes(col.data_type)) {
                try {
                    const check = await pool.query(`SELECT 1 FROM public.clientes WHERE "${col.column_name}" = ${searchVal} LIMIT 1`);
                    if (check.rowCount > 0) {
                        console.log(`✅ Possível coluna de vendedor em clientes: ${col.column_name}`);
                    }
                } catch (e) { }
            }
        }

        console.log(`\nBuscando por vendedor_id=${searchVal} em public.cadastros...`);
        const columns2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cadastros' AND table_schema = 'public'
    `);

        for (const col of columns2.rows) {
            if (['integer', 'bigint', 'numeric', 'smallint'].includes(col.data_type)) {
                try {
                    const check = await pool.query(`SELECT 1 FROM public.cadastros WHERE "${col.column_name}" = ${searchVal} LIMIT 1`);
                    if (check.rowCount > 0) {
                        console.log(`✅ Possível coluna de vendedor em cadastros: ${col.column_name}`);
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
