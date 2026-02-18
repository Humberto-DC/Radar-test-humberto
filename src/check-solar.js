const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function checkSolarProducts() {
    try {
        const res = await radarPool.query(`
        SELECT id, nome, grupo_produtos_id 
        FROM public.produtos 
        WHERE grupo_produtos_id = '006' 
        LIMIT 10
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

checkSolarProducts();
