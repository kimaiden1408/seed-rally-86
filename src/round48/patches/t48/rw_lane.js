// ---- round 48: a real road's lanes and the lines painted on it, as the map and the country have them ----
//
// Each country's way of marking its roads. RW_RGD is the Vienna Convention's common practice (white lines, a broken
// line 3 m painted and 9 m clear, solid edge lines); each country's rules (RW_RG, keyed as RW_RGC maps its ISO 3166 code)
// override it. Fields:
//   side: 'R' or 'L', the side traffic keeps to;
//   cen: the colour of the line between the two directions ('W' white, 'Y' yellow); npc: a no-passing line's colour where
//     it differs (Japan's and New Zealand's yellow, beside or instead of a white centre line);
//   med: the line along a central reserve, the left edge of a one-way carriageway as its traffic drives it; edg: the
//     outer edge line;
//   dR, dT: the centre line's broken pattern [paint, gap] (m) outside towns and in them; dL: lane lines'; dM: a motorway's;
//   warn: the warning line before a stretch where crossing is not allowed (null: none - America and Korea use signs);
//   soft: where sight is limited but not short (a winding road), that warning line all along instead of a solid one
//     (France's dissuasion line, Britain's hazard warning line, the Nordic countries' warning line);
//   both: where neither direction may cross, 'd' a double solid line or 's' a single one; multi: the same for the
//     middle of an undivided road of two lanes or more each way;
//   eR: an ordinary road's edge line ('s' solid, or broken [paint, gap]); eM: a motorway's outer edge line;
//   minC: the narrowest carriageway (m) with a centre line; wl: the lines' width (m); gap: between a double line's two;
//   lw: the lanes' widths by class, for roads the map gives no width (m);
//   tun: lane lines solid in tunnels and on bridges (Korea); stag: neighbouring lane lines' dashes staggered (Korea's
//     ordinary roads, three lanes a way or more); twl: a three-lane road on the flat in a town has a two-way turn lane in
//     its middle (North America); jp: Japan's centre lines (white solid where its lanes are 3 m or more, broken where
//     less, yellow where passing is not allowed).
// Sources: France - Code de la route / IISR part 7 (T1 3 m / 10 m, in towns 1.5 m / 5 m; T3 warning 3 m / 1.33 m; edge
// T2 3 m / 3.5 m, motorway hard shoulder 39 m / 13 m); USA, Canada - MUTCD 2009 part 3 (yellow centre and left edge,
// 10 ft / 30 ft broken lines, double yellow on undivided multilane roads, passing sight distances, table 3B-1); Korea -
// yellow centre lines, white median-side lines on expressways (Korea Expressway Corporation since 2014), staggered lane
// dashes on ordinary roads; Japan - MLIT marking standard (double centre lines 0.15 m with 0.15 m between; lane lines
// 5 m / 5 m in bends and towns). The other countries' patterns are their usual practice, not checked against their
// manuals.
const RW_RGD = { side: 'R', cen: 'W', npc: null, med: 'W', edg: 'W', dR: [3, 9], dT: [3, 6], dL: [3, 9], dM: [3, 9], warn: null, both: 's', multi: 's', eR: 's', eM: 's', minC: 5.5, wl: 0.15, gap: 0.12, tun: 0, stag: 0, twl: 0, jp: 0,
  lw: { motorway: 3.5, trunk: 3.5, primary: 3.5, secondary: 3.25, tertiary: 3.0, unclassified: 2.75, residential: 2.75, living_street: 2.4, service: 3.0, track: 2.75, road: 2.9, raceway: 4.5, busway: 3.25, escape: 3.5 } };
const RW_RG = {
  fr: { dR: [3, 10], dT: [1.5, 5], dL: [3, 10], dM: [3, 10], warn: [3, 1.33], soft: 1, eR: [3, 3.5], eM: [39, 13], minC: 5.2 },
  de: { dR: [6, 12], dT: [3, 6], dL: [6, 12], dM: [6, 12], warn: [6, 3], multi: 'd', minC: 5.5, lw: { motorway: 3.75, trunk: 3.5, primary: 3.5, secondary: 3.25, tertiary: 3.0 } },
  it: { dR: [4.5, 7.5], dT: [3, 4.5], dL: [4.5, 7.5], dM: [4.5, 7.5], lw: { motorway: 3.75, trunk: 3.75, primary: 3.75, secondary: 3.5, tertiary: 3.25 } },
  gb: { side: 'L', dR: [3, 9], dT: [2, 7], dL: [3, 9], dM: [2, 7], warn: [6, 3], soft: 1, both: 'd', multi: 'd', lw: { motorway: 3.65, trunk: 3.65, primary: 3.65, secondary: 3.3, tertiary: 3.0 } },
  ie: { side: 'L', edg: 'Y', dR: [3, 9], dT: [2, 7], dL: [3, 9], dM: [2, 7], warn: [6, 3], soft: 1, both: 'd', multi: 'd', lw: { motorway: 3.65, trunk: 3.65, primary: 3.65, secondary: 3.3, tertiary: 3.0 } },
  nord: { cen: 'Y', dR: [3, 9], dT: [3, 9], dL: [3, 9], dM: [3, 9], warn: [9, 3], soft: 1 },
  se: { dR: [3, 9], dT: [3, 9], dL: [3, 9], dM: [3, 9], warn: [9, 3], soft: 1 },
  us: { cen: 'Y', med: 'Y', dR: [3.05, 9.15], dT: [3.05, 9.15], dL: [3.05, 9.15], dM: [3.05, 9.15], both: 'd', multi: 'd', minC: 4.9, twl: 1, gap: 0.1, wl: 0.13, lw: { motorway: 3.65, trunk: 3.65, primary: 3.6, secondary: 3.4, tertiary: 3.3, unclassified: 3.0, residential: 3.0 } },
  latam: { cen: 'Y', med: 'Y', dR: [4, 8], dT: [3, 5], dL: [4, 8], dM: [4, 8], both: 'd', multi: 'd', minC: 5.0 },
  kr: { cen: 'Y', med: 'Y', dR: [3, 5], dT: [3, 5], dL: [3, 5], dM: [10, 10], multi: 'd', minC: 5.0, tun: 1, stag: 1, gap: 0.12, lw: { motorway: 3.6, trunk: 3.5, primary: 3.5, secondary: 3.25, tertiary: 3.0, unclassified: 3.0, residential: 3.0 } },
  jp: { side: 'L', npc: 'Y', dR: [5, 5], dT: [5, 5], dL: [5, 5], dM: [8, 12], both: 's', multi: 's', jp: 1, gap: 0.15, lw: { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.0, tertiary: 3.0, unclassified: 2.75, residential: 2.75 } },
  cn: { cen: 'Y', med: 'Y', dR: [4, 6], dT: [2, 4], dL: [4, 6], dM: [6, 9], both: 'd', multi: 'd', lw: { motorway: 3.75, trunk: 3.75, primary: 3.5, secondary: 3.5, tertiary: 3.25 } },
  tw: { cen: 'Y', dR: [4, 6], dT: [4, 6], dL: [4, 6], dM: [4, 6], both: 'd', multi: 'd' },
  au: { side: 'L', dR: [3, 9], dT: [3, 9], dL: [3, 9], dM: [3, 9], both: 'd', multi: 'd' },
  nz: { side: 'L', npc: 'Y', dR: [3, 7], dT: [3, 7], dL: [3, 7], dM: [3, 7], both: 'd', multi: 'd' },
  za: { side: 'L', edg: 'Y', dR: [3, 9], dT: [3, 9], dL: [3, 9], dM: [3, 9] },
  lht: { side: 'L' },
  th: { side: 'L', cen: 'Y' }
};
const RW_RGC = (() => { const m = {}, put = (g, s) => { for (const c of s.split(' ')) m[c] = g; };
  put('fr', 'FR MC'); put('de', 'DE AT CH LI LU'); put('it', 'IT SM VA'); put('gb', 'GB IM JE GG'); put('ie', 'IE'); put('nord', 'NO FI'); put('se', 'SE');
  put('us', 'US CA PR'); put('latam', 'MX GT BZ SV HN NI CR PA CU DO HT CO VE EC PE BO BR PY UY AR CL'); put('kr', 'KR'); put('jp', 'JP'); put('cn', 'CN'); put('tw', 'TW');
  put('au', 'AU'); put('nz', 'NZ'); put('za', 'ZA NA BW LS SZ ZW ZM MW MZ'); put('th', 'TH');
  put('lht', 'IN PK BD LK NP BT MY SG BN ID TL HK MO MV MU SC KE TZ UG CY MT JM BB BS TT GY SR AG DM GD KN LC VC VG KY BM FK FJ PG SB TO WS KI TV NR VI'); return m; })();
