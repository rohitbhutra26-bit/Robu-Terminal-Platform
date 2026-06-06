import type { RawExecution } from "./types";

// Reconciliation rests on an exact accounting identity: cash conservation.
//
// Every option execution is a cashflow — a SELL brings cash in (+price*qty), a
// BUY takes cash out (-price*qty). The sum of all those raw cashflows for an
// account MUST equal the sum of the paired trades' realised P&L plus the
// cashflow still tied up in open (unclosed) positions. If they don't match to
// the rupee, the pairing dropped or double-counted something — a bug we want
// to catch, not hide.

export interface RawTotals {
  optionExecs: number;
  buyQty: number;
  sellQty: number;
  buyValue: number; // Σ price*qty on buys
  sellValue: number; // Σ price*qty on sells
  netCashflow: number; // sellValue - buyValue
  realCharges: number; // Σ broker-provided charges (0 if none provided)
  hasRealCharges: boolean;
}

// Compute the independent raw totals from executions (options only), the way a
// broker statement would tally them — before any pairing happens.
export function computeRawTotals(executions: RawExecution[]): RawTotals {
  let buyQty = 0,
    sellQty = 0,
    buyValue = 0,
    sellValue = 0,
    realCharges = 0,
    optionExecs = 0,
    chargeRows = 0;

  for (const e of executions) {
    if ((e.asset ?? "OPT") !== "OPT") continue; // options-only scope
    optionExecs++;
    const value = e.price * e.quantity;
    if (e.side === "SELL") {
      sellQty += e.quantity;
      sellValue += value;
    } else {
      buyQty += e.quantity;
      buyValue += value;
    }
    if (e.charges != null) {
      realCharges += e.charges;
      chargeRows++;
    }
  }

  return {
    optionExecs,
    buyQty,
    sellQty,
    buyValue: round(buyValue),
    sellValue: round(sellValue),
    netCashflow: round(sellValue - buyValue),
    realCharges: round(realCharges),
    hasRealCharges: chargeRows > 0,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface ReconResult {
  rawNetCashflow: number; // from raw executions (stored at import)
  pairedAccountedCashflow: number; // realised P&L + open-leg cashflow (from DB trades)
  difference: number;
  matched: boolean; // within a tiny tolerance
  closedPnl: number;
  openLegCashflow: number;
  buyQty: number;
  sellQty: number;
  openQty: number; // |sellQty - buyQty|, the still-open position size
}

// Tolerance: a rupee of floating-point drift across thousands of trades is fine;
// anything larger means a real pairing discrepancy.
const TOLERANCE = 1.0;

// Reconcile stored raw cashflow against what the paired trades account for.
// `trades` are the DB trades for one account: closed (exitTime set) carry
// realised pnl; open (exitTime null) carry the single-leg premium.
export function reconcile(
  rawNetCashflow: number,
  rawBuyQty: number,
  rawSellQty: number,
  trades: { pnl: number; exitTime: Date | null; isShort: boolean; premiumSold: number; premiumBought: number; quantity: number }[]
): ReconResult {
  let closedPnl = 0;
  let openLegCashflow = 0;
  for (const t of trades) {
    if (t.exitTime) {
      closedPnl += t.pnl;
    } else {
      // Open position: a short brought cash IN (premiumSold), a long took cash
      // OUT (premiumBought).
      const leg = t.isShort ? t.premiumSold : -t.premiumBought;
      openLegCashflow += leg * t.quantity;
    }
  }
  const paired = round(closedPnl + openLegCashflow);
  const diff = round(rawNetCashflow - paired);
  return {
    rawNetCashflow: round(rawNetCashflow),
    pairedAccountedCashflow: paired,
    difference: diff,
    matched: Math.abs(diff) <= TOLERANCE,
    closedPnl: round(closedPnl),
    openLegCashflow: round(openLegCashflow),
    buyQty: rawBuyQty,
    sellQty: rawSellQty,
    openQty: Math.abs(rawSellQty - rawBuyQty),
  };
}
