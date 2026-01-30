"use client";

import { useMemo, useState } from "react";
import type { OpenBudgetCard } from "@/types/dashboard";
import { parseLooseDate, formatLocalVeryShort } from "@/lib/dates";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import PhonePickerModal from "@/components/dashboard/PhonePickerModal";
import type { PhoneOption } from "@/types/dashboard";
type Props = { client: OpenBudgetCard };

function buildMessage() {
  return `Oi! Passando pra ver como você está e se posso te ajudar com um novo pedido 😊`;
}

function daysUntil(date: Date | null) {
  if (!date) return null;

  // normaliza "hoje" e "validade" pra meia-noite local
  const today = new Date();
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const d = new Date(date);
  const d1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = d1.getTime() - d0.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}


function uniquePhonesFromClient(client: OpenBudgetCard): PhoneOption[] {
  const contacts = client.contatos ?? [];
  const seen = new Set<string>();
  const out: PhoneOption[] = [];

  for (const c of contacts) {
    const phone = (c.telefone ?? "").trim();
    if (!phone) continue;

    const key = phone.replace(/\D/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: String(c.id_contato),
      name: (c.nome_contato ?? "").trim() || "Contato",
      role: (c.funcao ?? "").trim() || null,
      phone,
    });
  }

  return out;
}

function getAccentColor(daysLeft: number | null) {
  // ✅ ajuste fácil aqui:
  // overdue -> amarelo
  // vence em até 3 dias -> laranja
  // ok -> verde
  if (daysLeft == null) return "#80ef80";
  if (daysLeft < 0) return "#FFE865";
  return "#80ef80";
}

export default function DashboardClientCard({ client }: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // validade

function parseDateOnly(raw: string): Date | null {
  // pega só YYYY-MM-DD mesmo que venha ISO completo
  const datePart = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d); // meia-noite LOCAL
}

const validUntil = useMemo(() => {
  const raw = client.validade_orcamento_min;
  if (!raw) return null;

  // ✅ parse seguro (ignora timezone do ISO)
  const dLocal = parseDateOnly(raw);
  if (dLocal) return dLocal;

  // fallback se vier em outro formato
  return parseLooseDate(raw as any) ?? null;
}, [client.validade_orcamento_min]);



  const daysLeft = useMemo(() => daysUntil(validUntil), [validUntil]);
  const isOverdue = daysLeft != null && daysLeft < 0;

  const accentColor = useMemo(() => getAccentColor(daysLeft), [daysLeft]);

  // contatos / whatsapp
  const phoneChoices = useMemo(() => uniquePhonesFromClient(client), [client]);
  const hasPhone = phoneChoices.length > 0;

  function openWhatsApp(phone: string) {
    window.open(buildWhatsAppLink(phone, buildMessage()), "_blank");
  }

  function handleSend() {
    if (!hasPhone) return;
    if (phoneChoices.length === 1) return openWhatsApp(phoneChoices[0].phone);
    setIsPickerOpen(true);
  }

  function handlePickPhone(opt: PhoneOption) {
    openWhatsApp(opt.phone);
    setIsPickerOpen(false);
  }

  const moneyBRL = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
    []
  );
  console.log(client.validade_orcamento_min, validUntil, daysLeft);


  return (
    <div
      className={[
        "rounded-2xl bg-white border border-[#E9ECEF] border-l-4",
        "p-3 shadow-sm hover:shadow-md transition",
        "h-full flex flex-col",
      ].join(" ")}
      style={{ borderLeftColor: accentColor }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#212529]">
              {client.id_cliente} {client.Cliente}
            </p>

            <div className="flex gap-2">
              {client.is_carteira ? (
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-600"
                  style={{ backgroundColor: `${accentColor}33` }}
                >
                  Carteira
                </span>
              ) : null}

              {isOverdue ? (
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-gray-600"
                  style={{ backgroundColor: `${accentColor}33` }}
                >
                  Vencido
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#868E96]">
            <span className="truncate">
              {client.Cidade} • {client.Estado} • Limite:{" "}
              {moneyBRL.format(client.Limite)}
            </span>

            {client.open_budget_id != null && (
              <span>• Orçamento: {client.open_budget_id}</span>
            )}

            {validUntil && (
              <span className={isOverdue ? "text-[#868E96]" : undefined}>
                • Validade: {formatLocalVeryShort(validUntil)}
                {daysLeft != null ? ` (${daysLeft}d)` : ""}
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
          style={hasPhone ? { backgroundColor: accentColor } : undefined}
        >
          Mensagem
        </button>
      </div>

      <PhonePickerModal
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        clientName={client.Cliente}
        options={phoneChoices}
        onPick={handlePickPhone}
      />
    </div>
  );
}
