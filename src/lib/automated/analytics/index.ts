import type { AnalyticTrade } from "./types";
import { computeStats, serializeStats, closed, round } from "./stats";
import { enrich, tagReentries } from "./enrich";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function group<T>(items: T[], keyFn: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return m;
}

function statBlock(label: string, trades: AnalyticTrade[]) {
  return { label, ...serializeStats(computeStats(trades)) };
}

function equityCurve(trades: AnalyticTrade[]) {
  const sorted = closed(trades).sort(
    (a, b) => (a.exitTime ?? a.entryTime).getTime() - (b.exitTime ?? b.entryTime).getTime()
  );
  let eq = 0;
  return sorted.map((t) => {
    eq += t.pnl;
    return { time: (t.exitTime ?? t.entryTime).toISOString(), equity: round(eq) };
  });
}

// ---- Strike distance / delta buckets -------------------------------------
const DIST_BUCKETS = [
  { label: "0–0.5%", lo: 0, hi: 0.005 },
  { label: "0.5–1%", lo: 0.005, hi: 0.01 },
  { label: "1–1.5%", lo: 0.01, hi: 0.015 },
  { label: "1.5–2%", lo: 0.015, hi: 0.02 },
  { label: "2–3%", lo: 0.02, hi: 0.03 },
  { label: "3%+", lo: 0.03, hi: Infinity },
];
const DELTA_BUCKETS = [
  { label: "0.40–0.50 (near ATM)", lo: 0.4, hi: 0.51 },
  { label: "0.25–0.40", lo: 0.25, hi: 0.4 },
  { label: "0.15–0.25", lo: 0.15, hi: 0.25 },
  { label: "0.10–0.15", lo: 0.1, hi: 0.15 },
  { label: "0.05–0.10", lo: 0.05, hi: 0.1 },
  { label: "<0.05 (deep OTM)", lo: 0, hi: 0.05 },
];

