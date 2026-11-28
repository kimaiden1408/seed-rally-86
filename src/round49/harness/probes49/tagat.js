const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  for (const arg of process.argv.slice(2)) { const [name, s] = arg.split(':');
    const r = await H.page.evaluate((txt, s) => { const K = rwPackIn(txt), T = rwStageOf(K); const i = Math.round(s / STEP), out = [];
      for (let k = i - 6; k <= i + 6; k += 3) { const p = T.pts[k], t = (K.ways[K.r.w[Math.min(K.r.w.length - 1, p.rwv | 0)]] || { t: {} }).t; out.push(`s${k * STEP} tag:${p.tag || '-'} nb:${p.nb ? 1 : 0} br:${t.bridge || '-'} layer:${t.layer || '-'} name:${t.name || t.highway}`); }
      const ov = (T.feats || []).filter(f => f.s0 != null && f.s0 <= i + 10 && f.s1 >= i - 10).map(f => f.type); out.push('feats ' + ov.join(','));
      return out; }, fs.readFileSync('work/r49/packs/' + name + '.json', 'utf8'), +s);
    console.log(arg + '\n  ' + r.join('\n  ')); }
  await H.close();
})();
