"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
    TrendingUp,
    Users,
    Target,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Sun,
    Layers,
    BarChart3,
    Clock,
    Trophy,
    Maximize2,
    Minimize2,
    ChevronRight
} from "lucide-react";
import { AdminDashboardData } from "@/types/adminDashboard";
import { formatBRL, formatPct } from "@/components/utils";

export default function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
    const [now, setNow] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<number | 'all'>('all');
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);

        // Rotação Automática de Filiais (Modo Monitor)
        const rotationInterval = setInterval(() => {
            setSelectedBranch(prev => {
                const options: (number | 'all')[] = ['all', ...data.filiais.map(f => f.empresa_id)];
                const currentIndex = options.indexOf(prev);
                const nextIndex = (currentIndex + 1) % options.length;
                return options[nextIndex];
            });
        }, 15000); // Alterna a cada 15 segundos

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            clearInterval(timer);
            clearInterval(rotationInterval);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [data.filiais]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const pctColor = (pct: number) => {
        if (pct >= 100) return "text-emerald-600";
        if (pct >= 80) return "text-blue-600";
        if (pct >= 50) return "text-amber-600";
        return "text-rose-600";
    };

    const pctBg = (pct: number) => {
        if (pct >= 100) return "bg-emerald-500";
        if (pct >= 80) return "bg-blue-500";
        if (pct >= 50) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <div
            ref={containerRef}
            className={`w-full overflow-hidden flex flex-col p-4 sm:p-6 gap-4 ${isFullscreen ? 'h-screen bg-slate-50' : 'h-[calc(100vh-64px)]'}`}
        >
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Monitor Administrativo</h1>
                        <p className="text-xs text-slate-500 font-medium leading-none">Resultados consolidados em tempo real</p>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                        title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-xs font-black text-slate-900 leading-none uppercase">
                            Atualizado: {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
            </div>

            {/* TOP STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 shrink-0">
                <StatCard
                    label="Meta Geral Mês"
                    value={formatBRL(data.general.goal)}
                    icon={<Target className="text-blue-500" />}
                    subText={`${formatPct(data.general.pct)} atingido`}
                />
                <StatCard
                    label="Realizado Total"
                    value={formatBRL(data.general.realized)}
                    icon={<TrendingUp className="text-emerald-500" />}
                    trend="+12%"
                    trendUp
                />
                <StatCard
                    label="Faltando para Meta"
                    value={formatBRL(data.general.missing)}
                    icon={<ArrowUpRight className="text-rose-500" />}
                    subText="Saldo líquido projetado"
                />
                <StatCard
                    label="Dias Úteis"
                    value={`${data.general.daysActive}/${data.general.daysTotal}`}
                    icon={<Calendar className="text-amber-500" />}
                    subText={`${data.general.daysTotal - data.general.daysActive} dias restantes`}
                />
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Lucratividade</span>
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                            <Sun className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="relative z-10 flex gap-10 divide-x divide-slate-100">
                        <div className="flex-1">
                            <span className="text-[12px] font-black text-slate-400 uppercase block mb-1">Acumulada</span>
                            <div className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                                {data.profitability.overall.toFixed(1)}%
                            </div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase">
                                Sem solar: {data.profitability.noSolar.toFixed(1)}%
                            </div>
                        </div>
                        <div className="flex-1 pl-10">
                            <span className="text-[12px] font-black text-emerald-500 uppercase block mb-1">Hoje</span>
                            <div className="text-4xl font-black text-emerald-600 tracking-tight leading-none mb-3">
                                {data.profitability.today.toFixed(1)}%
                            </div>
                            <div className="text-[11px] font-bold text-emerald-500/70 uppercase">
                                Sem solar: {data.profitability.todayNoSolar.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL EM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* LINHA 1: FILIAIS (25%) + POSITIVAÇÃO (25%) + RANKINGS (50%) */}

                {/* COLUNA: RESULTADOS POR FILIAL (3/12) */}
                <div className="lg:col-span-3 flex flex-col min-h-0">
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
                        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Layers size={18} className="text-blue-500" /> Filiais
                            </h2>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {[...data.filiais].sort((a, b) => b.pct - a.pct).map((f, idx) => (
                                <div key={f.empresa_id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border-2 shrink-0 ${idx === 0 ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm' :
                                        idx === 1 ? 'bg-slate-50 border-slate-400 text-slate-500' :
                                            idx === 2 ? 'bg-orange-50 border-orange-600 text-orange-700' :
                                                'bg-white border-slate-100 text-slate-400'
                                        }`}>
                                        <span className="text-[18px] leading-none mb-0.5">{idx + 1}º</span>
                                        <span className="text-[8px] font-black uppercase opacity-60">ID {f.empresa_id}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="font-extrabold text-[15px] text-slate-900 truncate uppercase">{f.name}</h3>
                                            <span className={`font-black text-[15px] ${pctColor(f.pct)}`}>{formatPct(f.pct)}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                            <div className={`h-full ${pctBg(f.pct)}`} style={{ width: `${Math.min(100, f.pct)}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span>Realizado: {formatBRL(f.realized)}</span>
                                            <span>Meta: {formatBRL(f.goal)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* COLUNA: POSITIVAÇÃO (3/12) */}
                <div className="lg:col-span-3 flex flex-col min-h-0">
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
                        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Users size={18} className="text-emerald-500" /> Positivação
                            </h2>
                            <span className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                {formatPct(data.positivity.percentage)}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {data.positivitySellers.map((s, idx) => (
                                <div key={s.seller_id} className={`p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-amber-50/40 border-amber-200 shadow-sm' :
                                    idx === 1 ? 'bg-slate-50/50 border-slate-200' :
                                        idx === 2 ? 'bg-orange-50/50 border-orange-200' :
                                            'bg-slate-50/30 border-slate-100 hover:bg-slate-50'
                                    }`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[12px] font-black shrink-0 ${idx === 0 ? 'bg-amber-500 text-white shadow-amber-200 shadow-sm' :
                                                idx === 1 ? 'bg-slate-400 text-white shadow-slate-200 shadow-sm' :
                                                    idx === 2 ? 'bg-orange-600 text-white shadow-orange-200 shadow-sm' :
                                                        'bg-slate-100 text-slate-400'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <h3 className={`font-black text-[13px] truncate uppercase ${idx < 3 ? 'text-slate-900' : 'text-slate-700'}`}>{s.name}</h3>
                                        </div>
                                        <span className={`font-black text-[15px] ${pctColor(s.pct)}`}>{formatPct(s.pct)}</span>
                                    </div>
                                    <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-100 mb-2">
                                        <div className={`h-full ${pctBg(s.pct)}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Positivados: {s.wallet_positive}</span>
                                        <span>Carteira: {s.wallet_total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* COLUNA: RANKINGS (6/12) - MAIS EVIDENTE */}
                <div className="lg:col-span-6 flex flex-col min-h-0">
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" /> Rankings de Vendas
                            </h2>
                        </div>

                        <div className="flex-1 overflow-hidden p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* SEMANAL */}
                            <div className="flex flex-col gap-3 min-h-0">
                                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest text-center bg-slate-50 py-2 rounded-xl border border-slate-100">
                                    Semanal
                                </h3>
                                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                                    {data.weeklySellers.slice(0, 7).map((s, idx) => (
                                        <div key={s.seller_id} className={`p-3.5 rounded-2xl border transition-all ${idx === 0 ? 'bg-amber-50/50 border-amber-200 shadow-sm' :
                                            idx === 1 ? 'bg-slate-50/50 border-slate-200' :
                                                idx === 2 ? 'bg-orange-50/50 border-orange-200' :
                                                    'bg-white border-slate-100 hover:shadow-md'
                                            }`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0 ${idx === 0 ? 'bg-amber-500 text-white shadow-amber-200 shadow-lg' :
                                                    idx === 1 ? 'bg-slate-400 text-white shadow-slate-200 shadow-lg' :
                                                        idx === 2 ? 'bg-orange-600 text-white shadow-orange-200 shadow-lg' :
                                                            'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <p className={`text-[14px] font-black truncate uppercase ${idx < 3 ? 'text-slate-900' : 'text-slate-600'}`}>{s.name}</p>
                                                        {s.weeks_met_count ? (
                                                            <div className="flex gap-0.5">
                                                                {Array.from({ length: s.weeks_met_count }).map((_, i) => (
                                                                    <Trophy key={i} size={15} className="text-amber-500 fill-amber-500/20 animate-bounce" />
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex justify-between items-end mb-1.5">
                                                        <span className={`text-[13px] font-black ${idx === 0 ? 'text-amber-600' : 'text-blue-600'}`}>{formatBRL(s.realized)}</span>
                                                        <span className={`text-[13px] font-black ${pctColor(s.pct)}`}>{formatPct(s.pct, 0)}</span>
                                                    </div>
                                                    <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-slate-100/50">
                                                        <div className={`h-full ${pctBg(s.pct)}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MENSAL */}
                            <div className="flex flex-col gap-3 min-h-0 border-l border-slate-100/50 pl-6">
                                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest text-center bg-slate-50 py-2 rounded-xl border border-slate-100">
                                    Mensal
                                </h3>
                                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                                    {data.monthlySellers.slice(0, 7).map((s, idx) => (
                                        <div key={s.seller_id} className={`p-3.5 rounded-2xl border transition-all ${idx === 0 ? 'bg-blue-50/30 border-blue-200 shadow-sm' :
                                            idx === 1 ? 'bg-slate-50/50 border-slate-200' :
                                                idx === 2 ? 'bg-orange-50/50 border-orange-200' :
                                                    'bg-white border-slate-100 hover:shadow-md'
                                            }`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0 ${idx === 0 ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' :
                                                    idx === 1 ? 'bg-slate-400 text-white shadow-slate-200 shadow-lg' :
                                                        idx === 2 ? 'bg-orange-600 text-white shadow-orange-200 shadow-lg' :
                                                            'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <p className={`text-[14px] font-black truncate uppercase ${idx < 3 ? 'text-slate-900' : 'text-slate-600'}`}>{s.name}</p>
                                                        {s.pct > 110 && (
                                                            <Trophy size={15} className="text-amber-500 fill-amber-500/20 animate-bounce" />
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-end mb-1.5">
                                                        <span className={`text-[13px] font-black ${idx === 0 ? 'text-blue-700' : 'text-blue-600'}`}>{formatBRL(s.realized)}</span>
                                                        <span className={`text-[13px] font-black ${pctColor(s.pct)}`}>{formatPct(s.pct, 0)}</span>
                                                    </div>
                                                    <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-slate-100/50">
                                                        <div className={`h-full ${pctBg(s.pct)}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* LINHA INFERIOR: CRESCIMENTO (12/12) */}
                <div className="lg:col-span-12">
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[320px] shrink-0">
                        <div className="px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={20} className="text-emerald-500" /> Crescimento Últimos 6 Meses
                                <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full border border-amber-200 animate-pulse font-black">MODO MONITOR</span>
                            </h2>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="text-[12px] font-black uppercase bg-white border border-slate-300 rounded-xl px-4 py-2 outline-none cursor-pointer hover:bg-slate-50 shadow-sm"
                            >
                                <option value="all">Geral (Todas Filiais)</option>
                                {data.filiais.map(f => (
                                    <option key={f.empresa_id} value={f.empresa_id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="p-6 flex-1 flex items-end justify-between gap-10 overflow-hidden">
                            {(() => {
                                const growthData = selectedBranch === 'all' ? data.growth : (data.branchGrowth[selectedBranch] || []);
                                if (growthData.length === 0) return <div className="w-full h-full flex items-center justify-center text-slate-400 italic font-black text-xl">Sem dados no período</div>;

                                const maxVal = Math.max(...growthData.map(d => Math.max(d.total, d.goal)), 1);
                                return growthData.map((g, i) => {
                                    const height = (g.total / maxVal) * 100;
                                    const goalHeight = (g.goal / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative h-full">
                                            <div className="text-center group-hover:scale-125 transition-transform duration-300">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <div className="text-[13px] font-black text-slate-900">{formatBRL(g.total)}</div>
                                                    {g.total >= g.goal && g.goal > 0 && (
                                                        <Trophy size={18} className="text-amber-500 fill-amber-500/20 animate-bounce" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">{g.profit.toFixed(1)}% luc.</div>
                                            </div>
                                            <div className="flex-1 w-full bg-slate-50/30 rounded-t-3xl flex flex-col justify-end relative overflow-visible border-x border-t border-slate-100/50 shadow-sm">
                                                {g.goal > 0 && (
                                                    <div className="absolute left-0 right-0 border-t-[3px] border-rose-500/50 z-10" style={{ bottom: `${goalHeight}%` }}>
                                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black shadow-lg">
                                                            META: {formatBRL(g.goal)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div
                                                    className={`w-full ${g.total >= g.goal && g.goal > 0 ? 'bg-gradient-to-t from-amber-600 to-amber-400' : 'bg-gradient-to-t from-blue-600 to-blue-400'} rounded-t-2xl transition-all duration-700 shadow-xl`}
                                                    style={{ height: `${height}%`, minHeight: '8px' }}
                                                />
                                            </div>
                                            <span className="text-[14px] font-black text-slate-500 uppercase tracking-tighter">{g.month}</span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </section>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, icon, subText, trend, trendUp, className }: any) {
    return (
        <div className={`bg-white border border-slate-200 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden group ${className}`}>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">{React.cloneElement(icon, { size: 24 })}</div>
            </div>
            <div className="relative z-10">
                <div className="text-4xl font-black text-slate-900 tracking-tight mb-3">{value}</div>
                <div className="flex items-center gap-3">
                    {trend && (
                        <span className={`text-[12px] font-black px-3 py-1 rounded-full flex items-center gap-2 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                        </span>
                    )}
                    {subText && <span className="text-[12px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap">{subText}</span>}
                </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
                {React.cloneElement(icon, { size: 120 })}
            </div>
        </div>
    );
}
