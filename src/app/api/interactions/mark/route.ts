// app/api/interactions/mark/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id_cliente = Number(body?.id_cliente);
  if (!id_cliente) return NextResponse.json({ error: "Missing id_cliente" }, { status: 400 });

  // segurança: seller só pode alterar cliente dele (ou sem vendedor)
  if (session.role === "seller") {
    let checkSql = `
      SELECT 1
      FROM public.vw_web_clientes c
      WHERE c.cadastro_id = $1
    `;
    const params: any[] = [id_cliente];

    if (session.sellerId === -1) {
      checkSql += ` AND c.vendedor_id IS NULL`;
    } else {
      params.push(session.sellerId);
      checkSql += ` AND TRUNC(c.vendedor_id)::int = $2::int`;
    }

    checkSql += ` LIMIT 1`;

    const check = await radarPool.query(checkSql, params);
    if (check.rowCount === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ grava "prev" apenas na primeira marcação do dia
  const upsertSql = `
    INSERT INTO public.crm_interacoes_radar (cliente_id, ultima_interacao, ultima_interacao_prev, prev_set_at)
    VALUES ($1, NOW(), NULL, NULL)
    ON CONFLICT (cliente_id) DO UPDATE
    SET
      ultima_interacao_prev = CASE
        WHEN crm_interacoes_radar.ultima_interacao IS NULL THEN NULL
        WHEN crm_interacoes_radar.ultima_interacao::date <> CURRENT_DATE
          THEN crm_interacoes_radar.ultima_interacao
        ELSE crm_interacoes_radar.ultima_interacao_prev
      END,
      prev_set_at = CASE
        WHEN crm_interacoes_radar.ultima_interacao IS NULL THEN NULL
        WHEN crm_interacoes_radar.ultima_interacao::date <> CURRENT_DATE
          THEN NOW()
        ELSE crm_interacoes_radar.prev_set_at
      END,
      ultima_interacao = NOW()
    RETURNING cliente_id, ultima_interacao, ultima_interacao_prev, prev_set_at
  `;

  const { rows } = await radarPool.query(upsertSql, [id_cliente]);
  return NextResponse.json({ ok: true, data: rows[0] });
}
