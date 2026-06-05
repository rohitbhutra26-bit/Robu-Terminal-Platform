# Where We Stopped — handoff note

Last updated from: personal MacBook. Read this first on the office laptop.

## What's DONE (on the personal laptop, already pushed to GitHub)
- All repos live under ONE standard parent folder:
  ~/Documents/Claude/Projects/Robu Terminal/
    Robu-Terminal-Platform/  (shell, port 3000)
    Robu-Terminal-/          (charts, port 8010)
    robu-data-server/        (valuation data, port 8000)
- Start Platform.command paths standardized to that folder (works on both laptops).
- Platform runs at http://localhost:3000 (charts + valuation verified).
- Shell sidebar upgraded:
    * project RobuLogo ("R" mark) in the side panel
    * hamburger (≡) button collapses/expands the sidebar (icon rail <-> full)
    * collapse choice is remembered across reloads
- Docs in this repo: PLATFORM_SETUP.md (full wiring), this file (status).

## What's NOT done yet (do these on the office laptop)
1. BACK UP THE AUTOMATED ANALYZER (top priority — it's only on the office laptop
   and is NOT in git, so it isn't backed up anywhere). Give it its own private
   repo: check if it's a code folder, add a .gitignore, init -> commit -> push.
2. Make the office laptop match the standard folder layout (move/clone
   Robu-Terminal- and Robu-Terminal-Platform under
   ~/Documents/Claude/Projects/Robu Terminal/ like the personal laptop).
3. Pull the latest in each repo to get the sidebar/logo changes:
       cd ~/"Documents/Claude/Projects/Robu Terminal/Robu-Terminal-Platform" && git pull
       cd ~/"Documents/Claude/Projects/Robu Terminal/Robu-Terminal-"          && git pull
       cd ~/"Documents/Claude/Projects/Robu Terminal/robu-data-server"        && git pull
4. Run: double-click Robu-Terminal-Platform/Start Platform.command -> localhost:3000

## Reminders
- Run the platform launcher in its OWN terminal window; don't run git in that
  same window or it stops the server.
- Daily habit: git pull before you start, git add/commit/push after, in each repo.
- There is an unused public/robu-logo.svg (my earlier draft) — safe to delete.
