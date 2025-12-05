// components/messages/MessagesClient.tsx
"use client";

import { useState } from "react";
import MessageForm from "./MessageForm";
import type { Message } from "./types";
import MessagesTable from "./MessagesTable";

type Props = { messages: Message[] };

export default function MessagesClient({ messages }: Props) {
  const [submitting, setSubmitting] = useState(false);

  // opcional: estado para feedback rápido depois do submit
  const [flash, setFlash] = useState<null | { type: "success" | "error"; msg: string }>(null);

  const handleSubmit = async (form: FormData) => {
    try {
      setSubmitting(true);
      setFlash(null);

      const res = await fetch("/api/messages", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Erro ao enviar");

      setFlash({ type: "success", msg: "Mensagem enviada para aprovação!" });
      return true;
    } catch (err: any) {
      setFlash({ type: "error", msg: err?.message || "Falha ao enviar" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-[#cacdd4]">
      <div className="flex-1 mx-auto w-full max-w-screen-2xl px-6 xl:px-12 py-10">
        {/* Flash message */}
        {flash && (
          <div
            role="status"
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              flash.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {flash.msg}
          </div>
        )}

        {/* Layout responsivo: stack no mobile, colunas no desktop */}
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
          {/* Coluna esquerda: Form */}
          <section aria-labelledby="new-message-form">
            <h2 id="new-message-form" className="sr-only">
              Nova mensagem
            </h2>
            <MessageForm onSubmit={handleSubmit} submitting={submitting} />
          </section>

          {/* Coluna direita: Listas */}
          <section aria-labelledby="messages-lists" className="space-y-8">
            <h2 id="messages-lists" className="sr-only">
              Listas de mensagens
            </h2>

            <MessagesTable
              title="Mensagens Pendentes"
              messages={messages}
              status="pending"
            />

            <MessagesTable
              title="Mensagens Recusadas"
              messages={messages}
              status="rejected"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
