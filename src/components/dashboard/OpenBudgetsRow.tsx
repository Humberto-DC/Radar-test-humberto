"use client";

import type { OpenBudgetCard } from "@/types/dashboard";
import ClientCard from "@/components/dashboard/DashboardClientCard";

export default function OpenBudgetsRow({ clients }: { clients: OpenBudgetCard[] }) {
  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#212529]">Orçamentos abertos</h2>
          <p className="text-xs text-[#495057]">
            Todos os orçamentos abertos do vendedor
          </p>
        </div>
        <div className="text-xs font-semibold text-[#495057]">{clients.length}</div>
      </div>

      <div className="p-3 sm:p-4">
        {clients.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-[#495057]">
            Nenhum orçamento aberto 🎉
          </div>
        ) : (
          <div className="grid items-stretch grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 pb-2 pr-2">
            {clients.map((c) => (
              <div
                key={`ob-${c.open_budget_id ?? "x"}-cli-${c.id_cliente}-${c.validade_orcamento_min ?? "no-date"}`}
                className="min-w-[320px] sm:min-w-90 max-w-105 h-full"
              >
                <ClientCard client={c} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
