#!/usr/bin/env python3
# Round 44: two pipes and what joins them (true dual, H, X; Y as before). Applied to a round 43 build of the page.
# usage: r44.py IN.html OUT.html STAMP [--stock stock.json]   (each replacement must match exactly the stated number of times)
import sys, os, re
here = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(here, 't44')
src, dst, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
stock = sys.argv[sys.argv.index('--stock') + 1] if '--stock' in sys.argv else None
rd = lambda f: open(os.path.join(T, f), encoding='utf-8', newline='').read()
s = open(src, encoding='utf-8', newline='').read(); n = 0
def rep(old, new, cnt=1):
    global s, n
    c = s.count(old)
    if c != cnt: raise SystemExit('replacement %d: found %d times (want %d): %r' % (n + 1, c, cnt, old[:100]))
    s = s.replace(old, new); n += 1

# ---- the core: which builds have a pipe a bank ----
rep("CU_KEYS.push(...CU43_KEYS);\n", """CU_KEYS.push(...CU43_KEYS);
// (round 44) a pipe a bank: a vee, flat or W engine with two tailpipes and anything but a Y-pipe between its banks.
// What joins the two pipes: 'none', 'h' or 'x'; null for one pipe (an in-line engine, a Y-pipe, one tailpipe)
const ex44Xo = B => B && (B.layout === 'vee' || B.layout === 'flat' || B.layout === 'w') && B.tail === 2 && B.xover !== 'y' ? (B.xover === 'h' || B.xover === 'x' ? B.xover : 'none') : null;
""")
rep("joint: B.joint, bend: B.bend }", "joint: B.joint, bend: B.bend, xo: ex44Xo(B) }", 2)
rep("D.kitKey = (D.kitKey || '') + [B.flex, B.hang, B.joint, B.bend,", "D.kitKey = (D.kitKey || '') + [ex44Xo(B), B.flex, B.hang, B.joint, B.bend,")
rep("tail: nPipes > 1 ? 2 : 1 }, P) : 57; }", "tail: nPipes > 1 || X.xo ? 2 : 1 }, P) : 57; }")
# ---- the tailpipes: one each side for a pipe a bank ----
rep("pipes = tw ? [-tw / 2, tw / 2] : [0]; }\n", """pipes = tw ? [-tw / 2, tw / 2] : [0]; }
  // (round 44: a pipe a bank ends one each side of the car - or as a pair on its middle)
  if (X.xo && X.exit === 'centre' && pipes.length < 2) { const tw = Math.max(0.13, 2.6 * r + 0.02); pipes = [-tw / 2, tw / 2]; }
  else if (X.xo && X.exit !== 'centre' && X.exit !== 'side') { const a = Math.max(0.12, Math.abs(pipes.reduce((p, x) => Math.abs(x) > Math.abs(p) ? x : p, 0))); pipes = [a, -a]; }
""")
rep("body.tag = 'exhaust'; ex36Tip({ trim: body, at: tip, r, dir, len: 0.2, style: X.tip, fin: X.tipF }); body.tag = '';",
    "body.tag = 'exhaust'; ex36Tip({ trim: body, at: tip, r, dir, len: 0.2, style: X.tip, fin: X.tipF }); if (X.xo) ex36Tip({ trim: body, at: [-tip[0], tip[1], tip[2]], r, dir: [-dir[0], dir[1], dir[2]], len: 0.2, style: X.tip, fin: X.tipF }); body.tag = '';")
rep("out.pipes = [sd * (half - 0.3)]; out.tips = [tip]; out.dir = dir; return out; }", "out.pipes = [sd * (half - 0.3)]; out.tips = X.xo ? [tip, [-tip[0], tip[1], tip[2]]] : [tip]; out.dir = dir; return out; }")
# ---- the kit: the lane's pipe laid as before, and its mirror with it ----
a = s.index("            const xs = pipes.reduce((a, x) => a + x, 0) / pipes.length, sx = Math.sign(xs || exX) || -1, xr = sx * (live ? 0.25 : 0.22)"); b = s.index("out.rear.push('exhaust'); ex40Fit({ body, bx, out, X: ex36.X, under, kick, r: ex36.X.r, S, D }); }", a)
blk = s[a:b]; m = 0
def br(old, new, cnt=1):
    global blk, m
    c = blk.count(old)
    if c != cnt: raise SystemExit('kit replacement %d: found %d times (want %d): %r' % (m + 1, c, cnt, old[:100]))
    blk = blk.replace(old, new); m += 1
