# Running Robu Terminal on your second (home) laptop

This guide gets the unified platform running on your other Mac, and how to
start it day-to-day. Follow it top to bottom the first time.

---

## What the platform needs (the moving parts)

The terminal at `localhost:3000` is one Next.js app that also launches two
local engines. It expects these folders to exist (the launcher uses your
home folder `~`, so paths are the same on both Macs):

| Folder | What it is | Port |
|--------|-----------|------|
| `~/Documents/Claude/Projects/Robu-Terminal-Platform` | the terminal (this project) | 3000 |
| `~/Documents/Robu-Terminal-/core` | Kite Charts engine | 8010 |
| `…/Robu-Terminal-Platform/data-server` | Valuation data engine (**bundled**) | 8000 |

The Valuation data-server is now **bundled inside this project** (folder
`data-server/`), so it travels with the repo — the home laptop needs no
separate copy. The only external engine is the Charts (Kite) app, which your
home laptop already has.

---

## PART 1 — One time: publish the platform to GitHub (do this on THIS laptop)

1. On github.com, click **New repository** → name it `Robu-Terminal-Platform`
   → set **Private** → **Create** (do NOT add a README/.gitignore).
2. In Terminal on this laptop:

   ```
   cd ~/Documents/Claude/Projects/Robu-Terminal-Platform
   git remote add origin https://github.com/rohitbhutra26-bit/Robu-Terminal-Platform.git
   git push -u origin main
   ```

   - Username: `rohitbhutra26-bit`
   - Password: paste your **Personal Access Token** (screen stays blank — normal).

That's it — the platform now lives on GitHub. `node_modules`, `.next`, and
`.env.local` are git-ignored, so nothing heavy or private gets pushed.

---

## PART 2 — One time: set up the home laptop

Make sure the home laptop has **Git, Node.js, and Python 3** (check with
`git --version`, `node -v`, `python3 --version`).

1. **Get the platform project:**

   ```
   cd ~/Documents/Claude/Projects
   git clone https://github.com/rohitbhutra26-bit/Robu-Terminal-Platform.git
   cd Robu-Terminal-Platform
   npm install
   ```

2. **Confirm the Charts engine exists** at `~/Documents/Robu-Terminal-/core`.
   - If missing: clone the `Robu-Terminal-` repo and set it up like we did
     (config.py with your Kite keys, run `Fix Certificates.command`, then the
     daily `Get Kite Token.command`).
   - The **data-server is bundled** inside this project — nothing to clone. It
     installs its own Python libs on first launch.

3. (Optional) For Valuation's AI overview, create `.env.local` in the platform
   folder and add `GEMINI_API_KEY=your-key`. Everything else works without it.

---

## PART 3 — How to start it (every day, either laptop)

1. **Pull the latest first** (so both laptops stay in sync):
   ```
   cd ~/Documents/Claude/Projects/Robu-Terminal-Platform
   git pull
   ```
2. For live Charts data, run the Kite daily login once
   (`Get Kite Token.command` in the `Robu-Terminal-` folder).
3. **Double-click `Start Platform.command`** in the platform folder.
   It launches Charts (8010), the data-server (8000), and the terminal (3000),
   then opens your browser to **http://localhost:3000**.
4. To stop: close that Terminal window (or press Ctrl+C in it).

---

## Keeping both laptops in sync

After you change anything in the platform on one laptop:
```
git add .
git commit -m "what I changed"
git push
```
On the other laptop, `git pull` before you start. (Same routine as your other
projects. `config.py`, tokens, and `.env.local` never sync — they're private
per machine.)

---

## Troubleshooting

- **Page loads but looks unstyled (plain text, blue links):** the build tools
  didn't install. Fix:
  ```
  cd ~/Documents/Claude/Projects/Robu-Terminal-Platform
  rm -rf node_modules .next package-lock.json
  npm install
  npm run dev
  ```
- **Charts tab is blank / "error" badge:** run the Kite daily login
  (`Get Kite Token.command`), then refresh.
- **Valuation shows errors:** the data-server (port 8000) is probably still
  installing its Python libraries on first run — wait a minute, check
  `.logs/data-server.log`, then refresh.
- **A tab says "isn't running":** that engine didn't start — check the matching
  file in the `.logs` folder for the reason.
