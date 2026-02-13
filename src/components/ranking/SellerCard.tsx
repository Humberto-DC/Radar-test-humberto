"use client";

import React from "react";
import type { RankingSellerRow } from "@/app/(app)/ranking/page";
import  StatGroup  from "./StatGroup"
import WalletStatGroup from "./WalletStatGroup";
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "month" | "week" | "neutral";
}) {
  const cls =
    tone === "month" || "week"
      ? "text-[#43ce43] bg-[#80ef80]/15 border-[#80ef80]"
      : "text-slate-600 bg-slate-50 border-slate-100";

  return (
    <span
      className={[
        "text-[11px] font-semibold border px-2 py-0.5 rounded-full whitespace-nowrap",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}


export default function SellerCard({
  row,
  rank,
}: {
  row: RankingSellerRow;
  rank: number;
}) {
  const weeklyPct = Number.isFinite(row.weekly_pct_achieved)
    ? row.weekly_pct_achieved
    : 0;
  const monthlyPct = Number.isFinite(row.pct_achieved) ? row.pct_achieved : 0;

  const weeklyHit = row.weekly_meta > 0 && row.weekly_realized >= row.weekly_meta;
  const monthlyHit = row.goal_meta > 0 && row.net_sales >= row.goal_meta;

  const monthlyMissing = Math.max(0, row.goal_meta - row.net_sales);


  // badges semana: 100% ✓ (100-109.999...) / 110% ✓ (>=110)
const weekBadge = weeklyHit ? { text: "Semana ✓" } : null;

const monthBadge =
  monthlyPct >= 110
    ? { text: "Mês 110% ✓" }
    : monthlyPct >= 100
    ? { text: "Mês 100% ✓" }
    : null;

  return (
    <div className="group rounded-2xl bg-white sm:px-2 sm:py-1 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      {/* GRID que alinha com o header */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_1fr_1fr] gap-6 items-stretch">
        
        {/* VENDEDOR */}
        <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
          <div className="relative shrink-0">
            {rank <= 3 && (
              <div
                className={[
                  "absolute -top-3 left-1/2 -translate-x-1/2",
                  "text-[20px] leading-none",
                  rank === 1 ? "drop-shadow-sm" : "opacity-90",
                ].join(" ")}
                aria-hidden
                title="Top 3"
              >
                👑
              </div>
            )}

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-xl font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              {rank}°
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-800">
              {(row.seller_name ?? "Sem nome").toUpperCase()}
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              {weekBadge && <Badge tone="week">{weekBadge.text}</Badge>}
              {monthBadge && <Badge tone="month">{monthBadge.text}</Badge>}
            </div>
          </div>
        </div>

        {/* SEMANA */}
        <div className="md:pl-0">
          <StatGroup
            label="" 
            meta={row.weekly_meta}
            realized={row.weekly_realized}
            missing={row.weekly_missing_value}
            pct={weeklyPct}
            hit={weeklyHit}
            bonus={row.weekly_bonus}
          />
        </div>

        {/* MÊS */}
        <div className="md:relative md:pl-6 md:before:content-[''] md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-12 md:before:w-px md:before:bg-slate-100">
          <StatGroup
            label="Metas Mês" 
            meta={row.goal_meta}
            realized={row.net_sales}
            missing={monthlyMissing}
            pct={monthlyPct}
            hit={monthlyHit}
          />
        </div>

        {/* POSITIVAÇÃO */}
        <div className="md:relative md:pl-0 md:before:content-[''] md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-12 md:before:w-px md:before:bg-slate-100">
          <WalletStatGroup
            label="" 
            pct={row.wallet_positive_pct}
            total={row.wallet_total}
            positiveMonth={row.wallet_positive_month}
            needMessage={row.need_message}
            followUp={row.follow_up}
            openBudgets={row.open_budgets}
          />
        </div>
      </div>
    </div>
  );

}
