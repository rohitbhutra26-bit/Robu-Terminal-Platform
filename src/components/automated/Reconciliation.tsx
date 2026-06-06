"use client";
import { useEffect, useState } from "react";
import { inr } from "@/lib/automated/format";

interface ReconRow {
  accountId: string;
  label: string;
  broker: string;
  imports: number;
  matched: boolean;
  rawNetCashflow: number;
  pairedAccountedCashflow: number;
  difference: number;
  closedPnl: number;
  openLegCashflow: number;
  openQty: number;
}

// The verification gate. Proves, per account, that the cash that flowed in/out
// equals what the paired trades account for — so the numbers are trustworthy.
export function Reconciliation() {
  const [rows, setRows] = useState<ReconRow[]>([]);
  const [allMatched, setAllMatched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reconcile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setRows((d.results ?? []).filter((r: ReconRow) => r.imports > 0));
          setAllMatched(d.allMatched);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Reconciling…</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted">No imported accounts to reconcile yet.</p>;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border px-4 py-3 ${
          allMatched ? "border-gain/40 bg-gain/10" : "border-loss/40 bg-loss/10"
        }`}
      >
        <p className={`text-sm font-semibold ${allMatched ? "text-gain" : "text-loss"}`}>
          {allMatched ? "✓ All accounts reconcile" : "⚠ Some accounts do not reconcile"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Each account&apos;s raw cash in/out (captured at import) is compared to what the paired
          trades account for — realised P&amp;L plus open positions. A zero difference means the
          pairing engine lost or duplicated nothing.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-3 py-2 font-medium">Account</th>
              <th className="px-3 py-2 text-right font-medium">Raw cashflow</th>
              <th className="px-3 py-2 text-right font-medium">Closed P&amp;L</th>
              <th className="px-3 py-2 text-right font-medium">Open legs</th>
              <th className="px-3 py-2 text-right font-medium">Accounted</th>
              <th className="px-3 py-2 text-right font-medium">Diff</th>
              <th className="px-3 py-2 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.accountId} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(r.rawNetCashflow)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(r.closedPnl)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted">{inr(r.openLegCashflow)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(r.pairedAccountedCashflow)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${Math.abs(r.difference) <= 1 ? "text-muted" : "text-loss"}`}>
                  {inr(r.difference)}
                </td>
                <td className="px-3 py-2 text-center">
                  {r.matched ? (
                    <span className="rounded bg-gain/15 px-2 py-0.5 text-xs text-gain">match</span>
                  ) : (
                    <span className="rounded bg-loss/15 px-2 py-0.5 text-xs text-loss">off</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        &quot;Open legs&quot; is cash tied up in positions not yet closed in your data — it&apos;s why an
        account&apos;s closed P&amp;L differs from raw cashflow. The identity still holds: raw = closed +
        open, to the rupee.
      </p>
    </div>
  );
}
