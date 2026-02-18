const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const pool = new Pool({
    host: env.RADAR_DB_HOST,
    port: Number(env.RADAR_DB_PORT) || 5432,
    database: env.RADAR_DB_NAME,
    user: env.RADAR_DB_USER,
    password: env.RADAR_DB_PASS,
    ssl: env.RADAR_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkMetas() {
    try {
        const res = await pool.query('SELECT vendedor_id, data_inicio, data_fim, valor_meta FROM public.metas_semanal WHERE vendedor_id IN (12, 17, 108, 110, 114, 163, 193, 200, 215, 244) AND data_inicio >= \'2026-02-01\' ORDER BY data_inicio LIMIT 20');
        res.rows.forEach(r => {
            console.log(`Vendedor: ${r.vendedor_id} | Ini: ${r.data_inicio.toISOString().split('T')[0]} | Fim: ${r.data_fim.toISOString().split('T')[0]} | Meta: ${r.valor_meta}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkMetas();
