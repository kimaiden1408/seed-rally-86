const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(''+(process.env.PAGE||"work/site49/index.html")+'', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4], st = +(process.argv[5] || 2);
  const lats = (process.env.LATS || '-9,-7,-5.5,-4.7,-4,-2,0,2,4,4.7,5.5,6.5,7.5,9').split(',').map(Number);
  const r = await H.page.evaluate((txt, a, b, st, lats) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const out = ['lat: ' + lats.join(' ')];
    for (let s = a; s <= b; s += st) { const i = Math.round(s / STEP), p = T.pts[i], lx = Math.cos(p.h), lz = -Math.sin(p.h), y0 = roadSurfY(T, s, 0, p.w); const row = [];
      for (const lat of lats) { const x = p.x + lx * lat, z = p.z + lz * lat, I = locate(T, x, z, i), g = surfaceY(T, I, x, z, 1e9); row.push((g - y0).toFixed(2)); }
      out.push(`s${s} w${p.w.toFixed(1)} ` + row.join(' ')); }
    return out; }, txt, a, b, st, lats);
  console.log(r.join('\n')); await H.close();
})();
