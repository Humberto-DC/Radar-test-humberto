const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function test() {
    const pool = new Pool({
        host: process.env.RADAR_DB_HOST,
        port: parseInt(process.env.RADAR_DB_PORT || '5432'),
        database: process.env.RADAR_DB_NAME,
        user: process.env.RADAR_DB_USER,
        password: process.env.RADAR_DB_PASS,
        ssl: process.env.RADAR_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    try {
        const res = await pool.query(`
      SELECT table_schema, table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'preco_venda'
    `);
        res.rows.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
test();
