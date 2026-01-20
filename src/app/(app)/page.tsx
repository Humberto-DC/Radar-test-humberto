import { unstable_noStore as noStore } from "next/cache";
import HomeClient from "@/components/home/HomeClient";
import type { ClienteComContatos, ClienteRow, ContatoRow } from "@/types/crm";
import { getServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";
import { radarPool } from "@/lib/Db";

type RadarJoinedRow = {
  cadastro_id: string | number;
  nome_razao_social: string | null;
  nome_fantasia: string | null;
  nome_cidade: string | null;
  nome_vendedor: string | null;
  vendedor_id: string | number | null;
  limite_credito_aprovado: number | null;
  cliente_ativo: string | null;

  ultima_interacao: Date | null;
  proxima_interacao: Date | null;
  observacoes: string | null;

  can_undo: boolean | null;
  ultima_compra: Date | null;
  last_sale_orcamento_id:number;

  orcamentos_abertos: number;
  validade_orcamento_min: Date | null;
  tem_orcamento_aberto: boolean | "t" | "f" | 1 | 0;
  open_budget_id:number;


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

function isActiveFlag(v?: string | null) {
  const s = (v ?? "").trim().toUpperCase();
  if (!s) return true;
  if (s === "N") return false;
  if (s === "0") return false;
  if (s === "F") return false;
  return true;
}

function pickClientName(r: RadarJoinedRow) {
  const nf = (r.nome_fantasia ?? "").trim();
  if (nf) return nf;
  const rs = (r.nome_razao_social ?? "").trim();
  return rs || "Sem nome";
}

export default async function Page() {
  noStore();

  const session = await getServerSession();
  if (!session) redirect("/select-user");

  const params: any[] = [];
  let where = `1=1`;

  // só ativos
  where += ` AND COALESCE(c.cliente_ativo,'S') <> 'N'`;

  // seller: filtra carteira
  if (session.role === "seller") {
    if (session.sellerId === -1) {
      where += ` AND c.vendedor_id IS NULL`;
    } else {
      params.push(session.sellerId);
      where += ` AND (c.vendedor_id)::int = $${params.length}::int`;
    }
  }

  const sql =  `
    WITH last_sale AS (
      SELECT DISTINCT ON (v.cliente_id)
        v.cliente_id,
        v.data_recebimento AS ultima_compra,
        v.orcamento_id::bigint AS last_sale_orcamento_id
      FROM public.vw_web_relacao_vendas_produtos v
      WHERE v.data_recebimento IS NOT NULL
      ORDER BY v.cliente_id, v.data_recebimento DESC NULLS LAST
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
      c.cadastro_id,
      c.nome_razao_social,
      c.nome_fantasia,
      c.nome_cidade,
      c.nome_vendedor,
      c.vendedor_id,
      c.limite_credito_aprovado,
      c.cliente_ativo,

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
    FROM public.vw_web_clientes c
    LEFT JOIN public.crm_interacoes_radar i
      ON i.cliente_id = c.cadastro_id
    LEFT JOIN last_sale ls
      ON ls.cliente_id = c.cadastro_id
    LEFT JOIN contatos ct
      ON ct.cadastro_id = c.cadastro_id
    LEFT JOIN open_budgets ob
      ON ob.cadastro_id = c.cadastro_id
    WHERE ${where}
    ORDER BY
      (ls.ultima_compra IS NULL) ASC,
      ls.ultima_compra ASC
    LIMIT 5000
    `;


  const { rows } = await radarPool.query<RadarJoinedRow>(sql, params);

  const enriched: ClienteComContatos[] = rows.map((r) => {
    const clientId = Number(r.cadastro_id); // ✅ normaliza bigint/string -> number
    const sellerId = r.vendedor_id == null ? null : Number(r.vendedor_id); // ✅
    const hasOpenBudget =
      r.tem_orcamento_aberto === true ||
      r.tem_orcamento_aberto === "t" ||
      r.tem_orcamento_aberto === 1; // ✅

      const openBudgetId = r.open_budget_id == null ? null : Number(r.open_budget_id);
      const lastSaleOrcamentoId =
        r.last_sale_orcamento_id == null ? null : Number(r.last_sale_orcamento_id);


    const contatos: ContatoRow[] = (r.contatos_json ?? []).map((c) => ({
      id_contato: c.id_contato,
      id_cliente: clientId, // ✅ usa number (não r.cadastro_id)
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
    Vendedor: (r.nome_vendedor ?? "").trim(),
    Limite: Number(r.limite_credito_aprovado ?? 0),

    telefone: principal,
    tel_celular: principal,

    ultima_compra: r.ultima_compra ? new Date(r.ultima_compra).toISOString() : null,
    last_sale_orcamento_id: r.last_sale_orcamento_id,
    ultima_interacao: r.ultima_interacao ? new Date(r.ultima_interacao).toISOString() : null,
    proxima_interacao: r.proxima_interacao ? new Date(r.proxima_interacao).toISOString() : null,
    observacoes: r.observacoes ?? null,

    can_undo: Boolean(r.can_undo),

    id_vendedor: sellerId,
    ativo: isActiveFlag(r.cliente_ativo),

    orcamentos_abertos: Number(r.orcamentos_abertos ?? 0),
    validade_orcamento_min: r.validade_orcamento_min
      ? new Date(r.validade_orcamento_min).toISOString()
      : null,

    tem_orcamento_aberto: hasOpenBudget,
    open_budget_id: openBudgetId,
  };

  return { ...row, contatos };
});

  return <HomeClient clients={enriched} />;
}