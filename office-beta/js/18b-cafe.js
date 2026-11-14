"use strict";
// Office game (beta) — cafe job: shop bills in the work program, CCTV stock count, stock report to the manager.
const CAFE_ITEMS = [
  { k: 'beans', n: 'ถุงเมล็ดกาแฟ', e: '🛍️', cam: 0, lo: 3, hi: 9, u: 'ถุง' },
  { k: 'milk', n: 'นมสดกล่อง', e: '🥛', cam: 0, lo: 6, hi: 14, u: 'กล่อง' },
  { k: 'syrup', n: 'ขวดไซรัป', e: '🍯', cam: 0, lo: 3, hi: 8, u: 'ขวด' },
  { k: 'cake', n: 'เค้กช็อกโกแลต (ชิ้น)', e: '🍰', cam: 1, lo: 4, hi: 12, u: 'ชิ้น' },
  { k: 'cream', n: 'วิปปิ้งครีมกระป๋อง', e: '🥫', cam: 1, lo: 3, hi: 9, u: 'กระป๋อง' },
  { k: 'berry', n: 'สตรอว์เบอร์รีถาด', e: '🍓', cam: 1, lo: 2, hi: 7, u: 'ถาด' },
  { k: 'cup', n: 'แพ็กแก้วกระดาษ', e: '🥤', cam: 2, lo: 4, hi: 11, u: 'แพ็ก' },
  { k: 'lid', n: 'แพ็กฝาแก้ว', e: '⭕', cam: 2, lo: 3, hi: 10, u: 'แพ็ก' },
  { k: 'straw', n: 'กล่องหลอด', e: '🥢', cam: 2, lo: 2, hi: 8, u: 'กล่อง' },
];
const CAMS = ['กล้อง 1 · หลังเคาน์เตอร์บาร์', 'กล้อง 2 · ตู้เย็นเค้ก', 'กล้อง 3 · ห้องเก็บของ'];
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const cafeDay = () => Math.floor(dayStart(gnow()) / DAY);
function cafeStock(day = cafeDay()) {
  const r = rng(day * 7919 + 13), items = CAFE_ITEMS.map(it => ({ ...it, real: it.lo + Math.floor(r() * (it.hi - it.lo + 1)), pos: [] }));
  const wrong = new Set(); while (wrong.size < 2) wrong.add(Math.floor(r() * items.length));
  items.forEach((it, i) => { it.sys = it.real; if (wrong.has(i)) { const d = [-3, -2, -1, 1, 2][Math.floor(r() * 5)]; it.sys = Math.max(0, it.real - d); } for (let j = 0; j < it.real; j++) it.pos.push([Math.floor(r() * 10) - 5, Math.floor(r() * 8) - 4, Math.floor(r() * 24) - 12]); });
  return items;
}

