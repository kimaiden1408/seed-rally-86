// ==== ROUND 46: REAL ROADS (what the map has round the road, drawn) ====
// The land's look where the map says what it is: woods' floor under the woods, the fields' crops in farmland (the country's
// own fields, laid out over it as they are by any road), bare rock, scree, sand, the paving of a town's yards and car
// parks; and what grows where: trees in the woods as thick as woods are, scattered in scrub, parks and gardens, none on
// the fields, the meadows, the water or the paving (the map's own lone trees and rows of trees are planted where it has
// them). Where the map says nothing (past the land it was fetched for), the country as the game makes it.
const RWLC_NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1]; // (nothing grows: works, paved, water, ice, quarry)
function rwCover(T, base, far) { const rt = rwPrep(T.real); return (x, z) => { const c = rwLcAt(rt, x, z); if (!c) return base(x, z); setLook(T, x, z, far); const v = RWLC_TC[c]; return v >= 0 ? v : RWLC_NONE[c] ? -3 : -2; }; }
function rwLandColFn(T, E, L) {
  const rt = rwPrep(T.real), C = c => new THREE.Color(c), fc = new THREE.Color();
  const K = { scrub: C('#6c6a40'), heath: C('#7d6c55'), orchard: C('#667840'), vineyard: C('#8a7b58'), town: C('#8e8b84'), works: C('#88857f'), paved: C('#7a7976'), wet: C('#58614a'), sand: C('#cbbb90'), ice: C('#e8edf1'), yard: C('#8b8676'), quarry: C('#a39b8c'), water: C('#5f6a62') };
  const TK = { town: 0.4, works: 0.7, paved: 0.85, yard: 0.6, quarry: 0.8, sand: 0.8, ice: 0.9, water: 0.7, wet: 0.5, scrub: 0.45, heath: 0.5, orchard: 0.35, vineyard: 0.5 };
  return (out, x, z, steep, y, n) => {
    const c = rwLcAt(rt, x, z); if (!c) return false; const k = RWLC[c];
    out.copy(L.gcol[0]).lerp(L.gcol[1], clamp(n * 1.6 - 0.3, 0, 1)).lerp(L.gcol[2], clamp(fbm(x / 13, z / 13, T.nseed + 4) * 1.5 - 0.8, 0, 1)); lkSet(0, 0, 0, 0);
    if (k === 'forest') { out.lerp(L.floorC, 0.55); lkSet(1, 0.1, 0, 0); }
    else if (k === 'farm') { const f = L.FP ? L.FP.at(x, z) : null; if (f) { fc.copy(f.crop.col).multiplyScalar(0.9 + 0.2 * f.h); out.lerp(fc, 0.78); const ck = CROP_K[f.crop.k]; if (ck) lkSet(ck[0] * 0.8, ck[1] * 0.8, ck[2] * 0.8, ck[3]); } }
    else if (k === 'rock') { out.lerp(L.roc, 0.8); lkSet(0, 0.2, 0.8, 0); }
    else if (K[k]) { out.lerp(K[k], TK[k] || 0.5); lkSet(k === 'scrub' || k === 'heath' || k === 'orchard' ? 0.4 : 0, k === 'sand' || k === 'quarry' || k === 'vineyard' ? 0.6 : 0.25, k === 'paved' || k === 'works' || k === 'quarry' || k === 'yard' ? 0.6 : 0.15, 0); }
    const face = smooth(0.42, 0.85, steep), rf = E.rockFrom || 0.85; if (face > 0) { out.lerp(L.cuc, face * 0.85); out.lerp(L.roc, smooth(rf, rf + 0.45, steep) * (0.45 + 0.55 * n)); GK4[1] += face * 0.85 * (1 - GK4[1]); }
    if (L.snowLand && y != null) { const sc = snowCover(T, x, y, z) * (1 - 0.7 * smooth(0.7, 1.2, steep)); if (sc > 0) out.lerp(n > 0.5 ? L.SNC : L.SNS, Math.min(1, sc * 1.15)); }
    if (L.patchy) { const mc = fbm(x / 23, z / 23, T.nseed + 61) - 0.5; out.multiplyScalar(1 + mc * 0.36); if (mc < 0) { out.r *= 1 + mc * 0.16; out.b *= 1 + mc * 0.12; } }
    return true;
  };
}
// The country's fields where the map has farmland (and meadows: a pasture's fields), none elsewhere
function rwFields(T, plan) { const rt = rwPrep(T.real), farm = rwLcId('farm'), grass = rwLcId('grass'), keep0 = plan.keep, open0 = plan.open;
  plan.keep = f => { const [x, z] = plan.toWorld((f.u0 + f.u1) / 2, (f.v0 + f.v1) / 2), c = rwLcAt(rt, x, z); return c ? c === farm || c === grass : keep0(f); };
  plan.open = (x, z) => { const c = rwLcAt(rt, x, z); return c ? c === farm || c === grass : open0(x, z); }; return plan; }
