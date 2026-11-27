// Round 47: each real tunnel's road heights against the land over it (the map's heights, no cover), every ~10 m
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8');
    const R = await H.page.evaluate((txt) => { const K = rwPackIn(txt), T = rwStageOf(K), P = T.pts, C = T.real, U = C._tu, on = U && U.on; if (U) U.on = false;
      const out = []; for (const f of T.feats) { if (f.type !== 'tunnel') continue; const rows = [];
        for (let i = f.s0 - 10; i <= f.s1 + 10; i += 5) { const p = P[i]; if (!p) continue; const lx = Math.cos(p.h), lz = -Math.sin(p.h), hw = p.w / 2 + 0.9; let mn = 1e9, mx = -1e9; for (const u of [-1, -0.5, 0, 0.5, 1]) { const g = rwNat(C, p.x + lx * u * (hw + 2), p.z + lz * u * (hw + 2)); mn = Math.min(mn, g); mx = Math.max(mx, g); }
          rows.push([Math.round((i - f.s0) * STEP), +p.y.toFixed(1), +(rwNat(C, p.x, p.z) - p.y).toFixed(1), +(mn - p.y).toFixed(1), p.rwtu ? 1 : 0]); }
        out.push({ s0: f.s0, len: Math.round((f.s1 - f.s0) * STEP), w: P[f.s0].w, rows }); }
      if (U) U.on = on; return out; }, txt);
    for (const t of R) { console.log(name, 'tunnel len', t.len, 'w', t.w.toFixed(1)); console.log('  m:y:centre-over:min-over:tu  ' + t.rows.map(r => r.join(':')).join('  ')); }
  }
  await H.close();
})();
