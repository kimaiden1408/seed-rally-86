// Seed Rally 86 on its own website: this runs the race rooms, the players' names and the shared board of stage times,
// and serves the game page too (index.html; the config.js beside it tells a page kept elsewhere, as on GitHub Pages,
// where this server is, while the page served here talks to this server). Start it with "npm install" and then
// "npm start". Settings, all optional, from the environment:
//   PORT         the port to listen on (8080 when not set; hosting services set it themselves)
//   DATA_DIR     the folder the board and the names are saved in (a folder named data next to this file when not set)
//   MAX_PLAYERS  how many pages may be connected at once (500 when not set)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080;
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const MAX_PLAYERS = +process.env.MAX_PLAYERS || 500;
const PER_IP = 32;              // pages one address may have connected (a school or an office shares one)
const GRACE = 20000;            // ms a page whose connection broke keeps its place in its rooms
const ROOM_MAX = 16;            // pages in one race room
const ROOMS_PER = 8;            // race rooms one page may be in at once
const PRES_MAX = 4096;          // bytes of one page's presence in a room
const RATE = 60, BURST = 120;   // messages a second a page may send, and in a burst
const DOC_MAX = 48 * 1024, TIMES_MAX = 5000, TIMES_BYTES = 3 * 1024 * 1024; // the board: one player's times, players, all
const LOBBY = '~lobby', ROOM_RE = /^[a-z0-9][a-z0-9_.-]{0,47}$/, KEY_RE = /^[a-km-np-z2-9]{24}$/, UID_RE = /^u[a-km-np-z2-9]{15}$/;
const ABC = 'abcdefghijkmnpqrstuvwxyz23456789';
const rnd = n => { let s = ''; for (const x of crypto.randomBytes(n)) s += ABC[x & 31]; return s; };
// a player is known by a secret key their browser made and keeps; the id everyone sees is drawn from it, so nobody can
// post times as someone else, and the server keeps no passwords
const uidOf = key => { const h = crypto.createHash('sha256').update('sr86:' + key).digest(); let s = 'u'; for (let i = 0; i < 15; i++) s += ABC[h[i] & 31]; return s; };
const cleanName = s => String(typeof s === 'string' ? s : '').replace(/[\u0000-\u001f\u007f-\u009f­؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁯ㅤ﻿ﾠ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const badKey = k => typeof k !== 'string' || !k.length || k.length > 32 || k === '__proto__' || k === 'constructor' || k === 'prototype';
const depth = (v, d = 0) => { if (d > 8 || !v || typeof v !== 'object') return d; let m = d + 1; for (const x of Array.isArray(v) ? v : Object.values(v)) { m = Math.max(m, depth(x, d + 1)); if (m > 8) break; } return m; };

// ---- the board of stage times, and the names of the players on it, kept on disk ----
// (on a host whose disk is wiped when it restarts, each player's page sends its own times back when it next connects)
// A player's times as the game writes them: { runs: { stage key: { t: seconds, car: car id, at: when, lv: the assists
// preset driven with } } }. A record
// grown too big keeps its latest times
function checkTimes(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x) || !x.runs || typeof x.runs !== 'object' || Array.isArray(x.runs)) return null;
  const list = []; let k = 0;
  for (const [key, r] of Object.entries(x.runs)) {
    if (++k > 2000 || !/^[0-9A-Za-z_.~@-]{1,64}$/.test(key) || key === '__proto__' || !r || typeof r !== 'object') return null;
    const t = r.t, car = r.car, at = r.at;
    if (typeof t !== 'number' || !(t >= 5 && t < 1e5) || typeof car !== 'string' || !/^[a-z0-9_]{1,24}$/.test(car) || typeof at !== 'number' || !(at >= 0 && at < 1e14)) return null;
    // (the difficulty level the time was driven on, when the game says: kept as it is if it is a plain word)
    const lv = typeof r.lv === 'string' && /^[a-z]{1,12}$/.test(r.lv) ? r.lv : null;
    list.push([key, lv ? { t: Math.round(t * 1000) / 1000, car, at: Math.round(at), lv } : { t: Math.round(t * 1000) / 1000, car, at: Math.round(at) }]);
  }
  list.sort((a, b) => b[1].at - a[1].at);
  const runs = {}; let n = 10, last = 0;
  for (const [key, r] of list) { const add = Buffer.byteLength(JSON.stringify(key) + JSON.stringify(r)) + 2; if (n + add > DOC_MAX) break; runs[key] = r; n += add; last = Math.max(last, r.at); }
  const d = { runs }; return { d, n: Buffer.byteLength(JSON.stringify(d)), last };
}
fs.mkdirSync(DATA, { recursive: true });
const readJson = f => { try { const o = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } };
const times = new Map(), names = new Map(), online = new Map(); let timesBytes = 0;
{ const T = readJson('times.json'), N = readJson('names.json');
  for (const [id, d] of Object.entries(T)) { const c = UID_RE.test(id) && checkTimes(d); if (!c || times.size >= TIMES_MAX || timesBytes + c.n > TIMES_BYTES) continue; times.set(id, c); timesBytes += c.n; const nm = cleanName(N[id]); if (nm) names.set(id, nm); } }
