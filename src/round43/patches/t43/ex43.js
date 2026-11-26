// ================= round 43: the exhaust's fittings as choices, and its sound from the pipe as it is built =================
// Four more choices for a build (CU43_KEYS, in the core): the flex joint, the hangers, the joints between the pipe's
// sections and how its bends were made. Each is drawn (ex40Fit) and each does what it does on a car (ex43Net, ex43Sound,
// cu36Flow, ex43Kg).
// The sound: the pipe behind the collector is no longer one tube of a given length with a filter after it. It is the
// chain of sections the car is drawn with - each run of pipe at its own length and bore, the catalyst, the resonators,
// the silencer's chambers and tubes, the tail behind it, the open end - and a pressure wave travels down and back
// through them, part of it turned back wherever the pipe's area changes (see PipeNet in EngineDSP). What a part does
// to the sound is then what its shape does to the wave: move the silencer, lengthen the tail, fit a wider bore, and
// the notes the pipe sings and the notes it swallows move as they would on the car.
const WS43_WORDS = { flex: [['braid', 'Braided'], ['bellows', 'Bare bellows'], ['none', 'Solid pipe']], hang: [['rubber', 'Rubber'], ['poly', 'Polyurethane'], ['solid', 'Solid']],
  joint: [['flange', 'Bolted flanges'], ['vband', 'V-band clamps'], ['slip', 'Slip joints'], ['weld', 'Welded']], bend: [['mandrel', 'Mandrel'], ['crush', 'Crush']] };
