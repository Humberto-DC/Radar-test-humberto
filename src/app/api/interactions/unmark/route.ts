import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "@/lib/serverSession";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id_cliente = body?.id_cliente;
  const restore = body?.restore_ultima_interacao as string | null | undefined;

  if (!id_cliente) {
    return NextResponse.json({ error: "Missing id_cliente" }, { status: 400 });
  }

  // segurança: vendedor só pode alterar clientes dele
  if (session.role === "seller") {
    const { data: client, error: e0 } = await supabaseAdmin
      .from("clientes")
      .select("id_cliente,id_vendedor")
      .eq("id_cliente", id_cliente)
      .single();

    if (e0 || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.id_vendedor !== session.sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // restore pode ser null (volta pra "sem interação")
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .update({ ultima_interacao: restore ?? null })
    .eq("id_cliente", id_cliente)
    .select("id_cliente, ultima_interacao")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
