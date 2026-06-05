// ============================================================
//  Robu Terminal — Design System primitives
//  Thin, composable building blocks. Use these instead of
//  hand-rolling styles so every module stays consistent.
// ============================================================
import { cn } from "../lib/cn";

export function Card({ className, children, ...rest }) {
  return (
    <div className={cn("ds-card p-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }) {
  return <div className={cn("ds-label", className)}>{children}</div>;
}

export function Pill({ children, tone = "muted", className }) {
  const tones = {
    muted: "text-muted",
    gain: "text-gain border-gain/40",
    loss: "text-loss border-loss/40",
    accent: "text-accent border-accent/40",
    warning: "text-warning border-warning/40",
  };
  return <span className={cn("ds-pill", tones[tone], className)}>{children}</span>;
}

export function Button({ variant = "primary", className, children, ...rest }) {
  const v = variant === "ghost" ? "ds-btn-ghost" : "ds-btn-primary";
  return (
    <button className={cn(v, className)} {...rest}>
      {children}
    </button>
  );
}

// A labelled metric with a tabular-number value — the terminal workhorse.
export function Stat({ label, value, sub, tone = "primary", className }) {
  const tones = { primary: "text-primary", gain: "text-gain", loss: "text-loss", accent: "text-accent" };
  return (
    <div className={cn("ds-card p-4", className)}>
      <div className="ds-label">{label}</div>
      <div className={cn("ds-num mt-1 text-2xl font-semibold", tones[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
