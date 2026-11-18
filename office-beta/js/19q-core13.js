'use strict';
/* Office game 1.3.0 (beta) — S0 foundation. No gameplay here, only plumbing:
   1) CG.Save   : one registry for all NEW save data. Everything new lives in save.ext (schema version: save.sv).
                  save.v stays 1 so older game versions can still read the save. Backup before first migration,
                  plus a side copy of ext so an older game overwriting the save cannot destroy new data.
   2) CG.ctr    : event counters (total + per day + per month, pruned).
   3) CG.Bus    : emit/on. All hooks into old code are in the ADAPTERS block at the bottom (one place).
   Everything is inside this closure: the only global added is CG. */
window.CG = window.CG || {};
(() => {
  const CG = window.CG, SV = 2;
  const KEY = () => SAVE_KEY, SIDE = () => SAVE_KEY + '.x', BAK = () => SAVE_KEY + '.bak1';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const clone = o => JSON.parse(JSON.stringify(o));
  const gday = () => Math.floor((gnow().getTime() - T0) / DAY);                  // game day index (0 = 1 Jan)
  const gym = () => { const g = gnow(); return g.getFullYear() * 12 + g.getMonth(); }; // game month index

  /* ================= 1) Save registry ================= */
  const mods = {}, Save = (CG.Save = { SV, mods, last: { from: null, restored: false, backup: null, migrated: false } });
  /* register('name', { def: () => fresh data, get: () => data to save, set: data => apply loaded data, backfill?: () => void }) */
  Save.register = (name, m) => { mods[name] = m; try { m.set(m.def()); } catch (e) { console.error('[save] register', name, e); } };
  Save.collect = () => { const ext = {}; for (const [n, m] of Object.entries(mods)) { try { ext[n] = clone(m.get()); } catch (e) { console.error('[save] collect', n, e); } } return ext; };
  const merge = (def, got) => (got && typeof got === 'object' && !Array.isArray(got) && def && typeof def === 'object' && !Array.isArray(def)) ? { ...def, ...got } : (got === undefined ? def : got);
  Save.apply = ext => {
    const bf = (ext && ext.bf) || {};
    for (const [n, m] of Object.entries(mods)) {
      try { m.set(merge(m.def(), ext ? ext[n] : undefined)); } catch (e) { console.error('[save] apply', n, e); }
    }
    for (const [n, m] of Object.entries(mods)) { // one-time backfill from data that already exists in old saves
      if (m.backfill && !(meta.bf && meta.bf[n])) { try { m.backfill(); } catch (e) { console.error('[save] backfill', n, e); } meta.bf[n] = 1; }
    }
  };

  // meta: bookkeeping of the migration itself
  const meta = { first: null, bak: null, bakAt: 0, bf: {} };
  Save.register('meta', { def: () => ({ first: null, bak: null, bakAt: 0, bf: {} }), get: () => { if (!meta.first) { meta.first = SV; for (const [n, m] of Object.entries(mods)) if (m.backfill) meta.bf[n] = 1; } return meta; }, set: d => { Object.assign(meta, { first: null, bak: null, bakAt: 0, bf: {} }, d || {}); meta.bf = meta.bf || {}; } });

  const gameEl = () => loadOff + (Date.now() - R0) * SPEED;
  let lastSide = '';
  Save.flushSide = () => { // side copy of ext; an older game never touches this key
    if (noSave) return; const ext = Save.collect(), txt = JSON.stringify({ sv: SV, el: gameEl(), at: Date.now(), ext });
    if (txt === lastSide) return; if (lsSet(SIDE(), txt)) lastSide = txt;
  };
  setInterval(() => { try { Save.flushSide(); } catch (e) {} }, 5000);
  addEventListener('pagehide', () => { try { Save.flushSide(); } catch (e) {} });
  document.addEventListener('visibilitychange', () => { if (document.hidden) try { Save.flushSide(); } catch (e) {} });

  /* before the old loader runs: back the save up once, and bring ext back if an older game dropped it */
  Save.pre = () => {
    const L = Save.last = { from: null, restored: false, backup: null, migrated: false, ext: null };
    const raw = lsGet(KEY()); let s = null; try { s = raw ? JSON.parse(raw) : null; } catch (e) { s = null; }
    if (!s || s.v !== 1) return L;
    L.from = s.sv || 1;
    let ext = s.ext && typeof s.ext === 'object' ? s.ext : null;
    if (!ext) { // no ext: first migration, OR an older game version saved over a newer save
      let sc = null; try { sc = JSON.parse(lsGet(SIDE()) || 'null'); } catch (e) { sc = null; }
      if (sc && sc.ext && s.time && typeof sc.el === 'number' && s.time.el >= sc.el - 60000) { ext = sc.ext; L.restored = true; } // same game, not an older/stale one
    }
    if (!s.sv) { // original (pre-1.3.0) save: keep one untouched copy
      L.migrated = true;
      if (!lsGet(BAK())) {
        let ok = lsSet(BAK(), raw);
        if (!ok) { try { const t = clone(s); t.marks = {}; (t.files || []).forEach(f => { if (f.html) f.html = f.html.replace(/src="data:image\/[^"]*"/g, 'src=""'); }); ok = lsSet(BAK(), JSON.stringify(t)) && 'slim'; } catch (e) { ok = false; } }
        L.backup = ok === 'slim' ? 'slim' : ok ? 'full' : 'failed';
      } else L.backup = 'exists';
    }
    L.ext = ext;
    return L;
  };
  // drop the backup copy after 14 real days of playing on the new format
  const cleanBak = () => { if (meta.bakAt && Date.now() - meta.bakAt > 14 * 864e5) { lsDel(BAK()); meta.bakAt = 0; } };

  /* ================= 2) Event counters ================= */
  let ctr = {};
  const Ctr = (CG.ctr = {
    n: t => (ctr[t] ? ctr[t].n : 0),
    today: t => (ctr[t] && ctr[t].d[gday()]) || 0,
    days: (t, k) => { if (!ctr[t]) return 0; const g = gday(); let n = 0; for (let i = 0; i < k; i++) n += ctr[t].d[g - i] || 0; return n; },   // last k game days incl. today
    month: (t, ym = gym()) => (ctr[t] && ctr[t].m[ym]) || 0,
    add: (t, k = 1) => {
      const c = ctr[t] || (ctr[t] = { n: 0, d: {}, m: {} }), g = gday(), ym = gym();
      c.n += k; c.d[g] = (c.d[g] || 0) + k; c.m[ym] = (c.m[ym] || 0) + k;
      for (const d of Object.keys(c.d)) if (+d < g - 62) delete c.d[d];
      for (const m of Object.keys(c.m)) if (+m < ym - 14) delete c.m[m];
    },
    raw: () => ctr,
  });
  Save.register('ctr', {
    def: () => ({}), get: () => ctr, set: d => { ctr = {}; for (const [t, c] of Object.entries(d || {})) ctr[t] = { n: +c.n || 0, d: c.d || {}, m: c.m || {} }; },
    backfill: () => { // only from data that really exists in the save
      const put = (t, n) => { if (n > Ctr.n(t)) { (ctr[t] = ctr[t] || { n: 0, d: {}, m: {} }).n = n; } };
      try { put('mail.sent', (mail.sent || []).length + mail.inbox.filter(m => m.replied).length); } catch (e) {}
      try { put('task.done', done.size); } catch (e) {}
      try { put('mail.ok', perf.mailOk); put('mail.miss', perf.mailMiss); put('call.ok', perf.callOk); put('call.miss', perf.callMiss); } catch (e) {}
      try { // sick history: monthly keys "YYYY-M" (month 0-11)
        const log = (typeof lx !== 'undefined' && lx.sickLog) || []; put('sick.start', log.length);
        const c = (ctr['sick.start'] = ctr['sick.start'] || { n: 0, d: {}, m: {} });
        for (const k of log) { const [y, mo] = String(k).split('-').map(Number); if (!isNaN(y)) c.m[y * 12 + mo] = (c.m[y * 12 + mo] || 0) + 1; }
      } catch (e) {}
      try { put('day.new', Math.max(0, Math.round((bank.lastDay - bank.start) / DAY) + 1)); } catch (e) {}
    },
  });

  /* ================= 3) Event bus ================= */
  const hs = {};
  const Bus = (CG.Bus = {
    loading: false, mute: false, log: [], depth: 0,
    on: (type, fn) => { (hs[type] = hs[type] || []).push(fn); return () => { hs[type] = hs[type].filter(x => x !== fn); }; },
    emit: (type, data) => {
      if (Bus.loading || Bus.mute || Bus.depth > 3) return;
      const e = { type, data: data || {}, day: gday(), t: Date.now() };
      try { Ctr.add(type); } catch (err) { console.error('[bus] counter', type, err); }
      Bus.log.push(type); if (Bus.log.length > 60) Bus.log.shift();
      Bus.depth++;
      try { for (const fn of [...(hs[type] || []), ...(hs['*'] || [])]) { try { fn(e); } catch (err) { console.error('[bus] handler', type, err); } } }
      finally { Bus.depth--; }
    },
  });

  /* ================= wiring into the old save/load (outermost wrappers: this file loads last) ================= */
  const _snapshot = snapshot;
  snapshot = () => { const s = _snapshot(); s.sv = SV; s.ext = Save.collect(); return s; };
  const _loadGame = loadGame;
  loadGame = function () {
    const L = Save.pre(); let ok = false;
    Bus.loading = true;
    try { ok = _loadGame(); } finally { Bus.loading = false; } // events fired while the old loader restores state are ignored
    try {
      if (ok) {
        Save.apply(L.ext || {}); if (!meta.first) meta.first = L.from || 1;
        if (L.migrated && L.backup && L.backup !== 'exists') { meta.bak = L.backup; meta.bakAt = Date.now(); }
        cleanBak(); Save.last = L;
      }
    } catch (e) { console.error('[save] post-load', e); }
    return ok;
  };
  const _writeSlot = writeSlot; // copy/import into another slot: carry the side copy along
  writeSlot = function (n, data) { const ok = _writeSlot(n, data); if (ok && data && data.ext) lsSet(keyOf(n) + '.x', JSON.stringify({ sv: SV, el: data.time ? data.time.el : 0, at: Date.now(), ext: data.ext })); return ok; };

  /* ================= ADAPTERS: the only place that touches old code ================= */
  const wrapOnce = (name, make) => { try { const f = window[name] ?? eval(name); if (typeof f !== 'function' || f.__cg) return; const w = make(f); w.__cg = 1; eval(name + ' = w'); } catch (e) { console.error('[bus] cannot hook', name, e); } };
  // perf counters → events (increments only; loading is muted)
  for (const [k, ev] of [['mailOk', 'mail.ok'], ['mailMiss', 'mail.miss'], ['callOk', 'call.ok'], ['callMiss', 'call.miss']]) {
    let v = perf[k] || 0;
    Object.defineProperty(perf, k, { enumerable: true, configurable: true, get: () => v, set: n => { const up = n > v; v = n; if (up) Bus.emit(ev, {}); } });
  }
  wrapOnce('complete', f => id => { const had = done.has(id), r = f(id); if (!had && done.has(id)) Bus.emit('task.done', { id }); return r; });
  wrapOnce('mailWriteSend', f => root => { const n = mail.sent.length, r = f(root); if (mail.sent.length > n) Bus.emit('mail.sent', { kind: 'new' }); return r; });
  wrapOnce('mailSend', f => root => { const op = mail.inbox[mail.open], had = !!(op && op.replied), r = f(root); if (op && op.replied && !had) Bus.emit('mail.sent', { kind: 'reply', imp: !!op.imp }); return r; });
  wrapOnce('fdFallSick', f => function () { const had = !!lx.sick, r = f.apply(this, arguments); if (!had && lx.sick) Bus.emit('sick.start', {}); return r; });
  wrapOnce('newDay', f => function (d) { const r = f.apply(this, arguments); Bus.emit('day.new', { d }); return r; });
  wrapOnce('holdMeeting', f => mt => { const had = !!mt.done, r = f(mt); if (!had && mt.done) Bus.emit('meeting.done', { id: mt.id }); return r; });
  wrapOnce('payBill', f => b => { const ok = f(b); if (ok) Bus.emit('bill.paid', { amt: b.amt, sis: !!b.sis }); return ok; });
  wrapOnce('guideAnswer', f => function () { const r = f.apply(this, arguments); Bus.emit('guide.used', {}); return r; });
  wrapOnce('switchCareer', f => function (id) { const from = career.id, r = f.apply(this, arguments); Bus.emit('career.switch', { id, from }); return r; });
  wrapOnce('acceptJob', f => j => { const r = f(j); Bus.emit('job.accepted', { id: j.id, co: j.co, pos: j.pos, career: j.career, same: career.id === j.career }); return r; });

  CG.diag = () => ({ sv: SV, last: { ...Save.last, ext: undefined }, meta: clone(meta), ctr: Object.fromEntries(Object.entries(ctr).map(([k, v]) => [k, v.n])), bak: !!lsGet(BAK()), side: !!lsGet(SIDE()), events: Bus.log.slice(-15) });
})();
