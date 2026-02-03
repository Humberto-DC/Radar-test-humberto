"use client";

import React from "react";
import type { RankingSellerRow } from "@/app/(app)/ranking/page";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

function StatGroup({
  label,
  meta,
  realized,
  missing,
  pct,
  hit,
  bonus = 0,
  showBonusAtPct = 110,
}: {
  label: string;
  meta: number;
  realized: number;
  missing: number;
  pct: number;
  hit: boolean;
  bonus?: number;
  showBonusAtPct?: number;
}) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const barPct = Math.min(Math.max(safePct, 0), 100);

  const shouldShowBonus = safePct >= showBonusAtPct && Number.isFinite(bonus) && bonus > 0;
  const shouldShowMissing = !hit && missing > 0 && !shouldShowBonus;

  return (
    <div className="flex-1 min-w-60 h-full">
      <div className="h-full max-w-xs mx-auto md:mx-0 md:max-w-none flex flex-col">
        {/* Header (altura fixa) */}
        <div className="min-h-14 flex items-end justify-between mb-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {label}
            </p>
            <p className="text-lg font-black text-slate-800 leading-none tabular-nums whitespace-nowrap">
              {formatBRL(realized)}
            </p>
          </div>

          <div className="text-right min-w-30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Meta
            </p>
            <p className="text-sm font-bold text-slate-600 leading-none tabular-nums whitespace-nowrap">
              {formatBRL(meta)}
            </p>
          </div>
        </div>

        {/* Barra (sempre na mesma linha) */}
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={[
              "absolute top-0 left-0 h-full rounded-full transition-all duration-700",
              hit
                ? "bg-linear-to-r from-[#34da34] to-[#b8edb8]"
                : "bg-linear-to-r from-[#2323ff] to-[#2323ff]",
            ].join(" ")}
            style={{ width: `${barPct}%` }}
          />
        </div>

        {/* Espaçador fixo entre barra e footer (evita “pular” com quebra) */}
        <div className="h-2" />

        {/* Footer (altura fixa) */}
        <div className="min-h-6 flex justify-between items-center">
          <div className="min-w-0">
            {shouldShowBonus ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                Bonificação {formatBRL(bonus)}
              </span>
            ) : shouldShowMissing ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                Falta {formatBRL(missing)}
              </span>
            ) : (
              // Placeholder invisível para manter a “linha” sempre ocupada
              <span className="invisible text-[11px] px-1.5 py-0.5 rounded">
                placeholder
              </span>
            )}
          </div>

          <span
            className={[
              "text-xs font-black tabular-nums whitespace-nowrap",
              hit ? "text-[#80ef80]" : "text-slate-400",
            ].join(" ")}
          >
            {safePct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}


export { formatBRL };

export default function SellerCard({ row, rank }: { row: RankingSellerRow; rank: number }) {
  const weeklyHit = row.weekly_meta > 0 && row.weekly_realized >= row.weekly_meta;
  const weeklyPct = Number.isFinite(row.weekly_pct_achieved) ? row.weekly_pct_achieved : 0;

  const monthlyHit = row.goal_meta > 0 && row.net_sales >= row.goal_meta;
  const monthlyPct = Number.isFinite(row.pct_achieved) ? row.pct_achieved : 0;

  const monthlyMissing = Math.max(0, row.goal_meta - row.net_sales);

  return (
    <div className="group rounded-2xl bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      <div className="flex flex-col md:flex-row gap-10 md:gap-10 items-stretch">
        {/* RANK + NAME (altura consistente com o resto) */}
        <div className="flex items-center gap-4 min-w-55 w-full md:w-auto border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-xl font-black text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            #{rank}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-800">
              {(row.seller_name ?? "Sem nome").toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Vendedor(a)</p>
          </div>
        </div>

        {/* STATS */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
          <StatGroup
            label="Semana Atual"
            meta={row.weekly_meta}
            realized={row.weekly_realized}
            missing={row.weekly_missing_value}
            pct={weeklyPct}
            hit={weeklyHit}
            bonus={row.weekly_bonus}
            showBonusAtPct={110}
          />

          <div className="relative md:pl-8 md:before:content-[''] md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-12 md:before:w-px md:before:bg-slate-100">
            <StatGroup
              label="Mês Atual"
              meta={row.goal_meta}
              realized={row.net_sales}
              missing={monthlyMissing}
              pct={monthlyPct}
              hit={monthlyHit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
