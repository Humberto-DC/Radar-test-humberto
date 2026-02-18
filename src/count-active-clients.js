const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente para garantir que pegamos as variáveis certas
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

async function checkActiveClientsWithSeller() {
    try {
        const res = await pool.query(`
      SELECT COUNT(*) as total
      FROM public.clientes cl
      WHERE COALESCE(cl.cliente_ativo, 'S') <> 'N'
        AND cl.funcionario_id IS NOT NULL
    `);
        console.log('Total de clientes ATIVOS com vendedor vinculado (Geral):', res.rows[0].total);

        const resByBranch = await pool.query(`
      SELECT f.empresa_id, COUNT(*) as total
      FROM public.clientes cl
      JOIN public.funcionarios f ON f.funcionario_id = cl.funcionario_id
      WHERE COALESCE(cl.cliente_ativo, 'S') <> 'N'
      GROUP BY f.empresa_id
      ORDER BY f.empresa_id
    `);
        console.log('\nPor Filial:');
        resByBranch.rows.forEach(row => {
            console.log(`Empresa ID ${row.empresa_id}: ${row.total} clientes`);
        });

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkActiveClientsWithSeller();
