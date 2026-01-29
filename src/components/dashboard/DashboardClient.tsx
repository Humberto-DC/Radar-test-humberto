"use client";

import type { ClienteComContatos } from "@/types/crm";
import OpenBudgetsRow from "./OpenBudgetsRow";
import BudgetAchieved from "./BudgetAchieved";
import DailyGoalCard from "./GoalsCard";
import DaysCard from "./DaysCard";
import DevolutionsCard from "./DevolutionCard";
type SellerKpiRow = {
  vendedor_id: number | string;
  vendedor: string | null;

  uteis_mes: number;
  corridos: number;
  restam: number;

  faturamento_bruto: string | number | null;
  devolucoes: string | number | null;
  venda_liquida: string | number | null;

  taxa_dev: string | null;
  meta: string | number | null;
  pct_ating: string | null;
};

function toNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // se vier como "12345.67" ok; se vier com vírgula, tenta trocar
    return Number(v.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return 0;
}
export default function DashboardClient({
  openBudgetClients,
  sellerKpis,
}: {
  openBudgetClients: ClienteComContatos[];
  sellerKpis: SellerKpiRow[];
}) {
  const kpi = sellerKpis?.[0] ?? null;

  return (
    <div>
      <div className="mx-auto w-full max-w-screen-3xl px-1 sm:px-6 md:px-8 lg:px-10 py-1 space-y-6">
        {/* Topo agora com KPIs */}
        <div className="rounded-2xl bg-white p-2">

          {!kpi ? (
            <p className="text-sm text-[#495057]">
              Sem dados de vendas no mês atual.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 lg:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <BudgetAchieved
                value={toNumber(kpi.venda_liquida)}
                target={toNumber(kpi.meta)}
                label="da meta"
              />
                <DailyGoalCard
                vendaLiquida={toNumber(kpi.venda_liquida)}
                meta={toNumber(kpi.meta)}
                uteisMes={kpi.uteis_mes ?? 0}
                corridos={kpi.corridos ?? 0}
                restam={kpi.restam ?? 0}
              />
              <DaysCard
                uteisMes={kpi.uteis_mes ?? 0}
                corridos={kpi.corridos ?? 0}
                restam={kpi.restam ?? 0}
              />
              <DevolutionsCard
                devolucoes={toNumber(kpi.devolucoes)}
                taxaDev={kpi.taxa_dev}
                faturamentoBruto={toNumber(kpi.faturamento_bruto)}
              />

              
            </div>
          )}
        </div>

        {/* ✅ Parte inferior: Orçamentos abertos (inalterado) */}
        <OpenBudgetsRow clients={openBudgetClients} />
      </div>
    </div>
  );
}