export function computeAnalytics(raw: AnalyticTrade[]) {
  const all = tagReentries(enrich(raw));
  const closedTrades = closed(all);

  // OVERVIEW (with cost truth: net P&L + how many trades have real vs est costs)
  const totalCharges = closedTrades.reduce((s, t) => s + (t.charges ?? 0), 0);
  const realCount = closedTrades.filter((t) => t.costSource === "REAL").length;
  const estCount = closedTrades.filter((t) => t.costSource === "ESTIMATED").length;
  const grossPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);
  const overview = {
    ...statBlock("All Trades", all),
    equityCurve: equityCurve(all),
    grossPnl: round(grossPnl),
    totalCharges: round(totalCharges),
    netPnl: round(grossPnl - totalCharges),
    costMix: { real: realCount, estimated: estCount, none: closedTrades.length - realCount - estCount },
  };

  // INSTRUMENT ANALYSIS
  const instruments = [...group(all, (t) => t.instrument)]
    .map(([k, ts]) => statBlock(k, ts))
    .sort((a, b) => b.totalPnl - a.totalPnl);

  // EXPIRY ANALYSIS
  const expiry = {
    expiryDay: statBlock("Expiry Day", all.filter((t) => t.isExpiryDay)),
    nonExpiry: statBlock("Non-Expiry", all.filter((t) => !t.isExpiryDay)),
  };

  // STRIKE SELECTION ANALYSIS
  const byDistance = DIST_BUCKETS.map((b) =>
    statBlock(
      b.label,
      closedTrades.filter(
        (t) => t.strikeDistancePct != null && t.strikeDistancePct >= b.lo && t.strikeDistancePct < b.hi
      )
    )
  ).filter((s) => s.trades > 0);
  const byDelta = DELTA_BUCKETS.map((b) =>
    statBlock(
      b.label,
      closedTrades.filter(
        (t) => t.approxDelta != null && t.approxDelta >= b.lo && t.approxDelta < b.hi
      )
    )
  ).filter((s) => s.trades > 0);
  const bestDistance = [...byDistance].sort(
    (a, b) => (b.profitFactor ?? 0) - (a.profitFactor ?? 0)
  )[0]?.label ?? null;
  const strike = {
    byDistance,
    byDelta,
    bestDistance,
    avgPremiumSold: round(
      avg(closedTrades.filter((t) => t.isShort).map((t) => t.premiumSold))
    ),
  };

  // RE-ENTRY ANALYSIS (critical module)
  const reentryWindows = [5, 15, 30, 60].map((w) =>
    statBlock(`Re-entry ≤ ${w} min`, closedTrades.filter((t) => t.reentryWindow === w))
  );
  const reentry = {
    windows: reentryWindows,
    allReentries: statBlock("All Re-entries", closedTrades.filter((t) => t.isReentry)),
    nonReentries: statBlock("Non Re-entries", closedTrades.filter((t) => !t.isReentry)),
    reentryCount: closedTrades.filter((t) => t.isReentry).length,
  };

  // TIME ANALYSIS
  const byHour = [...Array(24).keys()]
    .map((h) => statBlock(`${String(h).padStart(2, "0")}:00`, closedTrades.filter((t) => t.entryTime.getHours() === h)))
    .filter((s) => s.trades > 0);
  const byWeekday = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => statBlock(WEEKDAYS[d], closedTrades.filter((t) => t.entryTime.getDay() === d)))
    .filter((s) => s.trades > 0);
  const byMonth = [...Array(12).keys()]
    .map((m) => statBlock(MONTHS[m], closedTrades.filter((t) => t.entryTime.getMonth() === m)))
    .filter((s) => s.trades > 0);
  const time = { byHour, byWeekday, byMonth };

  // LOSS ANALYSIS
  const losers = closedTrades.filter((t) => t.pnl < 0).sort((a, b) => a.pnl - b.pnl);
  const largestLosses = losers.slice(0, 12).map((t) => ({
    symbol: t.rawSymbol,
    instrument: t.instrument,
    optionType: t.optionType,
    entryTime: t.entryTime.toISOString(),
    pnl: round(t.pnl),
    strikeDistancePct: t.strikeDistancePct != null ? round(t.strikeDistancePct, 4) : null,
    isExpiryDay: t.isExpiryDay,
    isReentry: !!t.isReentry,
  }));
  const dayPnl = [...group(closedTrades, (t) => t.entryTime.toISOString().slice(0, 10))].map(
    ([day, ts]) => ({ day, pnl: round(ts.reduce((s, t) => s + t.pnl, 0)), trades: ts.length })
  );
  const largestLosingDays = [...dayPnl].sort((a, b) => a.pnl - b.pnl).slice(0, 8);
  const loss = {
    largestLosses,
    largestLosingDays,
    cluster: lossCluster(losers),
  };

  // EDGE MAP — the signature view: rank slices into strengths vs leaks so the
  // dashboard can show "do more of this, less of that" at a glance. Slices are
  // only judged when they have enough trades (avoids lucky-streak noise).
  const edgeMap = buildEdgeMap(closedTrades);

  return {
    generatedAt: new Date().toISOString(),
    tradeCount: all.length,
    closedCount: closedTrades.length,
    overview,
    edgeMap,
    instruments,
    expiry,
    strike,
    reentry,
    time,
    loss,
  };
}

// Minimum trades for a slice to be trusted (below this it's flagged low-sample).
const MIN_SAMPLE = 30;

type EdgeItem = {
  label: string;
  detail: string;
  trades: number;
  winRate: number;
  expectancy: number;
  tier: "strength" | "leak" | "watch";
  lowSample: boolean;
};

