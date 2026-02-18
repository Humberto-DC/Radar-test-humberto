const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
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

const COMPANIES = [1, 2, 3, 5, 6];

async function checkGlobalPositivity() {
    try {
        // 1. Total de clientes ativos nas empresas 1, 2, 3, 5, 6
        const resWallet = await pool.query(`
      SELECT COUNT(DISTINCT cl.cadastro_id) as total_wallet
      FROM public.clientes cl
      JOIN public.funcionarios f ON f.funcionario_id = cl.funcionario_id
      WHERE COALESCE(cl.cliente_ativo, 'S') <> 'N'
        AND f.empresa_id = ANY($1::bigint[])
    `, [COMPANIES]);

        const totalWallet = Number(resWallet.rows[0].total_wallet);

        // 2. Clientes positivados no mês atual nessas empresas
        const resPositive = await pool.query(`
      SELECT COUNT(DISTINCT o.cadastro_id) as positivados
      FROM public.orcamentos o
      WHERE o.empresa_id = ANY($1::bigint[])
        AND o.pedido_fechado = 'S'
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND COALESCE(o.bloqueado, 'N') = 'N'
        AND o.data_recebimento >= date_trunc('month', CURRENT_DATE)
        AND o.data_recebimento < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `, [COMPANIES]);

        const positivados = Number(resPositive.rows[0].positivados);
        const calculatedPct = (positivados / totalWallet) * 100;

        console.log('--- VALIDAÇÃO GLOBAL (FILIAIS 1,2,3,5,6) ---');
        console.log(`Clientes Ativos Totais: ${totalWallet}`);
        console.log(`Clientes Positivados: ${positivados}`);
        console.log(`Cálculo: (${positivados} / ${totalWallet}) * 100 = ${calculatedPct.toFixed(2)}%`);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkGlobalPositivity();
