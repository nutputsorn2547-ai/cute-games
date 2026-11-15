'use strict';
/* Office game 1.2.0 (beta) — "กลับบ้าน": phone app, dorm room, chores mini-games, pets, sleep.
   Shares one global scope with the other files (prefix hm* / HM_* to avoid collisions). */
const hm = { at: false, pos: {}, pets: {}, dirtyL: 0, dirtyD: 0, shower: 0, lc: 0, view: 'room', tab: 'laundry', g: null, ask: null, on: false, msg: '' };
const HM_FURN = [
  { id: 'bed', e: '🛏️', n: 'เตียง', x: 12, y: 30, s: 78 },
  { id: 'desk', e: '🖥️', n: 'โต๊ะคอม', x: 46, y: 18, s: 70 },
  { id: 'fridge', e: '🧊', n: 'ตู้เย็น', x: 82, y: 18, s: 70 },
  { id: 'kitchen', e: '🍳', n: 'ครัวเล็ก', x: 78, y: 56, s: 66 },
  { id: 'bath', e: '🚿', n: 'ห้องน้ำ', x: 12, y: 66, s: 66 },
];
const HM_PETS = {
  parrot: { e: '🦜', n: 'นกแก้ว', adopt: 800, food: 60 },
  dog: { e: '🐕', n: 'หมา', adopt: 1500, food: 120 },
  cat: { e: '🐈', n: 'แมว', adopt: 1200, food: 100 },
  turtle: { e: '🐢', n: 'เต่า', adopt: 500, food: 50 },
  snake: { e: '🐍', n: 'งู', adopt: 1500, food: 90 },
};
const hmAtHome = () => hm.at || (typeof career !== 'undefined' && career.id === 'jl');
const hmFare = () => Math.max(10, Math.round((bank.home.km || 1) * 12));
const hmMins = () => Math.round((bank.home.km || 1) * 3);
const hmToday = () => dayStart(gnow());
const hmStress = d => { life.stress = Math.max(0, Math.min(100, life.stress + d)); };
const hmPos = f => (hm.pos[bank.home.id] || {})[f.id] || [f.x, f.y];

/* ---------- phone app tile ---------- */
const _rp7 = renderPhone;
renderPhone = function () {
  _rp7();
  try {
    if (!phone.open || !phone.el || phone.app || phone.cur) return;
    const g = phone.el.querySelector('.phg'); if (!g || g.querySelector('[data-hm]')) return;
    g.insertAdjacentHTML('beforeend', `<button data-hm="go"><i style="background:#8a6df0">🏠</i>${hmAtHome() ? 'ห้องพัก' : 'กลับบ้าน'}</button>`);
  } catch (e) { console.error(e); }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-hm="go"]'); if (!b) return;
  try { closePhone(); } catch (x) {}
  if (hmAtHome()) hmOpen('room'); else { hm.ask = 'go'; hmOpen('room'); }
});

/* ---------- overlay ---------- */
let hmEl = null;
function hmOpen(view) {
  hm.view = view || 'room'; hm.g = null;
  if (!hmEl) {
    hmEl = h('div', { id: 'hmRoom' }); document.body.append(hmEl);
    hmEl.addEventListener('click', hmClick);
    hmEl.addEventListener('pointerdown', hmDown);
  }
  hm.on = true; hmRender();
}
function hmClose() { hm.on = false; hm.ask = null; if (hmEl) { hmEl.remove(); hmEl = null; } hmChip(); }
function hmChip() {
  let c = $('hmChip'); const show = hmAtHome() && !(typeof career !== 'undefined' && career.id === 'jl') && !hm.on;
  if (show && !c) { c = h('button', { id: 'hmChip' }, '🏠 อยู่บ้าน · เปิดห้องพัก'); c.onclick = () => hmOpen('room'); document.body.append(c); }
  else if (!show && c) c.remove();
}
setInterval(hmChip, 1500);

