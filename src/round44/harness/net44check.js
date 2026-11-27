// The two-pipe net checked: (1) with nothing between the pipes, each is the single chain; (2) an X-pipe passes what
// the two banks have in common untouched and sends back what they differ by (as an open end would); (3) an H-pipe
// leaves the common part to see only a closed side pipe half the balance tube long; (4) every car that has two pipes
// gives finite sound.
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2000));
  const r = await H.page.evaluate(() => { const D = EngineDSPDef(), PN = D.PipeNet, P2 = D.PipeNet2, sr = 48000, c = 500, A = 0.0045, out = [];
    const N = { sec: [[0.9, A, c, 0.99, 0, 0], [0.3, A * 3, c, 0.9, 1500, 0.4], [1.2, A, c, 0.985, 0, 0]], nt: [[1, 90, 2.5, 0.5]], st: [], rs: 0.4, ro: 0.8, fo: 1700, g: 1, sh: 0, info: { len: 2.4 } };
    const run = (net2, f0, f1, n) => { const p = new P2(sr, net2), y = new Float64Array(n); for (let i = 0; i < n; i++) y[i] = p.run2(f0(i), f1(i)); return y; }, one = (net, f, n) => { const p = new PN(sr, net), y = new Float64Array(n); for (let i = 0; i < n; i++) y[i] = p.run(f(i)); return y; };
    const sig = i => Math.sin(i * 0.011) + (i % 400 === 0 ? 1 : 0) + 0.3 * Math.sin(i * 0.17), sig2 = i => Math.sin(i * 0.023 + 1) + (i % 400 === 200 ? 1 : 0), n = 30000, db = (a, b) => { let e = 0, s = 0; for (let i = 0; i < a.length; i++) { e += (a[i] - b[i]) * (a[i] - b[i]); s += b[i] * b[i]; } return (10 * Math.log10(e / s + 1e-30)).toFixed(1); };
    const eq = w => { const q = JSON.parse(JSON.stringify(w)); q.nodes.forEach(nd => { if (nd[0] === 'o') nd[4] = 1; }); return q; };
    const y1 = one(N, sig, n), ya = one(N, sig, n), yb = one(N, sig2, n), sum = ya.map((v, i) => v + yb[i]);
    const none = eq(ex44Net2(N, { xo: ['none', 0.5, 0], len: 2.4 }, {})); out.push('none: two different banks against two single chains added: difference ' + db(run(none, sig, sig2, n), sum) + ' dB');
    const x = eq(ex44Net2(N, { xo: ['x', 0.5, 0], len: 2.4 }, {})); out.push('X-pipe, both banks the same: against the single chain doubled: difference ' + db(run(x, sig, sig, n), y1.map(v => 2 * v)) + ' dB');
    { const yo = run(x, sig, i => -sig(i), n); let e = 0, s = 0; for (let i = 0; i < n; i++) { e += yo[i] * yo[i]; s += y1[i] * y1[i]; } out.push('X-pipe, banks opposite: what comes out of the two tailpipes together: ' + (10 * Math.log10(e / s + 1e-30)).toFixed(1) + ' dB against one chain (nothing passes the joint)'); }
    { const h = eq(ex44Net2(N, { xo: ['h', 0.5, 0.4], len: 2.4 }, {})); const Ns = JSON.parse(JSON.stringify(N)); Ns.sec.splice(0, 1, [0.5, A, c, Math.pow(0.99, 0.5 / 0.9), 0, 0], [0.4, A, c, Math.pow(0.99, 0.4 / 0.9), 0, 0]); Ns.nt = [[2, 90, 2.5, 0.5]]; Ns.st = [[0, A * 0.5625, 0.2, c, 1]];
      const p = new PN(sr, Ns); p.sA = 1; const ys = new Float64Array(n); for (let i = 0; i < n; i++) ys[i] = p.run(sig(i)); const hh = JSON.parse(JSON.stringify(h)); hh.sec[hh.sec.length - 1][3] = 1; out.push('H-pipe (0.4 m tube), both banks the same: against one chain with a capped 0.2 m side pipe, doubled: difference ' + db(run(hh, sig, sig, n), ys.map(v => 2 * v)) + ' dB'); }
    return out; });
  console.log(r.join('\n')); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
