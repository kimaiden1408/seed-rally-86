// The Workshop's crossover row on a vee build: the choices are there, picking H or X gives two tailpipes, going back to
// one tailpipe gives the Y-pipe, the car redraws with the part, the code round-trips. usage: node ws44.js BUILD.html [body] [picture]
const { open } = require('./lib');
(async () => { const H = await open(process.argv[2], { w: 1280, h: 800 }), body = process.argv[3] || 'galliot_v8'; await new Promise(r => setTimeout(r, 3000));
  const r = await H.page.evaluate(async (body) => { const out = {}, wait = ms => new Promise(r => setTimeout(r, ms)); Gfx.level = 'high';
    try { I18N.set('ko'); } catch (e) { out.langErr = e.message; }
    Workshop.open({ body }); await wait(800); Workshop.pickTab('exhaust'); await wait(500);
    const seg = () => [...document.querySelectorAll('.wsSeg')].map(g => g.getAttribute('data-k') + ':' + [...g.querySelectorAll('button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).filter(s => /^(xover|tail):/.test(s));
    out.keys = CU_KEYS.filter(k => k[0] === 'xover' || k[0] === 'tail').map(k => JSON.stringify(k)); out.start = Workshop.B.layout + ' xover=' + Workshop.B.xover + ' tail=' + Workshop.B.tail; out.rows0 = seg();
    const steps = [['xover', 'h'], ['tail', 1], ['xover', 'x'], ['xover', 'none'], ['xover', 'y'], ['tail', 2], ['xover', 'h']]; out.steps = [];
    for (const [k, v] of steps) { try { Workshop.set(k, v); } catch (e) { out['err_' + k + v] = e.message; } await wait(700); const S = Workshop.S || (typeof cuRegister === 'function' ? null : null); let part = '';
      try { const B = Object.assign({}, Workshop.B); B.name = 'B43'; const S2 = cuRegister('cu_b44wsxx', B, true), m = buildCarMesh(S2, false, false, null), E = m.bay.exhaust; part = (E.xo ? E.xo.t : '-') + ' tips ' + (E.ends || []).length; dropCarMesh(m); const K = engineCfg(S2); part += K.net2 ? ' two-pipe sound ' + K.net2.info.t : ' one-pipe sound'; cuUnregister('cu_b44wsxx'); } catch (e) { part = 'ERR ' + e.message; }
      out.steps.push(k + '=' + v + ' -> xover=' + Workshop.B.xover + ' tail=' + Workshop.B.tail + ' | drawn ' + part); }
    out.rows1 = seg(); const code = cuCode(Workshop.B), back = cuDecode(code); out.round = back && back.xover === Workshop.B.xover && back.tail === Workshop.B.tail; out.notes = [...document.querySelectorAll('.wsRow')].filter(e => /xover/.test(e.innerHTML)).map(e => e.textContent.slice(0, 160)); return out; }, body);
  console.log(JSON.stringify(r, null, 1)); if (process.argv[4]) await H.page.screenshot({ path: process.argv[4], type: 'jpeg', quality: 80 });
  console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
