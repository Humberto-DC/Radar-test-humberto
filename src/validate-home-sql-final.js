const { Pool } = require('pg');

const pool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle',
    user: 'postgres', password: 'senha123', ssl: false
});

async function run() {
    const params = [];
    const ADMIN_SELLER_IDS = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];
    params.push(ADMIN_SELLER_IDS);

    let where = `1=1`;
    where += ` AND COALESCE(cl.cliente_ativo,'S') <> 'N'`;
    where += `
      AND cl.funcionario_id IS NOT NULL
      AND (cl.funcionario_id)::int = ANY($1::int[])
      AND COALESCE(TRIM(f.nome), '') <> ''
      AND UPPER(TRIM(f.nome)) NOT LIKE 'GRUPO%'
      AND UPPER(TRIM(f.nome)) NOT LIKE 'VENDEDOR%'
  `;

    const sql = `
    WITH last_sale AS (
      SELECT DISTINCT ON (o.cadastro_id)
        o.cadastro_id AS cliente_id,
        o.data_recebimento AS ultima_compra,
        o.orcamento_id::bigint AS last_sale_orcamento_id
      FROM public.orcamentos o
      WHERE
        o.pedido_fechado = 'S'
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND COALESCE(o.bloqueado, 'N') = 'N'
        AND o.data_recebimento IS NOT NULL
      ORDER BY
        o.cadastro_id,
        o.data_recebimento DESC,
        o.orcamento_id DESC
    ),
    contatos AS (
      SELECT
        cc.cadastro_id,
        jsonb_agg(
          jsonb_build_object(
            'id_contato', cc.id_contato,
            'id_cliente', cc.cadastro_id,
            'nome_contato', cc.nome,
            'funcao', cc.funcao,
            'telefone', NULLIF(BTRIM(cc.telefone), ''),
            'celular', NULLIF(BTRIM(cc.celular), ''),
            'criado_em', cc.data_hora_alteracao
          )
          ORDER BY cc.ordem NULLS LAST, cc.id_contato
        ) AS contatos_json
      FROM (
        SELECT
          cadastro_id,
          nome,
          funcao,
          telefone,
          celular,
          data_hora_alteracao,
          ordem,
          ROW_NUMBER() OVER (
            PARTITION BY cadastro_id
            ORDER BY ordem NULLS LAST, data_hora_alteracao DESC NULLS LAST, nome
          )::int AS id_contato
        FROM public.contatos_cadastros
      ) cc
      GROUP BY cc.cadastro_id
    ),
    open_budgets AS (
      SELECT
        o.cadastro_id,
        COUNT(*)::int AS orcamentos_abertos,
        MIN(o.data_validade_orcamento) AS validade_orcamento_min,
        MAX(o.orcamento_id)::bigint AS open_budget_id
      FROM public.orcamentos o
      WHERE
        COALESCE(o.pedido_fechado,'N') = 'N'
        AND COALESCE(o.cancelado,'N') = 'N'
        AND COALESCE(o.bloqueado,'N') = 'N'
        AND o.data_validade_orcamento IS NOT NULL
        AND o.data_validade_orcamento::date >= CURRENT_DATE
      GROUP BY o.cadastro_id
    )
    SELECT
      cad.cadastro_id,
      cad.nome_razao_social,
      cad.nome_fantasia,
      cid.nome AS nome_cidade,
      cid.estado_id,
      f.nome AS nome_vendedor,
      cl.funcionario_id AS vendedor_id,
      clc.limite_credito_aprovado,
      cl.cliente_ativo,
      b.nome AS nome_bairro,

      i.ultima_interacao,
      i.proxima_interacao,
      i.observacoes,

      (
        i.ultima_interacao IS NOT NULL
        AND i.ultima_interacao::date = CURRENT_DATE
      ) AS can_undo,

      ls.ultima_compra,
      ls.last_sale_orcamento_id,

      COALESCE(ob.orcamentos_abertos, 0) AS orcamentos_abertos,
      (COALESCE(ob.orcamentos_abertos, 0) > 0)::boolean AS tem_orcamento_aberto,
      ob.validade_orcamento_min,
      ob.open_budget_id,

      COALESCE(ct.contatos_json, '[]'::jsonb) AS contatos_json
    FROM public.cadastros cad
    JOIN public.clientes cl ON cl.cadastro_id = cad.cadastro_id
    LEFT JOIN public.funcionarios f ON f.funcionario_id = cl.funcionario_id
    LEFT JOIN public.clientes_limite_credito clc ON clc.cliente_limite_credito_id = cl.cliente_limite_credito_id
    LEFT JOIN public.bairros b ON b.bairro_id = cad.bairro_id
    LEFT JOIN public.cidades cid ON cid.cidade_id = b.cidade_id
    LEFT JOIN public.crm_interacoes_radar i
      ON i.cliente_id = cad.cadastro_id
    LEFT JOIN last_sale ls
      ON ls.cliente_id = cad.cadastro_id
    LEFT JOIN contatos ct
      ON ct.cadastro_id = cad.cadastro_id
    LEFT JOIN open_budgets ob
      ON ob.cadastro_id = cad.cadastro_id
    WHERE ${where}
    ORDER BY
      (ls.ultima_compra IS NULL) ASC,
      ls.ultima_compra ASC
    LIMIT 10
  `;

    try {
        const result = await pool.query(sql, params);
        console.log("Sucesso! Linhas:", result.rowCount);
    } catch (e) {
        console.error("ERRO DETALHADO:");
        console.error("Message:", e.message);
    } finally {
        pool.end();
    }
}
run();
