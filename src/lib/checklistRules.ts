// lib/checklistRules.ts
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseNumber } from "@/lib/dates";

export type CardStatus = "danger" | "warning" | "ok";
export type BoardColumn = "needs_message" | "contacted_no_sale" | "ok";

export function daysSince(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getCardStatus(daysNoBuy: number | null): CardStatus {
  // regra de cor baseada em última compra:
  // >30 vermelho, 7-30 amarelo, <=7 verde
  if (daysNoBuy === null) return "warning"; // sem info: trata como crítico
  if (daysNoBuy > 30) return "danger";
  if (daysNoBuy > 7) return "warning"; // (8..30)
  return "ok"; // (0..7)
}

export function getBoardColumn(client: ClienteComContatos): BoardColumn {
  const daysNoBuy = parseLooseNumber(client.ultima_compra);
  const daysNoContact = daysSince(client.ultima_interacao);

  // Coluna 3: compraram nos últimos 7 dias
  if (daysNoBuy !== null && daysNoBuy <= 7) return "ok";

  // Coluna 2: já entrou em contato (<7 dias) mas não vendeu
  // (ou seja: não está ok, então compra > 7 ou null)
  if (daysNoContact !== null && daysNoContact < 7) return "contacted_no_sale";

  // Coluna 1: precisa mandar mensagem (último contato >7 dias ou nunca)
  return "needs_message";
}

export function sortByUrgency(
  a: ClienteComContatos,
  b: ClienteComContatos
): number {
  const da = parseLooseNumber(a.ultima_compra);
  const db = parseLooseNumber(b.ultima_compra);

  // null = menor prioridade
  const va = da === null ? -1 : da;
  const vb = db === null ? -1 : db;

  // ordem decrescente
  return vb - va;
}
