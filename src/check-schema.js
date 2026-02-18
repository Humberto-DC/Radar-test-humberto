const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32',
    port: 5432,
    database: 'migracao_oracle',
    user: 'radar_dev',
    password: '121279',
    ssl: false
});

async function checkSchema() {
    try {
        const res = await radarPool.query(`
        SELECT column_name, table_name 
        FROM information_schema.columns 
        WHERE table_name IN ('itens_orcamentos', 'produtos')
        ORDER BY table_name, column_name
    `);

        const tables = {};
        res.rows.forEach(r => {
            if (!tables[r.table_name]) tables[r.table_name] = [];
            tables[r.table_name].push(r.column_name);
        });
        console.log(JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await radarPool.end();
    }
}

checkSchema();
