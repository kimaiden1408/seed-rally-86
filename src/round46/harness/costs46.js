// Round 46: where a stage's triangles and draw calls go, from its start (the game's camera there, its fog as set): each
// group of the stage's meshes hidden in turn and the frame drawn again, the difference its cost. Groups: the ground
// (and the land beyond), the road, the map's houses, trees and plants (drawn many times over), the real road's own
// meshes by kind (as rw_draw marks them), and the rest. node harness/costs46.js [pack|seed:N]...
const L = require('./lib46'), fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { w: 960, h: 540 }), page = H.page;
  await page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 180000 }); await sleep(2500);
  const lv = process.env.GFX || 'high'; await page.evaluate(lv => { Gfx.pref = lv; Gfx.level = lv; try { Gfx.apply && Gfx.apply(); } catch (e) { } }, lv); console.log('graphics', await page.evaluate(() => Gfx.level));
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('seed:')) await page.evaluate(a => { const [s, reg] = a.split(':'); COND.time = 'midday'; COND.wx = 'clear'; COND.reg = reg || ''; FIRST.stage = false; setSeed(s, { force: true }); COND.reg = ''; }, arg.slice(5));
    else { const txt = fs.readFileSync('work/r46/packs/' + arg + '.json', 'utf8'); await page.evaluate(txt => { COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt); }
    await page.evaluate(() => startRun()); await sleep(5000);
    const r = await page.evaluate(() => {
      const kindOf = m => { if (m.userData && m.userData.rw) return 'rw:' + m.userData.rw; if (m.isInstancedMesh) return 'instanced'; const M = Array.isArray(m.material) ? m.material[0] : m.material;
        if (M && M.onBeforeCompile === landDetailShader) return 'ground'; if (M && M.userData && M.userData.kind) return 'road'; if (M && M.map && TEX && Object.values(TEX).includes(M.map) && /atlas/i.test(Object.keys(TEX).find(k => TEX[k] === M.map) || '')) return 'houses';
        if (M && M.vertexColors && M.map) return 'baked+tex'; if (M && M.vertexColors) return 'baked'; return 'other'; };
      const groups = new Map(); stageGroup.traverse(o => { if (!o.isMesh && !o.isInstancedMesh) return; const k = kindOf(o); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); });
      const draw = () => { cullChunks(); renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, camera); const i = renderer.info.render; const o = { tris: i.triangles, calls: i.calls }; renderer.info.autoReset = true; return o; };
      const all = draw(), out = { all, n: {} };
      for (const [k, L] of groups) { const vis = L.map(m => m.visible), cull = typeof cullChunks === 'function'; L.forEach(m => { m.userData._v = m.visible; });
        const saveCull = window.cullChunks; window.__hide = new Set(L); const orig = cullChunks; // (hide the group after the game's own culling has set what shows)
        cullChunks(); L.forEach(m => m.visible = false); renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, camera); const i = renderer.info.render; const w = { tris: i.triangles, calls: i.calls }; renderer.info.autoReset = true;
        L.forEach((m, j) => m.visible = vis[j]); out.n[k] = { meshes: L.length, tris: all.tris - w.tris, calls: all.calls - w.calls }; }
      { cullChunks(); const v = stageGroup.visible; stageGroup.visible = false; renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, camera); const i = renderer.info.render; out.n['(not stage)'] = { meshes: 0, tris: i.triangles, calls: i.calls }; renderer.info.autoReset = true; stageGroup.visible = v; }
      { let inst = 0, n = 0; stageGroup.traverse(o => { if (o.isInstancedMesh && o.visible) { inst += o.count; n++; } }); out.n['(instances)'] = { meshes: n, tris: inst, calls: 0 }; }
      return out; });
    console.log(arg.padEnd(12), JSON.stringify(r.all), Object.entries(r.n).sort((a, b) => b[1].tris - a[1].tris).map(([k, v]) => `${k} ${v.tris}t/${v.calls}c (${v.meshes})`).join(' | '));
    await page.evaluate(() => { try { G.state = 'menu'; } catch (e) { } });
  }
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
