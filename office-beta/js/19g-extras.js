"use strict";
// Office game (beta) — extras: เพลงจาก YouTube จริง, นิยาย (ล็อกตอน/ซื้อรายตอน-สัปดาห์-เดือน), โค้ดส่วนลดอาหาร + ป๊อปอัพ, แก๊งคอลเซนเตอร์, ไม่เด้งแป้นพิมพ์เมื่อใช้โทรศัพท์เป็นจอย

/* ================= โทรศัพท์เป็นจอย: ไม่ให้เครื่องที่เล่นเกมเด้งแป้นพิมพ์ ================= */
document.addEventListener('focusin', e => {
  const t = e.target; if (!t || !t.matches || !t.matches('input,textarea')) return;
  if (pad && pad.live) { if (t.dataset.im === undefined) t.dataset.im = t.getAttribute('inputmode') || ''; t.setAttribute('inputmode', 'none'); }
  else if (t.dataset.im !== undefined) { if (t.dataset.im) t.setAttribute('inputmode', t.dataset.im); else t.removeAttribute('inputmode'); delete t.dataset.im; }
});

/* ================= เพลง YouTube ================= */
const YT_TRACKS = [
  ['Lofi hip hop radio — beats to relax/study to', 'jfKfPfyJRdk'],
  ['Lofi hip hop radio — beats to sleep/chill to', '5qap5aO4i9A'],
  ['Synthwave radio — beats to chill/game to', '4xDzrJKXOOY'],
  ['Chillhop Radio — jazz / lofi beats', '5yx6BWlEVcY'],
];
function parseYT(raw) {
  const s = String(raw || '').trim(); if (!s) return null;
  const list = /[?&]list=([\w-]{10,})/.exec(s), id = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(s) || /^([\w-]{11})$/.exec(s);
  if (id) return { id: id[1] }; if (list) return { list: list[1] }; return null;
}
function musicPlay(src, name) {
  const W = wins.get('slack'); if (!W) return; musicStop(true);
  const url = src.list ? `https://www.youtube-nocookie.com/embed/videoseries?list=${src.list}&autoplay=1&rel=0&playsinline=1` : `https://www.youtube-nocookie.com/embed/${src.id}?autoplay=1&rel=0&playsinline=1`;
  const link = src.list ? `https://www.youtube.com/playlist?list=${src.list}` : `https://www.youtube.com/watch?v=${src.id}`;
  const dock = h('div', { class: 'mdock' }, `<div class="mdh"><b>🎶 ${esc(name)}</b><a href="${link}" target="_blank" rel="noopener">เปิดใน YouTube</a><button class="btn2" data-sl="mstop" aria-label="หยุดเพลง">✕</button></div><iframe src="${url}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`);
  W.body.style.position = 'relative'; W.body.classList.add('hasdock'); W.body.append(dock); life.music = { n: name };
}
function musicStop(quiet) {
  const W = wins.get('slack'); W?.body.querySelector('.mdock')?.remove(); W?.body.classList.remove('hasdock'); life.music = null; if (!quiet) renderSlack();
}
function musicHTML() {
  return `<button class="btn2" data-sl="back">← กลับ</button><p class="soft" style="margin:6px 0 0">🎵 เปิดจาก YouTube จริง · ฟังไปความเครียดจะลดลง (ถ้าวิดีโอไม่เล่น ให้กด “เปิดใน YouTube” ที่เครื่องเล่น หรือวางลิงก์ใหม่)</p>
  <div class="sll">${YT_TRACKS.map(([n], i) => `<button data-sl="mplay" data-i="${i}"><b>▶️ ${esc(n)}</b><small>YouTube · เพลงสตรีมต่อเนื่อง</small></button>`).join('')}</div>
  <div class="mlk"><input class="mlink" placeholder="วางลิงก์ YouTube ของคุณเอง (วิดีโอหรือเพลย์ลิสต์)" autocomplete="off"><button class="btn2 pri" data-sl="mlink">▶ เล่น</button></div><div class="mfb soft"></div>`;
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
  if (k === 'mplay') { const [n, id] = YT_TRACKS[+t.dataset.i]; musicPlay({ id }, n); return true; }
  if (k === 'mlink') {
    const inp = wins.get('slack')?.body.querySelector('.mlink'), fb = wins.get('slack')?.body.querySelector('.mfb'), r = parseYT(inp && inp.value);
    if (!r) { if (fb) fb.textContent = '❌ ลิงก์นี้ไม่ใช่ลิงก์ YouTube (ลองคัดลอกจากแถบที่อยู่ของวิดีโอ)'; return true; }
    musicPlay(r, 'เพลงที่คุณเลือก'); return true;
  }
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
