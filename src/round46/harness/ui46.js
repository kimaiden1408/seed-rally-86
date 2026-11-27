// Round 46: the Real roads tab as a player uses it: the tab, a course of the game's opened, the map opened, a course's
// points put down by tapping, its route found, built from the map, kept and laid out. Pictures of each step.
const L = require('./lib46'), fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site46/index.html', { net: true, w: 1100, h: 760, log: !!process.env.LOG });
  const page = H.page; await page.waitForFunction(() => typeof RealUI === 'object' && typeof G !== 'undefined' && G.T, { timeout: 180000 }); await sleep(2500);
  const shot = async n => page.screenshot({ path: `work/r46/ui_${n}.png` });
  await page.evaluate(() => { COND.time = 'midday'; COND.wx = 'clear'; });
  await page.click('#mode_real'); await sleep(1500); await shot('1_tab');
  const tab = await page.evaluate(() => ({ mode: Rally.mode, rows: [...document.querySelectorAll('#realList .realPick')].map(b => b.innerText.replace(/\s+/g, ' ')), note: $('#realNote').innerText, go: $('#go').textContent }));
  console.log('tab', JSON.stringify(tab));
  // (the game's Turini course)
  await page.evaluate(() => { const b = [...document.querySelectorAll('#realList .realPick')].find(e => /Turini/.test(e.innerText)); b.click(); });
  await page.waitForFunction(() => G.T && G.T.real && G.T.real.name, { timeout: 180000 }); await sleep(3000); await shot('2_turini');
  const st = await page.evaluate(() => ({ name: G.T.real.name, km: (G.T.length / 1000).toFixed(2), type: $('#stageType').textContent, len: $('#stageLen').textContent, note: $('#realNote').innerText, hash: location.hash, go: $('#go').textContent }));
  console.log('turini', JSON.stringify(st));
  // (the map: a course of its own, there and back, two taps)
  await page.click('#realNew'); await sleep(1500);
  await page.evaluate(() => { const M = RWMap; M.wp = []; M.kind = 'p2p'; M.z = 15; const [x, y] = M.px(43.989, 7.343, 15); M.cx = x; M.cy = y; M.changed(); M.draw(); });
  await page.click('#rmK_rt'); await sleep(300);
  const tap = async (lat, lon) => { const p = await page.evaluate((lat, lon) => { const M = RWMap, r = M.cv.getBoundingClientRect(), [x, y] = M.px(lat, lon, M.z); return [r.left + x - M.cx + M.cv.clientWidth / 2, r.top + y - M.cy + M.cv.clientHeight / 2]; }, lat, lon); await page.mouse.click(p[0], p[1]); await sleep(400); };
  await tap(43.99318, 7.33674); await tap(43.98484, 7.35154);
  await page.waitForFunction(() => /km/.test($('#rmSay').textContent) || /No |could not/.test($('#rmSay').textContent), { timeout: 240000 }); await sleep(2500); await shot('3_map');
  console.log('map', JSON.stringify(await page.evaluate(() => ({ say: $('#rmSay').textContent, wp: RWMap.wp.length, kind: RWMap.kind, route: RWMap.R ? RWMap.R.pl.length : 0, tiles: RWMap.T.size }))));
  await page.click('#rmBuild');
  await page.waitForFunction(() => RWMap.el.hidden || /could not|too long|No heights/.test($('#rmSay').textContent), { timeout: 600000 }); await sleep(1000);
  await page.waitForFunction(() => G.T && G.T.real && G.T.rwKind === 'rt', { timeout: 240000 }); await sleep(3000); await shot('4_built');
  console.log('built', JSON.stringify(await page.evaluate(async () => ({ name: G.T.real.name, kind: G.T.rwKind, km: (G.T.length / 1000).toFixed(2), rows: [...document.querySelectorAll('#realList .realPick')].map(b => b.innerText.replace(/\s+/g, ' ')), kept: (await RWDB.keys('pack')).length, hash: location.hash }))));
  // (a language other than English: the tab's words)
  await page.evaluate(() => I18N.set('ko', true)); await sleep(800); await shot('5_ko');
  console.log('ko', JSON.stringify(await page.evaluate(() => ({ tab: $('#mode_real').textContent, head: $('#realHead').textContent, rows: [...document.querySelectorAll('#realList .realPick')].slice(0, 2).map(b => b.innerText.replace(/\s+/g, ' ')), btn: $('#realNew').textContent }))));
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6)), 'net', JSON.stringify(H.stats));
  await H.close();
})();
