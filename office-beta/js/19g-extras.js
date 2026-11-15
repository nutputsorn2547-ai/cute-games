"use strict";
// Office game (beta) — extras: เพลงจาก YouTube จริง, นิยาย (ล็อกตอน/ซื้อรายตอน-สัปดาห์-เดือน), โค้ดส่วนลดอาหาร + ป๊อปอัพ, แก๊งคอลเซนเตอร์, ไม่เด้งแป้นพิมพ์เมื่อใช้โทรศัพท์เป็นจอย

/* ================= โทรศัพท์เป็นจอย: ไม่ให้เครื่องที่เล่นเกมเด้งแป้นพิมพ์ ================= */
document.addEventListener('focusin', e => {
  const t = e.target; if (!t || !t.matches || !t.matches('input,textarea')) return;
  if (pad && pad.live) { if (t.dataset.im === undefined) t.dataset.im = t.getAttribute('inputmode') || ''; t.setAttribute('inputmode', 'none'); }
  else if (t.dataset.im !== undefined) { if (t.dataset.im) t.setAttribute('inputmode', t.dataset.im); else t.removeAttribute('inputmode'); delete t.dataset.im; }
});

/* ================= เพลงที่แต่งเอง (สังเคราะห์เสียงในเกม ไม่ต้องใช้อินเทอร์เน็ต) ================= */
const SONGS = [
  { n: '☀️ เช้านี้ที่ออฟฟิศ', d: 'ป๊อปสดใส · 112 BPM', bpm: 112, sw: 0, root: 'C', lead: 'triangle', drum: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] }, bass: [0, 8, 12], stab: [],
    prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
    mel: ['E5:2 G5:2 E5:2 G5:2 C6:4 G5:4', 'B5:2 G5:2 D5:2 G5:2 B5:4 r:4', 'A5:2 E5:2 C5:2 E5:2 A5:4 E5:4', 'A5:2 F5:2 C5:2 F5:2 A5:4 r:4', 'G5:2 E5:2 G5:2 C6:2 E6:4 C6:4', 'D6:2 B5:2 G5:2 B5:2 D6:4 r:4', 'C6:2 A5:2 F5:2 A5:2 C6:4 A5:4', 'B5:4 D6:4 G5:8',
      'C6:4 A5:4 F5:4 A5:4', 'D6:4 B5:4 G5:4 B5:4', 'E6:4 B5:4 G5:4 B5:4', 'C6:4 A5:4 E5:4 A5:4', 'A5:2 C6:2 F6:4 E6:4 C6:4', 'B5:2 D6:2 G6:4 F6:4 D6:4', 'E6:4 C6:4 G5:4 E5:4', 'C6:12 r:4'],
    ly: ['ตื่นเช้ามาพร้อมกาแฟแก้วโปรด', 'เปิดคอมแล้วยิ้มให้วันใหม่', 'งานเยอะแค่ไหนก็ไม่เป็นไร', 'มีเพื่อนร่วมโต๊ะคอยเป็นกำลังใจ', 'ตัวเลขเรียงกันเป็นแถวตรง', 'ค่อยๆ ทำไปทีละบรรทัด', 'ใครว่าบัญชีมันน่าเบื่อ', 'วันนี้เราจะทำให้สนุกกัน'] },
  { n: '🌧️ ฝนตกบนโต๊ะทำงาน', d: 'โลฟายชิลๆ · 78 BPM', bpm: 78, sw: .32, root: 'A', lead: 'sine', drum: { k: [0, 7, 10], s: [8], h: [0, 2, 4, 6, 8, 10, 12, 14] }, bass: [0, 6, 10], stab: [],
    prog: ['Am7', 'Fmaj7', 'C', 'G', 'Am7', 'Fmaj7', 'Dm7', 'E7', 'F', 'C', 'G', 'Am', 'F', 'C', 'Dm7', 'E7'],
    mel: ['E5:4 r:2 C5:2 E5:4 G5:4', 'A5:4 r:2 F5:2 C5:4 r:4', 'G5:4 r:2 E5:2 C5:4 E5:4', 'D5:4 B4:4 D5:4 r:4', 'E5:4 r:2 C5:2 A4:4 C5:4', 'F5:4 A5:4 C6:4 A5:4', 'D5:4 F5:4 A5:4 F5:4', 'G#5:4 B5:4 E5:8',
      'A5:6 G5:2 F5:8', 'E5:6 D5:2 C5:8', 'D5:6 B4:2 G4:8', 'A4:8 C5:4 E5:4', 'F5:4 A5:4 C6:8', 'G5:4 E5:4 C5:8', 'D5:4 F5:4 A5:4 D6:4', 'B5:8 G#5:4 E5:4'],
    ly: ['ฝนตกพรำๆ นอกหน้าต่าง', 'กาแฟร้อนวางข้างแป้นพิมพ์', 'ตัวเลขเรียงกันเงียบๆ', 'ใจเย็นๆ ไม่ต้องรีบร้อน', 'งานยังมีให้ทำอีกเยอะ', 'แต่พักหายใจสักนิดก็ได้', 'ปิดงบเดือนนี้ก็ผ่านไป', 'เหมือนฝนที่ซาลงในที่สุด'] },
  { n: '🍖 ปิดงบแล้วไปกินหมูกระทะ', d: 'ฟังก์สนุก · 128 BPM', bpm: 128, sw: 0, root: 'G', lead: 'square', drum: { k: [0, 3, 8, 11], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }, bass: [0, 3, 6, 8, 11, 14], stab: [2, 6, 10, 14],
    prog: ['G', 'C', 'D', 'Em', 'G', 'C', 'D', 'D', 'C', 'G', 'D', 'Em', 'C', 'G', 'D', 'G'],
    mel: ['G5:2 B5:2 D6:4 B5:2 G5:2 r:4', 'E6:2 C6:2 G5:4 C6:2 E6:2 r:4', 'F#5:2 A5:2 D6:4 A5:2 F#5:2 r:4', 'G5:2 B5:2 E6:4 D6:4 B5:4', 'G5:2 B5:2 D6:2 G6:2 D6:4 B5:4', 'E6:2 G6:2 E6:2 C6:2 G5:4 r:4', 'A5:2 D6:2 F#6:4 D6:2 A5:2 r:4', 'D6:8 r:8',
      'C6:2 E6:2 G6:4 E6:4 C6:4', 'B5:2 D6:2 G6:4 D6:4 B5:4', 'A5:2 D6:2 F#6:4 D6:4 A5:4', 'G6:4 E6:4 B5:4 G5:4', 'E6:2 G6:2 C7:4 G6:4 E6:4', 'D6:2 G6:2 B6:4 G6:4 D6:4', 'F#6:4 A6:4 F#6:4 D6:4', 'G6:12 r:4'],
    ly: ['ปิดงบเสร็จแล้ว เย้!', 'วางเครื่องคิดเลขลงเลย', 'ใครเอาเตาไปจองโต๊ะนั้น', 'หมูสามชั้นชั้นดีมาเต็มถาด', 'แจกันสลัดผักก็ต้องมี', 'ใครไม่กินต้องโดนจับตรวจนับ', 'หารเท่าๆ กันเดี๋ยวบัญชีจัดให้', 'วันนี้เลี้ยงตัวเองให้เต็มที่!'] },
];
const NOTE_ST = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const noteMidi = t => { const m = /^([A-G])(#?)(\d)$/.exec(t); return m ? 12 * (+m[3] + 1) + NOTE_ST[m[1]] + (m[2] ? 1 : 0) : null; };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CH_Q = { '': [0, 4, 7], m: [0, 3, 7], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], 7: [0, 4, 7, 10] };
function chordNotes(name) { const m = /^([A-G]#?)(.*)$/.exec(name), r = 48 + NOTE_ST[m[1][0]] + (m[1][1] ? 1 : 0); return { root: r, notes: (CH_Q[m[2]] || CH_Q['']).map(i => r + i) }; }
const mus = { ctx: null, song: -1, step: 0, nextT: 0, timer: null, noise: null };
function musTone(t, f, dur, vol, type, att = .01) { const c = mus.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.06, dur)); o.connect(g).connect(mus.out); o.start(t); o.stop(t + dur + .05); }
function musNoise(t, dur, vol, hp) { const c = mus.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = mus.noise; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f).connect(g).connect(mus.out); s.start(t); s.stop(t + dur + .02); }
function musKick(t) { const c = mus.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g).connect(mus.out); o.start(t); o.stop(t + .22); }
function musBar(sg, bar, t0) {
  const sd = 60 / sg.bpm / 4, ch = chordNotes(sg.prog[bar]), toks = sg.mel[bar].split(' '); let st = 0;
  const T = s => t0 + (s * sd) + (s % 2 ? sg.sw * sd : 0);
  // chord pad
  ch.notes.forEach(n => musTone(T(0), mtof(n + 12), 16 * sd * .95, .035, 'triangle', .05));
  sg.stab.forEach(s => ch.notes.forEach(n => musTone(T(s), mtof(n + 12), sd * 1.3, .03, 'square', .005)));
  // bass
  sg.bass.forEach((s, i) => { const o = (sg.stab.length && i % 3 === 2) ? 12 : (i === sg.bass.length - 1 ? 7 : 0); musTone(T(s), mtof(ch.root - 12 + o), sd * 2.2, .16, 'triangle', .01); });
  // melody
  for (const tk of toks) { const [n, l] = tk.split(':'), len = +l; if (n !== 'r') { const mi = noteMidi(n); if (mi != null) musTone(T(st), mtof(mi), len * sd * .92, .09, sg.lead, .015); } st += len; }
  // drums
  sg.drum.k.forEach(s => musKick(T(s))); sg.drum.s.forEach(s => musNoise(T(s), .14, .22, 1500)); sg.drum.h.forEach((s, i) => musNoise(T(s), .04, i % 2 ? .05 : .08, 7000));
}
function musicStopAll() { clearInterval(mus.timer); mus.timer = null; const old = mus.ctx, oo = mus.out; mus.ctx = null; if (old) { try { oo.gain.setTargetAtTime(0, old.currentTime, .05); } catch (e) {} setTimeout(() => { try { old.close(); } catch (e) {} }, 300); } life.music = null; mus.song = -1; }
function musicPlay(i) {
  musicStopAll(); const sg = SONGS[i], AC = window.AudioContext || window.webkitAudioContext; if (!AC) { S.toast('เบราว์เซอร์นี้เล่นเสียงไม่ได้', 2); return; }
  setTimeout(() => {
    mus.ctx = new AC(); mus.out = mus.ctx.createGain(); mus.out.gain.value = .9; mus.out.connect(mus.ctx.destination);
    const len = mus.ctx.sampleRate; mus.noise = mus.ctx.createBuffer(1, len, mus.ctx.sampleRate); const d = mus.noise.getChannelData(0); for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
    mus.song = i; mus.step = 0; mus.nextT = mus.ctx.currentTime + .15; life.music = { n: sg.n }; const barDur = 16 * 60 / sg.bpm / 4;
    mus.timer = setInterval(() => {
      if (!life.music || !wins.has('slack') || !mus.ctx) return musicStopAll();
      if (typeof lk !== 'undefined' && lk.on) { mus.nextT = Math.max(mus.nextT, mus.ctx.currentTime + .1); return; }
      while (mus.nextT < mus.ctx.currentTime + .4) { const bar = mus.step % 16; musBar(sg, bar, mus.nextT); const ln = sg.ly[Math.floor(bar / 2)], at = Math.max(0, (mus.nextT - mus.ctx.currentTime) * 1000); if (bar % 2 === 0) setTimeout(() => { const el = document.querySelector('.mlyr'); if (el) el.textContent = '♪ ' + ln; }, at); mus.step++; mus.nextT += barDur; }
    }, 80);
    renderSlack();
  }, 30);
}
function musicStop() { musicStopAll(); renderSlack(); }
function musicHTML() {
  const cur = mus.song >= 0 && life.music ? SONGS[mus.song] : null;
  return `<button class="btn2" data-sl="back">← กลับ</button><p class="soft" style="margin:6px 0 0">🎵 เพลงที่แต่งขึ้นเองสำหรับเกมนี้ · ฟังไปความเครียดจะลดลง (กด Esc ถ้าหัวหน้ามา)</p>
  ${cur ? `<div class="nowp"><b>🎶 กำลังเล่น: ${esc(cur.n)}</b><div class="mlyr">♪ …</div><button class="btn2" data-sl="mstop">⏹ หยุดเพลง</button></div>` : ''}
  <div class="sll">${SONGS.map((s, i) => `<button data-sl="mplay" data-i="${i}"><b>${mus.song === i && life.music ? '🔊' : '▶️'} ${esc(s.n)}</b><small>${s.d} · บรรเลงพร้อมเนื้อร้อง</small></button>`).join('')}</div>`;
}

