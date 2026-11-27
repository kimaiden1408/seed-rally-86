// ==== ROUND 46: REAL ROADS (the core) ====
// A course on real roads is laid from its course pack (see RW in the page: the road and its surroundings as mapped in
// OpenStreetMap, the land from public elevation tiles), not from a seed: the road where the map has it, as wide and of
// the surface the map says, over the land as it lies, its junctions' side roads where they meet it, its bridges where they
// are. What the map does not say (a verge's cross-section, the road's unevenness, its crown) is filled in as the
// generator fills it in for the country the course is in. The local frame: x east, z south, metres, about the course's
// middle (a Mercator projection scaled to true metres there, so shapes and bearings are true).
const RW_R = 6378137, RW_PACK_V = 1;
function rwMerc(lat, lon) { const f = clamp(lat, -85.05, 85.05) * D2R; return [RW_R * lon * D2R, RW_R * Math.log(Math.tan(Math.PI / 4 + f / 2))]; }
function rwFrame(lat0, lon0) {
  const m0 = rwMerc(lat0, lon0), c = Math.cos(lat0 * D2R);
  return { lat0, lon0, c, xz: (lat, lon) => { const m = rwMerc(lat, lon); return [(m[0] - m0[0]) * c, -(m[1] - m0[1]) * c]; },
    ll: (x, z) => { const mx = x / c + m0[0], my = -z / c + m0[1]; return [(2 * Math.atan(Math.exp(my / RW_R)) - Math.PI / 2) / D2R, mx / RW_R / D2R]; } };
}
// a height grid (DEM): the far land's { x0, z0, c (cell, m), nx, nz, b (base, m), q (m a unit), h (Uint16Array; 65535 none) };
// the near land's in blocks { c, bs (cells a side), b, q, blocks: { 'bx,bz': Uint16Array((bs + 1) squared) } }, block bx
// covering x from bx bs c to (bx + 1) bs c
function rwGridAt(G, x, z) {
  if (!G) return null; let H, fx, fz, nx;
  if (G.blocks) { const S = G.c * G.bs, bx = Math.floor(x / S), bz = Math.floor(z / S), B = G.blocks[bx + ',' + bz]; if (!B) return null; H = B; nx = G.bs + 1; fx = (x - bx * S) / G.c; fz = (z - bz * S) / G.c; }
  else { fx = (x - G.x0) / G.c; fz = (z - G.z0) / G.c; if (!(fx >= 0 && fz >= 0 && fx <= G.nx - 1 && fz <= G.nz - 1)) return null; H = G.h; nx = G.nx; }
  const i = Math.min(nx - 2, Math.max(0, fx | 0)), j = Math.max(0, Math.min((H.length / nx | 0) - 2, fz | 0)), u = fx - i, v = fz - j, k = j * nx + i, a = H[k], b = H[k + 1], c = H[k + nx], d = H[k + nx + 1];
  if (a === 65535 || b === 65535 || c === 65535 || d === 65535) return null;
  return G.b + G.q * ((a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v);
}
// the land-cover classes (lc: what the land is, from the map's landuse, natural and leisure areas), each with its draw
// order (a later one overwrites an earlier where they overlap), whether trees grow there (tc: cover 0-1, -1 none) and
// the zone of the stage a road through it is in
const RWLC = ['', 'forest', 'scrub', 'heath', 'grass', 'farm', 'orchard', 'vineyard', 'town', 'works', 'paved', 'water', 'wet', 'rock', 'sand', 'ice', 'park', 'yard', 'quarry'];
const RWLC_TC = [0, 0.95, 0.42, 0.06, -1, -1, 0.6, -1, 0.12, -1, -1, -1, 0.05, -1, -1, -1, 0.35, 0.1, -1];
const RWLC_ZONE = ['', 'forest', 'open', 'open', 'open', 'farm', 'farm', 'vineyard', 'village', 'village', 'village', 'open', 'open', 'open', 'open', 'open', 'village', 'farm', 'open'];
const rwLcId = k => Math.max(0, RWLC.indexOf(k));
// the pack made ready to build from (once): its frame, and over the near land's blocks what the land is (each cell's
// class and the area it belongs to) and each water body's level (the land under a lake lies under its water)
function rwPrep(K) {
  if (K._rt) return K._rt;
  const F = rwFrame(K.o[0], K.o[1]), D = K.dn, c = D.c, bs = D.bs, S = c * bs, n1 = bs + 1, rt = { F, c, bs, S, cls: new Map(), pid: new Map(), wl: new Map() };
  for (const key in D.blocks) { rt.cls.set(key, new Uint8Array(n1 * n1)); rt.pid.set(key, new Int32Array(n1 * n1).fill(-1)); }
  // (an area filled by its rings, even-odd, at the cells' points, in each block it reaches)
  const fill = (rings, f) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of rings) for (let k = 0; k < r[0].length; k++) { x0 = Math.min(x0, r[0][k]); x1 = Math.max(x1, r[0][k]); z0 = Math.min(z0, r[1][k]); z1 = Math.max(z1, r[1][k]); }
    for (let bz = Math.floor(z0 / S); bz <= Math.floor(z1 / S); bz++) for (let bx = Math.floor(x0 / S); bx <= Math.floor(x1 / S); bx++) { const key = bx + ',' + bz; if (!rt.cls.has(key)) continue; const xs = [];
      for (let j = 0; j < n1; j++) { const zc = bz * S + j * c; if (zc < z0 || zc > z1) continue; xs.length = 0;
        for (const r of rings) { const X = r[0], Z = r[1], n = X.length; for (let a = 0, b = n - 1; a < n; b = a++) { const za = Z[a], zb = Z[b]; if ((za > zc) !== (zb > zc)) xs.push(X[a] + (zc - za) / (zb - za) * (X[b] - X[a])); } }
        if (xs.length < 2) continue; xs.sort((p, q) => p - q);
        for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil((xs[q] - bx * S) / c)), i1 = Math.min(bs, Math.floor((xs[q + 1] - bx * S) / c)); for (let i = i0; i <= i1; i++) f(key, j * n1 + i, bx * S + i * c, zc); } } } };
  const order = (K.lc || []).map((a, n) => n).sort((p, q) => rwLcRank(K.lc[p].k) - rwLcRank(K.lc[q].k));
  for (const n of order) { const A = K.lc[n], cl = rwLcId(A.k); if (!cl) continue; fill(A.o.concat(A.in || []), (key, k) => { rt.cls.get(key)[k] = cl; rt.pid.get(key)[k] = n; }); }
  (K.wat || []).forEach((A, n) => { const wc = rwLcId('water'); fill(A.o.concat(A.in || []), (key, k, x, z) => { rt.cls.get(key)[k] = wc; rt.pid.get(key)[k] = 100000 + n; let W = rt.wl.get(key); if (!W) rt.wl.set(key, W = new Float32Array(n1 * n1).fill(NaN)); W[k] = A.lv != null ? A.lv : rwWaterLv(A, x, z); }); });
  return K._rt = rt;
}
// (the order areas are drawn in: the broad ones first, the detailed and the built over them)
function rwLcRank(k) { return { farm: 1, grass: 2, heath: 2, scrub: 3, forest: 4, orchard: 5, vineyard: 5, wet: 5, sand: 6, rock: 6, ice: 6, quarry: 7, town: 7, yard: 8, works: 8, park: 9, paved: 10, water: 11 }[k] || 0; }
// a river's level at a point within it: the level of its nearest edge point (each edge point's own, as the pack has it)
function rwWaterLv(A, x, z) { const L = A.ev; if (!L) return A.lv != null ? A.lv : null; let best = 1e18, v = L[2]; for (let k = 0; k < L.length; k += 3) { const d = (L[k] - x) * (L[k] - x) + (L[k + 1] - z) * (L[k + 1] - z); if (d < best) { best = d; v = L[k + 2]; } } return v; }
// what the land is at a point: its class (index into RWLC; 0 unknown), and the area it belongs to; a water body's level
const rwCell = (rt, x, z) => { const bx = Math.floor(x / rt.S), bz = Math.floor(z / rt.S), i = Math.round((x - bx * rt.S) / rt.c), j = Math.round((z - bz * rt.S) / rt.c); return [bx + ',' + bz, j * (rt.bs + 1) + i]; };
function rwLcAt(rt, x, z) { const [key, k] = rwCell(rt, x, z), A = rt.cls.get(key); return A ? A[k] : 0; }
function rwPidAt(rt, x, z) { const [key, k] = rwCell(rt, x, z), A = rt.pid.get(key); return A ? A[k] : -1; }
function rwWaterAt(rt, x, z) { const [key, k] = rwCell(rt, x, z), A = rt.wl.get(key); if (!A) return null; const v = A[k]; return v === v ? v : null; }
// the land as the map has it (m, about the course's start): the near heights, else the far ones, else the far grid's
// nearest edge; under water a little below the water's level
function rwInBoxes(B, x, z) { if (B) for (const b of B) if (x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3]) return true; return false; }
function rwNat(K, x, z) {
  let h = rwGridAt(K.dn, x, z), far = h === null; if (far) { h = rwGridAt(K.df, x, z); if (h === null) { const G = K.df; h = G ? rwGridAt(G, clamp(x, G.x0, G.x0 + (G.nx - 1) * G.c - 0.01), clamp(z, G.z0, G.z0 + (G.nz - 1) * G.c - 0.01)) : 0; if (h === null) h = K.y0 || 0; } }
  // (by the sea: where the heights have the open sea - their level 0 - the bed below the water; near the course only
  // where the map's coastline has nothing to say, as within its boxes the coastline's own sea does: see rwSeaOf)
  const S = K.sea; if (S && S.on && h < (far ? 0.15 : 0.05) && (far || !rwInBoxes(S.r, x, z))) h = Math.min(h, -1.5);
  h -= K.y0 || 0; const rt = K._rt; if (rt && rt.wl.size) { const w = rwWaterAt(rt, x, z); if (w !== null) { if (h > w - 0.9) h = w - 0.9; return h; } }
  return h > -1 ? rwTuCover(K, x, z, h) : h;
}
// The hill over a real tunnel, where the map's heights give too little of one (a gallery by the sea, a covered cutting, a
// street under a building): over its tube the land at least its crown and a cover of 1.4 m, falling away beside it as a
// bank does. Only once the road's own heights are settled (on: see layStage), so they never depend on it.
// (whether a point near the ground y stands in a real tunnel's tube, or within m of it, under its cover: nothing grows
// or stands there)
function rwInTube(C, x, z, y, m) { const U = C && C._tu; if (!U) return false; const L = U.g.get(Math.floor(x / U.c) + ',' + Math.floor(z / U.c)); if (!L) return false;
  for (const p of L) if (Math.hypot(x - p.x, z - p.z) < p.w / 2 + 0.9 + m && !(y > p.y + 7.4)) return true; return false; }
