"use strict";
// Office game — calendar. Files load in order and share one global scope (see office/index.html).
/* ================= calendar: fast-forward days, never back ================= */
const DAY = 86400000;
let dayOff = 0, reachedDay = 0, tripHotel = null;
const dayStart = t => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };
const thDate = (t, o = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => new Date(t).toLocaleDateString('th-TH', o);
const EVENTS = [];
const cal = { W: null, y: 0, m: 0, sel: 0 };
const FIRE = {}; // event kinds by key, so the calendar can be saved and restored
function addEvent(d, e, t, k, extra = {}) { const ev = { d: dayStart(d), e, t, k, ...extra }; ev.fire = () => FIRE[ev.k]?.(ev); EVENTS.push(ev); EVENTS.sort((a, b) => a.d - b.d); return ev; }
FIRE.close5 = () => pushMsg('g', 'boss', 'วันนี้ปิดงบประจำเดือนนะ ใครยังไม่ส่งใบเสร็จ ส่งด่วนเลย 📒', 1500);
FIRE.salary = () => salaryDay();
FIRE.momBday = () => { S.big('🎂 วันนี้วันเกิดแม่!', 2.2, '#e0457b'); pushMsg('sis', 'sis', 'พี่ๆ วันนี้วันเกิดแม่นะ อย่าลืมส่งคำอวยพร 🎂', 2000); };
FIRE.trip = () => { pushMsg('g', 'boss', tripHotel ? `ถึงวันทริปแล้ว! เจอกันที่ ${tripHotel.name} นะทุกคน 🚐` : 'ถึงวันทริปแล้ว แต่… เรายังไม่ได้จองที่พักเลยนี่ 😱', 1500); pushMsg('g', 'duck', tripHotel ? 'เย้ๆ ไปเที่ยวแล้ว 🏖️' : 'ตายแล้วววว 😭', 3000); };
FIRE.ny = () => { S.big('🎆 สวัสดีปีใหม่!', 2.4, '#5a78e6'); pushMsg('mom', 'mom', 'สวัสดีปีใหม่ลูก ขอให้มีความสุขมากๆ แข็งแรงๆ นะ ❤️', 1800); pushMsg('g', 'boss', 'สวัสดีปีใหม่ทุกคน ขอบคุณที่ทำงานหนักมาทั้งปี 🎆', 3200); pushMsg('sis', 'sis', 'แฮปปี้นิวเยียร์พี่ 🎉', 4500); };
FIRE.raise = () => { if (!hr.pending) return; hr.base = hr.pending; hr.pending = 0; S.toast(`📈 เงินเดือนใหม่ ${baht(hr.base)} บาท มีผลวันนี้`, 2.5); renderBank(); };
FIRE.interview = ev => interviewDay(JOBS.find(j => j.id === ev.a));
FIRE.user = ev => { S.big('⏰ ' + ev.t, 2.2, '#e8742b'); S.jingle(); };
FIRE.prep = ev => { const mt = MEETS.find(m => m.id === ev.a); if (mt && !mt.done) pushMsg('boss', 'boss', `พรุ่งนี้ ${mt.t} 10 โมงนะ อย่าลืมเอาเอกสารใส่โฟลเดอร์ "เอกสารประชุม" ให้ครบ 📁`, 1500); };
FIRE.meet = ev => holdMeeting(MEETS.find(m => m.id === ev.a));
function buildEvents() {
  const s0 = dayStart(gnow()), y = new Date(s0).getFullYear();
  for (let k = 0; k < 13; k++) {
    const b = new Date(s0); b.setDate(1); b.setMonth(b.getMonth() + k);
    addEvent(new Date(b.getFullYear(), b.getMonth(), 5), '📒', 'ปิดงบประจำเดือน', 'close5');
    addEvent(new Date(b.getFullYear(), b.getMonth(), 25), '💰', 'เงินเดือนออก', 'salary');
  }
  addEvent(s0 + 9 * DAY, '🎂', 'วันเกิดแม่', 'momBday', { mom: 1 });
  let ny = new Date(y, 11, 30); if (ny.getTime() < s0) ny = new Date(y + 1, 11, 30);
  addEvent(ny, '🎉', 'ทริปปีใหม่บริษัท', 'trip');
  addEvent(new Date(ny.getFullYear() + 1, 0, 1), '🎆', 'วันขึ้นปีใหม่', 'ny');
  EVENTS.forEach(ev => { if (ev.d <= s0) ev.fired = true; });
  reachedDay = s0;
}
buildEvents();
function salaryDay() {
  bankTx('💼 เงินเดือน', hr.base); renderBank(); S.big('💰 เงินเดือนออก!', 2, '#2f9d5a');
  pushMsg('hr', 'hr', `เงินเดือน ${baht(hr.base)} บาท โอนเข้าบัญชีแล้วนะคะ 💰 ยอดในบัญชีตอนนี้ ${baht(bank.bal)} บาท`, 1600);
  if (Math.random() < .5) pushMsg('dad', 'dad', 'เงินเดือนออกแล้วเลี้ยงข้าวพ่อด้วยนะ 555', 3600);
}
function interviewDay(j) {
  const pid = 'co-' + j.id;
  pushMsg(pid, pid, `ขอบคุณที่มาสัมภาษณ์นะคะ ผลคือ… ผ่านค่ะ 🎉 ยินดีต้อนรับสู่ ${j.co} เริ่มงาน 1 ก.พ. นะคะ`, 1800);
  pushMsg('gang', 'fon', 'แกได้งานใหม่แล้วเหรอ!! 😭🎉 เลี้ยงส่งด้วยนะ', 4000);
  pushMsg('mom', 'mom', 'แม่ได้ยินว่าลูกได้งานใหม่ แม่ดีใจด้วยนะ 🥹', 5500);
  const off = Math.round((j.min + j.max) / 2 / 500) * 500;
  mailPush(null, 'HR ' + j.co, `ผลการสัมภาษณ์: ผ่าน! เสนองาน ${j.pos}`, `<p>ยินดีด้วยค่ะ 🎉</p><p>ทาง ${esc(j.co)} ขอเสนองานตำแหน่ง <b>${esc(j.pos)}</b> เงินเดือน <b>${baht(off)} บาท</b> เริ่มงาน 1 ก.พ.</p><p>สวัสดิการ: ${j.perks.map(esc).join(' · ')}</p><p>กรุณาตอบรับภายใน 7 วัน</p>`, 'job');
}
// keep the game date from ever going backwards (the time setter can only move within the day)
function enforceDate() {
  const d = dayStart(gnow()); if (d < reachedDay) dayOff += Math.round((reachedDay - d) / DAY);
  reachedDay = Math.max(reachedDay, dayStart(gnow())); checkUnlock(); bankTick(); checkEvents();
}
let txDate = null, firedAcc = [];
function fireUpTo(day) {
  const hit = EVENTS.filter(ev => !ev.fired && ev.d <= day);
  hit.forEach(ev => { ev.fired = true; const keep = txDate; txDate = ev.d + 10 * 3600000; try { ev.fire?.(ev); } catch (er) { console.error(er); } txDate = keep; });
  firedAcc.push(...hit);
}
function checkEvents() {
  fireUpTo(dayStart(gnow())); if (!firedAcc.length) return; const hit = firedAcc; firedAcc = [];
  S.toast('📅 ' + hit.map(ev => `${ev.e} ${ev.t}`).join(' · '), 3); complete('cal'); renderCal();
}
function advanceDays(n) {
  if (n <= 0) { S.toast('ย้อนเวลาไม่ได้นะ ⏳ ไปได้แต่ข้างหน้า', 2); S.tone(300, 200, .15, .08); return; }
  dayOff += n; enforceDate(); lastMin = '';
  S.big('⏩ ' + thDate(gnow(), { weekday: 'short', day: 'numeric', month: 'short' }), 1.6, '#5a78e6'); S.noise(.35, 2400, .06, 'highpass'); S.tone(500, 1200, .25, .07, 'triangle');
  const g = gnow(); cal.y = g.getFullYear(); cal.m = g.getMonth(); cal.sel = dayStart(g); renderCal(); renderTime(); updateDeskCal();
}
function openCal() {
  if (cal.W && wins.has('cal')) { focusWin(cal.W); return cal.W; }
  const g = gnow(); cal.y = g.getFullYear(); cal.m = g.getMonth(); cal.sel = dayStart(g);
  cal.W = openWin('cal', 'ปฏิทินน้อย', h('div', { class: 'cal' }), 760, 470, '#ffeef4'); cal.W.onClose = () => { cal.W = null; };
  cal.W.body.style.overflow = 'hidden';
  const box = cal.W.body.firstChild;
  box.addEventListener('click', calClick);
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.addev input')) { e.preventDefault(); addUserEvent(); } });
  renderCal(); return cal.W;
}
function renderCal() {
  if (!cal.W) return; const box = cal.W.body.firstChild, today = dayStart(gnow());
  const first = new Date(cal.y, cal.m, 1), start = dayStart(new Date(cal.y, cal.m, 1 - first.getDay()));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = dayStart(start + i * DAY + 3 * 3600000), dt = new Date(d), evs = EVENTS.filter(ev => ev.d === d);
    const cls = [dt.getMonth() !== cal.m ? 'out' : '', d < today ? 'past' : '', d === today ? 'today' : '', d === cal.sel ? 'sel' : ''].join(' ');
    cells += `<button class="dc ${cls}" data-day="${d}"><span>${dt.getDate()}</span>${evs.slice(0, 2).map(ev => `<i>${ev.e} ${esc(ev.t)}</i>`).join('')}${evs.length > 2 ? `<i>+${evs.length - 2}</i>` : ''}${bank.bills.some(b => !b.paid && b.due === d) ? '<i style="background:#ffe1e6">🧾 ครบกำหนดจ่าย</i>' : ''}</button>`;
  }
  const sel = cal.sel, sEvs = EVENTS.filter(ev => ev.d === sel), next = EVENTS.find(ev => !ev.fired && ev.d > today), up = EVENTS.filter(ev => ev.d > today).slice(0, 5), g = gnow();
  const days = Math.round((sel - today) / DAY);
  box.innerHTML = `<div class="mo"><div class="mh"><button class="btn2" data-mv="-1" aria-label="เดือนก่อน">‹</button><b>${thDate(new Date(cal.y, cal.m, 1), { month: 'long', year: 'numeric' })}</b><button class="btn2" data-mv="1" aria-label="เดือนถัดไป">›</button><button class="btn2" data-mv="0">วันนี้</button></div>
    <div class="gr">${['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(x => `<div class="dn">${x}</div>`).join('')}${cells}</div></div>
    <div class="sd"><div class="now"><small>วันนี้ในเกม</small><b>${g.getDate()}</b>${thDate(g)}<br><small>${p2(g.getHours())}:${p2(g.getMinutes())} น.</small></div>
    <div class="ff"><button class="btn2 pri" data-adv="1">⏩ +1 วัน</button><button class="btn2 pri" data-adv="7">⏩ +7 วัน</button></div>
    ${next ? `<button class="btn2 org" data-next>⏭ ข้ามไป ${next.e} ${esc(next.t)}<br><small>${thDate(next.d, { day: 'numeric', month: 'short' })} · อีก ${Math.round((next.d - today) / DAY)} วัน</small></button>` : ''}
    <h5>${thDate(sel, { weekday: 'short', day: 'numeric', month: 'long' })}</h5>
    ${sEvs.map(ev => `<div class="ev ${ev.fired && ev.d < today ? 'done' : ''}">${ev.e} ${esc(ev.t)}</div>`).join('') || '<div class="ev" style="color:var(--soft)">ไม่มีอีเวนต์</div>'}
    ${sEvs.filter(ev => ev.meet && !ev.meet.done && !ev.fired).map(ev => `<div class="ev" style="flex-direction:column;align-items:flex-start;border:0;background:#fff6e0;border-radius:8px;padding:6px 8px"><b style="font-weight:500">📁 ต้องใส่โฟลเดอร์ "เอกสารประชุม"</b>${ev.meet.req.map(r => `<span>${FILES.some(f => f.loc === 'meet' && r.ok(f)) ? '✅' : '⬜'} ${esc(r.n)}</span>`).join('')}</div>`).join('')}
    ${bank.bills.filter(b => !b.paid && b.due === sel).map(b => `<div class="ev">🧾 ครบกำหนด: ${esc(b.n)} ${baht(b.amt)} บาท</div>`).join('')}
    ${days > 0 ? `<button class="btn2 grn" data-jump>⏩ ข้ามไปวันนี้ (อีก ${days} วัน)</button>` : days < 0 ? '<div class="ev" style="color:#e0457b;border:0">ผ่านไปแล้ว ย้อนกลับไม่ได้ 🙅</div>' : ''}
    ${days >= 0 ? '<div class="addev"><input type="text" placeholder="เพิ่มอีเวนต์ เช่น ส่งงานลูกค้า" spellcheck="false"><button class="btn2" data-add>เพิ่ม</button></div>' : ''}
    <h5>กำลังจะมาถึง</h5>${up.map(ev => `<div class="ev">${ev.e} ${esc(ev.t)}<span style="margin-left:auto;color:var(--soft);white-space:nowrap">${thDate(ev.d, { day: 'numeric', month: 'short' })}</span></div>`).join('')}
    <button class="btn2" data-time>🕘 ตั้งเวลาในวันนี้</button></div>`;
}
function calClick(e) {
  const t = e.target, dc = t.closest('[data-day]');
  if (dc) { cal.sel = +dc.dataset.day; const d = new Date(cal.sel); if (d.getMonth() !== cal.m) { cal.y = d.getFullYear(); cal.m = d.getMonth(); } if (cal.sel < dayStart(gnow())) S.toast('วันนี้ผ่านไปแล้ว ย้อนกลับไม่ได้นะ ⏳', 1.6); renderCal(); S.tone(800, 900, .03, .04); return; }
  const mv = t.closest('[data-mv]');
  if (mv) { if (+mv.dataset.mv === 0) { const g = gnow(); cal.y = g.getFullYear(); cal.m = g.getMonth(); cal.sel = dayStart(g); } else { const d = new Date(cal.y, cal.m + +mv.dataset.mv, 1); cal.y = d.getFullYear(); cal.m = d.getMonth(); } renderCal(); return; }
  const adv = t.closest('[data-adv]'); if (adv) { advanceDays(+adv.dataset.adv); return; }
  if (t.closest('[data-next]')) { const today = dayStart(gnow()), nx = EVENTS.find(ev => !ev.fired && ev.d > today); if (nx) advanceDays(Math.round((nx.d - today) / DAY)); return; }
  if (t.closest('[data-jump]')) { advanceDays(Math.round((cal.sel - dayStart(gnow())) / DAY)); return; }
  if (t.closest('[data-add]')) { addUserEvent(); return; }
  if (t.closest('[data-time]')) openTime();
}
function addUserEvent() {
  const inp = cal.W.body.querySelector('.addev input'), txt = inp.value.trim(); if (!txt) { inp.focus(); return; }
  const today = dayStart(gnow());
  addEvent(cal.sel, '📌', txt, 'user', { mine: 1, fired: cal.sel <= today });
  renderCal(); S.tone(700, 1100, .08, .07, 'triangle'); S.toast(cal.sel === today ? 'เพิ่มอีเวนต์ของวันนี้แล้ว' : 'เพิ่มอีเวนต์แล้ว ถึงวันจะมีแจ้งเตือน ⏰', 1.8);
}
const deskCal = deskItem('', 33, 4, 4, '<div class="dcal"><div class="mh2"></div><b></b><small></small></div>', 'dcal');
function updateDeskCal() { const g = gnow(); deskCal.querySelector('.mh2').textContent = thDate(g, { month: 'short' }); deskCal.querySelector('b').textContent = g.getDate(); deskCal.querySelector('small').textContent = thDate(g, { weekday: 'short' }); }
updateDeskCal();