let saveT = null;
const save = () => { if (!saveT) saveT = setTimeout(flushSave, 3000); };
function flushSave() {
  clearTimeout(saveT); saveT = null; const T = {}, N = {};
  for (const [id, c] of times) { T[id] = c.d; const nm = names.get(id); if (nm) N[id] = nm; }
  for (const [f, o] of [['times.json', T], ['names.json', N]]) { const p = path.join(DATA, f);
    try { fs.writeFileSync(p + '.tmp', JSON.stringify(o)); fs.renameSync(p + '.tmp', p); } catch (e) { console.error('Could not save ' + f + ': ' + e.message); } }
}
// a player's times kept (when the board is full, the players whose latest time is oldest make room)
function storeTimes(uid, c) {
  const had = times.get(uid), gone = []; if (had) { times.delete(uid); timesBytes -= had.n; }
  while (times.size && (times.size >= TIMES_MAX || timesBytes + c.n > TIMES_BYTES)) {
    let old = null; for (const e of times) if (!old || e[1].last < old[1].last) old = e;
    times.delete(old[0]); timesBytes -= old[1].n; if (!online.get(old[0])) names.delete(old[0]); gone.push(old[0]);
  }
  times.set(uid, c); timesBytes += c.n; save();
  return gone;
}

// ---- the page ----
// (sent compressed: kept ready as brotli and gzip, from the files made with it when they match it, or made here)
const PAGE = path.join(__dirname, 'index.html');
const page = (() => {
  const raw = fs.readFileSync(PAGE), etag = '"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 20) + '"';
  const ready = (ext, unzip) => { try { const b = fs.readFileSync(PAGE + ext); if (unzip(b).equals(raw)) return b; } catch (e) { } return null; };
  const br = ready('.br', zlib.brotliDecompressSync) || zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
  const gz = ready('.gz', zlib.gunzipSync) || zlib.gzipSync(raw, { level: 9 });
  return { raw, br, gz, etag };
})();
const HEAD = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const stats = { pages: 0, bytes: 0, most: 0 };
const server = http.createServer((req, res) => {
  const u = (req.url || '/').split('?')[0], head = Object.assign({}, HEAD);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, Object.assign(head, { Allow: 'GET, HEAD' })); res.end(); return; }
  if (u === '/' || u === '/index.html') {
    Object.assign(head, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ETag: page.etag, Vary: 'Accept-Encoding' });
    if ((req.headers['if-none-match'] || '').split(/\s*,\s*/).includes(page.etag)) { res.writeHead(304, head); res.end(); return; }
    const ae = String(req.headers['accept-encoding'] || ''), enc = /\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : '';
    const body = enc === 'br' ? page.br : enc === 'gzip' ? page.gz : page.raw;
    if (enc) head['Content-Encoding'] = enc; head['Content-Length'] = body.length;
    if (req.method === 'GET') { stats.pages++; stats.bytes += body.length; }
    res.writeHead(200, head); res.end(req.method === 'HEAD' ? undefined : body); return;
  }
  // (config.js names the race server for a page kept elsewhere, as on GitHub Pages; a page this server sent talks to
  // this server, wherever it runs, so its config.js names none)
  if (u === '/config.js') {
    const js = '// this page came from the race server itself: it talks to it\n';
    res.writeHead(200, Object.assign(head, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' })); res.end(req.method === 'HEAD' ? undefined : js); return;
  }
  if (u === '/healthz') { res.writeHead(200, Object.assign(head, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' })); res.end('ok'); return; }
  if (u === '/favicon.ico') { res.writeHead(204, head); res.end(); return; }
  res.writeHead(404, Object.assign(head, { 'Content-Type': 'text/plain' })); res.end('Not found');
});

// ---- the pages connected, and the rooms they are in ----
// A session is one open page: its peer id (the same on every page), the token that lets it take its place back after
// its connection broke, its player's id, and its presence in each room it is in (the lobby, where everyone is and
// hosts show their races, and the race rooms). The server keeps each presence whole and passes on what changed.
const sessions = new Map(), rooms = new Map(), perIp = new Map();
const out = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)); };
const reply = (s, m, o) => out(s.ws, Object.assign({ rid: m.rid }, o));
const everyone = msg => { const t = JSON.stringify(msg); for (const s of sessions.values()) out(s.ws, t); };
const roomList = room => { const S = rooms.get(room); return S ? [...S].map(s => ({ peer: s.peer, by: s.uid, presence: s.pres.get(room) || {} })) : []; };
const toRoom = (room, msg, except) => { const S = rooms.get(room); if (!S) return; const t = JSON.stringify(msg); for (const s of S) if (s !== except) out(s.ws, t); };
function joinRoom(s, room) {
  let S = rooms.get(room); if (S && S.has(s)) return true;
  if (room !== LOBBY && S && S.size >= ROOM_MAX) return false;
  if (!S) rooms.set(room, S = new Set()); S.add(s); s.pres.set(room, {});
  toRoom(room, { t: 'pj', room, p: { peer: s.peer, by: s.uid, presence: {} } }, s); return true;
}
function leaveRoom(s, room) { const S = rooms.get(room); if (!S || !S.has(s)) return; S.delete(s); s.pres.delete(room); if (!S.size) rooms.delete(room); toRoom(room, { t: 'pl', room, peer: s.peer }); }
function drop(s) {
  clearTimeout(s.dropT); s.dropT = null; if (!sessions.has(s.peer)) return;
  for (const room of [...s.pres.keys()]) leaveRoom(s, room); sessions.delete(s.peer);
  const n = (online.get(s.uid) || 1) - 1; if (n > 0) online.set(s.uid, n); else { online.delete(s.uid); if (!times.has(s.uid)) names.delete(s.uid); }
}
function setName(uid, nm) {
  if ((names.get(uid) || '') === nm) return;
  if (nm) names.set(uid, nm); else names.delete(uid); if (times.has(uid)) save();
  everyone({ t: 'nm', id: uid, name: nm });
}
const bye = (ws, why) => { out(ws, { t: 'bye', why }); setTimeout(() => { try { ws.close(4001, why); } catch (e) { } }, 50); };

