const { Pool } = require('pg');

const radarPool = new Pool({
    host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279', ssl: false
});

async function broadSearch() {
    try {
        const res = await radarPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name NOT IN ('acompanhamento_orcamentos', 'cadastros', 'cargos', 'clientes', 'comissoes', 'comissoes_tipo_pagamento_valor', 'contatos_cadastros', 'crm_interacoes_radar', 'empresas', 'extrato_comissao', 'feriados', 'financeiro_check', 'funcionarios', 'itens_metas', 'itens_requisicoes_devolucoes', 'metas', 'metas_semanal', 'orcamentos', 'persona_clientes', 'produtos', 'requisicoes_devolucoes', 'senha_radar', 'vw_web_clientes')
    `);
        console.log(res.rows.map(r => r.table_name).join(', '));
    } catch (e) { console.error(e); } finally { await radarPool.end(); }
}
broadSearch();
