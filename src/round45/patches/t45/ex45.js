// ==== ROUND 45: THE GAS IN PULSES, AND EACH PIPE'S OWN FIRE ====
// The gas does not leave an engine steadily: each cylinder sends a pulse as its exhaust valve opens (a sharp blow-down,
// then the piston pushing the rest out). What a pipe loses goes with the square of the gas's speed, so a pipe that gets
// its gas in uneven lumps loses more than one that gets the same gas evenly: the mean of the square is more than the
// square of the mean. One pipe from all the cylinders gets every pulse, evenly spaced. A pipe from one bank gets half of
// them, and on a cross-plane V8 unevenly (90, 180, 270 degrees apart). An X-pipe shares every pulse between the two pipes
// behind it; an H-pipe's tube lets some of each across.
// (one cylinder's flow, th degrees after its valve opens: 250 degrees long, the blow-down its first 90)
function ex45Pulse(th) { return th < 0 || th >= 250 ? 0 : (th < 90 ? 1.6 * Math.sin(Math.PI * th / 90) : 0) + Math.sin(Math.PI * th / 250); }
// (mean of the square over the square of the mean, for a pipe taking the share w[c] of each cylinder's pulse)
function ex45Phi(fire, w) { let s1 = 0, s2 = 0; for (let a = 0; a < 720; a += 5) { let q = 0; for (let c = 0; c < fire.length; c++) if (w[c]) q += w[c] * ex45Pulse((((a - fire[c]) % 720) + 720) % 720); s1 += q; s2 += q * q; } return s1 > 0 ? (s2 / 144) / ((s1 / 144) * (s1 / 144)) : 1; }
// A build's pipes against one pipe from all its cylinders: 1 for one pipe (whatever its tailpipes), more for a pipe a
// bank. Ahead of the crossover each pipe has its own bank's pulses (a quarter of a front engine's pipe, half of a mid or
// rear engine's); behind it an X-pipe's two pipes share all of them, an H-pipe's 18% of each other's (its tube against
// the pipe it is on), with none each keeps its own. A turbine each smooths most of it out.
const EX45_PSI = {};
function ex45Psi(B) {
  const xo = typeof ex44Xo === 'function' ? ex44Xo(B) : null; if (!xo) return 1;
  const key = [B.layout, B.cyl, B.crank, B.vang, B.eng, xo, B.pos, B.asp].join('|'); if (EX45_PSI[key] != null) return EX45_PSI[key];
  let F = null; try { F = cuFiring(B, typeof cuEng === 'function' ? cuEng(B.eng) : null); } catch (e) { F = null; }
  let psi = 1;
  if (F && F.bank && F.fire && F.bank.some(b => b === 0) && F.bank.some(b => b === 1)) {
    const all = ex45Phi(F.fire, F.fire.map(() => 1)), mix = s => (ex45Phi(F.fire, F.bank.map(q => q === 0 ? 1 - s : s)) + ex45Phi(F.fire, F.bank.map(q => q === 1 ? 1 - s : s))) / 2 / all;
    const own = mix(0), down = xo === 'x' ? mix(0.5) : xo === 'h' ? mix(0.18) : own, up = B.pos === 'front' || B.pos === 'fmid' ? 0.25 : 0.5;
    psi = up * own + (1 - up) * down; if (B.asp === 'biturbo') psi = 1 + (psi - 1) * 0.4; }
  return EX45_PSI[key] = +psi.toFixed(4);
}
// against the body's own layout of pipes (so a build that leaves them as they are is as its body's car is)
function ex45PsiRel(B, S0) {
  let own = null; try { own = typeof cuBare === 'function' && S0 ? cuBare(S0).B : null; } catch (e) { own = null; }
  const p0 = own ? ex45Psi(Object.assign({}, B, { xover: own.xover, tail: own.tail })) : 1; return +(ex45Psi(B) / p0).toFixed(4);
}
// ---- which pipe a pop is in, and whose flame is seen ----
// A pop is unburnt charge from one cylinder lighting in the pipe that cylinder feeds. With a pipe a bank and nothing
// between them its flame comes out of that bank's tailpipe only; through an X-pipe out of both; through an H-pipe out of
// its own, and out of the other only from a big one. One pipe - whatever its tailpipes - throws it out of every end.
// fb: each bank's biggest pop since the last frame, as a flame's size (see Snd.flame)
function ex45FlameOf(fl, i, f, fb) {
  const md = fl.userData.mode || 'one'; if (md === 'one' || !fb) return f; const b = (fl.userData.bank || [])[i] ? 1 : 0, own = fb[b] || 0, oth = fb[1 - b] || 0;
  return md === 'x' ? Math.max(own, oth) * 0.92 : md === 'h' ? Math.max(own, oth * 0.45) : own;
}
