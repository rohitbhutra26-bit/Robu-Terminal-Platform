"use client";
import { useEffect, useState } from "react";
import { Panel } from "@/components/automated/ui";
import { ImportsList } from "@/components/automated/ImportsList";

const BROKERS = ["AUTO", "ZERODHA", "KOTAK", "HDFC"];

interface Account {
  id: string;
  label: string;
  broker: string;
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [broker, setBroker] = useState("AUTO");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error && d.accounts) {
          setAccounts(d.accounts);
          if (d.accounts[0]) setAccountId(d.accounts[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function upload(replace = false) {
    if (!file || !accountId) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("broker", broker);
    fd.append("accountId", accountId);
    if (replace) fd.append("replace", "true");
    try {
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 409 && data.duplicate) {
        // Already imported — ask before double-counting.
        if (confirm(`${data.error}\n\nReplace the previous import of this file?`)) {
          await upload(true);
          return;
        }
        setError("Import cancelled — file was already imported.");
      } else if (!res.ok) {
        setError(data.error ?? "Import failed.");
      } else {
        setResult(data);
        setRefreshKey((k) => k + 1);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const acc = accounts.find((a) => a.id === accountId);
    if (!confirm(`Delete imported trades for ${acc?.label ?? "this account"}?`)) return;
    await fetch(`/api/import?accountId=${encodeURIComponent(accountId)}`, { method: "DELETE" });
    setResult({ ok: true, reset: true });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold">Import broker file</h1>
      <Panel
        title="Upload tradebook"
        subtitle="Zerodha & Kotak (CSV) · HDFC (Excel order log). Pick the account this file belongs to — one Zerodha account can take several files (FO + COM). Leave broker on AUTO to detect from the file."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase text-muted">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded border border-border bg-panel2 px-3 py-2 text-sm"
            >
              {accounts.length === 0 && <option value="">No accounts — run db seed first</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.label} ({a.broker})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted">Broker</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full rounded border border-border bg-panel2 px-3 py-2 text-sm"
            >
              {BROKERS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted">File (CSV or XLSX)</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-accent file:px-4 file:py-2 file:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => upload()}
              disabled={!file || !accountId || busy}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy ? "Importing…" : "Import"}
            </button>
            <button onClick={reset} disabled={!accountId} className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-loss disabled:opacity-40">
              Reset this account
            </button>
          </div>
        </div>
      </Panel>

      {error && (
        <Panel title="Import error">
          <p className="text-sm text-loss">{error}</p>
        </Panel>
      )}
      {result?.ok && (
        <Panel title="Done">
          {result.reset ? (
            <p className="text-sm text-profit">Account trades deleted.</p>
          ) : (
            <p className="text-sm text-profit">
              Detected <b>{result.broker}</b> → <b>{result.account}</b>. Parsed {result.rowsParsed} rows →
              created <b>{result.tradesCreated}</b> round-trip trades.{" "}
              <a href="/" className="text-accent underline">View dashboard →</a>
            </p>
          )}
        </Panel>
      )}

      <Panel title="Imported files" subtitle="Every file you've imported. Delete any one to remove just its trades — no terminal needed.">
        <ImportsList refreshKey={refreshKey} />
      </Panel>
    </div>
  );
}
