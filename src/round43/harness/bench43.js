const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2000));
  const r = await H.page.evaluate(() => { const PN = EngineDSPDef().PipeNet, sr = 48000, c = 500, A = 0.0045, out = [];
    const mk = n => ({ sec: Array.from({ length: n }, (_, i) => [3.3 / n, A * (i % 2 ? 4 : 1), c, 0.98, i % 3 === 1 ? 1500 : 0, 0.4]), rs: 0.4, ro: 0.8, fo: 1700, g: 1, sh: 0.2 });
    for (const n of [1, 3, 7, 12, 19]) { const p = new PN(sr, mk(n)); let s = 0, x = 0.3; for (let i = 0; i < 200000; i++) { x = Math.sin(i * 0.013) + (i % 360 === 0 ? 1 : 0); s += p.run(x); } const t0 = performance.now(); for (let i = 0; i < 1000000; i++) { x = Math.sin(i * 0.013) + (i % 360 === 0 ? 1 : 0); s += p.run(x); } const t1 = performance.now(); let q = 0; for (let i = 0; i < 1000000; i++) { x = Math.sin(i * 0.013) + (i % 360 === 0 ? 1 : 0); q += x; } const t2 = performance.now(); out.push('sections ' + n + ': ' + ((t1 - t0 - (t2 - t1)) * 1).toFixed(0) + ' ns a sample' + (isFinite(s) ? '' : ' NaN')); }
    return out; });
  console.log(r.join('\n')); await H.close(); })();
