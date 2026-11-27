// Round 46: the game's crew driver (as the rival crews are driven: pace 0.9, the usual 5 % of mistakes) round each real
// course and two of the game's own stages, a few times each with its own draw of mistakes: how often it gets to the
// finish, and its times. node harness/crewbatch46.js [runs]
const L = require('./lib46'), fs = require('fs');
(async () => {
  const runs = +(process.argv[2] || 4), H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof runStageCrew === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 2000));
  const courses = [['seed 1', null], ['seed 777', null], ['turini', 'turini'], ['bollene_rt', 'bollene_rt'], ['monaco', 'monaco']];
  for (const [label, pack] of courses) {
    const txt = pack ? fs.readFileSync(`work/r46/packs/${pack}.json`, 'utf8') : null;
    const r = await H.page.evaluate((txt, seedStr, runs) => { const out = []; COND.time = 'midday'; COND.wx = 'clear';
      let T; if (txt) { const K = rwPackIn(txt); T = rwStageOf(K); rwUseStage(T); } else { setSeed(seedStr, { force: true }); T = G.T; }
      for (let s = 1; s <= runs; s++) { const res = runStageCrew(T, { seed: s * 101, car: G.spec.id, D: { pace: 0.9, err: 0.05, aggr: 0.3 }, tMax: 3000 }); out.push(res.t ? +res.t.toFixed(1) : 'DNF ' + (res.out && res.out.why) + '@' + (res.out && res.out.at)); }
      return { km: (T.length / 1000).toFixed(2), out }; }, txt, label.replace('seed ', ''), runs);
    console.log(label.padEnd(11), r.km + ' km', JSON.stringify(r.out));
  }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6))); await H.close();
})();
