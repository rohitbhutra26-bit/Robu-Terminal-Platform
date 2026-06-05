# Robu Terminal — Design System

The shared visual language for every module (Charts, Valuation, Automated) and
any future project. Derived from the Valuation app. **Live reference:** run the
app and open `/design`.

## Principles
1. **Dark-first, data-dense, calm.** A professional terminal — not a marketing site.
2. **Numbers are monospace + tabular** so columns align. UI text is DM Sans.
3. **Color carries meaning:** blue = interactive/accent, teal = gain, red = loss,
   amber = caution. Don't use color decoratively.
4. **Reuse primitives** (`src/components/ui.js`) and tokens — never hardcode hex.

## Color tokens
Defined as RGB triplets in `src/app/globals.css`, exposed to Tailwind so opacity
modifiers work (`bg-card/50`, `text-muted/60`, `border-border/30`).

| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `terminal` | `#0f121b` | `#f1f3f9` | Page background |
| `card` | `#161b2a` | `#ffffff` | Panels / cards |
| `border` | `#2a3144` | `#d5dae8` | Hairline borders |
| `accent` / `gold` | `#4d8eff` | `#2962ff` | Links, buttons, focus |
| `gain` | `#00c9a7` | `#00947a` | Positive values |
| `loss` | `#ff5252` | `#dc2626` | Negative values |
| `warning` | `#ffc107` | `#b45309` | Caution |
| `primary` | `#e8eaed` | `#0f121b` | Primary text |
| `muted` | `#9498a3` | `#5a6073` | Secondary text |

Theme is set via `data-theme="dark|light"` on `<html>` (toggle in the sidebar).

## Typography
- **DM Sans** — UI & headings (`font-sans`). Headings use tight tracking (`-0.02em`).
- **IBM Plex Mono** — all figures (`font-mono` / `.ds-num`), tabular numerals on.

## Primitives
Import from `src/components/ui.js`:
- `<Card>` — bordered panel surface.
- `<Stat label value sub tone>` — labelled metric with mono value.
- `<Pill tone>` — status chip (`muted|gain|loss|accent|warning`).
- `<Button variant>` — `primary` | `ghost`.
- `<SectionTitle>` — small uppercase label.

CSS helper classes (in `globals.css`, usable anywhere): `.ds-card`, `.ds-pill`,
`.ds-btn-primary`, `.ds-btn-ghost`, `.ds-label`, `.ds-num`.

## Using it in a new module / project
1. Copy `tailwind.config.js`, `postcss.config.js`, and `src/app/globals.css`.
2. Load the two Google fonts (see `src/app/layout.js`).
3. Set `data-theme="dark"` on `<html>`.
4. Build screens from the primitives and tokens above.
