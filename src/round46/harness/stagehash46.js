// Round 46: the seeded stages as laid (points, notes, solids, side roads) and a crew's run on two of them, hashed: a
// build that leaves the game's own stages untouched gives the same figures. node harness/stagehash46.js BUILD.html
const { open } = require('./lib'), crypto = require('crypto');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { const out = {}, J = v => JSON.stringify(v), R = x => Math.round(x * 1000) / 1000;
    const lay = (seed, f) => { const T = generateStage(seed, f); return J([T.pts.map(p => [R(p.x), R(p.z), R(p.y), R(p.w), p.surf, p.tag || '', p.wall ? 1 : 0, p.kerb ? 1 : 0]), T.notes.map(n => [n.i, n.e, n.text]), T.colliders.length, T.boxes.length, T.spurs.length, T.feats.map(f => f.type + f.s0), T.startIdx, T.finishIdx, T.stopIdx, Array.from(T.bank).map(R), Array.from(T.amp).map(R)]); };
    for (const s of ['1', '12345', '777', '424242', '9', '31337']) out['lay' + s] = lay(s);
    out.sss = lay('4321', { sss: true }); out.rx = lay('555', { rx: true }); out.wide = lay('2024', { wide: 1.8 }); out.forest = lay('88', { type: 'forest' }); out.mountain = lay('99', { type: 'mountain' });
    // (a car driven down the road by fixed inputs, step by step: throttle, and steering toward the road's line ahead)
    for (const s of ['1', '777']) { const T = dressRoad(generateStage(s), { time: 'midday', wx: 'clear', wet: 0 }, REGIONS[generateStage(s).type.id] || REGIONS.fast, 12), S = CARS[0], c = makeCar(S, T, T.startIdx), dt = 1 / 240, tr = [];
      const rnd = Math.random; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      try { for (let k = 0; k < 240 * 25; k++) { const P = T.pts[Math.min(T.pts.length - 1, (c.hint | 0) + 8)], want = Math.atan2(P.x - c.x, P.z - c.z), d = wrapAngle(want - c.psi); stepCar(c, S, { steer: clamp(-d * 2, -1, 1), throttle: 0.7, brake: 0, hand: 0, clutch: 0 }, dt, T, {}); if (k % 240 === 0) tr.push([R(c.x), R(c.z), R(c.yb), R(c.u), c.hint]); } }
      finally { Math.random = rnd; } out['drive' + s] = J(tr); }
    return out; });
  const h = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12), all = Object.keys(r).sort().map(k => k + ':' + h(r[k]));
  console.log('all', h(all.join('|'))); console.log(all.join(' ')); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
