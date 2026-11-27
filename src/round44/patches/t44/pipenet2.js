  // (round 44) two pipes, one a bank, and what joins them. The same waves as PipeNet's, in a net of sections and joints
  // (N: see ex44Net2): each bank's pulses go into its own pipe ('s'); a joint of any number of pipe ends shares a wave
  // among them by their areas ('j': two ends are a change of bore, three a tee - an H-pipe's balance tube on each main
  // pipe, a quarter-wave pipe - four an X-pipe, where each bank's wave goes on down both pipes and back up the other);
  // a capped end sends the wave back ('c'); each open end sends low notes back and lets the rest out ('o'), the two
  // tailpipes heard together, the far one a little less.
  class PipeNet2 {
    constructor(sr, N) {
      const S = N.sec, n = S.length; this.n = n; this.D = new Int32Array(n); this.o = new Int32Array(n); this.w = new Int32Array(n); this.k = new Float64Array(n); this.a = new Float64Array(n); this.mx = new Float64Array(n);
      let tot = 0; const Y = new Float64Array(n);
      for (let j = 0; j < n; j++) { const s = S[j], D = Math.max(1, Math.round(s[0] / s[2] * sr)); this.D[j] = D; this.o[j] = tot; tot += D; Y[j] = s[1] * s[2]; this.k[j] = s[3]; this.a[j] = s[4] > 0 ? 1 - Math.exp(-TAU * Math.min(s[4], sr * 0.45) / sr) : 1; this.mx[j] = s[4] > 0 ? s[5] : 1; }
      this.f = new Float32Array(tot); this.b = new Float32Array(tot); this.zf = new Float64Array(n); this.zb = new Float64Array(n); this.fo = new Float64Array(n); this.bo = new Float64Array(n); this.fi = new Float64Array(n); this.bi = new Float64Array(n);
      const nd = N.nodes, nn = nd.length; this.nn = nn; this.ty = new Int8Array(nn); this.p0 = new Int32Array(nn); this.pc = new Int32Array(nn); this.q1 = new Float64Array(nn); this.q2 = new Float64Array(nn); this.q3 = new Float64Array(nn); this.z = new Float64Array(nn);
      const iS = [], iE = [], iC = [], lp = f => 1 - Math.exp(-TAU * Math.min(f, sr * 0.45) / sr);
      nd.forEach((q, i) => { this.p0[i] = iS.length;
        if (q[0] === 's') { this.ty[i] = 0; iS.push(q[1]); iE.push(0); iC.push(0); this.q1[i] = q[3]; this.q2[i] = q[2] ? 1 : 0; }
        else if (q[0] === 'o') { this.ty[i] = 1; iS.push(q[1]); iE.push(1); iC.push(0); this.q1[i] = q[2]; this.q2[i] = lp(q[3]); this.q3[i] = q[4] == null ? 1 : q[4]; }
        else if (q[0] === 'c') { this.ty[i] = 2; iS.push(q[1]); iE.push(1); iC.push(0); this.q1[i] = q[2]; this.q2[i] = lp(6000); }
        else { this.ty[i] = 3; let sum = 0; for (const e of q[1]) sum += Y[e[0]]; for (const e of q[1]) { iS.push(e[0]); iE.push(e[1]); iC.push(2 * Y[e[0]] / sum); } }
        this.pc[i] = iS.length - this.p0[i]; });
      this.iS = Int32Array.from(iS); this.iE = Int8Array.from(iE); this.iC = Float64Array.from(iC);
      this.nq = new Int32Array(n).fill(-1); this.nQ = []; this.nD = []; for (const q of N.nt || []) if (q[0] >= 0 && q[0] < n && this.nq[q[0]] < 0) { this.nq[q[0]] = this.nQ.length; this.nQ.push(new BQ().set('bp', q[1], q[2], sr)); this.nD.push(q[3]); }
      this.g = N.g || 1; this.sh = N.sh || 0; this.ac = 1 - Math.exp(-TAU * 900 / sr); this.zc = 0;
    }
    run2(x0, x1) {
      const n = this.n, f = this.f, b = this.b, o = this.o, w = this.w, k = this.k, a = this.a, mx = this.mx, fo = this.fo, bo = this.bo, fi = this.fi, bi = this.bi, zf = this.zf, zb = this.zb, nq = this.nq, D = this.D, iS = this.iS, iE = this.iE, iC = this.iC, ty = this.ty, p0 = this.p0, pc = this.pc, q1 = this.q1, q2 = this.q2, z = this.z;
      for (let j = 0; j < n; j++) { const i = o[j] + w[j]; if (a[j] === 1) { fo[j] = k[j] * f[i]; bo[j] = k[j] * b[i]; } else { const m = mx[j]; let v = f[i]; zf[j] += (v - zf[j]) * a[j]; fo[j] = k[j] * (m * v + (1 - m) * zf[j]); v = b[i]; zb[j] += (v - zb[j]) * a[j]; bo[j] = k[j] * (m * v + (1 - m) * zb[j]); } fi[j] = 0; bi[j] = 0; }
      let y = 0;
      for (let i = 0, nn = this.nn; i < nn; i++) { const p = p0[i], t = ty[i];
        if (t === 3) { let s = 0; const e = p + pc[i]; for (let q = p; q < e; q++) s += iC[q] * (iE[q] ? fo[iS[q]] : bo[iS[q]]); for (let q = p; q < e; q++) { const j = iS[q]; if (iE[q]) bi[j] = s - fo[j]; else fi[j] = s - bo[j]; } }
        else if (t === 0) { const j = iS[p]; fi[j] = (q2[i] ? x1 : x0) + q1[i] * bo[j]; }
        else if (t === 1) { const j = iS[p], v = fo[j]; z[i] += (v - z[i]) * q2[i]; bi[j] = -q1[i] * z[i]; y += this.q3[i] * v; }
        else { const j = iS[p], v = fo[j]; z[i] += (v - z[i]) * q2[i]; bi[j] = q1[i] * z[i]; } }
      for (let j = 0; j < n; j++) { const i = o[j] + w[j]; let v = fi[j]; if (nq[j] >= 0) v -= this.nQ[nq[j]].run(v) * this.nD[nq[j]]; f[i] = v < 1e-30 && v > -1e-30 ? 0 : v; v = bi[j]; b[i] = v < 1e-30 && v > -1e-30 ? 0 : v; if (++w[j] >= D[j]) w[j] = 0; }
      this.zc += (y - this.zc) * this.ac; return this.g * (y + this.sh * (y - this.zc));
    }
  }
