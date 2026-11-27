// ==== ROUND 46: REAL ROADS (the menu's tab and its map) ====
// The menu's Real roads tab: the courses made so far (kept in the page) and the game's own, each a tap away; making a
// new one on the map; a course's file to keep or send (a pack: everything it is built from), and opening one. On the
// map: the place found by its name, the course's points put down where the roads are (a tap to add one, a drag to move
// it, a tap on it to take it away), its kind - from a start to a finish, there and back, a circuit of laps - and its
// route on the real roads shown as it is found; then built from the map's data, the land's heights and all.
const RW_PRESETS = [
  { id: 'turini', name: 'Col de Turini climb', kind: 'p2p', km: 11.98, file: 'real/turini.json' },
  { id: 'bollene_rt', name: 'La Bollène there and back', kind: 'rt', km: 6.0, file: 'real/bollene_rt.json' },
  { id: 'monaco', name: 'Monaco streets circuit', kind: 'loop', km: 3.32, file: 'real/monaco.json' }
];
// a course's distance as driven: start to finish; there and back, out and back again; a circuit's lap
function rwKm(K) { const R = K.r; let d = 0; for (let k = R.a + 1; k <= R.b; k++) d += Math.hypot(R.x[k] - R.x[k - 1], R.z[k] - R.z[k - 1]); return (K.kind === 'rt' ? 2 : 1) * d / 1000; }
const RW_KIND = { p2p: 'Point to point', rt: 'There and back', loop: 'Circuit' };
const RealUI = {
  cur: null, busy: false, opt: Object.assign({ snow: false }, lsGet('sr86.realopt', {}) || {}),
  init() {
    const b = id => $(id), on = (id, f) => { const e = b(id); if (e) e.addEventListener('click', f); };
    on('#mode_real', () => Rally.setMode('real'));
    on('#realNew', () => RWMap.open(this.cur && this.cur.K ? { wp: this.cur.K.wp, kind: this.cur.K.kind, laps: this.cur.K.laps } : null));
    on('#realEdit', () => { if (this.cur && this.cur.K) RWMap.open({ wp: this.cur.K.wp, kind: this.cur.K.kind, laps: this.cur.K.laps, name: this.cur.K.name }); });
    on('#realImport', () => b('#realFile').click());
    on('#realExport', () => this.save());
    on('#realCopy', e => this.copy(e.currentTarget));
    on('#realSnow', () => { this.opt.snow = !this.opt.snow; lsSet('sr86.realopt', this.opt); if (this.cur) this.use(this.cur); else this.render(); });
    for (const n of [1, 2, 3, 5, 10]) on('#real_lp_' + n, () => { if (!this.cur || this.cur.K.kind !== 'loop') return; this.cur.K.laps = n; this.use(this.cur); });
    const f = b('#realFile'); if (f) f.addEventListener('change', async () => { const file = f.files && f.files[0]; f.value = ''; if (!file) return; try { const txt = await rwGunzip(await file.arrayBuffer()), K = rwPackIn(txt); await this.keep(K, txt); this.use({ K, own: true }); } catch (e) { this.say('That file is not a course this game can read.'); } });
    // (a link to a course: #real=code)
    const m = /(?:^|[#&])real=([0-9a-z]+)/i.exec(location.hash || ''); if (m) { this.want = m[1].toLowerCase(); Rally.mode = 'real'; }
  },
  say(t) { const e = $('#realNote'); if (e) e.textContent = t; },
  enter() { $('#realSetup').hidden = false; $('#boardWrap').hidden = true; for (const e of rwMenuBits()) e.hidden = true;
    for (const id of ['#selReg', '#selCourse']) { const l = $(id); if (l && l.parentElement) l.parentElement.hidden = true; } this.render();
    const code = this.want || lsGet('sr86.realLast', ''); this.want = null; if (G.T && G.T.real) { this.cur = this.cur || { K: G.T.real }; this.render(); return; }
    if (code) this.byCode(code).then(ok => { if (!ok && !this.cur) this.say(rwOffline() ? 'Open one of the game’s courses or a course file; new courses are made on the website, where the map can be reached.' : 'Pick a course, or make one on the map.'); }); },
  leave() { $('#realSetup').hidden = true; for (const e of rwMenuBits()) e.hidden = false; for (const id of ['#selReg', '#selCourse']) { const l = $(id); if (l && l.parentElement) l.parentElement.hidden = false; }
    $('#boardWrap').hidden = false; if (G.T && G.T.real) { G.T = null; setSeed($('#seed').value || '1', { force: true }); } },
  // the courses: the player's own (newest first), then the game's
  async list() { const out = []; for (const k of await RWDB.keys('pack')) { const e = await RWDB.get('pack', k); if (e && e.name != null) out.push(Object.assign({ code: k, own: true }, e)); } out.sort((a, b) => (b.made || 0) - (a.made || 0)); return out; },
  async render() {
    if (Rally.mode !== 'real') return; const L = await this.list(), box = $('#realList'); if (!box) return; box.textContent = '';
    // (each row: its name; its kind, its length, a lap's on a circuit, and whether it is the game's - each its own words)
    const row = (name, kind, km, game, on, cur, del) => { const d = document.createElement('div'); d.className = 'realRow' + (cur ? ' on' : ''); const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'realPick'; bt.innerHTML = '<b></b><small><span></span> · <span></span><span></span><span></span></small>'; bt.firstChild.textContent = name;
      const sp = bt.lastChild.querySelectorAll('span'); sp[0].textContent = RW_KIND[kind] || ''; sp[1].textContent = km.toFixed(1) + ' km'; if (kind === 'loop') sp[2].append(' · ', document.createElement('span')), sp[2].lastChild.textContent = 'a lap'; if (game) sp[3].append(' · ', document.createElement('span')), sp[3].lastChild.textContent = 'one of the game’s'; bt.addEventListener('click', on); d.appendChild(bt);
      if (del) { const x = document.createElement('button'); x.type = 'button'; x.className = 'ghostbtn realDel'; x.textContent = 'Remove'; x.addEventListener('click', e => { if (x.dataset.sure) del(); else { x.dataset.sure = '1'; x.textContent = 'Tap again to remove'; } }); d.appendChild(x); } box.appendChild(d); };
    const curCode = this.cur && this.cur.K ? this.cur.K.code : null;
    for (const e of L) row(e.name || 'Real road', e.kind, e.km || e.len / 1000, false, () => this.byCode(e.code), e.code === curCode, async () => { await RWDB.del('pack', e.code); this.render(); });
    for (const p of RW_PRESETS) row(p.name, p.kind, p.km, true, () => this.preset(p), this.cur && this.cur.preset === p.id, null);
    const K = this.cur && this.cur.K, lp = $('#realLapsRow'); if (lp) lp.hidden = !(K && K.kind === 'loop'); if (K) for (const n of [1, 2, 3, 5, 10]) { const bt = $('#real_lp_' + n); if (bt) bt.setAttribute('aria-pressed', K.laps === n ? 'true' : 'false'); }
    { const sn = $('#realSnow'); if (sn) sn.setAttribute('aria-pressed', this.opt.snow ? 'true' : 'false'); }
    for (const id of ['#realExport', '#realCopy', '#realEdit']) { const e = $(id); if (e) e.disabled = !K; }
    { const e = $('#realEdit'); if (e) e.hidden = rwOffline(); const n = $('#realNew'); if (n) n.hidden = rwOffline(); }
    // (in the Claude artifact a page can hand over no file and its links lead nowhere: no saving the course or copying its link there)
    for (const id of ['#realExport', '#realCopy']) { const e = $(id); if (e) e.hidden = !!window.SR86_ARTIFACT; }
    if (K) { const e = $('#realNote'); if (e) { e.textContent = ''; const b = document.createElement('b'); b.textContent = K.name || 'Real road'; e.append(b, ' · '); const k = document.createElement('span'); k.textContent = RW_KIND[K.kind]; e.appendChild(k);
      if (K.kind === 'loop') { const l = document.createElement('span'); l.textContent = K.laps === 1 ? `1 lap of ${rwKm(K).toFixed(2)} km` : `${K.laps} laps of ${rwKm(K).toFixed(2)} km`; e.append(' · ', l); } } }
    $('#go').textContent = K ? 'Start stage' : 'Make a course';
  },
  // a course kept: its pack, gzipped, under its code
  async keep(K, txt) { const blob = await rwGzip(txt || rwPackOut(K)); await RWDB.put('pack', K.code, { name: K.name, kind: K.kind, laps: K.laps, len: K.len, km: rwKm(K), made: K.made || Date.now(), wp: K.wp, gz: blob }); },
  async byCode(code) { const e = await RWDB.get('pack', code); if (!e || !e.gz) { const p = RW_PRESETS.find(q => q.id === code); if (p) return this.preset(p); return false; }
    try { const K = rwPackIn(await rwGunzip(await e.gz.arrayBuffer())); K.laps = e.laps || K.laps; this.use({ K, own: true }); return true; } catch (err) { return false; } },
  async preset(p) { if (this.busy) return; this.busy = true; this.say(`Opening ${p.name}…`);
    try { const r = await fetch(p.file); if (!r.ok) throw new Error('no'); const K = rwPackIn(await rwGunzip(await r.arrayBuffer())); K.name = p.name; this.use({ K, preset: p.id }); lsSet('sr86.realLast', p.id); return true; }
    catch (e) { this.say(`${p.name} could not be opened here.`); return false; } finally { this.busy = false; } },
  // the course made the stage (behind the menu)
  use(c) { this.cur = c; const K = c.K; busyThen(() => { try { const T = rwStageOf(K, { snow: this.opt.snow }); rwUseStage(T); if (!c.preset) lsSet('sr86.realLast', K.code); writeHash(); } catch (e) { this.say('This course could not be laid out.'); } this.render(); }); },
  async save() { const K = this.cur && this.cur.K; if (!K) return; const blob = await rwGzip(rwPackOut(K)), a = document.createElement('a'), nm = (K.name || 'course').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'course';
    try { a.href = URL.createObjectURL(blob); a.download = nm + '.sr86course'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); } catch (e) { this.say('Saving a file is not possible here.'); } },
  copy(btn) { const K = this.cur && this.cur.K; if (!K) return; const url = location.origin + location.pathname + '#real=' + K.code; const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = t, 1600); };
    try { navigator.clipboard.writeText(url).then(done, () => { prompt('Course link', url); }); } catch (e) { prompt('Course link', url); } }
};
// (the menu's parts a real course has no use for: the seed, rolling and the week's stage, the first stage's note)
function rwMenuBits() { const L = []; const p = document.querySelector('#stageSetup .plate'); if (p) L.push(p); for (const id of ['#rnd', '#weekBtn']) { const e = $(id); if (e && e.parentElement) L.push(e.parentElement); } return L; }
// (the page cannot reach the map's servers: an artifact's page; the website can)
function rwOffline() { return !!(window.SR86_ARTIFACT || /claudeusercontent|claude\.ai/.test(location.host)); }
// ---- the map ----
const RWMap = {
  el: null, cv: null, g: null, z: 12, cx: 0, cy: 0, T: new Map(), wp: [], kind: 'p2p', laps: 3, R: null, rq: 0, drag: null, ptr: new Map(), name: '',
  // (a place on the map in pixels at zoom z, from the top left of the world, and back)
  px(lat, lon, z) { const [x, y] = rwTileXY(z, lat, lon); return [x * 256, y * 256]; },
  ll(x, y, z) { return rwTileLL(z, x / 256, y / 256); },
  build() {
    if (this.el) return; const d = document.createElement('div'); d.id = 'realMap'; d.hidden = true;
    d.innerHTML = `<div class="rmTop"><input id="rmFind" type="search" placeholder="Find a place" enterkeyhint="search" autocomplete="off" spellcheck="false"><button id="rmGo" class="ghostbtn" type="button">Find</button><button id="rmClose" class="ghostbtn" type="button">Close</button></div>
<div id="rmHits" class="rmHits" hidden></div><canvas id="rmCv"></canvas><div class="rmZoom"><button id="rmIn" type="button" aria-label="Zoom in">+</button><button id="rmOut" type="button" aria-label="Zoom out">−</button></div>
<div class="rmBar"><div class="assist" role="group"><button id="rmK_p2p" type="button">Point to point</button><button id="rmK_rt" type="button">There and back</button><button id="rmK_loop" type="button">Circuit</button></div>
<div class="assist" id="rmLaps" role="group"><span>Laps</span><button id="rmL_1" type="button">1</button><button id="rmL_2" type="button">2</button><button id="rmL_3" type="button">3</button><button id="rmL_5" type="button">5</button><button id="rmL_10" type="button">10</button></div>
<p id="rmSay" class="small">Tap the map where the course starts, then where it goes: each point is put on the nearest road.</p>
<div class="row"><button id="rmUndo" class="ghostbtn" type="button">Take away the last point</button><button id="rmClear" class="ghostbtn" type="button">Start again</button><button id="rmBuild" class="go" type="button">Build the course</button></div>
<div id="rmProg" class="rmProg" hidden><i></i></div><p class="rmAttr"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">Map: © OpenStreetMap contributors. Heights: Mapterhorn, AWS Terrain Tiles.</a></p></div>`;
    document.body.appendChild(d); this.el = d; this.cv = d.querySelector('#rmCv'); this.g = this.cv.getContext('2d');
    const on = (id, f) => d.querySelector(id).addEventListener('click', f);
    on('#rmClose', () => this.close()); on('#rmIn', () => this.zoomBy(1)); on('#rmOut', () => this.zoomBy(-1)); on('#rmGo', () => this.find()); on('#rmUndo', () => { this.wp.pop(); this.changed(); }); on('#rmClear', () => { this.wp = []; this.changed(); }); on('#rmBuild', () => this.make());
    for (const k of ['p2p', 'rt', 'loop']) on('#rmK_' + k, () => { this.kind = k; this.changed(); }); for (const n of [1, 2, 3, 5, 10]) on('#rmL_' + n, () => { this.laps = n; this.bar(); });
    d.querySelector('#rmFind').addEventListener('keydown', e => { if (e.key === 'Enter') this.find(); });
    const cv = this.cv; cv.addEventListener('pointerdown', e => this.down(e)); cv.addEventListener('pointermove', e => this.move(e)); cv.addEventListener('pointerup', e => this.up(e)); cv.addEventListener('pointercancel', e => this.up(e, true));
    cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoomAt(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    window.addEventListener('resize', () => { if (!this.el.hidden) this.draw(); });
    const st = document.createElement('style'); st.textContent = `#realMap{position:fixed;inset:0;z-index:60;background:#0d0f12;display:flex;flex-direction:column;color:#eee}#realMap[hidden]{display:none}#rmCv{flex:1;min-height:0;width:100%;touch-action:none;cursor:crosshair;display:block}
.rmTop{display:flex;gap:6px;padding:8px}.rmTop input{flex:1;min-width:0;font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #444;background:#181b20;color:#eee}.rmHits{position:absolute;top:52px;left:8px;right:8px;z-index:2;background:#181b20;border:1px solid #444;border-radius:8px;max-height:40vh;overflow:auto}.rmHits button{display:block;width:100%;text-align:left;padding:8px 10px;background:none;border:0;color:#eee;font:inherit;border-bottom:1px solid #2a2e35}
.rmZoom{position:absolute;right:10px;top:60px;display:flex;flex-direction:column;gap:4px}.rmZoom button{width:38px;height:38px;font-size:20px;border-radius:8px;border:1px solid #555;background:#181b20;color:#eee}.rmBar{padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:#14171b;border-top:1px solid #2a2e35}.rmBar .assist{margin:4px 0;flex-wrap:wrap}.rmBar .assist span{margin-right:6px;opacity:.8}.rmBar .row{margin-top:6px}
#realMap button{color:#eee;background:#20242a;border:1px solid #4a4f57;border-radius:8px;padding:8px 12px;font:inherit;flex:0 0 auto;width:auto;min-width:0;cursor:pointer}#realMap button:disabled{opacity:.5}#realMap button[aria-pressed="true"]{background:#e0a400;color:#111;border-color:#e0a400}#realMap button.go{background:#e0a400;color:#111;font-weight:700;border-color:#e0a400;margin-left:auto}
.rmBar .row,.rmBar .assist{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.rmBar p{margin:6px 0}.rmTop button{white-space:nowrap}
.rmProg{height:6px;background:#2a2e35;border-radius:3px;overflow:hidden;margin:6px 0}.rmProg i{display:block;height:100%;width:0;background:#e0a400;transition:width .2s}.rmAttr{font-size:11px;opacity:.7;margin:4px 0 0}.rmAttr a{color:inherit}
#realList{display:flex;flex-direction:column;gap:6px;margin:8px 0}.realRow{display:flex;gap:6px;align-items:stretch}.realPick{flex:1;text-align:left;padding:8px 10px;border-radius:10px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.08);color:inherit;font:inherit;display:flex;flex-direction:column;gap:2px}.realRow.on .realPick{border-color:#e0a400;background:rgba(224,164,0,.12)}.realPick small{opacity:.75}.realDel{flex:none}`;
    document.head.appendChild(st);
  },
  open(c) { this.build(); this.el.hidden = false; if (c && c.wp && c.wp.length) { this.wp = c.wp.map(p => p.slice()); this.kind = c.kind || 'p2p'; this.laps = c.laps || 3; this.name = c.name || ''; const b = this.bbox(this.wp); this.fit(b); }
    else if (!this.cx) { const T = G.T, K = T && T.real; if (K) this.fit(this.bbox(K.wp)); else { this.z = 5; const [x, y] = this.px(46, 8, 5); this.cx = x; this.cy = y; } }
    this.R = null; this.changed(true); this.draw(); },
  close() { if (this.el) this.el.hidden = true; this.busy = false; },
  bbox(L) { let s = 90, w = 180, n = -90, e = -180; for (const p of L) { s = Math.min(s, p[0]); n = Math.max(n, p[0]); w = Math.min(w, p[1]); e = Math.max(e, p[1]); } return [s, w, n, e]; },
  fit(b) { const W = this.cv.clientWidth || 800, H = this.cv.clientHeight || 500; for (let z = 17; z >= 3; z--) { const [x0, y0] = this.px(b[2], b[1], z), [x1, y1] = this.px(b[0], b[3], z); if (x1 - x0 < W * 0.8 && y1 - y0 < H * 0.8) { this.z = z; this.cx = (x0 + x1) / 2; this.cy = (y0 + y1) / 2; return; } } },
  zoomBy(d) { const W = this.cv.clientWidth, H = this.cv.clientHeight; this.zoomAt(d, W / 2, H / 2); },
  zoomAt(d, sx, sy) { const z2 = clamp(this.z + d, 3, 18); if (z2 === this.z) return; const W = this.cv.clientWidth, H = this.cv.clientHeight, wx = this.cx + sx - W / 2, wy = this.cy + sy - H / 2, f = 2 ** (z2 - this.z); this.cx = wx * f - (sx - W / 2); this.cy = wy * f - (sy - H / 2); this.z = z2; this.draw(); },
  // (pointers: one drags the map or a point, a tap adds a point or takes one away; two pinch the zoom)
  hit(sx, sy) { const W = this.cv.clientWidth, H = this.cv.clientHeight; for (let k = this.wp.length - 1; k >= 0; k--) { const [x, y] = this.px(this.wp[k][0], this.wp[k][1], this.z); if (Math.hypot(x - this.cx + W / 2 - sx, y - this.cy + H / 2 - sy) < 16) return k; } return -1; },
  down(e) { const r = this.cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; this.cv.setPointerCapture(e.pointerId); this.ptr.set(e.pointerId, [sx, sy]);
    if (this.ptr.size === 2) { const [a, b] = [...this.ptr.values()]; this.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: this.z }; this.drag = null; return; }
    this.drag = { sx, sy, cx: this.cx, cy: this.cy, k: this.hit(sx, sy), moved: false }; },
  move(e) { if (!this.ptr.has(e.pointerId)) return; const r = this.cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; this.ptr.set(e.pointerId, [sx, sy]);
    if (this.pinch && this.ptr.size === 2) { const [a, b] = [...this.ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), want = Math.round(this.pinch.z + Math.log2(d / this.pinch.d)); if (want !== this.z) this.zoomAt(want - this.z, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return; }
    const D = this.drag; if (!D) return; if (Math.hypot(sx - D.sx, sy - D.sy) > 5) D.moved = true; if (!D.moved) return;
    if (D.k >= 0) { const W = this.cv.clientWidth, H = this.cv.clientHeight; this.wp[D.k] = this.ll(this.cx - W / 2 + sx, this.cy - H / 2 + sy, this.z); this.draw(); } else { this.cx = D.cx - (sx - D.sx); this.cy = D.cy - (sy - D.sy); this.draw(); } },
  up(e, cancel) { this.ptr.delete(e.pointerId); if (this.ptr.size < 2) this.pinch = null; const D = this.drag; this.drag = null; if (!D || cancel) return;
    if (D.moved) { if (D.k >= 0) this.changed(); return; }
    if (D.k >= 0) { this.wp.splice(D.k, 1); this.changed(); return; }
    const W = this.cv.clientWidth, H = this.cv.clientHeight; if (this.wp.length >= 40) return; this.wp.push(this.ll(this.cx - W / 2 + D.sx, this.cy - H / 2 + D.sy, this.z)); this.changed(); },
  // the route found afresh once the points have been still for a moment
  changed(now) { this.bar(); this.draw(); clearTimeout(this.tm); const need = this.kind === 'loop' ? 3 : 2; if (this.wp.length < need) { this.R = null; this.say(this.wp.length ? (this.kind === 'loop' ? 'A circuit needs three points or more, round it in order.' : 'Now tap where it goes next.') : 'Tap the map where the course starts, then where it goes: each point is put on the nearest road.'); this.draw(); return; }
    if (this.z < 11) { this.say('Zoom in to put points on the roads.'); }
    this.tm = setTimeout(() => this.route(), now ? 0 : 600); },
  async route() { const id = ++this.rq, wp = this.wp.map(p => p.slice()), kind = this.kind; this.say('Finding the roads…');
    try { const R = await RWRoute.plan(wp, kind, f => { if (id === this.rq) this.prog(f); }); if (id !== this.rq) return; this.prog(null);
      let len = 0; for (let k = R.a + 1; k <= R.b; k++) len += RWRoute.dist(R.pl[k - 1][0], R.pl[k - 1][1], R.pl[k][0], R.pl[k][1]);
      this.R = R; this.len = len; this.say(kind === 'rt' ? `${(len / 1000).toFixed(2)} km of real roads each way, ${(len * 2 / 1000).toFixed(2)} km in all.` : kind === 'loop' ? `${(len / 1000).toFixed(2)} km of real roads a lap.` : `${(len / 1000).toFixed(2)} km of real roads.`); this.draw();
    } catch (e) { if (id !== this.rq) return; this.prog(null); this.R = null; const m = e && e.message;
      this.say(m === 'nosnap' ? `No road the course can use near point ${e.at + 1}.` : m === 'noroute' ? `No way along the roads between points ${e.at + 1} and ${(e.at + 1) % wp.length + 1}.` : 'The map could not be reached just now. Try again in a little while.'); this.draw(); } },
  say(t) { const e = this.el && this.el.querySelector('#rmSay'); if (e) e.textContent = t; },
  prog(f) { const e = this.el.querySelector('#rmProg'); e.hidden = f == null; if (f != null) e.firstChild.style.width = Math.round(f * 100) + '%'; },
  bar() { if (!this.el) return; for (const k of ['p2p', 'rt', 'loop']) this.el.querySelector('#rmK_' + k).setAttribute('aria-pressed', this.kind === k ? 'true' : 'false'); this.el.querySelector('#rmLaps').hidden = this.kind !== 'loop';
    for (const n of [1, 2, 3, 5, 10]) this.el.querySelector('#rmL_' + n).setAttribute('aria-pressed', this.laps === n ? 'true' : 'false'); },
  async find() { const q = this.el.querySelector('#rmFind').value.trim(), box = this.el.querySelector('#rmHits'); if (!q) return; box.hidden = false; box.textContent = 'Searching…';
    try { const L = await RWNet.search(q, I18N && I18N.lang); box.textContent = ''; if (!L.length) { box.textContent = 'Nothing found by that name.'; return; }
      for (const p of L) { const b = document.createElement('button'); b.type = 'button'; b.textContent = p.name; b.addEventListener('click', () => { box.hidden = true; if (p.bb) this.fit([p.bb[0], p.bb[2], p.bb[1], p.bb[3]]); else { this.z = 14; const [x, y] = this.px(p.lat, p.lon, 14); this.cx = x; this.cy = y; } this.z = Math.max(this.z, 12); const [x, y] = this.px(p.lat, p.lon, this.z); this.cx = x; this.cy = y; this.draw(); }); box.appendChild(b); }
    } catch (e) { box.textContent = 'The search could not be reached just now.'; } },
  // the tiles, the route, the points
  draw() { const cv = this.cv, dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return; if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = this.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#1a1d21'; g.fillRect(0, 0, W, H); const z = this.z, n = 2 ** z, x0 = this.cx - W / 2, y0 = this.cy - H / 2;
    for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++) for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++) { if (ty < 0 || ty >= n) continue; const wx = ((tx % n) + n) % n, key = z + '/' + wx + '/' + ty; let im = this.T.get(key);
      if (!im) { im = new Image(); im.onload = () => this.draw(); im.src = `https://tile.openstreetmap.org/${key}.png`; this.T.set(key, im); if (this.T.size > 400) { const k0 = this.T.keys().next().value; this.T.delete(k0); } }
      if (im.complete && im.naturalWidth) g.drawImage(im, tx * 256 - x0, ty * 256 - y0, 256, 256); }
    const P = (la, lo) => { const [x, y] = this.px(la, lo, z); return [x - x0, y - y0]; };
    if (this.R) { const R = this.R; g.lineCap = 'round'; g.lineJoin = 'round'; for (const [w, c] of [[9, 'rgba(0,0,0,.55)'], [5, '#e0a400']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); R.pl.forEach((p, k) => { const [x, y] = P(p[0], p[1]); if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.setLineDash([4, 6]); g.beginPath(); R.pl.forEach((p, k) => { if (k > R.a && k <= R.b) return; const [x, y] = P(p[0], p[1]); g.moveTo(x, y); const q = R.pl[Math.min(R.pl.length - 1, k + 1)]; const [x2, y2] = P(q[0], q[1]); if (k < R.a || k >= R.b) g.lineTo(x2, y2); }); g.stroke(); g.setLineDash([]); }
    this.wp.forEach((p, k) => { const [x, y] = P(p[0], p[1]), first = k === 0, last = k === this.wp.length - 1 && this.kind !== 'loop' && k > 0; g.fillStyle = first ? '#3f9a4b' : last ? '#fbfbf8' : '#e0a400'; g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, first || last ? 10 : 8, 0, 7); g.fill(); g.stroke();
      g.fillStyle = first ? '#fff' : '#111'; g.font = 'bold 11px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(first ? 'S' : last ? (this.kind === 'rt' ? 'T' : 'F') : String(k + 1), x, y + 0.5); }); },
  // the course built: the map round it fetched, the land's heights, all of it kept, and made the stage
  async make() { if (this.busy) return; if (!this.R) { this.say(this.wp.length < 2 ? 'Put the course’s points on the map first.' : 'Wait for the route to be found.'); return; }
    this.busy = true; const btn = this.el.querySelector('#rmBuild'); btn.disabled = true; const stage = { route: 'Finding the roads', map: 'Fetching the map round the course', land: 'Fetching the land’s heights' }, share = { route: [0, 0.15], map: [0.15, 0.55], land: [0.55, 1] };
    try { const K = await rwBuildPack({ wp: this.wp.map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]), kind: this.kind, laps: this.laps, name: this.name || '' }, (k, f) => { const s = share[k] || [0, 1]; this.prog(s[0] + (s[1] - s[0]) * f); this.say(`${stage[k] || 'Building'}… ${Math.round((s[0] + (s[1] - s[0]) * f) * 100)}%`); }, I18N && I18N.lang);
      this.say('Laying the course out…'); await RealUI.keep(K); this.prog(null); this.close(); RealUI.use({ K, own: true });
    } catch (e) { this.prog(null); const m = e && e.message; this.say(m === 'long' ? 'That course is too long: keep it under 60 km.' : m === 'noland' ? 'No heights for the land there could be fetched.' : m === 'nosnap' || m === 'noroute' ? 'The route could not be found again: move a point.' : 'The map could not be reached just now. Try again in a little while.'); }
    finally { this.busy = false; btn.disabled = false; } }
};
