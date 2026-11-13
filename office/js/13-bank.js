"use strict";
// Office game — bank and dorms. Files load in order and share one global scope (see office/index.html).
/* ================= bank ================= */
const bank = { bal: 0, loan: 0, tx: [], bills: [], lastDay: 0, start: 0, notes: [], tab: 'home', W: null, home: { id: 'cur', name: 'ห้องเช่าบ้านแมวน้อย', rent: 6500, km: 8 } };
let bid = 0;
const EXP = [['🦷', 'ทำฟัน', 800, 1500], ['📱', 'จอมือถือแตก', 1200, 2500], ['💌', 'ซองงานแต่งเพื่อน', 500, 1000], ['🐱', 'พาแมวไปหาหมอ', 600, 1800], ['🎁', 'ของขวัญวันเกิดเพื่อน', 300, 800], ['🚕', 'ค่าแท็กซี่วันฝนตก', 150, 400], ['☕', 'กาแฟทั้งสัปดาห์', 300, 600], ['🛠️', 'ซ่อมพัดลม', 350, 900], ['👟', 'รองเท้าขาด ต้องซื้อใหม่', 500, 1200], ['💊', 'ซื้อยาสามัญติดห้อง', 120, 350]];
const XFER = [['mom', 'แม่'], ['dad', 'พ่อ'], ['sis', 'น้องสาว'], ['bro', 'พี่ชาย'], ['fon', 'ฝน'], ['mint', 'มิ้นท์'], ['bear', 'น้องหมี'], ['bun', 'พี่กระต่าย'], ['duck', 'เป็ดน้อย'], ['boss', 'หัวหน้าแมว'], ['jib', 'น้องเจี๊ยบ']];
const money = v => { const n = parseFloat(String(v || '').replace(/[,\s฿]/g, '')); return isFinite(n) ? Math.round(n) : NaN; };
function bankTx(desc, amt) { bank.bal += amt; bank.tx.unshift({ d: txDate ?? gnow().getTime(), desc, amt, bal: bank.bal }); if (bank.tx.length > 80) bank.tx.pop(); }
function bankPay(amt, desc) {
  if (amt > bank.bal) { S.toast(`ยอดเงินไม่พอ 😢 มี ${baht(bank.bal)} บาท แต่ต้องใช้ ${baht(amt)} บาท · ลองยืมสินเชื่อในแอปธนาคารน้อย`, 3); S.tone(300, 200, .15, .08); return false; }
  bankTx(desc, -amt); renderBank(); return true;
}
function addBill(e, n, amt, due) { bank.bills.push({ id: ++bid, e, n, amt, due, paid: false }); bank.notes.push(`🧾 ${n} ${baht(amt)} บาท`); }
function newDay(d) {
  const dt = new Date(d), D = dt.getDate(), mon = thDate(d, { month: 'short' });
  if (D === 1) {
    addBill('🏠', `ค่าเช่า ${bank.home.name} (${mon})`, bank.home.rent, d + 4 * DAY);
    if (bank.loan) { const it = Math.round(bank.loan * .01); bank.loan += it; bank.notes.push(`ดอกเบี้ยสินเชื่อ +${baht(it)}`); }
  }
  if (D === 10) { const hot = [2, 3, 4].includes(dt.getMonth()); addBill('⚡', `ค่าไฟ (${mon})`, Math.round((700 + Math.random() * 800) * (hot ? 1.5 : 1)), d + 5 * DAY); addBill('💧', `ค่าน้ำ (${mon})`, Math.round(120 + Math.random() * 140), d + 5 * DAY); }
  for (const b of bank.bills) if (!b.paid && !b.late && b.due < d) { b.late = true; b.amt += 100; bank.notes.push(`⚠️ ${b.n} เลยกำหนด ปรับ 100 บาท`); }
  dailyDocs(d); livingCosts(d);
  if (d > bank.start && Math.random() < .14) {
    const [e, n, a, b] = pick(EXP), amt = Math.round((a + Math.random() * (b - a)) / 10) * 10;
    if (bank.bal >= amt) { bankTx(`${e} ${n}`, -amt); bank.notes.push(`💳 ${n} −${baht(amt)}`); } else addBill(e, n, amt, d + 3 * DAY);
  }
}
function bankTick(quiet) {
  const today = dayStart(gnow());
  while (bank.lastDay < today) { bank.lastDay = dayStart(bank.lastDay + DAY + 3 * 3600000); fireUpTo(bank.lastDay); txDate = bank.lastDay + 9 * 3600000; newDay(bank.lastDay); txDate = null; }
  if (bank.notes.length && !quiet) { const n = bank.notes.slice(); setTimeout(() => { S.toast('🏦 ' + n.slice(-4).join(' · ') + (n.length > 4 ? ` · และอีก ${n.length - 4} รายการ` : ''), 3.5); phoneBuzz(); }, 2200); }
  bank.notes = []; renderBank();
}
bank.start = dayStart(gnow()); bank.lastDay = bank.start - DAY; bankTx('ยอดยกมา', 12000); // first day's bills are processed in 17-main once every file has loaded
function openBank(tab) {
  if (tab) bank.tab = tab;
  if (bank.W && wins.has('bank')) { focusWin(bank.W); renderBank(true); return bank.W; }
  bank.W = openWin('bank', 'ธนาคารน้อย', h('div', { class: 'bk' }), 580, 470, '#dff5ea'); bank.W.onClose = () => { bank.W = null; };
  bank.W.body.style.overflow = 'hidden'; bank.W.body.firstChild.addEventListener('click', bankClick);
  renderBank(true); return bank.W;
}
const nextPayday = () => { const g = gnow(), d = new Date(g.getFullYear(), g.getMonth(), 25); if (dayStart(d) < dayStart(g)) d.setMonth(d.getMonth() + 1); return d; };
function renderBank(force) {
  if (!bank.W) return; const box = bank.W.body.firstChild;
  if (!force && box.contains(document.activeElement) && document.activeElement.matches('input,select')) { const b = box.querySelector('.bal'); if (b) b.textContent = '฿' + baht(bank.bal); return; }
  const unpaid = bank.bills.filter(b => !b.paid), due = unpaid.reduce((s, b) => s + b.amt, 0), today = dayStart(gnow());
  const tabs = [['home', 'ภาพรวม'], ['bills', `บิล${unpaid.length ? ` (${unpaid.length})` : ''}`], ['xfer', 'โอนเงิน'], ['loan', 'สินเชื่อ'], ['tx', 'รายการ']];
  const row = (a, b, cls = '') => `<div class="row3"><span>${a}</span><b class="${cls}">${b}</b></div>`;
  let body = '';
  if (bank.tab === 'home') body = `<div class="card3">${row('💼 เงินเดือนปัจจุบัน', baht(hr.base) + ' บาท')}${hr.pending ? row('📈 ปรับเป็น', `${baht(hr.pending)} บาท (มีผล ${thDate(hr.eff, { day: 'numeric', month: 'short' })})`, 'pos') : ''}${row('📅 เงินเดือนออกครั้งถัดไป', thDate(nextPayday(), { day: 'numeric', month: 'short', year: 'numeric' }))}</div>
    <div class="card3">${row('🏠 ที่พักตอนนี้', esc(bank.home.name))}${row('ค่าเช่า/เดือน', baht(bank.home.rent) + ' บาท')}${row('ค่าเช่าคิดเป็น', Math.round(bank.home.rent / hr.base * 100) + '% ของเงินเดือน', bank.home.rent / hr.base > .3 ? 'neg' : 'pos')}</div>
    <div class="card3">${row('🧾 บิลค้างจ่าย', unpaid.length ? `${unpaid.length} รายการ · ${baht(due)} บาท` : 'ไม่มี 🎉', unpaid.length ? 'neg' : 'pos')}${row('🏦 หนี้สินเชื่อ', bank.loan ? baht(bank.loan) + ' บาท' : '0', bank.loan ? 'neg' : '')}</div>
    ${Object.keys(debts).some(k => debts[k]) ? `<div class="card3"><b style="font-weight:500">🤝 ยืมเงินคนรู้จัก (คืนได้ที่แท็บโอนเงิน)</b>${Object.keys(debts).filter(k => debts[k]).map(k => row(PEOPLE[k].n, baht(debts[k]) + ' บาท', 'neg')).join('')}</div>` : ''}
    <small style="color:var(--soft)">เป็นธนาคารในเกม ไม่ได้คิดภาษีหรือประกันสังคม · ค่าเช่าเรียกเก็บวันที่ 1 · ค่าน้ำไฟวันที่ 10 · มีค่าใช้จ่ายสุ่มบางวัน</small>`;
  if (bank.tab === 'bills') body = (unpaid.length ? `<button class="btn2 grn" data-payall style="align-self:flex-start">จ่ายทั้งหมด ${baht(due)} บาท</button>` : '<div class="card3">ไม่มีบิลค้าง 🎉</div>')
    + unpaid.map(b => `<div class="card3 row3"><span>${b.e} ${esc(b.n)}<br><small class="${b.due < today ? 'neg' : ''}" style="color:${b.due < today ? '#e0457b' : 'var(--soft)'}">ครบกำหนด ${thDate(b.due, { day: 'numeric', month: 'short' })}${b.late ? ' · เลยกำหนด (ปรับแล้ว)' : ''}</small></span><span style="display:flex;gap:8px;align-items:center"><b>${baht(b.amt)}</b><button class="btn2 pri" data-paybill="${b.id}">จ่าย</button></span></div>`).join('')
    + (bank.bills.some(b => b.paid) ? `<h5 style="margin:6px 0 0;font-weight:500;color:var(--soft)">จ่ายแล้ว</h5>${bank.bills.filter(b => b.paid).slice(-5).reverse().map(b => `<div class="row3" style="color:var(--soft)"><span>${b.e} ${esc(b.n)}</span><span>${baht(b.amt)} ✓</span></div>`).join('')}` : '');
  if (bank.tab === 'xfer') body = `<div class="card3" style="display:flex;flex-direction:column;gap:8px"><label>โอนให้ <select class="xto">${XFER.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label><label>จำนวนเงิน <input class="xamt" type="text" inputmode="numeric" placeholder="เช่น 500"></label><div class="qa">${[100, 500, 1000, 2000].map(v => `<button class="btn2" data-qa="${v}">${baht(v)}</button>`).join('')}</div><label>บันทึกช่วยจำ <input class="xnote" type="text" placeholder="เช่น ค่าขนม" spellcheck="false"></label><button class="btn2 grn" data-xfer>💸 โอนเงิน</button></div>`;
  if (bank.tab === 'loan') { const lim = hr.base * 3 - bank.loan; body = `<div class="card3">${row('วงเงินกู้ได้อีก', baht(Math.max(0, lim)) + ' บาท')}${row('หนี้ตอนนี้', baht(bank.loan) + ' บาท', bank.loan ? 'neg' : '')}<small style="color:var(--soft)">วงเงิน 3 เท่าของเงินเดือน · ดอกเบี้ย 1% ต่อเดือน คิดทุกวันที่ 1 (ในเกม)</small></div>
    <div class="card3" style="display:flex;flex-direction:column;gap:6px"><label>ยืมเพิ่ม <input class="lamt" type="text" inputmode="numeric" placeholder="จำนวนเงิน"></label><button class="btn2 pri" data-borrow>🏦 ยืมเงิน</button></div>
    <div class="card3" style="display:flex;flex-direction:column;gap:6px"><label>คืนเงิน <input class="ramt" type="text" inputmode="numeric" placeholder="จำนวนเงิน"></label><button class="btn2 grn" data-repay>ชำระคืน</button></div>`; }
  if (bank.tab === 'tx') body = bank.tx.map(t => `<div class="row3"><span>${esc(t.desc)}<br><small style="color:var(--soft)">${thDate(t.d, { day: 'numeric', month: 'short', year: '2-digit' })}</small></span><b class="${t.amt < 0 ? 'neg' : 'pos'}">${t.amt < 0 ? '−' : '+'}${baht(Math.abs(t.amt))}</b></div>`).join('');
  box.innerHTML = `<div class="bh"><small>บัญชีออมทรัพย์ · ${esc(chat.account?.name || 'ของฉัน')}</small><div class="bal">฿${baht(bank.bal)}</div><small>เงินเดือน ${baht(hr.base)} บาท/เดือน · ออกทุกวันที่ 25</small></div>
    <div class="tabs2">${tabs.map(([k, n]) => `<button data-btab="${k}" class="${k === bank.tab ? 'on' : ''}">${n}</button>`).join('')}</div><div class="bb2">${body}</div>`;
}
function payBill(b) { if (!bankPay(b.amt, `${b.e} จ่าย${b.n}`)) return false; b.paid = true; complete('bank'); S.tone(800, 1200, .1, .07, 'triangle'); return true; }
function bankClick(e) {
  const t = e.target, box = bank.W.body.firstChild;
  const tb = t.closest('[data-btab]'); if (tb) { bank.tab = tb.dataset.btab; renderBank(true); return; }
  const pb = t.closest('[data-paybill]'); if (pb) { const b = bank.bills.find(x => x.id === +pb.dataset.paybill); if (b && payBill(b)) { S.toast(`จ่าย ${b.n} แล้ว`, 1.6); renderBank(true); } return; }
  if (t.closest('[data-payall]')) { for (const b of bank.bills.filter(x => !x.paid)) if (!payBill(b)) break; renderBank(true); return; }
  const qa = t.closest('[data-qa]'); if (qa) { box.querySelector('.xamt').value = qa.dataset.qa; return; }
  if (t.closest('[data-xfer]')) {
    const k = box.querySelector('.xto').value, amt = money(box.querySelector('.xamt').value), name = XFER.find(x => x[0] === k)[1], note = box.querySelector('.xnote').value.trim();
    if (!(amt > 0)) { S.toast('ใส่จำนวนเงินก่อนนะ', 1.5); return; }
    if (!bankPay(amt, `💸 โอนให้${name}${note ? ' · ' + note : ''}`)) return;
    complete('bank'); S.jingle(); S.toast(`โอนให้${name} ${baht(amt)} บาท สำเร็จ`, 2); renderBank(true);
    if (debts[k]) { const pay = Math.min(amt, debts[k]); debts[k] -= pay; renderBank(true); pushMsg(chatOf(k), k, debts[k] ? `ได้คืนแล้ว ${baht(pay)} บาท ขอบใจนะ เหลืออีก ${baht(debts[k])} บาท 👍` : 'คืนครบแล้ว ขอบใจมาก 🎉 ไว้ขัดสนก็บอกได้นะ', 2200); return; }
    const R = { bear: 'ได้รับแล้วครับพี่ ขอบคุณครับ 🐻', bun: 'ได้รับแล้วจ้า ขอบใจนะ 🐰', duck: 'เงินเข้า ก๊าบๆ ขอบคุณ 🐥', boss: 'อ้าว โอนมาให้พี่ทำไม 555 ขอบใจนะ', jib: 'พี่โอนมาให้หนูเหรอคะ 🥹 ขอบคุณมากค่ะ', mom: 'ได้รับแล้วลูก ไม่ต้องส่งมาก็ได้ เก็บไว้ใช้เถอะ แต่แม่ขอบใจนะ ❤️', dad: 'ได้รับแล้วลูก 👍 พ่อเอาไปเติมน้ำมันนะ', sis: 'เย้ เงินเข้า! ขอบคุณพี่ 💸 รักพี่ที่สุด', bro: 'ได้รับละ ค่าเน็ตบ้านครบแล้วนะน้อง 555', fon: 'ได้รับแล้ว ค่าหมูกระทะใช่ป่ะ 🥓', mint: 'เงินเข้าแล้ว ขอบใจนะแก 💕' };
    pushMsg(chatOf(k), k, R[k] + ` (${baht(amt)} บาท)`, 2200); return;
  }
  if (t.closest('[data-borrow]')) {
    const amt = money(box.querySelector('.lamt').value), lim = hr.base * 3 - bank.loan;
    if (!(amt > 0)) { S.toast('ใส่จำนวนเงินที่จะยืมก่อนนะ', 1.5); return; }
    if (amt > lim) { S.toast(`ยืมได้อีกไม่เกิน ${baht(Math.max(0, lim))} บาท`, 2); return; }
    bank.loan += amt; bankTx('🏦 สินเชื่อเงินสด', amt); S.tone(500, 900, .15, .07); S.toast(`ยืม ${baht(amt)} บาท เข้าบัญชีแล้ว · อย่าลืมคืนนะ`, 2.2); renderBank(true); return;
  }
  if (t.closest('[data-repay]')) {
    const amt = money(box.querySelector('.ramt').value);
    if (!(amt > 0) || !bank.loan) { S.toast(bank.loan ? 'ใส่จำนวนเงินก่อนนะ' : 'ไม่มีหนี้ให้คืน 🎉', 1.6); return; }
    const pay = Math.min(amt, bank.loan); if (!bankPay(pay, '🏦 ชำระสินเชื่อ')) return;
    bank.loan -= pay; S.toast(bank.loan ? `คืนแล้ว ${baht(pay)} เหลือหนี้ ${baht(bank.loan)} บาท` : 'ปลดหนี้สำเร็จ 🎉', 2); renderBank(true);
  }
}

