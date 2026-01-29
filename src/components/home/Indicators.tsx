"use client";

import { useMemo } from "react";
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate } from "@/lib/dates";
import { Users, TrendingUp, MessageCircle, Receipt, Target, CalendarCheck } from "lucide-react";

type Props = {
  needs: ClienteComContatos[];
  contacted: ClienteComContatos[];
  ok: ClienteComContatos[];
  budgets: ClienteComContatos[];
  nowISO: string;
};

function isSameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function daysRemainingInMonthInclusive(date: Date) {
  const endOfMonth = lastDayOfMonth(date);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = endOfMonth.getTime() - startOfDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // includes today
}

function isBusinessDay(date: Date) {
  const day = date.getDay(); // 0 Sun .. 6 Sat
  return day !== 0 && day !== 6;
}

function businessDaysRemainingInMonthInclusive(from: Date) {
  const endOfMonth = lastDayOfMonth(from);
  let count = 0;

  // start at the beginning of the day to avoid timezone issues
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (cursor <= endOfMonth) {
    if (isBusinessDay(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function IndicatorCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        w-full bg-white border border-gray-100 shadow-sm
        rounded-xl md:rounded-2xl
        p-2 md:p-3
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] md:text-xs font-medium text-[#495057] leading-tight">
            {title}
          </p>

          <p className="mt-0.5 md:mt-1 text-lg md:text-2xl font-semibold text-[#212529] leading-tight">
            {value}
          </p>

          {/* ✅ some no mobile, aparece no md+ */}
          {subtitle && (
            <p className="hidden md:block mt-1 text-xs text-[#868E96] truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="
            shrink-0 text-[#4C4CCF]
            rounded-lg md:rounded-xl
            p-1.5 md:p-2
            bg-[#4C4CCF]/10 ring-1 ring-inset ring-gray-200
          "
        >
          {/* ✅ controla tamanho do ícone pelo wrapper */}
          <span className="block [&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-3.75 md:[&>svg]:w-3.75`">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}


export default function Indicators({ needs, contacted, ok, budgets, nowISO }: Props) {
  const now = useMemo(() => new Date(nowISO), [nowISO]);

  const allClients = useMemo(
    () => [...needs, ...contacted, ...ok, ...budgets],
    [needs, contacted, ok, budgets]
  );

  const totalPortfolio = allClients.length;

  const soldThisMonth = useMemo(() => {
    let count = 0;

    for (const client of allClients) {
      const purchaseDate = parseLooseDate((client as any).ultima_compra);
      if (purchaseDate && isSameMonth(purchaseDate, now)) count += 1;
    }

    return count;
  }, [allClients, now]);

  const monthlyActivationPct = useMemo(() => {
    if (totalPortfolio === 0) return 0;
    return Math.round((soldThisMonth / totalPortfolio) * 100);
  }, [soldThisMonth, totalPortfolio]);

  const clientsNeedingMessage = needs.length;
  const openBudgetsCount = budgets.length;

  const targetPct = 80;
  const targetCount = useMemo(
    () => Math.ceil(totalPortfolio * (targetPct / 100)),
    [totalPortfolio]
  );

  const missingToTarget = useMemo(
    () => Math.max(0, targetCount - soldThisMonth),
    [targetCount, soldThisMonth]
  );

  // ✅ usa "now" congelado do server
  const daysRemaining = useMemo(() => daysRemainingInMonthInclusive(now), [now]);

  const perDay = useMemo(() => {
    if (missingToTarget <= 0) return 0;
    return Math.ceil(missingToTarget / Math.max(1, daysRemaining));
  }, [missingToTarget, daysRemaining]);

  const businessDaysRemaining = useMemo(
    () => businessDaysRemainingInMonthInclusive(now),
    [now]
  );

  const perBusinessDay = useMemo(() => {
    if (missingToTarget <= 0) return 0;
    return Math.ceil(missingToTarget / Math.max(1, businessDaysRemaining));
  }, [missingToTarget, businessDaysRemaining]);

  return (
    <div className="grid gap-2 md:gap-3 mb-4 md:mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <IndicatorCard
        title="Total na carteira"
        value={String(totalPortfolio)}
        subtitle="Todos clientes no painel"
        icon={<Users size={15} />}
      />

      <IndicatorCard
        title="Positivação do mês"
        value={`${monthlyActivationPct}%`}
        subtitle={`${soldThisMonth} vendas no mês`}
        icon={<TrendingUp size={15} />}
      />

      <IndicatorCard
        title="Precisa mandar mensagem"
        value={String(clientsNeedingMessage)}
        subtitle="Contato pendente"
        icon={<MessageCircle size={15} />}
      />

      <IndicatorCard
        title="Orçamentos em aberto"
        value={openBudgetsCount == null ? "—" : String(openBudgetsCount)}
        subtitle="Hot lead"
        icon={<Receipt size={15} />}
      />

      <IndicatorCard
        title="Vendas para atingir 80%"
        value={missingToTarget <= 0 ? "Atingida 🎉" : `${missingToTarget}`}
        subtitle="Vendas restantes para a meta"
        icon={<Target size={15} />}
      />

      <IndicatorCard
        title="Vendas por dia para 80%"
        value={missingToTarget <= 0 ? "—" : `${perBusinessDay}/dia`}
        subtitle={
          missingToTarget <= 0
            ? "Meta já atingida 🎉"
            : `${businessDaysRemaining} dias úteis restantes`
        }
        icon={<CalendarCheck size={15} />}
      />
    </div>
  );
}