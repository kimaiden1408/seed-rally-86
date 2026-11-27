// ==== ROUND 47: A REAL ROAD'S TUNNELS, BUILT AS GAMES BUILD THEM ====
// A real tunnel is a structure of its own, as a game's road tunnel is: a tube (a bored tunnel's vault where the land
// over it is deep, a cut-and-cover box where it is shallow) with its road, a gutter and a raised walkway along each
// wall, tiled walls and a roof lit by its own lamps, and at each end a portal: a concrete face fitted into the cutting
// it leaves from, its top following the land over it. The land over the tube is the map's own - the hill over a bored
// tunnel - drawn by the roadside strip, which is finer than the grid, and the grid under that strip cut out. Only where
// the map's land lies too low over the tube (a shallow tunnel, a covered way by the sea) is it made up over it as fill
// is, a crest over the tube falling to the land at a bank's slope; where there is no room for that bank the box stands
// out of the land, its concrete walls and roof showing. Inside the tube the ground is its floor (rwTunFloor), so the
// cameras, the wheels and whatever falls stay in it; outside it everything stands on the land (rwLandY). Nothing of the
// map's (trees, houses, walls, the land itself) is left inside the tube.
const RWT = { gut: 0.45, walk: 0.8, kerb: 0.18, soil: 0.5 };
let _rwTunOff = 0;
// the stage's real tunnels: each one's rows (a: its entry portal's face, b: its exit's), its section, and an index of
// its rows by 8 m cell. A bored vault where the map's land over the middle of it stands more than 14 m over its road;
// else a box, and a short shallow one (under a street, a building) a box standing clear of the land all its length
function rwTunPrep(T) {
  T.rwTun = null; if (!T.real || !T.feats) return null;
  const P = T.pts, N = P.length, C = T.real, list = [], of = new Array(N).fill(null), g = new Map(), cs = 8;
  for (const f of T.feats) { if (f.type !== 'tunnel' || !f.rw) continue;
    const a = Math.max(0, f.s0 - 1), b = Math.min(N - 1, f.s1 + 1); if (b - a < 3) continue; // (a: its entry face's road point, b: its exit's)
    let wm = 0; for (let i = a; i <= b; i++) wm = Math.max(wm, P[i].w);
    const Hi = wm / 2 + RWT.gut + RWT.walk, len = (b - a) * STEP, cov = [];
    for (let i = a + Math.floor((b - a) * 0.2); i <= b - Math.floor((b - a) * 0.2); i++) { const p = P[i], lx = Math.cos(p.h), lz = -Math.sin(p.h); let m = 1e9; for (const u of [-1, 0, 1]) m = Math.min(m, rwNat(C, p.x + lx * u * Hi, p.z + lz * u * Hi) - p.y); cov.push(m); }
    cov.sort((x, y) => x - y); const med = cov.length ? cov[cov.length >> 1] : 0, arch = med > 14 && len > 60, under = len < 45 && med < 3.5;
    const wallH = arch ? 2.6 : 4.7, crown = arch ? 2.6 + Math.max(3.0, Hi * 0.6) : 5.2, th = arch ? 0.55 : 0.7, nr = b - a + 1;
    const t = { a, b, s0: f.s0, s1: f.s1, Hi, Ho: Hi + th, arch, under, wallH, crown, th, top: crown + th, len, med, ex: new Uint8Array(nr * 2), sl: new Float32Array(nr * 2), done: new Uint8Array(nr * 2) };
    list.push(t); for (let i = a; i <= b; i++) { of[i] = t; P[i].rwTop = t.top; P[i].rwHo = t.Ho; }
    for (let i = a; i < b; i++) { const A = P[i], B = P[i + 1], R = t.Ho + 1.5;
      for (let gx = Math.floor((Math.min(A.x, B.x) - R) / cs); gx <= Math.floor((Math.max(A.x, B.x) + R) / cs); gx++) for (let gz = Math.floor((Math.min(A.z, B.z) - R) / cs); gz <= Math.floor((Math.max(A.z, B.z) + R) / cs); gz++) { const k = gx * 1e6 + gz; let L = g.get(k); if (!L) g.set(k, L = []); L.push(i); } } }
  return T.rwTun = list.length ? { list, of, g, c: cs } : null;
}
// (the tube's row and how far across it a point lies: [row, t along to the next, lat], or null outside every tube)
function rwTunWhere(T, x, z) {
  const U = T.rwTun; if (!U) return null; const L = U.g.get(Math.floor(x / U.c) * 1e6 + Math.floor(z / U.c)); if (!L) return null;
  // (the nearest of the tube's road lines a point lies square to; else, on the outside of a bend, where one line's
  // reach ends before the next one's begins, the nearest of the points between them inside the tube)
  const P = T.pts; let bi = -1, bt = 0, bl = 1e9;
  for (const i of L) { const A = P[i], B = P[i + 1], dx = B.x - A.x, dz = B.z - A.z, l2 = dx * dx + dz * dz || 1, t = ((x - A.x) * dx + (z - A.z) * dz) / l2; if (t < -0.02 || t > 1.02) continue;
    const lat = ((x - A.x) * dz - (z - A.z) * dx) / Math.sqrt(l2); if (Math.abs(lat) < Math.abs(bl)) { bl = lat; bi = i; bt = Math.min(1, Math.max(0, t)); } }
  if (bi < 0) for (const i of L) { const tb = U.of[i]; if (i <= tb.a) continue; const Fa = P[tb.a], Fb = P[tb.b]; if ((x - Fa.x) * Math.sin(Fa.h) + (z - Fa.z) * Math.cos(Fa.h) <= 0 || (x - Fb.x) * Math.sin(Fb.h) + (z - Fb.z) * Math.cos(Fb.h) >= 0) continue; // (between its faces only)
    const A = P[i], d = Math.hypot(x - A.x, z - A.z); if (d < Math.abs(bl)) { const B = P[i + 1]; bl = (((x - A.x) * (B.z - A.z) - (z - A.z) * (B.x - A.x)) >= 0 ? 1 : -1) * d; bi = i; bt = 0; } }
  return bi < 0 || Math.abs(bl) > U.of[bi].Hi + 0.02 ? null : [bi, bt, bl];
}
// the floor of a tube under (x, z): its road, the gutter beside it, the walkway along its wall; null outside the tubes
function rwTunFloor(T, x, z) {
  if (_rwTunOff || !T.rwTun) return null; const w0 = rwTunWhere(T, x, z); if (!w0) return null;
  const [i, t, lat] = w0, P = T.pts, A = P[i], B = P[i + 1], w = A.w + (B.w - A.w) * t, hw = w / 2, s = (i + t) * STEP, al = Math.abs(lat), tb = T.rwTun.of[i];
  if (al <= hw) return roadSurfY(T, s, lat, w);
  const e = roadSurfY(T, s, (lat < 0 ? -1 : 1) * hw, w); return al < tb.Hi - RWT.walk ? e : e + RWT.kerb;
}
// the land at (x, z), over a tube as anywhere (what the stage's scenery stands on)
function rwLandY(T, x, z) { _rwTunOff++; try { return groundY(T, x, z); } finally { _rwTunOff--; } }
// how far into a tube road point i is, 0 at its mouths to 1 some 28 m in (its daylight gone, its echo full)
function rwTunDepth(T, i) { const t = T.rwTun && T.rwTun.of[Math.round(i)]; return t ? smooth(3, 28, Math.min(i - t.a, t.b - i) * STEP) : 0; }
// the same for the camera, where it is in a tube (by its own place, under the tube's roof)
function rwTunDark(T) {
  if (!T || !T.rwTun || typeof camera === 'undefined') return 0; const c = camera.position, w0 = rwTunWhere(T, c.x, c.z); if (!w0) return 0;
  const tb = T.rwTun.of[w0[0]]; return c.y < T.pts[w0[0]].y + tb.crown + 0.3 ? rwTunDepth(T, w0[0] + w0[1]) : 0;
}
// the roadside strip's reach over a tube: wide enough for the bank down from over it to the land, and at least a grid
// cell and a half past its walls, so every grid triangle over the tube lies within it (and is cut out under it)
function rwTunExt(T, EXT, cell, fieldAt) {
  const U = T.rwTun; if (!U) return; const P = T.pts, N = P.length;
  for (const t of U.list) for (let i = t.s0; i <= t.s1; i++) { const p = P[i], hw = p.w / 2, lx = Math.cos(p.h), lz = -Math.sin(p.h), crest = p.y + t.top + RWT.soil;
    for (let s = 0; s < 2; s++) { const sd = s ? -1 : 1, L = t.Ho + 3, nat = fieldAt(p.x + lx * sd * L, p.z + lz * sd * L).h, dh = crest - nat;
      const want = Math.min(44, Math.max(t.Ho - hw + 1.5 * cell + 2.5, t.Ho - hw + (dh > 0 ? dh / 0.55 + 2.5 : 3)));
      for (let k = -5; k <= 5; k++) { const j = i + k; if (j < 0 || j >= N) continue; const o = j * 2 + s, inT = j >= t.s0 && j <= t.s1; EXT[o] = Math.max(EXT[o], inT ? want : want - Math.abs(k) * 1.5); } } }
}
// a tube row's strip columns, out from the middle of the road: the middle, the road's edge, just inside the tube's
// outer wall (twice: the land over the tube ends there), then the bank's breaks and the strip's reach
function rwTunCols(T, i, hw, ext, BRK, k) { const t = T.rwTun.of[i], u3 = Math.min(t.Ho - hw - 0.05, ext - 1.6), u4 = Math.min(t.Ho - hw - 0.02, ext - 1.5);
  return [-hw, -hw * 0.5, 0, u3, u4, BRK[k * 3], BRK[k * 3 + 1], BRK[k * 3 + 2], ext]; }
