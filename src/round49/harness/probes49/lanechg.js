// where the lanes change on a course: the width either side (round 48's page and round 49's), and the steepest taper
const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const txt = fs.readFileSync(process.argv[2], 'utf8'), out = {};
  for (const page of ['work/site48/index.html', 'work/site49/index.html']) {
    const H = await L.open(page, { w: 640, h: 360 });
    await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
    out[page] = await H.page.evaluate((txt) => { const K = rwPackIn(txt), T = rwStageOf(K), P = T.pts, n = T.cN, ch = [];
      for (let i = 1; i < n; i++) if (P[i].rlF !== P[i - 1].rlF || P[i].rlB !== P[i - 1].rlB) ch.push(i);
      let tmax = 0; for (let i = 1; i < n; i++) tmax = Math.max(tmax, Math.abs(P[i].w - P[i - 1].w) / STEP);
      return { tmax: +tmax.toFixed(3), changes: ch.slice(0, 6).map(i => { const row = []; for (let d = -60; d <= 60; d += 10) { const j = Math.max(0, Math.min(n - 1, i + d / STEP)); row.push(P[j].w.toFixed(1) + '/' + P[j].rlF + '+' + P[j].rlB); } return Math.round(i * STEP) + 'm: ' + row.join(' '); }) }; }, txt);
    await H.close(); }
  console.log(JSON.stringify(out, null, 1));
})();