/* ================= นิยาย ================= */
const NV_PRICE = 15, NV_PASS = { w: { n: 'พาสรายสัปดาห์', p: 49, d: 7 }, m: { n: 'พาสรายเดือน', p: 149, d: 30 } };
const nv = { owned: {}, pass: 0, cur: 0, lock: null };
const nvPassOn = () => nv.pass > gnow().getTime();
const nvOk = i => i === 0 || !!nv.owned[i] || nvPassOn();
function nvLockHTML(i) {
  const e = NOVEL.eps[i];
  return `<div class="nvl"><h3>🔒 ${esc(e.t)}</h3><p>ตอนนี้ยังถูกล็อกอยู่ เลือกวิธีปลดล็อก (จ่ายด้วยเงินในเกม)</p>
  <button class="btn2 pri" data-sl="nvbuy" data-i="${i}">ซื้อตอนนี้ตอนเดียว · ฿${NV_PRICE}</button>
  <button class="btn2" data-sl="nvpass" data-w="w" data-i="${i}">${NV_PASS.w.n} · ฿${NV_PASS.w.p} <small>อ่านได้ทุกตอน ${NV_PASS.w.d} วัน</small></button>
  <button class="btn2" data-sl="nvpass" data-w="m" data-i="${i}">${NV_PASS.m.n} · ฿${NV_PASS.m.p} <small>อ่านได้ทุกตอน ${NV_PASS.m.d} วัน (คุ้มสุด)</small></button>
  <button class="btn2" data-sl="novel">ไว้ก่อน</button></div>`;
}
function novelHTML() {
  if (life.tab === 'read') {
    const i = nv.cur, e = NOVEL.eps[i], last = i === NOVEL.eps.length - 1;
    return `<div class="nvr"><div class="nvh"><button class="btn2" data-sl="novel">← สารบัญ</button><b>${esc(e.t)}</b></div>${e.p.map(p => `<p>${esc(p)}</p>`).join('')}
    <div class="nvf">${i > 0 ? `<button class="btn2" data-sl="nvopen" data-i="${i - 1}">◀ ตอนก่อนหน้า</button>` : '<span></span>'}${last ? '<span class="soft">— จบบริบูรณ์ —</span>' : `<button class="btn2 pri" data-sl="nvopen" data-i="${i + 1}">ตอนต่อไป ${nvOk(i + 1) ? '▶' : '🔒 ฿' + NV_PRICE}</button>`}</div></div>`;
  }
  const d = nv.pass - gnow().getTime(), passTxt = d > 0 ? `✅ พาสอ่านไม่จำกัด เหลืออีก ${Math.ceil(d / DAY)} วัน` : 'ยังไม่มีพาส';
  if (nv.lock != null) return `<button class="btn2" data-sl="back">← กลับ</button>${nvLockHTML(nv.lock)}`;
  return `<button class="btn2" data-sl="back">← กลับ</button><div class="nvc"><h3>📖 ${esc(NOVEL.title)}</h3><small class="soft">นิยายสยองสั้น 5 ตอน · ${passTxt}</small></div>
  <div class="sll">${NOVEL.eps.map((e, i) => `<button data-sl="nvopen" data-i="${i}"><b>${nvOk(i) ? '📗' : '🔒'} ${esc(e.t)}</b><small>${i === 0 ? 'อ่านฟรี' : nv.owned[i] ? 'ซื้อแล้ว' : nvPassOn() ? 'ปลดล็อกด้วยพาส' : '฿' + NV_PRICE + ' หรือใช้พาส'}</small></button>`).join('')}</div>
  <div class="nvp"><button class="btn2" data-sl="nvpass" data-w="w">${NV_PASS.w.n} ฿${NV_PASS.w.p}</button><button class="btn2" data-sl="nvpass" data-w="m">${NV_PASS.m.n} ฿${NV_PASS.m.p}</button></div>`;
}
function slackExtra(k, t) {
  const R = () => { renderSlack(); const W = wins.get('slack'); if (W) W.body.firstChild.scrollTop = 0; return true; };
  if (k === 'music') { life.tab = 'music'; return R(); }
  if (k === 'mstop') { musicStop(); return true; }
  if (k === 'mplay') { musicPlay(+t.dataset.i); return true; }
  if (k === 'novel') { life.tab = 'novel'; nv.lock = null; return R(); }
  if (k === 'nvopen') { const i = +t.dataset.i; if (nvOk(i)) { nv.cur = i; nv.lock = null; life.tab = 'read'; } else { nv.lock = i; life.tab = 'novel'; } return R(); }
  if (k === 'nvbuy') { const i = +t.dataset.i; if (bankPay(NV_PRICE, `📖 นิยาย “${NOVEL.title}” ${NOVEL.eps[i].t}`)) { nv.owned[i] = 1; nv.cur = i; nv.lock = null; life.tab = 'read'; S.jingle?.(); S.toast('ปลดล็อกแล้ว อ่านให้สนุกนะ 📖', 2); } return R(); }
  if (k === 'nvpass') {
    const P = NV_PASS[t.dataset.w], i = t.dataset.i != null ? +t.dataset.i : null;
    if (bankPay(P.p, `📖 นิยาย ${P.n}`)) { nv.pass = Math.max(nv.pass, gnow().getTime()) + P.d * DAY; S.jingle?.(); S.toast(`ซื้อ${P.n}แล้ว อ่านได้ทุกตอน ${P.d} วัน 🎉`, 2.4); if (i != null) { nv.cur = i; nv.lock = null; life.tab = 'read'; } }
    return R();
  }
  return false;
}
const _snap3 = snapshot; snapshot = () => ({ ..._snap3(), novel: { owned: nv.owned, pass: nv.pass } });
const _load3 = loadGame; loadGame = function () { const ok = _load3(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.novel) { nv.owned = s.novel.owned || {}; nv.pass = s.novel.pass || 0; } } catch (e) {} } return ok; };

