// Round 46: Race Friends on real roads, as on the game's website. Two pages, each in its own browser (so each is its
// own player), come from a page server here whose config.js names a race server run here from server.js. The host
// picks one of the game's courses, then a course it made (a pack kept on the host's page only), then the circuit with
// a lap count; the other page joins by the race's code, gets each course (its file, or the host's page over the race
// server's signals), lays it out, is ready, and both race it for a few seconds.
// usage: node mp46.js SITE_DIR SERVER_JS USER_PACK.json [preset] [out.json]
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');
const THREE_JS = fs.readFileSync(path.join(__dirname, '../node_modules/three/build/three.min.js'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const [SITE, SERVER_JS, PACK, PRESET = 'turini', OUT] = process.argv.slice(2);
const t0 = Date.now(), log = [], say = s => { const l = ((Date.now() - t0) / 1000).toFixed(1) + 's ' + s; log.push(l); console.log(l); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOTS = process.env.SHOTS; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const shot = async (P, name) => { if (!SHOTS) return; try { await P.page.screenshot({ path: path.join(SHOTS, name + '.jpg'), type: 'jpeg', quality: 78 }); } catch (e) { } };

async function raceServer() {
  const RS = '/tmp/rs46'; fs.rmSync(RS, { recursive: true, force: true }); fs.mkdirSync(RS + '/data', { recursive: true });
  fs.copyFileSync(SERVER_JS, RS + '/server.js');
  if (process.env.NO_SIG) { let t = fs.readFileSync(RS + '/server.js', 'utf8'); const k = "caps: ['fast', 'sig']"; if (!t.includes(k)) throw new Error('caps not found'); fs.writeFileSync(RS + '/server.js', t.replace(k, 'caps: []')); }
  if (process.env.DEBUG_DROPS) { let t = fs.readFileSync(RS + '/server.js', 'utf8'); const k = "if (budget < 1) { if (++over > 3000) ws.terminate(); return; }";
    if (!t.includes(k)) throw new Error('drop line not found'); t = t.replace(k, "if (budget < 1) { global.__drops = (global.__drops || 0) + 1; if (!global.__dropT) global.__dropT = setInterval(() => { if (global.__drops) { console.log('dropped ' + global.__drops); global.__drops = 0; } }, 1000); if (++over > 3000) ws.terminate(); return; }"); fs.writeFileSync(RS + '/server.js', t); } fs.copyFileSync(path.join(SITE, 'index.html'), RS + '/index.html');
  if (fs.existsSync(path.join(SITE, 'real'))) fs.cpSync(path.join(SITE, 'real'), RS + '/real', { recursive: true });
  fs.symlinkSync(path.join(__dirname, '../node_modules'), RS + '/node_modules');
  const port = 18000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [RS + '/server.js'], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: RS + '/data' }), stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', d => say('server: ' + String(d).trim())); child.stderr.on('data', d => say('server err: ' + String(d).trim()));
  for (let k = 0; k < 50; k++) { try { const r = await fetch('http://127.0.0.1:' + port + '/healthz'); if (r.ok) break; } catch (e) { } await sleep(200); }
  return { port, child, dir: RS };
}
function pageServer(dir, rsPort) {
  dir = path.resolve(dir);
  return new Promise(res => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p === '/config.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end(`window.SR86_SERVER = 'http://127.0.0.1:${rsPort}';`); }
    if (p === '/__pack.json') { r.writeHead(200, { 'content-type': 'application/json' }); return fs.createReadStream(PACK).pipe(r); }
    const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }); s.listen(0, '127.0.0.1', () => res(s)); });
}
async function openPage(url, name) {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=960,600'] });
  const page = await browser.newPage(); await page.setViewport({ width: 960, height: 600 });
  const errors = []; page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 600)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.setRequestInterception(true);
  page.on('request', q => { const u = q.url();
    if (u.startsWith('http://127.0.0.1:')) return q.continue();
    if (/three(\.min)?\.js/.test(u)) return q.respond({ status: 200, contentType: 'text/javascript', body: THREE_JS });
    if (u.startsWith('data:') || u.startsWith('blob:')) return q.continue();
    q.abort(); });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  return { name, browser, page, errors };
}
const until = (P, fn, arg, ms = 60000) => P.page.waitForFunction(fn, { timeout: ms, polling: 250 }, arg);
// (the course as laid out on a page: its points, each to the centimetre, hashed, with its name, length and laps)
const sig = P => P.page.evaluate(() => { const T = G.T, R = x => Math.round(x * 100) / 100; if (!T) return null;
  return { key: T.mpKey, label: T.label, real: !!T.real, n: T.pts.length, cN: T.cN, laps: T.rwRun ? T.rwRun.laps || 0 : 0, kind: T.rwKind || '',
    h: (strHash(JSON.stringify(T.pts.map(p => [R(p.x), R(p.z), R(p.y), R(p.w), p.surf]))) >>> 0).toString(16), notes: T.notes.length }; });
