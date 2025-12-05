// components/Sidebar.tsx
"use client";
import Link from "next/link";
import { MessageSquare, Zap, Menu, History, X, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, FormEvent } from "react";

type FeedbackType = "bug" | "feature" | "other";

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // feedback state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const navItems = [
    { href: "/", label: "Triggers", icon: Zap },
    { href: "/messages", label: "Mensagens", icon: MessageSquare },
    { href: "/history", label: "Histórico", icon: History },
  ];

  const feedbackTypeLabel: Record<FeedbackType, string> = {
    bug: "bug",
    feature: "nova funcionalidade",
    other: "outro",
  };

  async function handleFeedbackSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName,
          type: feedbackType,
          message: feedbackMessage,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao enviar feedback.");
      }

      setFeedbackSuccess("Feedback enviado com sucesso. Obrigado!");
      setFeedbackMessage("");
    } catch (err: any) {
      setFeedbackError(err.message ?? "Erro ao enviar feedback.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* TOPBAR MOBILE (apenas mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-linear-to-r from-[#2323ff] to-[#2323ff] text-white">
        <div className="text-2xl font-bold">Painel</div>
        <button onClick={() => setIsMobileOpen(true)} aria-label="Abrir menu">
          <Menu />
        </button>
      </div>

      {/* MOBILE: backdrop + drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* drawer */}
          <aside className="relative z-50 h-full w-64 bg-linear-to-b from-blue-700 to-blue-500 text-white p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight">Painel</h1>
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X />
              </button>
            </div>

            <nav className="flex-1">
              <ul className="flex flex-col gap-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 p-2 rounded ${
                        pathname === href
                          ? "bg-blue-100/40 font-semibold"
                          : "hover:bg-blue-100/20"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* botão de feedback no mobile */}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                setIsFeedbackOpen(true);
              }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition"
            >
              <MessageCircle size={16} />
              <span>Enviar feedback</span>
            </button>

            <div className="text-sm text-blue-100/80 mt-4">
              <div>v. 1.0</div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden md:flex flex-col h-full
          bg-linear-to-b from-[#2323ff] to-[#0f0f8b] text-white
          p-4 transition-all duration-300
          ${isDesktopOpen ? "w-50" : "w-18"}
        `}
      >
        <div className="flex flex-row justify-between">
          {/* header */}
          <div
            className={`overflow-hidden transition-all ${
              isDesktopOpen ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
            }`}
          >
            <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          </div>

          {/* botão de toggle */}
          <button
            onClick={() => setIsDesktopOpen((v) => !v)}
            className="self-end rounded-lg bg-blue-600/80 p-1.5 hover:bg-blue-500 transition"
            aria-label={isDesktopOpen ? "Recolher menu" : "Expandir menu"}
          >
            {isDesktopOpen ? <X size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <p
          className={`text-sm text-blue-200/80 mt-1 mb-5  ${
            isDesktopOpen ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
          }`}
        >
          Gerencie suas mensagens
        </p>

        {/* navegação */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                      flex items-center p-2 rounded transition-all w-full
                      ${isDesktopOpen ? "justify-start gap-3" : "justify-center"}
                      ${
                        active
                          ? "bg-[#b6f01f]  text-[#1a1a1a] opacity-85"
                          : "hover:bg-[#b6f01f99]"
                      }
                    `}
                  >
                    <Icon size={18} />
                    {isDesktopOpen && (
                      <span className="whitespace-nowrap">{label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* botão feedback desktop */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2 text-sm
              bg-white/10 hover:bg-white/20 transition
              ${isDesktopOpen ? "justify-start" : "justify-center"}
            `}
          >
            <MessageCircle size={16} />
            {isDesktopOpen && <span>Enviar feedback</span>}
          </button>

          <div
            className={`
              text-sm text-blue-100/80
              transition-opacity ${isDesktopOpen ? "opacity-100" : "opacity-0"}
            `}
          >
            <div>v. 1.0</div>
          </div>
        </div>
      </aside>

      {/* MODAL DE FEEDBACK (desktop + mobile) */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Enviar feedback
                </h2>
                <p className="text-sm text-slate-500">
                  Ajude a melhorar o painel. Conte o que aconteceu ou o que você gostaria de ver.
                </p>
              </div>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar feedback"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Seu nome (opcional)
                </label>
                <input
                  type="text"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b6f01f] focus:border-[#b6f01f]"
                  placeholder="Digite seu nome"
                />
              </div>

              <div>
                <span className="block text-sm text-slate-600 mb-1">
                  Tipo de feedback
                </span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "bug", label: "Bug" },
                      { value: "feature", label: "Nova funcionalidade" },
                      { value: "other", label: "Outro" },
                    ] as { value: FeedbackType; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFeedbackType(opt.value)}
                      className={`
                        rounded-full border px-3 py-1 text-xs font-medium
                        ${
                          feedbackType === opt.value
                            ? "bg-[#b6f01f] border-[#b6f01f] text-[#1a1a1a]"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Descreva seu feedback
                </label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#b6f01f] focus:border-[#b6f01f]"
                  placeholder="Conte o que aconteceu, o que esperava, ou a ideia de melhoria..."
                />
              </div>

              {feedbackError && (
                <p className="text-xs text-red-600">{feedbackError}</p>
              )}
              {feedbackSuccess && (
                <p className="text-xs text-emerald-600">{feedbackSuccess}</p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={sending || !feedbackMessage.trim()}
                  className="rounded-md bg-[#b6f01f] px-4 py-2 text-sm font-semibold text-[#1a1a1a] disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  {sending ? "Enviando..." : "Enviar feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
