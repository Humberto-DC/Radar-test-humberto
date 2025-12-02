"use client";
import { Client, Message, Contacts } from "./types";
import { keyOf } from "./utils";
import { useRef } from "react";

type SendResult = {
  clientId: number;
  contactId: number;
  telefone: string | null;
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
};

type SendSummary = {
  total: number;
  successCount: number;
  failCount: number;
  details: SendResult[];
};

type Props = {
  sending: boolean;
  selectedMap: Record<string, boolean>;
  clients: Client[];
  contacts: Contacts[];
  selectedMessage?: Message;
  onResult: (summary: SendSummary) => void;
  onResetSelection: () => void;
  onStart?: () => void;
};

export default function SendActions({
  sending,
  selectedMap,
  clients,
  contacts,
  selectedMessage,
  onResult,
  onResetSelection,
  onStart,
}: Props) {
  const inFlight = useRef(false);

  const handleSendBatch = async () => {
    if (inFlight.current) return; // impedir cliques repetidos
    inFlight.current = true;
    onStart?.();

    const selectedIds = Object.keys(selectedMap);
    console.log("[handleSendBatch] selectedIds:", selectedIds);

    if (!selectedMessage) {
      alert("Selecione uma mensagem primeiro.");
      inFlight.current = false;
      return;
    }

    if (selectedIds.length === 0) {
      alert("Selecione pelo menos um cliente.");
      inFlight.current = false;
      return;
    }

    const messageText = selectedMessage.texto ?? "";
    const imageUrl = selectedMessage.imagem || undefined;

    if (!messageText && !imageUrl) {
      alert("Mensagem selecionada está vazia.");
      inFlight.current = false;
      return;
    }

    // 🔗 Monta pares { client, contact } usando contatos_cliente
    const recipients: { client: Client; contact: Contacts }[] = selectedIds
      .map((id) => {
        const client = clients.find((c) => keyOf(c.id_cliente) === id);
        if (!client) return null;

        const contact = contacts.find(
          (ct) =>
            ct.id_cliente === client.id_cliente &&
            ct.telefone &&
            String(ct.telefone).trim() !== ""
        );

        if (!contact) {
          console.warn(
            `[handleSendBatch] Cliente ${client.id_cliente} não possui contato com telefone.`
          );
          return null;
        }

        return { client, contact };
      })
      .filter(
        (pair): pair is { client: Client; contact: Contacts } => pair !== null
      );

    console.log(
      "[handleSendBatch] recipients (client + contact):",
      recipients.map((r) => ({
        id_cliente: r.client.id_cliente,
        nome_cliente: r.client.Cliente,
        contato: r.contact.nome_contato,
        telefone: r.contact.telefone,
      }))
    );

    const details: SendResult[] = [];
    const toSend = recipients; // se quiser testar só 1: recipients.slice(0, 1)

    for (const { client, contact } of toSend) {
      try {
        const payload = {
          to: contact.telefone,
          message: messageText,
          imageUrl,
          clientId: client.id_cliente,
          contactId: contact.id_contato,
          messageId: selectedMessage.id_mensagem,
        };

        console.log("[handleSendBatch] enviando para:", payload);

        const res = await fetch("/api/send_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await res.json().catch(() => ({}))) as unknown;

        details.push({
          clientId: Number(client.id_cliente),
          contactId: Number(contact.id_contato),
          telefone: contact.telefone,
          ok: res.ok,
          status: res.status,
          data,
        });

        await new Promise((r) => setTimeout(r, 120));
      } catch (e: unknown) {
        details.push({
          clientId: Number(client.id_cliente),
          contactId: Number(contact.id_contato),
          telefone: contact.telefone,
          ok: false,
          error:
            e instanceof Error ? e.message : `Erro desconhecido: ${String(e)}`,
        });
      }
    }

    inFlight.current = false;

    const successCount = details.filter((d) => d.ok).length;
    const failCount = details.length - successCount;

    const summary: SendSummary = {
      total: details.length,
      successCount,
      failCount,
      details,
    };

    onResult(summary);
    onResetSelection();
  };

  const disabled =
    sending || !selectedMessage || Object.keys(selectedMap).length === 0;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSendBatch}
        disabled={disabled}
        className="
          bg-[#b6f01f]
          text-[#1a1a1a]
          px-5 py-2
          rounded
          disabled:opacity-50
          transition-all duration-150
          hover:scale-105
          active:scale-95
          disabled:hover:scale-100
          disabled:active:scale-100
        "
      >
        {sending ? "Enviando..." : "Enviar mensagem"}
      </button>
      <div className="text-sm text-gray-700">
        Selecionados: <strong>{Object.keys(selectedMap).length}</strong>
      </div>
    </div>
  );
}
