"use strict";
// Office game (beta) — update 1.2.0
//   1) เปลี่ยนสีโฟลเดอร์   2) พ่อแม่ทักถาม/ส่งลิงก์ ต้องคอยตอบ   3) ค่าขนมน้องสาว 2,000/เดือน
//   4) กล่องอาหาร (รูปแทนอีโมจิ) + ตู้เย็น + วันหมดอายุ   5) ข้ามวันหักค่าข้าว 50 บาท (ใช้ข้าวในตู้เย็นก่อน)
//   6) เครียดจัดแล้วป่วย ต้องลาป่วย (ทักหัวหน้า + ค่ายา 150) ไม่เกิน 1 ครั้ง/เดือน
const lx = { items: [], seq: 0, par: {}, sick: null, sickLog: [], bossSat: 80 };
const gms = () => gnow().getTime();
const HR1 = 3600000;

/* ================= 1) folder colours ================= */
const FCOL = [['#ffcf5a', '#f3b73a'], ['#ffb0c8', '#f08aa8'], ['#ff9f9f', '#e86a6a'], ['#ffd6a5', '#f4b878'], ['#fdffb6', '#e6e88a'], ['#b7e4a8', '#8fcf7c'],
  ['#a0e7e5', '#6fcfcc'], ['#8fd3ff', '#5fb6ea'], ['#cdb4ff', '#a98bf0'], ['#ffc6ff', '#ee9cee'], ['#c9c3d6', '#a9a1ba'], ['#8a7a6a', '#6a5a4a']];
let fcId = null;
const _showCtx = showCtx;
showCtx = function (x, y, items) {
  if (fcId) {
    const fo = FOLDERS.find(f => f.id === fcId); fcId = null;
    if (fo && fo.id !== 'trash') { let i = items.findIndex(it => it !== '-' && /เปลี่ยนชื่อ|ลบโฟลเดอร์/.test(it.t)); if (i < 0) i = items.length; items.splice(i, 0, { t: '🎨 เปลี่ยนสีโฟลเดอร์', f: () => fcPick(fo, x, y) }); }
  }
  _showCtx(x, y, items);
};
const _iconMenu = iconMenu;
iconMenu = function (id, x, y) { fcId = id; try { _iconMenu(id, x, y); } finally { fcId = null; } };
function fcPick(fo, x, y) {
  _showCtx(x, y, [{ t: 'x', f() {} }]); if (!ctx) return;
  ctx.innerHTML = `<div class="fcp"><b>🎨 สีโฟลเดอร์ “${esc(fo.name)}”</b><div class="fcg">${FCOL.map(([c, c2], i) => `<button data-fc="${i}" title="สี ${i + 1}" style="--c:${c};--c2:${c2}" class="${fo.c === c ? 'on' : ''}"></button>`).join('')}</div></div>`;
  ctx.addEventListener('click', e => { const b = e.target.closest('[data-fc]'); if (!b) return; const [c, c2] = FCOL[+b.dataset.fc]; fo.c = c; fo.c2 = c2; try { complete('n12color'); } catch (x) {} hideCtx(); renderDesktop(); refreshOpenFolders(); S.tone(700, 1000, .07, .06, 'triangle'); });
}
function refreshOpenFolders() { try { for (const [id, W] of wins) if (W.folder) renderFolder?.(W); } catch (e) {} }

