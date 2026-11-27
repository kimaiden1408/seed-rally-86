// Round 46: a circuit's waypoints from its OpenStreetMap relation (type=circuit): the racing ways chained into one closed
// ring (pit lane and pit exit left out, small gaps between ways bridged), turned to run the way the race does (given as
// the heading at the start-finish node: N, E, S or W), and cut into waypoints every SP metres from the start-finish line.
// node harness/circuit46.js <relation name regex> <heading N|E|S|W> [spacing m]
const L = require('./lib46');
(async () => {
  const [rx, head, sp] = process.argv.slice(2), SP = +sp || 150;
  const ep = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', post = q => L.netFetch(ep, 'POST', 'data=' + encodeURIComponent(q), { 'content-type': 'application/x-www-form-urlencoded' });
  const el = JSON.parse((await post('[out:json][timeout:60];relation["name"~"' + rx + '",i];out body geom;')).body.toString()).elements[0];
  const tg = new Map(JSON.parse((await post('[out:json][timeout:60];relation(' + el.id + ');way(r);out tags;')).body.toString()).elements.map(e => [e.id, e.tags || {}]));
  const D = (a, b) => Math.hypot((b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180) * 111320, (b[0] - a[0]) * 110574);
  const ways = el.members.filter(m => m.type === 'way' && m.role === '' && m.geometry && !/stand|pit/i.test((tg.get(m.ref) || {}).name || ''))
    .map(m => ({ ref: m.ref, name: (tg.get(m.ref) || {}).name || '', g: m.geometry.map(p => [p.lat, p.lon]) }))
    .filter(w => { let l = 0; for (let k = 1; k < w.g.length; k++) l += D(w.g[k - 1], w.g[k]); return l >= 15; }); // (the little junction pieces left to the router)
  // chain: from the first way, always the unused way with an end nearest the ring's end (within 45 m)
  let ring = ways[0].g.slice(); const used = new Set([0]), names = [ways[0].name];
  for (;;) { const e = ring[ring.length - 1]; let f = -1, rev = false, bd = 45;
    ways.forEach((w, k) => { if (used.has(k)) return; const a = D(w.g[0], e), b = D(w.g[w.g.length - 1], e); if (a < bd) { bd = a; f = k; rev = false; } if (b < bd) { bd = b; f = k; rev = true; } });
    if (f < 0) break; used.add(f); const g = rev ? ways[f].g.slice().reverse() : ways[f].g; ring = ring.concat(D(g[0], e) < 0.5 ? g.slice(1) : g); if (names[names.length - 1] !== ways[f].name) names.push(ways[f].name); }
  const gap = D(ring[0], ring[ring.length - 1]); let len = 0; for (let k = 1; k < ring.length; k++) len += D(ring[k - 1], ring[k]); len += gap;
  console.log('relation', el.id, el.tags.name, 'length tag', el.tags.length, '| ways', ways.length, 'chained', used.size, 'ring m', Math.round(len), 'closing gap m', gap.toFixed(1));
  if (used.size < ways.length || gap > 45) { console.log('NOT CLOSED: unused', ways.filter((w, k) => !used.has(k)).map(w => w.ref + ' ' + w.name).join(', ')); process.exit(1); }
  if (gap < 0.5) ring.pop();
  // the start-finish node, and the ring turned so the race heads the given way there
  const sf = el.members.find(m => m.type === 'node' && m.role === 'start-finish'); let k0 = 0, bd = 1e9; ring.forEach((p, k) => { const d = D(p, [sf.lat, sf.lon]); if (d < bd) { bd = d; k0 = k; } });
  const n = ring.length, nx = ring[(k0 + 3) % n], pv = ring[(k0 - 3 + n) % n], dLat = nx[0] - pv[0], dLon = (nx[1] - pv[1]) * Math.cos(sf.lat * Math.PI / 180);
  const goes = Math.abs(dLat) > Math.abs(dLon) ? (dLat > 0 ? 'N' : 'S') : (dLon > 0 ? 'E' : 'W');
  if (goes !== head) { ring.reverse(); names.reverse(); k0 = n - 1 - k0; }
  console.log('start-finish', sf.lat, sf.lon, 'ring point', bd.toFixed(1), 'm away; ring ran', goes, goes !== head ? '-> turned round' : '');
  const R2 = ring.slice(k0).concat(ring.slice(0, k0)); const wp = [[sf.lat, sf.lon]]; let acc = 0;
  for (let k = 1; k < R2.length; k++) { acc += D(R2[k - 1], R2[k]); if (acc >= SP && len - (k ? 0 : 0) > 0) { wp.push(R2[k]); acc = 0; } }
  if (D(wp[wp.length - 1], wp[0]) < SP * 0.5) wp.pop();
  console.log('order', (goes !== head ? names : names).join(' > '));
  if (process.env.RING_OUT) require('fs').writeFileSync(process.env.RING_OUT, JSON.stringify(R2));
  console.log('waypoints', wp.length);
  console.log(wp.map(p => p[0].toFixed(6) + ',' + p[1].toFixed(6)).join(';'));
})();
