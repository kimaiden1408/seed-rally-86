// where a circuit's run-off is a gravel bed or paving on the map, what the wheels are on there
const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const r = await H.page.evaluate(txt => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); const N = T.cN || T.pts.length, cnt = {}, ex = {};
      for (let i = 0; i < N; i += 2) { const p = T.pts[i]; if (!p.rwro) continue; for (const sd of [-1, 1]) for (const d of [1, 3, 5]) { const lat = sd * (p.w / 2 + d), x = p.x + Math.cos(p.h) * lat, z = p.z - Math.sin(p.h) * lat, k = rwOffSurf(T, x, z, p, false); cnt[k] = (cnt[k] || 0) + 1; if (!ex[k]) ex[k] = Math.round(i * STEP) + (sd > 0 ? 'L' : 'R') + '+' + d; } }
      // the physics' surface mix for a wheel on each kind
      const mix = {}; for (const k of Object.keys(cnt)) { try { const m = typeof surfMixOf === 'function' ? surfMixOf(k) : null; mix[k] = m ? JSON.stringify(m).slice(0, 80) : '-'; } catch (e) { mix[k] = 'err'; } }
      return { cnt, ex, mix }; }, fs.readFileSync('work/r49/packs/' + name + '.json', 'utf8'));
    console.log(name, JSON.stringify(r)); }
  await H.close();
})();
