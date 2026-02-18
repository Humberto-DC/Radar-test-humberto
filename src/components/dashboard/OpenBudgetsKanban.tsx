"use client";

import { useMemo, useState, useEffect } from "react";
import type { OpenBudgetCard } from "@/types/dashboard";
import CompactClientCard from "@/components/home/CompactClientCard";
import { ClienteComContatos } from "@/types/crm";

const ALLOWED_STATUSES = [
    "ORC", "ENE", "AAC", "CNC", "CNE", "CVL", "DVT", "DVD", "EIM", "FOO", "FOV", "FPR", "ORE", "CCO", "OEX", "REC", "VEN"
];

const statusMap: Record<string, string> = {
    "ORC": "Orçamento s/ acompanhamento",
    "ENE": "Em negociação",
    "AAC": "Aguardando aprovação",
    "CNC": "Combinado novo contato",
    "CNE": "Cliente não encontrado",
    "CVL": "Combinado visita na loja",
    "DVT": "Desistiu temporariamente",
    "DVD": "Desistiu definitivamente",
    "EIM": "Entrega impossibilitada",
    "FOO": "Fechado em outro orc.",
    "FOV": "Fechado por outro vendedor",
    "FPR": "Falta de produto",
    "ORE": "Orçamento rejeitado",
    "CCO": "Comprou no concorrente",
    "OEX": "Orçamento Excluído",
    "REC": "Venda recebida",
    "VEN": "Venda fechada"
};

const statusColors: Record<string, string> = {
    "ORC": "bg-slate-400",
    "ENE": "bg-yellow-500",
    "AAC": "bg-indigo-600",
    "CNC": "bg-sky-500",
    "CNE": "bg-rose-500",
    "CVL": "bg-emerald-600",
    "DVT": "bg-blue-500",
    "DVD": "bg-red-600",
    "EIM": "bg-orange-600",
    "FOO": "bg-purple-500",
    "FOV": "bg-violet-600",
    "FPR": "bg-amber-600",
    "ORE": "bg-gray-800",
    "CCO": "bg-pink-600",
    "OEX": "bg-slate-700",
    "REC": "bg-teal-600",
    "VEN": "bg-emerald-600"
};

export default function OpenBudgetsKanban({ clients }: { clients: OpenBudgetCard[] }) {
    const totalValor = useMemo(() => {
        return clients.reduce((acc, c) => acc + (c.valor_total || 0), 0);
    }, [clients]);

    const groupedByStatus = useMemo(() => {
        const buckets: Record<string, OpenBudgetCard[]> = {};

        clients.forEach(client => {
            const status = client.orcamento_status || "ORC";
            if (!ALLOWED_STATUSES.includes(status)) return;

            if (!buckets[status]) {
                buckets[status] = [];
            }
            buckets[status].push(client);
        });

        return buckets;
    }, [clients]);

    const statusList = useMemo(() => {
        return Object.keys(groupedByStatus).sort((a, b) => {
            return ALLOWED_STATUSES.indexOf(a) - ALLOWED_STATUSES.indexOf(b);
        });
    }, [groupedByStatus]);

    return (
        <section className="rounded-2xl bg-white border border-gray-100 shadow-lg flex flex-col overflow-hidden h-[600px]">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 flex-none">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-sm font-black text-[#212529] uppercase tracking-tighter">Acompanhamento de Orçamentos</h2>
                        <p className="text-[10px] text-[#495057] uppercase font-bold tracking-widest mt-0.5">
                            Orçamentos abertos por status
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Vlr. Aberto Seção</p>
                        <p className="text-sm font-black text-emerald-600 tracking-tighter">
                            {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg uppercase shadow-sm">
                        {clients.length} Pedidos
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-4 bg-slate-50/50 scrollbar-thin">
                <div className="flex gap-4 h-full min-w-max pb-2">
                    {statusList.map((status) => {
                        const statusClients = groupedByStatus[status];
                        const count = statusClients.length;
                        const label = statusMap[status] || status;
                        const colorClass = statusColors[status] || "bg-blue-600";

                        return (
                            <div key={status} className="w-[300px] flex-none flex flex-col h-full bg-slate-200/40 rounded-2xl border border-slate-200/50 shadow-inner">
                                <div className="p-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-none ${colorClass}`} />
                                        <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-tight truncate">{label}</h3>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg text-blue-600 bg-blue-50 flex-none border border-blue-100">
                                        {count}
                                    </span>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
                                    {statusClients.map(client => (
                                        <CompactClientCard
                                            key={`${client.id_cliente}-${client.open_budget_id}`}
                                            client={client as any as ClienteComContatos}
                                        />
                                    ))}
                                    {count === 0 && (
                                        <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">Coluna Vazia</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {statusList.length === 0 && (
                        <div className="w-full flex items-center justify-center text-slate-400">
                            <div className="text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-sm font-black uppercase tracking-widest mb-1 text-slate-800">Céu limpo!</p>
                                <p className="text-xs font-medium text-slate-500">Nenhum orçamento aberto encontrado nestes critérios.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
