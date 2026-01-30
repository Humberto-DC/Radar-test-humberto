"use client";

import React, { useMemo } from "react";

type Props = {
  netSales: number;
  goal: number;

  workdaysInMonth: number;
  workdaysElapsed: number;
  workdaysRemaining: number;
};

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
}

export default function DailyGoalCard({
  netSales,
  goal,
  workdaysInMonth,
  workdaysElapsed,
  workdaysRemaining,
}: Props) {
  const safeGoal = goal > 0 ? goal : 0;
  const safeNetSales = netSales ?? 0;

  const remainingGoal = Math.max(0, safeGoal - safeNetSales);
  const perDay = workdaysRemaining > 0 ? remainingGoal / workdaysRemaining : remainingGoal;

  const pctAchieved = safeGoal > 0 ? safeNetSales / safeGoal : 0;
  const pctTime = workdaysInMonth > 0 ? workdaysElapsed / workdaysInMonth : 0;

  const status = useMemo(() => {
    const diff = pctAchieved - pctTime;
    if (diff >= 0.03) return { label: "Adiantado", tone: "green" as const };
    if (diff <= -0.03) return { label: "Atrasado", tone: "red" as const };
    return { label: "No ritmo", tone: "yellow" as const };
  }, [pctAchieved, pctTime]);

  const toneClasses =
    status.tone === "green"
      ? "bg-green-50 text-green-700 border-green-100"
      : status.tone === "red"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-yellow-50 text-yellow-700 border-yellow-100";

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm font-semibold text-[#212529]">Metas</div>
        <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${toneClasses}`}>
          {status.label}
        </div>
      </div>

      <div className="mt-4 grid gap-1 grid-cols-2 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Meta</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(safeGoal)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Vendido (líquido)</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(safeNetSales)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Falta</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(remainingGoal)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Vendas / dia</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(perDay)}</div>
        </div>
      </div>
    </div>
  );
}
