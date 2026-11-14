"use strict";
// Office game — resume design app. Files load in order and share one global scope (see office/index.html).
/* ================= design app (resume) ================= */
const DZ_THEMES = ['#00b5c8', '#ff7aa2', '#7c6cff', '#2f9d5a', '#f2994a', '#3a3245'];
const DZ_COLORS = ['#3a3245', '#ffffff', '#6b6478', '#00b5c8', '#ff7aa2', '#7c6cff', '#2f9d5a', '#f2b24a', '#ffd166', '#e8f8fb', '#fff1f6', '#efeaff'];
const DZ_EMO = ['⭐', '💼', '📊', '🎓', '💡', '❤️', '🌸', '✨', '📞', '✉️', '🏠', '🐱'];
let dzId = 0, dzDrag = null;
const dzText = (text, x, y, w, size, extra = {}) => ({ id: ++dzId, t: 'text', text, x, y, w, h: 0, size, color: '#3a3245', ...extra });
function defaultResume() {
  return { theme: '#00b5c8', els: [
    { id: ++dzId, t: 'rect', x: 0, y: 0, w: 420, h: 124, fill: '#00b5c8', th: 'fill' },
    { id: ++dzId, t: 'circle', x: 26, y: 22, w: 80, h: 80, fill: '#ffffff' },
    dzText('🙂', 42, 32, 52, 42),
    dzText('กุ้ง ใจดี', 122, 30, 280, 26, { bold: 1, color: '#ffffff' }),
    dzText('นักบัญชี · ประสบการณ์ 3 ปี', 122, 70, 280, 14, { color: '#e6fbff' }),
    dzText('📞 08x-xxx-xxxx   ✉️ kung.jaidee@email.com', 26, 138, 370, 11, { color: '#6b6478' }),
    dzText('ประสบการณ์ทำงาน', 26, 170, 300, 16, { bold: 1, color: '#00b5c8', th: 'color' }),
    dzText('• บริษัท น่ารัก จำกัด (2566 – ปัจจุบัน)\n   ทำบัญชี ปิดงบรายเดือน ยื่นภาษี\n• สำนักงานบัญชีดาวเล็ก (2564 – 2566)\n   บันทึกบัญชี ทำเงินเดือน', 26, 196, 370, 12),
    dzText('ทักษะ', 26, 298, 300, 16, { bold: 1, color: '#00b5c8', th: 'color' }),
    dzText('Excel · ภาษีอากร · ปิดงบ · ทำงานเป็นทีม · ใจเย็น', 26, 324, 370, 12),
    dzText('การศึกษา', 26, 366, 300, 16, { bold: 1, color: '#00b5c8', th: 'color' }),
    dzText('ปริญญาตรี บัญชีบัณฑิต มหาวิทยาลัยแมวเหมียว', 26, 392, 370, 12),
    { id: ++dzId, t: 'rect', x: 26, y: 438, w: 368, h: 2, fill: '#00b5c8', th: 'fill' },
    dzText('"ตั้งใจ รับผิดชอบ และพร้อมเรียนรู้สิ่งใหม่"', 26, 450, 370, 13, { color: '#6b6478', it: 1 }),
  ] };
}
FILES.find(f => f.id === 'cv').design = defaultResume();
function elStyle(e) {
  let st = `left:${e.x}px;top:${e.y}px;width:${e.w}px;`;
  if (e.t === 'text') st += `font-size:${e.size}px;color:${e.color};font-weight:${e.bold ? 600 : 400};${e.it ? 'font-style:italic;' : ''}`;
  else st += `height:${e.h}px;background:${e.fill};border-radius:${e.t === 'circle' ? '50%' : '4px'};`;
  return st;
}
const pageHTML = d => d.els.map(e => `<div class="del" data-el="${e.id}" style="${elStyle(e)}">${e.t === 'text' ? esc(e.text) : ''}</div>`).join('');
function openDesign(f) {
  const wid = 'design-' + f.id; if (wins.has(wid)) { focusWin(wins.get(wid)); return wins.get(wid); }
  const root = h('div', { class: 'dz' }, `<div class="lt"><h5>เพิ่ม</h5><button data-add="text">＋ ข้อความ</button><button data-add="rect">▭ สี่เหลี่ยม</button><button data-add="circle">◯ วงกลม</button>
    <h5>สติกเกอร์</h5><div class="emo">${DZ_EMO.map(e => `<button data-emo="${e}">${e}</button>`).join('')}</div>
    <h5>ธีมสี</h5><div class="sws">${DZ_THEMES.map(c => `<button data-theme="${c}" style="--s:${c}" aria-label="ธีม ${c}"></button>`).join('')}</div></div>
    <div class="mid"><div class="dtop"><b>${esc(f.name)}</b><button class="btn2" data-x="png" title="ดาวน์โหลดลงเครื่องจริง">⬇ PNG</button><button class="btn2 pri" data-x="pdf" title="สร้างไฟล์ PDF ในคอมจำลอง ใช้แนบสมัครงาน">📄 ส่งออก PDF</button></div><div class="stage"><div class="pgw"><div class="dpage"></div></div></div></div>
    <div class="rt"></div>`);
  const W = openWin(wid, f.name + ' — แคนวาน้อย', root, 820, 500, '#d9f7f8'); W.dz = { f, sel: null, s: 1 }; W.body.style.overflow = 'hidden';
  W.onResize = () => renderDesign(W);
  root.addEventListener('click', e => dzClick(W, e));
  root.querySelector('.dpage').addEventListener('pointerdown', e => dzDown(W, e));
  root.querySelector('.stage').addEventListener('pointerdown', e => { if (!e.target.isConnected || e.target.closest('.dpage')) return; if (W.dz.sel !== null) { W.dz.sel = null; renderDesign(W); renderDzPanel(W); } });
  renderDesign(W); renderDzPanel(W);
  return W;
}
function renderDesign(W) {
  const d = W.dz.f.design, pg = W.body.querySelector('.dpage'), st = W.body.querySelector('.stage');
  const s = clamp((st.clientWidth - 28) / 420, .3, 1.2); W.dz.s = s;
  pg.style.transform = `scale(${s})`; const pw = W.body.querySelector('.pgw'); pw.style.width = 420 * s + 'px'; pw.style.height = 594 * s + 'px';
  pg.innerHTML = pageHTML(d);
  const sel = pg.querySelector(`[data-el="${W.dz.sel}"]`); if (sel) { sel.classList.add('on'); sel.append(h('i', { class: 'hd' })); }
}
function renderDzPanel(W) {
  const rt = W.body.querySelector('.rt'), d = W.dz.f.design, ob = d.els.find(x => x.id === W.dz.sel);
  if (!ob) { rt.innerHTML = `<h5>วิธีใช้</h5><p style="margin:0;line-height:1.6;color:var(--soft)">คลิกชิ้นส่วนเพื่อเลือก · ลากเพื่อย้าย · ลากจุดมุมขวาล่างเพื่อปรับขนาด<br><br>เลือกข้อความแล้วแก้ได้ที่ช่องนี้ (พิมพ์จากมือถือได้)<br><br>เสร็จแล้วกด "ส่งออก PDF" เพื่อเอาไปสมัครงาน</p>`; return; }
  const sw = k => `<div class="sws">${DZ_COLORS.map(c => `<button data-${k}="${c}" style="--s:${c}" aria-label="สี ${c}"></button>`).join('')}</div>`;
  rt.innerHTML = (ob.t === 'text' ? `<h5>ข้อความ</h5><textarea spellcheck="false"></textarea><h5>ขนาด ${ob.size}px</h5><div class="row2"><button data-sz="-2">A−</button><button data-sz="2">A+</button><button data-bold>${ob.bold ? '<b>B</b>✓' : '<b>B</b>'}</button><button data-ital><em>I</em>${ob.it ? '✓' : ''}</button></div><h5>สีตัวอักษร</h5>${sw('color')}` : `<h5>สีพื้น</h5>${sw('fill')}`)
    + `<h5>จัดการ</h5><div class="row2" style="flex-wrap:wrap"><button data-z="1">ขึ้นหน้า</button><button data-z="-1">ไปหลัง</button><button data-dup>ทำสำเนา</button><button data-del style="color:#e0457b">ลบ</button></div>`;
  const ta = rt.querySelector('textarea');
  if (ta) {
    ta.value = ob.text;
    ta.addEventListener('input', () => { ob.text = ta.value; d.touched = true; const el = W.body.querySelector(`[data-el="${ob.id}"]`); if (!el) return; if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = ob.text; else el.prepend(document.createTextNode(ob.text)); });
  }
}
function dzDown(W, e) {
  const el = e.target.closest('.del'), d = W.dz.f.design;
  if (!el) { if (W.dz.sel !== null) { W.dz.sel = null; renderDesign(W); renderDzPanel(W); } return; }
  const id = +el.dataset.el, ob = d.els.find(x => x.id === id), rs = !!e.target.closest('.hd');
  if (W.dz.sel !== id) { W.dz.sel = id; renderDesign(W); renderDzPanel(W); }
  dzDrag = { W, ob, rs, x0: e.clientX, y0: e.clientY, ox: ob.x, oy: ob.y, ow: ob.w, oh: ob.h, moved: false };
  e.preventDefault();
}
addEventListener('pointermove', e => {
  if (!dzDrag) return; const { W, ob, rs } = dzDrag, s = W.dz.s, dx = (e.clientX - dzDrag.x0) / s, dy = (e.clientY - dzDrag.y0) / s;
  if (!dzDrag.moved && Math.hypot(dx, dy) < 2) return; dzDrag.moved = true;
  if (rs) { ob.w = clamp(Math.round(dzDrag.ow + dx), 16, 440); if (ob.t !== 'text') ob.h = clamp(Math.round(dzDrag.oh + dy), 2, 600); }
  else { ob.x = clamp(Math.round(dzDrag.ox + dx), -ob.w + 12, 408); ob.y = clamp(Math.round(dzDrag.oy + dy), -20, 584); }
  const el = W.body.querySelector(`[data-el="${ob.id}"]`); if (el) el.style.cssText = elStyle(ob);
});
addEventListener('pointerup', () => { if (dzDrag) { if (dzDrag.moved) { dzDrag.W.dz.f.design.touched = true; S.noise(.05, 1500, .03); } dzDrag = null; } });
function dzClick(W, e) {
  const b = e.target.closest('button'); if (!b) return; const d = W.dz.f.design, ob = d.els.find(x => x.id === W.dz.sel), ds = b.dataset;
  const add = o => { d.els.push(o); W.dz.sel = o.id; d.touched = true; renderDesign(W); renderDzPanel(W); S.tone(800, 1000, .05, .05); };
  if (ds.add === 'text') return add(dzText('ข้อความใหม่', 60, 490, 220, 14));
  if (ds.add === 'rect') return add({ id: ++dzId, t: 'rect', x: 150, y: 250, w: 120, h: 70, fill: '#ffd166' });
  if (ds.add === 'circle') return add({ id: ++dzId, t: 'circle', x: 170, y: 250, w: 80, h: 80, fill: '#ffd6e3' });
  if (ds.emo) return add(dzText(ds.emo, 340, 140 + (d.els.length * 23) % 300, 54, 32));
  if (ds.theme) { d.theme = ds.theme; d.els.forEach(x => { if (x.th === 'fill') x.fill = ds.theme; if (x.th === 'color') x.color = ds.theme; }); d.touched = true; renderDesign(W); S.tone(600, 900, .08, .06); return; }
  if (ds.x === 'png') return dzPNG(W);
  if (ds.x === 'pdf') return dzPDF(W);
  if (!ob) return;
  if (ds.color) { ob.color = ds.color; delete ob.th; }
  if (ds.fill) { ob.fill = ds.fill; delete ob.th; }
  if (ds.sz) ob.size = clamp(ob.size + +ds.sz, 8, 72);
  if ('bold' in ds) ob.bold = ob.bold ? 0 : 1;
  if ('ital' in ds) ob.it = ob.it ? 0 : 1;
  if (ds.z) { d.els.splice(d.els.indexOf(ob), 1); if (+ds.z > 0) d.els.push(ob); else d.els.unshift(ob); }
  if ('dup' in ds) { const c = { ...ob, id: ++dzId, x: ob.x + 14, y: ob.y + 14 }; d.els.push(c); W.dz.sel = c.id; }
  if ('del' in ds) { d.els.splice(d.els.indexOf(ob), 1); W.dz.sel = null; }
  d.touched = true; renderDesign(W); renderDzPanel(W); S.tone(760, 760, .03, .04);
}
document.addEventListener('keydown', e => {
  const W = topWin(); if (!W || !W.dz || currentView !== 'screen' || (e.target.closest && e.target.closest('input,textarea'))) return;
  const d = W.dz.f.design, ob = d.els.find(x => x.id === W.dz.sel); if (!ob) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); d.els.splice(d.els.indexOf(ob), 1); W.dz.sel = null; renderDesign(W); renderDzPanel(W); return; }
  const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (mv) { e.preventDefault(); const k = e.shiftKey ? 10 : 2; ob.x += mv[0] * k; ob.y += mv[1] * k; d.touched = true; renderDesign(W); }
});
async function dzPNG(W) {
  const d = W.dz.f.design, cv = document.createElement('canvas'); cv.width = 840; cv.height = 1188; const g = cv.getContext('2d'); g.scale(2, 2);
  try { await document.fonts.load('16px Mitr'); await document.fonts.load('600 16px Mitr'); } catch (e) {}
  const seg = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 420, 594);
  for (const e of d.els) {
    if (e.t === 'rect') { g.fillStyle = e.fill; g.beginPath(); if (g.roundRect) g.roundRect(e.x, e.y, e.w, e.h, 4); else g.rect(e.x, e.y, e.w, e.h); g.fill(); continue; }
    if (e.t === 'circle') { g.fillStyle = e.fill; g.beginPath(); g.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2); g.fill(); continue; }
    g.fillStyle = e.color; g.font = `${e.it ? 'italic ' : ''}${e.bold ? 600 : 400} ${e.size}px Mitr, sans-serif`; g.textBaseline = 'top';
    const lh = e.size * 1.45; let y = e.y + (lh - e.size) / 2;
    for (const para of e.text.split('\n')) {
      const words = seg ? [...seg.segment(para)].map(x => x.segment) : [...para]; let line = '';
      for (const wd of words) { if (line && g.measureText(line + wd).width > e.w) { g.fillText(line, e.x, y); y += lh; line = wd.trimStart(); } else line += wd; }
      g.fillText(line, e.x, y); y += lh;
    }
  }
  cv.toBlob(b => { const a = h('a', { download: W.dz.f.name.replace(/\.design$/, '') + '.png' }); a.href = URL.createObjectURL(b); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); });
  S.toast('ดาวน์โหลดเรซูเม่เป็นรูป PNG ลงเครื่องแล้ว', 2);
}
function dzPDF(W) {
  const src = W.dz.f, name = src.name.replace(/\.design$/, '') + '.pdf';
  let f = FILES.find(x => x.kind === 'resume' && x.name === name);
  if (!f) { f = { id: 'u' + (++uid), name, type: 'pdf', kind: 'resume', loc: 'desk' }; FILES.push(f); deskPos[f.id] = firstFree(); }
  f.design = JSON.parse(JSON.stringify(src.design)); renderDesktop(); closeWin('view-' + f.id, true);
  S.tone(500, 1000, .15, .08, 'triangle'); S.toast(`ส่งออก "${name}" ไว้บนหน้าจอแล้ว ใช้แนบสมัครงานได้เลย`, 2.4); complete('resume');
}
function openResume(f) {
  const s = .66;
  openWin('view-' + f.id, f.name, h('div', { class: 'pdfv' }, `<div class="pgw" style="width:${420 * s}px;height:${594 * s}px"><div class="dpage" style="transform:scale(${s})">${pageHTML(f.design)}</div></div>`), 340, 460, '#f4f0ff');
}
