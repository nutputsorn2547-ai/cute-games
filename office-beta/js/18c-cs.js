"use strict";
// Office game (beta) — customer-service job: case desk with company rules, reply templates, a pretend web shop to audit, report to the boss.
const CS_PRODUCTS = [
  { id: 'p1', n: 'เครื่องตีไข่ไฟฟ้า', price: 1290, warr: 12, e: '🥣' }, { id: 'p2', n: 'ชุดพิมพ์คุกกี้ 12 ชิ้น', price: 390, warr: 6, e: '🍪' },
  { id: 'p3', n: 'เตาอบมินิ 20 ลิตร', price: 2490, warr: 24, e: '🔥' }, { id: 'p4', n: 'ชุดชามผสมสแตนเลส', price: 590, warr: 6, e: '🥄' },
  { id: 'p5', n: 'เครื่องชั่งดิจิทัล', price: 450, warr: 12, e: '⚖️' }, { id: 'p6', n: 'ถุงมืออบทนความร้อน', price: 220, warr: 3, e: '🧤' },
];
const CS_NAMES = ['คุณสมศรี', 'คุณวิชัย', 'คุณนุ่น', 'คุณธนา', 'คุณมะลิ', 'คุณปิติ', 'คุณเมย์', 'คุณก้อง', 'คุณแพร', 'คุณต้น'];
const CS_ACT = {
  refund: ['คืนเงินเต็มจำนวน', 'อยู่ในกำหนด 15 วันนับจากวันที่ได้รับสินค้า'],
  deny: ['ปฏิเสธการคืนเงิน', 'เกิน 15 วันนับจากวันที่ได้รับสินค้า คืนเงินไม่ได้'],
  repair_free: ['รับซ่อมฟรี', 'ซ่อมได้ตลอดระยะเวลาประกันของสินค้า'],
  repair_paid: ['รับซ่อมแบบคิดค่าบริการ', 'หมดประกันแล้ว ซ่อมได้แต่คิดค่าบริการ'],
  discount: ['ให้คูปองส่วนลด 10%', 'ปัญหาเล็กน้อย มอบส่วนลดได้'],
  resend: ['ส่งสินค้าใหม่ + ส่งเอกสารเคลมขนส่ง', 'ส่งไม่ถึง/ไม่ครบ ส่งใหม่ให้ลูกค้า และขอเคลมคืนจากขนส่ง'],
};
const CS_TPL = {
  hello: ['ทักทาย/รับเรื่อง', 'สวัสดีค่ะ {name} ขออภัยในความไม่สะดวกนะคะ ทางร้านได้รับเรื่องของคุณแล้วค่ะ'],
  refund: ['แจ้งคืนเงิน', 'สวัสดีค่ะ {name} สินค้าอยู่ในระยะเวลา 15 วัน ทางร้านอนุมัติคืนเงินเต็มจำนวนให้แล้วนะคะ จะเข้าบัญชีภายใน 3-5 วันทำการค่ะ'],
  deny: ['แจ้งไม่คืนเงิน', 'สวัสดีค่ะ {name} ขออภัยนะคะ สินค้าเกินระยะเวลาคืนเงิน 15 วันนับจากวันที่ได้รับ ทางร้านจึงไม่สามารถคืนเงินได้ แต่ยินดีช่วยดูแลเรื่องอื่นค่ะ'],
  repair_free: ['แจ้งซ่อมฟรี', 'สวัสดีค่ะ {name} สินค้ายังอยู่ในระยะประกัน ทางร้านรับซ่อมให้ฟรีค่ะ ส่งสินค้ามาตามที่อยู่ที่แจ้งไว้ได้เลยนะคะ'],
  repair_paid: ['แจ้งซ่อมคิดค่าบริการ', 'สวัสดีค่ะ {name} สินค้าหมดระยะประกันแล้ว ทางร้านรับซ่อมแบบคิดค่าบริการค่ะ เดี๋ยวแจ้งราคาให้ก่อนซ่อมนะคะ'],
  discount: ['แจ้งส่วนลด', 'สวัสดีค่ะ {name} ขออภัยในความไม่สะดวกนะคะ ทางร้านขอมอบคูปองส่วนลด 10% สำหรับการสั่งซื้อครั้งหน้าค่ะ'],
  resend: ['แจ้งส่งใหม่', 'สวัสดีค่ะ {name} ขออภัยอย่างยิ่งค่ะ ทางร้านจะส่งสินค้าชุดใหม่ให้ทันทีและดำเนินเรื่องกับขนส่งเองนะคะ ไม่ต้องกังวลค่ะ'],
};
const cs = { W: null, sel: null, tpl: '', act: '', fb: '', seq: 0, shop: { W: null, cart: [], view: 'list', msg: '' } };
const csOpen = () => career.cs.cases.filter(c => !c.done);
function csNew() {
  const r = Math.random, pr = pick(CS_PRODUCTS), name = pick(CS_NAMES), seq = ++career.cs.seq, kind = pick(['return', 'return', 'repair', 'repair', 'minor', 'lost']);
  const c = { id: 'C' + String(seq).padStart(3, '0'), name, kind, pid: pr.id, done: false };
  if (kind === 'return') { c.days = pick([3, 6, 9, 12, 14, 16, 19, 23, 28]); c.exp = c.days <= 15 ? 'refund' : 'deny'; c.msg = `ได้รับ${pr.n} ไปเมื่อ ${c.days} วันก่อนค่ะ ลองใช้แล้วไม่ถูกใจ อยากคืนสินค้าและขอเงินคืนได้ไหมคะ`; }
  if (kind === 'repair') { c.months = pick([2, 4, 7, 10, 13, 20, 26]); c.exp = c.months <= pr.warr ? 'repair_free' : 'repair_paid'; c.msg = `${pr.n}ที่ซื้อไปเมื่อ ${c.months} เดือนก่อนใช้ไม่ได้แล้วค่ะ ส่งซ่อมได้ไหมคะ`; }
  if (kind === 'minor') { c.exp = 'discount'; c.msg = `กล่อง${pr.n}บุบนิดหน่อยตอนส่งมาค่ะ แต่ของข้างในยังใช้ได้ปกติ แค่รู้สึกไม่ค่อยดีเลยแจ้งไว้ค่ะ`; }
  if (kind === 'lost') { c.exp = 'resend'; c.msg = pick([`สั่ง${pr.n}ไป 9 วันแล้ว ขนส่งบอกส่งสำเร็จแต่ยังไม่ได้รับของเลยค่ะ`, `ได้รับพัสดุแล้วแต่ขาด${pr.n}ไป 1 ชิ้น ในกล่องมีแค่ของอย่างอื่นค่ะ`]); }
  if (kind === 'lost') c.trk = 'TH' + rint(100000, 999999) + 'CS'; career.cs.cases.push(c); return c;
}
CAREERS.cs = {
  label: 'ฝ่ายบริการลูกค้า', co: 'โภชนาเบเกอรี่ แมชชีน จำกัด', e: '🎧', pos: 'เจ้าหน้าที่ดูแลลูกค้า', color: '#d9ecff', salary: 25000, where: 'กรุงเทพฯ · ไฮบริด', tags: ['บริการ', 'ลูกค้า'],
  desc: 'ตอบลูกค้าร้านอุปกรณ์เบเกอรี่ออนไลน์ ตัดสินใจเคสคืนเงิน ซ่อม ส่งใหม่ตามกฎบริษัท ตรวจเว็บไซต์ร้าน รายงานหัวหน้าทีม เอกสารน้อย เน้นตอบลูกค้า',
  need: ['สื่อสารสุภาพ ใจเย็น', 'ทำตามกฎบริษัทได้ละเอียด', 'สังเกตความผิดปกติเก่ง'], perks: ['ส่วนลดสินค้า 25%', 'ทำงานไฮบริด', 'ไม่ต้องเขียนเอกสารเยอะ'],
  people: { boss: { n: 'พี่ฟ้า (หัวหน้าทีมลูกค้า)', e: '🦊', c: '#cfe6ff' }, bear: { n: 'โอ๊ต (แอดมินเพจ)', e: '🐻', c: '#e8cfb4' }, bun: { n: 'แพรว (คลังสินค้า)', e: '🐰', c: '#ffd6e3' }, duck: { n: 'ปุ้ย (ประสานขนส่ง)', e: '🐥', c: '#fff1a8' } },
  titles: { g: 'ทีมดูแลลูกค้า โภชนาเบเกอรี่', boss: 'พี่ฟ้า (หัวหน้าทีมลูกค้า)', hr: 'พี่ HR โภชนาเบเกอรี่' }, hide: ['cust'], docs: false, apps: ['cs'], client: '',
  tasks: [
    { id: 'cs1', t: 'ตอบแชทลูกค้าในแอป 🎧 แชทลูกค้า ให้ถูกกฎบริษัท 5 เคสต่อวัน (เลือกวิธีแก้ปัญหาแล้วตอบด้วยเทมเพลต)' },
    { id: 'cs2', t: 'เปิด 🛍️ เว็บร้านโภชนาเบเกอรี่ แมชชีน ลองหยิบของใส่ตะกร้าไปหน้าชำระเงิน เทียบราคาโปรโมชั่นกับยอดที่เรียกเก็บ แล้วรายงานถ้าไม่ตรง' },
    { id: 'cs4', t: 'ถ้ามีเคสพัสดุหาย/ไม่ครบ จดเลขแทรกกิ้งลงไฟล์ Excel “สรุปแจ้งเคลมพัสดุหาย” บนจอ แล้วส่งอีเมลยื่นเคลมให้ขนส่งพร้อมแนบไฟล์ (อีเมลอยู่ในคู่มือ)' },
    { id: 'cs3', t: 'กด “📊 รายงานสรุปเคส” ในแอปเคสลูกค้า ได้ไฟล์ PDF แล้วส่งให้พี่ฟ้าทางแชท' },
  ],
  book: `<ul><li><b>คืนเงิน</b> ได้ภายใน <b>15 วัน</b> นับจากวันที่ลูกค้าได้รับสินค้า เกินกว่านั้นปฏิเสธอย่างสุภาพ</li><li><b>ซ่อม</b> ซ่อมได้ตลอดระยะเวลาประกันของสินค้านั้น (ดูเดือนประกันในหน้าเคส) หมดประกันซ่อมแบบคิดค่าบริการ</li><li><b>ปัญหาเล็กน้อย</b> (กล่องบุบ ของไม่เสีย) ให้คูปองส่วนลด 10% ได้</li><li><b>ส่งไม่ถึง/ไม่ครบ</b> ส่งสินค้าใหม่ให้ลูกค้า และทำเอกสารขอเคลมคืนจากขนส่ง</li><li>ใช้ <b>เทมเพลตตอบลูกค้า</b> ได้ แต่ต้องตรงกับวิธีแก้ปัญหาที่เลือก</li><li>เจอเว็บไซต์แสดงราคาไม่ตรงกับตอนชำระเงิน ให้รายงานหัวหน้าทันที</li></ul>`,
  start() {
    const bug = pick(CS_PRODUCTS.filter(p => shopPrice(p).tag));
    career.cs = { seq: 0, cases: [], right: 0, wrong: 0, bug: bug.id, found: false, reported: false, report: false, day: csToday(), today: 0, gen: 0, dayTrk: [], claimed: false };
    EMAIL_DIR.boss = 'fa@pochana-machine.test'; csEnsure();
    chatById('boss').msgs.length = 0; chatById('g').msgs.length = 0;
    pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่ทีมดูแลลูกค้า โภชนาเบเกอรี่ แมชชีน 🎧 เคสลูกค้าอยู่ในแอป “เคสลูกค้า” อ่านกฎใน “งานของฉัน” ก่อนนะ แล้วอย่าลืมลองเช็กเว็บร้านด้วย ช่วงนี้มีลูกค้าบ่นเรื่องราคา', 1500);
    pushMsg('g', 'bear', 'โอ๊ตเองนะ ยินดีต้อนรับ 🐻 เพจตอนนี้คอมเมนต์ถามโปรเยอะมาก', 3000); pushMsg('g', 'bun', 'แพรวคลังสินค้านะคะ ถ้าต้องส่งของใหม่ แจ้งแพรวได้เลย 📦', 4600);
    mailPush(null, 'พี่ฟ้า (หัวหน้าทีมลูกค้า)', 'ยินดีต้อนรับเข้าทีมดูแลลูกค้า', '<p>ยินดีต้อนรับค่ะ งานหลักคือตอบเคสลูกค้าตามกฎบริษัท และช่วยตรวจเว็บร้านถ้าเห็นความผิดปกติ อ่านกฎในแอป "งานของฉัน" ได้เลยค่ะ</p>', 'news');
    renderChat(); toastCase();
  },
  resume() { if (!career.cs.cases) career.cs = { seq: 0, cases: [], right: 0, wrong: 0, bug: 'p1', found: false, reported: false, report: false, day: csToday(), today: 0, gen: 0, dayTrk: [], claimed: false }; },
  contacts: [['พี่ฟ้า (หัวหน้าทีมลูกค้า)', 'fa@pochana-machine.test'], ['ฝ่ายคลังสินค้า (แพรว)', 'warehouse@pochana-machine.test'], ['ฝ่ายเคลมขนส่ง ไทยไวด์ เอ็กซ์เพรส', 'claims@thaiwide.test'], ['ทีมเว็บไซต์', 'web@pochana-machine.test']],
  routes: [
    { addr: 'fa@pochana-machine.test', from: 'พี่ฟ้า (หัวหน้าทีมลูกค้า)', reply: m => m.att.length ? 'ได้รับไฟล์แล้วนะ ขอบใจ' : 'เมลถึงพี่แล้ว ถ้าเรื่องด่วนทักแชทมาได้เลย' },
    { addr: 'warehouse@pochana-machine.test', from: 'ฝ่ายคลังสินค้า (แพรว)', reply: () => 'แพรวรับเรื่องแล้วค่ะ จะเช็กสต๊อกและแจ้งกลับนะคะ' },
    { addr: 'web@pochana-machine.test', from: 'ทีมเว็บไซต์', reply: m => /ราคา|โปร|checkout|ชำระ/.test(m.subj + m.body) ? 'ขอบคุณที่แจ้งราคาไม่ตรงกัน ทีมเว็บจะตรวจสอบให้ครับ' : 'ทีมเว็บรับเรื่องแล้วครับ ช่วยระบุอาการให้ชัดอีกนิด' },
    { addr: 'claims@thaiwide.test', from: 'ฝ่ายเคลม ไทยไวด์ เอ็กซ์เพรส', reply: m => csClaimReply(m), onSend: () => {} },
  ],
  boss(c, m) {
    const t = m.text || '';
    if (m.file) {
      const f = FILES.find(x => x.id === m.file.id);
      if (f && f.csReport) { like(c, m, 'boss', 700); complete('cs3'); return say(c, 'boss', `ได้รับรายงานแล้ว ปิดเคสถูก ${f.csReport.right} เคส ผิด ${f.csReport.wrong} ครั้ง ${f.csReport.wrong > 2 ? 'ระวังกฎให้มากขึ้นนะ' : 'ทำได้ดีมากเลย 👏'}`, 1900); }
      return say(c, 'boss', 'รับไฟล์แล้วค่ะ แต่ที่พี่รอคือ “รายงานสรุปเคส” จากแอปเคสลูกค้านะ', 1800);
    }
    if (/15|คืนเงิน|ซ่อม|ประกัน|ส่วนลด|ส่งใหม่|เคลม|กฎ/.test(t)) return say(c, 'boss', 'สรุปกฎ: คืนเงินได้ใน 15 วัน · ซ่อมตลอดประกัน · ปัญหาเล็กให้ส่วนลด 10% · ส่งไม่ถึง/ไม่ครบ ส่งใหม่ + เคลมขนส่ง (ดูในแอป “งานของฉัน” ด้วยนะ)', 1800);
    if (/เว็บ|ราคา|โปร/.test(t)) return say(c, 'boss', career.cs.reported ? 'เรื่องราคาพี่ส่งให้ทีมเว็บแล้วนะ ขอบใจมาก' : 'ลองเข้าเว็บร้านแล้วสั่งของใส่ตะกร้าดูนะ เทียบราคาโปรกับตอนชำระเงิน', 1800);
    say(c, 'boss', pick(['โอเคจ้า 👍', 'ขอบคุณนะ', 'ถ้าเจอเคสยากถามพี่ได้เลย', 'ตอบลูกค้าด้วยใจเย็นๆ นะ']), 1600);
  },
};
const csToday = () => Math.floor(dayStart(gnow()) / DAY);
function csEnsure() {
  const cc = career.cs; if (cc.day !== csToday()) { if (cc.day && cc.today < 5) pushMsg('boss', 'boss', `เมื่อวานปิดเคสได้ ${cc.today}/5 เคสนะ วันนี้ช่วยเก็บให้ครบหน่อย 🙏`, 1500); cc.day = csToday(); cc.today = 0; cc.gen = 0; cc.dayTrk = []; cc.claimed = false; }
  while (csOpen().length < 3 && cc.gen < 8) { csNew(); cc.gen++; }
}
function toastCase() { const n = csOpen().length; if (n) S.toast(`🎧 มีแชทลูกค้ารอ ${n} เคส`, 2.2); renderCS(); }
tbButton('cscase', '🎧', 'แชทลูกค้า', '#3b82f6', 'cs', () => openCS());
tbButton('shop', '🛍️', 'เว็บร้านค้า', '#e0457b', 'cs', () => openShop());
function openCS() {
  if (cs.W && wins.has('cscase')) { focusWin(cs.W); return cs.W; }
  csEnsure();
  cs.W = openWin('cscase', 'แชทลูกค้า — โภชนาเบเกอรี่ แมชชีน', h('div', { class: 'csapp csc' }), 760, 520, '#dbe9ff'); cs.W.onClose = () => { cs.W = null; };
  const root = cs.W.body.firstChild;
  root.addEventListener('click', e => {
    const k = e.target.closest('[data-case]'); if (k) { cs.sel = k.dataset.case; cs.act = ''; cs.tpl = ''; cs.fb = ''; renderCS(); return; }
    const a = e.target.closest('[data-act]'); if (a) { cs.act = a.dataset.act; const c = career.cs.cases.find(x => x.id === cs.sel); cs.tpl = cs.act; cs.draft = (CS_TPL[cs.act] ? CS_TPL[cs.act][1] : '').replace('{name}', c.name); renderCS(); return; }
    const t = e.target.closest('[data-tp]'); if (t) { const c = career.cs.cases.find(x => x.id === cs.sel); cs.tpl = t.dataset.tp; cs.draft = CS_TPL[cs.tpl][1].replace('{name}', c.name); renderCS(); return; }
    if (e.target.closest('[data-send]')) return csSend();
    if (e.target.closest('[data-rep]')) return csReportPDF();
  });
  root.addEventListener('input', e => { if (e.target.matches('textarea')) cs.draft = e.target.value; });
  renderCS(); return cs.W;
}
function renderCS() {
  if (!cs.W || !wins.has('cscase')) return; const root = cs.W.body.firstChild, open = csOpen(), pd = id => CS_PRODUCTS.find(p => p.id === id);
  if (!open.some(c => c.id === cs.sel)) { cs.sel = open[0]?.id || null; cs.act = ''; cs.tpl = ''; cs.draft = ''; }
  const c = open.find(x => x.id === cs.sel), p = c && pd(c.pid), cc = career.cs;
  const facts = c ? `<span>${p.e} ${esc(p.n)} · ฿${baht(p.price)}</span>${c.kind === 'return' ? `<span>ได้รับของเมื่อ <b>${c.days} วันก่อน</b></span>` : ''}${c.kind === 'repair' ? `<span>ซื้อมา <b>${c.months} เดือน</b> · ประกัน ${p.warr} เดือน</span>` : ''}${c.trk ? `<span>เลขพัสดุ <b>${c.trk}</b></span>` : ''}` : '';
  root.innerHTML = `<div class="csl"><div class="hd">แชทลูกค้า</div><div class="quota ${cc.today >= 5 ? 'ok' : ''}">วันนี้ปิดเคสแล้ว <b>${cc.today}/5</b> เคส</div>${open.map(x => `<button data-case="${x.id}" class="${x.id === cs.sel ? 'on' : ''}"><i>🙂</i><span><b>${esc(x.name)}</b><small>${esc(x.msg.slice(0, 34))}…</small></span></button>`).join('') || '<p class="soft">ตอบครบแล้ว 🎉 เดี๋ยวมีลูกค้าทักมาใหม่</p>'}<div class="stat">ถูก ${cc.right} · พลาด ${cc.wrong}</div><button class="btn2" data-rep ${cc.right ? '' : 'disabled'}>📊 รายงานสรุปเคส</button></div>
    <div class="csd chat">${c ? `<div class="ctop"><b>${esc(c.name)}</b> <small>เคส ${c.id}</small></div><div class="cfacts">${facts}</div><div class="cbody"><div class="cb them">${esc(c.msg)}</div>${cs.sent ? `<div class="cb me">${esc(cs.sent)}</div>` : ''}</div>
    <div class="cchips"><small>วิธีแก้ปัญหาตามกฎ (แตะเลือก):</small>${Object.entries(CS_ACT).map(([k, v]) => `<button class="${cs.act === k ? 'on' : ''}" data-act="${k}">${v[0]}</button>`).join('')}</div>
    <div class="cchips"><small>เทมเพลตตอบ:</small>${Object.entries(CS_TPL).map(([k, v]) => `<button class="${cs.tpl === k ? 'on' : ''}" data-tp="${k}">${v[0]}</button>`).join('')}</div>
    <div class="fb">${cs.fb}</div><div class="cin2"><textarea rows="2" placeholder="พิมพ์ตอบลูกค้า หรือแตะวิธีแก้ปัญหา/เทมเพลตด้านบน">${esc(cs.draft || '')}</textarea><button class="btn2 pri" data-send>ส่ง ➤</button></div>` : '<p class="soft" style="padding:20px">ยังไม่มีแชทลูกค้า</p>'}</div>`;
  const cb = root.querySelector('.cbody'); if (cb) cb.scrollTop = cb.scrollHeight;
}
function csSend() {
  const c = csOpen().find(x => x.id === cs.sel); if (!c) return; const txt = (cs.draft || '').trim(), cc = career.cs;
  if (!cs.act) { cs.fb = 'เลือกวิธีแก้ปัญหาตามกฎก่อนนะ'; return renderCS(); }
  if (txt.length < 20) { cs.fb = 'ข้อความสั้นไป ลองแตะเทมเพลตหรือพิมพ์ให้สุภาพและครบถ้วน'; return renderCS(); }
  if (cs.act !== c.exp) { cc.wrong++; cs.fb = `❌ ผิดกฎบริษัท: ${esc(CS_ACT[c.exp][1])} (เลือกใหม่ได้)`; S.tone(300, 200, .15, .08); pushMsg('boss', 'boss', `เคสของ ${c.name} พี่เห็นแล้วนะ วิธีแก้ที่เลือกยังไม่ตรงกฎ ลองเช็กกฎอีกที 🙂`, 1500); return renderCS(); }
  if (cs.tpl && cs.tpl !== c.exp && cs.tpl !== 'hello') { cs.fb = '⚠️ เทมเพลตที่เลือกไม่ตรงกับวิธีแก้ปัญหา ลูกค้าจะงงนะ'; return renderCS(); }
  c.done = true; cc.right++; cc.today++; if (c.exp === 'resend') { cc.dayTrk.push(c.trk); csClaimFile(c); }
  cs.sent = txt; cs.act = ''; cs.tpl = ''; cs.draft = ''; cs.fb = ''; S.tone(700, 1200, .12, .08, 'triangle'); S.toast(`ปิดเคส ${c.name} แล้ว ✅ (${cc.today}/5)`, 1.6);
  if (cc.today >= 5) complete('cs1'); renderCS(); setTimeout(() => { cs.sent = ''; if (cs.W) renderCS(); }, 1200);
  setTimeout(() => { if (career.id === 'cs') { csEnsure(); toastCase(); } }, 9000);
}
/* lost parcels of the day → Excel list of tracking numbers → e-mail the carrier */
function csClaimFile(c) {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), id = 'csclaim-' + csToday();
  let f = FILES.find(x => x.id === id); if (!f) { f = { id, name: `สรุปแจ้งเคลมพัสดุหาย-${d}.xlsx`, type: 'xls', kind: 'sheet', loc: 'desk', careerFile: 'cs', book: newBook({ A1: 'เลขแทรกกิ้งพัสดุที่หาย', B1: 'ชื่อลูกค้า', C1: 'สินค้า' }) }; FILES.push(f); renderDesktop(); }
  pushMsg('boss', 'boss', `เคส ${c.name} มีพัสดุหาย เลขแทรกกิ้ง ${c.trk} ต้องยื่นเคลมกับขนส่งด้วยนะ จดลงไฟล์ “${f.name}” บนจอ แล้วอีเมลส่งฝ่ายเคลมขนส่ง (อีเมลอยู่ในคู่มือ)`, 1500); S.toast('📊 มีไฟล์สรุปแจ้งเคลมบนจอ ให้จดเลขพัสดุที่หาย', 2.6);
}

