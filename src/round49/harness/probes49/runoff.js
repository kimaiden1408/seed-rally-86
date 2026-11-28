const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync('work/r49/packs/' + name + '.json', 'utf8');
    const r = await H.page.evaluate(txt => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const S = T.side, C = S.C, N = T.cN || T.pts.length; const hist = { lt3: 0, '3to6': 0, '6to10': 0, gt10: 0, rise: 0 }, steps = { lt3cm: 0, '3to8cm': 0, gt8cm: 0 }, worst = [];
      for (let i = 0; i < N; i++) { const p = T.pts[i]; if (!p.rwro) continue;
        for (let sd = 0; sd < 2; sd++) { const o = (i * 2 + sd) * C, lx = Math.cos(p.h), lz = -Math.sin(p.h); let e = -1, f = -1;
          for (let c = 0; c < C; c++) { const lat = Math.abs((S.x[o + c] - p.x) * lx + (S.z[o + c] - p.z) * lz); if (e < 0 && lat >= p.w / 2 - 0.05) e = c; if (f < 0 && lat >= p.w / 2 + p.rwro - 0.1) f = c; }
          if (e < 0 || f < 0) continue; const sg = sd === 0 ? 1 : -1, road = roadSurfY(T, i * STEP, sg * p.w / 2, p.w, true), dy = S.y[o + f] - S.y[o + e], run = Math.max(0.5, Math.abs((S.x[o + f] - S.x[o + e]) * lx + (S.z[o + f] - S.z[o + e]) * lz)), sl = -dy / run;
          if (sl < 0) hist.rise++; else if (sl < 0.03) hist.lt3++; else if (sl < 0.06) hist['3to6']++; else if (sl < 0.10) hist['6to10']++; else { hist.gt10++; if (worst.length < 6) worst.push(Math.round(i * STEP) + (sd ? 'R' : 'L') + ':' + (100 * sl).toFixed(0) + '%'); }
          const st = road - S.y[o + e]; if (Math.abs(st) < 0.03) steps.lt3cm++; else if (Math.abs(st) < 0.08) steps['3to8cm']++; else steps.gt8cm++; } }
      return { runoffFall: hist, edgeStep: steps, worst }; }, txt);
    console.log(name, JSON.stringify(r)); }
  await H.close();
})();
