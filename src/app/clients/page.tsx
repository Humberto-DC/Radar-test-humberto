// app/clients/page.tsx
export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ClientsClient from "@/components/clients/ClientsClient";
import type { AdminClient } from "@/components/clients/types";

export default async function ClientsPage() {
  // carrega todos os clientes para a tela de administração
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("id_cliente, Cliente, Cidade, Vendedor, Limite, ativo")
    .order("Cliente", { ascending: true });

  if (error) {
    console.error("❌ Error loading clients:", error);
    return <p>Erro ao carregar clientes.</p>;
  }

  return <ClientsClient clients={(data || []) as AdminClient[]} />;
}
