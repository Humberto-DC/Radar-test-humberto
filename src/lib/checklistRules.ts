// lib/checklistRules.ts
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate, daysSince } from "@/lib/dates";

export type CardStatus = "danger" | "warning" | "ok";
export type BoardColumn = "needs_message" | "contacted_no_sale" | "budget_open" | "ok";

/**
 * CARD STATUS (based only on last purchase)
 */
export function getCardStatus(daysSinceLastPurchase: number | null): CardStatus {
  if (daysSinceLastPurchase === null) return "warning";
  if (daysSinceLastPurchase > 30) return "danger";
  if (daysSinceLastPurchase > 7) return "warning";
  return "ok";
}

/**
 * BOARD COLUMN RULES (priority order)
 * 1) Bought in last 7 days => ok
 * 2) Has valid open budget => budget_open
 * 3) Next interaction in the future => contacted_no_sale
 * 4) Next interaction today/past OR missing => needs_message
 */
export function getBoardColumn(client: ClienteComContatos): BoardColumn {
  const now = new Date();

  const lastPurchaseDate = parseLooseDate(client.ultima_compra);
  const daysFromLastPurchase = daysSince(lastPurchaseDate);

  if (client.tem_orcamento_aberto) {
    console.log("DEBUG budget candidate", {
      id: client.id_cliente,
      ultima_compra: client.ultima_compra,
      lastPurchaseDate,
      daysFromLastPurchase,
      tem_orcamento_aberto: client.tem_orcamento_aberto,
    });
  }


  if (daysFromLastPurchase !== null && daysFromLastPurchase <= 7) return "ok";

  if (client.tem_orcamento_aberto) return "budget_open";

  const nextInteractionDate = parseLooseDate(client.proxima_interacao);
  if (!nextInteractionDate) return "needs_message";

  if (nextInteractionDate.getTime() <= now.getTime()) return "needs_message";

  return "contacted_no_sale";
}


/**
 * SORTING
 * - If both have next_interaction => earliest first
 * - If only one has next_interaction => the one WITHOUT date first (more urgent)
 * - Fallback => longer time without purchase first
 */
export function sortByUrgency(a: ClienteComContatos, b: ClienteComContatos) {
  const aNext = parseLooseDate(a.proxima_interacao);
  const bNext = parseLooseDate(b.proxima_interacao);

  if (aNext && bNext) return aNext.getTime() - bNext.getTime();
  if (aNext && !bNext) return 1;
  if (!aNext && bNext) return -1;

  const aLastPurchase = parseLooseDate(a.ultima_compra);
  const bLastPurchase = parseLooseDate(b.ultima_compra);

  const aDays = daysSince(aLastPurchase);
  const bDays = daysSince(bLastPurchase);

  const aValue = aDays === null ? -1 : aDays;
  const bValue = bDays === null ? -1 : bDays;

  return bValue - aValue;
}