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
    <section className="min-w-0 rounded-2xl bg-white shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#212529]">{title}</h2>
                <p className="text-xs text-[#495057]">{subtitle}</p>
          </div>
          <div className="text-xs font-semibold text-[#495057]">{clients.length}</div>
        </div>
      </div>

      <div className="py-3 px-2 sm:px-6 xl:px-6 space-y-3 xl:space-y-5 2xl:space-y-5 mb-3 flex-1 overflow-y-auto light-scrollbar">

        {clients.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-2 text-sm text-[#495057]">{emptyText}</div>
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
