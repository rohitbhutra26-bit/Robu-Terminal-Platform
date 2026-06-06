/**
 * ROBU Design System — Tailwind v3 preset (theme.extend block)
 * Source of truth: github.com/rohitbhutra26-bit/robu-design-system
 * Usage: const robu = require('./tailwind.robu.js'); theme: { extend: { ...robu } }
 */
module.exports = {
  colors: {
    terminal: 'rgb(var(--color-terminal) / <alpha-value>)',
    card:     'rgb(var(--color-card) / <alpha-value>)',
    border:   'rgb(var(--color-border) / <alpha-value>)',
    gold:     'rgb(var(--color-gold) / <alpha-value>)',
    accent:   'rgb(var(--color-accent) / <alpha-value>)',
    gain:     'rgb(var(--color-gain) / <alpha-value>)',
    loss:     'rgb(var(--color-loss) / <alpha-value>)',
    warning:  'rgb(var(--color-warning) / <alpha-value>)',
    primary:  'rgb(var(--color-primary) / <alpha-value>)',
    muted:    'rgb(var(--color-muted) / <alpha-value>)',
  },

  fontFamily: {
    sans:  ['DM Sans', 'system-ui', 'sans-serif'],
    serif: ['Lora', 'Georgia', 'serif'],
    mono:  ['IBM Plex Mono', 'monospace'],
  },

  borderRadius: {
    'cds-xs':   '2px',
    'cds-sm':   '4px',
    'cds-md':   '6px',
    'cds-lg':   '8px',
    'cds-xl':   '12px',
    'cds-2xl':  '16px',
    'cds-full': '9999px',
  },

  boxShadow: {
    'cds-sm': '0 1px 2px 0 var(--shadow-color)',
    'cds-md': '0 4px 6px -1px var(--shadow-color), 0 2px 4px -2px var(--shadow-color)',
    'cds-lg': '0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color)',
    'cds-xl': '0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color)',
  },

  transitionTimingFunction: {
    'cds':    'cubic-bezier(0.4, 0, 0.2, 1)',
    'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  transitionDuration: {
    'micro':    '35ms',
    'fast':     '60ms',
    'standard': '150ms',
    'slow':     '300ms',
    'spring':   '450ms',
  },

  keyframes: {
    'cds-fade-in':     { from: { opacity: '0' }, to: { opacity: '1' } },
    'cds-slide-up':    { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
    'cds-slide-right': { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
    'cds-shimmer':     { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
    'cds-pulse':       { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
    'cds-spin':        { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
  },

  animation: {
    'fade-in':     'cds-fade-in 150ms cubic-bezier(0.4,0,0.2,1) both',
    'slide-up':    'cds-slide-up 300ms cubic-bezier(0.4,0,0.2,1) both',
    'slide-right': 'cds-slide-right 300ms cubic-bezier(0.4,0,0.2,1) both',
    'shimmer':     'cds-shimmer 1.5s cubic-bezier(0.4,0,0.2,1) infinite',
    'pulse-slow':  'cds-pulse 2s cubic-bezier(0.4,0,0.2,1) infinite',
    'spin-slow':   'cds-spin 1.5s linear infinite',
  },
};