function csReportPDF() {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), n = career.cs.right, k = {};
  career.cs.cases.filter(c => c.done).forEach(c => { k[c.exp] = (k[c.exp] || 0) + 1; });
  const body = `<h3>รายงานสรุปเคสลูกค้า · โภชนาเบเกอรี่ แมชชีน</h3><p>วันที่ ${d} · ผู้รายงาน ${esc(chat.account?.name || 'เจ้าหน้าที่ดูแลลูกค้า')}</p><table class="pdft"><tr><th>วิธีแก้ปัญหา</th><th>จำนวนเคส</th></tr>${Object.entries(k).map(([a, v]) => `<tr><td>${esc(CS_ACT[a][0])}</td><td style="text-align:right">${v}</td></tr>`).join('')}<tr><th>รวมปิดเคสถูกต้อง</th><th style="text-align:right">${n}</th></tr></table><p>ตอบพลาด/ผิดกฎ ${career.cs.wrong} ครั้ง · ${career.cs.reported ? 'แจ้งปัญหาราคาโปรโมชั่นเว็บไซต์แล้ว' : 'ยังไม่ได้ตรวจราคาโปรโมชั่นเว็บไซต์'}</p>`;
  const f = savePDF(`รายงานเคสลูกค้า-${d}`, body); f.csReport = { right: n, wrong: career.cs.wrong }; S.toast('ได้ไฟล์รายงานแล้ว ส่งให้พี่ฟ้าทางแชทได้เลย', 2.6);
}
function csClaimReply(m) {
  const cc = career.cs, need = cc.dayTrk || []; if (!need.length) return 'ฝ่ายเคลมได้รับเมลแล้วค่ะ แต่ยังไม่มีเรื่องเคลมของวันนี้ในระบบ';
  const fs = m.att.map(a => FILES.find(x => x.id === a.id)).filter(f => f && f.kind === 'sheet' && f.book); if (!fs.length) return 'ไม่เห็นไฟล์ Excel รายชื่อแทรกกิ้งพัสดุที่หายแนบมาเลยค่ะ รบกวนแนบไฟล์ “สรุปแจ้งเคลมพัสดุหาย” ด้วยนะคะ';
  const txt = fs.map(f => Object.values(f.book.cells).join(' ')).join(' '), miss = need.filter(t => !txt.includes(t));
  if (miss.length) return `ได้รับไฟล์แล้ว แต่ในไฟล์ยังไม่มีเลขแทรกกิ้ง ${miss.join(', ')} ที่แจ้งว่าหายของวันนี้ค่ะ รบกวนเพิ่มแล้วส่งใหม่`;
  cc.claimed = true; complete('cs4'); return `ได้รับรายชื่อพัสดุที่หาย ${need.length} ชิ้นแล้วค่ะ เปิดเรื่องเคลมให้เรียบร้อย จะแจ้งผลภายใน 7 วันทำการ`;
}
setInterval(() => { if (career.id === 'cs') { csEnsure(); if (csOpen().length) { renderCS(); } } }, 30000);

