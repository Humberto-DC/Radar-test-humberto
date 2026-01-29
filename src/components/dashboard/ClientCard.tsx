"use client";

import { useMemo, useState } from "react";
import type { OpenBudgetCard } from "@/types/dashboard";
import { parseLooseDate, formatLocalVeryShort } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import PhonePickerModal from "@/components/home/PhonePickerModal";

type Props = { client: OpenBudgetCard };

function buildMessage() {
  return `Oi! Passando pra ver como você está e se posso te ajudar com um novo pedido 😊`;
}

type PhoneOption = {
  id: string;
  nome: string;
  funcao: string | null;
  phone: string;
};

function daysUntil(date: Date | null) {
  if (!date) return null;
  const today = new Date();
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = d1.getTime() - d0.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function uniquePhonesFromClient(client: OpenBudgetCard): PhoneOption[] {
  const contatos = client.contatos ?? [];
  const seen = new Set<string>();
  const out: PhoneOption[] = [];

  for (const c of contatos) {
    const phone = (c.telefone ?? "").trim();
    if (!phone) continue;

    const key = phone.replace(/\D/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: String(c.id_contato),
      nome: ((c.nome_contato ?? "").trim() || "Contato") as string,
      funcao: (c.funcao ?? "").trim() || null,
      phone,
    });
  }

  return out;
}

export default function DashboardClientCard({ client }: Props) {
  const [open, setOpen] = useState(false);

  // datas
  const dueDate = useMemo(() => {
    const d = parseLooseDate(client.validade_orcamento_min as any);
    return d ?? null;
  }, [client.validade_orcamento_min]);

  const daysToExpire = useMemo(() => daysUntil(dueDate), [dueDate]);
  const isExpired = daysToExpire != null && daysToExpire < 0;

  // regras de cor
  const accent = isExpired ? "#FFE865" : "#80ef80";

  // contatos / whatsapp
  const phoneOptions = useMemo(() => uniquePhonesFromClient(client), [client]);
  const hasPhone = phoneOptions.length > 0;

  function sendTo(phone: string) {
    window.open(buildWhatsAppLink(phone, buildMessage()), "_blank");
  }

  function handleSend() {
    if (!hasPhone) return;
    if (phoneOptions.length === 1) return sendTo(phoneOptions[0].phone);
    setOpen(true);
  }

  function pickPhone(opt: PhoneOption) {
    sendTo(opt.phone);
    setOpen(false);
  }

  const moneyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }),
    []
  );

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-[#E9ECEF] border-l-4",
        "p-3 shadow-sm hover:shadow-md transition",
        "h-full flex flex-col",
      ].join(" ")}
      style={{ borderLeftColor: accent }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#212529]">
              {client.id_cliente} {client.Cliente}
            </p>

            <div className="flex gap-2">
              {client.is_carteira ? (
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-500"
                  style={{ backgroundColor: `${accent}33` }} // ~20% opacity
                >
                  Carteira
                </span>
              ) : null}

              {isExpired ? (
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-500"
                  style={{ backgroundColor: `${accent}33` }}
                >
                  Vencido
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#868E96]">
            <span className="truncate">
              {client.Cidade} • {client.Estado} • Limite:{" "}
              {moneyFormatter.format(client.Limite)}
            </span>

            {client.open_budget_id != null && (
              <span>• Pedido: {client.open_budget_id}</span>
            )}

            {dueDate && (
              <span
                className={isExpired ? "text-[#868E96]" : undefined}
              >
                • Validade: {formatLocalVeryShort(dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2 flex flex-wrap items-center gap-1">
        <button
          onClick={handleSend}
          disabled={!hasPhone}
          className={[
            "rounded-lg px-4 py-1.5 text-[11px] font-semibold transition",
            "ring-1 ring-inset",
            hasPhone
              ? "text-white"
              : "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed",
          ].join(" ")}
          style={
            hasPhone
              ? { backgroundColor: accent, borderColor: accent }
              : undefined
          }
        >
          Mensagem
        </button>
      </div>

      <PhonePickerModal
        open={open}
        onClose={() => setOpen(false)}
        clientName={client.Cliente}
        options={phoneOptions}
        onPick={pickPhone}
      />
    </div>
  );
}
