// ================= round 44: two pipes and what joins them - true dual, H-pipe, X-pipe, Y-pipe =================
// A vee or a flat engine's two banks with a tailpipe each (the Crossover and Tailpipes choices; ex44Xo in the core says
// which): drawn as two pipes, one down each side of the car from its own bank's manifold through its own boxes to its
// own tailpipe, the second the mirror of the first. Between them, behind the collectors:
//   none    nothing: each bank is heard at its own tailpipe
//   H-pipe  a balance tube across, three quarters of the bore, dropping under the propshaft where there is one
//   X-pipe  the two pipes brought together side by side on the car's middle and welded into one for a hand's length
// A Y-pipe is the pipe as before: the far bank's down pipe crossing to the near one's collector, one pipe from there.
// The sound is the same net of sections as the single pipe's, twice over and joined as drawn (ex44Net2, PipeNet2).
const ex44Mir = p => [-p[0], p[1], p[2]];
// how low a pipe crossing the car's middle at z must go: under the propshaft or the gearbox's tail where one is there,
// never nearer the road than 13 cm
function ex44Low(o, z, y, rr) {
  let bot = 9; const p = o.prop; if (p && p.a) { const zb = p.b ? p.b[2] : 2 * p.zm - p.a[2]; if (z < p.a[2] + 0.05 && z > zb - 0.05) bot = Math.min(p.a[1], p.ym != null ? p.ym : p.a[1]) - 0.048; }
  const g = o.gb; if (g && g.z1 != null && z < (g.z0 != null ? g.z0 : g.z1 + 0.5) + 0.02 && z > g.z1 - 0.02 && g.y0 != null) bot = Math.min(bot, g.y0);
  return Math.max(0.13 + rr, Math.min(y, bot - rr - 0.012));
}
// an X-pipe on the run from a back to b: where the lane's own pipe swings in to the middle and out again (its mirror
// does the same from the other side): [in, out, middle], or null where the run is too short for it
function ex44X(a, b, r, sx, o) {
  const dz = a[2] - b[2]; if (dz < 0.46) return null; const zX = Math.max(b[2] + 0.23, a[2] - Math.max(0.23, Math.min(0.34, dz / 2))), rx = r * 0.85, y = ex44Low(o, zX, a[1], r);
  return [[sx * rx, y, zX + 0.11], [sx * rx, y, zX - 0.11], [sx * rx, y, zX]];
}
// after the pipes are laid: the far side's ends, and the crossover between the two (o: the kit's drawing tools and what
// is on the car's middle line). Leaves E.xo = { t, at: where on the lane's pipe, L: the balance tube's length, side }
function ex44Cross(o) {
  const { body, bx, out, X, r, sx } = o, E = out.exhaust, t = X.xo; if (!E || !t) return;
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), cyl = (a, b, rr, k, n) => ex36Pipe(body, a, b, rr, rr, k, n || 8, true, true), steel = ex40K([0.43, 0.396, 0.36], X, 9), zinc = [0.56, 0.57, 0.59];
  for (const e of E.ends.slice()) if (!E.ends.some(q => d3(q, ex44Mir(e)) < 0.02)) E.ends.push(ex44Mir(e));
  for (const e of E.tips.slice()) if (!E.tips.some(q => d3(q, ex44Mir(e)) < 0.02)) E.tips.push(ex44Mir(e));
  const side = E.runs.filter(([a, b]) => (a[0] + b[0]) * sx > -0.02 && !E.seq.some(q => q[0] === 2 && q[1] === a && q[2] === b)); // (the lane's own runs behind its collector)
  if (!side.length) { E.xo = { t: 'none', at: E.runs[0][0], L: 0, side: sx }; return; }
  if (t === 'none') { E.xo = { t, at: side[0][0], L: 0, side: sx }; return; }
  if (t === 'x' && out.x44) { // (laid with the pipes: a welded seam where the two lie together, a strap round them)
    const c = out.x44.at; cyl([0, c[1], c[2] + 0.1], [0, c[1], c[2] - 0.1], r * 0.62, steel, 6); cyl([0, c[1], c[2] + 0.012], [0, c[1], c[2] - 0.012], r * 1.02 + 0.004, zinc, 8);
    E.xo = { t, at: c, L: 0, side: sx }; out.rear.push('X-pipe'); return; }
  // an H-pipe's balance tube (and an X-pipe where the run was too short to bring the pipes together: a short box
  // between them that both open into): on the first long level run behind the collector, behind the flex joint
  const lev = side.filter(([a, b]) => Math.abs(a[1] - b[1]) < 0.03 && d3(a, b) > 0.3), R = lev[0] || side[0], l = Math.max(1e-6, d3(R[0], R[1])); // (no long level run - a mid or rear engine's short pipes: on the first run behind the collector, ahead of the silencer)
  const u = Math.max(0, Math.min(l - 0.05, lev[0] ? Math.max(0.3, Math.min(0.4, l * 0.6)) : l * 0.5)) / l, p = [R[0][0] + (R[1][0] - R[0][0]) * u, R[0][1] + (R[1][1] - R[0][1]) * u, R[0][2] + (R[1][2] - R[0][2]) * u];
  if (Math.abs(p[0]) < r + 0.02) { E.xo = { t: 'none', at: p, L: 0, side: sx }; return; } // (the two pipes already touch there: nothing to bridge)
  const rH = r * 0.75, yH = ex44Low(o, p[2], p[1], rH), q = ex44Mir(p), xi = Math.min(Math.abs(p[0]) - 0.02, 0.085); let L;
  if (yH > p[1] - 0.012) { cyl(p, q, rH, steel, 7); L = d3(p, q); }
  else { const a = [sx * xi, yH, p[2]], b = ex44Mir(a); cyl(p, a, rH, steel, 7); cyl(a, b, rH, steel, 7); cyl(b, q, rH, steel, 7); L = d3(p, a) * 2 + d3(a, b); }
  for (const e of [p, q]) { const s = Math.sign(e[0]); cyl([e[0] - s * (r + 0.004), e[1], e[2]], [e[0] - s * (r + 0.02), e[1], e[2]], rH + 0.006, zinc, 8); } // (a collar where it is welded to each pipe)
  if (t === 'x') { const yc = yH > p[1] - 0.012 ? p[1] : yH; cyl([-0.07, yc, p[2]], [0.07, yc, p[2]], r * 1.25, steel, 9); out.rear.push('X-pipe'); E.xo = { t, at: p, L: 0, side: sx }; }
  else { out.rear.push('H-pipe'); E.xo = { t, at: p, L: +L.toFixed(3), side: sx }; }
}
// the lane's own pipe measured as the single pipe is (its mirror is the same), and how far along it the crossover is
function ex44Geo(E, X) {
  const xo = E.xo, sx = xo.side, on = p => p[0] * sx > -0.03, seq = E.seq.filter(q => q[0] === 1 ? ((q[2] + q[3]) / 2 * sx > -0.03 || (q[2] < 0 && q[3] > 0)) : on(q[1]) && on(q[2]));
  const g = ex43Geo(Object.assign({}, E, { seq, ends: E.ends.filter(on) }), X); if (!g) return null;
  let best = 1e9, sAt = 0, c = 0; const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (const q of seq) { if (q[0] === 1) { c += Math.max(q[3] - q[2] > (q[6] - q[7]) * 1.15 ? q[3] - q[2] : q[6] - q[7], 0); continue; } const a = q[1], b = q[2], L = d3(a, b), t = Math.max(0, Math.min(1, ((xo.at[0] - a[0]) * (b[0] - a[0]) + (xo.at[1] - a[1]) * (b[1] - a[1]) + (xo.at[2] - a[2]) * (b[2] - a[2])) / (L * L || 1))), dd = d3(xo.at, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); if (dd < best) { best = dd; sAt = c + t * L; } c += L; }
  g.np = 1; g.br = null; g.xo = [xo.t, +Math.min(sAt, g.len - 0.05).toFixed(3), xo.L || 0]; return g;
}
// the net for two pipes from one pipe's chain (N, from ex43Net) and where the crossover is (geo.xo): the chain twice,
// each with its bank's pulses at its head and its own open end; at the crossover an H-pipe is a tee on each pipe with
// the balance tube between them, an X-pipe one joint of all four pipe ends, none nothing
function ex44Net2(N, geo, B) {
  const xo = geo.xo; if (!xo || !N || !N.sec || !N.sec.length) return null;
  const sec = N.sec.map(q => q.slice()), nt = (N.nt || []).map(q => q.slice()), st = (N.st || []).map(q => q.slice());
  const splitAt = (i, l1) => { const T = sec[i], k1 = Math.pow(T[3], l1 / T[0]); sec.splice(i, 1, [+l1.toFixed(4), T[1], T[2], k1, T[4], T[5]], [+(T[0] - l1).toFixed(4), T[1], T[2], T[3] / k1, T[4], T[5]]); for (const q of nt) if (q[0] > i) q[0]++; for (const q of st) if (q[0] >= i) q[0]++; };
  let k = -1; if (xo[0] !== 'none') { const target = Math.max(0.05, xo[1] - Math.max(0, geo.len - N.info.len)); let c = 0, i = 0; for (; i < sec.length - 1; i++) { if (c + sec[i][0] > target) break; c += sec[i][0]; }
    const l1 = target - c; if (l1 > 0.03 && sec[i][0] - l1 > 0.03) { splitAt(i, l1); k = i; } else k = l1 <= 0.03 ? i - 1 : i;
    if (k < 0) { splitAt(0, Math.min(0.05, sec[0][0] / 2)); k = 0; } if (k > sec.length - 2) { splitAt(sec.length - 1, sec[sec.length - 1][0] / 2); k = sec.length - 2; } }
  const n = sec.length, S2 = [], nodes = [], NT = []; for (let s = 0; s < 2; s++) for (const q of sec) S2.push(q.slice());
  let hSec = -1, xInc = null; const A0 = sec[Math.max(0, k)][1], c = sec[0][2];
  if (xo[0] === 'h') { hSec = S2.length; const L = Math.max(0.12, xo[2] || 0.3); S2.push([+L.toFixed(3), +(A0 * 0.5625).toFixed(6), c, +Math.exp(-0.012 * L).toFixed(4), 0, 0]); }
  for (let s = 0; s < 2; s++) { const o = s * n; nodes.push(['s', o, s, N.rs]);
    for (let j = 0; j < n - 1; j++) { const inc = [[o + j, 1], [o + j + 1, 0]], stb = st.find(q => q[0] === j);
      if (stb) { const ss = S2.length; S2.push([stb[2], stb[1], stb[3], 1, 0, 0]); inc.push([ss, 0]); nodes.push(['c', ss, stb[4]]); }
      if (j === k && xo[0] === 'x') { if (!s) xInc = inc; else nodes.push(['j', xInc.concat(inc)]); continue; }
      if (j === k && xo[0] === 'h') inc.push([hSec, s]);
      nodes.push(['j', inc]); }
    nodes.push(['o', o + n - 1, N.ro, N.fo, s ? 0.8 : 1]); for (const q of nt) NT.push([o + q[0], q[1], q[2], q[3]]); }
  return { sec: S2, nodes, nt: NT, g: N.g, sh: N.sh, info: { t: xo[0], at: xo[1], n: S2.length, len: N.info.len } };
}
