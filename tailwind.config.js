/** @type {import('tailwindcss').Config} */
// Robu Terminal Design System — Tailwind theme.
// Colors are CSS-variable RGB triplets so opacity modifiers work:
// bg-card/50, text-muted/60, border-border/30, etc. Tokens live in globals.css.
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        terminal: "rgb(var(--color-terminal) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        card2: "rgb(var(--color-card2) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        gain: "rgb(var(--color-gain) / <alpha-value>)",
        loss: "rgb(var(--color-loss) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        // Back-compat aliases used by the Automated module:
        ink: "rgb(var(--color-terminal) / <alpha-value>)",
        panel: "rgb(var(--color-card) / <alpha-value>)",
        panel2: "rgb(var(--color-card2) / <alpha-value>)",
        text: "rgb(var(--color-primary) / <alpha-value>)",
        profit: "rgb(var(--color-gain) / <alpha-value>)",
        warn: "rgb(var(--color-warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["DM Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.25)",
        pop: "0 8px 24px rgb(0 0 0 / 0.35)",
      },
    },
  },
  plugins: [],
};
