// Round 48: a real course seen from the driver's seat every EVERY metres (default 300): the camera 1.15 m over the
// road, a third of the way across from its middle to its right edge, looking 45 m ahead. Pictures into OUT; with a
// sheet of them (harness/sheet.py). node harness/sweep48.js <pack> [every]   env PAGE, OUT (default work/r48/sweep), TAG
const L = require('./lib46'), { shot } = require('./shot46'), fs = require('fs'), { execFileSync } = require('child_process');
(async () => {
  const [name, ev] = process.argv.slice(2), EVERY = +(ev || 300), OUT = process.env.OUT || 'work/r48/sweep', tag = process.env.TAG || name; fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site47/index.html', { w: 960, h: 540 });
  await H.page.waitForFunction(() => typeof rwStageOf === 'function' && typeof startRun === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 1500));
  const txt = fs.readFileSync((process.env.PACKS || 'work/r46/packs') + '/' + name + '.json', 'utf8');
  await H.page.evaluate((txt) => { Gfx.pref = 'high'; Gfx.level = 'high'; COND.time = 'midday'; COND.wx = 'clear'; const K = rwPackIn(txt), T = rwStageOf(K); rwUseStage(T); }, txt);
  await H.page.mouse.click(480, 270); await H.page.evaluate(() => startRun()); await new Promise(r => setTimeout(r, 5000));
  const n = await H.page.evaluate(() => G.T.cN || G.T.pts.length), files = [];
  for (let m = 40; m < (n - 30) * 2; m += EVERY) {
    const c = await H.page.evaluate((m) => { const T = G.T, P = T.pts, i = Math.round(m / STEP), p = P[i], k = Math.min(P.length - 1, i + Math.round(45 / STEP)), q = P[k], lx = Math.cos(p.h), lz = -Math.sin(p.h);
      return { x: p.x - lx * p.w * 0.17, y: p.y + 1.15, z: p.z - lz * p.w * 0.17, tx: q.x, ty: q.y + 0.9, tz: q.z, fov: 62 }; }, m);
    const f = `${OUT}/${tag}_${String(m).padStart(5, '0')}.jpg`; await shot(H.page, c, f); files.push(f); }
  execFileSync('python3', ['harness/sheet.py', `${OUT}/${tag}_sheet.jpg`, '4', '480', '270', ...files]);
  console.log('shots', files.length, `${OUT}/${tag}_sheet.jpg`); console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
