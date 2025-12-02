// components/history/HistoryTable.tsx
"use client";

import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import HistoryColumn from "./HistoryColumn";
import type { HistoryRow } from "./types";

type Props = {
  rows: HistoryRow[];
};

function toDate(d: string) {
  // aceita "2025-11-01" ou ISO completo
  return d.length <= 10 ? parseISO(`${d}T00:00:00`) : new Date(d);
}

export default function HistoryTable({ rows }: Props) {
  // ordena do envio mais recente para o mais antigo
  const sorted = [...rows].sort((a, b) => {
    const da = toDate(a.data_envio).getTime();
    const db = toDate(b.data_envio).getTime();
    return db - da;
  });

  // agrupa por dia 
  const groups = new Map<string, HistoryRow[]>();

  for (const r of sorted) {
    const d = toDate(r.data_envio);
    const key = format(d, "yyyy-MM-dd"); // chave do grupo

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(r);
  }

  // dias ordenados do mais recente pro mais antigo
  const days = Array.from(groups.entries()).sort(
    ([a], [b]) => parseISO(b).getTime() - parseISO(a).getTime()
  );

  // nenhum envio
  if (days.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Nenhum envio encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className=" overflow-x-auto overflow-y-hidden pb-2">
      <div className="flex gap-4 min-w-max">
        {days.map(([dateKey, items]) => {
          const d = parseISO(dateKey);

          const label = isToday(d)
            ? `Hoje · ${format(d, "dd/MM", { locale: ptBR })}`
            : isYesterday(d)
            ? `Ontem · ${format(d, "dd/MM", { locale: ptBR })}`
            : format(d, "dd/MM (eee)", { locale: ptBR }); // ex: 14/11 (qui)

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
