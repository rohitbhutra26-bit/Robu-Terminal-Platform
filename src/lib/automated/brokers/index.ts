import type { Broker, RawExecution, AssetClass, OptionType } from "../types";
import { parsedFromFields } from "../symbolParser";
import { normalizeSide } from "./util";

// ---------------------------------------------------------------------------
// Universal broker ingestion.
//
// Each broker exports a wildly different file (Zerodha: clean CSV, packed
// symbol; Kotak: BOM CSV, space-packed symbol, real charges; HDFC: xlsx order
// log, dashed symbol, cancelled rows). Rather than one rigid parser we give
// each broker a small adapter that knows ONLY how to turn its own rows into a
// list of normalized RawExecutions. Everything downstream is shared.
//
// A "row" here is already a header->value object (CSV parsed by the caller, or
// an xlsx sheet mapped to objects). detectBroker() fingerprints the headers.
// ---------------------------------------------------------------------------

export type Row = Record<string, string>;

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

const norm = (k: string) => k.toLowerCase().replace(/[\s_./-]/g, "");

/** Case/space-insensitive lookup against candidate header names. */
function field(row: Row, candidates: string[]): string {
  const map = new Map<string, string>();
  for (const key of Object.keys(row)) map.set(norm(key), row[key]);
  for (const c of candidates) {
    const v = map.get(norm(c));
    if (v !== undefined && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// ---- Broker auto-detection ------------------------------------------------

interface Fingerprint {
  broker: Broker;
  markers: string[]; // headers that, if present, indicate this broker
}

const FINGERPRINTS: Fingerprint[] = [
  { broker: "ZERODHA", markers: ["order_execution_time", "trade_type", "isin"] },
  { broker: "KOTAK", markers: ["security name", "market rate", "stt/ctt", "transaction type"] },
  { broker: "HDFC", markers: ["symbol / contract", "exec. qty", "hsl ref. no.", "exch. order no."] },
];

export function detectBroker(headers: string[]): Broker | null {
  const hset = new Set(headers.map(norm));
  let best: { broker: Broker; score: number } | null = null;
  for (const fp of FINGERPRINTS) {
    const score = fp.markers.filter((m) => hset.has(norm(m))).length;
    if (score > 0 && (!best || score > best.score)) best = { broker: fp.broker, score };
  }
  return best ? best.broker : null;
}

// ---- Symbol decoders (one grammar per broker) -----------------------------

interface Decoded {
  underlying: string;
  asset: AssetClass;
  optionType: OptionType | null;
  strike: number | null;
}

/**
 * Zerodha packs everything with NO separators: NIFTY2541721800PE,
 * NATURALGAS25APR325CE, AUROPHARMA25NOVFUT. The expiry encoded in the string
 * is ambiguous (weekly uses a single month char), so we DO NOT trust it — the
 * caller passes Zerodha's explicit expiry_date column instead. Here we only
 * extract underlying, asset, option type and strike.
 */
function decodeZerodha(sym: string): Decoded {
  const s = sym.toUpperCase().trim();
  if (s.endsWith("FUT")) {
    const m = s.match(/^([A-Z&]+?)\d/);
    return { underlying: m ? m[1] : s.replace(/\d.*/, ""), asset: "FUT", optionType: null, strike: null };
  }
  const opt = s.match(/^([A-Z&]+?)\d.*?(\d+(?:\.\d+)?)(CE|PE)$/);
  if (opt) {
    return { underlying: opt[1], asset: "OPT", optionType: opt[3] as OptionType, strike: parseFloat(opt[2]) };
  }
  const m = s.match(/^([A-Z&]+?)(?=\d)/);
  return { underlying: m ? m[1] : s, asset: "OPT", optionType: null, strike: null };
}

/**
 * Kotak "Security Name": prefix(OPT/FUT + IDX/STK/FUT/COM) + underlying +
 * "DDMONYYYY" + CE/PE + strike, space-padded. Returns expiry too since Kotak
 * has no separate expiry column.
 * e.g. "OPTFUTGOLDM     29MAY2026PE 155500.00", "OPTIDXNIFTY 28APR2026PE 54000.00"
 */
function decodeKotak(sec: string): Decoded & { expiry: Date | null } {
  const raw = sec.toUpperCase();
  const pfx = raw.match(/^(OPT|FUT)(IDX|STK|FUT|COM)/);
  const asset: AssetClass = pfx && pfx[1] === "OPT" ? "OPT" : "FUT";
  let rest = pfx ? raw.slice(pfx[0].length) : raw;
  const um = rest.match(/^([A-Z&]+)/);
  const underlying = um ? um[1] : rest.trim();
  rest = um ? rest.slice(um[0].length) : rest;
  const dm = rest.match(/(\d{2})([A-Z]{3})(\d{4})(CE|PE)?\s*([\d.]+)?/);
  let expiry: Date | null = null;
  let optionType: OptionType | null = null;
  let strike: number | null = null;
  if (dm) {
    const mon = MONTHS[dm[2]];
    if (mon !== undefined) expiry = new Date(Date.UTC(parseInt(dm[3], 10), mon, parseInt(dm[1], 10)));
    optionType = (dm[4] as OptionType) ?? null;
    strike = dm[5] ? parseFloat(dm[5]) : null;
  }
  return { underlying, asset, optionType, strike, expiry };
}

/**
 * HDFC "Symbol / Contract" is dash-delimited with prefix and underlying as
 * SEPARATE tokens: ["OPTIDX","SENSEX","18DEC2025","CE","84900.0000","0"].
 */
function decodeHdfc(sym: string): Decoded & { expiry: Date | null } {
  const parts = sym.toUpperCase().split("-").map((p) => p.trim());
  const pfx = parts[0] || "";
  const asset: AssetClass = pfx.startsWith("OPT") ? "OPT" : "FUT";
  const underlying = parts[1] || "";
  let expiry: Date | null = null;
  const dm = (parts[2] || "").match(/^(\d{2})([A-Z]{3})(\d{4})/);
  if (dm) {
    const mon = MONTHS[dm[2]];
    if (mon !== undefined) expiry = new Date(Date.UTC(parseInt(dm[3], 10), mon, parseInt(dm[1], 10)));
  }
  let optionType: OptionType | null = null;
  let strike: number | null = null;
  if (asset === "OPT") {
    optionType = parts[3] === "CE" || parts[3] === "PE" ? (parts[3] as OptionType) : null;
    const sv = parseFloat(parts[4]);
    strike = Number.isFinite(sv) ? sv : null;
  }
  return { underlying, asset, optionType, strike, expiry };
}

// ---- Date parsing per broker ----------------------------------------------

function zerodhaDateTime(row: Row): Date {
  const t = field(row, ["order_execution_time"]); // "2025-04-11T14:55:34"
  if (t) return new Date(t);
  return new Date(field(row, ["trade_date"]));
}

function kotakDateTime(row: Row): Date {
  const d = field(row, ["Trade Date"]); // DD/MM/YYYY
  const t = field(row, ["Trade Time"]) || "00:00:00";
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [hh, mi, ss] = t.split(":").map((x) => parseInt(x, 10));
    return new Date(+m[3], +m[2] - 1, +m[1], hh || 0, mi || 0, ss || 0);
  }
  return new Date(`${d} ${t}`);
}

function hdfcDateTime(v: string): Date {
  const m = v.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/); // "18-Dec-2025 09:58:59"
  if (m) {
    const mon = MONTHS[m[2].toUpperCase()];
    return new Date(+m[3], mon, +m[1], +m[4], +m[5], +m[6]);
  }
  return new Date(v);
}

// ---- Adapters: rows -> RawExecution[] -------------------------------------

export function adaptZerodha(rows: Row[], accountId: string): RawExecution[] {
  const out: RawExecution[] = [];
  for (const row of rows) {
    const sym = field(row, ["symbol", "tradingsymbol"]);
    if (!sym) continue;
    const d = decodeZerodha(sym);
    const expStr = field(row, ["expiry_date"]);
    const expiry = expStr ? new Date(expStr) : null;
    out.push({
      broker: "ZERODHA",
      accountId,
      externalId: field(row, ["trade_id", "order_id"]) || undefined,
      rawSymbol: sym,
      side: normalizeSide(field(row, ["trade_type", "transaction_type"])),
      quantity: Math.abs(parseFloat(field(row, ["quantity", "qty"])) || 0),
      price: parseFloat(field(row, ["price", "average_price"])) || 0,
      time: zerodhaDateTime(row),
      asset: d.asset,
      parsed: parsedFromFields({ underlying: d.underlying, optionType: d.optionType, strike: d.strike, expiry }),
      charges: null,
    });
  }
  return out;
}

export function adaptKotak(rows: Row[], accountId: string): RawExecution[] {
  const out: RawExecution[] = [];
  for (const row of rows) {
    const sec = field(row, ["Security Name"]);
    if (!sec) continue;
    if (!/^(OPT|FUT)/i.test(sec)) continue;
    const d = decodeKotak(sec);
    const chRaw = field(row, ["Total Charges"]);
    const charges = chRaw ? parseFloat(chRaw) : null;
    out.push({
      broker: "KOTAK",
      accountId,
      rawSymbol: sec.replace(/\s+/g, " ").trim(),
      side: normalizeSide(field(row, ["Transaction Type"])),
      quantity: Math.abs(parseFloat(field(row, ["Quantity"])) || 0),
      price: parseFloat(field(row, ["Market Rate"])) || 0,
      time: kotakDateTime(row),
      asset: d.asset,
      parsed: parsedFromFields({ underlying: d.underlying, optionType: d.optionType, strike: d.strike, expiry: d.expiry }),
      charges: Number.isFinite(charges as number) ? charges : null,
    });
  }
  return out;
}

export function adaptHdfc(rows: Row[], accountId: string): RawExecution[] {
  const out: RawExecution[] = [];
  for (const row of rows) {
    const status = field(row, ["Status"]);
    if (status && status.toUpperCase() !== "EXECUTED") continue; // drop cancelled/expired
    const sym = field(row, ["Symbol / Contract", "Symbol/Contract"]);
    if (!sym) continue;
    if (!/^(OPT|FUT)/i.test(sym)) continue;
    const d = decodeHdfc(sym);
    const execQty = parseFloat(field(row, ["Exec. Qty", "Exec Qty"])) || 0;
    if (execQty === 0) continue;
    out.push({
      broker: "HDFC",
      accountId,
      externalId: field(row, ["Exch. Order No.", "HSL Ref. No."]) || undefined,
      rawSymbol: sym.replace(/\s+/g, " ").trim(),
      side: normalizeSide(field(row, ["Action"])),
      quantity: Math.abs(execQty),
      price: parseFloat(field(row, ["Order Price", "Limit Price"])) || 0,
      time: hdfcDateTime(field(row, ["Date & Time"])),
      asset: d.asset,
      parsed: parsedFromFields({ underlying: d.underlying, optionType: d.optionType, strike: d.strike, expiry: d.expiry }),
      charges: null,
    });
  }
  return out;
}

export function adaptRows(broker: Broker, rows: Row[], accountId: string): RawExecution[] {
  switch (broker) {
    case "ZERODHA": return adaptZerodha(rows, accountId);
    case "KOTAK": return adaptKotak(rows, accountId);
    case "HDFC": return adaptHdfc(rows, accountId);
    default: return [];
  }
}