function rwTuCover(K, x, z, h) {
  const U = K._tu; if (!U || !U.on) return h; const L = U.g.get(Math.floor(x / U.c) + ',' + Math.floor(z / U.c)); if (!L) return h;
  for (const p of L) { const e = Math.hypot(x - p.x, z - p.z) - p.w / 2 - 0.9; if (e < 9 && p.y === p.y) h = Math.max(h, p.y + 7.4 - Math.max(0, e - 2.5)); }
  return h;
}
// the way's own: its width as driven (m), from the map's width, else its lanes, else what a road of its kind is in that
// country; and the surface the game drives on
const RW_LANE = { motorway: 3.6, trunk: 3.5, primary: 3.3, secondary: 3.1, tertiary: 3.0, unclassified: 2.75, residential: 2.75, living_street: 2.4, service: 3.0, track: 3.0, road: 2.9, raceway: 4.5, busway: 3.2, escape: 3.5 };
const RW_LANES = { motorway: 2, trunk: 2, primary: 2, secondary: 2, tertiary: 2, unclassified: 2, residential: 2, living_street: 1.6, service: 1, track: 1, road: 2, raceway: 2.5, busway: 1, escape: 1 };
// a road's class as it is built: its paved shoulders either side of the lanes (a motorway's hard shoulder and its inner
// one, averaged across the two sides), steel barriers along it or not, how smooth it is against a country road (its
// bumps and holes), and how much further back than a lane's edge the trees and bushes stand (a motorway's cleared verge)
function rwClassOf(t) {
  const hw0 = t.highway || 'road', hw = hw0.replace('_link', ''), link = hw0 !== hw, one = t.oneway === 'yes' || t.oneway === '1' || t.oneway === '-1' || hw === 'motorway' || t.junction === 'roundabout';
  if (hw === 'motorway') return link ? { sh: 1.0, rail: 1, q: 0.4, clr: 5 } : { sh: 1.75, rail: 1, q: 0.35, clr: 7 };
  if (hw === 'trunk') return link ? { sh: 0.75, rail: 1, q: 0.45, clr: 4 } : one ? { sh: 1.25, rail: 1, q: 0.4, clr: 6 } : { sh: 0.5, rail: 0, q: 0.5, clr: 3 };
  if (hw === 'primary') return { sh: one && parseInt(t.lanes, 10) >= 2 ? 0.5 : 0, rail: 0, q: 0.55, clr: 2 };
  return { sh: 0, rail: 0, q: { secondary: 0.75, tertiary: 0.9, raceway: 0.3, busway: 0.6 }[hw] || 1, clr: 0 };
}
// its lanes: how many, and how wide they are together as painted (the map's lanes, else a road of its kind's)
function rwLanesOf(t, narrow) {
  const hw = (t.highway || 'road').replace('_link', ''), ln = parseInt(t.lanes, 10), one = t.oneway === 'yes' || t.oneway === '1' || t.oneway === '-1' || hw === 'motorway' || t.junction === 'roundabout', L = RW_LANE[hw] || 3;
  const n = ln > 0 && ln < 13 ? ln : one && (hw === 'motorway' || hw === 'trunk') ? 2 : one ? 1 : Math.max(1, Math.round(RW_LANES[hw] || 2));
  let W = n * L; if (!(ln > 0)) { if (narrow && !one && (hw === 'unclassified' || hw === 'tertiary' || hw === 'residential')) W *= hw === 'tertiary' ? 0.9 : 0.78; if (t.tracktype === 'grade4' || t.tracktype === 'grade5') W = Math.min(W, 2.8); }
  if (one && n === 1 && /^(residential|unclassified|tertiary|secondary|primary|living_street|road)$/.test(hw)) W = Math.max(W, 3.6); // (a one-way street: its one lane wider than a two-way road's, however the map counts its lanes)
  if (/_link$/.test(t.highway || '') && !(ln > 0)) W = Math.min(W, one ? 4.2 : 6.5);
  return { n, W, one };
}
// its paved width: the map's own where it gives one, else the lanes and the shoulders its class has
function rwWidthOf(t, narrow) {
  const w = parseFloat(String(t.width || t['width:carriageway'] || '').replace(',', '.'));
  if (w > 2 && w < 30) return clamp(w, 2.6, 24);
  return clamp(rwLanesOf(t, narrow).W + 2 * rwClassOf(t).sh, 2.6, 24);
}
function rwSurfOf(t, gravelCountry, snow) {
  const s = (t.surface || '').toLowerCase(), hw = (t.highway || '').replace('_link', ''); let k;
  if (/^(asphalt|paved|chipseal|bitumen|tarmac|metal|rubber|acrylic|asphalt;.*)$/.test(s)) k = 'tarmac';
  else if (/^concrete/.test(s)) k = 'concrete';
  else if (/^(sett|cobblestone|unhewn_cobblestone|paving_stones|bricks|stone|granite)/.test(s)) k = 'stone';
  else if (/^(gravel|fine_gravel|compacted|unpaved|dirt|ground|earth|mud|sand|pebblestone|grass|grass_paver|woodchips|rock|clay|salt|shells)/.test(s)) k = 'gravel';
  else if (s === 'snow' || s === 'ice') k = 'snow';
  else if (hw === 'track') k = t.tracktype === 'grade1' ? 'tarmac' : 'gravel';
  else if (gravelCountry && (hw === 'unclassified' || hw === 'service' || hw === 'road')) k = 'gravel';
  else k = 'tarmac';
  return snow && k !== 'concrete' ? 'snow' : k;
}
const rwYes = v => v === 'yes' || v === '1' || v === 'true' || v === 'viaduct' || v === 'boardwalk' || v === 'cantilever' || v === 'covered' || v === 'trestle' || v === 'aqueduct' || v === 'building_passage' || v === 'avalanche_protector';
// The road's middle line from the map's: the map draws a road as straight runs between its points; a real road bends
// smoothly between them. Each corner of the map's line is rounded off with an arc that stays within dev metres of the
// corner (a fraction of the road's width: the map's line is about that true), as wide as its two neighbouring runs leave
// room for; a corner turning more than 45 degrees in one point (a junction's square turn, as mapped) gets at least a
// kerb's radius, 6.5 m, cutting its corner as a car must. Then the line is laid out every STEP metres: x, z, heading,
// and for each point where along the map's line it is (u: the map segment and how far along it)
function rwCenter(X, Z, W, closed) {
  let n = X.length; const P = []; for (let k = 0; k < n; k++) { const q = P[P.length - 1]; if (!q || Math.hypot(X[k] - q[0], Z[k] - q[1]) > 0.3) P.push([X[k], Z[k], k]); }
  if (closed && P.length > 2 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 0.5) P.pop();
  // (a step at a junction - the map's line jogging a few metres sideways between two ways that carry on the same way,
  // through the little link mapped between them - made one point midway: no road steps aside like that)
  for (let it = 0, any = true; any && it < 8; it++) { any = false; const m = P.length;
    for (let k = closed ? 0 : 1; k + (closed ? 0 : 2) < m && P.length > 4; k++) { const N = P.length, a = P[(k - 1 + N) % N], b = P[k % N], c = P[(k + 1) % N], d = P[(k + 2) % N]; if (!a || !b || !c || !d) continue;
      const bc = Math.hypot(c[0] - b[0], c[1] - b[1]); if (bc > 4) continue;
      const h0 = Math.atan2(b[0] - a[0], b[1] - a[1]), h1 = Math.atan2(c[0] - b[0], c[1] - b[1]), h2 = Math.atan2(d[0] - c[0], d[1] - c[1]), t1 = wrapAngle(h1 - h0), t2 = wrapAngle(h2 - h1);
      if (Math.abs(t1) < 0.52 || Math.abs(t2) < 0.52 || Math.sign(t1) === Math.sign(t2) || Math.abs(wrapAngle(h2 - h0)) > 0.7) continue;
      P.splice(k % N, 2, [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2, b[2]]); if ((k % N) + 1 >= N) P.shift(); any = true; } }
  n = P.length; if (n < 2) return null;
  const seg = k => { const a = P[k], b = P[(k + 1) % n]; return Math.hypot(b[0] - a[0], b[1] - a[1]); }, nS = closed ? n : n - 1, L = new Float64Array(nS); for (let k = 0; k < nS; k++) L[k] = seg(k);
  const T = new Float64Array(n), Rr = new Float64Array(n), TH = new Float64Array(n);
  for (let k = 0; k < n; k++) { if (!closed && (k === 0 || k === n - 1)) continue; const a = P[(k - 1 + n) % n], b = P[k], c = P[(k + 1) % n];
    const h1 = Math.atan2(b[0] - a[0], b[1] - a[1]), h2 = Math.atan2(c[0] - b[0], c[1] - b[1]), th = Math.abs(wrapAngle(h2 - h1)); if (th < 0.003 || th > 3.05) continue; TH[k] = th;
    const w = W ? W(b[2]) : 6, dev = clamp(0.22 * w, 0.45, 1.6), sc = 1 / Math.cos(th / 2) - 1; let r = dev / Math.max(sc, 1e-9); if (th > 0.78) r = Math.max(r, 6.5);
    Rr[k] = r; T[k] = r * Math.tan(th / 2); }
  for (let it = 0; it < 4; it++) for (let k = 0; k < nS; k++) { const a = k, b = (k + 1) % n, s = T[a] + T[b]; if (s > L[k] * 0.98) { const f = L[k] * 0.98 / s; T[a] *= f; T[b] *= f; } }
  for (let k = 0; k < n; k++) if (TH[k]) Rr[k] = T[k] / Math.tan(TH[k] / 2);
  // (the path as runs and arcs; each piece: [start x, z, heading, length, curvature, map vertex it belongs to])
  const pcs = [], dir = k => { const a = P[k], b = P[(k + 1) % n]; return Math.atan2(b[0] - a[0], b[1] - a[1]); };
  const startK = closed ? 0 : 0, endK = closed ? n : n - 1;
  let px = closed ? P[0][0] + Math.sin(dir(0)) * T[0] : P[0][0], pz = closed ? P[0][1] + Math.cos(dir(0)) * T[0] : P[0][1];
  for (let k = startK; k < endK; k++) {
    const h = dir(k), a = P[k], b = P[(k + 1) % n], Lr = L[k] - (closed || k > 0 ? T[k] : 0) - (closed || k + 1 < n - 1 ? T[(k + 1) % n] : 0);
    if (Lr > 1e-6) pcs.push([px, pz, h, Lr, 0, a[2]]); px += Math.sin(h) * Lr; pz += Math.cos(h) * Lr;
    const kb = (k + 1) % n; if (!closed && kb === n - 1) break;
    if (TH[kb] && Rr[kb] > 0) { const h2 = dir(kb), d = wrapAngle(h2 - h), len = Rr[kb] * Math.abs(d), kap = Math.sign(d) / Rr[kb];
      pcs.push([px, pz, h, len, kap, b[2]]); const sx = px, sz = pz; // (end of the arc: integrate exactly)
      px = sx + (Math.cos(h) - Math.cos(h + d)) / kap * 1 + 0; pz = sz + (Math.sin(h + d) - Math.sin(h)) / kap;
      // (x += sin(h) ds: over an arc of curvature kap from h, x = (cos h - cos(h + d)) / kap, z = (sin(h + d) - sin h) / kap)
    } }
  // laid out every STEP
  let tot = 0; for (const p of pcs) tot += p[3]; const np = Math.max(2, Math.round(tot / STEP)), ds = tot / np;
  const OX = new Float64Array(np + 1), OZ = new Float64Array(np + 1), OH = new Float64Array(np + 1), OV = new Int32Array(np + 1), OK = new Float32Array(np + 1); let q = 0, s0 = 0;
  for (let m = 0; m <= np; m++) { const s = Math.min(tot - 1e-9, m * ds); while (q < pcs.length - 1 && s > s0 + pcs[q][3]) { s0 += pcs[q][3]; q++; }
    const p = pcs[q], u = s - s0, kap = p[4]; let x, z, h;
    if (kap) { h = p[2] + kap * u; x = p[0] + (Math.cos(p[2]) - Math.cos(h)) / kap; z = p[1] + (Math.sin(h) - Math.sin(p[2])) / kap; } else { h = p[2]; x = p[0] + Math.sin(h) * u; z = p[1] + Math.cos(h) * u; }
    OX[m] = x; OZ[m] = z; OH[m] = wrapAngle(h); OV[m] = p[5]; OK[m] = kap; }
  return { x: OX, z: OZ, h: OH, v: OV, k: OK, n: np + 1, len: tot, ds };
}
// the country a course is in, for what the map does not say (trees, houses' style, signs, roadside, weather): the region
// of the game's whose country is most like it, by where it is (rw: [lat, lon, alt m]) and whether its roads lie under snow
function rwLookFor(lat, lon, alt, snow) {
  const A = Math.abs(lat), N = lat >= 0;
  if (snow) return lat > 64 ? 'arctic' : (A > 55 || (N && lat > 50 && lon > 20)) ? 'forest' : 'alpine';
  if (N && lat > 56 && lon > 4 && lon < 45) return 'fast';
  if (N && lat > 50 && lat < 61 && lon > -11 && lon < -5.3) return 'hedges'; // (Ireland)
  if (N && lat > 49.8 && lat < 61 && lon >= -8 && lon < 2) return lat > 54 || lon < -2.5 ? 'twisty' : 'hedges'; // (Britain: the uplands, the lowland lanes)
  if (N && lat > 43.4 && lat < 48.6 && lon > 5.5 && lon < 16.5 && alt > 700) return 'mountain'; // (the Alps)
  if (N && lat > 42.5 && lat < 44.5 && lon > 6.5 && lon < 8.0 && alt > 300) return 'mountain'; // (the Maritime Alps, above the coast)
  if (N && lat > 45 && lat < 56 && lon > -5 && lon < 30) return alt > 450 ? 'range' : 'lanes';
  if (N && lat > 41.3 && lat < 43.1 && lon > 8.4 && lon < 9.7) return 'coast'; // (Corsica)
  if (N && lat > 38.8 && lat < 41.3 && lon > 8 && lon < 9.9) return 'maquis'; // (Sardinia)
  if (N && lat > 34.5 && lat < 42 && lon > 19.5 && lon < 30) return 'rocky'; // (Greece, the Aegean)
  if (N && lat > 36 && lat < 43.9 && lon > -10 && lon < -6.3) return 'farm'; // (Portugal, Galicia)
  if (N && lat > 36 && lat < 43.9 && lon >= -6.3 && lon < 3.5) return lat > 40.5 && lon > 0 ? 'sweep' : 'mixed'; // (Spain)
  if (N && lat > 36 && lat < 46 && lon >= 3.5 && lon < 19.5) return alt > 900 ? 'mountain' : 'coast'; // (Italy, the south of France)
  if (N && lat > 36 && lat < 40 && lon > -32 && lon < -24) return 'volcanic'; // (the Azores)
  if (N && lat > 27 && lat < 29.5 && lon > -18.5 && lon < -13) return 'volcanic'; // (the Canaries)
  if (N && lat > 24 && lat < 46 && lon > 122 && lon < 146) return 'cedar'; // (Japan, Korea, Taiwan)
  if (lat < -10 && lat > -45 && lon > 112 && lon < 155) return A < 30 ? 'desert' : 'redearth'; // (Australia)
  if (lat < -33 && lon > 165 && lon < 179.9) return 'pastures'; // (New Zealand)
  if (lat < -20 && lat > -56 && lon > -76 && lon < -50) return 'pampas';
  if (A < 15 && lon > -20 && lon < 52) return 'savanna';
  if (N && lat > 14 && lat < 36 && lon > -118 && lon < -98) return 'desert';
  if (N && lat > 30 && lat < 42 && lon > -125 && lon < -103) return alt > 1800 ? 'mountain' : 'desert';
  if (N && lat > 15 && lat < 40 && lon > -10 && lon < 60) return 'desert';
  if (N && lat > 41 && lon > -125 && lon < -60) return alt > 1500 ? 'mountain' : lat > 52 ? 'fast' : 'lanes';
  if (N && lat > 25 && lon > -100 && lon < -60) return 'lanes';
  if (N && lat > 50) return 'fast';
  if (A < 24) return lon > 60 && lon < 160 ? 'cedar' : 'savanna';
  return 'lanes';
}
// countries whose minor public roads are mostly gravel (an unclassified road with no surface given is gravel there)
const RW_GRAVEL = new Set(['fast', 'forest', 'arctic', 'savanna', 'redearth', 'pampas', 'desert', 'pastures']);
// countries whose lanes are narrow (an unclassified road with no width given is single-track or near it)
const RW_NARROW = new Set(['twisty', 'hedges', 'cedar', 'lanes', 'volcanic', 'farm']);

