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
        const res = await pool.query("SELECT * FROM public.produtos LIMIT 1");
        if (res.rows.length > 0) {
            const keys = Object.keys(res.rows[0]).sort();
            console.log('--- PRODUTO KEYS ---');
            for (let i = 0; i < keys.length; i += 10) {
                console.log(keys.slice(i, i + 10).join(', '));
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
test();
