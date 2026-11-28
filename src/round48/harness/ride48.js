// Round 48: a real course's road as a car feels it, the driving taken out: the game's own car and physics (stepCar)
// driven down the middle of the road by a simple steady driver - steering to the road's own line 12 m ahead, at a speed
// no more than SPEED km/h (default 90) and slow enough for each bend (3 m/s2 across) - with damage on. What it records:
// the suspension's speeds (the fastest compression and how often it passes 2.5 m/s), the body's sharpest rise and fall
// (vertical acceleration over 50 ms), time with a wheel off the road surface, bump-stop blows, and the tyres and rims at the end.
// node harness/ride48.js pack...   env PAGE (default work/site48/index.html), PACKS (default work/r48/packs), SPEED
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site48/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof stepCar === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  for (const name of process.argv.slice(2)) {
    const txt = fs.readFileSync((process.env.PACKS || 'work/r48/packs') + '/' + name + '.json', 'utf8');
    const R = await H.page.evaluate((txt, vmax) => { COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T);
      const base = CARS.find(s => s.id === G.spec.id) || CARS[0], env = { surface: T.surface, air: 15, wet: 0, lay: T.lay ? T.lay.sum : null, safari: false }, S = setupSpec(base, setupRec(base, env), env);
      const c = makeCar(S, T, T.startIdx); c.dmg = newDamage('real'); initTyres(c, T, S, 0);
      const hits = [], was = dmgHit; dmgHit = function (cc, kind, x, yy, z, nx, ny, nz, dv) { if (cc === c) hits.push({ k: kind, dv: +(+dv).toFixed(1), i: cc.hint }); return was.apply(this, arguments); };
      const P = T.pts, N = P.length, dt = 1 / 240, fin = T.finishIdx; let t = 0, ldMax = 0, ld25 = 0, frames = 0, aMax = 0, aWhere = -1, vyPrev = null, yPrev = null, air = 0, steer = 0;
      const kap = i => { const a = P[Math.max(0, i - 4)], b = P[Math.min(N - 1, i + 4)]; return Math.abs(wrapAngle(b.h - a.h)) / (8 * STEP); };
      const hist = []; // (the body's height every 50 ms, for its vertical acceleration)
      try { for (; t < 1500 && c.hint < fin; t += dt) { const i = c.hint | 0, spd0 = Math.hypot(c.u, c.v), k = Math.min(N - 1, i + Math.max(4, Math.round(spd0 * 0.45 / STEP))), q = P[k], want = Math.atan2(q.x - c.x, q.z - c.z), d = wrapAngle(want - c.psi);
          let vt = vmax / 3.6; for (let j = i; j < Math.min(N - 1, i + 60); j += 3) { const kk = kap(j), dist = (j - i) * STEP; if (kk > 1e-4) vt = Math.min(vt, Math.sqrt(3 / kk + 2 * 4 * dist)); }
          const sp = Math.hypot(c.u, c.v); steer += (clamp(d * 3, -1, 1) - steer) * 0.5;
          stepCar(c, S, { steer, throttle: sp < vt ? clamp((vt - sp) * 0.6, 0, 1) : 0, brake: sp > vt + 1 ? clamp((sp - vt) * 0.3, 0, 1) : 0, handbrake: false, auto: true }, dt, T, {}); frames++;
          for (const w of c.w) { const v = Math.abs(w.Ld || 0); if (v > ldMax) ldMax = v; if (v > 2.5) ld25++; } if (!c.grounded) air += dt;
          if (frames % 12 === 0) { hist.push([c.yb, i]); const n = hist.length; if (n >= 3) { const a = (hist[n - 1][0] - 2 * hist[n - 2][0] + hist[n - 3][0]) / (0.05 * 0.05); if (Math.abs(a) > aMax) { aMax = Math.abs(a); aWhere = hist[n - 2][1]; } } }
          if (c.dmg && c.dmg.dead) break; } } finally { dmgHit = was; }
      const D = c.dmg, byK = {}; for (const h of hits) byK[h.k] = (byK[h.k] || 0) + 1;
      return { done: c.hint >= fin, t: +t.toFixed(1), km: +((Math.min(c.hint, fin) - T.startIdx) * STEP / 1000).toFixed(2), ldMax: +ldMax.toFixed(2), ld25s: +(ld25 * dt / 4).toFixed(2), aMax: +(aMax / 9.81).toFixed(2), aAt: Math.round(aWhere * STEP), hits: byK, hard: hits.filter(h => h.dv >= 4).slice(0, 6),
        air: +air.toFixed(2), wkeys: Object.keys(c.w[0]).slice(0, 40).join(','), tyres: D.w.map(w => ({ rim: +(w.rim || 0).toFixed(2), flat: w.flat ? 1 : 0, arm: +(w.arm == null ? 1 : w.arm).toFixed(2) })), dead: D.dead || null }; }, txt, +(process.env.SPEED || 90));
    console.log(name, JSON.stringify(R)); }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
