# Round 48: a real road's lanes as the map and its country have them (counts each way, a climbing lane's three, the
# driving side, the middle line where the two directions meet - broken, solid, doubled, mixed, a warning line - white or
# yellow as the country paints it, lane and edge lines), the map's other roads laid over the land so it cannot show
# through them, with their own lines; and the road's heights laid as a road is built (no spikes, held to its class's
# grades and curves). Applied to the round 47 builds. Each replacement must match exactly the stated number of times.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
T48 = lambda f: open(os.path.join(HERE, 't48', f), encoding='utf-8').read()
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
    # (pages that lay a real road's heights and lanes the new way race only each other)
    rep("const MP_V = 8,", "const MP_V = 9,")
    # ---- the heights (rw_elev) in place of round 46's, and the lanes (rw_lane) beside them ----
    cut("// The road's rise and fall: the map's own heights along it (every 2 m: the pack's profile), on the line as laid.",
        "// the junctions' side roads: where another road meets the course", T48('rw_elev.js') + "\n" + T48('rw_lane.js') + "\n")
    # ---- the old painter out (rw_lane's rwPaint now) ----
    cut("function rwPaint(T, P, LN, add) {", "// ---- the map's buildings ----", "")
    rep("    if (T.real) rwPaint(T, P, LN, add); else {", "    if (T.real) rwPaint(T, P, LN, add, rows, G); else {")
    # (a there-and-back's turn: its heights a curve from the road's grade at its end to its grade where it rejoins it)
    rep("for (let i = 0; i < N; i++) { const p = pts[i], m = p.rwm; y[i] = m >= 0 ? YL[m] : yT + (yB - yT) * (p.rwtf || 0); } }",
        "const TYs = rwTurnYs(YL, RWL); for (let i = 0; i < N; i++) { const p = pts[i], m = p.rwm; y[i] = m >= 0 ? YL[m] : TYs ? TYs(p.rwtf || 0) : yT + (yB - yT) * (p.rwtf || 0); } }")
    # (a two-way main road the map has as one lane: read as one lane each way where the country has no single-track main roads)
    rep("  const n = ln > 0 && ln < 13 ? ln : one && (hw === 'motorway' || hw === 'trunk') ? 2 : one ? 1 : Math.max(1, Math.round(RW_LANES[hw] || 2));",
        "  const n = ln > 0 && ln < 13 ? (rwOneLaneMain(t, one, ln) ? 2 : ln) : one && (hw === 'motorway' || hw === 'trunk') ? 2 : one ? 1 : Math.max(1, Math.round(RW_LANES[hw] || 2));")
    # ---- the lanes' widths by the country's rules where the map has none ----
    rep("one = t.oneway === 'yes' || t.oneway === '1' || t.oneway === '-1' || hw === 'motorway' || t.junction === 'roundabout', L = RW_LANE[hw] || 3;",
        "one = t.oneway === 'yes' || t.oneway === '1' || t.oneway === '-1' || hw === 'motorway' || t.junction === 'roundabout', L = RW_CUR.lw[hw] || RW_LANE[hw] || 3;")
    rep("  const C = K.pack, TY = K.TY, gravelC = RW_GRAVEL.has(TY.id), narrow = RW_NARROW.has(TY.id), snow = K.surface === 'snow';\n",
        "  const C = K.pack, TY = K.TY, gravelC = RW_GRAVEL.has(TY.id), narrow = RW_NARROW.has(TY.id), snow = K.surface === 'snow'; rwUseRules(C); // (its country's lanes)\n")
    # ---- the lanes worked out once the road's heights are known ----
    rep("  if (RWP && RWP.pack._tu) RWP.pack._tu.on = true; // (a real tunnel's cover over it, now that the road's heights are known: see rwTuCover)",
        "  if (RWP && RWP.pack._tu) RWP.pack._tu.on = true; // (a real tunnel's cover over it, now that the road's heights are known: see rwTuCover)\n"
        "  if (RWL) rwLanesPass({ pack: RWP.pack, pts, cN: RWL.cN }); // (its lanes each way and its middle line, now that its heights are known)")
    # ---- the map's other roads: laid over the land, with their lines ----
    rep("  for (const L of C.net || []) { if (L.tu || (lo && L.foot) || (!L.own && (L.br || (L.ly | 0) >= 1))) continue; /* (a bridge: its deck, see rwBridges) */ const k = L.foot ? 'path' : L.s === 'gravel' ? 'gravel' : 'tarmac', skip = (x, z) => nearRoad(1.2)(x, z) || spurNear(x, z);\n"
        "    PB[k].push(ribbon(L.x, L.z, Math.max(1.2, L.w), L.foot ? 0.05 : 0.07, skip, lo ? 5 : L.foot ? 4 : 3)); }\n"
        "  for (const k in PB) out.net += mesh(PB[k], mats[k], 'net');",
        "  const NL = { pos: [], col: [], idx: [] }, cw0 = new THREE.Color(0xe8e8e2), cy0 = new THREE.Color(0xe3ae35), rtN = rwPrep(C), townId = rwLcId('town'), MK = { Rg: rwRules(rwCountryOf(C)), NL, cw: [cw0.r, cw0.g, cw0.b], cy: [cy0.r, cy0.g, cy0.b], town: (x, z) => rwLcAt(rtN, x, z) === townId };\n"
        "  // (the land as drawn: near the course - its roadside strip, its side roads, its tunnels - as the scenery finds it; further\n"
        "  // out, where there is only the land's grid, from the grid itself, which is quicker)\n"
        "  const NCs = new Set(), ncK = (x, z) => Math.floor(x / 32) * 131071 + Math.floor(z / 32); { const P0 = T.pts, mark = q => { const cx = Math.floor(q.x / 32), cz = Math.floor(q.z / 32); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) NCs.add((cx + a) * 131071 + cz + b); }; for (let i = 0; i < P0.length; i += 3) mark(P0[i]); for (const sp of T.spurs || []) for (const q of sp.pts) mark(q); }\n"
        "  const gYn = (x, z) => { if (NCs.has(ncK(x, z))) return gY(x, z); const g = groundAt(T, x, z); return g === null ? gY(x, z) : g; };\n"
        "  for (const L of C.net || []) { if (L.tu || (lo && L.foot) || (!L.own && (L.br || (L.ly | 0) >= 1))) continue; /* (a bridge: its deck, see rwBridges) */ const k = L.foot ? 'path' : L.s === 'gravel' ? 'gravel' : 'tarmac', skip = (x, z) => nearRoad(1.2)(x, z) || spurNear(x, z);\n"
        "    PB[k].push(rwNetRibbon(gYn, L, Math.max(1.2, L.w), L.foot ? 0.05 : 0.07, skip, lo ? 5 : L.foot ? 4 : 3, lo ? null : MK)); } // (see rwNetRibbon: over the land, and its lines)\n"
        "  for (const k in PB) out.net += mesh(PB[k], mats[k], 'net');\n"
        "  if (NL.idx.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(NL.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(NL.col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(NL.pos.map((v, k) => k % 3 === 1 ? 1 : 0), 3)); g.setIndex(NL.idx);\n"
        "    const lm = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });\n"
        "    g.computeBoundingSphere(); const m = new THREE.Mesh(g, lm); m.receiveShadow = true; m.userData.rw = 'netlines'; G.add(m); out.netLines = NL.idx.length / 3; }")
    # ---- a new pack: its country, and its ways' lane tags, its other roads' lanes and one-way-ness ----
    rep("  if (len > 60000) throw new Error('long');\n",
        "  if (len > 60000) throw new Error('long');\n"
        "  // (the country it is in, as the map has it: for its lanes' widths and lines - see rwRules; where the map can't say, by where it is)\n"
        "  let cc = ''; try { const J = await RWNet.overpass(`[out:json][timeout:25];is_in(${o[0].toFixed(5)},${o[1].toFixed(5)})->.a;area.a[admin_level=2];out tags;`, 30000); for (const el of (J && J.elements) || []) { const c = el.tags && (el.tags['ISO3166-1'] || el.tags['ISO3166-1:alpha2']); if (c && /^[A-Za-z]{2}$/.test(c)) { cc = c.toUpperCase(); break; } } } catch (e) { }\n"
        "  rwUseRules({ cc, o });\n")
    rep("'access', 'service', 'width:carriageway']) if (W.t[k] != null) t[k] = String(W.t[k]).slice(0, 60);",
        "'access', 'service', 'width:carriageway'].concat(RW_TAGS48)) if (W.t[k] != null) t[k] = String(W.t[k]).slice(0, 60);")
    rep("      net.push({ id: el.id, own: routeW.has(el.id) ? 1 : 0, hw, x: X, z: Z, w: Math.round(wd * 10) / 10,",
        "      const LT = rwLaneTags(t); net.push({ id: el.id, own: routeW.has(el.id) ? 1 : 0, hw, ln: LT.n, one: LT.one, x: X, z: Z, w: Math.round(wd * 10) / 10,")
    rep("    r: { x: RX.map(rwR), z: RZ.map(rwR), w: segW, a: R.a, b: R.b }, ways, jn, prof:",
        "    r: { x: RX.map(rwR), z: RZ.map(rwR), w: segW, a: R.a, b: R.b }, ways, jn, cc, prof:")
    # (no snow lies in a real tunnel's tube: the country's snow along the road stops at its portals)
    rep("const ls = new Float32Array(N); if (Wn) for (let i = 0; i < N; i++) ls[i] = snowCover(T, P[i].x, P[i].y, P[i].z) * (0.75 + 0.5 * shade[i]);",
        "const ls = new Float32Array(N); if (Wn) for (let i = 0; i < N; i++) ls[i] = P[i].rwtu ? 0 : snowCover(T, P[i].x, P[i].y, P[i].z) * (0.75 + 0.5 * shade[i]);")
    open(path, 'w', encoding='utf-8').write(s)
    print(path, 'ok', n_ok, 'replacements')
if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3])
