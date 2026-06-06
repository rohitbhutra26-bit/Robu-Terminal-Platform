"use client";
import { useEffect, useState, useCallback } from "react";

export interface ImportRecord {
  id: string;
  fileName: string;
  accountLabel: string;
  broker: string;
  rowCount: number;
  tradeCount: number;
  createdAt: string;
}

// Lists every imported file with a per-file delete button, so individual
// imports can be removed from the UI — no terminal needed. `refreshKey` lets
// the parent trigger a reload after a new import.
export function ImportsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/imports")
      .then((r) => r.json())
      .then((d) => setImports(d.imports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function remove(rec: ImportRecord) {
    if (!confirm(`Delete "${rec.fileName}" from ${rec.accountLabel}? This removes its ${rec.tradeCount} trades.`)) return;
    setBusyId(rec.id);
    try {
      await fetch(`/api/imports?id=${encodeURIComponent(rec.id)}`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading imports…</p>;
  if (imports.length === 0) return <p className="text-sm text-muted">No files imported yet.</p>;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="px-3 py-2 font-medium">File</th>
            <th className="px-3 py-2 font-medium">Account</th>
            <th className="px-3 py-2 text-right font-medium">Trades</th>
            <th className="px-3 py-2 font-medium">Imported</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {imports.map((rec) => (
            <tr key={rec.id} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{rec.fileName}</td>
              <td className="px-3 py-2">{rec.accountLabel}</td>
              <td className="px-3 py-2 text-right tabular-nums">{rec.tradeCount.toLocaleString("en-IN")}</td>
              <td className="px-3 py-2 text-xs text-muted">{rec.createdAt.slice(0, 16).replace("T", " ")}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => remove(rec)}
                  disabled={busyId === rec.id}
                  className="rounded border border-border px-2 py-1 text-xs text-muted hover:border-loss hover:text-loss disabled:opacity-40"
                >
                  {busyId === rec.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
