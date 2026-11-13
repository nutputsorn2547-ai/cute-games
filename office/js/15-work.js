"use strict";
// Office game — work program, borrowing, junior. Files load in order and share one global scope (see office/index.html).
/* ================= customer documents + work program ================= */
const CDOCS = {
  c1: { name: 'ใบแจ้งหนี้-แป้งนุ่ม.pdf', dt: 'ใบแจ้งหนี้', no: 'IV2601-015', date: [2, 1, 2569], party: 'บริษัท แป้งนุ่ม จำกัด', key: 'แป้งนุ่ม', lines: [['แป้งเค้กพิเศษ 20 ถุง', 12000], ['ภาษีมูลค่าเพิ่ม', 840]], total: 12840 },
  c2: { name: 'ใบเสร็จ-เครื่องเขียนดาวเรือง.pdf', dt: 'ใบเสร็จรับเงิน', no: 'RC-0089', date: [1, 1, 2569], party: 'ร้านเครื่องเขียนดาวเรือง', key: 'ดาวเรือง', lines: [['กระดาษ A4 5 รีม', 650], ['ปากกาเจล 2 กล่อง', 600]], total: 1250 },
  c3: { name: 'บิลค่าน้ำมัน-ปั๊มใจดี.pdf', dt: 'ค่าใช้จ่าย', no: 'FL-77120', date: [2, 1, 2569], party: 'ปั๊มน้ำมันใจดี', key: 'ใจดี', lines: [['น้ำมันรถส่งของ', 2000]], total: 2000 },
  c4: { name: 'ใบเสร็จ-ค่าเช่าร้าน.pdf', dt: 'ใบเสร็จรับเงิน', no: '001/2569', date: [8, 1, 2569], party: 'นายสมชาย ใจกว้าง', key: 'สมชาย', lines: [['ค่าเช่าหน้าร้าน เดือน ม.ค.', 15000]], total: 15000 },
  c5: { name: 'ค่าไฟร้าน-มค.pdf', dt: 'ค่าใช้จ่าย', no: 'E-260108', date: [8, 1, 2569], party: 'การไฟฟ้าเมืองน้อย', key: 'ไฟฟ้าเมืองน้อย', lines: [['ค่าไฟฟ้าหน้าร้าน', 3420.5]], total: 3420.5 },
};
const DESK_CDOC = { inv: { dt: 'ใบแจ้งหนี้', no: 'INV-0425', date: [2, 1, 2569], party: 'บริษัท ขนมอร่อย จำกัด', key: 'ขนมอร่อย', total: 10165 } };
const DT_TYPES = ['ใบแจ้งหนี้', 'ใบเสร็จรับเงิน', 'ค่าใช้จ่าย'];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const m2 = n => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function cdocHTML(d) {
  return `<div class="paper"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><b style="font-size:15px">${esc(d.party)}</b><br><small style="color:#888">ผู้ออกเอกสาร</small></div><div style="text-align:right"><b style="font-size:18px;color:#5a78e6">${esc(d.dt)}</b><br>เลขที่ <b>${esc(d.no)}</b><br>วันที่ ${d.date[0]} ${TH_MON[d.date[1] - 1]} ${d.date[2]}</div></div>
    <p style="margin:10px 0 6px">ถึง: ร้านขนมอร่อย (ลูกค้าของเรา)</p><table><tr><th>รายการ</th><th>จำนวนเงิน</th></tr>${d.lines.map(l => `<tr><td>${esc(l[0])}</td><td>${m2(l[1])}</td></tr>`).join('')}<tr><th>รวมทั้งสิ้น</th><th>${m2(d.total)}</th></tr></table><p style="color:#aaa;font-size:11px;margin-top:10px">เอกสารสมมติในเกม</p></div>`;
}
function downloadChatFile(id) {
  const d = CDOCS[id]; if (!d) return;
  const ex = FILES.find(f => f.id === id);
  if (ex && ex.loc !== 'trash') { S.toast(`ดาวน์โหลด "${ex.name}" ไว้แล้ว (โฟลเดอร์ ${FOLDERS.find(x => x.id === ex.loc)?.name || 'หน้าจอ'})`, 2); return; }
  if (ex) { ex.loc = 'down'; } else FILES.push({ id, name: d.name, type: 'pdf', kind: 'cdoc', fields: d, html: cdocHTML(d), loc: 'down' });
  renderDesktop(); renderWork(); S.tone(400, 900, .2, .07, 'triangle'); S.toast(`ดาวน์โหลด "${d.name}" ไว้ในโฟลเดอร์ ดาวน์โหลด แล้ว · เปิดในโปรแกรมบัญชีน้อยได้เลย`, 2.6);
}
const work = { W: null, sel: null, entries: {}, right: 0 };
function openWork() {
  if (work.W && wins.has('work')) { focusWin(work.W); return work.W; }
  const root = h('div', { class: 'wk' }, `<div class="wl"><div class="docs"></div><div class="dv"></div></div><div class="wr"><div class="wh">📒 บันทึกเอกสาร <span class="pend" style="float:right;color:#e0457b;font-weight:400"></span></div><form class="wf" autocomplete="off"></form><div class="ent"></div></div>`);
  work.W = openWin('work', 'บัญชีน้อย — โปรแกรมบันทึกเอกสาร', root, 860, 500, '#e3eaff'); work.W.work = true; work.W.onClose = () => { work.W = null; }; work.W.body.style.overflow = 'hidden';
  root.addEventListener('click', e => { const b = e.target.closest('[data-wdoc]'); if (b) { work.sel = b.dataset.wdoc; renderWork(); } });
  root.querySelector('.wf').addEventListener('submit', e => { e.preventDefault(); saveEntry(); });
  root.querySelector('.wf').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); const ins = [...root.querySelectorAll('.wf input,.wf select')], i = ins.indexOf(e.target); if (i < ins.length - 1) ins[i + 1].focus(); else saveEntry(); } });
  renderWork(); return work.W;
}
const workDocs = () => FILES.filter(f => f.kind === 'cdoc' && f.loc !== 'trash');
function workPick(f) { if (!f || f.kind !== 'cdoc') { S.toast('ไฟล์นี้ไม่ใช่เอกสารลูกค้า (ใบแจ้งหนี้ / ใบเสร็จ / ค่าใช้จ่าย)', 2); return; } openWork(); work.sel = f.id; renderWork(); }
function renderWork() {
  if (!work.W) return; const root = work.W.body.firstChild, docs = workDocs();
  if (!docs.some(f => f.id === work.sel)) work.sel = docs.find(f => !work.entries[f.id])?.id || docs[0]?.id || null;
  const f = docs.find(x => x.id === work.sel), en = f && work.entries[f.id];
  root.querySelector('.docs').innerHTML = docs.length ? docs.map(x => `<button data-wdoc="${x.id}" class="${x.id === work.sel ? 'on' : ''}">${work.entries[x.id] ? '✅' : '📄'} ${esc(x.name)}</button>`).join('') : '<span style="color:var(--soft)">ยังไม่มีเอกสาร</span>';
  root.querySelector('.dv').innerHTML = f ? f.html : '<div class="paper" style="color:var(--soft)">ดาวน์โหลดเอกสารจากแชท "ลูกค้า: ร้านขนมอร่อย" หรือสแกนเอกสารบนโต๊ะเข้าคอม แล้วลากไฟล์มาวางที่โปรแกรมนี้ หรือกดเลือกด้านบน</div>';
  const fm = root.querySelector('.wf');
  fm.innerHTML = !f ? '' : `<label>ประเภท</label><select name="dt" ${en ? 'disabled' : ''}><option value="">— เลือก —</option>${DT_TYPES.map(t => `<option ${en && en.dt === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <label>เลขที่เอกสาร</label><input name="no" type="text" spellcheck="false" ${en ? `value="${esc(en.no)}" disabled` : ''}>
    <label>วันที่</label><input name="date" type="text" placeholder="วว/ดด/ปปปป" ${en ? `value="${esc(en.date)}" disabled` : ''}>
    <label>คู่ค้า</label><input name="party" type="text" spellcheck="false" ${en ? `value="${esc(en.party)}" disabled` : ''}>
    <label>ยอดรวม (บาท)</label><input name="total" type="text" inputmode="decimal" ${en ? `value="${esc(en.total)}" disabled` : ''}>
    <span></span>${en ? '<b style="color:#2f9d5a">✅ บันทึกถูกต้องแล้ว</b>' : '<button class="btn2 pri" type="submit">💾 บันทึกรายการ</button>'}<span></span><small class="msg" style="color:#e0457b"></small>`;
  const pend = sentDocs().filter(id => !work.entries[id]).length; root.querySelector('.pend').textContent = pend ? `ลูกค้าส่งมารอบันทึก ${pend} ใบ` : 'บันทึกครบแล้ว 🎉';
  const rows = Object.values(work.entries);
  root.querySelector('.ent').innerHTML = `<table><tr><th>วันที่</th><th>ประเภท</th><th>เลขที่</th><th>คู่ค้า</th><th style="text-align:right">ยอด</th></tr>${rows.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.dt)}</td><td>${esc(r.no)}</td><td>${esc(r.party)}</td><td style="text-align:right">${m2(money2(r.total))}</td></tr>`).join('') || '<tr><td colspan="5" style="color:var(--soft)">ยังไม่มีรายการ</td></tr>'}</table><div style="padding:6px 8px;color:var(--soft)">บันทึกแล้ว ${rows.length} รายการ · รวม ${m2(rows.reduce((s, r) => s + money2(r.total), 0))} บาท</div>`;
}
const money2 = v => { const n = parseFloat(String(v || '').replace(/[,\s฿]/g, '')); return isFinite(n) ? n : NaN; };
function dateOk(s, d) {
  const m = String(s).match(/(\d{1,2})\D+(\d{1,2})(?:\D+(\d{2,4}))?/); if (!m) return false;
  if (+m[1] !== d[0] || +m[2] !== d[1]) return false; if (!m[3]) return true;
  return [String(d[2]), String(d[2] - 543), String(d[2]).slice(2), String(d[2] - 543).slice(2)].includes(m[3]);
}
function saveEntry() {
  const fm = work.W.body.querySelector('.wf'), f = workDocs().find(x => x.id === work.sel); if (!f) return;
  const d = f.fields, v = { dt: fm.dt.value, no: fm.no.value.trim(), date: fm.date.value.trim(), party: fm.party.value.trim(), total: fm.total.value.trim() };
  const ok = { dt: v.dt === d.dt, no: v.no.replace(/\s/g, '').toUpperCase() === d.no.toUpperCase(), date: dateOk(v.date, d.date), party: v.party.length >= 3 && (v.party.includes(d.key) || d.party.includes(v.party)), total: Math.abs(money2(v.total) - d.total) < .01 };
  for (const k in ok) fm[k].classList.toggle('bad', !ok[k]);
  const bad = Object.keys(ok).filter(k => !ok[k]);
  if (bad.length) { fm.querySelector('.msg').textContent = `ยังไม่ตรงกับเอกสาร ${bad.length} ช่อง (ช่องสีแดง) ลองเทียบกับเอกสารด้านซ้ายอีกที`; S.tone(300, 200, .15, .08); return; }
  work.entries[f.id] = v; work.right++; S.tone(700, 1200, .12, .08, 'triangle'); S.toast(`บันทึก ${d.dt} ${d.no} แล้ว ✅`, 1.8);
  if (work.right >= 3) complete('work');
  if (['c1', 'c2', 'c3'].every(id => work.entries[id]) && !work.batch1) { work.batch1 = true; pushMsg('cust', 'cust', 'ได้รับรายงานแล้วค่ะ บันทึกไวมาก ขอบคุณนะคะ 🙏', 2500); pushMsg('boss', 'boss', 'ลูกค้าร้านขนมอร่อยชมว่าบันทึกเอกสารไวมาก เก่งมาก 👍', 4500); }
  work.sel = null; renderWork();
}
FIRE.batch2 = () => {
  pushMsg('cust', 'cust', 'สวัสดีค่ะ ส่งเอกสารเพิ่มอีก 2 ใบนะคะ 🙏', 1200);
  ['c4', 'c5'].forEach((id, i) => pushMsg('cust', 'cust', '📎 ' + CDOCS[id].name, 2600 + i * 1300, { file: { id, name: CDOCS[id].name, type: 'pdf' } }));
};
addEvent(bank.start + 7 * DAY, '📨', 'ลูกค้าส่งเอกสารเพิ่ม', 'batch2');
/* ---- new random customer documents every working day ---- */
const SUPPLIERS = [
  { dt: 'ใบแจ้งหนี้', party: 'บริษัท แป้งนุ่ม จำกัด', key: 'แป้งนุ่ม', pre: 'IV', items: [['แป้งเค้กพิเศษ', 'ถุง', 450, 650], ['น้ำตาลทรายละเอียด', 'กระสอบ', 900, 1200]], vat: 1 },
  { dt: 'ใบแจ้งหนี้', party: 'บริษัท เนยหอมฟาร์ม จำกัด', key: 'เนยหอม', pre: 'INV', items: [['เนยสดจืด', 'ก้อน', 180, 260], ['วิปปิ้งครีม', 'กล่อง', 120, 190]], vat: 1 },
  { dt: 'ใบแจ้งหนี้', party: 'บริษัท บรรจุภัณฑ์น่ารัก จำกัด', key: 'บรรจุภัณฑ์น่ารัก', pre: 'BL', items: [['กล่องเค้ก 1 ปอนด์', 'ใบ', 12, 18], ['ถุงกระดาษหูหิ้ว', 'ใบ', 5, 9]], vat: 1 },
  { dt: 'ใบเสร็จรับเงิน', party: 'ร้านเครื่องเขียนดาวเรือง', key: 'ดาวเรือง', pre: 'RC-', items: [['กระดาษ A4', 'รีม', 120, 140], ['ปากกาเจล', 'กล่อง', 250, 320]] },
  { dt: 'ใบเสร็จรับเงิน', party: 'ร้านไข่ไก่สดป้าศรี', key: 'ป้าศรี', pre: 'NO.', items: [['ไข่ไก่เบอร์ 1', 'แผง', 110, 135]] },
  { dt: 'ใบเสร็จรับเงิน', party: 'ร้านซ่อมแอร์เย็นใจ', key: 'เย็นใจ', pre: 'SV', items: [['ล้างแอร์หน้าร้าน', 'เครื่อง', 500, 800]] },
  { dt: 'ค่าใช้จ่าย', party: 'ปั๊มน้ำมันใจดี', key: 'ใจดี', pre: 'FL-', items: [['น้ำมันรถส่งของ', 'ครั้ง', 500, 1500]] },
  { dt: 'ค่าใช้จ่าย', party: 'ไรเดอร์ส่งด่วนเมืองน้อย', key: 'ส่งด่วน', pre: 'DL', items: [['ค่าส่งเค้กให้ลูกค้า', 'เที่ยว', 60, 150]] },
  { dt: 'ค่าใช้จ่าย', party: 'ตลาดสดเมืองน้อย', key: 'ตลาดสด', pre: 'MK', items: [['ผลไม้แต่งหน้าเค้ก', 'ชุด', 300, 900]] },
];
let cdSeq = 100;
const sentDocs = () => [...new Set(chatById('cust').msgs.filter(m => m.file).map(m => m.file.id))];
const rint = (a, b) => Math.round(a + Math.random() * (b - a));
function makeDoc(day) {
  const sp = pick(SUPPLIERS), dt = new Date(day - (Math.random() < .4 ? DAY : 0) + 3600000), lines = [];
  for (const [n, u, a, b] of sp.items) if (lines.length === 0 || Math.random() < .6) { const q = ['ครั้ง', 'เที่ยว', 'ชุด'].includes(u) ? 1 : u === 'เครื่อง' ? rint(1, 3) : rint(2, 20), p = rint(a, b); lines.push([`${n} ${q > 1 ? q + ' ' + u : ''}`.trim(), q * p]); }
  const sub = lines.reduce((s, l) => s + l[1], 0); if (sp.vat) lines.push(['ภาษีมูลค่าเพิ่ม', Math.round(sub * 7) / 100]);
  const total = Math.round(lines.reduce((s, l) => s + l[1], 0) * 100) / 100, seq = ++cdSeq, by = dt.getFullYear() + 543;
  const no = sp.pre === 'IV' || sp.pre === 'INV' ? `${sp.pre}${String(by).slice(2)}${p2(dt.getMonth() + 1)}-${String(seq).padStart(3, '0')}` : `${sp.pre}${String(seq * 7 + 1000)}`;
  const d = { name: `${sp.dt === 'ใบแจ้งหนี้' ? 'ใบแจ้งหนี้' : sp.dt === 'ใบเสร็จรับเงิน' ? 'ใบเสร็จ' : 'ค่าใช้จ่าย'}-${sp.key}-${seq}.pdf`, dt: sp.dt, no, date: [dt.getDate(), dt.getMonth() + 1, by], party: sp.party, key: sp.key, lines, total };
  const id = 'cd' + seq; CDOCS[id] = d; return id;
}
function dailyDocs(day) {
  const wd = new Date(day).getDay(); if (day <= bank.start || wd === 0 || wd === 6 || (DAYPLAN.chats.cust || 1) > unlockedDay) return;
  const n = Math.random() < .25 ? 3 : Math.random() < .55 ? 2 : 1, ids = Array.from({ length: n }, () => makeDoc(day));
  pushMsg('cust', 'cust', pick(['สวัสดีค่ะ เอกสารวันนี้ส่งมาให้นะคะ 🙏', `วันนี้มี ${n} ใบค่ะ ฝากด้วยนะคะ`, 'ส่งบิลของวันนี้ค่ะ ขอบคุณค่ะ 😊', 'มีเอกสารใหม่มาแล้วค่ะ 📄']), 900);
  ids.forEach((id, i) => pushMsg('cust', 'cust', '📎 ' + CDOCS[id].name, 1800 + i * 900, { file: { id, name: CDOCS[id].name, type: 'pdf' } }));
  const pending = sentDocs().filter(id => !work.entries[id]).length;
  if (pending >= 8 && !work.nagged) { work.nagged = true; pushMsg('boss', 'boss', `เอกสารลูกค้าร้านขนมอร่อยค้างบันทึก ${pending} ใบแล้วนะ รีบเคลียร์ด้วย 😾`, 4000); }
  if (pending < 5) work.nagged = false;
}
PERSONAL.cust = (c, m) => {
  const t = m.text || '';
  if (m.file) return say(c, 'cust', 'ได้รับไฟล์แล้วค่ะ ขอบคุณนะคะ 😊', 1600);
  if (/ขอบคุณ|ได้รับ|โอเค|ครับ|ค่ะ/.test(t)) return say(c, 'cust', 'ขอบคุณค่ะ ฝากด้วยนะคะ 🙏', 1500);
  if (/ขาด|ไม่ครบ|เพิ่ม|ส่ง/.test(t)) return say(c, 'cust', 'เดี๋ยวพรุ่งนี้ส่งเพิ่มให้นะคะ ถ้ามีเอกสารใหม่ 📄', 1600);
  say(c, 'cust', pick(['ค่ะ 😊', 'รบกวนด้วยนะคะ', 'ถ้าบันทึกเสร็จบอกด้วยนะคะ']), 1500);
};

