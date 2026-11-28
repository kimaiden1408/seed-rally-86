const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4];
  const r = await H.page.evaluate((txt, a, b) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const out = [];
    const i0 = Math.round(a / STEP), i1 = Math.round(b / STEP); const seen = new Set();
    for (let i = i0; i <= i1; i++) { const p = T.pts[i]; const kap = i > 2 && i < T.pts.length - 3 ? wrapAngle(T.pts[i + 2].h - T.pts[i - 2].h) / (4 * STEP) : 0;
      if (i % 3 === 0) out.push(`s${i * STEP} w${p.w.toFixed(1)} lw${(p.rwlw || 0).toFixed(1)} ro${(p.rwro || 0).toFixed(1)} R${kap ? (1 / kap).toFixed(0) : 'inf'} y${p.y.toFixed(1)} bank${(T.bank[i] || 0).toFixed(3)} kerbL${T.rwKb && T.rwKb.k[0][i] ? T.rwKb.k[0][i].toFixed(2) : 0} kerbR${T.rwKb && T.rwKb.k[1][i] ? T.rwKb.k[1][i].toFixed(2) : 0}`);
      for (const c of T.colAt[i] || []) { if (seen.has(c)) continue; seen.add(c); if (c.kind === 'tree' || c.kind === 'post' && c.end) continue; const I = locate(T, c.x, c.z, i); if (Math.abs(I.lat) > 20) continue; out.push(`   col ${c.kind} ${c.mat || ''} at s${Math.round(I.dist)} lat${I.lat.toFixed(1)} r${(c.r || 0).toFixed(2)} ${c.spur ? 'spur' : ''} ${c.tyres ? 'tyres' : ''}`); } }
    const fe = (T.feats || []).filter(f => (f.s0 != null && f.s1 != null && f.s1 >= i0 && f.s0 <= i1) || (f.m != null && f.m >= i0 && f.m <= i1)).map(f => f.type + ' ' + (f.s0 != null ? f.s0 * STEP + '-' + f.s1 * STEP : f.m * STEP));
    out.push('feats: ' + fe.join(', '));
    return out; }, txt, a, b);
  console.log(r.join('\n')); await H.close();
})();
