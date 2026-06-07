#!/bin/bash
# Pull the latest Valuation code from GitHub into this platform (native module).
# SELF-HEALING: if the pulled code doesn't type-check (e.g. a broken auto-save),
# it reverts to the last committed working copy so the terminal never breaks.
# Only touches Valuation (components/lib/API/page) + new npm deps.
cd "$(dirname "$0")"
echo "Updating Valuation from robu-valuation-next ..."
TMP="$(mktemp -d)"
if ! git clone --depth 1 https://github.com/rohitbhutra26-bit/robu-valuation-next.git "$TMP/rv" >/dev/null 2>&1; then
  echo "Could not reach GitHub (offline?). Kept the current Valuation."
  rm -rf "$TMP"; echo "You can close this window."; exit 0
fi

cp -R "$TMP/rv/src/components/." src/components/
cp -R "$TMP/rv/src/lib/." src/lib/
cp -R "$TMP/rv/src/app/api/." src/app/api/
cp "$TMP/rv/src/app/page.tsx" src/app/valuation/page.tsx
find src/components src/lib src/app/api -name ".DS_Store" -delete 2>/dev/null
TMP_RV="$TMP/rv" node -e '
  const fs=require("fs");
  const plat=JSON.parse(fs.readFileSync("package.json"));
  const val=JSON.parse(fs.readFileSync(process.env.TMP_RV+"/package.json"));
  const skip=new Set(["next","react","react-dom"]);
  plat.dependencies=plat.dependencies||{};
  const added=[];
  for(const [k,v] of Object.entries(val.dependencies||{}))
    if(!skip.has(k)&&!plat.dependencies[k]){plat.dependencies[k]=v;added.push(k);}
  if(added.length){plat.dependencies=Object.fromEntries(Object.entries(plat.dependencies).sort());
    fs.writeFileSync("package.json",JSON.stringify(plat,null,2)+"\n");console.log("added deps:",added.join(", "));}
' 2>/dev/null
rm -rf "$TMP"

PATHS="src/components src/lib src/app/api src/app/valuation/page.tsx package.json"
if git diff --quiet $PATHS 2>/dev/null; then
  echo "Valuation already up to date."
elif npx tsc --noEmit >/dev/null 2>&1; then
  echo "Valuation updated to latest (verified — it builds)."
else
  echo "⚠ Latest Valuation has build errors — reverting to the last working copy."
  echo "  (Fix it in the robu-valuation-next repo, then this will pick it up.)"
  git checkout -- $PATHS 2>/dev/null
fi
echo "You can close this window."
