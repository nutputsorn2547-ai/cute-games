"use strict";
// Office game — spreadsheet. Files load in order and share one global scope (see office/index.html).
/* ================= spreadsheet ================= */
const COLS = 'ABCDEFGHIJKL', ROWS = 30, DEFW = 92;
const FILLS = ['', '#fff3a8', '#ffd6e0', '#cdeffd', '#d4f5d4', '#e6dcff'], INKS = ['#3a3245', '#e0457b', '#2f6fd6', '#2f9d5a'];
function newBook(cells, fmt = {}, extra = {}) { const B = { cells: { ...cells }, fmt: JSON.parse(JSON.stringify(fmt)), colW: {}, sel: 'A1', anchor: 'A1', ...extra }; B.saved = snap(B); return B; }
const snap = B => JSON.stringify({ c: B.cells, f: B.fmt, w: B.colW, m: B.merges || [] });
const dirty = B => snap(B) !== B.saved;
FILES.find(f => f.id === 'x1').book = newBook(
  { A1: 'รายการ', B1: 'จำนวนเงิน', A2: 'ค่ากาแฟ', B2: '120', A3: 'ค่ากระดาษ A4', B3: '350', A4: 'ค่าไฟฟ้า', B4: '1240', A5: 'ค่าขนมทีม', B5: '89', A6: 'ค่าแท็กซี่', B6: '260', A8: 'รวม', D1: 'ลองพิมพ์สูตรเองได้ เช่น =B2*2 หรือ =AVERAGE(B2:B6)' },
  { A1: { b: 1 }, B1: { b: 1 }, A8: { b: 1 } }, { sel: 'B8', anchor: 'B8' });