// a page says who it is (its player's key and name), and, if its connection broke a moment ago, which place was its own:
// it gets that place back in each of its rooms; otherwise it starts in the lobby
function hello(ws, m) {
  if (typeof m.key !== 'string' || !KEY_RE.test(m.key)) { bye(ws, 'auth'); return null; }
  const uid = uidOf(m.key), r = m.resume; let s = null;
  if (r && typeof r === 'object' && typeof r.peer === 'string' && typeof r.token === 'string') {
    const old = sessions.get(r.peer);
    if (old && old.token === r.token && old.uid === uid) { s = old; clearTimeout(s.dropT); s.dropT = null; if (s.ws && s.ws !== ws) { const w = s.ws; s.ws = null; try { w.close(4000, 'replaced'); } catch (e) { } } }
  }
  const resumed = !!s;
  if (!s) { s = { peer: 'p' + rnd(15), token: rnd(24), uid, ws: null, pres: new Map(), dropT: null, dbsub: false }; sessions.set(s.peer, s); online.set(uid, (online.get(uid) || 0) + 1); }
  s.ws = ws; setName(uid, cleanName(m.name));
  if (!resumed) joinRoom(s, LOBBY);
  const list = {}; for (const room of s.pres.keys()) list[room] = roomList(room);
  out(ws, { t: 'welcome', peer: s.peer, token: s.token, uid, resumed, rooms: list });
  return s;
}
// what changed in a page's presence in one room ({ d: keys set, rm: keys removed }, or full: the whole of it), kept and
// passed on to the others there
function presence(s, m) {
  const room = m.room; if (typeof room !== 'string' || !s.pres.has(room)) return;
  const d = m.d == null ? {} : m.d, rm = m.rm == null ? [] : m.rm;
  if (typeof d !== 'object' || Array.isArray(d) || !Array.isArray(rm) || rm.length > 64) return;
  const ks = Object.keys(d); if (ks.length > 64) return;
  const cur = s.pres.get(room), nx = m.full ? {} : Object.assign({}, cur), set = {}, del = [];
  for (const k of rm) { if (badKey(k)) return; if (own(nx, k)) { delete nx[k]; del.push(k); } }
  for (const k of ks) { if (badKey(k)) return; const v = d[k]; if (v === null) { if (own(nx, k)) { delete nx[k]; del.push(k); } } else { nx[k] = v; set[k] = v; } }
  if (depth(nx) > 8 || Buffer.byteLength(JSON.stringify(nx)) > PRES_MAX) return;
  s.pres.set(room, nx);
  const o = { t: 'pp', room, peer: s.peer };
  if (m.full) { o.full = 1; o.d = nx; } else { if (!ks.length && !del.length) return; if (Object.keys(set).length) o.d = set; if (del.length) o.rm = del; }
  toRoom(room, o, s);
}
function handle(s, m) {
  switch (m.t) {
    case 'pp': presence(s, m); return;
    case 'hb': return;
    case 'ping': reply(s, m, { ok: true }); return;
    case 'join': {
      const room = m.room;
      if (typeof room !== 'string' || !ROOM_RE.test(room)) { reply(s, m, { err: 'invalid_argument', message: 'Not a room name.' }); return; }
      if (!s.pres.has(room)) {
        if (s.pres.size > ROOMS_PER) { reply(s, m, { err: 'limit_reached', message: 'Too many races open on this page.' }); return; }
        if (!joinRoom(s, room)) { reply(s, m, { err: 'limit_reached', message: 'That race is full.' }); return; }
      }
      reply(s, m, { room, peers: roomList(room) }); return;
    }
    case 'leave': if (typeof m.room === 'string' && m.room !== LOBBY) leaveRoom(s, m.room); return;
    case 'list': if (typeof m.room === 'string' && s.pres.has(m.room)) out(s.ws, { t: 'list', room: m.room, peers: roomList(m.room) }); return;
    case 'name': setName(s.uid, cleanName(m.name)); return;
    case 'profiles': { const map = {}; for (const id of Array.isArray(m.ids) ? m.ids.slice(0, 64) : []) if (typeof id === 'string' && names.has(id)) map[id] = names.get(id); reply(s, m, { map }); return; }
    case 'dbsub': if (m.coll === 'times') { s.dbsub = true; out(s.ws, { t: 'dbsnap', coll: 'times', docs: [...times].map(([id, c]) => [id, c.d]) }); } return;
    case 'dbset': {
      if (m.path !== 'times/' + s.uid) { reply(s, m, { err: 'permission_denied', message: 'Only your own times.' }); return; }
      const c = checkTimes(m.data); if (!c) { reply(s, m, { err: 'invalid_argument', message: 'Not a stage-time record.' }); return; }
      const gone = storeTimes(s.uid, c); reply(s, m, { ok: true });
      for (const x of sessions.values()) if (x.dbsub) { for (const id of gone) out(x.ws, { t: 'dbdoc', coll: 'times', id, data: null }); out(x.ws, { t: 'dbdoc', coll: 'times', id: s.uid, data: c.d }); }
      return;
    }
  }
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 128 * 1024,
  perMessageDeflate: { threshold: 128, serverMaxWindowBits: 13, clientMaxWindowBits: 13, zlibDeflateOptions: { level: 6, memLevel: 6 } } });
