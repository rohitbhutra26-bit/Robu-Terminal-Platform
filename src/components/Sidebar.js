"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LineChart, Calculator, Cpu, Sun, Moon, Palette } from "lucide-react";
import { TOOLS } from "../lib/tools";

const ICONS = { charts: LineChart, valuation: Calculator, automated: Cpu };

function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("robu-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("robu-theme", next);
  };
  return (
    <button onClick={flip} className="ds-btn-ghost w-full justify-start text-muted">
      {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
      <span className="text-xs">{theme === "dark" ? "Dark" : "Light"} theme</span>
    </button>
  );
}

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-screen flex-col gap-1 overflow-y-auto border-r border-border bg-terminal px-3 py-4">
      <Link href="/" className="mb-4 flex items-center gap-2.5 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-[15px] font-extrabold text-white">
          R
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold">Robu Terminal</div>
          <div className="text-[11px] text-muted">unified platform</div>
        </div>
      </Link>

      <div className="ds-label px-2 pb-1 pt-2">Analyse</div>
      {TOOLS.map((t) => {
        const active = path === `/${t.slug}`;
        const Icon = ICONS[t.slug] || LineChart;
        return (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            className={
              "group flex items-start gap-2.5 rounded-xl border px-2.5 py-2 transition-colors " +
              (active
                ? "border-border bg-card"
                : "border-transparent hover:bg-card/60")
            }
          >
            <Icon size={16} className="mt-0.5 shrink-0" style={{ color: t.accent }} />
            <span className="leading-tight">
              <span className="block text-[13.5px] font-semibold">{t.name}</span>
              <span className="block text-[11px] text-muted">{t.tagline}</span>
            </span>
          </Link>
        );
      })}

      <div className="flex-1" />

      <ThemeToggle />
      <Link
        href="/design"
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted hover:bg-card/60"
      >
        <Palette size={13} /> Design system
      </Link>
      <div className="mt-1 border-t border-border px-2 pt-2 text-[10.5px] text-muted">
        Local · localhost:3000
      </div>
    </aside>
  );
}