const WS43_NOTES = {
  flex: { braid: 'Braid over a lined bellows: the engine can rock without cracking the pipe; nothing is heard of it', bellows: 'A bare bellows: as free, but its ridges stir the gas: a little more hiss', none: 'No joint: the engine shakes the whole pipe: a boom in the cabin, and the manifold takes the strain' },
  hang: { rubber: 'Rubber blocks: the pipe’s shake stays out of the shell', poly: 'Polyurethane: holds the pipe steadier; some of its drone comes into the cabin', solid: 'Bolted straight to the shell: the pipe cannot move, and the cabin drones with it' },
  joint: { flange: 'Two plates and a gasket, bolted: gas-tight, heavy', vband: 'A vee clamp over two machined rings: gas-tight, light, apart in a minute', slip: 'One pipe pushed into the next under a band clamp: cheap; it weeps a little gas, a faint hiss', weld: 'Welded into one piece: the lightest and tight; nothing comes apart at service' },
  bend: { mandrel: 'Bent over a mandrel: the bore stays round and full', crush: 'Bent without one: every bend is pinched: more back pressure, a harsher rush' }
};
Object.assign(WS36_WORDS, WS43_WORDS);
WS40_NOTES.resT.quarter = 'A capped pipe beside the main one: it cancels the note whose quarter wave is its own length, and that note’s odd overtones';
// the Workshop's rows for them (the Exhaust tab, after 'Along the pipe')
function ws43Rows(W, add, B) {
  const seg = (k, label) => W.seg(k, WS43_WORDS[k], label);
  add(W.sec('Fittings'), W.row('Flex joint', seg('flex', 'Flex joint'), WS43_NOTES.flex[B.flex]), W.row('Hangers', seg('hang', 'Hangers'), WS43_NOTES.hang[B.hang]),
    W.row('Joints', seg('joint', 'Joints'), WS43_NOTES.joint[B.joint]), W.row('Bends', seg('bend', 'Bends'), WS43_NOTES.bend[B.bend]));
}
// ---- the hardware along the pipe (as round 40's, each kind as the build chooses it) ----
function ex40Fit(o) {
  const { body, bx, out, X, under, kick, r } = o, E = out.exhaust; if (!E || !E.runs || !E.runs.length || !X) return;
  const fx = X.flex || 'braid', hk = X.hang || 'rubber', jk = X.joint || 'flange', crush = X.bend === 'crush';
  const zinc = [0.56, 0.57, 0.59], rod = [0.2, 0.2, 0.21], rub = [0.03, 0.03, 0.034], braid = [0.5, 0.51, 0.53], dk = [0.3, 0.31, 0.33], poly = [0.62, 0.09, 0.07], blue = [0.24, 0.27, 0.42];
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), at = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const roof = z => { let y = under(z); for (const q of kick || []) if (z <= q.z0 && z >= q.z1) y = Math.max(y, q.y); return y; };
  const cyl = (a, b, rr, k, n) => ex36Pipe(body, a, b, rr, rr, k, n || 8, true, true), dirOf = (a, b) => { const l = len(a, b) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l]; };
  const along = (p, d, t) => [p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t];
  const done = () => { try { E.geo = ex43Geo(E, X); if (E.geo && o.S && o.S.id) EX43_GEO[o.S.id + ':' + (o.S.cuV || 0)] = E.geo; } catch (e) { E.geo = null; } };
  // (the level runs along the car: the pipe proper, where its joints and hangers are)
  const M = E.runs.filter(([a, b]) => { const l = len(a, b); return l > 0.3 && Math.abs(a[2] - b[2]) > 0.85 * l && Math.abs(a[1] - b[1]) < 0.03; }); if (!M.length) { done(); return; }
  const got = { fl: 0, hg: 0, cl: 0 };
  // a flange joint: two plates bolted face to face, three bolts round them
  const flange = (p, d) => { cyl(along(p, d, -0.007), along(p, d, 0.007), r + 0.021, zinc, 10); const u = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5, c = Math.cos(a) * (r + 0.012), s = Math.sin(a) * (r + 0.012), q = [p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s]; cyl(along(q, d, -0.014), along(q, d, 0.014), 0.0055, dk, 5); } got.fl++; };
  // a V-band: two machined rings face to face, a narrow vee clamp round them, its T-bolt under it
  const vband = (p, d) => { cyl(along(p, d, -0.012), along(p, d, 0.012), r + 0.006, dk, 10); cyl(along(p, d, -0.006), along(p, d, 0.006), r + 0.013, zinc, 12); bx(p[0] - 0.007, p[0] + 0.007, p[1] - r - 0.03, p[1] - r - 0.01, p[2] + 0.011, p[2] - 0.011, dk); got.fl++; };
  // a weld: a bead round the pipe, the metal blued either side of it
  const weld = (p, d) => { cyl(along(p, d, -0.011), along(p, d, 0.011), r + 0.0012, blue, 9); cyl(along(p, d, -0.0035), along(p, d, 0.0035), r + 0.004, [0.38, 0.38, 0.4], 9); got.fl++; };
  // a band clamp: a strap round a slip joint, its bolt under it
  const clamp = (p, d) => { cyl(along(p, d, -0.011), along(p, d, 0.011), r + 0.006, zinc, 10); bx(p[0] - 0.008, p[0] + 0.008, p[1] - r - 0.02, p[1] - r - 0.002, p[2] + 0.011, p[2] - 0.011, dk); got.cl++; };
  // (a joint in the pipe, and one at a box's end: flanged pipes are clamped to their boxes, as before)
  const joint = (p, d, atBox) => { if (jk === 'vband') vband(p, d); else if (jk === 'weld') weld(p, d); else if (jk === 'slip' || atBox) clamp(p, d); else flange(p, d); };
  // a hanger: a rod welded to the pipe, bent out and up into a block bolted under the floor (in a recess, up to its
  // roof): rubber, red polyurethane, or no block at all - a steel tab bolted to the shell
  const blk = hk === 'poly' ? poly : hk === 'solid' ? zinc : rub, bh = hk === 'solid' ? 0.014 : 0.045, rr = hk === 'solid' ? 0.0065 : 0.005;
  const hanger = (p, sd) => { const yF = roof(p[2]), x1 = p[0] + sd * (r + 0.05); if (yF - p[1] > 0.1) { cyl([p[0], p[1] + r * 0.8, p[2]], [p[0], yF - bh + 0.005, p[2]], rr, rod, 5); bx(p[0] - 0.02, p[0] + 0.02, yF - bh, yF, p[2] + 0.013, p[2] - 0.013, blk); }
    else { cyl([p[0] + sd * r * 0.8, p[1] - 0.004, p[2]], [x1, p[1] - 0.004, p[2]], rr, rod, 5); cyl([x1, p[1] - 0.004, p[2]], [x1, yF - bh + 0.016, p[2]], rr, rod, 5); bx(x1 - 0.02, x1 + 0.02, yF - bh - 0.001, yF, p[2] + 0.013, p[2] - 0.013, blk); } got.hg++; };
  const qwOn = !!(X.res && X.resT === 'quarter'), sdOf = p => Math.sign(p[0]) || 1, sdH = p => qwOn ? -sdOf(p) : sdOf(p); // (the hangers' side: outboard, or inboard of a pipe with a quarter-wave pipe beside it)
  // the first run: the joint off the down pipe, then the flex joint - braid over a bellows with a collar each end, or
  // the bellows bare (its ridges close together), or none
  { const [a, b] = M[0], d = dirOf(a, b), l = len(a, b); joint(along(a, d, 0.03), d);
    if (l > 0.3 && fx !== 'none') { const fl = Math.min(0.16, l - 0.16), f0 = along(a, d, 0.08), f1 = along(a, d, 0.08 + fl);
      if (fx === 'bellows') { const nr = Math.max(4, Math.round(fl / 0.02)); cyl(f0, f1, r + 0.002, [0.6, 0.61, 0.63], 10); for (let k = 0; k < nr; k++) cyl(along(f0, d, fl * (k + 0.5) / nr - 0.0045), along(f0, d, fl * (k + 0.5) / nr + 0.0045), r + 0.0105, [0.66, 0.67, 0.69], 10); }
      else { const nr = Math.max(2, Math.round(fl / 0.04)); cyl(f0, f1, r + 0.007, braid, 10); for (let k = 0; k < nr; k++) cyl(along(f0, d, fl * (k + 0.5) / nr - 0.005), along(f0, d, fl * (k + 0.5) / nr + 0.005), r + 0.0095, dk, 10); }
      cyl(along(f0, d, -0.012), along(f0, d, 0.012), r + 0.011, zinc, 10); cyl(along(f1, d, -0.012), along(f1, d, 0.012), r + 0.011, zinc, 10); out.rear.push(fx === 'bellows' ? 'bellows joint' : 'flex joint'); E.flex = [fl, fx]; } }
  // each run: a hanger every 0.8 m or so (one at least on a run over half a metre), a joint where a long run begins
  M.forEach(([a, b], i) => { const d = dirOf(a, b), l = len(a, b), n = l > 0.55 ? Math.max(1, Math.round(l / 0.8)) : 0; for (let k = 0; k < n; k++) hanger(at(a, b, (k + 0.62) / (n + 0.24)), sdH(a)); if (i > 0 && l > 0.6) joint(along(a, d, 0.04), d); });
  // each box: a joint on the pipe at each end and a hanger by it
  for (const B of E.boxes || []) { const x = (B[0] + B[1]) / 2, alongX = B[1] - B[0] > (B[4] - B[5]) * 1.15; if (alongX) continue; const y = Math.min((B[2] + B[3]) / 2, B[2] + 0.032), d = [0, 0, -1];
    joint([x, y, B[4] + 0.03], d, true); joint([x, y, B[5] - 0.03], d, true); hanger([x, y, B[5] - 0.07], sdH([x])); }
  // crush bends: the pipe pinched and creased at each bend
  if (crush) { let n = 0; for (let i = 0; i + 1 < E.runs.length; i++) { const [a, b] = E.runs[i], [c, e] = E.runs[i + 1]; if (len(b, c) > 0.012 || len(a, b) < 0.04 || len(c, e) < 0.04) continue; const d1 = dirOf(a, b), d2 = dirOf(c, e), dot = d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2]; if (dot > 0.955) continue;
      const m = dirOf([0, 0, 0], [d1[0] + d2[0], d1[1] + d2[1], d1[2] + d2[2]]); cyl(along(b, m, -0.016), along(b, m, 0.016), r + 0.0025, [0.2, 0.17, 0.15], 6); n++; } if (n) out.rear.push('crush bends'); }
  // a quarter-wave resonator: a capped pipe on a tee behind the flex joint, lying outboard of the main pipe (whose
  // hangers then go on its inner side) back as far as the silencer, past the middle box and standing off it; as long as
  // the note it is to cancel asks - a quarter of the wave of the drone at cruising revs - or as that stretch allows
  if (qwOn) { const y0 = M[0][0][1], lev = M.filter(([a]) => Math.abs(a[1] - y0) < 0.03), xl = lev[lev.length - 1][1][0], sd = sdOf([xl]), sil = (E.seq || []).filter(q => q[0] === 1 && q[1] !== 'mid').map(q => q[6]), mids = (E.seq || []).filter(q => q[0] === 1 && q[1] === 'mid');
    const l0 = len(M[0][0], M[0][1]); let zA = M[0][0][2] - (l0 > 0.3 && fx !== 'none' ? Math.min(0.16, l0 - 0.16) + 0.12 : 0.07), zB = Math.min(...lev.map(q => q[1][2])); for (const z of sil) if (z < zA) zB = Math.max(zB, z + 0.05);
    const onPipe = z => { for (const [a, b] of M) if (a[2] >= z - 1e-6 && b[2] <= z + 1e-6) { const t = (a[2] - z) / ((a[2] - b[2]) || 1); return at(a, b, t); } return null; }, a0 = onPipe(zA);
    const cyls = (o.S && typeof ENGINE_CFG !== 'undefined' && ENGINE_CFG[o.S.id] && ENGINE_CFG[o.S.id].cyl) || 4, need = EX43_C / (4 * (2500 / 60 * cyls / 2)), past = mids.some(q => q[6] < zA + 0.01 && q[7] > zB - 0.01), xs = xl + sd * (past ? 0.07 + r * 0.9 + 0.012 : 2 * r + 0.014);
    if (a0) { const off = Math.abs(xs - a0[0]), L = Math.min(need - off, zA - zB - 0.04);
      if (L > 0.22) { const k = ex40K([0.43, 0.396, 0.36], X, 9), j0 = [xs, a0[1], zA], j1 = [xs, a0[1], zA - L]; cyl(a0, j0, r * 0.9, k, 7); ex36Pipe(body, j0, j1, r * 0.9, r * 0.9, k, 8, true, true);
        for (let t = 0.4; t < L - 0.05; t += 0.7) { const z = zA - t, q = onPipe(z); if (q && Math.abs(q[0] - xs) < 0.2) bx(Math.min(q[0], xs) - 0.004, Math.max(q[0], xs) + 0.004, q[1] - 0.004, q[1] + 0.008, z + 0.012, z - 0.012, dk); } // (straps across to the main pipe)
        E.qw = [+(L + off).toFixed(3), a0]; out.rear.push('quarter-wave resonator'); } } }
  if (got.fl) out.rear.push(jk === 'vband' ? 'V-bands' : jk === 'weld' ? 'welded joints' : 'flanges'); if (got.hg) out.rear.push('hangers'); if (got.cl) out.rear.push('clamps'); E.hw = got; done();
}
// ---- the pipe as it was laid, for the sound ----
// From the first run to the first tailpipe's end, in the order the gas goes: runs of pipe (length, bends) and the
// boxes' places (the middle one, the silencer's), found by walking the runs and boxes as they join. geo: { d bore mm,
// np tailpipes, el: [['p', length, bends] | ['b', kind, across the car, height, along the car, catalyst inside]],
// len, man: the down pipe's part of it, br: how far along the tailpipes part, qw: a quarter-wave pipe's [length, how
// far along] }
const EX43_C = 500, EX43_GEO = {};
function ex43Geo(E, X) {
  const seq = E.seq; if (!seq || !seq.length) return null;
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), N = [], id = p => { for (let i = 0; i < N.length; i++) if (d3(N[i], p) < 0.012) return i; N.push(p); return N.length - 1; }, Ed = [];
  let src = -1; for (const q of seq) if (q[0] !== 1) { const u = id(q[1]), v = id(q[2]); if (src < 0) src = u; Ed.push([u, v, d3(q[1], q[2]), q[0] === 2 ? 'm' : 'p', null]); }
  const nP = N.length; for (const q of seq) { if (q[0] !== 1) continue; const x0 = q[2], x1 = q[3], y0 = q[4], y1 = q[5], z0 = q[6], z1 = q[7], across = (x1 - x0) > (z0 - z1) * 1.15, L = across ? x1 - x0 : z0 - z1, b = N.length; N.push([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
    for (let i = 0; i < nP; i++) { const p = N[i]; if (p[0] > x0 - 0.07 && p[0] < x1 + 0.07 && p[1] > y0 - 0.14 && p[1] < y1 + 0.14 && p[2] < z0 + 0.07 && p[2] > z1 - 0.07) Ed.push([i, b, L / 2, 'b', q]); } }
  if (src < 0) return null;
  // (the shortest way from the first run's start to a point)
  const adj = N.map(() => []); Ed.forEach((e, k) => { adj[e[0]].push([e[1], k]); adj[e[1]].push([e[0], k]); });
  const dist = N.map(() => 1e9), via = N.map(() => -1), from = N.map(() => -1), doneN = N.map(() => false); dist[src] = 0;
  for (;;) { let u = -1; for (let i = 0; i < N.length; i++) if (!doneN[i] && dist[i] < 1e8 && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0) break; doneN[u] = true; for (const [v, k] of adj[u]) if (dist[u] + Ed[k][2] < dist[v]) { dist[v] = dist[u] + Ed[k][2]; via[v] = k; from[v] = u; } }
  const pathTo = p => { let t = -1, bd = 0.06; for (let i = 0; i < nP; i++) { const q = d3(N[i], p); if (q < bd && dist[i] < 1e8) { bd = q; t = i; } } if (t < 0) return null; const P = []; for (let v = t; v !== src && v >= 0; v = from[v]) P.unshift([via[v], from[v], v]); return P; };
  const ends = (E.ends && E.ends.length ? E.ends : E.tips) || [], P0 = ends.length ? pathTo(ends[0]) : null; if (!P0 || !P0.length) return null;
  const el = []; let s = 0, man = 0, lastDir = null, box = null;
  for (const [k, u, v] of P0) { const e = Ed[k];
    if (e[3] === 'b') { if (box === e[4]) { box = null; continue; } box = e[4]; const q = e[4]; el.push(['b', q[1], +(q[3] - q[2]).toFixed(3), +(q[5] - q[4]).toFixed(3), +(q[6] - q[7]).toFixed(3), q[8] ? 1 : 0]); s += 2 * e[2]; lastDir = null; continue; }
    const a = N[u], b = N[v], L = e[2], dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L]; let T = el[el.length - 1]; if (!T || T[0] !== 'p') { T = ['p', 0, 0]; el.push(T); }
    if (lastDir && lastDir[0] * dir[0] + lastDir[1] * dir[1] + lastDir[2] * dir[2] < 0.955) T[2]++; T[1] += L; s += L; if (e[3] === 'm') man += L; lastDir = dir; }
  for (const T of el) if (T[0] === 'p') T[1] = +T[1].toFixed(3);
  // (where the tailpipes part: as far as the ways to the first two ends are one)
  let br = null; if (ends.length > 1) { const P1 = pathTo(ends[1]); if (P1) { let c = 0, i = 0; while (i < P0.length && i < P1.length && P0[i][0] === P1[i][0]) { c += Ed[P0[i][0]][2]; i++; } br = +c.toFixed(3); } }
  // (how far along a point beside the pipe is: a quarter-wave pipe's joint)
  let qw = null; if (E.qw) { let best = 1e9, sAt = 0, c = 0; for (const [k, u, v] of P0) { const a = N[u], b = N[v], L = Ed[k][2]; if (Ed[k][3] !== 'b') { const t = Math.max(0, Math.min(1, ((E.qw[1][0] - a[0]) * (b[0] - a[0]) + (E.qw[1][1] - a[1]) * (b[1] - a[1]) + (E.qw[1][2] - a[2]) * (b[2] - a[2])) / (L * L || 1))), q = d3(E.qw[1], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); if (q < best) { best = q; sAt = c + t * L; } } c += L; } qw = [E.qw[0], +sAt.toFixed(3)]; }
  return { d: X.d || Math.round((X.r - 0.002) * 2000), np: Math.max(1, ends.length), el, len: +s.toFixed(3), man: +man.toFixed(3), br, qw };
}
// a build's pipe where its own car has not been drawn yet: its body's own route with the build's parts in it (a place
// made for a middle box or a silencer the body's own pipe has none for), stretched to the build's length
function ex43GeoFor(S, B, S0) {
  const own = EX43_GEO[S.id + ':' + (S.cuV || 0)]; if (own) return own; const G0 = (typeof EX43_STOCK !== 'undefined' && EX43_STOCK[S0.id]) || null; if (!S.cu) return G0; if (!G0) return null;
  const B0 = cuBare(S0).B, k = clamp(exLength(B, S0) / exLength(B0, S0), 0.3, 1.6), el = G0.el.map(e => e[0] === 'p' ? ['p', +(e[1] * k).toFixed(3), e[2]] : e.slice());
  const has = kind => el.some(e => e[0] === 'b' && e[1] === kind), split = (kind, L, w, frac) => { let j = -1; for (let i = 0; i < el.length; i++) if (el[i][0] === 'p' && (j < 0 || el[i][1] > el[j][1])) j = i; if (j < 0 || el[j][1] < L + 0.3) return; const T = el[j], rest = T[1] - L; el.splice(j, 1, ['p', +(rest * frac).toFixed(3), T[2]], ['b', kind, w, 0.11, L, 0], ['p', +(rest * (1 - frac)).toFixed(3), 0]); };
  if (((B.cat && B.cat !== 'none') || B.res) && !has('mid')) split('mid', B.cat && B.cat !== 'none' && B.res ? 0.48 : 0.32, 0.14, 0.45);
  if (B.muff && B.muff !== 'none' && !has('sil')) split('sil', 0.45, 0.3, 0.8);
  return { d: (exInfo(B, cuEngineOn(B)) || {}).D || G0.d, np: B.tail === 2 ? 2 : 1, el, len: +(G0.len * k).toFixed(3), man: G0.man, br: B.tail === 2 ? +(G0.len * k - 0.5).toFixed(3) : null, qw: null };
}
// ---- the chain of sections (see PipeNet) ----
// Each section: [length m, area m2, speed of sound in it m/s, what is left of a wave after one pass, the corner (Hz)
// above which its lining soaks the wave up (0: none), the share that passes the lining untouched]. By part:
//   pipe             its bore; a hundredth lost to its walls for every metre; a crush bend a short pinched stretch
//   bare bellows     a little wider, lossy
//   catalyst         the honeycomb's open face (wider than the pipe) between two cones; a road one's finer cells
//                    take more of the wave, and more of its top
//   resonator        chamber: a side chamber on a neck, taking out the one note it is tuned to (and a second at
//                    twice that); quarter-wave: a capped pipe on a tee, as long as it is drawn; straight-through: a
//                    wider tube in packing
//   silencer         straight-through: the shell's width felt at low notes, the packing soaking up the top;
//                    chambered: two chambers with a wide gap in the plate between them;
//                    turbo: three passes up and down the box through two tubes, a chamber at each turn; road: the
//                    same with narrower, lined tubes and a side chamber against the boom
//   tail             the pipes behind where they part: their areas together
//   end              the open end sends most of a low note back up the pipe and lets a high one out, the corner
//                    between them set by its width (a megaphone widens it in two steps: less comes back)
function ex43Net(B, geo, K, tip) {
  if (!geo || !geo.el || !geo.el.length) return null;
  const c = EX43_C, Ap = Math.PI * Math.pow(geo.d / 2000, 2), np = geo.np || 1, sec = [], tag = [], pos = [], nt = [], st = [], cylN = K.cyl || B.cyl || 4, fd = 2500 / 60 * cylN / 2, crush = B.bend === 'crush';
  let at = 0; const wall = L => Math.exp(-0.012 * L);
  const push = (L, A, k, fc, mx, t) => { if (!(L > 0.004)) return; sec.push([+L.toFixed(4), A, c, k == null ? wall(L) : k, fc || 0, mx || 0]); tag.push(t || 'p'); pos.push(at); };
  const pipe = (L, nb) => { if (crush && nb > 0) { const piece = Math.max(0.01, (L - 0.03 * nb) / (nb + 1)); for (let i = 0; i <= nb; i++) { push(piece, Ap); if (i < nb) push(0.03, Ap * 0.72, 0.985, 0, 0, 'k'); } } else push(L, Ap, wall(L) * Math.pow(0.997, nb || 0)); };
  const resn = (Lr, n) => { const T = B.resT || 'helm'; for (let i = 0; i < n; i++) { const Li = Lr / n;
    if (T === 'bottle') push(Li, Ap * 1.7, 0.95, 1900, 0.45, 'r'); else if (T === 'quarter') push(Li, Ap); else { nt.push([sec.length, +(fd * (i + 1)).toFixed(1), 2.5, i ? 0.45 : 0.55]); push(Li, Ap * 1.25, null, 0, 0, 'r'); } } };
  const mid = (Lm, w, noRes) => { const cat = B.cat && B.cat !== 'none', res = noRes ? 0 : (B.res || 0); if (!cat && !res) { push(Lm, Ap); return; }
    if (cat) { const big = B.cat === 'stock', lc = res ? Lm * 0.55 : Lm, ru = big ? Math.min(w / 2, 0.085) : 0.062, rv = big ? 0.058 : 0.056, A = Math.max(Ap * 1.2, Math.PI * ru * rv * 0.72);
      push(0.05, (Ap + A) / 2, null, 0, 0, 'c'); push(Math.max(0.03, lc - 0.1), A, big ? 0.74 : 0.87, big ? 2800 : 5200, 0.5, 'c'); push(0.05, (Ap + A) / 2, null, 0, 0, 'c'); if (res) resn(Lm - lc, res > 1 ? 2 : 1); }
    else resn(Lm, res); };
  // (the down pipe from the manifold is part of the pipe as laid; where the engine's own figures already carry the
  // second pipes of a two-stage manifold, K.sec, that much of it is theirs and is not counted twice)
  const cut = K.sec && K.sec.length ? Math.min(geo.man || 0, K.sec.reduce((a, b) => a + b, 0) / K.sec.length) : 0;
  let first = true;
  for (const e of geo.el) {
    if (e[0] === 'p') { let L = e[1]; if (first && cut) L = Math.max(0.2, L - cut); if (first && B.flex === 'bellows' && L > 0.3) { push(0.08, Ap); push(0.14, Ap * 1.1, 0.97, 4500, 0.6, 'f'); L -= 0.22; } pipe(L, e[2] || 0); at += e[1]; first = false; continue; }
    const kind = e[1], wx = e[2], h = e[3], zl = e[4], across = wx > zl * 1.15, L = across ? wx : zl; first = false;
    if (kind === 'mid') { mid(L, wx); at += L; continue; }
    let Ls = L; if (e[5] && B.cat && B.cat !== 'none' && L > 0.3) { mid(L * 0.42, 0.14, true); Ls = L * 0.58; }
    const mf = B.muff || 'straight', hh = Math.min(0.068, h / 2), hw = (across ? zl : wx) / 2, sc = mf === 'turbo' ? 0.86 : 1, As = Math.max(Ap * 1.5, Math.PI * hw * sc * hh * (mf === 'chamber' ? 1 : 1.05) * sc);
    if (mf === 'none') push(Ls, Ap);
    else if (mf === 'straight') { const rr = Math.min(hh * 1.05, 0.062), A = Ap + 0.5 * Math.max(0, Math.PI * rr * rr - Ap); push(0.04, Ap, null, 0, 0, 's'); push(Math.max(0.05, Ls - 0.08), A, 0.9, 1300, 0.3, 's'); push(0.04, Ap, null, 0, 0, 's'); }
    else if (mf === 'chamber') { const Lc = Math.max(0.12, Ls - 0.04); push(Lc * 0.55, As * 0.55, 0.975, 0, 0, 's'); push(0.04, Ap * 1.8, 0.99, 0, 0, 's'); push(Lc * 0.45, As * 0.55, 0.975, 0, 0, 's'); } // (two chambers, the gap in the plate between them wider than the pipe: the gas is turned, not choked)
    else if (mf === 'turbo') { push(Ls * 0.15, As * 0.9, 0.97, 0, 0, 's'); push(Ls * 0.85, Ap, 0.9, 2000, 0.4, 's'); push(Ls * 0.15, As * 0.9, 0.97, 0, 0, 's'); push(Ls * 0.85, Ap, 0.9, 2000, 0.4, 's'); push(Ls * 0.15, As * 0.9, 0.97, 0, 0, 's'); }
    else { push(Ls * 0.18, As * 0.8, 0.95, 0, 0, 's'); push(Ls * 0.8, Ap * 0.7, 0.88, 1500, 0.35, 's'); push(Ls * 0.18, As * 0.8, 0.95, 0, 0, 's'); nt.push([sec.length, 105, 1.6, 0.5]); push(Ls * 0.8, Ap * 0.7, 0.88, 1500, 0.35, 's'); push(Ls * 0.2, As * 0.8, 0.95, 0, 0, 's'); }
    at += L;
  }
  if (!sec.length) return null;
  // (the tail's pipes together, behind where they part)
  if (np > 1 && geo.br != null) for (let i = 0; i < sec.length; i++) if (tag[i] === 'p' && pos[i] >= geo.br - 0.02) sec[i][1] = Ap * np;
  // (a quarter-wave pipe on its tee: at the joint between the sections nearest where it is drawn; a second resonator a
  // pipe half as long)
  if (B.res && B.resT === 'quarter') { const q = geo.qw || [Math.min(EX43_C / (4 * fd), 0.9), geo.len * 0.5]; let j = 1; for (let i = 1; i < sec.length; i++) if (Math.abs(pos[i] - q[1]) < Math.abs(pos[j] - q[1])) j = i;
    if (sec.length > 1) { st.push([j - 1, Ap * 0.81, +q[0].toFixed(3), c, 0.97]); if (B.res > 1 && j < sec.length - 1) st.push([j, Ap * 0.81, +(q[0] / 2).toFixed(3), c, 0.97]); }
    else { const T = sec[0], L = T[0]; sec.splice(0, 1, [+(L / 2).toFixed(4), T[1], c, Math.sqrt(T[3]), T[4], T[5]], [+(L / 2).toFixed(4), T[1], c, Math.sqrt(T[3]), T[4], T[5]]); tag.splice(0, 1, 'p', 'p'); st.push([0, Ap * 0.81, +q[0].toFixed(3), c, 0.97]); } }
  // (the end)
  let aEnd = geo.d / 2000, ro = 0.8; if (tip === 'mega') { const T = sec[sec.length - 1]; if (T[0] > 0.25) T[0] = +(T[0] - 0.16).toFixed(4); sec.push([0.08, T[1] * 1.5, c, 1, 0, 0], [0.08, T[1] * 2.2, c, 1, 0, 0]); aEnd *= 1.5; ro = 0.62; }
  // (stretches of the same bore with nothing between them are one section: fewer for the sound to work through)
  for (let i = sec.length - 1; i > 0; i--) { const a = sec[i - 1], b = sec[i]; if (Math.abs(a[1] - b[1]) > 1e-9 || a[4] || b[4] || nt.some(q => q[0] === i) || st.some(q => q[0] === i - 1)) continue;
    a[0] = +(a[0] + b[0]).toFixed(4); a[3] *= b[3]; sec.splice(i, 1); for (const q of nt) if (q[0] > i) q[0]--; for (const q of st) if (q[0] >= i) q[0]--; }
  const fo = 0.83 * c / (2 * Math.PI * aEnd) * ((K.mainLoss || 0.5) / 0.5), rs = (K.turbo ? 0.55 : 0.3) / 0.8;
  return { sec: sec.map(q => [q[0], +q[1].toFixed(6), q[2], +q[3].toFixed(4), q[4], q[5]]), nt, st, rs: +rs.toFixed(4), ro, fo: Math.round(fo), g: 1, sh: 0, info: { len: +(geo.len - cut).toFixed(2), n: sec.length, d: geo.d, np } };
}
// how loud a chain passes low notes (80-500 Hz) and high ones (1.2-5 kHz): from its answer to one click
let EX43_PN = null;
function ex43Resp(net) {
  const PN = EX43_PN || (EX43_PN = EngineDSPDef().PipeNet), sr = 48000, p = new PN(sr, Object.assign({}, net, { g: 1, sh: 0 })), n = 6000, h = new Float64Array(n); h[0] = p.run(1); for (let i = 1; i < n; i++) h[i] = p.run(0);
  const band = (f0, f1) => { let E = 0; for (let k = 0; k < 20; k++) { const f = f0 * Math.pow(f1 / f0, (k + 0.5) / 20), w = 2 * Math.PI * f / sr; let re = 0, im = 0; for (let i = 0; i < n; i++) { re += h[i] * Math.cos(w * i); im -= h[i] * Math.sin(w * i); } E += re * re + im * im; } return E / 20; };
  return { lo: band(80, 500), hi: band(1200, 5000) };
}
// A car's own voice is kept: each car's sound was set by ear with its own exhaust on it, and the chain now holds that
// exhaust's boxes as well. So each body's own chain is measured against the same pipe with no boxes in it, and what its
// boxes take (low and high) is given back to every chain on that body: the car as entered sounds as loud and as bright
// as it did, and a build is quieter or louder, duller or sharper than it by what its own parts do.
const EX43_COMP = {};
function ex43Comp(S0) {
  if (EX43_COMP[S0.id]) return EX43_COMP[S0.id]; let r = [1, 0]; const T0 = typeof EX43_STOCK !== 'undefined' && EX43_STOCK[S0.id]; if (T0 && T0.cp) return EX43_COMP[S0.id] = T0.cp; // (worked out when the page was built, kept with the car's pipe)
  try { const B0 = cuBare(S0).B, G = typeof EX43_STOCK !== 'undefined' && EX43_STOCK[S0.id], K0 = ENGINE_CFG[S0.id] || {};
    if (G && (B0.muff !== 'none' || B0.cat !== 'none' || B0.res)) { const a = ex43Net(B0, G, K0, 'own'), b = ex43Net(Object.assign({}, B0, { cat: 'none', res: 0, muff: 'none' }), G, K0, 'own'); if (a && b) { const Ra = ex43Resp(a), Rb = ex43Resp(b), g = clamp(Math.sqrt(Rb.lo / Ra.lo), 0.7, 16), hi = clamp(Math.sqrt(Rb.hi / Ra.hi), 0.7, 60); r = [+g.toFixed(3), +clamp(hi / g - 1, -0.5, 8).toFixed(3)]; } } } catch (e) { }
  return EX43_COMP[S0.id] = r;
}
// the car's chain, for its sound's figures (engineCfg): from its pipe as drawn where its car has been drawn, its body's
// own route otherwise; none for a vehicle whose exhaust is not routed under it (an upright stack), which sounds as before
function ex43For(S, K) {
  try { const S0 = S.cu ? cuBody(S.cu.body) : S; if (!S0 || typeof cuBody !== 'function' || !cuBody(S0.id)) return; const B = S.cu || cuBare(S0).B, geo = ex43GeoFor(S, B, S0); if (!geo) return;
    const L = typeof lkDecode === 'function' && B.look ? lkDecode(B.look) : null, net = ex43Net(B, geo, K, (L && L.tip) || 'own'); if (!net) return; const cp = ex43Comp(S0); net.g = cp[0]; net.sh = cp[1]; K.net = net;
    const sb = ({ rubber: 0, poly: 0.08, solid: 0.2 }[B.hang] || 0) + (B.flex === 'none' ? 0.1 : 0); if (sb) K.sbG = sb; } catch (e) { }
}
// a build's sound figures where the chain now does the work: the tuned filter after the pipe is its donor car's own
// again (the build's silencer, catalyst, resonators, bore, tail and bends are in the chain), the pipe wall's ring is kept
function ex43Sound(K, B, S0, E, Kref) {
  if (typeof EX43_STOCK === 'undefined' || !EX43_STOCK[S0.id] || !Kref) return;
  if (Kref.sil) K.sil = Kref.sil.slice(); if (Kref.silMix != null) K.silMix = Kref.silMix; if (Kref.mainLoss != null) K.mainLoss = Kref.mainLoss; delete K.cham;
  K.res = (K.res || []).filter(r => r[2] < 0 && r[0] > 1500);
  // (what the fittings add to the gas's rush: a bare bellows' ridges, a slip joint's weep, pinched bends)
  const k = (B.flex === 'bellows' ? 1.06 : 1) * (B.joint === 'slip' ? 1.03 : 1) * (B.bend === 'crush' ? 1.12 : 1); if (k !== 1) K.flow = +((K.flow || 0.3) * k).toFixed(3);
}
// (for the test harnesses: a car's mesh built once, so its pipe is known)
function ex43Prime(S) { const key = S.id + ':' + (S.cuV || 0); if (EX43_GEO[key]) return EX43_GEO[key]; try { const m = buildCarMesh(S, false, false, null); dropCarMesh(m); } catch (e) { } return EX43_GEO[key] || null; }