// ---- a real road's paint ----
// As its class and lanes have it: white edge lines at the edges of its lanes (inside the shoulders a motorway has) where
// the country paints its edges, or on any main road (a motorway, a trunk or a primary road, painted everywhere); between
// lanes going the same way a broken line, 3 m painted and 9 m gap; on a two-way road of two lanes or more the centre
// line as the country paints it (a main road's broken where the country paints none), and on one of four lanes or more
// the lanes either side of it divided as well. A road of one lane has no line along its middle. (add: buildStage's own
// line maker, its lateral given row by row - null where a line stops)
function rwPaint(T, P, LN, add) {
  const main = p => p.rwhw === 'motorway' || p.rwhw === 'trunk' || p.rwhw === 'primary', lw = r => { const p = P[r.i0]; return Math.max(2, Math.min(p.rwlw || r.w, r.w)); };
  const edgeIn = (p, r) => (p.rwlw || r.w) < r.w - 0.6 ? 0.12 : 0.3;
  for (const sd of [-1, 1]) add(r => { const p = P[r.i0]; if (!(LN && LN.edge) && !main(p)) return null; const W = lw(r); if (W < 4.4 && !main(p)) return null; return sd * (W / 2 - edgeIn(p, r)); }, 0.12, false, 3.0);
  // (the centre line of a two-way road)
  add(r => { const p = P[r.i0]; if (p.rwone || (p.rwln || 2) < 2 || r.w < 5.0) return null; if (!(LN && LN.centre) && !main(p)) return null; return 0; }, 0.12, LN && LN.centre ? LN.centre === 'dash' : true, 3.0);
  // (the broken lines between lanes going the same way: on a one-way road, between all its lanes; on a two-way one of four
  // lanes or more, within each half)
  for (let k = 1; k < 8; k++) add(r => { const p = P[r.i0], n = p.rwln || 1, W = lw(r);
    if (p.rwone) return n >= 2 && k < n ? -W / 2 + W * k / n : null;
    const h = Math.floor(n / 2); if (h < 2) return null; const per = W / 2 / h; if (k < h) return W / 2 - per * k; if (k > h && k < 2 * h) return -(W / 2 - per * (k - h)); return null; }, 0.12, true, 3.0);
}
// ---- the map's buildings ----
// Each as the map draws it: its footprint's walls straight up from the lowest ground under it (the uphill side's ground
// against them), as tall as its own height or levels say (2.9 m a storey), windows along every storey at the spacing
// such houses have, a door on the side toward the road; its roof as the map gives it - flat, gabled, hipped, a pyramid -
// over a footprint four-cornered and near enough square at the corners, else flat (or, tagged pitched, a low pitch over
// its outline). Walls and roofs in the country's materials (its houses' render, stone or boards, its tiles or slates),
// the map's own colours where it has them; a barn, a shed, a garage or a works in theirs.
// The map's buildings are baked as the game's houses are (the house atlas's walls and roofs, or plain colours on the
// lowest settings), but their windows are drawn by the wall's own shader rather than built: each wall carries where on it
// each point is, in bays along it (one window a bay, about 2.6 m) and storeys up it (2.9 m) from its foot, and the shader
// sets a window in the middle of each bay of each storey - two triangles a wall however many windows it has, where a
// tower block's windows built one by one ran to thousands. Far off, where a bay is a few pixels, its window and wall
// blend to their mix, so the rows do not shimmer.
const RW_WIN_GLSL = `
  if (vWn.z > 0.5 && vWn.y >= 0.0 && vWn.y < vWn.z) { vec2 f = fract(vWn.xy), fw = fwidth(vWn.xy);
    float ax = smoothstep(0.32 - fw.x, 0.32 + fw.x, f.x) * (1.0 - smoothstep(0.68 - fw.x, 0.68 + fw.x, f.x));
    float ay = smoothstep(0.33 - fw.y, 0.33 + fw.y, f.y) * (1.0 - smoothstep(0.72 - fw.y, 0.72 + fw.y, f.y));
    float far = smoothstep(0.18, 0.45, max(fw.x, fw.y)), win = mix(ax * ay, 0.13, far);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.105, 0.12, 0.14), win * 0.92); }`;
function rwWinMat(base) { const m = base.clone(); m.extensions = Object.assign({}, base.extensions || {}, { derivatives: true }); const ob = base.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { if (ob) ob.call(m, sh, r); sh.vertexShader = 'attribute vec3 aWn;\nvarying vec3 vWn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWn = aWn;');
    sh.fragmentShader = 'varying vec3 vWn;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>' + RW_WIN_GLSL); };
  const key = base.customProgramCacheKey ? base.customProgramCacheKey() : 'plain'; m.customProgramCacheKey = () => key + '-rwwin'; return m; }
