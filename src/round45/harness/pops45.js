const { open } = require('/home/claude/sr86/harness/lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { const D = EngineDSPDef(), sr = 48000, blk = 128, out = [];
    for (const id of ['galliot_v8', 'sentai_gt4']) { const K = engineCfg(carById(id)), e = new D(sr, K), ch = [0, 1, 2, 3, 4].map(() => new Float32Array(blk)), n = { '1': 0, '-1': 0, '0': 0 }; let all = 0; const p0 = e.pop.bind(e); e.pop = (a, bk) => { all++; return p0(a, bk); }; e.onPop = (a, s) => { n[s]++; };
      e.set({ rpm: 5000, thr: 0, load: 0, on: 1, spool: 0, gear: 3, afR: 6, afA: 1, afC: 1, afM: 1 }); for (let q = 0; q < sr * 20; q += blk) e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); let bad = 0; for (const v of ch[0]) if (!isFinite(v)) bad++;
      out.push(id + ': pops in 20 s on the overrun ' + all + '; big ones reported: first pipe ' + n['1'] + ', second pipe ' + n['-1'] + ', one pipe ' + n['0'] + '; bad samples ' + bad); } return out; });
  console.log(r.join('\n')); await H.close(); })();