// ---- laying a real course (see layStage) ----
// The stage's points are the course's road as drawn, once (the canonical points): a point-to-point course's road from
// the start of its run-up to the end of its run-off; a there-and-back's from its run-up to its far end and the turn
// there; a circuit's lap, from 20 m before its line round to the line again (its last point its first). The run - the
// points as driven, a there-and-back's way back and a circuit's later laps after its first - is laid over them after
// (see rwRun): every point of it is one of these, driven again (alf -1: the other way). K: what layStage gives (its
// pack, country, surface, its points and grid). Returns the run's controls (start, finish, stop: indices along the
// run), those the drawing puts up on the canonical points (cctl), the canonical range the stage's furniture is laid
// along (rng: start, end, the end of what is drawn), and how the run maps onto the canonical points
function rwLayout(K) {
  const C = K.pack, TY = K.TY, gravelC = RW_GRAVEL.has(TY.id), narrow = RW_NARROW.has(TY.id), snow = K.surface === 'snow';
  rwPrep(C); if (C._tu) C._tu.on = false; // (the cover over its tunnels: not while the road's heights are worked out)
  const R = C.r, ways = C.ways, tagsAt = v => ((ways[R.w[clamp(v, 0, R.w.length - 1)]] || ways[0]) || { t: {} }).t, wAt = v => rwWidthOf(tagsAt(v), narrow);
  const kind = C.kind, closed = kind === 'loop';
  const CL = rwCenter(R.x, R.z, wAt, closed); if (!CL || CL.n < 60) throw new Error('short');
  const n = CL.n, pts = K.pts, Ws = rwEaseW(CL, tagsAt, wAt, closed);
  // (where along the laid line the map's start and far end are: the laid point nearest each)
  const near = v => { let best = 0, bd = 1e18; for (let m = 0; m < n; m++) { if (Math.abs(CL.v[m] - v) > 2) continue; const d = (CL.x[m] - R.x[v]) ** 2 + (CL.z[m] - R.z[v]) ** 2; if (d < bd) { bd = d; best = m; } }
    if (bd > 400) for (let m = 0; m < n; m++) { const d = (CL.x[m] - R.x[v]) ** 2 + (CL.z[m] - R.z[v]) ** 2; if (d < bd) { bd = d; best = m; } } return best; };
  const iA = closed ? 0 : near(R.a), iB = closed ? n - 1 : near(R.b);
  // (a canonical point from the laid line's point m: its width, surface, what it is - a bridge, a tunnel, a ring - and its way)
  const mk = m => { const v = CL.v[m], t = tagsAt(v), br = rwYes(t.bridge), tu = rwYes(t.tunnel) || t.covered === 'yes', rb = t.junction === 'roundabout' || t.junction === 'circular';
    return { x: CL.x[m], z: CL.z[m], h: CL.h[m], w: Ws[m], ow: true, wd: 0, surf: rwSurfOf(t, gravelC, snow), tag: br ? 'bridge' : rb ? 'ring' : null, rwtu: tu ? 1 : 0, rwv: v, rwm: m, rwhw: (t.highway || 'road').replace('_link', ''), rwly: parseInt(t.layer, 10) || 0, ...rwPtClass(t, narrow, Ws[m]) }; };
  const add = p => { p.i = pts.length; pts.push(p); K.grid.add(p.x, p.z, { x: p.x, z: p.z, i: p.i }); return p; };
  let cN, run = null, ctl, cctl, rng, turn = null;
  if (kind === 'loop') { // (rotated: canonical 0 is ten points before the line, which is the laid line's start)
    const M = n - 1, r0 = M - 10; for (let c = 0; c < M; c++) add(mk((r0 + c) % M)); const z = add(Object.assign({}, pts[0])); z.rwm = r0; cN = M + 1;
    const laps = clamp(C.laps || 1, 1, 50), fin = 10 + laps * M, stop = fin + 100;
    ctl = { start: 10, finish: fin, stop }; cctl = { start: 10, fin: 10, stop: 110 % M, loop: 1 }; rng = [0, M, M]; run = { n: stop + 25, at: r => [r % M, 1], M, laps };
  } else if (kind === 'rt') {
    for (let m = 0; m <= iB; m++) add(mk(m));
    const T = turn = rwTurn(CL, iB, wAt(CL.v[iB])), last = pts[iB];
    for (let k = 0; k < T.x.length; k++) add({ x: T.x[k], z: T.z[k], h: T.h[k], w: T.w[k], ow: true, wd: 0, surf: last.surf === 'tarmac' || last.surf === 'concrete' || last.surf === 'stone' ? 'tarmac' : last.surf, tag: 'rbt', rwv: last.rwv, rwm: -1, rwtf: T.f[k], rwhw: last.rwhw, rwturn: 1 });
    for (let m = Math.max(0, T.rb - 4); m <= iB; m++) if (!pts[m].tag) pts[m].tag = 'rbt'; // (the road's end where the turn leaves it and comes back to it: an open turning place, no ditch, wall or rail at its edges)
    cN = pts.length; const rb = T.rb, finC = Math.max(1, Math.min(iA + 25, rb - 20)), stopC = Math.max(0, finC - 100);
    ctl = { start: iA, finish: cN + (rb - finC), stop: cN + (rb - stopC) }; cctl = { start: iA, fin: finC, stop: stopC, back: 1 }; rng = [Math.max(0, Math.min(iA, stopC)), cN - 1, cN - 1];
    run = { n: cN + (rb - Math.max(0, stopC - 15)) + 1, at: r => r < cN ? [r, 1] : [rb - (r - cN), -1], iB, rb };
  } else { for (let m = 0; m < n; m++) add(mk(m)); cN = n; const stop = Math.min(n - 2, iB + 100); ctl = { start: iA, finish: iB, stop }; cctl = { start: iA, fin: iB, stop }; rng = [iA, iB, stop]; }
  return { CL, kind, iA, iB, cN, ctl, cctl, rng, run, turn };
}
// The map's widths along the laid line, eased: a narrower stretch a dozen metres long or less between wider ones (a link,
// a tunnel or a piece of a junction mapped as a way of its own, without the lanes its road has) as wide as the road
// either side of it, and each change of width spread over the metres before and after it, 7.5 cm a metre - never
// narrower than the map has it, and never wider where the map gives the width itself (a bridge's one lane, a gateway)
// (a point's lanes and class, as its markings, barriers, verge and roughness want them: rwln lanes, rwone one way, rwlw
// the lanes' painted width (within the road as wide as it is drawn), rwrail steel barriers, rwq smoothness, rwclr verge)
function rwPtClass(t, narrow, w) { const L = rwLanesOf(t, narrow), C = rwClassOf(t); return { rwln: L.n, rwone: L.one ? 1 : 0, rwlw: Math.min(w, L.W), rwrail: C.rail, rwq: C.q, rwclr: C.clr }; }
function rwEaseW(CL, tagsAt, wAt, closed) {
  const n = CL.n, W = new Float32Array(n), firm = new Uint8Array(n); for (let m = 0; m < n; m++) { const t = tagsAt(CL.v[m]); W[m] = wAt(CL.v[m]); firm[m] = t.width || t['width:carriageway'] || (rwYes(t.bridge) && t.lanes === '1') ? 1 : 0; }
  const ix = k => closed ? ((k % n) + n) % n : clamp(k, 0, n - 1), r = 3, D = new Float32Array(n), E = new Float32Array(n);
  for (let k = 0; k < n; k++) { let m = 0; for (let j = -r; j <= r; j++) m = Math.max(m, W[ix(k + j)]); D[k] = m; }
  for (let k = 0; k < n; k++) { let m = 1e9; for (let j = -r; j <= r; j++) m = Math.min(m, D[ix(k + j)]); E[k] = firm[k] ? W[k] : Math.max(W[k], m); }
  const K2 = closed ? 2 * n : n; for (let q = 1; q < K2; q++) { const a = ix(q), b = ix(q - 1); if (!firm[a]) E[a] = Math.max(E[a], E[b] - 0.15); }
  for (let q = K2 - 2; q >= 0; q--) { const a = ix(q), b = ix(q + 1); if (!firm[a]) E[a] = Math.max(E[a], E[b] - 0.15); }
  return E;
}
// A there-and-back's turn at its far end: round a marker beyond the road's end, as a car turns round a post - out a
// little to the right, left round the marker, and back onto the road the other way some 10 m short of where it left it
// (so the way out and the way back are each their own near the turn): a right turn of a on R1, a left of 180 degrees
// and a + b on Rc round the marker, a right of b on R1, a and b found so it comes back onto the road's own line, heading
// back along it, kB points short of its end (each point every STEP or so along it); the turning place laid wide enough
// for a car on full lock, narrower where it leaves the road and comes back to it. Returns its points, the marker's
// place and kB
function rwTurn(CL, iB, tW) {
  const x0 = CL.x[iB], z0 = CL.z[iB], h0 = CL.h[iB], R1 = 10, Rc = 9.5;
  // (where it comes back to: the road's point some 10 m short of its end, heading back along the road there)
  let kB = 5; while (kB < 12 && iB - kB > 2 && Math.hypot(CL.x[iB - kB] - x0, CL.z[iB - kB] - z0) < 9.5) kB++;
  const rb = iB - kB, tx = CL.x[rb], tz = CL.z[rb], th = wrapAngle(CL.h[rb] + Math.PI);
  const arc = (q, d, R) => { const k = Math.sign(d) / R, h = q.h; return { x: q.x + (Math.cos(h) - Math.cos(h + d)) / k, z: q.z + (Math.sin(h + d) - Math.sin(h)) / k, h: h + d }; };
  const loopOf = (a, b) => { let c = wrapAngle(th - h0 + a + b); while (c < Math.PI * 0.9) c += 2 * Math.PI; return c; };
  const end = (a, b) => arc(arc(arc({ x: x0, z: z0, h: h0 }, -a, R1), loopOf(a, b), Rc), -b, R1);
  let a = 0.45, b = 1.4; for (let it = 0; it < 60; it++) { const e = end(a, b), fx = e.x - tx, fz = e.z - tz, d = 1e-6, ea = end(a + d, b), eb = end(a, b + d), J00 = (ea.x - e.x) / d, J01 = (eb.x - e.x) / d, J10 = (ea.z - e.z) / d, J11 = (eb.z - e.z) / d, det = J00 * J11 - J01 * J10; if (!det) break;
    a = clamp(a - (fx * J11 - J01 * fz) / det, 0.05, 1.5); b = clamp(b - (J00 * fz - J10 * fx) / det, 0.05, 1.5); }
  const segs = [[-a, R1], [loopOf(a, b), Rc], [-b, R1]]; let L = 0; for (const [t, r] of segs) L += Math.abs(t) * r;
  const nT = Math.max(12, Math.round(L / STEP) - 1), ds = L / (nT + 1), out = { x: [], z: [], h: [], w: [], f: [], kB }, Wt = Math.max(tW, 7.5);
  let x = x0, z = z0, h = h0, s = 0, q = 0; const cxz = [];
  for (const [t, r] of segs) { const l = Math.abs(t) * r, k = Math.ceil(l / 0.05), dh = t / k, dd = l / k;
    for (let j = 0; j < k; j++) { h += dh / 2; x += Math.sin(h) * dd; z += Math.cos(h) * dd; h += dh / 2; s += dd; while (q < nT && s >= (q + 1) * ds - 1e-9) { const f = (q + 1) * ds, e = Math.min(f, L - f);
        out.x.push(x); out.z.push(z); out.h.push(wrapAngle(h)); out.w.push(Wt * (0.8 + 0.2 * smooth(0, 9, e))); out.f.push(f / L); q++; } }
    cxz.push([x, z, h]); }
  // (the island it goes round: the middle of the circle, to the left of where the turn round it begins)
  const [ex, ez, eh] = cxz[0]; out.cx = ex + Math.cos(eh) * Rc; out.cz = ez - Math.sin(eh) * Rc; out.Rc = Rc; out.W = Wt; out.rb = rb; return out;
}
// the run over the canonical points: each of its points the canonical one it is (ali) and the way it is driven there
// (alf); its points past the canonical ones made from them, the other way round where it drives them the other way
// (alf -1: its heading turned round; what is on its left the canonical point's right). Each is the canonical point's
// own object to read through (Object.create), so what the drawing later sets on that point (its edges' heights, its
// rails) is the run's too, side for side
const RW_SIDED = [['eL', 'eR'], ['rl', 'rr']];
function rwRun(pts, L) {
  const cN = L.cN, ali = new Int32Array(L.run ? L.run.n : cN), alf = new Int8Array(ali.length);
  for (let r = 0; r < cN && r < ali.length; r++) { ali[r] = r; alf[r] = 1; }
  if (!L.run) return { ali, alf };
  for (let r = cN; r < ali.length; r++) { const [c, f] = L.run.at(r); ali[r] = c; alf[r] = f; const C = pts[c], p = Object.create(C); p.i = r;
    if (f < 0) { p.h = wrapAngle(C.h + Math.PI); for (const [a, b] of RW_SIDED) { Object.defineProperty(p, a, { get() { return C[b]; }, set(v) { C[b] = v; }, enumerable: true }); Object.defineProperty(p, b, { get() { return C[a]; }, set(v) { C[a] = v; }, enumerable: true }); } }
    pts.push(p); }
  return { ali, alf };
}
// where a car found on the run at run point r is, on the canonical points (for what the stage holds by its points: the
// road's surface and what is on it; see locate): its canonical segment, how far along, its side across. r: the run's
// segment, t along it; lat across it
function rwCanon(T, r, t, lat) { const A = T.ali, F = T.alf, c = A[r]; if (F[r] > 0) { const c1 = A[r + 1]; if (c1 === c + 1) return [c, t, lat]; return [c, t, lat]; } return [Math.max(0, c - 1), 1 - t, -lat]; }
// the run point nearest a hint for canonical point c (the pass of it nearest the hint: see locate's search off the road)
function rwRunNear(T, c, hint) { const R = T.rwRun; if (!R) return c; let best = c, bd = Math.abs(c - hint);
  if (R.M) { for (let k = c; k < T.ali.length; k += R.M) { const d = Math.abs(k - hint); if (d < bd) { bd = d; best = k; } } }
  else if (R.rb != null && c <= R.rb) { const k = T.cN + (R.rb - c); if (k < T.ali.length && Math.abs(k - hint) < bd) best = k; }
  return best; }
