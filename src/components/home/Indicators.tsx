// components/home/Indicators.tsx
"use client";

import { useMemo } from "react";
import type { ClienteComContatos } from "@/types/crm";
import { parseLooseDate } from "@/lib/dates";
import { Users, TrendingUp, MessageCircle, Receipt } from "lucide-react";

type Props = {
  needs: ClienteComContatos[];
  contacted: ClienteComContatos[];
  ok: ClienteComContatos[];
};

function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
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
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>

        <div className="rounded-xl bg-gray-50 p-2 ring-1 ring-inset ring-gray-200 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Indicators({ needs, contacted, ok }: Props) {
  const allClients = useMemo(() => [...needs, ...contacted, ...ok], [needs, contacted, ok]);

  const totalCarteira = allClients.length;

  const vendidosNoMes = useMemo(() => {
    const now = new Date();
    let count = 0;

    for (const c of allClients) {
      const d = parseLooseDate((c as any).ultima_compra);
      if (d && isSameMonth(d, now)) count += 1;
    }
    return count;
  }, [allClients]);

  const faltaVender = Math.max(0, totalCarteira - vendidosNoMes);

  const positivacaoPct = useMemo(() => {
    if (totalCarteira === 0) return 0;
    return Math.round((vendidosNoMes / totalCarteira) * 100);
  }, [vendidosNoMes, totalCarteira]);

  const clientesParaMensagem = needs.length;

  // Placeholder (quando você tiver o dado, troca aqui)
  const orcamentosAbertos: number | null = null;

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
      {/* 1) Total carteira */}
      <IndicatorCard
        title="Total na carteira"
        value={String(totalCarteira)}
        subtitle="Clientes carregados no painel"
        icon={<Users size={18} />}
      />

      {/* 2) Positivação do mês */}
      <IndicatorCard
        title="Positivação do mês"
        value={`${positivacaoPct}%`}
        subtitle={`${vendidosNoMes} vendeu • ${faltaVender} falta vender`}
        icon={<TrendingUp size={18} />}
      />

      {/* 3) Clientes para mandar mensagem */}
      <IndicatorCard
        title="Para mandar mensagem"
        value={String(clientesParaMensagem)}
        subtitle="Próx. contato hoje ou vencido"
        icon={<MessageCircle size={18} />}
      />

      {/* 4) Orçamentos em aberto (placeholder) */}
      <IndicatorCard
        title="Orçamentos em aberto"
        value={orcamentosAbertos === null ? "—" : String(orcamentosAbertos)}
        subtitle="Em breve"
        icon={<Receipt size={18} />}
      />
    </div>
  );
}
