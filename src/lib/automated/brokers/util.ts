// Helpers shared by all broker adapters.

export type Row = Record<string, string>;

/** Case/space-insensitive column lookup against a list of candidate headers. */
export function pick(row: Row, candidates: string[]): string | undefined {
  const norm = (k: string) => k.toLowerCase().replace(/[\s_./-]/g, "");
  const map = new Map<string, string>();
  for (const key of Object.keys(row)) map.set(norm(key), row[key]);
  for (const c of candidates) {
    const v = map.get(norm(c));
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

export function toNumber(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function toInt(v: string | undefined): number {
  return Math.round(toNumber(v));
}

/** Parse a date+time from a variety of broker formats. */
export function parseDateTime(date?: string, time?: string): Date {
  const raw = [date, time].filter(Boolean).join(" ").trim();
  if (!raw) return new Date(NaN);

  // ISO-ish: 2024-06-05T09:20:00 or 2024-06-05 09:20:00
  let d = new Date(raw.replace(" ", "T"));
  if (!isNaN(d.getTime())) return d;

  // DD-MM-YYYY HH:mm:ss or DD/MM/YYYY
  const m = raw.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (m) {
    const [, dd, mm, yyyyRaw, hh = "0", mi = "0", ss = "0"] = m;
    const yyyy = yyyyRaw.length === 2 ? 2000 + parseInt(yyyyRaw, 10) : parseInt(yyyyRaw, 10);
    return new Date(yyyy, parseInt(mm, 10) - 1, parseInt(dd, 10), +hh, +mi, +ss);
  }

  d = new Date(raw);
  return d;
}

const HAS_TIME = /\d{1,2}:\d{2}/;
const HAS_DATE = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

/**
 * Pick the right date/time source. Some brokers (e.g. Zerodha) store a full
 * datetime in one column and a plain date in another — concatenating them
 * produces garbage, so prefer whichever single field already has both.
 */
export function resolveDateTime(dateVal?: string, timeVal?: string): Date {
  const full = (s?: string) => !!s && HAS_TIME.test(s) && HAS_DATE.test(s);
  if (full(timeVal)) return parseDateTime(timeVal);
  if (full(dateVal)) return parseDateTime(dateVal);
  return parseDateTime(dateVal, timeVal);
}

export function normalizeSide(v: string | undefined): "BUY" | "SELL" {
  const s = (v || "").toUpperCase();
  if (s.startsWith("S") || s.includes("SELL")) return "SELL";
  return "BUY";
}
