const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4];
  const r = await H.page.evaluate((txt, a, b) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const out = [], BQ = barrierQuads(T);
    const latOf = (x, z, i) => { const I = locate(T, x, z, i); return I.lat.toFixed(1) + '@' + I.i; };
    for (let k = a; k <= b; k++) { const p = T.pts[k];
      for (let s = 0; s < 2; s++) { const q = BQ.Q[k * 2 + s]; if (!q) continue; const Q = q.q; out.push(`Q k${k} s${s} kind${q.kind} bot${(q.bot - p.y).toFixed(2)} top${(q.top - p.y).toFixed(2)} lats ${[0, 2, 4, 6].map(v => latOf(Q[v], Q[v + 1], k)).join(' ')}`); }
      for (const bx of T.boxAt[k] || []) { const Q = bx.q; out.push(`B k${k} kind ${bx.kind} soft${!!bx.soft} i${bx.i} bot${(bx.bot - p.y).toFixed(2)} top${(bx.top - p.y).toFixed(2)} lats ${[0, 2, 4, 6].map(v => latOf(Q[v], Q[v + 1], k)).join(' ')} src ${bx.src || bx.tag || bx.what || ''} ${Object.keys(bx).join(',')}`); } }
    return out; }, txt, a, b);
  console.log(r.join('\n')); await H.close();
})();