/* ================= โค้ดส่วนลดอาหาร (เพิ่ม) + ป๊อปอัพ ================= */
Object.assign(COUPONS, {
  WEEKEND30: { scope: 'food', t: 'ลด 30 บาท เมื่อสั่งครบ 250 บาท', f: sum => sum >= 250 ? { off: 30 } : { err: 'ต้องสั่งอาหารครบ 250 บาทก่อน' } },
  PAYDAY50: { scope: 'food', t: 'ลด 50 บาท เมื่อสั่งครบ 300 บาท', f: sum => sum >= 300 ? { off: 50 } : { err: 'ต้องสั่งอาหารครบ 300 บาทก่อน' } },
  NEWBIE40: { scope: 'food', t: 'ลด 40 บาท เมื่อสั่งครบ 150 บาท', f: sum => sum >= 150 ? { off: 40 } : { err: 'ต้องสั่งอาหารครบ 150 บาทก่อน' } },
  HALF40: { scope: 'food', t: 'ลดครึ่งราคา สูงสุด 40 บาท (ครบ 120)', f: sum => sum >= 120 ? { off: Math.min(40, Math.round(sum / 2)) } : { err: 'ต้องสั่งอาหารครบ 120 บาทก่อน' } },
  NOODLE15: { scope: 'food', t: 'ลด 15 บาท เฉพาะก๋วยเตี๋ยวเรือลุงหมี', f: (sum, fee, shop) => shop.id === 'noodle' ? { off: 15 } : { err: 'โค้ดนี้ใช้ได้เฉพาะก๋วยเตี๋ยวเรือลุงหมี' } },
  KAPRAO20: { scope: 'food', t: 'ลด 20 บาท เฉพาะกะเพราเตาถ่าน', f: (sum, fee, shop) => shop.id === 'kaprao' ? { off: 20 } : { err: 'โค้ดนี้ใช้ได้เฉพาะกะเพราเตาถ่าน' } },
  CHICK25: { scope: 'food', t: 'ลด 25 บาท เฉพาะข้าวมันไก่ป้าแดง', f: (sum, fee, shop) => shop.id === 'chick' ? { off: 25 } : { err: 'โค้ดนี้ใช้ได้เฉพาะข้าวมันไก่ป้าแดง' } },
  SOMTUM15: { scope: 'food', t: 'ลด 15 บาท เฉพาะส้มตำน้องฟ้า', f: (sum, fee, shop) => shop.id === 'somtum' ? { off: 15 } : { err: 'โค้ดนี้ใช้ได้เฉพาะส้มตำน้องฟ้า' } },
});
const _fp = (from, subj, line, code) => () => [from, subj, `<p>${line}</p><p>🎁 ใช้โค้ด <b>${code}</b> ตอนชำระเงินในแอป หิวแล้ว</p><p><small>(ในเกมเท่านั้น · ใช้ได้ครั้งเดียว)</small></p>`];
const FOOD_PROMO = [
  _fp('หิวแล้ว', '🎉 ลดสิ้นสัปดาห์ 30 บาท', 'ทุกออเดอร์ครบ 250 บาท ลดให้เลย', 'WEEKEND30'),
  _fp('หิวแล้ว', '💸 วันเงินเดือนออก ลด 50 บาท', 'เลี้ยงตัวเองหน่อย สั่งครบ 300 บาท ลดทันที', 'PAYDAY50'),
  _fp('หิวแล้ว', '🆕 ต้อนรับสมาชิกใหม่ ลด 40 บาท', 'สั่งครบ 150 บาท รับส่วนลดไปเลย', 'NEWBIE40'),
  _fp('หิวแล้ว', '🍽️ ลดครึ่งราคา สูงสุด 40 บาท', 'มื้อนี้คุ้มสุด ครบ 120 บาทขึ้นไป', 'HALF40'),
  _fp('ก๋วยเตี๋ยวเรือลุงหมี', '🍜 ซดน้ำซุปร้อนๆ ลด 15 บาท', 'เส้นเล็กน้ำตกชามโปรด ลดให้ทุกออเดอร์', 'NOODLE15'),
  _fp('กะเพราเตาถ่าน', '🔥 กะเพราไฟแรง ลด 20 บาท', 'หอมเตาถ่านทุกจาน ลดให้เฉพาะวันนี้', 'KAPRAO20'),
  _fp('ข้าวมันไก่ป้าแดง', '🍗 ข้าวมันไก่ลด 25 บาท', 'ไก่นุ่ม น้ำจิ้มเด็ด ป้าแดงลดให้', 'CHICK25'),
  _fp('ส้มตำน้องฟ้า', '🥗 ส้มตำแซ่บๆ ลด 15 บาท', 'ตำไทย ตำปูปลาร้า ลดให้ทุกจาน', 'SOMTUM15'),
  _fp('หิวแล้ว', '🚚 ส่งฟรีเมื่อสั่งครบ 200 บาท', 'มื้อเที่ยงนี้ไม่ต้องจ่ายค่าส่ง', 'FREESHIP200'),
  _fp('หิวแล้ว', '🍜 มื้อกลางวันลด 10%', 'ลดให้ 10% สูงสุด 30 บาท', 'LUNCH10'),
  _fp('ชาไข่มุกเมฆ', '🧋 ชานมไข่มุกลด 20 บาท', 'แก้วโปรดลดให้เลย เฉพาะสั่งผ่านแอป', 'BOBA20'),
];
const fpop = { key: null };
function foodCouponsAvail() {
  const seen = new Set(), out = [];
  for (const m of mail.inbox) { if (!arrived(m)) continue; const re = /โค้ด\s*<b>([A-Z0-9]+)<\/b>/g; let x; while ((x = re.exec(m.body || ''))) { const c = x[1]; if (!seen.has(c) && COUPONS[c] && COUPONS[c].scope === 'food' && !life.used[c]) { seen.add(c); out.push(c); } } }
  return out;
}
function foodPopHook() {
  if (!phone.open || phone.app !== 'food' || !phone.el) { fpop.key = null; return; }
  const key = pf.view === 'track' ? 'tr' : pf.view === 'checkout' ? 'co' : 'in'; if (key === 'tr') return;
  if (pf.view === 'checkout' && pf.prefill) { const inp = phone.el.querySelector('.cin'); if (inp && !inp.value) inp.value = pf.prefill; }
  if (fpop.key === key || (key === 'in' && pf.view !== 'shops')) return; fpop.key = key;
  const list = foodCouponsAvail(); if (!list.length) return;
  const scr = phone.el.querySelector('.pscr'); if (!scr) return;
  scr.insertAdjacentHTML('beforeend', `<div class="fpop"><div class="fpc"><h4>🎁 โค้ดส่วนลดของคุณ</h4><small>จากอีเมลโปรโมชั่นที่ได้รับ (${list.length} โค้ด)</small>
  <div class="fpl">${list.map(c => `<div class="fpr"><span><b>${c}</b><small>${esc(COUPONS[c].t)}</small></span><button data-fpc="${c}">${pf.view === 'checkout' ? 'ใช้เลย' : 'เก็บไว้ใช้'}</button></div>`).join('')}</div>
  <button class="btn2" data-fpx>ปิด</button></div></div>`);
}
const _rp3 = renderPhone; renderPhone = function () { _rp3(); try { foodPopHook(); } catch (e) { console.error(e); } };
document.addEventListener('click', e => {
  if (!phone.el) return;
  if (e.target.closest('[data-fpx]')) { phone.el.querySelector('.fpop')?.remove(); e.stopPropagation(); return; }
  const b = e.target.closest('[data-fpc]'); if (!b) return; e.stopPropagation();
  pf.prefill = b.dataset.fpc; phone.el.querySelector('.fpop')?.remove();
  if (pf.view === 'checkout') { const inp = phone.el.querySelector('.cin'); if (inp) { inp.value = pf.prefill; pfCoupon(); } }
  else S.toast(`📋 จดโค้ด ${pf.prefill} ไว้แล้ว ตอนชำระเงินจะใส่ให้เอง`, 2.4);
}, true);

