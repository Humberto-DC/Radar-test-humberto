"use client";

export default function WalletStatGroup({
  label,
  pct,
  total,
  positiveMonth,
  needMessage,
  followUp,
  openBudgets,
}: {
  label: string; // ex: "CARTEIRA" / "POSITIVAÇÃO"
  pct: number; // 0-100
  total: number;
  positiveMonth: number;
  needMessage: number;
  followUp: number;
  openBudgets: number;
}) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const barPct = Math.min(Math.max(safePct, 0), 100);
  const hit = safePct >= 60;

  const shouldShowBadges = total > 0;

  return (
    <div className="flex-1 w-full h-full">
      <div className="h-full max-w-2xs mx-auto md:mx-0 md:max-w-none flex flex-col  2xl:px-10">
        <div className="min-h-14 flex items-end justify-between mb-2">
        <p className="text-lg font-black text-slate-800 leading-none tabular-nums whitespace-nowrap">
          {positiveMonth}/{total}
        </p>
          <span
            className={[
              "text-sm font-black tabular-nums whitespace-nowrap",
              hit ? "text-[#80ef80]" : "text-slate-400",
            ].join(" ")}
          >
            {safePct.toFixed(1)}%
          </span>
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
            {shouldShowBadges ? (
              <div className="flex gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Msg pendente {needMessage}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Acomp. {followUp}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Orçamneto {openBudgets}
                </span>
              </div>
            ) : (
              <span className="invisible text-[11px] px-1.5 py-0.5 rounded">
                placeholder
              </span>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
