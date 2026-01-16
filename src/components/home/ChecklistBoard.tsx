// components/home/ChecklistBoard.tsx
"use client";

import type { ClienteComContatos } from "@/types/crm";
import BoardColumn from "./BoardColumn";
import Indicators from "./Indicators";

type Props = {
  needs: ClienteComContatos[];
  contacted: ClienteComContatos[];
  ok: ClienteComContatos[];
  onMarkContacted: (id_cliente: number) => void;
  onUndoContacted: (id_cliente: number) => void;
  canUndoMap: Record<number, string | null>;
  onOpenCalendar: (client: ClienteComContatos) => void;
};

export default function ChecklistBoard({
  needs,
  contacted,
  ok,
  onMarkContacted,
  onUndoContacted,
  canUndoMap,
  onOpenCalendar,
}: Props) {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Indicadores: não deve “empurrar” o board pra baixo sem controle */}
      <div className="shrink-0">
        <Indicators needs={needs} contacted={contacted} ok={ok} />
      </div>

      {/* Grid: ocupa o resto da altura e não deixa vazar */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-6 2xl:gap-12">
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
            title="Compraram (7 dias)"
            subtitle="Clientes OK"
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