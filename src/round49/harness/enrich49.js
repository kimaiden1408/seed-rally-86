// Round 49: an older pack brought up to date with the road's measured crossfall (rwCrossFall: every 4 m along its line,
// from the land's model where that is a survey's own), written to OUT.
// node harness/enrich49.js pack...   env PACKS (default work/r48/packs), OUT (default work/r49/packs), PAGE
const L = require('./lib46'), fs = require('fs'), path = require('path');
(async () => {
  const IN = process.env.PACKS || 'work/r48/packs', OUT = process.env.OUT || 'work/r49/packs'; fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360, net: true });
  await H.page.waitForFunction(() => typeof rwCrossFall === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync(path.join(IN, name + '.json'), 'utf8');
    const r = await H.page.evaluate(async (txt) => { try { const K = rwPackIn(txt), F = rwFrame(K.o[0], K.o[1]), t0 = performance.now();
        const X = await rwCrossFall(F, K.r.x, K.r.z, K.ways, K.r.w, 14); K.xs = X.xs; K.xd = X.xd; K.xz = X.xz;
        let n = 0, mx = 0; for (const v of X.xs) if (v === v) { n++; mx = Math.max(mx, Math.abs(v)); }
        return { ok: true, txt: rwPackOut(K), n: X.xs.length, valid: n, xz: X.xz, max: +mx.toFixed(3), ms: Math.round(performance.now() - t0), tiles: RWDem.got };
      } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } }, txt);
    if (!r.ok) { console.log(name, 'failed', r.err); continue; }
    fs.writeFileSync(path.join(OUT, name + '.json'), r.txt); delete r.txt; console.log(name, JSON.stringify(r));
  }
  console.log('net', JSON.stringify(L.stats), 'errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
