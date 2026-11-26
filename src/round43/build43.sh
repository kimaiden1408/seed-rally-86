#!/bin/sh
# Round 43: both builds from the published round 41 files, each stamped with the first four hex digits of the hash
# of what goes into it; the website's compressed copies made to match. Run from /home/claude/sr86.
set -e
STOCK=work/r43/stock43c.json
S1=$(cat work/site41.html patches/r43.py patches/t43/* $STOCK | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art41/index.html patches/r43.py patches/t43/* $STOCK | sha256sum | cut -c5-8 | tr a-f A-F)
mkdir -p work/site43 work/art43 notes
python3 patches/r43.py work/site41.html work/site43/index.html $S1 --stock $STOCK
cp work/art41/*.js work/art43/
python3 patches/r43.py work/art41/index.html work/art43/index.html $S2 --stock $STOCK --i18n-file work/art43/i18n-more.js
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site43/index.html');fs.writeFileSync('work/site43/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site43/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site43/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site43/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 43 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on 6E9C): $(sha256sum work/site43/index.html | cut -c1-64) $(wc -c < work/site43/index.html) bytes"; echo "artifact $S2 (on A35D): index.html $(sha256sum work/art43/index.html | cut -c1-64) $(wc -c < work/art43/index.html) bytes; i18n-more.js $(sha256sum work/art43/i18n-more.js | cut -c1-64)"; } | tee notes/stamps43.txt
