"use strict";
// Office game — window manager. Files load in order and share one global scope (see office/index.html).
/* ================= windows ================= */
const wins = new Map(); let zTop = 10;
function openWin(id, title, body, w = 520, hgt = 360, tc = '#eef1ff') {
  if (wins.has(id)) { const W = wins.get(id); focusWin(W); return W; }
  const sr = screen.getBoundingClientRect(), n = wins.size;
  w = Math.min(w, sr.width - 20); hgt = Math.min(hgt, sr.height - 60);
  const el = h('div', { class: 'win', 'data-id': id });
  el.style.cssText = `width:${w}px;height:${hgt}px;left:${clamp(110 + n * 28, 6, sr.width - w - 6)}px;top:${clamp(20 + n * 22, 4, sr.height - hgt - 48)}px;--tc:${tc}`;
  el.innerHTML = `<div class="tb"><span class="tt"></span><button class="mx" aria-label="ขยายเต็มจอ" title="ขยาย/ย่อ">▢</button><button class="x" aria-label="ปิด">×</button></div><div class="body"></div><div class="rz" title="ลากเพื่อปรับขนาด"></div>`;
  el.querySelector('.tt').textContent = title;
  el.querySelector('.body').append(body); screen.append(el);
  const W = { id, el, body: el.querySelector('.body'), setTitle: t => { el.querySelector('.tt').textContent = t; } }; wins.set(id, W); focusWin(W);
  el.addEventListener('pointerdown', () => focusWin(W));
  el.querySelector('.x').addEventListener('click', () => closeWin(id));
  el.querySelector('.mx').addEventListener('click', () => toggleMax(W));
  el.querySelector('.tb').addEventListener('pointerdown', e => { if (e.target.closest('button') || W.max) return; winDrag = { el, o: { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop } }; });
  el.querySelector('.rz').addEventListener('pointerdown', e => { e.stopPropagation(); focusWin(W); winSize = { W, x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight }; });
  syncTaskbar(); S.tone(600, 800, .05, .05); return W;
}
let winDrag = null, winSize = null;
addEventListener('pointermove', e => {
  const sr = screen.getBoundingClientRect();
  if (winDrag) { const { el, o } = winDrag; el.style.left = clamp(o.l + e.clientX - o.x, -el.offsetWidth + 80, sr.width - 80) + 'px'; el.style.top = clamp(o.t + e.clientY - o.y, 0, sr.height - 80) + 'px'; }
  if (winSize) { const { W, x, y, w, h: hh } = winSize, el = W.el; el.style.width = clamp(w + e.clientX - x, 260, sr.width - el.offsetLeft) + 'px'; el.style.height = clamp(hh + e.clientY - y, 160, sr.height - 44 - el.offsetTop) + 'px'; W.onResize?.(); }
});
addEventListener('pointerup', () => { winDrag = null; if (winSize) { winSize = null; S.tone(800, 700, .03, .04); } });
function toggleMax(W) {
  if (!W) return; const el = W.el;
  if (W.max) { el.style.cssText = W.max; W.max = null; el.classList.remove('max'); }
  else { W.max = el.style.cssText; Object.assign(el.style, { left: '0px', top: '0px', width: '100%', height: 'calc(100% - 44px)' }); el.classList.add('max'); }
  focusWin(W); W.onResize?.(); S.tone(500, 800, .06, .05);
}
function focusWin(W) { W.el.style.zIndex = ++zTop; }
function closeWin(id, force) {
  const W = wins.get(id); if (!W) return;
  if (!force && W.beforeClose && W.beforeClose() === false) return;
  W.el.remove(); wins.delete(id); syncTaskbar(); W.onClose?.(); S.tone(500, 350, .06, .06);
}
function topWin() { let best = null; for (const W of wins.values()) if (!best || +W.el.style.zIndex > +best.el.style.zIndex) best = W; return best; }
function syncTaskbar() {
  $('taskbar').querySelectorAll('button').forEach(b => b.classList.toggle('on', [...wins.keys()].some(k => k.startsWith(b.dataset.app))));
  const unread = chat.list.reduce((s, c) => s + (c.hidden ? 0 : c.unread), 0), cb = $('taskbar').querySelector('[data-app="chat"]');
  cb.querySelector('.dot')?.remove(); if (unread && chat.account) cb.append(h('span', { class: 'dot' }, String(unread)));
}
$('taskbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  ({ files: () => openFolder(FOLDERS[2]), sheet: () => openSheet(FILES.find(f => f.id === 'x1')), search: () => openSearch(), chat: () => openChat(), food: () => openFood(), design: () => openDesign(FILES.find(f => f.id === 'cv')), jobs: () => openJobs(), game: () => openGames(), cal: () => openCal(), bank: () => openBank(), ai: () => openAI(), work: () => openWork(), mail: () => openMailApp(), word: () => openWord() })[b.dataset.app]?.();
});
// a small modal inside a window: resolves with the clicked button's value and the input's text
function dialog(W, html, buttons, withInput) {
  return new Promise(res => {
    const d = h('div', { class: 'dlg' }, `<div class="dcard"><div>${html}</div>${withInput !== undefined ? '<input type="text" spellcheck="false">' : ''}<div class="row">${buttons.map((b, i) => `<button class="btn2 ${b[2] || ''}" data-i="${i}">${b[0]}</button>`).join('')}</div></div>`);
    W.el.append(d); W.dlg = d;
    const inp = d.querySelector('input'); if (inp) { inp.value = withInput; setTimeout(() => { inp.focus(); inp.select(); }, 30); }
    const fin = v => { d.remove(); W.dlg = null; res({ v, text: inp ? inp.value.trim() : '' }); };
    d.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) fin(buttons[+b.dataset.i][1]); });
    inp?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fin(buttons[buttons.length - 1][1]); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(null); } });
    d.cancel = () => fin(null);
  });
}
function openFolder(fo) { const body = h('div', { class: 'fold' }); const W = openWin('files-' + fo.id, 'โฟลเดอร์ ' + fo.name, body, 470, 300, '#fff4d6'); W.folder = fo.id; renderFolder(W); }
function renderFolder(W) {
  const box = W.body.querySelector('.fold'); box.innerHTML = '';
  const list = FILES.filter(f => f.loc === W.folder);
  if (!list.length) box.append(h('div', { class: 'empty' }, 'ยังว่างอยู่ ลากไฟล์มาวางในหน้าต่างนี้ได้เลย'));
  for (const f of list) box.append(fileIcon(f));
}
function openFile(f) {
  if (f.kind === 'worddoc') { openWord(f); return; }
  if (f.kind === 'design') { openDesign(f); return; }
  if (f.html) {
    const pdf = f.kind === 'pdfdoc', box = h('div', { style: 'height:100%;display:flex;flex-direction:column' }, (pdf ? '<div class="pdfbar"><button class="btn2 pri" data-pr>🖨️ ปริ้นออกมาเซ็น</button><small>PDF · ปริ้นแล้วไปหยิบปากกาที่โต๊ะ เซ็น แล้วกดสแกนกลับเข้าเครื่อง</small></div>' : '') + zoomView(f.html));
    box.querySelector('[data-pr]')?.addEventListener('click', () => { printFile(f); });
    openWin('view-' + f.id, f.name, box, 500, 420, '#f4f0ff'); return;
  }
  if (f.kind === 'resume') { openResume(f); return; }
  if (f.kind === 'sheet') { openSheet(f); return; }
  if (f.src) {
    const v = h('div', { class: 'viewer' }, `<div class="pic"><img src="${esc(f.src)}" alt="${esc(f.name)}" referrerpolicy="no-referrer"></div><div class="acts"><button class="btn2 pri" data-a="wall">🖼️ ตั้งเป็นวอลเปเปอร์</button><button class="btn2 grn" data-a="chat">💬 ส่งในแชท</button></div>`);
    v.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'wall') setWallpaper(f.src); if (a === 'chat') { openChat(); sendFile(f); } });
    openWin('view-' + f.id, f.name, v, 460, 360, '#f4f0ff'); return;
  }
  let html = '';
  if (f.kind === 'rec') { const tot = f.lines.reduce((s, l) => s + (parseFloat(l[1].replace(/,/g, '')) || 0), 0); html = `<div class="paper"><h3>ใบเสร็จรับเงิน</h3><p style="color:#888;margin:0 0 8px">ร้านน่ารัก จำกัด · เลขที่ RC-${f.id.toUpperCase()}-0425</p><table><tr><th>รายการ</th><th>จำนวนเงิน</th></tr>${f.lines.map(l => `<tr><td>${esc(l[0])}</td><td>${esc(l[1])}</td></tr>`).join('')}<tr><th>รวม</th><th>${tot.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</th></tr></table></div>`; }
  if (f.kind === 'doc') html = `<div class="paper"><h3>บันทึกการประชุมทีม</h3><p>วาระที่ 1: ปิดงบประจำเดือนให้ทันวันที่ 5<br>วาระที่ 2: รวบรวมใบเสร็จทั้งหมดเข้าโฟลเดอร์บัญชี<br>วาระที่ 3: ทริปปีใหม่ ให้น้องใหม่ช่วยหาที่พักแล้วเสนอในกลุ่มแชท<br>วาระที่ 4: ซื้อขนมให้ทีมทุกวันศุกร์ (ทุกคนเห็นด้วย)</p><p style="color:#888">ผู้จดบันทึก: น้องหมีฝ่ายบัญชี</p></div>`;
  openWin('view-' + f.id, f.name, h('div', { style: 'height:100%' }, html), 460, 330, '#f4f0ff');
}
