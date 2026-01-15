// components/home/BoardColumn.tsx
"use client";

import type { ClienteComContatos } from "@/types/crm";
import ClientCard from "./ClientCard";
import type { BoardColumn as Col } from "@/lib/checklistRules";

type Props = {
  title: string;
  subtitle: string;
  emptyText: string;
  clients: ClienteComContatos[];
  column: Col;
  onMarkContacted: (id_cliente: number) => void;
  onUndoContacted: (id_cliente: number) => void;
  canUndoMap: Record<number, string | null>;

  // ✅ novo
  onOpenCalendar?: (client: ClienteComContatos) => void;
};

export default function BoardColumn({
  title,
  subtitle,
  emptyText,
  clients,
  column,
  onMarkContacted,
  onUndoContacted,
  canUndoMap,
  onOpenCalendar,
}: Props) {
  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className="text-xs font-semibold text-gray-600">{clients.length}</div>
        </div>
      </div>

      <div className="py-3 px-8 space-y-3 mb-3 flex-1 overflow-y-auto light-scrollbar">
        {clients.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">{emptyText}</div>
        ) : (
          clients.map((c) => (
            <ClientCard
              key={c.id_cliente}
              client={c}
              column={column}
              canUndo={canUndoMap[c.id_cliente] !== undefined}
              onMarkContacted={() => onMarkContacted(c.id_cliente)}
              onUndoContacted={() => onUndoContacted(c.id_cliente)}
              onOpenCalendar={() => onOpenCalendar?.(c)} // ✅ novo
            />
          ))
        )}
      </div>
    </section>
  );
}
