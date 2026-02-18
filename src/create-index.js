const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function createIndex() {
    try {
        const res = await radarPool.query(`CREATE UNIQUE INDEX IF NOT EXISTS metas_semanal_vendedor_data_idx ON public.metas_semanal (vendedor_id, data_inicio, data_fim);`);
        console.log("Index created", res);
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

createIndex();
