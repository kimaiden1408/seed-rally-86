// Round 48: a real course's cross-section at given distances (m from its first point): across from 14 m left to 14 m
// right, what each surface has there - the road (as driven and as drawn), the roadside strip, the terrain grid, the
// physics' surface, the land as the map has it - every 0.5 m.
// node harness/xs48.js <pack> <m> [m...]   env PAGE
const L = require('./lib46'), fs = require('fs');
(async () => {
  const [name, ...ms] = process.argv.slice(2);
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync((process.env.PACKS || 'work/r46/packs') + '/' + name + '.json', 'utf8');
  await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
  await H.page.mouse.click(320, 180); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 4000));
  for (const m of ms) {
    const R = await H.page.evaluate((m) => { const T = G.T, P = T.pts, i = Math.round(m / STEP), p = P[i], hw = p.w / 2, lx = Math.cos(p.h), lz = -Math.sin(p.h), s = i * STEP, rows = [];
      const f = (v) => v === null || v === undefined ? '   -  ' : (v - p.y).toFixed(2).padStart(6);
      for (let lat = 14; lat >= -14; lat -= 0.5) { const x = p.x + lx * lat, z = p.z + lz * lat, info = { dist: s, lat, w: p.w, i, nb: p.nb, wall: p.wall };
        const road = Math.abs(lat) <= hw ? roadSurfY(T, s, lat, p.w, true) : null, gg = groundAt(T, x, z), st = stripAt(T, x, z); let sf = null; try { sf = surfaceY(T, info, x, z); } catch (e) { }
        rows.push(`${lat.toFixed(1).padStart(5)} road ${f(road)} strip ${f(st)} grid ${f(gg)} phys ${f(sf)} map ${f(natAt(T, x, z))}`); }
      return { p: { i, y: +p.y.toFixed(2), w: p.w, sh: p.sh, dd: p.dd, dw: p.dw, kc: p.kc, kf: p.kf, kerb: p.kerb, tag: p.tag, set: p.set, hw: p.rwhw, eL: +(p.eL - p.y).toFixed(2), eR: +(p.eR - p.y).toFixed(2), bank: T.bank ? +T.bank[i].toFixed(3) : 0 }, rows }; }, +m);
    console.log('== ' + name + ' m ' + m + ' ' + JSON.stringify(R.p)); console.log(R.rows.join('\n')); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
