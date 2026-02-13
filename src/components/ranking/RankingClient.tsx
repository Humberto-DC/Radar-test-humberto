// components/ranking/RankingClient.tsx
"use client";

import React, { useMemo } from "react";
import SellerCard from "./SellerCard";
import type { RankingSellerRow } from "@/app/(app)/ranking/page";
import RankingHeader, { type BranchRow } from "./RankingHeader";


export default function RankingClient({
  weekOffset,
  weekLabel,
  monthLabel,
  totalMonthGoal,
  sellers,
  totalMonthSold,
  totalMonthPct,
  byBranch,
}: {
  weekOffset: number;
  weekLabel: string;
  monthLabel: string;
  totalMonthGoal: number;
  totalMonthSold: number;
  totalMonthPct: number;
  sellers: RankingSellerRow[];
  byBranch: BranchRow[];
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
        <RankingHeader
          weekOffset={weekOffset}
          weekLabel={weekLabel}
          monthLabel={monthLabel}
          totalMonthGoal={totalMonthGoal}
          totalMonthSold={totalMonthSold}
          totalMonthPct={totalMonthPct}
          byBranch={byBranch}
        />
        <div className="px-4 sm:px-6">
          <div className="flex flex-col gap-4 pt-4">
            {ranked.map((row, idx) => (
              <SellerCard key={row.seller_id} row={row} rank={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
