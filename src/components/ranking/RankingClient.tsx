// components/ranking/RankingClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import SellerCard from "./SellerCard";
import { formatBRL } from "./SellerCard";
import type { RankingSellerRow } from "@/app/(app)/ranking/page";

export default function RankingClient({
  weekOffset,
  weekLabel,
  totalMonthGoal,
  sellers,
}: {
  weekOffset: number;
  weekLabel: string;
  totalMonthGoal: number;
  sellers: RankingSellerRow[];
}) {
  const ranked = useMemo(() => {
    return [...sellers].sort((a, b) => {
      const ap = Number.isFinite(a.weekly_pct_achieved) ? a.weekly_pct_achieved : 0;
      const bp = Number.isFinite(b.weekly_pct_achieved) ? b.weekly_pct_achieved : 0;
      if (bp !== ap) return bp - ap;

      const ar = Number.isFinite(a.weekly_realized) ? a.weekly_realized : 0;
      const br = Number.isFinite(b.weekly_realized) ? b.weekly_realized : 0;
      if (br !== ar) return br - ar;

      const am = Number.isFinite(a.net_sales) ? a.net_sales : 0;
      const bm = Number.isFinite(b.net_sales) ? b.net_sales : 0;
      return bm - am;
    });
  }, [sellers]);

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-lg">
        <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-sm font-semibold text-[#212529]">Ranking</h1>
            <p className="text-xs text-[#495057]">
              Acompanhe o desempenho semanal e a projeção mensal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Meta geral mês
              </div>
              <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                {formatBRL(totalMonthGoal)}
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 transition"
            >
              Editar metas
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase text-center">
                Período de gestão
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
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

        <div className="border-t border-slate-100" />

        <div className="px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ranked.map((row, idx) => (
              <SellerCard key={row.seller_id} row={row} rank={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
