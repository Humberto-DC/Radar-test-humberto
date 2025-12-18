// components/home/HomeClient.tsx
"use client";
import { useMemo, useState } from "react";
import FiltersBar from "./FiltersBar";
import ClientsTable from "./ClientsTable";
import MessagesPanel from "./MessagesPanel";
import MessagePreview from "./MessagePreview";
import SendActions from "./SendActions";
import ResultSummary from "./ResultSummary";

import { Client, Message, SelectedMap, Contacts } from "./types";
import { daysFrom, keyOf, normalizePhone} from "./utils";

type Props = {
  Clients: Client[];
  Messages: Message[];
  Contacts: Contacts[];
};

export default function HomeClient({ Clients: clients, Messages, Contacts }: Props) {
  const [minCredit, setMinCredit] = useState("0");
  const [minDays, setMinDays] = useState("0");
  const [lastInteraction, setLastInteraction] = useState("0"); 
  const [seller, setSeller] = useState(""); 

  const [messageSearch, setMessageSearch] = useState("");
  const [messageID, setMessageID] = useState("");
  const [selected, setSelected] = useState<SelectedMap>({});
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const selectedMessage = Messages.find((m) => m.id_mensagem === messageID);

  const filteredClients = useMemo(() => {
  const minCreditNum = parseFloat(minCredit || "0");
  const minDaysNum = parseInt(minDays || "0", 10);
  const lastIntNum = parseInt(lastInteraction || "0", 10);
  const sellerTerm = seller.trim().toLowerCase();


  const validClients = clients.filter((c) => {
    if (Number.isFinite(minCreditNum) && c.Limite < minCreditNum)
      return false;

    const daysFromLastPurchase = daysFrom(c.ultima_compra);
    if (Number.isFinite(minDaysNum) && daysFromLastPurchase < minDaysNum)
      return false;

    const daysFromLastInteraction = daysFrom(c.ultima_interacao ?? null);
    if (Number.isFinite(lastIntNum) && daysFromLastInteraction < lastIntNum)
      return false;

    if (sellerTerm) {
      // Ajuste aqui conforme o nome real do campo no tipo Client
      const sellerName = (c.Vendedor || "").toLowerCase();
      if (!sellerName.includes(sellerTerm)) return false;
    }
    return true;
  });

  // 🔽 Ordena:
  // 1º — clientes com última interação mais recente (menor número de dias)
  // 2º — clientes que nunca interagiram vão para o fim
    return validClients.sort((a, b) => {
      const aDate = a.ultima_interacao ? new Date(a.ultima_interacao).getTime() : 0;
      const bDate = b.ultima_interacao ? new Date(b.ultima_interacao).getTime() : 0;

      if (aDate === 0 && bDate === 0) return 0;  // ambos nunca interagiram
      if (aDate === 0) return 1; // a nunca interagiu → vai pra baixo
      if (bDate === 0) return -1; // b nunca interagiu → vai pra baixo
      return bDate - aDate; // mais recente primeiro
    });
  }, [clients, minCredit, minDays, lastInteraction, seller]);


  const allFilteredSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selected[keyOf(c.id_cliente)]);

  const phoneByClientId = useMemo(() => {
  // agrupa por cliente e pega o primeiro telefone não vazio (id_contato menor)
  const best: Record<string, string> = {};

  // ordena pra garantir estabilidade
  const sorted = [...Contacts].sort((a, b) => Number(a.id_contato ?? 0) - Number(b.id_contato ?? 0));

    for (const c of sorted) {
      const id = keyOf(c.id_cliente);
      if (best[id]) continue;
      const tel = normalizePhone(c.telefone);
      if (tel) best[id] = tel;
    }

    return best; // { "123": "11999998888" }
  }, [Contacts]);

  const selectedPhoneOwner = useMemo(() => {
    const map = new Map<string, string>();
    for (const cli of filteredClients) {
      const id = keyOf(cli.id_cliente);
      if (!selected[id]) continue;
      if (!cli.ativo) continue;
      const tel = phoneByClientId[id];
      if (tel) map.set(tel, id);
    }
    return map;
  }, [filteredClients, selected, phoneByClientId]);

  const toggleOne = (id: string | number) =>
    setSelected((prev) => {
      const k = keyOf(id);
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      return next;
    });

  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = { ...prev };

      if (allFilteredSelected) {
        filteredClients.forEach((c) => delete next[keyOf(c.id_cliente)]);
        return next;
      }

      const used = new Set<string>();
      filteredClients.forEach((c) => {
        const id = keyOf(c.id_cliente);
        if (!c.ativo) return;

        const tel = phoneByClientId[id] || "";
        if (!tel) {
          // se não tem telefone, você decide: selecionar ou não.
          // eu recomendo NÃO selecionar automaticamente:
          return;
        }
        if (used.has(tel)) return;
        used.add(tel);
        next[id] = true;
    });

    return next;
  });

  const handleResult = (s: any) => {
    setSummary(s);
    setSending(false);
  };

  const resetAfterSend = () => {
    setSelected({});
    setMessageID("");
    setMessageSearch("");
  };

  
  return (
                            // h-min - altura Header
    <div className="flex-1 min-h-[calc(100vh-4rem)] bg-[#e6e8ef] py-8"> 
      <div className="flex-1 mx-auto w-full max-w-screen-2xl px-6 xl:px-12">

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10 lg:gap-16">
          {/* LEFT */}
          <div className="flex flex-col gap-6">
            <FiltersBar
              minCredit={minCredit}
              setMinCredit={setMinCredit}
              minDaysSince={minDays}
              setMinDaysSince={setMinDays}
              lastInteraction={lastInteraction}
              setLastInteraction={setLastInteraction}
              seller={seller}
              setSeller={setSeller}
            />

            <ClientsTable
              clients={filteredClients}
              selectedMap={selected}
              onToggle={toggleOne}
              allFilteredSelected={allFilteredSelected}
              onToggleSelectAll={toggleSelectAll}
              phoneByClientId={phoneByClientId}
              selectedPhoneOwner={selectedPhoneOwner}
            />

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Envio</h3>
              <MessagePreview message={selectedMessage} />
              <SendActions
                sending={sending}
                selectedMap={selected}
                clients={filteredClients}
                contacts={Contacts}
                selectedMessage={selectedMessage}
                onResult={handleResult}
                onResetSelection={resetAfterSend}
              />
              <ResultSummary summary={summary} />
            </div>
          </div>

          {/* RIGHT */}
          <aside className="flex flex-col gap-4">
            <MessagesPanel
              messages={Messages}
              search={messageSearch}
              setSearch={setMessageSearch}
              selectedMessageID={messageID}
              onSelectMessage={setMessageID}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
