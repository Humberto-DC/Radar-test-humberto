'use client';

import dynamic from 'next/dynamic';
import { ClienteComContatos } from "@/types/crm";

const OrcamentosClient = dynamic(() => import("./OrcamentosClient"), {
    ssr: false,
    loading: () => (
        <div className="h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-8 w-48 bg-slate-200 rounded"></div>
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
            </div>
        </div>
    )
});

interface Props {
    groupedBySeller: Record<string, ClienteComContatos[]>;
    totalClients: number;
    dataSelecionada: string;
    baseUrl?: string;
}

export default function OrcamentosWrapper(props: Props) {
    return <OrcamentosClient {...props} />;
}
