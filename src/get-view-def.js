const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function getViewDef() {
    try {
        const res = await radarPool.query(`SELECT pg_get_viewdef('public.vw_web_clientes', true) as definition`);
        console.log("Definição da View:\n", res.rows[0].definition);
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
getViewDef();
