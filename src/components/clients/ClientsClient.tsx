// components/clients/ClientsClient.tsx
"use client";

import { useMemo, useState } from "react";
import type { AdminClient } from "./types";
import ClientsTable from "./ClientsTable";

type Props = {
  clients: AdminClient[];
};

export default function ClientsClient({ clients }: Props) {
  const [items, setItems] = useState<AdminClient[]>(clients);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // filtro por nome, cidade ou vendedor
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return items;

    return items.filter((c) => {
      const name = c.Cliente.toLowerCase();
      const city = c.Cidade.toLowerCase();
      const seller = c.Vendedor.toLowerCase();
      return (
        name.includes(s) ||
        city.includes(s) ||
        seller.includes(s)
      );
    });
  }, [items, search]);

  // função para alternar active (opt-in/out)
  const handleToggleActive = async (id_cliente: number, nextActive: boolean) => {
    // update otimista no estado
    setItems((prev) =>
      prev.map((c) =>
        c.id_cliente === id_cliente ? { ...c, ativo: nextActive } : c
      )
    );

    setIsSaving(true);
    try {
      const resp = await fetch("/api/clients/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_cliente, ativo: nextActive }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.success) {
        // se der erro, reverte o estado local
        setItems((prev) =>
          prev.map((c) =>
            c.id_cliente === id_cliente ? { ...c, ativo: !nextActive } : c
          )
        );
        alert(json.error || "Falha ao atualizar cliente.");
      }
    } catch (e: any) {
      console.error("[clients] toggle error:", e);
      // reverte em caso de erro inesperado
      setItems((prev) =>
        prev.map((c) =>
          c.id_cliente === id_cliente ? { ...c, ativo: !nextActive } : c
        )
      );
      alert("Erro de rede ao atualizar cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#e6e8ef] px-4 py-6 md:px-8 md:py-1">
      <div className="max-w-7xl mx-auto my-auto">
        <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-4 bg-white shadow-lg mt-5">
          <header className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Clientes
              </h1>
              <p className="text-sm text-gray-500">
                Gerencie quais clientes podem receber mensagens (opt-in / opt-out).
              </p>
            </div>

            <div className="w-full md:w-72">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Buscar
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, cidade ou vendedor..."
                className="w-full border border-gray-300 text-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#b6f01f] focus:outline-none"
              />
            </div>
          </header>

          <ClientsTable
            clients={filtered}
            onToggleActive={handleToggleActive}
            isSaving={isSaving}
          />
        </div>
      </div>
    </main>
  );
}
