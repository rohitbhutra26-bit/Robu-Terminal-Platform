# Robu Terminal — How My Platform Is Wired

Plain-English map of the whole setup so future-me never has to figure it out again.

## The idea (one sentence)
Robu-Terminal-Platform is a thin "shell" (a front door at http://localhost:3000)
with a sidebar. It does NOT contain my apps — it just launches each one on its
own port and frames it. Each app keeps living in its own folder/repo.

## The standard folder layout (SAME on both laptops)
Everything lives under ONE parent folder. Keep it identical on every laptop so
the launcher paths always match and never need editing:

    ~/Documents/Claude/Projects/Robu Terminal/
    ├── Robu-Terminal-Platform/   ← the shell / front door   (port 3000)
    ├── Robu-Terminal-/           ← charts (AI Chart Brain)   (port 8010)
    ├── robu-data-server/         ← valuation data backend    (port 8000)
    └── robu-valuation-next/      ← valuation frontend (optional; now native in shell)

## Ports (which app answers where)
    3000  Shell (the thing I open)         -> Robu-Terminal-Platform  (Next.js)
    8010  Charts / F&O (Kite)              -> Robu-Terminal-           (FastAPI)
    8000  Valuation data (DCF, peers)      -> robu-data-server         (FastAPI)
    3001  Automated System (future)        -> not wired yet (Phase D)

The Valuation tab is built INTO the shell now; it just calls the data-server on 8000.
The Automated System is off until START_ALL=true in Start Platform.command.

## How to run it
Double-click  Start Platform.command  (inside Robu-Terminal-Platform).
It installs anything missing, starts each app on its port, and opens
http://localhost:3000. Keep the terminal window open; Ctrl+C stops it.
Logs land in the .logs folder if something misbehaves.

Where the paths live: top of Start Platform.command (CHARTS_DIR, DATA_DIR, ...).
Because the layout is standard, these are already correct on every laptop.

## GitHub repos (the cloud lockers)
    Robu-Terminal-Platform   (private)  shell
    Robu-Terminal-           (private)  charts
    robu-valuation-next      (public)   valuation frontend
    robu-data-server         (public)   valuation data
GitHub user: rohitbhutra26-bit
Auth: a Personal Access Token saved in each Mac's Keychain (set once, never typed
again). credential.helper = osxkeychain.

## What does NOT sync via Git (set up once per laptop)
- Charts: config.py (my Kite API key + secret) and access_token.txt — git-ignored.
  Copy config.py over by hand (or from iCloud Notes) on each laptop.
- node_modules / Python venvs — rebuilt locally by the launcher / start.sh.

## Setting up a NEW laptop (e.g. office) — one time
1. Install Git + Python 3.9+ + Node.js.
2. Make the standard folder and clone the repos into it:
       mkdir -p ~/"Documents/Claude/Projects/Robu Terminal"
       cd ~/"Documents/Claude/Projects/Robu Terminal"
       git clone https://github.com/rohitbhutra26-bit/Robu-Terminal-Platform.git
       git clone https://github.com/rohitbhutra26-bit/Robu-Terminal-.git
       git clone https://github.com/rohitbhutra26-bit/robu-data-server.git
       # optional: git clone https://github.com/rohitbhutra26-bit/robu-valuation-next.git
3. Save the token to Keychain (paste token once when asked):
       git config --global credential.helper osxkeychain
4. Charts keys:
       cd "Robu-Terminal-"
       cp config_example.py config.py   # then paste my Kite API_KEY + API_SECRET
5. Run: double-click Robu-Terminal-Platform/Start Platform.command -> localhost:3000

## Daily habit (the only rule)
On whichever laptop I work:
    git pull            <- before I start (grab latest)
    git add . && git commit -m "what I changed"
    git push            <- after I finish (send it up)
Do this in EACH repo I changed. Pull before, push after. The laptops never fight.

## Notes
- One token works on all my laptops (it's tied to my GitHub account, not a device).
- Never paste config.py or my token into chat / WhatsApp / screenshots.
- If a Kite key leaks: regenerate at https://developers.kite.trade
- If the GitHub token leaks: delete + remake at github.com/settings/tokens (repo scope only).
