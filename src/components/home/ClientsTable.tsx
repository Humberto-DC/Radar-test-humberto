"use client";
import { useEffect, useMemo, useRef } from "react";
import { Client, SelectedMap } from "./types";
import { daysSince, keyOf, cleanName } from "./utils";

type Props = {
  clients: Client[];
  selectedMap: SelectedMap;
  onToggle: (id: string | number) => void;
  allFilteredSelected: boolean;
  onToggleSelectAll: () => void;

  // vindo do HomeClient
  phoneByClientId: Record<string, string>; // clientKey -> phoneNorm
  selectedPhoneOwner: Map<string, string>; // phoneNorm -> clientKey (dono)
};

export default function ClientsTable({
  clients,
  selectedMap,
  onToggle,
  allFilteredSelected,
  onToggleSelectAll,
  phoneByClientId,
  selectedPhoneOwner,
}: Props) {
  const masterRef = useRef<HTMLInputElement>(null);
  const checkedAll = Boolean(allFilteredSelected);

  // conta apenas clientes ATIVOS selecionados
  const selectedCount = useMemo(
    () =>
      clients.filter((c) => c.ativo && !!selectedMap[keyOf(c.id_cliente)]).length,
    [clients, selectedMap]
  );

  const someSelected = selectedCount > 0 && !checkedAll;

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const moneyFormatter = new Intl.NumberFormat("pt-BR");

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-700">
          Clientes filtrados
        </h3>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            ref={masterRef}
            type="checkbox"
            checked={checkedAll}
            onChange={onToggleSelectAll}
          />
          <span>
            Selecionar todos ({selectedCount}/{clients.length})
          </span>
        </label>
      </div>

      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm text-gray-600 table-fixed">
          <colgroup>
            <col className="w-7" />        {/* checkbox */}
            <col className="w-[25%]" />    {/* Nome */}
            <col className="w-[15%]" />    {/* Limite */}
            <col className="w-[15%]" />    {/* Última compra */}
            <col className="w-[15%]" />    {/* Última interação */}
            <col className="w-[15%]" />    {/* Vendedor */}
            <col className="w-[15%]" />    {/* Status */}
          </colgroup>

          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 w-10" aria-label="Selecionar cliente"></th>
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Limite de Crédito</th>
              <th className="p-2 text-left">Última compra</th>
              <th className="p-2 text-left">Última interação</th>
              <th className="p-2 text-left">Vendedor</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((c) => {
              const k = keyOf(c.id_cliente);
              const checked = !!selectedMap[k];
              const isActive = c.ativo === true;

              // ⚠️ NÃO MEXI NA SUA LÓGICA DE DATAS
              const diasCompra = daysSince(c.data_ultima_compra);
              const textoCompra = Number.isFinite(diasCompra)
                ? `${diasCompra} dias`
                : "—";

              const diasInteracao = daysSince(c.ultima_interacao);
              const textoInteracao = !c.ultima_interacao ? (
                <span className="text-gray-400 italic">Nunca</span>
              ) : Number.isFinite(diasInteracao) ? (
                `${diasInteracao} dias`
              ) : (
                <span className="text-gray-400 italic">Nunca</span>
              );

              // dedupe por telefone (vem do HomeClient)
              const phoneNorm = phoneByClientId[k] || "";
              const ownerKey = phoneNorm ? selectedPhoneOwner.get(phoneNorm) : undefined;

              const isDuplicateBlocked =
                isActive &&
                !!phoneNorm &&
                !!ownerKey &&
                ownerKey !== k &&
                !checked;

              const disabled = !isActive || isDuplicateBlocked;

              return (
                <tr
                  key={k}
                  className={`border border-gray-300 hover:bg-gray-50 ${
                    !isActive || isDuplicateBlocked ? "opacity-50" : ""
                  }`}
                  title={
                    isDuplicateBlocked
                      ? "Telefone já selecionado em outro cliente."
                      : undefined
                  }
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={checked && isActive}
                      disabled={disabled}
                      onChange={() => {
                        if (disabled) return;
                        onToggle(c.id_cliente);
                      }}
                      aria-label={`Selecionar ${c.Cliente}`}
                    />
                  </td>

                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="truncate">{c.Cliente}</span>

                      {isDuplicateBlocked && (
                        <span className="text-[11px] text-amber-700">
                          Telefone já selecionado em outro cliente
                        </span>
                      )}

                      {!phoneNorm && (
                        <span className="text-[11px] text-gray-400 italic">
                          Sem telefone cadastrado
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-2">{moneyFormatter.format(c.Limite)}</td>
                  <td className="p-2">{textoCompra}</td>
                  <td className="p-2">{textoInteracao}</td>
                  <td className="p-2">{cleanName(c.Vendedor)}</td>

                  <td className="p-2 w-24">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5
                      rounded-full text-xs font-medium max-w-full truncate 
                      ${
                        c.ativo
                          ? "bg-[#b6f01f] opacity-50 text-black"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {clients.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400">
                  Não há clientes com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
