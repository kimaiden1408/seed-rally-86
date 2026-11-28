const L = require('/home/claude/sr86/harness/lib46'), fs = require('fs');
(async () => {
  const H = await L.open('work/site49/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function', { timeout: 120000 });
  const txt = fs.readFileSync('work/r49/packs/monaco.json', 'utf8');
  const r = await H.page.evaluate(txt => { const C = rwPackIn(txt); rwUseRules(C); rwPrep(C); const R = C.r, ways = C.ways, closed = C.kind === 'loop';
    const tagsAt = v => ((ways[R.w[clamp(v, 0, R.w.length - 1)]] || ways[0]) || { t: {} }).t, wAt = v => rwWidthOf(tagsAt(v), false);
    const CL = rwCenter(R.x, R.z, wAt, closed), out = [];
    for (let m = Math.round(2500 / CL.ds); m <= Math.round(3020 / CL.ds); m += 5) { const t = tagsAt(CL.v[m]); out.push(Math.round(m * CL.ds) + ' ' + (t.name || t.highway).slice(0, 22) + ' ' + t.highway + ' w' + wAt(CL.v[m]).toFixed(1) + ' R' + rwTaperR(t).toFixed(3)); }
    return out; }, txt);
  console.log(r.join('\n')); await H.close();
})();
