const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/' + process.argv[2] + '.json', 'utf8'), a = +process.argv[3], b = +process.argv[4], st = +(process.argv[5] || 4);
  const r = await H.page.evaluate((txt, a, b, st) => { const K = rwPackIn(txt), T = rwStageOf(K); const out = []; const y = s => roadYAt(T, s);
    for (let s = a; s <= b; s += st) { const g0 = (y(s) - y(s - 5)) / 5, g1 = (y(s + 5) - y(s)) / 5, dg = (g1 - g0) / 5, R = Math.abs(dg) > 1e-6 ? 1 / dg : Infinity; const i = Math.round(s / STEP);
      out.push(`s${s} y${y(s).toFixed(2)} grade${(100 * (y(s + 2) - y(s - 2)) / 4).toFixed(1)}% vR${isFinite(R) ? R.toFixed(0) : 'inf'} hR${(() => { const kap = wrapAngle(T.pts[i + 2].h - T.pts[i - 2].h) / (4 * STEP); return kap ? (1 / kap).toFixed(0) : 'inf'; })()} bank${(T.bank[i] || 0).toFixed(3)}`); }
    return out; }, txt, a, b, st);
  console.log(r.join('\n')); await H.close();
})();
