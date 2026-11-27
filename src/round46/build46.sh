#!/bin/sh
# Round 46: both builds from round 45's (work/site45, work/art45; see build45.sh), stamped from what goes into them; the
# game's own real courses (packs made by harness/pack46.js from the live map, kept in work/r46/packs) beside each page
# as real/*.json (plain: the artifact host serves no .gz, and both hosts compress JSON on the way); the website's
# compressed copies made to match. Run from /home/claude/sr86.
set -e
S1=$(cat work/site45/index.html patches/r46.py patches/t46/*.js | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art45/index.html patches/r46.py patches/t46/*.js | sha256sum | cut -c5-8 | tr a-f A-F)
mkdir -p work/site46/real work/art46/real notes
cp work/site45/index.html work/site46/index.html; python3 patches/r46.py work/site46/index.html 7381 $S1
cp work/art45/*.js work/art46/; cp work/art45/index.html work/art46/index.html; python3 patches/r46.py work/art46/index.html B554 $S2 art
rm -f work/site46/real/*.json.gz work/art46/real/*.json.gz
for p in turini bollene_rt monaco; do cp work/r46/packs/$p.json work/site46/real/$p.json; cp work/r46/packs/$p.json work/art46/real/$p.json; done
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site46/index.html');fs.writeFileSync('work/site46/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site46/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site46/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site46/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 46 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on 7381): $(sha256sum work/site46/index.html | cut -c1-64) $(wc -c < work/site46/index.html) bytes"; echo "artifact $S2 (on B554): index.html $(sha256sum work/art46/index.html | cut -c1-64) $(wc -c < work/art46/index.html) bytes"; for p in work/site46/real/*.json; do echo "$(basename $p) $(sha256sum $p | cut -c1-64) $(wc -c < $p) bytes"; done; } | tee notes/stamps46.txt
