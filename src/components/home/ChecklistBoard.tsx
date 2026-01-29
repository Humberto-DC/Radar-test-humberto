// components/home/ChecklistBoard.tsx
"use client";

import type { ClienteComContatos } from "@/types/crm";
import BoardColumn from "./BoardColumn";
import Indicators from "./Indicators";

type Props = {
  needs: ClienteComContatos[];
  contacted: ClienteComContatos[];
  budgets: ClienteComContatos[];
  ok: ClienteComContatos[];
  onMarkContacted: (id_cliente: number) => void;
  onUndoContacted: (id_cliente: number) => void;
  canUndoMap: Record<number, string | null>;
  onOpenCalendar: (client: ClienteComContatos) => void;
  nowISO: string;
};

export default function ChecklistBoard({
  needs,
  contacted,
  budgets, // ✅ add
  ok,
  onMarkContacted,
  onUndoContacted,
  canUndoMap,
  onOpenCalendar,
  nowISO,
}: Props) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0">
        <Indicators nowISO={nowISO} needs={needs} contacted={contacted} budgets={budgets} ok={ok} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
         <div className="grid gap-4 md:h-full md:grid-cols-2 md:gap-5 xl:grid-cols-4 xl:gap-6 2xl:grid-cols-4 2xl:gap-8 min-w-0 pb-4 md:pb-0">
          <BoardColumn
            title="Enviar mensagem"
            subtitle="Último contato a mais de 7 dias"
            emptyText="Nenhum cliente pendente 🎉"
            clients={needs}
            column="needs_message"
            onMarkContacted={onMarkContacted}
            onUndoContacted={onUndoContacted}
            canUndoMap={canUndoMap}
          />

          <BoardColumn
            title="Acompanhar"
            subtitle="Já contatados e ainda sem compra"
            emptyText="Nada para acompanhar agora."
            clients={contacted}
            column="contacted_no_sale"
            onMarkContacted={onMarkContacted}
            onUndoContacted={onUndoContacted}
            canUndoMap={canUndoMap}
            onOpenCalendar={onOpenCalendar}
          />

          <BoardColumn
            title="Orçamento"
            subtitle="Em negociação"
            emptyText="Nenhum orçamento em aberto."
            clients={budgets} // ✅ FIX AQUI
            column="budget_open"
            onMarkContacted={onMarkContacted}
            onUndoContacted={onUndoContacted}
            canUndoMap={canUndoMap}
            onOpenCalendar={onOpenCalendar}
          />

          <BoardColumn
            title="Vendas"
            subtitle="Vendas nos últimos 7 dias"
            emptyText="Sem compras recentes por aqui."
            clients={ok}
            column="ok"
            onMarkContacted={onMarkContacted}
            onUndoContacted={onUndoContacted}
            canUndoMap={canUndoMap}
          />
        </div>
      </div>
    </div>
  );
}
