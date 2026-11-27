// Pictures of cars from below and around, each in a scene of its own.
// usage: node under.js BUILD.html OUTDIR id[,id...] [views] [build-code-json]
// views: comma list of under,underF,underR,sideL,front34,rear34,bay   env: W,H, SOLO=1 (hide the shell), ZOOM
const { open } = require('./lib'), fs = require('fs'), path = require('path');
(async () => { const [file, out, ids, views = 'under,underF,underR'] = process.argv.slice(2), W = +process.env.W || 1400, Hh = +process.env.H || 900;
  fs.mkdirSync(out, { recursive: true }); const H = await open(file, { w: W, h: Hh }); await new Promise(r => setTimeout(r, 2500));
  for (const id of ids.split(',')) for (const view of views.split(',')) {
    const url = await H.page.evaluate(async (id, view, W, Hh, solo, zoom, custom, clipX, code, hood, flameS, lookS) => {
      Gfx.level = 'high'; const S0 = carById(id); if (!S0) return 'no car ' + id; let S = S0; if (code) { const B = Object.assign({}, cuStockBuild(S0), JSON.parse(code)); B.name = 'P43'; S = cuRegister('cu_p43' + Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'a'), B, true); if (!S) return 'no build'; }
      const m = buildCarMesh(S, false, false, lookS ? Object.assign({}, typeof LK_DEF !== 'undefined' ? LK_DEF : {}, { tip: lookS }) : null), root = m.root; if (flameS) { Snd.flameB = flameS.split(',').map(Number); const h = {}; ex36Fire(m, Math.max(...Snd.flameB), h); clearTimeout(h.flT); clearTimeout(h.flT2); } if (m.sync) m.sync();
      const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); R.setSize(W, Hh, false); R.setClearColor(0xdfe3e6, 1);
      if (THREE.sRGBEncoding && window.__enc == null) window.__enc = renderer && renderer.outputEncoding; if (window.__enc != null) R.outputEncoding = window.__enc;
      const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 1.5)); sc.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9)); const d1 = new THREE.DirectionalLight(0xffffff, 0.35); const d2 = new THREE.DirectionalLight(0xffffff, 0.3);
      sc.add(d1); sc.add(d2); sc.add(root); if (hood) { try { G.spec = S; ws36Panel.cur = {}; for (let k = 0; k < 80; k++) ws36Panel(m, 'engine', true, 0.05); const Q = m._p36 && m._p36.engine && m._p36.engine.Q; if (hood > 1 && Q && Q.g) Q.g.visible = false; } catch (e) { console.log('hood', e.message); } } root.updateMatrixWorld(true);
      if (solo) root.traverse(o => { if (o.isMesh && o !== (m.mech && m.mech.mesh) && !/mech|under|exh|bay/i.test(o.name || '')) { /* keep */ } });
      const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()), L = box.max.z - box.min.z, wb = S.wb || 2.5;
      const cam = new THREE.PerspectiveCamera(32, W / Hh, 0.05, 60);
      let V = { under: [[0.001, -4.6, 0], [0, 0.3, 0], [1, 0, 0]], underF: [[0.9, -1.7, wb / 2 + 0.9], [0, 0.25, wb / 2 - 0.15], [0, 0, -1]], underR: [[-0.9, -1.7, -wb / 2 - 0.9], [0, 0.25, -wb / 2 + 0.15], [0, 0, 1]],
        underM: [[1.3, -2.0, 0], [0, 0.25, 0], [0, 0, 1]], sideL: [[5, 0.5, 0], [0, 0.5, 0], [0, 1, 0]], front34: [[2.6, 1.4, 4], [0, 0.5, 0], [0, 1, 0]], rear34: [[-2.6, 1.4, -4], [0, 0.5, 0], [0, 1, 0]],
        low: [[2.2, -0.9, 3.4], [0, 0.3, 0], [0, 1, 0]], lowR: [[-2.2, -0.9, -3.4], [0, 0.3, 0], [0, 1, 0]], sideU: [[3.4, -1.2, 0], [0, 0.3, 0], [0, 1, 0]] }[view];
      { const b = m.bay || {}, E = b.engF || b.engR || b.eng || null; if (E && /^eng/.test(view)) { const ex = (E.x0 + E.x1) / 2 - c.x, ez = (E.z0 + E.z1) / 2 - c.z, ey = (E.y0 + E.top) / 2;
        V = { engTop: [[ex + 0.001, ey + 2.1, ez], [ex, ey, ez], [0, 0, 1]], engUnder: [[ex + 0.001, ey - 2.0, ez], [ex, ey, ez], [0, 0, -1]], engL: [[ex + 1.9, ey + 0.9, ez + 0.5], [ex, ey, ez], [0, 1, 0]], engR: [[ex - 1.9, ey + 0.9, ez + 0.5], [ex, ey, ez], [0, 1, 0]],
          engBack: [[ex + 0.5, ey + 1.0, ez - 1.6], [ex, ey, ez], [0, 1, 0]], engFront: [[ex + 0.4, ey + 0.9, ez + 1.8], [ex, ey, ez], [0, 1, 0]], engUL: [[ex + 1.2, ey - 1.3, ez - 0.9], [ex, ey, ez], [0, 1, 0]], engUR: [[ex - 1.2, ey - 1.3, ez - 0.9], [ex, ey, ez], [0, 1, 0]] }[view]; } }
      if (custom && view === 'cam') { const q = custom.split(',').map(Number); V = [[q[0], q[1], q[2]], [q[3], q[4], q[5]], q.length > 8 ? [q[6], q[7], q[8]] : [0, 1, 0]]; } const z = zoom || 1; cam.position.set(c.x + V[0][0] * z, V[0][1] * z, c.z + V[0][2] * z); cam.up.set(...V[2]); cam.lookAt(c.x + V[1][0], V[1][1], c.z + V[1][2]);
      d1.position.set(cam.position.x + 3, cam.position.y - 1, cam.position.z + 2); d2.position.set(-cam.position.x - 2, cam.position.y * 0.5 - 1, -cam.position.z - 3); if (clipX != null) { R.clippingPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipX)]; }
      try { if (typeof CarShade !== 'undefined' && CarShade.put) CarShade.put(m); } catch (e) {}
      R.render(sc, cam); R.render(sc, cam); const u = cv.toDataURL('image/jpeg', 0.9); R.dispose(); try { dropCarMesh(m); } catch (e) {} return u;
    }, id, view, W, Hh, !!process.env.SOLO, +process.env.ZOOM || 1, process.env.CAM || '', process.env.CLIPX != null ? +process.env.CLIPX : null, process.env.CODE || '', +process.env.HOOD || 0, process.env.FLAME || '', process.env.LOOK || '');
    if (!url.startsWith('data:')) { console.log(id, view, url); continue; }
    fs.writeFileSync(path.join(out, id + '_' + (process.env.TAG || view) + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); console.log('ok', id, view);
  }
  console.log('errors', H.errors.length, H.errors.slice(0, 4)); await H.close(); })();