br("const xs = pipes.reduce((a, x) => a + x, 0) / pipes.length, sx = Math.sign(xs || exX) || -1, xr = sx * (live ? 0.25 : 0.22)",
   "const nHead = E.ex ? E.ex.length : E.x1 - E.x0 >= 0.5 ? 2 : 1, dual = !!ex36.X.xo && nHead > 1 && !(trans && epos === 'front'), xs0 = pipes.reduce((a, x) => a + x, 0) / pipes.length, sx = Math.sign(xs0 || exX) || -1, "
   "pp = dual ? [pipes.find(x => Math.sign(x) === sx) != null ? pipes.find(x => Math.sign(x) === sx) : sx * Math.max(0.08, Math.abs(pipes[0]))] : pipes, /* (round 44: a pipe a bank: the lane's own tailpipe; its mirror is laid with it) */ "
   "xs = pp.reduce((a, x) => a + x, 0) / pp.length, mir = ex44Mir, xr = sx * (live ? 0.25 : 0.22)")
br("seq = [], seg = (a, b) =>", "seq = [], seg0 = (a, b) =>")
br("}, box = (x0, x1, y0, y1, z0, z1, kind) => { const on = ex36Can(body, Object.assign({}, ex36.X, { ends: pipes }), kind || 'sil',",
   "}, box0 = (x0, x1, y0, y1, z0, z1, kind, mr) => { const on = ex36Can(body, Object.assign({}, ex36.X, mr ? { ends: pp.map(x => -x), catIn: ex36.X.catIn != null ? -ex36.X.catIn : undefined } : { ends: pp }), kind || 'sil',")
br("(kind || 'sil') === 'sil' && ex36.X.catIn != null ? 1 : 0]); } return on; };",
   "(kind || 'sil') === 'sil' && ex36.X.catIn != null ? 1 : 0]); } return on; };\n"
   "            // (round 44: with a pipe a bank every run and box is laid twice, the second the first's mirror - a box across the\n"
   "            // car's middle once; an X-pipe is laid with the first long run behind the collector, see ex44X)\n"
   "            const seg = dual ? (a, b) => { seg0(a, b); seg0(mir(a), mir(b)); } : seg0, box = dual ? (x0, x1, y0, y1, z0, z1, kind) => { const on = box0(x0, x1, y0, y1, z0, z1, kind); if (on && !(x0 < 0 && x1 > 0)) box0(-x1, -x0, y0, y1, z0, z1, kind, true); return on; } : box0;\n"
   "            const xseg = (a, b) => { const q = dual && ex36.X.xo === 'x' && !out.x44 ? ex44X(a, b, ex36.X.r, sx, { prop: out.prop, gb: EF && EF.gb }) : null; if (!q) return seg(a, b); out.x44 = { at: q[2] }; seg(a, q[0]); seg(q[0], q[1]); seg(q[1], b); };")
br("for (const h of heads) { const far = heads.length > 1 && Math.sign(h[0]) !== sx,", "for (const h0 of heads) { const fm = dual && Math.sign(h0[0]) !== sx, h = fm ? mir(h0) : h0, far = !dual && heads.length > 1 && Math.sign(h[0]) !== sx,")
br("pts.push(J); for (let k = 0; k < pts.length - 1; k++) man(pts[k], pts[k + 1]); } }", "pts.push(J); for (let k = 0; k < pts.length - 1; k++) man(fm ? mir(pts[k]) : pts[k], fm ? mir(pts[k + 1]) : pts[k + 1]); } }")
br("if (ex36.side) { out.exhaust.tips = [ex36.side.tip]; ex36SideRoute({ at, xr, P, seg, box, X: ex36.X, side: ex36.side, body, note: q => seq.push(q) }); out.exhaust.ends.push(ex36.side.inn); }",
   "if (ex36.side) { out.exhaust.tips = [ex36.side.tip]; ex36SideRoute({ at, xr, P, seg: seg0, box: box0, X: ex36.X, side: ex36.side, body, note: q => seq.push(q) }); out.exhaust.ends.push(ex36.side.inn); "
   "if (dual) { const q = ex36.side; ex36SideRoute({ at: mir(at), xr: -xr, P, seg: seg0, box: (x0, x1, y0, y1, z0, z1, kind) => box0(x0, x1, y0, y1, z0, z1, kind, true), X: ex36.X, side: { sd: -q.sd, tip: mir(q.tip), inn: mir(q.inn), z: q.z, y: q.y }, body, note: q2 => seq.push(q2) }); } }")
