#!/bin/sh
# Round 44: both builds from round 43's (work/site43, work/art43; see build43.sh), stamped from what goes into them;
# the website's compressed copies made to match. Run from /home/claude/sr86.
set -e
STOCK=work/r44/stock44c.json
S1=$(cat work/site43/index.html patches/r44.py patches/t44/*.js $STOCK | sha256sum | cut -c1-4 | tr a-f A-F)
S2=$(cat work/art43/index.html patches/r44.py patches/t44/*.js $STOCK | sha256sum | cut -c5-8 | tr a-f A-F)
mkdir -p work/site44 work/art44 notes
python3 patches/r44.py work/site43/index.html work/site44/index.html $S1 --stock $STOCK
cp work/art43/*.js work/art44/
python3 patches/r44.py work/art43/index.html work/art44/index.html $S2 --stock $STOCK
node -e "const z=require('zlib'),fs=require('fs'),raw=fs.readFileSync('work/site44/index.html');fs.writeFileSync('work/site44/index.html.br',z.brotliCompressSync(raw,{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_SIZE_HINT]:raw.length}}));fs.writeFileSync('work/site44/index.html.gz',z.gzipSync(raw,{level:9}));if(!z.brotliDecompressSync(fs.readFileSync('work/site44/index.html.br')).equals(raw)||!z.gunzipSync(fs.readFileSync('work/site44/index.html.gz')).equals(raw))throw new Error('compressed copies differ');"
{ echo "round 44 builds, $(date -u +%Y-%m-%dT%H:%MZ)"; echo "site $S1 (on D324, on 6E9C): $(sha256sum work/site44/index.html | cut -c1-64) $(wc -c < work/site44/index.html) bytes"; echo "artifact $S2 (on 220C, on A35D): index.html $(sha256sum work/art44/index.html | cut -c1-64) $(wc -c < work/art44/index.html) bytes; i18n-more.js $(sha256sum work/art44/i18n-more.js | cut -c1-64) (as round 43's)"; } | tee notes/stamps44.txt
