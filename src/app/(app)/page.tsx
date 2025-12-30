import { unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import HomeClient from "@/components/home/HomeClient";
import type { ClienteRow, ContatoRow, ClienteComContatos } from "@/types/crm";
import { getServerSession } from "@/lib/serverSession";
import { redirect } from "next/navigation";

export default async function Page() {
  noStore();

  const session = await getServerSession(); // 👈 await
  console.log("SESSION:", session);

  if (!session) redirect("/select-user");

  let q = supabaseAdmin.from("clientes").select("*").eq("ativo", true);

  if (session.role === "seller") {
    q = q.eq("id_vendedor", session.sellerId);
  }

  const { data: clients, error: e1 } = await q;
  const { data: contatos, error: e2 } = await supabaseAdmin
    .from("contatos_cliente")
    .select("*");

  if (e1 || e2) {
    console.error(e1 || e2);
    return <p>Error loading clients.</p>;
  }

  const byClient = new Map<number, ContatoRow[]>();
  (contatos as ContatoRow[] | null)?.forEach((c) => {
    const arr = byClient.get(c.id_cliente) || [];
    arr.push(c);
    byClient.set(c.id_cliente, arr);
  });

  const enriched: ClienteComContatos[] =
    (clients as ClienteRow[] | null)?.map((cl) => ({
      ...cl,
      contatos: byClient.get(cl.id_cliente) || [],
    })) || [];

  return <HomeClient clients={enriched} />;
}