CAREERS.cafe = {
  label: 'ธุรการคาเฟ่', co: 'คาเฟ่ลาเต้น้อย', e: '☕', pos: 'เจ้าหน้าที่ธุรการ-สต๊อกคาเฟ่', color: '#f0e2d0', salary: 24000, where: 'เชียงใหม่ · ใกล้นิมมาน', tags: ['ธุรการ', 'คาเฟ่'],
  desc: 'งานธุรการร้านกาแฟ จดรายรับ-รายจ่ายประจำวันลง Excel ส่งให้สำนักงานบัญชีภายนอก นับสต๊อกจากกล้องวงจรปิด และตามเรื่องกับฝ่ายสต๊อกเมื่อของไม่ตรง (งานบัญชีจริงเป็นของสำนักงานบัญชีข้างนอก)',
  need: ['ละเอียด นับเลขไม่พลาด', 'ใช้ Excel เบื้องต้นได้', 'ประสานงานทางอีเมลได้'], perks: ['กาแฟฟรีวันละ 2 แก้ว', 'ลดค่าขนม 30%', 'หยุดวันอังคาร'],
  people: {
    boss: { n: 'สก๊อต (ผู้จัดการร้าน)', e: '🦁', c: '#ffd9a0' }, cust: { n: 'พี่ปลา (สำนักงานบัญชีภายนอก)', e: '🐟', c: '#d9ecff' }, bear: { n: 'ครีม (แคชเชียร์)', e: '🐻', c: '#fff0d9' },
    bun: { n: 'มอคค่า (ทำเบเกอรี่)', e: '🐰', c: '#ffe0e8' }, duck: { n: 'ช็อกโก้ (พาร์ทไทม์)', e: '🐥', c: '#fff6b0' },
    fon: { n: 'ลาเต้ (บาริสต้า)', e: '☕', c: '#f0e2d0' }, mint: { n: 'ฟองนม (พนักงานหน้าร้าน)', e: '🥛', c: '#e6f3ff' },
  },
  titles: { g: 'ทีมคาเฟ่ลาเต้น้อย', boss: 'สก๊อต (ผู้จัดการร้าน)', cust: 'พี่ปลา (สำนักงานบัญชีภายนอก)', hr: 'พี่ HR คาเฟ่' }, hide: ['jib'], docs: false, apps: ['cafe'], client: '',
  contacts: [['สก๊อต (ผู้จัดการร้าน)', 'scott@latte-noi.test'], ['ฝ่ายสต๊อก (คุณพีท)', 'stock@latte-noi.test'], ['พี่ปลา (สำนักงานบัญชีภายนอก)', 'pla@acc-pla.test'], ['พี่ HR คาเฟ่', 'hr@latte-noi.test']],
  routes: [
    { addr: 'scott@latte-noi.test', from: 'สก๊อต (ผู้จัดการร้าน)', reply: m => m.att.length ? 'ได้รับไฟล์แล้ว ขอบใจนะ เดี๋ยวพี่ดูให้' : 'พี่ได้รับเมลแล้ว มีอะไรด่วนทักแชทมาได้เลย' },
    { addr: 'hr@latte-noi.test', from: 'พี่ HR คาเฟ่', reply: () => 'HR ได้รับเรื่องแล้วค่ะ จะตอบกลับภายใน 2 วันทำการนะคะ' },
    { addr: 'pla@acc-pla.test', from: 'พี่ปลา (สำนักงานบัญชีภายนอก)', onSend: m => { if (m.att.some(a => /สมุดรายรับ/.test(a.name))) complete('cf4'); }, reply: m => m.att.some(a => /สมุดรายรับ/.test(a.name)) ? 'ได้รับสมุดรายรับ-รายจ่ายแล้วค่ะ เดี๋ยวทางสำนักงานบันทึกบัญชีให้ ขอบคุณมากนะคะ 🙏' : 'ขอไฟล์ Excel สมุดรายรับ-รายจ่ายแนบมาด้วยนะคะ ไม่เห็นไฟล์แนบเลย' },
    { addr: 'stock@latte-noi.test', from: 'ฝ่ายสต๊อก (คุณพีท)', reply: (m) => cafeStockReply(m) },
  ],
  tasks: [
    { id: 'cfw', t: 'ครีมส่งรายการรายรับ-รายจ่ายของร้านมาในแชท ให้จดลงไฟล์ Excel “สมุดรายรับ-รายจ่ายคาเฟ่” บนจอ ให้ครบทุกรายการ และใส่ยอดสุทธิ (รายรับ − รายจ่าย)' },
    { id: 'cf1', t: 'เปิดแอป 📹 กล้องวงจรปิดบนจอ ดูภาพชั้นของทั้ง 3 กล้อง นับของจริงใส่ฟอร์มให้ตรงกับภาพ' },
    { id: 'cf2', t: 'ส่งไฟล์ ใบตรวจนับสต๊อก ให้พี่สก๊อตทางแชท (กด 📎 หรือลากไฟล์)' },
    { id: 'cf3', t: 'ถ้าของไม่ตรงกับระบบ ส่งอีเมลถามฝ่ายสต๊อก (อีเมลอยู่ในคู่มือ PDF) แล้วนำเหตุผลที่ได้ไปตอบพี่สก๊อต' },
    { id: 'cf4', t: 'ส่งไฟล์ Excel สมุดรายรับ-รายจ่ายให้พี่ปลา (สำนักงานบัญชีภายนอก) ทางอีเมลหรือแชท' },
  ],
  book: `<ul><li><b>ไม่ต้องทำบัญชีเอง</b> งานบัญชีจริงให้สำนักงานบัญชีภายนอก (พี่ปลา) ทำ หน้าที่เราคือจดรายรับ-รายจ่ายลง Excel และตามเอกสารให้ครบ</li><li><b>Excel</b> เปิดไฟล์ “สมุดรายรับ-รายจ่ายคาเฟ่” ที่จอ จดทีละรายการ ใส่ยอดสุทธิ (ปุ่ม Σ รวมช่วยได้) แล้วส่งให้พี่ปลา</li><li><b>นับสต๊อก</b> ใช้แอป 📹 กล้องวงจรปิด ดูภาพชั้นแต่ละกล้อง แล้วนับของจริง อย่าเอาตัวเลขจากระบบมาใส่เอง</li><li><b>ผลต่าง</b> ถ้านับจริงไม่เท่าระบบ ให้อีเมลถามฝ่ายสต๊อก (stock@latte-noi.test) ว่าเกิดอะไรขึ้น แล้วสรุปให้พี่สก๊อต</li><li><b>ใบตรวจนับ</b> ได้เป็นไฟล์ PDF ส่งทางแชท</li></ul>`,
  start() {
    career.cafe = { day: cafeDay(), sent: false, tries: 0, sheetDone: false, reasons: '', asked: false };
    ['boss', 'g', 'cust', 'bear'].forEach(k => { const c = chatById(k); c.msgs.length = 0; c.unread = 0; });
    EMAIL_DIR.boss = 'scott@latte-noi.test'; EMAIL_DIR.hr = 'hr@latte-noi.test';
    pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่คาเฟ่ลาเต้น้อยนะ ☕ งานเราคือธุรการ ส่วนบัญชีจริงให้พี่ปลาที่สำนักงานบัญชีข้างนอกทำ เราจดรายรับรายจ่ายลง Excel กับนับสต๊อกจากกล้อง 📹 ก็พอ (ดูคู่มือ PDF บนจอ)', 1500);
    pushMsg('g', 'bear', 'ครีมเองนะ ยินดีต้อนรับค่ะ ☕ เดี๋ยวครีมส่งยอดขายกับค่าใช้จ่ายของวันนี้ให้ในแชทนะ', 3200); pushMsg('g', 'bun', 'มอคค่าทำบราวนี่ใหม่ ลองชิมได้นะ 🍫', 4800);
    cafeBook(true); cafeBatch(true);
    mailPush(null, 'สก๊อต (ผู้จัดการร้าน)', 'ยินดีต้อนรับเข้าทีมคาเฟ่ลาเต้น้อย', '<p>ยินดีต้อนรับค่ะ/ครับ งานหลักคือ <b>จดรายรับ-รายจ่ายลง Excel</b> และ <b>นับสต๊อกจากกล้องวงจรปิด</b> ส่งรายงานให้พี่ทุกวัน ดูรายละเอียดและอีเมลติดต่อในไฟล์ “คู่มือการทำงาน” บนจอได้เลย</p>', 'news');
    renderChat();
  },
  boss(c, m) {
    const t = m.text || '', cf = career.cafe;
    if (m.file) {
      const f = FILES.find(x => x.id === m.file.id);
      if (f && f.cafeCount) {
        cf.sent = true; complete('cf2'); like(c, m, 'boss', 800); const d = f.cafeCount.diffs;
        if (!d.length) { say(c, 'boss', 'รับใบตรวจนับแล้ว ตรงกับระบบทุกรายการ เก่งมาก 👏', 1800); complete('cf3'); return; }
        cf.await = 1; return say(c, 'boss', `รับแล้ว แต่ของไม่ตรง ${d.length} รายการ: ${d.map(x => `${x.n} (${x.d > 0 ? '+' : ''}${x.d})`).join(', ')} ลองอีเมลถามฝ่ายสต๊อกดูว่าทำไมถึงต่าง แล้วมาสรุปให้พี่ทีหลัง (อีเมลฝ่ายสต๊อกอยู่ในคู่มือ)`, 2000);
      }
      return say(c, 'boss', 'รับไฟล์แล้ว แต่ที่พี่รออยู่คือ "ใบตรวจนับสต๊อก" จากแอปกล้องนะ', 1800);
    }
    if (cf.await) {
      cf.tries++;
      if (!cf.reasons && cf.tries < 3) return say(c, 'boss', 'ยังไม่ได้ข้อมูลจากฝ่ายสต๊อกเลยนี่ ลองอีเมลถามคุณพีทก่อน (stock@latte-noi.test) แล้วค่อยสรุปมา', 1800);
      if (/เสีย|แตก|หมดอายุ|แถม|ทิ้ง|ชิม|ลืม|ตัดสต็?อก|นับผิด|เบิก|ใช้|ฟรี|หก|ตก|ขโมย|หาย|ชดเชย|เทสต์|ทดลอง|ฝ่ายสต็?อก/.test(t) || (cf.tries >= 3 && t.length > 8)) { cf.await = 0; complete('cf3'); like(c, m, 'boss', 700); return say(c, 'boss', 'เข้าใจแล้ว เดี๋ยวพี่ปรับตัวเลขในระบบให้ ขอบใจที่ตามเรื่องให้นะ 🙏', 1900); }
      return say(c, 'boss', 'ยังไม่ชัดเลย บอกสาเหตุตามที่ฝ่ายสต๊อกแจ้งมาหน่อย', 1800);
    }
    if (/สต็?อก|นับ|กล้อง/.test(t)) return say(c, 'boss', cf.sent ? 'วันนี้ส่งแล้วนะ ดีมาก พรุ่งนี้นับรอบใหม่' : 'เปิดแอป 📹 กล้องวงจรปิดบนจอ นับของจากภาพ แล้วส่ง "ใบตรวจนับสต๊อก" มาที่นี่', 1700);
    if (/บัญชี|ค่าใช้จ่าย|excel|เอกเซล/i.test(t)) return say(c, 'boss', 'บัญชีจริงให้พี่ปลาทำ เรามีหน้าที่จดรายรับรายจ่ายลง Excel แล้วส่งให้เขา', 1700);
    say(c, 'boss', pick(['โอเค 👍', 'ขอบใจนะ', 'วันนี้ร้านคนเยอะ ฝากดูสต๊อกด้วย', 'มีอะไรถามได้นะ']), 1600);
  },
  cust(c, m) {
    if (m.file) { const f = FILES.find(x => x.id === m.file.id); if (f && f.id === 'cafebook') { complete('cf4'); like(c, m, 'cust', 700); return say(c, 'cust', 'ได้รับสมุดรายรับ-รายจ่ายแล้วค่ะ ขอบคุณมากนะคะ เดี๋ยวสำนักงานบันทึกบัญชีให้ 🙏', 1900); } return say(c, 'cust', 'ขอเป็นไฟล์ Excel “สมุดรายรับ-รายจ่ายคาเฟ่” นะคะ', 1700); }
    say(c, 'cust', pick(['ค่ะ 🙏', 'ถ้ามีบิลขาดแจ้งได้เลยนะคะ', 'ส่งสมุดรายรับ-รายจ่ายมาเมื่อเสร็จแล้วนะคะ']), 1600);
  },
  resume() { career.cafe.day = career.cafe.day || cafeDay(); EMAIL_DIR.boss = 'scott@latte-noi.test'; EMAIL_DIR.hr = 'hr@latte-noi.test'; },
};

