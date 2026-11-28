# Round 49: a circuit laid as circuits are built (its track as wide as the map or FIA Appendix O has it, not a lane;
# its white lines at its edges, its verge bands and kerbs, its run-off's grass to its guard rails, its gravel beds and
# paved run-off as the map has them, its heights as fine as the land's survey has them), every real road's width
# changing over a taper as roads do (a lane added or taken away over the length its speed wants), and the road's own
# crossfall where the land's model is a survey's (else as roads and circuits are designed). Applied to the round 48
# builds. Each replacement must match exactly the stated number of times.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
T49 = lambda f: open(os.path.join(HERE, 't49', f), encoding='utf-8').read()
def patch(path, stamp_old, stamp_new):
    s = open(path, encoding='utf-8').read()
    n_ok = 0
    def rep(old, new, n=1):
        nonlocal s, n_ok
        c = s.count(old)
        if c != n: raise SystemExit(f'{path}: expected {n} of {old[:90]!r}, found {c}')
        s = s.replace(old, new); n_ok += 1
    def cut(start, end, new):
        nonlocal s, n_ok
        a = s.find(start)
        if a < 0 or s.count(start) != 1: raise SystemExit(f'{path}: cut start {start[:80]!r} found {s.count(start)}')
        b = s.find(end, a)
        if b < 0: raise SystemExit(f'{path}: cut end {end[:80]!r} not found')
        s = s[:a] + new + s[b:]; n_ok += 1
    rep(f"const SR86_BUILD = '{stamp_old}';", f"const SR86_BUILD = '{stamp_new}';")
    # (pages that lay real roads and circuits the new way race only each other)
    rep("const MP_V = 9,", "const MP_V = 10,")
    # ---- the widths' easing, a point's class and the circuits' own (rw_race) in place of round 46's easing ----
    cut("// The map's widths along the laid line, eased: a narrower stretch", "// A there-and-back's turn at its far end",
        "// (a point's lanes and class, as its markings, barriers, verge and roughness want them: rwln lanes, rwone one way, rwlw\n"
        "// the lanes' painted width (within the road as wide as it is drawn; wl: as eased along the road, see rwLayout),\n"
        "// rwrail steel barriers, rwq smoothness, rwclr verge; on a circuit rwro, its run-off's grass out to its rail)\n"
        "function rwPtClass(t, narrow, w, wl) { const L = rwLanesOf(t, narrow), C = rwClassOf(t), o = { rwln: L.n, rwone: L.one ? 1 : 0, rwlw: Math.min(w, wl == null ? L.W : wl), rwrail: C.rail, rwq: C.q, rwclr: C.clr }; if (C.ro) o.rwro = C.ro; return o; }\n"
        + T49('rw_race.js') + "\n")
    # ---- a circuit's width: its track and verge bands, never a lane ----
    rep("function rwWidthOf(t, narrow) {\n  const w = parseFloat(String(t.width || t['width:carriageway'] || '').replace(',', '.'));",
        "function rwWidthOf(t, narrow) {\n  if ((t.highway || '') === 'raceway') return clamp(rwRaceW(t) + 2 * rwVB(), 6, 42); // (a circuit's track and its verge bands: see rw_race)\n"
        "  const w = parseFloat(String(t.width || t['width:carriageway'] || '').replace(',', '.'));")
    rep("function rwLanesOf(t, narrow) {\n",
        "function rwLanesOf(t, narrow) {\n  if ((t.highway || '') === 'raceway') return { n: 1, W: rwRaceW(t), one: true }; // (a circuit's track: one surface, whichever way the map runs it)\n")
    rep("  if (hw === 'motorway') return link ?",
        "  if (hw === 'raceway') { const W = rwRaceW(t); return { sh: rwVB(), rail: 0, q: 0.15, clr: rwRaceRo(W) + 2.5, ro: rwRaceRo(W) }; } // (a circuit: its verge bands, smooth, its run-off cleared)\n"
        "  if (hw === 'motorway') return link ?")
    # ---- the layout: the painted width eased as the road's is; a circuit's rails ----
    rep("const n = CL.n, pts = K.pts, Ws = rwEaseW(CL, tagsAt, wAt, closed);",
        "const n = CL.n, pts = K.pts, Ws = rwEaseW(CL, tagsAt, wAt, closed), Wl = rwEaseW(CL, tagsAt, v => Math.min(wAt(v), rwLanesOf(tagsAt(v), narrow).W), closed);")
    rep("...rwPtClass(t, narrow, Ws[m]) }; };", "...rwPtClass(t, narrow, Ws[m], Wl[m]) }; };")
    rep("  return { CL, kind, iA, iB, cN, ctl, cctl, rng, run, turn };",
        "  rwRaceRails({ pack: C, pts, cN }); // (a circuit's guard rails where the map has none: see rw_race)\n"
        "  return { CL, kind, iA, iB, cN, ctl, cctl, rng, run, turn };")
    # ---- a circuit's heights: as fine as the land's survey has them (its crests, its 17 % climbs) ----
    rep("V0.push(RW_VC[hw] || RW_VC.road); }",
        "V0.push(hw === 'raceway' ? ((C.xz || 0) >= 0.5 ? RW_VC_RACE : RW_VC.raceway) : RW_VC[hw] || RW_VC.road); }")
    rep("raceway: [190, 0.12, 300],", "raceway: [150, 0.18, 200],")
    rep("const RW_VC = {",
        "// (a circuit where the land's model is a survey's: its own short crests and its steepest climbs kept - the Nordschleife\n"
        "// climbs 17 % - smoothing only the model's noise; where the model is the 30 m global one, RW_VC.raceway)\n"
        "const RW_VC_RACE = [60, 0.2, 70];\nconst RW_VC = {")
    # ---- a circuit's lines: its white lines at its edges, no lanes ----
    rep("if (p.rwturn) { F[i] = 1; B[i] = 1; No[i] = 1; continue; } // (the turning place: no lines)",
        "if (p.rwturn) { F[i] = 1; B[i] = 1; No[i] = 1; continue; } // (the turning place: no lines)\n"
        "    if (p.rwhw === 'raceway') { F[i] = 1; B[i] = 0; One[i] = 1; No[i] = 0; Spd[i] = 250; continue; } // (a circuit's track: one surface - its white lines at its edges, see rwPaint)")
    rep("for (let i = 0; i < N; i++) { const p = P[i]; if (!lineOK(i)) continue; const Lo = rwLaneLayout(p, Rg),",
        "for (let i = 0; i < N; i++) { const p = P[i];\n"
        "    // (a circuit: continuous white lines, 13 cm, at the track's edges - FIA Appendix O 7.6 - broken only across a junction's mouth)\n"
        "    if (p.rwhw === 'raceway') { if ((p.surf === 'tarmac' || p.surf === 'concrete') && !p.rwturn) { const hw = Math.max(1.5, Math.min(p.rwlw || p.w, p.w) / 2); for (const sd of [-1, 1]) if (!mouth[sd > 0 ? 0 : 1][i]) put(sd > 0 ? 'EL' : 'ER', i, sd * (hw - 0.065), 's', 0, 0.13); } continue; }\n"
        "    if (!lineOK(i)) continue; const Lo = rwLaneLayout(p, Rg),")
    rep("  if (!lines.length) return;\n  const at = s =>",
        "  if (hw0 === 'raceway' && w > 2 * RW_VB + 3) { const e = w / 2 - RW_VB - 0.065; lines.push([-e, 's', 0], [e, 's', 0]); } // (another circuit's track: its white lines)\n"
        "  if (!lines.length) return;\n  const at = s =>")
    # ---- the pack builder: which source a tile is from; the map's paved areas and gravel beds; the measured crossfall ----
    rep("out = { z: zz, x: x >> sh, y: y >> sh, n: d.n, h: d.h }; break;", "out = { z: zz, x: x >> sh, y: y >> sh, n: d.n, h: d.h, s: S }; break;")
    rep("way[highway](${bb});", "way[highway](${bb});way[\"area:highway\"](${bb});")
    rep("if (/^(bare_rock|scree|shingle|stone|rock|blockfield)$/.test(na)) return 'rock';",
        "if (na === 'shingle' || /gravel.?trap/.test(t.raceway || '')) return 'gravel'; if (/^(bare_rock|scree|stone|rock|blockfield)$/.test(na)) return 'rock';")
    rep("if (/^(parking|fuel|marketplace)$/.test(t.amenity || '') || (t.area === 'yes' && t.highway)",
        "if (t['area:highway'] || /^(parking|fuel|marketplace)$/.test(t.amenity || '') || (t.area === 'yes' && t.highway)")
    rep("  let dA = 0; for (let k = 1; k <= R.a; k++) dA += Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1]);",
        "  const XSF = await rwCrossFall(F, RX, RZ, ways, segW, zN); // (the road's fall across it, measured where the land's model is a survey's: see rw_race)\n"
        "  let dA = 0; for (let k = 1; k <= R.a; k++) dA += Math.hypot(RX[k] - RX[k - 1], RZ[k] - RZ[k - 1]);")
    rep("ways, jn, cc, prof: new Float32Array", "ways, jn, cc, xs: XSF.xs, xd: XSF.xd, xz: XSF.xz, prof: new Float32Array")
    rep(".concat(RW_TAGS48)", ".concat(RW_TAGS48, ['raceway', 'sport', 'est_width'])")
    # ---- a new kind of land: a gravel bed (a circuit's, a river's shingle) ----
    rep("'yard', 'quarry'];", "'yard', 'quarry', 'gravel'];")
    rep("const RWLC_TC = [0, 0.95, 0.42, 0.06, -1, -1, 0.6, -1, 0.12, -1, -1, -1, 0.05, -1, -1, -1, 0.35, 0.1, -1];",
        "const RWLC_TC = [0, 0.95, 0.42, 0.06, -1, -1, 0.6, -1, 0.12, -1, -1, -1, 0.05, -1, -1, -1, 0.35, 0.1, -1, -1];")
    rep("'village', 'farm', 'open'];", "'village', 'farm', 'open', 'open'];")
    rep("const RWLC_NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1];", "const RWLC_NONE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1];")
    rep("quarry: 7, town: 7,", "quarry: 7, gravel: 7, town: 7,")
    rep("quarry: C('#a39b8c'), water: C('#5f6a62') };", "quarry: C('#a39b8c'), water: C('#5f6a62'), gravel: C('#b3a893') };")
    rep("quarry: 0.8, sand: 0.8,", "quarry: 0.8, gravel: 0.9, sand: 0.8,")
    rep("k === 'sand' || k === 'quarry' || k === 'vineyard' ? 0.6 : 0.25, k === 'paved' || k === 'works' || k === 'quarry' || k === 'yard' ? 0.6 : 0.15",
        "k === 'sand' || k === 'quarry' || k === 'vineyard' || k === 'gravel' ? 0.6 : 0.25, k === 'paved' || k === 'works' || k === 'quarry' || k === 'yard' || k === 'gravel' ? 0.6 : 0.15")
    # ---- the stage: a circuit's roadside (its run-off level to its rail, no ditch, no crown, no stones) ----
    rep("/* (a town's wider, with room behind its super special's blocks) */ p.shS = 0; p.dd = 0; p.bh = 0; }\n  }\n  const bank = ",
        "/* (a town's wider, with room behind its super special's blocks) */ p.shS = 0; p.dd = 0; p.bh = 0; }\n"
        "    if (p.rwro) { p.sh = p.rwro + 0.6; p.shS = 0.02; p.dd = 0; p.dw = 0.5; p.dt = 0; p.bh = 0; p.kerb = 0; p.kf = Math.min(p.kf, 0.3); } // (a circuit: its run-off's grass level to its rail, no ditch - FIA Appendix O 7.6; see rw_race)\n"
        "  }\n  const bank = ")
    rep("if (blocked.has(q.tag) || q.wall || q.kerb) return null;", "if (blocked.has(q.tag) || q.wall || q.kerb || q.rwro) return null;")
    # ---- the crossfall: a real road's as measured, else as designed (rwBankRaw); a circuit's to 25 % ----
    rep("      raw[i] = clamp(XF.k * kav[i], -XF.max, XF.max) - XF.land * (p.kerb ? 0.3 : 1) * clamp(fall, -0.15, 0.15) + (p.kerb ? 0.3 : 1) * adv[i] + XF.wand * 2 * (vnoise(i * STEP / 90, 3.7, nseed + 211) - 0.5); }",
        "      raw[i] = clamp(XF.k * kav[i], -XF.max, XF.max) - XF.land * (p.kerb ? 0.3 : 1) * clamp(fall, -0.15, 0.15) + (p.kerb ? 0.3 : 1) * adv[i] + XF.wand * 2 * (vnoise(i * STEP / 90, 3.7, nseed + 211) - 0.5); }\n"
        "    if (RWL) rwBankRaw({ pack: RWP.pack, CL: RWL.CL, pts, N, kav, raw }); // (a real road's own: measured where the land's model has it, else as designed - see rw_race)")
    rep("    for (let i = 0; i < N; i++) { let sm = 0, wt = 0; for (let j = Math.max(0, i - 12); j <= Math.min(N - 1, i + 12); j++) { const q = 13 - Math.abs(j - i); sm += raw[j] * q; wt += q; } bank[i] = flat(pts[i]) ? 0 : clamp(sm / wt, -0.1, 0.1); }",
        "    for (let i = 0; i < N; i++) { const rr = RWL && pts[i].rwxs ? 6 : 12; let sm = 0, wt = 0; for (let j = Math.max(0, i - rr); j <= Math.min(N - 1, i + rr); j++) { const q = rr + 1 - Math.abs(j - i); sm += raw[j] * q; wt += q; } const bx = RWL ? rwBankMax(pts[i]) : 0.1; bank[i] = flat(pts[i]) ? 0 : clamp(sm / wt, -bx, bx); }")
    rep("crown[i] = p.surf === 'ice' ? 0 : (sealed ?", "crown[i] = p.surf === 'ice' || p.rwro ? 0 : (sealed ?")
    # ---- a circuit's guard rails, at its run-off's back ----
    rep("if (T.real) for (let i = 0; i < N; i++) if (P[i].rwrail && railOk(i)) P[i][key] = 1;",
        "if (T.real) for (let i = 0; i < N; i++) if ((P[i].rwrail || (P[i].rwrb && P[i].rwrb[T.alf && T.alf[i] < 0 ? 1 - sd : sd])) && railOk(i)) P[i][key] = 1;")
    rep("function railLat(T, p) { const U = (T.xs || { railU: 0.5 }).railU; return p.w / 2 +",
        "function railLat(T, p) { if (p.rwro) return p.w / 2 + p.rwro; const U = (T.xs || { railU: 0.5 }).railU; return p.w / 2 +")
    rep("if (T.pts[i].rwrail) return false;", "if (T.pts[i].rwrail || T.pts[i].rwro) return false;")
    # ---- the kerbs: felt, drawn, and their paint under the tyres; a gravel bed's deep loose gravel ----
    rep("function roadSurfY(T, s, lat, w, sm) { return roadYAt(T, s) - bankAt(T, s) * lat + roadBump(T, s, lat, w, sm); }",
        "function roadSurfY(T, s, lat, w, sm) { return roadYAt(T, s) - bankAt(T, s) * lat + roadBump(T, s, lat, w, sm) + (T.rwKb ? rwKerbY(T, s, lat, sm) : 0); }")
    rep("  out.wet = T.wet || 0; out.pool = 0; out.trk = 0;\n",
        "  out.wet = T.wet || 0; out.pool = 0; out.trk = 0;\n"
        "  if (base === 'trap') { add('loose', 0.5); add('powder', 0.35); add('gravel', 1); let b = 0; for (let j = 1; j < out.n; j++) if (Wt[j] > Wt[b]) b = j; out.main = K[b]; return out; } // (a circuit's gravel bed: deep loose gravel the tyres plough - see rwOffSurf)\n"
        "  if (on && T.rwKb && rwKerbOn(T, dist, lat)) { if (T.lay) { layerAt(T, dist, lat, w, _layV); out.wet = clamp(_layV[L_WET], 0, 1); } add('paint', 1); out.main = 'paint'; return out; } // (a circuit's kerb: painted concrete, slippery when wet)\n")
    rep("T.surface === 'snow' ? (verge && !info.wall ? 'snow' : 'snowbank') : verge && !info.wall ? 'gravel' : 'grass';",
        "T.surface === 'snow' ? (verge && !info.wall ? 'snow' : 'snowbank') : T.real ? rwOffSurf(T, q0x, q0z, wp, verge && !info.wall) : verge && !info.wall ? 'gravel' : 'grass';")
    rep("    if (T.real) rwPaint(T, P, LN, add, rows, G); else {",
        "    if (T.real) { rwPaint(T, P, LN, add, rows, G); if (T.rwKb) rwKerbMesh(T, P, rows, G); } else {")
    rep("  T.length = (T.finishIdx - T.startIdx) * STEP; return T;",
        "  rwKerbs(T); // (a circuit's kerbs: see rw_race)\n  T.length = (T.finishIdx - T.startIdx) * STEP; return T;")
    # ---- a circuit's track drawn as one: an even asphalt (no repairs, scarcely a crack), no dirt dragged across its bends,
    # its run-off's grass ----
    rep("if (p.wall || p.tag === 'bridge' || p.tag === 'narrows' || p.tag === 'ring' || p.tag === 'rbt' || kk < 1 / 90) continue;",
        "if (p.wall || p.tag === 'bridge' || p.tag === 'narrows' || p.tag === 'ring' || p.tag === 'rbt' || p.rwro || kk < 1 / 90) continue; // (a circuit's bends: kerbs inside them, nothing to drag)")
    rep("const mats = kinds.map((k, ki) => { const m = new THREE.MeshPhongMaterial({ map: roadTex(k, E, !rows.some(r => r.surf === k)),",
        "const mats = kinds.map((k, ki) => { const m = new THREE.MeshPhongMaterial({ map: roadTex(k, T.rwKb && k === 'tarmac' ? Object.assign({}, E, { race: 1 }) : E, !rows.some(r => r.surf === k)),")
    rep("const pal = E && (kind === 'gravel' ? E.gravel : kind === 'tarmac' ? E.tarmac : null), key = kind + (pal ? ':' + pal[0] : '');",
        "const pal = E && (kind === 'gravel' ? E.gravel : kind === 'tarmac' ? E.tarmac : null), key = kind + (pal ? ':' + pal[0] : '') + (E && E.race ? ':race' : '');")
    rep("function roadTexHi(kind, pal, key) {\n", "function roadTexHi(kind, pal, key) {\n  const race = /:race/.test(key); // (a circuit's track: an even surface, no repairs, scarcely a crack - see rw_race)\n")
    rep("const o = (y * W + x) * 4, tw = trackW(x / W, y), r = R(); let s = 0, hh = 110;", "const o = (y * W + x) * 4, tw = race ? 0 : trackW(x / W, y), r = R(); let s = 0, hh = 110;")
    rep("    // (patches of repair: newer and darker or older and paler, with their dark seams)\n    for (let q = 0; q < 5; q++) {",
        "    // (patches of repair: newer and darker or older and paler, with their dark seams)\n    for (let q = 0; q < (race ? 0 : 5); q++) {")
    rep("    // (cracks: wandering lines, most near the edges, some branching)\n    for (let q = 0; q < 70; q++) {",
        "    // (cracks: wandering lines, most near the edges, some branching)\n    for (let q = 0; q < (race ? 6 : 70); q++) {")
    rep("    // (the edges broken and dusty)\n    for (let y = 0; y < H; y += 3) for (const s of [0, 1]) {",
        "    // (the edges broken and dusty)\n    if (!race) for (let y = 0; y < H; y += 3) for (const s of [0, 1]) {")
    rep("        else if (c <= 1) col.copy(shc).multiplyScalar(c === 0 ? 0.88 : 0.96);",
        "        else if (p.rwro && c >= 1) landCol(col, x, z, 0, y); // (a circuit's run-off: the land as the map has it there - its grass, its gravel bed, its paving)\n"
        "        else if (c <= 1) col.copy(shc).multiplyScalar(c === 0 ? 0.88 : 0.96);")
    # ---- a circuit kept as wide as its track where a building stands close (a pit building, a grandstand) ----
    rep("if (ln >= 2 && p.w > 4.2) minW[i] = Math.min(p.w, Math.max(3.6, p.w * 0.85)); }",
        "if (ln >= 2 && p.w > 4.2) minW[i] = Math.min(p.w, Math.max(3.6, p.w * 0.85)); if (p.rwhw === 'raceway') minW[i] = Math.min(p.w, Math.max(minW[i], p.rwlw || 0)); }")
    # ---- the route along a circuit: its private access no reason to leave it (a circuit's ways are private as a rule), a
    # little cheaper than the roads beside it, its pit lanes dearer (a lap does not go through the pits) ----
    rep("raceway: 1.0, busway: 1.6, escape: 2.5 }", "raceway: 0.9, busway: 1.6, escape: 2.5 }")
    rep("* (/^(no|private)$/.test(acc) ? 1.7 :",
        "* (hw === 'raceway' && (/pit/i.test(t.raceway || '') || /\\bpit|boxengasse|피트|ピット/i.test(t.name || '')) ? 4 : 1) * (/^(no|private)$/.test(acc) && hw !== 'raceway' ? 1.7 :")
    # ---- a street circuit's raceway pieces (RW_SC: see rw_race), set as each course is laid and never while a pack is built;
    # a road narrowed by a house close to it narrowed over a taper too ----
    rep("  const C = K.pack, TY = K.TY, gravelC = RW_GRAVEL.has(TY.id), narrow = RW_NARROW.has(TY.id), snow = K.surface === 'snow'; rwUseRules(C); // (its country's lanes)\n",
        "  const C = K.pack, TY = K.TY, gravelC = RW_GRAVEL.has(TY.id), narrow = RW_NARROW.has(TY.id), snow = K.surface === 'snow'; rwUseRules(C); // (its country's lanes)\n"
        "  RW_SC = rwRaceShare(C) < 0.5; // (a course mostly on public roads: its raceway pieces a street circuit's - see rw_race)\n")
    rep("async function rwBuildPack(spec, prog, lang) {\n", "async function rwBuildPack(spec, prog, lang) {\n  RW_SC = false; // (the map's circuits as circuits: see rw_race)\n")
    rep("  for (let i = 0; i < n; i++) { let r = 99; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) r = Math.min(r, room[j]); if (r < 30) { const w = Math.max(minW[i], 2 * (r - 0.3)); if (w < pts[i].w) pts[i].w = w; } }\n",
        "  for (let i = 0; i < n; i++) { let r = 99; for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) r = Math.min(r, room[j]); if (r < 30) { const w = Math.max(minW[i], 2 * (r - 0.3)); if (w < pts[i].w) pts[i].w = w; } }\n"
        "  { const g = STEP / 12; for (let i = 1; i < n; i++) pts[i].w = Math.min(pts[i].w, pts[i - 1].w + g); for (let i = n - 2; i >= 0; i--) pts[i].w = Math.min(pts[i].w, pts[i + 1].w + g); } // (and eased into, as a lane is shifted: 1 in 12 at the steepest - see rwTaperR)\n")
    # ---- the route along a circuit: the routing service that guides the planner drives no circuit (its track is private),
    # so its guide line runs round it on public roads and the map fetched about that line misses the track - a point far
    # from any road fetched found its own cell's ways, and on a circuit the map fetched along the legs as with no guide ----
    rep("    const snaps = []; for (const p of P) { let s = this.snap(p[0], p[1], RW_SNAP); if (!s && guided) { await this.along(p, p, 1); s = this.snap(p[0], p[1], RW_SNAP); } if (!s) throw Object.assign(new Error('nosnap'), { at: P.indexOf(p) }); snaps.push(s); }\n",
        "    const snapAll = async () => { const out = []; for (const p of P) { let s = this.snap(p[0], p[1], RW_SNAP); if ((!s || s.d > 6) && guided) { await this.along(p, p, 1); s = this.snap(p[0], p[1], RW_SNAP); } if (!s) throw Object.assign(new Error('nosnap'), { at: P.indexOf(p) }); out.push(s); } return out; };\n"
        "    let snaps = await snapAll();\n"
        "    if (guided && snaps.some(s => s.W.t.highway === 'raceway')) { let d2 = 0; for (const [a, b] of legs) { await this.along(a, b, 1, f => prog && prog(0.5 + 0.05 * (d2 + f) / legs.length)); d2++; } snaps = await snapAll(); } // (a circuit: see above)\n")
    # ---- no tractors' mud on a circuit's track ----
    rep("const fw = ZW[i * ZK + 1] + ZW[i * ZK + 6], gate = gateAt(i), farmMud = ", "const fw = p.rwro ? 0 : ZW[i * ZK + 1] + ZW[i * ZK + 6], gate = p.rwro ? 0 : gateAt(i), farmMud = ")
    # ---- a bridge's piers never on the course: where a bridge crosses the course at a shallow angle, the place beside the
    # course its piers would stand at along the bridge can lie on the course itself (now the more, as wide as a circuit is) ----
    rep("    list.push({ kind, li, L, cum, len: cum[cum.length - 1], xs }); });\n  C._ov = { cN, list }; return list;",
        "    const at = s => { let k = 0; while (k < cum.length - 2 && cum[k + 1] < s) k++; const t = clamp((s - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]), 0, 1); return [X[k] + (X[k + 1] - X[k]) * t, Z[k] + (Z[k + 1] - Z[k]) * t]; };\n"
        "    const bw = (kind === 'rail' ? 4.2 : Math.max(3, L.w || 4)) + 1.2, near = (x, z, m) => { let hit = false; K.grid.query(x, z, 40, q => { if (hit || q.r || q.i == null || q.i < 0 || q.i >= cN) return; if (Math.hypot(q.x - x, q.z - z) < pts[q.i].w / 2 + m) hit = true; }); return hit; };\n"
        "    const bad = s => { const [x, z] = at(s), [x2, z2] = at(s + 0.5), h = Math.atan2(x2 - x, z2 - z), lx = Math.cos(h), lz = -Math.sin(h), fx = Math.sin(h), fz = Math.cos(h); if (near(x, z, 2.6)) return true; // (a pier there would stand on the course or at its edge: its middle, or any corner of its footing)\n"
        "      for (const a of [-1, 1]) for (const b of [-1, 1]) if (near(x + lx * a * bw / 2 + fx * b * 0.65, z + lz * a * bw / 2 + fz * b * 0.65, 0.6)) return true; return false; };\n"
        "    list.push({ kind, li, L, cum, len: cum[cum.length - 1], xs, bad }); });\n  C._ov = { cN, list }; return list;")
    rep("const d = (c.w / 2 + 2.2) / Math.max(0.3, c.sin) + 0.7, s = c.s + sd * d; if (s > 1 && s < o.len - 1) out.push({ s, ic: c.ic }); } return out; }",
        "const d = (c.w / 2 + 2.2) / Math.max(0.3, c.sin) + 0.7, s = c.s + sd * d; if (s > 1 && s < o.len - 1 && !(o.bad && o.bad(s))) out.push({ s, ic: c.ic }); } return out; }")
    # ---- a solid with no size is no solid: a wall drawn on the map with two of its points in one place made a box that
    # was all one point, and the test of a point in a box took every point anywhere for inside one with no area (all its
    # sides' tests nought) - a car in the middle of the track at Inje was put out of a wall 14 m deep ----
    rep("if (c > 0) pos++; else if (c < 0) neg++; } return !(pos && neg); }",
        "if (c > 0) pos++; else if (c < 0) neg++; } return (pos > 0) !== (neg > 0); } // (a quad with no area holds nothing)")
    rep("    if (solid) { const e = b, dx = e.x - a.x, dz = e.z - a.z, L = Math.hypot(dx, dz) || 1, o = Math.min(0.3, a.t / 2) / L,",
        "    if (solid && Math.hypot(b.x - a.x, b.z - a.z) > 0.05) { const e = b, dx = e.x - a.x, dz = e.z - a.z, L = Math.hypot(dx, dz) || 1, o = Math.min(0.3, a.t / 2) / L,")
    # ---- a side road beside the course: one leaving at a slant, or running on alongside it (a service road by a circuit),
    # came down to its land as it went along it, and the course's roadside beside it was taken down with it - a step of up
    # to a metre at the edge of the Nordschleife's track. It now keeps level with the course's edge until it is clear of
    # it (and of a circuit's run-off), and a circuit's run-off beside it stays as it is laid; on a circuit the bales that
    # close one stand behind the run-off ----
    rep("      const yy = ym + clamp(K.nat(x, z) - K.nat(xm, zm), -0.08 * dd, 0.08 * dd) * smooth(2, 14, dd);",
        "      const clr = q ? Math.abs(lat) - q.w / 2 - (q.rwro || 0) : dd, yy = ym + clamp(K.nat(x, z) - K.nat(xm, zm), -0.08 * dd, 0.08 * dd) * smooth(2, 14, Math.min(dd, Math.max(0, clr))); // (level with the course's edge while beside it)")
    rep("Math.hypot(o.x - x, o.z - z) < pts[o.i].w / 2 + 0.9) ok = false;",
        "Math.hypot(o.x - x, o.z - z) < pts[o.i].w / 2 + 0.9 + (pts[o.i].rwro || 0)) ok = false; /* (on a circuit, behind its run-off) */")
    rep("        const lat = (x - a.x) * hz - (z - a.z) * hx, ex = Math.abs(lat) - hw; if (ex > 2) continue;",
        "        const lat = (x - a.x) * hz - (z - a.z) * hx, ex = Math.abs(lat) - hw; if (ex > 2) continue;\n"
        "        if (ex > 0.25) { const pi = P[Math.min(N - 1, Math.floor(v / (2 * C)))]; if (pi.rwro && Math.abs((x - pi.x) * Math.cos(pi.h) - (z - pi.z) * Math.sin(pi.h)) - pi.w / 2 < pi.rwro + 0.6) continue; } // (beside it, a circuit's run-off stays level)")
    # ---- a circuit's line: its curvature spread along it where the map's points are sparse (see rwRaceSmooth) ----
    rep("  const CL = rwCenter(R.x, R.z, wAt, closed); if (!CL || CL.n < 60) throw new Error('short');",
        "  const CL = rwCenter(R.x, R.z, wAt, closed); if (!CL || CL.n < 60) throw new Error('short');\n  rwRaceSmooth(CL, v => tagsAt(v).highway === 'raceway', closed); // (a circuit's line: see rw_race)")
    # ---- a circuit is driven its own way round: the planner keeps to a one-way only on motorways and roundabouts (a rally
    # stage's road is closed, either way may be driven), so on a circuit it could take the pit lane and come back along
    # the straight to the line - the 24 Hours layout's lap closed that way. Against a circuit's one-way it costs RW_BACK
    # times as much (a course the wrong way round can still be made, from points placed that way), and a pit lane four
    # times its length (taken only for a point placed on it) ----
    rep("const W = { id: el.id, t, nd: el.nodes, la, lo, n, ow, f, bb: [s, w, nn, e] }; this.ways.set(el.id, W);",
        "const W = { id: el.id, t, nd: el.nodes, la, lo, n, ow, f, bb: [s, w, nn, e], rv: hw === 'raceway' ? (/^(yes|1|true)$/.test(t.oneway || '') ? 1 : /^(-1|reverse)$/.test(t.oneway || '') ? -1 : 0) : 0 }; this.ways.set(el.id, W);")
    rep("hz = (la, lo) => this.dist(la, lo, B.la, B.lo), ok = (W, d) => !W.ow || W.ow === d;",
        "hz = (la, lo) => this.dist(la, lo, B.la, B.lo), ok = (W, d) => !W.ow || W.ow === d, bk = (W, d) => W.rv && W.rv !== d ? RW_BACK : 1;")
    rep("    if (ok(A.W, 1)) start(A.W.nd[A.k + 1], L0 * (1 - A.t) * A.W.f + (noBack === -1 ? pen : 0), 1);",
        "    if (ok(A.W, 1)) start(A.W.nd[A.k + 1], L0 * (1 - A.t) * A.W.f * bk(A.W, 1) + (noBack === -1 ? pen : 0), 1);")
    rep("    if (ok(A.W, -1)) start(A.W.nd[A.k], L0 * A.t * A.W.f + (noBack === 1 ? pen : 0), -1);",
        "    if (ok(A.W, -1)) start(A.W.nd[A.k], L0 * A.t * A.W.f * bk(A.W, -1) + (noBack === 1 ? pen : 0), -1);")
    rep("      if (u === endA && ok(B.W, 1)) { const c = gu + LB * B.t * B.W.f;",
        "      if (u === endA && ok(B.W, 1)) { const c = gu + LB * B.t * B.W.f * bk(B.W, 1);")
    rep("      if (u === endB && ok(B.W, -1)) { const c = gu + LB * (1 - B.t) * B.W.f;",
        "      if (u === endB && ok(B.W, -1)) { const c = gu + LB * (1 - B.t) * B.W.f * bk(B.W, -1);")
    rep("          const c = gu + this.segLen(W, sk) * W.f; if (c < (g.get(v) ?? Infinity))",
        "          const c = gu + this.segLen(W, sk) * W.f * bk(W, d); if (c < (g.get(v) ?? Infinity))")
    # ---- a fast road's crossfall turned over no faster than its speed allows (see rwBankRate) ----
    rep("    // (and eased to level where a level piece begins)",
        "    if (RWL) rwBankRate(RWP.pack, pts, bank, N); // (a fast road's crossfall run out as it is built: see rw_race)\n    // (and eased to level where a level piece begins)")
    # ---- a circuit's racing line kept off the walls beside it (see rwLineRoom) ----
    rep("  for (let k = 0; k < n; k++) { const p = P[a + k]; cx[k] = x[k] = p.x; cz[k] = z[k] = p.z; nx[k] = Math.cos(p.h); nz[k] = -Math.sin(p.h); lim[k] = Math.max(0.15, p.w / 2 - 1.25); }",
        "  for (let k = 0; k < n; k++) { const p = P[a + k]; cx[k] = x[k] = p.x; cz[k] = z[k] = p.z; nx[k] = Math.cos(p.h); nz[k] = -Math.sin(p.h); lim[k] = Math.max(0.15, p.w / 2 - 1.25); }\n"
        "  const limL = Float64Array.from(lim), limR = Float64Array.from(lim); if (T.real) rwLineRoom(T, a, n, limL, limR); // (a circuit's: off its walls - see rw_race)")
    rep("    o[i] = clamp(o[i], -lim[i] * 1.4, lim[i] * 1.4); x[i] = cx[i] + nx[i] * o[i]; z[i] = cz[i] + nz[i] * o[i];",
        "    o[i] = clamp(o[i], -limR[i] * 1.4, limL[i] * 1.4); x[i] = cx[i] + nx[i] * o[i]; z[i] = cz[i] + nz[i] * o[i];")
    rep("    o[i] = clamp(o[i], -lim[i], lim[i]); x[i] = cx[i] + nx[i] * o[i]; z[i] = cz[i] + nz[i] * o[i];",
        "    o[i] = clamp(o[i], -limR[i], limL[i]); x[i] = cx[i] + nx[i] * o[i]; z[i] = cz[i] + nz[i] * o[i];")
    # ---- the game's circuits among its courses ----
    if PRESETS:
        rep("  { id: 'monaco', name: 'Monaco streets circuit', kind: 'loop', km: 3.32, file: 'real/monaco.json' }\n];",
            "  { id: 'monaco', name: 'Monaco streets circuit', kind: 'loop', km: 3.32, file: 'real/monaco.json' },\n" + PRESETS + "\n];")
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{path}: {n_ok} replacements')
PRESETS = os.environ.get('R49_PRESETS', '')
if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3])
