import { radarPool } from "@/lib/Db";
import { getServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import OrcamentosWrapper from "./OrcamentosWrapper";
import { ClienteComContatos, ContatoRow, ClienteRow } from "@/types/crm";
import { getCurrentMonthFirstDay } from "@/lib/dateUtils";

type RadarJoinedRow = {
  cadastro_id: string | number;
  nome_razao_social: string | null;
  nome_fantasia: string | null;
  nome_cidade: string | null;
  estado_id: string | null;
  nome_vendedor: string | null;
  vendedor_id: string | number | null;
  limite_credito_aprovado: number | null;
  cliente_ativo: string | null;

  ultima_interacao: Date | null;
  proxima_interacao: Date | null;
  observacoes: string | null;

  can_undo: boolean | null;
  ultima_compra: Date | null;
  last_sale_orcamento_id: number | null;

  orcamentos_abertos: number;
  validade_orcamento_min: Date | null;
  tem_orcamento_aberto: boolean | "t" | "f" | 1 | 0;
  open_budget_id: number;
  orcamento_status: string | null;
  orcamento_obs: string | null;
  valor_total: number;

  contatos_json: Array<{
    id_contato: number;
    id_cliente: number;
    nome_contato: string | null;
    funcao: string | null;
    telefone: string | null;
    celular: string | null;
    criado_em: string | Date | null;
  }>;
};

// Helper for active flag
function isActiveFlag(v?: string | null) {
  const s = (v ?? "").trim().toUpperCase();
  if (!s) return true;
  if (s === "N") return false;
  if (s === "0") return false;
  if (s === "F") return false;
  return true;
}

// Helper for display name
function pickClientName(r: RadarJoinedRow) {
  const rs = (r.nome_razao_social ?? "").trim();
  if (rs) return rs;
  const nf = (r.nome_fantasia ?? "").trim();
  return nf || "Sem nome";
}

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  noStore();
  const session = await getServerSession();
  if (!session) redirect("/select-user");

  const params = await searchParams;
  const dataSelecionada = params.data || getCurrentMonthFirstDay();

  const dateObj = new Date(dataSelecionada + 'T00:00:00');
  const openDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const closeDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

  const dataInicioMes = openDate.toISOString().split('T')[0];
  const dataFimMes = closeDate.toISOString().split('T')[0];
  const currentAnoMes = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

  /*
    QUERY STRATEGY:
    1. Find sellers that have a meta for the current month.
    2. Join with clients and open budgets.
    3. Filter for clients with > 0 open budgets.
    4. Group locally by seller.
  */

  const sql = `
    WITH TargetSellers AS (
        SELECT funcionario_id, nome
        FROM public.funcionarios f
        WHERE EXISTS (
            SELECT 1 FROM public.itens_metas im 
            WHERE im.funcionario_id = f.funcionario_id AND im.ano_mes = $1
        )
    ),
    budget_stats AS (
      SELECT 
        o.cadastro_id,
        COUNT(*)::int AS orcamentos_abertos,
        MIN(o.data_validade_orcamento) AS validade_orcamento_min,
        SUM(o.valor_pedido - COALESCE(o.valor_outras_desp_manual, 0))::float as valor_total
      FROM public.orcamentos o
      WHERE o.data_cadastro BETWEEN $2 AND $3
        AND o.cancelado = 'N'
      GROUP BY o.cadastro_id
    ),
    latest_budgets AS (
      SELECT DISTINCT ON (o.cadastro_id)
        o.cadastro_id,
        o.vendedor_id,
        o.orcamento_id::bigint AS open_budget_id
      FROM public.orcamentos o
      WHERE o.data_cadastro BETWEEN $2 AND $3
        AND o.cancelado = 'N'
      ORDER BY o.cadastro_id, o.orcamento_id DESC
    ),
    FilteredClients AS (
      SELECT 
        c.cadastro_id,
        c.nome_razao_social,
        c.nome_fantasia,
        '' as nome_cidade,
        '' as estado_id,
        ts.nome as nome_vendedor,
        ts.funcionario_id as vendedor_id,
        0 as limite_credito_aprovado,
        'S' as cliente_ativo,
        bs.orcamentos_abertos,
        bs.validade_orcamento_min,
        lb.open_budget_id,
        bs.valor_total
      FROM budget_stats bs
      JOIN latest_budgets lb ON lb.cadastro_id = bs.cadastro_id
      JOIN public.cadastros c ON bs.cadastro_id = c.cadastro_id
      JOIN TargetSellers ts ON lb.vendedor_id = ts.funcionario_id
    ),
    last_sale AS (
      SELECT DISTINCT ON (o.cadastro_id)
        o.cadastro_id AS cliente_id,
        o.data_recebimento AS ultima_compra,
        o.orcamento_id::bigint AS last_sale_orcamento_id
      FROM public.orcamentos o
      WHERE o.pedido_fechado = 'S'
        AND COALESCE(o.cancelado, 'N') = 'N'
        AND o.data_recebimento IS NOT NULL
        AND EXISTS (SELECT 1 FROM FilteredClients fc WHERE fc.cadastro_id = o.cadastro_id)
      ORDER BY o.cadastro_id, o.data_recebimento DESC, o.orcamento_id DESC
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
            cc.cadastro_id, cc.nome, cc.funcao, cc.telefone, cc.celular, cc.data_hora_alteracao, cc.ordem,
            ROW_NUMBER() OVER (PARTITION BY cc.cadastro_id ORDER BY cc.ordem NULLS LAST, cc.data_hora_alteracao DESC) AS id_contato
        FROM public.contatos_cadastros cc
        WHERE EXISTS (SELECT 1 FROM FilteredClients fc WHERE fc.cadastro_id = cc.cadastro_id)
      ) cc
      WHERE id_contato <= 5
      GROUP BY cc.cadastro_id
    )
    SELECT
      fc.*,
      i.ultima_interacao,
      i.proxima_interacao,
      i.observacoes,
      NULL::boolean as can_undo,
      ls.ultima_compra,
      ls.last_sale_orcamento_id,
      ao.status as orcamento_status,
      ao.observacao as orcamento_obs,
      COALESCE(ct.contatos_json, '[]'::jsonb) AS contatos_json
    FROM FilteredClients fc
    LEFT JOIN public.crm_interacoes_radar i ON i.cliente_id = fc.cadastro_id
    LEFT JOIN last_sale ls ON ls.cliente_id = fc.cadastro_id
    LEFT JOIN contatos ct ON ct.cadastro_id = fc.cadastro_id
    LEFT JOIN public.acompanhamento_orcamentos ao ON ao.orcamento_id = fc.open_budget_id
    ORDER BY fc.nome_vendedor, fc.validade_orcamento_min ASC
  `;

  const { rows } = await radarPool.query<RadarJoinedRow>(sql, [currentAnoMes, dataInicioMes, dataFimMes]);

  // Group by seller
  const groupedBySeller: Record<string, ClienteComContatos[]> = {};

  rows.forEach((r) => {
    const sellerName = (r.nome_vendedor || "Sem Vendedor").trim();
    if (!groupedBySeller[sellerName]) {
      groupedBySeller[sellerName] = [];
    }

    // Adapt data to component type
    const clientId = Number(r.cadastro_id);
    const sellerId = r.vendedor_id == null ? null : Number(r.vendedor_id);
    const hasOpenBudget = true; // By definition of the query
    const openBudgetId = r.open_budget_id == null ? null : Number(r.open_budget_id);
    const lastSaleOrcamentoId = r.last_sale_orcamento_id == null ? null : Number(r.last_sale_orcamento_id);

    const contatos: ContatoRow[] = (r.contatos_json ?? []).map((c) => ({
      id_contato: c.id_contato,
      id_cliente: clientId,
      nome_contato: (c.nome_contato ?? "").trim(),
      funcao: c.funcao ?? null,
      telefone: (c.celular ?? c.telefone) ?? null,
      criado_em: c.criado_em ? new Date(c.criado_em).toISOString() : null,
    }));
    const principal = contatos.find((c) => c.telefone)?.telefone ?? null;

    const row: ClienteRow = {
      id_cliente: clientId,
      Cliente: pickClientName(r),
      Razao_social: (r.nome_razao_social ?? "").trim(),
      Cidade: (r.nome_cidade ?? "").trim(),
      Estado: (r.estado_id ?? "").trim(),
      Vendedor: sellerName,
      Limite: Number(r.limite_credito_aprovado ?? 0),
      telefone: principal,
      tel_celular: principal,
      ultima_compra: r.ultima_compra ? new Date(r.ultima_compra).toISOString() : null,
      last_sale_orcamento_id: lastSaleOrcamentoId,
      ultima_interacao: r.ultima_interacao ? new Date(r.ultima_interacao).toISOString() : null,
      proxima_interacao: r.proxima_interacao ? new Date(r.proxima_interacao).toISOString() : null,
      observacoes: r.orcamento_obs ?? null,
      can_undo: false,
      id_vendedor: sellerId,
      ativo: isActiveFlag(r.cliente_ativo),
      orcamentos_abertos: Number(r.orcamentos_abertos ?? 0),
      validade_orcamento_min: r.validade_orcamento_min
        ? new Date(r.validade_orcamento_min).toISOString()
        : null,
      tem_orcamento_aberto: hasOpenBudget,
      open_budget_id: openBudgetId,
      orcamento_status: r.orcamento_status,
      valor_total: Number(r.valor_total ?? 0),
    };

    groupedBySeller[sellerName].push({ ...row, contatos });
  });

  return <OrcamentosWrapper groupedBySeller={groupedBySeller} totalClients={rows.length} dataSelecionada={dataSelecionada} />;
}
