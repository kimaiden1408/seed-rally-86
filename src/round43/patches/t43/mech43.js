// ---- (round 43) the running gear's feet on the shell ----
// A spring, a damper, an arm's pivot or a link whose end is fixed to the body must end ON the body. Where one would
// end short of it (a spring's top under a floor that is higher there, a damper's top short of the wing), it gets
// what a car has there: a seat or a bracket - a stout post from the part's end to the shell straight above it (or to the
// nearest of it), a pad where it meets the panel. parts: the running gear's parts so far; at: a point's place at rest
function mech43Feet(rig, parts, C, at, tube, P) {
  try {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
    const segD = (p, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1e-9))); return len(sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t])); };
    // (the ends fixed to the body, and every part as a rod of its own thickness)
    const pl = e => { try { return e.dl ? null : at(e, false); } catch (er) { return null; } }; // (a point's place at rest; an anti-roll bar lever's end, which only the drawing works out, is left out)
    const G = parts.map(p => { if (p.t === 'tube' || p.t === 'cone' || p.t === 'coil') { const a = pl(p.a), b = pl(p.b); return a && b ? { a, b, r: p.t === 'cone' ? Math.max(p.r0, p.r1) : p.t === 'coil' ? p.R : p.r } : null; } return p.t === 'obox' && p.f === 'b' ? { a: p.c, b: p.c, r: Math.max(...p.h) } : null; });
    const cand = []; parts.forEach((p, i) => { if ((p.t !== 'tube' && p.t !== 'coil') || !G[i]) return; if (len(sub(G[i].a, G[i].b)) < 0.03) return; for (const e of [p.a, p.b]) { if (!e || e.f !== 'b') continue; let d = 1e9; for (let j = 0; j < parts.length && d > 0.025; j++) if (j !== i && G[j]) d = Math.min(d, segD(e.p, G[j].a, G[j].b) - G[j].r); if (d > 0.025) cand.push({ p: e.p, r: G[i].r, coil: p.t === 'coil' }); } });
    if (!cand.length) return;
    // (the shell's triangles near them, in the body's own frame)
    rig.root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(rig.body.matrixWorld).invert(), v = new THREE.Vector3(), M = new THREE.Matrix4(), T = [];
    rig.root.traverse(o => { if (!o.isMesh || !/^(Body|Trim)Mesh$/.test(o.name || '')) return; const g = o.geometry, A = g.attributes.position, ix = g.index, n = ix ? ix.count : A.count; M.multiplyMatrices(inv, o.matrixWorld);
      const pt = i => { v.fromBufferAttribute(A, ix ? ix.getX(i) : i).applyMatrix4(M); return [v.x, v.y, v.z]; };
      for (let i = 0; i + 2 < n; i += 3) { const a = pt(i); let near = false; for (const c of cand) if (Math.abs(a[0] - c.p[0]) < 0.7 && Math.abs(a[2] - c.p[2]) < 0.7 && Math.abs(a[1] - c.p[1]) < 0.9) { near = true; break; } if (near) T.push([a, pt(i + 1), pt(i + 2)]); } });
    const closest = (p, t) => { const [a, b, c] = t, ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return a; const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return b;
      const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const s = d1 / (d1 - d3); return [a[0] + ab[0] * s, a[1] + ab[1] * s, a[2] + ab[2] * s]; } const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return c;
      const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const s = d2 / (d2 - d6); return [a[0] + ac[0] * s, a[1] + ac[1] * s, a[2] + ac[2] * s]; } const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const s = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return [b[0] + (c[0] - b[0]) * s, b[1] + (c[1] - b[1]) * s, b[2] + (c[2] - b[2]) * s]; }
      const dn = 1 / (va + vb + vc), s = vb * dn, w = vc * dn; return [a[0] + ab[0] * s + ac[0] * w, a[1] + ab[1] * s + ac[1] * w, a[2] + ab[2] * s + ac[2] * w]; };
    for (const c of cand) { let best = null, bd = 0.32, up = null, ud = 0.36;
      for (const t of T) { const q = closest(c.p, t), d = len(sub(q, c.p)); if (d < bd) { bd = d; best = q; }
        // (straight up: where the upright line through the end meets this triangle)
        const [a, b, e] = t, d00 = (b[0] - a[0]) * (e[2] - a[2]) - (e[0] - a[0]) * (b[2] - a[2]); if (Math.abs(d00) < 1e-9) continue; const u = ((c.p[0] - a[0]) * (e[2] - a[2]) - (e[0] - a[0]) * (c.p[2] - a[2])) / d00, w = ((b[0] - a[0]) * (c.p[2] - a[2]) - (c.p[0] - a[0]) * (b[2] - a[2])) / d00;
        if (u < 0 || w < 0 || u + w > 1) continue; const y = a[1] + u * (b[1] - a[1]) + w * (e[1] - a[1]) - c.p[1]; if (y > 0.004 && y < ud) { ud = y; up = [c.p[0], c.p[1] + y, c.p[2]]; } }
      if (bd <= 0.025) continue; const q = up && ud < bd * 2.2 ? up : best; if (!q) continue;
      const rb = Math.max(0.012, Math.min(0.03, c.r * 0.5)), e0 = P('b', c.p[0], c.p[1], c.p[2]), e1 = P('b', q[0], q[1], q[2]), L = len(sub(q, c.p)), k = Math.max(0, (L - 0.01) / L), e2 = P('b', c.p[0] + (q[0] - c.p[0]) * k, c.p[1] + (q[1] - c.p[1]) * k, c.p[2] + (q[2] - c.p[2]) * k);
      tube(e0, e1, rb, C.arm, { n: 5 }); tube(e2, e1, Math.max(rb * 1.9, c.coil ? c.r + 0.012 : 0.03), C.up, { n: 8, cap: true }); // (the post, and its pad on the panel: a spring's as wide as the spring)
      if (c.coil) { const k2 = Math.min(1, 0.012 / L); tube(e0, P('b', c.p[0] + (q[0] - c.p[0]) * k2, c.p[1] + (q[1] - c.p[1]) * k2, c.p[2] + (q[2] - c.p[2]) * k2), c.r + 0.012, C.damp, { n: 8, cap: true }); } } // (the spring's top seat)
  } catch (e) { }
}
