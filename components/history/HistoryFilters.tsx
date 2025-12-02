"use client";

import { Listbox } from "@headlessui/react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
};

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "sent", label: "Enviado" },
  { value: "failed", label: "Falhou" },
  { value: "read", label: "Lido" },
];

export default function HistoryFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: Props) {
  const selected = statusOptions.find((o) => o.value === statusFilter)!;

  return (
    <div className="bg-white p-4 flex flex-col md:flex-row gap-4 items-start md:items-end rounded-2xl">
      {/* Busca */}
      <div className="flex-1">
        <label htmlFor="search" className="block text-sm font-medium text-gray-600 mb-1">
          Buscar
        </label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cliente, telefone ou título da mensagem..."
          className="w-full border border-gray-300 text-gray-500 rounded-md p-2 focus:ring-2 focus:ring-[#b6f01f] focus:outline-none"
        />
      </div>

      {/* Filtro de status */}
      <div className="w-full md:w-48">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Status
        </label>

        <Listbox value={selected} onChange={(opt) => setStatusFilter(opt.value)}>
          <div className="relative">
            <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 text-left text-gray-600 focus:ring-2 focus:ring-[#b6f01f]">
              {selected.label}
            </Listbox.Button>

            <Listbox.Options className="absolute w-full mt-1 bg-white border rounded-md shadow-md z-10">
              {statusOptions.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  value={opt}
                  className={({ active }) =>
                    `cursor-pointer p-2 text-sm ${
                      active ? "bg-[#b6f01f] text-slate-900" : "text-slate-700"
                    }`
                  }
                >
                  {opt.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>
    </div>
  );
}
