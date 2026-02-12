"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoalsHeader from "./GoalsHeader";
import SellerGoalsCard from "./SellerGoalsCard";
import { ChevronLeft , ChevronRight} from "lucide-react";

export type WeekMetaItem = {
  label: string;        // "dd/mm — dd/mm"
  week_ini: string;     // ISO
  week_fim: string;     // ISO
  weekly_meta: number;  // R$
};

export type SellerGoalsRow = {
  seller_id: number;
  seller_name: string | null;

  monthly_meta: number;
  weekly_meta_month_accum: number;
  weekly_last3: WeekMetaItem[];

  // ✅ para editar a semana exibida (ref week = weekRefs[0])
  current_week_start: string; // ISO (yyyy-mm-dd ou ISO completo)
  current_week_end: string;   // ISO
  current_week_meta: number;  // valor atual no banco (ou 0)
};


export type GoalsHeaderData = {
  weekOffset: number;
  weekLabel: string;
  monthLabel: string;

  totalCompanyGoal: number;
  byBranch: Array<{
    empresa_id: number;
    name: string;
    goal: number;
    realized: number;
    pct: number;
  }>;



  totalWeeklyMetaMonth: number;

  totalMonthSold: number;
  totalMonthPct: number;
  totalMissing: number;
};

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

export default function GoalsEditorClient({
  header,
  sellers,
}: {
  header: GoalsHeaderData;
  sellers: SellerGoalsRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) => (s.seller_name ?? "").toLowerCase().includes(q));
  }, [sellers, query]);

  return (
    <div className="mx-auto max-w-8xl p-4 sm:p-6">
      {/* topo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div className="flex items-center gap-2">
          <Link
            href={`/ranking?weekOffset=${header.weekOffset}`}
            className="flex flex-row gap-1 rounded-xl bg-[#80ef80] px-3 py-2 text-sm font-semibold text-[#212529] hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar ao ranking
          </Link>
        </div>

        <div>
          <div className="text-xs text-gray-500">Metas</div>
          <div className="flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => {
                router.push(`/goals?weekOffset=${header.weekOffset - 1}`)
                router.refresh();
              }}
              className="rounded-xl border border-gray-200 bg-white p-1 text-[#212529]  transition hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
              aria-label="Semana anterior"
              title="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h1 className="text-lg sm:text-xl font-semibold text-[#212529]">
              {header.monthLabel} • Semana {header.weekLabel}
            </h1>

            <button
            type="button"
            onClick={() => {
              router.push(`/goals?weekOffset=${header.weekOffset + 1}`)
              router.refresh();
            }}
            className="rounded-xl border border-gray-200 bg-white p-1 text-[#212529]  transition hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
              aria-label="Semana anterior"
            >
            <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* header cards */}
      <div className="mt-4">
        <GoalsHeader header={header} />
      </div>


      {/* lista */}
      <div className="mt-4 grid gap-5 lg:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((s) => (
          <SellerGoalsCard key={`${s.seller_id}-${header.weekOffset}`} row={s} />
        ))}

        {filtered.length === 0 && (
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Nenhum vendedor encontrado.
          </div>
        )}
      </div>

    </div>
  );
}
