import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";

function parseDate(d: any): Date | null {
  if (typeof d !== "string") return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id_cliente = Number(body?.id_cliente);
  const dt = parseDate(body?.dateISO);

  if (!id_cliente || !dt) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // valida janela de 0..30 dias (calendário próximos 30)
  const now = new Date();
  const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (dt < new Date(now.toDateString()) || dt > max) {
    return NextResponse.json({ error: "date_out_of_range" }, { status: 400 });
  }

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
      checkSql += ` AND (c.vendedor_id)::int = $2::int`;
    }

    checkSql += ` LIMIT 1`;

    const check = await radarPool.query(checkSql, params);
    if (check.rowCount === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // regra: acompanhamento define a data exata que ele volta a aparecer na 1a coluna
  const sql = `
    INSERT INTO public.crm_interacoes_radar (cliente_id, proxima_interacao)
    VALUES ($1, $2)
    ON CONFLICT (cliente_id) DO UPDATE
    SET proxima_interacao = EXCLUDED.proxima_interacao
    RETURNING cliente_id, ultima_interacao, proxima_interacao, observacoes;
  `;

  const r = await radarPool.query(sql, [id_cliente, dt]);
  return NextResponse.json({ ok: true, data: r.rows[0] });
}
