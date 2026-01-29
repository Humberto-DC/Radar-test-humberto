"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClienteComContatos } from "@/types/crm";
import ChecklistBoard from "./ChecklistBoard";
import CalendarModal from "./CalendarModal";
import { getBoardColumn, sortByUrgency } from "@/lib/checklistRules";

type Props = { 
  clients: ClienteComContatos[];
  nowISO: string;
};

function addDaysISO(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export default function HomeClient({ clients , nowISO}: Props) {
  const [localClients, setLocalClients] = useState(clients);

  // ✅ Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<ClienteComContatos | null>(null);

  function openCalendar(client: ClienteComContatos) {
    setCalendarTarget(client);
    setCalendarOpen(true);
  }

  async function setNextInteraction(clientId: number, dateISO: string) {
    setLocalClients((prev) =>
      prev.map((c) => (c.id_cliente === clientId ? { ...c, proxima_interacao: dateISO } : c))
    );

    try {
      const res = await fetch("/api/interactions/set-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId, dateISO }),
      });

      if (!res.ok) throw new Error();

      const json = await res.json().catch(() => null);
      const serverNext = json?.data?.proxima_interacao
        ? new Date(json.data.proxima_interacao).toISOString()
        : dateISO;

      setLocalClients((prev) =>
        prev.map((c) => (c.id_cliente === clientId ? { ...c, proxima_interacao: serverNext } : c))
      );
    } catch {
      alert("Não foi possível atualizar a próxima interação.");
    }
  }

  const buckets = useMemo(() => {
    const needs: ClienteComContatos[] = [];
    const follow: ClienteComContatos[] = [];
    const budgets: ClienteComContatos[] = [];
    const ok: ClienteComContatos[] = [];


    for (const c of localClients) {
      const col = getBoardColumn(c);
      if (col === "needs_message") needs.push(c);
      else if (col === "contacted_no_sale") follow.push(c);
      else if (col === "budget_open") budgets.push(c)
      else ok.push(c);
    }

    needs.sort(sortByUrgency);
    follow.sort(sortByUrgency);
    budgets.sort(sortByUrgency)
    ok.sort(sortByUrgency);

    return { needs, follow, budgets, ok };
  }, [localClients]);

  async function markContacted(clientId: number) {
    const nowIso = new Date().toISOString();
    const nextIso = addDaysISO(7);

    setLocalClients((prev) =>
      prev.map((c) =>
        c.id_cliente === clientId
          ? { ...c, ultima_interacao: nowIso, proxima_interacao: nextIso, can_undo: true }
          : c
      )
    );

    try {
      const res = await fetch("/api/interactions/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId }),
      });

      if (!res.ok) throw new Error();

      const json = await res.json().catch(() => null);
      const serverUlt = json?.data?.ultima_interacao
        ? new Date(json.data.ultima_interacao).toISOString()
        : nowIso;

      const serverNext = json?.data?.proxima_interacao
        ? new Date(json.data.proxima_interacao).toISOString()
        : nextIso;

      setLocalClients((prev) =>
        prev.map((c) =>
          c.id_cliente === clientId
            ? { ...c, ultima_interacao: serverUlt, proxima_interacao: serverNext, can_undo: true }
            : c
        )
      );
    } catch {
      setLocalClients((prev) =>
        prev.map((c) =>
          c.id_cliente === clientId
            ? {
                ...c,
                ultima_interacao: null,
                proxima_interacao: new Date().toISOString(),
                can_undo: false,
              }
            : c
        )
      );
      alert("Não foi possível marcar como feito.");
    }
  }

  async function undoContacted(clientId: number) {
    const nowIso = new Date().toISOString();

    setLocalClients((prev) =>
      prev.map((c) =>
        c.id_cliente === clientId
          ? { ...c, ultima_interacao: null, proxima_interacao: nowIso, can_undo: false }
          : c
      )
    );

    try {
      const res = await fetch("/api/interactions/unmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: clientId }),
      });

      if (!res.ok) throw new Error();

      const json = await res.json().catch(() => null);

      const serverUlt = json?.data?.ultima_interacao
        ? new Date(json.data.ultima_interacao).toISOString()
        : null;

      const serverNext = json?.data?.proxima_interacao
        ? new Date(json.data.proxima_interacao).toISOString()
        : nowIso;

      setLocalClients((prev) =>
        prev.map((c) =>
          c.id_cliente === clientId
            ? { ...c, ultima_interacao: serverUlt, proxima_interacao: serverNext, can_undo: false }
            : c
        )
      );
    } catch {
      setLocalClients((prev) =>
        prev.map((c) => (c.id_cliente === clientId ? { ...c, can_undo: true } : c))
      );
      alert("Não foi possível desfazer.");
    }
  }

useEffect(() => {
  const openBudget = localClients.filter((c) => c.tem_orcamento_aberto);
  const inBudgetColumn = localClients.filter((c) => getBoardColumn(c) === "budget_open");
  const openBudgetButOk = localClients.filter(
    (c) => c.tem_orcamento_aberto && getBoardColumn(c) === "ok"
  );

  console.log("openBudget (has_open_budget):", openBudget.map(c => c.id_cliente));
  console.log("budget_open column:", inBudgetColumn.map(c => c.id_cliente));
  console.log("openBudget but OK (bought <=7d):", openBudgetButOk.map(c => c.id_cliente));
}, [localClients]);



  const canUndoMap = useMemo(() => {
    const m: Record<number, string | null> = {};
    for (const c of localClients) {
      if (c.can_undo) m[c.id_cliente] = "1";
    }
    return m;
  }, [localClients]);

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] overflow-hidden">
      <div className="mx-auto h-full min-h-0 w-full max-w-screen-none px-2 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">

        <ChecklistBoard
          needs={buckets.needs}
          contacted={buckets.follow}
          budgets={buckets.budgets}
          ok={buckets.ok}
          onMarkContacted={markContacted}
          onUndoContacted={undoContacted}
          canUndoMap={canUndoMap}
          onOpenCalendar={openCalendar}
          nowISO={nowISO}
        />
      </div>

      <CalendarModal
        open={calendarOpen}
        onClose={() => {
          setCalendarOpen(false);
          setCalendarTarget(null);
        }}
        clientName={calendarTarget?.Cliente}
        onConfirm={(dateISO: string) => {
          const id = calendarTarget?.id_cliente;
          setCalendarOpen(false);
          setCalendarTarget(null);
          if (!id) return;
          setNextInteraction(id, dateISO);
        }}
      />
    </div>
  );
}
