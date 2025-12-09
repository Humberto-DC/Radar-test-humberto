// components/clients/ClientsTable.tsx
"use client";

import type { AdminClient } from "./types";

type Props = {
  clients: AdminClient[];
  onToggleActive: (id_cliente: number, nextActive: boolean) => void;
  isSaving: boolean;
};

export default function ClientsTable({
  clients,
  onToggleActive,
  isSaving,
}: Props) {
  const moneyFormatter = new Intl.NumberFormat("pt-BR");

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">
          Lista de clientes ({clients.length})
        </h3>
        {isSaving && (
          <span className="text-xs text-gray-400">
            Salvando alterações...
          </span>
        )}
      </div>

      <div className="max-h-[480px] overflow-auto">
        <table className="w-full text-sm text-gray-600">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Cidade</th>
              <th className="p-2 text-left">Vendedor</th>
              <th className="p-2 text-left">Limite de Crédito</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const isActive = c.ativo;

              return (
                <tr
                  key={c.id_cliente}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-2">{c.Cliente}</td>
                  <td className="p-2">{c.Cidade}</td>
                  <td className="p-2">{c.Vendedor}</td>
                  <td className="p-2">
                    {moneyFormatter.format(c.Limite)}
                  </td>
                  <td className="p-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
                      ].join(" ")}
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleActive(c.id_cliente, !isActive)}
                      disabled={isSaving}
                      className={[
                        "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        isSaving ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {isActive ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {clients.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-400 text-sm"
                >
                  Nenhum cliente encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
