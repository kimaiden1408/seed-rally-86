// ==== ROUND 46: REAL ROADS (the course as a stage) ====
// the stage of a course from its pack: the country it is in (for what the map does not say), its road's surface (the
// map's, by length: tarmac, gravel, both, or under snow), laid by layStage's real branch. o.snow: the course in winter
function rwStageOf(K, o) {
  o = o || {}; rwPrep(K); const snow = !!o.snow, look = rwLookFor(K.o[0], K.o[1], (K.alt || 0), snow), gravelC = RW_GRAVEL.has(look);
  const R = K.r; let g = 0, all = 0; for (let k = 0; k + 1 < R.x.length; k++) { if (k < R.a || k > R.b) continue; const L = Math.hypot(R.x[k + 1] - R.x[k], R.z[k + 1] - R.z[k]), W = K.ways[R.w[k]]; all += L; if (W && rwSurfOf(W.t, gravelC, false) === 'gravel') g += L; }
  const sh = all ? g / all : 0, surface = snow ? 'snow' : sh > 0.75 ? 'gravel' : sh > 0.12 ? 'mixed' : 'tarmac';
  const T = generateStage('real-' + K.code, { real: { pack: K, look, surface } }); T.look0 = look; T.rwSnow = snow; T.rwRg = rwRegion(K, look);
  // (by the sea: the game's sea at the sea's own level, lying the way the far heights have it, its sweep of the horizon
  // as wide as theirs: see rwSeaSum)
  const S = K.sea; if (S && S.on && T.land) T.land.sea = { y: -(K.y0 || 0), nx: S.d[0], nz: S.d[1], w: S.w, T: 0, Hc: 1, c0: 0 };
  return T;
}
// the region a real course is in: the game's region whose country it is like (its season, weather and temperatures),
// at the place's own latitude, height and clock (the local standard time, and summer time in the seasons and places
// that keep it, as near as the place's longitude and continent tell)
function rwClockOff(lat, lon, day) {
  const sum = day > 88 && day < 300, N = lat > 0;
  if (N && lat > 34 && lon > -11 && lon < 40) { const std = lon < -5 || (lat > 49.8 && lon < 2 && lon > -11) ? 0 : lon < 19.5 || (lat < 45 && lon < 20) ? 1 : lon < 32 ? 2 : 3; return std + (sum && std < 3 ? 1 : 0); }
  if (N && lon > 122 && lon < 146 && lat > 24) return 9; if (N && lon > -125 && lon < -66 && lat > 24) return Math.round(lon / 15) + (sum ? 1 : 0);
  if (!N && lon > 112 && lon < 155) return lon < 129 ? 8 : (lon < 141 ? 9.5 : 10) + (!sum && lat < -28 ? 1 : 0); if (!N && lon > 165) return sum ? 12 : 13;
  return Math.round(lon / 15);
}
function rwRegion(K, look) { const B = REGIONS[look] || REGIONS.lanes, day = B.day; return Object.assign({}, B, { lat: K.o[0], lon: K.o[1], alt: K.alt || B.alt, tz: rwClockOff(K.o[0], K.o[1], day) - K.o[1] / 15, real: 1, month: B.month }); }
// The stage drawn from its canonical points - each stretch of road once, however often the run drives it - with its
// controls where the course has them (a there-and-back's finish on the way back, a circuit's on its start line); the
// run put back after, for the drive
function rwBuild(T) {
  const run = { pts: T.pts, startIdx: T.startIdx, finishIdx: T.finishIdx, stopIdx: T.stopIdx, radio: T.radio, length: T.length };
  T.pts = run.pts.slice(0, T.cN); Object.assign(T, T.rwView); T.radio = [...new Set((run.radio || []).filter(i => i < T.cN))]; T.rwDrawing = true;
  try { buildStage(T); } finally { T.pts = run.pts; T.startIdx = run.startIdx; T.finishIdx = run.finishIdx; T.stopIdx = run.stopIdx; T.radio = run.radio; T.length = run.length; T.rwDrawing = false; T._barQs = null; }
}
// a control's place on the canonical points, d further on as the run drives there (a there-and-back's finish is met
// coming back, a circuit's round its lap)
function rwCtlAt(T, which, d) { const C = T.rwCtl; if (!C) return (which === 'fin' ? T.finishIdx : T.stopIdx) + d; const v = C[which] + (C.back ? -d : d); if (C.loop) { const M = T.cN - 1; return ((v % M) + M) % M; } return clamp(v, 0, T.cN - 1); }
// a real course made the stage: drawn, its conditions set, the menu's facts and board its own
function rwUseStage(T) { G.T = T; rwBuild(T); G.fly = 0; if (Skids.geo) Skids.clear(); setConditions(); try { renderFacts(); renderBoard(); } catch (e) { } }
