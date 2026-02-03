// components/ranking/SellerCard.tsx
"use client";

import React from "react";
import type { RankingSellerRow } from "@/app/(app)/ranking/page";

function StatLine({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span
        className={[
          "text-sm tabular-nums",
          emphasize ? "font-semibold text-blue-600" : "font-semibold text-slate-900",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ pct, hit }: { pct: number; hit: boolean }) {
  const barPct = clamp(Number.isFinite(pct) ? pct : 0, 0, 100);

  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
      <div
        className={[
          "h-full rounded-full transition-all",
          hit ? "bg-emerald-500" : "bg-blue-600",
        ].join(" ")}
        style={{ width: `${barPct}%` }}
      />
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

export function formatPct(v: number, decimals = 1) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(decimals)}%`;
}


export default function SellerCard({ row, rank }: { row: RankingSellerRow; rank: number }) {
  const weeklyHit = row.weekly_meta > 0 && row.weekly_realized >= row.weekly_meta;
  const weeklyBonus = row.weekly_meta > 0 && row.weekly_realized >= (row.weekly_meta * 1.1);
  const monthlyHit = row.goal_meta > 0 && row.net_sales >= row.goal_meta;

  const weeklyPct = Number.isFinite(row.weekly_pct_achieved) ? row.weekly_pct_achieved : 0;
  const monthlyPct = Number.isFinite(row.pct_achieved) ? row.pct_achieved : 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold tracking-wide text-slate-900">
            {(row.seller_name ?? "Sem nome").toUpperCase()}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Ranking <span className="font-semibold text-slate-700">#{rank}</span>
          </p>
        </div>

        <span
          className={[
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
            weeklyHit
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200",
          ].join(" ")}
        >
          {weeklyHit ? "Bateu! 🏆" : "Em andamento"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <StatLine label="Meta semana" value={formatBRL(row.weekly_meta)} />
        <StatLine label="Realizado" value={formatBRL(row.weekly_realized)} emphasize />
        <StatLine label="Ating. semana" value={formatPct(weeklyPct, 1)} />

        <ProgressBar pct={weeklyPct} hit={weeklyHit} />

        {!weeklyHit && row.weekly_missing_value > 0 ? (
          <p className="text-[11px] text-slate-500">
            Falta{" "}
            <span className="font-semibold text-slate-700">
              {formatBRL(row.weekly_missing_value)}
            </span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
        <StatLine label="Vendas mês" value={formatBRL(row.net_sales)} />

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Ating. mês
          </span>
          <span
            className={[
              "text-sm tabular-nums font-semibold",
              monthlyHit ? "text-emerald-600" : "text-slate-900",
            ].join(" ")}
          >
            {formatPct(monthlyPct, 1)}
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all",
              monthlyHit ? "bg-emerald-500" : "bg-slate-400",
            ].join(" ")}
            style={{ width: `${clamp(monthlyPct, 0, 100)}%` }}
          />
        </div>
      </div>

      {weeklyBonus && <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase text-center">
          Bonificação (0,05%)
        </div>

        <div
          className={[
            "mt-1 text-center text-lg font-extrabold tabular-nums text-emerald-600",
          ].join(" ")}
        >
          {formatBRL(row.weekly_bonus)}
        </div>
      </div>
    }
    </div>
  );
}
