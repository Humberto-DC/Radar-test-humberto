export function daysSince(dateLike?: string | Date | null) {
  if (!dateLike) return Infinity;                 // nunca interagiu
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return Infinity;        // inválida → trata como nunca
  const diffMs = Date.now() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export const keyOf = (v: string | number) => String(v);

export function cleanName(raw: string): string {
  if (!raw) return "";

  const s = raw.replace(/^\d+\s*[-:]?\s*/g, "");
  
  const full_name = s.split(" ");
  return full_name.slice(0,2).join(" ")
}

const onlyDigits = (s?: string | null) => (s || "").replace(/\D/g, "");

// normaliza para formato local: DDD + número (sem DDI, sem símbolo)
const normalizePhone = (input?: string | null) => {
  const digits = onlyDigits(input);

  if (!digits) return "";

  // se vier com DDI + DDD + número (ex: 5561996246646), remove o 55
  if (digits.length > 11 && digits.startsWith("55")) {
    return digits.slice(2); // tira o 55
  }

  // se já estiver local (61 996246646 → 61996246646), mantém
  return digits;
};
