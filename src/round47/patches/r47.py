# Round 47: a circuit's laps timed as a racing sim times them, the map on the website from the artifact, and a real
# road's tunnels rebuilt as games build them (a tube of their own with portals, the land over them). Applied to
# the round 46 builds (site 1782, artifact 6D3E). Each replacement must match exactly the stated number of times.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
T47 = lambda f: open(os.path.join(HERE, 't47', f), encoding='utf-8').read()
WEB = 'https://kimaiden1408.github.io/seed-rally-86/'
def patch(path, stamp_old, stamp_new):
    s = open(path, encoding='utf-8').read()
    n_ok = 0
    def rep(old, new, n=1):
        nonlocal s, n_ok
        c = s.count(old)
        if c != n: raise SystemExit(f'{path}: expected {n} of {old[:90]!r}, found {c}')
        s = s.replace(old, new); n_ok += 1
    rep(f"const SR86_BUILD = '{stamp_old}';", f"const SR86_BUILD = '{stamp_new}';")
    # (pages that time a circuit's laps race only each other: the line times they send are new)
    rep("const MP_V = 7,", "const MP_V = 8,")
    # ---- the timing (rw_lap) with the page's other parts, and its words ----
    rep("const RXUI = {\n", T47('rw_lap.js') + "\nconst RXUI = {\n")
    merge = "for (const l in I18N_MORE) if (l !== 'k' && typeof I18N_DATA !== 'undefined' && I18N_DATA[l]) I18N_MORE.k.forEach((k, i) => { I18N_DATA[l][k] = I18N_MORE[l][i]; });"
    rep(merge, T47('rw_lap_i18n.js') + "\n" + merge)
    # ---- the HUD: the lap box under the clock ----
    rep('<div class="clock"><div id="time">0:00.00</div><div id="delta"></div><div id="rallyTag"></div><div id="fbTag" class="fbtag"></div></div>',
        '<div class="clock"><div id="time">0:00.00</div><div id="delta"></div><div id="rallyTag"></div><div id="fbTag" class="fbtag"></div>'
        '<div id="lapBox" class="lapbox" hidden><div class="lb1"><small class="lbL">Lap</small><span id="lapN">1/1</span><span id="lapPos" hidden></span></div>'
        '<div class="lsec"><span id="lapS1">S1 –</span><span id="lapS2">S2 –</span><span id="lapS3">S3 –</span></div>'
        '<div class="lb2"><span><small class="lbLast">Last</small> <b id="lapLast">–</b></span><span><small class="lbBest">Best</small> <b id="lapBest">–</b></span></div>'
        '<div class="lb3"><span><small class="lbTot">Total</small> <b id="lapTot">0:00.00</b></span><span id="lapRec"></span></div></div></div>')
    # ---- the run: its timing lines set at the start, crossed each frame; the splits' own calls left to it on a circuit ----
    rep("G.splitIdx = []; for (let k = 1; k <= nSplit; k++) G.splitIdx.push(G.T.startIdx + Math.round(span * k / (nSplit + 1)));",
        "G.splitIdx = []; for (let k = 1; k <= nSplit; k++) G.splitIdx.push(G.T.startIdx + Math.round(span * k / (nSplit + 1)));\n  RWLap.start(G.T); // (a real circuit: timed by laps and sectors, see RWLap)")
    rep("for (let s = 0; s < G.splitIdx.length; s++) if (!G.splits[s] && G.prog >= G.splitIdx[s]) { G.splits[s] = G.time + G.penalty; showSplit(s); }",
        "for (let s = 0; s < G.splitIdx.length; s++) if (!G.splits[s] && G.prog >= G.splitIdx[s]) { G.splits[s] = G.time + G.penalty; showSplit(s); }\n    if (RWLap.on) RWLap.tick();")
    rep("function showSplit(s) { if (G.rally) return Rally.showSplit(s);", "function showSplit(s) { if (RWLap.on) return; if (G.rally) return Rally.showSplit(s);")
    rep("    this.pub({ sp: this.sp.slice() });\n", "    this.pub({ sp: this.sp.slice() });\n    if (RWLap.on) return; // (on a circuit the sectors and laps are called instead: see RWLap)\n")
    # ---- the HUD each frame: the lap's own time on the clock, the running delta to the best lap, the lap box ----
    rep("  setText(hud$('#time'), fmtT(G.finished ? G.finT : G.time + G.penalty));", "  setText(hud$('#time'), RWLap.on ? RWLap.timeTxt() : fmtT(G.finished ? G.finT : G.time + G.penalty));")
    rep("  const gh = G.ghost; const dEl = hud$('#delta'), dSet = d =>", "  const gh = RWLap.on ? null : G.ghost; const dEl = hud$('#delta'), dSet = d =>")
    rep("  else if (!gh && !G.lead) setText(dEl, '');\n", "  else if (!gh && !G.lead && !RWLap.on) setText(dEl, '');\n  if (RWLap.on) RWLap.hud();\n")
    # ---- a race on a circuit: the timing tower for the standings, each driver's best lap in the results ----
    rep("  standings() {\n    const el = $('#mpStand'); if (!el) return; if (this.phase !== 'race' && this.phase !== 'done') { el.hidden = true; return; }",
        "  standings() {\n    const el = $('#mpStand'); if (!el) return; if (this.phase !== 'race' && this.phase !== 'done') { el.hidden = true; return; }\n    if (RWLap.on) { RWLap.tower(this); return; } // (a circuit: the timing tower, see RWLap)")
    rep("      const sub = [f.car, f.as ? levelName(f.as) : '',", "      const sub = [f.car, RWLap.on ? RWLap.bestTxt(f) : '', f.as ? levelName(f.as) : '',")
    # ---- the finish, alone on a circuit: every lap's time ----
    rep("  lines.push(lv === 'hardcore' ? 'Hardcore: no assists, no flashbacks, the driver\\u2019s view.'",
        "  if (RWLap.on) { const fl = RWLap.finLine(); if (fl) lines.push(fl); }\n  lines.push(lv === 'hardcore' ? 'Hardcore: no assists, no flashbacks, the driver\\u2019s view.'")
    # ---- the map: a link to the Real roads tab (#real), and to the map itself (#real=new); in the artifact, where the map
    # can't be reached, a link that opens it on the game's website ----
    rep("    const m = /(?:^|[#&])real=([0-9a-z]+)/i.exec(location.hash || ''); if (m) { this.want = m[1].toLowerCase(); Rally.mode = 'real'; }",
        "    const m = /(?:^|[#&])real(?:=([0-9a-z]+))?(?=$|&)/i.exec(location.hash || ''); if (m) { this.want = m[1] ? m[1].toLowerCase() : null; if (this.want === 'new') { this.want = null; this.mapNew = true; } Rally.mode = 'real'; }")
    rep("for (const id of ['#selReg', '#selCourse']) { const l = $(id); if (l && l.parentElement) l.parentElement.hidden = true; } this.render();\n    const code = this.want || lsGet('sr86.realLast', '');",
        "for (const id of ['#selReg', '#selCourse']) { const l = $(id); if (l && l.parentElement) l.parentElement.hidden = true; } this.render();\n    if (this.mapNew && !rwOffline()) { this.mapNew = false; setTimeout(() => RWMap.open(null), 0); } // (a link to the map itself: #real=new)\n    const code = this.want || lsGet('sr86.realLast', '');")
    rep('<button id="realNew" class="ghostbtn" type="button">Make a course on the map</button><button id="realEdit" class="ghostbtn" type="button">Change this course</button></div>',
        '<button id="realNew" class="ghostbtn" type="button">Make a course on the map</button><button id="realEdit" class="ghostbtn" type="button">Change this course</button>'
        f'<a id="realWeb" class="ghostbtn" href="{WEB}#real=new" target="_blank" rel="noopener" hidden>Make a course on the map (opens the game’s website)</a></div>'
        '\n      <p id="realWebNote" class="small" hidden>The map can’t open inside Claude: courses are made on the game’s website, and played here from a course file or with the game’s own courses.</p>')
    rep("    { const e = $('#realEdit'); if (e) e.hidden = rwOffline(); const n = $('#realNew'); if (n) n.hidden = rwOffline(); }",
        "    { const e = $('#realEdit'); if (e) e.hidden = rwOffline(); const n = $('#realNew'); if (n) n.hidden = rwOffline(); for (const id of ['#realWeb', '#realWebNote']) { const w = $(id); if (w) w.hidden = !rwOffline(); } }")
    # ==== the real tunnels rebuilt (rw_tun): a tube of its own with portals, the land over it the strip's, its floor ====
    def cut(start, end, new):
        nonlocal s, n_ok
        a = s.find(start)
        if a < 0 or s.count(start) != 1: raise SystemExit(f'{path}: cut start {start[:80]!r} found {s.count(start)}')
        b = s.find(end, a)
        if b < 0: raise SystemExit(f'{path}: cut end {end[:80]!r} not found')
        s = s[:a] + new + s[b:]; n_ok += 1
    cut("// a tunnel's tube: its walls up from the road's edges, its vault over, its portals' faces where it goes into the hill\nfunction rwTunnels(ctx, H) {",
        "// a there-and-back's turning circle", T47('rw_tun.js') + "\n")
    rep("function buildGround(T) {\n  if (T.terrain) return T;", "function buildGround(T) {\n  if (T.terrain) return T;\n  if (T.real) rwTunPrep(T); // (a real course's tunnels, each a tube of its own: see rwTunPrep)")
    ext = "  for (let pass = 0; pass < 2; pass++) for (let sd = 0; sd < 2; sd++) { for (let i = 1; i < N; i++) EXT[i * 2 + sd] = Math.min(EXT[i * 2 + sd], EXT[(i - 1) * 2 + sd] + 0.8); for (let i = N - 2; i >= 0; i--) EXT[i * 2 + sd] = Math.min(EXT[i * 2 + sd], EXT[(i + 1) * 2 + sd] + 0.8); }\n"
    rep(ext, ext + "  if (T.rwTun) rwTunExt(T, EXT, cell, fieldAt); // (over a real tunnel: room for the land's bank down from over it)\n")
    rep("      const us = p.nb ? [-hw, -hw * 0.5, 0, sh, sh + dw,", "      const us = p.rwtu && T.rwTun && T.rwTun.of[i] ? rwTunCols(T, i, hw, ext, BRK, k) : p.nb ? [-hw, -hw * 0.5, 0, sh, sh + dw,")
    rep("SY[o + c] = p.rwtu ? e - 0.03 - 0.01 * c : p.nb || c > 1 ? fieldAt(x, z).h",
        "SY[o + c] = p.rwtu ? (T.rwTun ? rwTunLand(T, i, sd, L, hw + ext, fieldAt(x, z).h, () => fieldAt(p.x + lx * sd * (hw + ext), p.z + lz * sd * (hw + ext)).h) : e - 0.03 - 0.01 * c) : p.nb || c > 1 ? fieldAt(x, z).h")
    rep("  for (const o of all) { if (o.spur || o.rwtu) continue;", "  for (const o of all) { if (o.spur || (o.rwtu && !T.rwTun)) continue;")
    rep("  T.terrain.hole = hole;", "  if (T.rwTun) rwTunHoles(T, hole, x0, z0, cell, nx, nz); // (all the land over a real tunnel's tube is the strip's)\n  T.terrain.hole = hole;")
    rep("A = P[i0], B = P[i0 + 1]; if (A.nb && B.nb) continue; /* a bridge deck is far above its gorge; a walled gate is not */",
        "A = P[i0], B = P[i0 + 1]; if ((A.nb && B.nb) || (T.rwTun && A.rwtu && B.rwtu)) continue; /* a bridge deck is far above its gorge; a walled gate is not; a real tunnel's road is under its hill */")
    rep("  return T._bars = B;", "  if (T.rwTun) rwTunBars(T, B); // (a real tunnel's walls, at its walkways' backs)\n  return T._bars = B;")
    rep("  const s = stripAt(T, x, z), g = groundAt(T, x, z), y = s !== null ?",
        "  if (T.rwTun && !_rwTunOff) { const f = rwTunFloor(T, x, z); if (f !== null) return Math.max(kb, f); } // (in a real tunnel's tube: its floor)\n  const s = stripAt(T, x, z), g = groundAt(T, x, z), y = s !== null ?")
    rep("  if (info.wall && al < hw + 0.45) return roadSurfY(T, info.dist, sg * hw, info.w); // under a gate's wall\n",
        "  if (info.wall && al < hw + 0.45) return roadSurfY(T, info.dist, sg * hw, info.w); // under a gate's wall\n  if (T.rwTun) { const f = rwTunFloor(T, x, z); if (f !== null) return Math.max(kb, f); } // (a real tunnel's gutter and walkway)\n")
    rep("  const gY = (x, z) => groundY(T, x, z);", "  const gY = T.rwTun ? (x, z) => rwLandY(T, x, z) : (x, z) => groundY(T, x, z); // (with real tunnels: the scenery stands on the land over them)")
    rep("        if (p.nb) { const st = c > 0 ?", "        if (p.nb || (p.rwtu && T.rwTun)) { const st = c > 0 ?")
    rep("        if (!p.nb) { if (p.kerb && c <= 3) lkSet(", "        if (!p.nb && !(p.rwtu && T.rwTun)) { if (p.kerb && c <= 3) lkSet(")
    rep("  return h > -1 ? rwTuCover(K, x, z, h) : h;", "  return h; // (over a tunnel too: the land over its tube is made up where it must be by the strip, see rwTunLand)")
    rep("for (const p of L) if (Math.hypot(x - p.x, z - p.z) < p.w / 2 + 0.9 + m && !(y > p.y + 7.4)) return true; return false; }",
        "for (const p of L) if (Math.hypot(x - p.x, z - p.z) < (p.rwHo || p.w / 2 + 1.9) + m && !(y > p.y + (p.rwTop || 7.4) + 1)) return true; return false; }")
    rep("const add = Math.max(0, P[c.ic].y + (c.tu ? 7.4 : 5.6) - lin(c.s));", "const add = Math.max(0, P[c.ic].y + (c.tu ? (P[c.ic].rwTop || 6.8) + 0.9 : 5.6) - lin(c.s));")
    rep("  for (const w of C.bar || []) { const kind = w.k === 'wall'", "  rwTunBoxes(K); // (a real tunnel's portal faces beside its mouths)\n  for (const w of C.bar || []) { const kind = w.k === 'wall'")
    # (a road's grade held to what its class is built to: a motorway's 6.5 %, a trunk road's 7.5 %, a main road's 10 %;
    # the elevation model's steps at a portal or a cutting otherwise climb a motorway at 20 %)
    rep("  const g = 0.22 * STEP; for (let it = 0; it < 3; it++) { for (let m = 1; m < n; m++) y[m] = clamp(y[m], y[m - 1] - g, y[m - 1] + g); for (let m = n - 2; m >= 0; m--) y[m] = clamp(y[m], y[m + 1] - g, y[m + 1] + g); }",
        "  const RG = { motorway: 0.065, trunk: 0.075, primary: 0.1 }, gm = new Float64Array(n); for (let m = 0; m < n; m++) { const t = (C.ways[R.w[Math.min(R.w.length - 1, CL.v[m])]] || {}).t || {}; gm[m] = (RG[(t.highway || '').replace('_link', '')] || 0.22) * STEP; }\n"
        "  for (let it = 0; it < 3; it++) { for (let m = 1; m < n; m++) { const g = Math.min(gm[m], gm[m - 1]); y[m] = clamp(y[m], y[m - 1] - g, y[m - 1] + g); } for (let m = n - 2; m >= 0; m--) { const g = Math.min(gm[m], gm[m + 1]); y[m] = clamp(y[m], y[m + 1] - g, y[m + 1] + g); } }")
    # (in a real tunnel: no sun and less sky on the car and the road, as the eye finds it; its echo)
    rep("    carHemi.color.copy(hemi.color); carHemi.groundColor.copy(hemi.groundColor); carHemi.intensity = hemi.intensity;",
        "    { const kt = G.T && G.T.rwTun ? rwTunDark(G.T) : 0; if (kt > 0) { hemi.intensity *= 1 - 0.55 * kt; sun.intensity *= 1 - 0.85 * kt; } } // (in a real tunnel's tube: no sun, less sky)\n"
        "    carHemi.color.copy(hemi.color); carHemi.groundColor.copy(hemi.groundColor); carHemi.intensity = hemi.intensity;")
    rep("      this.set(this.RV.chS.gain, rv, 0.15); this.set(this.RV.enS.gain, rv * 0.8, 0.15);",
        "      const tk = T.rwTun ? rwTunDepth(T, c.hint | 0) : 0, rv2 = rv + (1.25 * (view === 1 ? 0.3 + 0.5 * open : 1) - rv) * tk; // (in a real tunnel: its walls ring with it)\n"
        "      this.set(this.RV.chS.gain, rv2, 0.15); this.set(this.RV.enS.gain, rv2 * 0.8, 0.15);")
    # ==== a real road's own bridges built as their kind is (rw_br): a modern one concrete, its deck as deep as its spans ====
    rep("const RWT = { gut: 0.45,", T47('rw_br.js') + "\nconst RWT = { gut: 0.45,")
    rep("if (j - i >= 1) { K.feat('bridge', i, j, { rw: 1, hump: 0 }); for (let k = i; k <= j; k++) pts[k].wall = true; }",
        "if (j - i >= 1) { K.feat('bridge', i, j, Object.assign({ rw: 1, hump: 0 }, rwBridgeKind(pts, i, j))); for (let k = i; k <= j; k++) pts[k].wall = true; }")
    rep("const pos = [], col = [], cF = new THREE.Color(E.masonry), cT = cF.clone().multiplyScalar(1.18), cU = cF.clone().multiplyScalar(0.74);",
        "const pos = [], col = [], cF = new THREE.Color(f.modern ? '#aca89f' : E.masonry), cT = cF.clone().multiplyScalar(f.modern ? 1.08 : 1.18), cU = cF.clone().multiplyScalar(0.74);")
    rep("S: [[L1, y - 1.1], [L1, y + 0.85], [L0, y + 0.85], [L0, y - 0.03], [-L0, y - 0.03], [-L0, y + 0.85], [-L1, y + 0.85], [-L1, y - 1.1]] }; };",
        "S: [[L1, y - (f.depth || 1.1)], [L1, y + 0.85], [L0, y + 0.85], [L0, y - 0.03], [-L0, y - 0.03], [-L0, y + 0.85], [-L1, y + 0.85], [-L1, y - (f.depth || 1.1)]] }; }; // (a modern bridge's girder as deep as its spans: see rwBridgeKind)")
    rep("    const m = new THREE.Mesh(geo, spanMat); m.castShadow = true; m.receiveShadow = true; G.add(m);\n  }\n  // an old arch bridge",
        "    const m = new THREE.Mesh(geo, f.modern ? rwConcMat(true) : spanMat); m.castShadow = true; m.receiveShadow = true; G.add(m);\n  }\n  // an old arch bridge")
    rep("const hgt = p.y - 0.9 - floor; const box = new THREE.Mesh(new THREE.BoxGeometry(deck, hgt, 1.4), stoneMat); box.position.set(p.x, floor + hgt / 2, p.z); box.rotation.y = p.h; G.add(box); }",
        "const hgt = p.y - 0.9 - floor; if (f.modern) { rwPier(G, p, deck, floor, p.y - (f.depth || 1.1)); continue; } const box = new THREE.Mesh(new THREE.BoxGeometry(deck, hgt, 1.4), stoneMat); box.position.set(p.x, floor + hgt / 2, p.z); box.rotation.y = p.h; G.add(box); }")
    rep("const ab = new THREE.Mesh(new THREE.BoxGeometry(deck + 1.6, 9, 2.4), stoneMat);", "const ab = new THREE.Mesh(new THREE.BoxGeometry(deck + 1.6, 9, 2.4), f.modern ? rwConcMat(false) : stoneMat);")
    # (a reset in a real tunnel: put back where it is, on the tube's road, not back at its mouth as from a bridge or a gate)
    rep("let i = clamp(G.prog + 3, T.startIdx, T.pts.length - 2), lat = 0; if (T.pts[i].wall) { while (i > T.startIdx && T.pts[i].wall) i--;",
        "let i = clamp(G.prog + 3, T.startIdx, T.pts.length - 2), lat = 0; if (T.pts[i].wall && !(T.rwTun && T.rwTun.of[i])) { while (i > T.startIdx && T.pts[i].wall) i--;")
    # (the crews' and the rivals' put-back too: in a real tunnel, where they are, not back at its mouth)
    rep("if (T.pts[i].wall) { while (i > T.startIdx && T.pts[i].wall) i--; i = Math.max(T.startIdx, i - 3); }",
        "if (T.pts[i].wall && !(T.rwTun && T.rwTun.of[i])) { while (i > T.startIdx && T.pts[i].wall) i--; i = Math.max(T.startIdx, i - 3); }")
    rep("if (T.pts[i0].wall) { while (i0 > T.startIdx && T.pts[i0].wall) i0--; i0 = Math.max(T.startIdx, i0 - 3); }",
        "if (T.pts[i0].wall && !(T.rwTun && T.rwTun.of[i0])) { while (i0 > T.startIdx && T.pts[i0].wall) i0--; i0 = Math.max(T.startIdx, i0 - 3); }")
    # (the map's walls and houses as solids: none in or over a real tunnel's tube - a wall on the hill over its portal
    # reached down through it - nor a length of one that stands on the road itself, a mapping slip)
    rep("    if (d < pts[i].w / 2 + 0.25) return; const y = typeof top === 'function' ? top(mx, mz, i) : top; K.boxes.push(",
        "    if (d < pts[i].w / 2 + 0.25) return; if (C._tu && (rwInTube(C, mx, mz, -1e9, 0.3) || rwInTube(C, ax, az, -1e9, 0.3) || rwInTube(C, bx, bz, -1e9, 0.3))) return;\n"
        "    { const ea = nearI(ax, az, 24), eb = nearI(bx, bz, 24); if ((ea[0] >= 0 && ea[1] < pts[ea[0]].w / 2 + 0.1) || (eb[0] >= 0 && eb[1] < pts[eb[0]].w / 2 + 0.1)) return; }\n"
        "    const y = typeof top === 'function' ? top(mx, mz, i) : top; K.boxes.push(")
    # ==== the map's route found quickly, and its tiles shown wherever the page is served ====
    # (the map's tiles asked for with the page's address as their referrer, as OpenStreetMap's tile servers require of
    # a web page: the race server sends the page with no referrer at all, and its tiles came back "Access blocked")
    rep("if (!im) { im = new Image(); im.onload = () => this.draw(); im.src = `https://tile.openstreetmap.org/${key}.png`;",
        "if (!im) { im = new Image(); im.referrerPolicy = 'strict-origin-when-cross-origin'; im.onload = () => this.draw(); im.src = `https://tile.openstreetmap.org/${key}.png`;")
    # (a routing service's route through the points first - OpenStreetMap's own car routing, else the routing project's
    # server - and the map's roads along it fetched in one query; the old way, the roads in cells along each leg, only
    # when that fails. A route asked for again before the last one is found stops the last one's queries)
    rep("  at: 0, live: null, busy: 0,\n",
        "  at: 0, live: null, busy: 0,\n"
        "  OSRM: ['https://routing.openstreetmap.de/routed-car/route/v1/driving/', 'https://router.project-osrm.org/route/v1/driving/'],\n"
        "  // the routing services' route through the points (its line and length): a guide to where the course's roads are\n"
        "  async osrm(P, live) { const q = P.map(p => p[1].toFixed(6) + ',' + p[0].toFixed(6)).join(';') + '?overview=full&geometries=geojson&continue_straight=false';\n"
        "    for (const u of this.OSRM) { if (live && !live()) throw new Error('stale');\n"
        "      try { const r = await this.get(u + q, {}, 15000); if (!r.ok) continue; const j = await r.json(), R = j && j.code === 'Ok' && j.routes && j.routes[0], C = R && R.geometry && R.geometry.coordinates; if (!C || C.length < 2) continue; return { line: C.map(c => [c[1], c[0]]), m: R.distance };\n"
        "      } catch (e) { if (live && !live()) throw new Error('stale'); } }\n"
        "    return null; },\n")
    rep("  async overpass(q, ms) {", "  async overpass(q, ms, live) {")
    rep("    while (this.busy >= 2) await rwSleep(120); this.busy++;",
        "    while (this.busy >= 2) { if (live && !live()) throw new Error('stale'); await rwSleep(120); } if (live && !live()) throw new Error('stale'); this.busy++;")
    rep("      for (let k = 0; k < this.OVP.length * 2; k++) { const u = this.OVP[(this.at + k) % this.OVP.length];",
        "      for (let k = 0; k < this.OVP.length * 2; k++) { if (live && !live()) throw new Error('stale'); const u = this.OVP[(this.at + k) % this.OVP.length];")
    rep("out body geom qt;`);\n    for (const el of J.elements || []) this.add(el); return true; },",
        "out body geom qt;`, 45000, this.live);\n    for (const el of J.elements || []) this.add(el); return true; },\n"
        "  // the drivable ways within r m of a line (a routing service's route), in one query: an Overpass buffer round it\n"
        "  async corridor(line, r) { const pts = []; let last = null; for (const p of line) if (!last || this.dist(last[0], last[1], p[0], p[1]) >= 45) { pts.push(p); last = p; } if (last !== line[line.length - 1]) pts.push(line[line.length - 1]);\n"
        "    let st = 1; while (pts.length / st > 360) st++; const use = pts.filter((p, k) => k % st === 0 || k === pts.length - 1);\n"
        "    const J = await RWNet.overpass(`[out:json][timeout:60];way[highway~\"^(${RW_HW})$\"][area!=yes](around:${r},${use.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(',')});out body geom qt;`, 70000, this.live);\n"
        "    for (const el of J.elements || []) this.add(el); return (J.elements || []).length; },\n"
        "  live: null,")
    rep("    let done = 0; for (const [a, b] of legs) { await this.along(a, b, 1, f => prog && prog((done + f) / legs.length * 0.5)); done++; }\n    const snaps = []; for (const p of P) { const s = this.snap(p[0], p[1], RW_SNAP); if (!s) throw Object.assign(new Error('nosnap'), { at: P.indexOf(p) }); snaps.push(s); }",
        "    let guided = false; try { const G = await RWNet.osrm(kind === 'loop' ? P.concat([P[0]]) : P, this.live); if (G && G.m < 90000) { if (prog) prog(0.1); await this.corridor(G.line, 260); guided = true; if (prog) prog(0.5); } } catch (e) { if (e && e.message === 'stale') throw e; }\n"
        "    let done = 0; if (!guided) for (const [a, b] of legs) { await this.along(a, b, 1, f => prog && prog((done + f) / legs.length * 0.5)); done++; }\n"
        "    const snaps = []; for (const p of P) { let s = this.snap(p[0], p[1], RW_SNAP); if (!s && guided) { await this.along(p, p, 1); s = this.snap(p[0], p[1], RW_SNAP); } if (!s) throw Object.assign(new Error('nosnap'), { at: P.indexOf(p) }); snaps.push(s); }")
    rep("      if (!R) { const a = P[k], b = P[(k + 1) % P.length]; await this.along(a, b, 3, f => prog && prog(0.5 + 0.4 * (k + f) / legs.length)); R = this.path(snaps[k], snaps[k + 1], back); }",
        "      if (!R && guided) { const a = P[k], b = P[(k + 1) % P.length]; await this.along(a, b, 1, f => prog && prog(0.5 + 0.4 * (k + f) / legs.length)); R = this.path(snaps[k], snaps[k + 1], back); }\n"
        "      if (!R) { const a = P[k], b = P[(k + 1) % P.length]; await this.along(a, b, 3, f => prog && prog(0.5 + 0.4 * (k + f) / legs.length)); R = this.path(snaps[k], snaps[k + 1], back); }")
    rep("say('route', 0); const R = await RWRoute.plan(spec.wp, spec.kind, f => say('route', f));", "say('route', 0); RWRoute.live = null; const R = await RWRoute.plan(spec.wp, spec.kind, f => say('route', f));")
    rep("  async route() { const id = ++this.rq, wp = this.wp.map(p => p.slice()), kind = this.kind; this.say('Finding the roads…');\n    try { const R = await RWRoute.plan(wp, kind, f => { if (id === this.rq) this.prog(f); }); if (id !== this.rq) return; this.prog(null);",
        "  async route() { const id = ++this.rq, wp = this.wp.map(p => p.slice()), kind = this.kind; this.say('Finding the roads…'); RWRoute.live = () => id === this.rq;\n"
        "    // (given two minutes at most: past that the map's servers are too slow to wait for)\n"
        "    try { let tm = null; const R = await Promise.race([RWRoute.plan(wp, kind, f => { if (id === this.rq) this.prog(f); }), new Promise((_, no) => { tm = setTimeout(() => no(new Error('slow')), 120000); })]).finally(() => clearTimeout(tm)); if (id !== this.rq) return; this.prog(null);")
    rep("    } catch (e) { if (id !== this.rq) return; this.prog(null); this.R = null; const m = e && e.message;\n      this.say(m === 'nosnap' ?",
        "    } catch (e) { if (id !== this.rq) return; this.prog(null); this.R = null; const m = e && e.message; if (m === 'slow' && this.rq === id) this.rq++; // (its queries stopped)\n      this.say(m === 'slow' ? 'The map’s servers are slow just now. Try again in a moment, or put the points closer together.' : m === 'nosnap' ?")
    open(path, 'w', encoding='utf-8').write(s)
    print(path, 'ok', n_ok, 'replacements')
if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3])
