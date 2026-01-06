// components/home/HomeClient.tsx
"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import ChecklistBoard from "./ChecklistBoard";
import { getBoardColumn, sortByUrgency } from "@/lib/checklistRules";

type Props = { clients: ClienteComContatos[] };

export default function HomeClient({ clients }: Props) {
  const [localClients, setLocalClients] = useState(clients);
  const [prevInteractionMap, setPrevInteractionMap] = useState<Record<number, string | null>>({});

  const buckets = useMemo(() => {
    const needs: ClienteComContatos[] = [];
    const contacted: ClienteComContatos[] = [];
    const ok: ClienteComContatos[] = [];

    for (const c of localClients) {
      const col = getBoardColumn(c);
      if (col === "needs_message") needs.push(c);
      else if (col === "contacted_no_sale") contacted.push(c);
      else ok.push(c);
    }

    needs.sort(sortByUrgency);
    contacted.sort(sortByUrgency);
    ok.sort(sortByUrgency);

    return { needs, contacted, ok };
  }, [localClients]);

  async function markContacted(clientId: number) {
    const nowIso = new Date().toISOString();
    const current = localClients.find((c) => c.id_cliente === clientId)?.ultima_interacao ?? null;

    setPrevInteractionMap((m) => (m[clientId] !== undefined ? m : { ...m, [clientId]: current }));

    setLocalClients((p) =>
      p.map((c) => (c.id_cliente === clientId ? { ...c, ultima_interacao: nowIso } : c))
    );

    try {
      const res = await fetch("/api/interactions/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalClients((p) =>
        p.map((c) => (c.id_cliente === clientId ? { ...c, ultima_interacao: current } : c))
      );
      setPrevInteractionMap((m) => {
        const copy = { ...m };
        delete copy[clientId];
        return copy;
      });
      alert("Não foi possível marcar como contatado.");
    }
  }

  async function undoContacted(clientId: number) {
    const restore = prevInteractionMap[clientId] ?? null;

    setLocalClients((p) =>
      p.map((c) => (c.id_cliente === clientId ? { ...c, ultima_interacao: restore } : c))
    );

    try {
      const res = await fetch("/api/interactions/unmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId, restore_ultima_interacao: restore }),
      });
      if (!res.ok) throw new Error();

      setPrevInteractionMap((m) => {
        const copy = { ...m };
        delete copy[clientId];
        return copy;
      });
    } catch {
      alert("Não foi possível desfazer.");
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      <div className="mx-auto h-full w-full max-w-screen-2xl px-3 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">
        <ChecklistBoard
          needs={buckets.needs}
          contacted={buckets.contacted}
          ok={buckets.ok}
          onMarkContacted={markContacted}
          onUndoContacted={undoContacted}
          canUndoMap={prevInteractionMap}
        />
      </div>
    </div>
  );
}
