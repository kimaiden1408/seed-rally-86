// Round 46: pictures along a real course: at each distance given (m from its start), one from a car's height a little
// behind and one from above. node harness/views46.js <pack> <m,m,...> [tag]
const L = require('./lib46'), { shot } = require('./shot46'), fs = require('fs');
(async () => {
  const [name, list, tag] = process.argv.slice(2), at = list.split(',').map(Number);
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 960, h: 540 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 2000));
  const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8');
  const P = await H.page.evaluate((txt, at) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T);
    return at.map(d => { const i = Math.min(T.cN - 2, T.startIdx + Math.round(d / STEP)), p = T.pts[i], b = T.pts[Math.max(0, i - 14)], q = T.pts[Math.min(T.cN - 1, i + 10)]; return { i, x: p.x, z: p.z, h: p.h, y: p.y, bx: b.x, bz: b.z, by: b.y, qx: q.x, qz: q.z, qy: q.y, w: p.w }; }); }, txt, at);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 4000));
  for (let k = 0; k < at.length; k++) { const p = P[k], lx = Math.cos(p.h), lz = -Math.sin(p.h);
    await shot(H.page, { x: p.bx + lx * p.w * 0.2, y: p.by + 1.6, z: p.bz + lz * p.w * 0.2, tx: p.qx, ty: p.qy + 1.2, tz: p.qz, fov: 62, nofog: 0 }, `work/r46/${tag || name}_${at[k]}.jpg`);
    await shot(H.page, { x: p.x - Math.sin(p.h) * 55 + lx * 35, y: p.y + 45, z: p.z - Math.cos(p.h) * 55 + lz * 35, tx: p.x, ty: p.y, tz: p.z, fov: 55, nofog: 1 }, `work/r46/${tag || name}_${at[k]}_air.jpg`); }
  console.log(JSON.stringify(P.map(p => ({ i: p.i, w: p.w.toFixed(1) })))); console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
