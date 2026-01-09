//components\auth\select-user\SelectUserClient.tsx

"use client";
import { twoNames } from "@/types/auth"; 
import { useRouter } from "next/navigation";
import UserCard from "./UserCard";

type Seller = { id: number; nome: string };



export default function SelectUserClient({ sellers }: { sellers: Seller[] }) {
  const router = useRouter();

  async function selectSeller(s: Seller) {
    const payload = { role: "seller", sellerId: s.id, sellerName: s.nome } as const;

    await fetch("/api/auth/select-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    router.replace("/");
    router.refresh(); // 👈 força SSR reler cookie
  }

  async function selectAdmin() {
    const payload = { role: "admin", sellerName: "Admins" } as const;

    await fetch("/api/auth/select-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    router.replace("/");
    router.refresh(); // 👈 força SSR reler cookie

  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-12">

        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900">
            Selecione seu usuário
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Escolha seu perfil para acessar o sistema de reativação de clientes
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          <UserCard
            title="Admins"
            subtitle="Acesso completo ao sistema"
            badge="Admin"
            variant="admin"
            onClick={selectAdmin}
          />

          {sellers.map((s) => (
            <UserCard
              key={s.id}
              title={twoNames(s.nome)}
              subtitle={
                s.id === -1
                  ? "Clientes sem vendedor atribuído"
                  : "Acesso à carteira de clientes"
              }
              badge={s.id === -1 ? "Sem vendedor" : "Vendedor"}
              variant={s.id === -1 ? "admin" : "seller"}
              onClick={() => selectSeller(s)}
            />
          ))}

        </div>
      </div>
    </div>
  );
}