br("if (zJ - zc > 0.4) { seg(at, c0);", "if (zJ - zc > 0.4) { xseg(at, c0);")
br("{ seg(at, k0); at = k1; }", "{ xseg(at, k0); at = k1; }")
br("path([at, ...lane(xr, at[2], zS0).slice(1)]); const ys = yF(zS0);", "{ const Lp = [at, ...lane(xr, at[2], zS0).slice(1)]; if (Lp.length > 1) { xseg(Lp[0], Lp[1]); path(Lp.slice(1)); } } const ys = yF(zS0);")
br("Math.min(...pipes)", "Math.min(...pp)", 2); br("Math.max(...pipes)", "Math.max(...pp)", 2); br("for (const x of pipes)", "for (const x of pp)", 4)
s = s[:a] + blk + "if (dual) ex44Cross({ body, bx, out, X: ex36.X, r: ex36.X.r, sx, prop: out.prop, gb: EF && EF.gb }); " + s[b:]; n += m
# ---- the fittings on both pipes ----
rep("  { const [a, b] = M[0], d = dirOf(a, b), l = len(a, b); joint(along(a, d, 0.03), d);",
    "  for (const R0 of (E.xo ? [M[0], M.find(q => q !== M[0] && Math.abs(q[0][0] + M[0][0][0]) < 0.02 && Math.abs(q[0][2] - M[0][0][2]) < 0.02)] : [M[0]])) if (R0) { const [a, b] = R0, d = dirOf(a, b), l = len(a, b); joint(along(a, d, 0.03), d); // (round 44: each of two pipes has its own)")
rep("if (i > 0 && l > 0.6) joint(along(a, d, 0.04), d); });", "if (i > (E.xo ? 1 : 0) && l > 0.6) joint(along(a, d, 0.04), d); });")
rep("for (let i = 0; i + 1 < E.runs.length; i++) { const [a, b] = E.runs[i], [c, e] = E.runs[i + 1]; if (len(b, c) > 0.012",
    "for (let i = 0; i + 1 < E.runs.length; i++) { const [a, b] = E.runs[i], nx = E.runs[i + 1], nx2 = E.runs[i + 2], [c, e] = nx2 && len(b, nx[0]) > 0.012 && len(b, nx2[0]) <= 0.012 ? nx2 : nx; if (len(b, c) > 0.012")
rep("  if (qwOn) { const y0 = M[0][0][1], lev = M.filter(([a]) => Math.abs(a[1] - y0) < 0.03),",
    "  for (const qs of (qwOn ? (E.xo ? [E.xo.side, -E.xo.side] : [0]) : [])) { const Mq = qs ? M.filter(([a, b]) => Math.sign(a[0] + b[0]) === qs) : M; if (!Mq.length) continue; const y0 = Mq[0][0][1], lev = Mq.filter(([a]) => Math.abs(a[1] - y0) < 0.03),")
