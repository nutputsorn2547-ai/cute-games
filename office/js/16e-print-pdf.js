"use strict";
// Office game — save Word/Excel as PDF, print to the desk, sign with a pen, scan back in. All made up, nothing leaves the game.
let printSeq = 0;
function sheetHTML(B) {
  let mc = 0, mr = 0; const keys = new Set([...Object.keys(B.cells), ...Object.keys(B.fmt || {}).filter(k => (B.fmt[k] || {}).bg)]);
  keys.forEach(k => { mc = Math.max(mc, ci(k)); mr = Math.max(mr, ri(k)); });
  mc = Math.max(mc, 2); mr = Math.max(mr, 3); let rows = '';
  for (let r = 1; r <= mr; r++) {
    rows += '<tr>';
    for (let c = 0; c <= mc; c++) {
      const ref = COLS[c] + r, v = value(B, ref), f = B.fmt[ref] || {};
      let st = ''; if (f.b) st += 'font-weight:600;'; if (f.i) st += 'font-style:italic;'; if (f.u) st += 'text-decoration:underline;'; if (f.bg) st += `background:${f.bg};`; if (f.fg) st += `color:${f.fg};`;
      st += `text-align:${f.al || (typeof v === 'number' ? 'right' : 'left')};`;
      rows += `<td style="${st}">${esc(show(v, f))}</td>`;
    }
    rows += '</tr>';
  }
  return `<table class="pdft">${rows}</table>`;
}
function savePDF(name, body, kind) {
  const fn = name.replace(/\.(doc|xls|xlsx|pdf)$/i, '') + '.pdf';
  let f = FILES.find(x => x.name === fn && x.kind === 'pdfdoc' && x.loc !== 'trash');
  if (!f) { f = { id: 'u' + (++uid), name: fn, type: 'pdf', loc: 'desk', kind: 'pdfdoc' }; FILES.push(f); deskPos[f.id] = firstFree(); }
  f.body = body; f.html = `<div class="scanv"><div class="pdfpage">${body}</div></div>`; closeWin('view-' + f.id, true);
  renderDesktop(); S.noise(.4, 2200, .05); S.tone(500, 800, .2, .05); S.toast(`📄 บันทึกเป็น PDF แล้ว: "${fn}" (ดูบนโต๊ะคอม)`, 3); complete('pdf'); return f;
}
function printPaper(title, body) {
  S.toast('🖨️ เครื่องปริ้นกำลังทำงาน…', 2); let n = 0; const iv = setInterval(() => { S.noise(.18, 1200 + (n % 2) * 500, .05, 'bandpass'); if (++n > 7) clearInterval(iv); }, 280);
  setTimeout(() => {
    const d = { id: 'pr' + (++printSeq), title: title + ' (ปริ้น)', printed: true, html: body, x: 24 + Math.random() * 30, y: 30 + Math.random() * 25, r: Math.round(Math.random() * 10 - 5) };
    DOCS.push(d); printItem(d); S.jingle(); complete('print');
    S.big('ปริ้นเสร็จแล้ว 🖨️', 2, '#5a78e6'); S.toast('กระดาษอยู่บนโต๊ะ กลับไปหยิบปากกาแล้วคลิกกระดาษเพื่อเซ็นชื่อ ✍️', 4);
  }, 2400);
}
function printItem(d) {
  const it = deskItem('', d.x, d.y, d.r, `<div class="doc printed"><h4>${esc(d.title)}</h4>${'<div class="ln"></div>'.repeat(3)}<div class="ln" style="width:60%"></div>${'<div class="ln"></div>'.repeat(4)}<div class="sig">✍️ เซ็นตรงนี้</div></div>`, 'doc:' + d.id);
  it.style.zIndex = ++zTop; return it;
}
function printFile(f) {
  if (f.kind === 'worddoc') return printPaper(f.name.replace(/\.doc$/, ''), `<div class="wpage prt">${f.html}</div>`);
  if (f.kind === 'pdfdoc') return printPaper(f.name.replace(/\.pdf$/, ''), `<div class="prt">${f.body}</div>`);
  if (f.kind === 'sheet') return printPaper(f.name.replace(/\.xlsx?$/, ''), `<div class="prt">${sheetHTML(f.book)}</div>`);
  S.toast('ไฟล์นี้ปริ้นไม่ได้', 1.6);
}
function fitPaper() {
  const c = ov && ov.querySelector('.content'), d = ov && ov.state.doc; if (!c || !d || d.sticky) return;
  let fs = d.printed ? 13 : 15; if (d.printed) { c.style.fontSize = fs + 'px'; c.style.lineHeight = '1.5'; }
  while (c.scrollHeight > c.clientHeight + 2 && fs > 6) { fs -= .5; c.style.fontSize = fs + 'px'; c.style.lineHeight = '1.55'; }
}
