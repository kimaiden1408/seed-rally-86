// ==== ROUND 49: CIRCUITS AS THEY ARE BUILT, LANES THAT CHANGE AS ROADS DO, THE ROAD'S OWN CROSSFALL ====
// A circuit's track is one wide surface, not a lane: its width the map's where it has one (the track between its white
// lines), else as circuits are built - FIA Appendix O: a permanent circuit at least 12 m wide (art. 7.3), a pit lane
// 12 m (7.9); a karting track some 8 m, a dirt or rallycross track some 10 m. Beyond each white line (continuous white
// lines, at least 10 cm wide: 7.6) a compact verge level with the track and continuing its fall (7.6): here a paved
// band RW_VB wide, where the kerbs lie at the bends; beyond that grass, as level as the run-off is (falling no more than
// 3 %: 7.6), to the guard rail.
const RW_VB = 1.2;
// (a street circuit - a course mostly on public roads, its own raceway pieces where the circuit leaves them, as Monaco's
// on its quays - has its barriers at the track's edge and a narrow verge; RW_SC, set for the course being laid: see
// rwLayout)
let RW_SC = false;
const rwVB = () => RW_SC ? 0.5 : RW_VB;
function rwRaceShare(C) { const R = C.r; let all = 0, race = 0; for (let k = 0; k + 1 < R.x.length; k++) { const d = Math.hypot(R.x[k + 1] - R.x[k], R.z[k + 1] - R.z[k]), W = C.ways[R.w[k]]; all += d; if (W && W.t && W.t.highway === 'raceway') race += d; } return all ? race / all : 0; }
function rwRaceW(t) {
  const w = parseFloat(String(t.width || t['width:carriageway'] || t.est_width || '').replace(',', '.'));
  if (w > 3 && w < 40) return w;
  const r = String(t.raceway || '') + ' ' + String(t.service || ''), nm = String(t.name || '');
  if (/pit/i.test(r) || /\bpit|boxengasse|boxenstra|피트|ピット/i.test(nm)) return 12;
  if (/kart/i.test(String(t.sport || '') + r + nm)) return 8;
  if (/^(gravel|dirt|unpaved|compacted|ground|grass|fine_gravel)/.test(t.surface || '') || /motocross|rallycross|autocross|dirt|speedway/.test(t.sport || '')) return 10;
  return 12;
}
// (the grass between the verge band and the guard rail: an old road circuit's rails stand close - the Nordschleife's a
// couple of metres off - a modern circuit's further out, behind its run-off)
const rwRaceRo = W => RW_SC ? 0.4 : W < 11 ? 2.2 : 5.5;
// The rate a road's width may change (m of width per m along it), as its designers taper it: a lane taken away over
// L = 0.62 S W at 70 km/h or more, W S^2 / 155 below (S km/h; the MUTCD's merging taper, as state manuals put it in
// metric units), a lane added or a shoulder widened no faster; a circuit's width by no more than 1 m in 20 m
// (FIA Appendix O 7.3)
function rwTaperR(t) {
  if ((t.highway || '') === 'raceway') return 0.05;
  const hw = (t.highway || 'road').replace('_link', ''), S = rwSpeedOf(t.maxspeed) || { motorway: 120, trunk: 100, primary: 90, secondary: 80, tertiary: 70, unclassified: 60, residential: 40, living_street: 20, service: 30, track: 30, road: 60 }[hw] || 50;
  const k = S >= 70 ? 0.62 * S : S * S / 155; return 1 / clamp(k, 12, 75);
}
// The map's widths along the laid line, eased as a road's width changes: a narrower stretch a dozen metres long or
// less between wider ones (a link, a tunnel or a piece of a junction mapped as a way of its own, without the lanes its
// road has) as wide as the road either side of it; then each change of width a taper at the road's own rate (rwTaperR),
// half of it before the place the map changes width and half after (where the map splits the way is about where the
// lane begins or ends; the taper's middle there) - a circuit's sections as wide as the map gives them, each change
// spread so; and where the map gives a narrowing itself (a bridge's one lane), the narrowing reached at it, its taper
// before it. Returns the eased widths
function rwEaseW(CL, tagsAt, wAt, closed) {
  const n = CL.n, W = new Float32Array(n), firm = new Uint8Array(n), R = new Float32Array(n);
  for (let m = 0; m < n; m++) { const t = tagsAt(CL.v[m]); W[m] = wAt(CL.v[m]); R[m] = rwTaperR(t); firm[m] = (t.highway || '') !== 'raceway' && (rwYes(t.bridge) && t.lanes === '1') ? 1 : 0; }
  const ix = k => closed ? ((k % n) + n) % n : clamp(k, 0, n - 1), r = 3, D = new Float32Array(n), B = new Float32Array(n);
  for (let k = 0; k < n; k++) { let m = 0; for (let j = -r; j <= r; j++) m = Math.max(m, W[ix(k + j)]); D[k] = m; }
  for (let k = 0; k < n; k++) { let m = 1e9; for (let j = -r; j <= r; j++) m = Math.min(m, D[ix(k + j)]); B[k] = firm[k] ? W[k] : Math.max(W[k], m); }
  // (and a wider stretch a dozen metres long or less between narrower ones - a junction's square mapped as a way of its
  // own - as wide as the road either side, unless the map gives its width)
  { const tg = new Uint8Array(n); for (let m = 0; m < n; m++) { const t = tagsAt(CL.v[m]); tg[m] = t.width || t['width:carriageway'] ? 1 : 0; }
    for (let k = 0; k < n; k++) { let m = 1e9; for (let j = -r; j <= r; j++) m = Math.min(m, B[ix(k + j)]); D[k] = m; }
    for (let k = 0; k < n; k++) { if (firm[k] || tg[k]) continue; let m = 0; for (let j = -r; j <= r; j++) m = Math.max(m, D[ix(k + j)]); B[k] = Math.min(B[k], m); } }
  // (the taper either side of each change: the widest the changes before and after allow, and the narrowest, averaged -
  // a step of dW becomes a ramp dW / rate long about it)
  const K2 = closed ? 2 * n : n; let up, dn;
  const env = () => { up = B.slice(); dn = B.slice();
    for (let q = 1; q < K2; q++) { const a = ix(q), b = ix(q - 1), g = 2 * Math.min(R[a], R[b]) * STEP; up[a] = Math.max(up[a], up[b] - g); dn[a] = Math.min(dn[a], dn[b] + g); }
    for (let q = K2 - 2; q >= 0; q--) { const a = ix(q), b = ix(q + 1), g = 2 * Math.min(R[a], R[b]) * STEP; up[a] = Math.max(up[a], up[b] - g); dn[a] = Math.min(dn[a], dn[b] + g); } };
  env();
  // (a narrower stretch too short for the road to taper down to it and back again - a 2+1 road whose overtaking lane
  // changes sides through a short stretch the map gives one lane each way, a lane dropped for a few dozen metres - stays
  // as wide as the narrower of its two sides: the road keeps its width and only its lines change. Not where the map
  // gives the width itself, nor on a circuit, whose sections the map measures)
  { const fixed = new Uint8Array(n); for (let m = 0; m < n; m++) { const t = tagsAt(CL.v[m]); fixed[m] = firm[m] || t.width || t['width:carriageway'] || (t.highway || '') === 'raceway' ? 1 : 0; }
    let s0 = -1; for (let k = 0; k < n; k++) if (up[k] <= B[k] + 0.05) { s0 = k; break; }
    if (s0 >= 0) { let any = false;
      for (let q = 0; q < n;) { if (up[ix(s0 + q)] <= B[ix(s0 + q)] + 0.05) { q++; continue; } let e = q; while (e < n && up[ix(s0 + e)] > B[ix(s0 + e)] + 0.05) e++;
        if (e < n && (closed || (s0 + q - 1 >= 0 && s0 + e < n))) { const a = ix(s0 + q - 1), b = ix(s0 + e), lo = Math.min(B[a], B[b]); let mx = 0, fx = false; for (let j = q; j < e; j++) { const k = ix(s0 + j); mx = Math.max(mx, B[k]); if (fixed[k]) fx = true; }
          if (!fx && lo > mx + 0.05) { for (let j = q; j < e; j++) B[ix(s0 + j)] = lo; any = true; } }
        q = e; }
      if (any) env(); } }
  const E = new Float32Array(n); for (let k = 0; k < n; k++) E[k] = (up[k] + dn[k]) / 2;
  // (a narrowing the map gives itself: reached at it, the taper before it)
  for (let k = 0; k < n; k++) if (firm[k]) E[k] = Math.min(E[k], W[k]);
  for (let q = 1; q < K2; q++) { const a = ix(q), b = ix(q - 1); E[a] = Math.min(E[a], E[b] + R[a] * STEP); }
  for (let q = K2 - 2; q >= 0; q--) { const a = ix(q), b = ix(q + 1); E[a] = Math.min(E[a], E[b] + R[a] * STEP); }
  return E;
}
// ---- a circuit's kerbs ----
// The map rarely has a circuit's kerbs, so they are laid as circuits have them: at each bend tighter than 350 m that turns
// 15 degrees or more, on its inside about its apex (the middle two thirds of the bend about its tightest point, 12 m at
// least), on its outside where it opens out (from past its apex to some way beyond its end, as a car running wide there
// needs: 10 to 40 m), and on the outside where a tight bend (under 80 m) is turned into; none across a junction's mouth
// (a pit lane's), on a bridge or in a tunnel. A kerb is the painted concrete in the verge band beyond the white line (a concrete form between the track
// and the verge or run-off, FIA's words), as wide as the band, rising from the track's level at its inner edge to its
// height at its outer edge (4 cm at an apex, 3 cm elsewhere; the land behind it level with its top), with shallow ribs a
// wheel feels, painted in red and white blocks a metre long; its ends ramped over 2 m. T.rwKb: { n, k: [left, right]
// (0-1 per canonical point), h: [left, right] (its height) }
function rwKerbs(T) {
  const P = T.pts, n = T.cN || P.length, loop = T.rwKind === 'loop'; let any = false; for (let i = 0; i < n; i++) if (P[i].rwhw === 'raceway') { any = true; break; } if (!any || n < 20) return null;
  const ix = k => loop ? ((k % (n - 1)) + (n - 1)) % (n - 1) : clamp(k, 0, n - 1), K0 = new Float32Array(n), Kv = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = P[ix(i - 1)], b = P[ix(i + 1)]; K0[i] = wrapAngle(b.h - a.h) / (2 * STEP); }
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = -5; j <= 5; j++) { const q = 6 - Math.abs(j); s += K0[ix(i + j)] * q; c += q; } Kv[i] = s / c; }
  const k = [new Float32Array(n), new Float32Array(n)], h = [new Float32Array(n), new Float32Array(n)], no = [new Uint8Array(n), new Uint8Array(n)];
  for (let i = 0; i < n; i++) { const p = P[i]; if (p.rwhw !== 'raceway' || p.tag === 'bridge' || p.rwtu || p.rwturn) { no[0][i] = no[1][i] = 1; } }
  for (const sp of T.spurs || []) { if (sp.a == null || sp.a >= n) continue; const m = Math.ceil(((sp.pts[0] && sp.pts[0].w) || 8) / 2 / STEP) + 3; for (let q = -m; q <= m; q++) no[sp.s > 0 ? 0 : 1][ix(sp.a + q)] = 1; }
  const lay = (sd, a, b, H) => { for (let i = a; i <= b; i++) { const j = ix(i); if (no[sd][j]) continue; const e = Math.min(i - a, b - i), v = clamp((e + 0.5) / 1, 0, 1); if (v > k[sd][j]) { k[sd][j] = v; h[sd][j] = Math.max(h[sd][j], H); } } };
  const R0 = 1 / 350, lim = loop ? n - 1 : n; let i0 = 0; if (loop) while (i0 < lim && Math.abs(Kv[i0]) >= R0 * 0.8) i0++; // (a circuit's scan begins off any bend, so none is cut in two)
  for (let i = i0; i < i0 + lim;) { if (Math.abs(Kv[ix(i)]) < R0) { i++; continue; } const sg = Math.sign(Kv[ix(i)]); let j = i, pk = i, turn = 0, kmax = 0;
    while (j - i < lim && Math.abs(Kv[ix(j)]) >= R0 * 0.8 && Math.sign(Kv[ix(j)]) === sg) { const v = Math.abs(Kv[ix(j)]); turn += v * STEP; if (v > kmax) { kmax = v; pk = j; } j++; }
    const b = j - 1; if (turn >= 15 * Math.PI / 180) {
      const ins = sg > 0 ? 0 : 1, out = 1 - ins, L = b - i, Rm = 1 / kmax;
      const a1 = Math.round(pk - Math.max(3, 0.35 * (pk - i))), b1 = Math.round(pk + Math.max(3, 0.35 * (b - pk))); lay(ins, a1, b1, 0.04);
      const a2 = Math.round(pk + 0.45 * (b - pk)), b2 = b + Math.round(clamp(0.3 * L * STEP, 10, 40) / STEP); lay(out, a2, b2, 0.03);
      if (Rm < 80) lay(out, i - Math.round(6 / STEP), Math.round(i + 0.25 * (pk - i)), 0.03);
    }
    i = Math.max(j, i + 1); }
  // (a kerb a few metres from the next on the same side: one kerb)
  for (let sd = 0; sd < 2; sd++) for (let i = 0; i < n; i++) if (!k[sd][i]) { let j = i; while (j < n && !k[sd][j]) j++; if (i > 0 && j < n && j - i <= 3) for (let q = i; q < j; q++) if (!no[sd][q]) { k[sd][q] = 1; h[sd][q] = Math.max(h[sd][i - 1], h[sd][j]); } i = j; }
  if (loop) for (let sd = 0; sd < 2; sd++) { k[sd][n - 1] = k[sd][0]; h[sd][n - 1] = h[sd][0]; }
  return T.rwKb = { n, k, h };
}
// the kerb's rise at (s, lat) on the canonical points: 0 off any kerb. sm: as drawn (no ribs)
function rwKerbY(T, s, lat, sm) {
  const KB = T.rwKb, f = s / STEP, i = f | 0; if (i < 0 || i + 1 >= KB.n) return 0; const sd = lat >= 0 ? 0 : 1, A = KB.k[sd], a = A[i], b = A[i + 1]; if (!(a > 0 || b > 0)) return 0;
  const t = f - i, P = T.pts, p = P[i], q = P[i + 1], hw = ((p.rwlw || p.w) + ((q.rwlw || q.w) - (p.rwlw || p.w)) * t) / 2, bw = Math.max(0.3, (p.w + (q.w - p.w) * t) / 2 - hw), u = (Math.abs(lat) - hw) / bw; if (u <= 0) return 0;
  const H = (a + (b - a) * t) * KB.h[sd][a >= b ? i : i + 1], y = H * smooth(0, 0.7, Math.min(1, u));
  return sm ? y : y - H * 0.3 * (0.5 + 0.5 * Math.cos(2 * Math.PI * s / 0.5)) * smooth(0.08, 0.35, u);
}
// (whether a tyre's patch at (s, lat) is on a kerb's paint)
function rwKerbOn(T, s, lat) { const KB = T.rwKb; if (!KB) return false; const i = Math.round(s / STEP); if (i < 0 || i >= KB.n) return false; const sd = lat >= 0 ? 0 : 1; if (!(KB.k[sd][i] > 0)) return false; const p = T.pts[i]; return Math.abs(lat) > (p.rwlw || p.w) / 2 + 0.05; }
// The kerbs drawn: their own mesh over the road's surface, red and white blocks a metre long, five points across each so
// the rise to its outer edge shows (rows: the road's 1 m rows, as rwPaint uses them)
function rwKerbMesh(T, P, rows, G) {
  const KB = T.rwKb; if (!KB || !rows || rows.length < 2) return 0; const N = Math.min(KB.n, P.length), rowsN = rows.length, pos = [], col = [], idx = [];
  const RED = [0.66, 0.1, 0.08], WH = [0.86, 0.86, 0.83];
  const rowAt = s => { const f = clamp(s, 0, rowsN - 1.0001), k = Math.floor(f), t = f - k, A = rows[k], B2 = rows[k + 1]; let lx = A.lx + (B2.lx - A.lx) * t, lz = A.lz + (B2.lz - A.lz) * t; const l = Math.hypot(lx, lz) || 1; return { x: A.x + (B2.x - A.x) * t, z: A.z + (B2.z - A.z) * t, lx: lx / l, lz: lz / l, w: A.w + (B2.w - A.w) * t }; };
  const hwAt = s => { const f = clamp(s / STEP, 0, N - 1.0001), i = Math.floor(f), t = f - i, p = P[i], q = P[i + 1]; return ((p.rwlw || p.w) + ((q.rwlw || q.w) - (p.rwlw || p.w)) * t) / 2; };
  const U = [0, 0.2, 0.45, 0.7, 1];
  for (let sd = 0; sd < 2; sd++) { const A = KB.k[sd], sg = sd ? -1 : 1;
    for (let i = 0; i < N; i++) { if (!(A[i] > 0)) continue; let j = i; while (j + 1 < N && A[j + 1] > 0) j++;
      const s0 = Math.max(0, (i - 0.5) * STEP), s1 = Math.min((N - 1) * STEP, (j + 0.5) * STEP);
      for (let s = s0; s < s1 - 0.02;) { const e = Math.min(s1, Math.floor(s + 1e-6) + 1), C3 = (Math.floor(s + 1e-6) & 1) ? WH : RED, v0 = pos.length / 3;
        for (const ss of [s, e]) { const r = rowAt(ss), hw = hwAt(ss), bw = r.w / 2 - hw; for (const u of U) { const l = sg * (hw + u * bw); pos.push(r.x + r.lx * l, roadSurfY(T, ss, l, r.w, true) + 0.006, r.z + r.lz * l); col.push(C3[0], C3[1], C3[2]); } }
        for (let c = 0; c + 1 < U.length; c++) { const a = v0 + c, b = v0 + c + 1, d = v0 + U.length + c, f = d + 1; if (sg > 0) idx.push(a, d, b, b, d, f); else idx.push(a, b, d, b, f, d); }
        s = e; }
      i = j; } }
  if (!idx.length) return 0;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  const m = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, specular: 0x111111, shininess: 12, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }); m.onBeforeCompile = roadLampShader;
  const ms = new THREE.Mesh(g, m); ms.receiveShadow = true; ms.userData.rw = 'kerbs'; G.add(ms); return idx.length / 3;
}
// ---- a circuit's barriers: the map's where it has them, else steel rails both sides at the run-off's back ----
// (per canonical point: rwrb[0 left, 1 right] 1 where the circuit's own guard rail stands, none where the map has a
// rail, a wall or a concrete barrier along that side within 20 m)
function rwRaceRails(K) {
  const C = K.pack, P = K.pts, n = K.cN; let any = false; for (let i = 0; i < n; i++) if (P[i].rwhw === 'raceway') { any = true; break; } if (!any) return 0;
  const cell = 25, Gd = new Map(), key = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell);
  for (const b of C.bar || []) { if (!/^(rail|wall|jersey)$/.test(b.k)) continue; for (let q = 0; q + 1 < b.x.length; q++) { const ax = b.x[q], az = b.z[q], bx = b.x[q + 1], bz = b.z[q + 1], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 4));
      for (let e = 0; e <= m; e++) { const x = ax + (bx - ax) * e / m, z = az + (bz - az) * e / m, kk = key(x, z); let l = Gd.get(kk); if (!l) Gd.set(kk, l = []); l.push(x, z); } } }
  let cnt = 0;
  for (let i = 0; i < n; i++) { const p = P[i]; if (p.rwhw !== 'raceway') continue; const lx = Math.cos(p.h), lz = -Math.sin(p.h), fx = Math.sin(p.h), fz = Math.cos(p.h), hw = p.w / 2, cx = Math.floor(p.x / cell), cz = Math.floor(p.z / cell), hit = [false, false];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = Gd.get((cx + a) + ',' + (cz + b)); if (!l) continue;
      for (let q = 0; q < l.length; q += 2) { const ox = l[q] - p.x, oz = l[q + 1] - p.z, lat = ox * lx + oz * lz, al = Math.abs(ox * fx + oz * fz), al2 = Math.abs(lat); if (al < 5 && al2 > hw + 0.8 && al2 < hw + 20) hit[lat > 0 ? 0 : 1] = true; } }
    p.rwrb = [hit[0] ? 0 : 1, hit[1] ? 0 : 1]; cnt += p.rwrb[0] + p.rwrb[1]; }
  return cnt;
}
// (the route planner: a circuit's one-way driven against it costs this many times its length - see RWRoute.path)
const RW_BACK = 6;
// ---- a circuit's line ----
// The map draws a circuit as straight runs between points every 15 to 30 m; rwCenter rounds each corner with an arc as
// wide as the runs either side leave room for, so where two of the map's points stand close in a bend the arc between
// them is squeezed: the bend comes out in short tight pieces with straights between (at Inje, 20 degrees turned in 6 m:
// an 8 m radius in a corner of 60 m or more). A real circuit's curvature runs on smoothly (it is laid out in arcs and
// spirals). On a circuit's track the line's curvature is spread along it (a Gaussian, RW_CSM metres), the line laid
// out again from it, its drift from where rwCenter had it taken out over RW_CDR metres - so it stays on the map's line
// as rwCenter's did, cutting a squeezed corner by a metre or less (never more than 1.2 m, a street circuit's 0.5 m) -
// and laid out again every ds. Public roads keep
// rwCenter's line (their corners as mapped).
const RW_CSM = 5, RW_CDR = 30;
function rwRaceSmooth(CL, isRace, closed) {
  const n = CL.n, ds = CL.ds; let any = false; const M = new Float64Array(n); for (let i = 0; i < n; i++) if (isRace(CL.v[i])) { M[i] = 1; any = true; } if (!any) return 0;
  const X = CL.x, Z = CL.z, H = CL.h, L = closed ? n - 1 : n; // (a loop's last point is its first)
  const gauss = (A, sig, cnt) => { const r = Math.ceil(3 * sig), G = []; let gs = 0; for (let j = -r; j <= r; j++) { const g = Math.exp(-0.5 * (j / sig) * (j / sig)); G.push(g); gs += g; } const O = new Float64Array(cnt);
    for (let i = 0; i < cnt; i++) { let a = 0, ws = 0; for (let j = -r; j <= r; j++) { let k = i + j; if (closed) k = ((k % cnt) + cnt) % cnt; else if (k < 0 || k >= cnt) continue; a += G[j + r] * A[k]; ws += G[j + r]; } O[i] = a / ws; } return O; };
  const sg = RW_CSM / ds, nS = closed ? L : n - 1, K = new Float64Array(nS); for (let i = 0; i < nS; i++) K[i] = wrapAngle(H[(i + 1) % n] - H[i]) / ds;
  const Ms = gauss(M, sg, L), Ks = gauss(K, sg, nS), K2 = new Float64Array(nS); for (let i = 0; i < nS; i++) { const w = Math.min(Ms[i], Ms[(i + 1) % L]); K2[i] = w * Ks[i] + (1 - w) * K[i]; }
  // (laid out again from its first point and heading, then the drift taken out: a loop's closing gap spread round it first)
  const NX = new Float64Array(n), NZ = new Float64Array(n); let h = H[0]; NX[0] = X[0]; NZ[0] = Z[0];
  for (let i = 0; i + 1 < n; i++) { const k = K2[Math.min(i, nS - 1)], hm = h + 0.5 * k * ds; NX[i + 1] = NX[i] + Math.sin(hm) * ds; NZ[i + 1] = NZ[i] + Math.cos(hm) * ds; h += k * ds; }
  if (closed) { const ex = X[n - 1] - NX[n - 1], ez = Z[n - 1] - NZ[n - 1]; for (let i = 0; i < n; i++) { NX[i] += ex * i / (n - 1); NZ[i] += ez * i / (n - 1); } }
  const EX = new Float64Array(L), EZ = new Float64Array(L); for (let i = 0; i < L; i++) { EX[i] = X[i] - NX[i]; EZ[i] = Z[i] - NZ[i]; }
  const Ex = gauss(EX, RW_CDR / ds, L), Ez = gauss(EZ, RW_CDR / ds, L), Mw = gauss(M, 2 * sg, L);
  const FX = new Float64Array(n), FZ = new Float64Array(n); let dmax = 0;
  const cap = RW_SC ? 0.5 : 1.2; // (never further from rwCenter's line than this, eased: a street circuit's walls stand at its edge)
  for (let i = 0; i < L; i++) { const w = Mw[i], fx = NX[i] + Ex[i], fz = NZ[i] + Ez[i], dx = w * (fx - X[i]), dz = w * (fz - Z[i]), d = Math.hypot(dx, dz), k = d > 1e-9 ? cap * Math.tanh(d / cap) / d : 1; FX[i] = X[i] + dx * k; FZ[i] = Z[i] + dz * k; dmax = Math.max(dmax, d * k); }
  if (closed) { FX[n - 1] = FX[0]; FZ[n - 1] = FZ[0]; } else { FX[n - 1] = X[n - 1]; FZ[n - 1] = Z[n - 1]; }
  // (every ds again along the new line, each point keeping the map's point it belongs to)
  const cum = new Float64Array(n); for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(FX[i] - FX[i - 1], FZ[i] - FZ[i - 1]); const tot = cum[n - 1], d2 = tot / (n - 1);
  const V0 = Int32Array.from(CL.v); let q = 0;
  for (let m = 0; m < n; m++) { const s = Math.min(tot, m * d2); while (q < n - 2 && cum[q + 1] < s) q++; const t = clamp((s - cum[q]) / Math.max(1e-9, cum[q + 1] - cum[q]), 0, 1); X[m] = FX[q] + (FX[q + 1] - FX[q]) * t; Z[m] = FZ[q] + (FZ[q + 1] - FZ[q]) * t; CL.v[m] = V0[t < 0.5 ? q : q + 1]; }
  for (let m = 0; m < n; m++) { const a = closed ? (m - 1 + L) % L : Math.max(0, m - 1), b = closed ? (m + 1) % L : Math.min(n - 1, m + 1); H[m] = Math.atan2(X[b] - X[a], Z[b] - Z[a]); }
  if (closed) H[n - 1] = H[0];
  if (CL.k) for (let m = 0; m < n; m++) { const b = closed ? (m + 1) % L : Math.min(n - 1, m + 1); CL.k[m] = m === n - 1 && !closed ? 0 : wrapAngle(H[b] - H[m]) / d2; }
  CL.len = tot; CL.ds = d2; CL.dmax = dmax; return dmax;
}
// ---- a circuit's racing line kept off its walls ----
// The crews' racing line runs within the road's edges less half a car and a margin (racingLine). On a circuit the
// track and its paved verges are wide, and where a wall or a barrier the map has stands just past them - the 24 Hours
// layout's link onto the Nordschleife runs under a bridge between its walls - a crew following the line, which cuts a
// long bend by a metre and a half inside it as any driver steering for a point ahead does, met the wall's end every lap.
// On a circuit's track the line keeps RW_LINE_CLR from any wall, barrier or building beside it (half a car, that cut and
// a margin), on that side; elsewhere as before.
const RW_LINE_CLR = 3.3;
function rwLineRoom(T, a, n, limL, limR) {
  const P = T.pts, cN = T.cN || P.length, BA = T.boxAt; if (!BA) return 0; let cut = 0;
  const L = new Float64Array(n).fill(1e9), R = new Float64Array(n).fill(1e9);
  for (let k = 0; k < n; k++) { const r = a + k, c = T.ali ? T.ali[Math.min(r, T.ali.length - 1)] : r, p = P[Math.min(c, cN - 1)]; if (!p || p.rwhw !== 'raceway') continue;
    const fx = Math.sin(p.h), fz = Math.cos(p.h), lx = Math.cos(p.h), lz = -Math.sin(p.h), flip = T.alf && T.alf[Math.min(r, T.alf.length - 1)] < 0;
    for (const b of BA[c] || []) { if (b.soft) continue; let lo = 1e9, hi = -1e9, near = false;
      for (let v = 0; v < 8; v += 2) { const dx = b.q[v] - p.x, dz = b.q[v + 1] - p.z, al = dx * fx + dz * fz, la = dx * lx + dz * lz; if (Math.abs(al) < 4) near = true; lo = Math.min(lo, la); hi = Math.max(hi, la); }
      if (!near || (lo < 0 && hi > 0)) continue; // (beside the point, and wholly to one side of the road's line)
      let cl = lo > 0 ? lo : 1e9, cr = hi < 0 ? -hi : 1e9; if (flip) [cl, cr] = [cr, cl]; L[k] = Math.min(L[k], cl); R[k] = Math.min(R[k], cr); } }
  for (let k = 0; k < n; k++) { let l = 1e9, r = 1e9; for (let j = Math.max(0, k - 4); j <= Math.min(n - 1, k + 4); j++) { l = Math.min(l, L[j]); r = Math.min(r, R[j]); }
    if (l < 1e8) { const v = Math.max(0.15, Math.min(limL[k], l - RW_LINE_CLR)); if (v < limL[k]) { limL[k] = v; cut++; } }
    if (r < 1e8) { const v = Math.max(0.15, Math.min(limR[k], r - RW_LINE_CLR)); if (v < limR[k]) { limR[k] = v; cut++; } } }
  return cut;
}
// ---- the road's own crossfall ----
// Where the elevation model is a survey's own (Mapterhorn's national lidar and photogrammetry, a metre to a few metres
// a pixel: its tiles there at zoom 14 or finer), the pack has the fall across the road measured on it (xs: every xd m
// along the map's line, the fall to the left from a point some way right of the line to one as far left, within the
// road's edges). That is the road's own: a circuit's banking, a pass's bends, a motorway's superelevation. Where it is
// not (the 30 m global model, or a bridge, a tunnel, a turning place), the crossfall is laid as roads are designed:
//   - a road: superelevated into its bends for its speed (AASHTO's distribution of e and side friction, method 5:
//     e = e_max (Rmin/R)(2 - Rmin/R), e_max 7 %, 5 % on a motorway or a trunk road, 4 % in a town; Rmin = V^2 / 127
//     (e_max + f_max)), where that is more than its crown; an old minor road leaning a little with its hillside;
//   - a circuit: 1.5 % at least toward the inside of the bend it is in or coming to (FIA 7.5: 1.5 to 3 % on the
//     straights), banked into its bends up to 6 % (FIA 7.5: no more than 10 %).
// The measured crossfall is trusted on a circuit (to 25 %: the Karussell's banking); on a road, where it agrees with
// the design to within 5 % (else the map's line is off its road there and the model reads the hillside), to 12 %.
// o: { pack, CL, pts, N, kav, raw }: raw filled for each canonical point (before layStage eases it)
function rwAlongOf(C, CL) {
  const R = C.r, cum = new Float64Array(R.x.length); for (let k = 1; k < R.x.length; k++) cum[k] = cum[k - 1] + Math.hypot(R.x[k] - R.x[k - 1], R.z[k] - R.z[k - 1]);
  return m => { const v = Math.min(CL.v[m], R.x.length - 2), ex = R.x[v + 1] - R.x[v], ez = R.z[v + 1] - R.z[v], L2 = ex * ex + ez * ez || 1, t = clamp(((CL.x[m] - R.x[v]) * ex + (CL.z[m] - R.z[v]) * ez) / L2, 0, 1); return cum[v] + t * Math.sqrt(L2); };
}
function rwXsAt(C, d) { const X = C.xs; if (!X || !X.length) return NaN; const f = d / (C.xd || 4), k = Math.floor(f); if (k < 0 || k + 1 >= X.length) return NaN; const a = X[k], b = X[k + 1]; if (!(a === a) || !(b === b)) return a === a ? a : b; return a + (b - a) * (f - k); }
// ---- how fast a fast road's crossfall may turn over ----
// An engineered road turns its fall across over from one side to the other along a run as long as its speed needs: its
// edges rise against its middle no faster than a relative gradient (AASHTO's greatest, 0.47 % at 90 km/h to 0.35 % at
// 130: Green Book table 3-15), so a superelevation is run out over 60 to 120 m. The land's model can turn a measured
// crossfall faster than that where it reads a central reserve, a verge or a ramp beside the carriageway (on the A8, a
// fall of 4.6 % one way to 2.2 % the other in 18 m: a car at 110 km/h went light over it). On a motorway, a trunk road
// or any road of 90 km/h or more it is held to that rate - both ways, the two orders averaged, so nothing moves along.
// A circuit keeps what was measured (its banking is built steeply and suddenly: the Karussell's concrete), as does a
// slower road (an old road's bends were not laid out with runs).
const RW_RELG = [[90, 0.0047], [100, 0.0044], [110, 0.0041], [120, 0.0038], [130, 0.0035]];
const rwRelG = V => { if (V <= 90) return 0.0047; for (let k = 1; k < RW_RELG.length; k++) if (V <= RW_RELG[k][0]) { const [a, ga] = RW_RELG[k - 1], [b, gb] = RW_RELG[k]; return ga + (gb - ga) * (V - a) / (b - a); } return 0.0035; };
function rwBankRate(C, P, bank, N) {
  const lim = new Float32Array(N); let any = false;
  for (let i = 0; i < N; i++) { const p = P[i], t = (C.ways[C.r.w[clamp(p.rwv | 0, 0, C.r.w.length - 1)]] || { t: {} }).t, hw = (t.highway || 'road').replace('_link', '');
    const V = rwSpeedOf(t.maxspeed) || { motorway: 120, trunk: 100, primary: 90, secondary: 80, tertiary: 70 }[hw] || 50;
    if (p.rwhw === 'raceway' || !(V >= 90 || hw === 'motorway' || hw === 'trunk')) { lim[i] = 1; continue; } lim[i] = rwRelG(Math.max(90, V)) * STEP / Math.max(2, p.w / 2); any = true; }
  if (!any) return 0;
  const A = Float32Array.from(bank.subarray(0, N)), B = Float32Array.from(bank.subarray(0, N));
  for (let i = 1; i < N; i++) A[i] = clamp(A[i], A[i - 1] - lim[i], A[i - 1] + lim[i]);
  for (let i = N - 2; i >= 0; i--) B[i] = clamp(B[i], B[i + 1] - lim[i], B[i + 1] + lim[i]);
  let dmax = 0; for (let i = 0; i < N; i++) { const v = 0.5 * (A[i] + B[i]); dmax = Math.max(dmax, Math.abs(v - bank[i])); bank[i] = v; } return dmax;
}
// (the most a road is banked: its class's design maximum (see rwBankRaw) and 3 % more - the land's model, read a metre or
// two either side of a narrow road's mapped line, can take in the cut or the bank beside it: on the Col de Turini a
// tenth of the road read 12 % or more, where its bends are built to 7 %; a circuit's own banking, to 25 %)
const rwEmax = p => p.set === 'village' ? 0.04 : p.rwhw === 'motorway' || p.rwhw === 'trunk' ? 0.05 : 0.07;
function rwBankMax(p) { return p.rwhw === 'raceway' ? 0.25 : rwEmax(p) + 0.03; }
function rwBankRaw(o) {
  const C = o.pack, P = o.pts, N = o.N, kav = o.kav, raw = o.raw, along = o.CL && C.xs ? rwAlongOf(C, o.CL) : null, nat = (x, z) => rwNat(C, x, z);
  // (each point's bend: its curvature, and a circuit's over 75 m either side for the side it falls to between bends)
  const k75 = new Float32Array(N); { const cs = new Float64Array(N + 1); for (let i = 0; i < N; i++) cs[i + 1] = cs[i] + kav[i]; for (let i = 0; i < N; i++) { const a = Math.max(0, i - 37), b = Math.min(N - 1, i + 37); k75[i] = (cs[b + 1] - cs[a]) / (b - a + 1); } }
  const meas = new Float32Array(N).fill(NaN);
  if (along) for (let i = 0; i < N; i++) { const p = P[i]; if (p.rwm == null || p.rwm < 0 || p.tag === 'bridge' || p.rwtu || p.rwturn) continue; meas[i] = rwXsAt(C, along(p.rwm)); }
  // (the measured crossfall's own noise: the median of five, 8 m either side)
  const md = new Float32Array(N).fill(NaN); for (let i = 0; i < N; i++) { const v = []; for (let j = Math.max(0, i - 2); j <= Math.min(N - 1, i + 2); j++) if (meas[j] === meas[j]) v.push(meas[j]); if (v.length >= 3) { v.sort((a, b) => a - b); md[i] = v[v.length >> 1]; } }
  let nm = 0;
  for (let i = 0; i < N; i++) { const p = P[i], race = p.rwhw === 'raceway', R = 1 / Math.max(1e-5, Math.abs(kav[i])), sg = Math.sign(kav[i]) || 0;
    let des;
    if (race) { const side = Math.sign(k75[i]) || sg, lean = 0.015 * clamp(Math.abs(k75[i]) * 900, 0, 1); des = clamp(side * lean + 3.5 * kav[i], -0.06, 0.06); }
    else { const tg = (C.ways[C.r.w[clamp(p.rwv | 0, 0, C.r.w.length - 1)]] || {}).t || {}, V = rwSpeedOf(tg.maxspeed) || (p.set === 'village' ? 50 : { motorway: 120, trunk: 100, primary: 90, secondary: 80, tertiary: 70, unclassified: 60, residential: 40, living_street: 20, service: 30, track: 30, road: 60 }[p.rwhw] || 50), town = p.set === 'village',
        em = town ? 0.04 : p.rwhw === 'motorway' || p.rwhw === 'trunk' ? 0.05 : 0.07, fm = clamp(0.24 - 0.00125 * V, 0.08, 0.2), Rmin = V * V / (127 * (em + fm)), q = Rmin / R, e = R <= Rmin ? em : em * q * (2 - q);
      des = sg * (e > 0.02 ? e : 0);
      if (/^(unclassified|track|service|road|residential|living_street|tertiary)$/.test(p.rwhw || '')) { const lx = Math.cos(p.h), lz = -Math.sin(p.h), d = p.w / 2 + 6, fall = (nat(p.x + lx * d, p.z + lz * d) - nat(p.x - lx * d, p.z - lz * d)) / (2 * d); des -= 0.2 * clamp(fall, -0.15, 0.15); } }
    const m = md[i]; let v = des;
    if (m === m) { const bx = rwBankMax(p); if (race) v = clamp(m, -bx, bx); else if (Math.abs(m - des) < 0.05) v = clamp(m, -bx, bx); else v = clamp(des + clamp(m - des, -0.05, 0.05) * 0.5, -bx, bx); nm++; p.rwxs = 1; }
    raw[i] = v; }
  return nm;
}
// ---- off the road: what the land is, as the map has it (a circuit's paved run-off, its gravel beds, its grass) ----
function rwOffSurf(T, x, z, p, verge) {
  const rt = T.real && T.real._rt, c = rt ? rwLcAt(rt, x, z) : 0, k = c ? RWLC[c] : '';
  if (k === 'paved') return 'tarmac';
  if (k === 'gravel') return p.rwhw === 'raceway' ? 'trap' : 'gravel';
  if (k === 'sand' && p.rwhw === 'raceway') return 'trap';
  if (p.rwhw === 'raceway') return 'grass';
  return verge ? 'gravel' : 'grass';
}
// ---- the pack's measured crossfall (the builder's, and an older pack's brought up to date: harness/enrich49.js) ----
// Every xd = 4 m along the map's line: the heights a m either side of it (a: half the road's width less 1.5 m, 1.5 m
// to 6 m), from the zoom-14 tiles the pack's land is read from - only where those are the survey's own (Mapterhorn's
// tile at zoom 14 itself: there the model is 5 m a pixel or finer, a metre where a country's lidar is); NaN elsewhere.
// Returns { xs: Float32Array, xd, xz: the share of the line the survey covers }
async function rwCrossFall(F, RX, RZ, ways, segW, zN) {
  const xd = 4, cum = [0]; for (let k = 1; k < RX.length; k++) cum.push(cum[k - 1] + Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1]));
  const L = cum[cum.length - 1], n = Math.floor(L / xd) + 1, xs = new Float32Array(n).fill(NaN); let ok = 0, k = 0;
  const tileOf = (la, lo) => { const t = rwTileXY(zN, la, lo); return RWDem.T.get(zN + '/' + Math.floor(t[0]) + '/' + Math.floor(t[1])); };
  for (let q = 0; q < n; q++) { const d = q * xd; while (k < RX.length - 2 && cum[k + 1] < d) k++; const Ls = cum[k + 1] - cum[k] || 1, f = clamp((d - cum[k]) / Ls, 0, 1), x = RX[k] + (RX[k + 1] - RX[k]) * f, z = RZ[k] + (RZ[k + 1] - RZ[k]) * f;
    const W = ways[segW[k]], t = (W && W.t) || {}; if (rwYes(t.bridge) || rwYes(t.tunnel) || t.covered === 'yes') continue;
    const hd = Math.atan2(RX[k + 1] - RX[k], RZ[k + 1] - RZ[k]), lx = Math.cos(hd), lz = -Math.sin(hd), w = t.highway === 'raceway' ? rwRaceW(t) : rwWidthOf(t, false), a = clamp(w / 2 - 1.5, 1.5, 6);
    const pl = F.ll(x + lx * a, z + lz * a), pr = F.ll(x - lx * a, z - lz * a);
    for (const pp of [pl, pr]) { if (!tileOf(pp[0], pp[1])) { const tt = rwTileXY(zN, pp[0], pp[1]); await RWDem.tile(zN, Math.floor(tt[0]), Math.floor(tt[1])); } }
    const El = tileOf(pl[0], pl[1]), Er = tileOf(pr[0], pr[1]); if (!El || !Er || El.s !== 0 || Er.s !== 0 || El.z < zN || Er.z < zN) continue;
    const hl = RWDem.at(zN, pl[0], pl[1]), hr = RWDem.at(zN, pr[0], pr[1]); if (hl === null || hr === null) continue;
    xs[q] = Math.round((hr - hl) / (2 * a) * 10000) / 10000; ok++; }
  return { xs, xd, xz: n ? Math.round(ok / n * 100) / 100 : 0 };
}
