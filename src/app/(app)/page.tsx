import { unstable_noStore as noStore } from "next/cache";
import HomeClient from "@/components/home/HomeClient";
import type { ClienteComContatos, ClienteRow } from "@/types/crm";
import { getServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";
import { radarPool } from "@/lib/Db";

type RadarJoinedRow = {
  cadastro_id: number;
  nome_razao_social: string | null;
  nome_fantasia: string | null;
  nome_cidade: string | null;
  nome_vendedor: string | null;
  vendedor_id: number | null;
  limite_credito_aprovado: number | null;
  cliente_ativo: string | null;

  telefone: string | null;
  tel_celular: string | null;

  ultima_interacao: Date | null;
  proxima_interacao: Date | null;
  observacoes: string | null;

  can_undo: boolean | null;
  ultima_compra: Date | null;
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
    // clientes SEM vendedor
    if (session.sellerId === -1) {
      where += ` AND c.vendedor_id IS NULL`;
    } else {
      params.push(session.sellerId);
      where += ` AND (c.vendedor_id)::int = $${params.length}::int`;
    }
  }

  const sql = `
    WITH ultima AS (
      SELECT
        v.cliente_id,
        MAX(v.data_recebimento) AS ultima_compra
      FROM public.vw_web_relacao_vendas_produtos v
      WHERE v.data_recebimento IS NOT NULL
      GROUP BY v.cliente_id
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
      c.telefone,
      c.tel_celular,

      i.ultima_interacao,
      i.proxima_interacao,
      i.observacoes,

      (
        i.ultima_interacao IS NOT NULL
        AND i.ultima_interacao::date = CURRENT_DATE
      ) AS can_undo,

      u.ultima_compra
    FROM public.vw_web_clientes c
    LEFT JOIN public.crm_interacoes_radar i
      ON i.cliente_id = c.cadastro_id
    LEFT JOIN ultima u
      ON u.cliente_id = c.cadastro_id
    WHERE ${where}
    ORDER BY
      (u.ultima_compra IS NULL) ASC,
      u.ultima_compra ASC
    LIMIT 5000
  `;

  const { rows } = await radarPool.query<RadarJoinedRow>(sql, params);

  const enriched: ClienteComContatos[] = rows.map((r) => {
    const idVendedor =
      typeof r.vendedor_id === "number" ? Math.trunc(r.vendedor_id) : null;

    const row: ClienteRow = {
      id_cliente: r.cadastro_id,
      Cliente: pickClientName(r),
      Razao_social: (r.nome_razao_social ?? "").trim(),
      Cidade: (r.nome_cidade ?? "").trim(),
      Vendedor: (r.nome_vendedor ?? "").trim(),
      Limite: Number(r.limite_credito_aprovado ?? 0),
      telefone: r.telefone ?? null,
      tel_celular: r.tel_celular ?? null,

      ultima_compra: r.ultima_compra ? new Date(r.ultima_compra).toISOString() : null,
      ultima_interacao: r.ultima_interacao ? new Date(r.ultima_interacao).toISOString() : null,

      // ✅ novos
      proxima_interacao: r.proxima_interacao ? new Date(r.proxima_interacao).toISOString() : null,
      observacoes: r.observacoes ?? null,

      can_undo: Boolean(r.can_undo),

      id_vendedor: idVendedor,
      ativo: isActiveFlag(r.cliente_ativo),
    };

    return { ...row, contatos: [] };
  });

  return <HomeClient clients={enriched} />;
}
