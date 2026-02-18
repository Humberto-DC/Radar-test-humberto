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
  const nowISO = new Date().toISOString();
  noStore();

  const session = await getServerSession();
  if (!session) redirect("/select-user");

  const params: any[] = [];
  let where = `1=1`;

  // só ativos
  where += ` AND COALESCE(cl.cliente_ativo,'S') <> 'N'`;

  // seller: filtra carteira
  if (session.role === "seller") {
    if (session.sellerId === -1) {
      where += ` AND cl.funcionario_id IS NULL`;
    } else {
      params.push(session.sellerId);
      where += ` AND (cl.funcionario_id)::int = $${params.length}::int`;
    }
  }


  // ✅ admin: só a carteira destes vendedores
  if (session.role === "admin") {
    const ADMIN_SELLER_IDS = [244, 12, 17, 200, 110, 193, 114, 215, 108, 163];

    params.push(ADMIN_SELLER_IDS);

    where += `
      AND cl.funcionario_id IS NOT NULL
      AND (cl.funcionario_id)::int = ANY($${params.length}::int[])
      AND COALESCE(TRIM(f.nome), '') <> ''
      AND UPPER(TRIM(f.nome)) NOT LIKE 'GRUPO%'
      AND UPPER(TRIM(f.nome)) NOT LIKE 'VENDEDOR%'
    `;
  }


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
      cid.nome AS nome_cidade,
      cid.estado_id,

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
    LIMIT 5000
    `;


  let rows: RadarJoinedRow[] = [];
  try {
    const result = await radarPool.query<RadarJoinedRow>(sql, params);
    rows = result.rows;
  } catch (error: any) {
    console.error("❌ Erro na consulta ao Radar:", {
      message: error.message,
      detail: error.detail,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Falha ao carregar dados do banco: ${error.message || 'Erro desconhecido'}`);
  }

  const safeISO = (d: any) => {
    if (!d) return null;
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  };

  const enriched: ClienteComContatos[] = rows.map((r, idx) => {
    try {
      const clientId = Number(r.cadastro_id);
      const sellerId = r.vendedor_id == null ? null : Number(r.vendedor_id);
      const hasOpenBudget =
        r.tem_orcamento_aberto === true ||
        r.tem_orcamento_aberto === "t" ||
        r.tem_orcamento_aberto === 1;

      const openBudgetId = r.open_budget_id == null ? null : Number(r.open_budget_id);
      const lastSaleOrcamentoId =
        r.last_sale_orcamento_id == null ? null : Number(r.last_sale_orcamento_id);

      const contatos: ContatoRow[] = (r.contatos_json ?? []).map((c) => ({
        id_contato: c.id_contato,
        id_cliente: clientId,
        nome_contato: (c.nome_contato ?? "").trim(),
        funcao: c.funcao ?? null,
        telefone: (c.celular ?? c.telefone) ?? null,
        criado_em: safeISO(c.criado_em),
      }));
      const principal = contatos.find((c) => c.telefone)?.telefone ?? null;

      const row: ClienteRow = {
        id_cliente: clientId,
        Cliente: pickClientName(r),
        Razao_social: (r.nome_razao_social ?? "").trim(),
        Cidade: (r.nome_cidade ?? "").trim(),
        Estado: (r.estado_id ?? "").trim(),
        Vendedor: (r.nome_vendedor ?? "").trim(),
        Limite: Number(r.limite_credito_aprovado ?? 0),

        telefone: principal,
        tel_celular: principal,

        ultima_compra: safeISO(r.ultima_compra),
        last_sale_orcamento_id: lastSaleOrcamentoId,
        ultima_interacao: safeISO(r.ultima_interacao),
        proxima_interacao: safeISO(r.proxima_interacao),
        observacoes: r.observacoes ?? null,

        can_undo: Boolean(r.can_undo),

        id_vendedor: sellerId,
        ativo: isActiveFlag(r.cliente_ativo),

        orcamentos_abertos: Number(r.orcamentos_abertos ?? 0),
        validade_orcamento_min: safeISO(r.validade_orcamento_min),

        tem_orcamento_aberto: hasOpenBudget,
        open_budget_id: openBudgetId,
      };

      return { ...row, contatos };
    } catch (err) {
      console.error(`❌ Erro mapeando linha ${idx}:`, r.cadastro_id, err);
      // Retorna nulo ou um objeto vazio para não quebrar todo o map, 
      // ou apenas lança o erro se preferir que falhe tudo.
      // Vou lançar para ver o erro no terminal.
      throw err;
    }
  }).filter(Boolean) as ClienteComContatos[];

  return <HomeClient clients={enriched} nowISO={nowISO} />;
}