// ---- pace notes from the road as it lies ----
// A co-driver grades a bend by how fast it goes (see curveNote): here each bend is found in the road's curvature
// (smoothed over 8 m) where it stays one way for long enough to count, its radius the tightest part of its middle, its
// angle the turn from where it begins to where it ends; a bend whose second part is much tighter or wider than its
// first "tightens" or "opens"; on a roundabout the island is called instead; a crest the eye cannot see over in time
// ("over crest", "big crest": the sight line over it, eye 1.1 m up, shorter than 70 m, the shorter the bigger), a bridge,
// a junction, a change of surface. pts: the run's points (their x, z, h, w, y), i0..i1 the range to call
function rwNotes(pts, i0, i1, feats) {
  const N = pts.length, K = new Float32Array(N), out = [];
  for (let i = 1; i < N - 1; i++) K[i] = wrapAngle(pts[i + 1].h - pts[i - 1].h) / (2 * STEP);
  const KS = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let j = Math.max(0, i - 2); j <= Math.min(N - 1, i + 2); j++) { s += K[j] * (3 - Math.abs(j - i)); c += 3 - Math.abs(j - i); } KS[i] = s / c; }
  const ring = i => pts[i].tag === 'ring' || pts[i].tag === 'rbt';
  let i = Math.max(1, i0);
  while (i < i1) {
    if (ring(i)) { let j = i; while (j < i1 && ring(j)) j++; out.push({ i: Math.max(0, i - 6), e: j, text: 'roundabout around the island', c: 0, s: 0, rw: 1 }); i = j + 1; continue; }
    if (Math.abs(KS[i]) < 1 / 450) { i++; continue; }
    const sg = Math.sign(KS[i]); let j = i; while (j < i1 && Math.sign(KS[j]) === sg && Math.abs(KS[j]) > 1 / 900 && !ring(j)) j++;
    const a = i, e = j - 1; let ang = 0; for (let k = a; k <= e; k++) ang += KS[k] * STEP; ang = Math.abs(ang);
    if (ang < 0.18 || (e - a) * STEP < 6) { i = j; continue; }
    // (its tightest radius in its middle, and that of its first half and its second)
    const rMin = (p, q) => { let m = 0; for (let k = p; k <= q; k++) m = Math.max(m, Math.abs(KS[k])); return 1 / Math.max(m, 1e-6); };
    const mid = Math.round((a + e) / 2), r = rMin(a + Math.floor((e - a) * 0.15), e - Math.floor((e - a) * 0.15)), w = pts[mid].w;
    const r1 = rMin(a, mid), r2 = rMin(mid, e), g1 = gradeOf(lineRadius(r1, ang / 2, w)), g2 = gradeOf(lineRadius(r2, ang / 2, w));
    let text = curveNote(sg, r, ang, w);
    if ((e - a) * STEP > 40 && typeof g1 === 'number' && typeof g2 === 'number' && g1 !== g2 && Math.max(r1, r2) / Math.min(r1, r2) > 1.6) {
      const d = dirName(sg); if (g2 < g1 && g2 <= 3) text = `${d} ${g1} tightens ${g2}`; else if (g2 > g1 && g2 >= 3) text = `${d} ${g1} opens ${g2}`; }
    out.push({ i: a, e, text, c: 1, s: sg, rw: 1 }); i = j;
  }
  // crests: where the road falls away beyond a rise so the eye (1.1 m up) loses the road within 70 m
  { let last = -1e9; for (let k = Math.max(i0, 8); k < i1 - 8; k++) { const y = pts[k].y, yb = pts[k - 6].y, ya = pts[k + 6].y; if (!(y - (yb + ya) / 2 > 0.12)) continue; // (a rise: higher than the mean of 12 m each side)
      let sight = 0; for (let q = k + 1; q < Math.min(N, k + 60); q++) { const d = (q - k) * STEP, ey = pts[k - 4].y + 1.1, slope = (y + 0.05 - ey) / (4 * STEP); if (pts[q].y + 0.3 < ey + slope * (d + 4 * STEP)) { sight = d; break; } }
      if (!sight || sight > 70 || k - last < 30) continue; last = k; out.push({ i: Math.max(0, k - 4), e: k + 3, text: sight < 30 ? 'big crest' : 'over crest', c: 0, s: 0, rw: 1 }); } }
  // (a bridge, where the run comes onto one: three points or more of it; what passes over the road, where it does)
  for (let k = Math.max(i0, 1); k < i1; k++) if (pts[k].tag === 'bridge' && pts[k - 1].tag !== 'bridge') { let j = k; while (j < N - 1 && pts[j + 1].tag === 'bridge') j++; if (j - k >= 2) out.push({ i: Math.max(0, k - 3), e: k, text: 'over bridge', c: 0, s: 0, rw: 1 }); k = j; }
  for (const f of feats || []) { if (f.type === 'under' && f.m >= i0 && f.m < i1) out.push({ i: Math.max(0, f.m - 8), e: f.m, text: 'under bridge', c: 0, s: 0, rw: 1 });
    if (f.type === 'grid' && f.m >= i0 && f.m < i1) out.push({ i: Math.max(0, f.m - 4), e: f.m + 1, text: 'over cattle grid', c: 0, s: 0, rw: 1 }); }
  // (onto another surface: where the road's surface changes and stays so for 150 m)
  for (let k = Math.max(i0, 1); k < i1 - 75; k++) { const a = pts[k - 1].surf, b = pts[k].surf; if (a === b) continue; let same = true; for (let q = k; q < k + 75 && same; q++) if (pts[q].surf !== b) same = false;
    if (same && { tarmac: 1, gravel: 1, snow: 1, ice: 1 }[b] && !(a === 'concrete' && b === 'tarmac') && !(a === 'stone' && b === 'tarmac')) out.push({ i: Math.max(0, k - 3), e: k, text: 'onto ' + b, c: 0, s: 0, rw: 1 }); }
  // (calls on top of each other: a bend and something else at its start keep both; two plain calls within 6 m, the first)
  out.sort((p, q) => p.i - q.i); return out;
}
// The road's rise and fall: the map's own heights along it (every 2 m: the pack's profile), on the line as laid. Their
// small errors (a tree's crown, a cutting, a building the elevation model takes for ground) smoothed out over some 30 m,
// keeping the road's true grades; a bridge or a tunnel runs straight from one end to the other, all of it held to no
// grade a public road has (22 %). Returns the heights along the laid line (m), by its index
function rwHeights(C, CL) {
  const n = CL.n, Y = new Float64Array(n), R = C.r, pr = C.prof, ds = C.pds || 2;
  const cum = new Float64Array(R.x.length); for (let k = 1; k < R.x.length; k++) cum[k] = cum[k - 1] + Math.hypot(R.x[k] - R.x[k - 1], R.z[k] - R.z[k - 1]);
  const along = m => { const v = Math.min(CL.v[m], R.x.length - 2), ex = R.x[v + 1] - R.x[v], ez = R.z[v + 1] - R.z[v], L2 = ex * ex + ez * ez || 1, t = clamp(((CL.x[m] - R.x[v]) * ex + (CL.z[m] - R.z[v]) * ez) / L2, 0, 1); return cum[v] + t * Math.sqrt(L2); };
  const at = s => { const f = clamp(s / ds, 0, pr.length - 1.001), k = f | 0; return pr[k] + (pr[k + 1] - pr[k]) * (f - k); };
  for (let m = 0; m < n; m++) Y[m] = at(along(m));
  // (a bridge and a tunnel each run straight from one end to the other: the model's land under a bridge is the valley,
  // over a tunnel the hill)
  const tagOf = m => { const t = (C.ways[R.w[Math.min(R.w.length - 1, CL.v[m])]] || {}).t || {}; return rwYes(t.bridge) ? 1 : rwYes(t.tunnel) || t.covered === 'yes' ? 2 : 0; };
  for (let m = 0; m < n; m++) { const tg = tagOf(m); if (!tg) continue; let e = m; while (e < n - 1 && tagOf(e + 1) === tg) e++; const a = Math.max(0, m - 3), b = Math.min(n - 1, e + 3), ya = Y[a], yb = Y[b];
    for (let k = a; k <= b; k++) Y[k] = ya + (yb - ya) * (k - a) / Math.max(1, b - a); m = e; }
  // (the elevation model's small errors - a road on a steep hillside sampled a little off its bench, a pixel's step -
  // taken out: a median over 18 m, then a mean over 30 m three times; then held to no grade a public road has, 22 %)
  const med = new Float64Array(n); for (let m = 0; m < n; m++) { const a = [], k0 = Math.max(0, m - 4), k1 = Math.min(n - 1, m + 4); for (let k = k0; k <= k1; k++) a.push(Y[k]); a.sort((p, q) => p - q); med[m] = a[a.length >> 1]; }
  let y = med; for (let pass = 0; pass < 3; pass++) { const o = new Float64Array(n); for (let m = 0; m < n; m++) { let s = 0, c = 0; for (let k = Math.max(0, m - 7); k <= Math.min(n - 1, m + 7); k++) { s += y[k]; c++; } o[m] = s / c; } y = o; }
  const g = 0.22 * STEP; for (let it = 0; it < 3; it++) { for (let m = 1; m < n; m++) y[m] = clamp(y[m], y[m - 1] - g, y[m - 1] + g); for (let m = n - 2; m >= 0; m--) y[m] = clamp(y[m], y[m + 1] - g, y[m + 1] + g); }
  return y;
}
// the junctions' side roads: where another road meets the course, it carries on from the course's edge as the map has it
// for a few tens of metres, blocked with bales and tape just past the course's edge; heights from the course's edge at
// that edge's level, then the land at no more than a road's grade. jn: the pack's branches. Returns the spurs (as
// layStage makes them) and the stage points each leaves from
function rwSpurs(K, out) {
  const C = K.pack, pts = K.pts, ways = C.ways, cN = K.cN;
  const nearIdx = (x, z) => { let bi = -1, bd = 1e18; K.grid.query(x, z, 30, o => { if (o.i == null || o.i >= cN) return; const d = (o.x - x) ** 2 + (o.z - z) ** 2; if (d < bd) { bd = d; bi = o.i; } }); return bi; };
  for (const J of C.jn || []) {
    const W = ways[J.way]; if (!W) continue; const X = W.x, Z = W.z, t = W.t; let k = J.at; const d = J.dir, path = [[X[k], Z[k]]];
    while (k + d >= 0 && k + d < X.length && path.length < 40) { k += d; path.push([X[k], Z[k]]); }
    const a = nearIdx(path[0][0], path[0][1]); if (a < 0) continue; const p = pts[a];
    if (p.rwtu || (pts[a - 1] && pts[a - 1].rwtu && pts[a + 1] && pts[a + 1].rwtu)) continue; // (none in a tunnel: its walls run on past the way in, and the hill stays over it)
    // (the side road from where it leaves the course's edge; laid every STEP along the map's line)
    const pl = []; let acc = 0; for (let q = 1; q < path.length; q++) { const ax = path[q - 1][0], az = path[q - 1][1], bx = path[q][0], bz = path[q][1], L = Math.hypot(bx - ax, bz - az); for (let s = acc; s < L; s += STEP) pl.push([ax + (bx - ax) * s / L, az + (bz - az) * s / L, Math.atan2(bx - ax, bz - az)]); acc = (acc - L) % STEP; if (acc < 0) acc += STEP; if (pl.length > 30) break; }
    const sw = Math.min(rwWidthOf(t, K.narrow), p.w), srf = rwSurfOf(t, K.gravelC, K.snow), sp = [];
    let started = false, ym = p.y, dm = 0, xm = p.x, zm = p.z;
    for (const [x, z, h] of pl) { // (from where it is clear of the course's edge)
      const b = nearIdx(x, z); let lat = 1e9, q = null; if (b >= 0) { q = pts[b]; lat = (x - q.x) * Math.cos(q.h) - (z - q.z) * Math.sin(q.h); }
      const inside = q && Math.abs(lat) < q.w / 2 - 0.2 && Math.abs((x - q.x) * Math.sin(q.h) + (z - q.z) * Math.cos(q.h)) < STEP * 2;
      if (!started) { if (inside) continue; started = true; dm = 0; xm = x; zm = z; ym = q ? q.y - (K.bank ? K.bank[b] : 0) * Math.sign(lat) * q.w / 2 : p.y; }
      const dd = Math.hypot(x - xm, z - zm); let clash = false; K.grid.query(x, z, 12, o => { if (o.i != null && o.i < cN && Math.abs(o.i - a) > 25 && Math.hypot(o.x - x, o.z - z) < pts[o.i].w / 2 + sw / 2 + 1) clash = true; }); if (clash) break;
      const yy = ym + clamp(K.nat(x, z) - K.nat(xm, zm), -0.08 * dd, 0.08 * dd) * smooth(2, 14, dd);
      sp.push({ x, z, h, w: sw, y: yy, spur: true, i: -1, sh: 0.5, dd: dd > 12 ? 0.25 : 0, bh: 0, nb: 0, surf: srf, rwSide: 1 }); if (sp.length >= 22) break; }
    if (sp.length < 4) continue;
    const blk = Math.min(sp.length - 2, Math.max(1, Math.round(4 / STEP)));
    // (closed - bales across it, the tape before them, a marshal and a no-entry board - where every bale stands clear of
    // the course's edge; a side road that runs on alongside the course all the way is left as the map draws it, unclosed:
    // the course is never blocked)
    const nB = sw < 4.6 ? 4 : sw < 7 ? 5 : 7, at = (q, b) => { const lat = (sw / 2 - 0.2) * (2 * b / (nB - 1) - 1); return [q.x + Math.cos(q.h) * lat, q.z - Math.sin(q.h) * lat]; };
    const clear = q => { for (let b = 0; b < nB; b++) { const [x, z] = at(q, b); let ok = true; K.grid.query(x, z, 14, o => { if (o.i != null && o.i >= 0 && o.i < cN && Math.hypot(o.x - x, o.z - z) < pts[o.i].w / 2 + 0.9) ok = false; }); if (!ok) return false; } return true; };
    let bk = blk; while (bk < sp.length - 1 && !clear(sp[bk])) bk++; if (bk >= sp.length - 1) continue;
    { const q0 = sp[0], lat0 = (q0.x - p.x) * Math.cos(p.h) - (q0.z - p.z) * Math.sin(p.h); out.spurs.push({ a, pts: sp, s: lat0 >= 0 ? 1 : -1, blk: bk, rw: J }); }
    { const q = sp[bk]; for (let b = 0; b < nB; b++) { const [x, z] = at(q, b); out.colliders.push({ i: a, x, z, r: 0.62, kind: 'bale', spur: 1, sy: q.y, rot: q.h }); } }
  }
}
// the zones of a real course (what the country is like along it: village where it is built up, forest, farm, open), from
// the land cover by the road (40 m either side) and the houses near it; each at least 150 m long
function rwZones(K, pts, cN) {
  const C = K.pack, rt = rwPrep(C), n = cN, z = new Array(n);
  const bN = new Float32Array(n); for (const b of C.bld || []) { const x = b.cx, zz = b.cz; if (x == null) continue; K.grid.query(x, zz, 60, o => { if (o.i != null && o.i < n && Math.hypot(o.x - x, o.z - zz) < 45) bN[o.i] += 1; }); }
  for (let i = 0; i < n; i++) { const p = pts[i], lx = Math.cos(p.h), lz = -Math.sin(p.h), cnt = {}; for (const d of [-40, -20, 0, 20, 40]) { const c = RWLC_ZONE[rwLcAt(rt, p.x + lx * d, p.z + lz * d)] || ''; if (c) cnt[c] = (cnt[c] || 0) + 1; }
    let best = 'open', bv = 0; for (const k in cnt) if (cnt[k] > bv) { bv = cnt[k]; best = k; }
    if (bN[i] >= 7 || p.rwhw === 'residential' || p.rwhw === 'living_street') best = 'village'; z[i] = best; }
  // (runs of at least 75 points; a short one takes its neighbour's)
  const runs = []; for (let i = 0; i < n;) { let j = i; while (j < n && z[j] === z[i]) j++; runs.push([z[i], i, j]); i = j; }
  for (let pass = 0; pass < 3; pass++) for (let r = 0; r < runs.length; r++) { const q = runs[r]; if (q[2] - q[1] >= 75 || runs.length < 2) continue; const nb = runs[r - 1] || runs[r + 1]; q[0] = nb[0]; }
  const zones = []; for (const q of runs) { const L = zones[zones.length - 1]; if (L && L.set === q[0]) { L.s1 = q[2] * STEP; continue; } zones.push({ set: SETTINGS[q[0]] ? q[0] : 'open', s0: q[1] * STEP, s1: q[2] * STEP, gT: 0, tol: 0.2 }); }
  if (zones.length) { zones[zones.length - 1].s1 = 1e9; zones[0].s0 = 0; } else zones.push({ set: 'open', s0: 0, s1: 1e9, gT: 0, tol: 0.2 });
  return zones;
}
// a point's place in the course as drawn (its canonical point, and whether the run passes it the other way: f -1), for
// the road's surface: a second lap or the way back drives the road the first pass laid
function rwAliasS_unused(T, s, lat) { const A = T.ali, f0 = s / STEP, i = clamp(f0 | 0, 0, A.length - 2), t = f0 - i, c = A[i], f = T.alf[i];
  if (f > 0) { const c2 = A[i + 1]; return c2 === c + 1 ? [(c + t) * STEP, lat] : [(c + t) * STEP, lat]; }
  return [(c - t) * STEP, -lat]; }
