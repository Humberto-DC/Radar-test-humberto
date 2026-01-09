//types\auth.ts

export type AppRole = "seller" | "admin";

export type AppUser = {
  role: AppRole;
  sellerId?: number;      // só quando role === "seller"
  sellerName: string;     // nome que aparece na UI
};

export function twoNames(fullName?: string) {
  if (!fullName) return "";

  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  // quebra e remove palavras com até 2 letras
  const parts = cleaned
    .split(" ")
    .filter((p) => p.length > 2);

  if (parts.length === 0) return "";

  // 🔹 regra especial para "VENDEDOR"
  if (parts[0].toUpperCase() === "GRUPO") {
    return parts.slice(0, 3).join(" ");
  }

  // 🔹 só um nome
  if (parts.length === 1) {
    return parts[0];
  }

  // 🔹 dois primeiros nomes válidos
  return parts.slice(0, 2).join(" ");
}

