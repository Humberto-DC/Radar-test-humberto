"use client";

import React, { useMemo } from "react";

type Props = {
  monthly_meta: number;
  monthly_realized: number;
  monthly_pct_achieved: number; // 0-100+ (pode vir > 110)
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

export default function MonthGoalCard({
  monthly_meta,
  monthly_realized,
  monthly_pct_achieved,
}: Props) {
  const pct = Number.isFinite(monthly_pct_achieved) ? monthly_pct_achieved : 0;

  const hit100 = monthly_meta > 0 && monthly_realized >= monthly_meta;
  const hit110 = monthly_meta > 0 && monthly_realized >= monthly_meta * 1.1;

  const missingTo100 = Math.max(0, monthly_meta - monthly_realized);
  const missingTo110 = Math.max(0, monthly_meta * 1.1 - monthly_realized);

  // Antes de 100%: barra 0..100
  const barTo100 = useMemo(() => clamp(pct, 0, 100), [pct]);

  // Depois de 100%: barra base fica 100% cheia
  // e a “ponta” (10%) vai enchendo conforme 100..110
  const superFillPct = useMemo(() => {
    if (!hit100) return 0;
    // progresso dentro do intervalo 100..110
    const within = clamp(pct - 100, 0, 10); // 0..10
    return (within / 10) * 100; // 0..100 do segmento ouro
  }, [pct, hit100]);

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Meta do mês</h3>

        <span
          className={[
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
            hit110
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : hit100
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200",
          ].join(" ")}
        >
          {hit110 ? "Super meta! 👑" : hit100 ? "Meta batida! ✅" : "Em andamento"}
        </span>
      </div>

      {/* Meta / Realizado */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatRow label="Meta" value={formatBRL(monthly_meta)} />
        <StatRow label="Realizado" value={formatBRL(monthly_realized)} emphasize />
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

        {/* Barra */}
        <div className="relative h-2.5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
        {(() => {
            // 0..110 (cap)
            const capped = clamp(pct, 0, 110);

            // Barra total agora representa 110%
            const fill110 = (capped / 110) * 100; // 0..100%

            // Progresso dentro do trecho 100..110 para pintar ouro
            const within = clamp(capped - 100, 0, 10); // 0..10
            const superFill = (within / 10) * 100; // 0..100 do trecho ouro

            return (
            <>
                {/* Fill "geral" até 110 (fica verde até o ponto atingido) */}
                <div
                className={[
                    "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                    hit100 ? "bg-[#80ef80]" : "bg-blue-600",
                ].join(" ")}
                style={{ width: `${hit100 ? fill110 : clamp(pct, 0, 100)}%` }}
                />

                {/* Trecho final (100..110) — fundo cinza + preenchimento ouro */}
                {hit100 && (
                <div className="absolute right-0 top-0 h-full w-[9.0909%] bg-slate-200/70">
                    {/* 10/110 = 9.0909% */}
                    <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${superFill}%` }}
                    />
                </div>
                )}
            </>
            );
        })()}
</div>

        {/* Gamificação após 100% */}
        {hit100 ? (
          <div className="mt-2">
            <div className="flex justify-end leading-none">👑</div>
            {!hit110 ? (
              <p className="text-xs text-slate-600">
                Faltam <b>{formatBRL(missingTo110)}</b> para você atingir a{" "}
                <b className="text-amber-500">super meta (110%)</b>!
              </p>
            ) : (
              <p className="text-xs text-amber-500 font-semibold">
                Você atingiu a super meta! 🏆
              </p>
            )}
          </div>
        ) : (
          // Antes de 100%
          monthly_meta > 0 && missingTo100 > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Falta <b>{formatBRL(missingTo100)}</b> para bater 100%.
            </p>
          ) : null
        )}
      </div>
    </div>
  );
}
