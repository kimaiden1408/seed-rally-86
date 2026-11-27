#!/usr/bin/env python3
# Round 45: the gas in pulses (what a crossover does to the flow), each bank's pulses and pops kept to its own pipe in
# the sound, and a backfire's flame at the tailpipe(s) of the pipe it is in. Applied to a round 44 build of the page.
# usage: r45.py IN.html OUT.html STAMP   (each replacement must match exactly the stated number of times)
import sys, os, re
here = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(here, 't45')
src, dst, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
rd = lambda f: open(os.path.join(T, f), encoding='utf-8', newline='').read()
s = open(src, encoding='utf-8', newline='').read(); n = 0
def rep(old, new, cnt=1):
    global s, n
    c = s.count(old)
    if c != cnt: raise SystemExit('replacement %d: found %d times (want %d): %r' % (n + 1, c, cnt, old[:100]))
    s = s.replace(old, new); n += 1

# ---- which builds have a pipe a bank: not one turbine's (its outlet is one pipe), not an engine set across the front ----
rep("const ex44Xo = B => B && (B.layout === 'vee' || B.layout === 'flat' || B.layout === 'w') && B.tail === 2 && B.xover !== 'y' ?",
    "const ex44Xo = B => B && (B.layout === 'vee' || B.layout === 'flat' || B.layout === 'w') && B.tail === 2 && B.xover !== 'y' && B.asp !== 'turbo' && B.asp !== 'twin' && !(B.mount === 'trans' && B.pos === 'front') ?")
rep("const ex44Xo = B =>", rd('ex45.js') + "const ex44Xo = B =>")
# ---- the flow: a crossover's worth from the pulses, not a set figure ----
rep("const S0 = cuBody(B.body); if (!S0 || !cu36On(B)) return E;\n  const G = exGas(B),", "const S0 = cuBody(B.body); if (!S0) return E; const psi = ex45PsiRel(B, S0), on36 = cu36On(B); if (!on36 && psi === 1) return E; // (round 45: psi, the pipes' layout against the body's own: see ex45Psi)\n  const G = exGas(B),")
rep("const m = r => { const dp = exAt(B, L, D, P(r)).dp; let k = Math.max(0.45, 1 - c * dp) / Math.max(0.45, 1 - c * ref);", "const m = r => { const d0 = exAt(B, L, D, P(r)).dp, dp = d0 * psi; let k = Math.max(0.45, 1 - c * dp) / Math.max(0.45, 1 - c * (on36 ? ref : d0));")
rep("const k = clamp(1 + 0.012 * (exAt(B, L, D, E.pmax).dp - ref), 0.85, 1.25);", "const d1 = exAt(B, L, D, E.pmax).dp, k = clamp(1 + 0.012 * (d1 * psi - (on36 ? ref : d1)), 0.85, 1.25);")
rep("return { D, D0, L, n, v: X.v, dp: X.dp,", "return { D, D0, L, n, v: X.v, dp: X.dp * ex45PsiRel(B, S0),")
rep("k *= B.tail === 2 ? 1.005 : 1; k *= { x: 1.006, h: 1.004 }[B.xover] || 1;", "/* (round 45: two tailpipes and a crossover are no longer set figures here: what they do to the flow is worked out from the engine's pulses, see ex45Psi and cu36Flow) */")
# ---- the tailpipes' open ends, each with the way it points: a flame for each ----
rep("  const r = X.rT && X.exit !== 'side' ? X.rT : X.r, out = { X, pipes, side: null, dir: [0, 0, -1] };\n",
    "  const r = X.rT && X.exit !== 'side' ? X.rT : X.r, out = { X, pipes, side: null, dir: [0, 0, -1], fl: [] };\n"
    "  // (round 45: every open end, where it is and the way it points, and whose tailpipe it is: a twin end's two, a turned-down end's below)\n"
    "  const tipAt = (q, i) => { ex36Tip(q); for (const e of q.ends || [[q.at, q.dir]]) out.fl.push([e[0], e[1], i]); };\n")
rep("body.tag = 'exhaust'; ex36Tip({ trim: body, at: tip, r, dir, len: 0.2, style: X.tip, fin: X.tipF }); if (X.xo) ex36Tip({ trim: body, at: [-tip[0], tip[1], tip[2]], r, dir: [-dir[0], dir[1], dir[2]], len: 0.2, style: X.tip, fin: X.tipF }); body.tag = '';",
    "body.tag = 'exhaust'; tipAt({ trim: body, at: tip, r, dir, len: 0.2, style: X.tip, fin: X.tipF }, 0); if (X.xo) tipAt({ trim: body, at: [-tip[0], tip[1], tip[2]], r, dir: [-dir[0], dir[1], dir[2]], len: 0.2, style: X.tip, fin: X.tipF }, 1); body.tag = '';")