/* ================= 4) food images, desk box, fridge ================= */
const FD_IMG = { 'ข้าวมันไก่ต้ม': 'chick_boil', 'ข้าวมันไก่ทอด': 'chick_fry', 'ข้าวมันไก่รวม': 'chick_mix', 'น้ำซุปฟัก': 'soup', 'ส้มตำไทย': 'somtum', 'ส้มตำปูปลาร้า': 'somtum_pla',
  'ไก่ย่าง (ครึ่งตัว)': 'grill', 'ข้าวเหนียว': 'sticky', 'เส้นเล็กน้ำตก': 'noodle_nam', 'เส้นใหญ่ต้มยำ': 'noodle_tom', 'เกี๊ยวทอด': 'gyoza', 'ชาเย็น': 'thai_tea',
  'กะเพราหมูสับไข่ดาว': 'kp_pork', 'กะเพราไก่ไข่เจียว': 'kp_omelet', 'กะเพราทะเล': 'kp_sea', 'ไข่ดาวเพิ่ม': 'egg', 'ชานมไข่มุก': 'boba', 'ชาเขียวมัทฉะ': 'matcha', 'โกโก้เย็น': 'cocoa', 'บราวน์ชูการ์': 'brown' };
const FD_LIFE = { chick_boil: 3, chick_fry: 3, chick_mix: 3, soup: 2, somtum: 2, somtum_pla: 2, grill: 3, sticky: 3, noodle_nam: 2, noodle_tom: 2, gyoza: 2, thai_tea: 3, kp_pork: 3, kp_omelet: 3, kp_sea: 2, egg: 2, boba: 3, matcha: 3, cocoa: 3, brown: 3 };
const FD_MEAL = new Set(['chick_boil', 'chick_fry', 'chick_mix', 'somtum', 'somtum_pla', 'grill', 'noodle_nam', 'noodle_tom', 'kp_pork', 'kp_omelet', 'kp_sea']); // จานหลักที่นับเป็น “ข้าวหนึ่งวัน”
const FRIDGE_MAX = 9;
const fdSrc = k => 'img/food/' + k + '.png';
const fdImg = (it, cls = '') => `<img class="${cls}" src="${fdSrc(it.key)}" alt="" draggable="false">`;
const fdLeft = it => {
  const ms = it.exp - gms(); if (ms <= 0) return ['หมดอายุแล้ว', 1];
  const hh = ms / HR1; return [hh >= 24 ? 'เหลือ ' + (Math.round(hh / 2.4) / 10) + ' วัน' : 'เหลือ ' + Math.max(1, Math.ceil(hh)) + ' ชม.', hh < 6];
};
const fdDesk = () => lx.items.filter(i => i.loc === 'desk'), fdFr = () => lx.items.filter(i => i.loc === 'fridge');
let fdBoxEl = null, fdFridgeEl = null, fdPanelEl = null;

const _deskItem = deskItem;
deskItem = function (cls, x, y, r, html, id) { if (/class="lunch"/.test(html)) return h('div'); return _deskItem(cls, x, y, r, html, id); }; // เลิกใช้กล่องข้าวอีโมจิ
const _eat = eat;
eat = function (g) { if (g === -999) return; return _eat(g); }; // ข้าวมาส่งแล้วไม่กินให้เอง ต้องคลิกกล่องอาหารบนโต๊ะ

