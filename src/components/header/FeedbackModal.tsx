"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

export type FeedbackType = "bug" | "feature" | "other";

type Props = {
  open: boolean;
  onClose: () => void;

  feedbackName: string;
  setFeedbackName: (v: string) => void;

  feedbackType: FeedbackType;
  setFeedbackType: (v: FeedbackType) => void;

  feedbackMessage: string;
  setFeedbackMessage: (v: string) => void;

  sending: boolean;
  error: string | null;
  success: string | null;

  onSubmit: (e: FormEvent) => void;
};

export default function FeedbackModal({
  open,
  onClose,
  feedbackName,
  setFeedbackName,
  feedbackType,
  setFeedbackType,
  feedbackMessage,
  setFeedbackMessage,
  sending,
  error,
  success,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enviar feedback"
      onMouseDown={(e) => {
        // fecha clicando fora (backdrop)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Enviar feedback
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ajude a melhorar o painel. Conte o que aconteceu ou o que você gostaria de ver.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar feedback"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">
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
            <span className="mb-1 block text-sm text-slate-600">
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
            <label className="mb-1 block text-sm text-slate-600">
              Descreva seu feedback
            </label>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              required
              rows={5}
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b6f01f] focus:border-[#b6f01f]"
              placeholder="Conte o que aconteceu, o que esperava, ou a ideia de melhoria..."
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>

            <button
              type="submit"
              disabled={sending || !feedbackMessage.trim()}
              className="rounded-md bg-[#b6f01f] px-4 py-2 text-sm font-semibold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-transform"
            >
              {sending ? "Enviando..." : "Enviar feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