/* ================= แก๊งคอลเซนเตอร์ ================= */
const SCAMS = [
  { from: 'ไปรษณีย์น้อย (พัสดุตกค้าง)', q: 'มีพัสดุส่งถึงคุณ แต่ตรวจพบของผิดกฎหมายในกล่อง ต้องโอนเงินค่าตรวจสอบ 4,900 บาท ภายในวันนี้ ไม่งั้นจะส่งเรื่องให้ตำรวจ', lose: 4900 },
  { from: 'ธนาคารน้อย (ฝ่ายอายัดบัญชี)', q: 'บัญชีของคุณมีรายการผิดปกติ จะถูกอายัดใน 10 นาที กรุณาบอกรหัส OTP ที่เพิ่งส่งไปทาง SMS เพื่อยืนยันตัวตนด่วน', lose: 6500 },
  { from: 'กรมภาษีน้อย (คืนภาษี)', q: 'คุณมีสิทธิ์รับเงินภาษีคืน 18,000 บาท แต่ต้องโอนค่าธรรมเนียมดำเนินการ 1,800 บาทก่อน แล้วเราจะโอนคืนทั้งหมดภายในพรุ่งนี้', lose: 1800 },
  { from: 'ตำรวจไซเบอร์ (ปลอม)', q: 'บัญชีของคุณถูกใช้ฟอกเงิน ต้องโอนเงินทั้งหมดเข้าบัญชีกลางเพื่อตรวจสอบ ห้ามบอกใคร และห้ามวางสายจนกว่าจะเสร็จ', lose: 9000 },
  { from: 'เบอร์ไม่รู้จัก (ญาติ?)', q: 'ฮัลโหล จำเสียงได้ไหม? เปลี่ยนเบอร์ใหม่แล้วนะ ตอนนี้ฉุกเฉินมาก ขอยืมเงิน 3,500 บาทก่อน โอนมาเลขบัญชีนี้ด่วนเลย', lose: 3500 },
  { from: 'ฝ่ายบุคคลงานออนไลน์', q: 'สนใจงานกดไลก์ รายได้วันละ 3,000 บาทไหม? แค่โอนค่ามัดจำสมัครงาน 1,200 บาท แล้วเริ่มทำงานได้ทันที', lose: 1200 },
  { from: 'สินเชื่อด่วนดอกเบี้ย 0%', q: 'อนุมัติสินเชื่อให้คุณแล้ว 50,000 บาท ไม่ต้องเช็กเครดิต แค่โอนค่าประกันวงเงิน 2,500 บาทก่อนรับเงิน', lose: 2500 },
];
const SCAM_BAD = ['ทำตามที่เขาบอก (โอนเงิน / บอก OTP)', 'เชื่อก่อน กลัวโดนอายัด', 'โอนไปก่อน เดี๋ยวค่อยตรวจสอบ'];
const scam = { next: null, safe: 0, lost: 0, n: 0 };
function scamRing() {
  if (call.active) return; const def = pick(SCAMS), num = '+66 ' + pick(['9', '8', '6']) + rint(1, 9) + '-' + rint(100, 999) + '-' + rint(1000, 9999);
  const el = h('div', { id: 'callPop', class: 'scam' }, `<div class="cp-h"><i>📞</i><div><b>${esc(def.from)}</b><small>โทรเข้ามา… ${num} (เบอร์ที่ไม่รู้จัก)</small></div></div><div class="cp-b"><button class="btn2 grn" data-sc="ans">✅ รับสาย</button><button class="btn2" data-sc="no">❌ วางสาย</button><button class="btn2" data-sc="blk">🚫 บล็อก</button></div>`);
  document.body.append(el); call.active = { def, el, state: 'scam', t0: performance.now() };
  const rt = setInterval(() => { if (call.active?.el !== el || el._st !== undefined) return clearInterval(rt); S.tone(700, 700, .25, .08, 'triangle'); setTimeout(() => S.tone(520, 520, .25, .08, 'triangle'), 280); S.vib?.(120); }, 1300);
  S.tone(700, 700, .25, .08, 'triangle'); if (currentView === 'desk') S.toast('📞 มีสายเข้า! ดูที่ด้านบนจอ', 2);
  call.active.to = setTimeout(() => scamEnd(), 20000);
}
function scamEnd(delay) {
  const c = call.active; if (!c || c.state !== 'scam') return; clearTimeout(c.to); const el = c.el; el._st = 1;
  const go = () => { el.remove(); if (call.active === c) call.active = null; };
  if (delay) setTimeout(go, delay); else go();
  scam.next = gnow().getTime() + (3 + Math.random() * 3) * 3600000;
}
document.addEventListener('click', e => {
  const c = call.active; if (!c || c.state !== 'scam') return; const b = e.target.closest('#callPop [data-sc]'); if (!b) return;
  const k = b.dataset.sc, el = c.el;
  if (k === 'no') { scamEnd(); return; }
  if (k === 'blk') { scam.safe++; S.toast('🚫 บล็อกเบอร์แล้ว ปลอดภัย!', 2.2); S.tone(500, 800, .12, .06); scamEnd(); return; }
  if (k === 'ans') {
    clearTimeout(c.to); el._st = 1; const o = shuf([['วางสายแล้วบล็อกเบอร์ 🚫', 's'], ['ไม่เชื่อ บอกว่าจะโทรกลับเบอร์ทางการเอง แล้ววางสาย', 's'], [pick(SCAM_BAD), 'b']]);
    el.innerHTML = `<div class="cp-h"><i>🗣️</i><div><b>${esc(c.def.from)}</b><small>กำลังสนทนา</small></div></div><p class="cp-q">“${esc(c.def.q)}”</p><div class="cp-o">${o.map(x => `<button class="btn2" data-sc="o" data-v="${x[1]}">${esc(x[0])}</button>`).join('')}</div>`;
    return;
  }
  if (k === 'o') {
    const bad = b.dataset.v === 'b';
    if (bad) {
      const amt = Math.min(c.def.lose, Math.max(0, bank.bal)); if (amt > 0) bankTx('⚠️ โอนให้มิจฉาชีพ (โดนหลอก)', -amt); scam.lost += amt; life.stress = Math.min(100, life.stress + 12);
      el.innerHTML = `<div class="cp-h"><i>😱</i><div><b>โดนแก๊งคอลเซนเตอร์หลอก!</b><small>เสียเงิน ${baht(amt)} บาท</small></div></div><p class="cp-q">ของจริง: ตำรวจ ธนาคาร หรือหน่วยงานรัฐ จะไม่โทรมาขอ OTP หรือให้โอนเงิน — ถ้าสงสัย ให้วางสายแล้วโทรกลับเบอร์ทางการเอง</p>`;
      S.big('โดนหลอกแล้ว! 😱', 2.4, '#e5536f'); S.tone(300, 150, .4, .09); if (typeof renderBank === 'function') renderBank();
    } else {
      scam.safe++; life.stress = Math.max(0, life.stress - 3);
      el.innerHTML = `<div class="cp-h"><i>😎</i><div><b>รอดแล้ว!</b><small>คุณไม่หลงกลแก๊งคอลเซนเตอร์</small></div></div><p class="cp-q">เก่งมาก เคล็ดลับ: อย่าบอก OTP · อย่าโอนเงินตามคำสั่งทางโทรศัพท์ · วางสายแล้วโทรกลับเบอร์ทางการ</p>`;
      S.jingle?.();
    }
    scamEnd(4200);
  }
});
function scamTick() {
  if (typeof lk !== 'undefined' && lk.on) return;
  const now = gnow().getTime(), hr = new Date(now).getHours(); if (scam.next == null) { scam.next = now + (1 + Math.random() * 2) * 3600000; return; }
  if (now < scam.next || call.active || hr < 8 || hr >= 21) return;
  scamRing();
}
const _ct = callTick; callTick = function () { _ct(); scamTick(); };

