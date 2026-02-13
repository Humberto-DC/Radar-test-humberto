"use client";

import React from "react";
import type { BranchRow } from "./RankingHeader";
import BranchGoalCard from "./BranchGoalCard";
import BranchDailyCard from "./BranchDailyCard";

export default function RankingBranchRow({ rows }: { rows: BranchRow[] }) {
  if (!rows?.length) return null;

  return (
    <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-white">
      <div className="mb-2 flex items-center gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Meta por filial
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((r) => (
          <BranchGoalCard
            key={r.empresa_id}
            id={r.empresa_id}
            name={r.name}
            goal={r.goal}
            realized={r.realized}
          />
        ))}
        {rows.map((r) => (
          <BranchDailyCard
            realized={r.realized_today}
          />
          
        ))}
      </div>
    </div>
  );
}
