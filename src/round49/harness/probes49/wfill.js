// how many points of each course the gap filling widened (the eased width over the map's own width there)
const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync('work/r49/packs/' + name + '.json', 'utf8');
    const r = await H.page.evaluate(txt => { const C = rwPackIn(txt); rwUseRules(C); rwPrep(C); const R = C.r, ways = C.ways, closed = C.kind === 'loop', narrow = false;
      const tagsAt = v => ((ways[R.w[clamp(v, 0, R.w.length - 1)]] || ways[0]) || { t: {} }).t, wAt = v => rwWidthOf(tagsAt(v), narrow);
      const CL = rwCenter(R.x, R.z, wAt, closed), E = rwEaseW(CL, tagsAt, wAt, closed); const src = rwEaseW.toString().replace('if (!fx && lo > mx + 0.05)', 'if (false)'), F0 = (0, eval)('(' + src + ')'), E0 = F0(CL, tagsAt, wAt, closed); let diff = 0, dmx = 0, dat = -1; for (let m = 0; m < CL.n; m++) { const d = E[m] - E0[m]; if (Math.abs(d) > 0.05) { diff++; if (Math.abs(d) > Math.abs(dmx)) { dmx = d; dat = m; } } } let over = 0, mx = 0, at = -1;
      for (let m = 0; m < CL.n; m++) { const d = E[m] - wAt(CL.v[m]); if (d > 0.3) { over++; if (d > mx) { mx = d; at = m; } } }
      const runs = []; let r0 = -1; for (let m = 0; m <= CL.n; m++) { const on = m < CL.n && Math.abs(E[m] - E0[m]) > 0.05; if (on && r0 < 0) r0 = m; if (!on && r0 >= 0) { let a = 0; for (let j = r0; j < m; j++) a = Math.max(a, E[j] - E0[j]); runs.push(Math.round(r0 * CL.ds) + '-' + Math.round(m * CL.ds) + 'm +' + a.toFixed(1) + ' (' + (tagsAt(CL.v[r0]).name || tagsAt(CL.v[r0]).highway) + ', map ' + wAt(CL.v[(r0 + m) >> 1]).toFixed(1) + ')'); r0 = -1; } } return { runs, pts: CL.n, widerThanMap: over, most: +mx.toFixed(2), at: Math.round(at * CL.ds), changedByFill: diff, fillMost: +dmx.toFixed(2), fillAt: Math.round(dat * CL.ds), mapW: dat >= 0 ? wAt(CL.v[dat]) : null, tags: dat >= 0 ? JSON.stringify(tagsAt(CL.v[dat])).slice(0, 160) : '' }; }, txt);
    console.log(name, JSON.stringify(r)); }
  await H.close();
})();
