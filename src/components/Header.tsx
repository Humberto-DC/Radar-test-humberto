"use client";

import { useMemo, useState, FormEvent } from "react";
import { X } from "lucide-react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type FeedbackType = "bug" | "feature" | "other";

function firstName(fullName?: string) {
  if (!fullName) return "";
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  return cleaned.split(" ")[0] ?? "";
}

export default function Header({ sellerName }: { sellerName?: string }) {
  const name = useMemo(() => firstName(sellerName), [sellerName]);

  // Ajuda (placeholder pro futuro)
  function handleHelpClick() {
    // TODO: implementar Ajuda no futuro (ex: abrir modal, drawer, central de ajuda, etc.)
    console.log("Ajuda: a implementar");
  }

  // Feedback state (mesmo fluxo da Sidebar)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

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

  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/select-user");
      router.refresh();
    }
  }


  return (
    <>
      <header
        className="
          fixed top-0 left-0 right-0 h-16
          bg-[#2323ff] shadow-2xl
          flex items-center justify-between
          px-3 z-50
        "
      >

        
        {/* esquerda: placeholder + olá */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Placeholder circular */}
          <div
            className="
              h-10 w-10 rounded-full
              bg-white/40
              flex items-center justify-center
              text-sm font-bold text-white
              shrink-0
            "
            aria-hidden
          >
            {/* opcional: iniciais no futuro */}
          </div>

          {name && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-white/80">
                Olá
              </span>
              <span className="rounded-full px-3 py-1 text-sm font-semibold text-white">
                {name}
              </span>
            </div>
          )}
        </div>

        {/* direita: botões */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHelpClick}
            className="
              rounded-full bg-white/15 px-4 py-1.5
              text-sm font-semibold text-white
              hover:bg-white/20 active:scale-95 transition
            "
            aria-label="Ajuda"
            title="Ajuda (em breve)"
          >
            Ajuda
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedbackSuccess(null);
              setFeedbackError(null);
              setIsFeedbackOpen(true);
            }}
            className="
              rounded-full bg-white/15 px-4 py-1.5
              text-sm font-semibold text-white
              hover:bg-white/20 active:scale-95 transition
            "
            aria-label="Feedback"
            title="Enviar feedback"
          >
            Feedback
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="
              rounded-full bg-white/15 p-2
              text-white
              hover:bg-white/20 active:scale-95 transition
            "
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>

        </div>
      </header>

      {/* MODAL DE FEEDBACK */}
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
              {feedbackSuccess && <p className="text-xs text-emerald-600">{feedbackSuccess}</p>}

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
