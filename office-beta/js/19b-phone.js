"use strict";
// Office game (beta) — phone home screen with apps: chat, food ordering ("หิวแล้ว" moved from the computer), dating-style swipe app. Promo e-mails carry real coupon codes.
const COUPONS = {
  FREESHIP200: { scope: 'food', t: 'ส่งฟรีเมื่อสั่งครบ 200 บาท', f: (sum, fee) => sum >= 200 ? { off: fee } : { err: 'ต้องสั่งอาหารครบ 200 บาทก่อน' } },
  LUNCH10: { scope: 'food', t: 'ลดค่าอาหาร 10% (สูงสุด 30 บาท)', f: sum => ({ off: Math.min(30, Math.round(sum * .1)) }) },
  BOBA20: { scope: 'food', t: 'ลด 20 บาท เฉพาะร้านชาไข่มุกเมฆ', f: (sum, fee, shop) => shop.id === 'tea' ? { off: 20 } : { err: 'โค้ดนี้ใช้ได้เฉพาะร้านชาไข่มุกเมฆ' } },
  MEWNOI: { scope: 'shop', t: 'ลดเพิ่ม 50 บาทที่ช้อปน้อย', f: sum => ({ off: Math.min(50, sum) }) },
};
const couponMailOk = code => mail.inbox.some(m => arrived(m) && new RegExp('โค้ด\\s*<b>' + code + '</b>').test(m.body || ''));
life.used = life.used || {};
function couponCheck(raw, scope, sum, fee, shop) {
  const code = (raw || '').trim().toUpperCase(); if (!code) return { err: 'พิมพ์โค้ดก่อนนะ' };
  const c = COUPONS[code]; if (!c || c.scope !== scope) return { err: c ? 'โค้ดนี้ใช้กับที่อื่น (' + (c.scope === 'food' ? 'สั่งอาหารในมือถือ' : 'ช้อปปิ้งในเสิร์ชน้อย') + ')' : 'ไม่พบโค้ดนี้' };
  if (!couponMailOk(code)) return { err: 'ยังไม่เคยได้รับโค้ดนี้ในอีเมล (ต้องมีอีเมลโปรโมชั่นที่ส่งโค้ดมาให้ก่อน)' };
  if (life.used[code]) return { err: 'โค้ดนี้ใช้ไปแล้ว' };
  const r = c.f(sum, fee, shop); return r.err ? r : { ...r, code };
}
// make the promo mails carry codes that really work
MAIL_PROMO[1] = () => ['หิวแล้ว', '🍱 ส่งฟรีเมื่อสั่งครบ 200 บาท', '<p>มื้อเที่ยงนี้อยากกินอะไร? เปิดแอป หิวแล้ว บนมือถือ (ไอคอน 🍱 บนหน้าจอมือถือ) 😋</p><p>🎁 ใช้โค้ด <b>FREESHIP200</b> ส่งฟรีเมื่อสั่งครบ 200 บาท · ใช้ได้ครั้งเดียว</p>'];
MAIL_PROMO[4] = () => ['ชาไข่มุกเมฆ', '🧋 ลดทันที 20 บาท', '<p>ชานมไข่มุกแก้วโปรดลดให้เลย เฉพาะสั่งผ่านแอป หิวแล้ว</p><p>🎁 ใช้โค้ด <b>BOBA20</b> ตอนชำระเงิน</p>'];
MAIL_PROMO.push(() => ['หิวแล้ว', '🍜 มื้อกลางวันลด 10%', '<p>สั่งอาหารกลางวันวันนี้ ลดให้ 10% (สูงสุด 30 บาท)</p><p>🎁 ใช้โค้ด <b>LUNCH10</b></p>']);

