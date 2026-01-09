"use client";

import { useMemo, useState, type FormEvent } from "react";
import { LogOut, CircleUserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { twoNames } from "@/types/auth"; 
import FeedbackModal, { type FeedbackType } from "./FeedbackModal";
import HelpModal from "./HelpModal";
import ProfileAvatar from "@/components/ProfileAvatar";




export default function Header({ sellerName }: { sellerName?: string }) {
  const name = useMemo(() => twoNames(sellerName), [sellerName]);
  const router = useRouter();

  // Modals
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
      <header
        className="
          fixed top-0 left-0 right-0 h-16
          bg-[#2323ff] shadow-2xl
          flex items-center justify-between
          px-4 sm:px-6
          z-50
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <ProfileAvatar
              name={sellerName}
              size={35}
              className="shrink-0 ring-2 ring-white/20"
              fallback={
                <CircleUserRound size={24} strokeWidth={1} className="text-white" />
              }
            />

          {name && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs text-white/80">
                Olá,
              </span>

              <span className="truncate rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {name}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="
              rounded-full bg-white/15 px-4 py-1.5
              text-sm font-semibold text-white
              hover:bg-white/20 active:scale-95 transition
            "
            aria-label="Ajuda"
            title="Ajuda"
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
