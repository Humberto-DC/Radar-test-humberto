const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function findProdTables() {
    try {
        const res = await radarPool.query(`
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'produto_id'
          AND table_schema = 'public'
    `);
        console.log("Tables with produto_id:", res.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

findProdTables();
