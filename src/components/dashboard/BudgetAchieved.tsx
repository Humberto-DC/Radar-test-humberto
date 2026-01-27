"use client";

import React, { useMemo } from "react";

type Props = {
  value: number; // valor atual (ex: venda líquida)
  target: number; // meta
  label?: string; // ex: "da meta"
  currency?: "BRL" | "NONE";
  decimals?: number; // para value/target (normalmente 0)
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatCompactBRL(v: number) {
  // R$ 245k, R$ 1.2M etc
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
  label = "da meta",
  currency = "BRL",
  decimals = 0,
}: Props) {
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;

  // SVG geometry
  const W = 240;
  const H = 140;
  const cx = W / 2;
  const cy = 120;
  const r = 90;

  // semicircle path (from left to right)
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;

  const basePath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  // Stroke dash to “fill” the arc
  const arcLen = Math.PI * r; // semicircle length
  const dash = arcLen * pct;
  const gap = arcLen - dash;

  const valueText = useMemo(() => {
    if (currency === "BRL") return formatCompactBRL(value);
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  }, [value, currency, decimals]);

  const pctText = `${Math.round(pct * 100)}% ${label}`;

  return (
    <div className="flex flex-col justify-between gap-6">
        {/* <div className="w-full flex items-center justify-between rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="text-sm text-[#6c757d]">Meta</div>
            <div className="text-lg text-[#212529]">
                {currency === "BRL" ? formatCompactBRL(target) : target}
            </div>
        </div> */}
        <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-lg ">
        <div className="text-sm font-semibold text-[#212529] gap-2 px-6 mt-6">Atingido</div>
            <div className="mt-4 flex items-center justify-center py-6">
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
                <defs>
                    {/* gradiente parecido com o da imagem */}
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />   {/* azul */}
                    <stop offset="100%" stopColor="#22c55e" /> {/* verde */}
                    </linearGradient>
                </defs>

                {/* trilho (cinza) */}
                <path
                    d={basePath}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="14"
                    strokeLinecap="round"
                />

                {/* arco preenchido */}
                <path
                    d={basePath}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${gap}`}
                />

                {/* textos centralizados */}
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
