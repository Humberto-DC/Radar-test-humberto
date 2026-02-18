const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function checkValues() {
    try {
        const res = await radarPool.query(`
      SELECT 
        sistema_origem_pedido, 
        tipo_sistema_recebeu_ped, 
        COUNT(*) 
      FROM public.orcamentos 
      GROUP BY 1, 2
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
checkValues();
