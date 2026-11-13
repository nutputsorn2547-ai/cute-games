"use strict";
// Office game — desk, papers, drawing. Files load in order and share one global scope (see office/index.html).
/* ================= desk ================= */
const desk = $('desk');
const DOCS = [
  { id: 'inv', title: 'ใบแจ้งหนี้ INV-0425', html: `<h2>ใบแจ้งหนี้ เลขที่ INV-0425</h2><p>วันที่ 2 ม.ค. 2569<br>ถึง: บริษัท ขนมอร่อย จำกัด<br>ครบกำหนดชำระ: ภายใน 30 วันนับจากวันที่ออกเอกสาร</p><table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><td>ค่าบริการทำบัญชี</td><td style="text-align:right">8,000.00</td></tr><tr><td>ค่ายื่นแบบภาษี</td><td style="text-align:right">1,500.00</td></tr><tr><td>ภาษีมูลค่าเพิ่ม 7%</td><td style="text-align:right">665.00</td></tr><tr><td><b>รวมทั้งสิ้น</b></td><td style="text-align:right"><b>10,165.00</b></td></tr></table><p>โอนเข้าบัญชีบริษัท แล้วส่งหลักฐานกลับมาทางอีเมล ขอบคุณที่ใช้บริการค่ะ</p>`, x: 20, y: 30, r: -6 },
  { id: 'memo', title: 'บันทึกถึงทีม', html: `<h2>บันทึกถึงทีมบัญชี</h2><p>ทุกคนคะ เดือนนี้ขอให้ส่งใบเสร็จ<b>ก่อนวันที่ 3</b> นะคะ จะได้ปิดงบทัน</p><p>ใครเบิกค่าเดินทาง แนบใบเสร็จแท็กซี่หรือรูปแอปเรียกรถมาด้วย</p><p>วันศุกร์นี้มีขนมเลี้ยง หัวหน้าเลี้ยงเองค่ะ</p><p style="text-align:right">— หัวหน้าแมว</p>`, x: 25, y: 55, r: 4 },
  { id: 'rep', title: 'รายงานยอดขาย', html: `<h2>รายงานยอดขายรายเดือน</h2><div style="display:flex;align-items:flex-end;gap:16px;height:180px;margin:18px 0;border-bottom:2px solid #ccc">${[40, 62, 55, 80, 95, 70].map((v, i) => `<div style="flex:1;height:${v}%;background:${['#ffb3c1', '#ffd27f', '#9fd8ff', '#b8e6a0', '#c7b8ff', '#ffcf9f'][i]};border-radius:8px 8px 0 0"></div>`).join('')}</div><p>ยอดขายสูงสุดอยู่ในเดือนที่ 5 เพราะมีโปรโมชันขนมกลางปี</p><p>ข้อเสนอ: เพิ่มโปรโมชันช่วงปลายปีเพื่อดันยอดขายเดือนที่ 6 ให้กลับขึ้นมา</p>`, x: 66, y: 36, r: -3 },
  { id: 'trip', title: '🎉 ทริปปีใหม่บริษัท', party: true, html: `<h2>🎉 ทริปปีใหม่บริษัท</h2><p>ปีใหม่นี้บริษัทพาเที่ยว <b>2 คืน</b> (30 ธ.ค. – 1 ม.ค.)<br>พนักงาน <b>12 คน</b> พักห้องละ 2 คน = <b>6 ห้อง</b><br>งบค่าที่พักรวมไม่เกิน <b>40,000 บาท</b></p><p><b>สิ่งที่ต้องทำ</b><br>1. หาที่พักในเสิร์ชน้อย (แท็บ "ที่พัก")<br>2. กรอกลงไฟล์ ทริปปีใหม่.xlsx<br>&nbsp;&nbsp;&nbsp;ราคารวม = ราคา/ห้อง/คืน × จำนวนห้อง × จำนวนคืน<br>3. เสนอที่พักในกลุ่มแชท "ทีมบัญชีน่ารัก"<br>4. ส่งไฟล์ ทริปปีใหม่.xlsx ให้หัวหน้าแมวทางแชท</p><p style="text-align:right">— หัวหน้าแมว</p>`, x: 45, y: 56, r: 5 },
  { id: 'acct', title: 'บัญชีแชทน้อย', sticky: true, html: `<h2>บัญชีแชทน้อยของทีม</h2><p>สมัครใหม่ด้วยข้อมูลนี้นะ<br>อีเมล: <b>fahnai@gmail.com</b><br>รหัสผ่าน: <b>12345</b></p><p style="font-size:16px">(ห้ามบอกใครนอกทีมน้า 🤫)</p>`, x: 80, y: 40, r: 6 },
];
const TOOL_ART = {
  pencil: '<svg width="170" height="26" viewBox="0 0 170 26"><path d="M0 13 L24 4 V22 Z" fill="#f1cf9c"/><path d="M0 13 L9 9.6 V16.4 Z" fill="#444"/><rect x="24" y="4" width="114" height="18" fill="#ffd34d"/><rect x="24" y="10" width="114" height="6" fill="#ffe27f"/><rect x="138" y="4" width="12" height="18" fill="#c9c9d1"/><rect x="150" y="4" width="18" height="18" rx="5" fill="#ff9fb0"/></svg>',
  pen: '<svg width="170" height="26" viewBox="0 0 170 26"><path d="M0 13 L16 8 V18 Z" fill="#2b5bd7"/><rect x="16" y="6" width="22" height="14" rx="3" fill="#cfd6e6"/><rect x="38" y="5" width="128" height="16" rx="8" fill="#3d6fe8"/><rect x="100" y="2" width="56" height="5" rx="2" fill="#b9c6e6"/></svg>',
  hl: '<svg width="160" height="34" viewBox="0 0 160 34"><path d="M0 10 L14 6 V28 L0 24 Z" fill="#ffe600"/><rect x="14" y="4" width="34" height="26" rx="3" fill="#fff17a"/><rect x="48" y="2" width="110" height="30" rx="10" fill="#ffd400"/><rect x="60" y="11" width="80" height="12" rx="6" fill="#ffe866"/></svg>',
  eraser: '<svg width="86" height="44" viewBox="0 0 86 44"><rect x="2" y="2" width="82" height="40" rx="8" fill="#fff"/><rect x="2" y="2" width="30" height="40" rx="8" fill="#fff"/><rect x="26" y="2" width="58" height="40" rx="6" fill="#7cc6ff"/><text x="55" y="27" font-size="11" text-anchor="middle" fill="#fff" font-family="Mitr">ยางลบ</text></svg>',
};
const TOOLS = { pencil: { n: 'ดินสอ', c: '#4a4a4a', w: 2.2, a: .92 }, pen: { n: 'ปากกา', c: '#2350c8', w: 2.8, a: 1 }, hl: { n: 'ไฮไลท์', c: '#ffe100', w: 20, a: .38 }, eraser: { n: 'ยางลบ', w: 26 } };
let tool = 'pen';
function deskItem(cls, x, y, r, html, id) { const el = h('div', { class: 'item ' + cls, 'data-id': id }, html); el.style.left = x + '%'; el.style.top = y + '%'; el.style.transform = `rotate(${r}deg)`; desk.append(el); return el; }
for (const d of DOCS) deskItem('', d.x, d.y, d.r, d.sticky ? `<div class="sticky2"><b>บัญชีแชทน้อย</b><br>อีเมล: <b>fahnai@gmail.com</b><br>รหัส: <b>12345</b></div>` : `<div class="doc ${d.party ? 'party' : ''}"><h4>${esc(d.title)}</h4>${'<div class="ln"></div>'.repeat(3)}<div class="ln" style="width:60%"></div>${'<div class="ln"></div>'.repeat(5)}<div class="ln" style="width:40%"></div></div>`, 'doc:' + d.id);
deskItem('', 47, 13, 2, '<div class="nb"><span>สมุดโน้ต</span></div>', 'nb');
deskItem('', 72, 72, -18, TOOL_ART.pencil, 'tool:pencil');
deskItem('', 70, 81, -8, TOOL_ART.pen, 'tool:pen');
deskItem('', 26, 88, 6, TOOL_ART.hl, 'tool:hl');
deskItem('', 89, 62, 12, TOOL_ART.eraser, 'tool:eraser');
deskItem('', 86, 18, 0, '<div class="mug"></div>', 'deco');
deskItem('', 3, 76, 0, '<div class="plant"></div>', 'deco');
{ const s = h('div', { class: 'sticky' }, 'อย่าลืม!<br>ส่งใบแจ้งหนี้ก่อนบ่ายสาม'); s.style.left = '64%'; s.style.top = '13%'; desk.append(s); }
function markInHand() { desk.querySelectorAll('.item').forEach(el => el.classList.toggle('inhand', el.dataset.id === 'tool:' + tool)); }
markInHand();
// desk items: drag to move, click to use
let dItem = null;
desk.addEventListener('pointerdown', e => {
  const it = e.target.closest('.item'); if (!it || it.dataset.id === 'deco') return;
  const r = desk.getBoundingClientRect();
  dItem = { el: it, x0: e.clientX, y0: e.clientY, l: parseFloat(it.style.left) / 100 * r.width, t: parseFloat(it.style.top) / 100 * r.height, moved: false };
  it.classList.add('lift'); it.style.zIndex = ++zTop;
});
addEventListener('pointermove', e => {
  if (!dItem) return; const r = desk.getBoundingClientRect(), dx = e.clientX - dItem.x0, dy = e.clientY - dItem.y0;
  if (Math.hypot(dx, dy) > 5) dItem.moved = true;
  if (dItem.moved) { dItem.el.style.left = clamp((dItem.l + dx) / r.width * 100, -5, 92) + '%'; dItem.el.style.top = clamp((dItem.t + dy) / r.height * 100, 4, 90) + '%'; }
});
addEventListener('pointerup', () => {
  if (!dItem) return; const d = dItem; dItem = null; d.el.classList.remove('lift');
  if (d.moved) { S.noise(.08, 900, .05); return; }
  const id = d.el.dataset.id;
  if (id.startsWith('tool:')) { tool = id.slice(5); markInHand(); S.tone(880, 1100, .05, .07); S.toast(`หยิบ${TOOLS[tool].n}แล้ว · กดที่เอกสารหรือสมุดเพื่อใช้`, 2); }
  else if (id.startsWith('doc:')) openPaper(DOCS.find(x => x.id === id.slice(4)));
  else if (id === 'nb') openNotebook();
  else if (id === 'phone') openPhone();
  else if (id === 'dcal') { setView('screen'); setTimeout(openCal, 400); }
});
$('monEdge').addEventListener('click', () => setView('screen'));

