'use client';

import { useState, useMemo, useEffect } from "react";
import CompactClientCard from "@/components/home/CompactClientCard";
import { ClienteComContatos } from "@/types/crm";

interface OrcamentosClientProps {
    groupedBySeller: Record<string, ClienteComContatos[]>;
    totalClients: number;
    dataSelecionada: string;
    baseUrl?: string;
}

import SeletorMes from "./components/SeletorMes";

export default function OrcamentosClient({ groupedBySeller, totalClients, dataSelecionada, baseUrl = "/orcamentos" }: OrcamentosClientProps) {
    const sellers = useMemo(() => {
        return Object.keys(groupedBySeller).sort();
    }, [groupedBySeller]);

    const [selectedSeller, setSelectedSeller] = useState<string>(sellers[0] || "ALL");

    // Fix selected seller if it doesn't exist in current month
    useEffect(() => {
        if (selectedSeller !== "ALL" && !sellers.includes(selectedSeller)) {
            setSelectedSeller(sellers[0] || "ALL");
        }
    }, [sellers, selectedSeller]);

    const filteredClients = useMemo(() => {
        if (selectedSeller === "ALL") {
            return Object.values(groupedBySeller).flat();
        }
        return groupedBySeller[selectedSeller] || [];
    }, [selectedSeller, groupedBySeller]);

    const totalValorSessao = useMemo(() => {
        return filteredClients.reduce((acc, c) => acc + (c.valor_total || 0), 0);
    }, [filteredClients]);

    const ALLOWED_STATUSES = [
        "ORC", "ENE", "AAC", "CNC", "CNE", "CVL", "DVT", "DVD", "EIM", "FOO", "FOV", "FPR", "ORE", "CCO", "OEX", "REC", "VEN"
    ];

    const groupedByStatus = useMemo(() => {
        const buckets: Record<string, ClienteComContatos[]> = {};

        filteredClients.forEach(client => {
            const status = client.orcamento_status || "ORC";

            if (!ALLOWED_STATUSES.includes(status)) return;

            if (!buckets[status]) {
                buckets[status] = [];
            }
            buckets[status].push(client);
        });

        return buckets;
    }, [filteredClients]);

    const statusList = useMemo(() => {
        return Object.keys(groupedByStatus).sort((a, b) => {
            return ALLOWED_STATUSES.indexOf(a) - ALLOWED_STATUSES.indexOf(b);
        });
    }, [groupedByStatus]);

    const statusMap: Record<string, string> = {
        "ORC": "Orçamento sem acompanhamento",
        "ENE": "Em negociação",
        "AAC": "Aguardando aprovação do cadastro",
        "CNC": "Combinado novo contato",
        "CNE": "Cliente não encontrado",
        "CVL": "Combinado visita na loja",
        "DVT": "Desistiu da venda temporariamente",
        "DVD": "Desistiu da venda definitivamente",
        "EIM": "Entrega impossibilitada",
        "FOO": "Fechado em outro orçamento",
        "FOV": "Fechado por outro vendedor",
        "FPR": "Falta de produto",
        "ORE": "Orçamento rejeito pelo cadastro",
        "CCO": "Comprou no concorrente",
        "OEX": "Orçamento Excluido",
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

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="flex-none bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Acompanhamento de Orçamentos</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Status: acompanhamento_orcamentos</p>
                    </div>

                    {sellers.length > 1 && (
                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Vendedor:</span>
                            <select
                                value={selectedSeller}
                                onChange={(e) => setSelectedSeller(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-w-[200px]"
                            >
                                <option value="ALL">Todos os Vendedores</option>
                                {sellers.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center mr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor em Aberto</span>
                        <span className="text-xl font-black text-slate-800 tracking-tighter">
                            {totalValorSessao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>

                    <SeletorMes dataAtual={dataSelecionada} baseUrl={baseUrl} />

                    <div className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg uppercase shadow-sm">
                        {filteredClients.length} Registros
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <div className="flex gap-4 h-full min-w-max">
                    {statusList.map((status) => {
                        const clients = groupedByStatus[status];
                        const count = clients.length;
                        const label = statusMap[status] || status;

                        const colorClass = statusColors[status] || "bg-blue-600";

                        return (
                            <div key={status} className="w-[320px] flex-none flex flex-col h-full bg-slate-200/40 rounded-2xl border border-slate-200/50 shadow-inner">
                                <div className="p-4 border-b border-slate-200 bg-white/90 backdrop-blur-sm rounded-t-2xl sticky top-0 z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{label}</h3>
                                    </div>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg text-blue-600 bg-blue-50">
                                        {count}
                                    </span>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
                                    {clients.map(client => (
                                        <CompactClientCard
                                            key={client.id_cliente}
                                            client={client}
                                        />
                                    ))}
                                    {count === 0 && (
                                        <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Vazio</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {statusList.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <p>Nenhum dado encontrado para os filtros selecionados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
