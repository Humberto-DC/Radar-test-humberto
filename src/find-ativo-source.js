const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const samples = await pool.query(`SELECT cadastro_id, cliente_ativo FROM public.vw_web_clientes WHERE cliente_ativo IS NOT NULL LIMIT 20`);

        const clientCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public'`);
        const cadCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'cadastros' AND table_schema = 'public'`);

        for (const col of clientCols.rows) {
            let match = true;
            for (const s of samples.rows) {
                const val = await pool.query(`SELECT "${col.column_name}" FROM public.clientes WHERE cadastro_id = ${s.cadastro_id}`);
                if (val.rowCount === 0 || String(val.rows[0][col.column_name]) !== String(s.cliente_ativo)) {
                    match = false;
                    break;
                }
            }
            if (match) console.log(`✅ MATCH em clientes: ${col.column_name}`);
        }

        for (const col of cadCols.rows) {
            let match = true;
            for (const s of samples.rows) {
                const val = await pool.query(`SELECT "${col.column_name}" FROM public.cadastros WHERE cadastro_id = ${s.cadastro_id}`);
                if (val.rowCount === 0 || String(val.rows[0][col.column_name]) !== String(s.cliente_ativo)) {
                    match = false;
                    break;
                }
            }
            if (match) console.log(`✅ MATCH em cadastros: ${col.column_name}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