// ---- what the map puts on and by the road ----
// its bridges (the deck between parapets, its piers down to the ground under it; no stream made up under it: the map's own
// water is drawn where it is) and its roundabouts (the ring round its island, the island where the map's ring has it).
// K: { pack, pts, cN, feat (layStage's), colliders, grid }
function rwFeats(K) {
  const C = K.pack, pts = K.pts, n = K.cN;
  for (let i = 0; i < n; i++) { if (pts[i].tag !== 'bridge') continue; let j = i; while (j < n - 1 && pts[j + 1].tag === 'bridge') j++;
    if (j - i >= 1) { K.feat('bridge', i, j, { rw: 1, hump: 0 }); for (let k = i; k <= j; k++) pts[k].wall = true; } else pts[i].tag = null; i = j; }
  // (a tunnel: walls either side its length, the hill left over it - see buildGround - its tube drawn: see rwTunnels)
  const TU = { c: 16, g: new Map(), on: false };
  for (let i = 0; i < n; i++) { if (!pts[i].rwtu) continue; let j = i; while (j < n - 1 && pts[j + 1].rwtu) j++; if (j - i >= 3) { for (let k = i; k <= j; k++) { pts[k].wall = true; pts[k].tag = pts[k].tag || null; } K.feat('tunnel', i, j, { rw: 1 });
      for (let k = Math.max(0, i - 1); k <= Math.min(n - 1, j + 1); k++) { const p = pts[k], o = p, R = p.w / 2 + 0.9 + 9; // (the cover over it, from the point's own height once it has one: see rwTuCover)
        for (let gx = Math.floor((p.x - R) / TU.c); gx <= Math.floor((p.x + R) / TU.c); gx++) for (let gz = Math.floor((p.z - R) / TU.c); gz <= Math.floor((p.z + R) / TU.c); gz++) { const key = gx + ',' + gz; let L = TU.g.get(key); if (!L) TU.g.set(key, L = []); L.push(o); } } }
    else for (let k = i; k <= j; k++) pts[k].rwtu = 0; i = j; }
  C._tu = TU.g.size ? TU : null;
  for (let i = 0; i < n; i++) { if (pts[i].tag !== 'ring') continue; let j = i; while (j < n - 1 && pts[j + 1].tag === 'ring' && pts[j + 1].rwv === pts[i].rwv) j++;
    const W = C.ways[C.r.w[Math.min(C.r.w.length - 1, pts[i].rwv)]]; if (!W || W.x.length < 4) { i = j; continue; }
    // (its middle and radius: the ring's own points, about their centre)
    let cx = 0, cz = 0, m = W.x.length - (W.x[0] === W.x[W.x.length - 1] && W.z[0] === W.z[W.z.length - 1] ? 1 : 0); for (let k = 0; k < m; k++) { cx += W.x[k]; cz += W.z[k]; } cx /= m; cz /= m;
    let Rr = 0; for (let k = 0; k < m; k++) Rr += Math.hypot(W.x[k] - cx, W.z[k] - cz); Rr /= m;
    const closed = W.x[0] === W.x[W.x.length - 1] && W.z[0] === W.z[W.z.length - 1];
    if (!closed || Rr < 6 || Rr > 60) { for (let k = i; k <= j; k++) pts[k].tag = null; i = j; continue; }
    const Wd = pts[Math.round((i + j) / 2)].w, rIn = Math.max(1.5, Rr - Wd / 2 - 0.6), mid = Math.round((i + j) / 2), a = Math.max(0, i - 3), b = Math.min(n - 1, j + 3);
    for (let k = a; k < i; k++) if (!pts[k].tag) pts[k].tag = 'rbt'; for (let k = j + 1; k <= b; k++) if (!pts[k].tag) pts[k].tag = 'rbt';
    const f = K.feat('roundabout', a, b, { flat: true, cx, cz, Rr, W: Wd, rIn, ringMid: mid, rw: 1 }); K.colliders.push({ i: mid, x: cx, z: cz, r: rIn, kind: 'island' });
    const ge = { x: cx, z: cz, r: Rr + Wd / 2 + 16, i }; K.grid.add(cx, cz, ge); f.gridEntry = ge; i = j; }
}
// The road as wide as the map's buildings leave room for: where houses stand closer to the road's line than half its
// width (a village street narrower than a road of its kind is, as the map has its houses), the road narrowed to the gap
// between them less 30 cm either side, never under 3.6 m; and the houses that stand over the road as the map draws it
// (its line within 2.2 m of a wall: a building over a passage, or a mapping slip) left out, as are those over a tunnel
// within its width (the tunnel's own walls bound it; the hill, not the houses on it, is drawn over it)
function rwFit(K) {
  const C = K.pack, pts = K.pts, n = K.cN, E = new SHash(10), bad = new Set();
  (C.bld || []).forEach((b, bi) => { const X = b.x, Z = b.z, m = X.length; for (let k = 0; k < m; k++) { const k2 = (k + 1) % m, L = Math.hypot(X[k2] - X[k], Z[k2] - Z[k]); for (let d = 0; d <= L; d += 4) E.add(X[k] + (X[k2] - X[k]) * d / Math.max(L, 1e-6), Z[k] + (Z[k2] - Z[k]) * d / Math.max(L, 1e-6), [bi, k]); } });
  const room = new Float32Array(n).fill(99), minW = new Float32Array(n).fill(3.6);
  // (a road the map gives two lanes or more - its lanes counted, not guessed - kept to 85 % of its width at the least,
  // and the houses that would stand on it at that left out as over it: the map's line runs off the middle of such a
  // road, or the house is drawn out over it, rather than the road being a lane wide)
  for (let i = 0; i < n; i++) { const p = pts[i], W = C.ways[C.r.w[clamp(p.rwv | 0, 0, C.r.w.length - 1)]], ln = W ? parseInt(W.t.lanes, 10) : 0; if (ln >= 2 && p.w > 4.2) minW[i] = Math.min(p.w, Math.max(3.6, p.w * 0.85)); }
  for (let i = 0; i < n; i++) { const p = pts[i], lx = Math.cos(p.h), lz = -Math.sin(p.h), hard = Math.max(2.2, minW[i] / 2 - 0.2); let L = 99, R = 99; const seen = new Set();
    E.query(p.x, p.z, 10, o => { const key = o[0] * 4096 + o[1]; if (seen.has(key)) return; seen.add(key); const b = C.bld[o[0]], X = b.x, Z = b.z, m = X.length, k = o[1], k2 = (k + 1) % m;
      const ax = X[k] - p.x, az = Z[k] - p.z, ex = X[k2] - X[k], ez = Z[k2] - Z[k], L2 = ex * ex + ez * ez || 1e-9, t = clamp(-(ax * ex + az * ez) / L2, 0, 1), qx = ax + ex * t, qz = az + ez * t, d = Math.hypot(qx, qz);
      if (Math.abs(qx * Math.sin(p.h) + qz * Math.cos(p.h)) > 3) return; // (beside the point, not ahead of it)
      if (d < hard || (p.rwtu && d < p.w / 2 + 0.5)) { bad.add(o[0]); return; } if (p.rwtu) return; const lat = qx * lx + qz * lz; if (lat >= 0) L = Math.min(L, d); else R = Math.min(R, d); });
    room[i] = Math.min(L, R); }
  for (let i = 0; i < n; i++) { let r = 99; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) r = Math.min(r, room[j]); if (r < 30) { const w = Math.max(minW[i], 2 * (r - 0.3)); if (w < pts[i].w) pts[i].w = w; } }
  if (bad.size) C.bld = C.bld.filter((b, bi) => !bad.has(bi));
}
// The map's other roads and railways that cross on bridges (bridge=yes, or carried up a level): where each crosses over
// the course - the point on the course under it, how far along the bridge, at what angle - so its deck is drawn over the
// course clear of it (see rwBridges) and its piers stand beside the course, solid (see rwBoxes). Worked out from the
// course's plan alone, so the same on every page. Kept on the pack for the stage drawn from it.
function rwOver(K) {
  const C = K.pack, pts = K.pts, cN = K.cN; if (C._ov && C._ov.cN === cN) return C._ov.list;
  const list = [], cross = (ax, az, bx, bz, cx, cz, dx, dz) => { const den = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx); if (Math.abs(den) < 1e-9) return null; const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / den, u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t, u] : null; };
  for (const [kind, lines] of [['net', C.net || []], ['rail', C.rail || []]]) lines.forEach((L, li) => {
    if (L.tu || !(L.br || (L.ly | 0) >= 1) || L.own || L.x.length < 2) return; const X = L.x, Z = L.z, cum = [0]; for (let k = 1; k < X.length; k++) cum.push(cum[k - 1] + Math.hypot(X[k] - X[k - 1], Z[k] - Z[k - 1]));
    const xs = []; for (let k = 0; k + 1 < X.length; k++) { const seen = new Set(); K.grid.query((X[k] + X[k + 1]) / 2, (Z[k] + Z[k + 1]) / 2, Math.hypot(X[k + 1] - X[k], Z[k + 1] - Z[k]) / 2 + 6, o => { if (o.i == null || o.i < 0 || o.i >= cN - 1 || seen.has(o.i)) return; seen.add(o.i);
        const p = pts[o.i], q = pts[o.i + 1], tu = p.rwtu || q.rwtu ? 1 : 0; // (over a tunnel: the course walled in under the hill there, so no piers by it, and the deck kept over the tube)
        const r = cross(p.x, p.z, q.x, q.z, X[k], Z[k], X[k + 1], Z[k + 1]); if (!r) return; if (xs.some(e => Math.abs(e.s - (cum[k] + r[1] * (cum[k + 1] - cum[k]))) < 3)) return;
        const hl = Math.atan2(X[k + 1] - X[k], Z[k + 1] - Z[k]); xs.push({ ic: o.i, s: cum[k] + r[1] * (cum[k + 1] - cum[k]), x: X[k] + r[1] * (X[k + 1] - X[k]), z: Z[k] + r[1] * (Z[k + 1] - Z[k]), sin: Math.abs(Math.sin(hl - p.h)), w: p.w, tu }); }); }
    list.push({ kind, li, L, cum, len: cum[cum.length - 1], xs }); });
  C._ov = { cN, list }; return list;
}
// (where along a bridge its piers stand beside the course: past the course's edge, its shoulder and a barrier's width)
// (a real bridge's spans: some 40 m apart on a long one, as a viaduct's are; a short one's every 18 m, as the game's own)
function rwPierStep(f) { const L = (f.s1 - f.s0) * STEP; if (L < 80) return 9; return Math.max(9, Math.round(L / Math.ceil(L / 42) / STEP)); }
function rwOverPiers(o) { const out = []; for (const c of o.xs) if (!c.tu) for (const sd of [-1, 1]) { const d = (c.w / 2 + 2.2) / Math.max(0.3, c.sin) + 0.7, s = c.s + sd * d; if (s > 1 && s < o.len - 1) out.push({ s, ic: c.ic }); } return out; }
function rwAlong(o, s) { const X = o.L.x, Z = o.L.z, cum = o.cum; let k = 0; while (k < cum.length - 2 && cum[k + 1] < s) k++; const t = clamp((s - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]), 0, 1); return [X[k] + (X[k + 1] - X[k]) * t, Z[k] + (Z[k + 1] - Z[k]) * t, Math.atan2(X[k + 1] - X[k], Z[k + 1] - Z[k])]; }
// solid what stands within reach of the road: the walls of houses facing it (each wall in lengths of 8 m or less, each
// held by the road point nearest it: see boxAt), and the map's walls, fences and guard rails by it, as high as the map
// says (else as such things are); K.boxes: layStage's list
function rwBoxes(K) {
  const C = K.pack, pts = K.pts, n = K.cN, nearI = (x, z, r) => { let bi = -1, bd = r * r; K.grid.query(x, z, r, o => { if (o.r || o.i == null || o.i >= n) return; const d = (o.x - x) ** 2 + (o.z - z) ** 2; if (d < bd) { bd = d; bi = o.i; } }); return [bi, Math.sqrt(bd)]; };
  const piece = (ax, az, bx, bz, th, top, kind) => { const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const nx = -(bz - az) / L * th / 2, nz = (bx - ax) / L * th / 2, mx = (ax + bx) / 2, mz = (az + bz) / 2, [i, d] = nearI(mx, mz, 24); if (i < 0) return;
    if (d < pts[i].w / 2 + 0.25) return; const y = typeof top === 'function' ? top(mx, mz, i) : top; K.boxes.push({ i, q: Float64Array.from([ax + nx, az + nz, bx + nx, bz + nz, bx - nx, bz - nz, ax - nx, az - nz]), top: y, bot: -1e4, kind, rw: 1 }); };
  const cut = (ax, az, bx, bz, len, f) => { const L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / len)); for (let k = 0; k < m; k++) f(ax + (bx - ax) * k / m, az + (bz - az) * k / m, ax + (bx - ax) * (k + 1) / m, az + (bz - az) * (k + 1) / m); };
  for (const b of C.bld || []) { if (nearI(b.cx, b.cz, Math.sqrt(b.a) / 2 + 26)[0] < 0) continue; const X = b.x, Z = b.z, m = X.length;
    for (let k = 0; k < m; k++) { const k2 = (k + 1) % m; cut(X[k], Z[k], X[k2], Z[k2], 8, (ax, az, bx, bz) => { const [i, d] = nearI((ax + bx) / 2, (az + bz) / 2, 24); if (i < 0 || d > 20) return;
      // (the wall's thickness inward: the side of the edge away from the road)
      piece(ax, az, bx, bz, 0.5, 1e4, b.k === 6 || b.k === 7 ? 'shed' : 'house'); }); } }
  // (the piers of the bridges that cross over the course, beside it: see rwOver)
  for (const o of rwOver(K)) { const bw = (o.kind === 'rail' ? 4.2 : Math.max(3, o.L.w || 4)) + 1.2; for (const pr of rwOverPiers(o)) { const [x, z, h] = rwAlong(o, pr.s), lx = Math.cos(h), lz = -Math.sin(h), fx = Math.sin(h), fz = Math.cos(h), a = bw / 2, b = 0.65;
      K.boxes.push({ i: pr.ic, q: Float64Array.from([x - lx * a - fx * b, z - lz * a - fz * b, x + lx * a - fx * b, z + lz * a - fz * b, x + lx * a + fx * b, z + lz * a + fz * b, x - lx * a + fx * b, z - lz * a + fz * b]), top: 1e4, bot: -1e4, kind: 'pier', rw: 1 }); } }
  for (const w of C.bar || []) { const kind = w.k === 'wall' ? 'wall' : w.k === 'fence' ? 'fence' : w.k === 'rail' ? 'rail' : w.k === 'jersey' ? 'wall' : null; if (!kind) continue;
    const H = w.h > 0 ? w.h : kind === 'wall' ? 1.2 : kind === 'fence' ? 1.2 : 0.75, th = kind === 'wall' ? 0.45 : kind === 'rail' ? 0.25 : 0.12;
    for (let k = 0; k + 1 < w.x.length; k++) cut(w.x[k], w.z[k], w.x[k + 1], w.z[k + 1], 4, (ax, az, bx, bz) => { const [i, d] = nearI((ax + bx) / 2, (az + bz) / 2, 14); if (i < 0 || d > 12) return; piece(ax, az, bx, bz, th, (x, z) => K.nat(x, z) + H, kind); }); }
}
// the paint and ironwork the map has on the road: a marked crossing (its zebra), where the map has one on the line
function rwMarks(K, marks) { const C = K.pack, pts = K.pts, n = K.cN;
  for (const q of C.pt || []) { if (q.k !== 'crossing') continue; let bi = -1, bd = 9; K.grid.query(q.x, q.z, 4, o => { if (o.r || o.i == null || o.i >= n) return; const d = (o.x - q.x) ** 2 + (o.z - q.z) ** 2; if (d < bd) { bd = d; bi = o.i; } });
    if (bi < 2 || bi > n - 3 || pts[bi].tag) continue; if (Math.abs(wrapAngle(pts[bi + 2].h - pts[bi - 2].h)) > 0.25) continue; marks.push({ i: bi, kind: 'paint', shape: 'zebra', lat: 0, s: bi * STEP, hl: 1.6, hw: pts[bi].w / 2 }); } }
// (the stage object of a real course: what layStage made, with the run, the canonical stretch and the course itself)
function rwFinish(L, P, RN, T) {
  if (!L) return T;
  Object.assign(T, { real: P.pack, rwKind: L.kind, cN: L.cN, ali: RN.ali, alf: RN.alf, rwRun: L.run, rwView: { startIdx: L.rng[0], finishIdx: L.rng[1], stopIdx: L.rng[2] }, rwCtl: L.cctl, rwTurnM: L.turn ? { x: L.turn.cx, z: L.turn.cz, r: L.turn.Rc - L.turn.W / 2 - 0.6, W: L.turn.W, i: L.iB + Math.round(L.turn.x.length / 2) } : null, label: P.pack.name || 'Real road', rwLaps: L.run && L.run.laps || 0 });
  T.length = (T.finishIdx - T.startIdx) * STEP; return T;
}

