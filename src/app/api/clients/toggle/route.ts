// app/api/clients/toggle/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API para alternar o campo "ativo" de um cliente (opt-in / opt-out).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const id_cliente = Number(body.id_cliente);
    const ativo = body.ativo; // 👈 campo vindo do front

    // validação básica
    if (!id_cliente || typeof ativo !== "boolean") {
      return NextResponse.json(
        { success: false, error: "id_cliente e ativo (boolean) são obrigatórios." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .update({ ativo }) // 👈 usa o nome REAL da coluna
      .eq("id_cliente", id_cliente);

    if (error) {
      console.error("[clients/toggle] Update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update client." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id_cliente, ativo },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[clients/toggle] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
