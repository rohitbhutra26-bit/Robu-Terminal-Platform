"use client";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { inr } from "@/lib/automated/format";

// Recharts needs concrete colors, not Tailwind classes. Read them from the
// theme CSS variables so the charts follow dark/light mode. Re-reads when the
// document's data-theme attribute changes.
function rgb(varName: string): string {
  if (typeof window === "undefined") return "#888";
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `rgb(${v})` : "#888";
}

function useThemeColors() {
  const read = () => ({
    grid: rgb("--color-border"),
    axis: rgb("--color-muted"),
    card: rgb("--color-card"),
    border: rgb("--color-border"),
    text: rgb("--color-primary"),
    accent: rgb("--color-accent"),
    gain: rgb("--color-gain"),
    loss: rgb("--color-loss"),
  });
  const [c, setC] = useState(read);
  useEffect(() => {
    const update = () => setC(read());
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return c;
}

export function EquityChart({ data }: { data: { time: string; equity: number }[] }) {
  const c = useThemeColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity={0.5} />
            <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="time" tick={{ fill: c.axis, fontSize: 11 }} tickFormatter={(t) => String(t).slice(0, 10)} minTickGap={40} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={48} />
        <Tooltip
          contentStyle={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text }}
          formatter={(v: number) => [inr(v), "Equity"]}
          labelFormatter={(l) => String(l).slice(0, 19).replace("T", " ")}
        />
        <Area type="monotone" dataKey="equity" stroke={c.accent} strokeWidth={2} fill="url(#eq)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Bar chart where each bar is colored gain/loss by sign of value.
export function PnlBars({
  data,
  height = 260,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const c = useThemeColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={48} />
        <Tooltip
          cursor={{ fill: c.axis, fillOpacity: 0.08 }}
          contentStyle={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text }}
          formatter={(v: number) => [inr(v), "Gross P&L"]}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? c.gain : c.loss} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
