"use client"

import { formatBRL }from  "@/components/utils"

export default function StatGroup({
  label,
  meta,
  realized,
  missing,
  pct,
  hit,
  bonus = 0,
}: {
  label: string;
  meta: number;
  realized: number;
  missing: number;
  pct: number;
  hit: boolean;
  bonus?: number;
}) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const MissingSuperGoal = (meta * 1.1) - realized;
  const barPct = Math.min(Math.max(safePct, 0), 100);
  const isMonth = label === "Metas Mês" 

  
  const shouldShowBonus100 =
    safePct >= 100 && Number.isFinite(bonus) && bonus > 0;
  
  const shouldShowMissing = !hit && missing > 0 && !shouldShowBonus100;

  return (
    <div className="flex-1 min-w-50 h-full">
      <div className="h-full max-w-2xs mx-auto md:mx-0 md:max-w-none flex flex-col px-5 2xl:px-3">
        <div className="min-h-14 flex items-end justify-between mb-2">
          <p className="text-lg font-black text-slate-800 leading-none tabular-nums whitespace-nowrap">
            {formatBRL(realized)}
          </p>

          <div className="text-right min-w-30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Meta
            </p>
            <p className="text-sm font-bold text-slate-600 leading-none tabular-nums whitespace-nowrap">
              {formatBRL(meta)}
            </p>
          </div>
        </div>

        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={[
              "absolute top-0 left-0 h-full rounded-full transition-all duration-700",
              hit
                ? "bg-linear-to-r from-[#80ef80] to-[#34da34]"
                : "bg-linear-to-r from-[#FFE865] to-[#fae04f]",
            ].join(" ")}
            style={{ width: `${barPct}%` }}
          />
        </div>

        <div className="h-2" />

        <div className="min-h-6 flex justify-between items-center">
          <div className="min-w-0">
            {shouldShowBonus100 ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                Bonificação {formatBRL(bonus)}
              </span>
            ) : shouldShowMissing ? (
              <div className="flex gap-3">
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {formatBRL(missing)} p/100%
                </span>
                {isMonth && <span className="text-[11px] font-semibold text-amber-400 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {formatBRL(MissingSuperGoal)} p/110%
                </span>}
              </div>
            ) : (
              <span className="invisible text-[11px] px-1.5 py-0.5 rounded">
                placeholder
              </span>
            )}
          </div>

          <span
            className={[
              "text-xs font-black tabular-nums whitespace-nowrap",
              hit ? "text-[#80ef80]" : "text-slate-400",
            ].join(" ")}
          >
            {safePct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
