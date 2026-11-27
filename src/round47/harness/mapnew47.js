// Round 47: the website opened at #real=new (the artifact's link to the map): the Real roads tab with the map open on
// arrival, pictured at a phone's size; and the artifact's page showing that link in place of the map. node harness/mapnew47.js
const L = require('./lib46');
(async () => {
  const H = await L.open('work/site47/index.html', { w: 412, h: 860, net: true });
  await H.page.evaluate(() => { location.hash = '#real=new'; }); await H.page.reload({ waitUntil: 'load' });
  await H.page.waitForFunction(() => typeof RWMap === 'object', { timeout: 120000 }); await new Promise(r => setTimeout(r, 9000));
  const r = await H.page.evaluate(() => { const m = document.getElementById('realMap'); return { hash: location.hash, mapOpen: !!(m && !m.hidden), screen: (document.querySelector('.screen:not([hidden])') || {}).id || '', tiles: RWMap.T ? RWMap.T.size : 0 }; });
  console.log('website #real=new', JSON.stringify(r)); await H.page.screenshot({ path: 'work/r47/lap/mapnew_phone.jpg', quality: 82 });
  console.log('errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4)), 'net', JSON.stringify(H.stats)); await H.close();
  const A = await L.open('work/art47/index.html', { w: 412, h: 860, net: false });
  await A.page.waitForFunction(() => typeof RWMap === 'object' && typeof rwOffline === 'function', { timeout: 120000 }); await new Promise(r => setTimeout(r, 3000));
  const a = await A.page.evaluate(() => { const t = [...document.querySelectorAll('button, .tab, [data-tab]')].find(b => /Real road/i.test(b.textContent || '')); if (t) t.click(); return new Promise(res => setTimeout(() => { const w = document.getElementById('realWeb'), n = document.getElementById('realWebNote'); res({ offline: rwOffline(), link: w && !w.hidden ? w.href : null, linkText: w ? w.textContent : '', note: n && !n.hidden ? n.textContent.slice(0, 120) : null }); }, 1500)); });
  console.log('artifact', JSON.stringify(a)); await A.page.screenshot({ path: 'work/r47/lap/art_link_phone.jpg', quality: 82 });
  console.log('errors', JSON.stringify(A.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await A.close();
})();
