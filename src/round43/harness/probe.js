const { open } = require('./lib');
(async () => { const t0 = Date.now(), H = await open(process.argv[2]);
  await new Promise(r => setTimeout(r, 3000));
  const info = await H.page.evaluate(() => ({ build: typeof SR86_BUILD !== 'undefined' ? SR86_BUILD : null, three: THREE.REVISION, n: CARS.length,
    cars: CARS.map(c => [c.id, c.cls, (c.suspT || []).join('/'), c.fs, c.epos || '', c.eng || ''].join(' ')), gl: !!document.createElement('canvas').getContext('webgl') }));
  console.log(JSON.stringify(info, null, 1)); console.log('errors', H.errors.length, H.errors.slice(0, 5)); console.log('ms', Date.now() - t0); await H.close(); })();
