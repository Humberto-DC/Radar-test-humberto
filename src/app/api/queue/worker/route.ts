// app/api/queue/worker/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = (process.env.DIALOG_API_KEY || "").trim();
const SANDBOX_TEXT_MODE =
  (process.env.WABA_SANDBOX_TEXT_MODE || "").toLowerCase() === "true";

const log = {
  info: (...args: any[]) => console.log(`[queue_worker]`, ...args),
  warn: (...args: any[]) => console.warn(`[queue_worker] ⚠️`, ...args),
  error: (...args: any[]) => console.error(`[queue_worker] ❌`, ...args),
  compact(obj: any) {
    try {
      const str = JSON.stringify(obj);
      return str.length > 250 ? str.slice(0, 250) + "..." : str;
    } catch {
      return obj;
    }
  },
};

// funções auxiliares (mantidas)
const capitalize = (str: string): string => {
  const s = str.trim().toLowerCase();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const firstName = (full: string | null | undefined): string => {
  if (!full) return "";
  const first = full.trim().split(" ")[0] || "";
  return capitalize(first);
};

const renderTemplateBody = (texto: string, vars: Record<string, string>) => {
  return texto.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] ?? "");
};

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
  statusOverride,
}: {
  ok: boolean;
  clientId: number;
  messageId: number;
  to: string;
  parsed: any;
  statusOverride?: string;
}) {
  const waMessageId = parsed?.messages?.[0]?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);

  await supabaseAdmin.from("envios").insert([
    {
      id_cliente: clientId,
      id_mensagem: messageId,
      data_envio: today,
      status_entrega: statusOverride || (ok ? "sent" : "failed"),
      wa_message_id: waMessageId,
      to_phone: to,
      error_message: ok ? null : parsed,
    },
  ]);
}

export async function GET() {
  if (!API_KEY) {
    log.error("FALTA DIALOG_API_KEY no ambiente");
    return NextResponse.json(
      { ok: false, error: "Missing API key" },
      { status: 500 }
    );
  }

  try {
    // 1) Busca um job pendente
    const { data: job } = await supabaseAdmin
      .from("fila_envio")
      .select("*")
      .eq("status", "pending")
      .order("id_fila", { ascending: true })
      .limit(1)
      .single();

    if (!job) {
      return NextResponse.json({ ok: true, message: "No jobs pending." });
    }

    log.info("Processing job", { id_fila: job.id_fila });

    // marca como processing
    await supabaseAdmin
      .from("fila_envio")
      .update({
        status: "processing",
        last_attempt_at: new Date(),
        tentativas: job.tentativas + 1,
      })
      .eq("id_fila", job.id_fila);

    const clientId = Number(job.id_cliente);
    const messageId = Number(job.id_mensagem);
    const to = job.to_phone;
    const variablesArray: string[] = Array.isArray(job.payload_raw?.variables)
      ? job.payload_raw.variables.map(String)
      : [];

    // 2) Buscar template
    const { data: template } = await supabaseAdmin
      .from("mensagens")
      .select("*")
      .eq("id_mensagem", messageId)
      .single();

    if (!template) {
      log.error("Template not found for job", job.id_fila);
      await supabaseAdmin
        .from("fila_envio")
        .update({ status: "failed" })
        .eq("id_fila", job.id_fila);

      return NextResponse.json(
        { ok: false, error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.status !== "approved") {
      log.warn("Template not approved", {
        id_mensagem: template.id_mensagem,
        status: template.status,
      });
      await supabaseAdmin
        .from("fila_envio")
        .update({ status: "failed" })
        .eq("id_fila", job.id_fila);

      return NextResponse.json(
        { ok: false, error: "Template not approved" },
        { status: 400 }
      );
    }

    // 3) Buscar cliente e checar se está ativo + montar variáveis dinâmicas
    let dynamicVars: Record<string, string> = {};

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("id_cliente", clientId)
      .single();

    if (!cliente) {
      log.error("Client not found for job", job.id_fila);
      await supabaseAdmin
        .from("fila_envio")
        .update({ status: "failed" })
        .eq("id_fila", job.id_fila);

      return NextResponse.json(
        { ok: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // 👉 NOVO: se cliente estiver inativo, não envia nada
    if (cliente.active === false) {
      const errorObj = {
        error: "Client is inactive and cannot receive messages.",
      };

      await saveEnvio({
        ok: false,
        clientId,
        messageId,
        to,
        parsed: errorObj,
        statusOverride: "blocked_inactive",
      });

      await supabaseAdmin
        .from("fila_envio")
        .update({ status: "failed" })
        .eq("id_fila", job.id_fila);

      log.warn("Client inactive, job blocked", {
        id_fila: job.id_fila,
        id_cliente: clientId,
      });

      return NextResponse.json(
        { ok: false, error: errorObj.error },
        { status: 400 }
      );
    }

    // se chegou aqui, cliente está ativo → monta variáveis
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

    // 4) Enviar (SANDBOX ou TEMPLATE)
    let resp: Response;
    let parsed: any;

    if (SANDBOX_TEXT_MODE) {
      const bodyText = renderTemplateBody(template.texto || "", dynamicVars);

      const waPayload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: bodyText },
      };

      log.info("Sending in SANDBOX_TEXT_MODE", {
        to,
        bodyPreview: bodyText.slice(0, 80) + "...",
      });

      resp = await fetch("https://waba-sandbox.360dialog.io/v1/messages", {
        method: "POST",
        headers: {
          "D360-API-KEY": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waPayload),
      });

      const raw = await resp.text();
      parsed = safeJSON(raw);
    } else {
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

      log.info("Sending TEMPLATE", {
        to,
        template_name: template.template_name,
      });

      resp = await fetch("https://waba-sandbox.360dialog.io/v1/messages", {
        method: "POST",
        headers: {
          "D360-API-KEY": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waPayload),
      });

      const raw = await resp.text();
      parsed = safeJSON(raw);
    }

    // grava em envios
    await saveEnvio({
      ok: resp.ok,
      clientId,
      messageId,
      to,
      parsed,
    });

    // atualiza job
    await supabaseAdmin
      .from("fila_envio")
      .update({ status: resp.ok ? "done" : "failed" })
      .eq("id_fila", job.id_fila);

    return NextResponse.json(
      { ok: resp.ok, job: job.id_fila, data: parsed },
      { status: resp.ok ? 200 : 500 }
    );
  } catch (err: any) {
    log.error("Unexpected error in worker:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
