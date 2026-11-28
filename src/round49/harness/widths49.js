// Round 49: a circuit's published track width onto its course pack, where the map has none: the way's est_width (an
// estimate's tag, so the map's own width, if it ever has one, still comes first - see rwRaceW) and where it came from
// (source:width). The list: notes/widths49.txt (pack, way id, width in metres, source).  node harness/widths49.js
const fs = require('fs');
for (const line of fs.readFileSync('notes/widths49.txt', 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue; const [pack, id, w, ...src] = line.split(' '), f = 'work/r49/packs/' + pack + '.json';
  const K = JSON.parse(fs.readFileSync(f, 'utf8')), W = K.ways.find(x => String(x.id) === id); if (!W) throw new Error(pack + ': no way ' + id);
  if (W.t.width) { console.log(pack, id, 'has the map\'s width', W.t.width, '- left'); continue; }
  W.t.est_width = w; W.t['source:width'] = src.join(' '); fs.writeFileSync(f, JSON.stringify(K)); console.log(pack, id, (W.t.name || ''), 'est_width', w);
}
