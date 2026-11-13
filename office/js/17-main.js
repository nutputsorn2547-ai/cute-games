"use strict";
// Office game — views, touchpad, main loop. Files load in order and share one global scope (see office/index.html).
/* ================= views ================= */
let currentView = 'screen';
function setView(v) {
  currentView = v; $('views').classList.toggle('desk', v === 'desk');
  $('switchBtn').textContent = v === 'desk' ? 'กลับไปที่จอคอม ↑' : 'ไปที่โต๊ะ ↓';
  if (v === 'screen') { closeOverlay(); closePhone(); } hideCtx(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  S.noise(.2, 600, .05);
}
$('switchBtn').addEventListener('click', () => setView(currentView === 'desk' ? 'screen' : 'desk'));
addEventListener('keydown', e => {
  if (e.key === 'Escape') escape();
  if (e.key === 'F2' && !(topWin()?.book && currentView === 'screen')) { e.preventDefault(); setView(currentView === 'desk' ? 'screen' : 'desk'); }
});
function escape() {
  if (ctx) { hideCtx(); return; }
  if (phone.open) { closePhone(); return; }
  if (ov) { closeOverlay(); return; }
  if (currentView === 'screen') { const W = topWin(); if (!W) return; if (W.dlg) { W.dlg.cancel(); return; } const pk = W.el.querySelector('.pick'); if (pk) { pk.remove(); return; } closeWin(W.id); }
}

/* ================= phone touchpad → virtual cursor ================= */
const vcur = $('vcur'); const cur = { x: innerWidth / 2, y: innerHeight / 2, down: false };
let lastClickT = 0, phoneSeen = false;
const fire = (type, el, extra = {}) => el && el.dispatchEvent(new (type.startsWith('pointer') ? PointerEvent : MouseEvent)(type, { bubbles: true, cancelable: true, composed: true, clientX: cur.x, clientY: cur.y, button: 0, buttons: cur.down ? 1 : 0, pointerId: 77, pointerType: 'mouse', isPrimary: true, view: window, ...extra }));
const under = () => document.elementFromPoint(cur.x, cur.y);
function syntheticClick(dbl) {
  const el = under(); if (!el) return;
  cur.down = true; fire('pointerdown', el); fire('mousedown', el);
  cur.down = false; fire('pointerup', el); fire('mouseup', el); fire('click', el, { detail: 1 });
  const field = el.closest('input,textarea');
  if (field) field.focus(); else if (document.activeElement && document.activeElement.matches && document.activeElement.matches('input,textarea') && !document.activeElement.classList.contains('ed') && !document.activeElement.classList.contains('rn')) document.activeElement.blur();
  if (dbl) fire('dblclick', el, { detail: 2 });
}
function typeText(str) {
  for (const ch of str) {
    const el = document.activeElement, field = el && el.matches && el.matches('input,textarea') ? el : null;
    if (ch === '\b') {
      if (field) { const s = field.selectionStart, e2 = field.selectionEnd; if (s !== e2) field.setRangeText('', s, e2, 'end'); else if (s > 0) field.setRangeText('', s - 1, s, 'end'); field.dispatchEvent(new Event('input', { bubbles: true })); }
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    } else if (ch === '\n') {
      const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      (field || document.body).dispatchEvent(ev);
      if (field && field.tagName === 'TEXTAREA' && !ev.defaultPrevented) { field.setRangeText('\n', field.selectionStart, field.selectionEnd, 'end'); field.dispatchEvent(new Event('input', { bubbles: true })); }
    } else {
      if (field) { field.setRangeText(ch, field.selectionStart, field.selectionEnd, 'end'); field.dispatchEvent(new Event('input', { bubbles: true })); }
      else document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }));
    }
  }
}
function pasteClip() {
  if (!clip) { S.toast('ยังไม่ได้คัดลอกอะไรไว้', 1.4); return; }
  const el = document.activeElement;
  if (el && el.matches && el.matches('input,textarea')) { el.setRangeText(clip, el.selectionStart, el.selectionEnd, 'end'); el.dispatchEvent(new Event('input', { bubbles: true })); return; }
  const W = topWin(); if (W && W.book) pasteInto(W, clip);
}
function scrollAt(dy) {
  let el = under();
  while (el && el !== document.body) { const cs = getComputedStyle(el); if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2) { el.scrollTop += dy; return; } el = el.parentElement; }
}
const CURSOR_GAIN = 1.25;
let last = performance.now();
function loop(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  S.tick(dt); pad.update(dt);
  if (pad.live) {
    if (!phoneSeen) { phoneSeen = true; vcur.hidden = false; }
    const [dx, dy] = pad.takeTouch();
    if (dx || dy) { cur.x = clamp(cur.x + dx * CURSOR_GAIN, 0, innerWidth - 2); cur.y = clamp(cur.y + dy * CURSOR_GAIN, 0, innerHeight - 2); fire('pointermove', under()); fire('mousemove', under()); }
    const press = !!pad.btn.press;
    if (press && !cur.down) { cur.down = true; const el = under(); fire('pointerdown', el); fire('mousedown', el); S.vib(20); }
    if (!press && cur.down) { cur.down = false; const el = under(); fire('pointerup', el); fire('mouseup', el); }
    const c = pad.tap('click');
    for (let i = 0; i < c; i++) { const t = performance.now(), dbl = t - lastClickT < 450; lastClickT = dbl ? 0 : t; syntheticClick(dbl); }
    if (pad.tap('dbl')) { syntheticClick(false); syntheticClick(true); }
    if (pad.tap('rclick')) { const el = under(); if (el) fire('contextmenu', el, { button: 2 }); }
    if (pad.tap('paste')) pasteClip();
    const sc = pad.takeScroll(); if (sc) scrollAt(-sc * 1.6);
    const txt = pad.takeText(); if (txt) typeText(txt);
    if (pad.tap('view')) setView(currentView === 'desk' ? 'screen' : 'desk');
    if (pad.tap('esc')) escape();
    vcur.style.transform = `translate(${cur.x}px,${cur.y}px)`; vcur.classList.toggle('press', cur.down);
  }
  if (food.track && !food.track.arrived) updateTrack(now);
  updateGame(now);
  const mn = gnow().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  if (mn !== lastMin) { lastMin = mn; enforceDate(); $('clock').textContent = thDate(gnow(), { day: 'numeric', month: 'short' }) + ' ' + mn; phoneItem.querySelector('.pt').textContent = mn; const tw = wins.get('time'); if (tw && tw.body.querySelector('.hh')) { const g = gnow(); tw.body.querySelector('.hh').textContent = p2(g.getHours()); tw.body.querySelector('.mm').textContent = p2(g.getMinutes()); } applyTime(); updateDeskCal(); const slot = Math.floor((gnow() - T0) / 10800000); if (slot > jr.slot) { jr.slot = slot; juniorAsk(); } }
  if (S.pairing()) S.hint('');
  else if (pad.live) S.hint(currentView === 'desk' ? 'แตะของบนโต๊ะเพื่อหยิบ/เปิด · แตะค้างแล้วลาก = ย้ายของ · ปุ่มสลับบนมือถือ = กลับไปที่จอ' : 'แตะสองทีที่ว่าง = เมนู · แตะค้างแล้วลาก = ลากไฟล์/ปรับขนาดหน้าต่างที่มุมขวาล่าง · พิมพ์ในช่องคีย์บอร์ดบนมือถือ');
  else S.hint(currentView === 'desk' ? 'คลิกของบนโต๊ะเพื่อหยิบ/เปิด · ลากเพื่อย้าย · Esc ปิด · F2 สลับมุมมอง' : 'ดับเบิลคลิกที่ว่าง/คลิกขวา = เมนู · ลากมุมขวาล่างของหน้าต่างเพื่อปรับขนาด · Esc ปิด');
  requestAnimationFrame(loop);
}
const loaded = loadGame();
if (!loaded) bankTick(true);
applyStage(); checkUnlock(true); renderTasks(); renderDesktop(); syncTaskbar(); phoneBadge(); updateDeskCal(); applyTime();
if (loaded) setTimeout(() => S.toast(`💾 เล่นต่อจากเซฟเดิม · ${thDate(gnow(), { day: 'numeric', month: 'short', year: 'numeric' })} ${p2(gnow().getHours())}:${p2(gnow().getMinutes())} น.`, 3.5), 800);
window.__office = { openSaves, get slot() { return slot; }, unlockAll: () => { unlockedDay = 99; applyStage(); renderDesktop(); renderTasks(); syncTaskbar(); }, saveGame, loadGame, snapshot, checkUnlock, get unlockedDay() { return unlockedDay; }, gameDay, DAYPLAN, CDOCS, dailyDocs, work, jr, JQ, debts, juniorAsk, downloadChatFile, openWork, pinCurrent, scanCurrent, get pin() { return pin; }, bank, ai, MEETS, DORMS, openBank, openAI, aiSend, aiAttach, openCal, advanceDays, EVENTS, cal, get dayOff() { return dayOff; }, gnow, openDesign, openJobs, openGames, openPhone, openTime, phone, gm, jobs, PEOPLE, get timeOff() { return timeOff; }, feed: d => pad.feed(d), get cur() { return { ...cur }; }, FILES, FOLDERS, done, setView, openSheet, openSearch, openChat, openFood, typeText, setWallpaper, desktopMenu, wins, chat, food, se, HOTELS, value, tripTotal, sheetCmd, saveBook, get tool() { return tool; }, get clip() { return clip; } };
// for older tests: cells + value of the first workbook
Object.defineProperty(window.__office, 'cells', { get: () => FILES.find(f => f.id === 'x1').book.cells });
requestAnimationFrame(loop);
