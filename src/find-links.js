const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function findLinks() {
    try {
        const res = await radarPool.query(`
        SELECT column_name, table_name 
        FROM information_schema.columns 
        WHERE table_name = 'itens_orcamentos'
          AND (column_name LIKE '%orcamento%' OR column_name LIKE '%produto%')
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

findLinks();
