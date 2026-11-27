// Cost of the sound with two pipes (PipeNet2) against the same car's one-pipe chain and the old single tube.
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { Gfx.level = 'high'; const D = EngineDSPDef(), sr = 48000, blk = 128, out = [];
    const run = (cfg, secs) => { const e = new D(sr, cfg), ch = [0, 1, 2, 3, 4].map(() => new Float32Array(blk)); e.set({ rpm: 5200, thr: 1, load: 1, on: 1, spool: 1, gear: 3 }); for (let o = 0; o < sr * 0.5; o += blk) e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); const t0 = performance.now(); for (let o = 0; o < sr * secs; o += blk) e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); return (performance.now() - t0) / (secs * 10); };
    const med = v => v.slice().sort((x, y) => x - y)[Math.floor(v.length / 2)];
    for (const [label, patch] of [['V8 as entered (a pipe a bank, no boxes)', null], ['V8 H-pipe, chambered silencers, resonators', { xover: 'h', tail: 2, muff: 'chamber', res: 1, resT: 'bottle', cat: 'sport' }], ['V8 X-pipe, road silencers, quarter-wave pipes, crush bends', { xover: 'x', tail: 2, muff: 'stock', cat: 'stock', res: 1, resT: 'quarter', bend: 'crush' }]]) {
      let S = carById('galliot_v8'); if (patch) { const B = Object.assign({}, cuStockBuild(S), patch); B.name = 'B43'; S = cuRegister('cu_b44pfxx', B, true); const m = buildCarMesh(S, false, false, null); dropCarMesh(m); }
      const a = [], b = [], c = []; for (let k = 0; k < 3; k++) { const c2 = engineCfg(S), c1 = engineCfg(S), c0 = engineCfg(S); delete c1.net2; delete c0.net2; delete c0.net; c.push(run(c0, 3)); b.push(run(c1, 3)); a.push(run(c2, 3)); }
      const K = engineCfg(S); out.push(label + ': two-pipe sections ' + (K.net2 ? K.net2.sec.length : 0) + ' | old tube ' + med(c).toFixed(2) + '% of real time, one chain ' + med(b).toFixed(2) + '%, two pipes ' + med(a).toFixed(2) + '%'); if (patch) cuUnregister('cu_b44pfxx'); }
    return out; });
  console.log(r.join('\n')); await H.close(); })();
