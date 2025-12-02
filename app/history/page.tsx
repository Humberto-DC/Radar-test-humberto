// app/history/page.tsx
export const dynamic = "force-dynamic"; 

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import HistoryClient from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const { data, error } = await supabaseAdmin
    .from("envios")
    .select("*, clientes(Cliente), mensagens(titulo)") // junta dados úteis
    .order("data_envio", { ascending: false });

  if (error) {
    console.error("❌ Error loading history:", error);
    return <p>Erro ao carregar histórico.</p>;
  }

  return <HistoryClient history={data || []} />;
}
