"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  Send,
  CalendarClock,
  NotebookPen,
  SwatchBook,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type HelpSlidesProps = {
  onPageChange?: (page: number) => void; // opcional, se quiser espelhar no pai
};

export default function HelpSlides({ onPageChange }: HelpSlidesProps) {
  const slidesRef = useRef<HTMLDivElement | null>(null);

  // fonte da verdade do índice (evita bug de “não consigo voltar”)
  const activeIndexRef = useRef(0);

  // só pra renderizar UI
  const [page, setPage] = useState(0);

  // trava durante scroll programático
  const programmaticRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  const slides = useMemo(
    () => [
      {
        key: "colunas-cores",
        title: "1) Colunas e cores",
        icon: <Info className="text-slate-700" size={18} />,
        body: (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">Colunas</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• <b>Enviar mensagem</b>: você deve entrar em contato.</li>
                <li>• <b>Acompanhar</b>: já chamou ou agendou retorno.</li>
                <li>• <b>Orçamento</b>: negociação em andamento.</li>
                <li>• <b>Vendas</b>: compra recente (ok).</li>
              </ul>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <SwatchBook className="text-slate-700" size={16} />
                <p className="text-sm font-semibold text-slate-800">Cores = prioridade</p>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3 md:grid-cols-1">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-red-500">Vermelho</p>
                  <p className="mt-1 text-sm text-slate-600">Urgente / +30 dias sem comprar.</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-amber-500">Amarelo</p>
                  <p className="mt-1 text-sm text-slate-600">Atenção / +7 dias sem comprar.</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-green-600">Verde</p>
                  <p className="mt-1 text-sm text-slate-600">Recente / tudo ok.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "fluxo",
        title: "2) Fluxo de uso",
        icon: <Send className="text-slate-700" size={18} />,
        body: (
          <div className="mt-2 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">Mensagem → Feito</p>
              <p className="mt-1">
                Mandou WhatsApp/ligou? marque <b>Feito</b>.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 font-semibold text-slate-800">
                <CalendarClock size={16} /> Reagendar quando pedir prazo
              </p>
              <p className="mt-1">
                “Fale comigo em X dias”? agende o <b>Próx. contato</b>.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 font-semibold text-slate-800">
                <NotebookPen size={16} /> Anotações (contexto)
              </p>
              <p className="mt-1">Escreva o combinado (prazo/objeção/decisor).</p>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  const total = slides.length;

  const setActive = (idx: number) => {
    activeIndexRef.current = idx;
    setPage(idx);
    onPageChange?.(idx);
  };

  const unlockProgrammatic = () => {
    // libera em dois tempos: no próximo frame e com fallback rápido
    requestAnimationFrame(() => {
      programmaticRef.current = false;
    });
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => {
      programmaticRef.current = false;
    }, 120);
  };

  const goTo = (next: number) => {
    const el = slidesRef.current;
    if (!el) return;

    const idx = clamp(next, 0, total - 1);
    const child = el.children.item(idx) as HTMLElement | null;
    if (!child) return;

    programmaticRef.current = true;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });

    setActive(idx);
    unlockProgrammatic();
  };

  // sincroniza “page” quando o usuário arrasta
  useEffect(() => {
    const el = slidesRef.current;
    if (!el) return;

    const onScroll = () => {
      if (programmaticRef.current) return;

      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;

      const center = el.scrollLeft + el.clientWidth / 2;

      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        const cCenter = c.offsetLeft + c.clientWidth / 2;
        const dist = Math.abs(cCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      setActive(bestIdx);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      {/* Controls */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {page + 1}/{total}
          </span>
        </div>

      </div>

      {/* Slides */}
      <div
        ref={slidesRef}
        className={[
          "flex gap-3 overflow-x-auto",
          "snap-x snap-mandatory scroll-smooth",
          "[-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
        ].join(" ")}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {slides.map((s) => (
          <section
            key={s.key}
            className={[
              "snap-start min-w-full",
              "rounded-xl border border-slate-200 p-4",
              "min-h-80 md:min-h-85",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              {s.icon}
              <p className="text-sm font-semibold text-slate-800">{s.title}</p>
            </div>
            {s.body}
          </section>
        ))}
      </div>

      {/* Dots */}
      <div className="my-3 flex items-center justify-center gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Ir para passo ${idx + 1}`}
            className={[
              "h-2.5 w-2.5 rounded-full transition",
              idx === page ? "bg-slate-900" : "bg-slate-200 hover:bg-slate-300",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
