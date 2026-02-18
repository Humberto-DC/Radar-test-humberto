const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    try {
        const inactive = await pool.query(`SELECT cadastro_id FROM public.vw_web_clientes WHERE cliente_ativo = 'N' LIMIT 5`);
        const active = await pool.query(`SELECT cadastro_id FROM public.vw_web_clientes WHERE cliente_ativo = 'S' LIMIT 5`);

        if (inactive.rowCount === 0) {
            console.log("Não achei clientes inativos na view.");
            return;
        }

        const clientCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes' AND table_schema = 'public' AND data_type IN ('text', 'character varying', 'character')`);

        for (const col of clientCols.rows) {
            const cname = col.column_name;
            const checkIna = await pool.query(`SELECT COUNT(*) FROM public.clientes WHERE cadastro_id = ANY($1) AND "${cname}" = 'N'`, [inactive.rows.map(r => r.cadastro_id)]);
            const checkAct = await pool.query(`SELECT COUNT(*) FROM public.clientes WHERE cadastro_id = ANY($1) AND "${cname}" = 'S'`, [active.rows.map(r => r.cadastro_id)]);

            if (parseInt(checkIna.rows[0].count) === inactive.rowCount && parseInt(checkAct.rows[0].count) === active.rowCount) {
                console.log(`🎯 Provável coluna de status em clientes: ${cname}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
