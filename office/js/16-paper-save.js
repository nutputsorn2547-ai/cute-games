"use strict";
// Office game — pinned/scanned papers, staging, save. Files load in order and share one global scope (see office/index.html).
/* ================= desk paper: hold beside the screen / scan to PDF ================= */
let pin = null;
/* zoom 25-300% shared by the pinned paper, scanned files and the work program's document pane */
const ZS = [25, 35, 50, 65, 80, 100, 125, 150, 200, 250, 300];
const zStep = (pct, d) => { let i = 0; ZS.forEach((v, k) => { if (Math.abs(v - pct) < Math.abs(ZS[i] - pct)) i = k; }); return ZS[clamp(i + d, 0, ZS.length - 1)]; };
const zBar = (pct, reset) => `<button data-zm="-1" aria-label="ย่อ">−</button><button class="zv" data-zm="0" title="กลับขนาดเดิม">${pct}%</button><button data-zm="1" aria-label="ขยาย">＋</button>`;
const zoomView = html => `<div class="zhost" data-z="100"><div class="zbar"><span>🔍 ซูม</span>${zBar(100)}<small>Ctrl + ล้อเมาส์ก็ได้</small></div><div class="zscroll"><div class="zwrap">${html}</div></div></div>`;
function setZoom(host, pct) {
  host.dataset.z = pct; host.querySelector('.zwrap').style.zoom = pct / 100; host.querySelector('.zv').textContent = pct + '%';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.zhost [data-zm]'); if (!b) return; const host = b.closest('.zhost');
  setZoom(host, b.dataset.zm === '0' ? 100 : zStep(+host.dataset.z || 100, +b.dataset.zm));
});
document.addEventListener('wheel', e => {
  if (!e.ctrlKey) return; const host = e.target.closest('.zhost'), pn = e.target.closest('#pinDoc');
  if (host) { e.preventDefault(); setZoom(host, zStep(+host.dataset.z || 100, e.deltaY < 0 ? 1 : -1)); }
  else if (pn && pin) { e.preventDefault(); pin.s = zStep(pin.s * 100, e.deltaY < 0 ? 1 : -1) / 100; renderPin(); }
}, { passive: false });
function captureCurrent() {
  const st = ov.state, r = st.sheet.getBoundingClientRect(), d = st.doc;
  const content = d ? `<div class="content">${d.html}</div>` : `<div class="pg">หน้า ${st.nb + 1}/${NB_PAGES}</div><div class="nbtext">${esc(nbText[st.nb])}</div>`;
  return { title: d ? d.title : `สมุดโน้ต หน้า ${st.nb + 1}`, w: Math.round(r.width), h: Math.round(r.height), cls: st.sheet.className.replace('sheet', '').trim(), content, marks: st.cv.toDataURL('image/png'), doc: d };
}
const paperHTML = (cap, s) => `<div class="pgw" style="width:${cap.w * s}px;height:${cap.h * s}px"><div class="sheet ${cap.cls}" style="position:absolute;left:0;top:0;width:${cap.w}px;height:${cap.h}px;transform:scale(${s});transform-origin:top left;box-shadow:0 4px 12px -6px #0005">${cap.content}<img class="marks" src="${cap.marks}" alt=""></div></div>`;
function pinCurrent() {
  const cap = captureCurrent(); closeOverlay(); setView('screen');
  pin?.el.remove(); pin = { cap, s: .5, el: h('div', { id: 'pinDoc' }) };
  document.body.append(pin.el); renderPin(); complete('scan'); S.noise(.12, 2500, .06, 'highpass');
}
function renderPin() {
  if (!pin) return;
  pin.el.innerHTML = `<div class="ph2"><b>📌 ${esc(pin.cap.title)}</b><button data-pz="-1" aria-label="ย่อ">−</button><button class="zv" data-pz="0" title="กลับ 50%">${Math.round(pin.s * 100)}%</button><button data-pz="1" aria-label="ขยาย">＋</button><button data-pscan aria-label="สแกน" title="สแกนเข้าคอม">🖨️</button><button data-px aria-label="วางคืนโต๊ะ">✕</button></div><div class="pb">${paperHTML(pin.cap, pin.s)}</div>`;
}
document.addEventListener('click', e => {
  if (!pin || !e.target.closest('#pinDoc')) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pz) { pin.s = b.dataset.pz === '0' ? .5 : zStep(pin.s * 100, +b.dataset.pz) / 100; renderPin(); }
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
const keyOf = n => 'cute-office-save-v1-' + n;
let slot = 1; try { slot = Math.min(3, Math.max(1, +localStorage.getItem('cute-office-active-slot') || 1)); } catch (e) {}
// the first version had one save without a slot number: move it into slot 1
try { const old = localStorage.getItem('cute-office-save-v1'); if (old) { if (!localStorage.getItem(keyOf(1))) localStorage.setItem(keyOf(1), old); localStorage.removeItem('cute-office-save-v1'); } } catch (e) {}
const SAVE_KEY = keyOf(slot);
let saveName = '';
let noSave = false;
function snapshot() {
  return {
    v: 1, at: Date.now(), name: saveName || `เซฟ ${slot}`,
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
    mail: { accounts: mail.accounts, inbox: mail.inbox }, perf, hunger: { v: hunger.v, day: hunger.day }, notes, noteSeq,
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
function markSaved() { const el = $('saveNote'); if (el) el.textContent = `💾 ช่อง ${slot} · เซฟแล้ว ` + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); }
function loadGame() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
  if (!s || s.v !== 1) return false;
  try {
    saveName = s.name || '';
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
    if (s.mail) { mail.accounts = s.mail.accounts; mail.inbox = s.mail.inbox; mail.inbox.forEach(m => { m.nt = 1; }); } if (s.perf) Object.assign(perf, s.perf); if (s.hunger) { hunger.v = s.hunger.v; hunger.day = s.hunger.day; hunger.t = null; }
    if (s.notes) { noteSeq = s.noteSeq || 0; s.notes.forEach(n => { notes.push(n); renderNote(n); }); }
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
/* ---- save slots: 3 separate games, switch / copy / export / import ---- */
const SLOTS = 3, ACTIVE_KEY = 'cute-office-active-slot';
function slotSummary(n) {
  let s = null; try { s = JSON.parse(localStorage.getItem(keyOf(n)) || 'null'); } catch (e) { s = null; }
  if (!s || s.v !== 1) return null;
  const g = new Date(T0 + s.time.el + s.time.dayOff * DAY + s.time.timeOff);
  return { name: s.name || `เซฟ ${n}`, game: g, day: s.time.unlockedDay || 1, done: s.done.length, bal: s.bank.bal, at: s.at, raw: s };
}
function switchSlot(n, fresh) {
  saveGame(); noSave = true;
  try { if (fresh) localStorage.removeItem(keyOf(n)); localStorage.setItem(ACTIVE_KEY, String(n)); } catch (e) {}
  location.reload();
}
function writeSlot(n, data) { try { localStorage.setItem(keyOf(n), JSON.stringify(data)); return true; } catch (e) { S.toast('พื้นที่เซฟในเบราว์เซอร์เต็ม ลองลบเซฟที่ไม่ใช้ก่อนนะ', 2.5); return false; } }
function openSaves() {
  if (currentView !== 'screen') setView('screen');
  const W = openWin('saves', '💾 เซฟเกม', h('div', { class: 'sv' }), 580, 500, '#fff7d6'); renderSaves(W); return W;
}
function renderSaves(W = wins.get('saves')) {
  if (!W) return; saveGame();
  const box = W.body.firstChild, rows = [];
  for (let n = 1; n <= SLOTS; n++) {
    const m = slotSummary(n), on = n === slot;
    rows.push(`<div class="svr ${on ? 'on' : ''}"><div class="svn">${n}</div><div class="svi">${m ? `<b>${esc(m.name)}</b>${on ? ' <span class="svb">กำลังเล่น</span>' : ''}<br><small>ในเกม: ${thDate(m.game, { day: 'numeric', month: 'short', year: 'numeric' })} ${p2(m.game.getHours())}:${p2(m.game.getMinutes())} · วันทำงานที่ ${m.day} · ทำงานเสร็จ ${m.done} ข้อ · เงิน ${baht(m.bal)} บาท</small><br><small style="color:var(--soft)">เซฟล่าสุด ${new Date(m.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>` : `<b style="color:var(--soft)">ช่องว่าง</b>${on ? ' <span class="svb">กำลังเล่น</span>' : ''}`}</div>
      <div class="sva">${on ? `<button class="btn2" data-sv="rename" data-n="${n}">✏️ ตั้งชื่อ</button><button class="btn2" data-sv="export" data-n="${n}">⬇ ส่งออกไฟล์</button><button class="btn2" data-sv="restart" data-n="${n}">🔄 เริ่มใหม่ในช่องนี้</button>`
        : m ? `<button class="btn2 pri" data-sv="play" data-n="${n}">▶ เล่นเซฟนี้</button><button class="btn2" data-sv="copy" data-n="${n}">📋 บันทึกเกมนี้ทับ</button><button class="btn2" data-sv="rename" data-n="${n}">✏️ ตั้งชื่อ</button><button class="btn2" data-sv="export" data-n="${n}">⬇ ส่งออก</button><button class="btn2" data-sv="del" data-n="${n}" style="color:#e0457b">🗑 ลบ</button>`
        : `<button class="btn2 pri" data-sv="new" data-n="${n}">✨ เริ่มเกมใหม่ที่นี่</button><button class="btn2" data-sv="copy" data-n="${n}">📋 คัดลอกเกมนี้มาไว้</button><button class="btn2" data-sv="import" data-n="${n}">⬆ นำเข้าไฟล์</button>`}</div></div>`);
  }
  box.innerHTML = rows.join('') + `<p class="svnote">เกมเซฟอัตโนมัติลงช่องที่กำลังเล่นทุก 5 วินาที · เซฟเก็บในเบราว์เซอร์เครื่องนี้ ถ้าจะย้ายไปเล่นเครื่องอื่นให้ "ส่งออกไฟล์" แล้ว "นำเข้าไฟล์" ที่เครื่องใหม่</p><input type="file" accept=".json,application/json" hidden>`;
  box.onclick = e => { const b = e.target.closest('[data-sv]'); if (b) saveAction(W, b.dataset.sv, +b.dataset.n); };
  box.querySelector('input[type=file]').onchange = e => importSave(W, e.target);
}
async function saveAction(W, act, n) {
  const m = slotSummary(n), label = m ? `"${esc(m.name)}"` : `ช่อง ${n}`;
  if (act === 'play') return switchSlot(n);
  if (act === 'new') return switchSlot(n, true);
  if (act === 'restart') { const { v } = await dialog(W, `ลบความคืบหน้าของ ${label} แล้วเริ่ม 1 ม.ค. 2569 ใหม่?`, [['ยกเลิก', null], ['เริ่มใหม่', 'ok', 'pri']]); if (v === 'ok') { noSave = true; switchSlot(n, true); } return; }
  if (act === 'copy') {
    if (m) { const { v } = await dialog(W, `บันทึกเกมที่กำลังเล่นทับ ${label}? ข้อมูลเดิมในช่องนั้นจะหาย`, [['ยกเลิก', null], ['บันทึกทับ', 'ok', 'pri']]); if (v !== 'ok') return; }
    const s = snapshot(); s.name = (m && m.name) || `สำเนาจากช่อง ${slot}`;
    if (writeSlot(n, JSON.parse(JSON.stringify(s)))) { S.toast(`บันทึกเกมนี้ลงช่อง ${n} แล้ว`, 2); S.tone(600, 900, .1, .07, 'triangle'); }
    return renderSaves(W);
  }
  if (act === 'rename') {
    const { v, text } = await dialog(W, `ตั้งชื่อเซฟช่อง ${n}`, [['ยกเลิก', null], ['บันทึก', 'ok', 'pri']], m ? m.name : `เซฟ ${n}`);
    if (v !== 'ok' || !text) return;
    if (n === slot) { saveName = text; saveGame(); } else if (m) { m.raw.name = text; writeSlot(n, m.raw); }
    return renderSaves(W);
  }
  if (act === 'del') { const { v } = await dialog(W, `ลบเซฟ ${label} ถาวร?`, [['ยกเลิก', null], ['ลบ', 'ok', 'pri']]); if (v === 'ok') { try { localStorage.removeItem(keyOf(n)); } catch (e) {} renderSaves(W); } return; }
  if (act === 'export') {
    if (n === slot) saveGame();
    const raw = localStorage.getItem(keyOf(n)); if (!raw) return;
    const a = h('a', { download: `ออฟฟิศจำลอง-${(m ? m.name : 'เซฟ' + n).replace(/[\\/:*?"<>|]/g, '')}.json` }); a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    S.toast('ดาวน์โหลดไฟล์เซฟลงเครื่องแล้ว', 2); return;
  }
  if (act === 'import') { const inp = W.body.querySelector('input[type=file]'); inp.dataset.n = n; inp.click(); }
}
function importSave(W, inp) {
  const f = inp.files && inp.files[0], n = +inp.dataset.n; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    let s = null; try { s = JSON.parse(rd.result); } catch (e) { s = null; }
    inp.value = '';
    if (!s || s.v !== 1 || !s.time || !s.files) { S.toast('ไฟล์นี้ไม่ใช่ไฟล์เซฟของออฟฟิศจำลอง', 2.5); return; }
    if (writeSlot(n, s)) { S.toast(`นำเข้าเซฟลงช่อง ${n} แล้ว กด "เล่นเซฟนี้" เพื่อเล่นต่อ`, 2.6); renderSaves(W); }
  };
  rd.readAsText(f);
}
$('savesBtn').addEventListener('click', openSaves);

