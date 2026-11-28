const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), ii = process.argv[3].split(',').map(Number), sd = +(process.argv[4] || 0);
  const r = await H.page.evaluate((txt, ii, sd) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const S = T.side, C = S.C, out = ['C ' + C];
    for (const i of ii) { const p = T.pts[i], o = (i * 2 + sd) * C, lx = Math.cos(p.h), lz = -Math.sin(p.h), y0 = roadSurfY(T, i * STEP, 0, p.w); const row = [];
      for (let c = 0; c < C; c++) { const lat = (S.x[o + c] - p.x) * lx + (S.z[o + c] - p.z) * lz; row.push(lat.toFixed(2) + ':' + (S.y[o + c] - y0).toFixed(2)); }
      out.push(`i${i} w${p.w.toFixed(1)} sh${(p.sh || 0).toFixed(2)} dd${(p.dd || 0).toFixed(2)} ro${p.rwro || 0} ` + row.join(' ')); }
    out.push('spurs near: ' + (T.spurs || []).filter(s => Math.abs(s.a - ii[0]) < 20).map(s => 'a' + s.a + ' side' + s.s + ' w' + (s.pts[0] && s.pts[0].w).toFixed(1) + ' blk' + s.blk).join(', '));
    return out; }, txt, ii, sd);
  console.log(r.join('\n')); await H.close();
})();
