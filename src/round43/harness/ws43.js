// The Workshop's Exhaust tab on a new build: the new rows are there, each choice can be set, the car redraws,
// the build's code round-trips and an older code still loads. A picture of the tab in Korean.
const { open } = require('./lib'), fs = require('fs');
(async () => { const H = await open(process.argv[2], { w: 1280, h: 800 }); await new Promise(r => setTimeout(r, 3000));
  const r = await H.page.evaluate(async () => { const out = {}, wait = ms => new Promise(r => setTimeout(r, ms)); Gfx.level = 'high';
    try { I18N.set('ko'); } catch (e) { out.langErr = e.message; }
    try { Workshop.open({ body: 'sentai_gt4' }); } catch (e) { try { Workshop.open({ id: null, base: 'sentai_gt4' }); } catch (e2) { out.openErr = e.message + ' / ' + e2.message; } }
    await wait(800); out.on = Workshop.on; out.tab0 = Workshop.tab; try { Workshop.pickTab('exhaust'); } catch (e) { out.tabErr = e.message; } await wait(500);
    const rows = [...document.querySelectorAll('.wsRow .wsL span')].map(e => e.textContent); out.rows = rows; out.secs = [...document.querySelectorAll('.wsSec')].map(e => e.textContent);
    out.segs = [...document.querySelectorAll('.wsSeg')].map(g => g.getAttribute('data-k') + ':' + [...g.querySelectorAll('button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).filter(s => /^(flex|hang|joint|bend|resT|res):/.test(s));
    for (const [k, v] of [['res', 1], ['resT', 'quarter'], ['cat', 'sport'], ['muff', 'chamber'], ['flex', 'bellows'], ['hang', 'poly'], ['joint', 'vband'], ['bend', 'crush']]) { try { Workshop.set(k, v); } catch (e) { out['set_' + k] = e.message; } await wait(250); }
    await wait(1200); out.B = ['flex', 'hang', 'joint', 'bend', 'resT', 'res', 'muff', 'cat'].map(k => k + '=' + Workshop.B[k]).join(' ');
    const code = cuCode(Workshop.B), back = cuDecode(code); out.codeLen = code.length; out.round = back && ['flex', 'hang', 'joint', 'bend', 'resT', 'muff'].every(k => back[k] === Workshop.B[k]);
    // an older code: the same build without the four new fields (as round 40 wrote it), and one from before round 36
    const arr = JSON.parse(decodeURIComponent(escape(atob(code.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))), enc = a => 'C1.' + btoa(unescape(encodeURIComponent(JSON.stringify(a)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const old = cuDecode(enc(arr.slice(0, arr.length - 4))); out.old40 = old ? ['flex', 'hang', 'joint', 'bend'].map(k => old[k]).join(',') + ' resT=' + old.resT : null; const older = cuDecode(enc(arr.slice(0, arr.length - 4 - 2))); out.old36 = older ? older.flex + ' resT=' + older.resT + ' pmat=' + older.pmat : null; out.nKeys = CU_KEYS.length;
    out.notes = [...document.querySelectorAll('.wsRow .wsL small')].map(e => e.textContent).slice(-5); out.tiles = [...document.querySelectorAll('.wsTile')].map(e => e.textContent).slice(0, 4); return out; });
  console.log(JSON.stringify(r, null, 1)); if (process.argv[3]) { await H.page.screenshot({ path: process.argv[3], type: 'jpeg', quality: 80 }); }
  console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 5)); await H.close(); })();