// (a baker that keeps each corner's place on its wall: wn(p) gives it, or none for a face with no windows)
function rwWinBaker(atlas) {
  const Base = atlas ? AtlasBaker : Baker, B = atlas ? new AtlasBaker(atlas) : new Baker(); B.wn = null;
  // (in squares of 400 m, not the bakers' 200: a town's buildings are many to a square, and each square is a draw)
  B.cell = function (x, z) { const k = Math.floor(x / 400) + ',' + Math.floor(z / 400); let c = this.cells.get(k); if (!c) this.cells.set(k, c = { p: [], c: [], t: [] }); return c; };
  const tri0 = Base.prototype.tri; B.tri = function (a, b, c, col, n, C, ta, tb, tc) { C = C || this.cell(a[0], a[2]); if (!C.w) C.w = []; const n0 = C.p.length;
    tri0.call(this, a, b, c, col, n, C, ta, tb, tc); const added = (C.p.length - n0) / 9; if (!added) return;
    // (tri may have swapped b and c to face n: the corners as stored)
    for (let q = 0; q < 3; q++) { const o = n0 + q * 3, w = this.wn ? this.wn(C.p[o], C.p[o + 1], C.p[o + 2]) : null; if (w) C.w.push(w[0], w[1], w[2]); else C.w.push(0, 0, 0); } };
  B.build = function (G, chunks, cast) { const tris = Base.prototype.build.call(this, G, chunks, cast); let mat = null;
    for (const c of this.cells.values()) { if (!c.geo) continue; c.geo.setAttribute('aWn', new THREE.Float32BufferAttribute(c.w || new Array(c.p.length).fill(0), 3)); }
    G.children.forEach(m => { if (!m.isMesh || !m.geometry || !m.geometry.attributes.aWn || m.userData.rwWin) return; m.userData.rwWin = 1; m.userData.rw = 'bld'; m.material = mat || (mat = rwWinMat(m.material)); });
    return tris; };
  return B;
}
function rwBuildings(ctx, H) {
  const { T, E, gY, snowy } = ctx, C = T.real, atlas = typeof AtlasBaker !== 'undefined' && H.BH() instanceof AtlasBaker, Bk = rwWinBaker(atlas ? houseAtlas() : null), use = k => atlas ? Bk.use(k) : Bk;
  const sty0 = (E.houses && E.houses.style) || 'stone', sty = sty0 === 'rondavel' ? 'adobe' : sty0 === 'chapel' ? 'white' : sty0, base = HOUSE_STYLE[sty] || HOUSE_STYLE.stone, cells = HOUSE_CELLS[sty] || ['plaster', 'slate'];
  const col = h => new THREE.Color(h), dark = col('#2a2e33'), door = col('#4a3a2e'), flatC = col('#77766f');
  const P = T.pts, nearPt = (x, z) => { const r = T.fieldAt(x, z); return r && r.np ? r.np : null; };
  let n = 0, tris0 = 0;
  for (const b of C.bld) {
    const X = b.x, Z = b.z, m = X.length; if (m < 3) continue;
    let y0 = 1e9, y1 = -1e9; for (let k = 0; k < m; k++) { const y = gY(X[k], Z[k]); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } { const y = gY(b.cx, b.cz); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (!(y0 > -1e8)) continue;
    const R = mulberry32(strHash('bld:' + Math.round(b.cx * 10) + ':' + Math.round(b.cz * 10)));
    // (its materials: the country's for a house; a farm's barn, a shed, a garage, a works in their own)
    let wallK, roofK, wallC, roofC;
    const light = () => (wallC.r + wallC.g + wallC.b) / 3 > 0.62;
    if (b.k === 9 || b.k === 10 && b.a > 900) { wallC = col(b.col ? '#' + b.col : pickW([['#b8b9b4', 0.5], ['#9aa0a4', 0.3], ['#c9c2b0', 0.2]], R)); wallK = HA[R() < 0.5 ? 'corr' : 'seam']; roofK = HA.seam; roofC = col(b.rcol ? '#' + b.rcol : '#8a8e90'); }
    else if (b.k === 5) { wallC = col(b.col ? '#' + b.col : pickW([['#8a2c22', 0.3], ['#9a8c74', 0.4], ['#7a6a58', 0.3]], R)); wallK = HA.boardsV; roofK = HA.corr; roofC = col(b.rcol ? '#' + b.rcol : '#8e9294'); }
    else if (b.k === 6 || b.k === 7 || b.k === 8) { wallC = col(b.col ? '#' + b.col : pickW([['#a89c88', 0.4], ['#8a7a64', 0.3], ['#c8c4b8', 0.3]], R)); wallK = HA[R() < 0.5 ? 'boardsV' : 'plaster']; roofK = HA.corr; roofC = col(b.rcol ? '#' + b.rcol : '#80847e'); }
    else if (b.k === 4) { wallC = col(b.col ? '#' + b.col : '#cdc6b6'); wallK = HA.ashlar; roofK = HA.slate; roofC = col(b.rcol ? '#' + b.rcol : (base.roof ? base.roof[0] : '#4a4e54')); }
    else { wallC = col(b.col ? '#' + b.col : pickW(base.walls, R)).multiplyScalar(0.92 + 0.12 * R()); const lk = Array.isArray(cells[0]) ? cells[0][light() ? 0 : 1] : cells[0]; wallK = HA[lk]; roofK = HA[cells[1]]; roofC = col(b.rcol ? '#' + b.rcol : base.roof ? base.roof[Math.floor(R() * base.roof.length)] : '#888').multiplyScalar(0.9 + 0.15 * R()); }
    if (b.mat === 1) wallK = HA.rubble; else if (b.mat === 2) wallK = HA.ashlar; else if (b.mat === 3) wallK = HA.boardsH; else if (b.mat === 5) wallK = HA.seam;
    if (b.rm === 2) roofK = HA.slate; else if (b.rm === 3) roofK = HA.seam; else if (b.rm === 4) roofK = HA.thatch; else if (b.rm === 1) roofK = HA.flat;
    const snowRoof = snowy && snowy(b.cx, y1, b.cz) > 0.4; if (snowRoof) roofC = col('#eef2f6');
    const canopy = b.k === 8 && b.h < 4, wallTop = y0 + Math.max(canopy ? 2.4 : 2.3, b.h - b.rh) + (y1 - y0) * 0.6, yb = y0 - 0.5;
    // (its walls: each edge's face looking away from its middle)
    let ccx = 0, ccz = 0; for (let k = 0; k < m; k++) { ccx += X[k]; ccz += Z[k]; } ccx /= m; ccz /= m;
    const np = nearPt(b.cx, b.cz); let doorK = -1, doorD = 1e9;
    for (let k = 0; k < m; k++) { const k2 = (k + 1) % m, ax = X[k], az = Z[k], bx = X[k2], bz = Z[k2], ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez); if (L < 0.3) continue; let nx = ez / L, nz = -ex / L;
      if (nx * ((ax + bx) / 2 - ccx) + nz * ((az + bz) / 2 - ccz) < 0) { nx = -nx; nz = -nz; }
      // (its windows: along each storey, every 2.6 m or so, set in from the corners - drawn by the wall's shader: see rwWinBaker)
      const plainW = canopy || b.k === 9 && R() < 0.6 || b.k === 6 || b.k === 7, lv = Math.max(1, Math.min(Math.round(b.lv || 2), Math.floor((wallTop - y1 - 0.6) / 2.9) + 1)), nw = Math.floor((L - 1.4) / 2.6);
      Bk.wn = plainW || nw < 1 ? null : (x, y, z) => [clamp(((x - ax) * ex + (z - az) * ez) / (L * L), 0, 1) * nw, (y - y1) / 2.9, lv];
      if (!canopy) use(wallK).quad([ax, yb, az], [bx, yb, bz], [bx, wallTop, bz], [ax, wallTop, az], wallC, [nx, 0, nz]);
      Bk.wn = null;
      if (np) { const d = Math.hypot((ax + bx) / 2 - np.x, (az + bz) / 2 - np.z); if (d < doorD && L > 2.4) { doorD = d; doorK = k; } }
    }
    // (its door: on the side nearest the road, at the ground there)
    if (doorK >= 0 && !canopy && b.k !== 9) { const k = doorK, k2 = (k + 1) % m, ax = X[k], az = Z[k], ex = X[k2] - ax, ez = Z[k2] - az, L = Math.hypot(ex, ez), nw = Math.max(1, Math.floor((L - 1.4) / 2.6)), u = (Math.floor(nw / 2) + 0.5) / nw;
      let nx = ez / L, nz = -ex / L; if (nx * (ax + ex * 0.5 - ccx) + nz * (az + ez * 0.5 - ccz) < 0) { nx = -nx; nz = -nz; }
      const cx = ax + ex * u + nx * 0.04, cz = az + ez * u + nz * 0.04, gy = gY(cx + nx * 0.6, cz + nz * 0.6), hx = ex / L * 0.5, hz = ez / L * 0.5, a = [cx - hx, gy, cz - hz], bb = [cx + hx, gy, cz + hz], c2 = [cx + hx, gy + 2.05, cz + hz], d2 = [cx - hx, gy + 2.05, cz - hz];
      if (atlas) { use(HA.door); Bk.tri(a, bb, c2, door, [nx, 0, nz], null, HA_Q[0], HA_Q[1], HA_Q[2]); Bk.tri(a, c2, d2, door, [nx, 0, nz], null, HA_Q[0], HA_Q[2], HA_Q[3]); } else Bk.quad(a, bb, c2, d2, door, [nx, 0, nz]); }
    // (its roof)
    let rect = null; if (m === 4) { const e = k => [X[(k + 1) % 4] - X[k], Z[(k + 1) % 4] - Z[k]], ok = [0, 1, 2, 3].every(k => { const a = e(k), c = e((k + 1) % 4); return Math.abs(a[0] * c[0] + a[1] * c[1]) < 0.26 * Math.hypot(a[0], a[1]) * Math.hypot(c[0], c[1]); });
      if (ok) { const a = e(0), c = e(1), La = Math.hypot(a[0], a[1]), Lc = Math.hypot(c[0], c[1]), longA = La >= Lc, v = longA ? a : c; rect = { w: Math.min(La, Lc), d: Math.max(La, Lc), ry: Math.atan2(v[0], v[1]) }; } }
    if (b.rf > 0 && rect && b.rh > 0.3 && !canopy) { const rh = Math.min(b.rh, rect.w * 0.7);
      if (b.rf === 2 || b.rf === 3) use(roofK).hip(ccx, wallTop, ccz, rect.w, b.rf === 3 ? rect.w : rect.d, rh, rect.ry, roofC, 0.35);
      else { use(roofK); Bk.gable(ccx, wallTop, ccz, rect.w, rect.d, rh, rect.ry, roofC, wallC, 0.4); } }
    else { // (flat, over the outline as it is; a pitched roof the map has over a shape no simple roof fits, as a low slope up from its edges)
      const pitch = b.rf > 0 && !canopy ? Math.min(2.2, b.rh * 0.6) : 0, cv = [], ix = []; for (let k = 0; k < m; k++) cv.push(new THREE.Vector2(X[k], Z[k]));
      let tr = []; try { tr = THREE.ShapeUtils.triangulateShape(cv, []); } catch (e) { tr = []; }
      const top = wallTop + (canopy ? 0.15 : 0.02), rc = pitch ? roofC : b.k === 9 || b.k === 10 || b.k === 3 || b.k === 11 ? flatC : roofC;
      use(pitch ? roofK : HA.plaster); for (const [a, bq, c] of tr) Bk.tri([X[a], top, Z[a]], [X[bq], top, Z[bq]], [X[c], top, Z[c]], rc, [0, 1, 0]);
    }
    if (canopy) for (let k = 0; k < m; k += 2) { use(HA.plaster); Bk.cyl(X[k] + (ccx - X[k]) * 0.08, y0, Z[k] + (ccz - Z[k]) * 0.08, 0.08, wallTop - y0, 6, col('#9a9a96')); }
    H.keep.add(b.cx, b.cz, { x: b.cx, z: b.cz, r: Math.sqrt(b.a) * 0.62 + 1 }); n++;
  }
  Bk.build(ctx.G, stageChunks, true); // (its own baker: built here, as buildProps builds its own)
  return n;
}
// ---- the map's walls, fences, hedges, rows of trees, lone trees, lamps, poles and their wires ----
function rwLines(ctx, H) {
  const { T, E, A, gY, snowy } = ctx, C = T.real, F = E.flora, st = { walls: 0, fences: 0, hedges: 0, trees: 0, lamps: 0, poles: 0 };
  // (clear of the road, and of a tunnel's tube: nothing of the map's stands in it unless the hill over it is well above)
  const clear = (x, z, r) => { const g = T.fieldAt(x, z); if (g && g.np && g.nd < g.np.w / 2 + (r || 1.2)) return false; return !rwInTube(C, x, z, gY(x, z), (r || 1.2) + 2.5); };
  // (a line cut into its runs clear of the road; points every so far along it)
  const runs = (X, Z, step, r) => { const out = []; let cur = []; for (let k = 0; k + 1 < X.length; k++) { const L = Math.hypot(X[k + 1] - X[k], Z[k + 1] - Z[k]), m = Math.max(1, Math.ceil(L / step));
      for (let q = 0; q < m; q++) { const x = X[k] + (X[k + 1] - X[k]) * q / m, z = Z[k] + (Z[k + 1] - Z[k]) * q / m; if (clear(x, z, r)) cur.push({ x, z }); else if (cur.length) { if (cur.length > 1) out.push(cur); cur = []; } } }
    const k = X.length - 1; if (clear(X[k], Z[k], r)) cur.push({ x: X[k], z: Z[k] }); if (cur.length > 1) out.push(cur); return out; };
  for (const w of C.bar || []) {
    if (w.k === 'wall') { for (const run of runs(w.x, w.z, 3, 0.8)) { H.lineAlong(run, 'wall', H.wallC, true, w.h > 0 ? Math.min(3, w.h) : undefined); st.walls++; } }
    else if (w.k === 'hedge') { for (const run of runs(w.x, w.z, 3, 1.2)) { H.lineAlong(run, 'hedge', H.hedgeC, true, w.h > 0 ? Math.min(4, w.h) : undefined); st.hedges++; } }
    else if (w.k === 'fence' || w.k === 'rail' || w.k === 'jersey') { for (const run of runs(w.x, w.z, 3, 0.6)) { if (w.k === 'jersey') H.lineAlong(run, 'wall', new THREE.Color('#b9b6ae'), true, 0.8, 0.6); else H.fence(run, w.k === 'rail' || /rail|wood|split/.test(w.wt || '')); st.fences++; } }
    else if (w.k === 'trees') { for (const run of runs(w.x, w.z, 7.5, 2.5)) for (const p of run) { const sp = pickW(F.open && F.open.length ? F.open : F.forest, H.R); if (!sp || !SPECIES[sp]) continue; const y = gY(p.x, p.z); growTree(sp, A, { x: p.x, y, z: p.z, H: 9 + 6 * H.R(), R: H.R, E, snow: snowy ? snowy(p.x, y, p.z) : 0 }); H.keep.add(p.x, p.z, { x: p.x, z: p.z, r: 1.5 }); st.trees++; } }
  }
  // (lone trees: the map's, each a tree of the country's kinds as tall as the map says; within a car's reach, solid)
  for (const q of C.pt || []) { if (q.k !== 'tree' || !clear(q.x, q.z, 1.6)) continue; const sp = pickW(F.open && F.open.length ? F.open : F.forest, H.R); if (!sp || !SPECIES[sp]) continue; const y = gY(q.x, q.z);
    const reach = growTree(sp, A, { x: q.x, y, z: q.z, H: q.h > 2 ? Math.min(30, q.h) : 8 + 8 * H.R(), R: H.R, E, snow: snowy ? snowy(q.x, y, q.z) : 0 }); st.trees++; H.keep.add(q.x, q.z, { x: q.x, z: q.z, r: 1.5 });
    const g = T.fieldAt(q.x, q.z); if (reach > 0 && g && g.np && !g.np.spur && g.np.i >= 0 && g.nd < g.np.w / 2 + 11.5) { const i = g.np.i; (T.colAt[i] || (T.colAt[i] = [])).push({ i, x: q.x, z: q.z, r: Math.max(0.2, reach * 1.1), kind: 'tree' }); } }
  // (street lamps: a pole and its lantern out over the road; poles of a power line, their wires sagging between them)
  const B = H.B, pc = new THREE.Color('#6e7174'), lc = new THREE.Color('#d8d4c4');
  for (const q of C.pt || []) { if (q.k !== 'lamp' || !clear(q.x, q.z, 0.8)) continue; const y = gY(q.x, q.z), g = T.fieldAt(q.x, q.z); let hx = 0, hz = 0; if (g && g.np) { const d = Math.hypot(g.np.x - q.x, g.np.z - q.z) || 1; hx = (g.np.x - q.x) / d; hz = (g.np.z - q.z) / d; }
    B.cyl(q.x, y, q.z, 0.08, 6.2, 6, pc, false, y - 0.3); B.box(q.x + hx * 0.7, y + 6.0, q.z + hz * 0.7, 0.12, 1.5, 0.08, Math.atan2(hx, hz), pc); B.box(q.x + hx * 1.35, y + 5.82, q.z + hz * 1.35, 0.3, 0.5, 0.18, Math.atan2(hx, hz), lc); st.lamps++;
    const gi = g && g.np && g.np.i >= 0 && !g.np.spur && g.nd < g.np.w / 2 + 6 ? g.np.i : -1; if (gi >= 0) (T.colAt[gi] || (T.colAt[gi] = [])).push({ i: gi, x: q.x, z: q.z, r: 0.12, kind: 'post' }); }
  for (const L of C.pw || []) { const X = L.x, Z = L.z, tall = L.k === 'line', h = tall ? 16 : 8.5; let last = null;
    for (let k = 0; k < X.length; k++) { const x = X[k], z = Z[k]; if (!clear(x, z, 2)) { last = null; continue; } const y = gY(x, z);
      if (tall) { B.box(x, y, z, 1.6, 1.6, h, 0, pc, null, y - 0.3); B.box(x, y + h - 2, z, 6, 0.4, 0.3, Math.atan2(X[Math.min(X.length - 1, k + 1)] - X[Math.max(0, k - 1)], Z[Math.min(X.length - 1, k + 1)] - Z[Math.max(0, k - 1)]) + Math.PI / 2, pc); }
      else B.cyl(x, y, z, 0.13, h, 6, new THREE.Color('#5e5448'), false, y - 0.3);
      if (last) { const sag = Math.hypot(x - last.x, z - last.z) * 0.02; for (let q = 0; q < 8; q++) { const t0 = q / 8, t1 = (q + 1) / 8, f = t => Math.sin(Math.PI * t) * sag; H.wires.push(last.x + (x - last.x) * t0, last.y + (y + h - 0.6 - last.y) * t0 - f(t0), last.z + (z - last.z) * t0, last.x + (x - last.x) * t1, last.y + (y + h - 0.6 - last.y) * t1 - f(t1), last.z + (z - last.z) * t1); } }
      last = { x, y: y + h - 0.6, z }; st.poles++; } }
  return st;
}
// ---- water, the other roads, the railways ----
// Lakes and the map's river areas as sheets of water at their levels (the land under them is under the water: see
// rwNat; the sea is the game's own, at the sea's level); streams and ditches as ribbons of water down their lines as wide as the map says; every other road and track
// the map has round the course (and the course's own road where it goes on past it) as a ribbon of its surface on the
// ground, as wide as it is, its footways and paths narrower and paler; railways as their ballast and rails
// (a mesh's triangles split by the square of size S each one's middle is in, each square's its own geometry: so each is
// drawn only when it is in view, and the stage's batching (batchStatic) gathers them with the rest of their square)
function rwSquares(pos, idx, S) { const out = new Map();
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2], cx = (pos[a * 3] + pos[b * 3] + pos[c * 3]) / 3, cz = (pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2]) / 3, key = Math.floor(cx / S) + ',' + Math.floor(cz / S);
    let q = out.get(key); if (!q) out.set(key, q = { pos: [], idx: [], map: new Map() });
    for (const v of [a, b, c]) { let w = q.map.get(v); if (w === undefined) { w = q.pos.length / 3; q.map.set(v, w); q.pos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); } q.idx.push(w); } }
  return [...out.values()]; }
