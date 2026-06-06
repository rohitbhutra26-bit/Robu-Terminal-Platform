// Single source of truth for the unified terminal's tabs.
// Each tool runs as its OWN app on its OWN port — the shell only frames it.
// Nothing here edits or imports the original apps.

export const TOOLS = [
  {
    slug: "charts",
    name: "Charts",
    tagline: "Technical + F&O (Kite)",
    native: true, // rendered in-app at /charts (proxies the Kite engine on :8010)
    accent: "#5aa6ff",
    note: "Run a daily Kite login (Get Kite Token) for live data.",
  },
  {
    slug: "valuation",
    name: "Valuation",
    tagline: "DCF · peers · scenarios",
    native: true, // rendered in-app at /valuation (not an iframe)
    accent: "#2fce8f",
    note: "Needs the data server (port 8000) running.",
  },
  {
    slug: "automated",
    name: "Automated System",
    tagline: "Trader DNA analyzer",
    native: true, // rendered in-app at /automated (SQLite-backed)
    accent: "#b18cff",
    note: "Import trades (CSV/xlsx) to populate the local database.",
  },
];

export const getTool = (slug) => TOOLS.find((t) => t.slug === slug);
