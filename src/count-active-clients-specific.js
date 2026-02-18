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

const TARGET_SELLERS = [12, 17, 108, 110, 114, 163, 193, 200, 215, 244];

async function checkActiveClientsSpecificSellers() {
    try {
        const res = await pool.query(`
      SELECT 
        cl.funcionario_id as seller_id,
        f.nome as seller_name,
        COUNT(*) as total
      FROM public.clientes cl
      JOIN public.funcionarios f ON f.funcionario_id = cl.funcionario_id
      WHERE COALESCE(cl.cliente_ativo, 'S') <> 'N'
        AND cl.funcionario_id = ANY($1::int[])
      GROUP BY 1, 2
      ORDER BY total DESC
    `, [TARGET_SELLERS]);

        console.log('Clientes ATIVOS por Vendedor (Alvos do Painel):');
        let grandTotal = 0;
        res.rows.forEach(row => {
            console.log(`${row.seller_id} - ${row.seller_name}: ${row.total} clientes`);
            grandTotal += Number(row.total);
        });
        console.log('\nTOTAL GERAL DO GRUPO:', grandTotal);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkActiveClientsSpecificSellers();
