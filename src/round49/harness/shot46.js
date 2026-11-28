// Round 46: a picture of the stage from a camera of our own (the game's camera moved there for one frame, its fog
// pushed out; then put back). cam: { x, y, z, tx, ty, tz, fov, far }
async function shot(page, cam, file) {
  const url = await page.evaluate((c) => { const sv = { p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, far: camera.far, near: camera.near, fog: scene.fog ? [scene.fog.near, scene.fog.far] : null };
    const gy = c.rel ? (groundY(G.T, c.x, c.z) || 0) : 0, ty = c.relT ? (groundY(G.T, c.tx, c.tz) || 0) : 0; camera.position.set(c.x, c.y + gy, c.z); camera.fov = c.fov || 55; camera.far = c.far || 20000; camera.near = 0.5; camera.updateProjectionMatrix(); camera.lookAt(c.tx, c.ty + ty, c.tz); camera.updateMatrixWorld(true);
    if (scene.fog && c.nofog) { scene.fog.near = 1e5; scene.fog.far = 2e5; } try { cullChunks(); } catch (e) { } const dm = typeof Atmos === 'object' && Atmos.dome, dmP = dm ? dm.position.clone() : null; if (dm) { dm.position.copy(camera.position); dm.updateMatrixWorld(true); } // (round 49: the sky's dome kept round the camera, as the game keeps it)
    renderer.render(scene, camera); const u = renderer.domElement.toDataURL('image/jpeg', 0.88);
    if (dm) { dm.position.copy(dmP); dm.updateMatrixWorld(true); } camera.position.copy(sv.p); camera.quaternion.copy(sv.q); camera.fov = sv.fov; camera.far = sv.far; camera.near = sv.near; camera.updateProjectionMatrix(); if (sv.fog) { scene.fog.near = sv.fog[0]; scene.fog.far = sv.fog[1]; } return u; }, cam);
  require('fs').writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
}
module.exports = { shot };
