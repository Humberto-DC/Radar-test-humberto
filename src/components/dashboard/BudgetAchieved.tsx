"use client";

import React, { useMemo } from "react";

type Props = {
  value: number;
  target: number;
  numSales: number;
  label?: string;
  currency?: "BRL" | "NONE";
  decimals?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatCompactBRL(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

  if (abs >= 1_000_000_000) return `${sign}R$ ${nf.format(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}R$ ${nf.format(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}R$ ${nf.format(abs / 1_000)}k`;
  return `${sign}R$ ${nf.format(abs)}`;
}

export default function BudgetAchieved({
  value,
  target,
  numSales,
  label = "da meta",
  currency = "BRL",
  decimals = 2,
}: Props) {
  const rawPct = target > 0 ? value / target : 0;

  // ✅ trava em 0..100% (visual e texto)
  const pct = clamp(rawPct, 0, 1);
  const pctText = `${(pct * 100).toFixed(decimals)}% ${label}`;

  const W = 240;
  const H = 140;
  const cx = W / 2;
  const cy = 120;
  const r = 90;

  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;

  const basePath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  const arcLen = Math.PI * r;
  const dash = arcLen * pct;        // ✅ só até 100%
  const gap = arcLen - dash;

  const valueText = useMemo(() => {
    if (currency === "BRL") return formatCompactBRL(value);
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  }, [value, currency, decimals]);

  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="w-full h-full rounded-2xl bg-white border border-gray-100 shadow-lg">
        <div className="text-sm font-semibold text-[#212529] gap-2 px-6 mt-6">
          Atingido 
        </div>
        <div className="text-sm font-light text-[#212529] gap-2 px-6">
          N° de vendas: {numSales}
        </div>

        <div className="flex items-center justify-center py-6">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            <path
              d={basePath}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="14"
              strokeLinecap="round"
            />

            <path
              d={basePath}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`}
            />

            <text
              x={cx}
              y={70}
              textAnchor="middle"
              className="fill-[#212529]"
              style={{ fontSize: 18, fontWeight: 700 }}
            >
              {valueText}
            </text>

            <text
              x={cx}
              y={92}
              textAnchor="middle"
              className="fill-[#6c757d]"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              {pctText}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
