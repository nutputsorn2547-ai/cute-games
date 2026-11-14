"use strict";
// Office game (beta) — audit job: sample vouchers of a client, flag the faulty ones, send the findings report.
const AU_DEF = { ok: 'ปกติ', sum: 'ยอดรวมไม่ตรงรายการ', date: 'วันที่นอกงวดที่ตรวจ', tid: 'ไม่มีเลขผู้เสียภาษี', dup: 'เลขที่เอกสารซ้ำ', appr: 'ไม่มีผู้อนุมัติ' };
const AU_CLIENTS = ['บจก. สยามพลาสติก', 'หจก. ภูผาขนส่ง', 'บจก. ลมทะเลฟู้ด', 'บจก. ดาวเหนือเทรดดิ้ง', 'บจก. รวมใจก่อสร้าง', 'บจก. ฟ้าใสคลินิก'], AU_ITEMS = [['วัสดุสำนักงาน', 1200], ['ค่าขนส่ง', 3500], ['ซ่อมเครื่องจักร', 8800], ['ค่าที่ปรึกษา', 15000], ['ค่าโฆษณา', 6400], ['ค่าไฟฟ้า', 4300]];
const au = { W: null, msg: '', bad: [] };
function auNew() {
  const seq = ++career.au.seq, defs = ['sum', 'date', 'tid', 'dup', 'appr'].sort(() => Math.random() - .5).slice(0, 2 + (Math.random() < .5 ? 1 : 0));
  const v = [], base = 5000 + Math.floor(Math.random() * 90000);
  for (let i = 0; i < 6; i++) { const it = pick(AU_ITEMS), q = 1 + rint(0, 3), price = it[1]; v.push({ no: 'IV' + (base + i * 7), date: `${rint(1, 28)}/${rint(1, 3)}/2569`, party: pick(['บจก. เอบีซี', 'ร้านสมใจ', 'บจก. โปรเฟส', 'หจก. ทองดี']), tid: String(rint(1000000000000, 9999999999999)), desc: it[0], q, price, total: q * price, appr: true, def: 'ok' }); }
  const idx = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - .5);
  defs.forEach((d, k) => { const x = v[idx[k]]; x.def = d; if (d === 'sum') x.total += pick([100, 200, 500, 1000]); if (d === 'date') x.date = `${rint(1, 28)}/${pick([5, 9, 12])}/2569`; if (d === 'tid') x.tid = ''; if (d === 'appr') x.appr = false; if (d === 'dup') { const o = v[idx[(k + 3) % 6]]; if (o.def === 'ok') x.no = o.no; else x.def = 'ok'; } });
  const c = { id: 'A' + String(seq).padStart(2, '0'), name: pick(AU_CLIENTS), v, done: false }; career.au.cases.push(c);
  pushMsg('cust', 'cust', `${c.name} ส่งชุดเอกสารสุ่มตรวจ 6 ใบมาให้แล้วค่ะ รบกวนตรวจงวด ม.ค.–มี.ค. 2569`, 1500); return c;
}
const auOpen = () => career.au.cases.filter(c => !c.done);
CAREERS.au = {
  label: 'ผู้ตรวจสอบบัญชี', co: 'ธรรมนิติ ออดิท แอนด์ คอนซัลท์', e: '🔍', pos: 'ผู้ช่วยผู้สอบบัญชี', color: '#d8f0e6', salary: 38000, where: 'กรุงเทพฯ · ออกตรวจนอกสถานที่', tags: ['ออดิต', 'ตรวจสอบ', 'บัญชี'],
  desc: 'สุ่มตรวจเอกสารของบริษัทลูกค้า หาข้อผิดพลาดในใบกำกับ ใบสำคัญจ่าย แล้วเขียนรายงานผลตรวจให้หัวหน้า ต้องละเอียดและไม่ตื่นเต้นกับตัวเลข',
  need: ['ละเอียดรอบคอบ', 'ตรวจตัวเลขแม่น', 'กล้าชี้ข้อผิดพลาด'], perks: ['ค่าเดินทางออกตรวจ', 'ประกันสุขภาพ', 'ชั่วโมงอบรมผู้สอบบัญชี'],
  people: { boss: { n: 'พี่ธรรม (ผู้สอบบัญชี)', e: '🦉', c: '#cfeedd' }, bear: { n: 'กานต์ (ผู้ช่วยตรวจ)', e: '🐻', c: '#e8cfb4' }, bun: { n: 'มินตรา (QC เอกสาร)', e: '🐰', c: '#ffd6e3' }, duck: { n: 'ป้าสุข (ธุรการ)', e: '🐥', c: '#fff1a8' }, cust: { n: 'ลูกค้าที่ถูกตรวจ', e: '🏢', c: '#dfe9ff' } },
  titles: { g: 'ทีมออดิต ธรรมนิติ', boss: 'พี่ธรรม (ผู้สอบบัญชี)', cust: 'ลูกค้าที่ถูกตรวจ', hr: 'พี่ HR ธรรมนิติ' }, hide: [], docs: false, apps: ['audit'], client: '',
  tasks: [{ id: 'au1', t: 'เปิดแอป 🔍 ตรวจเอกสาร สุ่มตรวจเอกสารลูกค้า 6 ใบ ระบุข้อผิดพลาดให้ถูกต้อง 2 ราย' }, { id: 'au2', t: 'กด “สร้างรายงานผลการตรวจ” ได้ไฟล์ PDF แล้วส่งให้พี่ธรรมทางแชท' }],
  book: '<ul><li>ตรวจทีละใบ: <b>ยอดรวม</b> ต้องเท่ากับ จำนวน × ราคา</li><li><b>วันที่</b> ต้องอยู่ในงวดที่ตรวจ (ม.ค.–มี.ค. 2569)</li><li>ต้องมี <b>เลขผู้เสียภาษี</b> 13 หลัก และ <b>ผู้อนุมัติ</b></li><li><b>เลขที่เอกสาร</b> ห้ามซ้ำกัน (ใบที่ซ้ำให้ระบุทั้งคู่)</li><li>ใบที่ไม่มีปัญหาเลือก “ปกติ” อย่าชี้มั่ว ถ้าชี้ผิดจะไม่ผ่าน</li></ul>',
  start() { career.au = { seq: 0, cases: [], right: 0, wrong: 0 }; ['boss', 'g', 'cust'].forEach(k => chatById(k).msgs.length = 0); pushMsg('boss', 'boss', 'ยินดีต้อนรับสู่ทีมออดิต 🔍 ลูกค้าส่งเอกสารมาให้ตรวจในแอปตรวจเอกสาร เจออะไรผิดปกติให้ระบุให้ตรงจุดนะ', 1500); pushMsg('g', 'bear', 'กานต์เองครับ ถ้าตาลายให้ไล่ทีละช่อง ตัวเลขชอบหลอกตา 😵', 3000); auNew(); auNew(); renderChat(); S.toast('🔍 มีลูกค้ารอตรวจ 2 ราย', 2.4); },
  resume() { if (!career.au || !career.au.cases) career.au = { seq: 0, cases: [], right: 0, wrong: 0 }; },
  boss(c, m) {
    if (m.file) { const f = FILES.find(x => x.id === m.file.id); if (f && f.auReport) { like(c, m, 'boss', 700); complete('au2'); return say(c, 'boss', `ได้รับรายงานแล้ว ตรวจสำเร็จ ${f.auReport.right} ราย พลาด ${f.auReport.wrong} ครั้ง ${f.auReport.wrong ? 'ครั้งหน้าไล่ให้ครบทุกใบนะ' : 'ไม่พลาดเลย เยี่ยม 👏'}`, 1900); } return say(c, 'boss', 'ที่พี่รอคือ “รายงานผลการตรวจ” จากแอปตรวจเอกสารนะ', 1800); }
    say(c, 'boss', pick(['โอเค 👍', 'ละเอียดไว้นะ', 'อย่าเชื่อตัวเลขที่ลูกค้าบวกมาให้', 'ตรวจเลขผู้เสียภาษีด้วย']), 1600);
  },
};
tbButton('audit', '🔍', 'ตรวจเอกสาร', '#2f9d7a', 'au', () => openAudit());
function openAudit() {
  if (au.W && wins.has('audit')) { focusWin(au.W); return au.W; }
  au.W = openWin('audit', 'ตรวจเอกสาร — ธรรมนิติ ออดิท', h('div', { class: 'taxapp' }), 820, 520, '#dff3ea'); au.W.onClose = () => { au.W = null; };
  au.W.body.firstChild.addEventListener('click', e => { if (e.target.closest('[data-auok]')) auSubmit(); if (e.target.closest('[data-aurep]')) auReport(); }); renderAudit(); return au.W;
}
function renderAudit() {
  if (!au.W || !wins.has('audit')) return; const root = au.W.body.firstChild, c = auOpen()[0];
  root.innerHTML = c ? `<div class="soft">ผลงาน: ถูก ${career.au.right} · พลาด ${career.au.wrong} · รอตรวจ ${auOpen().length}</div><h4>ลูกค้า: ${esc(c.name)} · งวดที่ตรวจ ม.ค.–มี.ค. 2569</h4><table class="ct"><tr><th>เลขที่</th><th>วันที่</th><th>คู่ค้า</th><th>เลขผู้เสียภาษี</th><th>รายการ</th><th>จำนวน × ราคา</th><th>ยอดรวม</th><th>อนุมัติ</th><th>ผลตรวจ</th></tr>${c.v.map((x, i) => `<tr class="${au.bad.includes(i) ? 'bad' : ''}"><td>${x.no}</td><td>${x.date}</td><td>${esc(x.party)}</td><td>${x.tid || '—'}</td><td>${esc(x.desc)}</td><td>${x.q} × ${baht(x.price)}</td><td>${baht(x.total)}</td><td>${x.appr ? '✔ ลงนามแล้ว' : '—'}</td><td><select data-i="${i}">${Object.entries(AU_DEF).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></td></tr>`).join('')}</table><div class="fb">${au.msg}</div><button class="btn2 pri" data-auok>ส่งผลตรวจ</button> <button class="btn2" data-aurep ${career.au.right ? '' : 'disabled'}>📊 สร้างรายงานผลการตรวจ</button>` : '<p class="soft">ตรวจครบแล้ว รอลูกค้ารายใหม่</p><button class="btn2" data-aurep>📊 สร้างรายงานผลการตรวจ</button>';
}
function auSubmit() {
  const root = au.W.body.firstChild, c = auOpen()[0]; if (!c) return; au.bad = [];
  c.v.forEach((x, i) => { if ((root.querySelector(`select[data-i="${i}"]`).value) !== x.def) au.bad.push(i); });
  if (au.bad.length) { career.au.wrong++; au.msg = `❌ ยังไม่ถูก ${au.bad.length} ใบ (แถวสีแดง) ตรวจอีกรอบ`; const keep = [...root.querySelectorAll('select')].map(s => s.value); renderAudit(); au.W.body.firstChild.querySelectorAll('select').forEach((s, i) => s.value = keep[i]); S.tone(300, 200, .15, .08); return; }
  c.done = true; career.au.right++; au.msg = ''; S.tone(700, 1200, .12, .08, 'triangle'); S.toast(`ตรวจ ${c.name} ถูกต้อง ✅`, 2); if (career.au.right >= 2) complete('au1');
  setTimeout(() => { if (career.id === 'au' && !auOpen().length) { auNew(); renderAudit(); } }, 15000); renderAudit();
}
function auReport() {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), done = career.au.cases.filter(c => c.done);
  const f = savePDF(`รายงานผลการตรวจ-${d}`, `<h3>รายงานผลการตรวจสอบเอกสาร · ธรรมนิติ ออดิท</h3><p>วันที่ ${d} · ผู้ตรวจ ${esc(chat.account?.name || 'ผู้ช่วยผู้สอบบัญชี')}</p><table class="pdft"><tr><th>ลูกค้า</th><th>ข้อผิดพลาดที่พบ</th></tr>${done.map(c => `<tr><td>${esc(c.name)}</td><td>${c.v.filter(x => x.def !== 'ok').map(x => `${x.no}: ${AU_DEF[x.def]}`).join('<br>')}</td></tr>`).join('')}</table><p>ตรวจสำเร็จ ${career.au.right} ราย · พลาด ${career.au.wrong} ครั้ง</p>`);
  f.auReport = { right: career.au.right, wrong: career.au.wrong }; S.toast('ได้ไฟล์รายงานแล้ว ส่งให้พี่ธรรมทางแชทได้เลย', 2.6);
}
setInterval(() => { if (career.id === 'au' && !auOpen().length) { auNew(); renderAudit(); } }, 45000);
