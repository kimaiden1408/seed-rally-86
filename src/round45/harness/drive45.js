// In the page itself: drive, then lift off and let the engine pop on the overrun, several times; every frame note which
// tailpipes show a flame. usage: node drive45.js BUILD.html [carId]
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2], { w: 960, h: 540 }), id = process.argv[3] || 'galliot_v8'; await new Promise(r => setTimeout(r, 4000));
  await H.page.evaluate((id) => { const S = carById(id); if (S && typeof selectCar === 'function') selectCar(S); else if (S) G.spec = S; }, id);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => { try { startRun(); } catch (e) { window.__err = String(e && e.stack || e); } });
  await new Promise(r => setTimeout(r, 6000));
  await H.page.evaluate(() => { window.__fl = { frames: 0, any: 0, pat: {}, popsB: [0, 0] }; const tick = () => { const m = G.mesh, fl = m && m.flame, W = window.__fl; W.frames++; if (fl && fl.visible) { const p = fl.children.map(c => c.visible ? 1 : 0).join(''); if (p !== W.last) { W.pat[p] = (W.pat[p] || 0) + 1; W.any++; } W.last = p; } else W.last = ''; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    const ps = Snd.popSide.bind(Snd); Snd.popSide = (a, s) => { if (a > 0.45) { if (!(s < 0)) window.__fl.popsB[0]++; if (!(s > 0)) window.__fl.popsB[1]++; } return ps(a, s); }; });
  for (let k = 0; k < 5; k++) { await H.page.keyboard.down('ArrowUp'); await new Promise(r => setTimeout(r, 7000)); await H.page.keyboard.up('ArrowUp'); await new Promise(r => setTimeout(r, 3500)); }
  // (the game's own loop shown a pop in each pipe in turn, the exhaust taken as hot: which ends light)
  const inj = await H.page.evaluate(async () => { const out = {}, fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); try { Object.defineProperty(Snd.logic, 'flK', { get: () => 1, set: () => { }, configurable: true }); } catch (e) { out.err = e.message; }
    for (const s of [1, -1, 0]) { const pat = {}; for (let k = 0; k < 8; k++) { await new Promise(r => setTimeout(r, 260)); Snd.popB = [0, 0]; Snd.popA = 1; Snd.popSide(1, s); await fr(); const fl = G.mesh.flame, p = fl.visible ? fl.children.map(c => c.visible ? 1 : 0).join('') : 'none'; pat[p] = (pat[p] || 0) + 1; } out[s > 0 ? 'first bank' : s < 0 ? 'second bank' : 'one pipe'] = pat; } return out; });
  console.log('injected pops:', JSON.stringify(inj));
  const post = await H.page.evaluate(() => ({ err: window.__err || null, car: G.spec && G.spec.id, mode: G.mesh && G.mesh.flame && G.mesh.flame.userData.mode, ends: G.mesh && G.mesh.flame && G.mesh.flame.children.length, flK: Snd.logic && +(Snd.logic.flK || 0).toFixed(2), af: typeof exAfOf === 'function' ? exAfOf(G.spec) : null, fl: window.__fl, kmh: G.car && Math.round(G.car.u * 3.6), build: SR86_BUILD }));
  console.log(JSON.stringify(post)); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