/* ================= dorms (search tab) ================= */
const DORMS = [
  { id: 'd1', name: 'หอแมวเหมียว เพลส', rent: 4500, size: '24 ตร.ม.', km: 3, e: '🐱', c: '#ffe1c4', feat: ['แอร์ + เครื่องทำน้ำอุ่น', 'เลี้ยงแมวได้', 'มีร้านข้าวใต้หอ'] },
  { id: 'd2', name: 'คอนโดฟ้าคราม', rent: 8900, size: '30 ตร.ม.', km: 1.5, e: '🏙️', c: '#d9ecff', feat: ['ใกล้รถไฟฟ้า', 'สระว่ายน้ำ + ฟิตเนส', 'รปภ. 24 ชม.'] },
  { id: 'd3', name: 'บ้านเช่าสวนกล้วย', rent: 7000, size: 'บ้านเดี่ยว 2 ห้องนอน', km: 12, e: '🏡', c: '#d8f5c8', feat: ['มีสวนหน้าบ้าน', 'เลี้ยงหมาได้', 'ที่จอดรถ 2 คัน'] },
  { id: 'd4', name: 'หอพักหมีน้อย', rent: 3200, size: '18 ตร.ม.', km: 15, e: '🐻', c: '#f0e2d0', feat: ['ราคาประหยัด', 'พัดลม (ไม่มีแอร์)', 'ห้องน้ำในตัว'] },
  { id: 'd5', name: 'ลอฟต์ริมน้ำ', rent: 12000, size: '35 ตร.ม.', km: 1, e: '🌊', c: '#cdeffd', feat: ['วิวแม่น้ำ', 'เฟอร์นิเจอร์ครบ', 'เดินไปออฟฟิศได้'] },
];
const DORM_WORD = /หอ|ห้องเช่า|คอนโด|ย้ายบ้าน|บ้านเช่า|อพาร์ต/;
const moveCost = d => d.rent * 3 + 1500;
function showDorms(q) {
  const list = DORMS.filter(d => !q || DORM_WORD.test(q) || d.name.includes(q) || d.feat.some(f => f.includes(q)));
  res().innerHTML = `<p class="note">ตอนนี้อยู่ที่ ${esc(bank.home.name)} · ค่าเช่า ${baht(bank.home.rent)} บาท/เดือน · ห่างออฟฟิศ ${bank.home.km} กม. · เว็บหาห้องในเกม</p><div class="hlist">${(list.length ? list : DORMS).map(d => `<div class="hc" data-dorm="${d.id}"><div class="dart" style="--c:${d.c}">${d.e}</div><div><h4>${esc(d.name)}${bank.home.id === d.id ? ' <small style="color:#2f9d5a">(อยู่ที่นี่)</small>' : ''}</h4><small>📍 ห่างออฟฟิศ ${d.km} กม. · ${esc(d.size)}</small><p>${esc(d.feat.join(' · '))}</p><span class="pr">฿${baht(d.rent)}</span> <small>/ เดือน</small></div></div>`).join('')}</div>`;
}
function showDorm(id) {
  const d = DORMS.find(x => x.id === id), here = bank.home.id === d.id;
  res().innerHTML = `<p class="note"><a data-back="dorm">← กลับไปรายการหอพัก</a></p><div class="hd"><div class="dart" style="--c:${d.c};width:100%;height:130px;font-size:64px">${d.e}</div><h3>${esc(d.name)}</h3><small>📍 ห่างออฟฟิศ ${d.km} กม. · ${esc(d.size)}</small><div><span class="pr" style="font-size:20px">฿${baht(d.rent)}</span> ต่อเดือน</div><ul>${d.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    <div class="cartbox"><div><span>เงินประกัน 2 เดือน</span><span>${baht(d.rent * 2)}</span></div><div><span>ค่าเช่าล่วงหน้า 1 เดือน</span><span>${baht(d.rent)}</span></div><div><span>ค่าขนย้าย</span><span>1,500</span></div><div style="border-top:1px dashed #f3b3c8;margin-top:4px;padding-top:4px"><b>ต้องจ่ายตอนย้ายเข้า</b><b class="pr">${baht(moveCost(d))}</b></div><div><span>ยอดเงินในธนาคารตอนนี้</span><span>${baht(bank.bal)}</span></div></div>
    <div class="iv"><div class="acts"><button class="btn2" data-savedorm="${d.id}">💾 บันทึกข้อมูลหอพัก</button>${here ? '<b style="color:#2f9d5a">อยู่ที่นี่แล้ว 🏠</b>' : `<button class="btn2 pri" data-move="${d.id}">🚚 ย้ายเข้าที่นี่</button>`}</div></div></div>`;
}
function saveInfo(kind, obj) {
  const nm = kind === 'hotelinfo' ? `ที่พัก-${obj.key}.doc` : `หอพัก-${obj.name}.doc`;
  if (FILES.some(f => f.name === nm && f.loc !== 'trash')) { S.toast(`มีไฟล์ "${nm}" อยู่แล้ว`, 1.6); return; }
  const html = kind === 'hotelinfo'
    ? `<div class="paper"><h3>🏨 ${esc(obj.name)}</h3><p>📍 จ.${esc(obj.where)} · ⭐ ${obj.rate}<br>ราคา <b>${baht(obj.price)}</b> บาท / ห้อง / คืน</p><ul>${obj.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p style="color:#888">บันทึกจากเสิร์ชน้อย</p></div>`
    : `<div class="paper"><h3>🏠 ${esc(obj.name)}</h3><p>ค่าเช่า <b>${baht(obj.rent)}</b> บาท/เดือน · ${esc(obj.size)} · ห่างออฟฟิศ ${obj.km} กม.<br>ต้องจ่ายตอนย้ายเข้า ${baht(moveCost(obj))} บาท</p><ul>${obj.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p style="color:#888">บันทึกจากเสิร์ชน้อย</p></div>`;
  FILES.push({ id: 'u' + (++uid), name: nm, type: 'doc', kind, ref: obj.id, html, loc: 'down' }); renderDesktop();
  S.tone(400, 900, .2, .07, 'triangle'); S.toast(`บันทึก "${nm}" ไว้ในโฟลเดอร์ ดาวน์โหลด แล้ว · ลากให้น้องเอไอใช้ได้`, 2.6);
}
async function moveTo(d) {
  const cost = moveCost(d);
  const { v } = await dialog(se.W, `ย้ายไป <b>${esc(d.name)}</b>?<br>ต้องจ่าย ${baht(cost)} บาท (ยอดเงินตอนนี้ ${baht(bank.bal)} บาท)<br><small>เดือนหน้าค่าเช่าจะเป็น ${baht(d.rent)} บาท</small>`, [['ยกเลิก', null], ['ย้ายเลย', 'ok', 'pri']]);
  if (v !== 'ok' || !bankPay(cost, `🚚 ย้ายเข้า ${d.name}`)) return;
  bank.home = { id: d.id, name: d.name, rent: d.rent, km: d.km }; S.jingle(); S.big('🏠 ย้ายบ้านแล้ว!', 2, '#2f9d5a'); complete('move'); showDorm(d.id); renderBank();
  pushMsg('mom', 'mom', `ย้ายไป${d.name}เหรอลูก ส่งรูปห้องมาให้แม่ดูด้วยนะ 🏠`, 2500);
  if (d.km <= 3) pushMsg('gang', 'mint', 'ได้ข่าวว่าย้ายมาใกล้ออฟฟิศแล้ว ต่อไปห้ามมาสายนะแก 555', 5000);
}