// the country a course is in: the pack's (the map's country, asked when it was made), else the land it lies in, roughly
function rwCountryOf(C) {
  if (C.cc) return String(C.cc).toUpperCase(); const la = C.o[0], lo = C.o[1], In = (a, b, c, d) => la >= a && la <= b && lo >= c && lo <= d;
  if (In(43.72, 43.76, 7.39, 7.45)) return 'MC'; if (In(33, 38.7, 124.5, 129.6)) return 'KR'; if (In(24, 45.6, 128.4, 146)) return 'JP'; if (In(21.8, 25.4, 119.9, 122.1)) return 'TW';
  if (In(51.3, 55.5, -10.7, -5.9) && !(la > 54 && lo > -8.2)) return 'IE'; if (In(49.8, 60.9, -8.7, 1.8)) return 'GB';
  if (In(24.5, 49.4, -125, -66.9) || In(51, 71.5, -170, -130) || In(18.8, 22.4, -160.5, -154.7)) return 'US'; if (In(41.6, 83, -141, -52)) return 'CA'; if (In(14.5, 32.7, -118.5, -86.7)) return 'MX';
  if (In(-56, 13, -82, -34)) return 'BR'; if (In(-44, -10, 112, 154)) return 'AU'; if (In(-47.5, -34, 166, 178.6)) return 'NZ'; if (In(-35, -22, 16.4, 33)) return 'ZA';
  if (In(6, 35.6, 68, 97.4)) return 'IN'; if (In(5.6, 20.5, 97.3, 105.7)) return 'TH'; if (In(18, 53.6, 73.5, 134.8)) return 'CN';
  if (In(41.3, 51.1, -5.2, 9.6)) return 'FR'; if (In(47.2, 55.1, 5.8, 15.1)) return 'DE'; if (In(36.6, 47.1, 6.6, 18.6)) return 'IT'; if (In(57.9, 71.2, 4.5, 31.5)) return lo < 12.5 && la < 69 ? 'NO' : la > 59.8 && lo > 20.5 ? 'FI' : 'SE';
  return '';
}
// (a two-way main road the map has as one lane: in most countries a main road is never single-track, and "lanes=1" there
// is the map's way of saying one lane each way - Korea's maps often have it so - so it is read as that; where main roads
// do run single-track (Britain's and Ireland's, the Nordic countries', Australia's and New Zealand's), as the map has it)
function rwOneLaneMain(t, one, ln) { if (one || ln !== 1) return false; const hw = (t.highway || '').replace('_link', ''), w = parseFloat(String(t.width || '').replace(',', '.'));
  if (w > 0 && w < 4.5) return false; const g = RW_CUR.g; if (/^(gb|ie|nord|se|au|nz)$/.test(g)) return false; return hw === 'trunk' || hw === 'primary' || (g === 'kr' && hw === 'secondary'); }
function rwRules(cc) { const g = RW_RGC[cc] || '', o = Object.assign({}, RW_RGD, RW_RG[g] || {}); o.lw = Object.assign({}, RW_RGD.lw, (RW_RG[g] || {}).lw || {}); o.g = g; o.cc = cc; return o; }
// (the rules of the course being laid or packed, for the lanes' widths where the map has none: see rwLanesOf)
let RW_CUR = rwRules('');
function rwUseRules(C) { RW_CUR = rwRules(rwCountryOf(C)); return RW_CUR; }
// a speed limit as the map has it (km/h; null where it says nothing a number can be had from)
function rwSpeedOf(v) { if (!v) return null; const s = String(v).toLowerCase(), n = parseFloat(s); if (n > 0) return /mph/.test(s) ? n * 1.609 : n;
  if (s === 'none') return 130; if (s === 'walk') return 7; if (/living_street/.test(s)) return 20; if (/urban|zone|city/.test(s)) return 50; if (/motorway/.test(s)) return 120; if (/trunk/.test(s)) return 100; if (/rural/.test(s)) return 85; return null; }
