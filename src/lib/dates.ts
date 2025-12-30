function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Parse robusto para ultima_compra (text).
 * Aceita: "2025-12-01", "01/12/2025", "2025/12/01", "01-12-2025"
 */
export function parseLooseDate(input: string | null): Date | null {
  if (!input) return null;

  const s = String(input).trim();
  if (!s) return null;

  // remove hora se vier "dd/mm/yyyy HH:mm:ss" ou "yyyy-mm-dd HH:mm:ss"
  const onlyDate = s.split(" ")[0];

  // 1) dd/mm/yyyy or dd-mm-yyyy
  let m = onlyDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);

    // cria em horário local (mais previsível pra "dias desde")
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 2) dd/mm/yy or dd-mm-yy  -> assume 20yy (ajuste se você tiver 19xx)
  m = onlyDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yy = Number(m[3]);
    const yyyy = 2000 + yy;

    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 3) yyyy/mm/dd or yyyy-mm-dd
  m = onlyDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);

    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 4) ISO completo (com T, Z etc.)
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime())) return iso;

  return null;
}

export function parseLooseNumber(input: string | null): number | null {
  if (input == null) return null;

  const s = String(input).trim();
  if (!s) return null;

  // pega só dígitos (caso venha "15 dias" ou "15,0")
  const normalized = s.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!normalized) return null;

  const n = Number(normalized[0]);
  if (Number.isNaN(n)) return null;

  // dias devem ser >= 0
  return n < 0 ? null : Math.floor(n);
}


export function daysSince(date: Date | null): number | null {
  if (!date) return null;

  const now = new Date();

  // normaliza ambos pro início do dia local (evita diferença por horas/fuso)
  const startA = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startB = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diff = startB.getTime() - startA.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}


export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekLocal(d: Date) {
  // semana começando na segunda
  const day = d.getDay(); // 0 domingo..6 sábado
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
}

export function isInThisWeek(date: Date) {
  const now = new Date();
  const start = startOfWeekLocal(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

export function formatLocalShort(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}
