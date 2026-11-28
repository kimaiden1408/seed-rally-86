const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4];
  const r = await H.page.evaluate((txt, a, b) => { const K = rwPackIn(txt), T = rwStageOf(K); const P = T.pts, out = [];
    for (let i = Math.round(a / STEP); i <= Math.round(b / STEP); i++) { const dh = wrapAngle(P[i + 1].h - P[i].h); out.push(`i${i} s${i * STEP} h${(P[i].h * 180 / Math.PI).toFixed(2)} dh/m ${(dh / STEP * 180 / Math.PI).toFixed(2)} deg/m  R${dh ? (STEP / dh).toFixed(0) : 'inf'} w${P[i].w.toFixed(1)}`); }
    // the worst kinks over the lap: largest change of curvature between successive points
    const N = T.cN || P.length, kk = []; for (let i = 2; i < N - 3; i++) { const k0 = wrapAngle(P[i].h - P[i - 1].h) / STEP, k1 = wrapAngle(P[i + 1].h - P[i].h) / STEP; kk.push([Math.abs(k1 - k0), i]); } kk.sort((x, y) => y[0] - x[0]);
    out.push('worst curvature jumps (1/m per point): ' + kk.slice(0, 12).map(([d, i]) => `s${i * STEP}:${d.toFixed(3)}`).join(' '));
    return out; }, txt, a, b);
  console.log(r.join('\n')); await H.close();
})();
