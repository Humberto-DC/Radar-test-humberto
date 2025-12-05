// components/history/HistoryClient.tsx
"use client";

import { useState, useMemo } from "react";
import HistoryFilters from "./HistoryFilters";
import HistoryTable from "./HistoryTable";
import type { HistoryRow } from "./types";

type Props = {
  history: HistoryRow[];
};

export default function HistoryClient({ history }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return history.filter((row) => {
      const s = search.toLowerCase();
      const matchesSearch =
        row.clientes?.nome?.toLowerCase().includes(s) ||
        row.to_phone?.includes(s) ||
        row.mensagens?.titulo?.toLowerCase().includes(s);

      const matchesStatus = statusFilter
        ? row.status_entrega === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [history, search, statusFilter]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#e6e8ef] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-8xl mx-auto my-auto">
        <div className=" rounded-2xl p-4 md:p-6 flex flex-col gap-6">
          <HistoryFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <HistoryTable rows={filtered} />
        </div>
      </div>
    </main>
  );
}
