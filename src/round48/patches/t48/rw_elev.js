// ---- round 48: a real road's heights, laid as a road is built ----
// The elevation model's heights along the course's line (the pack's profile, every pds metres along the map's line) are
// where the ground is, not quite where the road is: a road on a steep hillside sits on a bench a few metres off the
// map's line (the model reads it metres high or low), a road in a cutting runs below the land, a bridge over its
// valley, a tunnel under its hill, and the model's own steps and errors come through as spikes. A real road's heights
// run in long even grades joined by gentle crests and hollows (vertical curves), as gentle as the speeds it was built
// for. So the road's line of heights is laid as a road builder lays a grade line through the ground: the smoothest line
// (the least change of grade - a penalty on every point's second difference, stiffer the faster the road's class) that
// keeps near the ground where the ground can be trusted:
//   - each height counts by how sure it is: less where the hillside across the road is steep (sigma, from the model's
//     slope across the road 4 m either side and a map line some 2.5 m off its road), not at all on a bridge or in a
//     tunnel and a little past their ends (an abutment, a portal's face);
//   - four passes: the first stiff, for the line's trend; each after it dropping, smoothly, the heights that stand
//     further off the line than their error allows (a cutting, an embankment, a viaduct or a tunnel the map does not
//     have: Tukey's biweight, beyond 2.5 m and four of the point's sigmas);
//   - then held to its class's steepest grade and gentlest crest and hollow (RW_VC): where the line breaks either, the
//     ground there counts for less and the line is stiffer, and it is laid again (up to six times); a last clamp of the
//     grade, smoothed, takes what is left.
// RW_VC by class: [the wavelength the line smooths over (m), steepest grade, least radius of a crest or hollow (m)].
// Design manuals' crest and sag curves for a class's speed are gentler still (a motorway's some 10-20 km, a country
// road's 1-3 km); these are the least the game lets the map's errors make, so a real road's own short sharp crest
// survives where the map has it.
const RW_VC = { motorway: [300, 0.075, 2500], trunk: [240, 0.09, 1200], primary: [190, 0.12, 600], secondary: [150, 0.14, 350], tertiary: [125, 0.16, 220], unclassified: [105, 0.18, 140], residential: [95, 0.2, 110], living_street: [85, 0.2, 90], road: [105, 0.18, 140], service: [85, 0.22, 80], track: [85, 0.24, 60], raceway: [190, 0.12, 300], busway: [150, 0.12, 300], escape: [70, 0.25, 50], pedestrian: [85, 0.2, 90] };
// the smoothest line through d by weights w (each penalised second difference by lam at its middle point): minimises
// sum w (y - d)^2 + sum lam (y[k] - 2 y[k+1] + y[k+2])^2, its matrix five-banded, solved by Cholesky in O(n)
function rwWhit(w, d, lam) {
  const n = d.length, A0 = new Float64Array(n), A1 = new Float64Array(n), A2 = new Float64Array(n), b = new Float64Array(n);
  for (let i = 0; i < n; i++) { A0[i] = w[i] + 1e-9; b[i] = w[i] * d[i]; }
  for (let k = 0; k + 2 < n; k++) { const l = lam[k + 1]; A0[k] += l; A0[k + 1] += 4 * l; A0[k + 2] += l; A1[k] -= 2 * l; A1[k + 1] -= 2 * l; A2[k] += l; }
  const L0 = new Float64Array(n), L1 = new Float64Array(n), L2 = new Float64Array(n), z = new Float64Array(n), y = new Float64Array(n);
  for (let i = 0; i < n; i++) { const l2 = i >= 2 ? A2[i - 2] / L0[i - 2] : 0, l1 = i >= 1 ? (A1[i - 1] - l2 * (i >= 2 ? L1[i - 1] : 0)) / L0[i - 1] : 0;
    L0[i] = Math.sqrt(Math.max(1e-12, A0[i] - l1 * l1 - l2 * l2)); L1[i] = l1; L2[i] = l2; }
  for (let i = 0; i < n; i++) z[i] = (b[i] - (i >= 1 ? L1[i] * z[i - 1] : 0) - (i >= 2 ? L2[i] * z[i - 2] : 0)) / L0[i];
  for (let i = n - 1; i >= 0; i--) y[i] = (z[i] - (i + 1 < n ? L1[i + 1] * y[i + 1] : 0) - (i + 2 < n ? L2[i + 2] * y[i + 2] : 0)) / L0[i];
  return y;
}
function rwHeights(C, CL) {
  const n0 = CL.n, R = C.r, pr = C.prof, ds = C.pds || 2, loop = C.kind === 'loop';
  const cum = new Float64Array(R.x.length); for (let k = 1; k < R.x.length; k++) cum[k] = cum[k - 1] + Math.hypot(R.x[k] - R.x[k - 1], R.z[k] - R.z[k - 1]);
  const along = m => { const v = Math.min(CL.v[m], R.x.length - 2), ex = R.x[v + 1] - R.x[v], ez = R.z[v + 1] - R.z[v], L2 = ex * ex + ez * ez || 1, t = clamp(((CL.x[m] - R.x[v]) * ex + (CL.z[m] - R.z[v]) * ez) / L2, 0, 1); return cum[v] + t * Math.sqrt(L2); };
  const at = s => { const f = clamp(s / ds, 0, pr.length - 1.001), k = f | 0; return pr[k] + (pr[k + 1] - pr[k]) * (f - k); };
  const tagOf = m => (C.ways[R.w[Math.min(R.w.length - 1, CL.v[m])]] || {}).t || {};
  // (a loop: laid round once more either side, so its line runs on round its join, and the middle copy kept)
  const P0 = loop ? Math.min(n0 - 1, 400) : 0, M = n0 - 1, n = n0 + 2 * P0, src = j => loop ? (((j - P0) % M) + M) % M : j;
  const d = new Float64Array(n), sg = new Float64Array(n), st = new Uint8Array(n), lam = new Float64Array(n), gmx = new Float64Array(n), cmx = new Float64Array(n);
  const D0 = new Float64Array(n0), S0 = new Float64Array(n0), T0 = new Uint8Array(n0), V0 = [];
  for (let m = 0; m < n0; m++) { const t = tagOf(m), hw = (t.highway || 'road').replace('_link', ''), h = CL.h[m], lx = Math.cos(h), lz = -Math.sin(h), A = 4;
    D0[m] = at(along(m)); const s = Math.abs(rwNat(C, CL.x[m] + lx * A, CL.z[m] + lz * A) - rwNat(C, CL.x[m] - lx * A, CL.z[m] - lz * A)) / (2 * A);
    S0[m] = Math.sqrt(0.25 + (Math.min(s, 1.5) * 2.5) ** 2); T0[m] = rwYes(t.bridge) ? 1 : rwYes(t.tunnel) || t.covered === 'yes' ? 2 : 0; V0.push(RW_VC[hw] || RW_VC.road); }
  for (let j = 0; j < n; j++) { const m = src(j), V = V0[m]; d[j] = D0[m]; sg[j] = S0[m]; st[j] = T0[m]; lam[j] = Math.pow(V[0] / (2 * Math.PI * STEP), 4); gmx[j] = V[1] * STEP; cmx[j] = STEP * STEP / V[2]; }
  // (a bridge's and a tunnel's stretch, and a little past its ends: an abutment's 4 m, a portal's 12 m, carry no weight)
  const w0 = new Float64Array(n); for (let j = 0; j < n; j++) w0[j] = 1 / (sg[j] * sg[j]);
  for (let j = 0; j < n; j++) { if (!st[j]) continue; let e = j; while (e + 1 < n && st[e + 1] === st[j]) e++; const pad = st[j] === 2 ? 6 : 2; for (let k = Math.max(0, j - pad); k <= Math.min(n - 1, e + pad); k++) w0[k] = 0; j = e; }
  { let any = 0; for (let j = 0; j < n; j++) if (w0[j] > 0) any++; if (any < 2) w0.fill(1); } // (all of it bridge or tunnel: the model's heights, such as they are)
  const w = w0.slice(), lz = lam.slice(); for (let j = 0; j < n; j++) lz[j] *= 16;
  let y = rwWhit(w, d, lz);
  for (let it = 0; it < 3; it++) { for (let j = 0; j < n; j++) { if (!w0[j]) continue; const r = d[j] - y[j], c = 2.5 + 4 * sg[j], u = r / c; w[j] = Math.abs(u) < 1 ? w0[j] * (1 - u * u) * (1 - u * u) : 0; }
    for (let j = 0; j < n; j++) lz[j] = lam[j] * (it === 0 ? 4 : 1); y = rwWhit(w, d, lz); }
  // (held to its class's steepest grade and gentlest crest and hollow: where it breaks one, its ground counts for less and
  // its line is stiffer there, 15 points either side, and it is laid again)
  for (let pass = 0; pass < 6; pass++) { const bad = new Uint8Array(n); let nb = 0;
    for (let j = 1; j + 1 < n; j++) { const g1 = y[j] - y[j - 1], g2 = y[j + 1] - y[j]; if (Math.abs(g2) > gmx[j] * 1.02 || Math.abs(g2 - g1) > cmx[j] * 1.05) { bad[j] = 1; nb++; } }
    if (!nb) break;
    for (let j = 0; j < n; j++) { if (!bad[j]) continue; for (let k = Math.max(0, j - 15); k <= Math.min(n - 1, j + 15); k++) { lz[k] = Math.max(lz[k], lam[k] * Math.pow(3, pass + 1)); w[k] *= 0.7; } }
    y = rwWhit(w, d, lz); }
  // (the last of it: the grade clamped both ways, then eased over some 40 m so its clamps leave no crease, three times)
  for (let rep = 0; rep < 3; rep++) {
    for (let it = 0; it < 3; it++) { for (let j = 1; j < n; j++) y[j] = clamp(y[j], y[j - 1] - gmx[j], y[j - 1] + gmx[j]); for (let j = n - 2; j >= 0; j--) y[j] = clamp(y[j], y[j + 1] - gmx[j], y[j + 1] + gmx[j]); }
    const one = new Float64Array(n).fill(1), lt = new Float64Array(n).fill(Math.pow(40 / (2 * Math.PI * STEP), 4)); y = rwWhit(one, y, lt); }
  const out = new Float64Array(n0); for (let m = 0; m < n0; m++) out[m] = y[m + P0];
  if (loop) { const e = out[0] - out[n0 - 1]; for (let m = 0; m < n0; m++) out[m] += e * (m / (n0 - 1) - 0.5); out[n0 - 1] = out[0]; } // (its last point its first)
  return out;
}
// A there-and-back's turn, from the road's end round to where it comes back onto the road: its heights a curve that
// leaves the road at its grade there and meets it again at its grade there (Hermite's), no crease at either end.
// YL: the road's heights (rwHeights), L: rwLayout's. Returns the turn's height at a share t of the way round
function rwTurnYs(YL, L) {
  const T = L.turn; if (!T) return null; const iB = Math.min(YL.length - 1, L.iB), rb = T.rb, yT = YL[iB], yB = YL[rb], g0 = (YL[iB] - YL[Math.max(0, iB - 1)]) / STEP, g1 = (YL[Math.max(0, rb - 1)] - YL[rb]) / STEP, Ln = (T.x.length + 1) * STEP;
  return t => { const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * yT + (t3 - 2 * t2 + t) * g0 * Ln + (-2 * t3 + 3 * t2) * yB + (t3 - t2) * g1 * Ln; };
}
