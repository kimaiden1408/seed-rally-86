// ==== ROUND 46: REAL ROADS (the map's data: the route, and the course pack) ====
// A real course is made from the open map of the world (OpenStreetMap, its roads, buildings, land and water, as its
// mappers have drawn them, fetched through its Overpass servers) and the land's heights (the open elevation tiles of
// Mapterhorn, and Amazon's terrain tiles where Mapterhorn has none). The route is found here, on the map's own road
// network, between the points picked on the map; the course pack holds everything a stage is built from - the road as
// mapped, the ways that meet it, the buildings, land cover, water, walls and fences, trees and lamps along it, the land's
// heights near it finely and far round it coarsely - in the frame the stage is built in (metres, x east, z south, about
// the course's middle). Only the website reaches these servers: an artifact's page may not, so it builds from packs.
const RW_HW = 'motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service|track|road|raceway|busway|escape';
const RW_CELL = 0.02, RW_SNAP = 160, RW_RUNUP = 250, RW_RUNOFF = 250, RW_COR = 330, RW_BLK = 64, RW_DC = 5;
const rwSleep = ms => new Promise(r => setTimeout(r, ms));
const rwKeyOf = s => (strHash(s) >>> 0).toString(36) + '.' + s.length.toString(36);
// (the page's own store for what it has fetched: the map's answers, the height tiles, the packs it has made)
const RWDB = {
  p: null,
  open() { if (this.p) return this.p; return this.p = new Promise(res => { try { const q = indexedDB.open('sr86-real', 1);
    q.onupgradeneeded = () => { const d = q.result; for (const s of ['ovp', 'tile', 'pack']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    q.onsuccess = () => res(q.result); q.onerror = () => res(null); q.onblocked = () => res(null); } catch (e) { res(null); } }); },
  async get(st, k) { const d = await this.open(); if (!d) return null; return new Promise(res => { try { const q = d.transaction(st).objectStore(st).get(k); q.onsuccess = () => res(q.result == null ? null : q.result); q.onerror = () => res(null); } catch (e) { res(null); } }); },
  async put(st, k, v) { const d = await this.open(); if (!d) return false; return new Promise(res => { try { const tx = d.transaction(st, 'readwrite'); tx.objectStore(st).put(v, k); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => res(false); } catch (e) { res(false); } }); },
  async del(st, k) { const d = await this.open(); if (!d) return false; return new Promise(res => { try { const tx = d.transaction(st, 'readwrite'); tx.objectStore(st).delete(k); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => res(false); } catch (e) { res(false); } }); },
  async keys(st) { const d = await this.open(); if (!d) return []; return new Promise(res => { try { const q = d.transaction(st).objectStore(st).getAllKeys(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (e) { res([]); } }); }
};
const RWNet = {
  // the Overpass servers, tried in turn (the main one first; the others when it is busy or down)
  OVP: ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter'],
  at: 0, live: null, busy: 0,
  async get(url, opt, ms) { const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms || 60000); try { return await fetch(url, Object.assign({ signal: ac.signal, referrerPolicy: 'strict-origin-when-cross-origin' }, opt || {})); } finally { clearTimeout(t); } },
  // an Overpass query's answer (kept for a month: the map changes slowly, and its servers are shared)
  async overpass(q, ms) {
    const key = rwKeyOf(q), c = await RWDB.get('ovp', key); if (c && c.t > Date.now() - 30 * 864e5) return c.j;
    while (this.busy >= 2) await rwSleep(120); this.busy++;
    try { let err = null;
      for (let k = 0; k < this.OVP.length * 2; k++) { const u = this.OVP[(this.at + k) % this.OVP.length];
        try { const r = await this.get(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } }, ms || 150000);
          if (r.status === 429 || r.status === 504 || r.status === 503) { err = new Error('busy'); await rwSleep(1500 * (1 + k)); continue; }
          const txt = await r.text(); if (!r.ok || txt.charAt(0) !== '{') { err = new Error('answer ' + r.status); continue; }
          const j = JSON.parse(txt); if (j.remark && /error|timed out|out of memory|Dispatcher/i.test(j.remark)) { err = new Error(j.remark); continue; }
          this.at = (this.at + k) % this.OVP.length; this.live = true; RWDB.put('ovp', key, { t: Date.now(), j }); return j;
        } catch (e) { err = e; } }
      this.live = this.live || false; throw err || new Error('unreachable');
    } finally { this.busy--; }
  },
  // the place a name is (the map's own gazetteer; asked once a search, never as one types)
  async search(text, lang) { const u = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=' + encodeURIComponent(text) + (lang ? '&accept-language=' + lang : '');
    const r = await this.get(u, {}, 20000); if (!r.ok) return []; const j = await r.json(); return (j || []).map(p => ({ name: p.display_name, lat: +p.lat, lon: +p.lon, bb: p.boundingbox ? p.boundingbox.map(Number) : null })); },
  async placeName(lat, lon, lang) { try { const r = await this.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&lat=' + lat.toFixed(5) + '&lon=' + lon.toFixed(5) + (lang ? '&accept-language=' + lang : ''), {}, 15000); if (!r.ok) return '';
    const j = await r.json(), a = (j && j.address) || {}; return a.village || a.town || a.city || a.municipality || a.county || a.state || (j && j.name) || ''; } catch (e) { return ''; } }
};
// ---- the land's heights ----
// Terrarium-encoded tiles (a height in each pixel: red x 256 + green + blue / 256 - 32768 m): Mapterhorn's (512 pixels a
// side, as fine as each country's own survey where it has one, else the 30 m global model) and Amazon's (256 a side)
const RWDem = {
  SRC: [{ u: (z, x, y) => `https://tiles.mapterhorn.com/${z}/${x}/${y}.webp`, max: 17 }, { u: (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, max: 15 }],
  T: new Map(), got: 0, bytes: 0,
  async decode(blob) { const bm = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }), n = bm.width;
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(n, n) : Object.assign(document.createElement('canvas'), { width: n, height: n }), g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(bm, 0, 0); if (bm.close) bm.close(); const d = g.getImageData(0, 0, n, n).data, h = new Float32Array(n * n);
    for (let k = 0, o = 0; k < n * n; k++, o += 4) h[k] = d[o] * 256 + d[o + 1] + d[o + 2] / 256 - 32768; return { n, h }; },
  // a tile (z/x/y), from the first source that has it; where neither has it at z, the coarser ones' (kept as what z asks)
  async tile(z, x, y) { const key = z + '/' + x + '/' + y; if (this.T.has(key)) return this.T.get(key);
    let out = null;
    for (const [S, zz] of [[0, z], [0, z - 1], [0, z - 2], [1, Math.min(z, 15)], [0, z - 4]]) { if (zz < 0 || zz > this.SRC[S].max) continue; const sh = z - zz, u = this.SRC[S].u(zz, x >> sh, y >> sh);
      try { let blob = await RWDB.get('tile', u); if (!blob) { const r = await RWNet.get(u, {}, 60000); if (r.status === 404 || r.status === 403) continue; if (!r.ok) continue; blob = await r.blob(); this.bytes += blob.size; RWDB.put('tile', u, blob); }
        const d = await this.decode(blob); out = { z: zz, x: x >> sh, y: y >> sh, n: d.n, h: d.h }; break; } catch (e) { } }
    this.T.set(key, out); this.got++; return out; },
  // (the tiles at z covering a lat-lon box, fetched six at a time)
  async cover(z, s, w, n, e, prog) { const t0 = rwTileXY(z, n, w), t1 = rwTileXY(z, s, e), L = [];
    for (let y = Math.floor(t0[1]); y <= Math.floor(t1[1]); y++) for (let x = Math.floor(t0[0]); x <= Math.floor(t1[0]); x++) if (!this.T.has(z + '/' + x + '/' + y)) L.push([x, y]);
    let k = 0, done = 0; const run = async () => { while (k < L.length) { const [x, y] = L[k++]; await this.tile(z, x, y); done++; if (prog) prog(done / L.length); } };
    await Promise.all([run(), run(), run(), run(), run(), run()]); return L.length; },
  // the height at a place from the tiles at z (as fetched): bilinear between pixel centres; null where none
  at(z, lat, lon) { const [fx, fy] = rwTileXY(z, lat, lon), tx = Math.floor(fx), ty = Math.floor(fy), E = this.T.get(z + '/' + tx + '/' + ty); if (!E) return null;
    const sc = 2 ** (z - E.z), gx = (fx / sc - E.x) * E.n - 0.5, gy = (fy / sc - E.y) * E.n - 0.5, n = E.n, i = clamp(Math.floor(gx), 0, n - 2), j = clamp(Math.floor(gy), 0, n - 2), a = clamp(gx - i, 0, 1), b = clamp(gy - j, 0, 1), H = E.h, o = j * n + i;
    return (H[o] * (1 - a) + H[o + 1] * a) * (1 - b) + (H[o + n] * (1 - a) + H[o + n + 1] * a) * b; }
};
function rwTileXY(z, lat, lon) { const n = 2 ** z, s = Math.sin(clamp(lat, -85.05, 85.05) * D2R); return [(lon + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n]; }
function rwTileLL(z, x, y) { const n = 2 ** z, lon = x / n * 360 - 180, m = Math.PI * (1 - 2 * y / n); return [Math.atan(Math.sinh(m)) / D2R, lon]; }
// ---- the road network, and routes on it ----
// The map's drivable ways, fetched in cells 0.02 degrees square as a route needs them; each way's points and the map's
// nodes they are (where ways share a node they meet). A route between two picked points is the cheapest way along them:
// its length, a little dearer on tracks, service roads and private ones (a course goes the way a driver would take
// between the points, not by the fastest roads); one-way rules kept only on motorways, their links and roundabouts (a
// course's road is closed to traffic: a one-way street may be driven either way, but not a roundabout's wrong way round)
const RWRoute = {
  ways: new Map(), nodes: new Map(), cellW: new Map(), cells: new Map(),
  cell(i, j) { const k = i + ',' + j; if (!this.cells.has(k)) this.cells.set(k, this.loadCell(i, j).catch(e => { this.cells.delete(k); throw e; })); return this.cells.get(k); },
  async loadCell(i, j) { const s = i * RW_CELL, w = j * RW_CELL, f = v => v.toFixed(5);
    const J = await RWNet.overpass(`[out:json][timeout:90];way[highway~"^(${RW_HW})$"][area!=yes](${f(s)},${f(w)},${f(s + RW_CELL)},${f(w + RW_CELL)});out body geom qt;`);
    for (const el of J.elements || []) this.add(el); return true; },
  add(el) { if (el.type !== 'way' || !el.geometry || !el.nodes || this.ways.has(el.id)) return; const n = el.geometry.length; if (n < 2) return;
    const la = new Float64Array(n), lo = new Float64Array(n); let s = 90, w = 180, nn = -90, e = -180;
    for (let k = 0; k < n; k++) { const g = el.geometry[k]; la[k] = g.lat; lo[k] = g.lon; s = Math.min(s, g.lat); nn = Math.max(nn, g.lat); w = Math.min(w, g.lon); e = Math.max(e, g.lon); }
    const t = el.tags || {}, hw = t.highway || 'road', ring = t.junction === 'roundabout' || t.junction === 'circular', strict = /^(motorway|trunk)/.test(hw) || ring || hw === 'motorway_link' || hw === 'trunk_link';
    const ow = !strict ? 0 : (t.oneway === '-1' || t.oneway === 'reverse') ? -1 : (t.oneway === 'no' || t.oneway === 'alternating' || t.oneway === 'reversible') ? 0 : (t.oneway === 'yes' || t.oneway === '1' || t.oneway === 'true' || ring || hw === 'motorway' || hw === 'motorway_link') ? 1 : 0;
    const acc = t.access || t.motor_vehicle || t.vehicle || '', svc = t.service || '';
    const f = ({ motorway: 1.05, trunk: 1.02, track: 1.15, service: 1.3, living_street: 1.2, residential: 1.04, raceway: 1.0, busway: 1.6, escape: 2.5 }[hw.replace('_link', '')] || 1) * (/^(no|private)$/.test(acc) ? 1.7 : /^(agricultural|forestry|delivery|destination|customers)$/.test(acc) ? 1.15 : 1) * (svc === 'driveway' || svc === 'parking_aisle' || svc === 'drive-through' ? 3 : 1) * (/grade[45]/.test(t.tracktype || '') ? 1.25 : 1);
    const W = { id: el.id, t, nd: el.nodes, la, lo, n, ow, f, bb: [s, w, nn, e] }; this.ways.set(el.id, W);
    for (let k = 0; k < n; k++) { const id = el.nodes[k]; let N = this.nodes.get(id); if (!N) this.nodes.set(id, N = { la: la[k], lo: lo[k], w: [] }); N.w.push(W, k); }
    const i0 = Math.floor(s / RW_CELL), i1 = Math.floor(nn / RW_CELL), j0 = Math.floor(w / RW_CELL), j1 = Math.floor(e / RW_CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = i + ',' + j; let L = this.cellW.get(k); if (!L) this.cellW.set(k, L = []); L.push(W); } },
  // (the cells within r cells of a stretch from one place to another, loaded)
  async along(a, b, r, prog) { const L = new Set(), d = Math.hypot(b[0] - a[0], (b[1] - a[1]) * Math.cos(a[0] * D2R)), n = Math.max(1, Math.ceil(d / (RW_CELL / 3)));
    for (let k = 0; k <= n; k++) { const la = a[0] + (b[0] - a[0]) * k / n, lo = a[1] + (b[1] - a[1]) * k / n, i = Math.floor(la / RW_CELL), j = Math.floor(lo / RW_CELL); for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) L.add((i + di) + ',' + (j + dj)); }
    const todo = [...L].filter(k => !this.cells.has(k)); let done = 0; await Promise.all(todo.map(k => { const [i, j] = k.split(',').map(Number); return this.cell(i, j).then(() => { done++; if (prog) prog(done / todo.length); }); })); },
  // metres between two places (the local flat approximation, fine for a few kilometres)
  dist(a, o, b, p) { const c = Math.cos((a + b) / 2 * D2R); return Math.hypot((p - o) * c * 111320, (b - a) * 110574); },
  // the nearest drivable way to a place: its way, segment, how far along it (0-1), the place on it and how far off
  snap(la, lo, max) { const i = Math.floor(la / RW_CELL), j = Math.floor(lo / RW_CELL), c = Math.cos(la * D2R), seen = new Set(); let best = null;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) for (const W of this.cellW.get((i + di) + ',' + (j + dj)) || []) { if (seen.has(W)) continue; seen.add(W);
      for (let k = 0; k + 1 < W.n; k++) { const ax = (W.lo[k] - lo) * c * 111320, az = (W.la[k] - la) * 110574, bx = (W.lo[k + 1] - lo) * c * 111320, bz = (W.la[k + 1] - la) * 110574, ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1e-9, t = clamp(-(ax * ex + az * ez) / L2, 0, 1), d = Math.hypot(ax + ex * t, az + ez * t) * (W.f > 2 ? 1.6 : 1);
        if (!best || d < best.d) best = { W, k, t, d, la: W.la[k] + (W.la[k + 1] - W.la[k]) * t, lo: W.lo[k] + (W.lo[k + 1] - W.lo[k]) * t }; } }
    return best && best.d <= (max || RW_SNAP) ? best : null; },
  segLen(W, k) { return this.dist(W.la[k], W.lo[k], W.la[k + 1], W.lo[k + 1]); },
  // The cheapest way from one snapped place to another (A*: the straight distance as its guide). noBack: the way the
  // route came into its start, not to be gone straight back along (a U-turn at a picked point, only if nothing else
  // will do). Returns the places along it, the way each stretch is on (W, its segment, and which way along it) and
  // the map's node each place is (null for a place partway along a segment)
  path(A, B, noBack) {
    const H = [], push = (f, id) => { H.push([f, id]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
    const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
    const g = new Map(), from = new Map(), hz = (la, lo) => this.dist(la, lo, B.la, B.lo), ok = (W, d) => !W.ow || W.ow === d;
    // (straight along the one segment, when both are on it and it may be driven that way)
    if (A.W === B.W && A.k === B.k && ((B.t >= A.t && ok(A.W, 1) && noBack !== -1) || (B.t < A.t && ok(A.W, -1) && noBack !== 1))) return { pl: [[A.la, A.lo], [B.la, B.lo]], seg: [{ W: A.W, k: A.k, d: B.t >= A.t ? 1 : -1 }], node: [null, null], cost: this.segLen(A.W, A.k) * Math.abs(B.t - A.t) };
    const start = (id, cost, d) => { if (!(cost < (g.get(id) ?? Infinity))) return; g.set(id, cost); from.set(id, { p: 'S', W: A.W, k: A.k, d }); const N = this.nodes.get(id); push(cost + hz(N.la, N.lo), id); };
    const L0 = this.segLen(A.W, A.k), pen = 50000;
    if (ok(A.W, 1)) start(A.W.nd[A.k + 1], L0 * (1 - A.t) * A.W.f + (noBack === -1 ? pen : 0), 1);
    if (ok(A.W, -1)) start(A.W.nd[A.k], L0 * A.t * A.W.f + (noBack === 1 ? pen : 0), -1);
    const endA = B.W.nd[B.k], endB = B.W.nd[B.k + 1], LB = this.segLen(B.W, B.k); let best = Infinity, bestFrom = null, n = 0;
    while (H.length && n++ < 600000) { const [f, u] = pop(); if (f >= best) break; const gu = g.get(u); if (f - hz(this.nodes.get(u).la, this.nodes.get(u).lo) > gu + 1e-6) continue;
      if (u === endA && ok(B.W, 1)) { const c = gu + LB * B.t * B.W.f; if (c < best) { best = c; bestFrom = { p: u, W: B.W, k: B.k, d: 1 }; } }
      if (u === endB && ok(B.W, -1)) { const c = gu + LB * (1 - B.t) * B.W.f; if (c < best) { best = c; bestFrom = { p: u, W: B.W, k: B.k, d: -1 }; } }
      const N = this.nodes.get(u), fr = from.get(u);
      for (let q = 0; q < N.w.length; q += 2) { const W = N.w[q], k = N.w[q + 1];
        for (const d of [1, -1]) { const k2 = k + d; if (k2 < 0 || k2 >= W.n || !ok(W, d)) continue; const v = W.nd[k2]; if (fr && fr.p === v) continue; const sk = d > 0 ? k : k2;
          const c = gu + this.segLen(W, sk) * W.f; if (c < (g.get(v) ?? Infinity)) { g.set(v, c); from.set(v, { p: u, W, k: sk, d }); const V = this.nodes.get(v); push(c + hz(V.la, V.lo), v); } } } }
    if (!bestFrom) return null;
    // (back from the end: each stretch's segment, the nodes it passed)
    const seg = [bestFrom], node = [null]; let u = bestFrom.p;
    while (u !== 'S') { node.push(u); const fr = from.get(u); seg.push(fr); u = fr.p; }
    node.push(null); seg.reverse(); node.reverse();
    const pl = node.map((id, k) => id === null ? (k === 0 ? [A.la, A.lo] : [B.la, B.lo]) : [this.nodes.get(id).la, this.nodes.get(id).lo]);
    return { pl, seg, node, cost: best };
  },
  // a stretch of road on from a place, L metres the way it is going (dir: along its way, +1 or -1), keeping to the way it
  // is on and at a junction to the one that carries straight on (turning 60 degrees at most); where none does (a dead
  // end) the rest is laid straight on, as a short track would go. Returns places, their stretches' ways and nodes
  extend(W, k, t, dir, L) { const pl = [], seg = [], node = []; let left = L, la = W.la[k] + (W.la[k + 1] - W.la[k]) * t, lo = W.lo[k] + (W.lo[k + 1] - W.lo[k]) * t, kk = dir > 0 ? k + 1 : k, ww = W, guard = 0, h = null;
    while (left > 0.5 && guard++ < 400) { const nla = ww.la[kk], nlo = ww.lo[kk], d = this.dist(la, lo, nla, nlo), sk = dir > 0 ? kk - 1 : kk;
      h = Math.atan2((nlo - lo) * Math.cos(la * D2R), nla - la);
      if (d >= left) { const f = left / d; la += (nla - la) * f; lo += (nlo - lo) * f; pl.push([la, lo]); seg.push({ W: ww, k: sk, d: dir }); node.push(null); left = 0; break; }
      left -= d; la = nla; lo = nlo; pl.push([la, lo]); seg.push({ W: ww, k: sk, d: dir }); const id = ww.nd[kk]; node.push(id);
      const k2 = kk + dir; if (k2 >= 0 && k2 < ww.n && this.nodes.get(id) && !(this.nodes.get(id).w.length > 4)) { kk = k2; continue; }
      // (a junction or the way's end: the way on that turns least; the same way if it carries on and turns least)
      const N = this.nodes.get(id); let best = null, bt = 1.05; if (N) for (let q = 0; q < N.w.length; q += 2) { const W2 = N.w[q], k3 = N.w[q + 1];
        for (const d2 of [1, -1]) { const k4 = k3 + d2; if (k4 < 0 || k4 >= W2.n || (W2 === ww && d2 !== dir)) continue; if (W2.ow && W2.ow !== d2) continue; const h2 = Math.atan2((W2.lo[k4] - lo) * Math.cos(la * D2R), W2.la[k4] - la), tn = Math.abs(wrapAngle(h2 - h)) * (W2 === ww ? 0.8 : 1);
          if (tn < bt) { bt = tn; best = [W2, k4, d2]; } } }
      if (!best) break; ww = best[0]; kk = best[1]; dir = best[2]; }
    if (left > 0.5 && h !== null) { const f = left / 110574; la += Math.cos(h) * f; lo += Math.sin(h) * f / Math.cos(la * D2R); pl.push([la, lo]); seg.push({ W: null, syn: ww, k: 0, d: 1 }); node.push(null); }
    return { pl, seg, node }; },
  // A course's line on the map from its picked points: legs from each to the next (a circuit's last back to its first);
  // a run-up before its start and (point to point) a run-off past its finish. kind: 'p2p', 'rt' (there and back: out to
  // the last point, the turn there made by the stage), 'loop'. Returns the line's places with each stretch's way, the
  // node each place is, and where the start (a) and the far end (b) are along it
  async plan(wp, kind, prog) {
    const P = wp.slice(); if (kind === 'loop' && P.length < 3) throw new Error('loop-few'); if (P.length < 2) throw new Error('few');
    const legs = P.map((p, k) => [p, P[k + 1] || (kind === 'loop' ? P[0] : null)]).filter(l => l[1]);
    let done = 0; for (const [a, b] of legs) { await this.along(a, b, 1, f => prog && prog((done + f) / legs.length * 0.5)); done++; }
    const snaps = []; for (const p of P) { const s = this.snap(p[0], p[1], RW_SNAP); if (!s) throw Object.assign(new Error('nosnap'), { at: P.indexOf(p) }); snaps.push(s); }
    if (kind === 'loop') snaps.push(snaps[0]);
    const pl = [], seg = [], node = []; let back = 0;
    for (let k = 0; k + 1 < snaps.length; k++) { let R = this.path(snaps[k], snaps[k + 1], back);
      if (!R) { const a = P[k], b = P[(k + 1) % P.length]; await this.along(a, b, 3, f => prog && prog(0.5 + 0.4 * (k + f) / legs.length)); R = this.path(snaps[k], snaps[k + 1], back); }
      if (!R) throw Object.assign(new Error('noroute'), { at: k });
      const o = pl.length ? 1 : 0; for (let q = o; q < R.pl.length; q++) { pl.push(R.pl[q]); node.push(R.node[q]); } for (const s of R.seg) seg.push(s);
      const last = R.seg[R.seg.length - 1]; back = last.d; if (prog) prog(0.5 + 0.45 * (k + 1) / legs.length); }
    // (a route that goes up a dead end and back to reach a point there, or doubles back on itself: the stretch out and
    // back left out - a course drives each stretch of road once each way round)
    for (let pass = 0, cut = true; cut && pass < 50; pass++) { cut = false;
      for (let i = 1; i < node.length - 2 && !cut; i++) { const id = node[i]; if (id == null) continue;
        for (let j = i + 2, d = 0; j < node.length && d < 600; j++) { d += this.dist(pl[j - 1][0], pl[j - 1][1], pl[j][0], pl[j][1]); if (node[j] !== id) continue;
          if (this.dist(pl[i + 1][0], pl[i + 1][1], pl[j - 1][0], pl[j - 1][1]) < 1.5) { pl.splice(i + 1, j - i); node.splice(i + 1, j - i); seg.splice(i, j - i); cut = true; } break; } } }
    // (the run-up: back from the start the way the course leaves it; and the run-off past the finish)
    let a = 0, b = pl.length - 1;
    if (kind !== 'loop') { const s0 = seg[0], A = snaps[0], up = this.extend(s0.W, A.k, A.t, -s0.d, RW_RUNUP);
      if (up.pl.length) { const n = up.pl.length; pl.unshift(...up.pl.slice().reverse()); node.unshift(...up.node.slice().reverse()); seg.unshift(...up.seg.slice().reverse().map(s => s.W ? { W: s.W, k: s.k, d: -s.d } : s)); a = n; b += n; } }
    if (kind === 'p2p') { const sl = seg[seg.length - 1], B = snaps[snaps.length - 1], off = this.extend(sl.W, B.k, B.t, sl.d, RW_RUNOFF); for (let q = 0; q < off.pl.length; q++) { pl.push(off.pl[q]); node.push(off.node[q]); seg.push(off.seg[q]); } }
    // (places closer than 20 cm merged)
    const P2 = [pl[0]], S2 = [], N2 = [node[0]]; let a2 = 0, b2 = 0;
    for (let q = 1; q < pl.length; q++) { if (this.dist(P2[P2.length - 1][0], P2[P2.length - 1][1], pl[q][0], pl[q][1]) < 0.2 && q !== a && q !== b) { if (node[q] != null) N2[N2.length - 1] = node[q]; continue; } P2.push(pl[q]); S2.push(seg[q - 1]); N2.push(node[q]); if (q === a) a2 = P2.length - 1; if (q === b) b2 = P2.length - 1; }
    if (a === 0) a2 = 0; if (b === pl.length - 1 || b2 === 0) b2 = P2.length - 1;
    return { pl: P2, seg: S2, node: N2, a: a2, b: b2, kind, snaps };
  },
  // the side roads off a course's line: at each node of it, each way there that is not the course's own stretch either
  // side of it (its way, the point it leaves from, and which way along it it leads off)
  branches(R, i0, i1) { const out = [], real = (q, d) => { for (let j = q + d; j >= 0 && j < R.node.length; j += d) if (R.node[j] != null) return R.node[j]; return null; };
    for (let q = Math.max(1, i0); q < Math.min(R.node.length - 1, i1); q++) { const id = R.node[q]; if (id == null) continue; const N = this.nodes.get(id); if (!N) continue;
      const pv = real(q, -1), nx = real(q, 1), sa = R.seg[q - 1], sb = R.seg[q];
      for (let k = 0; k < N.w.length; k += 2) { const W = N.w[k], kk = N.w[k + 1]; for (const d of [1, -1]) { const k2 = kk + d; if (k2 < 0 || k2 >= W.n) continue; const sg = d > 0 ? kk : k2, v = W.nd[k2];
        // (not the course's own stretch either side of it: the segment it came along or leaves by, or on to the node it passes next)
        if ((sa && sa.W === W && sa.k === sg) || (sb && sb.W === W && sb.k === sg) || v === pv || v === nx) continue; out.push({ q, W, at: kk, dir: d }); } } }
    return out; }
};
// ---- the course code: what a course is, to share or keep (its kind, laps and picked points) ----
const RW_B32 = '0123456789abcdefghjkmnpqrstvwxyz';
function rwCodeOf(C) { const by = [1, { p2p: 0, rt: 1, loop: 2 }[C.kind] || 0, clamp(C.laps || 1, 1, 50)], vi = v => { v = v < 0 ? -2 * v - 1 : 2 * v; while (v >= 128) { by.push((v & 127) | 128); v = Math.floor(v / 128); } by.push(v); };
  vi(C.wp.length); let la = 0, lo = 0; for (const p of C.wp) { const a = Math.round(p[0] * 1e6), b = Math.round(p[1] * 1e6); vi(a - la); vi(b - lo); la = a; lo = b; }
  let s = '', acc = 0, nb = 0; for (const b of by) { acc = acc * 256 + b; nb += 8; while (nb >= 5) { nb -= 5; s += RW_B32[Math.floor(acc / 2 ** nb) & 31]; acc %= 2 ** nb; } } if (nb) s += RW_B32[(acc * 2 ** (5 - nb)) & 31]; return s; }
function rwCodeRead(s) { try { s = String(s || '').toLowerCase().replace(/[^0-9a-z]/g, ''); const by = []; let acc = 0, nb = 0; for (const ch of s) { const v = RW_B32.indexOf(ch); if (v < 0) return null; acc = acc * 32 + v; nb += 5; if (nb >= 8) { nb -= 8; by.push(Math.floor(acc / 2 ** nb) & 255); acc %= 2 ** nb; } }
  let k = 0; const vi = () => { let v = 0, m = 1, b; do { b = by[k++]; if (b === undefined) throw 0; v += (b & 127) * m; m *= 128; } while (b & 128); return v & 1 ? -(v + 1) / 2 : v / 2; };
  if (by[k++] !== 1) return null; const kind = ['p2p', 'rt', 'loop'][by[k++]] || 'p2p', laps = by[k++], n = vi(), wp = []; let la = 0, lo = 0; for (let q = 0; q < n; q++) { la += vi(); lo += vi(); wp.push([la / 1e6, lo / 1e6]); } return n >= 2 ? { kind, laps, wp } : null; } catch (e) { return null; } }
// ---- what the map has round a course ----
// the land-cover class an area of the map is (see RWLC), '' for none the course needs
function rwLcOf(t) {
  const lu = t.landuse || '', na = t.natural || '', le = t.leisure || '';
  if (na === 'water' || lu === 'reservoir' || lu === 'basin' || t.waterway === 'riverbank' || t.waterway === 'dock') return 'water';
  if (lu === 'forest' || na === 'wood') return 'forest'; if (na === 'scrub') return 'scrub'; if (na === 'heath' || na === 'fell' || na === 'tundra' || na === 'moor') return 'heath';
  if (na === 'grassland' || /^(meadow|grass|village_green|recreation_ground|greenfield|flowerbed|pasture)$/.test(lu)) return 'grass';
  if (lu === 'farmland' || lu === 'farm' || lu === 'paddy') return 'farm'; if (lu === 'farmyard') return 'yard'; if (/^(orchard|plant_nursery|allotments)$/.test(lu)) return 'orchard'; if (lu === 'vineyard') return 'vineyard';
  if (/^(residential|retail|commercial|education|religious|institutional|civic|hospital)$/.test(lu)) return 'town';
  if (/^(industrial|railway|construction|garages|brownfield|depot|port|military|greenhouse_horticulture|logistics)$/.test(lu)) return 'works';
  if (na === 'wetland' || na === 'marsh' || na === 'mud') return 'wet'; if (/^(bare_rock|scree|shingle|stone|rock|blockfield)$/.test(na)) return 'rock'; if (/^(sand|beach|dune)$/.test(na)) return 'sand'; if (na === 'glacier') return 'ice';
  if (/^(park|garden|golf_course|dog_park|nature_reserve_no)$/.test(le) || lu === 'cemetery' || t.amenity === 'grave_yard') return 'park';
  if (lu === 'quarry' || lu === 'landfill') return 'quarry';
  if (/^(parking|fuel|marketplace)$/.test(t.amenity || '') || (t.area === 'yes' && t.highway) || /^(pitch|track|stadium)$/.test(le) || t.aeroway === 'apron' || t.place === 'square') return 'paved';
  return '';
}
// a building's height and shape from its tags (as tall as its levels, 2.9 m each and its roof, where its height is not given)
const RW_BK = { house: 1, detached: 1, semidetached_house: 1, terrace: 2, residential: 2, apartments: 3, church: 4, chapel: 4, cathedral: 4, basilica: 4, mosque: 4, temple: 4, shrine: 4, barn: 5, farm_auxiliary: 5, cowshed: 5, stable: 5, shed: 6, hut: 6, cabin: 6, garage: 7, garages: 7, carport: 8, roof: 8, industrial: 9, warehouse: 9, factory: 9, retail: 10, commercial: 10, supermarket: 10, office: 10, school: 11, hotel: 11, hospital: 11, civic: 11, public: 11, greenhouse: 12, ruins: 13, farm: 1, bungalow: 1, kiosk: 6, service: 6, transformer_tower: 6, toilets: 6, bunker: 6, stadium: 9, grandstand: 8, tower: 3, castle: 4 };
const RW_ROOF = { flat: 0, gabled: 1, hipped: 2, pyramidal: 3, skillion: 4, half_hipped: 2, gambrel: 1, mansard: 2, dome: 3, onion: 3, round: 1, saltbox: 1, cone: 3 };
function rwNum(v) { if (v == null) return NaN; const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/); if (!m) return NaN; let x = parseFloat(m[0]); if (/ft|'/.test(v)) x *= 0.3048; return x; }
function rwBuilding(t, area, look) {
  const b = t.building === 'yes' ? (t['building:use'] || t.amenity === 'place_of_worship' && 'church' || '') : t.building, k = RW_BK[b] || (area > 600 ? 9 : area < 25 ? 6 : 1);
  const lv = rwNum(t['building:levels']), rl = rwNum(t['roof:levels']), H0 = rwNum(t.height), mh = rwNum(t.min_height), ml = rwNum(t['building:min_level']);
  let rf = RW_ROOF[t['roof:shape']]; if (rf == null) rf = k === 9 || k === 10 || k === 11 || k === 8 || area > 450 || (lv >= 5) ? 0 : k === 6 || k === 7 ? (area < 40 ? 4 : 1) : 1;
  const lvH = 2.9, levels = lv > 0 ? lv : { 1: 2, 2: 2, 3: 4, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 3, 12: 1, 13: 1 }[k] || 2;
  let rh = rwNum(t['roof:height']); if (!(rh >= 0)) rh = rf === 0 ? 0 : rf === 4 ? 1.2 : Math.min(5, 1.6 + Math.sqrt(area) * 0.18);
  let h = H0 > 0 ? H0 : levels * lvH + (k === 4 ? 6 : k === 5 ? 2.5 : k === 9 ? 3 : 0) + (rl > 0 ? rl * 2.4 : 0) + rh; if (k === 8) h = Math.min(h, 3.2);
  const base = mh > 0 ? mh : ml > 0 ? ml * lvH : 0; rh = Math.min(rh, Math.max(0, h - base - 1.5));
  const col = /^#?[0-9a-f]{6}$/i.test(t['building:colour'] || '') ? t['building:colour'].replace('#', '') : null, rcol = /^#?[0-9a-f]{6}$/i.test(t['roof:colour'] || '') ? t['roof:colour'].replace('#', '') : null;
  const mat = { brick: 1, stone: 2, wood: 3, timber_framing: 3, concrete: 4, plaster: 0, metal: 5, glass: 6 }[t['building:material'] || ''] ?? -1;
  return { k, h: Math.round(h * 10) / 10, mh: base, rf, rh: Math.round(rh * 10) / 10, lv: levels, col, rcol, mat, rm: { tile: 1, roof_tiles: 1, slate: 2, metal: 3, tin: 3, thatch: 4, concrete: 0, asphalt: 0, glass: 5, grass: 6 }[t['roof:material'] || ''] ?? -1 };
}
// (rings from a multipolygon's member ways: joined end to end where they share an end)
function rwRings(members) {
  const out = { outer: [], inner: [] }, open = { outer: [], inner: [] }, kk = g => g.lat.toFixed(7) + ',' + g.lon.toFixed(7);
  for (const m of members) { if (m.type !== 'way' || !m.geometry || m.geometry.length < 2 || m.geometry.some(g => !g)) continue; const r = m.role === 'inner' ? 'inner' : 'outer'; const g = m.geometry.slice(); if (kk(g[0]) === kk(g[g.length - 1])) out[r].push(g); else open[r].push(g); }
  for (const r of ['outer', 'inner']) { const L = open[r]; while (L.length) { let cur = L.pop(); for (let guard = 0; guard < 500 && kk(cur[0]) !== kk(cur[cur.length - 1]); guard++) { const e = kk(cur[cur.length - 1]); let f = -1, rev = false;
      for (let q = 0; q < L.length; q++) { if (kk(L[q][0]) === e) { f = q; break; } if (kk(L[q][L[q].length - 1]) === e) { f = q; rev = true; break; } }
      if (f < 0) break; const nx = L.splice(f, 1)[0]; cur = cur.concat((rev ? nx.slice().reverse() : nx).slice(1)); }
    if (kk(cur[0]) === kk(cur[cur.length - 1]) && cur.length > 3) out[r].push(cur); } }
  return out;
}
// (a line simplified to within e metres: Douglas-Peucker)
function rwSimp(X, Z, e) { const n = X.length; if (n < 3) return [X, Z]; const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1; const st = [[0, n - 1]];
  while (st.length) { const [a, b] = st.pop(); let m = -1, dm = e; const ex = X[b] - X[a], ez = Z[b] - Z[a], L = Math.hypot(ex, ez) || 1e-9;
    for (let k = a + 1; k < b; k++) { const d = Math.abs((X[k] - X[a]) * ez - (Z[k] - Z[a]) * ex) / L; if (d > dm) { dm = d; m = k; } } if (m > 0) { keep[m] = 1; st.push([a, m], [m, b]); } }
  const x = [], z = []; for (let k = 0; k < n; k++) if (keep[k]) { x.push(X[k]); z.push(Z[k]); } return [x, z]; }
// (a closed ring simplified so: in two halves, split at its point furthest from its first)
function rwSimpRing(X, Z, e) { const n = X.length; if (n < 5) return [X.slice(), Z.slice()]; let f = 0, fd = -1; for (let k = 1; k < n - 1; k++) { const d = (X[k] - X[0]) ** 2 + (Z[k] - Z[0]) ** 2; if (d > fd) { fd = d; f = k; } }
  const a = rwSimp(X.slice(0, f + 1), Z.slice(0, f + 1), e), b = rwSimp(X.slice(f), Z.slice(f), e); return [a[0].concat(b[0].slice(1)), a[1].concat(b[1].slice(1))]; }
const rwR = v => Math.round(v * 10) / 10;
// The sea in a box round the course (x0, z0, x1, z1 in its frame), from the map's coastline (each way with the land on its
// left, the sea on its right): the ways joined end to start into lines, each line's runs through the box taken in turn
// round the box's edge (clockwise, seen with north up, the sea kept on the right all the way), islands wholly inside it
// holes in the sea round them. A line that stops inside the box (a gap in the map) is taken on to the box's nearest
// edge. Should the course's own line come out mostly at sea, the map's coastline runs the other way here, and the sea is
// the other side of it. Returns the sea's areas ({ o: [ring], in: [rings] }), [] for none, null with no coastline about
function rwSeaOf(coast, rect, F, RX, RZ) {
  const [x0, z0, x1, z1] = rect, W = x1 - x0, H = z1 - z0; if (!(W > 1 && H > 1)) return null;
  const kk = p => p[0].toFixed(7) + ',' + p[1].toFixed(7);
  // (the ways joined into lines: from each line's head - a point no way ends at - on through the ways that start where
  // the last ended; what is left over is rings)
  let lines; { const byStart = new Map(), ends = new Set(); coast.forEach((g, i) => { byStart.set(kk(g[0]), i); ends.add(kk(g[g.length - 1])); });
    const used = new Set(), out = [], walk = i => { let g = coast[i].slice(); used.add(i); for (;;) { const j = byStart.get(kk(g[g.length - 1])); if (j === undefined || used.has(j)) break; used.add(j); g = g.concat(coast[j].slice(1)); } return g; };
    coast.forEach((g, i) => { if (!used.has(i) && !ends.has(kk(g[0]))) out.push(walk(i)); }); coast.forEach((g, i) => { if (!used.has(i)) out.push(walk(i)); }); lines = out; }
  const inR = p => p[0] >= x0 && p[0] <= x1 && p[1] >= z0 && p[1] <= z1;
  const per = p => { const dt = Math.abs(p[1] - z0), dr = Math.abs(p[0] - x1), db = Math.abs(p[1] - z1), dl = Math.abs(p[0] - x0), m = Math.min(dt, dr, db, dl);
    return m === dt ? clamp((p[0] - x0) / W, 0, 1) : m === dr ? 1 + clamp((p[1] - z0) / H, 0, 1) : m === db ? 2 + clamp((x1 - p[0]) / W, 0, 1) : (3 + clamp((z1 - p[1]) / H, 0, 1)) % 4; };
  const edge = p => { const dt = p[1] - z0, dr = x1 - p[0], db = z1 - p[1], dl = p[0] - x0, m = Math.min(dt, dr, db, dl); return m === dt ? [p[0], z0] : m === dr ? [x1, p[1]] : m === db ? [p[0], z1] : [x0, p[1]]; };
  // (the part of a segment inside the box, as [t0, t1] along it, or null)
  const lb = (a, b) => { let t0 = 0, t1 = 1; const dx = b[0] - a[0], dz = b[1] - a[1], P = [-dx, dx, -dz, dz], Q = [a[0] - x0, x1 - a[0], a[1] - z0, z1 - a[1]];
    for (let k = 0; k < 4; k++) { if (P[k] === 0) { if (Q[k] < 0) return null; continue; } const r = Q[k] / P[k]; if (P[k] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; } } return [t0, t1]; };
  const pieces = [], isles = [];
  for (const g of lines) { let L = g.map(p => F.xz(p[0], p[1])); const closed = L.length > 3 && kk(g[0]) === kk(g[g.length - 1]);
    if (closed) { const o = L.findIndex(p => !inR(p)); if (o < 0) { isles.push(L.slice(0, -1)); continue; } L = L.slice(o, L.length - 1).concat(L.slice(0, o + 1)); }
    let cur = null; for (let k = 0; k + 1 < L.length; k++) { const a = L[k], b = L[k + 1], r = lb(a, b); if (!r) continue;
      const pa = [a[0] + (b[0] - a[0]) * r[0], a[1] + (b[1] - a[1]) * r[0]], pb = [a[0] + (b[0] - a[0]) * r[1], a[1] + (b[1] - a[1]) * r[1]];
      if (!cur) cur = { pts: [pa], tIn: k === 0 && r[0] === 0 && inR(a) ? null : per(pa) };
      cur.pts.push(pb); if (r[1] < 1) { cur.tOut = per(pb); pieces.push(cur); cur = null; } }
    if (cur) { cur.tOut = null; pieces.push(cur); } }
  for (const P of pieces) { if (P.tIn == null) { const e = edge(P.pts[0]); P.pts.unshift(e); P.tIn = per(e); } if (P.tOut == null) { const e = edge(P.pts[P.pts.length - 1]); P.pts.push(e); P.tOut = per(e); } }
  if (!pieces.length && !isles.length) return null;
  const inside = (rings, x, z) => { let c = false; for (const r of rings) for (let a = 0, b = r.length - 1; a < r.length; b = a++) if ((r[a][1] > z) !== (r[b][1] > z) && x < r[a][0] + (z - r[a][1]) / (r[b][1] - r[a][1]) * (r[b][0] - r[a][0])) c = !c; return c; };
  const corner = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; // (at 0, 1, 2 and 3 round the edge)
  // (each area: a run, then round the edge to the next run in, and so on until back at the first)
  const build = P => { const polys = [], done = new Set();
    for (let s = 0; s < P.length; s++) { if (done.has(s)) continue; const ring = []; let cur = s, n = 0;
      for (;;) { done.add(cur); const A = P[cur]; for (const p of A.pts) ring.push(p);
        let best = -1, bd = 9; for (let q = 0; q < P.length; q++) { const d = ((P[q].tIn - A.tOut) % 4 + 4) % 4; if (d < bd) { bd = d; best = q; } }
        const cs = []; for (let c = 0; c < 4; c++) { const d = ((c - A.tOut) % 4 + 4) % 4; if (d > 1e-9 && d < bd) cs.push([d, c]); } cs.sort((u, v) => u[0] - v[0]); for (const [, c] of cs) ring.push(corner[c]);
        if (best < 0 || best === s || done.has(best) || ++n > P.length + 2) break; cur = best; }
      polys.push(ring); }
    return polys; };
  const route = []; for (let k = 0; k < RX.length; k += 3) if (inR([RX[k], RZ[k]])) route.push([RX[k], RZ[k]]);
  const wet = polys => route.filter(p => polys.some(r => inside([r], p[0], p[1]))).length;
  let polys = pieces.length ? build(pieces) : [];
  if (pieces.length && route.length && wet(polys) > route.length * 0.25) { const p2 = build(pieces.map(A => ({ pts: A.pts.slice().reverse(), tIn: A.tOut, tOut: A.tIn }))); if (wet(p2) < wet(polys)) polys = p2; }
  if (!pieces.length) { if (!route.length || !isles.some(r => inside([r], route[0][0], route[0][1]))) return []; polys = [corner.slice()]; }
  const ring = r => { const X = r.map(p => p[0]), Z = r.map(p => p[1]); X.push(X[0]); Z.push(Z[0]); const [a, b] = rwSimpRing(X, Z, 1); return [a.map(rwR), b.map(rwR)]; };
  return polys.filter(r => r.length > 2).map(r => ({ o: [ring(r)], in: isles.filter(I => inside([r], I[0][0], I[0][1])).map(ring) }));
}
// whether a course is by the sea, and the sea's way and sweep round it: by the sea if the map's coastline makes any sea
// round it or the far heights have a fair stretch of open sea within 3 km; its way, the mean way to the far heights' open
// sea; its sweep, half the horizon's share beyond 6 km that is open sea (at least a little either side of its way)
function rwSeaSum(wat, seaF, sdx, sdz, sb, sbn, rects) {
  const n = wat.filter(A => A.wt === 'sea').length; if (!n && seaF < 30) return { on: 0, r: rects };
  const L = Math.hypot(sdx, sdz); let k = 0; for (let b = 0; b < 72; b++) if (sbn[b] && sb[b] / sbn[b] > 0.5) k++;
  return { on: 1, d: L > 0 ? [rwR(sdx / L * 100) / 100, rwR(sdz / L * 100) / 100] : [0, 1], w: rwR(clamp(Math.PI * k / 72, 0.35, 2.6) * 100) / 100, n, f: seaF, r: rects };
}
// ---- the course pack ----
// Everything the stage is built from, from the course's line: the map round it (fetched in boxes along it, each the
// stretch's extent and RW_COR metres more), the land's heights in blocks of RW_BLK cells RW_DC m apart wherever the
// course comes within some 500 m, and coarsely 15 km round. spec: { wp, kind, laps, name }; prog(stage, share)
async function rwBuildPack(spec, prog, lang) {
  const say = (k, f) => prog && prog(k, clamp(f, 0, 1));
  say('route', 0); const R = await RWRoute.plan(spec.wp, spec.kind, f => say('route', f));
  // the frame: about the middle of the course's extent
  let s = 90, w = 180, n = -90, e = -180; for (const p of R.pl) { s = Math.min(s, p[0]); n = Math.max(n, p[0]); w = Math.min(w, p[1]); e = Math.max(e, p[1]); }
  const o = [(s + n) / 2, (w + e) / 2], F = rwFrame(o[0], o[1]), RX = [], RZ = []; for (const p of R.pl) { const q = F.xz(p[0], p[1]); RX.push(q[0]); RZ.push(q[1]); }
  let len = 0; for (let k = 1; k < RX.length; k++) len += Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1]);
  if (len > 60000) throw new Error('long');
  // the ways the course is on, and those that meet it (their points in the frame, their tags)
  const ways = [], wix = new Map(), wayOf = W => { if (!W) return -1; if (wix.has(W.id)) return wix.get(W.id); const x = [], z = []; for (let k = 0; k < W.n; k++) { const q = F.xz(W.la[k], W.lo[k]); x.push(rwR(q[0])); z.push(rwR(q[1])); }
    const t = {}; for (const k of ['highway', 'surface', 'width', 'lanes', 'oneway', 'junction', 'bridge', 'tunnel', 'covered', 'layer', 'tracktype', 'smoothness', 'name', 'ref', 'maxspeed', 'lit', 'sidewalk', 'cutting', 'embankment', 'access', 'service', 'width:carriageway']) if (W.t[k] != null) t[k] = String(W.t[k]).slice(0, 60);
    ways.push({ id: W.id, t, x, z }); wix.set(W.id, ways.length - 1); return ways.length - 1; };
  const segW = R.seg.map(sg => sg.W ? wayOf(sg.W) : (sg.syn ? wayOf(sg.syn) : 0));
  const jn = []; for (const B of RWRoute.branches(R, 0, R.pl.length)) jn.push({ way: wayOf(B.W), at: B.at, dir: B.dir, q: B.q });
  // the boxes the map is fetched in: the line taken a stretch at a time, each box at most some 2.5 km square
  const boxes = []; { let b = null; const add = (la, lo) => { if (!b) b = [la, lo, la, lo]; else { b[0] = Math.min(b[0], la); b[1] = Math.min(b[1], lo); b[2] = Math.max(b[2], la); b[3] = Math.max(b[3], lo); } };
    for (let k = 0; k < R.pl.length; k++) { add(R.pl[k][0], R.pl[k][1]); const h = RWRoute.dist(b[0], b[1], b[2], b[1]), wd = RWRoute.dist(b[0], b[1], b[0], b[3]); if (h * wd > 2.2e6 || k === R.pl.length - 1) { boxes.push(b); b = null; if (k < R.pl.length - 1) add(R.pl[k][0], R.pl[k][1]); } } }
  const mla = RW_COR / 110574, mlo = RW_COR / (111320 * Math.cos(o[0] * D2R)), els = new Map(); let bi = 0;
  for (const b of boxes) { const bb = [b[0] - mla, b[1] - mlo, b[2] + mla, b[3] + mlo].map(v => v.toFixed(5)).join(',');
    const q = `[out:json][timeout:150][maxsize:536870912];(way[building](${bb});relation[building][type=multipolygon](${bb});way[landuse](${bb});relation[landuse][type=multipolygon](${bb});way[natural](${bb});relation[natural][type=multipolygon](${bb});way[leisure~"^(park|garden|golf_course|pitch|track|stadium|playground)$"](${bb});way[waterway](${bb});relation[waterway=riverbank](${bb});way[barrier](${bb});way[highway](${bb});way[railway~"^(rail|tram|light_rail|narrow_gauge|disused|preserved)$"](${bb});way[power~"^(line|minor_line)$"](${bb});way[amenity~"^(parking|fuel|marketplace)$"](${bb});node[natural=tree](${bb});node[highway~"^(street_lamp|traffic_signals|stop|give_way|crossing|bus_stop|milestone)$"](${bb});node[power~"^(pole|tower)$"](${bb});node[barrier~"^(bollard|gate|lift_gate)$"](${bb});node[amenity~"^(bench|post_box|telephone|waste_basket)$"](${bb}););out body geom qt;`;
    const J = await RWNet.overpass(q); for (const el of J.elements || []) els.set(el.type[0] + el.id, el); bi++; say('map', bi / boxes.length); }
  // the course's line as a grid of cells 25 m square: how far each cell is from it (for what is kept: within RW_COR)
  const SH = new SHash(40); for (let k = 0; k < RX.length - 1; k++) { const L = Math.hypot(RX[k + 1] - RX[k], RZ[k + 1] - RZ[k]); for (let d = 0; d <= L; d += 10) { const f = L ? d / L : 0; SH.add(RX[k] + (RX[k + 1] - RX[k]) * f, RZ[k] + (RZ[k + 1] - RZ[k]) * f, k); } }
  const nearLine = (x, z, r) => { let best = 1e9; SH.query(x, z, r, (k) => { const ax = RX[k], az = RZ[k], ex = RX[k + 1] - ax, ez = RZ[k + 1] - az, L2 = ex * ex + ez * ez || 1e-9, t = clamp(((x - ax) * ex + (z - az) * ez) / L2, 0, 1); best = Math.min(best, Math.hypot(x - ax - ex * t, z - az - ez * t)); }); return best; };
  const look = rwLookFor(o[0], o[1], 0, false), toXZ = g => { const X = [], Z = []; for (const p of g) { const q = F.xz(p.lat, p.lon); X.push(rwR(q[0])); Z.push(rwR(q[1])); } return [X, Z]; };
  const bld = [], lc = [], wat = [], wl = [], bar = [], pt = [], pw = [], rail = [], net = [], routeW = new Set(R.seg.filter(sg => sg.W).map(sg => sg.W.id));
  const clipRuns = (X, Z) => { const out = []; let cur = null; const r = RW_COR + 40; for (let k = 0; k < X.length; k++) { const inn = nearLine(X[k], Z[k], r) <= r;
      if (inn) { if (!cur) { cur = [[], []]; if (k > 0) { cur[0].push(X[k - 1]); cur[1].push(Z[k - 1]); } } cur[0].push(X[k]); cur[1].push(Z[k]); } else if (cur) { cur[0].push(X[k]); cur[1].push(Z[k]); if (cur[0].length > 1) out.push(cur); cur = null; } }
    if (cur && cur[0].length > 1) out.push(cur); return out; };
  const ringArea = (X, Z) => { let a = 0; for (let k = 0, j = X.length - 1; k < X.length; j = k++) a += (X[j] + X[k]) * (Z[j] - Z[k]); return a / 2; };
  for (const el of els.values()) { const t = el.tags || {};
    if (el.type === 'node') { const q = F.xz(el.lat, el.lon); if (nearLine(q[0], q[1], RW_COR) > RW_COR) continue; const k = t.natural === 'tree' ? 'tree' : t.highway === 'street_lamp' ? 'lamp' : t.highway === 'traffic_signals' ? 'signals' : t.highway === 'stop' ? 'stop' : t.highway === 'give_way' ? 'giveway' : t.highway === 'crossing' ? 'crossing' : t.highway === 'bus_stop' ? 'bus' : t.highway === 'milestone' ? 'mile' : t.power === 'tower' ? 'tower' : t.power === 'pole' ? 'pole' : t.barrier === 'bollard' ? 'bollard' : /gate/.test(t.barrier || '') ? 'gate' : t.amenity === 'bench' ? 'bench' : t.amenity === 'post_box' ? 'postbox' : t.amenity === 'telephone' ? 'phone' : t.amenity === 'waste_basket' ? 'bin' : '';
      if (k) pt.push({ k, x: rwR(q[0]), z: rwR(q[1]), h: rwNum(t.height) || 0, d: rwNum(t.direction) }); continue; }
    // (areas: a way that closes on itself, or a multipolygon's rings)
    let rings = null; if (el.type === 'relation') { if (!el.members) continue; const rr = rwRings(el.members); if (!rr.outer.length) continue; rings = { o: rr.outer.map(toXZ), in: rr.inner.map(toXZ) }; }
    const g = el.geometry; if (el.type === 'way' && (!g || g.length < 2 || g.some(p => !p))) continue;
    const closed = el.type === 'way' && g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon;
    const near = (X, Z, r) => { for (let k = 0; k < X.length; k += Math.max(1, X.length >> 6)) if (nearLine(X[k], Z[k], r) <= r) return true; let cx = 0, cz = 0; for (let k = 0; k < X.length; k++) { cx += X[k]; cz += Z[k]; } return nearLine(cx / X.length, cz / X.length, r) <= r; };
    if (t.building && t.building !== 'no' && (rings || closed)) { const R2 = rings || { o: [toXZ(g)], in: [] }; for (const [X0, Z0] of R2.o) { if (!near(X0, Z0, RW_COR)) continue; const [X, Z] = rwSimpRing(X0, Z0, 0.2); if (X.length < 4) continue; X.pop(); Z.pop(); const A = Math.abs(ringArea(X, Z)); if (A < 6) continue;
        let cx = 0, cz = 0; for (let k = 0; k < X.length; k++) { cx += X[k]; cz += Z[k]; } cx /= X.length; cz /= X.length; const B = rwBuilding(t, A, look); bld.push(Object.assign({ x: X, z: Z, cx: rwR(cx), cz: rwR(cz), a: Math.round(A), name: t.name ? String(t.name).slice(0, 40) : undefined }, B)); } continue; }
    const lk = rwLcOf(t);
    if (lk && (rings || closed)) { const R2 = rings || { o: [toXZ(g)], in: [] }, keep = R2.o.filter(([X, Z]) => X.length > 3); if (!keep.length) continue;
      // (an area wholly far from the course is left out; one round it kept whole, simplified to within a metre)
      let any = false; for (const [X, Z] of keep) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < X.length; k++) { x0 = Math.min(x0, X[k]); x1 = Math.max(x1, X[k]); z0 = Math.min(z0, Z[k]); z1 = Math.max(z1, Z[k]); }
        if (near(X, Z, RW_COR + 200) || nearLine((x0 + x1) / 2, (z0 + z1) / 2, RW_COR + Math.hypot(x1 - x0, z1 - z0) / 2) <= RW_COR + Math.hypot(x1 - x0, z1 - z0) / 2) any = true; }
      if (!any) continue; const S = r => r.map(([X, Z]) => rwSimpRing(X, Z, 1)).filter(([X]) => X.length > 3);
      const A = { k: lk, o: S(keep), in: S(R2.in || []) }; if (!A.o.length) continue; if (lk === 'water') { A.wt = t.water || t.waterway || t.natural; wat.push(A); } else lc.push(A); continue; }
    if (el.type !== 'way') continue;
    const [X1, Z1] = toXZ(g); if (!near(X1, Z1, RW_COR)) continue;
    // (a line kept only where it runs within the map's reach of the course: its runs there, a point beyond each end)
    const cl = clipRuns(X1, Z1); for (const [X0, Z0] of cl) {
    if (t.waterway && /^(river|stream|canal|drain|ditch|brook|tidal_channel)$/.test(t.waterway)) { const [X, Z] = rwSimp(X0, Z0, 0.6); wl.push({ x: X, z: Z, k: t.waterway, w: rwNum(t.width) || { river: 12, canal: 9, stream: 2.4, brook: 1.8, drain: 1.6, ditch: 1.2, tidal_channel: 4 }[t.waterway], tu: rwYes(t.tunnel) || t.tunnel === 'culvert' ? 1 : 0 }); continue; }
    if (t.barrier && !closed || (t.barrier && closed && /^(wall|fence|hedge|retaining_wall|city_wall)$/.test(t.barrier))) { const k = /^(wall|city_wall|retaining_wall|dry_stone_wall?)$/.test(t.barrier) || (t.barrier === 'wall') ? 'wall' : t.barrier === 'fence' ? 'fence' : t.barrier === 'hedge' ? 'hedge' : t.barrier === 'guard_rail' ? 'rail' : t.barrier === 'jersey_barrier' ? 'jersey' : t.barrier === 'kerb' || t.barrier === 'handrail' ? '' : t.barrier === 'retaining_wall' ? 'wall' : '';
      if (k) { const [X, Z] = rwSimp(X0, Z0, 0.3); bar.push({ k, x: X, z: Z, h: rwNum(t.height) || 0, wt: t.wall || t.fence_type || t.material || '' }); } continue; }
    if (t.natural === 'tree_row') { const [X, Z] = rwSimp(X0, Z0, 0.5); bar.push({ k: 'trees', x: X, z: Z, h: rwNum(t.height) || 0 }); continue; }
    if (t.natural === 'cliff' || t.natural === 'ridge' || t.natural === 'coastline') continue;
    if (t.power === 'line' || t.power === 'minor_line') { pw.push({ k: t.power === 'line' ? 'line' : 'minor', x: X0, z: Z0 }); continue; }
    if (t.railway) { const [X, Z] = rwSimp(X0, Z0, 0.4); rail.push({ k: t.railway, x: X, z: Z, br: rwYes(t.bridge) ? 1 : 0, tu: rwYes(t.tunnel) ? 1 : 0 }); continue; }
    if (t.highway && !(t.area === 'yes')) { const [X, Z] = rwSimp(X0, Z0, 0.3), hw = t.highway; if (/^(proposed|construction|abandoned|platform|corridor|elevator|razed)$/.test(hw)) continue;
      const foot = /^(footway|path|cycleway|bridleway|steps|pedestrian|sidewalk)$/.test(hw), wd = foot ? (rwNum(t.width) || (hw === 'pedestrian' ? 4 : hw === 'cycleway' ? 2.2 : 1.6)) : rwWidthOf(t, RW_NARROW.has(look));
      net.push({ id: el.id, own: routeW.has(el.id) ? 1 : 0, hw, x: X, z: Z, w: Math.round(wd * 10) / 10, s: rwSurfOf(t, RW_GRAVEL.has(look), false), br: rwYes(t.bridge) ? 1 : 0, tu: rwYes(t.tunnel) ? 1 : 0, ly: parseInt(t.layer, 10) || 0, foot: foot ? 1 : 0 }); continue; }
    } }
  // the sea: the map's coastline in each box the map was fetched in, with a kilometre more round it (so every block of
  // land heights round the course is within one), made the sea's areas there (see rwSeaOf); kept as water at the sea's
  // level, and the boxes as the places the map's coastline speaks for
  const seaR = []; { const cm = 1000, cla = cm / 110574, clo = cm / (111320 * Math.cos(o[0] * D2R));
    for (const b of boxes) { const q = [b[0] - mla - cla, b[1] - mlo - clo, b[2] + mla + cla, b[3] + mlo + clo], bb = q.map(v => v.toFixed(5)).join(',');
      let J = null; try { J = await RWNet.overpass(`[out:json][timeout:90];way[natural=coastline](${bb});out geom qt;`); } catch (e) { continue; }
      const coast = (J.elements || []).filter(el => el.type === 'way' && el.geometry && el.geometry.length > 1 && !el.geometry.some(p => !p)).map(el => el.geometry.map(p => [p.lat, p.lon]));
      const a = F.xz(q[2], q[1]), c = F.xz(q[0], q[3]), rect = [a[0], a[1], c[0], c[1]]; seaR.push(rect.map(Math.round)); if (!coast.length) continue;
      const S = rwSeaOf(coast, rect, F, RX, RZ); if (S) for (const A of S) wat.push({ k: 'water', o: A.o, in: A.in, wt: 'sea' }); } }
  // the land's heights: the blocks the course comes near, then the far land, then along the line itself every 2 m
  say('land', 0); const zN = 14, zF = 11, BS = RW_BLK * RW_DC, keys = new Set();
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < RX.length; k++) { x0 = Math.min(x0, RX[k]); x1 = Math.max(x1, RX[k]); z0 = Math.min(z0, RZ[k]); z1 = Math.max(z1, RZ[k]); }
  for (let bz = Math.floor((z0 - 600) / BS); bz <= Math.floor((z1 + 600) / BS); bz++) for (let bx = Math.floor((x0 - 600) / BS); bx <= Math.floor((x1 + 600) / BS); bx++) { const cx = (bx + 0.5) * BS, cz = (bz + 0.5) * BS; if (nearLine(cx, cz, 540 + BS * 0.71) <= 540 + BS * 0.71) keys.add(bx + ',' + bz); }
  const llBox = (ax, az, bx2, bz2) => { const a = F.ll(ax, az), b = F.ll(bx2, bz2), c = F.ll(ax, bz2), d = F.ll(bx2, az); return [Math.min(a[0], b[0], c[0], d[0]), Math.min(a[1], b[1], c[1], d[1]), Math.max(a[0], b[0], c[0], d[0]), Math.max(a[1], b[1], c[1], d[1])]; };
  { const tl = new Set(); for (const key of keys) { const [bx, bz] = key.split(',').map(Number), q = llBox(bx * BS, bz * BS, (bx + 1) * BS, (bz + 1) * BS), t0 = rwTileXY(zN, q[2], q[1]), t1 = rwTileXY(zN, q[0], q[3]);
      for (let ty = Math.floor(t0[1]); ty <= Math.floor(t1[1]); ty++) for (let tx = Math.floor(t0[0]); tx <= Math.floor(t1[0]); tx++) tl.add(tx + '/' + ty); }
    let dn = 0; const L = [...tl]; let k = 0; const run = async () => { while (k < L.length) { const [tx, ty] = L[k++].split('/').map(Number); await RWDem.tile(zN, tx, ty); dn++; say('land', 0.75 * dn / L.length); } };
    await Promise.all([run(), run(), run(), run(), run(), run()]); }
  const blocks = {}; let hmin = 1e9, hmax = -1e9; const raw = new Map();
  for (const key of keys) { const [bx, bz] = key.split(',').map(Number), A = new Float32Array((RW_BLK + 1) * (RW_BLK + 1)); let any = false;
    for (let j = 0; j <= RW_BLK; j++) for (let i = 0; i <= RW_BLK; i++) { const ll = F.ll(bx * BS + i * RW_DC, bz * BS + j * RW_DC), h = RWDem.at(zN, ll[0], ll[1]); A[j * (RW_BLK + 1) + i] = h === null ? NaN : h; if (h !== null) { any = true; hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); } }
    if (any) raw.set(key, A); }
  if (!raw.size) throw new Error('noland');
  const qN = Math.max(0.02, (hmax - hmin + 40) / 65000), bN = Math.floor(hmin) - 20;
  for (const [key, A] of raw) { const U = new Uint16Array(A.length); for (let k = 0; k < A.length; k++) U[k] = A[k] === A[k] ? clamp(Math.round((A[k] - bN) / qN), 0, 65534) : 65535; blocks[key] = U; }
  // (far: 15 km round the course's extent, at most 400 cells a side)
  const fx0 = x0 - 15000, fz0 = z0 - 15000, fx1 = x1 + 15000, fz1 = z1 + 15000, fc = Math.max(60, Math.ceil(Math.max(fx1 - fx0, fz1 - fz0) / 400)), fnx = Math.ceil((fx1 - fx0) / fc) + 1, fnz = Math.ceil((fz1 - fz0) / fc) + 1;
  { const q = llBox(fx0, fz0, fx1, fz1); await RWDem.cover(zF, q[0], q[1], q[2], q[3], f => say('land', 0.75 + 0.2 * f)); }
  const FH = new Float32Array(fnx * fnz); let fmin = 1e9, fmax = -1e9; for (let j = 0; j < fnz; j++) for (let i = 0; i < fnx; i++) { const ll = F.ll(fx0 + i * fc, fz0 + j * fc), h = RWDem.at(zF, ll[0], ll[1]); FH[j * fnx + i] = h === null ? NaN : h; if (h !== null) { fmin = Math.min(fmin, h); fmax = Math.max(fmax, h); } }
  const qF = Math.max(0.05, (fmax - fmin + 40) / 65000), bF = Math.floor(fmin) - 20, FU = new Uint16Array(FH.length); for (let k = 0; k < FH.length; k++) FU[k] = FH[k] === FH[k] ? clamp(Math.round((FH[k] - bF) / qF), 0, 65534) : 65535;
  // (the open sea as the far heights have it - their level 0, where the models end at the coast: how much of it lies
  // within 3 km of the course, which way it lies, and how wide a sweep of the horizon beyond 6 km it fills)
  let seaF = 0, sdx = 0, sdz = 0; const sb = new Float32Array(72), sbn = new Float32Array(72), scx = (x0 + x1) / 2, scz = (z0 + z1) / 2;
  for (let j = 0; j < fnz; j++) for (let i = 0; i < fnx; i++) { const h = FH[j * fnx + i]; if (!(h === h)) continue; const x = fx0 + i * fc, z = fz0 + j * fc, d = Math.hypot(x - scx, z - scz) || 1, sea = Math.abs(h) < 0.01;
    if (d > 6000) { const b = Math.floor((Math.atan2(z - scz, x - scx) + Math.PI) / (2 * Math.PI) * 72) % 72; sbn[b]++; if (sea) sb[b]++; }
    if (sea) { sdx += (x - scx) / d; sdz += (z - scz) / d; if (x > x0 - 3000 && x < x1 + 3000 && z > z0 - 3000 && z < z1 + 3000) seaF++; } }
  // (along the line: every 2 m on the map's line, from the finest heights; where none, the far ones)
  const pds = 2, prof = []; { const cum = [0]; for (let k = 1; k < RX.length; k++) cum.push(cum[k - 1] + Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1])); let k = 0;
    for (let d = 0; d <= cum[cum.length - 1] + 1e-6; d += pds) { while (k < RX.length - 2 && cum[k + 1] < d) k++; const L = cum[k + 1] - cum[k] || 1, f = clamp((d - cum[k]) / L, 0, 1), x = RX[k] + (RX[k + 1] - RX[k]) * f, z = RZ[k] + (RZ[k + 1] - RZ[k]) * f, ll = F.ll(x, z); let h = RWDem.at(zN, ll[0], ll[1]); if (h === null) h = RWDem.at(zF, ll[0], ll[1]); prof.push(h === null ? (prof.length ? prof[prof.length - 1] : 0) : h); } }
  let dA = 0; for (let k = 1; k <= R.a; k++) dA += Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1]);
  const y0 = Math.round(prof[Math.min(prof.length - 1, Math.round(dA / pds))]); // (the start about level 0)
  // (each water body's level: a lake's, the lower part of the land round its shore; a river's, its banks' own, each)
  const dn = { c: RW_DC, bs: RW_BLK, b: bN, q: qN, blocks }, df = { x0: fx0, z0: fz0, c: fc, nx: fnx, nz: fnz, b: bF, q: qF, h: FU };
  const hAt = (x, z) => { const ll = F.ll(x, z); const h = RWDem.at(zN, ll[0], ll[1]); return h === null ? RWDem.at(zF, ll[0], ll[1]) : h; };
  for (const A of wat) { if (A.wt === 'sea') { A.lv = rwR(-y0); continue; } const [X, Z] = A.o[0]; const vs = []; let per = 0; for (let k = 1; k < X.length; k++) per += Math.hypot(X[k] - X[k - 1], Z[k] - Z[k - 1]); const river = /river|stream|canal|riverbank/.test(A.wt || '') || per > 4000;
    if (!river) { for (let k = 0; k < X.length; k++) { const h = hAt(X[k], Z[k]); if (h !== null) vs.push(h); } vs.sort((p, q) => p - q); A.lv = vs.length ? rwR(vs[Math.floor(vs.length * 0.2)] - 0.25 - y0) : null; }
    else { const ev = []; for (const [X2, Z2] of A.o) for (let k = 0; k < X2.length; k += 1) { const h = hAt(X2[k], Z2[k]); if (h !== null) ev.push(X2[k], Z2[k], rwR(h - 0.6 - y0)); } A.ev = ev; A.lv = null; } }
  for (const L of wl) { L.y = []; for (let k = 0; k < L.x.length; k++) { const h = hAt(L.x[k], L.z[k]); L.y.push(h === null ? 0 : rwR(h - y0)); } for (let k = 1; k < L.y.length; k++) L.y[k] = Math.min(L.y[k], L.y[k - 1] + 0.05 * Math.hypot(L.x[k] - L.x[k - 1], L.z[k] - L.z[k - 1])); }
  say('land', 1);
  // (the place's name: the map's for where the course's middle is, unless the course has its own)
  const mid = R.pl[Math.floor((R.a + R.b) / 2)], name = spec.name || await RWNet.placeName(mid[0], mid[1], lang);
  const alt = prof.reduce((a, b) => a + b, 0) / prof.length;
  return { v: RW_PACK_V, name, code: rwCodeOf(spec), kind: spec.kind, laps: spec.laps || 1, wp: spec.wp, o, made: Date.now(), alt: Math.round(alt),
    r: { x: RX.map(rwR), z: RZ.map(rwR), w: segW, a: R.a, b: R.b }, ways, jn, prof: new Float32Array(prof.map(h => h - y0)), pds, y0, dn, df, bld, lc, wat, wl, bar, pt, pw, rail, net, sea: rwSeaSum(wat, seaF, sdx, sdz, sb, sbn, seaR),
    src: 'map: OpenStreetMap contributors (ODbL); heights: Mapterhorn, AWS Terrain Tiles', len: Math.round(len) };
}
// ---- packs to keep, send and read: JSON, its typed arrays as base64, gzipped ----
function rwB64(u8) { let s = ''; for (let k = 0; k < u8.length; k += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000)); return btoa(s); }
function rwUnB64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) u[k] = b.charCodeAt(k); return u; }
function rwPackOut(K) { const tA = a => a instanceof Uint16Array ? { $u16: rwB64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength)) } : a instanceof Float32Array ? { $f32: rwB64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength)) } : a;
  return JSON.stringify(K, (k, v) => k === '_rt' ? undefined : (v instanceof Uint16Array || v instanceof Float32Array) ? tA(v) : v); }
function rwPackIn(txt) { const K = JSON.parse(txt, (k, v) => { if (v && typeof v === 'object' && v.$u16) { const u = rwUnB64(v.$u16); return new Uint16Array(u.buffer, u.byteOffset, u.byteLength >> 1); } if (v && typeof v === 'object' && v.$f32) { const u = rwUnB64(v.$f32); return new Float32Array(u.buffer, u.byteOffset, u.byteLength >> 2); } return v; });
  if (!K || K.v !== RW_PACK_V || !K.r || !K.dn || !K.prof) throw new Error('badpack'); return K; }
async function rwGzip(txt) { if (typeof CompressionStream === 'undefined') return new Blob([txt], { type: 'application/json' }); const s = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip')); return new Blob([await new Response(s).arrayBuffer()], { type: 'application/gzip' }); }
async function rwGunzip(buf) { const u = new Uint8Array(buf); if (u[0] === 0x1f && u[1] === 0x8b && typeof DecompressionStream !== 'undefined') return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); return new TextDecoder().decode(u); }