/* ---- daily Excel book (income / expenses) sent by the cashier in the chat ---- */
const CAFE_SALES = ['ยอดขายหน้าร้านช่วงเช้า', 'ยอดขายหน้าร้านช่วงบ่าย', 'ยอดขายเดลิเวอรี่'], CAFE_COSTS = ['ค่านมสดและวัตถุดิบ', 'ค่าเมล็ดกาแฟ', 'ค่าแก้วและบรรจุภัณฑ์', 'ค่าไฟฟ้า', 'ค่าแก๊สและน้ำแข็ง', 'ค่าแรงพาร์ทไทม์'];
function cafeBook(reset) {
  let f = FILES.find(x => x.id === 'cafebook');
  if (!f) { f = { id: 'cafebook', name: 'สมุดรายรับ-รายจ่ายคาเฟ่.xlsx', type: 'xls', kind: 'sheet', loc: 'desk', careerFile: 'cafe' }; FILES.push(f); }
  if (reset || !f.book) f.book = newBook({ A1: 'รายการ', B1: 'รายรับ', C1: 'รายจ่าย' }); f.loc = f.loc === 'career-hidden' ? 'desk' : f.loc; return f;
}
function cafeBatch(first) {
  const r = rng(cafeDay() * 31 + 7), sales = [0, 1].map(i => ({ n: CAFE_SALES[i + (r() < .5 ? 0 : 1) % 3] || CAFE_SALES[i], a: 3000 + Math.round(r() * 60) * 100, t: 'in' })), costs = [0, 1, 2].map(i => ({ n: CAFE_COSTS[(i * 2 + Math.floor(r() * 2)) % 6], a: 400 + Math.round(r() * 40) * 50, t: 'out' }));
  if (sales[0].n === sales[1].n) sales[1].n = CAFE_SALES[2];
  const seen = new Set(); const items = [...sales, ...costs].filter(x => !seen.has(x.n) && seen.add(x.n)), net = items.reduce((s, x) => s + (x.t === 'in' ? x.a : -x.a), 0);
  career.cafe.items = items; career.cafe.net = net; career.cafe.sheetDone = false;
  const lines = items.map(x => `${x.t === 'in' ? '💰 รายรับ' : '🧾 รายจ่าย'} ${x.n} ${baht(x.a)} บาท`).join('\n');
  pushMsg('bear', 'bear', `สรุปของวันนี้นะคะ\n${lines}\nฝากจดลงสมุด Excel ที่จอด้วยค่ะ แล้วใส่ยอดสุทธิด้วยนะ`, first ? 5200 : 1500);
}
function cafeSheetCheck() {
  if (career.id !== 'cafe' || career.cafe.sheetDone || !career.cafe.items) return; const f = FILES.find(x => x.id === 'cafebook'); if (!f || !f.book) return; const B = f.book;
  if (career.cafe.items.every(x => sheetHas(B, x.a)) && sheetHas(B, Math.abs(career.cafe.net))) { career.cafe.sheetDone = true; complete('cfw'); S.toast('จดสมุดรายรับ-รายจ่ายครบแล้ว ✅ ส่งให้พี่ปลาได้เลย', 2.4); pushMsg('bear', 'bear', 'ขอบคุณค่ะ ตรวจแล้วตัวเลขครบ 👍', 1500); }
}
setInterval(cafeSheetCheck, 2000);
function cafeStockReply(m) {
  const items = cafeStock().filter(i => i.sys !== i.real), text = (m.subj + ' ' + m.body);
  if (!/ต่าง|ไม่ตรง|สต็?อก|นับ|ระบบ|ผลต่าง|ของหาย|ขาด|เกิน/.test(text)) return 'คุณพีทฝ่ายสต๊อกได้รับเมลแล้วค่ะ แต่ไม่แน่ใจว่าสอบถามเรื่องอะไร ระบุว่าของรายการไหนไม่ตรงกับระบบด้วยนะคะ';
  const RS = ['ลืมตัดสต๊อกตอนแถมให้ลูกค้า', 'ของเสียหมดอายุแล้วทิ้ง แต่ยังไม่ได้ตัดออกจากระบบ', 'เบิกไปทดลองสูตรใหม่ แต่ไม่ได้ลงบันทึก', 'พนักงานนับรับของเข้าผิดตอนรับเมื่อวาน'];
  career.cafe.reasons = items.map((i, k) => `${i.n}: ${RS[(k + cafeDay()) % RS.length]}`).join(' / ');
  return `ตรวจให้แล้วค่ะ รายการที่ไม่ตรง: ${career.cafe.reasons} รบกวนสรุปให้พี่สก๊อตด้วยนะคะ`;
}

