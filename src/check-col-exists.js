const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkColumnDirect() {
    try {
        await radarPool.query(`SELECT cliente_ativo FROM public.cadastros LIMIT 1`);
        console.log("Coluna cliente_ativo EXISTE em cadastros.");
    } catch (e) {
        console.error("Erro ao selecionar cliente_ativo de cadastros:", e.message);
    } finally {
        await radarPool.end();
    }
}
checkColumnDirect();
