const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Ler .env.local
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

async function debugWeeklyMet() {
    try {
        const sql = `
    WITH weeks_of_month AS (
      SELECT
        date_trunc('week', d)::date as semana_ini,
        (date_trunc('week', d)::date + 4) as semana_fim
      FROM generate_series(
        date_trunc('month', CURRENT_DATE),
        date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day',
        '1 day'::interval
      ) d
      GROUP BY 1, 2
    ),
    seller_weekly_stats AS (
      SELECT
        o.vendedor_id::int as seller_id,
        w.semana_ini,
        (
            SUM(COALESCE(o.valor_pedido, 0)) 
            - SUM(CASE WHEN o.totalmente_devolvido = 'S' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(CASE WHEN o.totalmente_devolvido = 'N' THEN COALESCE(o.valor_outras_desp_manual, 0) ELSE 0 END)
            - SUM(COALESCE(o.valor_frete_processado, 0) + COALESCE(o.valor_frete_extra_manual, 0))
        ) as net_sales_week
      FROM public.orcamentos o
      JOIN weeks_of_month w ON o.data_recebimento::date BETWEEN w.semana_ini AND w.semana_fim
      WHERE o.pedido_fechado = 'S' AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.vendedor_id = ANY($1::bigint[])
      GROUP BY 1, 2
    ),
    seller_weekly_devs AS (
       SELECT 
         rd.vendedor_id::int as seller_id,
         w.semana_ini,
         SUM(COALESCE(rd.valor_credito_gerado, 0)) as total_dev
       FROM public.requisicoes_devolucoes rd
       JOIN weeks_of_month w ON rd.data_hora_alteracao::date BETWEEN w.semana_ini AND w.semana_fim
       WHERE rd.vendedor_id = ANY($1::bigint[])
       GROUP BY 1, 2
    )
    SELECT 
      ms.vendedor_id,
      w.semana_ini,
      ms.valor_meta,
      (COALESCE(sws.net_sales_week, 0) - COALESCE(swd.total_dev, 0)) as total_realized
    FROM public.metas_semanal ms
    JOIN weeks_of_month w ON ms.data_inicio::date <= w.semana_ini AND ms.data_fim::date >= w.semana_fim
    LEFT JOIN seller_weekly_stats sws ON sws.seller_id = ms.vendedor_id AND sws.semana_ini = w.semana_ini
    LEFT JOIN seller_weekly_devs swd ON swd.seller_id = ms.vendedor_id AND swd.semana_ini = w.semana_ini
    WHERE ms.vendedor_id = ANY($1::bigint[])
    ORDER BY ms.vendedor_id, w.semana_ini;
    `;

        const res = await pool.query(sql, [TARGET_SELLERS]);
        console.log('--- DEBUG METAS SEMANAIS ---');
        res.rows.forEach(r => {
            const batida = Number(r.total_realized) >= Number(r.valor_meta);
            console.log(`Vendedor: ${r.vendedor_id} | Semana: ${r.semana_ini.toISOString().split('T')[0]} | Meta: ${r.valor_meta} | Realizado: ${r.total_realized.toFixed(2)} | Batida: ${batida}`);
        });

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

debugWeeklyMet();
