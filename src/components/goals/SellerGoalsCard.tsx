"use client";

import React, { useState } from "react";
import type { SellerGoalsRow } from "./GoalsEditorClient";
import WeekMetaRow from "./WeekGoalRow";
import WeekMetaEditor from "./WeekGoalEditor";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

export default function SellerGoalsCard({ row }: { row: SellerGoalsRow }) {
  const [currentWeekMeta, setCurrentWeekMeta] = useState<number>(row.current_week_meta ?? 0);

  return (
    <div className="rounded-2xl bg-white border border-[#E9ECEF] border-l-4 border-l-[#80ef80] p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-2 pb-3 border-b border-slate-100">
        <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#80ef80]" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#212529]">
              {row.seller_name ?? `ID ${row.seller_id}`}
            </p>
            <span className="shrink-0 rounded-full bg-[#80ef80]/15 px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-inset ring-[#80ef80]/20">
              ID: {row.seller_id}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Editor da meta semanal (gerente) */}
      <WeekMetaEditor
        vendedorId={row.seller_id}
        weekStartISO={row.current_week_start}
        weekEndISO={row.current_week_end}
        initialValue={currentWeekMeta}
        onSaved={(v) => setCurrentWeekMeta(v)}
      />

      {/* Cards de métricas */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col justify-center rounded-lg bg-slate-50 p-3 border border-slate-100">
          <div className="text-[11px] font-medium text-[#868E96] mb-1">Meta mensal (sistema)</div>
          <div className="text-lg font-bold text-[#212529]">{formatBRL(row.monthly_meta)}</div>
        </div>

        <div className="flex flex-col justify-center rounded-lg bg-[#80ef80]/10 px-3 py-1 border border-[#80ef80]/20">
          <div className="text-[11px] font-medium text-[#868E96] mb-1">Semanal acumulada/mês</div>
          <div className="text-lg font-bold text-[#43ce43]">{formatBRL(row.weekly_meta_month_accum)}</div>
        </div>
      </div>

      {/* Divisor */}
      <div className="my-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <div className="text-[9px] font-semibold tracking-wide text-[#868E96]">Últimas Semanas</div>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* Lista de semanas */}
      <div className="grid gap-2">
        {row.weekly_last3.map((w, idx) => (
          <WeekMetaRow key={`${row.seller_id}-${idx}`} label={w.label} value={w.weekly_meta} />
        ))}
      </div>
    </div>
  );
}
