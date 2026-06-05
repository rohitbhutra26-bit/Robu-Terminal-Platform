import { Card, Stat, Pill, Button, SectionTitle } from "../../components/ui";

const COLORS = [
  ["terminal", "Page background"],
  ["card", "Panel surface"],
  ["border", "Hairline border"],
  ["accent", "Interactive / accent"],
  ["gain", "Positive"],
  ["loss", "Negative"],
  ["warning", "Caution"],
  ["primary", "Primary text"],
  ["muted", "Secondary text"],
];

export default function DesignSystem() {
  return (
    <div className="h-full overflow-y-auto px-8 py-9">
      <h1 className="text-[22px] font-bold">Design System</h1>
      <p className="mt-1 text-sm text-muted">
        The shared visual language for every Robu Terminal module. Built from the
        Valuation app. Use these tokens and primitives — don’t reinvent styles.
      </p>

      {/* Colors */}
      <SectionTitle className="mt-8">Color tokens</SectionTitle>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {COLORS.map(([name, desc]) => (
          <Card key={name} className="p-3">
            <div
              className="h-12 w-full rounded-lg border border-border"
              style={{ background: `rgb(var(--color-${name}))` }}
            />
            <div className="mt-2 font-mono text-xs">{name}</div>
            <div className="text-[11px] text-muted">{desc}</div>
          </Card>
        ))}
      </div>

      {/* Typography */}
      <SectionTitle className="mt-8">Typography</SectionTitle>
      <Card className="mt-3 space-y-2">
        <div className="text-2xl font-bold">DM Sans — headings & UI</div>
        <div className="text-sm text-muted">
          Body copy in DM Sans. Clean, geometric, TradingView-style.
        </div>
        <div className="ds-num text-lg">1,234.56  ·  +12.4%  ·  ₹4,820 Cr</div>
        <div className="text-xs text-muted">IBM Plex Mono, tabular numerals — figures align in columns.</div>
      </Card>

      {/* Components */}
      <SectionTitle className="mt-8">Primitives</SectionTitle>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        <Stat label="Revenue (FY25)" value="₹4,820 Cr" sub="+18.2% YoY" tone="gain" />
        <Stat label="Drawdown" value="-12.4%" tone="loss" />
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Pill tone="gain">Undervalued</Pill>
            <Pill tone="loss">Overvalued</Pill>
            <Pill tone="accent">Watch</Pill>
            <Pill tone="warning">Caution</Pill>
          </div>
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