/* ---------- phone home screen ---------- */
phone.app = null;
const _openPhone = openPhone;
openPhone = function (app) { phone.app = typeof app === 'string' ? app : null; _openPhone(); phone.el?.addEventListener('click', phoneLifeClick); };
const _renderPhone = renderPhone;
renderPhone = function () {
  if (!phone.open || !phone.el) return _renderPhone();
  if (phone.cur) { phone.app = 'chat'; return _renderPhone(); }
  if (phone.app === 'chat') { _renderPhone(); const ph = phone.el.querySelector('.pscr .ph'); if (ph && !ph.querySelector('[data-phome]')) ph.insertAdjacentHTML('afterbegin', '<button data-phome aria-label="หน้าหลัก">⌂</button>'); return; }
  phoneBadge(); const scr = phone.el.querySelector('.pscr'), d = gnow(), sb = `<div class="sb"><span>${p2(d.getHours())}:${p2(d.getMinutes())}</span><span>📶 🔋 87%</span></div>`;
  if (phone.app === 'food') { scr.innerHTML = sb + pfRender(); return; }
  if (phone.app === 'date') { scr.innerHTML = sb + dateRender(); return; }
  const n = chat.list.reduce((s, c) => s + (c.hidden ? 0 : c.unread), 0), um = typeof mailUnread === 'function' ? mailUnread() : 0;
  scr.innerHTML = sb + `<div class="phg"><button data-pa="chat"><i style="background:#2fbf5a">💬</i>แชท${n ? `<em>${n}</em>` : ''}</button><button data-pa="food"><i style="background:#ff8a3d">🍱</i>หิวแล้ว</button><button data-pa="date"><i style="background:#ff5c8a">💘</i>คู่น้อย</button><button disabled class="dim"><i style="background:#3b82f6">📧</i>เมล${um ? `<em>${um}</em>` : ''}<small>ดูที่คอม</small></button></div><div class="phn">แตะแอปเพื่อเปิด · สั่งข้าวได้ที่นี่แล้ว</div>`;
  syncTaskbar();
};
function phoneLifeClick(e) {
  const a = e.target.closest('[data-pa]'); if (a) { phone.app = a.dataset.pa; if (a.dataset.pa === 'chat') phone.cur = null; renderPhone(); S.tone(900, 1000, .03, .04); return; }
  if (e.target.closest('[data-phome]')) { phone.app = null; phone.cur = null; renderPhone(); return; }
  const f = e.target.closest('[data-pf]'); if (f) { pfClick(f, e); return; }
  const dt = e.target.closest('[data-dt]'); if (dt) { dateClick(dt.dataset.dt); return; }
  if (e.target.closest('[data-pcpn]')) pfCoupon();
}
// opening the old computer app now opens the phone food app
openFood = () => { openPhone('food'); S.toast('📱 สั่งอาหารในมือถือแล้วนะ (หยิบมือถือบนโต๊ะ)', 2.2); };

