// Round 46 harness: as lib.js, but the map services a real-roads page asks for are answered: from a cache on disk when
// they were fetched before, else fetched from Node through the session's proxy and kept (so tests repeat exactly and the
// public servers are asked once). opt.net: true to allow them; opt.offline: true to answer only from the cache.
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const THREE_JS = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.json': 'application/json', '.gz': 'application/gzip' };
const CACHE = path.join(__dirname, '../work/r46/netcache');
const HOSTS = /^https:\/\/(overpass-api\.de|maps\.mail\.ru|overpass\.kumi\.systems|overpass\.private\.coffee|tiles\.mapterhorn\.com|s3\.amazonaws\.com\/elevation-tiles-prod|tile\.openstreetmap\.org|nominatim\.openstreetmap\.org|routing\.openstreetmap\.de|router\.project-osrm\.org)\//;
const stats = { hit: 0, miss: 0, fail: 0, blocked: 0 };
function serve(file) {
  const dir = path.dirname(path.resolve(file)), index = path.basename(file);
  return new Promise(res => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/' + index; const f = path.join(dir, p);
    if (p === '/config.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end(''); }
    if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }); s.listen(0, '127.0.0.1', () => res(s)); });
}
async function netFetch(url, method, body, headers) {
  // (every Overpass server the page may ask is answered by the one this session reaches, the query the same)
  if (/^https:\/\/(overpass-api\.de|overpass\.kumi\.systems|overpass\.private\.coffee)\/api\/interpreter/.test(url)) url = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
  const key = crypto.createHash('sha256').update(method + ' ' + url + '\n' + (body || '')).digest('hex').slice(0, 32), fb = path.join(CACHE, key + '.bin'), fm = path.join(CACHE, key + '.json');
  if (fs.existsSync(fb) && fs.existsSync(fm)) { stats.hit++; const m = JSON.parse(fs.readFileSync(fm)); return { status: m.status, ct: m.ct, body: fs.readFileSync(fb) }; }
  if (module.exports.offline) { stats.fail++; return null; }
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const r = await fetch(url, { method, body: body || undefined, headers: Object.assign({ 'user-agent': 'SeedRally86-test/46 (game development test harness)' }, headers || {}), signal: AbortSignal.timeout(180000) });
      const buf = Buffer.from(await r.arrayBuffer()), ct = r.headers.get('content-type') || 'application/octet-stream';
      if ((r.status === 429 || r.status >= 500 || (/overpass/.test(url) && !/json/.test(ct))) && attempt < 2) { await new Promise(z => setTimeout(z, 4000 * (attempt + 1))); continue; }
      if (r.status === 200 || r.status === 404) { fs.writeFileSync(fb, buf); fs.writeFileSync(fm, JSON.stringify({ url, method, status: r.status, ct, n: buf.length })); }
      stats.miss++; return { status: r.status, ct, body: buf };
    } catch (e) { if (attempt === 2) { stats.fail++; return null; } await new Promise(z => setTimeout(z, 3000)); } }
  return null;
}
async function open(file, opt = {}) {
  const srv = await serve(file), port = srv.address().port; module.exports.offline = !!opt.offline;
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=' + (opt.w || 1280) + ',' + (opt.h || 720)] });
  const page = await browser.newPage(); await page.setViewport({ width: opt.w || 1280, height: opt.h || 720 });
  const errors = [], reqs = []; page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 800))); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); if (opt.log) console.log('[page]', m.text().slice(0, 600)); });
  await page.setRequestInterception(true);
  page.on('request', async q => { const u = q.url();
    if (u.startsWith('http://127.0.0.1:' + port)) return q.continue();
    if (/three(\.min)?\.js/.test(u)) return q.respond({ status: 200, contentType: 'text/javascript', body: THREE_JS });
    if (u.startsWith('data:') || u.startsWith('blob:')) return q.continue();
    if (opt.net && HOSTS.test(u)) { reqs.push(u.slice(0, 160));
      if (q.method() === 'OPTIONS') return q.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': '*' } });
      const r = await netFetch(u, q.method(), q.postData(), q.headers()['content-type'] ? { 'content-type': q.headers()['content-type'] } : null);
      if (!r) return q.abort('failed');
      return q.respond({ status: r.status, contentType: r.ct, headers: { 'access-control-allow-origin': '*' }, body: r.body }); }
    q.abort(); });
  await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load', timeout: 180000 });
  return { browser, page, errors, reqs, stats, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { open, netFetch, stats, offline: false };
