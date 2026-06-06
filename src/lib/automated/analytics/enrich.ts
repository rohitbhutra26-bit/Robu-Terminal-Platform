import type { AnalyticTrade } from "./types";

// We don't get the underlying spot price in broker tradebooks. For an OTM
// option SELLER, sold CE strikes sit above spot and sold PE strikes below it,
// so the spot for a given symbol+day is well approximated by the midpoint
// between the lowest CE strike and the highest PE strike traded that day.
function estimateSpotByDay(trades: AnalyticTrade[]): Map<string, number> {
  const groups = new Map<string, AnalyticTrade[]>();
  for (const t of trades) {
    if (t.strike == null || isNaN(t.entryTime.getTime())) continue;
    const key = `${t.symbol}|${t.entryTime.toISOString().slice(0, 10)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const spots = new Map<string, number>();
  for (const [key, ts] of groups) {
    const ce = ts.filter((t) => t.optionType === "CE" && t.strike != null).map((t) => t.strike!);
    const pe = ts.filter((t) => t.optionType === "PE" && t.strike != null).map((t) => t.strike!);
    let spot: number | null = null;
    if (ce.length && pe.length) spot = (Math.min(...ce) + Math.max(...pe)) / 2;
    else if (ce.length) spot = Math.min(...ce); // CE just above spot
    else if (pe.length) spot = Math.max(...pe); // PE just below spot
    if (spot != null) spots.set(key, spot);
  }
  return spots;
}

// Transparent, monotonic approximation of |delta| from moneyness. Not a
// pricing model — just a stable way to bucket "how far OTM" a sold strike is.
function approxDelta(distancePct: number): number {
  const d = 0.5 * Math.exp(-Math.abs(distancePct) / 0.012);
  return Math.max(0.01, Math.min(0.5, d));
}

export function enrich(trades: AnalyticTrade[]): AnalyticTrade[] {
  const spots = estimateSpotByDay(trades);
  return trades.map((t) => {
    if (isNaN(t.entryTime.getTime())) return t;
    const key = `${t.symbol}|${t.entryTime.toISOString().slice(0, 10)}`;
    const spot = spots.get(key) ?? null;
    let strikeDistance: number | null = null;
    let strikeDistancePct: number | null = null;
    let delta: number | null = null;
    if (spot != null && t.strike != null && spot > 0) {
      strikeDistance = Math.abs(t.strike - spot);
      strikeDistancePct = strikeDistance / spot;
      delta = approxDelta(strikeDistancePct);
    }
    return {
      ...t,
      underlyingAtEntry: spot,
      strikeDistance,
      strikeDistancePct,
      approxDelta: delta,
    };
  });
}

// Tag re-entries: a closed losing trade ("stopped out") followed by a new
// trade in the SAME underlying within a time window. Records the tightest
// matching window (5/15/30/60 minutes).
const WINDOWS = [5, 15, 30, 60];

export function tagReentries(trades: AnalyticTrade[]): AnalyticTrade[] {
  const sorted = [...trades].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  for (const t of sorted) {
    t.isReentry = false;
    t.reentryWindow = null;
    // Find the most recent prior losing closed trade in the same symbol.
    let best: number | null = null;
    for (const p of sorted) {
      if (p === t) continue;
      if (p.symbol !== t.symbol) continue;
      if (p.exitTime == null || p.pnl >= 0) continue;
      const gap = (t.entryTime.getTime() - p.exitTime.getTime()) / 60000;
      if (gap < 0) continue;
      const w = WINDOWS.find((win) => gap <= win);
      if (w != null && (best == null || w < best)) best = w;
    }
    if (best != null) {
      t.isReentry = true;
      t.reentryWindow = best;
    }
  }
  return sorted;
}