function rwSurfaces(ctx, H) {
  const { T, E, G, gY } = ctx, C = T.real, out = { water: 0, net: 0, rail: 0 };
  const wmat = new THREE.MeshLambertMaterial({ color: 0x4d6f7c, transparent: true, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  { const WP = [], WI = []; // (the lakes' and the map's river areas' sheets, all in one list, drawn by squares: see rwSquares)
    for (const A of C.wat || []) { if (A.wt === 'sea') continue; /* (the sea: the game's own, see rwStageOf) */ for (let r = 0; r < A.o.length; r++) { const [X, Z] = A.o[r], cv = []; let n = X.length; if (n > 3 && X[0] === X[n - 1] && Z[0] === Z[n - 1]) n--; for (let k = 0; k < n; k++) cv.push(new THREE.Vector2(X[k], Z[k]));
      const holes = (A.in || []).filter(([hx, hz]) => hx.length > 3).map(([hx, hz]) => { const h = []; for (let k = 0; k < hx.length - 1; k++) h.push(new THREE.Vector2(hx[k], hz[k])); return h; });
      let tr; try { tr = THREE.ShapeUtils.triangulateShape(cv, holes); } catch (e) { continue; } const all = cv.concat(...holes), o = WP.length / 3;
      for (let k = 0; k < all.length; k++) { const x = all[k].x, z = all[k].y, lv = A.lv != null ? A.lv : rwWaterLv(A, x, z); WP.push(x, (lv != null ? lv : gY(x, z)) + 0.05, z); }
      for (const t of tr) WI.push(o + t[0], o + t[2], o + t[1]); out.water++; } }
    for (const q of rwSquares(WP, WI, 400)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q.pos, 3)); g.setIndex(q.idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, wmat); m.receiveShadow = true; m.userData.rw = 'water'; G.add(m); } }
  // (a ribbon along a line, w wide, on the ground (lift over it), skipping where skip says)
  const ribbon = (X, Z, w, lift, skip, step) => { const pos = [], idx = []; let prev = -1; const add = (x, z, h, keep) => { if (!keep) { prev = -1; return; } const lx = Math.cos(h) * w / 2, lz = -Math.sin(h) * w / 2, v = pos.length / 3;
      pos.push(x + lx, gY(x + lx, z + lz) + lift, z + lz, x - lx, gY(x - lx, z - lz) + lift, z - lz); if (prev >= 0) idx.push(prev, prev + 1, v, prev + 1, v + 1, v); prev = v; };
    for (let k = 0; k + 1 < X.length; k++) { const L = Math.hypot(X[k + 1] - X[k], Z[k + 1] - Z[k]), h = Math.atan2(X[k + 1] - X[k], Z[k + 1] - Z[k]), m = Math.max(1, Math.ceil(L / (step || 2)));
      for (let q = 0; q < m; q++) { const x = X[k] + (X[k + 1] - X[k]) * q / m, z = Z[k] + (Z[k + 1] - Z[k]) * q / m; add(x, z, h, !skip(x, z)); } }
    const k = X.length - 1; if (k > 0) add(X[k], Z[k], Math.atan2(X[k] - X[k - 1], Z[k] - Z[k - 1]), !skip(X[k], Z[k])); return { pos, idx }; };
  const mesh = (parts, mat, tag) => { let n = 0; const pos = [], idx = []; for (const p of parts) { const o = pos.length / 3; for (const v of p.pos) pos.push(v); for (const i of p.idx) idx.push(i + o); n += p.idx.length / 3; } if (!idx.length) return 0;
    for (const q of rwSquares(pos, idx, mat.transparent ? 400 : BATCH_CELL)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q.pos, 3)); g.setIndex(q.idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.userData.rw = tag || 'surf'; G.add(m); } return n; };
  const nearRoad = pad => (x, z) => { const g = T.fieldAt(x, z); if (!(g && g.np && g.nd < g.np.w / 2 + pad)) return false; return !(g.np.nb && g.np.y - gY(x, z) > 3); }; // (under the course's bridge, high over it, a road or a stream goes on)
  { const parts = []; for (const L of C.wl || []) { if (L.tu) continue; parts.push(ribbon(L.x, L.z, Math.max(0.8, Math.min(30, L.w || 2)), 0.06, nearRoad(1.5), typeof Gfx !== 'undefined' && Gfx.lo() ? 5 : 3)); } out.water += mesh(parts, wmat, 'water'); }
  // (the network: by surface, sealed and loose, and the paths; a road's ribbon a little over the land, under the course's)
  const mats = { tarmac: new THREE.MeshLambertMaterial({ color: 0x55575a, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), gravel: new THREE.MeshLambertMaterial({ color: 0x9a8f7a, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), path: new THREE.MeshLambertMaterial({ color: 0xa09a8c, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) };
  const PB = { tarmac: [], gravel: [], path: [] }, spurNear = (x, z) => { for (const sp of T.spurs || []) for (const q of sp.pts) if (Math.abs(q.x - x) < 6 && Math.abs(q.z - z) < 6 && Math.hypot(q.x - x, q.z - z) < q.w / 2 + 1.5) return true; return false; };
  // (on the lower graphics settings the footways and paths left out and the rest laid coarser: a town's network is many
  // kilometres of them)
  const lo = typeof Gfx !== 'undefined' && Gfx.lo();
  for (const L of C.net || []) { if (L.tu || (lo && L.foot) || (!L.own && (L.br || (L.ly | 0) >= 1))) continue; /* (a bridge: its deck, see rwBridges) */ const k = L.foot ? 'path' : L.s === 'gravel' ? 'gravel' : 'tarmac', skip = (x, z) => nearRoad(1.2)(x, z) || spurNear(x, z);
    PB[k].push(ribbon(L.x, L.z, Math.max(1.2, L.w), L.foot ? 0.05 : 0.07, skip, lo ? 5 : L.foot ? 4 : 3)); }
  for (const k in PB) out.net += mesh(PB[k], mats[k], 'net');
  // (railways: the ballast and the two rails)
  { const parts = [], rails = []; for (const L of C.rail || []) { if (L.tu || L.br || (L.ly | 0) >= 1) continue; parts.push(ribbon(L.x, L.z, 3.2, 0.08, nearRoad(1.5), 2)); for (const o of [-0.72, 0.72]) { const X = [], Z = []; for (let k = 0; k < L.x.length; k++) { const a = L.x[Math.max(0, k - 1)], b = L.x[Math.min(L.x.length - 1, k + 1)], c = L.z[Math.max(0, k - 1)], d = L.z[Math.min(L.x.length - 1, k + 1)], h = Math.atan2(b - a, d - c); X.push(L.x[k] + Math.cos(h) * o); Z.push(L.z[k] - Math.sin(h) * o); } rails.push(ribbon(X, Z, 0.09, 0.2, nearRoad(1.5), 1.5)); } }
    out.rail += mesh(parts, new THREE.MeshLambertMaterial({ color: 0x7a746a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 'rail') + mesh(rails, new THREE.MeshLambertMaterial({ color: 0x4a4644 }), 'rail'); }
  return out;
}
// a tunnel's tube: its walls up from the road's edges, its vault over, its portals' faces where it goes into the hill
function rwTunnels(ctx, H) { const { T, G } = ctx, P = T.pts, pos = [], idx = [], lp = [], li = [], mat = stdMat(0x8d8a84); let n = 0;
  for (const f of T.feats) { if (f.type !== 'tunnel') continue; const a = Math.max(0, f.s0 - 1), b = Math.min(P.length - 1, f.s1 + 1), ring = [[-1, -0.05], [-1, 4.4], [-0.6, 5.6], [0, 6.0], [0.6, 5.6], [1, 4.4], [1, -0.05]];
    let prev = -1; for (let i = a; i <= b; i++) { const p = P[i], hw = p.w / 2 + 0.9, lx = Math.cos(p.h), lz = -Math.sin(p.h), v = pos.length / 3; for (const [u, h] of ring) pos.push(p.x + lx * u * hw, p.y + h, p.z + lz * u * hw);
      if (prev >= 0) for (let k = 0; k < ring.length - 1; k++) idx.push(prev + k, v + k, prev + k + 1, prev + k + 1, v + k, v + k + 1); prev = v; }
    // (the portals: a face of concrete round each mouth, out to the hillside)
    for (const i of [a, b]) { const p = P[i], hw = p.w / 2 + 0.9, lx = Math.cos(p.h), lz = -Math.sin(p.h);
      for (const [u0, u1, h0, h1] of [[-1.8, -1, -0.5, 8], [1, 1.8, -0.5, 8], [-1, 1, 6.0, 8]]) { const v = pos.length / 3; for (const [u, h] of [[u0, h0], [u1, h0], [u1, h1], [u0, h1]]) pos.push(p.x + lx * u * hw, p.y + h, p.z + lz * u * hw); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); } }
    // (its lamps: a row of them along the crown every 8 m, as a road tunnel is lit, day and night)
    for (let i = a + 2; i < b - 2; i += 4) { const p = P[i], q = P[i + 1], hw = p.w / 2 + 0.9, fx = Math.sin(p.h), fz = Math.cos(p.h), lx = Math.cos(p.h), lz = -Math.sin(p.h), yl = p.y + 5.66; // (just under the crown where they hang: it is 5.79 m up a third of the way out)
      for (const u of [-0.32, 0.32]) { const cx = p.x + lx * u * hw, cz = p.z + lz * u * hw, v = lp.length / 3; for (const [df, dl] of [[-0.6, -0.12], [0.6, -0.12], [0.6, 0.12], [-0.6, 0.12]]) lp.push(cx + fx * df + lx * dl, yl, cz + fz * df + lz * dl); li.push(v, v + 2, v + 1, v, v + 3, v + 2); } }
    n++; }
  if (li.length) { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); g2.setIndex(li); const m2 = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: 0xfff0c8, side: THREE.DoubleSide })); m2.userData.rw = 'tunnel'; G.add(m2); }
  if (!idx.length) return 0; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x8d8a84, side: THREE.DoubleSide })); m.receiveShadow = true; m.castShadow = true; m.userData.rw = 'tunnel'; G.add(m); return n; } // (its shadow on the road inside: dark in there by day)
