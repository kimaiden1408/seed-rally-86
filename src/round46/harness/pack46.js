// Round 46: make a course pack in the page from real map data (through lib46's cache), and keep it on disk.
// node harness/pack46.js <name> <kind> "lat,lon;lat,lon;..." [laps]
const L = require('./lib46'), fs = require('fs'), path = require('path');
(async () => {
  const [name, kind, pts, laps] = process.argv.slice(2), wp = pts.split(';').map(s => s.split(',').map(Number));
  const { page, errors, close, stats } = await L.open(process.env.PAGE || 'work/site46/index.html', { net: true, log: !!process.env.LOG });
  await page.waitForFunction(() => typeof rwBuildPack === 'function', { timeout: 120000 });
  const out = await page.evaluate(async (wp, kind, laps) => { const t0 = performance.now(), logs = [];
    try { const K = await rwBuildPack({ wp, kind, laps: laps || 1 }, (k, f) => { const l = logs[logs.length - 1]; if (!l || l[0] !== k || f - l[1] >= 0.25 || f === 1) logs.push([k, Math.round(f * 100) / 100, Math.round(performance.now() - t0)]); }, 'en');
      window._K = K; const txt = rwPackOut(K);
      return { ok: true, ms: Math.round(performance.now() - t0), logs, n: { name: K.name, len: K.len, ways: K.ways.length, jn: K.jn.length, bld: K.bld.length, lc: K.lc.length, wat: K.wat.length, wl: K.wl.length, bar: K.bar.length, pt: K.pt.length, net: K.net.length, pw: K.pw.length, rail: K.rail.length, blocks: Object.keys(K.dn.blocks).length, far: K.df.nx + 'x' + K.df.nz + '@' + K.df.c, prof: K.prof.length, y0: K.y0, alt: K.alt, a: K.r.a, b: K.r.b, nv: K.r.x.length }, size: txt.length, dem: { tiles: RWDem.got, bytes: RWDem.bytes } };
    } catch (e) { return { ok: false, err: String(e && e.stack || e), logs }; } }, wp, kind, +laps || 1);
  console.log(JSON.stringify(out, null, 1));
  if (out.ok) { const txt = await page.evaluate(() => rwPackOut(window._K)); fs.writeFileSync(path.join(__dirname, '../work/r46/packs', name + '.json'), txt); console.log('kept', name, (txt.length / 1e6).toFixed(2), 'MB'); }
  console.log('net', JSON.stringify(stats), 'errors', errors.slice(0, 5));
  await close();
})();
