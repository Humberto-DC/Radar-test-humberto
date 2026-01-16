// lib/checklistRules.ts
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate, daysSince } from "@/lib/dates";

export type CardStatus = "danger" | "warning" | "ok";
export type BoardColumn = "needs_message" | "contacted_no_sale" | "ok";

/**
 * STATUS DO CARD (baseado apenas em compra)
 */
export function getCardStatus(daysSinceLastPurchase: number | null): CardStatus {
  if (daysSinceLastPurchase === null) return "warning";
  if (daysSinceLastPurchase > 30) return "danger";
  if (daysSinceLastPurchase > 7) return "warning";
  return "ok";
}

/**
 * DEFINIÇÃO DA COLUNA DO BOARD
 *
 * Nomes alinhados com o SQL:
 * - ultima_interacao
 * - proxima_interacao
 * - cliente_id
 * - observacoes
 */
export function getBoardColumn(client: ClienteComContatos): BoardColumn {
  const now = new Date();

  const lastPurchaseDays = daysSince(parseLooseDate(client.ultima_compra as any));

  // 🟩 COLUNA 3 — comprou recentemente
  if (lastPurchaseDays !== null && lastPurchaseDays <= 7) return "ok";

  const proximaInteracao = parseLooseDate((client as any).proxima_interacao);

  // Sem próxima interação => precisa mensagem
  if (!proximaInteracao) return "needs_message";

  // 🟦 COLUNA 1 — próxima interação é hoje ou já passou
  if (proximaInteracao.getTime() <= now.getTime()) return "needs_message";

  // 🟨 COLUNA 2 — próxima interação futura
  return "contacted_no_sale";
}

/**
 * ORDENAÇÃO
 * - Coluna 2: quanto mais perto a proxima_interacao, mais pra cima
 * - Outras colunas: por tempo sem compra (mais tempo => mais urgente)
 */
export function sortByUrgency(a: ClienteComContatos, b: ClienteComContatos) {
  const aProx = parseLooseDate((a as any).proxima_interacao);
  const bProx = parseLooseDate((b as any).proxima_interacao);

  // Ambos têm próxima interação => ordenar por data (mais próximo primeiro)
  if (aProx && bProx) return aProx.getTime() - bProx.getTime();

  // Quem tem data vai depois/antes? (eu prefiro: quem tem data futura fica depois da urgência)
  if (aProx && !bProx) return 1;
  if (!aProx && bProx) return -1;

  // Fallback: por tempo sem compra
  const aDays = daysSince(parseLooseDate(a.ultima_compra as any));
  const bDays = daysSince(parseLooseDate(b.ultima_compra as any));

  const aValue = aDays === null ? -1 : aDays;
  const bValue = bDays === null ? -1 : bDays;

  return bValue - aValue;
}
