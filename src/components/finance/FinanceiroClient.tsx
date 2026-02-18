"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Trophy,
    CheckCircle2,
    XCircle,
    Download,
    Filter,
    Users
} from "lucide-react";

interface WeekData {
    week_start: string;
    week_end: string;
    meta: number;
    realized: number;
    is_met: boolean;
    reward: number;
}

interface SellerReport {
    seller_id: number;
    seller_name: string;
    weeks: WeekData[];
}

export default function FinanceiroClient() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SellerReport[]>([]);
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    // Configurações de Premiação (Podem ser editadas em tela para simulação)
    const [fixedReward, setFixedReward] = useState(200); // R$ 200,00 por semana batida
    const [percentReward, setPercentReward] = useState(0.0005); // 0,05%

    const fetchData = async (currentMonth: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/weekly-report?month=${currentMonth}`);
            const json = await res.json();
            if (json.ok) {
                setData(json.data);
            }
        } catch (err) {
            console.error("Erro ao buscar dados do financeiro:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(month);
    }, [month]);

    const handlePrevMonth = () => {
        const [y, m] = month.split("-").map(Number);
        const prev = new Date(y, m - 2, 1);
        setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
    };

    const handleNextMonth = () => {
        const [y, m] = month.split("-").map(Number);
        const next = new Date(y, m, 1);
        setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    };

    const formatBRL = (v: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(v);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    };

    // Cálculo consolidado considerando as configurações da tela
    const reportWithCalculations = useMemo(() => {
        return data.map(seller => {
            let totalCalculatedReward = 0;
            let weeksMetCount = 0;

            const weeksWithRewards = seller.weeks.map(week => {
                let reward = 0;
                if (week.is_met) {
                    weeksMetCount++;
                    // Regra: Fixo + Percentual sobre o realizado
                    reward = fixedReward + (week.realized * percentReward);
                }
                totalCalculatedReward += reward;
                return { ...week, calculatedReward: reward };
            });

            return {
                ...seller,
                weeks: weeksWithRewards,
                weeksMetCount,
                totalReward: totalCalculatedReward
            };
        });
    }, [data, fixedReward, percentReward]);

    const exportToCSV = () => {
        const headers = ["Vendedor", ...reportWithCalculations[0]?.weeks.map((_, i) => `Semana ${i + 1}`), "Total Meta Batida", "Prêmio Total"];
        const rows = reportWithCalculations.map(s => [
            s.seller_name,
            ...s.weeks.map(w => w.is_met ? `SIM (${formatBRL(w.calculatedReward)})` : "NÃO"),
            s.weeksMetCount,
            s.totalReward
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `fechamento_financeiro_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalGeneralReward = reportWithCalculations.reduce((acc, s) => acc + s.totalReward, 0);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <DollarSign className="text-emerald-600" size={28} />
                            Fechamento Financeiro de Metas
                        </h1>
                        <p className="text-slate-500 font-medium">Controle de premiações por atingimento semanal</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <div className="px-4 text-center min-w-[140px]">
                            <span className="text-sm font-black text-slate-900 uppercase">
                                {new Date(month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                            </span>
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* CONFIGURAÇÕES DE PREMIAÇÃO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Filter size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Regras de Cálculo</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Prêmio Fixo (Semana)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={fixedReward}
                                        onChange={(e) => setFixedReward(Number(e.target.value))}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px) font-black text-slate-400 uppercase">% sobre Venda</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={percentReward * 100}
                                        onChange={(e) => setPercentReward(Number(e.target.value) / 100)}
                                        className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-emerald-600 rounded-3xl p-6 shadow-lg shadow-emerald-200 flex items-center justify-between text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest block mb-1">Total de Premiações no Mês</span>
                            <div className="text-4xl font-black">{formatBRL(totalGeneralReward)}</div>
                            <div className="mt-2 flex items-center gap-2 text-emerald-100 text-xs font-bold">
                                <Users size={14} />
                                {reportWithCalculations.length} Vendedores Analisados
                            </div>
                        </div>
                        <DollarSign className="absolute right-[-20px] bottom-[-20px] text-emerald-500/30" size={180} />
                        <button
                            onClick={exportToCSV}
                            className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Download size={16} /> Exportar
                        </button>
                    </div>
                </div>

                {/* TABELA DE RESULTADOS */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                                    {reportWithCalculations[0]?.weeks.map((w, i) => (
                                        <th key={i} className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">
                                            Semana {i + 1}
                                            <span className="block text-[8px] font-bold text-slate-400 mt-1">
                                                {formatDate(w.week_start)} a {formatDate(w.week_end)}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">Metas Batidas</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">Premiação Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                                            <p className="mt-4 text-slate-500 font-bold uppercase text-xs">Carregando dados...</p>
                                        </td>
                                    </tr>
                                ) : reportWithCalculations.map((seller) => (
                                    <tr key={seller.seller_id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 text-sm uppercase">{seller.seller_name}</div>
                                            <div className="text-[10px] font-bold text-slate-400">ID {seller.seller_id}</div>
                                        </td>
                                        {seller.weeks.map((week, i) => (
                                            <td key={i} className="px-4 py-4 border-l border-slate-50">
                                                <div className="flex flex-col items-center gap-2">
                                                    {week.is_met ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg mb-1">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-emerald-600">{formatBRL(week.calculatedReward)}</span>
                                                            <span className="text-[8px] font-bold text-emerald-400 uppercase">Batida</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center opacity-40">
                                                            <div className="bg-slate-100 text-slate-400 p-1.5 rounded-lg mb-1">
                                                                <XCircle size={16} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400">{formatBRL(0)}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Não Batida</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center border-l border-slate-50">
                                            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-200 font-black text-sm">
                                                <Trophy size={14} />
                                                {seller.weeksMetCount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right border-l border-slate-50">
                                            <div className="font-black text-slate-900 text-lg">{formatBRL(seller.totalReward)}</div>
                                            <div className="text-[10px] font-bold text-emerald-500 uppercase">Pronto para pagamento</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
        </div>
    );
}
