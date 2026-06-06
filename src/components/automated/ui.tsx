"use client";
import React from "react";
import { inr, pct, pf } from "@/lib/automated/format";

export function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-hover rounded-lg border border-border bg-card p-4 ${className}`}>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "profit" | "loss";
  hint?: string;
}) {
  const color =
    tone === "profit" ? "text-gain" : tone === "loss" ? "text-loss" : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card2 p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export interface Stat {
  label: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number | null;
  maxDrawdown: number;
  expectancy: number;
}

// A reusable performance comparison table.
export function StatTable({ rows, firstCol = "Segment" }: { rows: Stat[]; firstCol?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted">
            <th className="py-2 pr-3 font-medium">{firstCol}</th>
            <th className="py-2 px-3 font-medium text-right">Trades</th>
            <th className="py-2 px-3 font-medium text-right">Win %</th>
            <th className="py-2 px-3 font-medium text-right">Gross P&L</th>
            <th className="py-2 px-3 font-medium text-right">Profit Factor</th>
            <th className="py-2 px-3 font-medium text-right">Avg Win</th>
            <th className="py-2 px-3 font-medium text-right">Avg Loss</th>
            <th className="py-2 pl-3 font-medium text-right">Max DD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border/60">
              <td className="py-2 pr-3 font-medium">{r.label}</td>
              <td className="py-2 px-3 text-right tabular-nums">{r.trades}</td>
              <td className="py-2 px-3 text-right tabular-nums">{pct(r.winRate)}</td>
              <td className={`py-2 px-3 text-right tabular-nums ${r.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                {inr(r.totalPnl)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">{pf(r.profitFactor)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-profit">{inr(r.avgProfit)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-loss">{inr(r.avgLoss)}</td>
              <td className="py-2 pl-3 text-right tabular-nums text-warn">{inr(r.maxDrawdown)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="no-print mb-5 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-2 text-sm transition-colors ${
            active === t
              ? "border-b-2 border-gold text-primary"
              : "text-muted hover:text-primary"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
