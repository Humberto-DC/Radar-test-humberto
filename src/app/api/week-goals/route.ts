import { NextResponse } from "next/server";
import { radarPool } from "@/lib/Db";
import { getServerSession } from "@/lib/serverSession";

function toNumberBRL(v: unknown) {
  if (v == null) return NaN;
  const s = String(v).trim();
  // aceita "60.000,00" ou "60000" etc
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // TODO: se você tiver role/permissão, valide aqui (gerente/admin)
  // if (session.user.role !== "manager") ...

  const body = await req.json().catch(() => null);
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
    return NextResponse.json({ ok: false, error: "valor_meta inválido" }, { status: 400 });
  }

  const sql = `
    INSERT INTO public.metas_semanal (vendedor_id, data_inicio, data_fim, valor_meta)
    VALUES ($1, $2::date, $3::date, $4::double precision)
    ON CONFLICT (vendedor_id, data_inicio, data_fim)
    DO UPDATE SET valor_meta = EXCLUDED.valor_meta
    RETURNING vendedor_id, data_inicio, data_fim, valor_meta;
  `;

  const { rows } = await radarPool.query(sql, [vendedor_id, data_inicio, data_fim, valor_meta]);
  return NextResponse.json({ ok: true, data: rows[0] });
}
