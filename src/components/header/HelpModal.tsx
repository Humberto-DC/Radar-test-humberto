"use client";

import { X, MessageCircle, CheckCircle2, SwatchBook, SquareCheckBig, Undo2, Send } from "lucide-react";

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

export default function HelpModal({ open, onClose, sellerName }: Props) {
  if (!open) return null;

  const supportHref = buildWhatsAppSupportLink(
    "5561996246646",
    `Oi! Sou ${sellerName ?? "usuário"} e preciso de ajuda no painel de reativação de clientes.`
  );

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
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Ajuda rápida</h2>
            <p className="mt-1 text-sm text-slate-500">
              Um passo a passo simples para usar o painel.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar ajuda"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
                {/* Steps */}
        <div className="grid gap-3 sm:grid-cols-2">
        {/* 1) Colunas */}
        <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
            <CheckCircle2 className="text-slate-700" size={18} />
            <p className="text-sm font-semibold text-slate-800">1) Entenda as colunas</p>
            </div>

            <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>• <b>Enviar mensagem</b>: Não comprou nem foi contatado recentemente.</li>
            <li>• <b>Acompanhar</b>: Você contatou nos últimos 7 dias, mas ainda não comprou, fique atento no andamento da negocioação.</li>
            <li>• <b>Ok</b>: Compra recente, tudo certo.</li>
            </ul>
        </div>

        {/* 2) Cores */}
        <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
            <SwatchBook className="text-slate-700" size={18} />
            <p className="text-sm font-semibold text-slate-800">2) Entenda as cores</p>
            </div>

            <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>• <span className="text-red-400">Vermelho</span>: não compra há mais de 1 mês (prioridade).</li>
            <li>• <span className="text-amber-400">Amarelo</span>: não compra há mais de 7 dias (atenção).</li>
            <li>• <span className="text-green-400">Verde</span>: compra recente.</li>
            </ul>
        </div>

        {/* 3) Enviar mensagem */}
        <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
            <Send className="text-slate-700"size={18} />
            <p className="text-sm font-semibold text-slate-800">3) Enviar mensagem</p>
            </div>

            <p className="mt-2 text-sm text-slate-600">
            Clique em <b>Mensagem</b> para abrir o WhatsApp com um texto pronto.  
            Se houver mais de um contato, o sistema vai pedir para você escolher.
            </p>
        </div>

        {/* 4) Marcar como feito + Desfazer */}
        <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
            <SquareCheckBig className="text-slate-700"size={18} />
            <p className="text-sm font-semibold text-slate-800">
                4) Marcar como feito e desfazer
            </p>
            </div>

            <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
                Depois de contatar o cliente, clique em <b>Feito</b> para registrar a última interação.
            </p>

            <div className="flex items-center gap-2">
                <Undo2 className="text-slate-700" size={16} />
                <p>
                Se marcou errado, use <b>Desfazer</b> para voltar ao status anterior.
                </p>
            </div>
            </div>
        </div>
        </div>


        {/* Tip */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-slate-700" size={18} />
            <p className="text-sm font-semibold text-slate-800">
              Não entendeu? Fala com o suporte
            </p>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Se aparecer algum erro, ou se algo não fizer sentido, chama no WhatsApp.
          </p>

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
              Suporte no WhatsApp
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
