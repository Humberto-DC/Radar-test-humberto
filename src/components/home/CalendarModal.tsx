// components/home/CalendarModal.tsx
"use client";

import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  onConfirm: (dateISO: string) => void;
  initialDateISO?: string | null; // opcional (se quiser pré-selecionar)
};

type DayItem = {
  key: string; // yyyy-mm-dd
  iso: string; // ISO string (meio-dia local)
  weekdayIndex: number; // 0..6 (seg..dom)
  day: number;
  monthShort: string; // "jan", "fev"
  isToday: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toISODateAtNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
// JS: 0=dom..6=sab -> queremos 0=seg..6=dom
function weekdayMon0(d: Date) {
  const js = d.getDay(); // 0 dom .. 6 sab
  return (js + 6) % 7; // seg=0 ... dom=6
}

export default function CalendarModal({
  open,
  onClose,
  clientName,
  onConfirm,
  initialDateISO,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDay = useMemo(() => addDays(today, 29), [today]);

  const days = useMemo<DayItem[]>(() => {
    const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" });

    const items: DayItem[] = [];
    for (let i = 1; i < 30; i++) {
      const d = addDays(today, i);
      items.push({
        key: toYYYYMMDD(d),
        iso: toISODateAtNoon(d),
        weekdayIndex: weekdayMon0(d),
        day: d.getDate(),
        monthShort: fmtMonth.format(d).replace(".", ""),
        isToday: i === 0,
      });
    }
    return items;
  }, [today]);

  const initialKey = useMemo(() => {
    if (!initialDateISO) return "";
    const d = new Date(initialDateISO);
    if (Number.isNaN(d.getTime())) return "";
    const k = toYYYYMMDD(d);
    // só pré-seleciona se estiver na janela de 30 dias
    if (k < toYYYYMMDD(today) || k > toYYYYMMDD(maxDay)) return "";
    return k;
  }, [initialDateISO, today, maxDay]);

  const [selectedKey, setSelectedKey] = useState<string>(initialKey);

  const selected = useMemo(() => days.find((x) => x.key === selectedKey) ?? null, [days, selectedKey]);

  const weekdayLabels = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

  // alinhar a primeira semana: coloca "vazios" antes do primeiro dia
  const leadingBlanks = days[0]?.weekdayIndex ?? 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Agendar retorno</h2>
            <p className="mt-1 text-sm text-gray-600">
              Escolha uma data em até <strong>30 dias</strong> para o próximo contato com {" "}
              <strong>{clientName ?? "o cliente"}</strong>.
            </p>
          </div>

          <button
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            onClick={() => {
              setSelectedKey(initialKey || "");
              onClose();
            }}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Cabeçalho da semana */}
        <div className="mt-4 grid grid-cols-7 gap-2 px-1">
          {weekdayLabels.map((w) => (
            <div key={w} className="text-center text-xs font-medium text-gray-500">
              {w}
            </div>
          ))}
        </div>

        {/* Grade */}
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, idx) => (
            <div key={`blank-${idx}`} />
          ))}

          {days.map((d) => {
            const active = d.key === selectedKey;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedKey(d.key)}
                className={[
                  "relative rounded-xl border text-center transition",
                  "h-12", // tamanho uniforme
                  active ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >

                <div className="mt-0.5 text-lg font-semibold leading-none text-gray-900">
                  {d.day}
                </div>
              </button>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="mt-5 flex justify-end gap-3">


          <div className="flex gap-2">
            <button
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              onClick={() => {
                setSelectedKey(initialKey || "");
                onClose();
              }}
            >
              Cancelar
            </button>

            <button
              disabled={!selected}
              className="rounded-md bg-[#2323ff] px-4 py-1.5 text-sm text-white disabled:opacity-60"
              onClick={() => {
                if (!selected) return;
                onConfirm(selected.iso);
                setSelectedKey("");
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
