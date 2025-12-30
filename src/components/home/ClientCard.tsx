"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos, ContatoRow } from "@/types/crm";
import { parseLooseNumber, formatLocalShort } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import ContactPickerModal from "./ContactPickerModal";


type Props = {
  client: ClienteComContatos;
  variant: "todo" | "done";
  onPrimary: () => void;
};

function buildMessage(contactName?: string) {
  const first = (contactName || "").trim().split(" ")[0];
  const who = first ? first : "tudo bem";
  return `Oi, ${who}! Passando pra ver como vocês estão e se posso te ajudar com um novo pedido 😊`;
}

export default function ClientCard({ client, variant, onPrimary }: Props) {
  const [open, setOpen] = useState(false);

  const d = useMemo(
    () => parseLooseNumber(client.ultima_compra),
    [client.ultima_compra]
  );

  const lastInteraction = client.ultima_interacao ? new Date(client.ultima_interacao) : null;

  const contactsWithPhone = useMemo(
    () => (client.contatos || []).filter((c) => !!c.telefone),
    [client.contatos]
  );

  function handleSend() {
    
    if (contactsWithPhone.length <= 0) return;

    if (contactsWithPhone.length === 1) {
      const c = contactsWithPhone[0];
      var lower = c.nome_contato.toLocaleLowerCase()
      lower = lower.charAt(0).toUpperCase() + lower.slice(1)
      const msg = buildMessage(lower);
      window.open(buildWhatsAppLink(c.telefone!, msg), "_blank");
      return;
    }

    setOpen(true);
  }

  function pickContact(c: ContatoRow) {
    if (!c.telefone) return;
    const msg = buildMessage(c.nome_contato);
    window.open(buildWhatsAppLink(c.telefone, msg), "_blank");
    setOpen(false);
  }

  const hasPhone = contactsWithPhone.length > 0;

  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm transition bg-white",
        variant === "todo"
          ? "border-gray-200 hover:shadow-md"
          : "border-[#b6f01f] bg-emerald-50/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{client.Cliente}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {client.Cidade} • Limite: {client.Limite}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
              Sem comprar: {d === null ? "—" : `${d} dias`}
            </span>
            {lastInteraction && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                Último contato: {formatLocalShort(lastInteraction)}
              </span>
            )}
          </div>
        </div>


      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSend}
          disabled={!hasPhone}
          className={[
            "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition",
            hasPhone
              ? "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          Enviar mensagem
        </button>

        <button
          onClick={onPrimary}
          className={[
            "shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition",
            variant === "todo"
              ? "bg-gray-400 text-white hover:bg-gray-800"
              : "bg-[#b6f01f] text-[#1a1a1a] hover:bg-[#a5d81b]",
          ].join(" ")}
        >
          {variant === "todo" ? "Marcar feito" : "Desfazer"}
        </button>
      </div>

      <ContactPickerModal
        open={open}
        onClose={() => setOpen(false)}
        clientName={client.Cliente}
        contacts={client.contatos || []}
        onPick={pickContact}
      />
    </div>
  );
}
