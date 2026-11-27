// Round 47: the map maker as the race server sends the page (as on Render: every answer with "Referrer-Policy:
// no-referrer"): the map's tiles must still go out with the page's address as their referrer (OpenStreetMap's tile
// servers answer "Access blocked" without one), and a route found from taps, timed - through the routing service and
// one corridor query, then with the routing service unreachable (the old way, cell by cell). The map services' answers
// come through the test's disk cache (see lib46). node harness/route47.js [site dir]
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), { spawn } = require('child_process'), L = require('./lib46');
const THREE_JS = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'));
const SITE = path.resolve(process.argv[2] || 'work/site47'), sleep = ms => new Promise(r => setTimeout(r, ms));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
(async () => {
  const RS = '/tmp/rs47'; fs.rmSync(RS, { recursive: true, force: true }); fs.mkdirSync(RS + '/data', { recursive: true });
  for (const f of ['server.js', 'index.html']) fs.copyFileSync(path.join(SITE, f), path.join(RS, f)); fs.cpSync(path.join(SITE, 'real'), RS + '/real', { recursive: true });
  fs.symlinkSync(path.join(__dirname, '../node_modules'), RS + '/node_modules');
  const port = 19000 + Math.floor(Math.random() * 900), child = spawn(process.execPath, [RS + '/server.js'], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: RS + '/data' }), stdio: 'ignore' });
  for (let k = 0; k < 60; k++) { try { const r = await fetch('http://127.0.0.1:' + port + '/healthz'); if (r.ok) break; } catch (e) { } await sleep(200); }
  const head = await fetch('http://127.0.0.1:' + port + '/'); console.log('page from the race server:', head.status, 'Referrer-Policy:', head.headers.get('referrer-policy'));
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio', '--window-size=1100,800'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 800 }); const errors = [], tiles = [], asked = []; let osrmOff = false;
  page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  await page.setRequestInterception(true);
  page.on('request', async q => { const u = q.url();
    if (u.startsWith('http://127.0.0.1:' + port)) return q.continue();
    if (/three(\.min)?\.js/.test(u)) return q.respond({ status: 200, contentType: 'text/javascript', body: THREE_JS });
    if (u.startsWith('data:') || u.startsWith('blob:')) return q.continue();
    if (/tile\.openstreetmap\.org/.test(u)) { tiles.push(q.headers().referer || q.headers().Referer || '(none)'); return q.respond({ status: 200, contentType: 'image/png', body: PNG }); }
    if (/routing\.openstreetmap\.de|router\.project-osrm\.org/.test(u) && osrmOff) { asked.push('osrm (off)'); return q.abort('failed'); }
    if (/overpass|maps\.mail\.ru|routing\.openstreetmap\.de|router\.project-osrm\.org|nominatim/.test(u)) { asked.push(u.replace(/^https:\/\/([^/]+).*/, '$1'));
      if (q.method() === 'OPTIONS') return q.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': '*' } });
      const r = await L.netFetch(u, q.method(), q.postData(), q.headers()['content-type'] ? { 'content-type': q.headers()['content-type'] } : null); if (!r) return q.abort('failed');
      return q.respond({ status: r.status, contentType: r.ct, headers: { 'access-control-allow-origin': '*' }, body: r.body }); }
    q.abort(); });
  await page.goto('http://127.0.0.1:' + port + '/#real=new', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => typeof RWMap === 'object' && RWMap.el && !RWMap.el.hidden, { timeout: 120000 }); await sleep(2500);
  console.log('map open; tile requests', tiles.length, 'referrers seen:', JSON.stringify([...new Set(tiles)]));
  // (a there-and-back on the roads above La Bollène, from taps; then the same with the routing service unreachable)
  const run = async (label, pts) => { tiles.length = 0; asked.length = 0;
    await page.evaluate((pts) => { const M = RWMap; M.wp = []; M.kind = 'rt'; M.z = 14; const [x, y] = M.px(pts[0][0], pts[0][1], 14); M.cx = x; M.cy = y; M.changed(); M.draw(); }, pts); await sleep(400);
    const t0 = Date.now();
    if (label.startsWith('with')) for (const [lat, lon] of pts) { const p = await page.evaluate((lat, lon) => { const M = RWMap, r = M.cv.getBoundingClientRect(), [x, y] = M.px(lat, lon, M.z); return [r.left + x - M.cx + M.cv.clientWidth / 2, r.top + y - M.cy + M.cv.clientHeight / 2]; }, lat, lon); await page.mouse.click(p[0], p[1]); await sleep(150); }
    else await page.evaluate((pts) => { RWMap.wp = pts.map(p => p.slice()); RWMap.changed(true); }, pts);
    await sleep(700); console.log('  points on the map', await page.evaluate(() => RWMap.wp.length));
    await page.waitForFunction(() => /km of real roads|No road|No way|could not|slow just now/.test($('#rmSay').textContent), { timeout: 300000 });
    const r = await page.evaluate(() => ({ say: $('#rmSay').textContent, route: RWMap.R ? RWMap.R.pl.length : 0 }));
    console.log(label, ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(r), 'asked', JSON.stringify(asked.reduce((o, h) => (o[h] = (o[h] || 0) + 1, o), {})), 'tile referrers', JSON.stringify([...new Set(tiles)])); };
  await run('with the routing service:', [[43.99318, 7.33674], [43.98484, 7.35154], [43.9720, 7.3760]]);
  osrmOff = true; await page.evaluate(() => { RWRoute.ways.clear(); RWRoute.nodes.clear(); RWRoute.cellW.clear(); RWRoute.cells.clear(); });
  await run('without it (cells):', [[43.99318, 7.33674], [43.98484, 7.35154], [43.9720, 7.3760]]);
  osrmOff = false; await page.evaluate(() => { RWRoute.ways.clear(); RWRoute.nodes.clear(); RWRoute.cellW.clear(); RWRoute.cells.clear(); });
  await run('again, set directly:', [[43.99318, 7.33674], [43.98484, 7.35154], [43.9720, 7.3760]]);
  await page.screenshot({ path: 'work/r47/lap/route_render.jpg', quality: 80 });
  console.log('errors', JSON.stringify(errors.slice(0, 4)), 'net', JSON.stringify(L.stats)); await browser.close(); child.kill();
})();
