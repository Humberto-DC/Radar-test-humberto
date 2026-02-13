"use client";

import Link from "next/link";
import React, { useState } from "react";
import { formatBRL, formatPct } from "@/components/utils";
import RankingBranchRow from "./RankingBranchRow";



export type BranchRow = {
  empresa_id: number;
  name: string;
  goal: number;
  realized: number;
  pct: number;
  realized_today: number; // <- novo
};


export default function RankingHeader({
  weekOffset,
  weekLabel,
  monthLabel,
  totalMonthGoal,
  totalMonthSold,
  totalMonthPct,
  byBranch,
}: {
  weekOffset: number;
  weekLabel: string;
  monthLabel: string;
  totalMonthGoal: number;
  totalMonthSold: number;
  totalMonthPct: number;
  byBranch: BranchRow[];
}) {
  const [showBranches, setShowBranches] = useState(true);

  return (
    <>
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        {/* Left */}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-[#212529]">Ranking</h1>
          <p className="text-xs text-[#495057]">
            Acompanhe o desempenho semanal e a projeção mensal.
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Link
              href="/goals"
              className="inline-flex items-center justify-center rounded-md bg-[#58da58] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 transition"
            >
              Editar metas
            </Link>

            <button
              type="button"
              onClick={() => setShowBranches((v) => !v)}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
            >
              {showBranches ? "Ocultar filiais" : "Ver filiais"}
            </button>
          </div>
        </div>

        {/* Right (KPIs + week) */}
        <div className="flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-center sm:text-left">
            <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Meta geral mês
            </div>
            <div className="text-2xl font-extrabold tabular-nums text-slate-900">
              {formatBRL(totalMonthGoal)}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">{monthLabel}</div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Realizado
            </div>
            <div className="text-2xl font-extrabold tabular-nums text-slate-400">
              {formatBRL(totalMonthSold)}
            </div>
            <div className="text-right font-bold text-sm text-[#80ef80]">
              {formatPct(totalMonthPct)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/ranking?weekOffset=${weekOffset - 1}`}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Semana anterior"
              >
                ‹
              </Link>

              <div className="text-center">
                <div className="text-[11px] font-semibold text-slate-600">Semana</div>
                <div className="text-sm font-extrabold tabular-nums text-slate-900">
                  {weekLabel}
                </div>
              </div>

              <Link
                href={`/ranking?weekOffset=${weekOffset + 1}`}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Próxima semana"
              >
                ›
              </Link>
            </div>
          </div>

        </div>       
      </div>

      {showBranches && <RankingBranchRow rows={byBranch} />}  

      <div className="sticky top-0 z-30 mt-5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gray-100 backdrop-blur">
        <div className="grid grid-cols-[280px_1fr_1fr_1fr] gap-6 items-baseline sticky">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-10">
            Vendedor
          </div>
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-10">
          Semana
          <div className="text-[11px] font-semibold text-slate-400 normal-case tracking-normal">
            {weekLabel}
            </div>
          </div>
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-12">
          Meta Mensal
          <div className="text-[11px] font-semibold text-slate-400 normal-case tracking-normal">
            {monthLabel}
          </div>
        </div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-8">
            Positivação
          <div className="text-[11px] font-semibold text-slate-400 normal-case tracking-normal">
            {monthLabel}
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
