// app/loading.tsx
export default function GlobalLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#E6E8EF]">
      <div className="flex flex-col items-center gap-6">

        {/* Spinner */}
        <div className="relative">
          {/* Glow por trás */}
          <div className="absolute inset-0 h-16 w-16 rounded-full bg-[#b6f01f]/40 blur-xl animate-pulse"></div>

          {/* Círculo girando */}
          <div className="h-16 w-16 border-4 border-[#b6f01f] border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Texto animado */}
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          Carregando painel...
        </p>
      </div>
    </div>
  );
}