// a there-and-back's turning circle: its island, kerbed and grassed, a marker post with its flag at its middle
function rwTurnIsland(ctx, H) { const { T, gY } = ctx, M = T.rwTurnM; if (!M) return; const B = H.B, y = gY(M.x, M.z), r = M.r;
  B.cyl(M.x, y, M.z, r + 0.25, 0.16, 24, new THREE.Color('#d9d6cf'), new THREE.Color('#d9d6cf'), y - 0.4); B.cyl(M.x, y + 0.16, M.z, r, 0.06, 24, new THREE.Color('#5f7d38'), new THREE.Color('#5f7d38'), y);
  B.cyl(M.x, y, M.z, 0.06, 2.4, 6, new THREE.Color('#e8e4da'), false, y); B.box(M.x + 0.3, y + 1.9, M.z, 0.6, 0.02, 0.4, 0, new THREE.Color('#c4202f'));
  H.keep.add(M.x, M.z, { x: M.x, z: M.z, r: r + M.W + 2 }); }
// ---- the bridges of the map's other roads and railways ----
// Each as a deck along the map's line at its own height: from the ground at one end to the ground at the other, raised
// where it crosses over the course so the course passes under it with 4.8 m to spare (smoothly, back down to its ends);
// a concrete deck a metre deep with its parapets, a road's surface or a railway's ballast and rails on it, on piers
// where it stands high - the piers beside the course solid (see rwBoxes) - and on its abutments at the ends
function rwBridges(ctx, H) { const { T, gY } = ctx, C = T.real, L0 = C._ov ? C._ov.list : [], B = H.B, P = T.pts; let n = 0;
  const conc = new THREE.Color('#a3a09a'), dark = new THREE.Color('#6d6b66'), tar = new THREE.Color('#57595b'), bal = new THREE.Color('#7a746a'), steel = new THREE.Color('#4a4644');
  for (const o of L0) { const Lw = o.kind === 'rail' ? 4.2 : Math.max(3, o.L.w || 4), bw = Lw + 0.6, len = o.len; if (len < 4) continue;
    const at = s => rwAlong(o, s), [x0, z0] = at(0), [x1, z1] = at(len), y0 = gY(x0, z0), y1 = gY(x1, z1); if (!(y0 > -1e8) || !(y1 > -1e8)) continue;
    const lin = s => y0 + (y1 - y0) * s / len, bumps = o.xs.map(c => { const add = Math.max(0, P[c.ic].y + (c.tu ? 7.4 : 5.6) - lin(c.s)); /* (over a tunnel: its underside over the tube's crown) */ return { s: c.s, add, D: Math.max(c.s, len - c.s, 1) }; });
    const top = s => { let y = lin(s); for (const b of bumps) y += b.add * Math.max(0, 1 - ((s - b.s) / b.D) ** 2); return y; };
    const N = Math.max(2, Math.ceil(len / 4)), S = []; for (let k = 0; k <= N; k++) { const s = len * k / N, [x, z, h] = at(s); S.push({ s, x, z, h, y: Math.max(top(s), gY(x, z) + 0.15) }); }
    for (let k = 0; k < N; k++) { const a = S[k], b = S[k + 1];
      const side = (q, l) => [q.x + Math.cos(q.h) * l, q.z - Math.sin(q.h) * l];
      for (const [l0, l1, col, dy, up] of [[-Lw / 2, Lw / 2, o.kind === 'rail' ? bal : tar, 0, true], [-bw / 2, bw / 2, dark, -1.0, false]]) { const [ax0, az0] = side(a, l0), [ax1, az1] = side(a, l1), [bx0, bz0] = side(b, l0), [bx1, bz1] = side(b, l1);
        B.quad([ax0, a.y + dy, az0], [bx0, b.y + dy, bz0], [bx1, b.y + dy, bz1], [ax1, a.y + dy, az1], col, [0, up ? 1 : -1, 0]); }
      for (const sd of [-1, 1]) { const [ax, az] = side(a, sd * bw / 2), [bx, bz] = side(b, sd * bw / 2), [ai, azi] = side(a, sd * (bw / 2 - 0.25)), [bi, bzi] = side(b, sd * (bw / 2 - 0.25)), nx = Math.cos(a.h) * sd, nz = -Math.sin(a.h) * sd;
        B.quad([ax, a.y - 1.0, az], [bx, b.y - 1.0, bz], [bx, b.y + 0.9, bz], [ax, a.y + 0.9, az], conc, [nx, 0, nz]); // (the deck's edge and its parapet's outer face)
        B.quad([ai, a.y, azi], [bi, b.y, bzi], [bi, b.y + 0.9, bzi], [ai, a.y + 0.9, azi], conc, [-nx, 0, -nz]); // (the parapet's inner face)
        B.quad([ai, a.y + 0.9, azi], [bi, b.y + 0.9, bzi], [bx, b.y + 0.9, bz], [ax, a.y + 0.9, az], conc, [0, 1, 0]); } // (its top)
      if (o.kind === 'rail') for (const l of [-0.72, 0.72]) { const [ax, az] = side(a, l - 0.04), [bx, bz] = side(b, l - 0.04), [ax2, az2] = side(a, l + 0.04), [bx2, bz2] = side(b, l + 0.04); B.quad([ax, a.y + 0.2, az], [bx, b.y + 0.2, bz], [bx2, b.y + 0.2, bz2], [ax2, a.y + 0.2, az2], steel, [0, 1, 0]); } }
    // (its piers: beside the course, and every 24 m along it where it stands four metres or more over the ground, none
    // in the course's way; its abutments)
    const near = (x, z) => { const g = T.fieldAt(x, z); return !!(g && g.np && g.nd < g.np.w / 2 + 2); }, pier = (s, d) => { const [x, z, h] = at(s), y = top(s), g = gY(x, z); if (!(g > -1e8) || y - 1.0 - g < 0.6) return; B.box(x, y - 1.0, z, bw - 0.2, d, -(y - 1.0 - g) - 0.6, h, conc, false, g - 0.6); };
    for (const pr of rwOverPiers(o)) pier(pr.s, 1.2);
    for (let s = 12; s < len - 6; s += 24) { const [x, z] = at(s); if (top(s) - gY(x, z) > 4 && !near(x, z) && !rwOverPiers(o).some(pr => Math.abs(pr.s - s) < 8)) pier(s, 1.2); }
    for (const s of [0.8, len - 0.8]) pier(s, 1.6);
    n++; }
  return n;
}
// all of it, from buildProps (H: its own bakers and helpers)
function rwProps(ctx, H) {
  const t0 = performance.now(); rwTurnIsland(ctx, H); const tu = rwTunnels(ctx, H), b = rwBuildings(ctx, H), l = rwLines(ctx, H), s = rwSurfaces(ctx, H), br = rwBridges(ctx, H);
  H.stats.real = ctx.T.rwStats = { buildings: b, tunnels: tu, bridges: br, ...l, ...s, ms: Math.round(performance.now() - t0) }; return H.stats.real;
}
