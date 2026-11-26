// Offline render of the exhaust's sound for cars and builds; levels in bands, and the spectrum to a file if asked.
// usage: node snd43.js BUILD.html spec.json   (spec: [{ id, label, rpm, thr, patch: {build fields}, net: false }])
const { open } = require('./lib'), fs = require('fs');
(async () => { const file = process.argv[2], spec = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), H = await open(file); await new Promise(r => setTimeout(r, 2500));
  const out = [];
  for (const J of spec) { const r = await H.page.evaluate((J) => {
      Gfx.level = 'high'; const S0 = carById(J.id); let S = S0, tmp = null;
      if (J.patch) { const B = Object.assign({}, cuStockBuild(S0), J.patch); tmp = 'cu_t43' + Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'a'); B.name = 'T43'; const R = cuRegister(tmp, B, true); S = carById(tmp) || R; if (!S || !S.id) return { err: 'no build ' + JSON.stringify(R).slice(0, 200) }; }
      if (typeof ex43Prime === 'function') ex43Prime(S);
      const cfg = engineCfg(S); if (J.net === false) delete cfg.net; const D = EngineDSPDef(), sr = 48000, e = new D(sr, cfg), n = sr * (J.secs || 3), blk = 128;
      const ch = [0, 1, 2, 3, 4].map(() => new Float32Array(blk)), X = new Float32Array(n); e.set({ rpm: J.rpm || 4000, thr: J.thr == null ? 1 : J.thr, load: J.thr == null ? 1 : J.thr, on: 1, spool: J.spool == null ? 1 : J.spool, gear: 3 });
      const t0 = performance.now(); for (let o = 0; o < n; o += blk) { e.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); X.set(ch[0], o); } const ms = performance.now() - t0;
      let bad = 0; for (let i = 0; i < n; i++) if (!isFinite(X[i])) bad++; let e2rms = 0; { const e3 = new D(sr, cfg); e3.set({ rpm: J.rpm || 4000, thr: 1, load: 1, on: 1, spool: 1, gear: 3 }); let z = 0, z2 = 0, acc = 0, cnt = 0; const aa = 1 - Math.exp(-2 * Math.PI * 250 / sr); for (let o = 0; o < sr * 2; o += blk) { e3.process(ch[0], ch[1], ch[2], ch[3], blk, ch[4]); for (let i = 0; i < blk; i++) { z += (ch[2][i] - z) * aa; z2 += (z - z2) * aa; if (o > sr) { acc += z2 * z2; cnt++; } } } e2rms = +(10 * Math.log10(acc / cnt + 1e-20)).toFixed(1); }
      // spectrum of the last 2 s (Hann, 65536-point FFT), then band levels
      const N = 65536, re = new Float64Array(N), im = new Float64Array(N), off = n - N; for (let i = 0; i < N; i++) re[i] = X[off + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
      for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }
      for (let len = 2; len <= N; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < N; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
      const P = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) P[i] = re[i] * re[i] + im[i] * im[i];
      const edges = [30, 60, 120, 200, 420, 1000, 2000, 3000, 4500, 8000], bands = []; for (let b = 0; b + 1 < edges.length; b++) { let s = 0; for (let i = Math.round(edges[b] * N / sr); i < Math.round(edges[b + 1] * N / sr); i++) s += P[i]; bands.push(10 * Math.log10(s / N / N * 8 + 1e-20)); }
      let rms = 0; for (let i = off; i < n; i++) rms += X[i] * X[i]; rms = 10 * Math.log10(rms / N + 1e-20);
      // third-octave-ish smoothed spectrum for a closer look (24 points per decade, 30 Hz to 8 kHz)
      const fine = []; for (let k = 0; k <= 58; k++) { const f0 = 30 * Math.pow(10, (k - 0.5) / 24), f1 = 30 * Math.pow(10, (k + 0.5) / 24); let s = 0, c = 0; for (let i = Math.max(1, Math.round(f0 * N / sr)); i <= Math.round(f1 * N / sr); i++) { s += P[i]; c++; } fine.push(+(10 * Math.log10(s / Math.max(1, c) / N / N * 8 + 1e-20)).toFixed(1)); }
      if (tmp) try { cuUnregister(tmp); } catch (er) {}
      return { rms: +rms.toFixed(2), bands: bands.map(v => +v.toFixed(1)), bad, ms: Math.round(ms), net: cfg.net ? cfg.net.sec.length : 0, e2: e2rms, fine, main: cfg.main, sil: cfg.sil, silMix: cfg.silMix, res: cfg.res, trim0: cfg.trim && cfg.trim[0], flow: cfg.flow, info: cfg.net ? cfg.net.info : null };
    }, J); out.push(Object.assign({ label: J.label || J.id }, r)); }
  const base = out[0]; console.log('bands Hz: 30-60 | 60-120 | 120-200 | 200-420 | 420-1k | 1k-2k | 2k-3k | 3k-4.5k | 4.5k-8k');
  for (const r of out) { if (r.err) { console.log(r.label, r.err); continue; } const ref = process.env.ABS ? null : base; console.log(r.label.padEnd(34), 'rms', (ref ? r.rms - ref.rms : r.rms).toFixed(1).padStart(6), '|', r.bands.map((v, i) => (ref ? v - ref.bands[i] : v).toFixed(1).padStart(6)).join(''), '| sections', r.net, '| shell <250Hz', (ref ? r.e2 - ref.e2 : r.e2).toFixed(1), r.bad ? 'BAD ' + r.bad : '', process.env.INFO && r.info ? JSON.stringify(r.info) : ''); }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out)); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
