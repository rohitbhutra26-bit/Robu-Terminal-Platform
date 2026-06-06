export function inr(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function pct(n: number | null | undefined, dp = 1): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(dp)}%`;
}

export function num(n: number | null | undefined, dp = 2): string {
  if (n == null) return "—";
  return n.toFixed(dp);
}

export function pf(n: number | null | undefined): string {
  if (n == null) return "∞";
  return n.toFixed(2);
}
