"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  MessageCircle,
  Info,
  Send,
  CalendarClock,
  NotebookPen,
  SwatchBook,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  sellerName?: string;
};

function buildWhatsAppSupportLink(phoneE164 = "5561996246646", text?: string) {
  const msg =
    text ??
    "Oi! Estou com dúvida no painel de reativação de clientes. Pode me ajudar?";
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(msg)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function HelpModal({ open, onClose, sellerName }: Props) {
  // ✅ Hooks SEMPRE no topo (nada de return antes)
  const slidesRef = useRef<HTMLDivElement | null>(null);
  const programmaticRef = useRef(false);
  const programmaticTimer = useRef<number | null>(null);

  const [page, setPage] = useState(0);

  const supportHref = useMemo(() => {
    return buildWhatsAppSupportLink(
      "5561996246646",
      `Oi! Sou ${sellerName ?? "usuário"} e preciso de ajuda no painel de reativação de clientes.`
    );
  }, [sellerName]);

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
                <li>
                  • <b>Enviar mensagem</b>: Você deve entrar em contato com o cliente.
                </li>
                <li>
                  • <b>Acompanhar</b>: já chamou o cliente ou agendou retorno.
                </li>
                <li>
                  • <b>Orçamento</b>: negociação em andamento (prioridade).
                </li>
                <li>
                  • <b>Vendas</b>: compra recente (ok).
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <SwatchBook className="text-slate-700" size={16} />
                <p className="text-sm font-semibold text-slate-800">
                  Cores = prioridade
                </p>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3 md:grid-cols-1">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-red-500">Vermelho</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Urgente / + de 30 dias que o cliente não compra.
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-amber-500">Amarelo</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Atenção / + de 7 dias que ele não compra.
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-sm font-semibold text-green-600">Verde</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Tudo ok / recente.
                  </p>
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
                Mandou WhatsApp/ligou? marque <b>Feito</b> pra registrar o último contato.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 font-semibold text-slate-800">
                <CalendarClock size={16} /> Reagendar quando pedir prazo
              </p>
              <p className="mt-1">
                cliente pediu “Fale comigo em X dias”? agende o <b>Próx. contato</b> no calendário.
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

  const goTo = (next: number) => {
    const el = slidesRef.current;
    if (!el) return;

    const idx = clamp(next, 0, total - 1);
    const child = el.children.item(idx) as HTMLElement | null;
    if (!child) return;

    programmaticRef.current = true;
    if (programmaticTimer.current) window.clearTimeout(programmaticTimer.current);

    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setPage(idx);

    programmaticTimer.current = window.setTimeout(() => {
      programmaticRef.current = false;
    }, 350);
  };

  // ✅ só instala o listener quando open = true
  useEffect(() => {
    if (!open) return;

    const el = slidesRef.current;
    if (!el) return;

    const onScroll = () => {
      if (programmaticRef.current) return;

      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;

      const center = el.scrollLeft + el.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      children.forEach((c, i) => {
        const cCenter = c.offsetLeft + c.clientWidth / 2;
        const dist = Math.abs(cCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      setPage(bestIdx);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  // ✅ ao abrir, reseta página e scroll pro início
  useEffect(() => {
    if (!open) return;
    setPage(0);
    const el = slidesRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [open]);

  // ✅ agora sim: render condicional depois dos hooks
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ajuda"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Ajuda rápida</h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar ajuda"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-1">
              {page + 1}/{total}
            </span>
          </div>
        </div>

        <div
          ref={slidesRef}
          className={[
            "flex gap-3 overflow-x-auto",
            "snap-x snap-mandatory scroll-smooth light-scrollbar",
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

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-slate-700" size={18} />
            <p className="text-sm font-semibold text-slate-800">
              Precisa de ajuda? chama o suporte
            </p>
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
            >
              Fechar
            </button>

            <a
              href={supportHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:scale-[1.02] active:scale-95 transition-transform"
            >
              WhatsApp
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
