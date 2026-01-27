"use client";

import type { ClienteComContatos } from "@/types/crm";
import ClientCard from "@/components/dashboard/ClientCard";

export default function OpenBudgetsRow({ clients }: { clients: ClienteComContatos[] }) {
  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#212529]">Orçamentos abertos</h2>
          <p className="text-xs text-[#495057]">Todos os orçamentos abertos do vendedor (fora/na carteira)</p>
        </div>
        <div className="text-xs font-semibold text-[#495057]">{clients.length}</div>
      </div>

      <div className="p-3 sm:p-4">
        {clients.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-[#495057]">
            Nenhum orçamento aberto 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 flex-col cols-3 pb-2 pr-2 snap-x snap-mandatory light-scrollbar">
            {clients.map((c) => (
              <div
                key={c.id_cliente}
                className="min-w-[320px] sm:min-w-90 max-w-105 snap-start"
              >
                <ClientCard
                  client={c}
                  column="budget_open"
                  canUndo={false}
                  onMarkContacted={() => {}}
                  onUndoContacted={() => {}}
                  onOpenCalendar={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
