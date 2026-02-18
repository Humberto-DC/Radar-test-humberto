'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function SeletorMes({
    dataAtual,
    baseUrl = '/orcamentos'
}: {
    dataAtual: string;
    baseUrl?: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const date = new Date(dataAtual + 'T00:00:00');

    const navegarMes = (meses: number) => {
        const novaData = new Date(date);
        novaData.setMonth(date.getMonth() + meses);
        novaData.setDate(1);
        const iso = novaData.toISOString().split('T')[0];

        startTransition(() => {
            router.push(`${baseUrl}?data=${iso}`);
        });
    };

    const formatarMesAno = (d: Date) => {
        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return `${meses[d.getMonth()]} ${d.getFullYear()}`.toUpperCase();
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Período de Gestão
            </label>
            <div className={`flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit transition-opacity ${isPending ? 'opacity-60 cursor-wait' : ''}`}>
                {/* Botão Mês Anterior */}
                <button
                    onClick={() => navegarMes(-1)}
                    disabled={isPending}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Mês Anterior"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Exibição do Mês */}
                <div className="px-6 py-1 text-center min-w-[200px]">
                    <span className="text-[9px] font-black text-blue-600 block uppercase tracking-tighter leading-none mb-0.5">
                        {isPending ? 'Carregando...' : 'Mês de Referência'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 tabular-nums">
                        {formatarMesAno(date)}
                    </span>
                </div>

                {/* Botão Próximo Mês */}
                <button
                    onClick={() => navegarMes(1)}
                    disabled={isPending}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Próximo Mês"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