/* ---------- mobile food ordering ---------- */
const pf = { view: 'shops', shop: null, cart: {}, coupon: null, msg: '', track: null };
const pfFee = s => 10 + Math.round(Math.hypot(OFFICE.x - s.x, (OFFICE.y - s.y) * .5) * 60);
const pfItems = () => pf.shop ? pf.shop.menu.map((m, i) => [m, pf.cart[i] || 0]).filter(x => x[1]) : [];
const pfSum = () => pfItems().reduce((s, [m, q]) => s + m[1] * q, 0);
function pfTotals() { const sum = pfSum(), fee = pf.shop ? pfFee(pf.shop) : 0, off = pf.coupon ? pf.coupon.off : 0; return { sum, fee, off, total: Math.max(0, sum + fee - off) }; }
function pfRender() {
  const head = (t, back) => `<div class="ph">${back ? `<button data-pf="${back}" aria-label="กลับ">‹</button>` : '<button data-phome aria-label="หน้าหลัก">⌂</button>'}${t}</div>`;
  if (pf.view === 'track' && pf.track) {
    const p = clamp((performance.now() - pf.track.t0) / pf.track.dur, 0, 1), st = p < .12 ? 0 : p < .3 ? 1 : p < 1 ? 2 : 3;
    return head('🍱 ติดตามออเดอร์') + `<div class="pam"><h4>${pf.track.shop.e} ${esc(pf.track.shop.n)}</h4><div class="pst">${['รับออเดอร์', 'กำลังทำ', 'ไรเดอร์กำลังไปส่ง', 'ถึงแล้ว!'].map((s, i) => `<span class="${i <= st ? 'on' : ''}">${s}</span>`).join('')}</div><div class="prb"><i style="width:${p * 100}%"></i><b style="left:${p * 92}%">🛵</b></div><p>${st === 3 ? '😋 อาหารมาส่งที่ออฟฟิศแล้ว อร่อยนะ!' : `อีกประมาณ ${Math.ceil((1 - p) * 16)} นาที (เวลาในเกมเร็วกว่าจริง)`}</p>${st === 3 ? '<button class="btn2 pri" data-pf="shops">สั่งอีก</button>' : ''}</div>`;
  }
  if (pf.view === 'menu' && pf.shop) { const n = pfItems().reduce((s, x) => s + x[1], 0); return head(`${pf.shop.e} ${esc(pf.shop.n)}`, 'shops') + `<div class="pam pmenu">${pf.shop.menu.map((m, i) => `<div class="pmi"><span>${esc(m[0])}<small>฿${m[1]}</small></span><span class="pq"><button data-pf="q" data-i="${i}" data-d="-1">−</button><b>${pf.cart[i] || 0}</b><button data-pf="q" data-i="${i}" data-d="1">+</button></span></div>`).join('')}</div><div class="pbar"><span>🛒 ${n} ชิ้น · ฿${pfSum()}</span><button class="btn2 pri" data-pf="checkout" ${n ? '' : 'disabled'}>ชำระเงิน</button></div>`; }
  if (pf.view === 'checkout' && pf.shop) { const t = pfTotals(); return head('ชำระเงิน', 'menu') + `<div class="pam"><p><b>📍 ส่งที่:</b> ออฟฟิศ ชั้น 3</p>${pfItems().map(([m, q]) => `<div class="prow"><span>${esc(m[0])} ×${q}</span><span>฿${m[1] * q}</span></div>`).join('')}<div class="prow"><span>ค่าส่ง</span><span>฿${t.fee}</span></div>${t.off ? `<div class="prow" style="color:#2f9d5a"><span>โค้ด ${pf.coupon.code}</span><span>−฿${t.off}</span></div>` : ''}<div class="prow tot"><span>รวม</span><span>฿${t.total}</span></div><div class="pcp"><input class="cin" placeholder="โค้ดส่วนลดจากอีเมลโปรโมชั่น" autocomplete="off"><button class="btn2" data-pcpn>ใช้โค้ด</button></div><div class="pfb">${esc(pf.msg)}</div></div><div class="pbar"><span>รวม ฿${t.total}</span><button class="btn2 pri" data-pf="order">สั่งเลย!</button></div>`; }
  return head('🍱 หิวแล้ว') + `<div class="pam">${gHour() >= 23 || gHour() < 6 ? '<p>🌙 ร้านปิดหมดแล้ว (เปิด 06:00–23:00)</p>' : ''}${SHOPS.map(s => `<button class="psh" data-pf="shop" data-id="${s.id}" style="--c:${s.c}"><i>${s.e}</i><span><b>${esc(s.n)}</b><small>ค่าส่ง ฿${pfFee(s)}</small></span></button>`).join('')}</div>`;
}
function pfClick(el) {
  const k = el.dataset.pf;
  if (k === 'shop') { const s = SHOPS.find(x => x.id === el.dataset.id); if (pf.shop !== s) { pf.cart = {}; pf.coupon = null; } pf.shop = s; pf.view = 'menu'; }
  else if (k === 'q') { const i = +el.dataset.i; pf.cart[i] = clamp((pf.cart[i] || 0) + +el.dataset.d, 0, 20); pf.coupon = null; }
  else if (k === 'shops' || k === 'menu') { pf.view = k; pf.msg = ''; if (k === 'shops') { pf.cart = {}; pf.coupon = null; } }
  else if (k === 'checkout') { pf.view = 'checkout'; pf.msg = ''; }
  else if (k === 'order') {
    const t = pfTotals(); if (gHour() >= 23 || gHour() < 6) { pf.msg = 'ร้านปิดแล้ว'; return renderPhone(); }
    if (!bankPay(t.total, `🍱 ${pf.shop.n}`)) return;
    if (pf.coupon) life.used[pf.coupon.code] = 1;
    const gain = pfItems().reduce((s, [m, q]) => s + foodGain(m[0], m[1]) * q, 0);
    pf.track = { t0: performance.now(), dur: 16000, shop: pf.shop, gain, arrived: false }; pf.view = 'track'; pf.cart = {}; pf.coupon = null; S.tone(600, 1200, .2, .08, 'triangle');
  }
  renderPhone();
}
function pfCoupon() {
  const inp = phone.el.querySelector('.cin'), t = pfTotals(), r = couponCheck(inp.value, 'food', t.sum, t.fee, pf.shop);
  if (r.err) { pf.msg = '❌ ' + r.err; S.tone(300, 200, .15, .08); } else { pf.coupon = r; pf.msg = `✅ ใช้โค้ด ${r.code} สำเร็จ ลด ฿${r.off}`; S.tone(800, 1200, .12, .06, 'triangle'); }
  renderPhone();
}
setInterval(() => {
  if (!pf.track) return; const p = (performance.now() - pf.track.t0) / pf.track.dur;
  if (p >= 1 && !pf.track.arrived) {
    pf.track.arrived = true; eat(pf.track.gain || 25); S.jingle(); S.big('ข้าวมาส่งแล้ว! 🍱', 2, '#ff8a3d'); complete('food');
    if (!desk.querySelector('.lunch')) deskItem('', 40, 8, -4, '<div class="lunch">🍱</div>', 'deco');
  }
  if (phone.open && phone.app === 'food' && pf.view === 'track') renderPhone();
}, 700);

