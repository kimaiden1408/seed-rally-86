// Smoke test in the page itself: start the stage on the menu, hold the throttle, and see that the car moves, the sound
// runs with the pipe's chain and nothing throws. usage: node drive43.js BUILD.html [carId]
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2], { w: 960, h: 540 }), id = process.argv[3] || ''; await new Promise(r => setTimeout(r, 4000));
  const pre = await H.page.evaluate((id) => { if (id) { const S = carById(id); if (S && typeof selectCar === 'function') selectCar(S); else if (S) G.spec = S; } return { state: G.state, car: G.spec && G.spec.id, seed: G.T && G.T.seed, build: SR86_BUILD }; }, id);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => { try { startRun(); } catch (e) { window.__err = String(e && e.stack || e); } });
  await new Promise(r => setTimeout(r, 6000)); await H.page.keyboard.down('ArrowUp'); await new Promise(r => setTimeout(r, 14000));
  const post = await H.page.evaluate(() => { const c = G.car || {}, out = { err: window.__err || null, kmh: G.car && G.car.speed != null ? +(G.car.speed * 3.6).toFixed(0) : null, dist: G.car && G.car.s != null ? +(+G.car.s).toFixed(0) : (G.dist != null ? +G.dist.toFixed(0) : null), u: G.car && G.car.u != null ? +(G.car.u * 3.6).toFixed(0) : null, gear: G.car && G.car.gear, state: G.state, car: G.spec && G.spec.id, v: c.v != null ? +(+c.v).toFixed(1) : null, speed: c.vel ? +Math.hypot(c.vel.x || 0, c.vel.z || 0).toFixed(1) : null, rpm: c.rpm ? Math.round(c.rpm) : null };
    try { const K = engineCfg(G.spec); out.net = K.net ? { sections: K.net.sec.length, len: K.net.info.len, g: K.net.g } : null; } catch (e) { out.cfgErr = e.message; }
    try { out.audio = typeof Snd !== 'undefined' && Snd.ctx ? Snd.ctx.state : (typeof Audio3 !== 'undefined' ? 'x' : null); } catch (e) { } return out; });
  await H.page.keyboard.up('ArrowUp'); console.log(JSON.stringify(pre), JSON.stringify(post)); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
