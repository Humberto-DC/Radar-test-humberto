// components/ranking/goals/SellerGoalCard.tsx
"use client";

import React, { useMemo } from "react";
import type { SellerGoalDraft } from "./GoalsEditorClient";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

function toNumberLoose(v: string) {
  if (!v) return 0;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function InputMoney({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  const display = useMemo(() => {
    // mantém “editável” sem máscara pesada
    return value ? String(Math.round(value)) : "";
  }, [value]);

  return (
    <input
      value={display}
      onChange={(e) => onChange(toNumberLoose(e.target.value))}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
      inputMode="numeric"
    />
  );
}

export default function SellerGoalCard({
  row,
  onChange,
}: {
  row: SellerGoalDraft;
  onChange: (patch: Partial<SellerGoalDraft>) => void;
}) {
  const weeklyOk = row.weekly_meta >= 0;
  const monthlyOk = row.monthly_meta >= 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#212529]">
            {row.seller_name ?? `Seller ${row.seller_id}`}
          </div>
          <div className="text-xs text-gray-500">ID: {row.seller_id}</div>
        </div>

        <div className="text-xs text-gray-600 sm:text-right">
          <div>Mensal: <span className="font-semibold text-[#212529]">{formatBRL(row.monthly_meta)}</span></div>
        </div>
      </div>

      <div className=" mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-gray-700">Meta semanal (R$)</div>
          <InputMoney
            value={row.weekly_meta}
            onChange={(n) => onChange({ weekly_meta: n })}
            placeholder="Ex: 25000"
          />
          {!weeklyOk && <div className="mt-1 text-[11px] text-red-600">Valor inválido.</div>}
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold text-gray-700">Meta mensal (R$)</div>
          <div>1000</div>
          {!monthlyOk && <div className="mt-1 text-[11px] text-red-600">Valor inválido.</div>}
        </div>
      </div>

    </div>
  );      
}
