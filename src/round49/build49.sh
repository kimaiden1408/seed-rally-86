#!/bin/sh
# Round 49: both builds from round 48's (work/site48, work/art48; see build48.sh), stamped from what goes into them;
# the game's real courses brought up to date with the road's measured crossfall (work/r49/packs, see
# harness/enrich49.js) and its circuits added (work/r49/packs, built by harness/pack49.js); the race server carried
# over unchanged; the website's compressed copies made to match. Run from /home/claude/sr86.
set -e
PK="turini monaco bollene_rt"; [ -f notes/presets49.txt ] && PK="$PK $(cut -d' ' -f1 notes/presets49.txt | tr '\n' ' ')"
export R49_PRESETS="$( [ -f notes/presets49.js ] && cat notes/presets49.js || true )"
S1=$(cat work/site48/index.html patches/r49.py patches/t49/*.js notes/presets49.js 2>/dev/null | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art48/index.html patches/r49.py patches/t49/*.js notes/presets49.js 2>/dev/null | sha256sum | cut -c5-8 | tr a-f A-F)
O1=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/site48/index.html | cut -d"'" -f2)
O2=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/art48/index.html | cut -d"'" -f2)
mkdir -p work/site49/real work/art49/real
cp work/site48/index.html work/site49/index.html; python3 patches/r49.py work/site49/index.html $O1 $S1
cp work/art48/*.js work/art49/; cp work/art48/index.html work/art49/index.html; python3 patches/r49.py work/art49/index.html $O2 $S2
for f in $PK; do P=work/r49/packs/$f.json; [ -f $P ] || P=work/site48/real/$f.json; cp $P work/site49/real/$f.json; cp $P work/art49/real/$f.json; done; cp work/site48/server.js work/site49/server.js
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site49/index.html');fs.writeFileSync('work/site49/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site49/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site49/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site49/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 49 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on $O1): $(sha256sum work/site49/index.html | cut -c1-64) $(wc -c < work/site49/index.html) bytes"; echo "artifact $S2 (on $O2): index.html $(sha256sum work/art49/index.html | cut -c1-64) $(wc -c < work/art49/index.html) bytes"; for f in $PK; do echo "real/$f.json $(sha256sum work/site49/real/$f.json | cut -c1-64) $(wc -c < work/site49/real/$f.json) bytes"; done; } | tee notes/stamps49.txt