FILES.find(f => f.id === 'x2').book = newBook(
  { A1: 'ทริปปีใหม่บริษัท (12 คน · 6 ห้อง · 2 คืน)', A3: 'ที่พัก', B3: 'ราคา/ห้อง/คืน', C3: 'จำนวนห้อง', D3: 'จำนวนคืน', E3: 'ราคารวม', C4: '6', D4: '2', A6: 'งบประมาณ', B6: '40000', A7: 'เหลืองบ', B7: '=B6-E4', A9: 'วิธีทำ: พิมพ์ชื่อที่พักที่ A4 ราคาที่ B4 แล้วที่ E4 ใส่สูตร =B4*C4*D4' },
  { A1: { b: 1, fg: '#e0457b' }, A3: { b: 1, bg: '#ffd6e0' }, B3: { b: 1, bg: '#ffd6e0' }, C3: { b: 1, bg: '#ffd6e0' }, D3: { b: 1, bg: '#ffd6e0' }, E3: { b: 1, bg: '#ffd6e0' }, B6: { num: 1 }, B7: { num: 1 }, A9: { fg: '#8c8399' } },
  { tpl: 'trip', sel: 'A4', anchor: 'A4', colW: {} });
{ const B = FILES.find(f => f.id === 'x2').book; B.colW = { A: 150, B: 104 }; B.saved = snap(B); }
const num = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) || !/^\s*-?[\d,]*\.?\d+\s*$/.test(String(v)) ? null : n; };
const ci = ref => COLS.indexOf(ref[0]), ri = ref => +ref.slice(1);
function rangeVals(B, a, b, seen) {
  const out = [];
  for (let c = Math.min(ci(a), ci(b)); c <= Math.max(ci(a), ci(b)); c++) for (let r = Math.min(ri(a), ri(b)); r <= Math.max(ri(a), ri(b)); r++) { const v = value(B, COLS[c] + r, seen); if (typeof v === 'number') out.push(v); }
  return out;
}
function value(B, ref, seen = new Set()) {
  const raw = B.cells[ref]; if (raw === undefined || raw === '') return '';
  if (raw[0] !== '=') { const n = num(raw); return n === null ? raw : n; }
  if (seen.has(ref)) return '#วนซ้ำ'; seen = new Set(seen); seen.add(ref);
  try {
    let ex = raw.slice(1).toUpperCase().replace(/\s+/g, '');
    ex = ex.replace(/(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-L]\d+):([A-L]\d+)\)/g, (_, fn, a, b) => {
      const v = rangeVals(B, a, b, seen);
      if (fn === 'SUM') return v.reduce((s, x) => s + x, 0); if (fn === 'COUNT') return v.length;
      if (!v.length) return 0; if (fn === 'AVERAGE') return v.reduce((s, x) => s + x, 0) / v.length;
      return fn === 'MIN' ? Math.min(...v) : Math.max(...v);
    });
    ex = ex.replace(/([A-L])(\d+)/g, (_, c, r) => { const v = value(B, c + r, seen); return '(' + (typeof v === 'number' ? v : 0) + ')'; });
    ex = ex.replace(/ROUND/g, 'R').replace(/ABS/g, 'Q');
    if (!/^[\d+\-*/().,RQ]+$/.test(ex)) return '#ผิดสูตร';
    const r = Function('R', 'Q', '"use strict";return (' + ex + ')')((x, n = 0) => Math.round(x * 10 ** n) / 10 ** n, Math.abs);
    return typeof r === 'number' && isFinite(r) ? r : '#ผิดสูตร';
  } catch (e) { return '#ผิดสูตร'; }
}
const show = (v, f) => typeof v === 'number' ? v.toLocaleString('th-TH', f && f.num ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }) : v;
const sheetWin = f => wins.get('sheet-' + f.id);
function sheetTitle(f) { const W = sheetWin(f); if (W) W.setTitle((dirty(f.book) ? '● ' : '') + f.name + ' — ตารางคำนวณ'); }
function openSheet(f) {
  const wid = 'sheet-' + f.id; if (wins.has(wid)) { focusWin(wins.get(wid)); return wins.get(wid); }
  const B = f.book;
  const root = h('div', { class: 'xl' }, `<div class="xtb">
    <button class="save" data-x="save" title="บันทึก (Ctrl+S)">💾 บันทึก</button><button data-x="pdf" title="บันทึกเป็นไฟล์ PDF ในเกม">📄 เซฟ PDF</button><button data-x="print" title="ปริ้นออกมาเป็นกระดาษบนโต๊ะ">🖨️ ปริ้น</button><button data-x="saveas">บันทึกเป็น…</button><button data-x="csv" title="ดาวน์โหลดลงเครื่องจริงเป็นไฟล์ CSV">⬇ CSV</button><i></i>
    <button data-x="paste" title="วางข้อความที่คัดลอกไว้ลงช่องที่เลือก (Ctrl+V)">📋 วาง</button><button data-x="b" title="ตัวหนา (Ctrl+B)"><b>B</b></button><button data-x="i" title="ตัวเอียง (Ctrl+I)"><em>I</em></button><button data-x="u" title="ขีดเส้นใต้ (Ctrl+U)"><u>U</u></button><i></i>
    <span class="lbl">พื้น</span>${FILLS.map(c => `<button class="sw" data-fill="${c}" style="--s:${c || '#fff'}" title="${c ? 'สีพื้น' : 'ไม่มีสีพื้น'}">${c ? '' : '⌀'}</button>`).join('')}<i></i>
    <span class="lbl">ตัวอักษร</span>${INKS.map(c => `<button class="sw ink" data-ink="${c}" style="--s:${c}" title="สีตัวอักษร">A</button>`).join('')}<i></i>
    <button data-x="al-left" title="ชิดซ้าย">⇤</button><button data-x="al-center" title="กึ่งกลาง">↔</button><button data-x="al-right" title="ชิดขวา">⇥</button><i></i>
    <button data-x="sum" title="รวมอัตโนมัติ">Σ รวม</button><button data-x="num" title="คอมมาและทศนิยม 2 ตำแหน่ง">1,000.00</button><i></i><button data-x="bd-all" title="ตีเส้นตารางทุกช่องที่เลือก">▦ เส้นตาราง</button><button data-x="bd-out" title="ตีเส้นกรอบรอบนอกของช่วงที่เลือก">▢ เส้นรอบนอก</button><button data-x="bd-none" title="ลบเส้นของช่วงที่เลือก">▫ ลบเส้น</button><button data-x="merge" title="ผสานเซลล์ที่เลือก (กดซ้ำเพื่อยกเลิกผสาน)">⊞ ผสานเซลล์</button><i></i><button data-x="clear" title="ล้างรูปแบบ">ล้างรูปแบบ</button>
  </div><div class="fbar"><b class="ref"></b><span class="raw"></span></div><div class="grid"><table><colgroup></colgroup><tbody></tbody></table></div>`);
  const W = openWin(wid, '', root, 720, 420, '#e3f4e7'); W.book = B; W.file = f; W.root = root;
  sheetTitle(f); renderSheet(W);
  root.querySelector('.xtb').addEventListener('click', e => { const b = e.target.closest('button'); if (b) sheetCmd(W, b.dataset.x, b.dataset); });
  W.beforeClose = () => {
    if (!dirty(B)) return true;
    dialog(W, `บันทึกการเปลี่ยนแปลงใน <b>${esc(f.name)}</b> ก่อนปิดไหม?`, [['ยกเลิก', null], ['ไม่บันทึก', 'no'], ['บันทึก', 'yes', 'pri']]).then(({ v }) => {
      if (v === 'yes') { saveBook(W); closeWin(wid, true); }
      if (v === 'no') { const s = JSON.parse(B.saved); B.cells = s.c; B.fmt = s.f; B.colW = s.w; B.merges = s.m || []; closeWin(wid, true); }
    });
    return false;
  };
  return W;
}
function rect(B) { return { c0: Math.min(ci(B.sel), ci(B.anchor)), c1: Math.max(ci(B.sel), ci(B.anchor)), r0: Math.min(ri(B.sel), ri(B.anchor)), r1: Math.max(ri(B.sel), ri(B.anchor)) }; }
function eachSel(B, fn) { const r = rect(B); for (let c = r.c0; c <= r.c1; c++) for (let rr = r.r0; rr <= r.r1; rr++) fn(COLS[c] + rr); }

