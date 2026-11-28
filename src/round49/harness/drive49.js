// Round 49 (from drive48): RUNS=crew|hard picks the runs; WHERE=1 lists where each blow of a kind fell (s along the
// course, how far off its middle, how hard).
// Round 48: a real course driven by the game's crew driver with damage on, two ways - as the rival crews drive (pace 0.9)
// and harder and rougher (pace 1.0, more mistakes, more aggression) - and what the car took: the time, punctures, the
// blows by kind (a wheel on its bump stops, the floor, a rock under a wheel...), the hardest, and the tyres at the end.
// node harness/drive48.js pack...   env PAGE (default work/site48/index.html), PACKS (default work/r48/packs)
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof runStageCrew === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r49/packs') + '/' + name + '.json', 'utf8');
    const R = await H.page.evaluate((txt, RUNS, WHERE, DETAIL, TRACE) => { COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const n = T.cN || T.pts.length, out = [];
      for (const [tag, D] of [['crew', { pace: 0.9, err: 0.05, aggr: 0.3 }], ['hard', { pace: 1.0, err: 0.1, aggr: 0.8 }]].filter(r => !RUNS || RUNS.includes(r[0]))) {
        const hits = [], was = dmgHit, wasND = newDamage; let Dlast = null;
        dmgHit = function (c, kind, x, yy, z, nx, ny, nz, dv, w, under, E) { hits.push({ k: kind, dv: +(+dv).toFixed(1), w: w == null ? -1 : w, i: c.hint, lat: +(locate(T, c.x, c.z, c.hint | 0).lat).toFixed(1) }); if (DETAIL && kind === DETAIL && hits.filter(h => h.k === kind).length <= 3) { const I = locate(T, x, z, c.hint | 0); hits[hits.length - 1].det = { at: [+x.toFixed(2), +yy.toFixed(2), +z.toFixed(2)], n: [+nx.toFixed(2), +ny.toFixed(2), +nz.toFixed(2)], ptLat: +I.lat.toFixed(2), ground: +(surfaceY(T, I, x, z, 1e9)).toFixed(3), road: +roadSurfY(T, I.dist, Math.min(Math.abs(I.lat), I.w / 2) * Math.sign(I.lat), I.w).toFixed(3), w: I.w, roll: +(c.roll || 0).toFixed(3), pitch: +(c.pitch || 0).toFixed(3), sp: +Math.hypot(c.u, c.v).toFixed(1), vyb: +(c.vyb || 0).toFixed(2), yb: +c.yb.toFixed(2), wheels: c.w.map(q => (q.grounded === false ? 'air' : 'g') + ':' + (q.Fz | 0)).join(',') }; } return was.apply(this, arguments); };
        newDamage = function () { const d = wasND.apply(this, arguments); Dlast = d; return d; };
        const tr = [], wasStep = stepCar; let lastT = -1; if (TRACE) stepCar = function (c, S, I, dt, T2, o) { const r = wasStep.apply(this, arguments); const s = c.hint * STEP; if (s >= TRACE[0] && s <= TRACE[1] && tr.length < 400) { const tk = Math.floor(s / 2); if (tk !== lastT) { lastT = tk; const RL = racingLine(T2), k = Math.round(c.hint) - RL.a, I0 = locate(T2, c.x, c.z, c.hint | 0); tr.push([Math.round(s), +I0.lat.toFixed(2), k >= 0 && k < RL.n ? +RL.o[k].toFixed(2) : null, +Math.hypot(c.u, c.v).toFixed(1), +(I.steer || 0).toFixed(2), +(I.throttle || 0).toFixed(2), +(I.brake || 0).toFixed(2)].join(' ')); } } return r; };
        let res; try { res = runStageCrew(T, { seed: 7, car: G.spec.id, D, tMax: 2400, dmg: 'real' }); } finally { dmgHit = was; newDamage = wasND; stepCar = wasStep; }
        const byK = {}; for (const h of hits) byK[h.k] = (byK[h.k] || 0) + 1; const land = hits.filter(h => h.k === 'land');
        out.push({ tag, t: res.t, out: res.out, punct: (res.ev || []).filter(e => e.k === 'punct').length, hits: byK, landMax: land.length ? Math.max(...land.map(h => h.dv)) : 0, hard6: hits.filter(h => h.dv >= 6 && h.k !== 'rail' && h.k !== 'wall' && h.k !== 'cbar').length,
          det: hits.filter(h => h.det).map(h => h.det), tr: TRACE ? tr : undefined, where: WHERE ? hits.filter(h => h.k !== 'scrape').map(h => h.k + '@' + Math.round(h.i * STEP) + ':' + h.lat + ':' + h.dv).slice(0, 60) : undefined, tyres: Dlast ? Dlast.w.map(w => ({ rim: +(w.rim || 0).toFixed(2), flat: w.flat ? 1 : 0, arm: +(w.arm == null ? 1 : w.arm).toFixed(2) })) : null }); }
      return { n, out }; }, txt, process.env.RUNS ? process.env.RUNS.split(',') : null, !!process.env.WHERE, process.env.DETAIL || null, process.env.TRACE ? process.env.TRACE.split(',').map(Number) : null);
    for (const o of R.out) console.log(name, o.tag, JSON.stringify(o)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
