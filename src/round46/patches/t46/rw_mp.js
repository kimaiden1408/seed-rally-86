// ==== ROUND 46: REAL ROADS IN RACE FRIENDS ====
// The host picks a real course and every driver races the same one. One of the game's own courses comes from its own
// file, the same on every page of this version. A course the host made goes from page to page: each driver's page
// asks the host's for it over the race server's signals (the website's; an artifact's room has none, so there a
// driver needs the same course already kept, or the course file), in pieces of 15,000 characters (a signal may be 16 KB),
// at most 25 pieces a second from any one page (well within the 60 messages a second the race server lets a page send),
// then checks the whole against the host's own figure for it (a hash of its text) before laying the stage out from it,
// and keeps it. The pieces are asked for a dozen at a time, the next dozen when half of those are in, so they keep
// coming; a page answering sends each piece once to each driver asking (a request repeated restarts it from there).
// Any page that has the course answers for it, so a host who leaves hands it on with the race.
const MPRW = {
  K: new Map(),          // (the courses to hand, by preset id or hash)
  out: new Map(),        // (the courses this page can send: hash -> { b64, n })
  get: null,             // (the one being fetched: { h, rw, parts, n, next, asked, at, tries, from })
  q: [], qT: null, off: null, mp: null,
  hi: new Map(),         // (for each driver asking, and course: the last piece queued for them)
  lost: '', lostAt: 0,   // (a course this page could not get: looked for again every ten seconds)
  CH: 15000, WIN: 12, RATE: 25,
  keyOf(rw) { return rw ? rw.p || rw.h || '' : ''; },
  say(t) { const e = $('#mpRwNote'); if (e) { e.textContent = t || ''; e.hidden = !t; } },
  hashOf(txt) { return (strHash(txt) >>> 0).toString(16).padStart(8, '0'); },
  // (a host's choice, as checkCfg keeps it: one of the game's courses, or one by its code, hash, name, kind and size)
  check(rw) {
    if (!rw || typeof rw !== 'object') return null; const s = rw.s ? 1 : 0;
    if (typeof rw.p === 'string') return RW_PRESETS.some(q => q.id === rw.p) ? { p: rw.p, s } : null;
    if (typeof rw.c !== 'string' || !/^[0-9a-z]{6,64}$/.test(rw.c) || typeof rw.h !== 'string' || !/^[0-9a-f]{8}$/.test(rw.h)) return null;
    const k = ['p2p', 'rt', 'loop'].includes(rw.k) ? rw.k : 'p2p', n = typeof rw.n === 'string' ? rw.n.slice(0, 40) : '', z = Math.max(0, Math.min(16e6, +rw.z || 0));
    return { c: rw.c, h: rw.h, n, k, z, s };
  },
  kindOf(rw) { if (!rw) return ''; if (rw.p) { const P = RW_PRESETS.find(q => q.id === rw.p); return P ? P.kind : ''; } return rw.k || 'p2p'; },
  stageKey(c) { return 'rw|' + this.keyOf(c.rw) + '|' + (this.kindOf(c.rw) === 'loop' ? c.lp : 0) + '|' + (c.rw && c.rw.s ? 1 : 0); },
  ready(c) { return !!(G.T && G.T.real && G.T.mpKey === this.stageKey(c)); },
  // the stage behind the menu: this race's course, laid out when this page has it (else fetched, and laid out then)
  stage(mp, c) {
    const key = this.stageKey(c); if (mp.stageKey === key && G.T && G.T.mpKey === key) return true;
    const K = this.K.get(this.keyOf(c.rw)); if (!K) { this.fetch(mp, c.rw); return false; }
    if (K.kind === 'loop') K.laps = clamp(c.lp || K.laps || 3, 1, 50);
    const T = rwStageOf(K, { snow: !!c.rw.s }); T.mpKey = key; T.label = K.name || 'Real road';
    G.T = T; rwBuild(T); G.fly = 0; if (Skids.geo) Skids.clear(); mp.stageKey = key; this.lost = ''; this.say(''); return true;
  },
  // a course this page has not got: one of the game's from its file; one kept on this page with the same text; else
  // asked of the host's page (where the race server carries signals)
  async fetch(mp, rw) {
    const key = this.keyOf(rw); if (!key || this.busy === key) return; this.busy = key;
    try {
      if (rw.p) { const P = RW_PRESETS.find(q => q.id === rw.p), r = await fetch(P.file); if (!r.ok) throw new Error('no'); const K = rwPackIn(await rwGunzip(await r.arrayBuffer())); K.name = I18N.say(P.name); this.K.set(key, K); mp.stageSoon(); return; }
      const e = await RWDB.get('pack', rw.c);
      if (e && e.gz) { const buf = await e.gz.arrayBuffer(), txt = await rwGunzip(buf); if (this.hashOf(txt) === rw.h) { const K = rwPackIn(txt); this.K.set(key, K); this.serve(rw.h, new Uint8Array(buf)); mp.stageSoon(); return; } }
      if (!mp.game || !mp.game.signal) { this.lose(mp, key); this.say(I18N.say('This race is on a course this page has not got: open its course file, or join the race from the game’s website.')); return; }
      if (!this.get || this.get.h !== rw.h) { this.get = { h: rw.h, rw, parts: [], n: 0, next: 0, asked: 0, at: Date.now(), tries: 0, from: mp.hostPeer }; this.ask(mp, true); }
    } catch (err) { this.lose(mp, key); this.say(I18N.say('{0} could not be opened here.', rw.n || rw.p || '')); }
    finally { if (this.busy === key) this.busy = null; }
  },
  lose(mp, key) { if (this.lost !== key) { this.lost = key; this.lostAt = Date.now(); mp.renderSoon(); } },
  // (the next dozen pieces asked for, from the first one missing; again: the pieces stopped coming, so the page
  // answering starts again from there)
  ask(mp, again) { const g = this.get; if (!g || !mp.game || !mp.game.signal) return;
    // (of the driver asked before while still in the room; else of the host, or of whoever is there)
    const D = mp.drivers().filter(p => !p.sameTab && mp.fresh(p)).map(p => p.peer), ok = x => !!x && x !== mp.my && D.includes(x);
    if (!ok(g.from)) g.from = ok(mp.hostPeer) ? mp.hostPeer : D[0] || null; const to = g.from; if (!to) return;
    g.at = Date.now(); g.asked = g.next + this.WIN; try { mp.game.signal.send(to, { k: 'rwq', h: g.h, i: g.next, j: g.asked, r: again ? 1 : 0 }); } catch (e) { } },
  // (a course this page can send: its stored bytes as text, in pieces)
  serve(h, u8) { if (this.out.has(h)) return; const b64 = rwB64(u8); this.out.set(h, { b64, n: Math.ceil(b64.length / this.CH) }); },
  // the signals: a request answered with the pieces asked for that this page has not yet queued for that driver (all
  // of them, from the first asked for, when asked again); a piece kept, the next dozen asked for when half of the last
  // are in, and the whole checked and laid out when all are
  sig(mp, from, d) {
    if (!d || typeof d !== 'object' || typeof d.h !== 'string') return;
    if (d.k === 'rwq') { const O = this.out.get(d.h), i0 = d.i | 0; if (!O || i0 < 0 || i0 >= O.n) return;
      const key = from + '|' + d.h, j = Math.min(O.n, i0 + 2 * this.WIN, Math.max(i0 + 1, (d.j | 0) || i0 + this.WIN)); let hi = this.hi.get(key);
      if (d.r || hi == null) { this.q = this.q.filter(m => m.to !== from || m.h !== d.h); hi = i0 - 1; }
      for (let i = Math.max(i0, hi + 1); i < j; i++) this.q.push({ to: from, h: d.h, i });
      this.hi.set(key, Math.max(hi, j - 1)); this.pump(mp); return; }
    if (d.k === 'rwc') { const g = this.get; if (!g || g.h !== d.h || typeof d.d !== 'string' || d.d.length > this.CH || !(d.n > 0 && d.n < 2000) || (g.n && d.n !== g.n)) return; const i = d.i | 0; if (i < 0 || i >= d.n) return;
      g.n = d.n; if (g.parts[i] == null) g.parts[i] = d.d; g.at = Date.now();
      while (g.next < g.n && g.parts[g.next] != null) g.next++;
      if (g.next >= g.n) { this.done(mp, g); return; }
      if (g.asked - g.next <= this.WIN / 2) this.ask(mp, false);
      this.say(I18N.say('Getting the course from the host… {0}%', Math.round(100 * g.next / g.n))); }
  },
  // (the queue sent 25 pieces a second on average, however often the page's timers come round)
  pump(mp) { if (this.qT) return; let last = performance.now(), tok = 1;
    this.qT = setInterval(() => { const now = performance.now(); tok = Math.min(3, tok + (now - last) * this.RATE / 1000); last = now;
      while (tok >= 1) { const m = this.q.shift(); if (!m) { clearInterval(this.qT); this.qT = null; return; } tok -= 1; const O = this.out.get(m.h); if (!O || !mp.game || !mp.game.signal) continue;
        try { mp.game.signal.send(m.to, { k: 'rwc', h: m.h, i: m.i, n: O.n, d: O.b64.slice(m.i * this.CH, (m.i + 1) * this.CH) }); } catch (e) { } } }, 40); },
  async done(mp, g) { this.get = null;
    try { const u8 = rwUnB64(g.parts.join('')), txt = await rwGunzip(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)); if (this.hashOf(txt) !== g.h) throw new Error('hash');
      const K = rwPackIn(txt); this.K.set(g.h, K); this.serve(g.h, u8);
      // (kept on this page as the host's: unless it keeps a course of the same code of its own)
      try { const had = await RWDB.get('pack', K.code); if (!had) await RealUI.keep(K, txt); } catch (e) { }
      this.say(''); mp.stageSoon(); }
    catch (err) { this.lose(mp, g.h); this.say(I18N.say('{0} could not be opened here.', g.rw.n || '')); }
  },
  // (once a second: a fetch gone quiet for three seconds asked again, of another driver after three tries; a course
  // this page could not get looked for again every ten seconds, kept here since, or its file reachable again)
  idle(mp) { const g = this.get;
    if (this.lost && !g && mp.cfg && mp.cfg.co === 'rw' && this.keyOf(mp.cfg.rw) === this.lost && Date.now() - this.lostAt > 10000) { this.lostAt = Date.now(); mp.stageSoon(); }
    if (!g || Date.now() - g.at < 3000) return; g.tries++;
    if (g.tries % 3 === 0) { const D = mp.drivers().filter(p => !p.sameTab && mp.fresh(p) && p.peer !== g.from); if (D.length) g.from = D[g.tries % D.length].peer; }
    this.ask(mp, true); },
  attach(mp, g) { this.detach(); this.mp = mp; if (g && g.signal && g.signal.on) this.off = g.signal.on((from, d) => this.sig(mp, from, d)); this.iT = setInterval(() => this.idle(mp), 1000); },
  detach() { if (this.off) try { this.off(); } catch (e) { } this.off = null; clearInterval(this.iT); this.iT = null; clearInterval(this.qT); this.qT = null; this.get = null; this.q.length = 0; this.hi.clear(); this.lost = ''; },
  // the host's list: the game's own courses, then this page's kept ones
  async options() { const out = RW_PRESETS.map(p => ({ v: 'p:' + p.id, t: `${I18N.say(p.name)} · ${I18N.say(RW_KIND[p.kind])} · ${p.km.toFixed(1)} km`, kind: p.kind })); try { for (const e of await RealUI.list()) out.push({ v: 'c:' + e.code, t: `${e.name || I18N.say('Real road')} · ${I18N.say(RW_KIND[e.kind] || 'Real road')} · ${(e.km || e.len / 1000 || 0).toFixed(1)} km`, kind: e.kind }); } catch (e) { } return out; },
  // the host picks: one of the game's, or a kept one (its text hashed, ready to send)
  async pick(mp, v) {
    if (!mp.host) return; if (v.startsWith('p:')) { mp.setCfg({ co: 'rw', rw: { p: v.slice(2), s: 0 } }); return; }
    const code = v.slice(2), e = await RWDB.get('pack', code); if (!e || !e.gz) return; const buf = await e.gz.arrayBuffer(), txt = await rwGunzip(buf), h = this.hashOf(txt), K = rwPackIn(txt);
    this.K.set(h, K); this.serve(h, new Uint8Array(buf)); mp.setCfg({ co: 'rw', rw: { c: K.code, h, n: String(K.name || '').slice(0, 40), k: K.kind, z: buf.byteLength, s: 0 } });
  }
};