/* ================= คู่น้อย: โหมดแชท + พวกหลอกเอาเงิน ================= */
life.mt = life.mt || []; life.dtTab = 'swipe'; life.dtCur = null; let mtId = 0;
const DT_TOPICS = [
  { q: n => `สวัสดี! ชื่อ${n}นะ ขอทักก่อนได้ไหม 😊 วันนี้ทำงานเหนื่อยไหม?`, o: [['เหนื่อยมากเลย งานเยอะ', 'เข้าใจเลย เดี๋ยวฉันคอยให้กำลังใจนะ 💪'], ['ก็โอเคนะ สบายๆ', 'ดีจัง ขอแบ่งพลังงานบวกหน่อย ✨'], ['กำลังอู้อยู่ ชู่ว์ 🤫', '555 ลับเฉพาะเรา ไม่บอกใครแน่นอน']] },
  { q: () => 'ปกติชอบกินอะไรตอนเที่ยง?', o: [['ข้าวมันไก่', 'เมนูคลาสสิก! 🍗'], ['ส้มตำ', 'โห สายแซ่บเลย 🥗'], ['ชานมไข่มุกแทนข้าว', 'อย่าบอกนะว่าไม่ได้กินข้าวอีกแล้ว 🧋']] },
  { q: () => 'วันหยุดชอบทำอะไรเหรอ?', o: [['นอนทั้งวัน', 'ฟังดูสุดยอดเลย 😴'], ['ดูซีรีส์ที่บ้าน', 'ชอบเรื่องไหนอยู่ เล่าให้ฟังหน่อยสิ'], ['เดินตลาดนัด', 'อยากไปด้วยเลย 🛍️']] },
  { q: () => 'มีสัตว์เลี้ยงไหม? ฉันอยากมีแมวสักตัว 🐱', o: [['มีแมวส้มหนึ่งตัว', 'น่ารักจัง! ขอดูรูปหน่อย'], ['ไม่มี ไม่ค่อยมีเวลา', 'เข้าใจ งานเยอะแบบนี้'], ['ชอบหมามากกว่า', 'ทีมหมาก็ดีเหมือนกัน 🐶']] },
];
const DT_END = { q: () => 'คุยกับคุณแล้วสบายใจจัง ไว้ว่างๆ ไปนั่งกินกาแฟกันนะ ☕', o: [['ได้เลย ไว้นัดกัน', 'ดีใจจัง! ไว้ทักกันนะ 💚', 'end'], ['ขอคุยกันก่อนนะ', 'ได้เลย ไม่รีบ ไว้คุยกันต่อ 😊', 'end'], ['ไว้ก่อนนะ ยุ่งอยู่', 'เข้าใจ ขอบคุณที่คุยด้วยนะ', 'end']] };
const DT_SCAMS = {
  crypto: { lose: 3000, q: () => 'เล่าให้ฟังนะ ฉันเพิ่งได้กำไรจากลงทุนคริปโตเดือนละ 30% มีแอปให้ลงด้วย ลองโอนมาทดสอบ 3,000 บาทดูไหม เดี๋ยวสอนให้ 📈', push: 'รอบนี้ปิดรับวันนี้นะ ถ้าไม่รีบโอน พลาดแน่ๆ ใครๆ ก็รวยกันแล้ว' },
  parcel: { lose: 2800, q: () => 'ฉันส่งของขวัญจากต่างประเทศมาให้คุณ แต่ติดศุลกากร ต้องจ่ายค่าภาษี 2,800 บาท ช่วยโอนให้ก่อนได้ไหม แล้วฉันจะคืนให้ 🎁', push: 'ถ้าไม่จ่ายวันนี้ ของจะถูกตีกลับ ฉันอุตส่าห์เลือกให้เลยนะ' },
  emergency: { lose: 1500, q: () => 'กระเป๋าตังค์ฉันหายแล้ว… ขอยืม 1,500 บาทค่ารถไปหาคุณได้ไหม สัญญาจะคืนพรุ่งนี้ 🥺', push: 'ขอร้องล่ะ ฉันไม่มีใครให้พึ่งแล้ว ถ้าคุณไม่ช่วยฉันจะกลับบ้านไม่ได้' },
  medical: { lose: 5000, q: () => 'แม่ฉันป่วยกะทันหัน ต้องจ่ายค่ารักษา 5,000 บาทด่วน ช่วยฉันหน่อยนะ ขอร้อง 😭', push: 'โรงพยาบาลรอเงินอยู่ ถ้าคุณรักฉันจริง ต้องช่วยตอนนี้เลย' },
  video: { lose: 1200, q: () => 'คุยแชทไม่ชัดเจน เปิดวิดีโอคอลดีกว่า กดลิงก์นี้ได้เลย ต้องติดตั้งแอปก่อนนะ (ค่ายืนยันตัวตน 1,200 บาท) 📹', push: 'กดเลยๆ ไม่ต้องกลัว ฉันไม่ใช่คนไม่ดีหรอก' },
};
function dtTurns(sc, pushed) {
  const t = [DT_TOPICS[0], DT_TOPICS[1]];
  if (sc) {
    const S2 = DT_SCAMS[sc]; t.push({ q: S2.q, o: [['ลองฟังรายละเอียดก่อน', S2.push, 'push'], ['ได้เลย โอนให้เลย', 'ขอบคุณจ้า… (อ่านแล้ว แต่ไม่มีการตอบกลับอีกเลย)', 'lose'], ['ไม่เอา สงสัยว่าเป็นแก๊งหลอกลวง บล็อกเลย 🚫', 'ฮึ ไม่คุยก็ได้!', 'safe']] });
    if (pushed) t.push({ q: null, o: [['ลองฟังรายละเอียดก่อน', 'งั้นไม่คุยแล้ว ไปล่ะ!', 'end'], ['ได้เลย โอนให้เลย', 'ขอบคุณจ้า… (อ่านแล้ว แต่ไม่มีการตอบกลับอีกเลย)', 'lose'], ['ไม่เอา สงสัยว่าเป็นแก๊งหลอกลวง บล็อกเลย 🚫', 'ฮึ ไม่คุยก็ได้!', 'safe']] });
  } else t.push(DT_TOPICS[2], DT_TOPICS[3], DT_END);
  return t;
}
function dtMk(pr, scamKey) {
  const n = pr[0], m = { id: ++mtId, n, e: pr[2], bio: pr[3], sc: scamKey || null, msgs: [], st: 0, unread: 0, done: false, blocked: false, pushed: false };
  m.turns = dtTurns(m.sc, false); m.msgs.push({ f: 't', t: m.turns[0].q(n) }); m.unread = 1; life.mt.push(m); return m;
}
const dtUnread = () => life.mt.reduce((s, m) => s + (m.blocked ? 0 : m.unread), 0);
function dtApply(m, fx) {
  if (fx === 'lose') { const S2 = DT_SCAMS[m.sc], amt = Math.min(S2.lose, Math.max(0, bank.bal)); if (amt > 0) bankTx('⚠️ โอนให้คนในแอปหาคู่ (โดนหลอก)', -amt); m.lost = amt; m.done = true; life.stress = Math.min(100, life.stress + 10); scam.lost += amt; S.big('โดนหลอกในแอปหาคู่! 😱', 2.4, '#e5536f'); S.tone(300, 150, .4, .09); if (typeof renderBank === 'function') renderBank(); m.msgs.push({ f: 's', t: `😱 คุณเสียเงิน ${baht(amt)} บาท — คนนี้เป็นมิจฉาชีพ! ระวังคนที่เพิ่งรู้จักแล้วขอเงิน ชวนลงทุน หรือให้กดลิงก์แปลกๆ` }); }
  else if (fx === 'safe') { m.done = true; m.blocked = true; scam.safe++; life.stress = Math.max(0, life.stress - 3); S.toast('🛡️ บล็อกมิจฉาชีพได้แล้ว เก่งมาก!', 2.4); S.jingle?.(); m.msgs.push({ f: 's', t: '🛡️ ถูกต้อง! คนที่ขอเงิน ชวนลงทุน หรือให้โอนค่าธรรมเนียม คือสัญญาณหลอกลวง' }); }
  else if (fx === 'end') { m.done = true; life.stress = Math.max(0, life.stress - 2); }
}
function dtReply(m, i) {
  const t = m.turns[m.st]; if (!t || m.done) return; const o = t.o[i]; m.msgs.push({ f: 'me', t: o[0] }); m.unread = 0; life.stress = Math.max(0, life.stress - .6);
  const fx = o[2], later = (ms, fn) => setTimeout(() => { if (!life.mt.includes(m)) return; fn(); if (life.dtCur === m.id && phone.open && phone.app === 'date') renderPhone(); else m.unread++; }, ms);
  if (fx === 'push') { m.pushed = true; m.turns = dtTurns(m.sc, true); }
  m.st++; const next = m.turns[m.st];
  if (fx === 'lose' || fx === 'safe' || fx === 'end') { m.msgs.push({ f: 't', t: o[1] }); dtApply(m, fx); return; }
  later(700, () => { m.msgs.push({ f: 't', t: o[1] }); });
  if (next && next.q) later(1700, () => { m.msgs.push({ f: 't', t: next.q(m.n) }); });
  else if (!next) m.done = true;
}
function dtInbound() {
  if (life.mt.filter(m => !m.done && !m.blocked).length >= 5) return;
  const pr = pick(PROFILES), sc = Math.random() < .6 ? pick(Object.keys(DT_SCAMS)) : null; dtMk(pr, sc);
  S.toast('💘 คู่น้อย: มีคนทักมาหาคุณ ลองเปิดดูในมือถือ', 2.6); S.tone(900, 1300, .1, .06, 'triangle'); if (typeof phoneBadge === 'function') try { phoneBadge(); } catch (e) {}
}
function dateRender() {
  const head = `<div class="ph"><button data-phome aria-label="หน้าหลัก">⌂</button>💘 คู่น้อย</div>`, un = dtUnread();
  const tabs = `<div class="dtt"><button data-dt="tab:swipe" class="${life.dtTab === 'swipe' ? 'on' : ''}">💚 เลื่อนหา</button><button data-dt="tab:chat" class="${life.dtTab !== 'swipe' ? 'on' : ''}">💬 แชท${un ? ` <em>${un}</em>` : ''}</button></div>`;
  if (life.dtTab === 'swipe') {
    const p = PROFILES[dtI % PROFILES.length];
    return head + tabs + `<div class="pam pdt"><div class="dcard2"><div class="dem">${p[2]}</div><b>${p[0]}, ${p[1]}</b><small>${p[3]}</small></div><div class="dbt"><button data-dt="no">❌</button><button data-dt="yes">💚</button></div><p class="soft">เลื่อนแล้ว ${life.swipes} · แมตช์ ${life.matches}${life.dm ? '<br>' + esc(life.dm) : ''}</p></div>`;
  }
  const m = life.mt.find(x => x.id === life.dtCur);
  if (life.dtTab === 'chat' || !m) {
    const list = life.mt.filter(x => !x.blocked || x.sc == null).slice().reverse();
    return head + tabs + `<div class="pam">${list.length ? list.map(x => `<button class="dtr" data-dt="open:${x.id}"><i>${x.e}</i><span><b>${esc(x.n)}</b><small>${esc((x.msgs[x.msgs.length - 1] || {}).t || '')}</small></span>${x.unread && !x.blocked ? `<em>${x.unread}</em>` : ''}</button>`).join('') : '<p class="soft">ยังไม่มีแชท · เลื่อนหาคู่แล้วกด 💚 ให้แมตช์ หรือรอมีคนทักมา</p>'}</div>`;
  }
  const t = m.turns[m.st], opts = !m.done && t && m.msgs.length && m.msgs[m.msgs.length - 1].f === 't' ? t.o : null;
  return `<div class="ph"><button data-dt="tab:chat" aria-label="กลับ">‹</button>${m.e} ${esc(m.n)}<button data-dt="blk" style="margin-left:auto;font-size:12px">🚫 บล็อก</button></div><div class="pm dtmsgs">${m.msgs.map(x => `<div class="dtb ${x.f}">${esc(x.t)}</div>`).join('')}</div>${opts ? `<div class="dto">${opts.map((o, i) => `<button data-dt="r:${i}">${esc(o[0])}</button>`).join('')}</div>` : `<div class="dto"><small class="soft">${m.done ? 'จบการสนทนาแล้ว' : 'กำลังพิมพ์…'}</small></div>`}`;
}
function dateClick(k) {
  if (k.startsWith('tab:')) { life.dtTab = k.slice(4); life.dtCur = null; return renderPhone(); }
  if (k.startsWith('open:')) { const m = life.mt.find(x => x.id === +k.slice(5)); if (m) { life.dtCur = m.id; life.dtTab = 'room'; m.unread = 0; } return renderPhone(); }
  if (k === 'blk') { const m = life.mt.find(x => x.id === life.dtCur); if (m && !m.done) { if (m.sc) { dtApply(m, 'safe'); } else { m.done = true; m.blocked = true; m.msgs.push({ f: 's', t: 'คุณบล็อกคนนี้แล้ว' }); } } life.dtTab = 'chat'; life.dtCur = null; return renderPhone(); }
  if (k.startsWith('r:')) { const m = life.mt.find(x => x.id === life.dtCur); if (m) dtReply(m, +k.slice(2)); S.tone(700, 900, .04, .04); return renderPhone(); }
  life.swipes++; life.stress = Math.max(0, life.stress - .8); dtI++; life.dm = '';
  if (k === 'yes' && Math.random() < .35) { life.matches++; const pr = PROFILES[(dtI - 1) % PROFILES.length]; dtMk(pr, Math.random() < .25 ? pick(Object.keys(DT_SCAMS)) : null); life.dm = '🎉 แมตช์กับ ' + pr[0] + '! ไปทักในแท็บ “แชท” ได้เลย'; S.tone(880, 1320, .15, .07, 'triangle'); } else S.tone(500, 600, .04, .04);
  renderPhone();
}
// มีคนทักเข้ามาเป็นระยะ (บางคนเป็นมิจฉาชีพ)
const dtSch = { next: null };
const _ct2 = callTick; callTick = function () {
  _ct2(); const now = gnow().getTime(); if (dtSch.next == null) { dtSch.next = now + (2 + Math.random() * 2) * 3600000; return; }
  if (now >= dtSch.next) { dtSch.next = now + (3 + Math.random() * 3) * 3600000; dtInbound(); }
};
const _snap4 = snapshot; snapshot = () => ({ ..._snap4(), dating: { mt: life.mt.map(m => { const c = { ...m }; delete c.turns; return c; }), id: mtId } });
const _load4 = loadGame; loadGame = function () { const ok = _load4(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.dating) { life.mt = (s.dating.mt || []).map(m => { m.turns = dtTurns(m.sc, m.pushed); return m; }); mtId = s.dating.id || 0; } } catch (e) {} } return ok; };
