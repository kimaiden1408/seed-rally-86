// Round 46: what a real course costs to draw against the game's own stages: the stage's build time, and the triangles and
// draw calls of a frame from the start (the game's camera, its fog as set), each in the same page. node harness/perf46.js
const L = require('./lib46'), fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 960, h: 540 }), page = H.page;
  await page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 180000 }); await sleep(2500);
  const frame = async (label) => { await page.evaluate(() => startRun()); await sleep(5000);
    const r = await page.evaluate(() => { renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, camera); const i = renderer.info.render, m = renderer.info.memory; const o = { tris: i.triangles, calls: i.calls, geos: m.geometries, tex: m.textures }; renderer.info.autoReset = true; return o; });
    await page.evaluate(() => { try { G.state = 'menu'; } catch (e) { } }); console.log(label, JSON.stringify(r)); };
  for (const seed of ['1', '777']) { const ms = await page.evaluate(s => { COND.time = 'midday'; COND.wx = 'clear'; const t0 = performance.now(); setSeed(s, { force: true }); return Math.round(performance.now() - t0); }, seed); console.log('seed ' + seed + ' build ms', ms); await frame('seed ' + seed); }
  for (const name of ['turini', 'bollene_rt', 'monaco']) { const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8');
    const ms = await page.evaluate(txt => { COND.time = 'midday'; COND.wx = 'clear'; const t0 = performance.now(); const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); return Math.round(performance.now() - t0); }, txt); console.log(name + ' build ms', ms); await frame(name); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
