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
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'acompanhamento_orcamentos'
    `);
        console.log('--- acompanhamento_orcamentos columns ---');
        console.log(res.rows.map(r => r.column_name).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
test();
