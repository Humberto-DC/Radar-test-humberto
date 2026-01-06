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

function cardClassByStatus(status: "danger" | "warning" | "ok") {
  // cor do card baseada em compra
  if (status === "danger") return "bg-red-500 text-white border-red-500";
  if (status === "warning") return "bg-yellow-300 text-gray-900 border-yellow-300";
  return "bg-[#b6f01f] text-[#1a1a1a] border-[#b6f01f]";
}

function pillClass(status: "danger" | "warning" | "ok") {
  // pílulas legíveis em cima do fundo colorido
  if (status === "danger") return "bg-white/20 text-white";
  if (status === "warning") return "bg-black/10 text-gray-900";
  return "bg-black/10 text-[#1a1a1a]";
}

export default function ClientCard({
  client,
  column,
  canUndo,
  onMarkContacted,
  onUndoContacted,
}: Props) {
  const [open, setOpen] = useState(false);

  const daysNoBuy = useMemo(() => parseLooseNumber(client.ultima_compra), [client.ultima_compra]);
  const status = useMemo(() => getCardStatus(daysNoBuy), [daysNoBuy]);

  const lastInteraction = client.ultima_interacao ? new Date(client.ultima_interacao) : null;

  const contactsWithPhone = useMemo(
    () => (client.contatos || []).filter((c) => !!c.telefone),
    [client.contatos]
  );

  function handleSend() {
    if (contactsWithPhone.length <= 0) return;

    if (contactsWithPhone.length === 1) {
      const c = contactsWithPhone[0];
      let nm = (c.nome_contato || "").toLowerCase();
      nm = nm.charAt(0).toUpperCase() + nm.slice(1);
      const msg = buildMessage(nm);
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

  const primaryLabel =
    column === "ok" ? "Marcar contatado" : column === "contacted_no_sale" ? "Marcar contatado" : "Marcar contatado";

  // UX: desfazer só aparece quando faz sentido (quando foi marcado nessa sessão)
  const showUndo = canUndo;

  return (
    <div className={["rounded-2xl border p-4 shadow-sm transition", cardClassByStatus(status)].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{client.Cliente}</p>
          <p className="mt-0.5 text-xs opacity-90">
            {client.Cidade} • Limite: {client.Limite}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className={["rounded-full px-2 py-1 text-[11px]", pillClass(status)].join(" ")}>
              Sem comprar: {daysNoBuy === null ? "—" : `${daysNoBuy} dias`}
            </span>

            <span className={["rounded-full px-2 py-1 text-[11px]", pillClass(status)].join(" ")}>
              Último contato: {lastInteraction ? formatLocalShort(lastInteraction) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSend}
          disabled={!hasPhone}
          className={[
            "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
            hasPhone ? "bg-white/90 hover:bg-white text-gray-900" : "bg-white/40 text-white/70 cursor-not-allowed",
          ].join(" ")}
        >
          Mensagem
        </button>

        <button
          onClick={onMarkContacted}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition bg-black/20 hover:bg-black/30"
        >
          {primaryLabel}
        </button>

        {showUndo && (
          <button
            onClick={onUndoContacted}
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition bg-black/10 hover:bg-black/20"
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
