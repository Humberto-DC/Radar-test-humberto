import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverSession";
import { radarPool } from "@/lib/Db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id_cliente = Number(body?.id_cliente);
  const restoreRaw = body?.restore_ultima_interacao as string | null | undefined;

  if (!id_cliente) {
    return NextResponse.json({ error: "Missing id_cliente" }, { status: 400 });
  }

  // segurança: seller só pode alterar cliente dele
// segurança:
// - seller normal: só clientes da carteira dele
// - sellerId = -1 (Clientes sem vendedor): só clientes com vendedor_id IS NULL
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
    if (check.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }


  // restore pode ser null (volta pra "sem interação")
  if (!restoreRaw) {
    await radarPool.query(
      `DELETE FROM public.crm_interacoes_radar WHERE cliente_id = $1`,
      [id_cliente]
    );

    return NextResponse.json({
      ok: true,
      data: { cliente_id: id_cliente, ultima_interacao: null },
    });
  }

  const restoreDate = new Date(restoreRaw);
  if (Number.isNaN(restoreDate.getTime())) {
    return NextResponse.json({ error: "Invalid restore_ultima_interacao" }, { status: 400 });
  }

  const upsertSql = `
    INSERT INTO public.crm_interacoes_radar (cliente_id, ultima_interacao)
    VALUES ($1, $2)
    ON CONFLICT (cliente_id)
    DO UPDATE SET ultima_interacao = EXCLUDED.ultima_interacao
    RETURNING cliente_id, ultima_interacao
  `;

  const { rows } = await radarPool.query(upsertSql, [id_cliente, restoreDate]);

  return NextResponse.json({ ok: true, data: rows[0] });
}