wss.on('connection', (ws, req) => {
  // (behind a hosting service's proxy, the player's own address is the first one it forwards)
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
  if (wss.clients.size > MAX_PLAYERS || (perIp.get(ip) || 0) >= PER_IP) { ws.close(1013, 'busy'); return; }
  perIp.set(ip, (perIp.get(ip) || 0) + 1); stats.most = Math.max(stats.most, wss.clients.size);
  const sock = req.socket; ws.sock = sock; ws.sent = sock.bytesWritten;
  let s = null, budget = BURST, t0 = Date.now(), over = 0; ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (buf, bin) => {
    ws.alive = true; if (bin) return;
    const now = Date.now(); budget = Math.min(BURST, budget + (now - t0) * RATE / 1000); t0 = now;
    if (budget < 1) { if (++over > 3000) ws.terminate(); return; } // (past its budget a message is dropped; a page that keeps on is cut off)
    budget -= 1;
    let m; try { m = JSON.parse(buf.toString('utf8')); } catch (e) { return; }
    if (!m || typeof m !== 'object' || Array.isArray(m)) return;
    if (!s) { if (m.t === 'hello') s = hello(ws, m); return; }
    try { handle(s, m); } catch (e) { console.error('Message ' + m.t + ': ' + e.message); }
  });
  ws.on('close', code => {
    const k = (perIp.get(ip) || 1) - 1; if (k > 0) perIp.set(ip, k); else perIp.delete(ip);
    stats.bytes += sock.bytesWritten - ws.sent; ws.sent = sock.bytesWritten;
    if (!s || s.ws !== ws) return; s.ws = null;
    // (a page closed or reloaded says so, and leaves at once; a connection that broke keeps its place a while)
    if (code === 1000 || code === 1001) drop(s); else { clearTimeout(s.dropT); s.dropT = setTimeout(() => { if (!s.ws) drop(s); }, GRACE); }
  });
  ws.on('error', () => { });
});
// every 20 s: a ping to find the connections that died without a word, and a beat each page listens for
const BEAT = JSON.stringify({ t: 'hb' });
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; try { ws.ping(); } catch (e) { } out(ws, BEAT); } }, 20000).unref();

// a line in the log every ten minutes while anyone plays: pages connected, the game loaded, and the data sent (which a
// host may count against a monthly allowance)
const EVERY = +process.env.STATS_EVERY || 600;
setInterval(() => {
  for (const ws of wss.clients) { stats.bytes += ws.sock.bytesWritten - ws.sent; ws.sent = ws.sock.bytesWritten; }
  if (!stats.pages && !stats.most && !wss.clients.size) return;
  const sent = stats.bytes < 1048576 ? Math.round(stats.bytes / 1024) + ' KB' : (stats.bytes / 1048576).toFixed(1) + ' MB';
  console.log(`Last ${EVERY >= 120 ? Math.round(EVERY / 60) + ' minutes' : EVERY + ' seconds'}: ${wss.clients.size} pages connected now (${stats.most} at most), the game loaded ${stats.pages} times, ${sent} sent; ${times.size} players on the board`);
  stats.pages = 0; stats.bytes = 0; stats.most = wss.clients.size;
}, EVERY * 1000).unref();

for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { flushSave(); process.exit(0); });
server.listen(PORT, () => console.log(`Seed Rally 86 is running on port ${PORT} (the board is saved in ${DATA})`));
