import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id_cliente = Number(body?.id_cliente);
  const observacoes = String(body?.observacoes ?? "").slice(0, 800);

  if (!id_cliente) return NextResponse.json({ error: "Missing id_cliente" }, { status: 400 });

  // Segurança: seller só altera cliente dele (igual você fez no outro endpoint)
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

  const sql = `
    INSERT INTO public.crm_interacoes_radar (cliente_id, observacoes)
    VALUES ($1, $2)
    ON CONFLICT (cliente_id) DO UPDATE
    SET observacoes = EXCLUDED.observacoes
    RETURNING cliente_id, observacoes;
  `;

  const { rows } = await radarPool.query(sql, [id_cliente, observacoes]);
  return NextResponse.json({ ok: true, data: rows[0] });
}