const state = P => P.page.evaluate(() => ({ phase: MP.phase, host: MP.host, state: G.state, cd: G.cd != null ? Math.round(G.cd * 10) / 10 : null, slot: MP.slot, rivals: [...MP.rivals.values()].map(r => ({ ph: r.ph, at: r.at ? 1 : 0, d: G.car ? Math.round(Math.hypot(r.x - G.car.x, r.z - G.car.z)) : null, p: r.p })),
  rdy: MP.rdy, note: ($('#mpNote') || {}).textContent || '', rwNote: ($('#mpRwNote') || {}).textContent || '', go: ($('#go') || {}).textContent || '', car: G.car ? [Math.round(G.car.x), Math.round(G.car.z), Math.round(G.car.hint || 0)] : null }));

async function race(A, B, what) {
  // (the joiner ready, the host starts, both on the grid; the start given; a few seconds driven, each seeing the other)
  await B.page.evaluate(() => MP.go()); const r0 = await B.page.evaluate(() => MP.rdy); say(what + ': joiner ready ' + r0);
  await until(A, () => MP.drivers().some(p => !p.sameTab && p.presence && p.presence.rdy), null, 20000); say(what + ': host sees it');
  await A.page.evaluate(() => MP.go());
  await Promise.all([until(A, () => MP.phase === 'race', null, 30000), until(B, () => MP.phase === 'race', null, 30000)]); say(what + ': both on the grid');
  await Promise.all([until(A, () => MP.rc && MP.rc.go, null, 60000), until(B, () => MP.rc && MP.rc.go, null, 60000)]); say(what + ': start given');
  // (both drivers press the throttle once the countdown is over)
  await Promise.all([until(A, () => G.state === 'run' && G.cd != null && G.cd <= 0, null, 40000).catch(() => null), until(B, () => G.state === 'run' && G.cd != null && G.cd <= 0, null, 40000).catch(() => null)]);
  await Promise.all([A, B].map(P => P.page.keyboard.down('ArrowUp'))); await sleep(6000); await Promise.all([A, B].map(P => P.page.keyboard.up('ArrowUp')));
  await shot(A, 'race_' + what.replace(/\W+/g, '_') + '_host'); await shot(B, 'race_' + what.replace(/\W+/g, '_') + '_joiner');
  const sa = await state(A), sb = await state(B); say(what + ': host ' + JSON.stringify(sa)); say(what + ': joiner ' + JSON.stringify(sb));
  await A.page.evaluate(() => MP.endRace());
  await Promise.all([until(A, () => MP.phase === 'lobby', null, 30000), until(B, () => MP.phase === 'lobby', null, 30000)]);
  for (const P of [A, B]) await P.page.evaluate(() => { const e = $('#mpRes'); if (e && !e.hidden) e.hidden = true; if (G.state !== 'menu') toMenu(); });
  await Promise.all([until(A, () => G.state === 'menu', null, 20000), until(B, () => G.state === 'menu', null, 20000)]); say(what + ': back in the race room');
  return { host: sa, joiner: sb };
}