function hmRender() {
  if (!hmEl) return; const st = Math.round(life.stress), home = bank.home;
  const jl = typeof career !== 'undefined' && career.id === 'jl';
  let body = '';
  if (hm.ask === 'go') {
    body = `<div class="hmask"><div class="hmbig">🚕</div><h3>กลับบ้านที่ ${esc(home.name)}?</h3><p>ระยะทาง ${home.km} กม. · ค่ารถ <b>${baht(hmFare())}</b> บาท · ใช้เวลา ~${hmMins()} นาที</p><p class="soft">${home.km <= 3 ? 'ใกล้ ค่ารถไม่แพง' : home.km >= 10 ? 'หอไกล ค่ารถค่อนข้างแพง' : 'ระยะปานกลาง'}</p><div class="hmrow"><button class="btn2" data-hm="gook">🚕 กลับบ้านเลย</button><button class="btn2 ghost" data-hm="x">ยังก่อน</button></div></div>`;
  } else if (hm.view === 'room') body = hmRoomHtml(st, jl);
  else body = hmChoresHtml(st);
  hmEl.innerHTML = `<div class="hmp">${body}</div>`;
}
function hmRoomHtml(st, jl) {
  const home = bank.home;
  const furn = HM_FURN.map(f => { const [x, y] = hmPos(f); return `<div class="hmf" data-f="${f.id}" style="left:${x}%;top:${y}%;font-size:${f.s}px"><span>${f.e}</span><small>${f.n}${f.id === 'bed' ? '' : ''}</small></div>`; }).join('');
  const pets = Object.keys(hm.pets).filter(k => hm.pets[k].have).map((k, i) => `<div class="hmpet" style="left:${30 + i * 11}%">${HM_PETS[k].e}</div>`).join('');
  const dirt = (hm.dirtyD >= 6 ? '<div class="hmdirt" style="left:68%;top:74%">🍽️</div>' : '') + (hm.dirtyL >= 2 ? '<div class="hmdirt" style="left:28%;top:78%">🧺</div>' : '');
  const conf = hm.ask === 'sleep' ? `<div class="hmask in"><div class="hmbig">😴</div><h3>นอนพักเลยไหม?</h3><p>ข้ามไปเช้า 07:00 ของวันถัดไป · ความเครียดลด 80% (จาก ${st} เหลือ ~${Math.round(st * .2)})</p><p class="soft">ระหว่างข้ามวัน ค่าข้าว/บิลรายวันจะคิดตามปกติ · สัตว์เลี้ยงที่ยังไม่ได้กินจะเครียดนะ</p><div class="hmrow"><button class="btn2" data-hm="sleepok">💤 ยืนยันนอน</button><button class="btn2 ghost" data-hm="x2">ยังไม่นอน</button></div></div>` : '';
  return `<button class="hmx" data-hm="close">✕</button>
  <div class="hmhead"><div><h3>🏠 ${esc(home.name)}</h3><small>ค่าเช่า ${baht(home.rent)} บาท/เดือน · ห่างออฟฟิศ ${home.km} กม.</small></div><div class="hmst" data-lv="${st >= 80 ? 'bad' : st >= 50 ? 'mid' : 'ok'}">${st >= 80 ? '🤯' : st >= 50 ? '😣' : '🙂'} เครียด ${st}</div></div>
  <div class="hmstage" id="hmStage">${furn}${pets}${dirt}${conf}</div>
  <p class="soft hmtip">💡 แตะของเพื่อใช้งาน · ลากเพื่อย้ายเฟอร์นิเจอร์ (ย้ายแล้วเหนื่อย เครียด +10 ต่อครั้ง)${hm.msg ? `<br><b>${esc(hm.msg)}</b>` : ''}</p>
  <div class="hmrow"><button class="btn2" data-hm="chores">🧹 ทำงานบ้าน${hm.dirtyD >= 6 || hm.dirtyL >= 2 ? ' ⚠️' : ''}</button>${jl ? '' : `<button class="btn2 ghost" data-hm="toWork">🚌 ไปออฟฟิศ (${baht(hmFare())}฿)</button>`}</div>`;
}
function hmChoresHtml(st) {
  const tabs = [['laundry', '🧺 ซักผ้า'], ['dishes', '🍽️ ล้างจาน'], ['pets', '🐾 สัตว์เลี้ยง']].map(([k, t]) => `<button class="hmtab${hm.tab === k ? ' on' : ''}" data-hm="tab" data-k="${k}">${t}</button>`).join('');
  let main = '';
  if (hm.tab === 'laundry') main = hmLaundry(); else if (hm.tab === 'dishes') main = hmDishes(); else main = hmPetsHtml();
  return `<button class="hmx" data-hm="close">✕</button><div class="hmhead"><div><h3>🧹 ทำงานบ้าน</h3><small>ผ้าที่รอซัก ${hm.dirtyL} ตะกร้า · จานค้าง ${hm.dirtyD} ใบ</small></div><div class="hmst" data-lv="${st >= 80 ? 'bad' : st >= 50 ? 'mid' : 'ok'}">เครียด ${st}</div></div>
  <div class="hmtabs">${tabs}</div><div class="hmmain">${main}</div>${hm.msg ? `<p class="soft"><b>${esc(hm.msg)}</b></p>` : ''}<div class="hmrow"><button class="btn2 ghost" data-hm="room">← กลับห้องพัก</button></div>`;
}
function hmLaundry() {
  if (hm.dirtyL <= 0) return '<div class="hmempty">✨ ไม่มีผ้าสกปรกค้างอยู่<br><small>ผ้าจะสะสมเรื่อยๆ ทุก 2 วัน</small></div>';
  const g = hm.g && hm.g.k === 'laundry' ? hm.g : (hm.g = { k: 'laundry', ph: 'load', n: 0, N: 6 });
  if (g.ph === 'load') return `<p>แตะเสื้อผ้าทีละชิ้นใส่เครื่องซักผ้า (${g.n}/${g.N})</p><div class="hmpile">${[...Array(g.N)].map((_, i) => `<button class="hmcl${i < g.n ? ' gone' : ''}" data-hm="cl" data-i="${i}">${['👕', '👖', '🧦', '👗', '🧥', '👚'][i]}</button>`).join('')}</div><div class="hmmach">🧺 เครื่องซักผ้า <b>${g.n}/${g.N}</b></div>`;
  if (g.ph === 'wash') return '<div class="hmempty"><div class="hmspin">🌀</div>กำลังซักผ้า...</div>';
  return `<p>ซักเสร็จแล้ว! แตะเพื่อตากผ้าทีละชิ้น (${g.n}/${g.N})</p><div class="hmpile">${[...Array(g.N)].map((_, i) => `<button class="hmcl${i < g.n ? ' gone' : ''}" data-hm="hang" data-i="${i}">${['👕', '👖', '🧦', '👗', '🧥', '👚'][i]}</button>`).join('')}</div><div class="hmmach">☀️ ราวตากผ้า <b>${g.n}/${g.N}</b></div>`;
}
function hmDishes() {
  if (hm.dirtyD <= 0) return '<div class="hmempty">✨ จานสะอาดหมดแล้ว<br><small>กินข้าวเสร็จจะมีจานค้างเพิ่มทุกวัน</small></div>';
  const g = hm.g && hm.g.k === 'dishes' ? hm.g : (hm.g = { k: 'dishes', d: [...Array(Math.min(6, hm.dirtyD))].map(() => 0) });
  return `<p>แตะจานซ้ำๆ เพื่อขัดให้สะอาด (ต้องขัด 3 ครั้งต่อใบ)</p><div class="hmpile">${g.d.map((v, i) => `<button class="hmdish${v >= 3 ? ' clean' : ''}" data-hm="dish" data-i="${i}">${v >= 3 ? '✨' : '🍽️'}<i><b style="width:${v / 3 * 100}%"></b></i></button>`).join('')}</div>`;
}
function hmPetsHtml() {
  const day = hmToday();
  return `<p class="soft">สัตว์เลี้ยงต้องให้อาหารวันละครั้ง ถ้าลืมจะเครียดและสงสาร · อาหารหมดต้องสั่งซื้อ</p><div class="hmpets">${Object.entries(HM_PETS).map(([k, p]) => {
    const s = hm.pets[k];
    if (!s || !s.have) return `<div class="hmpc"><div class="pe">${p.e}</div><b>${p.n}</b><small>ยังไม่มี</small><button class="btn2" data-hm="adopt" data-k="${k}">รับเลี้ยง ${baht(p.adopt)}฿</button></div>`;
    const fed = s.fed >= day;
    return `<div class="hmpc"><div class="pe">${fed ? p.e : p.e + '💭'}</div><b>${p.n}</b><small>${fed ? 'อิ่มแล้ววันนี้ 💚' : 'หิวอยู่! 🍽️'} · อาหารเหลือ ${s.food} มื้อ</small>${s.food > 0 ? `<button class="btn2" data-hm="feed" data-k="${k}"${fed ? ' disabled' : ''}>🥣 ให้อาหาร</button>` : ''}<button class="btn2 ghost" data-hm="buy" data-k="${k}">🛒 สั่งซื้อ +10 มื้อ (${p.food}฿)</button></div>`;
  }).join('')}</div>`;
}

