"use strict";
// Office game — pinned/scanned papers, staging, save. Files load in order and share one global scope (see office/index.html).
/* ================= desk paper: hold beside the screen / scan to PDF ================= */
let pin = null;
function captureCurrent() {
  const st = ov.state, r = st.sheet.getBoundingClientRect(), d = st.doc;
  const content = d ? `<div class="content">${d.html}</div>` : `<div class="pg">หน้า ${st.nb + 1}/${NB_PAGES}</div><div class="nbtext">${esc(nbText[st.nb])}</div>`;
  return { title: d ? d.title : `สมุดโน้ต หน้า ${st.nb + 1}`, w: Math.round(r.width), h: Math.round(r.height), cls: st.sheet.className.replace('sheet', '').trim(), content, marks: st.cv.toDataURL('image/png'), doc: d };
}
const paperHTML = (cap, s) => `<div class="pgw" style="width:${cap.w * s}px;height:${cap.h * s}px"><div class="sheet ${cap.cls}" style="position:absolute;left:0;top:0;width:${cap.w}px;height:${cap.h}px;transform:scale(${s});transform-origin:top left;box-shadow:0 4px 12px -6px #0005">${cap.content}<img class="marks" src="${cap.marks}" alt=""></div></div>`;
function pinCurrent() {
  const cap = captureCurrent(); closeOverlay(); setView('screen');
  pin?.el.remove(); pin = { cap, s: .46, el: h('div', { id: 'pinDoc' }) };
  document.body.append(pin.el); renderPin(); complete('scan'); S.noise(.12, 2500, .06, 'highpass');
}
function renderPin() {
  if (!pin) return;
  pin.el.innerHTML = `<div class="ph2"><b>📌 ${esc(pin.cap.title)}</b><button data-pz="-1" aria-label="ย่อ">−</button><button data-pz="1" aria-label="ขยาย">＋</button><button data-pscan aria-label="สแกน" title="สแกนเข้าคอม">🖨️</button><button data-px aria-label="วางคืนโต๊ะ">✕</button></div><div class="pb">${paperHTML(pin.cap, pin.s)}</div>`;
}
document.addEventListener('click', e => {
  if (!pin || !e.target.closest('#pinDoc')) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pz) { pin.s = clamp(pin.s + +b.dataset.pz * .08, .26, .9); renderPin(); }
  if ('pscan' in b.dataset) scanCap(pin.cap);
  if ('px' in b.dataset) { pin.el.remove(); pin = null; }
});
let pinDrag = null;
document.addEventListener('pointerdown', e => { const hd = e.target.closest('#pinDoc .ph2'); if (!hd || e.target.closest('button')) return; const r = pin.el.getBoundingClientRect(); pinDrag = { x: e.clientX - r.left, y: e.clientY - r.top }; });
addEventListener('pointermove', e => { if (!pinDrag || !pin) return; pin.el.style.left = clamp(e.clientX - pinDrag.x, 0, innerWidth - 80) + 'px'; pin.el.style.top = clamp(e.clientY - pinDrag.y, 0, innerHeight - 60) + 'px'; pin.el.style.right = 'auto'; });
addEventListener('pointerup', () => { pinDrag = null; });
function scanCap(cap) {
  const name = `สแกน-${cap.title}.pdf`, cd = cap.doc && DESK_CDOC[cap.doc.id];
  let f = FILES.find(x => x.name === name && x.loc !== 'trash');
  if (!f) { f = { id: 'u' + (++uid), name, type: 'pdf', loc: 'desk' }; FILES.push(f); deskPos[f.id] = firstFree(); }
  Object.assign(f, { kind: cd ? 'cdoc' : 'scan', fields: cd, html: `<div class="scanv">${paperHTML(cap, .5)}</div>` });
  closeWin('view-' + f.id, true); renderDesktop(); renderWork();
  S.noise(.8, 1800, .06); S.tone(300, 600, .6, .04); S.toast(`🖨️ สแกนแล้ว ได้ไฟล์ "${name}" บนหน้าจอคอม`, 2.4); complete('scan');
}
function scanCurrent() { scanCap(captureCurrent()); }

