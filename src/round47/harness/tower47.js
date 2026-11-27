// Round 47: the timing tower of a race on a real circuit, from line times as the other drivers' pages send them (their
// presence's lt), stubbed into the race: the rows, their last and best laps, their colours, the gaps. node harness/tower47.js
const L = require('./lib46'), fs = require('fs');
(async () => {
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 1100, h: 620 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync('work/r46/packs/monaco.json', 'utf8');
  await H.page.evaluate((txt) => { const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
  await H.page.mouse.click(550, 310); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 3500));
  const R = await H.page.evaluate(() => { window.requestAnimationFrame = () => 0; G.state = 'run';
    // (my own laps: two and a sector, at these line times)
    const mine = [45.0, 95.0, 143.5, 184.0, 233.0, 280.0, 321.0];
    const feed = []; Object.assign(MP, { phase: 'race', slot: 0, rc: {}, peers: [{ peer: 'p1', presence: { lt: [44.2, 93.1, 141.0, 181.2, 229.9, 276.4, 316.0, 364.2] } }, { peer: 'p2', presence: { lt: [47.9, 99.0, 150.2, 193.0] } }, { peer: 'p3', presence: { lt: [46.0, 97.5, 'x'] } }] });
    MP.F = [{ peer: 'p1', name: 'Ann', k: 1, ph: 'run' }, { me: true, name: 'Me', k: 0, ph: 'run' }, { peer: 'p2', name: 'Bo', k: 2, ph: 'run' }, { peer: 'p3', name: 'Cy', k: 3, ph: 'out' }];
    MP.raceT = (rc, k, t) => t; MP.feedAdd = (who, s) => feed.push(who + ': ' + s);
    RWLap.lt = mine.slice(); RWLap.tower(MP);
    const rows = [...document.querySelectorAll('#mpStand > div')].map(d => [...d.children].map(c => c.textContent + (c.className && /l[pgy]/.test(c.className) ? '[' + c.className.replace(/^(lt|bt) ?/, '') + ']' : '')).join(' | '));
    // (my own sector popup's place in the race at my last line: P? of those who have crossed it)
    RWLap.crossed(6); const pop = $('#split').textContent;
    return { rows, feed, cls: $('#mpStand').className, pop, bestTxt: RWLap.bestTxt({ me: true }), bestTxtAnn: RWLap.bestTxt({ peer: 'p1' }) }; });
  for (const r of R.rows) console.log(r); console.log('feed', JSON.stringify(R.feed)); console.log('class', R.cls, '| popup', R.pop, '| results: me', R.bestTxt, '| Ann', R.bestTxtAnn);
  await H.page.screenshot({ path: 'work/r47/lap/tower.jpg', quality: 85 });
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5))); await H.close();
})();