// a way's lanes as the map tags them: one-way (1 along the way, -1 against it, 0 both ways), how many, how many each way
// (f along the way, b against it; null where the map does not say and they are worked out: see rwLanesPass) and in the
// middle for turning either way (c); whether its lines are painted (mk), what its middle line is (div), where passing
// is allowed (ovF, ovB: 1 allowed, 0 not, null as sight allows), its lanes' widths across (wl, left to right as the way runs)
function rwLaneTags(t) {
  const hw = (t.highway || 'road').replace('_link', ''), num = v => { const x = parseInt(v, 10); return x >= 0 && x < 13 ? x : null; };
  const o = t.oneway, one = o === 'yes' || o === 'true' || o === '1' ? 1 : o === '-1' || o === 'reverse' ? -1 : o === 'no' ? 0 : hw === 'motorway' || t.junction === 'roundabout' || t.junction === 'circular' ? 1 : 0;
  const L0 = rwLanesOf(t, false); let n = num(t.lanes), f = num(t['lanes:forward']), b = num(t['lanes:backward']), c = num(t['lanes:both_ways']) || (t.centre_turn_lane === 'yes' || t.center_turn_lane === 'yes' ? 1 : 0);
  const ov = v => v === 'no' ? 0 : v === 'yes' ? 1 : null, ovA = t.overtaking, ovF = ov(t['overtaking:forward']) ?? (ovA === 'no' || ovA === 'backward' ? 0 : ovA === 'yes' || ovA === 'forward' || ovA === 'both' ? 1 : null), ovB = ov(t['overtaking:backward']) ?? (ovA === 'no' || ovA === 'forward' ? 0 : ovA === 'yes' || ovA === 'backward' || ovA === 'both' ? 1 : null);
  const wl = String(t['width:lanes'] || '').split('|').map(v => parseFloat(v.replace(',', '.'))).filter(v => v > 1.5 && v < 7);
  const base = { one, mk: t.lane_markings !== 'no', div: t.divider || null, ovF, ovB, wl: wl.length >= 2 ? wl : null, hw };
  if (one) { if (n == null) n = L0.n; return Object.assign(base, { n, f: n, b: 0, c: 0 }); }
  if (n == null && f != null && b != null) n = f + b + c; if (n == null) n = L0.n; if (rwOneLaneMain(t, 0, n) && f == null && b == null) n = 2;
  if (f != null && b == null) b = Math.max(0, n - f - c); else if (b != null && f == null) f = Math.max(0, n - b - c);
  return Object.assign(base, { n, f, b, c });
}
// which way the course runs along each of its route's segments against its way's own order (1 the way's direction, -1
// against it): the way's segment nearest the route segment's middle, the two directions compared
function rwWayDirs(C) {
  if (C._wd) return C._wd; const R = C.r, nS = R.x.length - 1, out = new Int8Array(Math.max(1, nS));
  for (let v = 0; v < nS; v++) { const W = C.ways[R.w[v]], ex = R.x[v + 1] - R.x[v], ez = R.z[v + 1] - R.z[v]; if (!W || W.x.length < 2 || ex * ex + ez * ez < 1e-6) { out[v] = v ? out[v - 1] : 1; continue; }
    const mx = (R.x[v] + R.x[v + 1]) / 2, mz = (R.z[v] + R.z[v + 1]) / 2; let best = 1e18, sg = 1;
    for (let k = 0; k + 1 < W.x.length; k++) { const ax = W.x[k], az = W.z[k], wx = W.x[k + 1] - ax, wz = W.z[k + 1] - az, L2 = wx * wx + wz * wz || 1e-9, u = clamp(((mx - ax) * wx + (mz - az) * wz) / L2, 0, 1), d = (mx - ax - wx * u) ** 2 + (mz - az - wz * u) ** 2;
      if (d < best) { best = d; sg = wx * ex + wz * ez >= 0 ? 1 : -1; } }
    out[v] = sg; }
  return C._wd = out;
}
// The minimum passing sight distance by speed (MUTCD 2009 table 3B-1: 25 mph 450 ft to 70 mph 1,200 ft), m from km/h
function rwPsd(v) { const T = [[25, 450], [30, 500], [35, 550], [40, 600], [45, 700], [50, 800], [55, 900], [60, 1000], [65, 1100], [70, 1200]], mph = v / 1.609;
  if (mph <= 25) return 450 * 0.3048; for (let k = 1; k < T.length; k++) if (mph <= T[k][0]) { const a = T[k - 1], b = T[k], f = (mph - a[0]) / (b[0] - a[0]); return (a[1] + (b[1] - a[1]) * f) * 0.3048; } return 1200 * 0.3048; }
