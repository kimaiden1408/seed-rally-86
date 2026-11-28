const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const page = process.env.PAGE || 'work/site49/index.html', H = await L.open(page, { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const name of process.argv.slice(2)) {
    const f = fs.existsSync('work/r49/packs/' + name + '.json') ? 'work/r49/packs/' + name + '.json' : 'work/site48/real/' + name + '.json';
    const txt = fs.readFileSync(f, 'utf8');
    const r = await H.page.evaluate(txt => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); let n = 0, deg = 0, seen = new Set(); const at = [];
      for (const L of T.boxAt || []) if (L) for (const b of L) { if (seen.has(b)) continue; seen.add(b); n++; const q = b.q; let A = 0; for (let e = 0; e < 8; e += 2) A += q[e] * q[(e + 3) % 8] - q[(e + 2) % 8] * q[e + 1]; if (Math.abs(A) < 1e-4) { deg++; if (at.length < 6) { const I = locate(T, q[0], q[1], b.i); at.push(b.kind + '@' + Math.round(I.dist) + 'm lat' + I.lat.toFixed(1)); } } }
      return { boxes: n, degenerate: deg, at }; }, txt);
    console.log(name, JSON.stringify(r)); }
  await H.close();
})();
