// components/home/ClientCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos, ContatoRow } from "@/types/crm";
import { parseLooseNumber, formatLocalShort } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import ContactPickerModal from "./ContactPickerModal";
import { getCardStatus, type BoardColumn } from "@/lib/checklistRules";

type Props = {
  client: ClienteComContatos;
  column: BoardColumn;
  canUndo: boolean;
  onMarkContacted: () => void;
  onUndoContacted: () => void;
};

function buildMessage(contactName?: string) {
  const first = (contactName || "").trim().split(" ")[0];
  const who = first ? first : "tudo bem";
  return `Oi, ${who}! Passando pra ver como vocês estão e se posso te ajudar com um novo pedido 😊`;
}

function statusUI(status: "danger" | "warning" | "ok") {
  switch (status) {
    case "danger":
      return {
        stripe: "border-l-red-400",
        dot: "bg-red-400",
        badge: "bg-red-50 text-red-700 ring-red-600/10",
        btn: "bg-red-400 hover:bg-red-600 text-white",
      };
    case "warning":
      return {
        stripe: "border-l-amber-300",
        dot: "bg-amber-300",
        badge: "bg-amber-50 text-amber-800 ring-amber-600/10",
        btn: "bg-amber-300 hover:bg-amber-600 text-white", // ou text-white se preferir
      };
    default:
      return {
        stripe: "border-l-[#b6f01f]",
        dot: "bg-[#b6f01f]",
        badge: "bg-gray-50 text-[#b6f01f] ring-emerald-600/10",
        btn: "bg-[#b6f01f] hover:bg-[#7da516] text-white", // se quiser branco, troque pra text-white
      };
  }
}

export default function ClientCard({
  client,
  column,
  canUndo,
  onMarkContacted,
  onUndoContacted,
}: Props) {
  const [open, setOpen] = useState(false);

  const daysNoBuy = useMemo(
    () => parseLooseNumber(client.ultima_compra),
    [client.ultima_compra]
  );

  const status = useMemo(() => getCardStatus(daysNoBuy), [daysNoBuy]);
  const ui = statusUI(status);

  const lastInteraction = client.ultima_interacao
    ? new Date(client.ultima_interacao)
    : null;

  const contactsWithPhone = useMemo(
    () => (client.contatos || []).filter((c) => !!c.telefone),
    [client.contatos]
  );

  const hasPhone = contactsWithPhone.length > 0;

  function handleSend() {
    if (!hasPhone) return;

    if (contactsWithPhone.length === 1) {
      const c = contactsWithPhone[0];
      const msg = buildMessage(c.nome_contato);
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

  const moneyFormatter = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const primaryLabel = "Marcar contatado";
  const showUndo = canUndo;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-gray-200",
        "border-l-4",
        ui.stripe,
        "p-4 shadow-sm hover:shadow-md transition",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className={["mt-1.5 h-2.5 w-2.5 rounded-full", ui.dot].join(" ")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {client.Cliente}
          </p>

          <p className="mt-0.5 text-xs text-gray-500 truncate">
            {client.Cidade} • Limite: {moneyFormatter.format(client.Limite)}
          </p>

          {/* Meta (badges leves) */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
                "ring-1 ring-inset",
                ui.badge,
              ].join(" ")}
            >
              Sem comprar: {daysNoBuy === null ? "—" : `${daysNoBuy} dias`}
            </span>

            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
              Último contato: {lastInteraction ? formatLocalShort(lastInteraction) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSend}
          disabled={!hasPhone}
          className={[
            "rounded-lg px-4 py-1 text-xs font-semibold transition ml-5",
            "ring-1 ring-inset",
            hasPhone
              ? ui.btn
              : "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed",
          ].join(" ")}
        >
          Mensagem
        </button>

        <button
          onClick={onMarkContacted}
          className="rounded-lg px-3 py-2 text-xs font-semibold transition bg-white text-gray-800 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
        >
          {primaryLabel}
        </button>

        {showUndo && (
          <button
            onClick={onUndoContacted}
            className="rounded-xl px-3 py-2 text-xs font-semibold transition text-gray-600 hover:text-gray-800"
          >
            Desfazer
          </button>
        )}
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