const BD_CSS = f => (f.bt ? 'border-top:2px solid #222;' : '') + (f.bb ? 'border-bottom:2px solid #222;' : '') + (f.bl ? 'border-left:2px solid #222;' : '') + (f.br ? 'border-right:2px solid #222;' : '');
function mergeMap(B) {
  const top = {}, cov = new Set();
  (B.merges || []).forEach(m => { const [a, b] = m.split(':'), c0 = Math.min(ci(a), ci(b)), c1 = Math.max(ci(a), ci(b)), r0 = Math.min(ri(a), ri(b)), r1 = Math.max(ri(a), ri(b)); top[COLS[c0] + r0] = { cs: c1 - c0 + 1, rs: r1 - r0 + 1 }; for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (c !== c0 || r !== r0) cov.add(COLS[c] + r); });
  return { top, cov };
}
function setBorder(W, mode) {
  const B = W.book, R = rect(B); B.touchedFmt = true;
  eachSel(B, ref => {
    const c = ci(ref), r = ri(ref), f = { ...(B.fmt[ref] || {}) };
    if (mode === 'none') { delete f.bt; delete f.bb; delete f.bl; delete f.br; }
    else if (mode === 'all') { f.bt = f.bb = f.bl = f.br = 1; }
    else { if (r === R.r0) f.bt = 1; if (r === R.r1) f.bb = 1; if (c === R.c0) f.bl = 1; if (c === R.c1) f.br = 1; }
    if (Object.keys(f).length) B.fmt[ref] = f; else delete B.fmt[ref];
  });
  renderSheet(W); S.tone(820, 820, .03, .05);
}
function toggleMerge(W) {
  const B = W.book, R = rect(B), key = `${COLS[R.c0]}${R.r0}:${COLS[R.c1]}${R.r1}`;
  const hit = (B.merges || []).filter(m => { const [a, b] = m.split(':'); return ci(a) >= R.c0 && ci(b) <= R.c1 && ri(a) >= R.r0 && ri(b) <= R.r1 || (ci(a) <= R.c1 && ci(b) >= R.c0 && ri(a) <= R.r1 && ri(b) >= R.r0 && R.c0 === R.c1 && R.r0 === R.r1); });
  if (hit.length) { B.merges = B.merges.filter(m => !hit.includes(m)); B.sel = B.anchor = COLS[R.c0] + R.r0; renderSheet(W); S.toast('ยกเลิกการผสานเซลล์แล้ว', 1.6); return; }
  if (R.c0 === R.c1 && R.r0 === R.r1) { S.toast('ลากเลือกหลายช่องก่อน แล้วค่อยกดผสานเซลล์', 2); return; }
  let lost = 0; eachSel(B, ref => { if (ref !== COLS[R.c0] + R.r0 && B.cells[ref]) { lost++; delete B.cells[ref]; } });
  (B.merges = B.merges || []).push(key); B.touchedFmt = true; B.sel = B.anchor = COLS[R.c0] + R.r0; renderSheet(W); S.tone(700, 1000, .08, .06);
  S.toast(lost ? 'ผสานเซลล์แล้ว (เก็บเฉพาะค่าของช่องซ้ายบน)' : 'ผสานเซลล์แล้ว', 2);
}
function renderSheet(W) {
  const B = W.book, t = W.root.querySelector('table');
  const cw = c => B.colW[c] || DEFW;
  t.querySelector('colgroup').innerHTML = '<col style="width:36px">' + [...COLS].map(c => `<col data-col="${c}" style="width:${cw(c)}px">`).join('');
  t.style.width = 36 + [...COLS].reduce((s, c) => s + cw(c), 0) + 'px';
  const MM = mergeMap(B);
  let html = '<tr><th class="rh"></th>' + [...COLS].map(c => `<th data-col="${c}">${c}<span class="cr" data-col="${c}"></span></th>`).join('') + '</tr>';
  for (let r = 1; r <= ROWS; r++) {
    html += `<tr><th class="rh">${r}</th>`;
    for (const c of COLS) {
      const ref = c + r; if (MM.cov.has(ref)) continue; const mg = MM.top[ref], v = value(B, ref), f = B.fmt[ref] || {};
      let st = BD_CSS(f); if (f.b) st += 'font-weight:600;'; if (f.i) st += 'font-style:italic;'; if (f.u) st += 'text-decoration:underline;'; if (f.bg) st += `background:${f.bg};`; if (f.fg) st += `color:${f.fg};`; if (f.al) st += `text-align:${f.al};`;
      html += `<td data-ref="${ref}"${mg ? ` colspan="${mg.cs}" rowspan="${mg.rs}"` : ''} class="${typeof v === 'number' ? 'num' : ''}${String(v).startsWith('#') ? ' err' : ''}"${st ? ` style="${st}"` : ''}>${esc(show(v, f))}</td>`;
    }
    html += '</tr>';
  }
  t.querySelector('tbody').innerHTML = html;
  paintSel(W); sheetTitle(W.file); checkBook(W.file);
}
function paintSel(W) {
  const B = W.book, r = rect(B);
  W.root.querySelectorAll('td').forEach(td => {
    const ref = td.dataset.ref, c = ci(ref), rr = ri(ref);
    td.classList.toggle('sel', ref === B.sel); td.classList.toggle('inr', c >= r.c0 && c <= r.c1 && rr >= r.r0 && rr <= r.r1 && (r.c0 !== r.c1 || r.r0 !== r.r1));
  });
  W.root.querySelector('.ref').textContent = B.sel === B.anchor ? B.sel : `${COLS[r.c0]}${r.r0}:${COLS[r.c1]}${r.r1}`;
  W.root.querySelector('.raw').textContent = B.cells[B.sel] || '';
  const f = B.fmt[B.sel] || {};
  W.root.querySelectorAll('.xtb [data-x]').forEach(b => b.classList.toggle('on', (b.dataset.x === 'b' && !!f.b) || (b.dataset.x === 'i' && !!f.i) || (b.dataset.x === 'u' && !!f.u) || (b.dataset.x === 'num' && !!f.num) || b.dataset.x === 'al-' + f.al));
}
function setFmt(W, fn) {
  const B = W.book; B.touchedFmt = true; eachSel(B, ref => { const f = { ...(B.fmt[ref] || {}) }; fn(f); for (const k in f) if (!f[k]) delete f[k]; if (Object.keys(f).length) B.fmt[ref] = f; else delete B.fmt[ref]; });
  renderSheet(W); S.tone(820, 820, .03, .05);
}
function sheetCmd(W, x, ds = {}) {
  const B = W.book; commitEdit(W, false);
  if (ds.fill !== undefined) return setFmt(W, f => f.bg = ds.fill);
  if (ds.ink !== undefined) return setFmt(W, f => f.fg = ds.ink === INKS[0] ? '' : ds.ink);
  if (x === 'b' || x === 'i' || x === 'u' || x === 'num') { let all = true; eachSel(B, ref => { if (!(B.fmt[ref] || {})[x]) all = false; }); return setFmt(W, f => f[x] = all ? 0 : 1); }
  if (x && x.startsWith('al-')) return setFmt(W, f => f.al = f.al === x.slice(3) ? '' : x.slice(3));
  if (x === 'bd-all' || x === 'bd-out' || x === 'bd-none') return setBorder(W, x.slice(3));
  if (x === 'merge') return toggleMerge(W);
  if (x === 'paste') { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { if (t) pasteInto(W, t); else if (clip) pasteInto(W, clip); }, () => { if (clip) pasteInto(W, clip); else S.toast('เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ด ลองกด Ctrl+V แทนนะ', 2.6); }); else if (clip) pasteInto(W, clip); return; }
  if (x === 'clear') return setFmt(W, f => { for (const k in f) f[k] = 0; });
  if (x === 'sum') {
    const c = B.sel[0], r = ri(B.sel); let r0 = r - 1; while (r0 >= 1 && typeof value(B, c + r0) === 'number') r0--;
    if (r0 === r - 1) { S.toast('Σ ต้องวางใต้ตัวเลขที่อยากรวม', 1.8); return; }
    B.cells[B.sel] = `=SUM(${c}${r0 + 1}:${c}${r - 1})`; renderSheet(W); S.tone(700, 1000, .08, .06); return;
  }
  if (x === 'save') return saveBook(W);
  if (x === 'pdf') return savePDF(W.file.name, sheetHTML(B));
  if (x === 'print') return printPaper(W.file.name.replace(/\.xlsx?$/, ''), `<div class="prt">${sheetHTML(B)}</div>`);
  if (x === 'saveas') return saveAs(W);
  if (x === 'csv') return downloadCSV(W);
}
function saveBook(W) {
  const B = W.book; B.saved = snap(B); sheetTitle(W.file); S.tone(600, 900, .1, .08, 'triangle'); S.toast(`บันทึก "${W.file.name}" แล้ว`, 1.6);
  if (Object.values(B.fmt).some(f => (f.b || f.bg || f.fg) && f !== undefined) && B.touchedFmt) complete('fmt');
}
async function saveAs(W) {
  const { v, text } = await dialog(W, 'บันทึกเป็นไฟล์ใหม่ ตั้งชื่อไฟล์:', [['ยกเลิก', null], ['บันทึก', 'ok', 'pri']], W.file.name.replace(/\.xlsx$/, '') + ' (สำเนา)');
  if (v !== 'ok' || !text) return;
  const name = /\.xlsx$/i.test(text) ? text : text + '.xlsx', B = W.book;
  const f = { id: 'u' + (++uid), name, type: 'xls', kind: 'sheet', loc: 'desk' };
  f.book = newBook(B.cells, B.fmt, { tpl: B.tpl, colW: { ...B.colW }, touchedFmt: B.touchedFmt, merges: [...(B.merges || [])] }); f.book.saved = snap(f.book);
  FILES.push(f); deskPos[f.id] = firstFree(); renderDesktop();
  const s = JSON.parse(B.saved); B.cells = s.c; B.fmt = s.f; B.colW = s.w; B.merges = s.m || []; closeWin(W.id, true);
  openSheet(f); S.toast(`สร้างไฟล์ "${name}" บนหน้าจอแล้ว`, 2);
  if (Object.values(f.book.fmt).some(x => x.b || x.bg || x.fg) && f.book.touchedFmt) complete('fmt');
}
function downloadCSV(W) {
  const B = W.book; let maxR = 1, maxC = 0;
  for (const ref in B.cells) { maxR = Math.max(maxR, ri(ref)); maxC = Math.max(maxC, ci(ref)); }
  const rows = []; for (let r = 1; r <= maxR; r++) { const row = []; for (let c = 0; c <= maxC; c++) { const v = value(B, COLS[c] + r); row.push(`"${String(v).replace(/"/g, '""')}"`); } rows.push(row.join(',')); }
  const a = h('a', { download: W.file.name.replace(/\.xlsx$/i, '') + '.csv' }); a.href = URL.createObjectURL(new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv' })); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  S.toast('ดาวน์โหลดไฟล์ CSV ลงเครื่องแล้ว (เปิดด้วย Excel ได้)', 2);
}
const HOTEL_TOTAL = h => h.price * 6 * 2;
function tripTotal(B) {
  const texts = Object.values(B.cells).filter(v => v[0] !== '=').join(' ');
  const ho = HOTELS.find(x => texts.includes(x.key)); if (!ho) return null;
  for (const ref in B.cells) if (B.cells[ref][0] === '=' && value(B, ref) === HOTEL_TOTAL(ho)) return { ho, total: HOTEL_TOTAL(ho) };
  return null;
}
function checkBook(f) {
  const B = f.book;
  if (f.id === 'x1' && (B.cells.B8 || '')[0] === '=' && value(B, 'B8') === 2059) complete('sum');
  if (B.tpl === 'trip' && tripTotal(B)) complete('trip');
}
// mouse: pick cells / drag a range / column header / resize column
let selDrag = null, colDrag = null;
document.addEventListener('pointerdown', e => {
  const W = sheetOf(e.target); if (!W) return;
  const cr = e.target.closest('.cr');
  if (cr) { e.preventDefault(); colDrag = { W, col: cr.dataset.col, x0: e.clientX, w0: W.book.colW[cr.dataset.col] || DEFW }; cr.classList.add('on'); return; }
  const th = e.target.closest('thead th[data-col], tr:first-child th[data-col]');
  const B = W.book;
  if (th) { commitEdit(W); B.anchor = th.dataset.col + 1; B.sel = th.dataset.col + ROWS; paintSel(W); return; }
  const td = e.target.closest('td'); if (!td) return;
  if (W.editor && W.editor.ref !== td.dataset.ref && refPick(W, td.dataset.ref, e)) { e.preventDefault(); return; }
  if (W.editor && W.editor.ref !== td.dataset.ref) commitEdit(W, false);
  if (!e.shiftKey) B.anchor = td.dataset.ref; B.sel = td.dataset.ref; selDrag = W; paintSel(W);
});
addEventListener('pointermove', e => {
  if (colDrag) { const { W, col, x0, w0 } = colDrag; W.book.colW[col] = clamp(Math.round(w0 + e.clientX - x0), 30, 420); const cg = W.root.querySelector(`col[data-col="${col}"]`); cg.style.width = W.book.colW[col] + 'px'; W.root.querySelector('table').style.width = 36 + [...COLS].reduce((s, c) => s + (W.book.colW[c] || DEFW), 0) + 'px'; return; }
  if (!selDrag) return; const td = document.elementFromPoint(e.clientX, e.clientY)?.closest('td');
  if (td && td.closest('.win') === selDrag.el && td.dataset.ref !== selDrag.book.sel) { selDrag.book.sel = td.dataset.ref; paintSel(selDrag); }
});
addEventListener('pointerup', () => { selDrag = null; if (colDrag) { const W = colDrag.W; colDrag = null; renderSheet(W); S.tone(700, 760, .03, .04); } });
document.addEventListener('dblclick', e => { const W = sheetOf(e.target), td = e.target.closest('td'); if (W && td) { W.book.anchor = W.book.sel = td.dataset.ref; startEdit(W, W.book.cells[td.dataset.ref] || ''); } });
function sheetOf(el) { const w = el.closest && el.closest('.win'); const W = w && wins.get(w.dataset.id); return W && W.book ? W : null; }
// formula editing: click a cell to insert its name (shift+click = range from the last picked cell)
function refPick(W, ref, e) {
  const ed = W.editor, inp = ed.inp, v = inp.value; if (v[0] !== '=') return false;
  const pos = inp.selectionStart ?? v.length;
  let st = pos, en = pos;
  if (ed.ins && ed.ins.end === pos) { st = ed.ins.start; en = ed.ins.end; if (e.shiftKey && ed.ins.first) ref = ed.ins.first + ':' + ref; else ed.ins.first = ref; }
  else { const prev = v.slice(0, pos).trimEnd().slice(-1); if (!prev || !/[=+\-*/^(,:;<>&]/.test(prev)) return false; ed.ins = { first: ref }; }
  inp.value = v.slice(0, st) + ref + v.slice(en); const np = st + ref.length; ed.ins.start = st; ed.ins.end = np;
  inp.focus(); inp.setSelectionRange(np, np); W.root.querySelector('.raw').textContent = inp.value;
  W.root.querySelectorAll('td.pk').forEach(t => t.classList.remove('pk')); W.root.querySelector(`td[data-ref="${ref.split(':').pop()}"]`)?.classList.add('pk');
  S.tone(900, 900, .02, .04); return true;
}
function startEdit(W, initial) {
  if (W.editor) commitEdit(W, false);
  const B = W.book; B.anchor = B.sel;
  const td = W.root.querySelector(`td[data-ref="${B.sel}"]`), grid = W.root.querySelector('.grid');
  const inp = h('input', { class: 'ed', type: 'text', spellcheck: 'false' }); inp.value = initial;
  inp.style.left = td.offsetLeft + 'px'; inp.style.top = td.offsetTop + 'px'; inp.style.width = Math.max(td.offsetWidth, 200) + 'px'; inp.style.height = td.offsetHeight + 'px';
  grid.append(inp); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  W.editor = { ref: B.sel, inp };
  inp.addEventListener('input', () => { if (W.editor) W.editor.ins = null;  W.root.querySelector('.raw').textContent = inp.value; });
}
function commitEdit(W, move = true, dc = 0, dr = 1) {
  if (!W || !W.editor) return; const { ref, inp } = W.editor; W.editor = null;
  const v = inp.value.trim(); if (v) W.book.cells[ref] = v; else delete W.book.cells[ref];
  inp.remove(); if (move) moveSel(W, dc, dr, false); renderSheet(W);
  S.tone(760, 760, .03, .05);
}
function moveSel(W, dc, dr, ext) {
  const B = W.book, c = clamp(ci(B.sel) + dc, 0, COLS.length - 1), r = clamp(ri(B.sel) + dr, 1, ROWS); B.sel = COLS[c] + r; if (!ext) B.anchor = B.sel; paintSel(W);
  W.root.querySelector(`td[data-ref="${B.sel}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
let sheetClip = null;
function pasteInto(W, text) {
  const B = W.book;
  if (sheetClip && sheetClip.text === text) { const { cells, w, hgt } = sheetClip; for (let c = 0; c < w; c++) for (let r = 0; r < hgt; r++) { const dst = COLS[ci(B.sel) + c] + (ri(B.sel) + r); if (ci(B.sel) + c < COLS.length && ri(B.sel) + r <= ROWS) { const v = cells[c + ',' + r]; if (v) B.cells[dst] = v; else delete B.cells[dst]; } } }
  else { const rows = String(text).replace(/\r/g, '').replace(/\n+$/, '').split('\n').slice(0, ROWS); rows.forEach((line, r) => line.split('\t').forEach((v, c) => { const cc = ci(B.sel) + c, rr = ri(B.sel) + r; if (cc < COLS.length && rr <= ROWS) { v = v.trim(); if (v) B.cells[COLS[cc] + rr] = v; else delete B.cells[COLS[cc] + rr]; } })); }
  renderSheet(W); S.toast('วางแล้ว', 1);
}
document.addEventListener('keydown', e => {
  const W = topWin(); if (!W || !W.book || currentView !== 'screen' || W.dlg) return;
  const B = W.book, mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 's') { e.preventDefault(); commitEdit(W, false); saveBook(W); return; }
  if (W.editor) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(W, true, 0, 1); }
    else if (e.key === 'Tab') { e.preventDefault(); commitEdit(W, true, 1, 0); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); W.editor.inp.remove(); W.editor = null; renderSheet(W); }
    return;
  }
  if (e.target.closest && e.target.closest('input,textarea')) return;
  if (mod && (k === 'b' || k === 'i' || k === 'u')) { e.preventDefault(); sheetCmd(W, k); return; }
  if (mod && k === 'c') { const r = rect(B), cells = {}; let txt = []; for (let rr = r.r0; rr <= r.r1; rr++) { const row = []; for (let c = r.c0; c <= r.c1; c++) { cells[(c - r.c0) + ',' + (rr - r.r0)] = B.cells[COLS[c] + rr] || ''; row.push(show(value(B, COLS[c] + rr))); } txt.push(row.join('\t')); } clip = txt.join('\n'); sheetClip = { cells, w: r.c1 - r.c0 + 1, hgt: r.r1 - r.r0 + 1, text: clip }; try { navigator.clipboard?.writeText(clip).catch(() => {}); } catch (er) {} S.toast('คัดลอกช่องแล้ว', 1); e.preventDefault(); return; }
  if (mod && k === 'v') return; // handled by the paste event (works with text copied from anywhere, e.g. a tracking number)
  const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], Enter: [0, 1], Tab: [1, 0] }[e.key];
  if (mv) { e.preventDefault(); moveSel(W, ...mv, e.shiftKey && e.key.startsWith('Arrow')); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); eachSel(B, ref => delete B.cells[ref]); renderSheet(W); return; }
  if (e.key === 'F2') { e.preventDefault(); e.stopPropagation(); startEdit(W, B.cells[B.sel] || ''); return; }
  if (e.key.length === 1 && !mod) { e.preventDefault(); startEdit(W, e.key); }
});
document.addEventListener('paste', e => {
  const W = topWin(); if (!W || !W.book || currentView !== 'screen' || W.dlg || W.editor) return;
  if (e.target.closest && e.target.closest('input,textarea')) return;
  const t = (e.clipboardData && e.clipboardData.getData('text')) || ''; e.preventDefault(); if (t) pasteInto(W, t); else if (clip) pasteInto(W, clip);
});
function newSheetFile() {
  let name = 'ตารางใหม่.xlsx', k = 2; while (FILES.some(f => f.name === name)) name = `ตารางใหม่ ${k++}.xlsx`;
  const f = { id: 'u' + (++uid), name, type: 'xls', kind: 'sheet', loc: 'desk', book: newBook({}) };
  FILES.push(f); deskPos[f.id] = firstFree(); renderDesktop(); openSheet(f);
}

function openSheetApp() { const k = [...wins.keys()].find(x => x.startsWith('sheet-')); if (k) { focusWin(wins.get(k)); return; } newSheetFile(); }
