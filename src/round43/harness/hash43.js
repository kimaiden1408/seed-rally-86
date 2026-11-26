// Every car's physics set-up hashed (and a few builds'), to show a build of the page leaves the driving untouched.
const { open } = require('./lib'), crypto = require('crypto');
(async () => { const H = await open(process.argv[2]); await new Promise(r => setTimeout(r, 2500));
  const r = await H.page.evaluate(() => { const out = {}, J = v => JSON.stringify(v, (k, x) => typeof x === 'function' ? x.toString().length : x instanceof Float32Array || x instanceof Float64Array ? Array.from(x) : x);
    for (const S of CARS.slice()) { let s = ''; try { s = J(carSetup(S)) + J(S.tq) + J([S.mass, S.wb, S.final, S.gears, S.redline, S.fs, S.tyres, S.cdA, S.lag, S.idle]); } catch (e) { s = 'ERR ' + e.message; } out[S.id] = s; }
    // three builds: a stock body rebuilt, one with a different exhaust, one with titanium pipe
    const mk = (id, body, patch) => { const B = Object.assign({}, cuStockBuild(carById(body)), patch); B.name = 'H43'; const S = cuRegister(id, B, true); out[id] = S ? J(carSetup(S)) + J(S.tq) + J([S.mass, S.final, S.gears, S.redline]) : 'null'; out[id + '_code'] = cuCode(B); cuUnregister(id); };
    mk('cu_h43a', 'sentai_gt4', {}); mk('cu_h43b', 'pinnace_20', { muff: 'chamber', cat: 'sport', res: 1, pipeD: 63 }); mk('cu_h43c', 'vireo_4t', { pmat: 'ti', resT: 'quarter', res: 1 });
    const t0 = performance.now(); Gfx.level = 'high'; const m = buildCarMesh(carById('sentai_gt4'), false, false, null); const ms = performance.now() - t0; dropCarMesh(m); out._ms = '' ; return { out, ms: Math.round(ms) }; });
  const h = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12); const all = Object.keys(r.out).sort().map(k => k + ':' + h(r.out[k]));
  console.log('all', h(all.join('|')), 'cars', all.length, 'mesh build ms', r.ms); if (process.env.SHOW) console.log(all.join('\n')); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
