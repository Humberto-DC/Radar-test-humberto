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

  const parts = cleaned.split(" ");

  // 🔹 regra especial para "VENDEDOR"
  if (parts[0].toUpperCase() === "VENDEDOR") {
    return parts.slice(0, 3).join(" ");
  }

  // 🔹 só um nome
  if (parts.length === 1) {
    return parts[0];
  }

  // 🔹 dois primeiros nomes
  return parts.slice(0, 2).join(" ");
}
