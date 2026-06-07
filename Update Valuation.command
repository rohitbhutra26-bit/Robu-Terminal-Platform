#!/bin/bash
# Pull the latest Valuation code from GitHub into this platform (native module).
# Syncs components / lib / API / page + auto-adds any NEW npm deps.
# Never touches the design system, Charts, or Automated modules.
cd "$(dirname "$0")"
echo "Updating Valuation from robu-valuation-next ..."
TMP="$(mktemp -d)"
if git clone --depth 1 https://github.com/rohitbhutra26-bit/robu-valuation-next.git "$TMP/rv" >/dev/null 2>&1; then
  cp -R "$TMP/rv/src/components/." "src/components/"
  cp -R "$TMP/rv/src/lib/." "src/lib/"
  cp -R "$TMP/rv/src/app/api/." "src/app/api/"
  cp "$TMP/rv/src/app/page.tsx" "src/app/valuation/page.tsx"
  find src/components src/lib src/app/api -name ".DS_Store" -delete 2>/dev/null
  TMP_RV="$TMP/rv" node -e '
    const fs=require("fs");
    const plat=JSON.parse(fs.readFileSync("package.json"));
    const val=JSON.parse(fs.readFileSync(process.env.TMP_RV+"/package.json"));
    const skip=new Set(["next","react","react-dom"]);
    plat.dependencies=plat.dependencies||{};
    const added=[];
    for(const [k,v] of Object.entries(val.dependencies||{})){
      if(!skip.has(k) && !plat.dependencies[k]){ plat.dependencies[k]=v; added.push(k); }
    }
    if(added.length){
      plat.dependencies=Object.fromEntries(Object.entries(plat.dependencies).sort());
      fs.writeFileSync("package.json", JSON.stringify(plat,null,2)+"\n");
      console.log("added deps:", added.join(", "));
    }
  ' 2>/dev/null
  echo "Done — Valuation is now the latest. (Start Platform installs any new deps.)"
else
  echo "Could not reach GitHub (offline?). Kept the current Valuation."
fi
rm -rf "$TMP"
echo "You can close this window."
