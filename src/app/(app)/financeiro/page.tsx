// src/app/(app)/financeiro/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/serverSession";
import FinanceiroClient from "@/components/finance/FinanceiroClient";

export default async function FinanceiroPage() {
    const session = await getServerSession();

    if (!session) {
        redirect("/select-user");
    }

    // Apenas admins podem acessar o financeiro
    if (session.role !== "admin") {
        redirect("/dashboard");
    }

    return <FinanceiroClient />;
}