/* ================= borrowing money from people in chat ================= */
const debts = {};
const chatOf = k => ({ fon: 'gang', mint: 'gang', bun: 'g', duck: 'g' })[k] || k;
const LEND = {
  mom: [.9, 10000, 'ได้สิลูก แม่โอนให้แล้วนะ ไม่ต้องรีบคืน ❤️', 'ช่วงนี้แม่ก็ตึงๆ ลูก ขอโทษนะ 🥲'], dad: [.65, 8000, 'โอนให้แล้ว ใช้ดีๆ นะลูก 👍', 'พ่อขอคิดดูก่อนนะ… ตอนนี้ยังไม่ได้ลูก'],
  sis: [.2, 500, 'ให้ได้แค่นี้นะพี่ ค่าขนมหนูเอง 🥺', 'หนูยังไม่มีเงินเลยพี่ 😭 พี่ต่างหากต้องให้หนู'], bro: [.5, 5000, 'เอาไป แต่คืนด้วยนะเว้ย 😎', 'ไม่มีว่ะ เพิ่งซื้อเกมไป 555'],
  fon: [.5, 3000, 'ได้แก โอนให้แล้ว ต้นเดือนคืนนะ 💸', 'สิ้นเดือนแล้วแก ฉันก็แห้ง 🥲'], mint: [.45, 3000, 'โอนให้แล้ว เลี้ยงชานมแทนดอกเบี้ยนะ 🧋', 'ไม่ไหวแก บัตรเครดิตเต็ม 😵'],
  bear: [.4, 2000, 'ได้ครับพี่ โอนแล้ว 🐻', 'ขอโทษครับพี่ ผมก็ยืมคนอื่นอยู่ 😅'], bun: [.5, 4000, 'ได้จ้า โอนแล้วนะ 🐰', 'พี่ไม่สะดวกนะช่วงนี้ ขอโทษน้า'],
  duck: [.35, 1000, 'ได้ๆ แต่มีแค่นี้นะ 🐥', 'เป็ดน้อยไม่มีตังค์ ก๊าบ 😭'], boss: [.3, 5000, 'ได้ เดี๋ยวพี่โอนให้ คืนเมื่อสะดวกนะ 😺', 'ยืมเงินหัวหน้าไม่ได้นะ ไปดูสินเชื่อในแอปธนาคารเถอะ 😹'],
  jib: [.3, 1000, 'หนูมีแค่นี้ค่ะพี่ 🥺 เอาไปก่อนเลย', 'หนูเพิ่งเริ่มงาน ยังไม่ได้เงินเดือนเลยค่ะพี่ 😭'],
};
function borrowAsk(c, m) {
  const who = c.group ? pick(c.members.filter(k => LEND[k])) : c.id, L = LEND[who];
  if (!L) return say(c, c.members[0], 'เรื่องเงินไม่สะดวกนะ ขอโทษด้วย 🙏', 1600);
  const n = money2((m.text.match(/[\d,]+(\.\d+)?/) || [''])[0]);
  if (!(n > 0)) return say(c, who, 'จะยืมเท่าไรเหรอ? พิมพ์จำนวนเงินมาด้วยนะ 💬', 1500);
  complete('borrow');
  if (Math.random() > L[0]) return say(c, who, L[3], 1800);
  const give = Math.min(Math.round(n), L[1]);
  say(c, who, L[2] + (give < n ? ` (ให้ได้ ${baht(give)} บาทนะ)` : ` (${baht(give)} บาท)`), 1800);
  setTimeout(() => { bankTx(`🤝 ยืมจาก${PEOPLE[who].n}`, give); debts[who] = (debts[who] || 0) + give; renderBank(); S.toast(`🏦 เงินเข้า ${baht(give)} บาท จาก${PEOPLE[who].n}`, 2); }, 1900);
}

