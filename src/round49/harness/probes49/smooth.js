const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const f = fs.existsSync('work/r49/packs/' + name + '.json') ? 'work/r49/packs/' + name + '.json' : 'work/site48/real/' + name + '.json';
    const r = await H.page.evaluate(txt => { const C = rwPackIn(txt); rwUseRules(C); rwPrep(C); const R = C.r, ways = C.ways, closed = C.kind === 'loop';
      const tagsAt = v => ((ways[R.w[clamp(v, 0, R.w.length - 1)]] || ways[0]) || { t: {} }).t, wAt = v => rwWidthOf(tagsAt(v), false);
      const jumps = CL => { let mx = 0, at = 0; const n = CL.n; for (let i = 1; i < n - 2; i++) { const k0 = wrapAngle(CL.h[i] - CL.h[i - 1]) / CL.ds, k1 = wrapAngle(CL.h[i + 1] - CL.h[i]) / CL.ds; if (Math.abs(k1 - k0) > mx) { mx = Math.abs(k1 - k0); at = i; } } return [+mx.toFixed(3), Math.round(at * CL.ds)]; };
      const A = rwCenter(R.x, R.z, wAt, closed), j0 = jumps(A), len0 = A.len, race = (() => { let k = 0; for (let i = 0; i < A.n; i++) if (tagsAt(A.v[i]).highway === 'raceway') k++; return k / A.n; })();
      RW_SC = rwRaceShare(C) < 0.5; const d = rwRaceSmooth(A, v => tagsAt(v).highway === "raceway", closed); return { raceShare: +race.toFixed(2), jumpBefore: j0, jumpAfter: jumps(A), moved: +(d || 0).toFixed(2), len: [+len0.toFixed(0), +A.len.toFixed(0)] }; }, fs.readFileSync(f, 'utf8'));
    console.log(name, JSON.stringify(r)); }
  await H.close();
})();
