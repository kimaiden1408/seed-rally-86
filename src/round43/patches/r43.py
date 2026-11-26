#!/usr/bin/env python3
# Round 43: applies the round's changes to a build of the page (the website's index.html or the artifact's).
# usage: r43.py IN.html OUT.html STAMP [--stock stock.json] [--i18n-file FILE]   (each replacement must match exactly once)
import sys, os, json, importlib.util
here = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(here, 't43')
src, dst, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
stock = sys.argv[sys.argv.index('--stock') + 1] if '--stock' in sys.argv else None
i18n_file = sys.argv[sys.argv.index('--i18n-file') + 1] if '--i18n-file' in sys.argv else None
rd = lambda f: open(os.path.join(T, f), encoding='utf-8', newline='').read()
s = open(src, encoding='utf-8', newline='').read(); n = 0
def rep(old, new, cnt=1):
    global s, n
    c = s.count(old)
    if c != cnt: raise SystemExit('replacement %d: found %d times (want %d): %r' % (n + 1, c, cnt, old[:90]))
    s = s.replace(old, new); n += 1
spec = importlib.util.spec_from_file_location('i18n43', os.path.join(T, 'i18n43.py')); i18n = importlib.util.module_from_spec(spec); spec.loader.exec_module(i18n)

# ---- the core: four more fields of a build, what they weigh and cost ----
rep("CU_KEYS.push(...CU40_KEYS);\n", """CU_KEYS.push(...CU40_KEYS);
// (round 43) the exhaust's fittings: flex: the flex joint; hang: the hangers; joint: the joints between the pipe's
// sections; bend: how its bends were made. A build without them (a code made before) has its body's own: a braided
// joint, rubber hangers, bolted flanges, mandrel bends
const CU43_KEYS = [['flex', ['braid', 'bellows', 'none']], ['hang', ['rubber', 'poly', 'solid']], ['joint', ['flange', 'vband', 'slip', 'weld']], ['bend', ['mandrel', 'crush']]], CU43_DEF = { flex: 'braid', hang: 'rubber', joint: 'flange', bend: 'mandrel' };
CU_KEYS.push(...CU43_KEYS);
// what the exhaust weighs with the build's metal and joints, against the mild steel, flanged one (base, kg): stainless
// is drawn thinner (a tenth lighter), titanium is a little over half the weight; a V-band saves most of a flange's
// plates, a weld all of them; no flex joint, a little
function ex43Kg(B, base) {
  const f = { steel: 1, stainless: 0.9, ti: 0.56 }[B.pmat] || 1, j = { flange: 0, vband: -0.8, slip: -0.3, weld: -1.2 }[B.joint] || 0;
  return base * f + j + (B.flex === 'none' ? -0.6 : 0);
}
""")
rep("Object.assign(B, CU35_DEF, CU36_DEF, CU40_DEF);", "Object.assign(B, CU35_DEF, CU36_DEF, CU40_DEF, CU43_DEF);")
rep("- CU_PARTK.length - CU40_KEYS.length) return null;", "- CU_PARTK.length - CU40_KEYS.length - CU43_KEYS.length) return null;")
rep("const cu36On = B => (B.pipeD != null && B.pipeD !== 'own') || (B.exit != null && B.exit !== 'own');",
    "const cu36On = B => (B.pipeD != null && B.pipeD !== 'own') || (B.exit != null && B.exit !== 'own') || B.bend === 'crush' || B.flex === 'bellows'; // (round 43: pinched bends and a bare bellows cost flow too)")
