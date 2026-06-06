import type { AnalyticTrade, PerfStats } from "./types";

// A trade counts toward performance only once it is closed.
export function closed(trades: AnalyticTrade[]): AnalyticTrade[] {
  return trades.filter((t) => t.exitTime !== null);
}

export function maxDrawdown(trades: AnalyticTrade[]): number {
  const sorted = [...trades].sort(
    (a, b) => (a.exitTime ?? a.entryTime).getTime() - (b.exitTime ?? b.entryTime).getTime()
  );
  let equity = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of sorted) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

export function computeStats(all: AnalyticTrade[]): PerfStats {
  const trades = closed(all);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? wins.length / trades.length : 0,
    totalPnl,
    avgProfit: wins.length ? grossProfit / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    maxDrawdown: maxDrawdown(trades),
    expectancy: trades.length ? totalPnl / trades.length : 0,
  };
}

export function round(n: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

// Convert PerfStats numbers to JSON-safe rounded values (Infinity -> null).
export function serializeStats(s: PerfStats) {
  return {
    ...s,
    winRate: round(s.winRate, 4),
    totalPnl: round(s.totalPnl),
    avgProfit: round(s.avgProfit),
    avgLoss: round(s.avgLoss),
    profitFactor: Number.isFinite(s.profitFactor) ? round(s.profitFactor) : null,
    maxDrawdown: round(s.maxDrawdown),
    expectancy: round(s.expectancy),
  };
}
