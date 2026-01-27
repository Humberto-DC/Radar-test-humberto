"use client";

import React, { useMemo } from "react";

type Props = {
  vendaLiquida: number;    // ex: 245000
  meta: number;            // ex: 500000
  uteisMes: number;        // ex: 22
  corridos: number;        // uteis já passados
  restam: number;          // uteis restantes
};


function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function DailyGoalCard({
  vendaLiquida,
  meta,
  uteisMes,
  corridos,
  restam,
}: Props) {
  const safeMeta = meta > 0 ? meta : 0;
  const safeVenda = vendaLiquida ?? 0;

  const metaRestante = Math.max(0, safeMeta - safeVenda);
  const porDia = restam > 0 ? metaRestante / restam : metaRestante;

  const pctAting = safeMeta > 0 ? safeVenda / safeMeta : 0;
  const pctTempo = uteisMes > 0 ? corridos / uteisMes : 0;

  const status = useMemo(() => {
    // tolerância pra não ficar piscando por pouca coisa
    const diff = pctAting - pctTempo;
    if (diff >= 0.03) return { label: "Adiantado", tone: "green" as const };
    if (diff <= -0.03) return { label: "Atrasado", tone: "red" as const };
    return { label: "No ritmo", tone: "yellow" as const };
  }, [pctAting, pctTempo]);

  const toneClasses =
    status.tone === "green"
      ? "bg-green-50 text-green-700 border-green-100"
      : status.tone === "red"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-yellow-50 text-yellow-700 border-yellow-100";


  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm font-semibold text-[#212529]">Metas</div>
   
        <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${toneClasses}`}>
          {status.label}
        </div>
      </div>

      <div className="mt-4 grid gap-1 grid-cols-2 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Meta</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(safeMeta)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Vendido (líquido)</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(safeVenda)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Falta</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(metaRestante)}</div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-[#6c757d]">Vendas / dia</div>
          <div className="text-base font-semibold text-[#212529]">{formatBRL(porDia)}</div>
        </div>
      </div>

    </div>
  );
}