(async () => {
  const RS = await raceServer(); say('race server on ' + RS.port);
  // (FROM_SERVER: the page as the race server itself sends it, the way it is on Render, its courses from there too)
  const srv = await pageServer(SITE, RS.port), url = process.env.FROM_SERVER ? 'http://127.0.0.1:' + RS.port + '/' : 'http://127.0.0.1:' + srv.address().port + '/'; const res = { preset: PRESET, from: url };
  const [A, B] = await Promise.all([openPage(url, 'host'), openPage(url, 'joiner')]);
  try {
    for (const P of [A, B]) { await until(P, () => typeof MP !== 'undefined' && typeof MPRW !== 'undefined' && typeof Rally !== 'undefined' && $('#mode_mp'), null, 120000); await P.page.evaluate(() => $('#mode_mp').click()); }
    await Promise.all([until(A, () => MP.avail === true, null, 60000), until(B, () => MP.avail === true, null, 60000)]); say('both connected to the race server');
    for (const P of [A, B]) await P.page.evaluate(() => { window.__sl = []; window.__tx = {}; window.__vis = [document.visibilityState, document.hasFocus()];
      const o = MPRW.sig; MPRW.sig = function (mp, from, d) { window.__sl.push([Math.round(performance.now()), 'in', d && d.k, d && d.i]); return o.call(this, mp, from, d); };
      const N = window.__webNet, ws0 = N.ws; if (ws0) { const s0 = ws0.send.bind(ws0); ws0.send = m => { if (typeof m === 'string') { const t = (m.match(/"t":"([a-z]+)"/) || [])[1] || '?', k = (m.match(/"k":"([a-z]+)"/) || [])[1] || '', sec = Math.floor(performance.now() / 1000); const key = t + (k ? ':' + k : ''); window.__tx[key] = window.__tx[key] || {}; window.__tx[key][sec] = (window.__tx[key][sec] || 0) + 1; if (k === 'rwc' || k === 'rwq') window.__sl.push([Math.round(performance.now()), 'out', k, +((m.match(/"i":(\d+)/) || [])[1])]); } return s0(m); }; } });
    await A.page.evaluate(() => MP.hostRace()); const code = await A.page.evaluate(() => MP.code); say('race code ' + code);
    // 1. one of the game's courses
    let tp = Date.now(); await A.page.evaluate(v => MPRW.pick(MP, v), 'p:' + PRESET); await until(A, () => MP.cfg && MPRW.ready(MP.cfg), null, 120000); say('host laid out ' + PRESET + ' in ' + (Date.now() - tp) + ' ms');
    tp = Date.now(); await B.page.evaluate(c => MP.joinCode(c), code); await until(B, () => MP.cfg && MP.cfg.co === 'rw' && MPRW.ready(MP.cfg), null, 120000); res.presetJoinMs = Date.now() - tp; say('joiner laid out ' + PRESET + ' in ' + res.presetJoinMs + ' ms');
    await shot(A, '1_host_preset'); await shot(B, '2_joiner_preset');
    res.presetSig = [await sig(A), await sig(B)]; say('preset course host ' + JSON.stringify(res.presetSig[0])); say('preset course joiner ' + JSON.stringify(res.presetSig[1]));
    if (!process.env.ONLY_USER) res.presetRace = await race(A, B, PRESET);
    if (process.env.NO_SIG) {
      // (a room with no signals, as an artifact's: the host's own course reaches nobody; a driver with the same course
      // kept races it)
      const kept = await A.page.evaluate(async txt => { const K = rwPackIn(txt); await RealUI.keep(K, txt); return { code: K.code, name: K.name }; }, fs.readFileSync(PACK, 'utf8'));
      res.signal = await B.page.evaluate(() => !!(MP.game && MP.game.signal));
      await A.page.evaluate(v => MPRW.pick(MP, v), 'c:' + kept.code); await until(A, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.c && MPRW.ready(MP.cfg), null, 120000);
      await until(B, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.c && !$('#mpRwNote').hidden, null, 60000); await sleep(1500);
      res.noSig = await B.page.evaluate(() => { MP.go(); return { note: $('#mpRwNote').textContent, go: $('#go').textContent, dis: $('#go').disabled, rdy: MP.rdy, ready: MPRW.ready(MP.cfg) }; }); await shot(B, '8_joiner_no_signals');
      say('no signals: joiner ' + JSON.stringify(res.noSig));
      tp = Date.now(); await B.page.evaluate(async txt => { const K = rwPackIn(txt); await RealUI.keep(K, txt); MP.enterMenu(); }, fs.readFileSync(PACK, 'utf8'));
      await until(B, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.c && MPRW.ready(MP.cfg), null, 120000); res.keptMs = Date.now() - tp;
      res.userSig = [await sig(A), await sig(B)]; say('joiner with the course kept laid it out in ' + res.keptMs + ' ms: ' + JSON.stringify(res.userSig));
      res.userRace = await race(A, B, 'kept course, no signals');
      throw new Error('done (no signals)');
    }
    // 2. a course the host made: kept on the host's page only
    const kept = await A.page.evaluate(async txt => { const K = rwPackIn(txt); await RealUI.keep(K, txt); return { code: K.code, name: K.name, kind: K.kind }; }, fs.readFileSync(PACK, 'utf8')); say('host kept its course ' + JSON.stringify(kept));
    res.joinerHadIt = await B.page.evaluate(async c => !!(await RWDB.get('pack', c)), kept.code);
    const opts = await A.page.evaluate(async () => (await MPRW.options()).map(o => o.v)); say('host course list ' + JSON.stringify(opts));
    tp = Date.now(); await A.page.evaluate(v => MPRW.pick(MP, v), 'c:' + kept.code); await until(A, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.c && MPRW.ready(MP.cfg), null, 120000); say('host laid out its course in ' + (Date.now() - tp) + ' ms; cfg.rw ' + JSON.stringify(await A.page.evaluate(() => MP.cfg.rw)));
    tp = Date.now(); const prog = [];
    for (let k = 0; k < 600; k++) { const s = await B.page.evaluate(() => ({ got: MPRW.get ? [MPRW.get.next, MPRW.get.n] : null, ready: !!(MP.cfg && MP.cfg.rw && MP.cfg.rw.c && MPRW.ready(MP.cfg)), note: ($('#mpRwNote') || {}).textContent || '', go: ($('#go') || {}).textContent || '', dis: ($('#go') || {}).disabled }));
      if (!prog.length || JSON.stringify(s) !== JSON.stringify(prog[prog.length - 1].s)) prog.push({ t: Date.now() - tp, s }); if (s.ready) break;
      if (s.got && s.got[1] && s.got[0] > s.got[1] / 2 && !prog.shot) { prog.shot = 1; await shot(B, '3_joiner_getting'); await shot(A, '4_host_own_course'); } await sleep(250); }
    res.transfer = prog; res.userJoinMs = Date.now() - tp; say('joiner got and laid out the course in ' + res.userJoinMs + ' ms; ' + prog.length + ' steps; last ' + JSON.stringify(prog[prog.length - 1]));
    for (const P of [A, B]) res['dbg_' + P.name] = await P.page.evaluate(() => ({ vis: window.__vis, vis2: [document.visibilityState, document.hasFocus()], sl: window.__sl.slice(0, 400), tx: window.__tx }));
    res.joinerKeptIt = await B.page.evaluate(async c => { const e = await RWDB.get('pack', c); return e ? { name: e.name, kind: e.kind, km: e.km } : null; }, kept.code);
    await shot(B, '5_joiner_has_it');
    res.userSig = [await sig(A), await sig(B)]; say('user course host ' + JSON.stringify(res.userSig[0])); say('user course joiner ' + JSON.stringify(res.userSig[1]));
    res.userRace = await race(A, B, 'user course');
    // 3. the circuit, three laps
    await A.page.evaluate(() => MPRW.pick(MP, 'p:monaco')); await A.page.evaluate(() => MP.setCfg({ lp: 3 }));
    await Promise.all([until(A, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.p === 'monaco' && MP.cfg.lp === 3 && MPRW.ready(MP.cfg), null, 120000), until(B, () => MP.cfg && MP.cfg.rw && MP.cfg.rw.p === 'monaco' && MP.cfg.lp === 3 && MPRW.ready(MP.cfg), null, 120000)]);
    await shot(A, '6_host_circuit'); await shot(B, '7_joiner_circuit');
    res.loopSig = [await sig(A), await sig(B)]; say('circuit host ' + JSON.stringify(res.loopSig[0])); say('circuit joiner ' + JSON.stringify(res.loopSig[1]));
    res.loopRace = await race(A, B, 'circuit');
    // 4. the host's course again: the joiner has it now, so nothing is sent
    await B.page.evaluate(() => { window.__got = 0; const o = MPRW.ask; MPRW.ask = function (...a) { window.__got++; return o.apply(this, a); }; });
    tp = Date.now(); await A.page.evaluate(v => MPRW.pick(MP, v), 'c:' + kept.code);
    await Promise.all([until(A, c => MP.cfg && MP.cfg.rw && MP.cfg.rw.c === c && MPRW.ready(MP.cfg), kept.code, 120000), until(B, c => MP.cfg && MP.cfg.rw && MP.cfg.rw.c === c && MPRW.ready(MP.cfg), kept.code, 120000)]);
    res.again = { ms: Date.now() - tp, asks: await B.page.evaluate(() => window.__got) }; say('the course again: both laid out in ' + res.again.ms + ' ms, the joiner asked for pieces ' + res.again.asks + ' times');
    // 5. the host leaves: the other driver takes the race on, and a third, joining then, gets the course from that page
    const C = await openPage(url, 'third'); try {
      await until(C, () => typeof MP !== 'undefined' && typeof MPRW !== 'undefined' && $('#mode_mp'), null, 120000); await C.page.evaluate(() => $('#mode_mp').click()); await until(C, () => MP.avail === true, null, 60000);
      await A.page.evaluate(() => MP.leave()); say('host left');
      await until(B, () => MP.host === true, null, 60000); say('joiner now hosts: ' + JSON.stringify(await B.page.evaluate(() => ({ host: MP.host, co: MP.cfg && MP.cfg.co, rw: MP.cfg && MP.cfg.rw }))));
      tp = Date.now(); await C.page.evaluate(c => MP.joinCode(c), code);
      await until(C, c => MP.cfg && MP.cfg.rw && MP.cfg.rw.c === c && MPRW.ready(MP.cfg), kept.code, 180000); res.handOnMs = Date.now() - tp;
      res.handOnSig = [await sig(B), await sig(C)]; say('third page got the course from the new host and laid it out in ' + res.handOnMs + ' ms: ' + JSON.stringify(res.handOnSig[1]) + ' (new host ' + res.handOnSig[0].h + ')');
      res.handOnRace = await race(B, C, 'after the host left');
      // 6. back to a seeded stage: the room's ordinary stages still work after real ones
      await B.page.evaluate(() => MP.setCfg({ co: '', rw: null, sd: '777' }));
      await Promise.all([until(B, () => G.T && !G.T.real && G.T.mpKey && G.T.seed == 777, null, 60000), until(C, () => G.T && !G.T.real && G.T.mpKey && G.T.seed == 777, null, 60000)]);
      res.seedSig = [await sig(B), await sig(C)]; say('seeded host ' + JSON.stringify(res.seedSig[0])); say('seeded joiner ' + JSON.stringify(res.seedSig[1]));
    } finally { res.errors3 = C.errors.slice(0, 8); await C.browser.close(); }
  } catch (e) { say('FAILED ' + (e && e.stack || e)); res.fail = String(e && e.message || e); for (const P of [A, B]) try { say(P.name + ' ' + JSON.stringify(await state(P))); } catch (e2) { } }
  res.errors = { host: A.errors.slice(0, 8), joiner: B.errors.slice(0, 8) }; say('errors ' + JSON.stringify(res.errors));
  res.log = log; if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  await A.browser.close(); await B.browser.close(); srv.close(); RS.child.kill('SIGTERM'); process.exit(0);
})();
