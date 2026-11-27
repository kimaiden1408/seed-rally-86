// Round 45 checks. (1) the sound: with one bank silenced nothing should reach the other bank's pipe; a pop goes down the
// pipe of the bank it is in. (2) the flames: which open ends light for a pop in each bank, by layout, and where they are.
// (3) the flow: the pulses' figure by engine and crossover, and what it does to a build's power.
// usage: node fire45.js BUILD.html
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { Gfx.level = 'high'; const out = [], D = EngineDSPDef(), sr = 48000, blk = 128, dB = v => v > 0 ? (10 * Math.log10(v)).toFixed(1) : '-inf';
    const mk = (id, patch, tag) => { let S = carById(id); if (patch) { const B = Object.assign({}, cuStockBuild(S), patch); B.name = 'B43'; S = cuRegister('cu_b45' + tag + 'xx', B, true); } return S; };
    const runDsp = (K, opt) => { const e = new D(sr, K), ch = [0, 1, 2, 3, 4].map(() => new Float32Array(blk)); if (!e.n2) return null; let a0 = 0, a1 = 0, on = false; const real = e.n2.run2.bind(e.n2); e.n2.run2 = (x0, x1) => { if (on) { a0 += x0 * x0; a1 += x1 * x1; } return real(x0, x1); };
      const bs = e.bs; e.bs = new Proxy(bs, { get: (t, k) => (opt.mute || []).includes(+k) ? 0 : t[k], set: (t, k, v) => { t[k] = v; return true; } });
      e.set({ rpm: opt.rpm || 3500, thr: opt.thr == null ? 1 : opt.thr, load: 1, on: 1, spool: 1, gear: 3 }); for (let q = 0; q < sr * 0.5; q += blk) e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]);
      on = true; if (opt.pop != null) e.pop(1, opt.pop); for (let q = 0; q < sr * (opt.pop != null ? 0.08 : 1); q += blk) e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); return [a0, a1]; };
    // (1)
    for (const [label, id, patch] of [['V8 as entered (a pipe a bank)', 'galliot_v8', null], ['V8 X-pipe, chambered, sport cat', 'galliot_v8', { xover: 'x', tail: 2, muff: 'chamber', cat: 'sport' }], ['V8 twin turbo, H-pipe', 'galliot_v8', { xover: 'h', tail: 2, asp: 'biturbo' }]]) {
      const S = mk(id, patch, 'a'); if (patch) { const m = buildCarMesh(S, false, false, null); dropCarMesh(m); } const K = () => engineCfg(S); const a = runDsp(K(), { mute: [1] }), b = runDsp(K(), { mute: [0] });
      if (!a) { out.push('(1) ' + label + ': no two-pipe sound'); } else { out.push('(1) ' + label + ': second bank silenced: second pipe gets ' + dB(a[1] / a[0]) + ' dB of the first; first bank silenced: first pipe gets ' + dB(b[0] / b[1]) + ' dB of the second');
        const p0 = runDsp(K(), { mute: [0, 1], pop: 0, thr: 0 }), p1 = runDsp(K(), { mute: [0, 1], pop: 1, thr: 0 }); out.push('    a pop in the first bank: the other pipe gets ' + dB(p0[1] / p0[0]) + ' dB of it; in the second bank: ' + dB(p1[0] / p1[1]) + ' dB'); }
      if (patch) cuUnregister(S.id); }
    if (typeof ex45Psi !== 'function') return out; // (an older build: the sound's check only)
    // (2)
    const arguments5 = { 'in-line four, twin-end tailpipe': 'twin', 'V8 a pipe a bank, twin-end tailpipes': 'twin', 'in-line four, turned-down end': 'down' };
    const vis = (m, f, fb) => { Snd.flameB = fb; const h = {}; ex36Fire(m, f, h); clearTimeout(h.flT); clearTimeout(h.flT2); const v = m.flame.children.map(c => c.visible ? +c.children[0].scale.z.toFixed(2) : 0); m.flame.children.forEach(c => { c.visible = false; }); m.flame.visible = false; return v; };
    for (const [label, id, patch] of [['V8 as entered: a pipe a bank', 'galliot_v8', null], ['V8 H-pipe', 'galliot_v8', { xover: 'h', tail: 2 }], ['V8 X-pipe', 'galliot_v8', { xover: 'x', tail: 2 }], ['V8 Y-pipe, two tailpipes', 'galliot_v8', { xover: 'y', tail: 2 }], ['V8 none, side exits', 'galliot_v8', { xover: 'none', tail: 2, exit: 'side' }], ['V8 X, centre pair', 'galliot_v8', { xover: 'x', tail: 2, exit: 'centre' }],
      ['in-line four, one tailpipe', 'sentai_gt4', null], ['in-line four, two tailpipes', 'sentai_gt4', { tail: 2 }], ['in-line four, twin-end tailpipe', 'sentai_gt4', null], ['V8 a pipe a bank, twin-end tailpipes', 'galliot_v8', null], ['in-line four, turned-down end', 'sentai_gt4', null], ['single-turbo V8, H chosen', 'galliot_v8', { xover: 'h', tail: 2, asp: 'turbo' }]]) {
      const S = mk(id, patch, 'f'), st = arguments5[label] || null; let m;
      try { m = buildCarMesh(S, false, false, st ? Object.assign({}, typeof LK_DEF !== 'undefined' ? LK_DEF : {}, { tip: st }) : null); const fl = m.flame, at = fl.children.map(c => [c.position.x, c.position.y, c.position.z].map(v => +v.toFixed(2)));
        out.push('(2) ' + label + ': mode ' + fl.userData.mode + ', ends ' + fl.children.length + ' at ' + JSON.stringify(at) + ' | pop in bank 1: ' + JSON.stringify(vis(m, 1, [1, 0])) + ' | bank 2: ' + JSON.stringify(vis(m, 1, [0, 1])) + ' | small pop bank 1 (0.5): ' + JSON.stringify(vis(m, 0.5, [0.5, 0]))); dropCarMesh(m); } catch (e) { out.push('(2) ' + label + ' ERR ' + (e.stack || e).toString().slice(0, 300)); }
      if (S.cu) cuUnregister(S.id); }
    // (3)
    const g = cuStockBuild(carById('galliot_v8')), psiRow = (label, B) => out.push('(3) ' + label + ': none ' + ex45Psi(Object.assign({}, B, { xover: 'none', tail: 2 })) + ', H ' + ex45Psi(Object.assign({}, B, { xover: 'h', tail: 2 })) + ', X ' + ex45Psi(Object.assign({}, B, { xover: 'x', tail: 2 })) + ', Y ' + ex45Psi(Object.assign({}, B, { xover: 'y', tail: 1 })));
    psiRow('V8 as entered (' + (g.crank || 'auto') + ' crank, engine ' + (g.eng || '-') + ')', g); psiRow('V8 flat-plane crank', Object.assign({}, g, { crank: 'flat', eng: '' })); psiRow('V8 cross-plane, no named engine', Object.assign({}, g, { crank: 'cross', eng: '' })); psiRow('V6 even firing', Object.assign({}, g, { cyl: 6, eng: '', crank: 'auto' })); psiRow('flat six, rear', cuStockBuild(carById('tasman_6r'))); psiRow('V8 twin turbo', Object.assign({}, g, { asp: 'biturbo' })); psiRow('V8 single turbo', Object.assign({}, g, { asp: 'turbo' }));
    const pw = B => { const E = cuEngineOn(typeof cu35Ecu === 'function' ? cu35Ecu(B) : B); return [(E.pmax / 745.7).toFixed(1), E.tmax, exInfo(B, E) ? exInfo(B, E).dp.toFixed(1) : '-']; };
    for (const [label, B0] of [['V8 body, its own engine', g], ['V8 flat-plane', Object.assign({}, g, { crank: 'flat', eng: '' })], ['V8, 51 mm pipes fitted', Object.assign({}, g, { pipeD: 51 })], ['in-line four body', cuStockBuild(carById('sentai_gt4'))]])
      out.push('(3) ' + label + ' [hp, Nm, kPa behind]: none ' + pw(Object.assign({}, B0, { xover: 'none', tail: 2 })) + ' | H ' + pw(Object.assign({}, B0, { xover: 'h', tail: 2 })) + ' | X ' + pw(Object.assign({}, B0, { xover: 'x', tail: 2 })) + ' | Y one ' + pw(Object.assign({}, B0, { xover: 'y', tail: 1 })) + ' | Y two ' + pw(Object.assign({}, B0, { xover: 'y', tail: 2 })));
    return out; });
  console.log(r.join('\n')); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