rep("  for (const x of pipes) ex36Tip({ trim: body, at: [x, exY, exZ],", "  pipes.forEach((x, i) => tipAt({ trim: body, at: [x, exY, exZ],")
rep("len: Math.max(0.14, zr + 0.08 - exZ), style: X.tip, fin: X.tipF });\n  body.tag = ''; out.pipes = pipes;", "len: Math.max(0.14, zr + 0.08 - exZ), style: X.tip, fin: X.tipF }, i));\n  body.tag = ''; out.pipes = pipes;")
# (a twin end's two ends, a turned-down end's: told back to who drew it)
rep("one(p([a0[0] + d[0] * len * 0.42, a0[1] + d[1] * len * 0.42, a0[2] + d[2] * len * 0.42]), p(e), r * 0.8, big * 0.8, big * 0.8, 0, 0, false); } }",
    "one(p([a0[0] + d[0] * len * 0.42, a0[1] + d[1] * len * 0.42, a0[2] + d[2] * len * 0.42]), p(e), r * 0.8, big * 0.8, big * 0.8, 0, 0, false); } o.ends = [1, -1].map(sd => [[e[0] + F.u[0] * off * sd, e[1] + F.u[1] * off * sd, e[2] + F.u[2] * off * sd], d]); }")
rep("one(m, e2, r, r * 1.05, r * 1.05, 0, 0, false); }", "one(m, e2, r, r * 1.05, r * 1.05, 0, 0, false); o.ends = [[e2, dn]]; }")
# (the flames: one at each open end along its own line; which pipe each is on)
rep("const flame = ex36Flame(exAt ? [[exX, exY, exZ]] : ex36.tips, exAt && D.exhaust.up ? [0, 1, 0] : ex36 ? ex36.dir : [0, 0, -1]); bodyG.add(flame);",
    "const flame = ex36Flame(exAt ? [[exX, exY, exZ]] : ex36.fl.map(q => q[0]), exAt ? (D.exhaust.up ? [0, 1, 0] : [0, 0, -1]) : ex36.fl.map(q => q[1])); bodyG.add(flame);\n"
    "    if (!exAt) { const E45 = bayInfo && bayInfo.exhaust, xo45 = E45 ? (E45.xo ? E45.xo.t : null) : ex36.X.xo, sd45 = E45 && E45.xo ? E45.xo.side : Math.sign(ex36.tips[0][0]) || 1; // (round 45: a pipe a bank: each flame its own pipe's; bank 0 the lane's side, as in the sound's net)\n"
    "      flame.userData.tip = ex36.fl.map(q => q[2]); flame.userData.mode = xo45 && ex36.tips.length > 1 ? xo45 : 'one'; flame.userData.bank = ex36.fl.map(q => (Math.sign(ex36.tips[q[2]][0]) || 1) === sd45 ? 0 : 1); }")
rep("stubs = exAt ? tips.map(t => t.slice()) : rt ? bayInfo.exhaust.ends.map(e => e.slice()) :", "stubs = exAt ? tips.map(t => t.slice()) : rt && bayInfo.exhaust.ends.length ? tips.map(t => bayInfo.exhaust.ends.reduce((b, q) => Math.abs(q[0] - t[0]) < Math.abs(b[0] - t[0]) ? q : b).slice()) /* (each tailpipe's own pipe end) */ :")
rep("""  const fl = m && m.flame; if (!fl || !f) return; const k = fl.userData.k || 1, len = (0.16 + 0.42 * f) * (0.8 + 0.4 * Math.random()) * k, wid = (0.7 + 0.5 * f) * k;
  const set = (L, w) => { for (const c of fl.children) { const roll = Math.random() * 6.283; for (const s of c.children) { s.scale.set(w, w, L); s.rotation.z = roll; } } };
  set(len, wid); fl.visible = true;""",
    """  const fl = m && m.flame; if (!fl || !f) return; const k = fl.userData.k || 1, fb = typeof Snd !== 'undefined' ? Snd.flameB : null, jit = 0.8 + 0.4 * Math.random();
  // (round 45: each open end by the pop in its own pipe: see ex45FlameOf)
  const fs = fl.children.map((c, i) => ex45FlameOf(fl, i, f, fb)); if (!fs.some(v => v >= 0.36)) return;
  const set = q => { fl.children.forEach((c, i) => { const fi = fs[i]; c.visible = fi >= 0.36; if (!c.visible) return; const L = (0.16 + 0.42 * fi) * jit * k * q, w = (0.7 + 0.5 * fi) * k * (q < 1 ? 0.8 : 1), roll = Math.random() * 6.283; for (const s of c.children) { s.scale.set(w, w, L); s.rotation.z = roll; } }); };
  const len = 1, wid = 1; set(1); fl.visible = true;""")
