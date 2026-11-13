"use strict";
// Office game — hunger (skip lunch and you cannot work) and phone calls from outside the office.
/* ================= hunger ================= */
const hunger = { v: 70, t: null, day: null, warn: 0, starved: false };
const HUNGRY = 35, STARVING = 15;
function foodGain(n, p) {
  if (/ชา|โกโก้|นม|น้ำ(?!ซุป)|โซดา|กาแฟ/.test(n)) return /ไข่มุก|บราวน์/.test(n) ? 14 : 9;
  if (/ซุป/.test(n)) return 8;
  if (/ข้าวเหนียว/.test(n)) return 12;
  if (/เพิ่ม/.test(n)) return 6;
  if (/เกี๊ยว|ทอดกรอบ|ขนม/.test(n)) return 14;
  return clamp(Math.round(p * .6), 8, 40);
}
const cartGain = () => cartItems().reduce((s, [m, q]) => s + foodGain(m[0], m[1]) * q, 0);
function eat(gain) {
  hunger.v = Math.min(100, hunger.v + gain); hunger.starved = false; hunger.warn = 0;
  S.toast(`😋 อิ่มขึ้น +${gain} (ตอนนี้ ${Math.round(hunger.v)}/100)`, 2.4);
  const hr = gHour(); if (hr >= 11 && hr < 15) complete('eat');
  starveSync(); hungerHud();
}
let hungerLast = 0;
function hungerTick() {
  const rt = performance.now(); if (rt - hungerLast < 1000) return; hungerLast = rt;
  const now = gnow().getTime(); if (hunger.t == null || now < hunger.t) hunger.t = now;
  let rem = now - hunger.t, t = hunger.t;
  while (rem > 0) { const step = Math.min(rem, 600000), hr = new Date(t + step / 2).getHours(); if (hr >= 8 && hr < 22) hunger.v = Math.max(0, hunger.v - 8 * step / 3600000); t += step; rem -= step; }
  hunger.t = now;
  const day = dayStart(now); if (hunger.day !== day) { hunger.day = day; hunger.v = Math.max(hunger.v, 60); hunger.warn = 0; hunger.starved = false; }
  if (hunger.v < HUNGRY && !hunger.warn) { hunger.warn = 1; S.toast('🍽️ ท้องร้องแล้ว… สั่งข้าวในแอป “หิวแล้ว” ก่อนจะทำงานไม่ไหวนะ', 4); S.tone(200, 120, .5, .08); }
  if (hunger.v < STARVING && !hunger.starved) { hunger.starved = true; S.big('หิวจนทำงานต่อไม่ได้แล้ว 😵', 2.4, '#e5536f'); pushMsg('g', 'bear', 'ใครยังไม่กินข้าวบ้าง? ฉันหิวจนตาลาย 🥲', 2000); }
  starveSync(); hungerHud();
}
function starveSync() {
  const starving = hunger.v < STARVING;
  for (const [id, W] of wins) { const work = id === 'work' || /^(word-|design|dz)/.test(id) || !!W.book; W.el.classList.toggle('starve', starving && work); }
}
function hungerHud() {
  let el = $('hungerHud'); if (!el) { el = h('span', { id: 'hungerHud', title: 'ความอิ่ม: ต่ำกว่า 35 จะหิว ต่ำกว่า 15 ทำงานไม่ได้' }, '<i></i><span class="hv"></span>'); $('clock').before(el); }
  const v = Math.round(hunger.v); el.dataset.lv = v < STARVING ? 'bad' : v < HUNGRY ? 'low' : 'ok';
  el.firstChild.style.setProperty('--p', v + '%'); el.querySelector('.hv').textContent = '🍚 ' + v;
}