// The lanes along the course, once its heights are known (layStage). Every canonical point gets:
//   rlF, rlB, rlC: its lanes the course's way, the other way and in the middle for turning; rlOne: 1 a one-way road the
//     course runs with, -1 one it runs against (a closed road), 0 two-way;
//   rlW: the carriageway as painted (m, within the road as laid); rlA: a lane's width there;
//   rlCen: its middle line, 0 none, else (our side's pattern) | (the other side's) << 2 | double << 4, each pattern 1
//     broken, 2 the warning line, 3 solid - or rlCen 64 for Japan's white solid line;
//   rlNo: no lines at all (the map says so); rlSpd: the speed it was built for (km/h)
// A way tagged with its lanes each way has them; one with an odd number of lanes and no more said has its extra lane
// uphill where it climbs 3.5 % or more over its stretch of the course (a climbing lane: two up, one down), else - on the
// flat - a turn lane in its middle in a North American town, else the extra lane along the way. Where passing is
// allowed is the map's where it says (overtaking, divider), else as sight allows: the course's own line of sight each way,
// an eye and an object 1.07 m over the road (MUTCD's 3.5 ft) - over its crests, and across the insides of its bends as
// far as the land (the elevation model) and what grows or stands beside the road (by the land's kind) leave clear -
// against the passing sight distance for its speed: solid where sight is under a third of it, else (a winding road) the
// country's line for limited sight where it has one, solid where not; in a European town broken but where sight is
// that short. Passing stretches shorter than 120 m dropped, no-passing ones lengthened to 150 m (MUTCD's 400 ft and
// 500 ft); a warning line before each solid one where the country paints one (60 m out of town, 30 m in it). The side
// with two lanes of a three-lane road never crosses its middle line; its single lane may only where the country allows
// it (America); two or more lanes each way have the country's line for that (multi); in a tunnel neither way passes.
function rwLanesPass(K) {
  const C = K.pack, P = K.pts, n = K.cN, R = C.r, Rg = rwUseRules(C), dirs = rwWayDirs(C), loop = C.kind === 'loop';
  const wayIx = i => R.w[Math.min(R.w.length - 1, Math.max(0, P[i].rwv | 0))], tagsOf = i => ((C.ways[wayIx(i)] || {}).t) || {}, dirOf = i => dirs[Math.min(dirs.length - 1, Math.max(0, P[i].rwv | 0))] || 1;
  const LT = new Map(), lt = k => { let o = LT.get(k); if (!o) LT.set(k, o = rwLaneTags((C.ways[k] || {}).t || {})); return o; };
  // (each stretch of the course on one way, and its grade along the course)
  const run = new Int32Array(n).fill(-1), runs = []; for (let i = 0; i < n;) { let j = i; const k = wayIx(i); while (j + 1 < n && wayIx(j + 1) === k && !P[j + 1].rwturn) j++; const L = Math.max(STEP, (j - i) * STEP); runs.push({ k, a: i, b: j, g: (P[j].y - P[i].y) / L }); for (let q = i; q <= j; q++) run[q] = runs.length - 1; i = j + 1; }
  const F = new Int8Array(n), B = new Int8Array(n), Cc = new Int8Array(n), One = new Int8Array(n), Spd = new Float32Array(n), No = new Uint8Array(n), Ov = new Int8Array(n * 2).fill(-1), Div = new Array(n).fill(null);
  for (let i = 0; i < n; i++) { const p = P[i], T = lt(wayIx(i)), d = dirOf(i), r = runs[run[i]]; let f = T.f, b = T.b, c = T.c;
    if (p.rwturn) { F[i] = 1; B[i] = 1; No[i] = 1; continue; } // (the turning place: no lines)
    if (!T.one && (f == null || b == null)) { const nn = T.n - c;
      if (nn <= 1) { f = b = 0; } // (one lane both ways: a single-track road)
      else if (nn % 2 === 0) { f = b = nn / 2; }
      else { const up = r.g * d; // (the way's own direction uphill: up > 0)
        if (Math.abs(r.g) >= 0.035) { f = up > 0 ? (nn + 1) / 2 : (nn - 1) / 2; b = nn - f; }
        else if (Rg.twl && p.set === 'village') { c += 1; f = b = (nn - 1) / 2; }
        else { f = (nn + 1) / 2; b = nn - f; } } }
    if (T.one) { const w = T.one * d; One[i] = w; F[i] = w > 0 ? T.n : 0; B[i] = w > 0 ? 0 : T.n; Cc[i] = 0; }
    else { F[i] = d > 0 ? f : b; B[i] = d > 0 ? b : f; Cc[i] = c; }
    No[i] = T.mk ? 0 : 1; Div[i] = T.div;
    if (!T.one) { const oF = d > 0 ? T.ovF : T.ovB, oB = d > 0 ? T.ovB : T.ovF; Ov[i * 2] = oF == null ? -1 : oF; Ov[i * 2 + 1] = oB == null ? -1 : oB; }
    const ms = rwSpeedOf((C.ways[wayIx(i)] || { t: {} }).t.maxspeed); Spd[i] = ms || (p.set === 'village' ? (T.hw === 'residential' || T.hw === 'living_street' ? 30 : 50) : ({ motorway: 120, trunk: 100, primary: 90, secondary: 80, tertiary: 70, unclassified: 60, residential: 40, road: 60 }[T.hw] || 40)); }
  // (the speed it is driven at: its limit, or less where its bends are tighter than that allows - 3 m/s2 across, the
  // curvature the mean over 25 m either side - as the speed passing is judged by)
  { const kk = new Float64Array(n); for (let i = 1; i + 1 < n; i++) kk[i] = Math.abs(wrapAngle(P[i + 1].h - P[i - 1].h)) / (2 * STEP);
    for (let i = 0; i < n; i++) { let sm = 0, c = 0; for (let k = Math.max(1, i - 12); k <= Math.min(n - 2, i + 12); k++) { sm += kk[k]; c++; } const R = c ? 1 / Math.max(1e-4, sm / c) : 1e4; Spd[i] = Math.min(Spd[i], Math.max(25, 3.6 * Math.sqrt(3 * R))); } }
  // (sight distance each way: every second point, along the course's own line)
  const N2 = Math.ceil(n / 2), SD = [new Float32Array(N2), new Float32Array(N2)], h = 1.07, cum = new Float64Array(n);
  for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
  const clearOf = p => ({ open: 14, farm: 10, vineyard: 6, mountain: 3, forest: 2, village: 1.5 }[p.set] ?? 4);
  const twoLane = i => !One[i] && F[i] >= 1 && B[i] >= 1 && !P[i].rwturn;
  for (let q = 0; q < N2; q++) { const i = q * 2; for (let e = 0; e < 2; e++) { const dir = e ? -1 : 1; if (!twoLane(i)) { SD[e][q] = 0; continue; }
      const need = Math.min(420, rwPsd(Spd[i]) + 20), A = P[i]; let smax = -1e9, sd = 0;
      for (let j = i + 2 * dir, steps = 0; ; j += 2 * dir, steps++) {
        if (j < 0 || j >= n) { if (!loop) { sd = Math.max(sd, need); break; } }
        const jj = ((j % (n - 1)) + (n - 1)) % (n - 1), Bp = P[loop ? jj : j]; if (!Bp) { sd = Math.max(sd, need); break; }
        const dj = Math.abs(loop ? steps * 2 * STEP + 2 * STEP : cum[j] - cum[i]); if (dj > need) { sd = need; break; }
        // over its crests: the line from the eye to the object's top over every point between
        const gj = (Bp.y - A.y) / dj; if (gj < smax) { sd = dj; break; }
        // across the insides of its bends: the furthest the line of sight passes from the road's own line between
        let em = 0, km = -1, tm = 0; const vx = Bp.x - A.x, vz = Bp.z - A.z, L = Math.hypot(vx, vz) || 1;
        for (let k = i + 2 * dir; k !== j; k += 2 * dir) { const kk = loop ? ((k % (n - 1)) + (n - 1)) % (n - 1) : k, Q = P[kk]; if (!Q) break; const t = ((Q.x - A.x) * vx + (Q.z - A.z) * vz) / (L * L), ex = Math.abs((Q.x - A.x) * vz - (Q.z - A.z) * vx) / L; if (ex > em) { em = ex; km = kk; tm = t; } }
        if (km >= 0) { const Q = P[km]; if (em > Q.w / 2 + clearOf(Q)) { sd = dj; break; }
          if (em > Q.w / 2 + 0.75) { const fx = A.x + vx * tm, fz = A.z + vz * tm, ly = rwNat(C, fx, fz), sy = A.y + h + (Bp.y - A.y) * tm; if (ly > sy) { sd = dj; break; } } }
        const kj = ((Bp.y - A.y - h) / dj); if (kj > smax) smax = kj; sd = dj; }
      SD[e][q] = sd; } }
  // (no passing each way: 2 not at all - short of sight to a third of the distance passing needs, or more in a country
  // without a line for limited sight; in a tunnel; the side with more lanes; as the map says - or 1 sight limited, where
  // the country has its line for that (France's dissuasion line, Britain's hazard warning line); passing stretches under
  // 120 m dropped, no-passing ones lengthened to 150 m, as the course runs that way. In a European town the broken line
  // stays but where sight is shorter than that third)
  const NP = [new Uint8Array(n), new Uint8Array(n)], soft = !!Rg.soft, euTown = Rg.g !== 'us' && Rg.g !== 'latam' && Rg.g !== 'kr' && Rg.g !== 'cn' && Rg.g !== 'tw';
  for (let i = 0; i < n; i++) { if (!twoLane(i)) continue; const q = Math.min(N2 - 1, i >> 1), psd = rwPsd(Spd[i]), town = P[i].set === 'village';
    for (let e = 0; e < 2; e++) { const mine = e ? B[i] : F[i], other = e ? F[i] : B[i], ov = Ov[i * 2 + e], sd = SD[e][q];
      let np = sd >= psd ? 0 : sd < psd * 0.35 ? 2 : town && euTown ? 0 : soft ? 1 : 2;
      if (P[i].rwtu || (Rg.tun && P[i].tag === 'bridge')) np = 2; if (mine > other) np = 2; if (mine < other && Rg.g !== 'us') np = 2; if (mine >= 2 && other >= 2) np = 2;
      if (ov === 0) np = 2; else if (ov === 1 && mine <= other) np = 0;
      const dv = Div[i]; if (dv === 'solid_line' || dv === 'double_solid_line') np = 2; else if (dv === 'dashed_line') np = 0;
      NP[e][i] = np; } }
  for (let e = 0; e < 2; e++) { const A = NP[e], s = e ? -1 : 1, ord = s > 0 ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
    // (a no-passing stretch at least 150 m long, as the course runs that way)
    for (let q = 0; q < ord.length; q++) { const i = ord[q]; if (!A[i] || (q > 0 && A[ord[q - 1]])) continue; let r = q; while (r + 1 < ord.length && A[ord[r + 1]]) r++; const L = Math.abs(cum[ord[r]] - cum[i]); if (L < 150) for (let z = r + 1; z < ord.length && Math.abs(cum[ord[z]] - cum[i]) < 150; z++) if (twoLane(ord[z]) && !A[ord[z]]) A[ord[z]] = A[ord[r]]; q = r; }
    // (a passing stretch under 120 m: no passing, as the stretch before it)
    for (let q = 0; q < ord.length; q++) { const i = ord[q]; if (A[i] || !twoLane(i)) continue; let r = q; while (r + 1 < ord.length && !A[ord[r + 1]] && twoLane(ord[r + 1])) r++; if (Math.abs(cum[ord[r]] - cum[i]) < 120) { const v = Math.max(q > 0 ? A[ord[q - 1]] : 0, r + 1 < ord.length ? A[ord[r + 1]] : 0) || 2; for (let z = q; z <= r; z++) A[ord[z]] = v; } q = r; } }
  // (the middle line: each side's pattern - 1 broken, 2 the warning line, 3 solid - and whether it is doubled; the warning
  // line before each stretch where crossing is not allowed at all, as the course runs either way)
  for (let i = 0; i < n; i++) { const p = P[i]; Object.assign(p, { rlF: F[i], rlB: B[i], rlC: Cc[i], rlOne: One[i], rlNo: No[i], rlSpd: Spd[i], rlCen: 0 }); }
  const Lw = Rg.warn ? i => P[i].set === 'village' ? 30 : 60 : null;
  for (let i = 0; i < n; i++) { const p = P[i]; if (!twoLane(i) || No[i] || Div[i] === 'no') continue; const a = NP[0][i] + 1, b = NP[1][i] + 1;
    let our = a, oth = b, dbl = 0;
    if (a === 3 && b === 3) { const multi = F[i] >= 2 && B[i] >= 2; dbl = (multi ? Rg.multi : Rg.both) === 'd' || Div[i] === 'double_solid_line' ? 1 : 0; }
    else if ((a === 3 && b === 2) || (a === 2 && b === 3)) { our = oth = 2; } // (a winding road: the line for limited sight both ways, the solid one kept for where neither way sees)
    else if (a === 3 || b === 3) dbl = 1; else if (Rg.warn) { our = oth = Math.max(a, b); } else { our = oth = 1; }
    p.rlCen = our | oth << 2 | dbl << 4; }
  if (Lw) for (const e of [0, 1]) { const s = e ? -1 : 1; for (let i = 0; i < n; i++) { const j = i + s; if (j < 0 || j >= n || NP[e][i] === 2 || NP[e][j] !== 2) continue; // (a stretch with no crossing at all begins at j, as the course runs that way)
      for (let k = i; k >= 0 && k < n && Math.abs(cum[k] - cum[j]) < Lw(i); k -= s) { const p = P[k]; if ((p.rlCen & 15) === 5) p.rlCen = 2 | 2 << 2; else break; } } }
  // Japan: a white solid middle line where the lanes are 3 m or more, else broken; yellow (npc) where no passing
  if (Rg.jp) for (let i = 0; i < n; i++) { const p = P[i]; if ((p.rlCen & 15) === 5 && Math.min(p.rwlw || p.w, p.w) >= 6) p.rlCen = 64; }
  K.rlRules = Rg; return Rg;
}
// The painted carriageway and its lines at a point: in "u", metres across from the course's own right edge in a
// right-hand country (from its left edge in a left-hand one), the course's lanes from there, then the middle's, then the
// other way's. The side with fewer lanes keeps a lane of its class's width; the other takes the rest (so a lane added
// for a climb tapers in as the road widens).
function rwLaneLayout(p, Rg) {
  const W = Math.max(2, Math.min(p.rwlw || p.w, p.w)), F = p.rlF | 0, B = p.rlB | 0, Cn = p.rlC | 0, one = p.rlOne | 0, nT = Math.max(1, F + B + Cn), a0 = Rg.lw[p.rwhw] || 3, a = Math.min(a0, W / nT);
  if (one) { const nl = F + B; return { W, one, n: nl, a: W / Math.max(1, nl) }; }
  let WF, WC = Cn * a, WB; if (F === B) { WF = WB = (W - WC) / 2; } else if (F < B) { WF = F * a; WB = W - WF - WC; } else { WB = B * a; WF = W - WB - WC; }
  return { W, one: 0, WF, WC, WB, a };
}
// The lines, as the country paints them, laid on the road's drawn surface: their own white and yellow mesh, every dash
// its own length wherever it falls between the road's rows. rows: the road's 1 m rows (buildStage)
function rwPaint(T, P, LN, add, rows, G) {
  const Rg = rwRules(rwCountryOf(T.real)), N = P.length, sgnS = Rg.side === 'L' ? -1 : 1, wl = Rg.wl, gp = Rg.gap;
  const main = p => p.rwhw === 'motorway' || p.rwhw === 'trunk' || p.rwhw === 'primary';
  const lineOK = i => { const p = P[i]; return p && (p.surf === 'tarmac' || p.surf === 'concrete') && !p.rlNo && p.tag !== 'ring' && p.tag !== 'rbt' && p.tag !== 'square' && p.tag !== 'chicane' && !p.rwturn && Math.abs(i - T.startIdx) > 2 && Math.abs(i - T.finishIdx) > 2; };
  // (the spurs' mouths: the edge line on their side broken across them, 4 m either side)
  const mouth = [new Uint8Array(N), new Uint8Array(N)]; for (const sp of T.spurs || []) { if (sp.a == null) continue; const m = Math.ceil(((sp.pts[0] && sp.pts[0].w) || 5) / 2 / STEP) + 2; for (let k = Math.max(0, sp.a - m); k <= Math.min(N - 1, sp.a + m); k++) mouth[sp.s > 0 ? 0 : 1][k] = 1; }
  // each line as a key: per point its place across (lat, or NaN), pattern and colour
  const L = new Map(), put = (key, i, lat, pat, col, w, ph) => { let o = L.get(key); if (!o) L.set(key, o = { lat: new Float32Array(N).fill(NaN), pat: new Array(N), col: new Uint8Array(N), w: new Float32Array(N), ph: ph || 0 }); o.lat[i] = lat; o.pat[i] = pat; o.col[i] = col; o.w[i] = w; };
  const toLat = (u, W) => sgnS * (u - W / 2), Y = c => c === 'Y' ? 1 : 0;
  for (let i = 0; i < N; i++) { const p = P[i]; if (!lineOK(i)) continue; const Lo = rwLaneLayout(p, Rg), W = Lo.W, town = p.set === 'village', mw = p.rwhw === 'motorway' || (p.rwhw === 'trunk' && Lo.one);
    const dash = town ? Rg.dT : Rg.dR, ln = Rg.tun && (p.rwtu || p.tag === 'bridge') ? 's' : mw ? Rg.dM : town ? Rg.dT : Rg.dL;
    // the middle line
    if (!Lo.one && p.rlCen && W >= Rg.minC) { const c = p.rlCen, uC = Lo.WF, lat0 = toLat(uC, W), cc = Y(Rg.cen), nc = Rg.npc ? Y(Rg.npc) : cc, pat = k => k === 3 ? 's' : k === 2 ? Rg.warn : dash;
      if (c === 64) put('c0', i, lat0, 's', 0, wl);
      else { const ours = c & 3, oth = c >> 2 & 3, dbl = c >> 4 & 1, d = (gp + wl) / 2;
        if (Rg.jp) { // (Japan: yellow solid on a side that may not pass; white broken else)
          if (!dbl) put('c0', i, lat0, ours === 3 ? 's' : pat(ours), ours === 3 ? nc : cc, wl);
          else { put('c0', i, lat0 - sgnS * d, pat(ours), ours === 3 ? nc : cc, wl); put('c1', i, lat0 + sgnS * d, pat(oth), oth === 3 ? nc : cc, wl); } }
        else if (Rg.npc) { // (New Zealand: the white centre line broken, a yellow no-passing line beside it on each side that may not pass)
          put('c0', i, lat0, dash, cc, wl); if (ours === 3) put('cY0', i, lat0 - sgnS * (wl + gp), 's', nc, wl); if (oth === 3) put('cY1', i, lat0 + sgnS * (wl + gp), 's', nc, wl); }
        else if (!dbl) put('c0', i, lat0, pat(ours), cc, wl);
        else { put('c0', i, lat0 - sgnS * d, pat(ours), cc, wl); put('c1', i, lat0 + sgnS * d, pat(oth), cc, wl); } }
      // (a turn lane in the middle: either side of it a solid line outside, a broken one inside, yellow or white as the centre)
      if (p.rlC > 0) { const u1 = Lo.WF + Lo.WC, l1 = toLat(u1, W), d = (gp + wl) / 2; put('t0', i, lat0 - sgnS * d, 's', cc, wl); put('t1', i, lat0 + sgnS * d, dash, cc, wl); put('t2', i, l1 - sgnS * d, dash, cc, wl); put('t3', i, l1 + sgnS * d, 's', cc, wl); } }
    // the lane lines: between each direction's lanes (a one-way road's all across it)
    if (Lo.one) { for (let k = 1; k < Lo.n; k++) put('L' + k, i, toLat(k * Lo.a, W), ln, 0, wl, Rg.stag && !mw && Lo.n >= 3 && k % 2 ? 0.5 : 0); }
    else { const side = (cnt, from, to, key) => { if (cnt < 2) return; const span = to - from, a = span >= cnt * Lo.a ? Lo.a : span / cnt;
        for (let k = 1; k < cnt; k++) { const u = from + (span - k * a); if (u - from < 1.8) continue; put(key + k, i, toLat(u, W), ln, 0, wl, Rg.stag && !mw && cnt >= 3 && k % 2 ? 0.5 : 0); } };
      side(p.rlF, 0, Lo.WF, 'F'); { const cnt = p.rlB; if (cnt >= 2) { const from = Lo.WF + Lo.WC, span = W - from, a = span >= cnt * Lo.a ? Lo.a : span / cnt; for (let k = 1; k < cnt; k++) { const u = from + k * a; if (W - u < 1.8) continue; put('B' + k, i, toLat(u, W), ln, 0, wl, Rg.stag && !mw && cnt >= 3 && k % 2 ? 0.5 : 0); } } } }
    // the edge lines: on the bigger roads, and on the smaller where the country paints them and the road is wide enough
    const edges = main(p) || (p.rwhw === 'secondary' && W >= 5.5) || (LN && LN.edge && W >= 5.5 && /^(tertiary|unclassified)$/.test(p.rwhw));
    if (edges && W >= 4.4) { const sh = p.w - W > 0.6, inset = sh ? 0 : 0.2, ew = mw ? Math.max(wl, 0.2) : wl;
      for (const sd of [-1, 1]) { if (mouth[sd > 0 ? 0 : 1][i]) continue; const lat = sd * (W / 2 - inset - ew / 2);
        // (which edge is which: on a one-way road the left one as its traffic drives it is the median's)
        const leftOfTraffic = Lo.one ? (Lo.one > 0 ? sd > 0 : sd < 0) : false, med = Lo.one && (sgnS > 0 ? leftOfTraffic : !leftOfTraffic);
        put(sd > 0 ? 'EL' : 'ER', i, lat, med || p.rwtu ? 's' : mw ? Rg.eM : Rg.eR, Y(med ? Rg.med : Rg.edg), ew); } } } // (in a tunnel, solid)
  // (the middle line moved smoothly where the lanes change: over 25 points either side of a change of its place)
  for (const key of ['c0', 'c1', 'cY0', 'cY1', 't0', 't1', 't2', 't3']) { const o = L.get(key); if (!o) continue; const src = o.lat.slice();
    for (let i = 0; i < N; i++) { if (!(src[i] === src[i])) continue; let s = 0, c = 0; for (let k = Math.max(0, i - 25); k <= Math.min(N - 1, i + 25); k++) if (src[k] === src[k]) { s += src[k]; c++; } o.lat[i] = s / c; } }
  // each line's painted stretches, then laid: a dash pattern begins with a full dash where its stretch begins
  const pos = [], col = [], idx = [], cw = new THREE.Color(0xe8e8e2), cy = new THREE.Color(0xe3ae35), WH = [cw.r, cw.g, cw.b], YE = [cy.r, cy.g, cy.b], rowsN = rows.length;
  const rowAt = s => { const f = clamp(s, 0, rowsN - 1.0001), k = Math.floor(f), t = f - k, A = rows[k], B2 = rows[k + 1]; let lx = A.lx + (B2.lx - A.lx) * t, lz = A.lz + (B2.lz - A.lz) * t; const l = Math.hypot(lx, lz) || 1; return { x: A.x + (B2.x - A.x) * t, z: A.z + (B2.z - A.z) * t, lx: lx / l, lz: lz / l, w: A.w + (B2.w - A.w) * t }; };
  const latAt = (o, s) => { const f = clamp(s / STEP, 0, N - 1.0001), i = Math.floor(f), t = f - i, a = o.lat[i], b = o.lat[i + 1]; return a === a ? (b === b ? a + (b - a) * t : a) : b; };
  const lay = (o, s0, s1, ci, w) => { if (s1 - s0 < 0.05) return; const C3 = ci ? YE : WH; let prev = -1; const ss = [s0]; for (let s = Math.ceil(s0 + 0.05); s < s1 - 0.05; s += 1) ss.push(s); ss.push(s1);
    for (const s of ss) { const r = rowAt(s), lat = latAt(o, s); if (!(lat === lat)) { prev = -1; continue; } const v = pos.length / 3;
      for (const dl of [-w / 2, w / 2]) { const l = lat + dl; pos.push(r.x + r.lx * l, roadSurfY(T, s, clamp(l, -r.w / 2, r.w / 2), r.w, true) + 0.014, r.z + r.lz * l); col.push(C3[0], C3[1], C3[2]); }
      if (prev >= 0) idx.push(prev, v, prev + 1, prev + 1, v, v + 1); prev = v; } };
  for (const o of L.values()) { let i = 0;
    while (i < N) { if (!(o.lat[i] === o.lat[i])) { i++; continue; } let j = i; const pat = o.pat[i], ci = o.col[i], w = o.w[i]; while (j + 1 < N && o.lat[j + 1] === o.lat[j + 1] && o.pat[j + 1] === pat && o.col[j + 1] === ci) j++;
      const s0 = Math.max(0, (i - 0.5) * STEP), s1 = Math.min((N - 1) * STEP, (j + 0.5) * STEP);
      if (pat === 's' || !pat) lay(o, s0, s1, ci, w); else { const per = pat[0] + pat[1]; for (let s = s0 + o.ph * per; s < s1; s += per) lay(o, Math.max(s0, s), Math.min(s1, s + pat[0]), ci, w); }
      i = j + 1; } }
  if (!idx.length) return 0;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, k) => k % 3 === 1 ? 1 : 0), 3)); g.setIndex(idx); g.computeBoundingSphere();
  const lm = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, specular: 0x000000, shininess: 8, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); lm.onBeforeCompile = roadLampShader;
  const m = new THREE.Mesh(g, lm); m.receiveShadow = true; m.userData.rw = 'lines'; G.add(m); return idx.length / 3;
}
// The map's other roads, each a ribbon laid over the land (rwSurfaces): every few metres a cross-section of three points -
// its two edges and its middle, each as high as the highest of the land under it there and half way to the next ones,
// and raised further where the land half way out stands over the line between them (so the land, laid coarser, cannot
// stand up through it) - and, where an edge stands clear of the land, a skirt turned
// down under it (so no gap opens under its edge where the land falls away). Its lines too where it is sealed and big
// enough to have them (mk: the country's rules and the lines' lists): the middle line of a two-way road of its class,
// broken (solid, doubled as the country does it, with two lanes or more each way), and the lines between a one-way
// road's lanes. gY: the land as drawn
function rwNetRibbon(gY, L, w, lift, skip, step, mk) {
  const X = L.x, Z = L.z, pos = [], idx = [], hw = w / 2, st = []; let s = 0;
  for (let k = 0; k + 1 < X.length; k++) { const dx = X[k + 1] - X[k], dz = Z[k + 1] - Z[k], Ls = Math.hypot(dx, dz); if (Ls < 1e-6) continue; const h = Math.atan2(dx, dz), m = Math.max(1, Math.ceil(Ls / step));
    for (let q = 0; q < m; q++) { const f = q / m; st.push({ x: X[k] + dx * f, z: Z[k] + dz * f, h, s: s + Ls * f }); } s += Ls; }
  if (X.length > 1) { const k = X.length - 1; st.push({ x: X[k], z: Z[k], h: Math.atan2(X[k] - X[k - 1], Z[k] - Z[k - 1]), s }); }
  if (st.length < 2) return { pos, idx };
  const samp = (x, z, lx, lz) => [gY(x - lx * hw, z - lz * hw), gY(x - lx * hw / 2, z - lz * hw / 2), gY(x, z), gY(x + lx * hw / 2, z + lz * hw / 2), gY(x + lx * hw, z + lz * hw)];
  for (const p of st) { p.lx = Math.cos(p.h); p.lz = -Math.sin(p.h); p.keep = !skip(p.x, p.z); }
  const G0 = st.map(p => p.keep ? samp(p.x, p.z, p.lx, p.lz) : null), GM = st.map((p, i) => i + 1 < st.length && p.keep && st[i + 1].keep ? samp((p.x + st[i + 1].x) / 2, (p.z + st[i + 1].z) / 2, p.lx, p.lz) : null);
  for (let i = 0; i < st.length; i++) { const p = st[i]; if (!p.keep) continue; const mx = j => Math.max(G0[i][j], GM[i] ? GM[i][j] : -1e9, i > 0 && GM[i - 1] ? GM[i - 1][j] : -1e9);
    p.gR = G0[i][0]; p.gL = G0[i][4]; p.hR = mx(0) + lift; p.hC = mx(2) + lift; p.hL = mx(4) + lift;
    // (the land half way out from the middle under the line between the middle and the edge: both raised to clear it)
    for (const [q, e] of [[1, 'hR'], [3, 'hL']]) { const d = mx(q) + lift - (p.hC + p[e]) / 2; if (d > 0) { p.hC += d; p[e] += d; } } }
  let prev = -1, pp = null;
  for (const p of st) { if (!p.keep) { prev = -1; pp = null; continue; } const v = pos.length / 3, sk = hw + 0.3;
    pos.push(p.x - p.lx * sk, Math.min(p.hR, p.gR) - 0.3, p.z - p.lz * sk, p.x - p.lx * hw, p.hR, p.z - p.lz * hw, p.x, p.hC, p.z, p.x + p.lx * hw, p.hL, p.z + p.lz * hw, p.x + p.lx * sk, Math.min(p.hL, p.gL) - 0.3, p.z + p.lz * sk);
    if (prev >= 0) { for (let c = 1; c < 3; c++) idx.push(prev + c, v + c, prev + c + 1, prev + c + 1, v + c, v + c + 1);
      if (p.hR - p.gR > 0.12 || pp.hR - pp.gR > 0.12) idx.push(prev, v, prev + 1, prev + 1, v, v + 1); // (a skirt only where an edge stands clear of the land)
      if (p.hL - p.gL > 0.12 || pp.hL - pp.gL > 0.12) idx.push(prev + 3, v + 3, prev + 4, prev + 4, v + 3, v + 4); }
    prev = v; pp = p; }
  if (mk && !L.foot && L.s === 'tarmac' && L.one != null) rwNetLines(st, L, w, mk);
  return { pos, idx };
}
function rwNetLines(st, L, w, mk) {
  const Rg = mk.Rg, hw0 = String(L.hw || '').replace('_link', ''), n = L.ln | 0, two = !L.one, main = /^(motorway|trunk|primary|secondary|tertiary)$/.test(hw0), town = /^(residential|living_street|unclassified)$/.test(hw0) || mk.town(st[0].x, st[0].z);
  const lines = []; // [lat, pattern, colour]
  if (two && main && w >= Rg.minC && n !== 1) { const multi = n >= 4, d = (Rg.gap + Rg.wl) / 2, cc = Rg.cen === 'Y' ? 1 : 0;
    if (multi) { if (Rg.multi === 'd') lines.push([-d, 's', cc], [d, 's', cc]); else lines.push([0, 's', cc]); const a = w / n;
      for (let k = 1; k < n / 2; k++) { lines.push([-w / 2 + k * a, town ? Rg.dT : Rg.dL, 0], [w / 2 - k * a, town ? Rg.dT : Rg.dL, 0]); } }
    else lines.push([0, Rg.jp && w >= 6 ? 's' : town ? Rg.dT : Rg.dR, cc]); }
  else if (!two && n >= 2) { const a = w / n, mw = hw0 === 'motorway'; for (let k = 1; k < n; k++) lines.push([-w / 2 + k * a, mw ? Rg.dM : town ? Rg.dT : Rg.dL, 0]); }
  if (!lines.length) return;
  const at = s => { let k = 0, lo = 0, hi = st.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (st[m].s <= s) lo = m; else hi = m; } k = lo; const A = st[k], B = st[Math.min(st.length - 1, k + 1)], t = B.s > A.s ? clamp((s - A.s) / (B.s - A.s), 0, 1) : 0; return { A, B, t }; };
  const O = mk.NL, hw = w / 2;
  const lay = (lat, s0, s1, ci, lw) => { const ss = [s0]; for (let s = Math.ceil(s0 + 0.05); s < s1 - 0.05; s += 1.5) ss.push(s); ss.push(s1); let prev = -1;
    for (const s of ss) { const { A, B, t } = at(s); if (!A.keep || !B.keep || A.hC == null || B.hC == null) { prev = -1; continue; } const x = A.x + (B.x - A.x) * t, z = A.z + (B.z - A.z) * t, lx = A.lx, lz = A.lz;
      const hAt = (P, l) => l <= 0 ? P.hC + (P.hR - P.hC) * (-l / hw) : P.hC + (P.hL - P.hC) * (l / hw), v = O.pos.length / 3, C3 = ci ? mk.cy : mk.cw;
      for (const dl of [-lw / 2, lw / 2]) { const l = clamp(lat + dl, -hw, hw), y = hAt(A, l) + (hAt(B, l) - hAt(A, l)) * t + 0.012; O.pos.push(x + lx * l, y, z + lz * l); O.col.push(C3[0], C3[1], C3[2]); }
      if (prev >= 0) O.idx.push(prev, v, prev + 1, prev + 1, v, v + 1); prev = v; } };
  const S = st[st.length - 1].s;
  for (const [lat, pat, ci] of lines) { if (pat === 's') { lay(lat, 0.5, S - 0.5, ci, Rg.wl); continue; } const per = pat[0] + pat[1]; for (let s = 1; s < S - 0.5; s += per) lay(lat, s, Math.min(S - 0.5, s + pat[0]), ci, Rg.wl); }
}
// (the lane tags a pack keeps of its ways, with round 46's; an older pack brought up to date from the map's tags, by way
// id, and its country - see harness/enrich48.js)
const RW_TAGS48 = ['lanes:forward', 'lanes:backward', 'lanes:both_ways', 'centre_turn_lane', 'overtaking', 'overtaking:forward', 'overtaking:backward', 'lane_markings', 'divider', 'width:lanes', 'width:lanes:forward', 'width:lanes:backward', 'incline', 'dual_carriageway'];
function rwEnrich(K, tags, cc) {
  if (cc) K.cc = cc; rwUseRules(K); const narrow = RW_NARROW.has(rwLookFor(K.o[0], K.o[1], 0, false)); let nw = 0, nn = 0;
  for (const W of K.ways) { const t = tags[W.id]; if (!t) continue; nw++; for (const k of RW_TAGS48) if (t[k] != null) W.t[k] = String(t[k]).slice(0, 60); }
  for (const L of K.net || []) { const t = tags[L.id]; if (!t) continue; nn++; const T = rwLaneTags(t); L.ln = T.n; L.one = T.one; if (!L.foot) L.w = Math.round(rwWidthOf(t, narrow) * 10) / 10; }
  return { ways: nw, net: nn };
}
