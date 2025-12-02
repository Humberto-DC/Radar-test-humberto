// components/Sidebar.tsx
"use client";
import Link from "next/link";
import { MessageSquare, Zap, Menu, History, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Triggers", icon: Zap },
    { href: "/messages", label: "Mensagens", icon: MessageSquare },
    { href: "/history", label: "Histórico", icon: History },
  ];

  return (
    <>
      {/* TOPBAR MOBILE (apenas mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-linear-to-r from-[#2323ff] to-[#2323ff] text-white">
        <div className="text-2xl font-bold">Painel</div>
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu />
        </button>
      </div>

      {/* MOBILE: backdrop + drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* drawer */}
          <aside className="relative z-50 h-full w-64 bg-linear-to-b from-blue-700 to-blue-500 text-white p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight">Painel</h1>
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X />
              </button>
            </div>

            <nav className="flex-1">
              <ul className="flex flex-col gap-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 p-2 rounded ${
                        pathname === href
                          ? "bg-blue-100/40 font-semibold"
                          : "hover:bg-blue-100/20"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="text-sm text-blue-100/80 mt-auto">
              <div>v. 1.0</div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR (mini/expandida, empurra o conteúdo via flex no layout) */}
      <aside
        className={`
          hidden md:flex flex-col h-full
          bg-linear-to-b from-[#2323ff] to-[#151597] text-white
          p-4 transition-all duration-300
          ${isDesktopOpen ? "w-50" : "w-18"}
        `}
      >
        <div className="flex flex-row justify-between">
          {/* header */}
          <div className={`overflow-hidden transition-all ${isDesktopOpen ? "opacity-100 max-h-20" : "opacity-0 max-h-0"}`}>
            <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          </div>

          {/* botão de toggle */}
          <button
            onClick={() => setIsDesktopOpen((v) => !v)}
            className="self-end rounded-lg bg-blue-600/80 p-1.5 hover:bg-blue-500 transition"
            aria-label={isDesktopOpen ? "Recolher menu" : "Expandir menu"}
          >
            {isDesktopOpen ? <X size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <p className={`text-sm text-blue-200/80 mt-1 mb-5  ${isDesktopOpen ? "opacity-100 max-h-20" : "opacity-0 max-h-0"}`}>
           Gerencie suas mensagens
        </p>

        {/* navegação */}
      <nav className="flex-1">
        <ul className="flex flex-col gap-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex items-center p-2 rounded transition-all w-full
                    ${isDesktopOpen ? "justify-start gap-3" : "justify-center"}
                    ${
                      active
                        ? "bg-[#b6f01f]  text-[#1a1a1a] opacity-85"
                        : "hover:bg-[#b6f01f99]"
                    }
                  `}
                >
                  <Icon size={18} />
                  {isDesktopOpen && (
                    <span className="whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
        <div
          className={`
            text-sm text-blue-100/80 mt-auto
            transition-opacity ${isDesktopOpen ? "opacity-100" : "opacity-0"}
          `}
        >
          <div>v. 1.0</div>
        </div>
      </aside>
    </>
  );
}