rep("holder.flT2 = setTimeout(() => { if (m.flame === fl) set(len * 0.55, wid * 0.8); }, 45);", "holder.flT2 = setTimeout(() => { if (m.flame === fl) set(0.55); }, 45);")
rep("fl.children.forEach((f, i) => { const s = S2[Math.min(i, S2.length - 1)];", "fl.children.forEach((f, i) => { const s = S2[Math.min(fl.userData.tip ? fl.userData.tip[i] : i, S2.length - 1)];")
# ---- the sound: each bank's pulses arrive at its own pipe in step with the rest; a pop goes down the pipe it is in ----
rep("this.xd = 0; this.gcXd = 0; this.gcYd = 0;", "this.xd = 0; this.gcXd = 0; this.gcYd = 0; this.nlX = new Float32Array(256); this.xdo = 0; this.tld = 0; this.catZd = 0; this.dd1 = 0; this.dd2 = 0; this.bdd1 = 0; this.bdd2 = 0; this.bnS = 0;")
rep(" * (kTb ? 0.6 * (1 - kTb + 0.35 * kTb * this.wg) : 1); this.gcYd = yd; } }", "; this.gcYd = yd; } }")
rep("else { this.d1 = this.d1 * this.aD + col; this.d2 = this.d2 * this.aR + col; y = (this.d1 - this.d2) * this.kP; }", "else { this.d1 = this.d1 * this.aD + col; this.d2 = this.d2 * this.aR + col; y = (this.d1 - this.d2) * this.kP; if (this.n2) { this.dd1 = this.dd1 * this.aD + colD; this.dd2 = this.dd2 * this.aR + colD; this.xd = (this.dd1 - this.dd2) * this.kP; } }")
t = "this.tl += (y - this.tl) * this.aT; let x = kTb ?"; i = s.index(t); j = s.index("\n", i); line = s[i:j]; assert line.count(": y;") == 1, line[:300]
s = s[:i] + line.replace(": y;", ": y; if (this.n2) { this.tld += (this.xd - this.tld) * this.aT; if (kTb) this.xd = this.tld * (1 - 0.35 * kTb * this.spool) + (this.xd - this.tld) * (1 - kTb + 0.35 * kTb * this.wg) * 0.6; } // (round 45: the banks' difference through the turbines as the sum goes)", 1) + s[j:]; n += 1
m = re.search(r"this\.bd1 \*= this\.bD; this\.bd2 \*= this\.bR; this\.bn \*= this\.bnD; x \+= \(this\.bd1 - this\.bd2\) \* 1\.7 \+ (\(\(_ss = this\.seed, .*?4294967296\) \* 2 - 1\)) \* this\.bn;", s); assert m and len(re.findall(re.escape(m.group(0)), s)) == 1
s = s.replace(m.group(0), "this.bd1 *= this.bD; this.bd2 *= this.bR; this.bn *= this.bnD; { const _pn = " + m.group(1) + " * this.bn; x += (this.bd1 - this.bd2) * 1.7 + _pn; if (this.n2) { this.bdd1 *= this.bD; this.bdd2 *= this.bR; this.xd += (this.bdd1 - this.bdd2) * 1.7 + _pn * this.bnS; } } // (round 45: with a pipe a bank the pop is in one of them)"); n += 1
rep("this.nl[w] = x; this.nlT[w] = tau; this.nlN = N2 + 1;", "this.nl[w] = x; this.nlT[w] = tau; this.nlX[w] = this.xd; this.nlN = N2 + 1;")
rep("x = this.nl[j & 255] + (this.nl[(j + 1) & 255] - this.nl[j & 255]) * f; }", "x = this.nl[j & 255] + (this.nl[(j + 1) & 255] - this.nl[j & 255]) * f; this.xdo = this.nlX[j & 255] + (this.nlX[(j + 1) & 255] - this.nlX[j & 255]) * f; } // (the banks' difference read back at the same instant as the sum)")
rep("if (this.catK > 0 && !this.opened) { this.catZ += (x - this.catZ) * this.catA; x += (this.catZ - x) * 0.45 * this.catK; }", "if (this.catK > 0 && !this.opened) { this.catZ += (x - this.catZ) * this.catA; x += (this.catZ - x) * 0.45 * this.catK; if (this.n2) { this.catZd += (this.xdo - this.catZd) * this.catA; this.xdo += (this.catZd - this.xdo) * 0.45 * this.catK; } }")
rep("this.n2.run2(0.5 * (x + this.xd), 0.5 * (x - this.xd))", "this.n2.run2(0.5 * (x + this.xdo), 0.5 * (x - this.xdo))")
rep("pop(a) { this.bd1 += a; this.bd2 += a;", "pop(a, bk) { const _s = !this.n2 ? 0 : bk == null ? (this.rnd() < 0.5 ? 1 : -1) : bk ? -1 : 1; if (_s) { this.bdd1 += _s * a; this.bdd2 += _s * a; this.bnS = _s; } /* (round 45: the pipe it is in: its cylinder's bank's, +1 the first) */ this.bd1 += a; this.bd2 += a;")
rep("if (this.onPop && a > 0.45) this.onPop(a);", "if (this.onPop && a > 0.45) this.onPop(a, _s);")
for old in ["this.pop(0.25 + 0.45 * this.rnd());", "this.pop(0.5 + 0.7 * this.rnd());", "this.pop(0.1 + 0.2 * this.rnd());", "this.pop(0.7 + 0.6 * this.rnd());", "this.pop(0.35 + 0.75 * this.rnd());", "this.pop((0.25 + 0.6 * this.rnd()) * (this.P.afA || 1));"]:
    rep(old, old[:-2] + ", this.bank[c]);")