rep("const l0 = len(M[0][0], M[0][1]); let zA = M[0][0][2] - ", "const l0 = len(Mq[0][0], Mq[0][1]); let zA = Mq[0][0][2] - ")
rep("const onPipe = z => { for (const [a, b] of M) if", "const onPipe = z => { for (const [a, b] of Mq) if")
rep("E.qw = [+(L + off).toFixed(3), a0]; out.rear.push('quarter-wave resonator'); } } }", "if (!E.qw) { E.qw = [+(L + off).toFixed(3), a0]; out.rear.push('quarter-wave resonator'); } } } }")
rep("const done = () => { try { E.geo = ex43Geo(E, X);", "const done = () => { try { E.geo = E.xo ? ex44Geo(E, X) : ex43Geo(E, X);")
# ---- the sound ----
rep("  // valve gear: the band a valve's tick rings in [Hz, Q]", rd('pipenet2.js') + "  // valve gear: the band a valve's tick rings in [Hz, Q]")
rep("this.nt = K.net && K.net.sec && K.net.sec.length ? new PipeNet(sr, K.net) : null;", "this.nt = K.net && K.net.sec && K.net.sec.length ? new PipeNet(sr, K.net) : null; this.n2 = K.net2 && K.net2.sec && K.net2.sec.length && this.nb === 2 ? new PipeNet2(sr, K.net2) : null; this.xd = 0; this.gcXd = 0; this.gcYd = 0; // (round 44: two pipes, a bank each: the banks' pulses kept apart to the pipes' heads)")
rep("        let col = 0; for (let b = 0; b < this.nb; b++) col += (this.sec ?", "        let col = 0, colD = 0, _cb = 0; for (let b = 0; b < this.nb; b++) col += _cb = (this.sec ?")
rep(": kBankW[b]) : 1); // (bankW: a pipe per bank to its own tailpipe,", ": kBankW[b]) : 1), colD += b ? -_cb : _cb; // (colD: one bank less the other, for two pipes; bankW: a pipe per bank to its own tailpipe,")
rep("          y = y / (1 + 0.2 * Math.abs(y)); if (this.gcF < 1) { this.gcF += 1 / (0.1 * sr); y *= this.gcF * this.gcF; } }",
    "          const _sq = 1 / (1 + 0.2 * Math.abs(y)); y *= _sq; if (this.gcF < 1) { this.gcF += 1 / (0.1 * sr); y *= this.gcF * this.gcF; }\n"
    "          // (the banks' difference through the same steps, so each pipe gets its own bank's share of what goes down the pipe)\n"
    "          if (this.n2) { this.gcXd += (colD - this.gcXd) * this.aDC; const yd = (colD - this.gcXd) * this.agG; this.xd = (yd + this.kDF * (yd - this.gcYd) * (sr / 6000)) * _sq * (this.gcF < 1 ? this.gcF * this.gcF : 1) * (kTb ? 0.6 * (1 - kTb + 0.35 * kTb * this.wg) : 1); this.gcYd = yd; } }")
rep("        const m = this.nt && !this.opened ? this.nt.run(x) : (_du = (x), _dq = this.main,", "        const m = this.n2 && !this.opened ? this.n2.run2(0.5 * (x + this.xd), 0.5 * (x - this.xd)) : this.nt && !this.opened ? this.nt.run(x) : (_du = (x), _dq = this.main,")
rep("  EngineDSP.PipeNet = PipeNet;\n", "  EngineDSP.PipeNet = PipeNet; EngineDSP.PipeNet2 = PipeNet2;\n")
rep("net.g = cp[0]; net.sh = cp[1]; K.net = net;", "net.g = cp[0]; net.sh = cp[1]; K.net = net; if (geo.xo) { const n2 = ex44Net2(net, geo, B); if (n2) { K.net2 = n2; K.xmix = 0; K.bankW = null; K.secD = 0; } } // (round 44: two pipes: the net does what the old mix and weights stood for)")
# ---- the Workshop: the two choices kept in step ----
rep("    const was = this.B[k]; if (was === v) return; this.B[k] = v;\n", "    const was = this.B[k]; if (was === v) return; this.B[k] = v;\n"
    "    if (k === 'xover' && v !== 'y' && ['vee', 'flat', 'w'].includes(this.B.layout)) this.B.tail = 2; if (k === 'tail' && v !== 2 && ['vee', 'flat', 'w'].includes(this.B.layout) && this.B.xover !== 'y') this.B.xover = 'y'; // (round 44: an H-pipe, an X-pipe or none means a pipe a bank, each to its own tailpipe; one tailpipe means the two join in a Y)\n")