/* ================= staged unlocking: new apps, chats and tasks each game day ================= */
const gameDay = () => Math.floor((dayStart(gnow()) - bank.start) / DAY) + 1;
const appOpen = id => (DAYPLAN.apps[id] || 1) <= unlockedDay;
function applyStage() {
  $('taskbar').querySelectorAll('button[data-app]').forEach(b => { b.hidden = (DAYPLAN.bar[b.dataset.app] || 1) > unlockedDay; });
  chat.list.forEach(c => { c.hidden = (DAYPLAN.chats[c.id] || 1) > unlockedDay && !c.forced; });
}
function checkUnlock(quiet) {
  const gd = gameDay(); if (gd <= unlockedDay) return;
  const before = unlockedDay; unlockedDay = gd; applyStage(); renderDesktop(); renderTasks(); renderChat(); syncTaskbar();
  if (quiet) return;
  const inRange = v => v > before && v <= gd;
  const apps = APPS.filter(a => inRange(DAYPLAN.apps[a.id] || 1)).map(a => a.e + ' ' + a.n);
  const chats = chat.list.filter(c => inRange(DAYPLAN.chats[c.id] || 1)).map(c => c.n);
  const nt = TASKS.filter(t => inRange(DAYPLAN.tasks[t.id] || 1)).length;
  if (!apps.length && !chats.length && !nt) return;
  S.big(`วันทำงานที่ ${gd}${nt ? ` · งานใหม่ ${nt} ข้อ` : ''}`, 2.4, '#5a78e6'); S.jingle();
  setTimeout(() => S.toast([apps.length ? '📱 แอปใหม่: ' + apps.join(', ') : '', chats.length ? '💬 แชทใหม่: ' + chats.join(', ') : ''].filter(Boolean).join(' · ') || 'มีงานใหม่ในรายการ', 4), 2600);
  if (chats.length) phoneBuzz();
}

/* ================= living costs ================= */
function livingCosts(d) {
  const dt = new Date(d);
  if (dt.getDate() === 15) addBill('📱', `ค่าโทรศัพท์ + เน็ต (${thDate(d, { month: 'short' })})`, 599, d + 5 * DAY);
  if (dt.getDay() === 0 && d > bank.start) {
    const food = 7 * rint(150, 210), travel = Math.round(5 * bank.home.km * 12), amt = food + travel;
    if (bank.bal >= amt) { bankTx(`🍜 ค่ากิน ${baht(food)} + ค่าเดินทาง ${baht(travel)} (สัปดาห์นี้)`, -amt); bank.notes.push(`🍜 ค่ากินค่าเดินทางสัปดาห์นี้ −${baht(amt)}`); }
    else addBill('🍜', 'ค่ากินค่าเดินทางสัปดาห์นี้ (ติดร้านไว้)', amt, d + 3 * DAY);
  }
}

