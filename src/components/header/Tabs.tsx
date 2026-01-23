"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutGrid } from "lucide-react";

function tabClass(active: boolean) {
  return [
    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
    active
      ? "bg-white text-[#2323ff] shadow-sm"
      : "text-white/90 hover:text-white hover:bg-white/10",
  ].join(" ");
}

export default function HeaderTabs() {
  const pathname = usePathname();

  const isCrm = pathname === "/" || pathname.startsWith("/crm") || pathname.startsWith("/vendas");
  const isDash = pathname.startsWith("/dashboard");

  return (
    <nav
      className="inline-flex items-center gap-1 rounded-2xl p-1 "
      aria-label="Navegação"
    >
      <Link href="/" className={tabClass(isCrm)}>
        <Target className="truncate h-4 w-4 " />
        CRM/Vendas
      </Link>

      <Link href="/dashboard" className={tabClass(isDash)}>
        <LayoutGrid className="h-4 w-4" />
        Dashboard
      </Link>
    </nav>
  );
}
            

