"use strict";
// Office game (beta) — tax job: calculate clients' personal income tax, file it on a pretend e-filing site, late filing costs a penalty.
// Rates and rules follow the Revenue Department's personal income tax guide (rd.go.th, checked 14 Nov 2026) in a simplified game form.
const TAX_BR = [[150000, 0], [300000, .05], [500000, .10], [750000, .15], [1000000, .20], [2000000, .25], [5000000, .30], [Infinity, .35]];
const taxOf = net => { let t = 0, lo = 0; for (const [hi, r] of TAX_BR) { if (net > lo) t += (Math.min(net, hi) - lo) * r; lo = hi; } return Math.round(t * 100) / 100; };
const TAX_NAMES = ['คุณมาลี', 'คุณสมปอง', 'คุณวีระ', 'คุณนภา', 'คุณอนันต์', 'คุณรัตนา', 'คุณกิตติ', 'คุณจันทร์เพ็ญ', 'คุณบุญช่วย', 'คุณพิมพ์'];
const tx = { W: null, tab: 'file', sel: null, msg: '', bad: [] };
const fmt2 = n => n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
function taxCalc(c) {
  c.alw = c.allow.reduce((s, a) => s + a[1], 0); c.net = Math.max(0, c.income - c.exp - c.alw); c.tax = taxOf(c.net); c.pay = Math.round((c.tax - c.wht) * 100) / 100; return c;
}
function taxNew() {
  const seq = ++career.tax.seq, free = Math.random() < .35, income = (24 + Math.floor(Math.random() * 67)) * 10000;
  const kids = pick([0, 0, 1, 2]), ins = pick([0, 0, 20000, 35000, 50000]), allow = [['ลดหย่อนส่วนตัว', 60000]];
  if (kids) allow.push([`บุตร ${kids} คน`, kids * 30000]); if (ins) allow.push(['เบี้ยประกันชีวิต', ins]); if (!free) allow.push(['ประกันสังคม', 9000]);
  const c = { id: 'T' + String(seq).padStart(3, '0'), tid: '3-' + rint(1000, 9999) + '-' + rint(10000, 99999) + '-' + rint(10, 99) + '-' + rint(1, 9), name: pick(TAX_NAMES.filter(n => !career.tax.cases.some(c => !c.done && c.name === n))), kind: free ? 'free' : 'salary', income, exp: free ? Math.round(income * pick([.25, .3, .35, .4]) / 1000) * 1000 : Math.min(income / 2, 100000), allow, wht: Math.round(income * (free ? .03 : pick([.02, .03, .04])) / 100) * 100, due: dayStart(gnow()) + (3 + Math.floor(Math.random() * 7)) * DAY, done: false, nag: false };
  taxCalc(c); career.tax.cases.push(c);
  pushMsg('cust', 'cust', `สวัสดีค่ะ ${c.name} ส่งข้อมูลภาษีปีนี้ให้แล้วนะคะ รบกวนยื่นให้ก่อน ${thDate(c.due, { day: 'numeric', month: 'short' })} ด้วยค่ะ 🙏`, 1500);
  return c;
}
const taxOpen = () => career.tax.cases.filter(c => !c.done);
CAREERS.tax = {
  label: 'นักภาษี', co: 'สำนักงานภาษี ตราสรรพ์', e: '🧾', pos: 'เจ้าหน้าที่ยื่นภาษีลูกค้า', color: '#e6dcff', salary: 42000, where: 'กรุงเทพฯ · ใกล้รถไฟฟ้า', tags: ['ภาษี', 'บัญชี', '30k'],
  desc: 'คำนวณและยื่นภาษีเงินได้บุคคลธรรมดาให้ลูกค้า ตรวจเอกสารลดหย่อน ยื่นให้ทันกำหนดไม่ให้โดนปรับ เงินเดือนสูงขึ้นแต่งานละเอียดและกดดัน',
  need: ['คิดเลขแม่น', 'รู้จักเงินได้และค่าลดหย่อน', 'ส่งงานตรงเวลา'], perks: ['ค่าล่วงเวลาช่วงยื่นภาษี', 'ประกันสุขภาพ', 'อบรม CPD'],
  people: { boss: { n: 'พี่แสงเดือน (หัวหน้าสำนักงาน)', e: '🦉', c: '#e2d6ff' }, bear: { n: 'ต้นกล้า (ผู้ช่วย)', e: '🐻', c: '#e8cfb4' }, bun: { n: 'พี่หญิง (ตรวจเอกสาร)', e: '🐰', c: '#ffd6e3' }, duck: { n: 'น้องฝ้าย (ธุรการ)', e: '🐥', c: '#fff1a8' }, cust: { n: 'ลูกค้าภาษี', e: '🙂', c: '#ffe1ec' } },
  titles: { g: 'ทีมสำนักงานภาษี ตราสรรพ์', boss: 'พี่แสงเดือน (หัวหน้าสำนักงาน)', cust: 'ลูกค้าภาษี', hr: 'พี่ HR ตราสรรพ์' }, hide: [], docs: false, apps: ['tax'], client: '',
  tasks: [
    { id: 'tx1', t: 'เปิด 🏛️ เว็บยื่นภาษีน้อย เลือกลูกค้า คำนวณภาษี แล้วยื่นแบบให้ถูกต้อง 2 ราย (ยื่นเลยกำหนดจะโดนเงินเพิ่ม + ค่าปรับ)' },
    { id: 'tx2', t: 'เงินเดือนเพิ่มขึ้นแล้ว! ไปแท็บ “ภาษีของฉัน” คำนวณภาษีเงินได้ของตัวเองทั้งปีให้ถูกต้อง' },
    { id: 'tx3', t: 'กด “สร้างใบสรุปการยื่นภาษี” ได้ไฟล์ PDF แล้วส่งให้พี่แสงเดือนทางแชท' },
  ],
  contacts: [['พี่แสงเดือน (หัวหน้าสำนักงาน)', 'sangduan@trasap.test'], ['พี่หญิง (ตรวจเอกสาร)', 'ying@trasap.test'], ['น้องฝ้าย (ธุรการ)', 'fai@trasap.test']],
  routes: [
    { addr: 'sangduan@trasap.test', from: 'พี่แสงเดือน (หัวหน้าสำนักงาน)', reply: m => m.att.length ? 'ได้รับไฟล์แล้ว ขอบใจ เดี๋ยวพี่ดู' : 'ได้รับเมลแล้ว ถ้าเรื่องด่วนทักแชทมาได้เลย' },
    { addr: 'ying@trasap.test', from: 'พี่หญิง (ตรวจเอกสาร)', reply: m => /ลดหย่อน|ภาษี|ตรวจ/.test(m.subj + m.body) ? 'พี่หญิงดูให้แล้ว: เงินเดือนหักค่าใช้จ่าย 50% ไม่เกิน 100,000 แล้วค่อยหักลดหย่อน ดูแท็บ “กฎและอัตรา” ในเว็บยื่นภาษีด้วยนะ' : 'พี่หญิงรับเรื่องแล้ว ระบุประเด็นให้ชัดอีกนิดนะ' },
    { addr: 'fai@trasap.test', from: 'น้องฝ้าย (ธุรการ)', reply: () => 'ฝ้ายรับเรื่องแล้วค่ะ จะส่งต่อให้ค่ะ' },
  ],
  book: `<ul><li><b>ภาษีเงินได้บุคคลธรรมดา</b> = (เงินได้ − ค่าใช้จ่าย − ค่าลดหย่อน) คิดตามขั้นบันได 0% / 5% / 10% / 15% / 20% / 25% / 30% / 35% (ดูตารางในแท็บ “กฎและอัตรา”)</li><li><b>เงินเดือน</b> หักค่าใช้จ่ายได้ 50% ไม่เกิน 100,000 บาท · <b>ฟรีแลนซ์</b> ในเกมใช้ค่าใช้จ่ายจริงที่ลูกค้าให้มา</li><li><b>ภาษีที่ถูกหัก ณ ที่จ่าย</b> นำมาหักออกจากภาษีที่คำนวณได้ ถ้าติดลบ = ขอคืน</li><li><b>ยื่นช้า</b> มีเงินเพิ่ม 1.5% ต่อเดือน (เศษเดือนนับเป็น 1 เดือน) และค่าปรับ 100 บาท (ไม่เกิน 7 วัน) / 200 บาท (เกิน 7 วัน)</li><li>เกมนี้ใช้กฎแบบย่อ เพื่อการเล่น ไม่ใช่คำแนะนำภาษีจริง</li></ul>`,
  start() {
    career.tax = { seq: 0, cases: [], me: false, report: false, filed: 0, late: 0 };
    chatById('boss').msgs.length = 0; chatById('g').msgs.length = 0; chatById('cust').msgs.length = 0;
    pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่สำนักงานภาษีตราสรรพ์ 🧾 ลูกค้าส่งข้อมูลมาให้ในแชท งานของคุณคือคำนวณและยื่นผ่านเว็บยื่นภาษี อย่าลืมกำหนดยื่น เลยแล้วโดนปรับนะ', 1500);
    pushMsg('g', 'bear', 'ต้นกล้าเองครับ ยินดีต้อนรับครับ ช่วงยื่นภาษีงานล้นมือเลย 😅', 3000); pushMsg('g', 'bun', 'พี่หญิงตรวจเอกสารให้ได้นะคะ ถ้าตัวเลขไม่แน่ใจถามได้ค่ะ', 4600);
    for (let i = 0; i < 3; i++) taxNew();
    mailPush(null, 'พี่ HR ตราสรรพ์', 'ยินดีต้อนรับ · เงินเดือนใหม่ 42,000 บาท', '<p>ยินดีต้อนรับค่ะ เงินเดือนใหม่ <b>42,000 บาท/เดือน</b> เงินได้ทั้งปีสูงขึ้นมาก อย่าลืมคำนวณภาษีเงินได้ของตัวเองด้วยนะคะ (ลองทำในเว็บยื่นภาษี แท็บ “ภาษีของฉัน”)</p>', 'news');
    renderChat(); S.toast('🧾 มีลูกค้ารอยื่นภาษี 3 ราย', 2.4);
  },
  resume() { if (!career.tax.cases) career.tax = { seq: 0, cases: [], me: false, report: false, filed: 0, late: 0 }; },
  boss(c, m) {
    const t = m.text || '';
    if (m.file) {
      const f = FILES.find(x => x.id === m.file.id);
      if (f && f.taxReport) { like(c, m, 'boss', 700); complete('tx3'); return say(c, 'boss', `ได้รับใบสรุปแล้ว ยื่นสำเร็จ ${f.taxReport.filed} ราย เลยกำหนด ${f.taxReport.late} ราย ${f.taxReport.late ? 'ครั้งหน้าอย่าให้ช้านะ ค่าปรับลูกค้าเขาไม่ชอบ' : 'ตรงเวลาทุกราย เก่งมาก 👏'}`, 1900); }
      return say(c, 'boss', 'รับไฟล์แล้ว แต่ที่พี่รอคือ “ใบสรุปการยื่นภาษี” จากเว็บยื่นภาษีนะ', 1800);
    }
    if (/ปรับ|ช้า|เลย|กำหนด/.test(t)) return say(c, 'boss', 'ยื่นช้ามีเงินเพิ่ม 1.5% ต่อเดือน กับค่าปรับ 100 บาท (ไม่เกิน 7 วัน) หรือ 200 บาท (เกิน 7 วัน) ดูได้ในแท็บ “กฎและอัตรา” ด้วย', 1800);
    if (/ภาษี|คำนวณ|ลดหย่อน/.test(t)) return say(c, 'boss', 'สูตรคือ เงินได้ − ค่าใช้จ่าย − ลดหย่อน = เงินได้สุทธิ แล้วคิดขั้นบันได หักภาษีที่ถูกหัก ณ ที่จ่ายออก', 1800);
    say(c, 'boss', pick(['โอเค 👍', 'ขอบใจนะ', 'ดูกำหนดยื่นของลูกค้าด้วย', 'ตัวเลขต้องแม่นนะ']), 1600);
  },
};
tbButton('taxweb', '🏛️', 'ยื่นภาษีออนไลน์', '#1d4f9c', 'tax', () => openTax());
function openTax() {
  if (tx.W && wins.has('taxweb')) { focusWin(tx.W); return tx.W; }
  tx.W = openWin('taxweb', 'กรมภาษีน้อย — ระบบยื่นแบบออนไลน์ (จำลอง)', h('div', { class: 'taxapp' }), 800, 520, '#ece6ff'); tx.W.onClose = () => { tx.W = null; };
  const root = tx.W.body.firstChild;
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { tx.tab = t.dataset.tab; tx.msg = ''; tx.bad = []; renderTax(); return; }
    const k = e.target.closest('[data-tcase]'); if (k) { tx.sel = k.dataset.tcase; tx.msg = ''; tx.bad = []; renderTax(); return; }
    if (e.target.closest('[data-tfile]')) return taxSubmit();
    if (e.target.closest('[data-tme]')) return taxMine();
    if (e.target.closest('[data-trep]')) return taxReport();
  });
  renderTax(); return tx.W;
}
function daysLeft(c) { return Math.round((c.due - dayStart(gnow())) / DAY); }
function taxPenalty(c) {
  const late = Math.ceil((dayStart(gnow()) - c.due) / DAY); if (late <= 0 || c.pay <= 0) return 0;
  return (late <= 7 ? 100 : 200) + Math.round(c.pay * .015 * Math.ceil(late / 30) * 100) / 100;
}
function renderTax() {
  if (!tx.W || !wins.has('taxweb')) return; const root = tx.W.body.firstChild, open = taxOpen();
  const tabs = `<div class="tabs">${[['file', 'ยื่นแบบให้ลูกค้า'], ['me', 'ภาษีของฉัน'], ['rule', 'กฎและอัตรา']].map(([k, n]) => `<button class="${tx.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}<span class="soft">ยื่นแล้ว ${career.tax.filed} · เลยกำหนด ${career.tax.late}</span></div>`;
  const inp = (n, label, hint) => `<label>${label}<input name="${n}" type="text" inputmode="decimal" autocomplete="off" class="${tx.bad.includes(n) ? 'bad' : ''}" placeholder="${hint || ''}"></label>`;
  if (tx.tab === 'rule') { root.innerHTML = tabs + `<div class="pane"><h4>อัตราภาษีเงินได้บุคคลธรรมดา (เงินได้สุทธิ)</h4><table class="ct"><tr><th>ช่วงเงินได้สุทธิ (บาท)</th><th>อัตรา</th></tr>${TAX_BR.map(([hi, r], i) => `<tr><td>${i ? baht(TAX_BR[i - 1][0] + 1) : '1'} – ${hi === Infinity ? 'ขึ้นไป' : baht(hi)}</td><td>${r ? r * 100 + '%' : 'ยกเว้น'}</td></tr>`).join('')}</table><ul><li>เงินเดือน: หักค่าใช้จ่าย 50% ไม่เกิน 100,000 บาท</li><li>ลดหย่อนส่วนตัว 60,000 · บุตรคนละ 30,000 · เบี้ยประกันชีวิตตามจริง · ประกันสังคม (เงินเดือน) 9,000</li><li>ยื่นช้า: เงินเพิ่ม 1.5% ต่อเดือน (เศษเดือนนับ 1 เดือน) + ค่าปรับ 100 บาท (ไม่เกิน 7 วัน) / 200 บาท (เกิน 7 วัน)</li></ul><p class="soft">อ้างอิง: คู่มือภาษีเงินได้บุคคลธรรมดา กรมสรรพากร (rd.go.th) ตรวจสอบเมื่อ 14 พ.ย. 2569 · กติกาในเกมเป็นแบบย่อ ไม่ใช่คำแนะนำภาษีจริง</p></div>`; return; }
  if (tx.tab === 'me') {
    const inc = hr.base * 12, ex = Math.min(inc / 2, 100000), alw = 60000 + 9000;
    root.innerHTML = tabs + `<div class="pane"><h4>ภาษีเงินได้ของฉัน (ปีนี้)</h4><p>เงินเดือนปัจจุบัน <b>${baht(hr.base)}</b> บาท/เดือน · ลดหย่อน: ส่วนตัว 60,000 + ประกันสังคม 9,000 · ไม่มีภาษีหัก ณ ที่จ่ายเพิ่ม</p>${career.tax.me ? '<b style="color:#2f9d5a">✅ คำนวณถูกต้องแล้ว</b>' : `<form class="tf" autocomplete="off">${inp('inc', 'เงินได้ทั้งปี')}${inp('exp', 'ค่าใช้จ่าย')}${inp('alw', 'ค่าลดหย่อนรวม')}${inp('net', 'เงินได้สุทธิ')}${inp('tax', 'ภาษีทั้งปี')}</form><div class="fb">${tx.msg}</div><button class="btn2 pri" data-tme>ตรวจคำตอบ</button>`}</div>`; return;
  }
  if (!open.some(c => c.id === tx.sel)) tx.sel = open[0]?.id || null; const c = open.find(x => x.id === tx.sel), dl = c && daysLeft(c);
  root.innerHTML = tabs + `<div class="tl"><div class="csl">${open.map(x => `<button data-tcase="${x.id}" class="${x.id === tx.sel ? 'on' : ''}"><b>${esc(x.name)}</b> ${x.kind === 'salary' ? '(เงินเดือน)' : '(ฟรีแลนซ์)'}<small class="${daysLeft(x) < 0 ? 'late' : ''}">${daysLeft(x) < 0 ? `เลยกำหนด ${-daysLeft(x)} วัน` : `เหลือ ${daysLeft(x)} วัน`}</small></button>`).join('') || '<p class="soft">ยื่นครบแล้ว เดี๋ยวมีลูกค้าใหม่</p>'}<button class="btn2 pri" data-trep ${career.tax.filed ? '' : 'disabled'}>📊 สร้างใบสรุปการยื่นภาษี</button></div>
    <div class="csd">${c ? `<div class="frm-t"><b>แบบแสดงรายการภาษีเงินได้บุคคลธรรมดา (จำลอง ภ.ง.ด.90/91)</b><span>ผู้มีเงินได้: ${esc(c.name)} · เลขประจำตัวผู้เสียภาษี ${c.tid}</span></div><table class="ct"><tr><td>ประเภทเงินได้</td><td>${c.kind === 'salary' ? 'เงินเดือน (หักค่าใช้จ่าย 50% ไม่เกิน 100,000)' : 'ฟรีแลนซ์ (ค่าใช้จ่ายจริง ' + baht(c.exp) + ' บาท)'}</td></tr><tr><td>เงินได้ทั้งปี</td><td>${baht(c.income)} บาท</td></tr><tr><td>ค่าลดหย่อน</td><td>${c.allow.map(a => `${esc(a[0])} ${baht(a[1])}`).join(' · ')}</td></tr><tr><td>ภาษีหัก ณ ที่จ่ายแล้ว</td><td>${baht(c.wht)} บาท</td></tr><tr><td>กำหนดยื่น</td><td class="${dl < 0 ? 'late' : ''}">${thDate(c.due, { day: 'numeric', month: 'short', year: 'numeric' })} ${dl < 0 ? '(เลยกำหนดแล้ว!)' : `(เหลือ ${dl} วัน)`}</td></tr></table>
    <form class="tf" autocomplete="off">${inp('inc', 'เงินได้พึงประเมิน')}${inp('exp', 'ค่าใช้จ่าย')}${inp('alw', 'ค่าลดหย่อนรวม')}${inp('net', 'เงินได้สุทธิ')}${inp('tax', 'ภาษีที่คำนวณได้')}${inp('wht', 'ภาษีหัก ณ ที่จ่าย')}${inp('pay', 'ชำระเพิ่ม (+) / ขอคืน (−)')}${inp('ext', 'เงินเพิ่ม + ค่าปรับ', '0 ถ้ายื่นทัน')}</form><div class="fb">${tx.msg}</div><button class="btn2 pri" data-tfile>ยื่นแบบ</button>` : '<p class="soft">ไม่มีลูกค้ารอยื่น</p>'}</div></div>`;
}
const tval = (root, n) => money2(root.querySelector(`[name="${n}"]`)?.value);
function taxSubmit() {
  const root = tx.W.body.firstChild, c = taxOpen().find(x => x.id === tx.sel); if (!c) return;
  const ext = taxPenalty(c), want = { inc: c.income, exp: c.exp, alw: c.alw, net: c.net, tax: c.tax, wht: c.wht, pay: c.pay, ext }, got = {};
  for (const k in want) got[k] = tval(root, k); const keep = got; tx.bad = Object.keys(want).filter(k => !(Math.abs((isNaN(got[k]) ? NaN : got[k]) - want[k]) <= 1.01));
  if (tx.bad.length) { tx.msg = `❌ ยังไม่ถูก ${tx.bad.length} ช่อง (ช่องสีแดง) ลองคำนวณใหม่ตามกฎและอัตรา`; renderTax(); const r2 = tx.W.body.firstChild; for (const k in keep) { const el = r2.querySelector(`[name="${k}"]`); if (el && !isNaN(keep[k])) el.value = keep[k]; } S.tone(300, 200, .15, .08); return; }
  c.done = true; c.late = ext > 0 || dayStart(gnow()) > c.due; career.tax.filed++; if (c.late) career.tax.late++; tx.msg = ''; tx.bad = [];
  S.tone(700, 1200, .12, .08, 'triangle'); S.toast(`ยื่นภาษี ${c.name} สำเร็จ ✅${ext ? ` (จ่ายเงินเพิ่ม+ค่าปรับ ${fmt2(ext)} บาท)` : ''}`, 2.4);
  pushMsg('cust', 'cust', ext ? `ได้รับแล้วค่ะ แต่โดนค่าปรับด้วยเหรอคะ ${fmt2(ext)} บาท 😢` : 'ขอบคุณค่ะ ยื่นทันกำหนดเลย 🙏', 1800);
  if (career.tax.filed >= 2) complete('tx1');
  setTimeout(() => { if (career.id === 'tax' && taxOpen().length < 4) { taxNew(); renderTax(); S.toast('🧾 มีลูกค้าใหม่รอยื่นภาษี', 2); } }, 20000); renderTax();
}
function taxMine() {
  const root = tx.W.body.firstChild, inc = hr.base * 12, ex = Math.min(inc / 2, 100000), alw = 69000, net = Math.max(0, inc - ex - alw), tax = taxOf(net), want = { inc, exp: ex, alw, net, tax }, got = {};
  for (const k in want) got[k] = tval(root, k); tx.bad = Object.keys(want).filter(k => !(Math.abs((isNaN(got[k]) ? NaN : got[k]) - want[k]) <= 1.01));
  if (tx.bad.length) { tx.msg = `❌ ยังไม่ถูก ${tx.bad.length} ช่อง ลองคำนวณใหม่ (เงินเดือนหักค่าใช้จ่าย 50% ไม่เกิน 100,000)`; renderTax(); const r2 = tx.W.body.firstChild; for (const k in got) { const el = r2.querySelector(`[name="${k}"]`); if (el && !isNaN(got[k])) el.value = got[k]; } S.tone(300, 200, .15, .08); return; }
  career.tax.me = true; complete('tx2'); S.jingle(); tx.msg = ''; renderTax();
}
function taxReport() {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), done = career.tax.cases.filter(c => c.done);
  const body = `<h3>ใบสรุปการยื่นภาษี · สำนักงานภาษี ตราสรรพ์</h3><p>วันที่ ${d} · ผู้ยื่น ${esc(chat.account?.name || 'เจ้าหน้าที่ภาษี')}</p><table class="pdft"><tr><th>ลูกค้า</th><th>ภาษีสุทธิ</th><th>ชำระเพิ่ม/ขอคืน</th><th>ล่าช้า</th></tr>${done.map(c => `<tr><td>${esc(c.name)}</td><td style="text-align:right">${fmt2(c.tax)}</td><td style="text-align:right">${fmt2(c.pay)}</td><td>${c.late ? 'ใช่' : '—'}</td></tr>`).join('')}</table><p>ยื่นสำเร็จ ${career.tax.filed} ราย · เลยกำหนด ${career.tax.late} ราย</p>`;
  const f = savePDF(`ใบสรุปการยื่นภาษี-${d}`, body); f.taxReport = { filed: career.tax.filed, late: career.tax.late }; S.toast('ได้ไฟล์ใบสรุปแล้ว ส่งให้พี่แสงเดือนทางแชทได้เลย', 2.6);
}
/* ---- make the window look like an online filing portal ---- */
function rdWrap(root) {
  if (root.querySelector('.rdh')) return; const tabs = root.querySelector('.tabs'); if (!tabs) return; const rest = [...root.children].filter(x => x !== tabs);
  const head = h('div', { class: 'rdh' }, `<span class="crest">🏛️</span><div><b>กรมภาษีน้อย</b><small>ระบบยื่นแบบภาษีออนไลน์ (e-Filing) · จำลองในเกม</small></div><span class="rdu">👤 ${esc(chat.account?.name || 'เจ้าหน้าที่')} · เข้าสู่ระบบแล้ว</span>`);
  tabs.className = 'rdn'; const body = h('div', { class: 'rdb' }); rest.forEach(x => body.append(x));
  const steps = h('div', { class: 'rds' }, '<span class="on">1 ตรวจข้อมูลลูกค้า</span><span class="on">2 กรอกแบบ</span><span>3 ยืนยันและยื่น</span>');
  root.replaceChildren(head, tabs, steps, body, h('div', { class: 'rdf' }, 'หน้าเว็บจำลองเพื่อการเล่นเกมเท่านั้น ไม่ใช่เว็บไซต์ของหน่วยงานจริง'));
}
const _renderTax = renderTax;
renderTax = function () { _renderTax(); if (tx.W && wins.has('taxweb')) rdWrap(tx.W.body.firstChild); };
/* clients nag when a deadline has passed; new clients arrive over time */
setInterval(() => {
  if (career.id !== 'tax') return;
  taxOpen().forEach(c => { if (daysLeft(c) < 0 && !c.nag) { c.nag = true; pushMsg('cust', 'cust', `${c.name} ถามว่ายื่นให้หรือยังคะ เลยกำหนดแล้วนะ จะโดนปรับไหม 😰`, 1200); pushMsg('boss', 'boss', `ลูกค้า ${c.name} เลยกำหนดยื่นแล้วนะ รีบยื่นด่วน เดี๋ยวโดนเงินเพิ่มกับค่าปรับ`, 3000); } });
  if (taxOpen().length < 3) { taxNew(); renderTax(); }
}, 30000);
