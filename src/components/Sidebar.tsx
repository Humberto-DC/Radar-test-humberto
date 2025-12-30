// components/Sidebar.tsx
"use client";

import Link from "next/link";
import {
  Zap,
  Menu,
  X,
  MessageCircle,
  User2,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type FeedbackType = "bug" | "feature" | "other";

type NavItem = {
  href: string;
  label: string; // UI pode ser PT
  icon: any;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  // feedback state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Checklist", icon: Zap },
      { href: "/followUp", label: "Acompanhar", icon: User2 },
    ],
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
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

      if (!res.ok) throw new Error("Falha ao enviar feedback.");

      setFeedbackSuccess("Feedback enviado com sucesso. Obrigado!");
      setFeedbackMessage("");
    } catch (err: any) {
      setFeedbackError(err?.message ?? "Erro ao enviar feedback.");
    } finally {
      setSending(false);
    }
  }

  async function handleSwitchUser() {
    await fetch("/api/auth/logout", { method: "POST" });
    logout(); // limpa localStorage/state
    router.replace("/select-user");
  }
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={[
          "hidden md:flex flex-col h-[calc(100vh-64px)]", // considera header fixo com pt-16
          "bg-linear-to-b from-[#2323ff] to-[#0f0f8b] text-white",
          "p-4 transition-all duration-300",
          isDesktopOpen ? "w-45 lg:w-56" : "w-20",
        ].join(" ")}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={[
              "overflow-hidden transition-all",
              isDesktopOpen ? "opacity-100 max-h-20" : "opacity-0 max-h-0",
            ].join(" ")}
          >
            <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
            <p className="text-sm text-blue-200/80 mt-1">Gerencie seus contatos</p>
          </div>

          <button
            onClick={() => setIsDesktopOpen((v) => !v)}
            className="shrink-0 rounded-lg bg-blue-600/80 p-1.5 hover:bg-blue-500 transition"
            aria-label={isDesktopOpen ? "Recolher menu" : "Expandir menu"}
            title={isDesktopOpen ? "Recolher" : "Expandir"}
          >
            {isDesktopOpen ? <X size={18} /> : <Menu size={20} />}
          </button>
        </div>




        {/* navegação */}
        <nav className="flex-1 mt-6">
          <ul className="flex flex-col gap-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "flex items-center rounded-xl transition-all w-full",
                      "px-3 py-2",
                      isDesktopOpen ? "justify-start gap-3" : "justify-center",
                      active
                        ? "bg-[#b6f01f] text-[#1a1a1a] opacity-90"
                        : "hover:bg-white/10",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    {isDesktopOpen && (
                      <span className="whitespace-nowrap text-sm font-semibold">
                        {label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ações */}
        <div className="mt-4 flex flex-col gap-2">
          {/* feedback */}
          <button
            onClick={() => {
              setFeedbackSuccess(null);
              setFeedbackError(null);
              setIsFeedbackOpen(true);
            }}
            className={[
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
              "bg-white/10 hover:bg-white/15 transition",
              isDesktopOpen ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <MessageCircle size={16} />
            {isDesktopOpen && <span>Enviar feedback</span>}
          </button>

          {/* trocar usuário */}
          <button
            onClick={handleSwitchUser}
            className={[
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
              "bg-white/10 hover:bg-white/15 transition",
              isDesktopOpen ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <LogOut size={16} />
            {isDesktopOpen && <span>Trocar usuário</span>}
          </button>

          {/* versão */}
          <div
            className={[
              "text-sm text-blue-100/80",
              "transition-opacity",
              isDesktopOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
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
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        feedbackType === opt.value
                          ? "bg-[#b6f01f] border-[#b6f01f] text-[#1a1a1a]"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
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

              {feedbackError && <p className="text-xs text-red-600">{feedbackError}</p>}
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
