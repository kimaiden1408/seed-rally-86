// Round 46: a real course made the stage in the page and driven from its start to its finish by the game's own crew
// driver (runStageCrew, as the rival crews are): its time, or where and why it stopped. node harness/crew46.js pack...
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof runStageCrew === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 2000));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync(`work/r46/packs/${name}.json`, 'utf8');
    const r = await H.page.evaluate((txt) => { try { COND.time = "midday"; COND.wx = "clear"; const K = rwPackIn(txt), t0 = performance.now(), T = rwStageOf(K); rwUseStage(T); const t1 = performance.now();
      const res = runStageCrew(T, { seed: +(window.__seed || 7), car: G.spec.id, D: { pace: 0.9, err: 0.05, aggr: 0.3 }, tMax: 2400 }), t2 = performance.now();
      return { kind: T.rwKind, n: T.pts.length, cN: T.cN, start: T.startIdx, finish: T.finishIdx, km: (T.length / 1000).toFixed(2), laps: T.rwLaps, build: Math.round(t1 - t0), sim: Math.round(t2 - t1), t: res.t, out: res.out, pen: res.pen, splits: res.prog.length, ev: (res.ev || []).slice(0, 6) };
    } catch (e) { return { err: String(e && e.stack || e).slice(0, 1500) }; } }, txt);
    console.log(name, JSON.stringify(r));
  }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6))); await H.close();
})();
