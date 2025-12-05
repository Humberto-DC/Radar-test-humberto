"use client";
import {AlertCircle  } from "lucide-react";
export default function ErrorPage({ error, reset }: any) {
    console.error(error);
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F3F4F6]">
        <div className="flex flex-col items-center text-center gap-4 px-6 py-8">
            <AlertCircle size={64} strokeWidth={1.5} className="text-slate-500" />

        

            <h1 className="text-xl font-semibold text-slate-500">
            Algo deu errado
            </h1>

            <p className="text-sm text-slate-500 max-w-xs">
            Um erro inesperado ocorreu. Tente novamente.
            </p>

            <button
            onClick={reset}
            className="
                mt-2 px-4 py-2 rounded-md 
                bg-[#b6f01f] text-[#1a1a1a]
                font-medium text-sm 
                hover:brightness-105 
                active:scale-95 
                transition
            "
            >
            Tentar novamente
            </button>
        </div>
        </div>
    );
}
