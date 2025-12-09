// app/api/send_message/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = (process.env.DIALOG_API_KEY || "").trim();
const SANDBOX_TEXT_MODE =
  (process.env.WABA_SANDBOX_TEXT_MODE || "").toLowerCase() === "true";

const log = {
  info: (...args: any[]) => console.log(`[send_message]`, ...args),
  warn: (...args: any[]) => console.warn(`[send_message] ⚠️`, ...args),
  error: (...args: any[]) => console.error(`[send_message] ❌`, ...args),
  compact(obj: any) {
    try {
      const str = JSON.stringify(obj);
      return str.length > 250 ? str.slice(0, 250) + "..." : str;
    } catch {
      return obj;
    }
  },
};

// ===============================================================
// 🔥 MANTIDO EXATAMENTE COMO ESTAVA — NÃO ALTERAR
// ===============================================================
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
    log.warn("normalizePhone: Número inesperado", input, digits);
    return "";
  }

  return `55${ddd}${rest}`;
};

// ===============================================================
// 🔥 NOVO: padronização com primeira letra maiúscula
// ===============================================================
const capitalize = (str: string): string => {
  const s = str.trim().toLowerCase();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// 🔥 NOVO: pegar apenas o primeiro nome do cliente ou vendedor
const firstName = (full: string | null | undefined): string => {
  if (!full) return "";
  const first = full.trim().split(" ")[0] || "";
  return capitalize(first);
};

// ===============================================================
// Substituição de variáveis nomeadas no texto
// ===============================================================
const renderTemplateBody = (texto: string, vars: Record<string, string>) => {
  return texto.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] ?? "");
};

export async function POST(req: Request) {
  const requestId = Date.now().toString(36);
  log.info(`HIT`, { requestId, SANDBOX_TEXT_MODE });

  if (!API_KEY) {
    log.error("FALTA DIALOG_API_KEY no ambiente");
    return NextResponse.json(
      { success: false, error: "Missing API key" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));

    const rawTo = body.to ?? "";
    let to = normalizePhone(String(rawTo));

    const clientId = Number(body.clientId) || null;
    const messageId = Number(body.messageId) || null;

    const variablesArray: string[] = Array.isArray(body.variables)
      ? body.variables.map(String)
      : [];

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Campo 'to' vazio" },
        { status: 400 }
      );
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Campo 'messageId' é obrigatório" },
        { status: 400 }
      );
    }

    // ===============================================================
    // 1) Buscar template
    // ===============================================================
    const { data: template } = await supabaseAdmin
      .from("mensagens")
      .select("*")
      .eq("id_mensagem", messageId)
      .single();

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (template.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Template ainda não aprovado" },
        { status: 400 }
      );
    }

    // ===============================================================
    // 2) Buscar cliente e montar variáveis dinâmicas
    // ===============================================================
    let dynamicVars: Record<string, string> = {};

    if (clientId) {
      const { data: cliente } = await supabaseAdmin
        .from("clientes")
        .select("*")
        .eq("id_cliente", clientId)
        .single();

      const { data: contatos } = await supabaseAdmin
        .from("contatos_cliente")
        .select("*")
        .eq("id_cliente", clientId);

      const nomeContato =
        contatos?.[0]?.nome_contato || cliente?.Cliente || "";

      dynamicVars = {
        nome: firstName(nomeContato),
        cliente: firstName(cliente?.Cliente ?? ""),
        cidade: capitalize(cliente?.Cidade ?? ""),
        vendedor: firstName(cliente?.Vendedor ?? ""),
        limite: cliente?.Limite?.toString() ?? "",
        ultima_compra: cliente?.data_ultima_compra
          ? String(cliente.data_ultima_compra)
          : "",
      };

      variablesArray.forEach((v, i) => {
        dynamicVars[`var${i + 1}`] = v;
      });
    }

    // ===============================================================
    // 3) MODO SANDBOX → envia TEXTO renderizado
    // ===============================================================
    if (SANDBOX_TEXT_MODE) {
      const bodyText = renderTemplateBody(template.texto || "", dynamicVars);

      const waPayload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: bodyText },
      };

      const resp = await fetch(
        "https://waba-sandbox.360dialog.io/v1/messages",
        {
          method: "POST",
          headers: {
            "D360-API-KEY": API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(waPayload),
        }
      );

      const raw = await resp.text();
      const parsed = safeJSON(raw);

      await saveEnvio({
        ok: resp.ok,
        clientId,
        messageId,
        to,
        parsed,
      });

      if (!resp.ok) {
        return NextResponse.json(
          { success: false, status: resp.status, data: parsed },
          { status: resp.status }
        );
      }

      return NextResponse.json(
        { success: true, data: parsed, sandbox_text_mode: true },
        { status: 200 }
      );
    }

    // ===============================================================
    // 4) ENVIO REAL COMO TEMPLATE
    // ===============================================================
    const dynamicValues = Object.values(dynamicVars);

    const waPayload: any = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.template_name,
        language: { code: template.language_code },
        components: dynamicValues.length
          ? [
              {
                type: "body",
                parameters: dynamicValues.map((v) => ({
                  type: "text",
                  text: v,
                })),
              },
            ]
          : [],
      },
    };

    const resp = await fetch("https://waba-sandbox.360dialog.io/v1/messages", {
      method: "POST",
      headers: {
        "D360-API-KEY": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(waPayload),
    });

    const raw = await resp.text();
    const parsed = safeJSON(raw);

    await saveEnvio({
      ok: resp.ok,
      clientId,
      messageId,
      to,
      parsed,
    });

    return NextResponse.json(
      { success: resp.ok, data: parsed },
      { status: resp.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}

// ===============================================================
// Helpers finais
// ===============================================================
const safeJSON = (raw: string) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

async function saveEnvio({
  ok,
  clientId,
  messageId,
  to,
  parsed,
}: any) {
  const waMessageId = parsed?.messages?.[0]?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);

  await supabaseAdmin.from("envios").insert([
    {
      id_cliente: clientId,
      id_mensagem: messageId,
      data_envio: today,
      status_entrega: ok ? "sent" : "failed",
      wa_message_id: waMessageId,
      to_phone: to,
      error_message: ok ? null : parsed,
    },
  ]);
}
