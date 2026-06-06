"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel, Kpi, StatTable, Tabs, type Stat } from "@/components/automated/ui";
import { EquityChart, PnlBars } from "@/components/automated/Charts";
import { AccountBar, AccountComparison, type AccountSummary } from "@/components/automated/AccountBar";
import { EdgeMap } from "@/components/automated/EdgeMap";
import { Reconciliation } from "@/components/automated/Reconciliation";
import { inr, pct, pf, num } from "@/lib/automated/format";

const TABS = ["Edge Map", "Overview", "Accounts", "Instruments", "Expiry", "Strike", "Re-entry", "Time", "Loss", "Reconcile"];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [scope, setScope] = useState<string | null>(null); // null = combined
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("Edge Map");
  const [loading, setLoading] = useState(true);

  // Load account summaries once (for the tab bar + comparison).
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setAccounts(d.accounts ?? []); })
      .catch(() => {});
  }, []);

  // Re-fetch analytics whenever the account scope changes.
  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = scope ? `/api/analytics?accountId=${encodeURIComponent(scope)}` : "/api/analytics";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setData(null); }
        else setData(d);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [scope]);

  const scopeLabel = scope ? accounts.find((a) => a.id === scope)?.label ?? "Account" : "All accounts";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Trader DNA</h1>
          <p className="text-sm text-muted">
            {scopeLabel}
            {data && !data.empty && (
              <> · {data.closedCount?.toLocaleString("en-IN")} closed trades</>
            )}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print rounded border border-border bg-panel px-3 py-1.5 text-sm text-muted hover:text-primary"
        >
          Export PDF
        </button>
      </div>

      {accounts.length > 0 && (
        <AccountBar accounts={accounts} selected={scope} onSelect={setScope} />
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {loading && <p className="text-muted">Loading analytics…</p>}

      {!loading && error && (
        <Panel title="Could not load analytics">
          <p className="text-sm text-loss">{error}</p>
          <p className="mt-2 text-sm text-muted">
            Make sure the database is running and migrated (<code>npx prisma migrate dev</code> then{" "}
            <code>npx prisma db seed</code>), then refresh.
          </p>
        </Panel>
      )}

      {!loading && !error && (!data || data.empty) && tab !== "Accounts" && tab !== "Reconcile" && (
        <Panel title="No trades in this view yet">
          <p className="text-sm text-muted">Import a broker file to this account to discover your trading DNA.</p>
          <Link href="/automated/import" className="mt-3 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-white">
            Import file →
          </Link>
        </Panel>
      )}

      {!loading && !error && data && !data.empty && (
        <>
          {tab === "Edge Map" && <EdgeMap strengths={data.edgeMap.strengths} leaks={data.edgeMap.leaks} baseline={data.edgeMap.baseline} />}
          {tab === "Overview" && <Overview o={data.overview} />}
          {tab === "Instruments" && <Instruments rows={data.instruments} />}
          {tab === "Expiry" && <Expiry e={data.expiry} />}
          {tab === "Strike" && <Strike s={data.strike} />}
          {tab === "Re-entry" && <Reentry r={data.reentry} />}
          {tab === "Time" && <Time t={data.time} />}
          {tab === "Loss" && <Loss l={data.loss} />}
        </>
      )}

      {!loading && tab === "Accounts" && (
        <div className="space-y-4">
          <Panel title="Per-account comparison" subtitle="Net P&L is after costs (real for Kotak, estimated for Zerodha/HDFC). HDFC is tracked separately and excluded from the combined view.">
            <AccountComparison accounts={accounts} />
          </Panel>
        </div>
      )}

      {!loading && tab === "Reconcile" && (
        <Panel title="Statement reconciliation" subtitle="The verification gate: proves every rupee of cash flow is accounted for by the paired trades. This is what makes the numbers trustworthy.">
          <Reconciliation />
        </Panel>
      )}
    </div>
  );
}

