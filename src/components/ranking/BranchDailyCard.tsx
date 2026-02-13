"use client";

import React from "react";
import { formatBRL } from "@/components/utils";

export default function BranchDailyCard({ realized }: { realized: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:bg-white hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-lg border border-[#80ef80] bg-white px-2 text-[11px] font-semibold text-slate-700">
            Hoje
          </span>
          <span className="text-[11px] text-slate-500">Realizado</span>
        </div>

        <div className="text-[15px] font-semibold tabular-nums text-slate-900">
          {formatBRL(realized)}
        </div>
      </div>
    </div>
  );
}
