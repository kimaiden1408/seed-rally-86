#!/bin/sh
# Round 47: both builds from round 46's (work/site46, work/art46; see build46.sh), stamped from what goes into them;
# the game's real courses and the race server carried over unchanged; the website's compressed copies made to match.
# Run from /home/claude/sr86.
set -e
S1=$(cat work/site46/index.html patches/r47.py patches/t47/*.js | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art46/index.html patches/r47.py patches/t47/*.js | sha256sum | cut -c5-8 | tr a-f A-F)
O1=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/site46/index.html | cut -d"'" -f2)
O2=$(grep -o "const SR86_BUILD = '[0-9A-F]*'" work/art46/index.html | cut -d"'" -f2)
mkdir -p work/site47/real work/art47/real
cp work/site46/index.html work/site47/index.html; python3 patches/r47.py work/site47/index.html $O1 $S1
cp work/art46/*.js work/art47/; cp work/art46/index.html work/art47/index.html; python3 patches/r47.py work/art47/index.html $O2 $S2
cp work/site46/real/*.json work/site47/real/; cp work/art46/real/*.json work/art47/real/; cp work/site46/server.js work/site47/server.js
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site47/index.html');fs.writeFileSync('work/site47/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site47/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site47/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site47/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 47 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on $O1): $(sha256sum work/site47/index.html | cut -c1-64) $(wc -c < work/site47/index.html) bytes"; echo "artifact $S2 (on $O2): index.html $(sha256sum work/art47/index.html | cut -c1-64) $(wc -c < work/art47/index.html) bytes"; } | tee notes/stamps47.txt
