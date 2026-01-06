//components\home\ClientCard.tsx

"use client";

import type { ContatoRow } from "@/types/crm";

type Props = {
  open: boolean;
  onClose: () => void;
  clientName: string;
  contacts: ContatoRow[];
  onPick: (c: ContatoRow) => void;
};

export default function ContactPickerModal({ open, onClose, clientName, contacts, onPick }: Props) {
  if (!open) return null;

  const valid = contacts.filter((c) => !!c.telefone);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Escolher contato</p>
          <p className="text-xs text-gray-500 truncate">{clientName}</p>
        </div>

        <div className="p-2">
          {valid.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Nenhum telefone cadastrado.</div>
          ) : (
            <div className="space-y-2 p-2">
              {valid.map((c) => (
                <button
                  key={c.id_contato}
                  onClick={() => onPick(c)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {c.nome_contato}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.funcao ? `${c.funcao} • ` : ""}{c.telefone}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">Abrir</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
