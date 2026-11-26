  // (round 43) the pipe behind the collector as the chain of sections it is built of (N: see ex43Net). A pressure wave
  // runs down each section and one runs back; where two sections meet, each wave is partly passed on and partly turned
  // back by how their areas differ (a wave reaching a wider section mostly goes on and sends an upside-down echo back;
  // one reaching a narrower section sends an upright one). A side pipe on a tee takes its share at the joint and
  // gives it back from its capped end later: a quarter of a wave later for the note it cancels. A lined section soaks
  // up the top of what passes. The open end sends low notes back up the pipe and lets high ones out; the engine's end
  // sends back what the collector or the turbine does. Out comes the wave arriving at the open end.
  class PipeNet {
    constructor(sr, N) {
      const S = N.sec, n = S.length; this.n = n; this.D = new Int32Array(n); this.o = new Int32Array(n); this.w = new Int32Array(n); this.k = new Float64Array(n); this.a = new Float64Array(n); this.mx = new Float64Array(n);
      let tot = 0; const Y = new Float64Array(n);
      for (let j = 0; j < n; j++) { const s = S[j], D = Math.max(1, Math.round(s[0] / s[2] * sr)); this.D[j] = D; this.o[j] = tot; tot += D; Y[j] = s[1] * s[2]; this.k[j] = s[3]; this.a[j] = s[4] > 0 ? 1 - Math.exp(-TAU * Math.min(s[4], sr * 0.45) / sr) : 1; this.mx[j] = s[4] > 0 ? s[5] : 1; }
      this.f = new Float32Array(tot); this.b = new Float32Array(tot); this.zf = new Float64Array(n); this.zb = new Float64Array(n); this.fo = new Float64Array(n); this.bo = new Float64Array(n); this.fi = new Float64Array(n); this.bi = new Float64Array(n);
      // (the side pipes: one at most on a joint)
      this.sj = new Int32Array(Math.max(1, n)).fill(-1); const T = (N.st || []).filter(q => q[0] >= 0 && q[0] < n - 1); this.ns = T.length; this.sD = new Int32Array(this.ns); this.sO = new Int32Array(this.ns); this.sW = new Int32Array(this.ns); this.sR = new Float64Array(this.ns); this.sZ = new Float64Array(this.ns); this.sY = new Float64Array(this.ns);
      let st = 0; T.forEach((q, i) => { this.sj[q[0]] = i; this.sD[i] = Math.max(2, Math.round(2 * q[2] / q[3] * sr)); this.sO[i] = st; st += this.sD[i]; this.sR[i] = q[4]; this.sY[i] = q[1] * q[3]; }); this.sb = new Float32Array(Math.max(1, st)); this.sA = 1 - Math.exp(-TAU * 6000 / sr);
      // (each joint's shares: of the wave from the left, from the right, from its side pipe)
      this.cl = new Float64Array(Math.max(1, n - 1)); this.cr = new Float64Array(Math.max(1, n - 1)); this.cs = new Float64Array(Math.max(1, n - 1));
      for (let j = 0; j < n - 1; j++) { const ys = this.sj[j] >= 0 ? this.sY[this.sj[j]] : 0, sum = Y[j] + Y[j + 1] + ys; this.cl[j] = 2 * Y[j] / sum; this.cr[j] = 2 * Y[j + 1] / sum; this.cs[j] = 2 * ys / sum; }
      // (side chambers: each takes its note out of the wave entering a section)
      this.nq = new Int32Array(n).fill(-1); this.nQ = []; this.nD = []; for (const q of N.nt || []) if (q[0] >= 0 && q[0] < n && this.nq[q[0]] < 0) { this.nq[q[0]] = this.nQ.length; this.nQ.push(new BQ().set('bp', q[1], q[2], sr)); this.nD.push(q[3]); }
      this.rs = N.rs; this.ro = N.ro; this.ao = 1 - Math.exp(-TAU * Math.min(N.fo, sr * 0.45) / sr); this.zo = 0; this.g = N.g || 1; this.sh = N.sh || 0; this.ac = 1 - Math.exp(-TAU * 900 / sr); this.zc = 0;
    }
    run(x) {
      const n = this.n, f = this.f, b = this.b, o = this.o, w = this.w, k = this.k, a = this.a, mx = this.mx, fo = this.fo, bo = this.bo, fi = this.fi, bi = this.bi, zf = this.zf, zb = this.zb, sj = this.sj, cl = this.cl, cr = this.cr, nq = this.nq, D = this.D;
      // what arrives at each section's two ends, less what its walls and lining took
      for (let j = 0; j < n; j++) { const i = o[j] + w[j]; if (a[j] === 1) { fo[j] = k[j] * f[i]; bo[j] = k[j] * b[i]; } else { const m = mx[j]; let v = f[i]; zf[j] += (v - zf[j]) * a[j]; fo[j] = k[j] * (m * v + (1 - m) * zf[j]); v = b[i]; zb[j] += (v - zb[j]) * a[j]; bo[j] = k[j] * (m * v + (1 - m) * zb[j]); } }
      fi[0] = x + this.rs * bo[0];
      for (let j = 0; j < n - 1; j++) { let p = cl[j] * fo[j] + cr[j] * bo[j + 1]; const s = sj[j];
        if (s >= 0) { const i = this.sO[s] + this.sW[s], sb = this.sb; this.sZ[s] += (sb[i] - this.sZ[s]) * this.sA; const so = this.sR[s] * this.sZ[s]; p += this.cs[j] * so; const v = p - so; sb[i] = v < 1e-30 && v > -1e-30 ? 0 : v; if (++this.sW[s] >= this.sD[s]) this.sW[s] = 0; }
        bi[j] = p - fo[j]; fi[j + 1] = p - bo[j + 1]; }
      const y = fo[n - 1]; this.zo += (y - this.zo) * this.ao; bi[n - 1] = -this.ro * this.zo;
      for (let j = 0; j < n; j++) { const i = o[j] + w[j]; let v = fi[j]; if (nq[j] >= 0) v -= this.nQ[nq[j]].run(v) * this.nD[nq[j]]; f[i] = v < 1e-30 && v > -1e-30 ? 0 : v; v = bi[j]; b[i] = v < 1e-30 && v > -1e-30 ? 0 : v; if (++w[j] >= D[j]) w[j] = 0; }
      // (what the body's own boxes take, given back: see ex43Comp)
      this.zc += (y - this.zc) * this.ac; return this.g * (y + this.sh * (y - this.zc));
    }
  }
