"use client";

import React, { useMemo } from "react";

type Props = {
  weekly_meta: number;
  weekly_realized: number;
  weekly_pct_achieved: number;
  weekly_missing_value: number;
  weekly_bonus: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

function formatPct(v: number, decimals = 1) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(decimals)}%`;
}

function StatRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5">
      <p className="text-xs font-normal text-slate-600">{label}</p>
      <p
        className={[
          "text-sm tabular-nums",
          emphasize ? "font-semibold text-blue-600" : "font-semibold text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export default function WeekGoalCard({
  weekly_meta,
  weekly_realized,
  weekly_pct_achieved,
  weekly_missing_value,
  weekly_bonus,
}: Props) {
  const pct = Number.isFinite(weekly_pct_achieved) ? weekly_pct_achieved : 0;
  const barPct = useMemo(() => clamp(pct, 0, 100), [pct]);

  const hit = weekly_meta > 0 && weekly_realized >= weekly_meta;

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Meta da semana</h3>

        <span
          className={[
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
            hit
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200",
          ].join(" ")}
        >
          {hit ? "Bateu! 🏆" : "Em andamento"}
        </span>
      </div>

      {/* Meta / Realizado */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatRow label="Meta" value={formatBRL(weekly_meta)} />
        <StatRow label="Realizado" value={formatBRL(weekly_realized)} emphasize />
      </div>

      {/* Atingimento */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
            Atingimento
          </p>
          <p className="text-xs font-semibold tabular-nums text-slate-900">
            {formatPct(pct, 1)}
          </p>
        </div>

        <div className="h-2.5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all",
              hit ? "bg-emerald-500" : "bg-blue-600",
            ].join(" ")}
            style={{ width: `${barPct}%` }}
          />
        </div>

        {!hit && weekly_missing_value > 0 ? (
          <p className="mt-2 text-[11px] text-slate-500">
            Falta{" "}
            <span className="font-semibold text-slate-700">
              {formatBRL(weekly_missing_value)}
            </span>
          </p>
        ) : null}
      </div>

      {/* Bonificação */}
      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase text-center">
          Bonificação (0,05%)
        </div>

        <div
          className={[
            "mt-1 text-center text-xl font-extrabold tabular-nums",
            hit ? "text-emerald-600" : "text-slate-500",
          ].join(" ")}
        >
          {formatBRL(weekly_bonus)}
        </div>

        {!hit ? (
          <div className="mt-1 text-center text-[11px] text-slate-500">
            Cálculo ao bater a meta.
          </div>
        ) : null}
      </div>
    </div>
  );
}
