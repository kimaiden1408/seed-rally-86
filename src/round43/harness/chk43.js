// Connection checker for the running gear: every end of every rod, arm, shaft, spring and damper must touch another
// part of the running gear or the body (within TOL). Reports the loose ends by car.
// usage: node chk43.js BUILD.html [ids|all] [TOL metres]
const { open } = require('./lib');
(async () => { const [file, ids = 'all', tol = '0.03'] = process.argv.slice(2), H = await open(file); await new Promise(r => setTimeout(r, 2500));
  const list = ids === 'all' ? await H.page.evaluate(() => CARS.map(c => c.id)) : ids.split(','); let bad = 0, tot = 0;
  for (const id of list) {
    const r = await H.page.evaluate((id, TOL) => { Gfx.level = 'high'; const S = carById(id), m = buildCarMesh(S, false, false, null), M = m.mech; if (!M) return { none: 1 };
      m.root.updateMatrixWorld(true); MechParts.sync(m, M, null);
      // the body's triangles (shell, trim and whatever else is in the body group) in the car's frame
      const tris = []; const inv = new THREE.Matrix4().copy(m.root.matrixWorld).invert(), v = new THREE.Vector3();
      m.root.traverse(o => { if (!o.isMesh || o === M.mesh || /Wheel|Tyre|Rim|Glass|Crew/i.test(o.name || '')) return; let w = false; for (let q = o; q; q = q.parent) if (m.wheels.some(W => W.piv === q)) w = true; if (w) return;
        const g = o.geometry, P = g.attributes.position, ix = g.index, mat = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), n = ix ? ix.count : P.count; const pt = i => { v.fromBufferAttribute(P, ix ? ix.getX(i) : i).applyMatrix4(mat); return [v.x, v.y, v.z]; };
        for (let i = 0; i + 2 < n; i += 3) tris.push([pt(i), pt(i + 1), pt(i + 2)]); });
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
      const segD = (p, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1e-9))); return len(sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t])); };
      const triD = (p, T) => { // point to triangle distance (Ericson)
        const [a, b, c] = T, ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return len(ap);
        const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return len(bp); const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const t = d1 / (d1 - d3); return len(sub(ap, [ab[0] * t, ab[1] * t, ab[2] * t])); }
        const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return len(cp); const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const t = d2 / (d2 - d6); return len(sub(ap, [ac[0] * t, ac[1] * t, ac[2] * t])); }
        const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const t = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return len(sub(p, [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t, b[2] + (c[2] - b[2]) * t])); }
        const dn = 1 / (va + vb + vc), vv = vb * dn, ww = vc * dn; return len(sub(ap, [ab[0] * vv + ac[0] * ww, ab[1] * vv + ac[1] * ww, ab[2] * vv + ac[2] * ww])); };
      const P = M.P, geo = P.map(p => { if (p.t === 'tube' || p.t === 'cone' || p.t === 'coil') return { a: p.a.v.slice(), b: p.b.v.slice(), r: p.t === 'cone' ? Math.max(p.r0, p.r1) : p.t === 'coil' ? p.R : p.r };
        if (p.t === 'obox') { const mm = (p.f === 'b' ? M.B : M.W[+p.f[1]] || M.B).elements, c = p.c, w = [mm[0] * c[0] + mm[4] * c[1] + mm[8] * c[2] + mm[12], mm[1] * c[0] + mm[5] * c[1] + mm[9] * c[2] + mm[13], mm[2] * c[0] + mm[6] * c[1] + mm[10] * c[2] + mm[14]]; return { a: w, b: w, r: Math.max(...p.h) }; }
        if (p.t === 'ring') { const mm = (p.f[0] === 's' ? M.Sp[+p.f[1]] : M.W[+p.f[1]]).elements, w = x => [mm[0] * x + mm[12], mm[1] * x + mm[13], mm[2] * x + mm[14]]; return { a: w(p.x0), b: w(p.x1), r: p.ro }; } return null; });
      const loose = []; let ends = 0;
      P.forEach((p, i) => { if (p.t !== 'tube' && p.t !== 'cone' && p.t !== 'coil') return; const g = geo[i]; if (len(sub(g.a, g.b)) < 0.015) return;
        for (const [e, nm] of [[g.a, 'a'], [g.b, 'b']]) { ends++; let d = 1e9; for (let j = 0; j < P.length && d > TOL; j++) { if (j === i || !geo[j]) continue; d = Math.min(d, segD(e, geo[j].a, geo[j].b) - geo[j].r); }
          if (d > TOL) for (let k = 0; k < tris.length && d > TOL; k++) { const T = tris[k]; if (Math.abs(T[0][0] - e[0]) > 0.6 && Math.abs(T[1][0] - e[0]) > 0.6) continue; d = Math.min(d, triD(e, T)); }
          if (d > TOL) loose.push({ i, e: nm, at: e.map(x => +x.toFixed(2)), d: +d.toFixed(3), r: +g.r.toFixed(3), L: +len(sub(g.a, g.b)).toFixed(2), f: (p[nm].f || (p[nm].m ? 'mix' : p[nm].l ? 'along' : 'dl')) }); } });
      try { dropCarMesh(m); } catch (e) {} return { parts: P.length, ends, loose, suspT: (S.suspT || []).join('/'), tris: tris.length }; }, id, +tol);
    if (r.none) { console.log(id.padEnd(14), 'no running gear'); continue; } tot++;
    if (r.loose.length) bad++; console.log(id.padEnd(14), r.suspT.padEnd(18), 'parts', String(r.parts).padStart(3), 'ends', String(r.ends).padStart(3), 'loose', r.loose.length, r.loose.slice(0, +process.env.SHOW || 3).map(l => `#${l.i}${l.e}@${l.at} d${l.d} r${l.r} L${l.L} ${l.f}`).join(' | '));
  }
  console.log('cars with loose ends:', bad, 'of', tot); console.log('errors', H.errors.filter(e => !/WebSocket/.test(e)).slice(0, 3)); await H.close(); })();