rep("  return 0.022 * L / (D / 1000) + (short ? 0.5 : 0.9) + 1 +", "  return 0.022 * L / (D / 1000) + (short ? 0.5 : 0.9) * (B.bend === 'crush' ? 1.8 : 1) /* (round 43: a crush bend loses nearly twice a mandrel bend's) */ + (B.flex === 'bellows' ? 0.15 : 0) + 1 +")
rep("  const ref = exAt(B, L0, D0, E.pmax).dp, P = r =>", "  const ref = exAt(B.bend === 'crush' || B.flex === 'bellows' ? Object.assign({}, B, { bend: 'mandrel', flex: 'braid' }) : B, L0, D0, E.pmax).dp, P = r =>")
rep("  add('exhaust', 9 + 2 * Math.sqrt(B.cyl * B.litres) + (cu36On(B) ? exInfo(B, E).kg : 0),", "  add('exhaust', ex43Kg(B, 9 + 2 * Math.sqrt(B.cyl * B.litres)) + (cu36On(B) ? exInfo(B, E).kg : 0),")
rep("hdr: B.hdr, resT: B.resT, pmat: B.pmat };\n  D.bay36 = B; D.kitKey = (D.kitKey || '') + [B.resT, B.pmat,", "hdr: B.hdr, resT: B.resT, pmat: B.pmat, flex: B.flex, hang: B.hang, joint: B.joint, bend: B.bend };\n  D.bay36 = B; D.kitKey = (D.kitKey || '') + [B.flex, B.hang, B.joint, B.bend, B.resT, B.pmat,")
rep("X = B ? { cat: B.cat, res: B.res, muff: B.muff, exit: 'own', d: 0, hdr: B.hdr, resT: B.resT, pmat: B.pmat }", "X = B ? { cat: B.cat, res: B.res, muff: B.muff, exit: 'own', d: 0, hdr: B.hdr, resT: B.resT, pmat: B.pmat, flex: B.flex, hang: B.hang, joint: B.joint, bend: B.bend }")
# ---- the Workshop ----
rep("put('under', 'resT', 'pmat',", "put('under', 'flex', 'hang', 'joint', 'bend', 'resT', 'pmat',")
rep("const WS_LOOK = ['resT', 'pmat',", "const WS_LOOK = ['flex', 'hang', 'joint', 'bend', 'resT', 'pmat',")
rep("  if (ecu) add(sec('Off the throttle'), row('Overrun',", "  ws43Rows(W, add, B);\n  if (ecu) add(sec('Off the throttle'), row('Overrun',")
# ---- the kit: the pipe's runs and boxes kept in the order they are laid, the car handed to the fittings ----
rep("const runs = [], boxes = [], seg = (a, b) =>", "const runs = [], boxes = [], seq = [], seg = (a, b) =>")
rep("ex40K(pipe, ex36.X, runs.length), 7, true, true); runs.push([a, b]); }, box =", "ex40K(pipe, ex36.X, runs.length), 7, true, true); runs.push([a, b]); seq.push([0, a, b]); }, box =")
rep("if (on) boxes.push([x0, x1, y0, y1, z0, z1]); return on; };", "if (on) { boxes.push([x0, x1, y0, y1, z0, z1]); seq.push([1, kind || 'sil', x0, x1, y0, y1, z0, z1, (kind || 'sil') === 'sil' && ex36.X.catIn != null ? 1 : 0]); } return on; };")
rep("ex36Pipe(body, a, b, ex36.X.r + 0.003, null, pipe, 7, true, true); runs.push([a, b]); };", "ex36Pipe(body, a, b, ex36.X.r + 0.003, null, pipe, 7, true, true); runs.push([a, b]); seq.push([2, a, b]); };")
rep("out.exhaust = { ends: [], tips: pipes.map(x => [x, exY, zT]), runs, boxes };", "out.exhaust = { ends: [], tips: pipes.map(x => [x, exY, zT]), runs, boxes, seq };")
rep("ex40Fit({ body, bx, out, X: ex36.X, under, kick, r: ex36.X.r }); }", "ex40Fit({ body, bx, out, X: ex36.X, under, kick, r: ex36.X.r, S, D }); }")
# (a side pipe's in-line silencer, and the short can on its cross pipe, noted for the sound as the other boxes are)
rep("'sil', xr - 0.075, xr + 0.075, s0[1] - 0.045, s0[1] + 0.085, s0[2], s1[2], r); at = s1; }", "'sil', xr - 0.075, xr + 0.075, s0[1] - 0.045, s0[1] + 0.085, s0[2], s1[2], r); if (o.note) o.note([1, 'sil', xr - 0.075, xr + 0.075, s0[1] - 0.045, s0[1] + 0.085, s0[2], s1[2], 0]); at = s1; }")
rep("ex36Pipe(body, q0, q1, 0.05, 0.05, [0.68, 0.68, 0.7], 10, true, true); seg(q1, m); }", "ex36Pipe(body, q0, q1, 0.05, 0.05, [0.68, 0.68, 0.7], 10, true, true); if (o.note) o.note([1, 'sil', Math.min(q0[0], q1[0]) - 0.02, Math.max(q0[0], q1[0]) + 0.02, q0[1] - 0.06, q0[1] + 0.06, Math.max(q0[2], q1[2]) + 0.02, Math.min(q0[2], q1[2]) - 0.02, 0]); seg(q1, m); }")
rep("ex36SideRoute({ at, xr, P, seg, box, X: ex36.X, side: ex36.side, body });", "ex36SideRoute({ at, xr, P, seg, box, X: ex36.X, side: ex36.side, body, note: q => seq.push(q) });")
rep("function ex40Fit(o) {", "function ex40Fit0(o) { // (round 40's, kept for reference: round 43's ex40Fit draws each fitting as the build chooses it)")
# ---- the running gear's feet ----
rep("    // the mesh: each part's triangles, laid out once; their places set each time it is drawn", rd('mech43call.txt') + "    // the mesh: each part's triangles, laid out once; their places set each time it is drawn")
# ---- the sound: the chain in the engine's sound, and each car's figures ----
rep("  // valve gear: the band a valve's tick rings in [Hz, Q]", rd('pipenet.js') + "  // valve gear: the band a valve's tick rings in [Hz, Q]")
rep("this.main0 = this.main; this.mainO = null; this.opened = 0;", "this.main0 = this.main; this.mainO = null; this.opened = 0; this.nt = K.net && K.net.sec && K.net.sec.length ? new PipeNet(sr, K.net) : null; this.sbG = K.sbG || 0; this.sbA = 1 - Math.exp(-TAU * 170 / sr); this.sbZ = 0; this.sbZ2 = 0; // (round 43: the pipe as its chain of sections; what a stiffly hung pipe shakes into the shell)")
rep("        const m = (_du = (x), _dq = this.main,", "        const m = this.nt && !this.opened ? this.nt.run(x) : (_du = (x), _dq = this.main,")
rep("        o0[s] = (this.lx2 + jet * 0.12) * tr0; if (gc && this.load > 0.6)", "        if (this.sbG) { this.sbZ += (this.lx2 - this.sbZ) * this.sbA; this.sbZ2 += (this.sbZ - this.sbZ2) * this.sbA; } o0[s] = (this.lx2 + jet * 0.12) * tr0; if (gc && this.load > 0.6)")
rep("o2[s] = this.lm * tr2 * (on ? 1 : 0.15) + sts;", "o2[s] = this.lm * tr2 * (on ? 1 : 0.15) + sts + (this.sbG ? this.sbZ2 * this.sbG * tr0 : 0);")
rep("  return EngineDSP;\n}", "  EngineDSP.PipeNet = PipeNet;\n  return EngineDSP;\n}")
rep("ex36Sound(K, B, S0, E); ex40Sound(K, B, S0, E);", "ex36Sound(K, B, S0, E); ex40Sound(K, B, S0, E); ex43Sound(K, B, S0, E, ENGINE_CFG[donor.id] || ENGINE_CFG.ardent_5t);")
rep("  K.st.Tst = sc[4] || _stTst[S.id] || (_stTst[S.id] = EngineDSPDef().Starter.tst(K)); return K;", "  K.st.Tst = sc[4] || _stTst[S.id] || (_stTst[S.id] = EngineDSPDef().Starter.tst(K)); if (typeof ex43For === 'function') ex43For(S, K); return K;")
# ---- the round's own code, with each entered car's pipe as measured from its drawn car ----
table = 'const EX43_STOCK = ' + (open(stock, encoding='utf-8').read().strip() if stock else '{}') + ';\n'
rep("// ---------- per-frame update ----------", rd('mech43.js') + rd('ex43.js') + "// each entered car's own pipe, measured from the car as drawn (harness/geo43.js)\n" + table + "// ---------- per-frame update ----------")
# ---- the texts ----
if i18n_file:
    t = open(i18n_file, encoding='utf-8', newline='').read()
    if 'round 43: the exhaust' not in t:
        tail = 'return I18N_MORE;'
        if t.count(tail) == 1: t = t.replace(tail, i18n.block() + tail)  # (the artifact's file: the lists are built inside a function)
        else: t = t.rstrip('\n') + '\n' + i18n.block()
        open(i18n_file, 'w', encoding='utf-8', newline='').write(t)
else:
    anchor = 'I18N_MORE.de.push(...["Resonator-Bauart"'
    i = s.find(anchor); assert i >= 0 and s.count(anchor) == 1; j = s.find('\n', i) + 1; s = s[:j] + i18n.block() + s[j:]; n += 1
# ---- the stamp ----
import re
m = re.findall(r"const SR86_BUILD = '([0-9A-F]{4})';", s); assert len(m) == 1, m
s = s.replace("const SR86_BUILD = '%s';" % m[0], "const SR86_BUILD = '%s';" % stamp)
open(dst, 'w', encoding='utf-8', newline='').write(s)
print('round 43: %d replacements, %s -> %s (%d bytes), stamp %s (was %s)' % (n, os.path.basename(src), os.path.basename(dst), len(s.encode('utf-8')), stamp, m[0]))
