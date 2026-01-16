"use client";

import {useEffect, useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate, daysSince, formatLocalShort, formatLocalVeryShort } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getCardStatus, type BoardColumn } from "@/lib/checklistRules";
import { SquareCheckBig, AlarmClockOff, NotebookPen } from "lucide-react";
import NotesModal from "./NotesModal";
import PhonePickerModal from "./PhonePickerModal";

type Props = {
  client: ClienteComContatos;
  column: BoardColumn;
  canUndo: boolean;
  onMarkContacted: () => void;
  onUndoContacted: () => void;
  onOpenCalendar?: () => void;
};

function buildMessage() {
  return `Oi! Passando pra ver como você está e se posso te ajudar com um novo pedido 😊`;
}

function statusUI(status: "danger" | "warning" | "ok") {
  switch (status) {
    case "danger":
      return {
        stripe: "border-l-red-400",
        dot: "bg-red-400",
        badge: "bg-red-50 text-red-700 ring-red-600/0",
        btn: "bg-red-400 hover:bg-red-600 text-white",
      };
    case "warning":
      return {
        stripe: "border-l-amber-300",
        dot: "bg-amber-300",
        badge: "bg-amber-50 text-amber-800 ring-amber-600/0",
        btn: "bg-amber-300 hover:bg-amber-600 text-white",
      };
    default:
      return {
        stripe: "border-l-[#b6f01f]",
        dot: "bg-[#b6f01f]",
        badge: "bg-gray-50 text-[#b6f01f] ring-emerald-600/10",
        btn: "bg-[#b6f01f] hover:bg-[#7da516] text-white",
      };
  }
}

type PhoneOption = { id: string; label: string; phone: string };



export default function ClientCard({
  client,
  column,
  canUndo,
  onMarkContacted,
  onUndoContacted,
  onOpenCalendar,
}: Props) {
  const [open, setOpen] = useState(false);

  const daysNoBuy = useMemo(
    () => daysSince(parseLooseDate(client.ultima_compra as any)),
    [client.ultima_compra]
  );

  const status = useMemo(() => getCardStatus(daysNoBuy), [daysNoBuy]);
  const ui = statusUI(status);

  const lastInteraction = useMemo(
    () => parseLooseDate(client.ultima_interacao as any),
    [client.ultima_interacao]
  );

  const nextInteraction = useMemo(
  () => parseLooseDate((client as any).proxima_interacao),
  [client.proxima_interacao]
);

const showNextContact = column === "contacted_no_sale";

const contactDate = showNextContact ? nextInteraction : lastInteraction;

const contactLabel = showNextContact
  ? "Próx. contato"
  : "Último contato";



  const phoneOptions: PhoneOption[] = useMemo(() => {
    const tel = (client.telefone || "").trim();
    const cel = (client.tel_celular || "").trim();

    const opts: PhoneOption[] = [];
    if (cel) opts.push({ id: "cel", label: "Celular", phone: cel });
    if (tel && tel !== cel) opts.push({ id: "tel", label: "Telefone", phone: tel });

    return opts;
  }, [client.telefone, client.tel_celular]);

  const hasPhone = phoneOptions.length > 0;

  function handleSend() {
    if (!hasPhone) return;

    if (phoneOptions.length === 1) {
      const msg = buildMessage();
      window.open(buildWhatsAppLink(phoneOptions[0].phone, msg), "_blank");
      return;
    }

    setOpen(true);
  }

  function pickPhone(opt: PhoneOption) {
    const msg = buildMessage();
    window.open(buildWhatsAppLink(opt.phone, msg), "_blank");
    setOpen(false);
  }

  const moneyFormatter = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const primaryLabel = "Feito";
  const showUndo = canUndo;

  // ✅ só na coluna do meio
  const showSnooze = column === "contacted_no_sale";

  const [notesOpen, setNotesOpen] = useState(false);

  const initialNotes = useMemo(
    () => String((client as any).observacoes ?? ""),
    [client]
  );

  const [notes, setNotes] = useState<string>(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const hasNotes = notes.trim().length > 0;


  async function saveNotes(text: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id_cliente: client.id_cliente, observacoes: text }),
    });

    // tenta ler json/text pra mostrar o motivo
    const raw = await res.text();
    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch {}

    if (!res.ok) {
      console.error("notes save failed", { status: res.status, raw, payload });
      throw new Error(payload?.error || `Falha ao salvar observações (HTTP ${res.status})`);
    }

    // atualiza UI local (e usa o valor retornado se existir)
    const saved = payload?.data?.observacoes ?? text;
    setNotes(saved);
  }




  return (
    <div
      className={[
        "rounded-2xl bg-white border border-gray-200",
        "border-l-4",
        ui.stripe,
        "p-3 shadow-sm hover:shadow-md transition",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className={["mt-1.5 h-2.5 w-2.5 rounded-full", ui.dot].join(" ")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {client.id_cliente} {client.Cliente}
            </p>

            {showUndo && (
              <button
                onClick={onUndoContacted}
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              >
                Desfazer
              </button>
            )}
          </div>

          <p className="mt-0.5 text-[11px] text-gray-500 truncate">
            {client.Cidade} • Limite: {moneyFormatter.format(client.Limite)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1">
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                "ring-1 ring-inset",
                ui.badge,
              ].join(" ")}
            >
              Sem compra: {daysNoBuy === null ? "—" : `${daysNoBuy} dias`}
            </span>

            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
              {contactLabel}: {contactDate ? formatLocalVeryShort(contactDate) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={handleSend}
          disabled={!hasPhone}
          className={[
            "rounded-lg px-4 py-1.5 text-[11px] font-semibold transition",
            "ring-1 ring-inset",
            hasPhone ? ui.btn : "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed",
          ].join(" ")}
        >
          Mensagem
        </button>

        <button
          onClick={onMarkContacted}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition bg-white text-gray-800 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
        >
          {primaryLabel}
          <SquareCheckBig size={14} />
        </button>

        {showSnooze && (
          <button
            onClick={onOpenCalendar}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-800"
            title="Cliente pediu pausa (7/15/30 dias)"
          >
            <AlarmClockOff size={14} />
          </button>
        )}

        <button
          onClick={() => setNotesOpen(true)}
          className={[
            "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
            "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-800",
          ].join(" ")}
          title={hasNotes ? "Ver/editar observações" : "Adicionar observação"}
        >
          <NotebookPen size={14} />
          {hasNotes && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      <PhonePickerModal
        open={open}
        onClose={() => setOpen(false)}
        clientName={client.Cliente}
        options={phoneOptions}
        onPick={pickPhone}
      />

      <NotesModal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        clientName={client.Cliente}
        initialText={notes}
        onSave={saveNotes}
      />
    </div>
  );

}
