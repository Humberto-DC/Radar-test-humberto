function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export type DateLike = string | Date | null | undefined;
export type NumberLike = string | number | null | undefined;

/**
 * Robust date parser for DB/user inputs.
 * Accepts:
 * - Date (already typed)
 * - "2025-12-01"
 * - "01/12/2025"
 * - "2025/12/01"
 * - "01-12-2025"
 * - "2025-12-01 00:00:00"
 * - ISO ("2025-12-01T00:00:00.000Z")
 */
export function parseLooseDate(input: DateLike): Date | null {
  if (input == null) return null;

  // Already a Date
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // ✅ Take only the "YYYY-MM-DD" part (works for "YYYY-MM-DD HH:mm:ss" and ISO "YYYY-MM-DDT...")
  const datePart = raw.split(/[ T]/)[0];

  // 1) dd/mm/yyyy or dd-mm-yyyy
  let m = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 2) dd/mm/yy or dd-mm-yy -> assume 20yy
  m = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const yy = Number(m[3]);
    const year = 2000 + yy;
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 3) yyyy/mm/dd or yyyy-mm-dd
  m = datePart.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 4) ISO / any JS-parsable date
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  return null;
}


/**
 * Robust number parser for DB/user inputs.
 * Accepts:
 * - number (already typed)
 * - "1.234,56", "1234.56"
 * - "15 days", "15,0"
 *
 * Returns integer (floor) and null for invalid/negative.
 */
export function parseLooseNumber(input: NumberLike): number | null {
  if (input == null) return null;

  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return input < 0 ? null : Math.floor(input);
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // remove thousand separators and normalize decimal comma
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  const n = Number(match[0]);
  if (!Number.isFinite(n)) return null;

  return n < 0 ? null : Math.floor(n);
}

/**
 * Difference in whole days between a date and today (local day boundaries).
 */
export function daysSince(date: Date | null): number | null {
  if (!date) return null;

  const now = new Date();

  // normalize both to start of local day
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekLocal(d: Date) {
  // week starts on Monday
  const day = d.getDay(); // 0 Sunday..6 Saturday
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

// lib/dates.ts
export function formatLocalVeryShort(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  
  }).format(date);
}
