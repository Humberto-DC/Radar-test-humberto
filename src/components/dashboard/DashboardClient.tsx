"use client";

import type { OpenBudgetCard, SellerKpiRow } from "@/types/dashboard";
import OpenBudgetsRow from "./OpenBudgetsRow";
import BudgetAchieved from "./BudgetAchieved";
import DailyGoalCard from "./GoalsCard";
import DaysCard from "./DaysCard";
import DevolutionsCard from "./DevolutionCard";


export default function DashboardClient({
  openBudgetClients,
  sellerKpis,
}: {
  openBudgetClients: OpenBudgetCard[];   // ✅ AQUI
  sellerKpis: SellerKpiRow[];
}) {
  const kpi = sellerKpis?.[0] ?? null;

  return (
    <div>
      <div className="mx-auto w-full max-w-screen-3xl px-1 sm:px-6 md:px-8 lg:px-10 py-1 space-y-6">
        <div className="rounded-2xl bg-white p-2">
          {!kpi ? (
            <p className="text-sm text-[#495057]">Sem dados de vendas no mês atual.</p>
          ) : (
            <div className="mt-4 grid gap-3 lg:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <BudgetAchieved
                value={kpi.net_sales}
                target={kpi.goal_meta}
                numSales={kpi.total_sales_count}
              />

              <DailyGoalCard
                netSales={kpi.net_sales}
                goal={kpi.goal_meta}
                workdaysInMonth={kpi.business_days_month}
                workdaysElapsed={kpi.business_days_elapsed}
                workdaysRemaining={kpi.business_days_remaining}
              />

              <DaysCard                 
                workdaysInMonth={kpi.business_days_month}
                workdaysElapsed={kpi.business_days_elapsed}
                workdaysRemaining={kpi.business_days_remaining} />

              <DevolutionsCard
                devolucoes={kpi.total_returns_value}
                taxaDev={kpi.return_rate_pct}
                devolutionCount={kpi.total_returns_count}
              />
            </div>
          )}
        </div>

        <OpenBudgetsRow clients={openBudgetClients} />
      </div>
    </div>
  );
}
