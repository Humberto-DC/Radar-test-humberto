"use client";

import { useEffect, useState } from "react";
import { Message } from "./types";

type Props = {
  messages: Message[];
  searchQuery: string;
  selectedMessageID?: string;
  onSelectMessage?: (id: string) => void;
};

export default function MessagesCardsList({
  messages,
  searchQuery,
  selectedMessageID,
  onSelectMessage,
}: Props) {
  const [localSelected, setLocalSelected] = useState<string>(selectedMessageID ?? "");

  useEffect(() => {
    if (selectedMessageID !== undefined) setLocalSelected(selectedMessageID);
  }, [selectedMessageID]);

  const filtered = messages
  .filter((m) => (m.status ?? "").toLowerCase() === "approved")
  .filter((m) =>
    m.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.texto.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setLocalSelected(id);
    onSelectMessage?.(id);
  };

  return (
    <section className="rounded-xl bg-white shadow-md p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Mensagens</h3>
        <span className="text-xs text-slate-500">{filtered.length}</span>
      </header>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Nenhuma mensagem encontrada.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => {
            const isSelected = localSelected === m.id_mensagem;

            return (
              <li
                key={m.id_mensagem}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => handleSelect(m.id_mensagem)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(m.id_mensagem);
                  }
                }}
                className={`rounded-lg border p-3 transition 
                  cursor-pointer outline-none
                  ${isSelected
                    ? "border-blue-400 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50"
                  }
                `}
              >
                {/* TÍTULO */}
                <div className="text-[13px] font-semibold text-slate-800 truncate">
                  {m.titulo}
                </div>

                {/* CATEGORIA */}
                <div className="mt-0.5 text-[12px] text-slate-500">
                  {m.categoria}
                </div>

                {/* TEXTO */}
                <div className="mt-2 text-[12px] text-slate-600 line-clamp-2">
                  {m.texto}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