const FRIDGE_SVG = `<svg viewBox="0 0 100 150" width="100%" height="100%"><rect x="8" y="4" width="84" height="142" rx="12" fill="#dcecfb" stroke="#9fb8d4" stroke-width="4"/><rect x="14" y="10" width="72" height="42" rx="8" fill="#f2f8ff"/><rect x="14" y="58" width="72" height="82" rx="8" fill="#f2f8ff"/><rect x="76" y="22" width="5" height="22" rx="2.5" fill="#8aa3c2"/><rect x="76" y="76" width="5" height="40" rx="2.5" fill="#8aa3c2"/><g stroke="#7fb2ea" stroke-width="3" stroke-linecap="round"><path d="M32 22v18M23 31h18M26 25l12 12M38 25l-12 12"/></g></svg>`;
function fdBuildDesk() {
  if (!fdFridgeEl) { fdFridgeEl = _deskItem('', 91, 30, 0, `<div class="fdfr" title="ตู้เย็น (คลิกเพื่อเปิด)">${FRIDGE_SVG}</div>`, 'deco'); fdFridgeEl.addEventListener('click', () => fdOpen()); }
  const ds = fdDesk();
  if (!ds.length) { if (fdBoxEl) { fdBoxEl.remove(); fdBoxEl = null; } return; }
  if (!fdBoxEl) { fdBoxEl = _deskItem('', 83, 46, -3, '', 'deco'); fdBoxEl.addEventListener('click', () => fdOpen()); }
  const sp = ds.filter(i => fdLeft(i)[1]).length;
  const html = `<div class="fdbox" title="คลิกเพื่อกินหรือแช่ตู้เย็น">${ds.slice(0, 3).map((i, k) => fdImg(i, 'k' + k)).join('')}<b>${ds.length}</b>${sp ? '<i>ใกล้เสีย</i>' : ''}</div>`;
  if (fdBoxEl._h !== html) { fdBoxEl._h = html; fdBoxEl.innerHTML = html; }
}
function fdOpen() {
  if (fdPanelEl) { fdRender(); return; }
  fdPanelEl = h('div', { id: 'fdPanel' }); document.body.append(fdPanelEl);
  fdPanelEl.addEventListener('click', e => {
    if (e.target === fdPanelEl || e.target.closest('[data-fdx]')) { fdClose(); return; }
    const b = e.target.closest('[data-fa]'); if (!b) return; const it = lx.items.find(i => i.id === +b.dataset.id); if (!it) return;
    ({ eat: fdEat, store: fdStore, bin: fdBin })[b.dataset.fa]?.(it);
  });
  fdRender(); S.tone(600, 900, .06, .06, 'triangle');
}
function fdClose() { fdPanelEl?.remove(); fdPanelEl = null; }
function fdCard(it, fridge) {
  const [t, warn] = fdLeft(it);
  return `<div class="fdc">${fdImg(it)}<div class="tx"><b>${esc(it.n)}</b><small class="${warn ? 'warn' : ''}">${t}${fridge ? '' : ' · ไม่แช่เย็นอยู่ได้ 1 วัน'}</small></div><div class="bt"><button data-fa="eat" data-id="${it.id}">😋 กิน</button>${fridge ? `<button data-fa="bin" data-id="${it.id}">🗑️ ทิ้ง</button>` : `<button data-fa="store" data-id="${it.id}" class="cool">❄️ แช่ตู้เย็น</button>`}</div></div>`;
}
function fdRender() {
  if (!fdPanelEl) return; const ds = fdDesk(), fr = fdFr(), meals = fr.filter(i => i.meal && i.exp > gms()).length;
  const shelves = [0, 1, 2].map(r => `<div class="sh">${[0, 1, 2].map(c => { const it = fr[r * 3 + c]; if (!it) return '<div class="sl empty"></div>'; const [t, w] = fdLeft(it); return `<div class="sl"><img src="${fdSrc(it.key)}" alt="" draggable="false"><small class="${w ? 'warn' : ''}">${t}</small><span><button data-fa="eat" data-id="${it.id}" title="กิน">😋</button><button data-fa="bin" data-id="${it.id}" title="ทิ้ง">🗑️</button></span></div>`; }).join('')}</div>`).join('');
  const html = `<div class="fdp"><button class="fdx" data-fdx aria-label="ปิด">✕</button>
    <div class="fdl"><h3>🍱 อาหารบนโต๊ะ <small>(${ds.length})</small></h3>${ds.length ? ds.map(i => fdCard(i, false)).join('') : '<p class="soft">ไม่มีอาหารบนโต๊ะ · สั่งได้ที่แอป “หิวแล้ว” บนมือถือ</p>'}</div>
    <div class="fdr"><h3>❄️ ตู้เย็น <small>(${fr.length}/${FRIDGE_MAX})</small></h3><div class="frg">${shelves}</div>
      <p class="soft">ไม่แช่ตู้เย็น: อยู่ได้ 1 วันนับจากซื้อ · แช่ตู้เย็น: 2–3 วันแล้วแต่อาหาร<br>ข้ามวันแล้วจะหักค่าข้าววันละ 50 บาท <b>ยกเว้นมีข้าวจานหลักในตู้เย็นที่ยังไม่หมดอายุ</b> (ตอนนี้มี ${meals} จาน) จะใช้จานนั้นแทนก่อน</p></div></div>`;
  if (fdPanelEl._h !== html) { const sc = fdPanelEl.firstChild?.scrollTop || 0; fdPanelEl._h = html; fdPanelEl.innerHTML = html; if (fdPanelEl.firstChild) fdPanelEl.firstChild.scrollTop = sc; }
}
function fdEat(it) { lx.items.splice(lx.items.indexOf(it), 1); _eat(foodGain(it.n, it.p)); S.tone(500, 900, .1, .06, 'triangle'); fdSync(); }
function fdBin(it) { lx.items.splice(lx.items.indexOf(it), 1); S.noise(.15, 900, .05); fdSync(); }
function fdStore(it) {
  if (fdFr().length >= FRIDGE_MAX) { S.toast('ตู้เย็นเต็มแล้ว (9 ช่อง) กินหรือทิ้งก่อนนะ', 2); return; }
  it.loc = 'fridge'; it.exp = it.buy + it.life * DAY; try { complete('n12food'); } catch (x) {} S.tone(700, 500, .12, .06); S.toast(`❄️ แช่ ${it.n} ในตู้เย็นแล้ว อยู่ได้ถึง ${thDate(it.exp, { day: 'numeric', month: 'short' })} เวลา ${p2(new Date(it.exp).getHours())}:${p2(new Date(it.exp).getMinutes())}`, 2.6); fdSync();
}
function fdSync() { fdBuildDesk(); fdRender(); }
function fdReceive(list) {
  const now = gms(); let n = 0;
  for (const [name, price, q] of list) for (let k = 0; k < q; k++) { const key = FD_IMG[name] || 'chick_boil'; lx.items.push({ id: ++lx.seq, key, n: name, p: price, buy: now, loc: 'desk', exp: now + DAY, life: FD_LIFE[key] || 2, meal: FD_MEAL.has(key) }); n++; }
  S.jingle(); S.big('ข้าวมาส่งแล้ว! ไปที่โต๊ะ ↓ คลิกกล่องอาหาร', 2.6, '#ff8a3d'); fdSync();
}
function fdExpire(at) {
  const gone = lx.items.filter(i => i.exp <= at); if (!gone.length) return;
  lx.items = lx.items.filter(i => i.exp > at); S.toast('🤢 ' + gone.map(i => i.n).join(', ') + ' หมดอายุแล้ว ทิ้งให้อัตโนมัติ', 3); fdSync();
}
// phone food app: order tracking → desk box
const _pfClick = pfClick;
pfClick = function (el, e) {
  if (el.dataset.pf === 'order') {
    const its = pfItems().map(([m, q]) => [m[0], m[1], q]), before = pf.track; _pfClick(el, e);
    if (pf.track && pf.track !== before) { pf.track.fd = its; pf.track.gain = -999; }
    return;
  }
  return _pfClick(el, e);
};
setInterval(() => { const t = pf.track; if (t && t.arrived && t.fd && !t.placed) { t.placed = true; fdReceive(t.fd); } fdExpire(gms()); if (fdPanelEl) fdRender(); fdBuildDesk(); }, 1000);
// show pictures in the phone menu
const _renderPhone2 = renderPhone;
renderPhone = function () {
  _renderPhone2();
  if (phone.open && phone.app === 'food' && pf.view === 'menu' && pf.shop) phone.el.querySelectorAll('.pmi').forEach((row, i) => { const m = pf.shop.menu[i]; if (m && FD_IMG[m[0]] && !row.querySelector('img')) row.insertAdjacentHTML('afterbegin', `<img class="pmimg" src="${fdSrc(FD_IMG[m[0]])}" alt="" draggable="false">`); });
};

