const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4];
  const r = await H.page.evaluate((txt, a, b) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const out = [], BQ = barrierQuads(T), seen = new Set();
    const latOf = (x, z, i) => { const I = locate(T, x, z, i); return I.lat.toFixed(1) + '@' + Math.round(I.dist); };
    for (let k = Math.round(a / STEP); k <= Math.round(b / STEP); k++) { const p = T.pts[k];
      if (k % 2 === 0) out.push(`s${k * STEP} w${p.w.toFixed(1)} lw${(p.rwlw || 0).toFixed(1)} ro${(p.rwro || 0).toFixed(1)} rb${JSON.stringify(p.rwrb || null)} way ${(K.ways[K.r.w[Math.min(K.r.w.length - 1, p.rwv | 0)]] || { t: {} }).t.name || ''}`);
      for (let s = 0; s < 2; s++) { const q = BQ.Q[k * 2 + s]; if (!q || q.kind === 3) continue; const Q = q.q; out.push(`  Q k${k} s${s} kind${q.kind} top${(q.top - p.y).toFixed(2)} lats ${[0, 2, 4, 6].map(v => latOf(Q[v], Q[v + 1], k)).join(' ')}`); }
      for (const bx of T.boxAt[k] || []) { if (seen.has(bx) || bx.kind === 'fence') continue; seen.add(bx); const Q = bx.q; const L4 = [0, 2, 4, 6].map(v => locate(T, Q[v], Q[v + 1], k)); if (Math.min(...L4.map(I => Math.abs(I.lat))) > 12) continue; out.push(`  B kind ${bx.kind} top${(bx.top - p.y).toFixed(2)} lats ${L4.map(I => I.lat.toFixed(1) + '@' + Math.round(I.dist)).join(' ')} ${bx.rw ? 'rw' : ''} ${bx.slw ? 'slw' : ''}`); } }
    return out; }, txt, a, b);
  console.log(r.join('\n')); await H.close();
})();
