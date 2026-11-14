"use strict";
// Office game (beta) — logistics job: reconcile COD money from the courier, find lost parcels, claim compensation.
const LG_FEE = 15, LG_CAP = 2000, LG_ITEMS = ['เครื่องชงกาแฟ', 'หูฟังบลูทูธ', 'รองเท้าผ้าใบ', 'กระเป๋าสะพาย', 'โคมไฟตั้งโต๊ะ', 'เสื้อแจ็กเก็ต', 'ชุดเครื่องครัว', 'พัดลมพกพา'];
const lg = { W: null, msg: '', bad: [] };
function lgNew() {
  const seq = ++career.lg.seq, ps = [], n = 8, st = ['delivered', 'delivered', 'delivered', 'delivered', 'returned', 'lost', 'lost', 'delivered'].sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) { const cod = pick([290, 450, 590, 790, 990, 1490, 2390, 3290]); ps.push({ id: 'TH' + String(rint(100000, 999999)), item: pick(LG_ITEMS), cod, st: st[i], days: st[i] === 'lost' ? pick([3, 5, 9, 12]) : 0 }); }
  const exp = ps.filter(p => p.st === 'delivered').reduce((s, p) => s + p.cod - LG_FEE, 0), short = pick([0, 0, 590, 990, 1490].filter(x => x === 0 || ps.some(p => p.st === 'delivered' && p.cod === x)) || [0]);
  const claim = ps.filter(p => p.st === 'lost' && p.days > 7).reduce((s, p) => s + Math.min(p.cod, LG_CAP), 0);
  const b = { id: 'B' + String(seq).padStart(2, '0'), ps, exp, remit: exp - short, short, claim, done: false }; career.lg.batches.push(b);
  pushMsg('cust', 'cust', `ส่งสรุปพัสดุ COD รอบ ${b.id} ให้แล้วนะ ยอดที่ขนส่งโอนมา ${baht(b.remit)} บาท รบกวนกระทบยอดให้ที`, 1500); return b;
}
const lgOpen = () => career.lg.batches.filter(b => !b.done);
CAREERS.lg = {
  label: 'บัญชีขนส่ง', co: 'ไทยไวด์ เอ็กซ์เพรส', e: '🚚', pos: 'เจ้าหน้าที่บัญชี COD', color: '#ffe9cc', salary: 28000, where: 'สมุทรปราการ · ศูนย์กระจายสินค้า', tags: ['ขนส่ง', 'COD', 'บัญชี'],
  desc: 'กระทบยอดเงินเก็บปลายทาง (COD) ที่ขนส่งโอนให้ร้านค้า ตรวจพัสดุตีกลับ/สูญหาย ทำเอกสารขอเคลมค่าชดเชย เหมาะคนชอบไล่ตัวเลขทีละรายการ',
  need: ['กระทบยอดแม่น', 'ใจเย็นเวลาลูกค้าตามของ', 'เขียนเอกสารเคลมชัดเจน'], perks: ['ส่วนลดค่าส่งพนักงาน', 'รถรับส่ง', 'โบนัสสิ้นปี'],
  people: { boss: { n: 'พี่ไว (ผู้จัดการบัญชี)', e: '🐯', c: '#ffe0b8' }, bear: { n: 'บอส (หน้าคลัง)', e: '🐻', c: '#e8cfb4' }, bun: { n: 'ฟ้าใส (ฝ่ายเคลม)', e: '🐰', c: '#ffd6e3' }, duck: { n: 'ลุงชัย (ไรเดอร์)', e: '🦆', c: '#fff1a8' }, cust: { n: 'ร้านค้า (ลูกค้าขนส่ง)', e: '🛍️', c: '#e6e0ff' } },
  titles: { g: 'ทีมบัญชี ไทยไวด์', boss: 'พี่ไว (ผู้จัดการบัญชี)', cust: 'ร้านค้า (ลูกค้าขนส่ง)', hr: 'พี่ HR ไทยไวด์' }, hide: [], docs: false, apps: ['logi'], client: '',
  tasks: [{ id: 'lg1', t: 'เปิดแอป 🚚 กระทบยอด COD คำนวณยอดที่ควรได้รับ ส่วนต่างที่ขนส่งโอนขาด และยอดเคลมพัสดุสูญหาย ให้ถูก 2 รอบ' }, { id: 'lg2', t: 'กด “สร้างใบกระทบยอดและเคลม” ได้ไฟล์ PDF แล้วส่งให้พี่ไวทางแชท' }],
  contacts: [['พี่ไว (ผู้จัดการบัญชี)', 'wai@thaiwide.test'], ['โบ (ฝ่ายเคลม)', 'claims@thaiwide.test'], ['ลุงชัย (ไรเดอร์)', 'chai@thaiwide.test']],
  routes: [
    { addr: 'wai@thaiwide.test', from: 'พี่ไว (ผู้จัดการบัญชี)', reply: m => m.att.length ? 'ได้รับไฟล์แล้ว ขอบใจ' : 'พี่ได้รับเมลแล้ว ถ้าด่วนทักแชทมา' },
    { addr: 'claims@thaiwide.test', from: 'โบ (ฝ่ายเคลม)', reply: () => 'ฝ่ายเคลมรับเรื่องแล้วค่ะ เปิดเรื่องตามรายการที่ส่งมา' },
    { addr: 'chai@thaiwide.test', from: 'ลุงชัย (ไรเดอร์)', reply: () => 'รับทราบครับ เดี๋ยวลุงเช็กให้' },
  ],
  book: `<ul><li><b>ยอดที่ควรได้รับ</b> = ผลรวม COD ของพัสดุ “ส่งสำเร็จ” − ค่าธรรมเนียมเก็บเงินปลายทาง ${LG_FEE} บาทต่อชิ้น</li><li>พัสดุ <b>ตีกลับ</b> ไม่มีเงิน ไม่มีค่าธรรมเนียม</li><li>พัสดุ <b>สูญหายเกิน 7 วัน</b> เคลมได้ = ราคา COD แต่ไม่เกิน ${baht(LG_CAP)} บาทต่อชิ้น (สูญหายไม่เกิน 7 วัน ยังเคลมไม่ได้)</li><li><b>ส่วนต่าง</b> = ยอดที่ควรได้รับ − ยอดที่ขนส่งโอนมา</li></ul>`,
  start() { career.lg = { seq: 0, batches: [], right: 0, wrong: 0 }; ['boss', 'g', 'cust'].forEach(k => chatById(k).msgs.length = 0); pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่ไทยไวด์ 🚚 งานหลักคือกระทบยอด COD กับร้านค้า ดูกฎในแท็บ “งานของฉัน” ได้ ถ้ายอดขาดต้องหาให้เจอว่าชิ้นไหน', 1500); pushMsg('g', 'duck', 'ลุงชัยเองนะ พัสดุตีกลับเยอะช่วงนี้ ฝนตกบ่อย ☔', 3000); lgNew(); lgNew(); renderChat(); S.toast('🚚 มีรอบ COD รอกระทบยอด 2 รอบ', 2.4); },
  resume() { if (!career.lg || !career.lg.batches) career.lg = { seq: 0, batches: [], right: 0, wrong: 0 }; },
  boss(c, m) {
    if (m.file) { const f = FILES.find(x => x.id === m.file.id); if (f && f.lgReport) { like(c, m, 'boss', 700); complete('lg2'); return say(c, 'boss', `ได้รับใบกระทบยอดแล้ว กระทบถูก ${f.lgReport.right} รอบ ขอเคลมรวม ${baht(f.lgReport.claim)} บาท ส่งต่อฝ่ายเคลมให้เลย 🚚`, 1900); } return say(c, 'boss', 'ที่พี่รอคือ “ใบกระทบยอดและเคลม” จากแอปนะ', 1800); }
    if (/เคลม|หาย/.test(m.text || '')) return say(c, 'boss', `เคลมได้เฉพาะสูญหายเกิน 7 วัน ชดเชยตามราคา COD ไม่เกิน ${baht(LG_CAP)} บาทต่อชิ้น`, 1800);
    say(c, 'boss', pick(['โอเค 👍', 'ตัวเลขต้องตรงนะ', 'ลูกค้าตามเงินอยู่', 'เช็กค่าธรรมเนียมต่อชิ้นด้วย']), 1600);
  },
};
tbButton('logi', '🚚', 'กระทบยอด COD', '#e08a2f', 'lg', () => openLogi());
function openLogi() {
  if (lg.W && wins.has('logi')) { focusWin(lg.W); return lg.W; }
  lg.W = openWin('logi', 'กระทบยอด COD — ไทยไวด์ เอ็กซ์เพรส', h('div', { class: 'taxapp' }), 820, 540, '#fff0dc'); lg.W.onClose = () => { lg.W = null; };
  lg.W.body.firstChild.addEventListener('click', e => { if (e.target.closest('[data-lgok]')) lgSubmit(); if (e.target.closest('[data-lgrep]')) lgReport(); }); renderLogi(); return lg.W;
}
const LGST = { delivered: '✅ ส่งสำเร็จ', returned: '↩️ ตีกลับ' };
function renderLogi() {
  if (!lg.W || !wins.has('logi')) return; const root = lg.W.body.firstChild, b = lgOpen()[0];
  const inp = (n, l) => `<label>${l}<input name="${n}" inputmode="decimal" autocomplete="off" class="${lg.bad.includes(n) ? 'bad' : ''}"></label>`;
  root.innerHTML = b ? `<div class="soft">ผลงาน: ถูก ${career.lg.right} · พลาด ${career.lg.wrong} · รอบที่รอ ${lgOpen().length}</div><h4>รอบ ${b.id} · ขนส่งโอนมา <b>${baht(b.remit)}</b> บาท</h4><table class="ct"><tr><th>เลขพัสดุ</th><th>สินค้า</th><th>COD</th><th>สถานะ</th></tr>${b.ps.map(p => `<tr><td>${p.id}</td><td>${esc(p.item)}</td><td>${baht(p.cod)}</td><td>${p.st === 'lost' ? `❓ สูญหาย ${p.days} วัน` : LGST[p.st]}</td></tr>`).join('')}</table><form class="tf" autocomplete="off">${inp('exp', 'ยอดที่ควรได้รับ')}${inp('diff', 'ส่วนต่าง (ควรได้ − โอนมา)')}${inp('claim', 'ยอดเคลมพัสดุสูญหาย')}</form><div class="fb">${lg.msg}</div><button class="btn2 pri" data-lgok>ส่งผลกระทบยอด</button> <button class="btn2" data-lgrep ${career.lg.right ? '' : 'disabled'}>📊 สร้างใบกระทบยอดและเคลม</button>` : '<p class="soft">กระทบครบแล้ว รอรอบใหม่</p><button class="btn2" data-lgrep>📊 สร้างใบกระทบยอดและเคลม</button>';
}
function lgSubmit() {
  const root = lg.W.body.firstChild, b = lgOpen()[0]; if (!b) return; const want = { exp: b.exp, diff: b.exp - b.remit, claim: b.claim }, got = {};
  for (const k in want) got[k] = money2(root.querySelector(`[name="${k}"]`).value);
  lg.bad = Object.keys(want).filter(k => !(Math.abs(got[k] - want[k]) <= 1.01));
  if (lg.bad.length) { career.lg.wrong++; lg.msg = `❌ ยังไม่ถูก ${lg.bad.length} ช่อง (ช่องสีแดง) ดูสูตรในแท็บ “งานของฉัน”`; renderLogi(); const r = lg.W.body.firstChild; for (const k in got) if (!isNaN(got[k])) r.querySelector(`[name="${k}"]`).value = got[k]; S.tone(300, 200, .15, .08); return; }
  b.done = true; career.lg.right++; lg.msg = ''; lg.bad = []; S.tone(700, 1200, .12, .08, 'triangle'); S.toast(`กระทบยอดรอบ ${b.id} ถูกต้อง ✅`, 2); if (career.lg.right >= 2) complete('lg1');
  pushMsg('cust', 'cust', b.exp - b.remit ? `ขอบคุณที่หาส่วนต่างให้ ${baht(b.exp - b.remit)} บาทนะ เดี๋ยวตามกับขนส่ง` : 'ยอดตรงแล้ว ขอบคุณค่ะ', 1800);
  setTimeout(() => { if (career.id === 'lg' && !lgOpen().length) { lgNew(); renderLogi(); } }, 15000); renderLogi();
}
function lgReport() {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), done = career.lg.batches.filter(b => b.done), claim = done.reduce((s, b) => s + b.claim, 0);
  const f = savePDF(`ใบกระทบยอดและเคลม-${d}`, `<h3>ใบกระทบยอด COD และขอเคลมพัสดุสูญหาย · ไทยไวด์ เอ็กซ์เพรส</h3><p>วันที่ ${d} · ผู้ทำ ${esc(chat.account?.name || 'เจ้าหน้าที่บัญชี')}</p><table class="pdft"><tr><th>รอบ</th><th>ยอดที่ควรได้</th><th>โอนมา</th><th>ส่วนต่าง</th><th>ยอดเคลม</th></tr>${done.map(b => `<tr><td>${b.id}</td><td>${baht(b.exp)}</td><td>${baht(b.remit)}</td><td>${baht(b.exp - b.remit)}</td><td>${baht(b.claim)}</td></tr>`).join('')}</table><p>ขอเคลมรวม ${baht(claim)} บาท · กระทบถูก ${career.lg.right} รอบ</p>`);
  f.lgReport = { right: career.lg.right, claim }; S.toast('ได้ไฟล์แล้ว ส่งให้พี่ไวทางแชทได้เลย', 2.6);
}
setInterval(() => { if (career.id === 'lg' && !lgOpen().length) { lgNew(); renderLogi(); } }, 45000);
