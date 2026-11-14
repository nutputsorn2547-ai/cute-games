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
  label: 'คาเฟ่', co: 'คาเฟ่ลาเต้น้อย', e: '☕', pos: 'พนักงานบัญชี-สต๊อกคาเฟ่', color: '#f0e2d0', salary: 24000, where: 'เชียงใหม่ · ใกล้นิมมาน', tags: ['บริการ', 'คาเฟ่'],
  desc: 'ดูแลบิลและค่าใช้จ่ายของร้านกาแฟ นับสต๊อกวัตถุดิบจากกล้องวงจรปิด ทำใบตรวจนับส่งผู้จัดการ',
  need: ['ละเอียด นับเลขไม่พลาด', 'ใช้โปรแกรมบัญชีเบื้องต้นได้', 'ยิ้มแย้มกับทีมร้าน'], perks: ['กาแฟฟรีวันละ 2 แก้ว', 'ลดค่าขนม 30%', 'หยุดวันอังคาร'],
  people: {
    boss: { n: 'สก๊อต (ผู้จัดการร้าน)', e: '🦁', c: '#ffd9a0' }, cust: { n: 'ลาเต้ (บาริสต้า)', e: '☕', c: '#f0e2d0' }, bear: { n: 'ครีม (แคชเชียร์)', e: '🐻', c: '#fff0d9' },
    bun: { n: 'มอคค่า (ทำเบเกอรี่)', e: '🐰', c: '#ffe0e8' }, duck: { n: 'ช็อกโก้ (พาร์ทไทม์)', e: '🐥', c: '#fff6b0' },
  },
  titles: { g: 'ทีมคาเฟ่ลาเต้น้อย', boss: 'สก๊อต (ผู้จัดการร้าน)', cust: 'ลาเต้ (ส่งบิลร้าน)', hr: 'พี่ HR คาเฟ่' }, hide: ['jib'], docs: true, apps: ['cafe'], client: 'คาเฟ่ลาเต้น้อย (ร้านที่เราดูแลบัญชี)',
  suppliers: [
    { dt: 'ใบแจ้งหนี้', party: 'บริษัท ภูดอยโรสต์ จำกัด', key: 'ภูดอยโรสต์', pre: 'IV', items: [['เมล็ดกาแฟคั่ว 1 กก.', 'ถุง', 420, 560]], vat: 1 },
    { dt: 'ใบแจ้งหนี้', party: 'บริษัท นมสดดอยหมอก จำกัด', key: 'ดอยหมอก', pre: 'INV', items: [['นมสดพาสเจอร์ไรส์', 'ลัง', 380, 520]], vat: 1 },
    { dt: 'ใบเสร็จรับเงิน', party: 'ร้านไซรัปบ้านน้ำผึ้ง', key: 'บ้านน้ำผึ้ง', pre: 'RC-', items: [['ไซรัปคาราเมล', 'ขวด', 150, 230], ['ไซรัปวานิลลา', 'ขวด', 150, 230]] },
    { dt: 'ใบเสร็จรับเงิน', party: 'ร้านบรรจุภัณฑ์ถ้วยใส', key: 'ถ้วยใส', pre: 'NO.', items: [['แก้วกระดาษพร้อมฝา', 'แพ็ก', 90, 160]] },
    { dt: 'ใบเสร็จรับเงิน', party: 'ร้านเค้กแม่บัว', key: 'แม่บัว', pre: 'MB', items: [['เค้กช็อกโกแลตหน้านิ่ม', 'ถาด', 350, 520]] },
    { dt: 'ค่าใช้จ่าย', party: 'การไฟฟ้านครน้อย', key: 'ไฟฟ้านครน้อย', pre: 'E-', items: [['ค่าไฟร้านคาเฟ่', 'ครั้ง', 3200, 5200]] },
    { dt: 'ค่าใช้จ่าย', party: 'นายวิชัย ใจดี (ค่าเช่าร้าน)', key: 'วิชัย', pre: 'RT', items: [['ค่าเช่าร้านรายเดือน', 'ครั้ง', 18000, 18000]] },
  ],
  tasks: [
    { id: 'cfw', t: 'ลาเต้ส่งบิลร้านมาในแชท ดาวน์โหลดแล้วบันทึกใน บัญชีน้อย ให้ถูกครบ 3 ใบ (ค่าเมล็ดกาแฟ นม ค่าเช่า ฯลฯ)' },
    { id: 'cf1', t: 'เปิดแอป 📹 กล้องวงจรปิด ดูภาพชั้นของทั้ง 3 กล้อง นับของจริงใส่ฟอร์มให้ตรงกับภาพ' },
    { id: 'cf2', t: 'ส่งไฟล์ ใบตรวจนับสต๊อก ให้พี่สก๊อตทางแชท (กด 📎 หรือลากไฟล์)' },
    { id: 'cf3', t: 'ถ้าของไม่ตรงกับระบบ ตอบพี่สก๊อตให้ชัดว่าทำไมถึงต่าง (ของเสีย แถมลูกค้า ลืมตัดสต๊อก ฯลฯ)' },
  ],
  book: `<ul><li><b>บิลร้าน</b> ลาเต้ส่งมาในแชท → ดาวน์โหลด → บันทึกใน "บัญชีน้อย" ให้ตรงทุกช่อง</li><li><b>นับสต๊อก</b> ใช้แอป 📹 กล้องวงจรปิด ดูภาพชั้นแต่ละกล้อง แล้วนับของจริง อย่าเอาตัวเลขจากระบบมาใส่เอง</li><li><b>ผลต่าง</b> ถ้านับจริงไม่เท่าระบบ ต้องรายงานพี่สก๊อตพร้อมเหตุผล</li><li><b>ใบตรวจนับ</b> ได้เป็นไฟล์ PDF ส่งทางแชท (หรือปริ้นเซ็นก็ได้)</li><li>ของใช้เปลือง/ของเสีย ให้จดสาเหตุเสมอ</li></ul>`,
  start() {
    career.cafe = { day: cafeDay(), rec: 0, await: 0, sent: false, tries: 0 };
    const cu = chatById('cust'); cu.msgs.length = 0; cu.unread = 0; chatById('boss').msgs.length = 0; chatById('g').msgs.length = 0;
    pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่คาเฟ่ลาเต้น้อยนะ ☕ งานหลักๆ คือบิลร้านกับนับสต๊อก ลาเต้จะส่งบิลมาให้ในแชท ส่วนสต๊อกให้ดูจากกล้อง 📹 (ใน "งานของฉัน" มีกฎคร่าวๆ)', 1500);
    pushMsg('g', 'bear', 'ครีมเองนะ ยินดีต้อนรับค่ะ ☕ เที่ยงนี้มีเค้กเหลือ ใครกินบ้าง', 3200); pushMsg('g', 'bun', 'มอคค่าทำบราวนี่ใหม่ ลองชิมได้นะ 🍫', 4800);
    const day = dayStart(gnow()), ids = [0, 1, 2].map(() => makeDoc(day));
    pushMsg('cust', 'cust', 'สวัสดีค่ะ ลาเต้เองนะ บิลร้านช่วงนี้ส่งมาให้ 3 ใบค่ะ ฝากบันทึกด้วยนะ ☕', 1800);
    ids.forEach((id, i) => pushMsg('cust', 'cust', '📎 ' + CDOCS[id].name, 3000 + i * 900, { file: { id, name: CDOCS[id].name, type: 'pdf' } }));
    mailPush(null, 'สก๊อต (ผู้จัดการร้าน)', 'ยินดีต้อนรับเข้าทีมคาเฟ่ลาเต้น้อย', '<p>ยินดีต้อนรับค่ะ/ครับ งานหลักคือ <b>บันทึกบิลร้าน</b> และ <b>นับสต๊อกจากกล้องวงจรปิด</b> ส่งรายงานให้พี่ทุกวัน ดูกฎในแอป "งานของฉัน" ได้เลย</p>', 'news');
    renderChat(); try { renderWork(); } catch (e) {}
  },
  boss(c, m) {
    const t = m.text || '', cf = career.cafe;
    if (m.file) {
      const f = FILES.find(x => x.id === m.file.id);
      if (f && f.cafeCount) {
        cf.sent = true; complete('cf2'); like(c, m, 'boss', 800); const d = f.cafeCount.diffs;
        if (!d.length) { say(c, 'boss', 'รับใบตรวจนับแล้ว ตรงกับระบบทุกรายการ เก่งมาก 👏', 1800); complete('cf3'); return; }
        cf.await = 1; return say(c, 'boss', `รับแล้ว แต่ของไม่ตรง ${d.length} รายการ: ${d.map(x => `${x.n} (${x.d > 0 ? '+' : ''}${x.d})`).join(', ')} ทำไมถึงต่างจากระบบ ชี้แจงมาหน่อย`, 2000);
      }
      return say(c, 'boss', f && f.kind === 'cdoc' ? 'เอกสารนี้ส่งให้ลาเต้ดูหรือเก็บไว้ก็พอ งานนับสต๊อกส่งเป็น "ใบตรวจนับสต๊อก" นะ' : 'รับไฟล์แล้ว แต่ที่พี่รออยู่คือ "ใบตรวจนับสต๊อก" จากแอปกล้องนะ', 1800);
    }
    if (cf.await) {
      cf.tries++;
      if (/เสีย|แตก|หมดอายุ|แถม|ทิ้ง|ชิม|ลืม|ตัดสต็?อก|นับผิด|เบิก|ใช้|ฟรี|หก|ตก|ขโมย|หาย|ชดเชย|เทสต์|ทดลอง/.test(t) || (cf.tries >= 3 && t.length > 8)) { cf.await = 0; complete('cf3'); like(c, m, 'boss', 700); return say(c, 'boss', 'เข้าใจแล้ว เดี๋ยวพี่ปรับตัวเลขในระบบให้ ขอบใจที่ตรวจละเอียดนะ 🙏', 1900); }
      return say(c, 'boss', 'ยังไม่ชัดเลย ต้องมีสาเหตุจริงๆ เช่น ของเสีย ทำแตก แถมลูกค้า หรือลืมตัดสต๊อก ลองบอกใหม่หน่อย', 1800);
    }
    if (/สต็?อก|นับ|กล้อง/.test(t)) return say(c, 'boss', cf.sent ? 'วันนี้ส่งแล้วนะ ดีมาก พรุ่งนี้นับรอบใหม่' : 'เปิดแอป 📹 กล้องวงจรปิด นับของจากภาพ แล้วส่ง "ใบตรวจนับสต๊อก" มาที่นี่', 1700);
    if (/บิล|บัญชี|ค่าใช้จ่าย/.test(t)) return say(c, 'boss', 'บิลทุกใบต้องบันทึกให้ตรงทุกช่อง ถ้ามีใบไหนอ่านไม่ออก ถามลาเต้ได้', 1700);
    say(c, 'boss', pick(['โอเค 👍', 'ขอบใจนะ', 'วันนี้ร้านคนเยอะ ฝากดูสต๊อกด้วย', 'มีอะไรถามได้นะ']), 1600);
  },
  resume() { career.cafe.day = career.cafe.day || cafeDay(); },
};

/* record 3 bills in the work program → task */
const _saveEntry = saveEntry;
saveEntry = function () { const b = work.right; _saveEntry(); if (career.id === 'cafe' && work.right > b) { career.cafe.rec = (career.cafe.rec || 0) + 1; if (career.cafe.rec >= 3) complete('cfw'); } };

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
setInterval(() => { if (career.id !== 'cafe') return; const d = cafeDay(); if (career.cafe.day !== d) { career.cafe.day = d; career.cafe.sent = false; cctv.got = {}; cctv.bad = []; cctv.msg = ''; renderCCTV(); pushMsg('boss', 'boss', 'เช้าแล้ว วันนี้นับสต๊อกรอบใหม่นะ 📹 ส่งใบตรวจนับมาที่นี่ด้วย', 1500); } }, 6000);