/* ---------- clicks ---------- */
function hmMsg(t) { hm.msg = t; hmRender(); }
function hmClick(e) {
  if (hm.drag && hm.drag.moved) return;
  if (e.target === hmEl) { hmClose(); return; }
  const f = e.target.closest('[data-f]'); if (f && !e.target.closest('[data-hm]')) { hmFurn(f.dataset.f); return; }
  const b = e.target.closest('[data-hm]'); if (!b) return; const a = b.dataset.hm, i = +b.dataset.i, k = b.dataset.k;
  if (a === 'close' || a === 'x') { hmClose(); return; }
  if (a === 'x2') { hm.ask = null; hmRender(); return; }
  if (a === 'room') { hm.view = 'room'; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (a === 'chores') { hm.view = 'chores'; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (a === 'tab') { hm.tab = k; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (a === 'gook') { if (!bankPay(hmFare(), '🚕 ค่ารถกลับบ้าน')) return; timeOff += hmMins() * 60000; lastMin = ''; enforceDate(); hm.at = true; hm.ask = null; hm.msg = 'ถึงบ้านแล้ว 🏠'; S.toast(`🏠 กลับถึงบ้านแล้ว (ค่ารถ ${baht(hmFare())} บาท)`, 2.4); hmRender(); return; }
  if (a === 'toWork') { if (!bankPay(hmFare(), '🚌 ค่ารถไปออฟฟิศ')) return; timeOff += hmMins() * 60000; lastMin = ''; enforceDate(); hm.at = false; hmClose(); S.toast('🚌 ถึงออฟฟิศแล้ว', 2); return; }
  if (a === 'sleepok') { hmSleep(); return; }
  if (a === 'cl') { const g = hm.g; if (g && g.ph === 'load' && i === g.n) { g.n++; S.tone(700 + g.n * 60, 900, .04, .05); if (g.n >= g.N) { g.ph = 'wash'; hmRender(); setTimeout(() => { if (hm.g === g) { g.ph = 'hang'; g.n = 0; S.tone(900, 1300, .1, .06); hmRender(); } }, 2600); return; } hmRender(); } return; }
  if (a === 'hang') { const g = hm.g; if (g && g.ph === 'hang' && i === g.n) { g.n++; S.tone(800 + g.n * 70, 1000, .04, .05); if (g.n >= g.N) { hm.dirtyL = Math.max(0, hm.dirtyL - 1); hm.g = null; hmStress(-3); S.toast('🧺 ซักผ้าเสร็จ เครียด −3', 2); hm.msg = 'ซักผ้าเสร็จแล้ว ✨'; } hmRender(); } return; }
  if (a === 'dish') { const g = hm.g; if (!g || g.k !== 'dishes' || g.d[i] >= 3) return; g.d[i]++; S.noise(.05, 3000, .04, 'highpass'); if (g.d.every(v => v >= 3)) { hm.dirtyD = Math.max(0, hm.dirtyD - g.d.length); hm.g = null; hmStress(-2); S.toast('🍽️ ล้างจานเสร็จ เครียด −2', 2); hm.msg = 'จานสะอาดเอี่ยม ✨'; } hmRender(); return; }
  if (a === 'adopt') { const p = HM_PETS[k]; if (!bankPay(p.adopt, `${p.e} รับเลี้ยง${p.n}`)) return; hm.pets[k] = { have: true, food: 5, fed: hmToday() }; hm.msg = `ยินดีต้อนรับ ${p.n} ${p.e} (แถมอาหาร 5 มื้อ)`; S.jingle?.(); hmRender(); return; }
  if (a === 'buy') { const p = HM_PETS[k]; if (!bankPay(p.food, `🛒 อาหาร${p.n} 10 มื้อ`)) return; hm.pets[k].food += 10; hm.msg = `สั่งอาหาร${p.n}แล้ว +10 มื้อ`; hmRender(); return; }
  if (a === 'feed') { const s = hm.pets[k]; if (!s || s.food <= 0 || s.fed >= hmToday()) return; s.food--; s.fed = hmToday(); hmStress(-1); S.tone(600, 900, .08, .06); hm.msg = `${HM_PETS[k].n}กินอาหารแล้ว ${HM_PETS[k].e}${s.food === 0 ? ' · อาหารหมดแล้ว ต้องสั่งซื้อ!' : ''}`; hmRender(); return; }
}
function hmFurn(id) {
  if (id === 'bed') { hm.ask = 'sleep'; hmRender(); return; }
  if (id === 'fridge') { fdOpen(); return; }
  if (id === 'desk') { hmClose(); hm.at = true; hmChip(); S.toast('🖥️ นั่งโต๊ะคอมที่บ้านแล้ว (ใช้คอมได้เหมือนปกติ · เปิดห้องพักได้จากมือถือ)', 3.2); return; }
  if (id === 'kitchen') { hm.view = 'chores'; hm.tab = 'dishes'; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (id === 'bath') { const d = hmToday(); if (hm.shower >= d) { hm.msg = 'วันนี้อาบน้ำไปแล้ว 🚿'; hmRender(); return; } hm.shower = d; hmStress(-5); S.toast('🚿 อาบน้ำสบายตัว เครียด −5', 2); hm.msg = 'อาบน้ำสบายตัว เครียด −5'; hmRender(); }
}

/* ---------- drag furniture ---------- */
function hmDown(e) {
  const f = e.target.closest('.hmf'); if (!f) return; const stage = $('hmStage'); if (!stage) return;
  const r = stage.getBoundingClientRect(), fx = parseFloat(f.style.left), fy = parseFloat(f.style.top);
  hm.drag = { id: f.dataset.f, el: f, sx: e.clientX, sy: e.clientY, fx, fy, r, moved: false };
  const mv = ev => { const d = hm.drag; if (!d) return; const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy; if (!d.moved && Math.hypot(dx, dy) < 12) return; d.moved = true; d.el.classList.add('drag'); d.nx = Math.max(2, Math.min(88, d.fx + dx / d.r.width * 100)); d.ny = Math.max(4, Math.min(78, d.fy + dy / d.r.height * 100)); d.el.style.left = d.nx + '%'; d.el.style.top = d.ny + '%'; };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
    const d = hm.drag; if (!d) return;
    if (d.moved) { const m = hm.pos[bank.home.id] = hm.pos[bank.home.id] || {}; m[d.id] = [d.nx, d.ny]; hmStress(10); hm.msg = '😮‍💨 ย้ายเฟอร์นิเจอร์เหนื่อยมาก เครียด +10'; S.toast('😮‍💨 ย้ายของเหนื่อยจัง เครียด +10', 2); setTimeout(() => { hm.drag = null; hmRender(); }, 0); } else hm.drag = null;
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
}

/* ---------- sleep ---------- */
function hmSleep() {
  hm.ask = null; const v = h('div', { id: 'hmSleep' }, '<div>😴<br>กำลังนอนหลับ...<br><small>Zzz</small></div>'); document.body.append(v);
  setTimeout(() => {
    const g = gnow(), t = new Date(g); t.setHours(7, 0, 0, 0); if (g.getHours() >= 5) t.setDate(t.getDate() + 1);
    timeOff += t.getTime() - g.getTime(); lastMin = ''; nightMsgSent = false; enforceDate();
    life.stress = Math.round(life.stress * .2);
    try { renderTime(); updateDeskCal(); } catch (e) {}
    hm.msg = '☀️ ตื่นเช้าแล้ว สดชื่น! ความเครียดลดลง 80%'; S.big?.('☀️ ตื่นนอนแล้ว ความเครียดลด 80%', 2.4, '#f0a020'); S.jingle?.();
    v.classList.add('out'); setTimeout(() => v.remove(), 700); hmRender();
  }, 1800);
}

/* ---------- daily ---------- */
const _nd7 = newDay;
newDay = function (d) { _nd7(d); try { hmDaily(d); } catch (e) { console.error(e); } };
function hmDaily(d) {
  if (d <= bank.start) return;
  hm.dirtyD = Math.min(12, hm.dirtyD + 3); hm.lc++; if (hm.lc % 2 === 0) hm.dirtyL = Math.min(4, hm.dirtyL + 1);
  let n = 0;
  for (const k in hm.pets) { const s = hm.pets[k]; if (s.have && s.fed < d - DAY) { n++; } }
  if (n) { hmStress(6 * n); bank.notes.push(`🐾 สัตว์เลี้ยงหิว ${n} ตัว เครียด +${6 * n}`); }
  if (hm.dirtyD >= 9 || hm.dirtyL >= 3) { hmStress(4); bank.notes.push('🏚️ บ้านรก เครียด +4'); }
  if (hm.on) hmRender();
}

/* ---------- save ---------- */
const _snap7 = snapshot; snapshot = () => ({ ..._snap7(), hm: { at: hm.at, pos: hm.pos, pets: hm.pets, dirtyL: hm.dirtyL, dirtyD: hm.dirtyD, shower: hm.shower, lc: hm.lc } });
const _load7 = loadGame;
loadGame = function () {
  const ok = _load7();
  if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.hm) Object.assign(hm, { at: false, pos: {}, pets: {}, dirtyL: 0, dirtyD: 0, shower: 0, lc: 0 }, s.hm); } catch (e) {} hmChip(); }
  return ok;
};
