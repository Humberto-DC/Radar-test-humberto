// components/ranking/goals/GoalsEditorClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoalsToolbar from "./GoalsToolbar";
import GoalsSummary from "./GoalsSummary";
import SellerGoalCard from "./SellerGoalCard";

export type SellerGoalDraft = {
  seller_id: number;
  seller_name: string | null;
  weekly_meta: number;  // meta semanal (R$)
  monthly_meta: number; // meta mensal (R$) - opcional
  notes?: string;
};

function toNumberLoose(v: unknown) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function GoalsEditorClient({
  weekOffset,
  weekLabel,
  initial,
}: {
  weekOffset: number;
  weekLabel: string;
  initial: SellerGoalDraft[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<SellerGoalDraft[]>(initial);
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const goal = 1000

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.seller_name ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const summary = useMemo(() => {
    const weekly = rows.reduce((acc, r) => acc + (Number.isFinite(r.weekly_meta) ? r.weekly_meta : 0), 0);
    const monthly = rows.reduce((acc, r) => acc + (Number.isFinite(r.monthly_meta) ? r.monthly_meta : 0), 0);
    return { weekly, monthly, count: rows.length };
  }, [rows]);

  function updateRow(id: number, patch: Partial<SellerGoalDraft>) {
    setRows((prev) => prev.map((r) => (r.seller_id === id ? { ...r, ...patch } : r)));
  }

  function applyBulkWeekly(value: number) {
    setRows((prev) => prev.map((r) => ({ ...r, weekly_meta: value })));
  }

  async function handleSave() {
    // ✅ Placeholder: amanhã você troca por POST real no seu endpoint
    setIsSaving(true);
    try {
      // Exemplo de payload:
      const payload = { weekOffset, weekLabel, rows };

      // amanhã: await fetch("/api/ranking/goals", { method:"POST", body: JSON.stringify(payload) ... })
      console.log("SAVE (placeholder):", payload);

      // feedback simples
      alert("Placeholder: metas preparadas para salvar (veja console).");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-gray-500">Editar metas</div>
          <h1 className="text-lg sm:text-xl font-semibold text-[#212529]">
            Semana {weekLabel}
          </h1>
          <div className="text-xs text-gray-600 mt-1">
            Ajuste as metas por vendedor. (Backend amanhã)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/ranking?weekOffset=${weekOffset}`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#212529] hover:bg-gray-50"
          >
            Voltar ao ranking
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-[#212529] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar metas"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <GoalsToolbar
          weekOffset={weekOffset}
          onPrev={() => router.push(`/ranking/metas?weekOffset=${weekOffset - 1}`)}
          onNext={() => router.push(`/ranking/metas?weekOffset=${weekOffset + 1}`)}
          query={query}
          onQueryChange={setQuery}
          onBulkWeekly={(v) => applyBulkWeekly(toNumberLoose(v))}
        />
      </div>

      <div className="mt-4">
        <GoalsSummary
          sellersCount={summary.count}
          totalWeeklyMeta={summary.weekly}
          totalMonthlyMeta={summary.monthly}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((r) => (
          <SellerGoalCard
            key={r.seller_id}
            row={r}
            onChange={(patch) => updateRow(r.seller_id, patch)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Nenhum vendedor encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
