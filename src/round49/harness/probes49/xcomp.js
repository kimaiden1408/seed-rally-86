const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), ss = process.argv[3].split(',').map(Number), lats = process.argv[4].split(',').map(Number);
  const r = await H.page.evaluate((txt, ss, lats) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const out = [];
    for (const s of ss) { const i = Math.round(s / STEP), p = T.pts[i], lx = Math.cos(p.h), lz = -Math.sin(p.h), y0 = roadSurfY(T, s, 0, p.w);
      for (const lat of lats) { const x = p.x + lx * lat, z = p.z + lz * lat, I = locate(T, x, z, i); const sp = T.spurs && T.spurs.length ? spurSurf(T, x, z, I, SPUR_SH) : null, g = groundAt(T, x, z), sv = stripAt(T, x, z);
        out.push(`s${s} lat${lat} I.lat${I.lat.toFixed(2)} I.w${I.w.toFixed(1)} surf${(surfaceY(T, I, x, z, 1e9) - y0).toFixed(2)} spur${sp ? JSON.stringify({ on: sp.on, ex: +(sp.ex || 0).toFixed(2), y: +((sp.y || 0) - y0).toFixed(2), kerb: +((sp.kerb || 0) - y0).toFixed(2) }) : '-'} grid${g === null ? '-' : (g - y0).toFixed(2)} strip${sv === null ? '-' : (sv - y0).toFixed(2)}`); } }
    return out; }, txt, ss, lats);
  console.log(r.join('\n')); await H.close();
})();