function Overview({ o }: { o: any }) {
  const costNote =
    o.costMix?.estimated > 0
      ? `${o.costMix.real?.toLocaleString("en-IN") ?? 0} real + ${o.costMix.estimated?.toLocaleString("en-IN") ?? 0} estimated costs`
      : "all costs from broker files";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total Trades" value={String(o.trades)} />
        <Kpi label="Win Rate" value={pct(o.winRate)} tone={o.winRate >= 0.5 ? "profit" : "loss"} />
        <Kpi label="Net P&L" value={inr(o.netPnl ?? o.totalPnl)} tone={(o.netPnl ?? o.totalPnl) >= 0 ? "profit" : "loss"} hint={costNote} />
        <Kpi label="Gross P&L" value={inr(o.grossPnl ?? o.totalPnl)} tone={(o.grossPnl ?? o.totalPnl) >= 0 ? "profit" : "loss"} hint="before costs" />
        <Kpi label="Total Charges" value={inr(o.totalCharges ?? 0)} tone="loss" />
        <Kpi label="Profit Factor" value={pf(o.profitFactor)} hint="gross win / gross loss" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Avg Profit" value={inr(o.avgProfit)} tone="profit" />
        <Kpi label="Avg Loss" value={inr(o.avgLoss)} tone="loss" />
        <Kpi label="Max Drawdown" value={inr(o.maxDrawdown)} tone="loss" />
        <Kpi label="Expectancy / trade" value={inr(o.expectancy)} tone={o.expectancy >= 0 ? "profit" : "loss"} />
      </div>
      <Panel title="Equity Curve" subtitle="Cumulative gross P&L across all closed trades">
        <EquityChart data={o.equityCurve} />
      </Panel>
    </div>
  );
}

function Instruments({ rows }: { rows: Stat[] }) {
  return (
    <div className="space-y-5">
      <Panel title="Profitability by Instrument">
        <PnlBars data={rows.map((r) => ({ label: r.label, value: r.totalPnl }))} />
      </Panel>
      <Panel title="Instrument Breakdown">
        <StatTable rows={rows} firstCol="Instrument" />
      </Panel>
    </div>
  );
}

function Expiry({ e }: { e: any }) {
  const rows: Stat[] = [e.expiryDay, e.nonExpiry];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi label="Expiry-Day Gross P&L" value={inr(e.expiryDay.totalPnl)} tone={e.expiryDay.totalPnl >= 0 ? "profit" : "loss"} hint={`${e.expiryDay.trades} trades · ${pct(e.expiryDay.winRate)} win`} />
        <Kpi label="Non-Expiry Gross P&L" value={inr(e.nonExpiry.totalPnl)} tone={e.nonExpiry.totalPnl >= 0 ? "profit" : "loss"} hint={`${e.nonExpiry.trades} trades · ${pct(e.nonExpiry.winRate)} win`} />
      </div>
      <Panel title="Expiry Day vs Non-Expiry">
        <StatTable rows={rows} firstCol="Segment" />
      </Panel>
    </div>
  );
}

function Strike({ s }: { s: any }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi label="Best Strike Distance" value={s.bestDistance ?? "—"} hint="highest profit factor" tone="profit" />
        <Kpi label="Avg Premium Sold" value={num(s.avgPremiumSold)} hint="per unit, short legs" />
      </div>
      <Panel title="Performance by Strike Distance (% OTM from estimated spot)">
        <PnlBars data={s.byDistance.map((b: Stat) => ({ label: b.label, value: b.totalPnl }))} />
        <div className="mt-4"><StatTable rows={s.byDistance} firstCol="Distance" /></div>
      </Panel>
      <Panel title="Performance by Approx. Delta" subtitle="Delta is a transparent heuristic from % OTM — directional, not a pricing model">
        <StatTable rows={s.byDelta} firstCol="Approx Delta" />
      </Panel>
    </div>
  );
}

