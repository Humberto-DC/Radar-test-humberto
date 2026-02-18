const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function findProdutoIdTables() {
    try {
        const res = await radarPool.query(`
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'produto_id'
          AND table_schema = 'public'
    `);
        console.log(res.rows.map(r => r.table_name).join('\n'));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

findProdutoIdTables();
