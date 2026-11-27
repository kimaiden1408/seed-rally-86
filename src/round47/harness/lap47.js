// Round 47: a real circuit driven lap after lap by the game's own crew driver at the wheel of the player's car, through
// the page's own physics step (its course check, its timing lines, its finish), the page's frame loop stopped so it runs
// as fast as the machine allows. Logs each timing line crossed (its popup), the lap box as it reads mid-race and at the
// finish, the laps, the finish line's text; pictures of the HUD. node harness/lap47.js <pack> [out dir]
const L = require('./lib46'), fs = require('fs');
(async () => {
  const [name, out0] = process.argv.slice(2), OUT = out0 || 'work/r47/lap'; fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 1100, h: 620 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8');
  const tab = await H.page.evaluate((txt) => { COND.time = 'midday'; COND.wx = 'clear'; try { localStorage.removeItem('sr86.laprec.' + JSON.parse(txt).code); } catch (e) { } const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T);
    const res = runStageCrew(T, { seed: 7, car: G.spec.id, D: { pace: 0.9, err: 0.05, aggr: 0.3 }, tMax: 2400 }); return { prog: res.prog, s0: res.s0, t: res.t, out: res.out }; }, txt);
  console.log('crew run', tab.t, 'out', JSON.stringify(tab.out), 'marks', tab.prog.length);
  await H.page.mouse.click(550, 310); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 3500));
  const info = await H.page.evaluate(() => { window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; return { on: RWLap.on, laps: RWLap.laps, M: RWLap.M, lines: RWLap.L, state: G.state, start: G.T.startIdx, finish: G.T.finishIdx, box: !$('#lapBox').hidden }; });
  console.log('start', JSON.stringify(info));
  await new Promise(r => setTimeout(r, 400));
  // (the drive, in slices of 20 s of the game's time so the page stays answerable)
  await H.page.evaluate((tab) => { G.state = 'run'; G.cd = 0; $('#count').textContent = ''; window.__lapAI = { tab, t: 0, log: [], n0: 0 }; }, tab);
  const snaps = [];
  for (let slice = 0; slice < 240; slice++) { const w0 = Date.now();
    const r = await H.page.evaluate(() => { const W = window.__lapAI, P = W.tab.prog, s0 = W.tab.s0, T = G.T; let k = 0, sp = 0;
      // (where the crew's car was at a time: its marks are the times it reached every tenth road point)
      const at = t => { let j = 0; while (j < P.length - 1 && P[j + 1] <= t) j++; if (j >= P.length - 1) return s0 + 10 * (P.length - 1); const f = (t - P[j]) / Math.max(1e-6, P[j + 1] - P[j]); return s0 + 10 * (j + Math.min(1, Math.max(0, f))); };
      for (; k < 5 * 60 && !G.finished; k++) { W.t += 1 / 60; const p0 = G.prog; G.time = W.t; G.prog = Math.max(G.prog, Math.floor(at(W.t))); sp = (G.prog - p0) * STEP * 60;
        for (let s = 0; s < G.splitIdx.length; s++) if (!G.splits[s] && G.prog >= G.splitIdx[s]) { G.splits[s] = G.time + G.penalty; showSplit(s); }
        if (RWLap.on) RWLap.tick(); if (G.prog >= T.finishIdx) finishRun();
        if (RWLap.lt.length !== W.n0) { W.n0 = RWLap.lt.length; W.log.push({ k: W.n0, t: +(RWLap.now()).toFixed(3), prog: G.prog, pop: ($('#split').textContent || '').trim() }); }
        if (k % 4 === 0) { try { updateHud(sp); } catch (e) { W.err = String(e).slice(0, 200); } } }
      const c = G.car;
      try { updateHud(sp); } catch (e) { }
      const box = { time: $('#time').textContent, lapN: $('#lapN').textContent, pos: $('#lapPos').hidden ? '' : $('#lapPos').textContent, s: ['#lapS1', '#lapS2', '#lapS3'].map(q => $(q).textContent + '[' + $(q).className + ']'), last: $('#lapLast').textContent, best: $('#lapBest').textContent, tot: $('#lapTot').textContent, rec: $('#lapRec').textContent, delta: $('#delta').textContent };
      return { t: +G.time.toFixed(2), prog: G.prog, fin: !!G.finished, box, err: W.err || null, dmg: null }; });
    snaps.push(r); if (slice % 12 === 0 || r.fin || Date.now() - w0 > 20000) console.log('wall', Date.now() - w0, 'at', r.t, 'prog', r.prog, r.fin ? 'FINISHED' : '', JSON.stringify(r.box), r.err ? 'ERR ' + r.err : '', r.dmg ? 'DEAD ' + r.dmg : '');
    if (slice === 32) await H.page.screenshot({ path: OUT + '/' + name + '_hud_mid.jpg', quality: 82, clip: { x: 0, y: 0, width: 1100, height: 620 } });
    if (r.fin || r.dmg || r.err) break;
  }
  { const z = snaps[snaps.length - 1]; console.log('stopped at', z.t, 'prog', z.prog, 'fin', z.fin, 'err', z.err, 'dead', z.dmg); }
  const R = await H.page.evaluate(() => { const W = window.__lapAI; return { log: W.log, lt: RWLap.lt.map(x => +x.toFixed(3)), laps: RWLap.lapsOf(RWLap.lt).map(x => ({ t: x.t && +x.t.toFixed(3), S: x.S.map(v => v && +v.toFixed(3)) })), fin: RWLap.finLine(), finT: G.finT, rec: RWLap.rec, tower: $('#mpStand') ? $('#mpStand').className : '' }; });
  for (const e of R.log) console.log('line', e.k, 't', e.t, 'prog', e.prog, '|', e.pop);
  console.log('laps', JSON.stringify(R.laps)); console.log('finLine', R.fin, '| finT', R.finT, '| record', JSON.stringify(R.rec));
  // (the sums: each lap the sum of its sectors; the laps' sum the run's time)
  const sumL = R.laps.reduce((s, x) => s + (x.t || 0), 0); console.log('check: sectors sum to laps', R.laps.every(x => x.t == null || Math.abs(x.S[0] + x.S[1] + x.S[2] - x.t) < 0.002), '| laps sum', sumL.toFixed(3), 'vs finish', R.finT && R.finT.toFixed(3));
  await H.page.evaluate(() => { window.requestAnimationFrame = window.__raf; }); await new Promise(r => setTimeout(r, 2500));
  await H.page.screenshot({ path: OUT + '/' + name + '_hud_fin.jpg', quality: 82 });
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5))); await H.close();
})();
