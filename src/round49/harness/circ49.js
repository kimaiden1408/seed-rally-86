// Round 49: a real course measured as built - its track and painted widths against the map's tags, the width's changes
// (the steepest taper, m of width per m), its kerbs, its rails (and how far out), its crossfall (measured share, the
// largest, by kind of road), the land and strip over the road, and the meshes drawn for its lines and kerbs.
// node harness/circ49.js pack...   env PAGE (default work/site49/index.html), PACKS (default work/r49/packs)
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r49/packs') + '/' + name + '.json', 'utf8');
    const t0 = Date.now();
    await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
    await H.page.mouse.click(320, 180); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 4000));
    const R = await H.page.evaluate(() => {
      const T = G.T, P = T.pts, n = T.cN || P.length, C = T.real, out = { km: +(n * STEP / 1000).toFixed(3), xz: C.xz, cc: C.cc };
      const wayOf = i => C.ways[C.r.w[Math.min(C.r.w.length - 1, Math.max(0, P[i].rwv | 0))]] || { t: {} };
      // widths, per way as the map has it and as laid (the painted width is the track's between its white lines)
      const per = new Map(); for (let i = 0; i < n; i++) { const W = wayOf(i), k = W.id; let o = per.get(k); if (!o) per.set(k, o = { name: W.t.name || '', hw: W.t.highway, tag: W.t.width || '-', n: 0, lw: 0, w: 0, lwMin: 1e9, lwMax: 0 }); o.n++; o.lw += P[i].rwlw || 0; o.w += P[i].w; o.lwMin = Math.min(o.lwMin, P[i].rwlw || 0); o.lwMax = Math.max(o.lwMax, P[i].rwlw || 0); }
      out.ways = [...per.values()].filter(o => o.n >= 10).map(o => `${o.name || o.hw}: map ${o.tag}, track ${(o.lw / o.n).toFixed(1)} (${o.lwMin.toFixed(1)}-${o.lwMax.toFixed(1)}), paved ${(o.w / o.n).toFixed(1)}, ${o.n * STEP} m`);
      let tmax = 0, tAt = 0; for (let i = 1; i < n; i++) { const d = Math.abs(P[i].w - P[i - 1].w) / STEP; if (d > tmax) { tmax = d; tAt = i; } } out.taperMax = { rate: +tmax.toFixed(4), m: tAt * STEP, hw: P[tAt].rwhw };
      // kerbs
      if (T.rwKb) { const K = T.rwKb, runs = [0, 0], len = [0, 0]; for (let sd = 0; sd < 2; sd++) for (let i = 0; i < n; i++) if (K.k[sd][i] > 0) { len[sd] += STEP; if (!(i > 0 && K.k[sd][i - 1] > 0)) runs[sd]++; } out.kerbs = { left: runs[0] + ' runs ' + Math.round(len[0]) + ' m', right: runs[1] + ' runs ' + Math.round(len[1]) + ' m' }; } else out.kerbs = null;
      // rails and how far from the track's edge they stand
      { let rl = 0, rr = 0, race = 0, dl = 0; for (let i = 0; i < n; i++) { const p = P[i]; if (p.rwhw !== 'raceway') continue; race++; if (p.rl) rl++; if (p.rr) rr++; if (p.rl || p.rr) dl += railLat(T, p) - (p.rwlw || p.w) / 2; }
        out.rails = { racePts: race, left: rl, right: rr, fromWhiteLine: rl + rr ? +(dl / Math.max(1, (rl || 0) > 0 || rr > 0 ? [...Array(n).keys()].filter(i => P[i].rwhw === 'raceway' && (P[i].rl || P[i].rr)).length : 1)).toFixed(2) : null }; }
      // crossfall
      { const B = T.bank, abs = [], meas = []; let mx = 0, at = 0; for (let i = 0; i < n; i++) { const v = B[i] || 0; abs.push(Math.abs(v)); if (P[i].rwxs) meas.push(i); if (Math.abs(v) > mx) { mx = Math.abs(v); at = i; } }
        abs.sort((a, b) => a - b); out.bank = { measuredShare: +(meas.length / n).toFixed(2), max: +mx.toFixed(3), maxAt: Math.round(at * STEP) + ' m ' + (wayOf(at).t.name || wayOf(at).t.highway), p50: +abs[n >> 1].toFixed(3), p90: +abs[Math.floor(n * 0.9)].toFixed(3), over6: abs.filter(v => v > 0.06).length, over10: abs.filter(v => v > 0.1).length }; }
      // heights: the steepest grade and the sharpest crest (radius) on the course
      { let g = 0, gi = 0, rc = 1e9, ri = 0; for (let i = 1; i + 1 < n; i++) { const a = (P[i].y - P[i - 1].y) / STEP, b = (P[i + 1].y - P[i].y) / STEP; if (Math.abs(b) > g) { g = Math.abs(b); gi = i; } const R = STEP / Math.max(1e-6, Math.abs(b - a)); if (b - a < 0 && R < rc) { rc = R; ri = i; } } out.heights = { gMax: +g.toFixed(3), gAt: Math.round(gi * STEP) + ' m ' + (wayOf(gi).t.name || ''), crestR: Math.round(rc), crestAt: Math.round(ri * STEP) + ' m ' + (wayOf(ri).t.name || ''), rise: +(Math.max(...P.slice(0, n).map(p => p.y)) - Math.min(...P.slice(0, n).map(p => p.y))).toFixed(1) }; }
      // the land and the strip over the road; the meshes
      { let over = 0, samp = 0; for (let i = 0; i < n; i += 2) { const p = P[i], hw = p.w / 2, lx = Math.cos(p.h), lz = -Math.sin(p.h); if (p.rwtu || p.nb) continue; for (let lat = -hw + 0.1; lat <= hw - 0.1 + 1e-6; lat += 0.6) { const yr = roadSurfY(T, i * STEP, lat, p.w, true), x = p.x + lx * lat, z = p.z + lz * lat, gg = groundAt(T, x, z), st = stripAt(T, x, z); samp++; if ((gg !== null && gg > yr + 0.02) || (st !== null && st > yr + 0.02)) over++; } } out.landOverRoad = over + '/' + samp; }
      const m = {}; scene.traverse(o => { if (o.userData && (o.userData.rw === 'lines' || o.userData.rw === 'kerbs')) m[o.userData.rw] = (m[o.userData.rw] || 0) + (o.geometry.index ? o.geometry.index.count / 3 : 0); }); out.meshes = m;
      out.surf = (() => { const c = {}; for (let i = 0; i < n; i++) c[P[i].surf] = (c[P[i].surf] || 0) + 1; return c; })();
      return out; });
    console.log(name, (Date.now() - t0) + ' ms', JSON.stringify(R, null, 1));
  }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6))); await H.close();
})();