/* ================= 5) daily meal cost + 3) sister allowance (run once per day) ================= */
const _newDay = newDay;
newDay = function (d) { _newDay(d); try { fdDaily(d); } catch (e) { console.error(e); } };
function fdDaily(d) {
  const D = new Date(d).getDate(), mon = thDate(d, { month: 'short' });
  lx.bossSat = Math.min(80, lx.bossSat + 2);
  if (lx.sick && d > lx.sick.day) { lx.sick = null; life.stress = Math.min(life.stress, 40); S.toast('😊 หายป่วยแล้ว กลับมาทำงานได้', 2.4); sickBar(); starveSync(); }
  // 3) allowance for little sister
  if (D === 1) { addBill('🎒', `ค่าขนมน้องสาว (${mon})`, 2000, d + 5 * DAY); bank.bills[bank.bills.length - 1].sis = 1; pushMsg('sis', 'sis', 'พี่ขาา ค่าขนมเดือนนี้ 2,000 นะคะ 🥺💕 โอนได้ที่แอปธนาคารเลย', 4000); }
  for (const b of bank.bills) if (b.sis && !b.paid && b.due < d && !b.sulk) { b.sulk = 1; life.stress = Math.min(100, life.stress + 6); bank.notes.push('👧 น้องสาวงอนเรื่องค่าขนม'); pushMsg('sis', 'sis', 'พี่ลืมค่าขนมหนูหรือเปล่า 😢 หนูงอนแล้วนะ…', 3000); }
  // 5) meal of the day
  if (d <= bank.start) return;
  fdExpire(d);
  const ok = fdFr().filter(i => i.meal && i.exp > d).sort((a, b) => a.exp - b.exp)[0];
  if (ok) { lx.items.splice(lx.items.indexOf(ok), 1); bank.notes.push(`🍱 กิน${ok.n}ที่แช่ไว้ (ไม่เสียค่าข้าว 50 บาท)`); fdSync(); }
  else if (bank.bal >= 50) { bankTx('🍚 ค่าข้าววันนี้', -50); bank.notes.push('🍚 ค่าข้าว −50'); }
  else addBill('🍚', 'ค่าข้าวติดร้าน', 50, d + 3 * DAY);
}
const _payBill = payBill;
payBill = function (b) { const ok = _payBill(b); if (ok && b.sis) { pushMsg('sis', 'sis', pick(['ขอบคุณพี่ รักที่สุดเลย 💕', 'เย้ ค่าขนมมาแล้ว! พี่ใจดีที่สุด 🥰', 'หนูไม่งอนแล้วนะ 😚']), 2500); life.stress = Math.max(0, life.stress - 3); } return ok; };

