const { open } = require('./lib');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { Gfx.level = 'high'; const ids = ['sentai_gt4', 'vireo_4t', 'pinnace_20', 'bastion_rs', 'esker_kr', 'vespera_sc'], best = {}; for (let k = 0; k < 4; k++) for (const id of ids) { const t0 = performance.now(), m = buildCarMesh(carById(id), false, false, null), t = performance.now() - t0; dropCarMesh(m); best[id] = Math.min(best[id] || 1e9, t); } return ids.map(id => id + ' ' + best[id].toFixed(0)).join(', '); });
  console.log('car build, best of four, ms:', r); await H.close(); })();
