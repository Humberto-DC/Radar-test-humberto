// src/app/api/interactions/mark/route.ts
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

  // regra: marcou como feito -> ultima_interacao agora + proximo contato em 7 dias
  try {
    // 1. Tenta atualizar se já existe
    const updateSql = `
      UPDATE public.crm_interacoes_radar
      SET
        ultima_interacao = NOW(),
        proxima_interacao = NOW() + INTERVAL '7 days',
        observacoes = NULL
      WHERE cliente_id = $1
      RETURNING cliente_id, ultima_interacao, proxima_interacao, observacoes;
    `;
    const { rows: updateRows } = await radarPool.query(updateSql, [id_cliente]);

    if (updateRows.length > 0) {
      return NextResponse.json({ ok: true, data: updateRows[0] });
    }

    // 2. Se não atualizou, insere (cliente novo no radar)
    const insertSql = `
      INSERT INTO public.crm_interacoes_radar (cliente_id, ultima_interacao, proxima_interacao, observacoes)
      VALUES ($1, NOW(), NOW() + INTERVAL '7 days', NULL)
      RETURNING cliente_id, ultima_interacao, proxima_interacao, observacoes;
    `;
    const { rows: insertRows } = await radarPool.query(insertSql, [id_cliente]);

    return NextResponse.json({ ok: true, data: insertRows[0] });

  } catch (error) {
    console.error("Error in mark/route.ts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}