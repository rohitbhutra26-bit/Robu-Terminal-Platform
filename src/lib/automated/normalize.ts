import type { NormalizedTrade, RawExecution } from "./types";
import { parseSymbol } from "./symbolParser";

interface OpenLot {
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  time: Date;
  externalId?: string;
  charges: number | null;
}

function sameDay(a: Date, b: Date | null): boolean {
  if (!b) return false;
  return (
    a.getFullYear() === b.getUTCFullYear() &&
    a.getMonth() === b.getUTCMonth() &&
    a.getDate() === b.getUTCDate()
  );
}

/** Sum two optional charge values, preserving null when neither broker gave one. */
function addCharges(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

/**
 * Pair raw executions into completed round-trip trades using FIFO matching.
 * Matching is keyed per (account + contract) so positions in different
 * accounts never net against each other. Options-only: FUT executions are
 * excluded per the analytics scope. Each opposing fill closes the oldest open
 * lot(s).
 */
export function buildTrades(executions: RawExecution[]): NormalizedTrade[] {
  // Options only — drop futures rather than letting them pair.
  const optionFills = executions.filter((e) => (e.asset ?? "OPT") === "OPT");

  // Key by account + exact contract so accounts stay segregated.
  const byKey = new Map<string, RawExecution[]>();
  for (const e of optionFills) {
    const p = e.parsed ?? parseSymbol(e.rawSymbol);
    const key = [
      e.accountId,
      p.symbol,
      p.expiryDate ? p.expiryDate.getTime() : "",
      p.optionType ?? "",
      p.strike ?? "",
    ].join("|");
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(e);
  }

  const trades: NormalizedTrade[] = [];

  for (const [, fills] of byKey) {
    fills.sort((a, b) => a.time.getTime() - b.time.getTime());
    const first = fills[0];
    const rawSymbol = first.rawSymbol;
    const parsed = first.parsed ?? parseSymbol(rawSymbol);
    const accountId = first.accountId;
    const broker = first.broker;
    const open: OpenLot[] = [];

    for (const f of fills) {
      let remaining = f.quantity;

      // Match against open lots of the opposite side.
      while (remaining > 0 && open.length > 0 && open[0].side !== f.side) {
        const lot = open[0];
        const matched = Math.min(remaining, lot.qty);

        const sellPrice = lot.side === "SELL" ? lot.price : f.price;
        const buyPrice = lot.side === "SELL" ? f.price : lot.price;
        const entry = lot;
        const exit = f;
        const holdingMinutes = Math.max(
          0,
          Math.round((exit.time.getTime() - entry.time.getTime()) / 60000)
        );

        // Apportion this leg's charges to the matched quantity, plus the
        // closing fill's charges apportioned the same way.
        const entryCharge =
          entry.charges == null ? null : entry.charges * (matched / Math.max(1, f.quantity));
        const exitCharge =
          f.charges == null ? null : f.charges * (matched / Math.max(1, f.quantity));

        trades.push({
          externalId: entry.externalId,
          broker,
          accountId,
          rawSymbol,
          symbol: parsed.symbol,
          instrument: parsed.instrument,
          strike: parsed.strike,
          optionType: parsed.optionType,
          entryTime: entry.time,
          exitTime: exit.time,
          expiryDate: parsed.expiryDate,
          premiumSold: sellPrice,
          premiumBought: buyPrice,
          quantity: matched,
          isShort: lot.side === "SELL",
          pnl: (sellPrice - buyPrice) * matched,
          charges: addCharges(entryCharge, exitCharge),
          holdingMinutes,
          isExpiryDay: sameDay(entry.time, parsed.expiryDate),
        });

        lot.qty -= matched;
        remaining -= matched;
        if (lot.qty === 0) open.shift();
      }

      // Leftover opens a new lot.
      if (remaining > 0) {
        open.push({
          side: f.side,
          qty: remaining,
          price: f.price,
          time: f.time,
          externalId: f.externalId,
          charges: f.charges == null ? null : f.charges * (remaining / Math.max(1, f.quantity)),
        });
      }
    }

    // Any still-open lots = positions not yet closed in the data: record as
    // open trades (no exit, pnl 0) so they still appear in counts.
    for (const lot of open) {
      trades.push({
        externalId: lot.externalId,
        broker,
        accountId,
        rawSymbol,
        symbol: parsed.symbol,
        instrument: parsed.instrument,
        strike: parsed.strike,
        optionType: parsed.optionType,
        entryTime: lot.time,
        exitTime: null,
        expiryDate: parsed.expiryDate,
        premiumSold: lot.side === "SELL" ? lot.price : 0,
        premiumBought: lot.side === "BUY" ? lot.price : 0,
        quantity: lot.qty,
        isShort: lot.side === "SELL",
        pnl: 0,
        charges: lot.charges,
        holdingMinutes: null,
        isExpiryDay: sameDay(lot.time, parsed.expiryDate),
      });
    }
  }

  trades.sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  return trades;
}
