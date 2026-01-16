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
      checkSql += ` AND (c.vendedor_id)::int = $2::int`;
    }

    checkSql += ` LIMIT 1`;

    const check = await radarPool.query(checkSql, params);
    if (check.rowCount === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sql = `
    UPDATE public.crm_interacoes_radar
    SET
      ultima_interacao = NULL,
      proxima_interacao = NOW()
    WHERE cliente_id = $1
      AND ultima_interacao IS NOT NULL
      AND ultima_interacao::date = CURRENT_DATE
    RETURNING cliente_id, ultima_interacao, proxima_interacao, observacoes;
  `;

  const { rows, rowCount } = await radarPool.query(sql, [id_cliente]);

  if (rowCount === 0) {
    return NextResponse.json(
      { error: "Undo not available (only same-day)" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, data: rows[0] });
}