/* ================= calls from outside ================= */
const CALLS = [
  { from: 'คุณขนม (ลูกค้า)', q: 'ใบแจ้งหนี้ที่ส่งไปเมื่อวาน ต้องชำระภายในกี่วันคะ?', o: [['ภายใน 30 วันนับจากวันที่ออกเอกสารค่ะ', 1], ['ไม่ทราบค่ะ ไปถามคนอื่นนะคะ', 0], ['จ่ายเมื่อไหร่ก็ได้ค่ะ ไม่ต้องรีบ', 0]] },
  { from: 'บริษัท ปลาทอง โลจิสติกส์', q: 'สนใจบริการทำบัญชีรายเดือน มีเอกสารประมาณ 80 ใบ ขอทราบวิธีเริ่มงานหน่อยครับ', o: [['ยินดีค่ะ ขอรายละเอียดบริษัทและนัดคุยสั้นๆ ก่อน แล้วจะส่งใบเสนอราคาให้ทางอีเมลค่ะ', 1], ['ตอนนี้ไม่ว่าง โทรมาใหม่ปีหน้านะ', 0], ['ทำให้ฟรีไปเลยค่ะ', 0]] },
  { from: 'สำนักงานสอบบัญชี ดาวเด่น', q: 'ขอทราบว่าเอกสารต้นทุนปลายเดือนเตรียมไว้ในโฟลเดอร์แล้วหรือยังคะ?', o: [['เตรียมให้ครบแล้วค่ะ อยู่ในโฟลเดอร์เอกสาร พร้อมให้ตรวจ', 1], ['ยังไม่ได้เริ่มเลยค่ะ ช่างมันเถอะ', 0], ['เอกสารหายหมดแล้วค่ะ', 0]] },
  { from: 'ร้านเครื่องเขียนดาวเรือง', q: 'ใบเสร็จเดือนก่อน ยอดตรงกับที่บันทึกไว้ไหมคะ ขอยืนยันหน่อยค่ะ', o: [['ขอเช็กกับระบบสักครู่นะคะ แล้วจะแจ้งกลับทางอีเมลค่ะ', 1], ['ตรงค่ะ ไม่ต้องเช็ก', 0], ['ไม่รู้ ไม่เกี่ยวกับฉัน', 0]] },
  { from: 'ช้างน้อย เทค', q: 'อยากนัดคุยงานแดชบอร์ดให้ลูกค้า สะดวกวันไหนครับ?', o: [['ขอเช็กปฏิทินก่อนนะคะ เดี๋ยวส่งวันที่ว่างให้ทางอีเมลค่ะ', 1], ['ไม่ว่างตลอดชีวิตค่ะ', 0], ['วันนี้ตอนนี้เลย!', 0]] },
  { from: 'ธนาคารน้อย (ฝ่ายบริการ)', q: 'ต้องการยืนยันรายการโอนเงินจำนวนมากวันนี้ใช่ไหมคะ?', o: [['ขอตรวจสอบรายการในแอปธนาคารก่อนยืนยันนะคะ', 1], ['ยืนยันค่ะ ไม่ต้องตรวจ', 0], ['บอกรหัสผ่านให้เลยไหมคะ', 0]] },
  { from: 'ลูกค้าท่านหนึ่ง', q: 'ขอสำเนาใบกำกับภาษีเดือนที่แล้วหน่อยได้ไหมครับ?', o: [['ได้ค่ะ ขอเลขที่เอกสาร แล้วจะส่งสำเนาให้ทางอีเมลค่ะ', 1], ['หมดเวลาทำการแล้วค่ะ', 0], ['ไม่เคยออกให้ค่ะ', 0]] },
];
const call = { next: null, active: null };
function callTick() {
  const now = gnow().getTime(); if (call.active) return;
  if (call.next == null) call.next = now + 1.5 * 3600000;
  const hr = new Date(now).getHours(), wd = new Date(now).getDay();
  if (now < call.next) return; if (wd === 0 || wd === 6 || hr < 9 || hr >= 17) { if (hr >= 17 || wd === 0 || wd === 6) call.next = now + 3600000; return; }
  ring();
}
function ring() {
  let def;
  const pend = mail.inbox.filter(m => m.imp && !m.replied && !m.missed && arrived(m));
  if (pend.length && Math.random() < .4) { const m = pick(pend); def = { from: m.from, q: `ส่งอีเมลเรื่อง “${m.subj}” ไปแล้ว ยังไม่เห็นตอบเลย ได้รับหรือยังคะ?`, o: [['ได้รับแล้วค่ะ ขออภัยที่ช้า เดี๋ยวตอบกลับภายในวันนี้เลยค่ะ', 1], ['ยังไม่ได้เปิดดูเลย ไว้ก่อนนะ', 0], ['ไม่ได้รับค่ะ คุณส่งผิดหรือเปล่า', 0]] }; } else def = pick(CALLS);
  const el = h('div', { id: 'callPop' }, `<div class="cp-h"><i>📞</i><div><b>${esc(def.from)}</b><small>โทรเข้ามา…</small></div></div><div class="cp-b"><button class="btn2 grn" data-ca="1">✅ รับสาย</button><button class="btn2" data-ca="0">❌ วางสาย</button></div>`);
  document.body.append(el); call.active = { def, el, state: 'ring', t0: performance.now() };
  const rt = setInterval(() => { if (call.active?.el !== el || call.active.state !== 'ring') return clearInterval(rt); S.tone(880, 880, .25, .08, 'triangle'); setTimeout(() => S.tone(660, 660, .25, .08, 'triangle'), 280); S.vib?.(120); }, 1300);
  S.tone(880, 880, .25, .08, 'triangle'); if (currentView === 'desk') S.toast('📞 มีสายเข้า! ดูที่ด้านบนจอ', 2);
  call.active.to = setTimeout(() => endCall('miss'), 20000);
}
function endCall(how, ok) {
  const c = call.active; if (!c) return; clearTimeout(c.to);
  const now = gnow().getTime(); call.next = now + (2 + Math.random() * 2) * 3600000;
  if (how === 'miss') { perf.callMiss++; S.toast(`📵 พลาดสายจาก ${c.def.from}`, 2.4); if (perf.callMiss % 2 === 0) pushMsg('boss', 'boss', `ลูกค้าบ่นว่าโทรมาไม่มีใครรับสาย ${perf.callMiss} ครั้งแล้วนะ 😾`, 2500); c.el.remove(); }
  else if (how === 'answered') { if (ok) { perf.callOk++; complete('call'); S.jingle(); } else { perf.callMiss++; S.tone(300, 200, .3, .08); pushMsg('boss', 'boss', `ลูกค้า ${c.def.from} โทรมาบ่นว่าตอบไม่ได้เรื่องเลย ระวังด้วยนะ 😾`, 2500); } setTimeout(() => c.el.remove(), 2200); }
  else c.el.remove();
  call.active = null;
}
document.addEventListener('click', e => {
  const c = call.active; if (!c || !e.target.closest('#callPop')) return;
  const b = e.target.closest('[data-ca]'), o = e.target.closest('[data-co]');
  if (b && c.state === 'ring') {
    if (b.dataset.ca === '0') { endCall('miss'); return; }
    clearTimeout(c.to); c.state = 'talk'; const opts = shuf(c.def.o.slice());
    c.el.innerHTML = `<div class="cp-h"><i>🗣️</i><div><b>${esc(c.def.from)}</b><small>กำลังสนทนา</small></div></div><p class="cp-q">“${esc(c.def.q)}”</p><div class="cp-o">${opts.map(x => `<button class="btn2" data-co="${x[1]}">${esc(x[0])}</button>`).join('')}</div>`;
  } else if (o && c.state === 'talk') {
    c.state = 'done'; const ok = o.dataset.co === '1';
    c.el.innerHTML = `<div class="cp-h"><i>${ok ? '😊' : '😠'}</i><div><b>${esc(c.def.from)}</b><small>${ok ? 'ขอบคุณมากค่ะ/ครับ' : 'ฮึ… งั้นไม่เป็นไร วางสายนะ'}</small></div></div>`;
    endCall('answered', ok);
  }
});
