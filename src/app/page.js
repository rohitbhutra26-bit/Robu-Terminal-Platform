import Link from "next/link";
import { TOOLS } from "../lib/tools";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto px-8 py-9">
      <h1 className="text-[22px] font-bold">Robu Terminal</h1>
      <p className="mt-1 text-sm text-muted">
        One place for all your tools. Pick a module to begin.
      </p>

      <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
        {TOOLS.map((t) => (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            className="ds-card group p-4 transition-transform hover:-translate-y-0.5 hover:border-accent/60"
          >
            <div className="h-1 w-9 rounded" style={{ background: t.accent }} />
            <div className="mt-3 text-[15px] font-bold">{t.name}</div>
            <div className="mt-0.5 text-xs text-muted">{t.tagline}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
