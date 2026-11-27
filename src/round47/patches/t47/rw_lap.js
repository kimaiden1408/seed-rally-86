// ==== ROUND 47: A CIRCUIT'S LAPS, TIMED AS RACING SIMS TIME THEM ====
// On a real circuit each lap is cut into three sectors by two timing lines a third of a lap apart, and its end is a
// third line (the last lap's end is the finish). The car's time over each line is kept, on the run's clock with any
// penalty in (lt); from those times come its laps and sectors and its best of each, and, against the best lap so far
// point by point round the lap, a running delta as the lap goes. In a race with friends each page sends its own line
// times with its presence, and every page times the whole field from them as a sim's timing tower does: place,
// driver, lap, last lap, best lap and the gap to the leader, the gaps taken at the timing lines. The race's quickest
// lap and sectors are purple, a driver's own best green, one slower than that yellow.
const fmtL = t => { if (t == null || !isFinite(t)) return '–'; const ms = Math.round(t * 1000), m = Math.floor(ms / 60000), s = ms - m * 60000; return m + ':' + (s < 10000 ? '0' : '') + (s / 1000).toFixed(3); };
const fmtSec = t => t == null || !isFinite(t) ? '–' : t < 60 ? t.toFixed(3) : fmtL(t);
const fmtD3 = d => (d < 0 ? '−' : '+') + Math.abs(d).toFixed(3);
const RWLap = {
  on: false, T: null, laps: 0, M: 0, s0: 0, L: [], lt: [], tr: [], trL: -1, trO: -1, bestL: -1, ob: null, obT: null, recK: '', rec: null, popT: 0, css: false,
  // (the timing lines, as points of the run: each lap's two sector lines and its end, the last lap's end the finish)
  lines(T) { const R = T.rwRun, M = R.M, n = R.laps, s0 = T.startIdx, a = Math.round(M / 3), b = Math.round(2 * M / 3), L = [];
    for (let l = 0; l < n; l++) L.push(s0 + l * M + a, s0 + l * M + b, s0 + (l + 1) * M); L[L.length - 1] = T.finishIdx; return L; },
  // a run begins: timed by laps on a real circuit, as before on anything else
  start(T) {
    this.style(); const box = $('#lapBox'), st = $('#mpStand'); if (st) st.classList.remove('tower');
    this.on = !!(T && T.real && T.rwLaps > 0 && T.rwRun && T.rwRun.M > 30 && T.rwRun.laps > 0);
    if (box) box.hidden = !this.on;
    if (!this.on) { if (MP.phase === 'race') MP.pub({ lt: null }); return; }
    Object.assign(this, { T, laps: T.rwRun.laps, M: T.rwRun.M, s0: T.startIdx, L: this.lines(T), lt: [], tr: [], trL: -1, trO: -1, bestL: -1, ob: null, obT: null });
    this.recK = 'sr86.laprec.' + ((T.real && T.real.code) || T.seed); this.rec = lsGet(this.recK, null);
    if (box) { const w = (sel, k) => { const e = box.querySelector(sel); if (e) e.textContent = I18N.say(k); }; w('.lbL', 'Lap'); w('.lbLast', 'Last'); w('.lbBest', 'Best'); w('.lbTot', 'Total'); }
    if (MP.phase === 'race') MP.pub({ lt: [] });
  },
  now() { return G.finished ? G.finT : G.time + G.penalty; },
  // (when a driver's lap l began: the race's start, else the line that ended the lap before)
  lapStart(lt, l) { return l === 0 ? 0 : lt[3 * l - 1]; },
  // each frame of the run: the lines crossed since the last (a flashback takes back those it went back over), and the
  // lap's trace - its time at each point round it - for the running delta
  tick() {
    if (!this.on) return; const p = G.prog, t = this.now(), L = this.L;
    while (this.lt.length && p < L[this.lt.length - 1]) this.lt.pop();
    const k0 = this.lt.length; let k = k0; while (k < L.length && p >= L[k]) { this.lt.push(t); this.crossed(k); k++; }
    const l = clamp(Math.floor((p - this.s0) / this.M), 0, this.laps - 1), o = clamp(p - this.s0 - l * this.M, 0, this.M), t0 = this.lapStart(this.lt, l);
    if (t0 != null) { let A = this.tr[l]; if (!A) A = this.tr[l] = new Float32Array(this.M + 1).fill(NaN); const q0 = this.trL === l && o >= this.trO ? this.trO + 1 : o; for (let q = q0; q <= o; q++) A[q] = t - t0; this.trL = l; this.trO = o; }
    if (k > k0 && MP.phase === 'race') MP.pub({ lt: this.lt.map(x => Math.round(x * 1000) / 1000) });
  },
  // a driver's laps from its line times: each lap's three sectors and its time, as far as it has got
  lapsOf(lt) { const out = []; for (let l = 0; l < this.laps; l++) { const a = this.lapStart(lt, l); if (a == null) break; const s1 = lt[3 * l], s2 = lt[3 * l + 1], e = lt[3 * l + 2];
      out.push({ S: [s1 != null ? s1 - a : null, s1 != null && s2 != null ? s2 - s1 : null, s2 != null && e != null ? e - s2 : null], t: e != null ? e - a : null }); if (e == null) break; } return out; },
  bestOf(laps) { const b = { t: null, S: [null, null, null], l: -1 }; laps.forEach((x, l) => { if (x.t != null && (b.t == null || x.t < b.t)) { b.t = x.t; b.l = l; } for (let k = 0; k < 3; k++) if (x.S[k] != null && (b.S[k] == null || x.S[k] < b.S[k])) b.S[k] = x.S[k]; }); return b; },
  // (purple: the race's quickest; green: the driver's own best; yellow: slower than that)
  cls(v, pb, ob) { return v == null ? '' : ob != null && v <= ob + 5e-4 ? 'lp' : pb != null && v <= pb + 5e-4 ? 'lg' : 'ly'; },
  // (the race's bests: in a race with friends the whole field's, as the timing tower last found them; alone, the driver's)
  field() { return MP.phase === 'race' || MP.phase === 'done' ? this.ob : null; },
  // a line crossed: the sector or the lap called on the screen as a sim calls it, against the driver's own best before
  // it; in a race, with the place at that line
  crossed(j) {
    const lt = this.lt, l = Math.floor(j / 3), k = j % 3, my = this.lapsOf(lt), x = my[l]; if (!x) return;
    const prev = this.bestOf(my.slice(0, l)), mine = this.bestOf(my), ob = this.field() || mine;
    const obS = ob.S[k] != null ? Math.min(ob.S[k], mine.S[k]) : mine.S[k], obT = ob.t != null ? (mine.t != null ? Math.min(ob.t, mine.t) : ob.t) : mine.t;
    let pos = ''; if (MP.phase === 'race' && MP.F && MP.F.length > 1) { const rc = MP.rc || {}, me = MP.raceT(rc, MP.slot, lt[j]); let n = 1, of = 1; for (const f of MP.F) { if (f.me) continue; const o = this.ltOf(f.peer); if (o.length > j) { of++; if (MP.raceT(rc, f.k, o[j]) < me) n++; } } pos = ' · P' + n; }
    let txt, c;
    if (k < 2 || x.t == null) { const v = x.S[k], pv = prev.S[k]; c = this.cls(v, pv != null ? Math.min(pv, v) : v, obS); txt = 'S' + (k + 1) + '  ' + fmtSec(v) + (pv != null ? '  ' + fmtD3(v - pv) : '') + pos; }
    else { const v = x.t, pv = prev.t; c = this.cls(v, pv != null ? Math.min(pv, v) : v, obT);
      // (in a race: the race's quickest lap, or the driver's own best; alone, a lap better than the best before it)
      const tag = MP.phase === 'race' ? (c === 'lp' ? 'Fastest lap' : c === 'lg' && pv != null ? 'Personal best' : '') : pv != null && v < pv ? 'Personal best' : '';
      txt = I18N.say('Lap {0}', l + 1) + '  ' + fmtL(v) + (pv != null ? '  ' + fmtD3(v - pv) : '') + pos + (tag ? '\n' + I18N.say(tag) : '');
      if (pv == null || v < pv) this.bestL = l;
      if (!this.rec || v < this.rec.t) { this.rec = { t: v, car: G.spec ? G.spec.id : '', at: Date.now() }; lsSet(this.recK, this.rec); } }
    const el = $('#split'); if (el) { el.textContent = txt; el.className = 'on ' + c; clearTimeout(this.popT); this.popT = setTimeout(() => { if (el.textContent === txt) el.className = ''; }, k === 2 ? 4500 : 2600); }
  },
  // the run's clock, as a sim shows it: the lap's own time (the race's once it is over)
  timeTxt() { const lt = this.lt; if (lt.length >= this.L.length) return fmtT(this.now()); const l = Math.floor(lt.length / 3), t0 = this.lapStart(lt, l); return t0 == null ? fmtT(this.now()) : fmtL(this.now() - t0); },
  // each frame: the lap, the place, this lap's sectors, the last and best laps, the race's time, the driver's record on
  // this course, and the running delta to the best lap
  hud() {
    if (!this.on) return; const t = this.now(), lt = this.lt, n = lt.length, done = n >= this.L.length, my = this.lapsOf(lt), pb = this.bestOf(my), ob = this.field() || pb;
    const l = Math.min(this.laps - 1, Math.floor(n / 3)), cur = done ? my[this.laps - 1] : my[l];
    setText(hud$('#lapN'), done ? I18N.say('Finished') : (l + 1) + '/' + this.laps);
    for (let k = 0; k < 3; k++) { const v = cur ? cur.S[k] : null, e = hud$('#lapS' + (k + 1)), c = this.cls(v, pb.S[k], ob.S[k] != null && pb.S[k] != null ? Math.min(ob.S[k], pb.S[k]) : pb.S[k]); setText(e, 'S' + (k + 1) + ' ' + fmtSec(v)); if (e.className !== c) e.className = c; }
    const last = done ? my[this.laps - 1] : l > 0 ? my[l - 1] : null, lv = last ? last.t : null, obT = ob.t != null && pb.t != null ? Math.min(ob.t, pb.t) : pb.t, le = hud$('#lapLast'), be = hud$('#lapBest');
    setText(le, fmtL(lv)); { const c = this.cls(lv, pb.t, obT); if (le.className !== c) le.className = c; }
    setText(be, fmtL(pb.t)); { const c = pb.t != null && obT != null && pb.t <= obT + 5e-4 ? 'lp' : ''; if (be.className !== c) be.className = c; }
    setText(hud$('#lapTot'), fmtT(t));
    setText(hud$('#lapRec'), this.rec ? I18N.say('Record') + ' ' + fmtL(this.rec.t) : '');
    { const pe = hud$('#lapPos'); let s = ''; if ((MP.phase === 'race' || MP.phase === 'done') && MP.F && MP.F.length > 1) { const i = MP.F.findIndex(f => f.me); if (i >= 0) s = 'P' + (i + 1) + '/' + MP.F.length; } setText(pe, s); pe.hidden = !s; }
    const dEl = hud$('#delta'); let d = null;
    if (!done && this.bestL >= 0 && this.bestL !== l && this.tr[this.bestL]) { const t0 = this.lapStart(lt, l); if (t0 != null) { const b = this.tr[this.bestL][clamp(G.prog - this.s0 - l * this.M, 0, this.M)]; if (b === b) d = t - t0 - b; } }
    if (d == null) setText(dEl, ''); else { setText(dEl, fmtD(d)); const c = d < 0 ? 'neg' : 'pos'; if (dEl.className !== c) dEl.className = c; }
  },
  // (another driver's line times, as its page sent them: up to the first one missing)
  ltOf(peer) { const p = MP.peers.find(q => q.peer === peer), L = p && p.presence && p.presence.lt, out = []; if (Array.isArray(L)) for (const v of L.slice(0, this.L.length)) { const x = mpNum(v, 0, 1e6); if (x == null) break; out.push(x); } return out; },
  // the timing tower, in a race with friends (in place of the standings): each driver's place, name, lap, last lap,
  // best lap and gap - to the leader at the last line both have crossed, or laps behind, or between finishing times
  tower(mp) {
    const el = $('#mpStand'); if (!el) return; const F = mp.F || mp.field(), rc = mp.rc || mp.cfg || {}; el.classList.add('tower'); el.textContent = ''; el.hidden = !F.length; if (!F.length) return;
    const D = F.map(f => { const lt = f.me ? this.lt : this.ltOf(f.peer), laps = this.lapsOf(lt); return { f, lt, laps, pb: this.bestOf(laps) }; });
    const ob = { t: null, S: [null, null, null], who: null }; for (const d of D) { if (d.pb.t != null && (ob.t == null || d.pb.t < ob.t)) { ob.t = d.pb.t; ob.who = d.f; } for (let k = 0; k < 3; k++) if (d.pb.S[k] != null && (ob.S[k] == null || d.pb.S[k] < ob.S[k])) ob.S[k] = d.pb.S[k]; }
    // (a new quickest lap of the race, by another driver: said in the race's feed)
    if (ob.t != null && (this.obT == null || ob.t < this.obT - 5e-4)) { if (ob.who && !ob.who.me) mp.feedAdd(ob.who.name, I18N.say('Fastest lap') + ' ' + fmtL(ob.t), false); this.obT = ob.t; }
    this.ob = ob;
    const lead = D[0], lapOf = d => Math.min(this.laps, Math.floor(d.lt.length / 3) + 1);
    el.append(mel('div', { class: 'twh' }, mel('b', { text: I18N.say('Lap') + ' ' + lapOf(lead) + '/' + this.laps }), mel('i'), mel('span', { class: 'hl', text: I18N.say('Last') }), mel('span', { text: I18N.say('Best') }), mel('span', { text: I18N.say('Gap') })));
    D.forEach((d, i) => { const f = d.f, n = d.lt.length, fin = f.rt != null, lastLap = d.laps.filter(x => x.t != null).pop(), lv = lastLap ? lastLap.t : null; let gap = '';
      if (f.ph === 'out' && !fin) gap = I18N.say('race|out'); else if (f.ph === 'gone' && !fin) gap = I18N.say('race|left');
      else if (i === 0) gap = fin ? I18N.say('Finished') : I18N.say('Leader');
      else if (fin && lead.f.rt != null) gap = '+' + (f.rt - lead.f.rt).toFixed(3);
      else if (lead.lt.length - n >= 3) gap = '+' + Math.floor((lead.lt.length - n) / 3) + ' L';
      else if (n > 0 && lead.lt[n - 1] != null) gap = '+' + Math.max(0, mp.raceT(rc, f.k, d.lt[n - 1]) - mp.raceT(rc, lead.f.k, lead.lt[n - 1])).toFixed(3);
      else gap = '–';
      const row = mel('div', { class: 'twr' + (f.me ? ' me' : '') }, mel('b', { text: String(i + 1) }), mel('span', { class: 'nm', text: f.name }), mel('i', { text: fin ? '✓' : 'L' + lapOf(d) }),
        mel('span', { class: 'lt ' + this.cls(lv, d.pb.t, ob.t), text: fmtL(lv) }), mel('span', { class: 'bt' + (d.pb.t != null && ob.t != null && d.pb.t <= ob.t + 5e-4 ? ' lp' : ''), text: fmtL(d.pb.t) }), mel('small', { text: gap }));
      if (f.team >= 0) { row.style.setProperty('--tc', MP_TEAMS[f.team].col); row.classList.add('tm'); } el.append(row); });
  },
  // (the results: a driver's best lap, and whether it was the race's quickest)
  bestTxt(f) { if (!this.on) return ''; const lt = f.me ? this.lt : this.ltOf(f.peer), pb = this.bestOf(this.lapsOf(lt)); if (pb.t == null) return ''; const ob = this.ob;
    return I18N.say('Best lap {0}', fmtL(pb.t)) + (ob && ob.t != null && pb.t <= ob.t + 5e-4 ? ' · ' + I18N.say('Fastest lap') : ''); },
  // (the finish, alone on a circuit: every lap's time, the best marked)
  finLine() { const my = this.lapsOf(this.lt).filter(x => x.t != null); if (!my.length) return ''; const pb = this.bestOf(my);
    return I18N.say('Laps: {0}.', my.map(x => x.t === pb.t ? I18N.say('{0} (best)', fmtL(x.t)) : fmtL(x.t)).join(', ')); },
  style() {
    if (this.css) return; this.css = true; const st = document.createElement('style');
    st.textContent = `.lapbox{margin-top:6px;background:rgba(0,0,0,.45);border-radius:6px;padding:6px 8px;width:240px;max-width:calc(100vw - 24px);font-variant-numeric:tabular-nums;color:#fff}
.lapbox .lb1{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px;line-height:1.2}.lapbox .lb1 small{font-size:12px;font-weight:700;opacity:.8}
.lapbox #lapPos{margin-left:auto;background:#fff;color:#111;border-radius:4px;padding:0 6px;font-size:15px}
.lapbox .lsec{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin:5px 0 4px}.lapbox .lsec span{font-size:12px;font-weight:800;text-align:center;border-radius:3px;padding:2px 0;background:rgba(255,255,255,.16);white-space:nowrap;overflow:hidden}
.lapbox .lsec span.lp{background:#8f45f0}.lapbox .lsec span.lg{background:#1b9a52}.lapbox .lsec span.ly{background:#e3b400;color:#111}
.lapbox .lb2,.lapbox .lb3{display:flex;justify-content:space-between;gap:8px;font-size:14px;font-weight:700;line-height:1.35}.lapbox .lb3{font-size:12px;opacity:.85}.lapbox .lb2 b,.lapbox .lb3 b{font-weight:800}
.lapbox b.lp,.tower .lp{color:#c99bff}.lapbox b.lg,.tower .lg{color:#62e39d}.lapbox b.ly,.tower .ly{color:#ffd84a}
#split.lp{color:#c99bff}#split.lg{color:#62e39d}#split.ly{color:#ffd84a}
.mpstand.tower{min-width:290px;max-width:380px}
.tower .twh,.tower .twr{display:grid;grid-template-columns:16px minmax(0,1fr) 24px 64px 64px 60px;gap:6px;align-items:baseline}
.tower .twh{font-size:11px;font-weight:700;opacity:.8}.tower .twh b{grid-column:1/3;font-size:12px}.tower .twh span{text-align:right}
.tower .twr{font-size:13px;font-weight:700;line-height:1.3}.tower .twr .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tower .twr i{font-style:normal;font-size:12px;opacity:.8}
.tower .twr .lt,.tower .twr .bt,.tower .twr small{text-align:right;font-size:12px;white-space:nowrap}.tower .twr.me{color:var(--marshal)}.tower .twr.tm{border-left:3px solid var(--tc);padding-left:3px}
@media (max-width:700px){.lapbox{width:200px}.tower .twh,.tower .twr{grid-template-columns:14px minmax(0,1fr) 22px 60px 54px}.tower .twh .hl,.tower .twr .lt{display:none}.mpstand.tower{min-width:220px}}`;
    document.head.appendChild(st);
  }
};
