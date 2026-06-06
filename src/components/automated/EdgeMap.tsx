"use client";
import { inr, pct } from "@/lib/automated/format";

interface EdgeItem {
  label: string;
  detail: string;
  trades: number;
  winRate: number;
  expectancy: number;
  tier: "strength" | "leak" | "watch";
  lowSample: boolean;
}

// The edge map: "do more of this, less of that" at a glance. Green = proven
// strengths, red = leaks. Each card shows trades + win rate + per-trade
// expectancy, with a low-sample warning so lucky streaks aren't trusted.
export function EdgeMap({
  strengths,
  leaks,
  baseline,
}: {
  strengths: EdgeItem[];
  leaks: EdgeItem[];
  baseline: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Column
        title="Where you're strongest"
        accent="profit"
        items={strengths}
        empty="No slice clears the bar yet — need more trades."
      />
      <Column
        title="Where you leak"
        accent="loss"
        items={leaks}
        empty="No clear leaks detected. Good."
      />
      <p className="text-xs text-muted lg:col-span-2">
        Baseline expectancy is {inr(baseline)} per trade. Strengths beat it clearly; leaks fall well
        below it or lose. Slices under 30 trades are flagged low-sample and never trusted blindly.
      </p>
    </div>
  );
}

function Column({
  title,
  accent,
  items,
  empty,
}: {
  title: string;
  accent: "profit" | "loss";
  items: EdgeItem[];
  empty: string;
}) {
  const bar = accent === "profit" ? "border-l-profit" : "border-l-loss";
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.label}
              className={`rounded border border-border border-l-4 ${bar} bg-card px-3 py-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{it.label}</span>
                <span className={`text-sm font-medium ${accent === "profit" ? "text-profit" : "text-loss"}`}>
                  {inr(it.expectancy)}/trade
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <span>{it.trades.toLocaleString("en-IN")} trades</span>
                <span>·</span>
                <span>{pct(it.winRate, 0)} win</span>
                <span className="text-muted/60">({it.detail})</span>
                {it.lowSample && (
                  <span className="ml-auto rounded bg-warn/20 px-1.5 py-0.5 text-warn">low sample</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