/* ================= save / load (autosave in this browser) ================= */
const SAVE_KEY = 'cute-office-save-v1';
let noSave = false;
function snapshot() {
  return {
    v: 1, at: Date.now(),
    time: { el: loadOff + (Date.now() - R0) * SPEED, dayOff, timeOff, reachedDay, nightMsgSent, unlockedDay },
    done: [...done], tmin: $('tasks').classList.contains('min'),
    files: FILES, folders: FOLDERS, deskPos, uid, wallNow,
    chat: { account: chat.account, cur: chat.cur, list: chat.list.map(c => ({ ...c, typing: null })) },
    people: Object.fromEntries(Object.entries(PEOPLE).filter(([k]) => k.startsWith('co-'))),
    hr, sisBear, broTold, trip: tripHotel ? tripHotel.id : null,
    bank: { bal: bank.bal, loan: bank.loan, tx: bank.tx, bills: bank.bills, lastDay: bank.lastDay, start: bank.start, home: bank.home }, bid, debts,
    events: EVENTS.map(ev => ({ d: ev.d, e: ev.e, t: ev.t, k: ev.k, a: ev.a, fired: !!ev.fired, mine: ev.mine, mom: ev.mom })),
    meets: MEETS.map(m => ({ id: m.id, d: m.d, done: !!m.done })),
    jobs: [...jobs.applied], gm: gm.best,
    work: { entries: work.entries, right: work.right, batch1: work.batch1, nagged: work.nagged }, cdocs: CDOCS, cdSeq,
    jr: { slot: jr.slot, cur: jr.cur, tries: jr.tries, right: jr.right, used: jr.used },
    ai: { tray: ai.tray, msgs: ai.msgs }, cart: se.cart, food: { pin: food.pin, place: food.place },
    nb: nbText, marks: Object.fromEntries([...canvases].map(([k, c]) => [k, c.toDataURL('image/png')])), dzId,
  };
}
function saveGame() {
  if (noSave) return;
  let s = snapshot(), txt = JSON.stringify(s);
  try { localStorage.setItem(SAVE_KEY, txt); markSaved(); return; } catch (e) {}
  // too big: drop handwriting images and try again
  try { s = JSON.parse(txt); s.marks = {}; s.files.forEach(f => { if (f.html) f.html = f.html.replace(/src="data:image\/png[^"]*"/g, 'src=""'); }); localStorage.setItem(SAVE_KEY, JSON.stringify(s)); markSaved(); } catch (e) {}
}
function markSaved() { const el = $('saveNote'); if (el) el.textContent = '💾 เซฟอัตโนมัติแล้ว ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); }
function loadGame() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
  if (!s || s.v !== 1) return false;
  try {
    loadOff = s.time.el; R0 = Date.now(); dayOff = s.time.dayOff; timeOff = s.time.timeOff; reachedDay = s.time.reachedDay; nightMsgSent = s.time.nightMsgSent; unlockedDay = s.time.unlockedDay || 1;
    done.clear(); s.done.forEach(x => done.add(x)); $('tasks').classList.toggle('min', !!s.tmin);
    FILES.length = 0; FILES.push(...s.files); FOLDERS.length = 0; FOLDERS.push(...s.folders); deskPos = s.deskPos; uid = s.uid;
    chat.account = s.chat.account; chat.cur = s.chat.cur; chat.list.length = 0; chat.list.push(...s.chat.list); Object.assign(PEOPLE, s.people);
    Object.assign(hr, s.hr); sisBear = s.sisBear; broTold = s.broTold; tripHotel = s.trip ? HOTELS.find(x => x.id === s.trip) : null;
    Object.assign(bank, s.bank); bid = s.bid; Object.keys(debts).forEach(k => delete debts[k]); Object.assign(debts, s.debts);
    s.meets.forEach(m => { const mt = MEETS.find(x => x.id === m.id); if (mt) { mt.d = m.d; mt.done = m.done; } });
    EVENTS.length = 0;
    for (const e of s.events) { const ev = { ...e }; ev.fire = () => FIRE[ev.k]?.(ev); if (ev.k === 'meet' || ev.k === 'prep') ev.meet = ev.k === 'meet' ? MEETS.find(m => m.id === ev.a) : undefined; EVENTS.push(ev); }
    EVENTS.sort((a, b) => a.d - b.d);
    s.jobs.forEach(j => jobs.applied.add(j)); Object.assign(gm.best, s.gm);
    work.entries = s.work.entries; work.right = s.work.right; work.batch1 = s.work.batch1; work.nagged = s.work.nagged;
    Object.assign(CDOCS, s.cdocs); cdSeq = s.cdSeq; Object.assign(jr, s.jr);
    ai.tray = s.ai.tray; ai.msgs = s.ai.msgs; se.cart = s.cart || []; food.pin = s.food.pin; food.place = s.food.place;
    s.nb.forEach((t, i) => nbText[i] = t); dzId = s.dzId || dzId;
    for (const [k, url] of Object.entries(s.marks || {})) { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); canvases.set(k, c); }; im.src = url; }
    if (s.wallNow) { wallNow = s.wallNow; screen.style.background = wallNow.startsWith('data:') || wallNow.startsWith('http') ? `center/cover no-repeat url("${wallNow}")` : wallNow; }
    lastMin = '';
    return true;
  } catch (e) { console.error('load failed', e); return false; }
}
setInterval(saveGame, 5000);
addEventListener('pagehide', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
$('resetBtn').addEventListener('click', e => {
  const b = e.currentTarget;
  if (b.dataset.armed) { noSave = true; try { localStorage.removeItem(SAVE_KEY); } catch (er) {} location.reload(); return; }
  b.dataset.armed = '1'; b.textContent = 'กดอีกครั้งเพื่อลบเซฟและเริ่มใหม่';
  setTimeout(() => { delete b.dataset.armed; b.textContent = 'เริ่มเกมใหม่'; }, 3500);
});
