// Round 47: the road structures along a real course - its tunnels, bridges, the map's roads carried over it, its motorway
// stretches - listed, and pictured: in each tunnel and at its two mouths from outside, from above; each bridge from
// beside; each overpass from the road as it nears. node harness/struct47.js <pack> [tag] [max per kind]
// env PAGE (default work/site47/index.html), OUT (default work/r47/struct)
const L = require('./lib46'), { shot } = require('./shot46'), fs = require('fs');
(async () => {
  const [name, tag0, max0] = process.argv.slice(2), tag = tag0 || name, MAX = +(max0 || 3), OUT = process.env.OUT || 'work/r47/struct';
  fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 960, h: 540 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8');
  await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 5000));
  const S = await H.page.evaluate(() => { const T = G.T, P = T.pts, m = i => Math.round((i - T.startIdx) * STEP);
    const pt = i => { i = Math.max(0, Math.min(P.length - 1, i)); const p = P[i]; return { i, x: p.x, z: p.z, y: p.y, h: p.h, w: p.w }; };
    const feats = T.feats.filter(f => ['tunnel', 'bridge'].includes(f.type)).map(f => ({ type: f.type, s0: f.s0, s1: f.s1, m0: m(f.s0), m1: m(f.s1), len: Math.round((f.s1 - f.s0) * STEP), rw: f.rw ? 1 : 0, a: pt(f.s0), b: pt(f.s1), mid: pt(Math.round((f.s0 + f.s1) / 2)) }));
    const ov = []; const C = T.real; for (const o of (C && C._ov ? C._ov.list : [])) for (const c of o.xs) ov.push({ kind: o.kind, ic: c.ic, m: m(c.ic), tu: c.tu, x: c.x, z: c.z, p: pt(c.ic), back: pt(c.ic - Math.round(45 / STEP)) });
    const hw = {}; for (let i = T.startIdx; i < T.finishIdx; i++) { const k = P[i].rwhw || '?'; hw[k] = (hw[k] || 0) + STEP; }
    let best = null; for (let i = T.startIdx; i < T.finishIdx; i++) { if (!/motorway|trunk/.test(P[i].rwhw || '')) continue; let j = i; while (j + 1 < T.finishIdx && /motorway|trunk/.test(P[j + 1].rwhw || '')) j++; if (!best || j - i > best[1] - best[0]) best = [i, j]; i = j; }
    return { feats, ov, hw, mw: best ? { m0: m(best[0]), m1: m(best[1]), mid: pt(Math.round((best[0] + best[1]) / 2)), back: pt(Math.round((best[0] + best[1]) / 2) - Math.round(20 / STEP)) } : null, stats: T.rwStats, len: Math.round((T.finishIdx - T.startIdx) * STEP) }; });
  console.log(JSON.stringify({ len: S.len, hw: Object.fromEntries(Object.entries(S.hw).map(([k, v]) => [k, Math.round(v)])), stats: S.stats }));
  for (const f of S.feats) console.log(f.type, 'm', f.m0, '-', f.m1, 'len', f.len, 'rw', f.rw, 'w', f.mid.w.toFixed(1));
  for (const o of S.ov) console.log('over', o.kind, 'm', o.m, 'tu', o.tu);
  if (S.mw) console.log('motorway m', S.mw.m0, '-', S.mw.m1);
  const fw = p => [Math.sin(p.h), Math.cos(p.h)], lat = p => [Math.cos(p.h), -Math.sin(p.h)];
  const out = []; const snap = async (cam, file) => { await shot(H.page, cam, OUT + '/' + file); out.push(file); };
  let nt = 0, nb = 0, no = 0;
  for (const f of S.feats) {
    if (f.type === 'tunnel' && nt < MAX) { nt++; const k = tag + '_tu' + nt;
      { const p = f.mid, [fx, fz] = fw(p), [lx, lz] = lat(p); await snap({ x: p.x - fx * 6 + lx * p.w * 0.2, y: p.y + 1.5, z: p.z - fz * 6 + lz * p.w * 0.2, tx: p.x + fx * 30, ty: p.y + 1.6, tz: p.z + fz * 30, fov: 70 }, k + '_in.jpg'); }
      { const p = f.mid, [fx, fz] = fw(p), [lx, lz] = lat(p); await snap({ x: p.x - fx * 2 + lx * (p.w / 2 - 0.3), y: p.y + 1.2, z: p.z - fz * 2 + lz * (p.w / 2 - 0.3), tx: p.x + lx * (p.w / 2 + 3), ty: p.y + 2.5, tz: p.z + lz * (p.w / 2 + 3), fov: 80 }, k + '_wall.jpg'); }
      for (const [end, sd] of [['a', -1], ['b', 1]]) { const p = f[end], [fx, fz] = fw(p), [lx, lz] = lat(p), d = 38 * sd; // (from outside the mouth, along the road, looking at it)
        await snap({ x: p.x + fx * d + lx * 1.5, y: p.y + 2.2, z: p.z + fz * d + lz * 1.5, tx: p.x, ty: p.y + 4, tz: p.z, fov: 62, rel: 0 }, k + '_mouth' + end + '.jpg');
        await snap({ x: p.x + fx * d * 1.6 + lx * 42, y: p.y + 30, z: p.z + fz * d * 1.6 + lz * 42, tx: p.x, ty: p.y + 3, tz: p.z, fov: 55, nofog: 1 }, k + '_mouth' + end + '_air.jpg'); }
      { const p = f.mid, [lx, lz] = lat(p); await snap({ x: p.x + lx * 70, y: p.y + 70, z: p.z + lz * 70, tx: p.x, ty: p.y, tz: p.z, fov: 60, nofog: 1 }, k + '_air.jpg'); } }
    if (f.type === 'bridge' && nb < MAX) { nb++; const k = tag + '_br' + nb, p = f.mid, [fx, fz] = fw(p), [lx, lz] = lat(p), L0 = Math.max(30, f.len * 0.6);
      await snap({ x: p.x + lx * L0 - Math.sin(p.h) * L0 * 0.4, y: 3, z: p.z + lz * L0 - Math.cos(p.h) * L0 * 0.4, tx: p.x, ty: p.y - 4, tz: p.z, fov: 60, nofog: 1, rel: 1 }, k + '_side.jpg');
      { const q = f.a, [qx, qz] = fw(q); await snap({ x: q.x - qx * 30, y: q.y + 1.6, z: q.z - qz * 30, tx: q.x + qx * 20, ty: q.y + 1, tz: q.z + qz * 20, fov: 62 }, k + '_on.jpg'); } }
  }
  for (const o of S.ov) { if (no >= MAX) break; no++; const k = tag + '_ov' + no, b = o.back, p = o.p, [lx, lz] = lat(b);
    await snap({ x: b.x + lx * b.w * 0.2, y: b.y + 1.5, z: b.z + lz * b.w * 0.2, tx: p.x, ty: p.y + 4, tz: p.z, fov: 62 }, k + '_near.jpg');
    await snap({ x: p.x + lx * 45, y: p.y + 25, z: p.z + lz * 45, tx: p.x, ty: p.y + 2, tz: p.z, fov: 55, nofog: 1 }, k + '_air.jpg'); }
  if (S.mw) { const b = S.mw.back, p = S.mw.mid, [lx, lz] = lat(b); await snap({ x: b.x + lx * b.w * 0.15, y: b.y + 1.5, z: b.z + lz * b.w * 0.15, tx: p.x, ty: p.y + 1, tz: p.z, fov: 62 }, tag + '_mw.jpg');
    await snap({ x: p.x + lx * 50, y: p.y + 35, z: p.z + lz * 50, tx: p.x, ty: p.y, tz: p.z, fov: 55, nofog: 1 }, tag + '_mw_air.jpg'); }
  console.log('shots', out.join(' ')); console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