rep('this.d.onPop = a => this.port.postMessage({ t: "pop", a });', 'this.d.onPop = (a, s) => this.port.postMessage({ t: "pop", a, s });')
rep("this.pops++; this.popA = Math.max(this.popA || 0, e.data.a || 0.6); }", "this.pops++; this.popA = Math.max(this.popA || 0, e.data.a || 0.6); this.popSide(e.data.a || 0.6, e.data.s); }")
rep("d.onPop = a => { this.pops++; this.popA = Math.max(this.popA || 0, a || 0.6); };", "d.onPop = (a, s) => { this.pops++; this.popA = Math.max(this.popA || 0, a || 0.6); this.popSide(a || 0.6, s); };")
rep("if (k === 'bang') { this.bang(); this.pops++; this.popA = 1; }", "if (k === 'bang') { this.bang(); this.pops++; this.popA = 1; this.popSide(1, Math.random() < 0.5 ? 1 : -1); }")
rep("  flame() { const a = this.popA || 0; this.pops = 0; this.popA = 0; const f = a * (this.logic ? this.logic.flK || 0 : 0); return f > 0.42 ? Math.min(1.3, f) : 0; },",
    "  // (round 45: each bank's biggest pop since the last frame, s: +1 the first bank's pipe, -1 the second's, 0 one pipe)\n"
    "  popSide(a, s) { const B = this.popB || (this.popB = [0, 0]); if (!(s < 0)) B[0] = Math.max(B[0], a); if (!(s > 0)) B[1] = Math.max(B[1], a); },\n"
    "  flame() { const a = this.popA || 0, B = this.popB || [a, a], k = this.logic ? this.logic.flK || 0 : 0; this.pops = 0; this.popA = 0; this.popB = [0, 0]; const f = a * k; this.flameB = [Math.min(1.3, B[0] * k), Math.min(1.3, B[1] * k)]; return f > 0.42 ? Math.min(1.3, f) : 0; },")
# (the gas's own rush and the steepening of a big pulse go with the flow in each pipe: the banks' difference by the same factor as the sum)
rep("        y += ((_ss = this.seed, _ss ^= _ss << 13, _ss ^= _ss >>> 17, _ss ^= _ss << 5, this.seed = _ss >>> 0, this.seed / 4294967296) * 2 - 1) * Math.abs(y) * kFlow", "        const _y45 = y; y += ((_ss = this.seed, _ss ^= _ss << 13, _ss ^= _ss >>> 17, _ss ^= _ss << 5, this.seed = _ss >>> 0, this.seed / 4294967296) * 2 - 1) * Math.abs(y) * kFlow")
rep("        if (kSteep) y += kSteep * y * Math.abs(y);\n", "        if (kSteep) y += kSteep * y * Math.abs(y);\n        if (this.n2 && (_y45 > 1e-7 || _y45 < -1e-7)) this.xd *= Math.max(0, Math.min(3, y / _y45));\n")
m2 = re.findall(r"const SR86_BUILD = '([0-9A-Z]{4})';", s); assert len(m2) == 1, m2
s = s.replace("const SR86_BUILD = '%s';" % m2[0], "const SR86_BUILD = '%s';" % stamp)
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('round 45: %d replacements, %s -> %s (%d bytes), stamp %s (was %s)' % (n, os.path.basename(src), os.path.basename(dst), len(s.encode('utf-8')), stamp, m2[0]))