/* record 3 bills in the work program → task */


/* ---- CCTV app ---- */
tbButton('cctv', '📹', 'กล้องวงจรปิด', '#3a4a5c', 'cafe', () => openCCTV());
const cctv = { W: null, cam: 0, got: {} };
function openCCTV() {
  if (cctv.W && wins.has('cctv')) { focusWin(cctv.W); return cctv.W; }
  cctv.W = openWin('cctv', 'กล้องวงจรปิด — คาเฟ่ลาเต้น้อย', h('div', { class: 'cctv' }), 760, 470, '#dfe7ee'); cctv.W.onClose = () => { cctv.W = null; };
  const root = cctv.W.body.firstChild;
  root.addEventListener('click', e => { const b = e.target.closest('[data-cam]'); if (b) { cctv.cam = +b.dataset.cam; renderCCTV(); } if (e.target.closest('[data-send]')) submitCount(); });
  root.addEventListener('input', e => { if (e.target.dataset.k) cctv.got[e.target.dataset.k] = e.target.value; });
  renderCCTV(); return cctv.W;
}
function renderCCTV() {
  if (!cctv.W || !wins.has('cctv')) return; const root = cctv.W.body.firstChild, items = cafeStock(), cur = items.filter(i => i.cam === cctv.cam), g = gnow();
  const ts = `${thDate(g.getTime(), { day: 'numeric', month: 'short', year: 'numeric' })} ${p2(g.getHours())}:${p2(g.getMinutes())}`;
  root.innerHTML = `<div class="cv"><div class="cbar">${CAMS.map((n, i) => `<button class="btn2 ${i === cctv.cam ? 'pri' : ''}" data-cam="${i}">${n}</button>`).join('')}</div>
    <div class="cam"><div class="ovl"><span class="rec">● REC</span><span>CAM ${cctv.cam + 1}</span><span>${ts}</span></div>
    ${cur.map(it => `<div class="srow"><div class="slabel">${esc(it.n)}</div><div class="stuff">${it.pos.map(([x, y, r]) => `<span style="transform:translate(${x}px,${y}px) rotate(${r}deg)">${it.e}</span>`).join('')}</div></div>`).join('')}<div class="scan"></div></div>
    <small class="soft">นับสิ่งของบนชั้นจากภาพ แล้วกรอกจำนวนในฟอร์มด้านขวา (ตัวเลขในระบบอาจไม่ตรงกับของจริง!)</small></div>
    <form class="cnt" onsubmit="return false"><h4>ฟอร์มนับสต๊อก · นับได้จริง</h4><table><tr><th>รายการ</th><th>ในระบบ</th><th>นับจริง</th></tr>${items.map(it => `<tr class="${it.cam === cctv.cam ? 'cur' : ''}"><td>${it.e} ${esc(it.n)}</td><td>${it.sys}</td><td><input type="text" inputmode="numeric" data-k="${it.k}" value="${esc(cctv.got[it.k] ?? '')}" class="${cctv.bad?.includes(it.k) ? 'bad' : ''}"></td></tr>`).join('')}</table>
    <div class="cmsg">${cctv.msg || ''}</div><button class="btn2 pri" type="button" data-send>✅ ส่งผลนับ · ออกใบตรวจนับ</button></form>`;
}
function submitCount() {
  const items = cafeStock(), miss = items.filter(i => cctv.got[i.k] === undefined || String(cctv.got[i.k]).trim() === '');
  if (miss.length) { cctv.msg = `ยังไม่ได้กรอก ${miss.length} รายการ`; cctv.bad = miss.map(i => i.k); renderCCTV(); S.tone(300, 200, .15, .08); return; }
  const bad = items.filter(i => parseInt(cctv.got[i.k], 10) !== i.real); cctv.bad = bad.map(i => i.k);
  if (bad.length) { cctv.msg = `นับยังไม่ตรงกับภาพกล้อง ${bad.length} รายการ (ช่องสีแดง) ลองนับใหม่ช้าๆ`; renderCCTV(); S.tone(300, 200, .15, .08); return; }
  const diffs = items.filter(i => i.real !== i.sys).map(i => ({ n: i.n, d: i.real - i.sys })), g = gnow();
  const ds = thDate(g.getTime(), { day: 'numeric', month: 'short', year: 'numeric' });
  const body = `<h3>ใบตรวจนับสต๊อก · คาเฟ่ลาเต้น้อย</h3><p>วันที่ ${ds} · ผู้ตรวจนับ ${esc(chat.account?.name || 'พนักงาน')} (นับจากภาพกล้องวงจรปิด)</p><table class="pdft"><tr><th>รายการ</th><th>ตามระบบ</th><th>นับจริง</th><th>ผลต่าง</th></tr>${items.map(i => `<tr><td>${esc(i.n)}</td><td style="text-align:right">${i.sys}</td><td style="text-align:right">${i.real}</td><td style="text-align:right;${i.real !== i.sys ? 'color:#d6304f;font-weight:600' : ''}">${i.real - i.sys > 0 ? '+' : ''}${i.real - i.sys}</td></tr>`).join('')}</table><p>สรุป: ${diffs.length ? `ไม่ตรงกับระบบ ${diffs.length} รายการ รอชี้แจงสาเหตุ` : 'ตรงกับระบบทุกรายการ'}</p>`;
  const f = savePDF(`ใบตรวจนับสต๊อก-${ds}`, body); f.cafeCount = { day: cafeDay(), diffs };
  cctv.msg = '✅ นับถูกต้องแล้ว ได้ไฟล์ใบตรวจนับสต๊อกบนหน้าจอ ลากไปส่งพี่สก๊อตในแชทได้เลย'; cctv.got = {}; cctv.bad = []; career.cafe.sent = false; complete('cf1'); renderCCTV();
}
/* a new day → a new count, and the manager reminds */
setInterval(() => { if (career.id !== 'cafe') return; const d = cafeDay(); if (career.cafe.day !== d) { career.cafe.day = d; career.cafe.sent = false; cctv.got = {}; cctv.bad = []; cctv.msg = ''; renderCCTV(); pushMsg('boss', 'boss', 'เช้าแล้ว วันนี้นับสต๊อกรอบใหม่นะ 📹 ส่งใบตรวจนับมาที่นี่ด้วย', 1500); cafeBatch(); } }, 6000);
