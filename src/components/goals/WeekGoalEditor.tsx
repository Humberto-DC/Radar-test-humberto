"use client";

import React, { useMemo, useState, useEffect } from "react";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);
}

function formatShortBR(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function parseBRLToNumber(input: string) {
  const s = input.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export default function WeekMetaEditor({
  vendedorId,
  weekStartISO,
  weekEndISO,
  initialValue,
  onSaved,
}: {
  vendedorId: number;
  weekStartISO: string; // yyyy-mm-dd
  weekEndISO: string; // yyyy-mm-dd
  initialValue: number;
  onSaved?: (newValue: number) => void;
}) {
  const label = useMemo(
    () => `${formatShortBR(weekStartISO)} — ${formatShortBR(weekEndISO)}`,
    [weekStartISO, weekEndISO]
  );

  const [value, setValue] = useState<string>(() => {
    // deixa em BR-friendly, mas simples
    const v = Number.isFinite(initialValue) ? initialValue : 0;
    // mostra sem símbolo, só número formatado pt-BR
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const v = Number.isFinite(initialValue) ? initialValue : 0;
    setValue(
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v)
    );
    setError(null);
  }, [weekStartISO, weekEndISO, initialValue]); // ou só weekStartISO se preferir

  async function save() {
    setError(null);
    const n = parseBRLToNumber(value);
    if (!Number.isFinite(n) || n < 0) {
      setError("Digite um valor válido.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/week-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendedor_id: vendedorId,
          data_inicio: weekStartISO,
          data_fim: weekEndISO,
          valor_meta: n,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Falha ao salvar");
      }

      onSaved?.(n);
      // normaliza o input após salvar
      setValue(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n));
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold text-[#868E96] mb-1">
        META DA SEMANA ({label})
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-[#80ef80]/50 bg-white px-3 py-2 ring-1 ring-inset ring-[#80ef80]/20">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#212529]">R$</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              className="w-full bg-transparent outline-none text-[14px] font-semibold text-[#212529]"
              placeholder="0,00"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-60"
          title="Salvar meta semanal"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {error ? <div className="mt-1 text-[11px] text-red-600">{error}</div> : null}

      <div className="mt-1 text-[11px] text-slate-500">
        Atual: <span className="font-semibold">{formatBRL(parseBRLToNumber(value) || 0)}</span>
      </div>
    </div>
  );
}
