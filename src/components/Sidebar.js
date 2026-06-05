"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LineChart, Calculator, Cpu, Sun, Moon, Palette, Menu } from "lucide-react";
import { RobuLogo } from "./MobileLayout";
import { TOOLS } from "../lib/tools";

const ICONS = { charts: LineChart, valuation: Calculator, automated: Cpu };

function ThemeToggle({ collapsed }) {
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
    <button
      onClick={flip}
      title={collapsed ? "Toggle theme" : undefined}
      className={
        "ds-btn-ghost text-muted " +
        (collapsed ? "w-full justify-center px-0" : "w-full justify-start")
      }
    >
      {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
      {!collapsed && (
        <span className="text-xs">{theme === "dark" ? "Dark" : "Light"} theme</span>
      )}
    </button>
  );
}

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const path = usePathname();
  return (
    <aside className="flex h-screen flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-border bg-terminal px-3 py-4">
      {/* Top: hamburger toggle + logo */}
      <div
        className={
          "mb-4 flex items-center " + (collapsed ? "justify-center" : "gap-2 px-1")
        }
      >
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-card/60 hover:text-primary"
        >
          <Menu size={18} />
        </button>

        {!collapsed && (
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0">
              <RobuLogo size={30} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold">Robu Terminal</span>
              <span className="block text-[11px] text-muted">unified platform</span>
            </span>
          </Link>
        )}
      </div>

      {!collapsed && <div className="ds-label px-2 pb-1 pt-2">Analyse</div>}

      {TOOLS.map((t) => {
        const active = path === `/${t.slug}`;
        const Icon = ICONS[t.slug] || LineChart;
        return (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            title={collapsed ? t.name : undefined}
            className={
              "group flex items-start rounded-xl border transition-colors " +
              (collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2") +
              " " +
              (active
                ? "border-border bg-card"
                : "border-transparent hover:bg-card/60")
            }
          >
            <Icon
              size={collapsed ? 19 : 16}
              className={collapsed ? "shrink-0" : "mt-0.5 shrink-0"}
              style={{ color: t.accent }}
            />
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
                <span className="block truncate text-[11px] text-muted">{t.tagline}</span>
              </span>
            )}
          </Link>
        );
      })}

      <div className="flex-1" />

      <ThemeToggle collapsed={collapsed} />
      <Link
        href="/design"
        title={collapsed ? "Design system" : undefined}
        className={
          "flex items-center rounded-lg text-[11px] text-muted hover:bg-card/60 " +
          (collapsed ? "justify-center px-0 py-2" : "gap-2 px-2.5 py-2")
        }
      >
        <Palette size={collapsed ? 16 : 13} />
        {!collapsed && <span>Design system</span>}
      </Link>

      {!collapsed && (
        <div className="mt-1 border-t border-border px-2 pt-2 text-[10.5px] text-muted">
          Local · localhost:3000
        </div>
      )}
    </aside>
  );
}
