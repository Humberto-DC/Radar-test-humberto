"use client";

import React, { useMemo, useState } from "react";
import type { GoalsHeaderData } from "./GoalsEditorClient";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

function formatPct(v: number, decimals = 2) {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toFixed(decimals)}%`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function MiniStat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-g px-3 py-2 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div
        className={[
          "mt-0.5 text-base font-semibold tracking-tight",
          emphasize ? "text-[#00ff00]" : "text-[#212529]",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

export default function GoalsHeader({ header }: { header: GoalsHeaderData }) {
  const [showBranches, setShowBranches] = useState(false);

  const monthPct = useMemo(
    () => (Number.isFinite(header.totalMonthPct) ? header.totalMonthPct : 0),
    [header.totalMonthPct]
  );
  const barPct = useMemo(() => clamp(monthPct, 0, 100), [monthPct]);

  return (
    <div className="mb-10 grid gap-3 ">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-md shadow-[#80ef80]/50">
        <div className="relative grid gap-4 lg:grid-cols-12">
          {/* LETF (weekly highlight) */}
          <div className="lg:col-span-4">
            <div className="flex flex-col justify-between h-full rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className=" text-[11px] font-semibold tracking-wide text-gray-500 ">
                    Meta Geral 
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-[#212529]">
                    {formatBRL(header.totalCompanyGoal)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-[11px] font-semibold tracking-wide text-gray-500">
                    Meta semanal acumulada / mês
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-[#212529]">
                    {formatBRL(header.totalWeeklyMetaMonth)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBranches((v) => !v)}
                className="mt-4 inline-flex w-1/3 items-center justify-center border border-gray-200  rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-[#212529] shadow-xs transition hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
              >
                {showBranches ? "Ocultar meta por filial" : "Ver meta por filial"}
              </button>
            </div>
          </div>
          {/* rigth (main month area) */}
          <div className="lg:col-span-8 shadow-xs">

            {/* Progress block */}
            <div className=" h-full rounded-3xl border border-gray-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#212529]">
                  Progresso do mês
                </div>
                <div className="text-sm font-semibold text-[#212529]">
                  {formatPct(monthPct, 1)}
                </div>
              </div>

              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-linear-to-r from-[#80ef80] to-[#01cf01] transition-[width] duration-500 ease-out"
                  style={{ width: `${barPct}%` }}
                  aria-label="Progresso do mês"
                />
              </div>

              <div className="mt-1 text-[11px] text-gray-500">
                A barra limita em 100% apenas para visualização
              </div>

              {/* Stats aligned UNDER the bar (solves the visual distribution) */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <MiniStat
                  label="Vendido (líquido)"
                  value={formatBRL(header.totalMonthSold)}
                />
                <MiniStat
                  label="Atingido"
                  value={formatPct(header.totalMonthPct, 1)}
                  emphasize
                />
                <MiniStat
                  label="Falta"
                  value={formatBRL(header.totalMissing)}
                />
              </div>
            </div>
          </div>

 
        </div>

        {/* Branches */}
        {showBranches && (
          <div className="relative mt-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Meta por filial
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {header.byBranch.map((b) => (
                <div
                  key={b.empresa_id}
                  className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {b.name}
                    </div>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                      {b.empresa_id}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="mt-2 text-base font-semibold tracking-tight text-[#212529]">
                      {formatBRL(b.goal)}
                    </div>
                    <div  className="mt-2 text-sm tracking-tight text-[#727c87]">
                      Falta: {formatBRL(b.goal - b.realized)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-linear-to-r from-[#80ef80] to-[#01cf01]"
                        style={{
                          width: `${clamp(
                            (b.realized / (b.goal || 1)) * 100,
                            0,
                            100
                          )}%`,
                        }}
                        aria-label={`Participação da filial ${b.empresa_id}`}
                      />
                    </div>
                    <div className="text-[#80ef80] text-xs">{formatPct(b.pct)}</div>
                  </div>                 
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