/* ---------- shopping site coupon (ช้อปน้อย in the search app) ---------- */
life.shopCpn = null;
const _showCart = showCart;
showCart = function () {
  _showCart(); const box = se.root?.querySelector('.cartbox'); if (!box || box.querySelector('.cin')) return;
  box.insertAdjacentHTML('beforeend', `<div class="pcp" style="margin-top:8px;display:flex;gap:6px"><input class="cin" placeholder="โค้ดส่วนลดจากอีเมล" autocomplete="off" style="flex:1;padding:5px 8px;border:1px solid #ccd;border-radius:8px">` + `<button class="btn2" data-scpn>ใช้โค้ด</button></div><div class="sfb" style="font-size:12px;margin-top:4px;min-height:16px">${life.shopCpn ? '✅ ใช้โค้ด ' + life.shopCpn.code + ' ลด ฿' + life.shopCpn.off : ''}</div>`);
  box.querySelector('[data-scpn]').addEventListener('click', () => { const tot = se.cart.reduce((s, p) => s + p[1], 0), r = couponCheck(box.querySelector('.cin').value, 'shop', tot); const fb = box.querySelector('.sfb'); if (r.err) { fb.textContent = '❌ ' + r.err; S.tone(300, 200, .15, .08); } else { life.shopCpn = r; fb.textContent = `✅ ใช้โค้ด ${r.code} ลด ฿${r.off} (หักตอนกดชำระเงิน)`; S.tone(800, 1200, .12, .06, 'triangle'); } });
};
const _bankPay = bankPay;
bankPay = function (amt, desc) {
  if (/ช็อปปิ้ง/.test(desc) && life.shopCpn) { const c = life.shopCpn; if (!_bankPay(Math.max(0, amt - c.off), desc + ` (โค้ด ${c.code})`)) return false; life.used[c.code] = 1; life.shopCpn = null; return true; }
  return _bankPay(amt, desc);
};

/* ---------- dating-style swipe app (just for killing time) ---------- */
const PROFILES = [['มะนาว', 27, '🍋', 'ชอบกาแฟดำ เกลียดประชุมเช้า'], ['ปุ้ย', 29, '🐷', 'นักบัญชีเก่ง แต่ลืมกินข้าวประจำ'], ['ต้น', 31, '🌳', 'ปลูกต้นไม้ ถ่ายรูปแมว'], ['เจ', 26, '🎧', 'ฟังเพลงทั้งวัน พิมพ์ช้า'], ['แพร', 28, '🦊', 'ชอบเดินตลาดนัด ซื้อของไม่คิด'], ['โอม', 30, '🏸', 'ตีแบดทุกวันพุธ ชวนได้'], ['ใหม่', 25, '🍰', 'ทำขนมขายออนไลน์ มีตัวอย่างให้ชิม'], ['กอล์ฟ', 32, '⛳', 'ออกกำลังกายเช้า ชวนตื่นยาก'], ['นุ่น', 27, '📚', 'อ่านนิยายสืบสวน เล่าสปอยล์ไม่เก่ง'], ['เบส', 29, '🎸', 'เล่นกีตาร์ในห้องน้ำ เสียงก้องดี']];
let dtI = Math.floor(Math.random() * PROFILES.length);
function dateRender() {
  const p = PROFILES[dtI % PROFILES.length];
  return `<div class="ph"><button data-phome aria-label="หน้าหลัก">⌂</button>💘 คู่น้อย</div><div class="pam pdt"><div class="dcard2"><div class="dem">${p[2]}</div><b>${p[0]}, ${p[1]}</b><small>${p[3]}</small></div><div class="dbt"><button data-dt="no">❌</button><button data-dt="yes">💚</button></div><p class="soft">เลื่อนแล้ว ${life.swipes} · แมตช์ ${life.matches}${life.dm ? '<br>' + esc(life.dm) : ''}</p></div>`;
}
function dateClick(k) {
  life.swipes++; life.stress = Math.max(0, life.stress - .8); dtI++; life.dm = '';
  if (k === 'yes' && Math.random() < .35) { life.matches++; life.dm = '🎉 แมตช์กับ ' + PROFILES[(dtI - 1) % PROFILES.length][0] + '! (แต่ยังไม่มีเวลาทักหรอก เพราะงานเยอะ)'; S.tone(880, 1320, .15, .07, 'triangle'); } else S.tone(500, 600, .04, .04);
  renderPhone();
}