function Reentry({ r }: { r: any }) {
  const rows: Stat[] = [...r.windows, r.allReentries, r.nonReentries];
  const edge = r.allReentries.expectancy - r.nonReentries.expectancy;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Re-entry Trades" value={String(r.reentryCount)} hint="after a stop-out, same underlying" />
        <Kpi label="Re-entry Win Rate" value={pct(r.allReentries.winRate)} tone={r.allReentries.winRate >= 0.5 ? "profit" : "loss"} />
        <Kpi label="Re-entry Edge vs Normal" value={inr(edge)} tone={edge >= 0 ? "profit" : "loss"} hint="expectancy difference / trade" />
      </div>
      <Panel title="Re-entry Performance by Time Window" subtitle="A losing trade is closed, then a new trade in the same underlying is taken within the window">
        <StatTable rows={rows} firstCol="Window" />
      </Panel>
      <Panel title="Re-entry P&L by Window">
        <PnlBars data={r.windows.map((b: Stat) => ({ label: b.label.replace("Re-entry ", ""), value: b.totalPnl }))} />
      </Panel>
    </div>
  );
}

function Time({ t }: { t: any }) {
  return (
    <div className="space-y-5">
      <Panel title="P&L by Hour of Day">
        <PnlBars data={t.byHour.map((b: Stat) => ({ label: b.label, value: b.totalPnl }))} />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="P&L by Day of Week">
          <PnlBars data={t.byWeekday.map((b: Stat) => ({ label: b.label, value: b.totalPnl }))} height={220} />
        </Panel>
        <Panel title="P&L by Month (Seasonality)">
          <PnlBars data={t.byMonth.map((b: Stat) => ({ label: b.label, value: b.totalPnl }))} height={220} />
        </Panel>
      </div>
      <Panel title="Best Hours">
        <StatTable rows={t.byHour} firstCol="Hour" />
      </Panel>
    </div>
  );
}

function Loss({ l }: { l: any }) {
  const c = l.cluster;
  return (
    <div className="space-y-5">
      {c && (
        <Panel title="Loss Cluster — Common Characteristics" subtitle={`${c.count} losing trades analyzed`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="% on Expiry Day" value={pct(c.pctExpiryDay)} />
            <Kpi label="% Re-entries" value={pct(c.pctReentry)} />
            <Kpi label="Calls vs Puts" value={`${pct(c.pctCall)} / ${pct(c.pctPut)}`} />
            <Kpi label="Worst Hour" value={c.topHour ?? "—"} />
            <Kpi label="Top Instrument" value={c.topInstrument ?? "—"} />
            <Kpi label="Avg Hold (min)" value={num(c.avgHoldingMinutes, 0)} />
            <Kpi label="Avg Distance %" value={pct(c.avgStrikeDistancePct)} />
          </div>
        </Panel>
      )}
      <Panel title="Largest Losing Trades">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Entry</th>
                <th className="py-2 px-3 text-right">Loss</th>
                <th className="py-2 px-3 text-right">Dist %</th>
                <th className="py-2 px-3">Expiry?</th>
                <th className="py-2 pl-3">Re-entry?</th>
              </tr>
            </thead>
            <tbody>
              {l.largestLosses.map((t: any, i: number) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs">{t.symbol}</td>
                  <td className="py-2 px-3">{t.optionType ?? "—"}</td>
                  <td className="py-2 px-3 text-xs">{String(t.entryTime).slice(0, 16).replace("T", " ")}</td>
                  <td className="py-2 px-3 text-right text-loss tabular-nums">{inr(t.pnl)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{t.strikeDistancePct != null ? pct(t.strikeDistancePct) : "—"}</td>
                  <td className="py-2 px-3">{t.isExpiryDay ? "Yes" : "—"}</td>
                  <td className="py-2 pl-3">{t.isReentry ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Largest Losing Days">
        <PnlBars data={l.largestLosingDays.map((d: any) => ({ label: d.day.slice(5), value: d.pnl }))} height={220} />
      </Panel>
    </div>
  );
}
