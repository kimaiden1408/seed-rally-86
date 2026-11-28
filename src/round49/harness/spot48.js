// Round 48: pictures of a real course at given distances along it (metres from its first point): from the road 25 m
// before, looking along it; low across it from its left edge at the spot; and from above and to the side.
// node harness/spot48.js <pack> <m> [m...]   env PAGE (default work/site47/index.html), OUT (default work/r48/spot), TAG
const L = require('./lib46'), { shot } = require('./shot46'), fs = require('fs');
(async () => {
  const [name, ...ms] = process.argv.slice(2), OUT = process.env.OUT || 'work/r48/spot', tag = process.env.TAG || name; fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 960, h: 540 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync((process.env.PACKS || 'work/r46/packs') + '/' + name + '.json', 'utf8');
  await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 5000));
  for (const m0 of ms) { const m = +m0;
    const S = await H.page.evaluate((m) => { const T = G.T, P = T.pts, pt = i => { i = Math.max(0, Math.min((T.cN || P.length) - 1, i)); const p = P[i]; return { i, x: p.x, z: p.z, y: p.y, h: p.h, w: p.w, tag: p.tag, hw: p.rwhw, ln: p.rwln, one: p.rwone }; };
      const i = Math.round(m / STEP); return { p: pt(i), b: pt(i - Math.round(25 / STEP)) }; }, m);
    const p = S.p, b = S.b, fx = Math.sin(p.h), fz = Math.cos(p.h), lx = Math.cos(p.h), lz = -Math.sin(p.h), bl = [Math.cos(b.h), -Math.sin(b.h)];
    const k = `${tag}_${m}`;
    await shot(H.page, { x: b.x + bl[0] * b.w * 0.15, y: b.y + 1.5, z: b.z + bl[1] * b.w * 0.15, tx: p.x, ty: p.y + 0.8, tz: p.z, fov: 62 }, `${OUT}/${k}_road.jpg`);
    await shot(H.page, { x: p.x + lx * (p.w / 2 + 0.4) - fx * 6, y: p.y + 0.9, z: p.z + lz * (p.w / 2 + 0.4) - fz * 6, tx: p.x - lx * (p.w / 2) + fx * 4, ty: p.y, tz: p.z - lz * (p.w / 2) + fz * 4, fov: 70 }, `${OUT}/${k}_low.jpg`);
    await shot(H.page, { x: p.x + lx * 30 - fx * 20, y: p.y + 22, z: p.z + lz * 30 - fz * 20, tx: p.x, ty: p.y, tz: p.z, fov: 55, nofog: 1 }, `${OUT}/${k}_air.jpg`);
    console.log(k, JSON.stringify(p)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