if "'xover'" not in s[s.index("const WS_LOOK = ["):s.index("const WS_LOOK = [") + 600]: rep("const WS_LOOK = ['flex',", "const WS_LOOK = ['xover', 'tail', 'flex',")
# ---- two tailpipes from one pipe: a wider pipe as far as the silencer, a tailpipe each from it ----
rep("bend: B.bend, xo: ex44Xo(B) }", "bend: B.bend, xo: ex44Xo(B), t2: B && B.tail === 2 && !ex44Xo(B) ? 1 : 0 }", 2)
rep("D.kitKey = (D.kitKey || '') + [ex44Xo(B), B.flex,", "D.kitKey = (D.kitKey || '') + [ex44Xo(B), B.tail, B.flex,")
rep("tail: nPipes > 1 || X.xo ? 2 : 1 }, P) : 57; }", "tail: nPipes > 1 || X.xo || X.t2 ? 2 : 1 }, P) : 57; }")
rep("return Object.assign({}, X, { d, r: Math.max(0.021, Math.min(0.048, d / 2000 + 0.002)),", "return Object.assign({}, X, { d, rM: Math.max(0.021, Math.min(0.048, d * Math.SQRT2 / 2000 + 0.002)), r: Math.max(0.021, Math.min(0.048, d / 2000 + 0.002)),")
rep("let pipes = o.pipes.slice(); const X = ex36Of(D, S, pipes.length), r = X.r, out = { X, pipes, side: null, dir: [0, 0, -1] };\n  if (X.exit === 'centre') { const tw = pipes.length > 1 ? Math.max(0.13, 2.6 * r + 0.02) : 0;",
    """let pipes = o.pipes.slice(), X = ex36Of(D, S, pipes.length);
  // (round 44: two tailpipes from one pipe - an in-line engine's, a Y-pipe's, an engine set across the car whatever joins
  // its banks: the one pipe carries all the gas, so it is as wide as the two tailpipes together (X.r), and each tailpipe
  // (X.rT) is the bore the build names; ending ahead of a rear wheel it stays one pipe of that width)
  const each = !!(X.xo && o.one), two = !!(X.t2 || each); if (two) X = Object.assign({}, X, { xo: null, two: 1, r: X.rM, rT: X.r });
  const r = X.rT && X.exit !== 'side' ? X.rT : X.r, out = { X, pipes, side: null, dir: [0, 0, -1] };
  if (X.exit === 'centre') { const tw = pipes.length > 1 || two ? Math.max(0.13, 2.6 * r + 0.02) : 0;""")
rep("pipes = [a, -a]; }\n", """pipes = [a, -a]; }
  else if (two && pipes.length < 2 && X.exit !== 'centre' && X.exit !== 'side') { const x = pipes[0], a = Math.max(0.12, Math.abs(x)), tw = Math.max(0.13, 2.6 * r + 0.02); pipes = each ? [a, -a] : Math.abs(x) < 0.02 ? [-tw / 2, tw / 2] : [x, x - Math.sign(x) * tw]; } // (side by side where the body's own pipe ends; one each side from an engine set across the car)
""")
rep("ex36Tips({ trim, body, D, S, pipes: pipes0, exY, exZ, zr, axles, R })", "ex36Tips({ trim, body, D, S, pipes: pipes0, exY, exZ, zr, axles, R, one: /transverse/i.test(eText) && epos === 'front' })")
# (the kit: each run keeps its own radius; the tailpipes behind the silencer drawn at theirs)
rep("const runs = [], boxes = [], seq = [], seg0 = (a, b) => { if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.005) return; ex36Pipe(body, a, b, ex36.X.r, null, ex40K(pipe, ex36.X, runs.length), 7, true, true); runs.push([a, b]); seq.push([0, a, b]); },",
    "let rSeg = 0; const runs = [], boxes = [], seq = [], seg0 = (a, b) => { if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.005) return; const q = [a, b]; q.r = rSeg || ex36.X.r; ex36Pipe(body, a, b, q.r, null, ex40K(pipe, ex36.X, runs.length), 7, true, true); runs.push(q); seq.push([0, a, b]); },")
