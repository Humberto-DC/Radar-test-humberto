// components/history/HistoryTable.tsx
"use client";

import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import HistoryColumn from "./HistoryColumn";
import type { HistoryRow } from "./types";

type Props = {
  rows: HistoryRow[];
};

/**
 * Converte um HistoryRow em Date.
 * - Usa data_envio se existir
 * - Senão, usa created_at
 * - Se nada existir, volta Epoch (1970) para cair no final da lista
 */
function getRowKey(row: HistoryRow): string {
  // ✅ prioridade: created_at (timestamp real)
  const created = (row.created_at || "").toString().trim();
  if (created) {
    const d = new Date(created);
    if (!Number.isNaN(d.getTime())) {
      // ✅ dia LOCAL (igual o HistoryItem exibe)
      return format(d, "yyyy-MM-dd");
    }
  }

  // ✅ fallback: data_envio (date-only)
  const day = (row.data_envio || "").toString().trim();
  if (day && day.length <= 10) return day; // "YYYY-MM-DD"

  // ✅ fallback seguro (sempre parseável)
  return "1970-01-01";
}



function getRowSortTs(row: HistoryRow): number {
  if (row.created_at) {
    const t = new Date(row.created_at).getTime();
    if (!Number.isNaN(t)) return t;
  }

  if (row.data_envio) return parseISO(`${row.data_envio}T00:00:00`).getTime();

  return new Date("1970-01-01T00:00:00Z").getTime();
}
export default function HistoryTable({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => getRowSortTs(b) - getRowSortTs(a));

  const groups = new Map<string, HistoryRow[]>();
  for (const r of sorted) {
    const key = getRowKey(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const days = Array.from(groups.entries()).sort(
    ([a], [b]) => parseISO(b).getTime() - parseISO(a).getTime()
  );

  if (days.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Nenhum envio encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto overflow-y-hidden pb-2">
      <div className="flex gap-4 w-max">
        {days.map(([dateKey, items]) => {
          const d = parseISO(dateKey);

          const label = isToday(d)
            ? `Hoje · ${format(d, "dd/MM", { locale: ptBR })}`
            : isYesterday(d)
            ? `Ontem · ${format(d, "dd/MM", { locale: ptBR })}`
            : format(d, "dd/MM (eee)", { locale: ptBR });

          return (
            <div key={dateKey} className="w-72 shrink-0">
              <HistoryColumn title={label} items={items} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
