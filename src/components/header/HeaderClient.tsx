//components\header\HeaderClient.tsx

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { LogOut, HelpCircle, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { twoNames } from "@/types/auth";

import HelpModal from "./HelpModal";
import FeedbackModal, { type FeedbackType } from "./FeedbackModal";

export default function HeaderActions({ sellerName }: { sellerName?: string }) {
  const name = useMemo(() => twoNames(sellerName), [sellerName]);
  const router = useRouter();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Feedback state
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
      {/* Ações */}
      <div className="flex items-center gap-2">
        <div className="text-white/50 font-extralight">Versão 2.2 </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="
            rounded-full bg-white/15
            h-10 w-10 sm:h-auto sm:w-auto
            sm:px-4 sm:py-1.5
            text-white hover:bg-white/20 active:scale-95 transition
            inline-flex items-center justify-center gap-2
          "
          aria-label="Ajuda"
          title="Ajuda"
        >
          <HelpCircle className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline text-sm font-semibold">Ajuda</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFeedbackSuccess(null);
            setFeedbackError(null);
            setIsFeedbackOpen(true);
          }}
          className="
            rounded-full bg-white/15
            h-10 w-10 sm:h-auto sm:w-auto
            sm:px-4 sm:py-1.5
            text-white hover:bg-white/20 active:scale-95 transition
            inline-flex items-center justify-center gap-2
          "
          aria-label="Feedback"
          title="Enviar feedback"
        >
          <MessageSquareText className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline text-sm font-semibold">Feedback</span>
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

      {/* Modais (fora do header visual) */}
      <HelpModal
        open={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        sellerName={sellerName}
      />

      <FeedbackModal
        open={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        feedbackName={feedbackName}
        setFeedbackName={setFeedbackName}
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
        feedbackMessage={feedbackMessage}
        setFeedbackMessage={setFeedbackMessage}
        sending={sending}
        error={feedbackError}
        success={feedbackSuccess}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
}
