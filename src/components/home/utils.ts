export const keyOf = (v: string | number) => String(v);

export function cleanName(raw: string): string {
  if (!raw) return "";
  const s = raw.replace(/^\d+\s*[-:]?\s*/g, "");
  const full_name = s.split(" ");
  return full_name.slice(0, 2).join(" ");
}

export const normalizePhone = (input?: string | null) => {
  if (!input) return "";
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("55")) digits = digits.slice(2);
  return digits;
};

/**
 * Aceita:
 * - number (dias)
 * - string numérica / "37 dias"
 * - string date ISO ("2025-12-01" / "2025-12-01T...")
 * - Date
 * Retorna dias ou Infinity (quando não existe / inválido)
 */
export function daysFrom(value?: string | number | Date | null) {
  if (value === null || value === undefined || value === "") return Infinity;

  // já veio como número de dias
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);

  if (typeof value === "string") {
    // tenta extrair dias de string ("37", "37 dias", "37,0")
    const m = value.match(/-?\d+(?:[.,]\d+)?/);
    if (m) {
      const n = Number(m[0].replace(",", "."));
      if (Number.isFinite(n)) return Math.floor(n);
    }

    // tenta como data
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const diffMs = Date.now() - d.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return Infinity;
  }

  // Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    const diffMs = Date.now() - value.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  return Infinity;
}


