// Music player (🎧 เครื่องเล่นเพลง) shared by the home PC and the office desktop.
// Plays "Music Code" (CGM1|bpm|bars|scale|step.row.len,...) written in the songwriter side job. No audio files.
(() => {
  'use strict';
  const SCALES = { maj: { n: 'เมเจอร์', semi: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16] }, min: { n: 'ไมเนอร์', semi: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15] }, pen: { n: 'เพนทาโทนิก', semi: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21] } };
  const MAXSEC = 120, MAXLIB = 30;
  const M = { songs: [], uid: 0 };
  const D = { code: '', name: '', msg: '' };          // draft (not saved)
  const P = { id: null, name: '', start: 0, total: 0, timers: [], iv: null };
  const subs = [];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const changed = () => subs.forEach(f => { try { f(); } catch (e) {} });
  const freq = (sc, r) => 261.63 * Math.pow(2, SCALES[sc].semi[r] / 12);

  function parse(code) {
    const p = String(code || '').trim().split('|'); if (p.length !== 5 || p[0] !== 'CGM1') return { err: 'รูปแบบโค้ดไม่ถูกต้อง (ต้องขึ้นต้นด้วย CGM1)' };
    const bpm = +p[1], bars = +p[2], sc = p[3];
    if (!Number.isInteger(bpm) || bpm < 50 || bpm > 180) return { err: 'ค่าจังหวะ (BPM) ต้องอยู่ระหว่าง 50–180' };
    if (!Number.isInteger(bars) || bars < 1 || bars > 32) return { err: 'จำนวนห้องต้องอยู่ระหว่าง 1–32' };
    if (!SCALES[sc]) return { err: 'ไม่รู้จักสเกล "' + sc.slice(0, 8) + '"' };
    if (bars * 240 / bpm > MAXSEC) return { err: 'เพลงยาวเกิน 2 นาที' };
    const raw = p[4] ? p[4].split(',') : []; if (raw.length > 600) return { err: 'โน้ตเยอะเกินไป' }; if (!raw.length) return { err: 'ยังไม่มีโน้ตในโค้ด' };
    const notes = [];
    for (const t of raw) { const m = t.match(/^(\d+)\.(\d+)\.(\d+)$/); if (!m) return { err: 'พบโน้ตที่อ่านไม่ได้: ' + t.slice(0, 12) }; const s = +m[1], r = +m[2], l = +m[3]; if (r > 9 || l < 1 || l > 8 || s + l > bars * 8) return { err: 'โน้ตอยู่นอกขอบเขต: ' + t }; notes.push([s, r, l]); }
    return { bpm, bars, sc, notes, secs: bars * 240 / bpm };
  }
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const playing = () => P.id !== null;
  function stop(quiet) { P.timers.forEach(clearTimeout); P.timers = []; if (P.iv) clearInterval(P.iv); P.iv = null; const was = P.id !== null; P.id = null; if (was && !quiet) changed(); }
  function play(code, id, name) {
    const r = parse(code); if (r.err) { D.msg = '❌ ' + r.err; changed(); return false; }
    stop(true); const sd = 30 / r.bpm; P.id = id || 'draft'; P.name = name || 'เพลงจากโค้ด'; P.start = performance.now(); P.total = r.secs;
    const tone = (typeof S !== 'undefined' && S && S.tone) ? S.tone : null;
    r.notes.forEach(n => P.timers.push(setTimeout(() => { try { if (tone) tone(freq(r.sc, n[1]), freq(r.sc, n[1]), Math.max(.18, n[2] * sd * .95), .05, 'triangle'); } catch (e) {} }, n[0] * sd * 1000)));
    P.timers.push(setTimeout(() => stop(), r.secs * 1000 + 300));
    P.iv = setInterval(() => { const t = Math.min(P.total, (performance.now() - P.start) / 1000); document.querySelectorAll('[data-mu-time]').forEach(e => { e.textContent = fmt(t) + ' / ' + fmt(P.total); }); document.querySelectorAll('[data-mu-bar]').forEach(e => { e.style.width = (t / P.total * 100) + '%'; }); }, 250);
    D.msg = ''; changed(); return true;
  }
  function add(name, code, note) {
    const r = parse(code); if (r.err) return { err: r.err };
    if (M.songs.some(s => s.code === code)) return { err: 'มีเพลงนี้ในคลังแล้ว' };
    if (M.songs.length >= MAXLIB) return { err: 'คลังเต็มแล้ว (' + MAXLIB + ' เพลง) ลบเพลงเก่าออกก่อน' };
    const s = { id: ++M.uid, name: String(name || 'เพลงของฉัน').trim().slice(0, 40) || 'เพลงของฉัน', code, note: note || '', secs: Math.round(r.secs), sc: r.sc }; M.songs.unshift(s); changed(); return { song: s };
  }
  function del(id) { if (P.id === id) stop(true); M.songs = M.songs.filter(s => s.id !== id); changed(); }

  function html() {
    const np = playing() ? `<div class="mu-np"><b>🎶 กำลังเล่น: ${esc(P.name)}</b><div class="mu-bar"><i data-mu-bar style="width:0%"></i></div><small data-mu-time>0:00 / ${fmt(P.total)}</small> <button data-mu="stop">⏹ หยุด</button></div>` : '';
    const lib = M.songs.length ? M.songs.map(s => `<div class="mu-row"><div><b>${P.id === s.id ? '🔊' : '🎵'} ${esc(s.name)}</b><br><small>${fmt(s.secs)} · สเกล${SCALES[s.sc].n}${s.note ? ' · ' + esc(s.note) : ''}</small></div><div class="mu-bt"><button data-mu="play" data-id="${s.id}">${P.id === s.id ? '⏹' : '▶'}</button><button data-mu="copy" data-id="${s.id}" title="ใส่โค้ดลงช่องด้านบน">📋</button><button data-mu="del" data-id="${s.id}" title="ลบ">🗑</button></div></div>`).join('') : '<p class="mu-soft">คลังยังว่าง เพลงที่ผ่านงานแต่งเพลงจะถูกเก็บไว้ที่นี่เอง หรือวางโค้ดด้านบนแล้วกด "เก็บเข้าคลัง"</p>';
    return `<div class="mu">${np}<div class="mu-box"><b>🎼 เล่นจาก Music Code</b><textarea data-mu-code rows="3" spellcheck="false" placeholder="วางโค้ด CGM1|… ที่นี่">${esc(D.code)}</textarea><input data-mu-name placeholder="ชื่อเพลง (ตอนเก็บเข้าคลัง)" maxlength="40" value="${esc(D.name)}"><div class="mu-bt"><button data-mu="playdraft">▶ ฟัง</button><button data-mu="save">💾 เก็บเข้าคลัง</button></div><small class="mu-msg">${esc(D.msg)}</small></div><div class="mu-lib"><b>📀 คลังเพลง (${M.songs.length}/${MAXLIB})</b>${lib}</div></div>`;
  }
  const bound = new WeakSet();
  function bind(root) {
    if (!root || bound.has(root)) return; bound.add(root);
    root.addEventListener('input', e => { const c = e.target.closest && e.target.closest('[data-mu-code]'); if (c) { D.code = c.value; return; } const n = e.target.closest && e.target.closest('[data-mu-name]'); if (n) D.name = n.value; });
    root.addEventListener('keydown', e => { if (e.target.closest && e.target.closest('[data-mu-code],[data-mu-name]')) e.stopPropagation(); });
    root.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-mu]'); if (!b) return; const a = b.dataset.mu, id = +b.dataset.id;
      if (a === 'stop') stop();
      else if (a === 'playdraft') { if (playing() && P.id === 'draft') stop(); else play(D.code, 'draft', D.name || 'เพลงจากโค้ด'); }
      else if (a === 'play') { const s = M.songs.find(x => x.id === id); if (!s) return; if (P.id === id) stop(); else play(s.code, id, s.name); }
      else if (a === 'copy') { const s = M.songs.find(x => x.id === id); if (s) { D.code = s.code; D.name = s.name; D.msg = 'ใส่โค้ดลงช่องแล้ว คัดลอกไปเก็บได้'; changed(); } }
      else if (a === 'del') del(id);
      else if (a === 'save') { const r = add(D.name, D.code); if (r.err) D.msg = '❌ ' + r.err; else { D.msg = '✅ เก็บเข้าคลังแล้ว'; D.code = ''; D.name = ''; } changed(); }
    });
  }
  const css = '.mu{font-size:13px;display:flex;flex-direction:column;gap:10px}.mu button{border:1px solid #7a6fd0;background:#ffffff22;color:inherit;border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit}.mu button:hover{background:#ffffff40}.mu textarea,.mu input{width:100%;box-sizing:border-box;border:1px solid #7a6fd0;border-radius:8px;background:#0c0a1f22;color:inherit;font:12px monospace;padding:6px;margin-top:6px}.mu input{font:13px sans-serif}.mu-bt{display:flex;gap:6px;margin-top:6px}.mu-np{background:#7c5cff30;border-radius:10px;padding:8px}.mu-bar{height:6px;background:#ffffff30;border-radius:4px;margin:6px 0;overflow:hidden}.mu-bar i{display:block;height:100%;background:#ffd98a}.mu-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #ffffff22}.mu-soft{opacity:.7;margin:6px 0 0}.mu-msg{display:block;margin-top:4px;opacity:.85}';
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  /* ---- office desktop app ---- */
  function openOffice() {
    try {
      if (typeof wins === 'undefined') return; if (wins.has('music')) { focusWin(wins.get('music')); return; }
      const W = openWin('music', '🎧 เครื่องเล่นเพลง', h('div', { class: 'mu-wrap', style: 'padding:10px;overflow:auto;height:100%;box-sizing:border-box' }), 400, 470, '#efe9ff'), root = W.body.firstChild;
      const paint = () => { if (!wins.has('music')) return; const ta = root.querySelector('[data-mu-code]'), f = document.activeElement === ta; const sel = f ? [ta.selectionStart, ta.selectionEnd] : null; root.innerHTML = html(); if (f) { const t2 = root.querySelector('[data-mu-code]'); if (t2) { t2.focus(); try { t2.setSelectionRange(sel[0], sel[1]); } catch (e) {} } } };
      subs.push(paint); W.onClose = () => { stop(true); const i = subs.indexOf(paint); if (i >= 0) subs.splice(i, 1); };
      bind(root); paint();
    } catch (e) { console.error(e); }
  }
  try { if (typeof GENERAL_APPS !== 'undefined') { GENERAL_APPS.push({ id: 'app-music', n: 'เครื่องเล่นเพลง', e: '🎧', c: '#7c5cff', fn: openOffice }); try { JL_APPS.add('app-music'); } catch (e) {} try { syncApps(); renderDesktop(); } catch (e) {} } } catch (e) {}

  if (window.CG && CG.Save) CG.Save.register('music', { def: () => ({ songs: [], uid: 0 }), get: () => ({ songs: M.songs, uid: M.uid }), set: d => { d = d || {}; M.songs = Array.isArray(d.songs) ? d.songs.filter(s => s && typeof s.code === 'string' && !parse(s.code).err).slice(0, MAXLIB) : []; M.uid = +d.uid || M.songs.reduce((a, s) => Math.max(a, s.id || 0), 0); } });
  window.CG = window.CG || {}; CG.music = { parse, play, stop, add, del, html, bind, playing, onChange: f => subs.push(f), count: () => M.songs.length, list: () => M.songs.slice() };
})();
