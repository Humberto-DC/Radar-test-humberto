"use client";

import { useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import ChecklistBoard from "./ChecklistBoard";
import { getBoardColumn, sortByUrgency } from "@/lib/checklistRules";

type Props = { clients: ClienteComContatos[] };

export default function HomeClient({ clients }: Props) {
  const [localClients, setLocalClients] = useState(clients);

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

    setLocalClients((prev) =>
      prev.map((c) => {
        if (c.id_cliente !== clientId) return c;

        // ✅ otimista:
        // - salva prev local (se ainda não tem) pra UI coerente
        // - marca contato agora
        // - habilita undo
        return {
          ...c,
          ultima_interacao_prev: c.ultima_interacao_prev ?? c.ultima_interacao ?? null,
          ultima_interacao: nowIso,
          can_undo: true,
        };
      })
    );

    try {
      const res = await fetch("/api/interactions/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId }),
      });

      if (!res.ok) throw new Error();

      // opcional: sincronizar com retorno do server
      const json = await res.json().catch(() => null);
      const serverUlt = json?.data?.ultima_interacao ? new Date(json.data.ultima_interacao).toISOString() : nowIso;

      setLocalClients((prev) =>
        prev.map((c) => (c.id_cliente === clientId ? { ...c, ultima_interacao: serverUlt, can_undo: true } : c))
      );
    } catch {
      // rollback simples: melhor seria refetch, mas aqui fazemos rollback conservador
      setLocalClients((prev) =>
        prev.map((c) => {
          if (c.id_cliente !== clientId) return c;
          // volta para antes
          return {
            ...c,
            ultima_interacao: c.ultima_interacao_prev ?? null,
            // como não sabemos com certeza, desabilita undo
            can_undo: false,
          };
        })
      );
      alert("Não foi possível marcar como contatado.");
    }
  }

  async function undoContacted(clientId: number) {
    // otimista: desabilita botão enquanto chama
    setLocalClients((prev) =>
      prev.map((c) => (c.id_cliente === clientId ? { ...c, can_undo: false } : c))
    );

    try {
      const res = await fetch("/api/interactions/unmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId }),
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      const restoredIso = json?.data?.ultima_interacao
        ? new Date(json.data.ultima_interacao).toISOString()
        : null;

      setLocalClients((prev) =>
        prev.map((c) =>
          c.id_cliente === clientId
            ? {
                ...c,
                ultima_interacao: restoredIso,
                // depois do undo, não há mais undo disponível
                can_undo: false,
                ultima_interacao_prev: null,
              }
            : c
        )
      );
    } catch {
      // se falhar, reabilita undo (porque provavelmente ainda é válido)
      setLocalClients((prev) =>
        prev.map((c) => (c.id_cliente === clientId ? { ...c, can_undo: true } : c))
      );
      alert("Não foi possível desfazer.");
    }
  }

  // ✅ continua compatível com seus componentes atuais
  const canUndoMap = useMemo(() => {
    const m: Record<number, string | null> = {};
    for (const c of localClients) {
      if (c.can_undo) m[c.id_cliente] = "1";
    }
    return m;
  }, [localClients]);

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      <div className="mx-auto h-full w-full max-w-screen-2xl px-3 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">
        <ChecklistBoard
          needs={buckets.needs}
          contacted={buckets.contacted}
          ok={buckets.ok}
          onMarkContacted={markContacted}
          onUndoContacted={undoContacted}
          canUndoMap={canUndoMap}
        />
      </div>
    </div>
  );
}
