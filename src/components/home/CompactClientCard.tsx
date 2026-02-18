"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate, daysSince } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getCardStatus } from "@/lib/checklistRules";
import { NotebookPen } from "lucide-react";
import NotesModal from "./NotesModal";

type Props = {
    client: ClienteComContatos;
};

function statusUI(status: "danger" | "warning" | "ok") {
    switch (status) {
        case "danger":
            return { stripe: "border-l-[#FF676F]", dot: "bg-[#FF676F]", badge: "text-red-600 bg-red-50" };
        case "warning":
            return { stripe: "border-l-[#FFE865]", dot: "bg-[#FFE865]", badge: "text-amber-600 bg-amber-50" };
        default:
            return { stripe: "border-l-[#80ef80]", dot: "bg-[#80ef80]", badge: "text-emerald-600 bg-emerald-50" };
    }
}

export default function CompactClientCard({ client }: Props) {
    const [notesOpen, setNotesOpen] = useState(false);

    const daysNoBuy = useMemo(
        () => daysSince(parseLooseDate(client.ultima_compra as any)),
        [client.ultima_compra]
    );

    const status = useMemo(() => getCardStatus(daysNoBuy), [daysNoBuy]);
    const ui = statusUI(status);
    const orderId = client.open_budget_id || client.last_sale_orcamento_id;

    const hasNotes = (client.observacoes ?? "").trim().length > 0;

    return (
        <div className={`rounded-xl bg-white border border-slate-200 border-l-4 ${ui.stripe} p-2 shadow-sm hover:shadow-md transition-all group`}>
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                            {client.id_cliente} - {client.Cliente}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ui.badge}`}>
                            {daysNoBuy}d s/ compra
                        </span>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            PED: {orderId}
                        </span>
                        {client.validade_orcamento_min && (
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                Val: {new Date(client.validade_orcamento_min).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setNotesOpen(true)}
                        className={`p-1.5 rounded-lg relative transition-all duration-500 ${hasNotes
                            ? 'text-blue-700 bg-blue-100 border border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[pulse_1s_ease-in-out_infinite] scale-110'
                            : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        title={hasNotes ? "Ver Observação" : "Adicionar Observação"}
                    >
                        <NotebookPen size={hasNotes ? 14 : 12} className={hasNotes ? "stroke-[2.5px]" : ""} />
                        {hasNotes && (
                            <>
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping opacity-100" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-md" />
                            </>
                        )}
                    </button>
                </div>
            </div>


            <NotesModal
                open={notesOpen}
                onClose={() => setNotesOpen(false)}
                clientName={client.Cliente}
                initialText={client.observacoes || ""}
                onSave={async (text) => {
                    await fetch("/api/notes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id_cliente: client.id_cliente, observacoes: text }),
                    });
                }}
            />
        </div>
    );
}
