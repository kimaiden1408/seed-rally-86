# Round 46: real roads. Applied to the round 45 builds (site 7381, artifact B554). Each replacement must match exactly
# the stated number of times in each build.
import sys, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
T46 = lambda f: open(os.path.join(HERE, 't46', f)).read()
def patch(path, stamp_old, stamp_new, art=False):
    s = open(path, encoding='utf-8').read()
    n_ok = 0
    def rep(old, new, n=1):
        nonlocal s, n_ok
        c = s.count(old)
        if c != n: raise SystemExit(f'{path}: expected {n} of {old[:90]!r}, found {c}')
        s = s.replace(old, new); n_ok += 1
    rep(f"const SR86_BUILD = '{stamp_old}';", f"const SR86_BUILD = '{stamp_new}';")
    # ---- the core: real-road layout (rw_core) before generateStage; layStage's real branch ----
    rep("function generateStage(seedStr, force) {\n", T46('rw_core.js') + "\nfunction generateStage(seedStr, force) {\n")
    rep("  if (T.loop || T.sss || finishGap(T) >= 1) return T;", "  if (T.loop || T.sss || T.real || finishGap(T) >= 1) return T;")
    rep("function natAt(T, x, z) { const L = T.land, s = T.nseed; ", "function natAt(T, x, z) { const L = T.land, s = T.nseed; if (L.rw) return rwNat(L.rw, x, z); ")
    rep("function natMacro(T, x, z) { const L = T.land, s = T.nseed; ", "function natMacro(T, x, z) { const L = T.land, s = T.nseed; if (L.rw) return rwNat(L.rw, x, z); ")
    rep("  if (force && force.type) for (const sf in STAGE_TYPES) {",
        "  const RWP = force && force.real || null; let RWL = null, RWR = null; // (round 46: a course on real roads, laid from its pack: see rwLayout)\n"
        "  if (RWP) { for (const sf in STAGE_TYPES) { const t = STAGE_TYPES[sf].find(q => q.id === RWP.look); if (t) { TY = t; types = STAGE_TYPES[sf]; break; } } surface = RWP.surface; }\n"
        "  if (force && force.type) for (const sf in STAGE_TYPES) {")
    rep("  const land = SSS ? {", "  const land = RWP ? { rw: RWP.pack, big: 0, sBig: 700, mid: 0, sMid: 190, small: 0, hilly: true } : SSS ? {")
    rep("  land.hilly = RL() < TY.hilly; const LF = SSS ? null : LANDFORM[TY.id];", "  land.hilly = RWP ? true : RL() < TY.hilly; const LF = SSS || RWP ? null : LANDFORM[TY.id];")
    rep("  const ZP = SSS ? { zones:", "  const ZP = RWP ? { zones: [{ set: 'open', s0: 0, s1: 1e9, gT: 0, tol: 0.2 }], plan: 'pass' } : SSS ? { zones:")
    rep("const LP = LOOP ? layoutLoop() : null;", "const LP = LOOP ? layoutLoop() : null;\n  if (RWP) { RWL = rwLayout({ pack: RWP.pack, TY, surface, pts, grid }); rwFeats({ pack: RWP.pack, pts, cN: RWL.cN, feat, colliders, grid }); rwFit({ pack: RWP.pack, pts, cN: RWL.cN }); }")
    rep("  if (!LOOP) commit({ ops: [{ t: 'L', len: 110 }] }, sim(st, [{ t: 'L', len: 110 }]));", "  if (!LOOP && !RWL) commit({ ops: [{ t: 'L', len: 110 }] }, sim(st, [{ t: 'L', len: 110 }]));")
    rep("  while (!LOOP && guard++ < 3000) {", "  while (!LOOP && !RWL && guard++ < 3000) {")
    rep("  for (let k = 0; k < 40 && !LOOP; k++) {", "  for (let k = 0; k < 40 && !LOOP && !RWL; k++) {")
    rep("  const finStart = pts.length; if (!LOOP) commit(fin, sim(st, fin.ops));", "  const finStart = pts.length; if (!LOOP && !RWL) commit(fin, sim(st, fin.ops));")
    rep("  else if (!RXC) notes.push({ i: LP.finishIdx - 30,", "  else if (LOOP && !RXC) notes.push({ i: LP.finishIdx - 30,")
    rep("  const startIdx = LOOP ? LP.startIdx : 45, finishIdx = LOOP ? LP.finishIdx : finStart + 40, stopIdx = LOOP ? LP.stopIdx : finishIdx + 100;",
        "  let startIdx = RWL ? RWL.rng[0] : LOOP ? LP.startIdx : 45, finishIdx = RWL ? RWL.rng[1] : LOOP ? LP.finishIdx : finStart + 40, stopIdx = RWL ? RWL.rng[2] : LOOP ? LP.stopIdx : finishIdx + 100;\n"
        "  if (RWL) { const Zr = rwZones({ pack: RWP.pack, grid }, pts, pts.length); zones.length = 0; for (const z of Zr) zones.push(z); } // (a real course's: what the land and the houses along it are)")
    rep("  if (surface === 'mixed') {", "  if (surface === 'mixed' && !RWL) {")
    rep("  { const VS = VILLAGE_SURF[TY.id] || VILLAGE_SURF._;", "  if (!RWL) { const VS = VILLAGE_SURF[TY.id] || VILLAGE_SURF._;")
    rep("  for (let i = 0; i < N; i++) y[i] = natAt(TL, pts[i].x, pts[i].z);\n",
        "  for (let i = 0; i < N; i++) y[i] = natAt(TL, pts[i].x, pts[i].z);\n"
        "  if (RWL) { const YL = rwHeights(RWP.pack, RWL.CL), yT = YL[Math.min(YL.length - 1, RWL.iB)], yB = RWL.turn ? YL[RWL.turn.rb] : yT; for (let i = 0; i < N; i++) { const p = pts[i], m = p.rwm; y[i] = m >= 0 ? YL[m] : yT + (yB - yT) * (p.rwtf || 0); } } // (a real road: as the map's heights have it; a there-and-back's turn from its end's height to where it rejoins the road)\n")
    rep("  for (let pass = 0; pass < 3; pass++) y = RXC ? boxL(y, 10) : box(y, land.v30 ? 22 : 10);", "  if (!RWL) for (let pass = 0; pass < 3; pass++) y = RXC ? boxL(y, 10) : box(y, land.v30 ? 22 : 10);")
    rep("  if (gP > gS && !LOOP && N > 200) {", "  if (gP > gS && !LOOP && !RWL && N > 200) {")
    rep("  for (let it = 0; it < 4; it++) {\n    for (let i = 1; i < N; i++) if (!fixed[i])",
        "  if (RWL) for (const f of feats) if (f.flat && f.yc != null) for (let d = 1; d <= 15; d++) { const w = smooth(15, 0, d); for (const i of [f.s0 - d, f.s1 + d]) if (i >= 0 && i < N && !fixed[i]) y[i] += (f.yc - y[i]) * w; } // (a real roundabout's approaches eased to its level)\n"
        "  for (let it = 0; it < (RWL ? 0 : 4); it++) {\n    for (let i = 1; i < N; i++) if (!fixed[i])")
    rep("  for (let pass = 0; pass < 2; pass++) { const o = y.slice(); for (let i = 1; i < N - 1; i++) if (!fixed[i])", "  for (let pass = 0; pass < (RWL ? 0 : 2); pass++) { const o = y.slice(); for (let i = 1; i < N - 1; i++) if (!fixed[i])")
    rep("else if (f.type === 'bridge') y[i] += (f.hump || 0.8) * bump;", "else if (f.type === 'bridge') y[i] += (f.rw ? 0 : f.hump || 0.8) * bump;")
    rep("  if (!LOOP && !SSK && !(WIDE > 1)) { const WD", "  if (!LOOP && !SSK && !(WIDE > 1) && !RWL) { const WD")
    rep("  const marks = [];\n",
        "  if (RWL) { rwSpurs({ pack: RWP.pack, pts, grid, cN: RWL.cN, bank, nat: (x, z) => natAt(TL, x, z), narrow: RW_NARROW.has(TY.id), gravelC: RW_GRAVEL.has(TY.id), snow: surface === 'snow' }, { spurs, colliders });\n"
        "    if (RWL.turn) { const Tn = RWL.turn, a = RWL.iB + 1, b = RWL.cN - 1, im = Math.round((a + b) / 2), rIn = Tn.Rc - Tn.W / 2 - 0.6; colliders.push({ i: im, x: Tn.cx, z: Tn.cz, r: rIn, kind: 'island', rwTurn: 1 }); } } // (a there-and-back's turn: round an island, as at a turning circle)\n"
        "  const marks = [];\n")
    rep("  marks.sort((a, b) => a.i - b.i);", "  if (RWL) rwMarks({ pack: RWP.pack, pts, grid, cN: RWL.cN }, marks);\n  marks.sort((a, b) => a.i - b.i);")
    rep("        if (ok) { const isChurch = kind === 'house' && church === sd && j >= mid;", "        if (ok && !RWL) { const isChurch = kind === 'house' && church === sd && j >= mid;")
    rep("  // (a rallycross circuit's start lane: the lengths of its outer wall", "  if (RWL) rwBoxes({ pack: RWP.pack, pts, grid, cN: RWL.cN, boxes, nat: (x, z) => natAt(TL, x, z) }); // (a real course's houses and walls by the road)\n  // (a rallycross circuit's start lane: the lengths of its outer wall")
    rep("  notes.sort((a, b) => a.i - b.i);\n  const tightRe",
        "  // (a real course: the run laid over its points - its laps, its way back - and its notes called from the road as it lies)\n"
        "  if (RWL) { RWR = rwRun(pts, RWL); startIdx = RWL.ctl.start; finishIdx = RWL.ctl.finish; stopIdx = RWL.ctl.stop; notes.length = 0; for (const n of rwNotes(pts, Math.max(1, startIdx - 40), Math.min(pts.length - 2, finishIdx + 2), [])) notes.push(n); }\n"
        "  notes.sort((a, b) => a.i - b.i);\n  const tightRe")
    rep("  return { seed: seedStr, surface, type: { id: TY.id, name: TY.name }, bio: TY,", "  return rwFinish(RWL, RWP, RWR, { seed: seedStr, surface, type: { id: TY.id, name: TY.name }, bio: TY,")
    rep("sss, loop: RXC };", "sss, loop: RXC });")

    # ---- the page: physics on a real course's run (round 46) ----
    # (where a car is: on the canonical points, for the road and what is on it; its own run point kept for its progress)
    rep("  const A = P[res.s], B = P[res.s + 1];\n  const h = Math.atan2(res.ex, res.ez); const lx = Math.cos(h), lz = -Math.sin(h);",
        "  const ri = res.t < 0.5 ? res.s : res.s + 1; // (round 46: on a real course's later laps and its way back, the road is the canonical points': see rwRun)\n"
        "  if (T.ali && res.s >= T.cN) { const c = T.ali[res.s]; if (T.alf[res.s] < 0) { res.s = Math.max(0, c - 1); res.t = 1 - res.t; res.ex = -res.ex; res.ez = -res.ez; } else res.s = Math.min(c, T.cN - 2); }\n"
        "  const A = P[res.s], B = P[res.s + 1];\n  const h = Math.atan2(res.ex, res.ez); const lx = Math.cos(h), lz = -Math.sin(h);")
    rep("  return { i: res.t < 0.5 ? res.s : res.s + 1, s: res.s, t: res.t, h, lat, lx, lz, y: yH,", "  return { i: T.cN ? Math.min(T.cN - 1, res.t < 0.5 ? res.s : res.s + 1) : res.t < 0.5 ? res.s : res.s + 1, ri, s: res.s, t: res.t, h, lat, lx, lz, y: yH,")
    rep("T.grid.query(x, z, Math.min(40, Math.sqrt(bd)), o => { if (o.r || gap(o.i) > 120 || P[o.i].wall) return; /* walled stretches are entered only along the road */ const dx = o.x - x, dz = o.z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = LP ? o.i % LP : o.i; } });",
        "T.grid.query(x, z, Math.min(40, Math.sqrt(bd)), o => { const oi = T.ali && !T.rwDrawing && o.i != null ? rwRunNear(T, o.i, h0) : o.i; if (o.r || gap(oi) > 120 || P[oi].wall) return; /* walled stretches are entered only along the road */ const dx = o.x - x, dz = o.z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = LP ? oi % LP : oi; } });")
    rep("const info = locate(T, c.x, c.z, c.hint); c.hint = info.i;", "const info = locate(T, c.x, c.z, c.hint); c.hint = info.ri;", 2)
    rep("  c.info = locate(T, c.x, c.z, c.hint); c.hint = c.info.i;", "  c.info = locate(T, c.x, c.z, c.hint); c.hint = c.info.ri;")
    rep("s.info = locate(T, p.x, p.z, s.hint); s.hint = s.info.i;", "s.info = locate(T, p.x, p.z, s.hint); s.hint = s.info.ri;")
    rep("const inf = locate(T, r.pose.x, r.pose.z, clamp(h | 0, 0, T.pts.length - 1)); r.hint = inf.i;", "const inf = locate(T, r.pose.x, r.pose.z, clamp(h | 0, 0, T.pts.length - 1)); r.hint = inf.ri;")
    rep("c.hint = locate(T, s.x, s.z, clamp(T.startIdx + Math.round(s.p), 0, T.pts.length - 1)).i;", "c.hint = locate(T, s.x, s.z, clamp(T.startIdx + Math.round(s.p), 0, T.pts.length - 1)).ri;", 0 if art else 1) # (the website's own)
    rep("  const sh = shellOf(S), BX = sh.boxes, Px = c.x, Py = c.yb, Pz = c.z, i0 = c.hint, R0 = wheelOf(S).R;", "  const sh = shellOf(S), BX = sh.boxes, Px = c.x, Py = c.yb, Pz = c.z, i0 = T.ali ? T.ali[clamp(c.hint | 0, 0, T.ali.length - 1)] : c.hint, R0 = wheelOf(S).R;")
    rep("if (!T.boxAt || !T.softN) return; const N = T.pts.length, i0 = c.hint,", "if (!T.boxAt || !T.softN) return; const N = T.cN || T.pts.length, i0 = T.ali ? T.ali[clamp(c.hint | 0, 0, T.ali.length - 1)] : c.hint,")
    # (a real bridge spans the map's own valley: no stream is traced under it; the land under it is not raised to it)
    rep("  for (const f of T.feats.filter(f => ((f.type === 'ford' && !f.pool) || f.type === 'bridge') && f.cx != null)", "  for (const f of T.feats.filter(f => ((f.type === 'ford' && !f.pool) || f.type === 'bridge') && f.cx != null && !f.rw)")
    rep("  if (T.feats.some(f => (f.type === 'ford' && !f.pool) || f.type === 'bridge')) {", "  if (T.feats.some(f => ((f.type === 'ford' && !f.pool) || f.type === 'bridge') && !f.rw)) {")
    rep("    for (let k = 0; k < NAL; k++) { const o = all[k]; if (!o.spur && (o.i & 1)) continue; const b = BEN[k];", "    for (let k = 0; k < NAL; k++) { const o = all[k]; if (!o.spur && (o.i & 1)) continue; if (T.real && (o.nb || o.rwtu)) continue; const b = BEN[k];")
    # (a real tunnel: the hill over it is left as it is - not cut away to the road, nor shaped by the road's cuts and fills)
    rep("  for (const o of all) { if (o.spur) continue;\n    const i0 = Math.max(0, Math.ceil((o.x - NR - x0) / cell) - 1)", "  for (const o of all) { if (o.spur || o.rwtu) continue;\n    const i0 = Math.max(0, Math.ceil((o.x - NR - x0) / cell) - 1)")
    rep("  all.forEach((o, k) => { AX[k] = o.x; AZ[k] = o.z;", "  all.forEach((o, k) => { AX[k] = o.rwtu ? 1e7 : o.x; AZ[k] = o.rwtu ? 1e7 : o.z;")
    rep("        SY[o + c] = p.nb || c > 1 ? fieldAt(x, z).h : c === 0 ? e - 0.08 : e - 0.03;", "        SY[o + c] = p.rwtu ? e - 0.03 - 0.01 * c : p.nb || c > 1 ? fieldAt(x, z).h : c === 0 ? e - 0.08 : e - 0.03; // (in a real tunnel: its floor, level to its walls)")
    # (the controls on a real course's canonical points: see rwCtlAt)
    rep("[[T.startIdx, 3], [T.finishIdx + 3, 3], [T.stopIdx, 3]].concat((T.radio || []).map(i => [i + 2, 1]))", "[[T.startIdx, 3], [rwCtlAt(T, 'fin', 3), 3], [rwCtlAt(T, 'stop', 0), 3]].concat((T.radio || []).map(i => [i + 2, 1]))")
    rep("  board(T.finishIdx - 50, -1, 'yflag'); board(T.finishIdx - 50, 1, 'yflag'); board(T.finishIdx, -1, 'rflag'); board(T.finishIdx, 1, 'rflag');", "  board(rwCtlAt(T, 'fin', -50), -1, 'yflag'); board(rwCtlAt(T, 'fin', -50), 1, 'yflag'); board(rwCtlAt(T, 'fin', 0), -1, 'rflag'); board(rwCtlAt(T, 'fin', 0), 1, 'rflag');")
    rep("  if (!T.sss) { tent(T.startIdx + 2, -1, 0xc4202f); tent(T.finishIdx + 4, -1, 0xc4202f); tent(T.stopIdx + 3, -1, 0xf2c014); }", "  if (!T.sss) { tent(T.startIdx + 2, -1, 0xc4202f); tent(rwCtlAt(T, 'fin', 4), T.rwCtl && T.rwCtl.back ? 1 : -1, 0xc4202f); tent(rwCtlAt(T, 'stop', 3), T.rwCtl && T.rwCtl.back ? 1 : -1, 0xf2c014); }")
    rep("    arch(T.finishIdx, 'FINISH', 'Flying finish', '#fbfbf8', '#141414'); }", "    if (!T.rwCtl || Math.abs(T.rwCtl.fin - T.startIdx) > 12) arch(rwCtlAt(T, 'fin', 0), 'FINISH', 'Flying finish', '#fbfbf8', '#141414'); }")
    rep("  for (const i of T.loop ? [T.startIdx] : [T.startIdx, T.finishIdx]) { const p = P[i];", "  for (const i of T.loop ? [T.startIdx] : [...new Set([T.startIdx, rwCtlAt(T, 'fin', 0)])]) { const p = P[i];")
    rep("const regionOf = T => REGIONS[T && T.type ? T.type.id : 'fast'] || REGIONS.fast;", "const regionOf = T => (T && T.rwRg) || REGIONS[T && T.type ? T.type.id : 'fast'] || REGIONS.fast;")

    # ---- the page: drawing what the map has round a real course (rw_draw) ----
    rep("  if (HS && HS.per > 0) {", "  if (HS && HS.per > 0 && !T.real) { // (a real course's houses are the map's: see rwBuildings)")
    rep("  stats.tris = B.build(G, stageChunks, true) + BS.build(G, stageChunks, true)", "  if (T.real) rwProps(ctx, { B, BS, BL, BH, keep, R, lineAlong, fence, wallC, hedgeC, stats, roadGap, wires });\n  stats.tris = B.build(G, stageChunks, true) + BS.build(G, stageChunks, true)")
    rep("function coverFn(T, E, FP, far) {", "function coverFn(T, E, FP, far) { return T.real ? rwCover(T, coverFn0(T, E, FP, far), far) : coverFn0(T, E, FP, far); }\nfunction coverFn0(T, E, FP, far) {")
    rep("    const c = coverAt(x, z), p = (c < 0 ? F.openDens * 0.25", "    const c = coverAt(x, z); if (c < -1.5) return; const p = (c < 0 ? F.openDens * 0.25")
    rep("  const shrub = (x, z, min, list, dens) => { const c = coverAt(x, z), p = dens * (c < 0 ? 0.35", "  const shrub = (x, z, min, list, dens) => { const c = coverAt(x, z); if (c < -2.5) return; const p = dens * (c < 0 ? 0.35")
    rep("  const landCol = (out, x, z, steep, y) => {\n    const n = fbm(x / 40, z / 40, T.nseed + 21); lkSet(0, 0, 0, 0);",
        "  const rwLC = T.real ? rwLandColFn(T, E, { gcol, floorC, cuc, roc, FP, SNC, SNS, snowLand, patchy }) : null; // (a real course: the land as the map has it)\n"
        "  const landCol = (out, x, z, steep, y) => {\n    const n = fbm(x / 40, z / 40, T.nseed + 21); lkSet(0, 0, 0, 0);\n    if (rwLC && rwLC(out, x, z, steep, y, n)) return bedCol(out, x, z, y);")
    rep("  plan.toWorld = (u, v) => [u * ca - v * sa, u * sa + v * ca];", "  plan.toWorld = (u, v) => [u * ca - v * sa, u * sa + v * ca];\n  if (T.real) rwFields(T, plan); // (a real course's fields where the map has farmland)")
    rep("LK = T._lakes = findLakes(T, E.lakes || 0);", "LK = T._lakes = findLakes(T, T.real ? 0 : E.lakes || 0);")

    # ---- the page: the menu's Real roads tab and its map (rw_ui) ----
    rep('<button id="mode_mp" type="button" role="tab" aria-selected="false">Race friends</button></div>', '<button id="mode_mp" type="button" role="tab" aria-selected="false">Race friends</button><button id="mode_real" type="button" role="tab" aria-selected="false">Real roads</button></div>')
    rep('    <div id="mpSetup" hidden>', """    <div id="realSetup" hidden>
      <div class="plate"><label id="realHead">Real roads</label><p id="realNote" class="small">Pick a course, or make one on the map.</p></div>
      <div class="row"><button id="realNew" class="ghostbtn" type="button">Make a course on the map</button><button id="realEdit" class="ghostbtn" type="button">Change this course</button></div>
      <div id="realList"></div>
      <div class="mpopt" id="realLapsRow" hidden><span>Laps</span><div class="assist"><button id="real_lp_1" type="button">1</button><button id="real_lp_2" type="button">2</button><button id="real_lp_3" type="button">3</button><button id="real_lp_5" type="button">5</button><button id="real_lp_10" type="button">10</button></div></div>
      <div class="mpopt"><span>Season</span><div class="assist"><button id="realSnow" type="button">Under snow</button></div></div>
      <div class="row"><button id="realExport" class="ghostbtn" type="button">Save the course file</button><button id="realImport" class="ghostbtn" type="button">Open a course file</button><button id="realCopy" class="ghostbtn" type="button">Copy the course link</button></div>
      <input id="realFile" type="file" accept=".sr86course,.json,.gz,application/json,application/gzip" hidden>
      <p class="small">The road, its junctions, the land, the buildings, walls, trees and water are the map’s; the roadside and the road’s own surface are the country’s.</p>
      <p class="small">Map data © OpenStreetMap contributors (ODbL); heights from Mapterhorn and AWS Terrain Tiles.</p>
    </div>
    <div id="mpSetup" hidden>""")
    rep("  renderTabs() { for (const m of ['stage', 'rally', 'rx', 'mp']) {", "  renderTabs() { for (const m of ['stage', 'rally', 'rx', 'mp', 'real']) {")
    rep("    if (was === 'mp') MP.leaveMenu(); if (was === 'rx') RXUI.leave();", "    if (was === 'mp') MP.leaveMenu(); if (was === 'rx') RXUI.leave(); if (was === 'real') RealUI.leave();")
    rep("else if (m === 'rx') { if (was === 'rally') this.leaveMenu(); RXUI.enter(); } else this.leaveMenu();", "else if (m === 'rx') { if (was === 'rally') this.leaveMenu(); RXUI.enter(); } else if (m === 'real') { if (was === 'rally') this.leaveMenu(); RealUI.enter(); } else this.leaveMenu();")
    rep("  mode: ['rally', 'mp', 'rx'].includes(lsGet('sr86.mode', 'stage')) ? lsGet('sr86.mode', 'stage') : 'stage',", "  mode: ['rally', 'mp', 'rx', 'real'].includes(lsGet('sr86.mode', 'stage')) ? lsGet('sr86.mode', 'stage') : 'stage',")
    rep("Rally.init(); MP.init(); RXUI.init(); Boot.say(", "Rally.init(); MP.init(); RXUI.init(); RealUI.init(); Boot.say(")
    rep("else if (Rally.mode === 'rx') RXUI.enter(); else {", "else if (Rally.mode === 'rx') RXUI.enter(); else if (Rally.mode === 'real') { setSeed(seed, { force: true }); Rally.renderTabs(); RealUI.enter(); } else {")
    rep("    if (Rally.mode === 'mp') { MP.go(); return; } if (Rally.mode === 'rally') { Rally.go(); return; }", "    if (Rally.mode === 'mp') { MP.go(); return; } if (Rally.mode === 'rally') { Rally.go(); return; } if (Rally.mode === 'real') { if (G.T && G.T.real) startRun(); else if (!rwOffline()) RWMap.open(null); return; }")
    rep("function writeHash() { const T = G.T; if (!T) return;", "function writeHash() { const T = G.T; if (!T) return; if (T.real) { try { history.replaceState(null, '', location.pathname + location.search + '#real=' + T.real.code); } catch (e) { } return; }")
    rep("  { const h = $('#seedHead'); if (h) h.textContent = T.loop ? 'Rallycross circuit' : T.sss ? 'Super special' : 'Special stage';", "  if (T.real) $('#stageType').textContent = T.rwLaps ? (T.rwLaps === 1 ? 'Circuit, 1 lap' : `Circuit, ${T.rwLaps} laps`) : RW_KIND[T.rwKind] || 'Real road'; // (a real course: its kind, its laps)\n  { const h = $('#seedHead'); if (h) h.textContent = T.loop ? 'Rallycross circuit' : T.sss ? 'Super special' : 'Special stage';")

    # ---- the side roads at junctions drawn a few to a mesh (by their surface and the 400 m square they leave from), not
    # one mesh each: a town's dozens of junctions were as many draws a frame. Each keeps its own run of the mesh's points,
    # which paintSpurs paints as before ----
    rep("const kpos = [], kcol = [], kidx = [], RK = ['gravel', 'tarmac', 'snow', 'stone', 'ice'], spRoads = [];", "const kpos = [], kcol = [], kidx = [], RK = ['gravel', 'tarmac', 'snow', 'stone', 'ice'], spRoads = [], spB = new Map();")
    rep("""      { const geo = new THREE.BufferGeometry(), nv = L.pos.length / 3; geo.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(L.uv, 2));
        for (const k of ['aLA', 'aLB', 'aTA', 'aTB']) geo.setAttribute(k, new THREE.BufferAttribute(new Uint8Array(nv * 4), 4, true)); geo.setAttribute('aLL', new THREE.Float32BufferAttribute(L.ll, 2));
        geo.setIndex(L.idx); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, gameState().roadMats[RK.indexOf(sf)]); m.receiveShadow = true; G.add(m); spRoads.push({ sp, geo }); }""",
        """      { const key = sf + '|' + Math.floor(a.x / 400) + ',' + Math.floor(a.z / 400); let gB = spB.get(key); if (!gB) spB.set(key, gB = { sf, pos: [], uv: [], ll: [], idx: [], parts: [] });
        const o = gB.pos.length / 3; for (const v of L.pos) gB.pos.push(v); for (const v of L.uv) gB.uv.push(v); for (const v of L.ll) gB.ll.push(v); for (const i of L.idx) gB.idx.push(i + o); gB.parts.push({ sp, o, n: L.pos.length / 3 }); }""")
    rep("    gameState().road.spurs = spRoads;\n", """    for (const gB of spB.values()) { const geo = new THREE.BufferGeometry(), nv = gB.pos.length / 3; geo.setAttribute('position', new THREE.Float32BufferAttribute(gB.pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(gB.uv, 2));
      for (const k of ['aLA', 'aLB', 'aTA', 'aTB']) geo.setAttribute(k, new THREE.BufferAttribute(new Uint8Array(nv * 4), 4, true)); geo.setAttribute('aLL', new THREE.Float32BufferAttribute(gB.ll, 2));
      geo.setIndex(gB.idx); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, gameState().roadMats[RK.indexOf(gB.sf)]); m.receiveShadow = true; G.add(m);
      // (each side road's own run of the points, as its own geometry was: what paintSpurs paints)
      for (const S of gB.parts) { const A = { position: { count: S.n } }; for (const k of ['aLA', 'aLB', 'aTA', 'aTB']) { const at = geo.attributes[k]; A[k] = { array: at.array.subarray(S.o * 4, (S.o + S.n) * 4), set needsUpdate(v) { if (v) at.needsUpdate = true; } }; }
        spRoads.push({ sp: S.sp, geo: { attributes: A } }); } }
    gameState().road.spurs = spRoads;
""")

    # ---- a real road's class (see rwClassOf): its smoothness, its steel barriers all along (a motorway's), steel rather
    # than stone, its cleared verge, and its paint as its class and lanes have it (see rwPaint) ----
    rep("const raw = pts.map(p => (p.tag === 'ring' || p.tag === 'rbt' || p.tag === 'jump') ? 0 : (AMP[p.surf] != null ? AMP[p.surf] : 0.5) * (1 + 0.7 * (p.fesh || 0)));",
        "const raw = pts.map(p => (p.tag === 'ring' || p.tag === 'rbt' || p.tag === 'jump') ? 0 : (AMP[p.surf] != null ? AMP[p.surf] : 0.5) * (1 + 0.7 * (p.fesh || 0)) * (p.rwq || 1));")
    rep("    for (let i = 0; i < N; i++) P[i][key] = on[i] ? 1 : 0;\n", "    for (let i = 0; i < N; i++) P[i][key] = on[i] ? 1 : 0;\n    if (T.real) for (let i = 0; i < N; i++) if (P[i].rwrail && railOk(i)) P[i][key] = 1; // (a motorway's steel barriers, all along it: see rwClassOf)\n")
    rep("function parapetAt(T, i, sd) { if (T.pts[i].kerb) return true;", "function parapetAt(T, i, sd) { if (T.pts[i].kerb) return true; if (T.pts[i].rwrail) return false;")
    rep("const lim = (r.np ? r.np.w / 2 : 4) + min; if (r.nd < lim) return null;", "const lim = (r.np ? r.np.w / 2 + (r.np.rwclr || 0) : 4) + min; if (r.nd < lim) return null; if (T.real && rwInTube(T.real, x, z, gY(x, z), 4)) return null; // (by a real tunnel: nothing growing whose crown would reach into its tube)")
    rep("  if (LN && !Wl && T.surface !== 'snow' && !(T.sss && T.sss.kind !== 'street')) { // (an arena's lanes are not painted)",
        "  if ((LN || T.real) && (!Wl || (T.real && !T.rwSnow)) && T.surface !== 'snow' && !(T.sss && T.sss.kind !== 'street')) { // (an arena's lanes are not painted; a real road's as its class and lanes have them, in winter too unless it lies under snow: see rwPaint)")
    rep("ok = r.surf === 'tarmac' && !r.wall && p.tag !== 'ring'", "ok = r.surf === 'tarmac' && (!r.wall || T.real) && p.tag !== 'ring'")
    rep("        if (!ok) { run = -1; continue; } const lat = typeof lat0 === 'number' ? lat0 : lat0(r), o = pos.length / 3;",
        "        if (!ok) { run = -1; continue; } const lat = typeof lat0 === 'number' ? lat0 : lat0(r); if (lat == null) { run = -1; continue; } const o = pos.length / 3;")
    rep("    if (LN.edge) for (const sd of [-1, 1]) add(r => sd * (r.w / 2 - 0.3), 0.12, false, 4.4);\n    if (LN.centre) add(0, 0.12, LN.centre === 'dash', 5.0);\n",
        "    if (T.real) rwPaint(T, P, LN, add); else {\n    if (LN.edge) for (const sd of [-1, 1]) add(r => sd * (r.w / 2 - 0.3), 0.12, false, 4.4);\n    if (LN.centre) add(0, 0.12, LN.centre === 'dash', 5.0); }\n")

    # ---- a real bridge's piers as far apart as a viaduct's spans (some 40 m on a long one), not every 18 m (rwPierStep) ----
    rep("      for (let i = f.s0 + 4; i < f.s1 - 2; i += 9) boxes.push({ i, q: boxQ(i, 0, deck, 1.4), top: pts[i].y - 0.9, bot: -1e4, kind: 'pier' });",
        "      for (let i = f.s0 + 4; i < f.s1 - 2; i += f.rw ? rwPierStep(f) : 9) boxes.push({ i, q: boxQ(i, 0, deck, 1.4), top: pts[i].y - 0.9, bot: -1e4, kind: 'pier' });")
    rep("      for (let i = f.s0 + 4; i < f.s1 - 2; i += 9) { const p = P[i]; let floor = Infinity;", "      for (let i = f.s0 + 4; i < f.s1 - 2; i += f.rw ? rwPierStep(f) : 9) { const p = P[i]; let floor = Infinity;")

    # ---- Race Friends on real roads (see rw_mp.js): the host's choice of a real course, kept in the race's settings
    # (co 'rw', rw), its stage laid out from the course on every page, nobody ready or started before it is laid out,
    # the course sent from page to page over the race server's signals. A new version: a page of the last one, which
    # knows no real course, races nobody of this one ----
    rep("const MP_V = 6, MP_MAX = 8", "const MP_V = 7, MP_MAX = 8")
    rep("fm: 'side', cr: 'own', cc: '', hs: 0, sr: 1, tt: 0, ns: 0, sc: 0, ev: 1, cs: null, dl: null, tg: null, ko: [], sn: 1, pt: {}, tp: [0, 0], sx: 0, lr: null, pl: {}, co: '', lp: 5, gd: null }; },",
        "fm: 'side', cr: 'own', cc: '', hs: 0, sr: 1, tt: 0, ns: 0, sc: 0, ev: 1, cs: null, dl: null, tg: null, ko: [], sn: 1, pt: {}, tp: [0, 0], sx: 0, lr: null, pl: {}, co: '', lp: 5, gd: null, rw: null }; },")
    rep("co: c.co === 'rx' ? 'rx' : '', lp: [3, 4, 5, 6, 8].includes(c.lp) ? c.lp : 5,",
        "co: c.co === 'rx' ? 'rx' : c.co === 'rw' && MPRW.check(c.rw) ? 'rw' : '', rw: c.co === 'rw' ? MPRW.check(c.rw) : null, lp: [3, 4, 5, 6, 8].includes(c.lp) ? c.lp : 5,")
    rep("  stage() {\n    const c = this.cfg; if (!c || this.phase === 'race') return;\n    const key = c.sd + '|' + c.ty + '|' + (c.co === 'rx' ? 'rx' : c.wd);\n    if (key !== this.stageKey || !G.T || !G.T.mpKey) {",
        "  stage() {\n    const c = this.cfg; if (!c || this.phase === 'race') return;\n    if (c.co === 'rw') { if (!MPRW.stage(this, c)) { if (this.rdy && !this.host) { this.rdy = 0; this.pub({ rdy: 0 }); } this.render(); return; } } else { MPRW.say('');\n    const key = c.sd + '|' + c.ty + '|' + (c.co === 'rx' ? 'rx' : c.wd);\n    if (key !== this.stageKey || !G.T || !G.T.mpKey) {")
    rep("      G.T = T; buildStage(T); G.fly = 0; if (Skids.geo) Skids.clear(); this.stageKey = key;\n    }\n    const T = G.T; T.rallyCond = this.condFor(T, c);",
        "      G.T = T; buildStage(T); G.fly = 0; if (Skids.geo) Skids.clear(); this.stageKey = key;\n    } }\n    const T = G.T; T.rallyCond = this.condFor(T, c);")
    rep("    if (this.slot < 0) { this.phase = 'watch'; this.render(); return; } // (not on this grid: the next race)",
        "    if (this.slot < 0 || (c.co === 'rw' && !MPRW.ready(c))) { this.phase = 'watch'; this.render(); return; } // (not on this grid, or the course not laid out here yet: the next race)")
    rep("    if (this.host) { if (this.cfg && this.cfg.ph === 'race') this.endRace(); else this.start(); return; }",
        "    if (this.host) { if (this.cfg && this.cfg.ph === 'race') this.endRace(); else if (!(this.cfg && this.cfg.co === 'rw') || MPRW.ready(this.cfg)) this.start(); return; }\n    if (!this.rdy && this.cfg && this.cfg.co === 'rw' && !MPRW.ready(this.cfg)) return; // (not ready before the course is laid out here)")
    rep("    else { go.textContent = this.rdy ? 'Ready ✓ (tap to undo)' : racing ? 'Ready for the next race' : 'Ready'; go.disabled = false; }",
        "    else { go.textContent = this.rdy ? 'Ready ✓ (tap to undo)' : racing ? 'Ready for the next race' : 'Ready'; go.disabled = false; }\n    if (c && c.co === 'rw' && !MPRW.ready(c) && !(this.host && racing)) { go.textContent = I18N.say(MPRW.lost && MPRW.lost === MPRW.keyOf(c.rw) ? 'Course not on this page' : 'Getting the course…'); go.disabled = !this.rdy; }")
    rep("    on('#mp_co0', 'click', () => this.setCfg({ co: '' })); on('#mp_co1', 'click', () => this.setCfg({ co: 'rx', fm: 'side' }));",
        "    on('#mp_co0', 'click', () => this.setCfg({ co: '' })); on('#mp_co1', 'click', () => this.setCfg({ co: 'rx', fm: 'side' }));\n    on('#mp_co2', 'click', () => { const e = $('#mpRw'); MPRW.pick(this, e && e.value ? e.value : 'p:' + RW_PRESETS[0].id); }); on('#mpRw', 'change', e => MPRW.pick(this, e.target.value));")
    rep("      { const rx = c.co === 'rx'; for (const [id, on] of [['#mp_co0', !rx], ['#mp_co1', rx]]) { const b = $(id); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); }",
        "      { const rx = c.co === 'rx', rwc = c.co === 'rw'; for (const [id, on] of [['#mp_co0', !rx && !rwc], ['#mp_co1', rx], ['#mp_co2', rwc]]) { const b = $(id); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); }\n        { const row = $('#mpRwRow'); if (row) row.hidden = !rwc; for (const id of ['#mpTy', '#mpSd']) { const e = $(id), l = e && e.closest('label'); if (l) l.hidden = rwc; } const sel = $('#mpRw'); if (sel) { sel.disabled = !this.host || c.ph === 'race'; if (rwc && !sel.dataset.fill) { sel.dataset.fill = '1'; MPRW.options().then(L => { sel.textContent = ''; for (const o of L) sel.append(mel('option', { value: o.v, text: o.t })); sel.dataset.fill = ''; if (this.cfg && this.cfg.rw) sel.value = this.cfg.rw.p ? 'p:' + this.cfg.rw.p : 'c:' + this.cfg.rw.c; if (sel.value === '' && this.cfg && this.cfg.rw && !this.cfg.rw.p) { sel.append(mel('option', { value: 'c:' + this.cfg.rw.c, text: this.cfg.rw.n || I18N.say('Real road') })); sel.value = 'c:' + this.cfg.rw.c; } }); } } }")
    rep("        for (const [id, show] of [['#mpLapRow', rx], ['#mpRoadRow', !rx], ['#mpFmRow', !rx]]) { const e = $(id); if (e) e.hidden = !show; } } // (a rallycross race: laps, side by side, its own track)",
        "        for (const [id, show] of [['#mpLapRow', rx || (rwc && MPRW.kindOf(c.rw) === 'loop')], ['#mpRoadRow', !rx && !rwc], ['#mpFmRow', !rx]]) { const e = $(id); if (e) e.hidden = !show; } } // (a rallycross race: laps, side by side, its own track; a real course's road as it is, a real circuit's laps)")
    rep("          $('#mpFacts').textContent = [T.loop ? `Rallycross circuit, ${c.lp} laps of ${km} km, a joker lane to take once` : T.type.name,",
        "          $('#mpFacts').textContent = [T.real ? `${T.label || I18N.say('Real road')} · ${I18N.say(RW_KIND[T.rwKind] || 'Real road')}` + (T.rwLaps ? ` · ${I18N.say(T.rwLaps === 1 ? 'Circuit, 1 lap' : 'Circuit, {0} laps', T.rwLaps)}` : '') : T.loop ? `Rallycross circuit, ${c.lp} laps of ${km} km, a joker lane to take once` : T.type.name,")
    rep("if (g.signal && g.signal.on && typeof RTCPeerConnection !== 'undefined') this.p2pOpen(g);", "if (g.signal && g.signal.on && typeof RTCPeerConnection !== 'undefined') this.p2pOpen(g); MPRW.attach(this, g); // (the course sent from page to page: see MPRW)")
    rep("  async leave(quiet) {\n    const g = this.game; if (!g) return;", "  async leave(quiet) {\n    const g = this.game; if (!g) return; MPRW.detach();")
    rep('        <div class="mpopt"><span>Course</span><div class="assist"><button id="mp_co0" type="button">Stage</button><button id="mp_co1" type="button">Rallycross</button></div></div>',
        '        <div class="mpopt"><span>Course</span><div class="assist"><button id="mp_co0" type="button">Stage</button><button id="mp_co1" type="button">Rallycross</button><button id="mp_co2" type="button">Real road</button></div></div>\n        <div class="mpopt" id="mpRwRow" hidden><span>Real course</span><select id="mpRw" aria-label="Real course"></select></div>\n        <p id="mpRwNote" class="small" role="status" hidden></p>')

    # ---- loose props (found testing real roads; the game's own, on any stage): a sign's face torn off its post was put
    # back, on a new run, as a solid of its own with no size (its post holds it: it never was one), which a car or a prop
    # in flight then met with no size at all - an invisible push, or a car's motion lost to numbers that are not numbers.
    # A prop goes back among the solids only if it was one; a solid with no size given is as big as its shape; and a blow,
    # a prop or a contact that comes out not a number is left out rather than passed on ----
    rep("  const L = T.colAt[s.i], k = L ? L.indexOf(s) : -1; if (k >= 0) L.splice(k, 1);\n  const g = rockBaseY(T, s); let y;",
        "  const L = T.colAt[s.i], k = L ? L.indexOf(s) : -1; if (k >= 0) L.splice(k, 1); if (s.inCol == null) s.inCol = k >= 0; // (whether it stood among the solids: see resetStones)\n  const g = rockBaseY(T, s); let y;")
    rep("s.lift = h.lift; s.att = h.att;\n    (T.colAt[s.i] || (T.colAt[s.i] = [])).push(s);",
        "s.lift = h.lift; s.att = h.att;\n    if (s.inCol !== false) (T.colAt[s.i] || (T.colAt[s.i] = [])).push(s); // (one that never was a solid of its own - a sign's face, held by its post - is not made one)")
    rep("  return col._sol = [{ x: col.x, z: col.z, R: col.r, top: col.top != null ? col.top : Infinity, col }]; // (a tree or post; the end of a wall or board, as high as it is)",
        "  return col._sol = [{ x: col.x, z: col.z, R: col.r != null ? col.r : col.shp ? Math.max(col.hx || 0, col.hz || 0, 0.05) : 0.3, top: col.top != null ? col.top : Infinity, col }]; // (a tree or post; the end of a wall or board, as high as it is; a shape with no size given, as big as its shape)")
    rep("const dx = f.x - o.x, dz = f.z - o.z, d = Math.hypot(dx, dz), pen = r1 + o.R - d; if (pen <= 0 || d < 1e-4) continue;",
        "const dx = f.x - o.x, dz = f.z - o.z, d = Math.hypot(dx, dz), pen = r1 + o.R - d; if (!(pen > 0) || d < 1e-4) continue;")
    rep("if (!f || s.gone || (!s.shp && s.m < STONE_FLICK) || Math.abs(f.x - Px) > 6 || Math.abs(f.z - Pz) > 6 || Math.abs(f.y - Py) > 4) continue;",
        "if (!f || s.gone || (!s.shp && s.m < STONE_FLICK) || !(Math.abs(f.x - Px) <= 6) || !(Math.abs(f.z - Pz) <= 6) || !(Math.abs(f.y - Py) <= 4)) continue;")
    rep("  bodySolids(c, S, T, M, hits); bodyCars(c, S, M, hits); hedgeDrag(c, S, T, M, dt);\n  if (!hits.length) return hits;",
        "  bodySolids(c, S, T, M, hits); bodyCars(c, S, M, hits); hedgeDrag(c, S, T, M, dt);\n  for (let k = hits.length - 1; k >= 0; k--) { const h = hits[k], n = h.n, r = h.r; if (!(n[0] === n[0] && n[1] === n[1] && n[2] === n[2] && r[0] === r[0] && r[1] === r[1] && r[2] === r[2] && h.pen === h.pen)) hits.splice(k, 1); } // (a contact that is not a number: no blow from it)\n  if (!hits.length) return hits;")
    rep("    const s = L[k], f = s.fly; if (!f || s.gone) { L.splice(k, 1); continue; } const q = f.q, MT = s.mat ? PROP_MAT[s.mat] : null;",
        "    const s = L[k], f = s.fly; if (!f || s.gone) { L.splice(k, 1); continue; } const q = f.q, MT = s.mat ? PROP_MAT[s.mat] : null;\n    for (let j = 0; j < 3; j++) { if (!(f.v[j] === f.v[j])) f.v[j] = 0; if (!(f.w[j] === f.w[j])) f.w[j] = 0; } if (!(f.x === f.x && f.y === f.y && f.z === f.z && q[0] === q[0] && q[1] === q[1] && q[2] === q[2] && q[3] === q[3])) { s.gone = true; L.splice(k, 1); continue; } // (a prop whose motion is not a number: dropped, not passed on)")

    # ---- a real tunnel's cover: on once the road's heights are settled (see rwTuCover) ----
    rep("  if (LOOP) pts[0].y = pts[N - 1].y = (pts[0].y + pts[N - 1].y) / 2; // (a loop's last point is its first)",
        "  if (RWP && RWP.pack._tu) RWP.pack._tu.on = true; // (a real tunnel's cover over it, now that the road's heights are known: see rwTuCover)\n  if (LOOP) pts[0].y = pts[N - 1].y = (pts[0].y + pts[N - 1].y) / 2; // (a loop's last point is its first)")

    # ---- the far country by the sea: a real course's sea as wide a sweep of the horizon as the map's, with no islands made up in it ----
    rep("seaW = rr(0.95, 1.4), dAz = (a, b) =>", "seaW = (w => T.land && T.land.sea && T.land.sea.w || w)(rr(0.95, 1.4)), dAz = (a, b) =>")
    rep("  if (F.isl && seaAz != null) {", "  if (F.isl && seaAz != null && !T.real) {")

    # ---- the page: the tab's words in each language (rw_i18n), before the extra words are merged in ----
    rep("for (const l in I18N_MORE) if (l !== 'k' && typeof I18N_DATA !== 'undefined' && I18N_DATA[l]) I18N_MORE.k.forEach((k, i) => { I18N_DATA[l][k] = I18N_MORE[l][i]; });", T46('rw_i18n.js') + "\nfor (const l in I18N_MORE) if (l !== 'k' && typeof I18N_DATA !== 'undefined' && I18N_DATA[l]) I18N_MORE.k.forEach((k, i) => { I18N_DATA[l][k] = I18N_MORE[l][i]; });")
    # ---- the page: the map's data (rw_net) ----
    rep("const RXUI = {\n", T46('rw_net.js') + "\n" + T46('rw_page.js') + "\n" + T46('rw_draw.js') + "\n" + T46('rw_ui.js') + "\n" + T46('rw_mp.js') + "\n" + ("window.SR86_ARTIFACT = true;\n" if art else "") + "const RXUI = {\n")
    open(path, 'w', encoding='utf-8').write(s)
    print(path, 'ok', n_ok, 'replacements')
if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3], len(sys.argv) > 4 and sys.argv[4] == 'art')
