// Consumes the canonical Robu Design System preset (single source of truth).
// Update the design tokens by re-fetching tailwind.robu.js + src/app/robu-tokens.css
// from github.com/rohitbhutra26-bit/robu-design-system.
const robu = require("./tailwind.robu.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      ...robu,
      colors: {
        ...robu.colors,
        // Platform-specific additions (Automated module):
        card2:  "rgb(var(--color-card2) / <alpha-value>)",
        ink:    "rgb(var(--color-terminal) / <alpha-value>)",
        panel:  "rgb(var(--color-card) / <alpha-value>)",
        panel2: "rgb(var(--color-card2) / <alpha-value>)",
        text:   "rgb(var(--color-primary) / <alpha-value>)",
        profit: "rgb(var(--color-gain) / <alpha-value>)",
        warn:   "rgb(var(--color-warning) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
