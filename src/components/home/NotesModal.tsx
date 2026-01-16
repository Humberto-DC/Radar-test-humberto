// components/home/NotesModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  initialText?: string | null;
  onSave: (text: string) => Promise<void> | void;
};

export default function NotesModal({
  open,
  onClose,
  clientName,
  initialText,
  onSave,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText(initialText ?? "");
  }, [open, initialText]);

  const count = text.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <div className="text-xs font-medium text-gray-500">Observações</div>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {clientName ?? "Cliente"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Anote algo que precise lembrar depois.
            </p>
          </div>

          <button
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Quer orçamento do Produto X. Fazer ligação"
            className="min-h-35 w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{count}/800</span>
            <span className="hidden sm:inline">Dica: seja curto e objetivo</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(text.slice(0, 800));
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
