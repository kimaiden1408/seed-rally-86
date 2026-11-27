// Each entered car's pipe as drawn against the table the sound uses where the car has not been drawn (EX43_STOCK):
// the two must agree. usage: node stock44.js BUILD.html
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { Gfx.level = 'high'; let n = 0, bad = []; for (const S of CARS) { const T = EX43_STOCK[S.id]; let m; try { m = buildCarMesh(S, false, false, null); } catch (e) { bad.push(S.id + ' ERR ' + e.message); continue; } const E = m.bay && m.bay.exhaust, g = E && E.geo; dropCarMesh(m); if (!g && !T) continue; n++;
      if (!g || !T) { bad.push(S.id + (g ? ' no table' : ' not drawn')); continue; } const a = JSON.stringify([g.d, g.np, g.el, g.len, g.man, g.br, g.qw, g.xo || null]), b = JSON.stringify([T.d, T.np, T.el, T.len, T.man, T.br, T.qw, T.xo || null]); if (a !== b) bad.push(S.id + '\n  drawn ' + a + '\n  table ' + b); } return { n, bad }; });
  console.log('cars with a kit exhaust:', r.n, '| differing from the table:', r.bad.length); for (const b of r.bad) console.log(b); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
