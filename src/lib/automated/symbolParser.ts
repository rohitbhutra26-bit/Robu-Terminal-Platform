import type { InstrumentClass, OptionType, ParsedSymbol } from "./types";

// Known Indian index underlyings (order matters: longest first so BANKNIFTY
// is matched before NIFTY).
const INDEX_UNDERLYINGS = [
  "MIDCPNIFTY",
  "BANKNIFTY",
  "FINNIFTY",
  "NIFTYNXT50",
  "NIFTY",
  "SENSEX",
  "BANKEX",
];

const COMMODITY_UNDERLYINGS = [
  "CRUDEOIL",
  "CRUDEOILM",
  "NATURALGAS",
  "NATGASMINI",
  "GOLD",
  "GOLDM",
  "GOLDGUINEA",
  "SILVER",
  "SILVERM",
  "SILVERMIC",
  "COPPER",
  "ZINC",
  "ALUMINIUM",
  "LEAD",
  "NICKEL",
  "COTTON",
  "MENTHAOIL",
];

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

// Single-character weekly month codes used by some brokers (Oct/Nov/Dec).
const WEEKLY_MONTH_CHAR: Record<string, number> = {
  O: 9, N: 10, D: 11,
};

// Last Thursday of a given month (typical monthly F&O expiry).
function lastThursday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month + 1, 0)); // last day of month
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

// Index underlyings that get their own first-class instrument label.
const NAMED_INDEX: Record<string, InstrumentClass> = {
  NIFTY: "NIFTY",
  BANKNIFTY: "BANKNIFTY",
  FINNIFTY: "FINNIFTY",
  SENSEX: "SENSEX",
  BANKEX: "BANKEX",
  MIDCPNIFTY: "MIDCPNIFTY",
};

export function classify(underlying: string): InstrumentClass {
  if (NAMED_INDEX[underlying]) return NAMED_INDEX[underlying];
  if (INDEX_UNDERLYINGS.includes(underlying)) return "INDEX"; // e.g. NIFTYNXT50
  if (COMMODITY_UNDERLYINGS.includes(underlying)) return "COMMODITY";
  if (/^[A-Z&-]{1,20}$/.test(underlying)) return "STOCK";
  return "OTHER";
}

function detectUnderlying(s: string): string | null {
  for (const u of [...INDEX_UNDERLYINGS, ...COMMODITY_UNDERLYINGS]) {
    if (s.startsWith(u)) return u;
  }
  // Fall back: leading letters up to the first digit = stock symbol.
  const m = s.match(/^([A-Z&]+?)(?=\d)/);
  return m ? m[1] : null;
}

// Parse the middle "expiry + strike" segment into a date and a strike.
function parseExpiryAndStrike(mid: string): {
  expiry: Date | null;
  strike: number | null;
} {
  // Monthly contracts contain a 3-letter month, e.g. 24JUN24500
  const monthly = mid.match(/^(\d{2})([A-Z]{3})(\d+(?:\.\d+)?)$/);
  if (monthly && MONTHS[monthly[2]] !== undefined) {
    const yy = 2000 + parseInt(monthly[1], 10);
    const month = MONTHS[monthly[2]];
    const strike = parseFloat(monthly[3]);
    return { expiry: lastThursday(yy, month), strike };
  }

  // Weekly with single letter month code: 24 O 09 24500  -> 24O0924500
  const weeklyChar = mid.match(/^(\d{2})([OND])(\d{2})(\d+(?:\.\d+)?)$/);
  if (weeklyChar) {
    const yy = 2000 + parseInt(weeklyChar[1], 10);
    const month = WEEKLY_MONTH_CHAR[weeklyChar[2]];
    const day = parseInt(weeklyChar[3], 10);
    return { expiry: new Date(Date.UTC(yy, month, day)), strike: parseFloat(weeklyChar[4]) };
  }

  // Weekly numeric: YY M DD STRIKE -> 2 + 1 + 2 + rest. e.g. 2450924500
  const weeklyNum = mid.match(/^(\d{2})(\d)(\d{2})(\d+(?:\.\d+)?)$/);
  if (weeklyNum) {
    const yy = 2000 + parseInt(weeklyNum[1], 10);
    const month = parseInt(weeklyNum[2], 10) - 1; // 1-9 -> 0-8
    const day = parseInt(weeklyNum[3], 10);
    if (month >= 0 && month <= 8 && day >= 1 && day <= 31) {
      return { expiry: new Date(Date.UTC(yy, month, day)), strike: parseFloat(weeklyNum[4]) };
    }
  }

  // Could not split expiry; treat whole thing as strike if numeric.
  const num = mid.match(/(\d+(?:\.\d+)?)$/);
  return { expiry: null, strike: num ? parseFloat(num[1]) : null };
}

/**
 * Parse an Indian option tradingsymbol into its components.
 * Tolerant by design — always returns something, never throws.
 */
export function parseSymbol(raw: string): ParsedSymbol {
  const s = (raw || "").toUpperCase().replace(/\s+/g, "");

  let optionType: OptionType | null = null;
  let core = s;
  if (s.endsWith("CE")) {
    optionType = "CE";
    core = s.slice(0, -2);
  } else if (s.endsWith("PE")) {
    optionType = "PE";
    core = s.slice(0, -2);
  }

  const underlying = detectUnderlying(core) ?? core.replace(/[\d.].*$/, "") ?? s;
  const mid = core.slice(underlying.length);

  const { expiry, strike } = mid ? parseExpiryAndStrike(mid) : { expiry: null, strike: null };

  return {
    symbol: underlying || s,
    instrument: classify(underlying || ""),
    strike,
    optionType,
    expiryDate: expiry,
  };
}

/**
 * Build a ParsedSymbol from already-structured fields. Kotak and HDFC give the
 * underlying, expiry, strike and CE/PE as separate tokens (and an explicit
 * expiry column), so cracking the packed string is unnecessary and less
 * reliable. Adapters call this and attach the result to RawExecution.parsed.
 */
export function parsedFromFields(args: {
  underlying: string;
  optionType: OptionType | null;
  strike: number | null;
  expiry: Date | null;
}): ParsedSymbol {
  const u = (args.underlying || "").toUpperCase();
  return {
    symbol: u,
    instrument: classify(u),
    strike: args.strike,
    optionType: args.optionType,
    expiryDate: args.expiry,
  };
}
