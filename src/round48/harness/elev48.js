// Round 48: a real course's road heights and the land by it, measured.
//   profile: the road's grades, the change of grade over 2 m and over 10 m (its crests' and dips' radii), the worst
//     places listed, with what the map has there;
//   land: the land drawn over the road (the terrain grid and the roadside strip above the road's drawn surface), and the
//     steps at the road's edges a wheel crossing them meets;
//   net: the map's other roads' ribbons under the land;
//   drive (DRIVE=1): the game's crew driver over it with damage on: the blows its wheels and floor take, where, and the
//     state of its tyres at the end.
// node harness/elev48.js pack... (env PAGE, default work/site47/index.html; DRIVE=1 to drive)
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r46/packs') + '/' + name + '.json', 'utf8');
    await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
    await H.page.mouse.click(320, 180); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 4000));
    if (process.env.NONET) await H.page.evaluate(() => { window.__noNet = 1; });
    const R = await H.page.evaluate((drive) => {
      const T = G.T, P = T.pts, n = T.cN || P.length, out = {};
      const tagAt = i => { const p = P[i]; return [p.tag || '', p.rwhw || '', p.rwtu ? 'tu' : '', p.nb ? 'nb' : '', p.wall ? 'wall' : ''].filter(Boolean).join('/'); };
      // (1) the profile, on the course's own points
      const y = P.slice(0, n).map(p => p.y), g = [], d2 = [], d10 = [], dem = [];
      for (let i = 0; i + 1 < n; i++) g.push((y[i + 1] - y[i]) / STEP);
      for (let i = 1; i + 1 < n; i++) d2.push([Math.abs(g[i] - g[i - 1]), i]);
      for (let i = 5; i + 5 < n; i++) d10.push([Math.abs((y[i + 5] - y[i]) / (5 * STEP) - (y[i] - y[i - 5]) / (5 * STEP)), i]);
      for (let i = 0; i < n; i += 1) dem.push([y[i] - natAt(T, P[i].x, P[i].z), i]);
      const top = (A, k) => A.slice().sort((a, b) => b[0] - a[0]).slice(0, k).map(([v, i]) => ({ v: +v.toFixed(3), m: Math.round(i * STEP), tag: tagAt(i) }));
      const cnt = (A, th) => A.filter(a => a[0] > th).length;
      out.profile = { n, km: +(n * STEP / 1000).toFixed(2), gMax: +Math.max(...g.map(Math.abs)).toFixed(3), g15: g.filter(v => Math.abs(v) > 0.15).length,
        d2: { over1pc: cnt(d2, 0.01), over2pc: cnt(d2, 0.02), over4pc: cnt(d2, 0.04), top: top(d2, 6) },
        d10: { over5pc: cnt(d10, 0.05), over10pc: cnt(d10, 0.10), over20pc: cnt(d10, 0.2), top: top(d10, 6) },
        demOff: { over1: dem.filter(a => Math.abs(a[0]) > 1).length, over3: dem.filter(a => Math.abs(a[0]) > 3).length, top: top(dem.map(([v, i]) => [Math.abs(v), i]), 4) } };
      // (2) the land over the road, the strip over it, the edges' steps
      let over = 0, overS = 0, samp = 0, worst = [], stepUp = 0, stepDn = 0, edges = 0, worstE = [];
      for (let i = 0; i < n; i++) { const p = P[i], hw = p.w / 2, lx = Math.cos(p.h), lz = -Math.sin(p.h), s = i * STEP; if (p.rwtu || p.nb) continue;
        for (let lat = -hw + 0.1; lat <= hw - 0.1 + 1e-6; lat += 0.5) { const yr = roadSurfY(T, s, lat, p.w, true), x = p.x + lx * lat, z = p.z + lz * lat, gg = groundAt(T, x, z), st = stripAt(T, x, z); samp++;
          if (gg !== null && gg > yr + 0.02) { over++; worst.push([gg - yr, i, +lat.toFixed(1)]); }
          if (st !== null && st > yr + 0.02) overS++; }
        for (const sd of [-1, 1]) { const yi = roadSurfY(T, s, sd * (hw - 0.02), p.w), x = p.x + lx * sd * (hw + 0.06), z = p.z + lz * sd * (hw + 0.06), gg = groundAt(T, x, z), st = stripAt(T, x, z); const yo = st !== null ? (gg === null ? st : Math.max(st, gg)) : gg; if (yo === null) continue; edges++;
          const d = yo - yi; if (d > 0.04) { stepUp++; worstE.push([d, i, sd]); } if (d < -0.15) stepDn++; } }
      worst.sort((a, b) => b[0] - a[0]); worstE.sort((a, b) => b[0] - a[0]);
      out.land = { samp, landOver: over, stripOver: overS, worst: worst.slice(0, 6).map(([d, i, lat]) => ({ d: +d.toFixed(2), m: Math.round(i * STEP), lat, tag: tagAt(i) })), edges, stepUp4cm: stepUp, stepDown15cm: stepDn, worstEdge: worstE.slice(0, 6).map(([d, i, sd]) => ({ d: +d.toFixed(2), m: Math.round(i * STEP), sd, tag: tagAt(i) })) };
      // (3) the net roads' ribbons: the land at a ribbon's middle over the ribbon there (its edges on the land, 7 cm up)
      if (!window.__noNet) { let ns = 0, nov = 0, big = 0; const C = T.real; for (const Ln of C.net || []) { if (Ln.tu || Ln.foot || (!Ln.own && (Ln.br || (Ln.ly | 0) >= 1))) continue; const w = Math.max(1.2, Ln.w);
          for (let k = 0; k + 1 < Ln.x.length; k++) { const Ls = Math.hypot(Ln.x[k + 1] - Ln.x[k], Ln.z[k + 1] - Ln.z[k]), h = Math.atan2(Ln.x[k + 1] - Ln.x[k], Ln.z[k + 1] - Ln.z[k]), m = Math.max(1, Math.ceil(Ls / 3)), lx = Math.cos(h) * w / 2, lz = -Math.sin(h) * w / 2;
            for (let q = 0; q < m; q++) { const x = Ln.x[k] + (Ln.x[k + 1] - Ln.x[k]) * (q + 0.5) / m, z = Ln.z[k] + (Ln.z[k + 1] - Ln.z[k]) * (q + 0.5) / m; const f = T.fieldAt(x, z); if (f && f.np && f.nd < f.np.w / 2 + 2) continue;
              const yc = (groundY(T, x + lx, z + lz) + groundY(T, x - lx, z - lz)) / 2 + 0.07, yg = groundY(T, x, z); ns++; if (yg > yc + 0.01) nov++; if (yg > yc + 0.25) big++; } } }
        out.net = { samp: ns, landOverMid: nov, over25cm: big }; }
      // (4) the crew driver over it, damage on: the blows (wheel lands on its stops, rocks, the floor), where, and its tyres
      if (drive) { const hits = []; const was = dmgHit; dmgHit = function (c, kind, x, yy, z, nx, ny, nz, dv, w, under, E) { hits.push({ k: kind, dv: +(+dv).toFixed(1), w: w == null ? -1 : w, i: c.hint }); return was.apply(this, arguments); };
        let res; try { res = runStageCrew(T, { seed: 7, car: G.spec.id, D: { pace: 0.9, err: 0.05, aggr: 0.3 }, tMax: 2400, dmg: 'real' }); } finally { dmgHit = was; }
        const byK = {}; for (const h of hits) byK[h.k] = (byK[h.k] || 0) + 1;
        out.drive = { t: res.t, out: res.out, punct: (res.ev || []).filter(e => e.k === 'punct').map(e => Math.round((e.i % n) * STEP)), hits: byK, hard: hits.filter(h => h.dv >= 6).slice(0, 12).map(h => ({ k: h.k, dv: h.dv, w: h.w, m: Math.round((h.i % n) * STEP), tag: tagAt(h.i % n) })) }; }
      return out; }, !!process.env.DRIVE);
    console.log('== ' + name); console.log(JSON.stringify(R.profile)); console.log(JSON.stringify(R.land)); console.log(JSON.stringify(R.net)); if (R.drive) console.log(JSON.stringify(R.drive));
  }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
