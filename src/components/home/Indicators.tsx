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
    <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#495057]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[#212529]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-[#868E96] truncate">{subtitle}</p>}
        </div>

        <div className="shrink-0 rounded-xl bg-gray-50 p-2 ring-1 ring-inset ring-gray-200 text-[#495057]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Indicators({ needs, contacted, ok, budgets }: Props) {
  const allClients = useMemo(() => [...needs, ...contacted, ...ok, ...budgets], [needs, contacted, ok, budgets]);
  const totalPortfolio = allClients.length;

  const soldThisMonth = useMemo(() => {
    const now = new Date();
    let count = 0;

    for (const client of allClients) {
      const purchaseDate = parseLooseDate((client as any).ultima_compra);
      if (purchaseDate && isSameMonth(purchaseDate, now)) count += 1;
    }

    return count;
  }, [allClients]);

  const monthlyActivationPct = useMemo(() => {
    if (totalPortfolio === 0) return 0;
    return Math.round((soldThisMonth / totalPortfolio) * 100);
  }, [soldThisMonth, totalPortfolio]);

  const clientsNeedingMessage = needs.length;

  // Placeholder (when you have the real metric, replace this)
  const openBudgetsCount = budgets.length;

  // ✅ 80% target
  const targetPct = 80;
  const targetCount = useMemo(() => Math.ceil(totalPortfolio * (targetPct / 100)), [totalPortfolio]);
  const missingToTarget = useMemo(() => Math.max(0, targetCount - soldThisMonth), [targetCount, soldThisMonth]);

  const daysRemaining = useMemo(() => daysRemainingInMonthInclusive(new Date()), []);
  const perDay = useMemo(() => {
    if (missingToTarget <= 0) return 0;
    return Math.ceil(missingToTarget / Math.max(1, daysRemaining));
  }, [missingToTarget, daysRemaining]);

  const businessDaysRemaining = useMemo(() => businessDaysRemainingInMonthInclusive(new Date()), []);
  const perBusinessDay = useMemo(() => {
    if (missingToTarget <= 0) return 0;
    return Math.ceil(missingToTarget / Math.max(1, businessDaysRemaining));
  }, [missingToTarget, businessDaysRemaining]);

  return (
    <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      <IndicatorCard
        title="Total na carteira"
        value={String(totalPortfolio)}
        subtitle="Todos clientes no painel"
        icon={<Users size={18} />}
      />

      <IndicatorCard
        title="Positivação do mês"
        value={`${monthlyActivationPct}%`}
        subtitle={`${soldThisMonth} vendas no mês`}
        icon={<TrendingUp size={18} />}
      />

      <IndicatorCard
        title="Precisa mandar mensagem"
        value={String(clientsNeedingMessage)}
        subtitle="Próx. contato hoje/atrasado"
        icon={<MessageCircle size={18} />}
      />

      <IndicatorCard
        title="Orçamentos em aberto"
        value={openBudgetsCount == null ? "—" : String(openBudgetsCount)}
        subtitle="Em breve"
        icon={<Receipt size={18} />}
      />

      <IndicatorCard
        title="Vendas para atingir 80%"
        value={missingToTarget <= 0 ? "Atingida 🎉" : `${missingToTarget}`}
        subtitle="N° de vendas"
        icon={<Target size={18} />}
      />

      <IndicatorCard
        title="Vendas por dia para 80%"
        value={missingToTarget <= 0 ? "—" : `${perBusinessDay}/dia`}
        subtitle={missingToTarget <= 0 ? "Meta já atingida 🎉" : `${businessDaysRemaining} dias úteis restantes`}
        icon={<CalendarCheck size={18} />}
      />
    </div>
  );
}
