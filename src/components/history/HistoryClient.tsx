// components/history/HistoryClient.tsx
"use client";

import { useState, useMemo } from "react";
import HistoryFilters from "./HistoryFilters";
import HistoryTable from "./HistoryTable";
import QueuePanel from "./QueuePanel";
import type { HistoryRow, QueueRow } from "./types";

type Props = {
  history: HistoryRow[];
  queue: QueueRow[];
};

export default function HistoryClient({ history, queue }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // filtra apenas histórico (envios), não a fila
  const filtered = useMemo(() => {
    const s = search.toLowerCase();

    return history.filter((row) => {
      const clientName = row.clientes?.Cliente?.toLowerCase() || "";
      const title = row.mensagens?.titulo?.toLowerCase() || "";
      const phone = row.to_phone || "";

      const matchesSearch =
        clientName.includes(s) || phone.includes(s) || title.includes(s);

      const matchesStatus = statusFilter
        ? row.status_entrega === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [history, search, statusFilter]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#e6e8ef] px-4 py-6 md:px-8 md:py-1 overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-6 min-w-0">
          <HistoryFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <div className="relative w-full min-w-0">
            {/* fades só no desktop (evita ficar estranho no mobile) */}
            <div className="pointer-events-none hidden lg:block absolute left-0 top-0 h-full w-2 bg-linear-to-r from-[#e6e8ef] to-transparent z-10" />
            <div className="pointer-events-none hidden lg:block absolute right-0 top-0 h-full w-12 bg-linear-to-l from-[#e6e8ef] to-transparent" />

            <div className="w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-6 w-max min-w-full">
                <div className="w-full lg:w-[320px] shrink-0">
                  <QueuePanel queue={queue} />
                </div>

                <div className="shrink-0">
                  <HistoryTable rows={filtered} />
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </main>
  );
}
