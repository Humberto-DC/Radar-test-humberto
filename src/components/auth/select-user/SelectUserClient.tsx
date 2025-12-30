"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import UserCard from "./UserCard";

type Seller = { id: number; nome: string };

function firstName(fullName?: string) {
  if (!fullName) return "";
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  return cleaned.split(" ")[0] ?? "";
}

export default function SelectUserClient({ sellers }: { sellers: Seller[] }) {
  const router = useRouter();
  const { setUser } = useAuth();

  async function selectSeller(s: Seller) {
    const payload = { role: "seller", sellerId: s.id, sellerName: s.nome } as const;

    await fetch("/api/auth/select-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    setUser(payload);
    router.replace("/");
  }

  async function selectAdmin() {
    const payload = { role: "admin", sellerName: "Admins" } as const;

    await fetch("/api/auth/select-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    setUser(payload);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900">
            Selecione seu usuário
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Escolha seu perfil para acessar o sistema de reativação de clientes
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              title={firstName(s.nome)}
              subtitle="Acesso à carteira de clientes"
              badge="Vendedor"
              variant="seller"
              onClick={() => selectSeller(s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
