# Robu Terminal — Platform

One unified shell that houses all your tools under a single address
(`localhost:3000`) with a shared sidebar. It **frames** your existing apps —
it does not modify or copy them. Each tool keeps running from its own folder
on its own port, so the originals stay untouched and you can roll back anytime
by deleting this folder.

## Modules & ports

| Tab | App (untouched original) | Port |
|-----|--------------------------|------|
| Charts | `Robu-Terminal-/core` (FastAPI, Kite) | 8010 |
| Valuation | `robu-valuation-next` (Next) + `robu-data-server` (FastAPI) | 3002 / 8000 |
| Automated System | `rohit-trader-dna-analyzer` (Next) | 3001 |
| **Shell** | this project | **3000** |

## Run it

```
npm install        # first time only
```

Then double-click **`Start Platform.command`** — it launches every app on its
port and opens the terminal at http://localhost:3000.

To run just the shell while developing: `npm run dev`.

## Notes
- Edit the paths at the top of `Start Platform.command` if your folders differ.
- The shell is a thin frame; all real logic lives in the original apps.
- `tools.js` (`src/lib/`) is the single place that maps each tab to its port.
