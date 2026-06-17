"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, RefreshCw, LineChart, Search } from "lucide-react";

const QUICK = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "NIFTY", "BANKNIFTY", "TATAMOTORS", "SBIN", "BAJFINANCE"];

type Analysis = any;

const inr = (n: number | undefined | null) =>
  n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function dirTone(direction?: string) {
  if (direction === "long") return "text-gain";
  if (direction === "short") return "text-loss";
  return "text-muted";
}
function dirBg(direction?: string) {
  if (direction === "long") return "border-gain/40 text-gain";
  if (direction === "short") return "border-loss/40 text-loss";
  return "border-border text-muted";
}

// Detect a "needs Kite login" error vs a genuine not-found / other error.
function isLoginError(msg: string) {
  return /kite|token|log ?in|session|expired|unauthor/i.test(msg || "");
}

export default function ChartsPage() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [engineDown, setEngineDown] = useState(false);
  const [needLogin, setNeedLogin] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const tRef = useRef<any>(null);

  // debounced symbol suggestions
  useEffect(() => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/charts/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setSuggestions((j.results ?? []).slice(0, 8));
      } catch { setSuggestions([]); }
    }, 200);
    return () => clearTimeout(tRef.current);
  }, [q]);

  async function kiteLogin() {
    try {
      const r = await fetch("/api/charts/kite_login");
      const j = await r.json();
      if (j.url) {
        // Full-page redirect to Zerodha. After login the engine saves the
        // token and bounces back to /charts automatically.
        window.location.href = j.url;
      } else {
        alert("Couldn't start Kite login — make sure the platform is running.");
      }
    } catch {
      alert("Couldn't reach the Kite engine. Is the platform running?");
    }
  }

  async function analyze(symbol: string) {
    if (!symbol) return;
    setLoading(true); setEngineDown(false); setNeedLogin(null); setNotFound(null); setSuggestions([]); setQ(symbol);
    try {
      const r = await fetch(`/api/charts/analyze?symbol=${encodeURIComponent(symbol)}`);
      if (r.status === 503) { setEngineDown(true); setData(null); return; }
      const j = await r.json();
      if (j.error) {
        if (isLoginError(j.error)) { setNeedLogin(symbol); setData(null); }
        else { setNotFound(j.error); setData(null); }
      } else {
        setData(j);
      }
    } catch {
      setEngineDown(true); setData(null);
    } finally {
      setLoading(false);
    }
  }

  const idle = !loading && !engineDown && !needLogin && !notFound && !data;

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <h1 className="text-xl font-bold">Charts</h1>
      <p className="mt-0.5 text-sm text-muted">Technical &amp; F&amp;O structure, levels and AI read — from your Kite engine.</p>

      {/* Search */}
      <div className="relative mt-5 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") analyze(q.trim()); }}
          placeholder="Search a stock or index — RELIANCE, NIFTY, BANKNIFTY…"
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm outline-none focus:border-accent"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-pop">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => analyze(s.symbol || s.tradingsymbol || s.name)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-terminal/40"
              >
                <span className="font-semibold">{s.symbol || s.tradingsymbol}</span>
                <span className="truncate pl-3 text-xs text-muted">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick picks */}
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((s) => (
          <button key={s} onClick={() => analyze(s)} className="ds-pill hover:border-accent/50 hover:text-primary">{s}</button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="ds-card mt-8 flex max-w-xl items-center gap-3 p-5">
          <RefreshCw size={16} className="animate-spin text-accent" />
          <span className="text-sm text-muted">Analysing <b className="text-primary">{q}</b> — reading structure, levels &amp; F&amp;O…</span>
        </div>
      )}

      {/* Friendly empty state (so the landing isn't bare) */}
      {idle && (
        <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <EmptyHint icon={<LineChart size={16} />} title="Type or pick a symbol" body="Any NSE stock or index — RELIANCE, NIFTY, BANKNIFTY." />
          <EmptyHint icon={<KeyRound size={16} />} title="Live data via Kite" body="Charts use your Zerodha Kite login (refreshed once a day)." />
          <EmptyHint icon={<RefreshCw size={16} />} title="Full read in one tap" body="Entry, stop, targets, setup score, levels & an AI read." />
        </div>
      )}

      {engineDown && !loading && (
        <div className="ds-card mt-8 max-w-xl p-5">
          <div className="text-base font-semibold">Charts engine isn’t running</div>
          <p className="mt-1 text-sm text-muted">
            Start it with <code className="rounded bg-terminal/60 px-1.5 py-0.5 text-primary">Start Platform.command</code>
            {" "}(it launches the Kite engine on port 8010), then run the daily{" "}
            <code className="rounded bg-terminal/60 px-1.5 py-0.5 text-primary">Get Kite Token</code> for live data.
          </p>
        </div>
      )}

      {/* Dedicated "needs Kite login" state — designed, with retry */}
      {needLogin && !loading && (
        <div className="ds-card mt-8 max-w-xl p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <KeyRound size={18} />
            </span>
            <div>
              <div className="text-base font-semibold">Connect to Kite to load {needLogin}</div>
              <div className="text-xs text-muted">Charts need a live Zerodha session</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Click below, log in with your Zerodha ID + PIN, and you’ll be brought right back here with live data unlocked.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={kiteLogin} className="ds-btn-primary inline-flex items-center gap-2">
              <KeyRound size={15} /> Log in to Kite
            </button>
            <button onClick={() => analyze(needLogin)} className="ds-btn-ghost inline-flex items-center gap-2">
              <RefreshCw size={15} /> Retry
            </button>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            First time only — in your Kite app at developers.kite.trade, set the Redirect URL to{" "}
            <code className="rounded bg-terminal/60 px-1 py-0.5 text-primary">http://127.0.0.1:8010</code>{" "}
            so login returns here automatically.
          </p>
        </div>
      )}

      {notFound && !loading && (
        <div className="ds-card mt-8 max-w-xl p-5 text-sm text-muted">
          Couldn’t analyse <b className="text-primary">{q}</b>: {notFound}
        </div>
      )}

      {data && !loading && <Result d={data} />}
    </div>
  );
}

