// Round 48: the game's real courses (and the test ones) brought up to date: their ways' lane tags (lanes each way,
// overtaking, lane markings, divider, lane widths) and their other roads' lanes and one-way-ness, from the map's own
// tags by way id (one Overpass query a pack, kept in the harness's cache), and the country each is in (the map's
// country area round its middle). Written by the round 48 page's rwEnrich, so the page and the packs agree.
// node harness/enrich48.js pack...   (reads work/r46/packs, writes work/r48/packs; env PAGE, default work/site48)
const L = require('./lib46'), fs = require('fs');
(async () => {
  const names = process.argv.slice(2), OUT = 'work/r48/packs'; fs.mkdirSync(OUT, { recursive: true });
  const H = await L.open(process.env.PAGE || 'work/site48/index.html', { w: 640, h: 360 });
  await H.page.waitForFunction(() => typeof rwEnrich === 'function' && typeof rwPackIn === 'function', { timeout: 120000 });
  for (const name of names) {
    const txt = fs.readFileSync('work/r46/packs/' + name + '.json', 'utf8'), P = JSON.parse(txt);
    const ids = [...new Set([...P.ways.map(w => w.id), ...(P.net || []).map(n => n.id)])].filter(x => x > 0);
    const q = `[out:json][timeout:180];way(id:${ids.join(',')});out tags;is_in(${P.o[0].toFixed(5)},${P.o[1].toFixed(5)})->.a;area.a[admin_level=2];out tags;`;
    const r = await L.netFetch('https://overpass-api.de/api/interpreter', 'POST', 'data=' + encodeURIComponent(q), { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' });
    if (!r || r.status !== 200) { console.log(name, 'query failed', r && r.status); continue; }
    const J = JSON.parse(r.body.toString('utf8')), tags = {}; let cc = '';
    for (const el of J.elements || []) { if (el.type === 'way') tags[el.id] = el.tags || {}; else if (el.type === 'area' && el.tags) { const c = el.tags['ISO3166-1'] || el.tags['ISO3166-1:alpha2']; if (c && !cc) cc = c.toUpperCase(); } }
    const res = await H.page.evaluate((txt, tags, cc) => { const K = rwPackIn(txt), st = rwEnrich(K, tags, cc); return { st, cc: K.cc, out: rwPackOut(K) }; }, txt, tags, cc);
    fs.writeFileSync(`${OUT}/${name}.json`, res.out);
    const lane = Object.values(tags).filter(t => t['lanes:forward'] || t['lanes:backward'] || t.overtaking || t['overtaking:forward'] || t['overtaking:backward'] || t.divider || t.lane_markings).length;
    console.log(name, 'ids', ids.length, 'tagged', Object.keys(tags).length, 'with lane tags', lane, 'country', res.cc, 'updated', JSON.stringify(res.st), 'bytes', res.out.length, '(was', txt.length + ')');
  }
  console.log('net', JSON.stringify(L.stats), 'errors', JSON.stringify(H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 4))); await H.close();
})();
