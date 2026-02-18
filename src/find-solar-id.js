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
      SELECT p.grupo_id, COUNT(*) as qtd
      FROM public.produtos p
      WHERE UPPER(p.descricao) LIKE '%SOLAR%'
      GROUP BY 1
      ORDER BY 2 DESC
    `);
        console.log('--- SOLAR GROUPS ---');
        console.table(res.rows);

        const res2 = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%grupo%'
    `);
        console.log('--- GRUPO TABLES ---');
        console.log(res2.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
test();