function EmptyHint({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-accent">{icon}<span className="text-sm font-semibold text-primary">{title}</span></div>
      <p className="mt-1.5 text-xs text-muted">{body}</p>
    </div>
  );
}

function Result({ d }: { d: Analysis }) {
  const up = d.direction === "long";
  return (
    <div className="mt-7 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{d.symbol}</h2>
            <span className={`ds-pill ${dirBg(d.direction)}`}>{d.decision}</span>
            {d.source && <span className="ds-pill">{d.source}</span>}
          </div>
          {d.name && <div className="text-sm text-muted">{d.name}</div>}
        </div>
        <div className="text-right">
          <div className="ds-num text-2xl font-semibold">₹{inr(d.price)}</div>
          <div className="text-xs text-muted">{d.trend} · {d.direction}</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Setup score" value={`${d.setup_score ?? "—"}`} sub={`class ${d.class ?? "—"}`} tone={dirTone(d.direction)} />
        <Stat label="Confidence" value={d.confidence != null ? `${d.confidence}%` : "—"} />
        <Stat label="Risk / reward" value={d.rr != null ? `${d.rr}` : "—"} />
        <Stat label="ATR %" value={d.atr_pct != null ? `${d.atr_pct}%` : "—"} />
      </div>

      {/* Trade plan */}
      <div className="ds-card p-5">
        <div className="ds-label mb-3">Trade plan</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Level label="Entry" value={d.entry} />
          <Level label="Stop" value={d.stop} tone="text-loss" />
          <Level label="Target 1" value={d.t1} tone="text-gain" />
          <Level label="Target 2" value={d.t2} tone="text-gain" />
          <Level label="R:R" value={d.rr} plain />
        </div>
      </div>

      {/* Levels + signals */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="ds-card p-5">
          <div className="ds-label mb-3">Key levels</div>
          <Row k="Nearest resistance" v={`₹${inr(d.nearest_resistance)}`} sub={d.res_dist_pct != null ? `${d.res_dist_pct}% away` : ""} />
          <Row k="Nearest support" v={`₹${inr(d.nearest_support)}`} sub={d.sup_dist_pct != null ? `${d.sup_dist_pct}% away` : ""} />
          <Row k="SMA 20 / 50" v={`₹${inr(d.sma20)} / ₹${inr(d.sma50)}`} />
          <Row k="ATR" v={`₹${inr(d.atr)}`} />
        </div>
        <div className="ds-card p-5">
          <div className="ds-label mb-3">Signals</div>
          <Row k="Daily regime" v={d.regime ?? "—"} />
          <Row k="Weekly trend" v={d.weekly_trend ?? "—"} />
          <Row k="Rel. strength" v={d.rel_strength ?? "—"} />
          {d.structure && (
            <Row k="Structure" v={[d.structure.BOS && "BOS", d.structure.CHOCH && "CHoCH", d.structure.trendline_break !== "none" && `TL ${d.structure.trendline_break}`].filter(Boolean).join(" · ") || "—"} />
          )}
        </div>
      </div>

      {/* Reasoning + AI */}
      {Array.isArray(d.reasoning) && d.reasoning.length > 0 && (
        <div className="ds-card p-5">
          <div className="ds-label mb-2">Why</div>
          <ul className="space-y-1.5 text-sm text-muted">
            {d.reasoning.map((r: string, i: number) => (
              <li key={i} className="flex gap-2"><span className={up ? "text-gain" : "text-loss"}>•</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      )}
      {d.ai && (
        <div className="ds-card p-5">
          <div className="ds-label mb-2">AI read</div>
          <p className="whitespace-pre-line text-sm text-muted">
            {typeof d.ai === "string" ? d.ai : (d.ai.summary ?? d.ai.text ?? JSON.stringify(d.ai))}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone = "text-primary" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="ds-card p-4">
      <div className="ds-label">{label}</div>
      <div className={`ds-num mt-1 text-xl font-semibold ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
function Level({ label, value, tone = "text-primary", plain }: { label: string; value: any; tone?: string; plain?: boolean }) {
  return (
    <div>
      <div className="ds-label">{label}</div>
      <div className={`ds-num mt-1 text-lg font-semibold ${tone}`}>{plain ? (value ?? "—") : `₹${inr(value)}`}</div>
    </div>
  );
}
function Row({ k, v, sub }: { k: string; v: any; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-sm text-muted">{k}</span>
      <span className="ds-num text-sm font-medium">{v}{sub && <span className="ml-2 text-xs text-muted">{sub}</span>}</span>
    </div>
  );
}
