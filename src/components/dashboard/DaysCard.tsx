"use client";

import React from "react";

type Props = {
  workdaysInMonth: number; // ex: 22
  workdaysElapsed: number; // uteis já passados
  workdaysRemaining: number; // uteis restantes
};

function StatRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
      <p className="text-sm font-normal text-slate-600">{label}</p>
      <p className="text-lg font-normal tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function DaysCard({ workdaysInMonth, workdaysElapsed, workdaysRemaining }: Props) {
  return (
    <div className="flex flex-col  gap-3 rounded-2xl bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Calendário do mês
        </h3>
        <span className="text-xs  text-slate-500">
          dias úteis
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <StatRow label="Dias úteis do mês" value={workdaysInMonth} />
        <StatRow label="Dias corridos" value={workdaysElapsed} />
        <StatRow label="Dias restantes" value={workdaysRemaining} />
      </div>
    </div>
  );
}
