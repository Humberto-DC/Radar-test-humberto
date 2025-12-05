// components/history/HistoryColumn.tsx
"use client";

import HistoryItem from "./HistoryItem";
import type { HistoryRow } from "./types";

type Props = {
  title: string;
  items: HistoryRow[];
};

export default function HistoryColumn({ title, items }: Props) {
  return (
    <section className="flex flex-col rounded-xl bg-white shadow-md p-4 max-h-[65vh]">
      <header className="mb-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="text-xs text-slate-500">{items.length}</span>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Sem envios.</p>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 light-scrollbar">
          <ul className="space-y-3">
            {items.map((r) => (
              <HistoryItem key={r.id_envio} row={r} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
