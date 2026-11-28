// Round 48: the map's other roads' ribbons against the land drawn under them. Each net road's ribbon is made here as the
// page makes it - round 47's (two points across, each on the land and 7 cm up) and round 48's (rwNetRibbon: five across,
// each as high as the land under it and half way to the next, skirts below) - and every triangle facing up is checked at
// its middle and the middles of its sides against the land drawn there: how many have the land standing over them by
// more than 1 cm, and by more than 10 cm. node harness/netcov48.js pack...   env PAGE (default work/site48), PACKS
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site48/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r48/packs') + '/' + name + '.json', 'utf8');
    await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
    await H.page.mouse.click(320, 180); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 4000));
    await H.page.waitForFunction(() => G.T && G.T.rwStats, { timeout: 300000 }); await new Promise(r => setTimeout(r, 1000));
    const R = await H.page.evaluate(() => { const T = G.T, C = T.real, gY = T.rwTun ? (x, z) => rwLandY(T, x, z) : (x, z) => groundY(T, x, z);
      const nearRoad = pad => (x, z) => { const g = T.fieldAt(x, z); if (!(g && g.np && g.nd < g.np.w / 2 + pad)) return false; return !(g.np.nb && g.np.y - gY(x, z) > 3); };
      const spurNear = (x, z) => { for (const sp of T.spurs || []) for (const q of sp.pts) if (Math.abs(q.x - x) < 6 && Math.abs(q.z - z) < 6 && Math.hypot(q.x - x, q.z - z) < q.w / 2 + 1.5) return true; return false; };
      const old = (X, Z, w, lift, skip, step) => { const pos = [], idx = []; let prev = -1; const add = (x, z, h, keep) => { if (!keep) { prev = -1; return; } const lx = Math.cos(h) * w / 2, lz = -Math.sin(h) * w / 2, v = pos.length / 3;
          pos.push(x + lx, gY(x + lx, z + lz) + lift, z + lz, x - lx, gY(x - lx, z - lz) + lift, z - lz); if (prev >= 0) idx.push(prev, prev + 1, v, prev + 1, v + 1, v); prev = v; };
        for (let k = 0; k + 1 < X.length; k++) { const L = Math.hypot(X[k + 1] - X[k], Z[k + 1] - Z[k]), h = Math.atan2(X[k + 1] - X[k], Z[k + 1] - Z[k]), m = Math.max(1, Math.ceil(L / (step || 2)));
          for (let q = 0; q < m; q++) { const x = X[k] + (X[k + 1] - X[k]) * q / m, z = Z[k] + (Z[k + 1] - Z[k]) * q / m; add(x, z, h, !skip(x, z)); } }
        const k = X.length - 1; if (k > 0) add(X[k], Z[k], Math.atan2(X[k] - X[k - 1], Z[k] - Z[k - 1]), !skip(X[k], Z[k])); return { pos, idx }; };
      const check = (r, acc) => { const P = r.pos, I = r.idx; for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3; const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1; if (Math.abs(ny / nl) < 0.85) continue; acc.tris++; let worst = -1e9;
          for (const [wa, wb, wc] of [[1 / 3, 1 / 3, 1 / 3], [0.5, 0.5, 0], [0, 0.5, 0.5], [0.5, 0, 0.5]]) { const x = P[a] * wa + P[b] * wb + P[c] * wc, y = P[a + 1] * wa + P[b + 1] * wb + P[c + 1] * wc, z = P[a + 2] * wa + P[b + 2] * wb + P[c + 2] * wc; worst = Math.max(worst, gY(x, z) - y); }
          if (worst > 0.01) acc.over1++; if (worst > 0.1) acc.over10++; } };
      const A = { tris: 0, over1: 0, over10: 0 }, B = { tris: 0, over1: 0, over10: 0 };
      for (const L of C.net || []) { if (L.tu || L.foot || (!L.own && (L.br || (L.ly | 0) >= 1))) continue; const skip = (x, z) => nearRoad(1.2)(x, z) || spurNear(x, z), w = Math.max(1.2, L.w);
        check(old(L.x, L.z, w, 0.07, skip, 3), A); if (typeof rwNetRibbon === 'function') check(rwNetRibbon(gY, L, w, 0.07, skip, 3, null), B); }
      return { r47: A, r48: typeof rwNetRibbon === 'function' ? B : null, stats: { net: T.rwStats.net, netLines: T.rwStats.netLines || 0 } }; });
    console.log(name, JSON.stringify(R)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
