#!/bin/sh
# Round 48: both builds from round 47's (work/site47, work/art47; see build47.sh), stamped from what goes into them;
# the game's real courses brought up to date with the map's lane tags and their country (work/r48/packs, see
# harness/enrich48.js); the race server carried over unchanged; the website's compressed copies made to match.
# Run from /home/claude/sr86.
set -e
S1=$(cat work/site47/index.html patches/r48.py patches/t48/*.js | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art47/index.html patches/r48.py patches/t48/*.js | sha256sum | cut -c5-8 | tr a-f A-F)
O1=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/site47/index.html | cut -d"'" -f2)
O2=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/art47/index.html | cut -d"'" -f2)
mkdir -p work/site48/real work/art48/real
cp work/site47/index.html work/site48/index.html; python3 patches/r48.py work/site48/index.html $O1 $S1
cp work/art47/*.js work/art48/; cp work/art47/index.html work/art48/index.html; python3 patches/r48.py work/art48/index.html $O2 $S2
for f in turini monaco bollene_rt; do P=work/r48/packs/$f.json; [ -f $P ] || P=work/site47/real/$f.json; cp $P work/site48/real/$f.json; cp $P work/art48/real/$f.json; done; cp work/site47/server.js work/site48/server.js
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site48/index.html');fs.writeFileSync('work/site48/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site48/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site48/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site48/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 48 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on $O1): $(sha256sum work/site48/index.html | cut -c1-64) $(wc -c < work/site48/index.html) bytes"; echo "artifact $S2 (on $O2): index.html $(sha256sum work/art48/index.html | cut -c1-64) $(wc -c < work/art48/index.html) bytes"; for f in turini monaco bollene_rt; do echo "real/$f.json $(sha256sum work/site48/real/$f.json | cut -c1-64) $(wc -c < work/site48/real/$f.json) bytes"; done; } | tee notes/stamps48.txt
