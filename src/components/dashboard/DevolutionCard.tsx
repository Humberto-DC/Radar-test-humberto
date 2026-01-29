"use client";

import React, { useMemo } from "react";

type Props = {
  devolucoes: number;              // R$
  taxaDev?: string | null;         // ex "2.1" ou "2,1" ou "2.1%" ou null
  faturamentoBruto?: number;       // opcional (pra recalcular taxa se vier ruim)
};

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
}

function parsePercentLoose(v?: string | null) {
  if (!v) return null;
  const s = String(v).trim().replace("%", "");
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null; // retorna "2.1" como 2.1 (em %)
}

function StatRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
      <div className="flex flex-col">
        <p className="text-sm font-normal text-slate-600">{label}</p>
        <div className="text-xs text-slate-600">{helper}</div>
      </div>
      
        <p className="text-lg tabular-nums text-slate-900">
          {value}
        </p>
      
    </div>
  );
}

export default function DevolutionsCard({
  devolucoes,
  taxaDev,
  faturamentoBruto,
}: Props) {


  return (
    <div className="flex flex-col gap-3 rounded-2xl borde bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Devoluções</h3>
      </div>

      <div className="flex flex-col gap-2">
        <StatRow label="Total devolvido" value={formatBRL(devolucoes)} />
        <StatRow
          label="Taxa de devolução"
          value={taxaDev == null ? "—" : `${taxaDev}`}
          helper={"Qtd. de devoluções divida pela qtd. de vendas"}
        />
       
      </div>
    </div>
  );
}
