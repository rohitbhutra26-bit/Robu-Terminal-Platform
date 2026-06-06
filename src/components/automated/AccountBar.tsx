"use client";
import { inr, pct } from "@/lib/automated/format";

export interface AccountSummary {
  id: string;
  label: string;
  broker: string;
  includeInCombined: boolean;
  closedTrades: number;
  grossPnl: number;
  charges: number;
  netPnl: number;
  winRate: number;
}

// The account filter bar: "All accounts" (combined, excludes accounts flagged
// includeInCombined=false such as HDFC) plus one chip per account. Selecting a
// chip re-scopes the whole dashboard.
export function AccountBar({
  accounts,
  selected, // null = combined "All accounts"
  onSelect,
}: {
  accounts: AccountSummary[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors border ${
      active
        ? "border-gold bg-gold/10 text-primary"
        : "border-border text-muted hover:text-primary"
    }`;

  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <button className={chip(selected === null)} onClick={() => onSelect(null)}>
        All accounts
      </button>
      {accounts.map((a) => (
        <button key={a.id} className={chip(selected === a.id)} onClick={() => onSelect(a.id)}>
          {a.label}
          {!a.includeInCombined && (
            <span className="ml-1 text-xs text-muted">(separate)</span>
          )}
        </button>
      ))}
    </div>
  );
}

// Side-by-side comparison of every account. HDFC (separate) is visually marked.
export function AccountComparison({ accounts }: { accounts: AccountSummary[] }) {
  if (!accounts.length) return null;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="px-3 py-2 font-medium">Account</th>
            <th className="px-3 py-2 font-medium">Broker</th>
            <th className="px-3 py-2 text-right font-medium">Closed</th>
            <th className="px-3 py-2 text-right font-medium">Win&nbsp;rate</th>
            <th className="px-3 py-2 text-right font-medium">Gross&nbsp;P&amp;L</th>
            <th className="px-3 py-2 text-right font-medium">Charges</th>
            <th className="px-3 py-2 text-right font-medium">Net&nbsp;P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2">
                {a.label}
                {!a.includeInCombined && (
                  <span className="ml-1 text-xs text-muted">(separate)</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted">{a.broker}</td>
              <td className="px-3 py-2 text-right">{a.closedTrades.toLocaleString("en-IN")}</td>
              <td className="px-3 py-2 text-right">{pct(a.winRate)}</td>
              <td className="px-3 py-2 text-right">{inr(a.grossPnl)}</td>
              <td className="px-3 py-2 text-right text-muted">{inr(a.charges)}</td>
              <td className={`px-3 py-2 text-right font-medium ${a.netPnl >= 0 ? "text-profit" : "text-loss"}`}>
                {inr(a.netPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
