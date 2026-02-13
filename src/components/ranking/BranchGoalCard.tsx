"use client";

import React from "react";
import { formatBRL, formatPct, clamp } from "@/components/utils";

export default function BranchGoalCard({
  id,
  name,
  goal,
  realized,
}: {
  id: number;
  name: string;
  goal: number;
  realized: number;
}) {
  const pct = goal > 0 ? (realized / goal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {name}
        </div>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
          {id}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="mt-2 text-base font-semibold tracking-tight text-[#212529]">
          {formatBRL(goal)}
        </div>
        <div className="mt-2 text-sm tracking-tight text-[#727c87]">
          Falta: {formatBRL(Math.max(goal - realized, 0))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-linear-to-r from-[#80ef80] to-[#01cf01]"
            style={{ width: `${clamp(pct, 0, 100)}%` }}
            aria-label={`Progresso ${name}`}
          />
        </div>

        <div className="text-[#80ef80] text-xs">{formatPct(pct)}</div>
      </div>
    </div>
  );
}
