#!/bin/sh
# Round 45: both builds from round 44's (work/site44, work/art44; see build44.sh), stamped from what goes into them;
# the website's compressed copies made to match. Run from /home/claude/sr86.
set -e
S1=$(cat work/site44/index.html patches/r45.py patches/t45/*.js | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art44/index.html patches/r45.py patches/t45/*.js | sha256sum | cut -c5-8 | tr a-f A-F)
mkdir -p work/site45 work/art45 notes
python3 patches/r45.py work/site44/index.html work/site45/index.html $S1
cp work/art44/*.js work/art45/
python3 patches/r45.py work/art44/index.html work/art45/index.html $S2
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site45/index.html');fs.writeFileSync('work/site45/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site45/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site45/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site45/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 45 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on 52FE): $(sha256sum work/site45/index.html | cut -c1-64) $(wc -c < work/site45/index.html) bytes"; echo "artifact $S2 (on 61AF): index.html $(sha256sum work/art45/index.html | cut -c1-64) $(wc -c < work/art45/index.html) bytes; i18n-more.js $(sha256sum work/art45/i18n-more.js | cut -c1-64) (as round 43's)"; } | tee notes/stamps45.txt