// the land over a tube at road point i, side sd (1 left), L m out from the middle (Lext: the strip's reach there; nat:
// the map's land here, natExt(): at the reach). Over the tube a crest of soil over its roof, then a bank falling to the
// map's land; where the bank would be steeper than the land stands (1 in 1.1), or the tube is a short shallow one, the
// box shows instead: the land just under its roof over it, and the map's land beside it
function rwTunLand(T, i, sd, L, Lext, nat, natExt) {
  const t = T.rwTun && T.rwTun.of[i]; if (!t) return nat; const p = T.pts[i], top = p.y + t.top, crest = top + RWT.soil, k = (i - t.a) * 2 + (sd > 0 ? 0 : 1), L4 = t.Ho - 0.02;
  if (!t.done[k]) { t.done[k] = 1; const ne = natExt(), room = Math.max(0.5, Lext - L4 - 0.5), need = crest - ne, s = need > 0 ? need / room : 0, prev = k >= 2 && t.done[k - 2] ? t.ex[k - 2] : 0;
    t.ex[k] = t.under || s > (prev ? 0.8 : 1.1) ? 1 : 0; t.sl[k] = Math.max(0.55, s); }
  if (t.ex[k]) return L <= L4 - 0.01 ? Math.max(nat, top - 0.06) : nat;
  if (L <= L4 + 0.01) return Math.max(nat, crest);
  return Math.max(nat, crest - t.sl[k] * (L - L4));
}
// every grid triangle with any part over a tube (its walls and half a metre more) is cut out: the strip is the land there
function rwTunHoles(T, hole, x0, z0, cell, nx, nz) {
  const U = T.rwTun; if (!U) return; const P = T.pts;
  for (const t of U.list) for (let i = t.a; i < t.b; i++) for (let f = 0; f < 4; f++) { const A = P[i], B = P[i + 1], q = f / 4, cx = A.x + (B.x - A.x) * q, cz = A.z + (B.z - A.z) * q, h = A.h + wrapAngle(B.h - A.h) * q, lx = Math.cos(h), lz = -Math.sin(h);
    for (let u = -(t.Ho + 0.5); u <= t.Ho + 0.5 + 1e-6; u += 0.75) { const x = cx + lx * u, z = cz + lz * u; if (!stripCovers(T, x, z)) continue; const fx = (x - x0) / cell, fz = (z - z0) / cell; if (fx < 0 || fz < 0 || fx >= nx - 1 || fz >= nz - 1) continue;
      const gi = Math.floor(fx), gj = Math.floor(fz); hole[(gj * (nx - 1) + gi) * 2 + (fx - gi + fz - gj <= 1 ? 0 : 1)] = 1; } }
}
// the tube's walls as the cars meet them: from its entry face to its exit's, at the walkway's back, up to its roof
function rwTunBars(T, B) {
  const U = T.rwTun; if (!U) return; const P = T.pts;
  for (const t of U.list) for (let i = t.a; i <= t.b; i++) for (let s = 0; s < 2; s++) { const o = i * 2 + s; B.kind[o] = 2; B.L0[o] = t.Hi; B.L1[o] = t.Hi + 0.6; B.top[o] = P[i].y + t.crown; B.bot[o] = -1e4; }
}
// (at layStage: the portals' faces beside each mouth, solid for the cars; the tube's own width as rwTunPrep has it)
function rwTunBoxes(K) {
  const pts = K.pts, n = K.cN;
  for (let i = 1; i < n - 1; i++) { if (!pts[i].rwtu) continue; let j = i; while (j < n - 2 && pts[j + 1].rwtu) j++; if (j - i < 3) { i = j; continue; }
    const a = i - 1, b = j + 1; let wm = 0; for (let k = a; k <= b; k++) wm = Math.max(wm, pts[k].w); const Hi = wm / 2 + RWT.gut + RWT.walk;
    for (const [r, d] of [[a, STEP], [b, -STEP]]) { const p = pts[r], lx = Math.cos(p.h), lz = -Math.sin(p.h), fx = Math.sin(p.h), fz = Math.cos(p.h);
      for (const sd of [1, -1]) { const u0 = sd * (Hi + 0.1), u1 = sd * (Hi + 8), q = [p.x + lx * u0, p.z + lz * u0, p.x + lx * u1, p.z + lz * u1, p.x + lx * u1 + fx * d, p.z + lz * u1 + fz * d, p.x + lx * u0 + fx * d, p.z + lz * u0 + fz * d];
        K.boxes.push({ i: r, q: Float64Array.from(q), top: 1e4, bot: -1e4, kind: 'wall', rw: 1 }); } }
    i = j; }
}
// The tubes drawn: inside, the gutters, kerbs and walkways, the tiled lower walls under a dark band, the concrete above
// and the vault or the box's roof, lit as its lamps light it (its own light, the same by day and night; daylight near
// its mouths), the lamps in two lines along its roof, jet fans in pairs under the roof of a long one, its emergency
// signs; outside, the portals and, where it stands out of the land, the box's walls and roof
function rwTunnels(ctx, H) {
  const { T, G } = ctx, U = T.rwTun, P = T.pts, S = T.side; if (!U || !S) return 0;
  const C = S.C, mk = () => ({ pos: [], col: [], idx: [] }), IN = mk(), EX = mk(), LM = mk();
  const hex = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255], mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const GUT = hex(0x4a4946), KERB = hex(0xd8d4c8), WALK = hex(0x8a8780), PAN = hex(0xcac7bd), BAND = hex(0x2a3542), UPR = hex(0x5c5a55), ROOF = hex(0x403e3b), CONC = hex(0xb4b0a7), COPE = hex(0x97938b), FANB = hex(0x8c8c88), FANE = hex(0x2a2a2a), LAMP = hex(0xfff0cf), SIGN = hex(0x1fa957), WHT = hex(0xf2f2ee), SOS = hex(0xe8742a);
  const V = (M, x, y, z, c) => { M.pos.push(x, y, z); M.col.push(c[0], c[1], c[2]); return M.pos.length / 3 - 1; }, Q = (M, a, b, c, d) => M.idx.push(a, b, c, a, c, d);
  const at = (p, u, y) => [p.x + Math.cos(p.h) * u, y, p.z - Math.sin(p.h) * u];
  // (a strip's land at road point i, side sd (1 left), L m out from the middle: its columns joined straight)
  const landAt = (i, sd, L) => { const o = (i * 2 + (sd > 0 ? 0 : 1)) * C, u = S.u, y = S.y; if (L <= u[o]) return y[o]; for (let c = 1; c < C; c++) if (L <= u[o + c]) { const f = (L - u[o + c - 1]) / Math.max(1e-6, u[o + c] - u[o + c - 1]); return y[o + c - 1] + (y[o + c] - y[o + c - 1]) * f; } return y[o + C - 1]; };
  const reachOf = (i, sd) => S.u[(i * 2 + (sd > 0 ? 0 : 1)) * C + C - 1];
  let n = 0;
  for (const t of U.list) {
    // ---- inside: one ring of points per road point, from the left road edge up over the roof and down to the right ----
    const ring = i => { const p = P[i], hw = p.w / 2, y0 = p.y, d = Math.min(i - t.a, t.b - i) * STEP, lit = 0.5 * (1 + 0.6 * Math.max(0, 1 - d / 24)) * ((i - t.a) % 2 ? 0.93 : 1.07), uk = t.Hi - RWT.walk; // (its own light, a pool under each lamp; daylight near its mouths)
      const side = (sd, e) => { const q = [[hw - 0.02, e + 0.004, GUT], [uk, e + 0.004, GUT], [uk, e + 0.004, KERB], [uk, e + RWT.kerb, KERB], [uk, e + RWT.kerb, WALK], [t.Hi, e + RWT.kerb, WALK], [t.Hi, e + RWT.kerb, PAN], [t.Hi, y0 + 2.25, PAN], [t.Hi, y0 + 2.25, BAND], [t.Hi, y0 + 2.4, BAND], [t.Hi, y0 + 2.4, UPR], [t.Hi, y0 + t.wallH, UPR]];
        if (t.arch) for (let k = 1; k <= 7; k++) { const th = k / 7 * Math.PI / 2; q.push([t.Hi * Math.cos(th), y0 + t.wallH + (t.crown - t.wallH) * Math.sin(th), k < 2 ? UPR : ROOF]); }
        else q.push([t.Hi - 0.5, y0 + t.crown, ROOF], [t.Hi * 0.5, y0 + t.crown, ROOF], [0, y0 + t.crown, ROOF]);
        return q.map(r => [sd * r[0], r[1], r[2]]); };
      const L = side(1, p.eL), R = side(-1, p.eR).reverse(); return L.concat(R.slice(1)).map(r => [r[0], r[1], mul(r[2], lit * (r[1] > y0 + 2.45 ? 0.82 + 0.06 * hash2(i, 3, 71) : 0.97 + 0.06 * hash2(i, 5, 73)))]); };
    let prev = null;
    for (let i = t.a; i <= t.b; i++) { const p = P[i], R = ring(i), vs = R.map(r => { const [x, y, z] = at(p, r[0], r[1]); return V(IN, x, y, z, r[2]); });
      if (prev) for (let k = 0; k + 1 < vs.length; k++) Q(IN, prev[k], vs[k], vs[k + 1], prev[k + 1]); prev = vs; }
    // ---- the joints between its wall panels, every 4 m down the tiled lower wall ----
    for (let i = t.a + 2; i < t.b - 1; i += 2) { const p = P[i], fx = Math.sin(p.h), fz = Math.cos(p.h), jc = mul(BAND, 0.8);
      for (const sd of [1, -1]) { const e = sd > 0 ? p.eL : p.eR, [cx, , cz] = at(p, sd * (t.Hi - 0.012), 0), v = []; for (const [df, y] of [[-0.03, e + RWT.kerb], [0.03, e + RWT.kerb], [0.03, p.y + 2.25], [-0.03, p.y + 2.25]]) v.push(V(IN, cx + fx * df, y, cz + fz * df, jc)); Q(IN, v[0], v[1], v[2], v[3]); } }
    // ---- its lamps: two lines of fittings along the roof, 1.6 m long every 4 m ----
    const lampAt = sd => t.arch ? (() => { const th = 0.42, u = t.Hi * Math.cos(th) - 0.1, y = t.wallH + (t.crown - t.wallH) * Math.sin(th) - 0.06, du = -t.Hi * Math.sin(th), dy = (t.crown - t.wallH) * Math.cos(th), l = Math.hypot(du, dy); return [sd * u, y, sd * du / l, dy / l]; })() : [sd * t.Hi * 0.5, t.crown - 0.05, sd, 0];
    for (let i = t.a + 1; i < t.b; i += 2) { const p = P[i], fx = Math.sin(p.h), fz = Math.cos(p.h);
      for (const sd of [1, -1]) { const [u, y, tu, ty] = lampAt(sd), [cx, cy, cz] = at(p, u, p.y + y), w = 0.16, lx = Math.cos(p.h), lz = -Math.sin(p.h);
        const c = [], o = [[-0.8, -w], [0.8, -w], [0.8, w], [-0.8, w]]; for (const [df, dw] of o) c.push(V(LM, cx + fx * df + lx * tu * dw, cy + ty * dw, cz + fz * df + lz * tu * dw, LAMP)); Q(LM, c[0], c[1], c[2], c[3]); } }
    // ---- jet fans in pairs under the roof of a long tube, every 160 m ----
    if (t.len >= 260) for (let s = 70; s < t.len - 50; s += 160) { const i = t.a + Math.round(s / STEP), p = P[i], fx = Math.sin(p.h), fz = Math.cos(p.h), lx = Math.cos(p.h), lz = -Math.sin(p.h), yc = p.y + t.crown - (t.arch ? 1.05 : 0.8);
      for (const u of [-1.45, 1.45]) { const cx = p.x + lx * u, cz = p.z + lz * u, r = 0.55, ring2 = [];
        for (const df of [-1.8, 1.8]) { const rr = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; rr.push(V(IN, cx + fx * df + lx * Math.cos(a) * r, yc + Math.sin(a) * r, cz + fz * df + lz * Math.cos(a) * r, mul(FANB, 0.75 + 0.2 * Math.max(0, Math.sin(a))))); } ring2.push(rr); }
        for (let k = 0; k < 10; k++) Q(IN, ring2[0][k], ring2[1][k], ring2[1][(k + 1) % 10], ring2[0][(k + 1) % 10]);
        for (const [e, df] of [[0, -1.8], [1, 1.8]]) { const cc = V(IN, cx + fx * df, yc, cz + fz * df, FANE); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, b2 = (k + 1) / 10 * Math.PI * 2, v1 = V(IN, cx + fx * df + lx * Math.cos(a) * r * 0.97, yc + Math.sin(a) * r * 0.97, cz + fz * df + lz * Math.cos(a) * r * 0.97, FANE), v2 = V(IN, cx + fx * df + lx * Math.cos(b2) * r * 0.97, yc + Math.sin(b2) * r * 0.97, cz + fz * df + lz * Math.cos(b2) * r * 0.97, FANE); IN.idx.push(cc, v1, v2); } }
        for (const df of [-1.1, 1.1]) { const v = []; for (const [dl, dy] of [[-0.04, 0.5], [0.04, 0.5], [0.04, 1.4], [-0.04, 1.4]]) v.push(V(IN, cx + fx * df + lx * dl, yc + dy, cz + fz * df + lz * dl, FANE)); Q(IN, v[0], v[1], v[2], v[3]); } } }
    // ---- its emergency signs: a green exit sign over the right walkway every 150 m, an SOS panel on the left between ----
    for (let s = 40; s < t.len - 20; s += 75) { const i = t.a + Math.round(s / STEP), p = P[i], fx = Math.sin(p.h), fz = Math.cos(p.h), sos = Math.round(s / 75) % 2 === 1, sd = sos ? 1 : -1, u = sd * (t.Hi - 0.03);
      const box = (y0, y1, w, c) => { const [cx, , cz] = at(p, u, 0), v = []; for (const [df, y] of [[-w, y0], [w, y0], [w, y1], [-w, y1]]) v.push(V(LM, cx + fx * df, p.y + y, cz + fz * df, c)); Q(LM, v[0], v[1], v[2], v[3]); };
      if (sos) { box(1.0, 1.9, 0.45, SOS); box(1.55, 1.8, 0.3, WHT); } else { box(2.5, 2.95, 0.55, SIGN); box(2.62, 2.83, 0.16, WHT); } }
    // ---- outside: where the box stands out of the land, its outer walls (with a parapet) and its roof ----
    const exAt = (i, s) => (i >= t.s0 && i <= t.s1) ? t.ex[(i - t.a) * 2 + s] : 0;
    for (let i = t.s0; i < t.s1; i++) { const A = P[i], B = P[i + 1], eL = exAt(i, 0) || exAt(i + 1, 0), eR = exAt(i, 1) || exAt(i + 1, 1); if (!eL && !eR) continue;
      const shade = 0.92 + 0.12 * hash2(i >> 2, 7, 79), cc = mul(CONC, shade);
      { const a0 = at(A, -t.Ho, A.y + t.top), a1 = at(A, t.Ho, A.y + t.top), b0 = at(B, -t.Ho, B.y + t.top), b1 = at(B, t.Ho, B.y + t.top); Q(EX, V(EX, ...a0, cc), V(EX, ...b0, cc), V(EX, ...b1, cc), V(EX, ...a1, cc)); }
      for (const [sd, e] of [[1, eL], [-1, eR]]) { if (!e) continue; const ya = landAt(i, sd, t.Ho + 0.8), yb = landAt(i + 1, sd, t.Ho + 0.8), u = sd * t.Ho, ui = sd * (t.Ho - 0.25);
        Q(EX, V(EX, ...at(A, u, Math.min(ya, A.y) - 0.6), cc), V(EX, ...at(B, u, Math.min(yb, B.y) - 0.6), cc), V(EX, ...at(B, u, B.y + t.top + 0.35), cc), V(EX, ...at(A, u, A.y + t.top + 0.35), cc));
        Q(EX, V(EX, ...at(A, ui, A.y + t.top), cc), V(EX, ...at(B, ui, B.y + t.top), cc), V(EX, ...at(B, ui, B.y + t.top + 0.35), cc), V(EX, ...at(A, ui, A.y + t.top + 0.35), cc));
        Q(EX, V(EX, ...at(A, ui, A.y + t.top + 0.35), COPE), V(EX, ...at(B, ui, B.y + t.top + 0.35), COPE), V(EX, ...at(B, u, B.y + t.top + 0.35), COPE), V(EX, ...at(A, u, A.y + t.top + 0.35), COPE)); } }
    // ---- the portals: a face across the cutting at each mouth, from the opening out to where the land over the tube
    // meets the cutting's, its top following the land over the tube; a coping along its top; its top and back ----
    for (const [r0, r1] of [[t.a, t.a + 1], [t.b, t.b - 1]]) { const p0 = P[r0], p1 = P[r1], y0 = p0.y;
      // (out as far as the land over the tube stands well over the cutting's - a steeper step than a hillside makes in a
      // road point's 2 m - and no more than 9 m past the tube: its wing walls)
      const reach = sd => { const Lmax = Math.min(reachOf(r0, sd), reachOf(r1, sd), t.Ho + 9) - 0.3; let L = t.Ho + 1.5; for (; L < Lmax; L += 0.5) if (landAt(r1, sd, L) - landAt(r0, sd, L) < 1.0) break; return Math.max(t.Ho + 0.6, Math.min(Lmax, L + 0.8)); };
      const RL = reach(1), RR = reach(-1);
      const open = u => { const a = Math.abs(u); if (a >= t.Hi) return null; if (t.arch) { const c = a / t.Hi; return y0 + t.wallH + (t.crown - t.wallH) * Math.sqrt(Math.max(0, 1 - c * c)); } return a > t.Hi - 0.5 ? y0 + t.wallH + (t.crown - t.wallH) * (t.Hi - a) / 0.5 : y0 + t.crown; };
      const us = []; for (let k = 0; k <= 28; k++) us.push(-t.Hi * 0.999 + 2 * t.Hi * 0.999 * k / 28); us.push(-t.Hi - 0.002, t.Hi + 0.002);
      for (let L = t.Hi + 0.6; L < RL; L += 0.9) us.push(L); us.push(RL); for (let L = t.Hi + 0.6; L < RR; L += 0.9) us.push(-L); us.push(-RR); us.sort((x, y) => x - y);
      const top = u => { const sd = u >= 0 ? 1 : -1, L = Math.abs(u); return Math.max(landAt(r1, sd, L), landAt(r0, sd, L) + 0.4, L < t.Ho + 0.4 ? y0 + t.top + 0.3 : -1e9) + 0.35; };
      const bot = u => { const o = open(u); if (o !== null) return o; const sd = u >= 0 ? 1 : -1; return Math.min(landAt(r0, sd, Math.abs(u)), sd > 0 ? p0.eL : p0.eR) - 0.5; };
      const backBot = u => landAt(r1, u >= 0 ? 1 : -1, Math.abs(u)) - 0.3;
      const tops = us.map(top), shade = 0.95 + 0.08 * hash2(r0, 11, 83), cc = mul(CONC, shade), cp = mul(COPE, shade);
      const F = us.map((u, k) => [V(EX, ...at(p0, u, bot(u)), cc), V(EX, ...at(p0, u, tops[k] - 0.4), cc), V(EX, ...at(p0, u, tops[k] - 0.4), cp), V(EX, ...at(p0, u, tops[k]), cp)]);
      const Bk = us.map((u, k) => [V(EX, ...at(p1, u, Math.min(backBot(u), tops[k] - 0.05)), cc), V(EX, ...at(p1, u, tops[k]), cp)]);
      const Tf = us.map((u, k) => V(EX, ...at(p0, u, tops[k]), cp)), Tb = us.map((u, k) => V(EX, ...at(p1, u, tops[k]), cp));
      for (let k = 0; k + 1 < us.length; k++) { Q(EX, F[k][0], F[k + 1][0], F[k + 1][1], F[k][1]); Q(EX, F[k][2], F[k + 1][2], F[k + 1][3], F[k][3]); Q(EX, Bk[k][0], Bk[k + 1][0], Bk[k + 1][1], Bk[k][1]); Q(EX, Tf[k], Tf[k + 1], Tb[k + 1], Tb[k]); }
      for (const k of [0, us.length - 1]) { const u = us[k]; Q(EX, V(EX, ...at(p0, u, bot(u)), cc), V(EX, ...at(p1, u, Math.min(backBot(u), tops[k] - 0.05)), cc), V(EX, ...at(p1, u, tops[k]), cc), V(EX, ...at(p0, u, tops[k]), cc)); } }
    n++; }
  const mesh = (M, mat, sh) => { if (!M.idx.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(M.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(M.col, 3)); g.setIndex(M.idx); g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.castShadow = !!sh; m.receiveShadow = sh === 2; m.userData.rw = 'tunnel'; G.add(m); };
  mesh(IN, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 1);
  mesh(LM, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }), 0);
  mesh(EX, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 2);
  return n;
}
