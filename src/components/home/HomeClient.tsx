"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import ChecklistBoard from "./ChecklistBoard";
import { parseLooseDate, daysSince, isInThisWeek, isSameLocalDay , parseLooseNumber} from "@/lib/dates";

type Props = {
  clients: ClienteComContatos[];
};

export default function HomeClient({ clients }: Props) {
  const [localClients, setLocalClients] = useState(clients);
  const [prevInteractionMap, setPrevInteractionMap] = useState<Record<number, string | null>>({});

  const { todo, doneToday } = useMemo(() => {
    const now = new Date();

    const done: ClienteComContatos[] = [];
    const toDo: ClienteComContatos[] = [];

    for (const c of localClients) {
      const lastBuy = parseLooseDate(c.ultima_compra);
      const daysNoBuy = parseLooseNumber(c.ultima_compra);


      const lastInteraction = c.ultima_interacao ? new Date(c.ultima_interacao) : null;

      const contactedThisWeek = lastInteraction ? isInThisWeek(lastInteraction) : false;
      const isDoneToday = lastInteraction ? isSameLocalDay(lastInteraction, now) : false;

      // Regras da HOME:
      // - mostra clientes que não compram há +30 dias
      // - e vendedor ainda não enviou mensagem essa semana (i.e. sem interação na semana)
      if (daysNoBuy !== null && daysNoBuy > 30 && !contactedThisWeek) {
        toDo.push(c);
      }

      // - mostra cards que ele já realizou hoje
      if (isDoneToday) done.push(c);
    }

    // Ordena: mais dias sem comprar primeiro
    toDo.sort((a, b) => {
      const da = parseLooseNumber(a.ultima_compra) ?? -1;
      const db = parseLooseNumber(b.ultima_compra) ?? -1;
      return db - da;
    });

    return { todo: toDo, doneToday: done };
  }, [localClients]);

  async function markDone(clientId: number) {
    const nowIso = new Date().toISOString();

    // pega valor atual antes de mudar
    const current = localClients.find((c) => c.id_cliente === clientId)?.ultima_interacao ?? null;

    // salva "anterior" somente se ainda não foi salvo
    setPrevInteractionMap((m) => (m[clientId] !== undefined ? m : { ...m, [clientId]: current }));

    // otimista
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
      // reverte caso falhe
      setLocalClients((p) =>
        p.map((c) => (c.id_cliente === clientId ? { ...c, ultima_interacao: current } : c))
      );
      setPrevInteractionMap((m) => {
        const copy = { ...m };
        delete copy[clientId];
        return copy;
      });
      alert("Não foi possível marcar como feito.");
    }
  }

  async function undoDone(clientId: number) {
    const restore = prevInteractionMap[clientId] ?? null;

    // otimista: restaura no UI
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

      // se deu certo, remove do map
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Clientes há +30 dias sem comprar e sem contato nesta semana.
          </p>
        </div>

       <ChecklistBoard
        todo={todo}
        doneToday={doneToday}
        onMarkDone={markDone}
        onUndoDone={undoDone}
/>

      </div>
    </div>
  );
}
