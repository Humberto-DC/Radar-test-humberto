"use client";

import React from "react";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

export default function WeekMetaRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/80 px-3 py-2">
      <div className="text-sm text-gray-700">
        <span className="text-xs text-gray-500 mr-2">Semana</span>
        <span className="font-semibold text-[#212529]">{label}</span>
      </div>

      <div className="text-sm font-semibold text-[#212529]">
        {formatBRL(value)}
      </div>
    </div>
  );
}
