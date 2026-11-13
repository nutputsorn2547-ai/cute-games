"use strict";
// Office game — food ordering. Files load in order and share one global scope (see office/index.html).
/* ================= food app ================= */
const SHOPS = [
  { id: 'chick', n: 'ข้าวมันไก่ป้าแดง', e: '🍗', c: '#ffe1c4', x: .16, y: .22, menu: [['ข้าวมันไก่ต้ม', 50], ['ข้าวมันไก่ทอด', 55], ['ข้าวมันไก่รวม', 65], ['น้ำซุปฟัก', 15]] },
  { id: 'somtum', n: 'ส้มตำน้องฟ้า', e: '🥗', c: '#d8f5c8', x: .45, y: .15, menu: [['ส้มตำไทย', 50], ['ส้มตำปูปลาร้า', 55], ['ไก่ย่าง (ครึ่งตัว)', 90], ['ข้าวเหนียว', 10]] },
  { id: 'noodle', n: 'ก๋วยเตี๋ยวเรือลุงหมี', e: '🍜', c: '#ffe7a8', x: .2, y: .74, menu: [['เส้นเล็กน้ำตก', 45], ['เส้นใหญ่ต้มยำ', 50], ['เกี๊ยวทอด', 35], ['ชาเย็น', 25]] },
  { id: 'kaprao', n: 'กะเพราเตาถ่าน', e: '🍳', c: '#ffd6d6', x: .82, y: .2, menu: [['กะเพราหมูสับไข่ดาว', 60], ['กะเพราไก่ไข่เจียว', 60], ['กะเพราทะเล', 80], ['ไข่ดาวเพิ่ม', 10]] },
  { id: 'tea', n: 'ชาไข่มุกเมฆ', e: '🧋', c: '#e6dcff', x: .9, y: .78, menu: [['ชานมไข่มุก', 45], ['ชาเขียวมัทฉะ', 55], ['โกโก้เย็น', 45], ['บราวน์ชูการ์', 60]] },
];
const OFFICE = { x: .6, y: .55 };
const food = { W: null, view: 'shops', shop: null, cart: {}, pin: null, place: 'ออฟฟิศ ชั้น 3', track: null };
function openFood() {
  if (food.W && wins.has('food')) { focusWin(food.W); return; }
  food.W = openWin('food', 'หิวแล้ว — สั่งอาหาร', h('div', { class: 'fd' }), 600, 440, '#ffe6cf'); food.W.onClose = () => { food.W = null; };
  food.W.body.style.overflow = 'hidden';
  food.W.body.firstChild.addEventListener('click', foodClick);
  food.W.body.firstChild.addEventListener('pointerdown', e => { const mp = e.target.closest('.map.pick'); if (!mp) return; const r = mp.getBoundingClientRect(); food.pin = { x: clamp((e.clientX - r.left) / r.width, .02, .98), y: clamp((e.clientY - r.top) / r.height, .06, .98) }; S.tone(500, 1000, .08, .07); S.vib(15); renderFood(); });
  renderFood();
}
const cartItems = () => food.shop ? food.shop.menu.map((m, i) => [m, food.cart[i] || 0]).filter(x => x[1]) : [];
const cartSum = () => cartItems().reduce((s, [m, q]) => s + m[1] * q, 0);
const fee = () => food.pin && food.shop ? 10 + Math.round(Math.hypot(food.pin.x - food.shop.x, (food.pin.y - food.shop.y) * .5) * 60) : 0;
function mapSVG() {
  return `<svg viewBox="0 0 640 320" preserveAspectRatio="none"><rect width="640" height="320" fill="#e8f3e0"/>
    <path d="M0 150 H640 M0 255 H640 M190 0 V320 M440 0 V320" stroke="#fff" stroke-width="22"/><path d="M0 150 H640 M0 255 H640 M190 0 V320 M440 0 V320" stroke="#f6e7b8" stroke-width="2" stroke-dasharray="10 10"/>
    <rect x="30" y="20" width="130" height="100" rx="10" fill="#ffd9e2"/><rect x="220" y="20" width="190" height="100" rx="10" fill="#d9ecff"/><rect x="470" y="20" width="150" height="100" rx="10" fill="#fff0c2"/>
    <rect x="30" y="180" width="130" height="50" rx="10" fill="#e0d6ff"/><rect x="220" y="180" width="190" height="50" rx="10" fill="#cdeeda"/><rect x="470" y="180" width="150" height="50" rx="10" fill="#ffe0c8"/>
    <circle cx="310" cy="70" r="26" fill="#9fd88f"/><text x="310" y="75" font-size="14" text-anchor="middle" font-family="Mitr">สวน</text><text x="545" y="210" font-size="13" text-anchor="middle" font-family="Mitr" fill="#8a6a4a">ห้าง</text></svg>`;
}
function mapHTML(pickable, extra = '') {
  return `<div class="map ${pickable ? 'pick' : ''}">${mapSVG()}<span class="mk" style="left:${OFFICE.x * 100}%;top:${OFFICE.y * 100}%">🏢</span>${SHOPS.map(s => `<span class="mk" style="left:${s.x * 100}%;top:${s.y * 100}%;${s === food.shop ? 'font-size:26px' : 'opacity:.55'}">${s.e}</span>`).join('')}${food.pin ? `<span class="pin" style="left:${food.pin.x * 100}%;top:${food.pin.y * 100}%">📍</span>` : ''}${extra}</div>`;
}
function renderFood() {
  if (!food.W) return; const box = food.W.body.firstChild, n = cartItems().reduce((s, x) => s + x[1], 0);
  let main = '', bot = '';
  if (food.view === 'shops') {
    const closed = gHour() >= 23 || gHour() < 6;
    main = `${closed ? '<p style="background:#ffe9d6;padding:8px 10px;border-radius:10px;margin:0 0 8px">🌙 ร้านปิดหมดแล้ว (เปิด 06:00–23:00) ลองเปลี่ยนเวลาในคอมดูนะ</p>' : ''}<p style="margin:0 0 8px;color:#8a6a4a">เที่ยงนี้กินอะไรดี? ร้านใกล้ออฟฟิศ 🏢</p><div class="shops">${SHOPS.map(s => `<button class="shop" data-shop="${s.id}" ${closed ? 'disabled style="opacity:.5"' : ''}><div class="e" style="--c:${s.c}">${s.e}</div><b style="font-weight:500">${esc(s.n)}</b><small>⭐ ${(4.3 + hash(s.id) % 7 / 10).toFixed(1)} · ${15 + hash(s.n) % 20} นาที</small></button>`).join('')}</div>`;
  } else if (food.view === 'menu') {
    main = `<p style="margin:0 0 8px"><a data-fv="shops" style="color:#e8742b;cursor:pointer">← ร้านทั้งหมด</a> · <b>${food.shop.e} ${esc(food.shop.n)}</b></p><div class="menu">${food.shop.menu.map((m, i) => `<div class="mi"><span>${esc(m[0])}</span><b>฿${m[1]}</b><div class="qty"><button data-q="${i}" data-d="-1" aria-label="ลด">−</button><b>${food.cart[i] || 0}</b><button data-q="${i}" data-d="1" aria-label="เพิ่ม">+</button></div></div>`).join('')}</div>`;
    bot = `<span>🛒 ${n} รายการ · <b>฿${cartSum()}</b></span><button class="go" data-fv="addr" ${n ? '' : 'disabled'}>ไปเลือกที่อยู่ส่ง →</button>`;
  } else if (food.view === 'addr') {
    main = `<p style="margin:0 0 6px"><a data-fv="menu" style="color:#e8742b;cursor:pointer">← แก้เมนู</a> · <b>แตะบนแผนที่เพื่อปักหมุดจุดส่งอาหาร 📍</b></p>${mapHTML(true)}<label>ชื่อสถานที่ <input class="plc" type="text" value="${esc(food.place)}" spellcheck="false"></label><button class="btn2" data-pin-office style="margin-top:6px">🏢 ปักที่ออฟฟิศ</button>`;
    bot = food.pin ? `<span>อาหาร ฿${cartSum()} + ค่าส่ง ฿${fee()} = <b>฿${cartSum() + fee()}</b></span><button class="go" data-order>สั่งเลย!</button>` : `<span style="color:var(--soft)">ยังไม่ได้ปักหมุด</span><button class="go" disabled>สั่งเลย!</button>`;
  } else if (food.view === 'track') {
    main = `<div class="steps">${['รับออเดอร์', 'กำลังทำ', 'ไรเดอร์กำลังไปส่ง', 'ถึงแล้ว!'].map((s, i) => `<span data-st="${i}">${s}</span>`).join('')}</div>${mapHTML(false, '<span class="rider">🛵</span>')}<p class="eta" style="margin:8px 0 0;text-align:center;color:#8a6a4a"></p>`;
    bot = food.track && food.track.arrived ? `<span>อร่อยให้เต็มที่นะ 😋</span><button class="go" data-fv="shops" data-reset>สั่งอีก</button>` : `<span>ส่งไปที่ 📍 ${esc(food.place)}</span>`;
  }
  box.innerHTML = `<div class="top"><b>หิวแล้ว</b><span>🍱</span><span class="addr">${food.pin ? '📍 ' + esc(food.place) : 'ยังไม่ได้ปักหมุดที่อยู่'}</span></div><div class="main">${main}</div>${bot ? `<div class="bot">${bot}</div>` : ''}`;
  box.querySelector('.plc')?.addEventListener('input', e => { food.place = e.target.value; });
  if (food.view === 'track') updateTrack(performance.now());
}
function foodClick(e) {
  const t = e.target, sb = t.closest('[data-shop]');
  if (sb) { const s = SHOPS.find(x => x.id === sb.dataset.shop); if (food.shop !== s) food.cart = {}; food.shop = s; food.view = 'menu'; renderFood(); S.tone(700, 900, .05, .05); return; }
  const q = t.closest('[data-q]'); if (q) { const i = +q.dataset.q; food.cart[i] = clamp((food.cart[i] || 0) + +q.dataset.d, 0, 20); renderFood(); S.tone(q.dataset.d > 0 ? 900 : 600, q.dataset.d > 0 ? 1100 : 500, .05, .05); return; }
  if (t.closest('[data-pin-office]')) { food.pin = { ...OFFICE }; food.place = 'ออฟฟิศ ชั้น 3'; renderFood(); S.tone(500, 1000, .08, .07); return; }
  const fv = t.closest('[data-fv]'); if (fv && !fv.disabled) { if ('reset' in fv.dataset) { food.cart = {}; food.track = null; } food.view = fv.dataset.fv; renderFood(); return; }
  if (t.closest('[data-order]')) { if (!bankPay(cartSum() + fee(), `🍱 ${food.shop.n}`)) return; food.view = 'track'; food.track = { t0: performance.now(), dur: 16000, arrived: false }; S.tone(600, 1200, .2, .08, 'triangle'); renderFood(); }
}
function updateTrack(now) {
  if (!food.track || !food.W || food.view !== 'track') return;
  const box = food.W.body.firstChild, p = clamp((now - food.track.t0) / food.track.dur, 0, 1);
  const st = p < .12 ? 0 : p < .3 ? 1 : p < 1 ? 2 : 3;
  box.querySelectorAll('[data-st]').forEach(s => s.classList.toggle('on', +s.dataset.st <= st));
  const k = clamp((p - .3) / .7, 0, 1), s = food.shop, P = food.pin;
  // ride along the streets: first horizontal, then vertical
  const half = k < .5 ? k * 2 : 1, x = s.x + (P.x - s.x) * half, y = k < .5 ? s.y : s.y + (P.y - s.y) * (k - .5) * 2;
  const r = box.querySelector('.rider'); if (r) { r.style.left = x * 100 + '%'; r.style.top = y * 100 + '%'; }
  const eta = box.querySelector('.eta'); if (eta) eta.textContent = st === 3 ? `ถึงแล้ว! ${s.e} มาส่งที่ ${food.place}` : `อีกประมาณ ${Math.ceil((1 - p) * 16)} นาที (เวลาในเกมเร็วกว่าจริง)`;
  if (p >= 1 && !food.track.arrived) {
    food.track.arrived = true; S.jingle(); S.big('ข้าวมาส่งแล้ว! 🍱', 2, '#ff8a3d'); complete('food'); renderFood();
    if (!desk.querySelector('.lunch')) deskItem('', 40, 8, -4, '<div class="lunch">🍱</div>', 'deco');
  }
}