rep("              if (!box(Math.max(-xo, Math.min(xr - 0.13,", "              rSeg = ex36.X.rT || 0; // (from here the tailpipes)\n              if (!box(Math.max(-xo, Math.min(xr - 0.13,")
rep("seg(at, [xr * 0.6, ys, zS0]); if (!box(Math.min(-0.25,", "seg(at, [xr * 0.6, ys, zS0]); rSeg = ex36.X.rT || 0; if (!box(Math.min(-0.25,")
rep("            if (dual) ex44Cross({", "            rSeg = 0; if (dual) ex44Cross({")
# (a straight-through silencer on one pipe that parts into two: one can on the pipe's own line and the two tailpipes
# from its end; lying across the car, the pipe run on to it and each tailpipe from it)
rep("let rSeg = 0; const runs = [], boxes = [], seq = [],", "let rSeg = 0, canX = null; const runs = [], boxes = [], seq = [],")
rep(": { ends: pp }), kind || 'sil', x0, x1, y0, y1, z0, z1, ex36.X.r);", ": { ends: pp }, canX != null ? { canX } : null), kind || 'sil', x0, x1, y0, y1, z0, z1, ex36.X.r);")
rep("else for (const x of ends.length > 1 && hw > 0.16 ? ends : [xc]) can(", "else for (const x of X.canX != null ? [X.canX] : ends.length > 1 && hw > 0.16 ? ends : [xc]) can(")
rep("              if (!box(Math.max(-xo, Math.min(xr - 0.13, Math.min(...pp) - 0.04)), Math.min(xo, Math.max(xr + 0.13, Math.max(...pp) + 0.04)), ys - 0.03, ys + 0.1, zS0, zS1)) for (const x of pp)",
    """              const bA = Math.max(-xo, Math.min(xr - 0.13, Math.min(...pp) - 0.04)), bB = Math.min(xo, Math.max(xr + 0.13, Math.max(...pp) + 0.04)), one2 = !dual && !!ex36.X.two && ex36.X.muff === 'straight'; canX = one2 ? xr : null;
              const silOn = box(bA, bB, ys - 0.03, ys + 0.1, zS0, zS1), can2 = silOn && one2, acr = can2 && bB - bA > (zS0 - zS1) * 1.15, zc2 = (zS0 + zS1) / 2; canX = null;
              if (acr) { rSeg = 0; seg([xr, ys, zS0], [xr, ys, zc2 + 0.05]); rSeg = ex36.X.rT || 0; }
              if (!silOn) for (const x of pp)""")
rep("if (back) { const m = [x, (ys + exY) / 2, Math.min(zS1 - 0.04, zT + 0.12)]; seg([x, ys, zS1], m); seg(m, tip); }", "if (back) { const m = [x, (ys + exY) / 2, Math.min(zS1 - 0.04, zT + 0.12)]; if (acr) seg([x, ys, zc2 - 0.05], [x, ys, zS1]); seg([can2 && !acr ? xr : x, ys, zS1], m); seg(m, tip); }")
rep("L[0] = [xb, ys, zS1]; path(L);", "L[0] = [can2 && !acr ? xr : xb, ys, zS1]; if (acr) seg([xb, ys, zc2 - 0.05], [xb, ys, zS1]); path(L);")
# (the fittings: a joint, a hanger or a crease the size of the run it is on)
rep("const { body, bx, out, X, under, kick, r } = o, E = out.exhaust; if (!E || !E.runs || !E.runs.length || !X) return;\n  const fx = X.flex || 'braid',", "const { body, bx, out, X, under, kick } = o, E = out.exhaust; if (!E || !E.runs || !E.runs.length || !X) return; let r = o.r;\n  const fx = X.flex || 'braid',")
rep("M.forEach(([a, b], i) => { const d = dirOf(a, b), l = len(a, b), n = l > 0.55 ? Math.max(1, Math.round(l / 0.8)) : 0; for (let k = 0; k < n; k++) hanger(at(a, b, (k + 0.62) / (n + 0.24)), sdH(a));", "M.forEach((run, i) => { const [a, b] = run; r = run.r || o.r; const d = dirOf(a, b), l = len(a, b), n = l > 0.55 ? Math.max(1, Math.round(l / 0.8)) : 0; for (let k = 0; k < n; k++) hanger(at(a, b, (k + 0.62) / (n + 0.24)), sdH(a));")
rep("joint(along(a, d, 0.04), d); });", "joint(along(a, d, 0.04), d); }); r = o.r;")
rep("for (let i = 0; i + 1 < E.runs.length; i++) { const [a, b] = E.runs[i], nx = E.runs[i + 1],", "for (let i = 0; i + 1 < E.runs.length; i++) { r = E.runs[i].r || o.r; const [a, b] = E.runs[i], nx = E.runs[i + 1],")
rep("if (n) out.rear.push('crush bends'); }", "if (n) out.rear.push('crush bends'); r = o.r; }")
# (the sound's chain: the one pipe's bore, the tailpipes' their own)
rep("  return { d: X.d || Math.round((X.r - 0.002) * 2000), np: Math.max(1, ends.length), el, len: +s.toFixed(3), man: +man.toFixed(3), br, qw };",
    "  const dM = X.rT && X.d ? Math.round(X.d * Math.SQRT2) : 0; // (round 44: one pipe into two tailpipes: d the one pipe's bore, dt each tailpipe's)\n  return { d: dM || X.d || Math.round((X.r - 0.002) * 2000), np: Math.max(1, ends.length), el, len: +s.toFixed(3), man: +man.toFixed(3), br, qw, dt: dM && ends.length > 1 ? X.d : null };")
