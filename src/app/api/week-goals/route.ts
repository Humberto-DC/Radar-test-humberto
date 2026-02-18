//app\api\week-goals\route.ts

import { NextResponse } from "next/server";
import { radarPool } from "@/lib/Db";
import { getServerSession } from "@/lib/serverSession";

function toNumberBRL(v: unknown) {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).trim();

  // Se parece formato JS (ponto e sem virgula)
  if (s.includes(".") && !s.includes(",")) {
    return Number(s);
  }

  // Formato BR (pontos milhar, virgula decimal)
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });

    const vendedor_id = Number(body?.vendedor_id);
    const data_inicio = String(body?.data_inicio ?? "");
    const data_fim = String(body?.data_fim ?? "");
    const valor_meta = toNumberBRL(body?.valor_meta);

    if (!Number.isFinite(vendedor_id) || vendedor_id <= 0) {
      return NextResponse.json({ ok: false, error: "vendedor_id inválido" }, { status: 400 });
    }
    if (!data_inicio || !data_fim) {
      return NextResponse.json({ ok: false, error: "data_inicio/data_fim obrigatórios" }, { status: 400 });
    }
    if (!Number.isFinite(valor_meta) || valor_meta < 0) {
      return NextResponse.json({ ok: false, error: `valor_meta inválido: ${body?.valor_meta}` }, { status: 400 });
    }

    // 1. Verifica se já existe
    const existsSql = `SELECT 1 FROM public.metas_semanal WHERE vendedor_id = $1 AND data_inicio = $2::date AND data_fim = $3::date`;
    const { rows: existsRows } = await radarPool.query(existsSql, [vendedor_id, data_inicio, data_fim]);

    let result;
    if (existsRows.length > 0) {
      // UPDATE
      const updateSql = `
        UPDATE public.metas_semanal 
        SET valor_meta = $4::double precision
        WHERE vendedor_id = $1 AND data_inicio = $2::date AND data_fim = $3::date
        RETURNING *;
      `;
      const { rows } = await radarPool.query(updateSql, [vendedor_id, data_inicio, data_fim, valor_meta]);
      result = rows[0];
    } else {
      // INSERT
      const insertSql = `
        INSERT INTO public.metas_semanal (vendedor_id, data_inicio, data_fim, valor_meta)
        VALUES ($1, $2::date, $3::date, $4::double precision)
        RETURNING *;
      `;
      const { rows } = await radarPool.query(insertSql, [vendedor_id, data_inicio, data_fim, valor_meta]);
      result = rows[0];
    }

    return NextResponse.json({ ok: true, data: result });

  } catch (error: any) {
    console.error("API week-goals error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Erro interno" }, { status: 500 });
  }
}
