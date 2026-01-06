// app/(app)/layout.tsx

import Header from "@/components/Header";
import { getServerSession } from "@/lib/serverSession";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <>
      {/* Header fixo */}
      <Header sellerName={session?.sellerName} />

      {/* Conteúdo (sem sidebar) */}
      <main className="pt-16 min-w-0">{children}</main>
    </>
  );
}
