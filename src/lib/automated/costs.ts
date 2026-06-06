import type { NormalizedTrade } from "./types";

// Standard Indian options F&O cost model, used to ESTIMATE charges for brokers
// that don't ship per-trade charges in their file (Zerodha tradebook, HDFC
// order log). Kotak provides real charges and bypasses this.
//
// These are deliberately transparent and adjustable — Rohit can tune the rates
// to match what he actually pays. Estimated trades are flagged costSource =
// ESTIMATED so the dashboard never confuses them with real (Kotak) costs.
//
// Charges modeled (per round-trip, premium turnover basis):
//   - Brokerage: flat per executed order, both legs (Zerodha: ₹20/order F&O)
//   - STT: 0.1% on the SELL premium (options, on premium)
//   - Exchange txn charge: ~0.03503% of premium turnover (NSE options)
//   - SEBI + stamp: small; folded into a round factor
//   - GST: 18% on (brokerage + exchange txn charge)
//
// NOTE: premium turnover = price * quantity for each leg.

export interface CostRates {
  brokeragePerOrder: number; // flat, per leg
  sttSellPct: number; // on sell-side premium turnover
  exchangeTxnPct: number; // on total premium turnover
  sebiPct: number; // on total premium turnover
  stampPct: number; // on buy-side premium turnover
  gstPct: number; // on (brokerage + exchange txn)
}

export const DEFAULT_RATES: CostRates = {
  brokeragePerOrder: 20,
  sttSellPct: 0.001, // 0.10%
  exchangeTxnPct: 0.0003503, // 0.03503%
  sebiPct: 0.000001, // 0.0001%
  stampPct: 0.00003, // 0.003% on buy
  gstPct: 0.18,
};

export function estimateCharges(
  t: Pick<NormalizedTrade, "premiumSold" | "premiumBought" | "quantity">,
  rates: CostRates = DEFAULT_RATES
): number {
  const qty = Math.abs(t.quantity);
  const sellTurnover = t.premiumSold * qty;
  const buyTurnover = t.premiumBought * qty;
  const turnover = sellTurnover + buyTurnover;

  const brokerage = rates.brokeragePerOrder * 2; // entry + exit legs
  const stt = sellTurnover * rates.sttSellPct;
  const exchange = turnover * rates.exchangeTxnPct;
  const sebi = turnover * rates.sebiPct;
  const stamp = buyTurnover * rates.stampPct;
  const gst = (brokerage + exchange) * rates.gstPct;

  const total = brokerage + stt + exchange + sebi + stamp + gst;
  return Math.round(total * 100) / 100;
}
