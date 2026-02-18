const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function debugWeuler() {
    try {
        // 1. Get ID
        const userRes = await radarPool.query("SELECT funcionario_id FROM public.funcionarios WHERE nome ILIKE '%WEULER LIMA%'");
        const id = userRes.rows[0]?.funcionario_id;

        if (!id) {
            console.log("Weuler not found");
            return;
        }
        console.log("Weuler ID:", id);

        // 2. Define Period (09/02 to 13/02)
        const start = '2026-02-09';
        const end = '2026-02-13 23:59:59';

        // 3. Gross Sales
        const salesRes = await radarPool.query(`
        SELECT 
            SUM(valor_pedido) as bruto,
            SUM(valor_outras_desp_manual) as despesas,
            SUM(valor_frete_processado) as frete_proc,
            SUM(valor_frete_extra_manual) as frete_extra
        FROM public.orcamentos
        WHERE vendedor_id = $1 
          AND data_recebimento BETWEEN $2::timestamp AND $3::timestamp
          AND pedido_fechado = 'S' 
          AND COALESCE(cancelado, 'N') = 'N'
    `, [id, start, end]);

        console.log("SALES (09-13):", salesRes.rows[0]);

        // 4. Returns
        const retRes = await radarPool.query(`
        SELECT SUM(valor_credito_gerado) as devolucoes
        FROM public.requisicoes_devolucoes
        WHERE vendedor_id = $1
          AND data_hora_alteracao BETWEEN $2::timestamp AND $3::timestamp
    `, [id, start, end]);

        console.log("RETURNS (09-13):", retRes.rows[0]);

        // 5. Try including Saturday (14/02) if Saturday exists
        const endSat = '2026-02-14 23:59:59';
        const salesSat = await radarPool.query(`
        SELECT SUM(valor_pedido) as bruto_com_sabado
        FROM public.orcamentos
        WHERE vendedor_id = $1 
          AND data_recebimento BETWEEN $2::timestamp AND $3::timestamp
          AND pedido_fechado = 'S' 
          AND COALESCE(cancelado, 'N') = 'N'
    `, [id, start, endSat]);
        console.log("SALES (09-14) Includes Sat:", salesSat.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

debugWeuler();
