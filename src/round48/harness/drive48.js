// Round 48: a real course driven by the game's crew driver with damage on, two ways - as the rival crews drive (pace 0.9)
// and harder and rougher (pace 1.0, more mistakes, more aggression) - and what the car took: the time, punctures, the
// blows by kind (a wheel on its bump stops, the floor, a rock under a wheel...), the hardest, and the tyres at the end.
// node harness/drive48.js pack...   env PAGE (default work/site48/index.html), PACKS (default work/r48/packs)
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site48/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof runStageCrew === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r48/packs') + '/' + name + '.json', 'utf8');
    const R = await H.page.evaluate((txt) => { COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const n = T.cN || T.pts.length, out = [];
      for (const [tag, D] of [['crew', { pace: 0.9, err: 0.05, aggr: 0.3 }], ['hard', { pace: 1.0, err: 0.1, aggr: 0.8 }]]) {
        const hits = [], was = dmgHit, wasND = newDamage; let Dlast = null;
        dmgHit = function (c, kind, x, yy, z, nx, ny, nz, dv, w, under, E) { hits.push({ k: kind, dv: +(+dv).toFixed(1), w: w == null ? -1 : w, i: c.hint }); return was.apply(this, arguments); };
        newDamage = function () { const d = wasND.apply(this, arguments); Dlast = d; return d; };
        let res; try { res = runStageCrew(T, { seed: 7, car: G.spec.id, D, tMax: 2400, dmg: 'real' }); } finally { dmgHit = was; newDamage = wasND; }
        const byK = {}; for (const h of hits) byK[h.k] = (byK[h.k] || 0) + 1; const land = hits.filter(h => h.k === 'land');
        out.push({ tag, t: res.t, out: res.out, punct: (res.ev || []).filter(e => e.k === 'punct').length, hits: byK, landMax: land.length ? Math.max(...land.map(h => h.dv)) : 0, hard6: hits.filter(h => h.dv >= 6 && h.k !== 'rail' && h.k !== 'wall' && h.k !== 'cbar').length,
          tyres: Dlast ? Dlast.w.map(w => ({ rim: +(w.rim || 0).toFixed(2), flat: w.flat ? 1 : 0, arm: +(w.arm == null ? 1 : w.arm).toFixed(2) })) : null }); }
      return { n, out }; }, txt);
    for (const o of R.out) console.log(name, o.tag, JSON.stringify(o)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
