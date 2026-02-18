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

const TARGET_SELLERS = [12, 17, 108, 110, 114, 163, 193, 200, 215, 244];

async function validatePositivity() {
    try {
        // 1. Total de clientes ativos na carteira desses vendedores
        const resWallet = await pool.query(`
      SELECT COUNT(DISTINCT cl.cadastro_id) as total_wallet
      FROM public.clientes cl
      WHERE COALESCE(cl.cliente_ativo, 'S') <> 'N'
        AND cl.funcionario_id = ANY($1::int[])
    `, [TARGET_SELLERS]);

        const totalWallet = Number(resWallet.rows[0].total_wallet);

        // 2. Clientes positivados no mês atual (venda fechada)
        const resPositive = await pool.query(`
      SELECT COUNT(DISTINCT o.cadastro_id) as positivados
      FROM public.orcamentos o
      WHERE o.vendedor_id = ANY($1::int[])
        AND o.pedido_fechado = 'S'
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND COALESCE(o.bloqueado, 'N') = 'N'
        AND o.data_recebimento >= date_trunc('month', CURRENT_DATE)
        AND o.data_recebimento < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `, [TARGET_SELLERS]);

        const positivados = Number(resPositive.rows[0].positivados);
        const calculatedPct = (positivados / totalWallet) * 100;

        console.log('--- VALIDAÇÃO DE POSITIVAÇÃO ---');
        console.log(`Vendedores: ${TARGET_SELLERS.join(', ')}`);
        console.log(`Total de clientes Ativos na Carteira: ${totalWallet}`);
        console.log(`Clientes Positivados no Mês: ${positivados}`);
        console.log(`Cálculo: (${positivados} / ${totalWallet}) * 100 = ${calculatedPct.toFixed(2)}%`);

        if (calculatedPct.toFixed(2) === '6.20') {
            console.log('\nO valor de 6.20% está CORRETO conforme os dados atuais.');
        } else {
            console.log(`\nO valor de 6.20% está DIFERENTE. Atualmente o cálculo resulta em ${calculatedPct.toFixed(2)}%.`);
        }

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

validatePositivity();