/* ---- pretend web shop: sale prices on the product page vs. price charged at checkout (one product is wrong) ---- */
function shopPrice(p) { return p.price >= 390 && p.id !== 'p5' ? { sale: Math.round(p.price * .8), tag: 'SALE -20%' } : { sale: p.price, tag: '' }; }
function charged(p) { const s = shopPrice(p); return p.id === career.cs.bug && s.tag ? p.price : s.sale; }
function openShop() {
  if (cs.shop.W && wins.has('shop')) { focusWin(cs.shop.W); return cs.shop.W; }
  cs.shop.W = openWin('shop', 'โภชนาเบเกอรี่ แมชชีน — shop.pochana-machine.test', h('div', { class: 'shopapp' }), 700, 480, '#ffe4ef'); cs.shop.W.onClose = () => { cs.shop.W = null; };
  const root = cs.shop.W.body.firstChild;
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-add]'); if (a) { cs.shop.cart.push(a.dataset.add); S.tone(800, 1000, .05, .05); renderShop(); return; }
    if (e.target.closest('[data-chk]')) { cs.shop.view = 'checkout'; renderShop(); return; }
    if (e.target.closest('[data-back]')) { cs.shop.view = 'list'; renderShop(); return; }
    if (e.target.closest('[data-clr]')) { cs.shop.cart = []; renderShop(); return; }
    if (e.target.closest('[data-report]')) { shopReport(); return; }
  });
  renderShop(); return cs.shop.W;
}
function renderShop() {
  const W = cs.shop.W; if (!W || !wins.has('shop')) return; const root = W.body.firstChild, cart = cs.shop.cart.map(id => CS_PRODUCTS.find(p => p.id === id));
  if (cs.shop.view === 'checkout') {
    const tot = cart.reduce((s, p) => s + charged(p), 0);
    root.innerHTML = `<div class="sh"><b>🧾 ชำระเงิน</b> <button class="btn2" data-back>← กลับไปเลือกสินค้า</button></div><table class="ct">${cart.map(p => `<tr><td>${p.e} ${esc(p.n)}</td><td style="text-align:right">฿${baht(charged(p))}</td></tr>`).join('') || '<tr><td>ตะกร้าว่าง</td><td></td></tr>'}<tr><th>ยอดชำระ</th><th style="text-align:right">฿${baht(tot)}</th></tr></table><p class="soft">ระบบจำลอง ไม่มีการตัดเงินจริง</p><div class="rp"><b>🚨 พบความผิดปกติ?</b> เลือกสินค้าที่ราคาไม่ตรง แล้วกรอกราคาที่เห็น:<br><select class="rp-p">${CS_PRODUCTS.map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join('')}</select> ราคาที่แสดงหน้าสินค้า <input class="rp-a" size="6" inputmode="numeric"> ราคาตอนชำระเงิน <input class="rp-b" size="6" inputmode="numeric"> <button class="btn2 pri" data-report>ส่งรายงานให้พี่ฟ้า</button><div class="fb">${cs.shop.msg}</div></div>`;
    return;
  }
  root.innerHTML = `<div class="ban">🎉 โปรสิ้นเดือน ลด 20% เฉพาะสินค้าที่มีป้าย SALE</div><div class="pg">${CS_PRODUCTS.map(p => { const s = shopPrice(p); return `<div class="pc"><div class="pe">${p.e}</div><b>${esc(p.n)}</b>${s.tag ? `<span class="sale">${s.tag}</span><div><s>฿${baht(p.price)}</s> <b class="pr">฿${baht(s.sale)}</b></div>` : `<div><b class="pr">฿${baht(p.price)}</b></div>`}<button class="btn2" data-add="${p.id}">+ ใส่ตะกร้า</button></div>`; }).join('')}</div><div class="sh">🛒 ตะกร้า ${cart.length} ชิ้น <button class="btn2 pri" data-chk ${cart.length ? '' : 'disabled'}>ไปหน้าชำระเงิน</button> <button class="btn2" data-clr>ล้าง</button></div>`;
}
function shopReport() {
  const root = cs.shop.W.body.firstChild, pid = root.querySelector('.rp-p').value, a = money2(root.querySelector('.rp-a').value), b = money2(root.querySelector('.rp-b').value), p = CS_PRODUCTS.find(x => x.id === pid);
  if (pid === career.cs.bug && a === shopPrice(p).sale && b === p.price) {
    career.cs.reported = true; complete('cs2'); cs.shop.msg = '✅ ถูกต้อง! ส่งรายงานให้พี่ฟ้าแล้ว'; pushMsg('boss', 'boss', `ขอบใจมากที่เจอ ${p.n} โปรหน้าเว็บ ฿${baht(a)} แต่ตอนชำระเงินเรียก ฿${baht(b)} เดี๋ยวพี่แจ้งทีมเว็บแก้ด่วน 🙏`, 1800); S.jingle();
    renderShop();
  } else { cs.shop.msg = 'ยังไม่ตรง ลองเทียบราคาหน้าสินค้ากับยอดชำระอีกที (ใส่สินค้าลงตะกร้าให้ครบก่อนเช็ก)'; S.tone(300, 200, .15, .08); root.querySelector('.fb').textContent = cs.shop.msg; }
}
