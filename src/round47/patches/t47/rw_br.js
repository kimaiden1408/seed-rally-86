// ==== ROUND 47: A REAL ROAD'S OWN BRIDGES, BUILT AS THEIR KIND IS ====
// A modern bridge - a motorway's, a trunk or main road's, or any longer than 60 m - is concrete: its deck a girder as deep
// as its spans ask (a twentieth of a span, 1.2 to 2.8 m) under concrete parapets, each pier a column (two under a wide
// deck) standing on a footing, a cap across the deck's width on top, its abutments concrete. An old one on a lesser road
// stays the game's own stone bridge.
function rwBridgeKind(pts, i, j) { const L = (j - i) * STEP, hw = pts[Math.round((i + j) / 2)].rwhw || '', modern = /motorway|trunk|primary/.test(hw) || L > 60;
  if (!modern) return {}; const span = L < 80 ? 18 : L / Math.ceil(L / 42); return { modern: 1, depth: Math.min(2.8, Math.max(1.2, span / 20)) }; }
let _rwConc = null;
function rwConcMat(vc) { if (!_rwConc) _rwConc = { v: new THREE.MeshLambertMaterial({ vertexColors: true }), p: new THREE.MeshLambertMaterial({ color: 0xa8a49b }) }; return vc ? _rwConc.v : _rwConc.p; }
// (a modern bridge's pier at road point p: from its footing (floor) up to under its deck (top))
function rwPier(G, p, deck, floor, top) {
  const mat = rwConcMat(false), add = (geo, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = p.h; m.castShadow = true; m.receiveShadow = true; G.add(m); };
  const lx = Math.cos(p.h), lz = -Math.sin(p.h), capH = 1.3, colTop = top - capH, h = colTop - floor; if (h < 0.4) return;
  const two = deck > 11, cols = two ? [-deck * 0.28, deck * 0.28] : [0];
  for (const u of cols) { const x = p.x + lx * u, z = p.z + lz * u;
    if (two) add(new THREE.CylinderGeometry(0.85, 0.95, h, 14), x, floor + h / 2, z); else add(new THREE.BoxGeometry(Math.max(2.2, deck * 0.42), h, 1.8), x, floor + h / 2, z);
    add(new THREE.BoxGeometry(two ? 3.4 : Math.max(2.2, deck * 0.42) + 1.6, 1.0, 3.4), x, floor + 0.2, z); }
  add(new THREE.BoxGeometry(deck - 0.3, capH, 2.2), p.x, colTop + capH / 2, p.z);
}