/* ================= junior colleague asks every 3 game hours ================= */
const jr = { slot: 0, cur: null, tries: 0, right: 0, used: [] };
const JQ = [
  { q: 'พี่คะ ไฟล์ค่าใช้จ่าย.xlsx ถ้าจะรวมยอดใช้สูตรอะไรคะ', ok: t => /sum/i.test(t), a: '=SUM(B2:B6)' },
  { q: 'ใบเสร็จที่ลูกค้าส่งมา ต้องเก็บไว้โฟลเดอร์ไหนคะ', ok: t => /บัญชี/.test(t), a: 'โฟลเดอร์ "บัญชี"' },
  { q: 'งบค่าที่พักทริปปีใหม่ได้เท่าไรคะพี่', ok: t => /40,?000|สี่หมื่น|4\s*หมื่น/.test(t), a: '40,000 บาท' },
  { q: 'ห้องละ 1,900 บาท 6 ห้อง 2 คืน รวมเท่าไรคะ หนูคิดไม่ทัน 😵', ok: t => /22,?800/.test(t), a: '22,800 บาท' },
  { q: 'ในตารางคำนวณ ทำตัวหนากดอะไรคะ', ok: t => /ctrl|ปุ่ม\s*b|\bb\b|ตัวหนา/i.test(t), a: 'Ctrl+B หรือปุ่ม B บนแถบเครื่องมือ' },
  { q: 'สูตรหาค่าเฉลี่ยในตารางคำนวณคืออะไรคะ', ok: t => /average/i.test(t), a: '=AVERAGE(…)' },
  { q: 'เอกสารประชุมต้องใส่โฟลเดอร์ไหนคะพี่', ok: t => /เอกสารประชุม/.test(t), a: 'โฟลเดอร์ "เอกสารประชุม"' },
  { q: 'ถ้าจะให้น้องเอไอทำสรุปทริป ต้องลากไฟล์อะไรบ้างคะ', ok: t => /เทมเพลต|template/i.test(t), a: 'เทมเพลตสรุปทริป + ทริปปีใหม่.xlsx + ไฟล์ข้อมูลที่พัก' },
  { q: 'เอกสารที่ลูกค้าส่งมา ต้องไปกรอกในโปรแกรมไหนคะ', ok: t => /บัญชีน้อย/.test(t), a: 'โปรแกรมบัญชีน้อย' },
  { q: 'อีเมลที่ใช้สมัครแชทน้อย ต้องลงท้ายด้วยอะไรคะพี่ 🥲', ok: t => /mewnoi\.test/i.test(t), a: '@mewnoi.test (อีเมลสมมุติในเกม)' },
  { q: 'ใบแจ้งหนี้ INV-0425 บนโต๊ะ ยอดรวมเท่าไรคะพี่', ok: t => /10,?165/.test(t), a: '10,165 บาท' },
  { q: 'เงินเดือนออกวันที่เท่าไรคะพี่ 🥺', ok: t => /25/.test(t), a: 'วันที่ 25' },
];
function juniorAsk() {
  const c = chatById('jib'); if (!c || c.hidden) return;
  if (jr.cur !== null) pushMsg('jib', 'jib', 'พี่ยุ่งอยู่ใช่ไหมคะ 🥲 ไม่เป็นไรค่ะ งั้นหนูถามข้อใหม่นะคะ', 400);
  if (jr.used.length >= JQ.length) jr.used = [];
  const free = JQ.map((x, i) => i).filter(i => !jr.used.includes(i)), i = pick(free); jr.used.push(i); jr.cur = i; jr.tries = 0;
  const hh = gHour(), late = hh >= 21 || hh < 7;
  pushMsg('jib', 'jib', (late ? 'ขอโทษที่ทักดึกนะคะ 🙏 ' : '') + JQ[i].q, 1500);
}
PERSONAL.jib = (c, m) => {
  const t = m.text || '';
  if (jr.cur === null) { if (m.img) return say(c, 'jib', 'น่ารักจังค่ะพี่ 🥰', 1500); return say(c, 'jib', pick(['ค่ะพี่ 😊', 'ขอบคุณที่ใจดีกับหนูนะคะ 🐣', 'เดี๋ยวมีอะไรหนูจะถามอีกนะคะ']), 1500); }
  const Q = JQ[jr.cur];
  if (/ไม่รู้|ไม่แน่ใจ|ไม่ทราบ/.test(t)) { jr.cur = null; return say(c, 'jib', `ไม่เป็นไรค่ะ เดี๋ยวหนูไปถามหัวหน้าแมว 🐱 (หัวหน้าบอกว่า: ${Q.a})`, 1800); }
  if (Q.ok(t)) { jr.cur = null; jr.right++; like(c, m, 'jib', 600); say(c, 'jib', pick(['ขอบคุณค่ะพี่ 🙏 เข้าใจแล้ว', 'โอ้ พี่เก่งมากเลยค่ะ ขอบคุณนะคะ ✨', 'จดไว้แล้วค่ะ ขอบคุณค่ะพี่ 📝']), 1600); if (jr.right >= 3) complete('junior'); return; }
  jr.tries++;
  if (jr.tries >= 2) { jr.cur = null; return say(c, 'jib', `เอ๊ะ หนูไปถามหัวหน้ามา หัวหน้าบอกว่า ${Q.a} ค่ะ 😅 ขอบคุณนะคะพี่`, 1800); }
  say(c, 'jib', 'เอ๊ะ หนูว่าไม่น่าใช่นะคะ 🤔 ลองดูอีกทีได้ไหมคะ', 1600);
};
