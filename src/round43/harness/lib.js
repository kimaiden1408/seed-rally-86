// Shared harness: opens a build of the game page in headless Chrome with the 3D library served from disk and every
// other outside request refused, so nothing on the network is touched.
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), http = require('http');
const THREE_JS = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mp3': 'audio/mpeg' };
// serve(dir, index): a local server for one build (the artifact build has its own .js files next to index.html)
function serve(file) {
  const dir = path.dirname(path.resolve(file)), index = path.basename(file);
  return new Promise(res => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/' + index; const f = path.join(dir, p);
    if (p === '/config.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end(''); }
    if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }); s.listen(0, '127.0.0.1', () => res(s)); });
}
async function open(file, opt = {}) {
  const srv = await serve(file), port = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=' + (opt.w || 1280) + ',' + (opt.h || 720)] });
  const page = await browser.newPage(); await page.setViewport({ width: opt.w || 1280, height: opt.h || 720 });
  const errors = []; page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 600))); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); if (opt.log) console.log('[page]', m.text().slice(0, 400)); });
  await page.setRequestInterception(true);
  page.on('request', q => { const u = q.url();
    if (u.startsWith('http://127.0.0.1:' + port)) return q.continue();
    if (/three(\.min)?\.js/.test(u)) return q.respond({ status: 200, contentType: 'text/javascript', body: THREE_JS });
    if (u.startsWith('data:') || u.startsWith('blob:')) return q.continue();
    q.abort(); });
  await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load', timeout: 120000 });
  return { browser, page, errors, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { open };
