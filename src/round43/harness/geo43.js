// Each entered car's pipe as measured from the car as drawn: prints a table, and writes the stock table for the page.
// usage: node geo43.js BUILD.html [out.json]
const { open } = require('./lib'), fs = require('fs');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { Gfx.level = 'high'; const out = {}, rows = [];
    for (const S of CARS.slice()) { const g0 = ex43Prime(S), K = ENGINE_CFG[S.id] || {}, g = g0 ? JSON.parse(JSON.stringify(g0)) : null; if (g) { delete g.cp; out[S.id] = g; if (typeof EX43_STOCK !== 'undefined') { const keep = EX43_STOCK[S.id]; EX43_STOCK[S.id] = g; delete EX43_COMP[S.id]; g.cp = ex43Comp(S); delete EX43_COMP[S.id]; EX43_STOCK[S.id] = keep; } } const B = cuBare(S).B;
      rows.push([S.id.padEnd(14), S.cls.padEnd(3), g ? ['len', g.len.toFixed(2), 'man', g.man.toFixed(2), 'np', g.np, 'd', g.d, 'br', g.br, 'el', g.el.map(e => e[0] === 'p' ? 'p' + e[1].toFixed(2) + (e[2] ? '/' + e[2] : '') : e[1] + '(' + (e[4] > e[2] / 1.15 ? e[4] : e[2]).toFixed(2) + ')').join(' ')].join(' ') : 'no routed pipe', '| was main', K.main, '|', B.cat, B.res, B.muff, g && g.cp ? 'give-back ' + g.cp.join('/') : ''].join(' ')); }
    return { out, rows }; });
  console.log(r.rows.join('\n')); console.log('cars with a pipe:', Object.keys(r.out).length); if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(r.out));
  console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
