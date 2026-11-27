// Round 46: a real course's pack (kept on disk) made the stage in the page, drawn, and driven a little: errors, times, a
// picture from the start. node harness/real46.js <pack> [out.png] [seconds of throttle]
const L = require('./lib46'), fs = require('fs');
(async () => {
  const name = process.argv[2] || 'turini', png = process.argv[3] || `work/r46/${name}_start.png`, drive = +(process.argv[4] || 0);
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 960, h: 540 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof G !== 'undefined' && typeof startRun === 'function', { timeout: 120000 });
  await new Promise(r => setTimeout(r, 2500));
  const txt = fs.readFileSync(`work/r46/packs/${name}.json`, 'utf8');
  const r = await H.page.evaluate((txt) => { try { COND.time = "midday"; COND.wx = "clear"; const t0 = performance.now(), K = rwPackIn(txt), T = rwStageOf(K), t1 = performance.now(); rwUseStage(T); const t2 = performance.now();
    return { lay: Math.round(t1 - t0), build: Math.round(t2 - t1), n: T.pts.length, cN: T.cN, terrain: T.terrain ? T.terrain.nx + 'x' + T.terrain.nz + '@' + T.terrain.cell : null, tris: renderer.info ? renderer.info.render.triangles : null, chunks: stageChunks.length, real: T.rwStats || null, bld: T.real.bld.length };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 1500) }; } }, txt);
  console.log('stage', JSON.stringify(r));
  if (!r.err) { await H.page.mouse.click(480, 270); await H.page.evaluate(() => { try { startRun(); } catch (e) { window.__err = String(e && e.stack || e); } }); await new Promise(r => setTimeout(r, 7000));
    if (drive) { await H.page.keyboard.down('ArrowUp'); await new Promise(r => setTimeout(r, drive * 1000)); await H.page.keyboard.up('ArrowUp'); await new Promise(r => setTimeout(r, 1500)); }
    if (process.env.CAMAT) { await H.page.evaluate((a) => { const [x, y, z, tx, ty, tz] = a.split(',').map(Number); window.__cam = { x, y, z, tx, ty, tz }; }, process.env.CAMAT); }
    await H.page.screenshot({ path: png }); const st = await H.page.evaluate(() => ({ err: window.__err || null, state: G.state, prog: G.prog, car: G.car ? [G.car.x.toFixed(1), G.car.z.toFixed(1), (G.car.yb || 0).toFixed(2)] : null, hint: G.car && G.car.hint, fps: G.fps || null }));
    console.log('run', JSON.stringify(st)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6)));
  await H.close();
})();
