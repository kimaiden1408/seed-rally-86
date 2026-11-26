// The chain of sections checked against the textbook: (1) an expansion chamber between two endless pipes passes
// 1 / (1 + (m - 1/m)^2 sin^2(kL) / 4) of a wave's power (m: the chamber's area over the pipe's); (2) a capped side
// pipe of the main pipe's own area passes 1 / (1 + tan^2(kL) / 4); (3) one plain pipe is the old single tube.
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2000));
  const r = await H.page.evaluate(() => { const D = EngineDSPDef(), PN = D.PipeNet, sr = 48000, c = 500, out = [];
    const resp = (net, fs, n) => { const p = new PN(sr, net), h = new Float64Array(n); h[0] = p.run(1); for (let i = 1; i < n; i++) h[i] = p.run(0); return fs.map(f => { const w = 2 * Math.PI * f / sr; let re = 0, im = 0; for (let i = 0; i < n; i++) { re += h[i] * Math.cos(w * i); im -= h[i] * Math.sin(w * i); } return re * re + im * im; }); };
    const A = 0.0045, fs = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1250];
    for (const [m, L] of [[4, 0.5], [9, 0.3], [2.5, 0.8]]) { const Lq = Math.round(L / c * sr) * c / sr, net = { sec: [[1, A, c, 1, 0, 0], [L, A * m, c, 1, 0, 0], [1, A, c, 1, 0, 0]], rs: 0, ro: 0, fo: 20000, g: 1, sh: 0 }, R = resp(net, fs, 4096);
      let worst = 0; const rows = fs.map((f, i) => { const th = 1 / (1 + 0.25 * Math.pow(m - 1 / m, 2) * Math.pow(Math.sin(2 * Math.PI * f * Lq / c), 2)), e = 10 * Math.log10(R[i] / th); worst = Math.max(worst, Math.abs(e)); return f + ':' + (-10 * Math.log10(R[i])).toFixed(2) + '/' + (-10 * Math.log10(th)).toFixed(2); }); out.push('chamber m=' + m + ' L=' + L + ' loss dB sim/theory ' + rows.join(' ') + '  worst error ' + worst.toFixed(3) + ' dB'); }
    { const L = 0.75, Lq = Math.round(2 * L / c * sr) * c / sr / 2, net = { sec: [[1, A, c, 1, 0, 0], [1, A, c, 1, 0, 0]], st: [[0, A, L, c, 1]], rs: 0, ro: 0, fo: 20000, g: 1, sh: 0 }, f2 = [40, 80, 120, 150, 160, 166.7, 175, 200, 300, 400, 500];
      const p = new PN(sr, net); p.sA = 1; const n = 16384, h = new Float64Array(n); h[0] = p.run(1); for (let i = 1; i < n; i++) h[i] = p.run(0);
      let worst = 0; const rows = f2.map(f => { const w = 2 * Math.PI * f / sr; let re = 0, im = 0; for (let i = 0; i < n; i++) { const win = 0.5 + 0.5 * Math.cos(Math.PI * i / n); re += h[i] * win * Math.cos(w * i); im -= h[i] * win * Math.sin(w * i); } const R = re * re + im * im, t = Math.tan(2 * Math.PI * f * Lq / c), th = 1 / (1 + 0.25 * t * t), e = Math.abs(10 * Math.log10(R / th)); if (th > 0.03) worst = Math.max(worst, e); return f + ':' + (-10 * Math.log10(R)).toFixed(1) + '/' + (-10 * Math.log10(th)).toFixed(1); });
      out.push('side pipe L=' + L + ' (cancels ' + (c / (4 * Lq)).toFixed(1) + ' Hz) loss dB sim/theory ' + rows.join(' ') + '  worst error away from the notch ' + worst.toFixed(2) + ' dB'); }
    { // one plain pipe against the old tube: same length, the two ends' reflections multiplied to the old figure
      const L = 3, g = -0.3, a = 0.5; const Duct = (() => { const Dn = Math.max(1, Math.round(L / c * sr)), N = 2 * Dn + 1, b = new Float32Array(N); let w = 0, z = 0; return x => { let i2 = w - 2 * Dn; if (i2 < 0) i2 += N; let i1 = w - Dn; if (i1 < 0) i1 += N; z += (b[i2] - z) * a; const v = x + g * z; b[w] = v; const o = b[i1]; if (++w >= N) w = 0; return o; }; })();
      const fo = -Math.log(1 - a) * sr / (2 * Math.PI), p = new PN(sr, { sec: [[L, A, c, 1, 0, 0]], rs: 0.375, ro: 0.8, fo, g: 1, sh: 0 }); let e = 0, s = 0; for (let i = 0; i < 20000; i++) { const x = i === 0 ? 1 : 0, y0 = Duct(x), y1 = p.run(x); e += (y0 - y1) * (y0 - y1); s += y0 * y0; }
      out.push('plain pipe against the old single tube: difference ' + (10 * Math.log10(e / s + 1e-30)).toFixed(1) + ' dB below the signal'); }
    return out; });
  console.log(r.join('\n')); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