/* ---- paper / notebook overlay with real drawing ---- */
const canvases = new Map(); // key -> offscreen canvas holding the marks
let ov = null, nbPage = 0;
const NB_PAGES = 4, nbText = Array(NB_PAGES).fill('');
function overlay(sheetCls, inner, key, isNb) {
  closeOverlay();
  ov = h('div', { class: 'ov' });
  const sheet = h('div', { class: 'sheet ' + sheetCls }, inner);
  const cv = h('canvas'); sheet.append(cv);
  const tools = h('div', { class: 'tools' });
  for (const k of ['pencil', 'pen', 'hl', 'eraser']) { const b = h('button', { 'data-tool': k }, `<span>${TOOLS[k].n}</span>`); tools.append(b); }
  if (isNb) tools.append(h('button', { 'data-tool': 'type' }, '<span>พิมพ์</span><small>คีย์บอร์ด</small>'));
  tools.append(h('hr'));
  if (isNb) { tools.append(h('button', { 'data-act': 'prev' }, '◀ หน้าก่อน')); tools.append(h('button', { 'data-act': 'next' }, 'หน้าถัดไป ▶')); }
  tools.append(h('button', { 'data-act': 'pin' }, '📌 ถือไว้ข้างจอ'));
  tools.append(h('button', { 'data-act': 'scan' }, '🖨️ สแกนเข้าคอม'));
  tools.append(h('button', { 'data-act': 'close' }, 'วางคืนโต๊ะ'));
  ov.append(sheet, tools); document.body.append(ov);
  // size canvas to the sheet and restore marks
  const r = sheet.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  if (canvases.has(key)) g.drawImage(canvases.get(key), 0, 0, r.width, r.height);
  ov.state = { key, cv, g, sheet, isNb, dpr };
  const ta = sheet.querySelector('textarea');
  if (ta) { ta.value = nbText[nbPage]; ta.addEventListener('input', () => { nbText[nbPage] = ta.value; if (ta.value.trim()) complete('note'); }); }
  tools.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { tool = b.dataset.tool; syncTools(); markInHand(); if (tool === 'type' && ta) ta.focus(); }
    if (b.dataset.act === 'close') closeOverlay();
    if (b.dataset.act === 'pin') { pinCurrent(); return; }
    if (b.dataset.act === 'scan') scanCurrent();
    if (b.dataset.act === 'prev' || b.dataset.act === 'next') { nbPage = clamp(nbPage + (b.dataset.act === 'next' ? 1 : -1), 0, NB_PAGES - 1); openNotebook(); S.noise(.12, 3000, .06, 'highpass'); }
  });
  syncTools(); S.noise(.15, 2500, .07, 'highpass');
}
function syncTools() {
  if (!ov) return; const st = ov.state;
  ov.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
  st.cv.style.pointerEvents = tool === 'type' ? 'none' : 'auto';
  st.cv.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
}
function closeOverlay() {
  if (!ov) return; const st = ov.state;
  // keep marks in an offscreen canvas at css-pixel size
  const keep = document.createElement('canvas'); keep.width = st.cv.width; keep.height = st.cv.height;
  keep.getContext('2d').drawImage(st.cv, 0, 0); canvases.set(st.key, keep);
  ov.remove(); ov = null; if (tool === 'type') tool = 'pen'; markInHand();
}
function openPaper(d) { overlay(d.sticky ? 'stk' : '', `<div class="content">${d.html}</div>`, 'doc:' + d.id, false); ov.state.doc = d; }
function openNotebook() { overlay('nbp', `<div class="pg">หน้า ${nbPage + 1}/${NB_PAGES}</div><textarea spellcheck="false" placeholder="เลือก 'พิมพ์' แล้วพิมพ์จากมือถือหรือคีย์บอร์ดได้เลย"></textarea>`, 'nb:' + nbPage, true); ov.state.nb = nbPage; }
let stroke = null;
document.addEventListener('pointerdown', e => {
  if (!ov || e.target !== ov.state.cv || tool === 'type') return;
  const st = ov.state, r = st.cv.getBoundingClientRect();
  stroke = { pts: [[e.clientX - r.left, e.clientY - r.top]], snap: st.g.getImageData(0, 0, st.cv.width, st.cv.height), r };
  drawStroke();
});
addEventListener('pointermove', e => { if (!stroke || !ov) return; stroke.pts.push([e.clientX - stroke.r.left, e.clientY - stroke.r.top]); drawStroke(); });
addEventListener('pointerup', () => {
  if (!stroke || !ov) { stroke = null; return; }
  const len = stroke.pts.length; stroke = null;
  if (len > 2) { if (ov.state.isNb && tool !== 'eraser') complete('note'); if (!ov.state.isNb && tool === 'hl') complete('hl'); }
});
function drawStroke() {
  const st = ov.state, g = st.g, t = TOOLS[tool], p = stroke.pts;
  g.putImageData(stroke.snap, 0, 0);
  g.save(); g.lineCap = g.lineJoin = 'round'; g.lineWidth = t.w;
  if (tool === 'eraser') { g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; }
  else { g.globalCompositeOperation = tool === 'hl' ? 'multiply' : 'source-over'; g.strokeStyle = t.c; g.globalAlpha = t.a; }
  g.beginPath(); g.moveTo(p[0][0], p[0][1]);
  if (p.length === 1) g.lineTo(p[0][0] + .1, p[0][1]);
  for (let i = 1; i < p.length; i++) { const m = [(p[i - 1][0] + p[i][0]) / 2, (p[i - 1][1] + p[i][1]) / 2]; g.quadraticCurveTo(p[i - 1][0], p[i - 1][1], m[0], m[1]); }
  g.stroke(); g.restore();
  if (tool !== 'hl' && tool !== 'eraser' && p.length % 3 === 0) S.noise(.03, tool === 'pencil' ? 4200 : 2600, .025, 'highpass');
}
