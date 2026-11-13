"use strict";
// Office game — เวิร์ดน้อย: a small word processor with templates (report, invitation, partnership letter, trade agreement).
// Documents are ordinary desk files (kind 'worddoc') so they can be attached to mail and saved with the game. Everything is made up.
const WORD_DATE = () => thDate(gnow().getTime(), { day: 'numeric', month: 'long', year: 'numeric' });
const WORD_TPL = [
  { id: 'blank', n: '📄 เอกสารเปล่า (ทำเอง)', d: 'หน้ากระดาษว่าง พิมพ์เองทั้งหมด', f: [], html: () => '<p><br></p>', name: 'เอกสารใหม่' },
  { id: 'report', n: '📊 รายงาน', d: 'รายงานผลการดำเนินงานแบบมีหัวข้อ', name: 'รายงาน',
    f: [['title', 'ชื่อรายงาน', 'รายงานผลการดำเนินงานประจำเดือน'], ['period', 'ช่วงเวลา', 'มกราคม 2569'], ['by', 'ผู้จัดทำ', 'ฝ่ายบัญชี']],
    html: v => `<h1 style="text-align:center">${esc(v.title)}</h1><p style="text-align:center">ประจำ${esc(v.period)}<br>จัดทำโดย ${esc(v.by)} · ${esc(WORD_DATE())}</p>
      <h3>1. สรุปภาพรวม</h3><p><span class="ph">สรุปภาพรวมสั้นๆ 2–3 บรรทัด</span></p><h3>2. ผลการดำเนินงาน</h3><ul><li><span class="ph">รายการที่ทำสำเร็จ</span></li><li><span class="ph">ตัวเลขสำคัญ</span></li></ul>
      <h3>3. ปัญหาและอุปสรรค</h3><p><span class="ph">สิ่งที่ยังติดขัด</span></p><h3>4. ข้อเสนอแนะ</h3><p><span class="ph">แนวทางปรับปรุงเดือนถัดไป</span></p>` },
  { id: 'invite', n: '💌 จดหมายเชิญ', d: 'เชิญลูกค้าหรือคู่ค้าเข้าร่วมงาน', name: 'จดหมายเชิญ',
    f: [['to', 'เรียน', 'คุณลูกค้าที่เคารพ'], ['event', 'ชื่องาน', 'งานเลี้ยงต้อนรับปีใหม่'], ['when', 'วันและเวลา', 'วันศุกร์ที่ 16 มกราคม 2569 เวลา 18:00 น.'], ['place', 'สถานที่', 'ห้องจัดเลี้ยง ชั้น 3 ออฟฟิศเมฆน้อย'], ['from', 'ผู้เชิญ', 'บริษัท เมฆน้อย จำกัด']],
    html: v => `<p style="text-align:right">วันที่ ${esc(WORD_DATE())}</p><p><b>เรื่อง</b> เชิญเข้าร่วม${esc(v.event)}</p><p><b>เรียน</b> ${esc(v.to)}</p>
      <p style="text-indent:2em">ด้วย ${esc(v.from)} มีกำหนดจัด${esc(v.event)} ในวัน<b>${esc(v.when)}</b> ณ ${esc(v.place)} เพื่อแสดงความขอบคุณสำหรับความไว้วางใจที่ท่านมอบให้เสมอมา</p>
      <p style="text-indent:2em">จึงเรียนมาเพื่อโปรดเข้าร่วมงานตามวันและเวลาดังกล่าว หากสะดวกกรุณาตอบรับล่วงหน้าอย่างน้อย 3 วัน</p><p>ขอแสดงความนับถือ</p><p><br></p><p>(.......................................)<br>${esc(v.from)}</p>` },
  { id: 'collab', n: '🤝 หนังสือขอร่วมงานกับบริษัทอื่น', d: 'เสนอความร่วมมือทางธุรกิจ', name: 'ขอร่วมงาน',
    f: [['us', 'บริษัทของเรา', 'บริษัท เมฆน้อย จำกัด'], ['them', 'บริษัทที่ขอร่วมงาน', 'บริษัท แป้งนุ่ม จำกัด'], ['topic', 'เรื่องที่อยากร่วมงาน', 'บริการทำบัญชีและวางระบบเอกสารรายเดือน'], ['offer', 'สิ่งที่เราเสนอ', 'ราคาพิเศษสำหรับลูกค้าใหม่ 3 เดือนแรก'], ['contact', 'ผู้ติดต่อ', 'คุณกุ้ง โทร 000-000-0000 (สมมุติ)']],
    html: v => `<p style="text-align:right">วันที่ ${esc(WORD_DATE())}</p><p><b>เรื่อง</b> ขอเสนอความร่วมมือด้าน${esc(v.topic)}</p><p><b>เรียน</b> กรรมการผู้จัดการ ${esc(v.them)}</p>
      <p style="text-indent:2em">${esc(v.us)} ขอแนะนำตัวว่าเป็นผู้ให้บริการที่มีประสบการณ์ และสนใจเสนอความร่วมมือกับ ${esc(v.them)} ในเรื่อง<b>${esc(v.topic)}</b></p>
      <p style="text-indent:2em">สิ่งที่เราขอเสนอ: <b>${esc(v.offer)}</b> โดยทีมงานพร้อมนัดหมายเพื่อนำเสนอรายละเอียดและตอบข้อสงสัยในวันและเวลาที่ท่านสะดวก</p>
      <p style="text-indent:2em">จึงเรียนมาเพื่อโปรดพิจารณา หากสนใจติดต่อได้ที่ ${esc(v.contact)}</p><p>ขอแสดงความนับถือ</p><p><br></p><p>(.......................................)<br>${esc(v.us)}</p>` },
  { id: 'trade', n: '📜 ข้อตกลงการค้า', d: 'ข้อตกลงซื้อขายสินค้า/บริการ พร้อมช่องลงนาม', name: 'ข้อตกลงการค้า',
    f: [['a', 'ผู้ขาย', 'บริษัท เมฆน้อย จำกัด'], ['b', 'ผู้ซื้อ', 'บริษัท แป้งนุ่ม จำกัด'], ['item', 'สินค้า/บริการ', 'บริการทำบัญชีรายเดือน'], ['amount', 'มูลค่าต่อเดือน (บาท)', '12000'], ['days', 'เครดิต (วัน)', '30']],
    html: v => `<h2 style="text-align:center">ข้อตกลงการค้า</h2><p style="text-align:right">ทำที่ ออฟฟิศเมฆน้อย · วันที่ ${esc(WORD_DATE())}</p>
      <p>ข้อตกลงฉบับนี้ทำขึ้นระหว่าง <b>${esc(v.a)}</b> (“ผู้ขาย”) และ <b>${esc(v.b)}</b> (“ผู้ซื้อ”) โดยมีข้อตกลงดังนี้</p>
      <p><b>ข้อ 1.</b> ผู้ขายตกลงจัดหา<b>${esc(v.item)}</b> ให้แก่ผู้ซื้อตามที่ตกลงกัน</p><p><b>ข้อ 2.</b> ผู้ซื้อตกลงชำระค่าตอบแทนเดือนละ <b>${esc(String(v.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ','))} บาท</b></p>
      <p><b>ข้อ 3.</b> ผู้ซื้อชำระเงินภายใน <b>${esc(v.days)} วัน</b> นับจากวันที่ได้รับใบแจ้งหนี้</p><p><b>ข้อ 4.</b> หากฝ่ายใดประสงค์ยกเลิก ต้องแจ้งอีกฝ่ายเป็นลายลักษณ์อักษรล่วงหน้า 30 วัน</p>
      <p><b>ข้อ 5.</b> ข้อมูลที่ได้รับระหว่างกันเป็นความลับ ไม่เปิดเผยแก่บุคคลภายนอก</p><p><br></p>
      <table style="width:100%;text-align:center"><tr><td>(...........................)<br>ผู้ขาย<br>${esc(v.a)}</td><td>(...........................)<br>ผู้ซื้อ<br>${esc(v.b)}</td></tr></table>
      <p style="color:#999;font-size:11px;margin-top:20px">เอกสารสมมุติในเกม ไม่ใช่สัญญาที่ใช้ได้จริง</p>` },
];
const wordWins = {};
function openWord(f) {
  if (!f) return wordChooser();
  const id = 'word-' + f.id; if (wins.has(id)) { focusWin(wins.get(id)); return; }
  const root = h('div', { class: 'wd' }, `<div class="wtb"><input class="wname" value="${esc(f.name.replace(/\.doc$/, ''))}" spellcheck="false" aria-label="ชื่อไฟล์">
    <button data-wc="bold" title="ตัวหนา (Ctrl+B)"><b>B</b></button><button data-wc="italic" title="ตัวเอียง"><i>I</i></button><button data-wc="underline" title="ขีดเส้นใต้"><u>U</u></button>
    <button data-wc="justifyLeft" title="ชิดซ้าย">⬅</button><button data-wc="justifyCenter" title="กึ่งกลาง">↔</button><button data-wc="justifyRight" title="ชิดขวา">➡</button><button data-wc="insertUnorderedList" title="รายการ">• ≡</button>
    <select data-wsize title="ขนาดตัวอักษร"><option value="">ขนาด</option><option value="2">เล็ก</option><option value="3">ปกติ</option><option value="4">กลาง</option><option value="5">ใหญ่</option><option value="6">ใหญ่มาก</option></select>
    <label class="wcol" title="สีตัวอักษร">A<input type="color" data-wcol value="#d6304f"></label><button data-wc="undo" title="ย้อนกลับ">↶</button><button data-wc="redo" title="ทำซ้ำ">↷</button>
    <span style="flex:1"></span><button class="wsave" data-wsave>💾 บันทึก</button><button data-wdl title="ดาวน์โหลดเป็นไฟล์ .doc (เปิดด้วย Word จริงได้)">⬇ .doc</button></div>
    <div class="wscroll"><div class="wpage" contenteditable="true" spellcheck="false">${f.html}</div></div>`);
  const W = openWin(id, `${f.name} — เวิร์ดน้อย`, root, 640, 480, '#e4edff');
  const page = root.querySelector('.wpage'), save = (quiet) => { f.html = page.innerHTML; f.name = (root.querySelector('.wname').value.trim() || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '') + '.doc'; W.setTitle(`${f.name} — เวิร์ดน้อย`); renderDesktop(); if (!quiet) { S.jingle(); S.toast(`💾 บันทึก "${f.name}" แล้ว (อยู่บนหน้าจอคอม)`, 2); } complete('word'); };
  W.onClose = () => save(true);
  root.addEventListener('pointerdown', e => { if (e.target.closest('.wtb button')) e.preventDefault(); });
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-wc]'); if (c) { page.focus(); document.execCommand(c.dataset.wc); return; }
    if (e.target.closest('[data-wsave]')) { save(false); return; }
    if (e.target.closest('[data-wdl]')) { save(true); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`<html><head><meta charset="utf-8"></head><body style="font-family:Sarabun,Tahoma,sans-serif">${f.html}</body></html>`], { type: 'application/msword' })); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  });
  root.addEventListener('change', e => { if (e.target.matches('[data-wsize]') && e.target.value) { page.focus(); document.execCommand('fontSize', false, e.target.value); e.target.value = ''; } if (e.target.matches('[data-wcol]')) { page.focus(); document.execCommand('foreColor', false, e.target.value); } });
  page.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(false); } });
  setTimeout(() => page.focus(), 60);
}
function wordChooser() {
  const root = h('div', { class: 'wnew' }, '');
  const W = openWin('word-new', 'เวิร์ดน้อย — เอกสารใหม่', root, 560, 460, '#e4edff'); if (W.body.firstChild.dataset.k) { W.body.firstChild.innerHTML = ''; }
  const body = W.body.firstChild; body.dataset.k = 1; body.classList.add('wnew');
  const pick1 = () => { body.innerHTML = `<h3>📝 เลือกแบบเอกสาร</h3><div class="wtpls">${WORD_TPL.map(t => `<button data-wt="${t.id}"><b>${t.n}</b><small>${t.d}</small></button>`).join('')}</div>`; };
  pick1();
  body.onclick = e => {
    const b = e.target.closest('[data-wt]');
    if (b) { const t = WORD_TPL.find(x => x.id === b.dataset.wt); if (!t.f.length) return makeDoc(t, {}, W); body.dataset.t = t.id;
      body.innerHTML = `<h3>${t.n}</h3><p class="note">กรอกข้อมูล แล้วระบบจะใส่ลงเอกสารให้ (แก้ในเอกสารได้อีก)</p><form class="wform">${t.f.map(([k, l, d]) => `<label>${l}<input name="${k}" value="${esc(d)}" spellcheck="false"></label>`).join('')}<div class="acts"><button class="btn2 pri" type="submit">สร้างเอกสาร</button><button class="btn2" type="button" data-wback>← กลับ</button></div></form>`;
      body.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); makeDoc(t, Object.fromEntries(new FormData(ev.target)), W); }); return; }
    if (e.target.closest('[data-wback]')) pick1();
  };
}
function makeDoc(t, v, W) {
  const base = t.name, same = FILES.filter(f => f.kind === 'worddoc' && f.name.startsWith(base)).length;
  const f = { id: 'u' + (++uid), name: `${base}${same ? ' ' + (same + 1) : ''}.doc`, type: 'doc', loc: 'desk', kind: 'worddoc', tpl: t.id, html: t.html(v) };
  FILES.push(f); deskPos[f.id] = firstFree(); renderDesktop(); closeWin('word-new', true); S.tone(700, 1000, .1, .06); openWord(f);
}
