// components/home/ChecklistBoard.tsx
"use client";

import type { ClienteComContatos } from "@/types/crm";
import BoardColumn from "./BoardColumn";

type Props = {
  needs: ClienteComContatos[];
  contacted: ClienteComContatos[];
  ok: ClienteComContatos[];
  onMarkContacted: (id_cliente: number) => void;
  onUndoContacted: (id_cliente: number) => void;
  canUndoMap: Record<number, string | null>;

  // ✅ novo
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
    <div className="h-full">
      <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-10">
        <BoardColumn
          title="Enviar mensagem"
          subtitle="Último contato > 7 dias"
          emptyText="Nenhum cliente pendente 🎉"
          clients={needs}
          column="needs_message"
          onMarkContacted={onMarkContacted}
          onUndoContacted={onUndoContacted}
          canUndoMap={canUndoMap}
        />

        <BoardColumn
          title="Acompanhar"
          subtitle="Já contatados (< 7 dias) e ainda sem compra"
          emptyText="Nada para acompanhar agora."
          clients={contacted}
          column="contacted_no_sale"
          onMarkContacted={onMarkContacted}
          onUndoContacted={onUndoContacted}
          canUndoMap={canUndoMap}
          onOpenCalendar={onOpenCalendar} // ✅ só precisa aqui (mas pode passar em todas)
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
  );
}