function buildEdgeMap(closed: AnalyticTrade[]): { strengths: EdgeItem[]; leaks: EdgeItem[]; baseline: number } {
  if (!closed.length) return { strengths: [], leaks: [], baseline: 0 };
  const baseline = avg(closed.map((t) => t.pnl)); // overall expectancy per trade

  const items: EdgeItem[] = [];
  const seen = new Set<string>();
  const consider = (label: string, detail: string, ts: AnalyticTrade[]) => {
    if (ts.length === 0) return;
    if (seen.has(label)) return; // avoid e.g. MIDCPNIFTY appearing as both class+underlying
    seen.add(label);
    const s = computeStats(ts);
    const lowSample = ts.length < MIN_SAMPLE;
    // Strength = clearly above baseline expectancy AND winning; leak = losing,
    // well under baseline, or a poor win rate despite small per-trade profit.
    let tier: EdgeItem["tier"] = "watch";
    if (!lowSample && s.expectancy > baseline * 1.2 && s.winRate >= 0.5) tier = "strength";
    else if (!lowSample && (s.expectancy < 0 || s.expectancy < baseline * 0.45 || s.winRate < 0.5)) tier = "leak";
    items.push({
      label,
      detail,
      trades: ts.length,
      winRate: round(s.winRate, 4),
      expectancy: round(s.expectancy),
      tier,
      lowSample,
    });
  };

  // By instrument class
  for (const [k, ts] of group(closed, (t) => t.instrument)) {
    consider(k, "instrument", ts);
  }
  // By underlying (top names only) — skip names already covered as a class
  const byUnd = [...group(closed, (t) => t.symbol)].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
  for (const [k, ts] of byUnd) consider(k, "underlying", ts);
  // Direction: short vs long
  consider("Selling (short)", "direction", closed.filter((t) => t.isShort));
  consider("Buying (long)", "direction", closed.filter((t) => !t.isShort));
  // Expiry vs not
  consider("Expiry day", "timing", closed.filter((t) => t.isExpiryDay));
  consider("Non-expiry", "timing", closed.filter((t) => !t.isExpiryDay));
  // Session blocks (entry hour)
  const sessions: [string, (h: number) => boolean][] = [
    ["Open 9–10am", (h) => h === 9],
    ["Midday 11–1pm", (h) => h >= 11 && h <= 13],
    ["Afternoon 1–3pm", (h) => h >= 13 && h <= 15],
    ["Evening 7–11pm", (h) => h >= 19 && h <= 23],
  ];
  for (const [label, pred] of sessions) {
    consider(label, "session", closed.filter((t) => pred(t.entryTime.getHours())));
  }

  const rank = (a: EdgeItem, b: EdgeItem) => b.expectancy - a.expectancy;
  const strengths = items.filter((i) => i.tier === "strength").sort(rank);
  const leaks = items.filter((i) => i.tier === "leak").sort((a, b) => a.expectancy - b.expectancy);
  return { strengths, leaks, baseline: round(baseline) };
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

// Common characteristics shared by losing trades.
function lossCluster(losers: AnalyticTrade[]) {
  if (!losers.length) return null;
  const n = losers.length;
  const share = (pred: (t: AnalyticTrade) => boolean) =>
    round(losers.filter(pred).length / n, 3);
  const hourCounts = group(losers, (t) => String(t.entryTime.getHours()));
  const topHour = [...hourCounts].sort((a, b) => b[1].length - a[1].length)[0];
  const instCounts = group(losers, (t) => t.instrument);
  const topInst = [...instCounts].sort((a, b) => b[1].length - a[1].length)[0];
  return {
    count: n,
    pctExpiryDay: share((t) => t.isExpiryDay),
    pctReentry: share((t) => !!t.isReentry),
    pctCall: share((t) => t.optionType === "CE"),
    pctPut: share((t) => t.optionType === "PE"),
    avgHoldingMinutes: round(avg(losers.map((t) => t.holdingMinutes ?? 0))),
    avgStrikeDistancePct: round(
      avg(losers.filter((t) => t.strikeDistancePct != null).map((t) => t.strikeDistancePct!)),
      4
    ),
    topHour: topHour ? `${String(topHour[0]).padStart(2, "0")}:00` : null,
    topInstrument: topInst ? topInst[0] : null,
  };
}

export type Analytics = ReturnType<typeof computeAnalytics>;
