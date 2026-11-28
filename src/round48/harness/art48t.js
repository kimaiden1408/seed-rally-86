// Round 48 (from round 46's): the artifact's page (no map reachable): the Real roads tab with the game's courses, each opened and laid out
const L = require('./lib46');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const H = await L.open('work/art48/index.html', { net: false, w: 1000, h: 700 }), page = H.page;
  await page.waitForFunction(() => typeof RealUI === 'object' && typeof G !== 'undefined' && G.T, { timeout: 180000 }); await sleep(2000);
  await page.evaluate(() => { COND.time = 'midday'; COND.wx = 'clear'; }); await page.click('#mode_real'); await sleep(1200);
  console.log('tab', JSON.stringify(await page.evaluate(() => ({ art: !!window.SR86_ARTIFACT, offline: rwOffline(), newHidden: $('#realNew').hidden, rows: [...document.querySelectorAll('#realList .realPick')].length, note: $('#realNote').innerText }))));
  for (const name of ['Turini', 'Bollène', 'Monaco']) {
    const t0 = Date.now(); await page.evaluate(n => { const b = [...document.querySelectorAll('#realList .realPick')].find(e => e.innerText.includes(n)); b.click(); }, name);
    await page.waitForFunction(n => G.T && G.T.real && G.T.label && G.T.label.includes(n), { timeout: 240000 }, name); await sleep(1500);
    console.log(name, JSON.stringify(await page.evaluate(() => ({ kind: G.T.rwKind, km: (G.T.length / 1000).toFixed(2), laps: G.T.rwLaps, facts: $('#stageType').textContent + ' / ' + $('#stageLen').textContent, stats: G.T.rwStats }))), 'ms', Date.now() - t0);
  }
  await page.screenshot({ path: 'work/r46/art_menu.png' });
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 6)), 'reqs', H.reqs.length);
  await H.close();
})();
