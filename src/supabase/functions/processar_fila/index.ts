// supabase/functions/processar_fila/index.ts
import { serve } from "https://deno.land/x/sift@0.5.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE")!
);

// ============================================
// PROCESSAMENTO DE UMA MENSAGEM POR VEZ
// ============================================
serve(async () => {
  console.log("Worker iniciado...");

  // 1️⃣ Buscar próxima mensagem pendente
  const { data: pendente } = await supabase
    .from("fila_envio")
    .select("*")
    .eq("status", "pending")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!pendente) {
    return new Response("Nenhuma mensagem pendente.");
  }

  console.log("Processando ID:", pendente.id);

  // 2️⃣ Marcar como "processing"
  await supabase
    .from("fila_envio")
    .update({ status: "processing", updated_at: new Date() })
    .eq("id", pendente.id);

  // Buscar template e cliente
  const { data: template } = await supabase
    .from("mensagens")
    .select("*")
    .eq("id_mensagem", pendente.id_mensagem)
    .single();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id_cliente", pendente.id_cliente)
    .single();

  // Variáveis dinâmicas
  const vars = {
    nome: cliente.Cliente.split(" ")[0],
    cidade: cliente.Cidade,
    vendedor: cliente.Vendedor.split(" ")[0],
    limite: cliente.Limite,
    ...pendente.variables,
  };

  // Envio real
  const bodyText = template.texto.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key) => vars[key] ?? ""
  );

  const payload = {
    messaging_product: "whatsapp",
    to: pendente.to_phone,
    type: "text",
    text: { body: bodyText },
  };

  const resp = await fetch("https://waba.360dialog.io/v1/messages", {
    method: "POST",
    headers: {
      "D360-API-KEY": Deno.env.get("DIALOG_API_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }

  const waMessageId = parsed?.messages?.[0]?.id ?? null;

  // 4️⃣ Gravar em `envios`
  await supabase.from("envios").insert([
    {
      id_cliente: pendente.id_cliente,
      id_mensagem: pendente.id_mensagem,
      data_envio: new Date().toISOString().slice(0, 10),
      status_entrega: resp.ok ? "sent" : "failed",
      wa_message_id: waMessageId,
      to_phone: pendente.to_phone,
      error_message: resp.ok ? null : raw,
    },
  ]);

  // 5️⃣ Atualizar a fila
  await supabase
    .from("fila_envio")
    .update({
      status: resp.ok ? "sent" : "failed",
      updated_at: new Date(),
      tentativas: pendente.tentativas + 1,
      error_message: resp.ok ? null : raw,
    })
    .eq("id", pendente.id);

  return new Response("Processado.");
});