/* ================= 2) parents check in ================= */
const PQ = {
  mom: {
    ask: ['ลูก วันนี้ทำงานเป็นไงบ้าง เหนื่อยไหม 🥺', 'กินข้าวยังลูก วันนี้ที่ทำงานเป็นยังไงบ้าง', 'แม่คิดถึงนะ วันนี้งานเรียบร้อยดีไหมลูก'],
    jl: ['วันนี้หางานเป็นไงบ้างลูก มีที่ไหนเรียกสัมภาษณ์ไหม 🥺', 'เงินพอใช้ไหมลูก ถ้าไม่พอบอกแม่นะ'],
    link: ['ลูกๆ ลิงก์นี้กดได้ไหม ป้าข้างบ้านส่งมาให้ บอกว่ารับเงินคืนภาษี 3,500 บาท 👉 http://rd-refund-th.top/claim', 'ลูก มีคนส่งลิงก์มาว่าแม่ได้สิทธิ์ทองคำฟรี 1 บาท กดได้ไหมลูก 👉 http://gold-free.vip/mom', 'ลิงก์นี้ลงทะเบียนรับของแจกจากห้างจริงไหมลูก กดได้หรือเปล่า 👉 http://bit.ly-lucky.xyz/x'],
    sulk: ['ไม่ตอบแม่เลย แม่น้อยใจนะลูก 😢', 'แม่ทักไปตั้งนาน ลูกคงยุ่งสินะ… แม่ไม่กวนแล้วก็ได้ 🥺'], later: 'ไม่เป็นไรนะลูก แม่เข้าใจว่างานยุ่ง 🥲',
  },
  dad: {
    ask: ['วันนี้งานเป็นไงบ้างลูก', 'ทำงานหนักไหมลูก ดูแลสุขภาพด้วยนะ', 'ลูกกินข้าวเที่ยงหรือยังครับ งานเป็นอย่างไรบ้าง'],
    jl: ['ช่วงนี้เป็นอย่างไรบ้างลูก หางานได้บ้างไหม', 'เงินพอใช้ไหมลูก ถ้าลำบากบอกพ่อนะ'],
    link: ['ลูก ลิงก์นี้กดได้ไหมครับ เขาว่าลุ้นรถยนต์ใหม่ 👉 http://car-lucky.top/dad', 'พ่อได้ข้อความจากธนาคาร ให้กดยืนยันบัญชี กดได้ไหมลูก 👉 http://kbank-verify.xyz/dad', 'ลิงก์สมัครงานออนไลน์ รายได้วันละ 3,000 ลูกดูให้พ่อหน่อย 👉 http://easy-job.top/p'],
    sulk: ['ลูกไม่ตอบพ่อเลยนะ 😞 พ่อรอตั้งนาน', 'งานยุ่งมากเหรอลูก พ่อไม่กวนแล้วก็ได้… 🥲'], later: 'ไม่เป็นไรครับลูก พ่อเข้าใจว่างานเยอะ',
  },
};
function parTick() {
  if (lk.on || typeof unlockedDay === 'undefined' || unlockedDay < 2) return;
  const now = gms(), hr = gnow().getHours();
  for (const id of ['mom', 'dad']) {
    const st = lx.par[id] ||= { next: 0, pend: null, n: 0 };
    if (!st.next) st.next = now + (id === 'mom' ? 3 : 5) * HR1;
    if (st.pend) {
      if (!st.pend.sulk && now - st.pend.t0 > 4 * HR1) { st.pend.sulk = 1; st.n++; life.stress = Math.min(100, life.stress + 5); pushMsg(id, id, pick(PQ[id].sulk), 900); }
      else if (now - st.pend.t0 > 14 * HR1) { st.pend = null; st.next = now + 4 * HR1; }
      continue;
    }
    if (now < st.next || hr < 9 || hr >= 21) continue;
    const kind = Math.random() < .32 ? 'link' : 'ask', pool = kind === 'link' ? PQ[id].link : (career.id === 'jl' ? PQ[id].jl : PQ[id].ask);
    st.pend = { t0: now, kind, sulk: 0 }; st.next = now + rint(6, 10) * HR1; pushMsg(id, id, pick(pool), 900);
  }
}
function parAnswer(c, m, st) {
  try { complete('n12par'); } catch (x) {}
  const p = st.pend, t = m.text || '', id = c.id, mom = id === 'mom';
  if (!t) { say(c, id, mom ? 'ลูกพิมพ์ตอบแม่หน่อยนะ 😊' : 'พิมพ์ตอบพ่อหน่อยครับลูก', 1500); return; }
  if (p.kind === 'link') {
    const warn = /อย่า|ไม่ต้อง|ห้าม|หลอก|มิจ|โกง|ปลอม|scam|อันตราย|ไม่ได้|ลบ|บล็อก|ระวัง/i.test(t), ok = !warn && /กดได้|ได้เลย|โอเค|ok|กดเถอะ|กดสิ|ได้|ปลอดภัย/i.test(t);
    if (!warn && !ok) { say(c, id, 'ตกลงกดได้หรือไม่ได้ลูก บอกชัดๆ หน่อยนะ 😅', 1600); return; }
    if (warn) { say(c, id, mom ? 'ดีนะที่ถามลูก แม่ยังไม่ได้กดเลย เดี๋ยวลบทิ้งนะ 🙏 ลูกเก่งจริงๆ' : 'ขอบใจมากลูก พ่อไม่กดแล้ว ลบทิ้งเลยครับ 👍', 1700); life.stress = Math.max(0, life.stress - 4); }
    else { say(c, id, mom ? 'แม่กดเข้าไปแล้วลูก… มันให้กรอกเลขบัตรประชาชน 😰 แม่ยังไม่ได้กรอก ลูกช่วยดูหน่อย' : 'อ้าว พ่อกดไปแล้วนะ มันให้ใส่รหัส 😟 ยังไม่ได้ใส่หรอก พ่อปิดแล้ว', 1700); life.stress = Math.min(100, life.stress + 5); S.toast('⚠️ ลิงก์นั้นเป็นลิงก์หลอกลวง ครั้งหน้าบอกพ่อแม่ว่า “อย่ากด” นะ', 3.2); }
  } else if (/เหนื่อย|ท้อ|เครียด|งานเยอะ|ยุ่ง|แย่|ไม่ไหว/.test(t)) { say(c, id, mom ? 'สู้ๆ นะลูก เหนื่อยก็พักบ้าง แม่เป็นกำลังใจให้ 💪' : 'อย่าหักโหมนะลูก ดูแลสุขภาพด้วย พ่อเป็นห่วง', 1700); life.stress = Math.max(0, life.stress - 3); }
  else { say(c, id, mom ? pick(['ดีแล้วลูก แม่สบายใจ 😊', 'เก่งมากลูก กินข้าวเยอะๆ นะ 🍚']) : pick(['ดีครับลูก พ่อสบายใจ', 'เก่งมาก พ่อภูมิใจ 👍']), 1700); life.stress = Math.max(0, life.stress - 2); }
  if (p.sulk) say(c, id, PQ[id].later, 3800);
  st.pend = null; st.next = gms() + rint(6, 10) * HR1;
}

