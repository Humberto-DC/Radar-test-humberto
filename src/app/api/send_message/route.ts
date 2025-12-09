// app/api/send_message/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * This route does NOT send messages directly.
 * It creates queue jobs to be processed by the queue worker.
 */

// mantém exatamente como estava
const normalizePhone = (input?: string | null): string => {
  if (!input) return "";

  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length < 10) return "";

  const ddd = digits.slice(0, 2);
  let rest = digits.slice(2);

  if (rest.length === 9 && rest.startsWith("9")) {
    rest = rest.slice(1);
  }

  if (rest.length !== 8) {
    console.warn("normalizePhone: Número inesperado", input, digits);
    return "";
  }

  return `55${ddd}${rest}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const rawTo = body.to ?? "";
    const to = normalizePhone(String(rawTo));

    const id_cliente = Number(body.clientId) || null;
    const id_mensagem = Number(body.messageId) || null;
    const variables = Array.isArray(body.variables)
      ? body.variables.map(String)
      : [];

    // validações básicas
    if (!to) {
      return NextResponse.json(
        { success: false, error: "Campo 'to' vazio ou inválido." },
        { status: 400 }
      );
    }

    if (!id_cliente || !id_mensagem) {
      return NextResponse.json(
        { success: false, error: "clientId e messageId são obrigatórios." },
        { status: 400 }
      );
    }

    // 👉 NOVO: checa se o cliente está ativo antes de enfileirar
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from("clientes")
      .select("ativo")
      .eq("id_cliente", id_cliente)
      .single();

    if (clienteError || !cliente) {
      console.error("[send_message] Client not found:", clienteError);
      return NextResponse.json(
        { success: false, error: "Client not found." },
        { status: 404 }
      );
    }

    if (cliente.ativo === false) {
      // 🔎 registra no histórico que o envio foi bloqueado por cliente inativo
      const today = new Date().toISOString().slice(0, 10);

      await supabaseAdmin.from("envios").insert([
        {
          id_cliente,
          id_mensagem,
          data_envio: today,
          status_entrega: "blocked_inactive",
          wa_message_id: null,
          to_phone: to,
          error_message: JSON.stringify({
            error: "Client is inactive and cannot receive messages.",
          }),
        },
      ]);

      return NextResponse.json(
        {
          success: false,
          error: "Client is inactive and cannot receive messages.",
        },
        { status: 400 }
      );
    }

    // 👉 Se está ativo, segue o fluxo normal: cria job na fila
    const { error } = await supabaseAdmin.from("fila_envio").insert([
      {
        id_cliente,
        id_mensagem,
        to_phone: to,
        payload_raw: { variables },
      },
    ]);

    if (error) {
      console.error("[queue] Queue insert error:", error);
      return NextResponse.json(
        { success: false, error: "Queue insert failed." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        queued: true,
        message: "Message added to queue and will be processed soon.",
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("[queue] Unexpected error in /send_message:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