rep("  return { d: (exInfo(B, cuEngineOn(B)) || {}).D || G0.d, np: B.tail === 2 ? 2 : 1, el, len: +(G0.len * k).toFixed(3), man: G0.man, br: B.tail === 2 ? +(G0.len * k - 0.5).toFixed(3) : null, qw: null };",
    "  const D1 = (exInfo(B, cuEngineOn(B)) || {}).D || G0.d, two = B.tail === 2 && !ex44Xo(B), np = B.tail === 2 && !(two && B.exit === 'side') ? 2 : 1;\n  return { d: two ? Math.round(D1 * Math.SQRT2) : D1, np, el, len: +(G0.len * k).toFixed(3), man: G0.man, br: np > 1 ? +(G0.len * k - 0.5).toFixed(3) : null, qw: null, dt: two && np > 1 ? D1 : null };")
rep("if (tag[i] === 'p' && pos[i] >= geo.br - 0.02) sec[i][1] = Ap * np;", "if (tag[i] === 'p' && pos[i] >= geo.br - 0.02) sec[i][1] = geo.dt ? (Math.abs(At * np / Ap - 1) < 0.03 ? Ap : At * np) : Ap * np;")
rep("  let at = 0; const wall = L => Math.exp(-0.012 * L);\n", "  let at = 0; const wall = L => Math.exp(-0.012 * L), At = geo.dt ? Math.PI * Math.pow(geo.dt / 2000, 2) : Ap; // (At: each tailpipe's own bore behind where one pipe parts into two)\n")
rep("let aEnd = geo.d / 2000, ro = 0.8;", "let aEnd = (geo.dt || geo.d) / 2000, ro = 0.8;")
# ---- the round's code, the stock cars' pipes measured again ----
rep("// each entered car's own pipe, measured from the car as drawn (harness/geo43.js)\n", rd('ex44.js') + "// each entered car's own pipe, measured from the car as drawn (harness/geo43.js)\n")
if stock:
    t = re.findall(r"const EX43_STOCK = \{.*\};\n", s); assert len(t) == 1; s = s.replace(t[0], 'const EX43_STOCK = ' + open(stock, encoding='utf-8').read().strip() + ';\n'); n += 1
m2 = re.findall(r"const SR86_BUILD = '([0-9A-Z]{4})';", s); assert len(m2) == 1, m2
s = s.replace("const SR86_BUILD = '%s';" % m2[0], "const SR86_BUILD = '%s';" % stamp)
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('round 44: %d replacements, %s -> %s (%d bytes), stamp %s (was %s)' % (n, os.path.basename(src), os.path.basename(dst), len(s.encode('utf-8')), stamp, m2[0]))