/* ================= 6) stress → sick → sick leave ================= */
function sickBar() {
  let el = $('sickBar'); const s = lx.sick;
  if (!s) { el?.remove(); return; }
  if (!el) { el = h('div', { id: 'sickBar' }); document.body.append(el); el.addEventListener('click', e => { if (!e.target.closest('[data-sk]')) return; if (chat.account) { openChat(); chat.cur = 'boss'; try { renderChat(); } catch (x) {} setView?.('screen'); } else openPhone('chat'); }); }
  el.className = s.told ? 'ok' : 'bad';
  el.innerHTML = s.told ? `🛌 ลาป่วยอยู่ พักผ่อนจนถึงเที่ยงคืน · ความพอใจของหัวหน้า ${Math.round(lx.bossSat)}/100` : `🤒 ไม่สบาย! ต้องลาป่วย 1 วัน — ทักหัวหน้าแมวในแชทว่า “ลาป่วย” <button data-sk>💬 ทักหัวหน้า</button>`;
}
function fdFallSick() {
  const g = gnow(), key = g.getFullYear() + '-' + g.getMonth(), over = lx.sickLog.filter(k => k === key).length >= 1; lx.sickLog.push(key);
  lx.sick = { day: dayStart(g), t0: g.getTime(), told: false, over, nag: false }; life.stress = 65;
  if (bank.bal >= 150) { bankTx('💊 ค่าหมอ/ค่ายา', -150); S.toast('💊 จ่ายค่าหมอค่ายา −150 บาท', 2.4); } else { addBill('💊', 'ค่าหมอ/ค่ายา', 150, g.getTime() + 3 * DAY); S.toast('💊 เงินไม่พอ ค่ายา 150 บาทเป็นบิลค้างจ่าย', 2.6); }
  S.big('🤒 เครียดจนป่วยแล้ว! ต้องลาป่วย', 2.6, '#e5536f'); sickBar(); starveSync();
}
function sickTick() {
  if (lk.on) return; const g = gnow(), hr = g.getHours(), wd = g.getDay(), s = lx.sick;
  if (!s && career.id !== 'jl' && life.stress >= 92 && wd >= 1 && wd <= 5 && hr >= 9 && hr < 19 && unlockedDay >= 2) fdFallSick();
  if (s) {
    if (!s.told && !s.nag && g.getTime() - s.t0 > 2 * HR1) { s.nag = true; if (!window.CG?.prot?.active()) { lx.bossSat = Math.max(0, lx.bossSat - 5); life.stress = Math.min(100, life.stress + 4); } pushMsg('boss', 'boss', 'ทำไมไม่เห็นแจ้งอะไรเลย ไม่สบายหรือเปล่า? ถ้าลาต้องทักพี่ก่อนนะ 😾', 900); sickBar(); }
    if (s.told) life.stress = Math.max(20, life.stress - 3);
  }
  const hud = $('stressHud'); if (hud) hud.title = 'ความเครียด: ยิ่งเครียดยิ่งหิวเร็ว หน้าจอจะแดงขึ้น พักด้วยมุมอู้งานได้ · ถ้าเครียดเกิน 92 จะป่วย · ความพอใจของหัวหน้า ' + Math.round(lx.bossSat) + '/100';
}
const _starveSync = starveSync;
starveSync = function () { _starveSync(); const sick = !!lx.sick; for (const [id, W] of wins) { const work = id === 'work' || /^(word-|design|dz)/.test(id) || !!W.book; W.el.classList.toggle('sicky', sick && work); } };
const _react6 = react;
react = function (c, m) {
  if ((c.id === 'mom' || c.id === 'dad') && lx.par[c.id]?.pend) { complete('family'); like(c, m, c.id, 700); parAnswer(c, m, lx.par[c.id]); return; }
  const s = lx.sick;
  if (s && !s.told && c.id === 'boss' && m.text && /ลา|ป่วย|ไม่สบาย|ไข้|หมอ|พักผ่อน/.test(m.text)) {
    s.told = true; like(c, m, 'boss', 700); sickBar(); starveSync();
    if (s.over) { if (!window.CG?.prot?.active()) { lx.bossSat = Math.max(0, lx.bossSat - 12); hr.cap = Math.max(3, hr.cap - 1); } say(c, 'boss', 'ลาป่วยอีกแล้วเหรอ 😾 เดือนนี้เกินโควตาแล้วนะ ครั้งนี้พี่อนุมัติ แต่พี่ไม่ค่อยพอใจเลย', 1800); say(c, 'boss', 'พักให้หาย แล้วดูแลตัวเองให้ดีกว่านี้ด้วย', 3600); S.toast(window.CG?.prot?.active() ? '🌱 ลาป่วยเกินโควตา แต่ช่วงปรับตัวไม่มีผลต่อคะแนน' : '😾 ลาป่วยเกิน 1 ครั้ง/เดือน ความพอใจของหัวหน้าลดลง', 3.4); }
    else say(c, 'boss', 'ดูแลตัวเองนะ 🤒 พักเต็มที่เลย พรุ่งนี้ค่อยมาทำงาน', 1800);
    return;
  }
  return _react6(c, m);
};
setInterval(() => { try { parTick(); sickTick(); } catch (e) { console.error(e); } }, 3000);

/* ================= save / load ================= */
const _snap6 = snapshot; snapshot = () => ({ ..._snap6(), lx: { items: lx.items, seq: lx.seq, par: lx.par, sick: lx.sick, sickLog: lx.sickLog, bossSat: lx.bossSat } });
const _load6 = loadGame;
loadGame = function () {
  const ok = _load6();
  if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.lx) Object.assign(lx, { items: [], par: {}, sick: null, sickLog: [], bossSat: 80 }, s.lx); } catch (e) {} fdSync(); sickBar(); try { starveSync(); } catch (e) {} }
  return ok;
};
setTimeout(() => { fdSync(); }, 0);
