"use strict";
// Office game — "เมลน้อย" pretend email (a tab in เสิร์ชน้อย) and post-it notes that stick anywhere.
// Every address ends in .test, a domain reserved so it can never be a real mailbox. Nothing here leaves the browser.

/* ================= pretend email ================= */
const MAIL_DOMAIN = 'mewnoi.test';
const mail = { accounts: [], inbox: [], view: 'auto', open: null };
const WARN_BIG = `<div class="warnbig">⚠️ ใช้อีเมลสมมุติและรหัสผ่านสมมุติเท่านั้น<small>ห้ามใช้อีเมลหรือรหัสผ่านจริงของคุณ · ข้อมูลทั้งหมดอยู่ในเกมบนเครื่องนี้ ไม่มีการนำออกไปภายนอก แต่ขอให้ระมัดระวังไว้ก่อน</small></div>`;
function mailPush(to, from, subj, body) { mail.inbox.unshift({ to, from, subj, body, at: gnow().getTime(), read: false }); }
function showMail(view) {
  if (view) mail.view = view;
  const v = mail.view === 'auto' ? (mail.accounts.length ? 'inbox' : 'new') : mail.view, box = res();
  if (v === 'new') {
    box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย <small>อีเมลสมมุติในเกม</small></div>${WARN_BIG}
      <form class="mf" autocomplete="off"><label>ชื่อเล่น (สมมุติ)<input name="nm" type="text" placeholder="เช่น น้องกุ้ง" spellcheck="false"></label>
      <label>ชื่อผู้ใช้<span class="mu"><input name="user" type="text" placeholder="เช่น kungnoi" spellcheck="false" autocapitalize="off"><b>@${MAIL_DOMAIN}</b></span></label>
      <label>รหัสผ่าน (ตั้งแบบสมมุติ เช่น meow123)<input name="pw" type="text" spellcheck="false" autocapitalize="off"></label>
      <label>พิมพ์รหัสผ่านอีกครั้ง<input name="pw2" type="text" spellcheck="false" autocapitalize="off"></label>
      <label class="mok"><input name="ok" type="checkbox"> ฉันเข้าใจว่านี่คืออีเมลและรหัสผ่านสมมุติในเกมเท่านั้น</label>
      <div class="err"></div><button class="btn2 pri" type="submit">สร้างอีเมล</button>${mail.accounts.length ? '<button class="btn2" type="button" data-mv="inbox">← กลับไปกล่องจดหมาย</button>' : ''}</form></div>`;
    const fm = box.querySelector('.mf');
    fm.addEventListener('submit', e => { e.preventDefault(); createMail(fm); });
    fm.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); const ins = [...fm.querySelectorAll('input[type=text]')], i = ins.indexOf(e.target); if (i < ins.length - 1) ins[i + 1].focus(); else fm.ok.focus(); } });
    return;
  }
  if (v === 'done') {
    const a = mail.accounts[mail.accounts.length - 1];
    box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย</div><div class="mdone"><div style="font-size:40px">🎉</div><b>สร้างอีเมลสำเร็จ!</b><div class="mcard">อีเมล: <b>${esc(a.email)}</b><br>รหัสผ่าน: <b>${esc(a.pass)}</b></div>
      <p>อย่าลืม<b>จดลงโพสต์อิท</b>ไว้ จะได้ใช้สมัครแชทน้อย</p><div class="iv"><div class="acts"><button class="btn2 pri" data-mnote>📝 จดลงโพสต์อิท</button><button class="btn2 grn" data-mchat>💬 ไปสมัครแชทน้อย</button><button class="btn2" data-mv="inbox">📥 กล่องจดหมาย</button></div></div></div>${WARN_BIG}</div>`;
    return;
  }
  // inbox
  const mine = mail.inbox.filter(m => mail.accounts.some(a => a.email === m.to)), op = mail.open !== null ? mail.inbox[mail.open] : null;
  box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย <small>${mail.accounts.map(a => esc(a.email)).join(' · ')}</small></div>
    <div class="mbar2"><button class="btn2" data-mv="new">➕ สร้างอีเมลใหม่</button></div>
    ${op ? `<div class="mread"><a data-mback style="color:#3348b8;cursor:pointer">← กลับ</a><h3>${esc(op.subj)}</h3><small>จาก ${esc(op.from)} · ถึง ${esc(op.to)} · ${thDate(op.at, { day: 'numeric', month: 'short' })}</small><div class="mbody">${op.body}</div></div>`
      : `<div class="mlist">${mine.map(m => `<div class="mrow ${m.read ? '' : 'new'}" data-mi="${mail.inbox.indexOf(m)}"><b>${esc(m.from)}</b><span>${esc(m.subj)}</span><small>${thDate(m.at, { day: 'numeric', month: 'short' })}</small></div>`).join('') || '<p class="note">ยังไม่มีจดหมาย</p>'}</div>`}
    <p class="note" style="margin-top:10px">อีเมลในเกมทั้งหมดลงท้าย @${MAIL_DOMAIN} ซึ่งเป็นโดเมนสมมุติที่ไม่มีอยู่จริง</p></div>`;
}
function createMail(fm) {
  const err = fm.querySelector('.err'), user = fm.user.value.trim().toLowerCase(), pw = fm.pw.value, pw2 = fm.pw2.value, nm = fm.nm.value.trim();
  const bad = t => { err.textContent = t; S.tone(300, 200, .15, .08); };
  if (/@/.test(user)) return bad('ใส่แค่ชื่อผู้ใช้ ไม่ต้องใส่ @ (และห้ามใช้อีเมลจริงนะ)');
  if (!/^[a-z0-9._]{3,20}$/.test(user)) return bad('ชื่อผู้ใช้ใช้ได้แค่ a-z ตัวเลข จุด หรือ _ ยาว 3–20 ตัว');
  if (mail.accounts.some(a => a.user === user)) return bad('ชื่อนี้มีคนใช้แล้วในเกม ลองชื่ออื่นนะ');
  if (pw.length < 4 || pw.length > 20) return bad('รหัสผ่านสมมุติยาว 4–20 ตัวนะ');
  if (pw !== pw2) return bad('รหัสผ่านสองช่องไม่ตรงกัน');
  if (!fm.ok.checked) return bad('ติ๊กยืนยันก่อนว่าเป็นอีเมลและรหัสผ่านสมมุติ');
  const a = { user, email: `${user}@${MAIL_DOMAIN}`, pass: pw, name: nm || user };
  mail.accounts.push(a);
  mailPush(a.email, 'ทีมเมลน้อย', 'ยินดีต้อนรับสู่เมลน้อย 🎉', `<p>สวัสดี ${esc(a.name)}!</p><p>อีเมลของคุณคือ <b>${esc(a.email)}</b> ใช้สมัครแอปต่างๆ ในเกมได้เลย</p><p>อย่าลืมว่านี่เป็นอีเมลสมมุติ ห้ามใช้ข้อมูลจริงนะ 😊</p>`);
  S.jingle(); showMail('done');
}
function mailClick(e) {
  const t = e.target;
  const mv = t.closest('[data-mv]'); if (mv) { mail.open = null; showMail(mv.dataset.mv); return true; }
  const mi = t.closest('[data-mi]'); if (mi) { mail.open = +mi.dataset.mi; mail.inbox[mail.open].read = true; showMail('inbox'); return true; }
  if (t.closest('[data-mback]')) { mail.open = null; showMail('inbox'); return true; }
  if (t.closest('[data-mnote]')) { const a = mail.accounts[mail.accounts.length - 1]; addNote('screen', `บัญชีอีเมลในเกม (สมมุติ)\n${a.email}\nรหัส: ${a.pass}`); S.toast('แปะโพสต์อิทไว้บนจอแล้ว ลากย้ายได้', 2); return true; }
  if (t.closest('[data-mchat]')) { openChat(); return true; }
  return false;
}
const mailUnread = () => mail.inbox.filter(m => !m.read && mail.accounts.some(a => a.email === m.to)).length;

/* ================= post-it notes (screen view or desk) ================= */
const notes = []; let noteSeq = 0;
const NOTE_COLORS = ['#fff59a', '#ffd1e1', '#c9f2d4', '#cfe6ff', '#ffe0b8'];
function addNote(view = currentView, text = '', x, y) {
  const sx = view === 'desk' ? 36 + Math.random() * 20 : 72 + Math.random() * 10, sy = view === 'desk' ? 20 + Math.random() * 20 : 30 + Math.random() * 10; // on the screen, start near the bottom-right corner so windows stay visible
  const n = { id: ++noteSeq, view, x: x ?? +sx.toFixed(1), y: y ?? +sy.toFixed(1), text, c: NOTE_COLORS[noteSeq % NOTE_COLORS.length], r: +(Math.random() * 6 - 3).toFixed(1) };
  notes.push(n); renderNote(n); if (view !== currentView) setView(view);
  const ta = document.querySelector(`.pnote[data-n="${n.id}"] textarea`); if (ta && !text) setTimeout(() => ta.focus(), 50);
  complete('postit'); checkMailNote(); S.tone(700, 1000, .06, .06); return n;
}
function renderNote(n) {
  let el = document.querySelector(`.pnote[data-n="${n.id}"]`);
  if (!el) {
    el = h('div', { class: 'pnote', 'data-n': n.id }, '<div class="pnh"><span>📌</span><button data-pcol aria-label="เปลี่ยนสี" title="เปลี่ยนสี">🎨</button><button data-pdel aria-label="ทิ้งโพสต์อิท" title="ทิ้ง">✕</button></div><textarea spellcheck="false" placeholder="จดอะไรก็ได้…"></textarea><i class="prz" title="ลากเพื่อปรับขนาด"></i>');
    (n.view === 'desk' ? $('desk') : $('vScreen')).append(el);
    const ta = el.querySelector('textarea'); ta.value = n.text;
    ta.addEventListener('input', () => { n.text = ta.value; fitNote(n); checkMailNote(); });
    el.addEventListener('click', e => {
      if (e.target.closest('[data-pcol]')) { n.c = NOTE_COLORS[(NOTE_COLORS.indexOf(n.c) + 1) % NOTE_COLORS.length]; renderNote(n); }
      if (e.target.closest('[data-pdel]')) { notes.splice(notes.indexOf(n), 1); el.remove(); S.noise(.15, 2500, .05, 'highpass'); }
    });
  }
  el.style.left = n.x + '%'; el.style.top = n.y + '%'; el.style.background = n.c; el.style.transform = `rotate(${n.r}deg)`;
  fitNote(n);
}
// size: the note keeps the size the player dragged it to, and grows taller by itself so text never needs a scrollbar
function fitNote(n) {
  const el = document.querySelector(`.pnote[data-n="${n.id}"]`); if (!el) return;
  const ta = el.querySelector('textarea'), w = n.w || 160, hgt = n.h || 128;
  el.style.width = w + 'px'; ta.style.height = '0px';
  ta.style.height = Math.max(hgt - 34, ta.scrollHeight) + 'px';
}
let noteSize = null;
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.pnote .prz'); if (!hd) return;
  const el = hd.parentElement, n = notes.find(x => x.id === +el.dataset.n);
  noteSize = { n, el, x0: e.clientX, y0: e.clientY, w0: n.w || 160, h0: Math.max(n.h || 128, el.offsetHeight) }; e.preventDefault(); e.stopPropagation(); el.classList.add('lift');
}, true);
addEventListener('pointermove', e => {
  if (!noteSize) return; const { n, x0, y0, w0, h0 } = noteSize;
  n.w = Math.round(clamp(w0 + e.clientX - x0, 110, 520)); n.h = Math.round(clamp(h0 + e.clientY - y0, 80, 560)); fitNote(n);
});
addEventListener('pointerup', () => { if (noteSize) { noteSize.el.classList.remove('lift'); noteSize = null; } });
let noteDrag = null;
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.pnote .pnh'); if (!hd || e.target.closest('button')) return;
  const el = hd.parentElement, n = notes.find(x => x.id === +el.dataset.n), r = el.parentElement.getBoundingClientRect(), er = el.getBoundingClientRect();
  noteDrag = { n, el, r, dx: e.clientX - er.left, dy: e.clientY - er.top }; el.classList.add('lift'); e.preventDefault();
});
addEventListener('pointermove', e => {
  if (!noteDrag) return; const { n, r, dx, dy } = noteDrag;
  n.x = +clamp((e.clientX - dx - r.left) / r.width * 100, -2, 92).toFixed(2); n.y = +clamp((e.clientY - dy - r.top) / r.height * 100, 0, 88).toFixed(2); renderNote(n);
});
addEventListener('pointerup', () => { if (noteDrag) { noteDrag.el.classList.remove('lift'); noteDrag = null; S.noise(.05, 1800, .03); } });
function checkMailNote() { if (mail.accounts.some(a => notes.some(n => n.text.toLowerCase().includes(a.email)))) complete('mail'); }
$('noteBtn').addEventListener('click', () => addNote());
