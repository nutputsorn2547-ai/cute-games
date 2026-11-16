'use strict';
/* Office game (beta): "แคปน้อย" app — capture the simulated screen or the desk, crop it, draw/write on it,
   then save it as a .jpg file in the "รูปภาพ" folder (and optionally download the real file). */
const CAM_LIB = '../lib/html2canvas.min.js', CAM_MAX = 40, CAM_COL = ['#ff3b5c', '#ff9f1c', '#ffd400', '#2fbf5a', '#2f7bff', '#7c3aed', '#ffffff', '#222222'];
let camBusy = false, camLoad = null, camEd = null;
const camScript = () => camLoad || (camLoad = new Promise((ok, no) => {
  if (window.html2canvas) return ok(window.html2canvas);
  const s = document.createElement('script'); s.src = CAM_LIB; s.onload = () => ok(window.html2canvas); s.onerror = () => { camLoad = null; no(new Error('load')); }; document.head.append(s);
}));
GENERAL_APPS.push({ id: 'app-cam', n: 'แคปน้อย', e: '📸', c: '#ff6b8b', fn: () => camOpen() });
try { JL_APPS.add('app-cam'); } catch (e) {}
try { syncApps(); renderDesktop(); } catch (e) {}
document.querySelector('.camb')?.remove();
// phone tile
const _rp9 = renderPhone;
renderPhone = function () {
  _rp9();
  try { if (!phone.open || !phone.el || phone.app || phone.cur) return; const g = phone.el.querySelector('.phg'); if (g && !g.querySelector('[data-cam]')) g.insertAdjacentHTML('beforeend', '<button data-cam="1"><i style="background:#ff6b8b">📸</i>แคปน้อย</button>'); } catch (e) { console.error(e); }
};
document.addEventListener('click', e => { if (e.target.closest('[data-cam="1"]')) { try { closePhone(); } catch (x) {} camOpen(); } });

function camFlash() {
  const f = h('div', { id: 'camFlash' }); document.body.append(f); setTimeout(() => f.remove(), 450);
  try { S.noise(.08, 3500, .08, 'highpass'); S.tone(1800, 900, .06, .05, 'square'); } catch (e) {}
}
function camOpen() {
  if ($('camApp')) return;
  const a = h('div', { id: 'camApp' }, `<div class="cbox"><button class="cx" data-c="x">✕</button><h3>📸 แคปน้อย</h3><p class="soft">เลือกสิ่งที่จะถ่าย แล้วครอบ/วาด/เขียนบนรูปได้ก่อนบันทึก</p>
    <button class="btn2 pri" data-c="screen">🖥️ แคปหน้าจอจำลอง</button><button class="btn2 pri" data-c="desk">🪑 ถ่ายรูปโต๊ะทำงาน</button></div>`);
  a.addEventListener('click', e => { const c = e.target.closest('[data-c]')?.dataset.c; if (!c) { if (e.target === a) a.remove(); return; } if (c === 'x') a.remove(); else camShoot(c, a); });
  document.body.append(a);
}
async function camShoot(kind, appEl) {
  if (camBusy) return; camBusy = true;
  const isScr = kind === 'screen', el = isScr ? $('screen') : $('desk');
  if (appEl) appEl.style.visibility = 'hidden';
  try {
    const h2c = await camScript(); await new Promise(r => setTimeout(r, 60)); camFlash();
    const r = el.getBoundingClientRect(), sc = Math.min(1.5, 1100 / r.width);
    const cv = await h2c(el, { scale: sc, backgroundColor: null, logging: false, useCORS: true, ignoreElements: n => n.id === 'camFlash' || n.id === 'camApp' || n.id === 'hmChip' || n.id === 'monEdge' });
    appEl?.remove(); camEditor(cv, kind);
  } catch (e) { console.error(e); appEl && (appEl.style.visibility = ''); S.toast('⚠️ ถ่ายไม่สำเร็จ ลองใหม่อีกครั้งนะ', 2.4); }
  finally { camBusy = false; }
}

/* ---------- editor: crop + pen/highlighter/rect/arrow/text ---------- */
function camEditor(cv, kind) {
  const st = camEd = { bases: [cv], ops: [], tool: 'pen', col: CAM_COL[0], size: 1, crop: null, cur: null, kind };
  const o = h('div', { id: 'camEd' }, `<div class="cet">
    <div class="tl">${[['pen', '✏️ ปากกา'], ['hl', '🖍️ ไฮไลท์'], ['rect', '▭ กรอบ'], ['arrow', '➜ ลูกศร'], ['text', '🔤 ข้อความ'], ['crop', '✂️ ครอบ']].map(([k, t]) => `<button data-t="${k}" class="${k === 'pen' ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div class="cl">${CAM_COL.map((c, i) => `<button data-col="${c}" class="${i ? '' : 'on'}" style="background:${c}"></button>`).join('')}<span class="sz">${[1, 2, 3].map(n => `<button data-sz="${n - 1}" class="${n === 2 ? 'on' : ''}"><i style="width:${n * 4 + 2}px;height:${n * 4 + 2}px"></i></button>`).join('')}</span></div>
    <div class="ac"><button data-a="undo">↩️ ย้อน</button><button data-a="applycrop" id="camApply" hidden>✂️ ตัดตามกรอบ</button><button data-a="cancel">ยกเลิก</button><button data-a="dl">⬇️ บันทึกลงเครื่อง</button><button data-a="save" class="pri">💾 บันทึกเป็นไฟล์</button></div></div>
    <div class="cw" id="camWrap"><canvas id="camCv"></canvas></div><p class="soft cht" id="camHint">ลากบนรูปเพื่อวาด · เลือก “ครอบ” เพื่อตัดเฉพาะส่วนที่ต้องการ</p>`);
  document.body.append(o); const cvs = $('camCv'); camDraw();
  o.addEventListener('click', e => {
    const t = e.target.closest('[data-t]'), c = e.target.closest('[data-col]'), z = e.target.closest('[data-sz]'), a = e.target.closest('[data-a]');
    if (t) { st.tool = t.dataset.t; st.crop = null; o.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b === t)); $('camApply').hidden = true; $('camHint').textContent = st.tool === 'crop' ? 'ลากเป็นกรอบสี่เหลี่ยมบนส่วนที่ต้องการ แล้วกด “ตัดตามกรอบ”' : st.tool === 'text' ? 'แตะตรงที่ต้องการเขียน แล้วพิมพ์ข้อความ' : 'ลากบนรูปเพื่อวาด'; camDraw(); }
    if (c) { st.col = c.dataset.col; o.querySelectorAll('[data-col]').forEach(b => b.classList.toggle('on', b === c)); }
    if (z) { st.size = +z.dataset.sz; o.querySelectorAll('[data-sz]').forEach(b => b.classList.toggle('on', b === z)); }
    if (a) camAct(a.dataset.a, o);
  });
  cvs.addEventListener('pointerdown', camDown); cvs.addEventListener('pointermove', camMove); window.addEventListener('pointerup', camUp);
}
const camBase = () => camEd.bases[camEd.bases.length - 1];
function camPt(e) { const c = $('camCv'), r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; }
const camW = (st, W) => (st.size + 1) * W / 200 + 1;
function camPaint(ctx, st, W) {
  for (const p of st.ops) {
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = p.c; ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = p.w;
    if (p.k === 'pen' || p.k === 'hl') { ctx.globalAlpha = p.k === 'hl' ? .38 : 1; if (p.k === 'hl') ctx.lineWidth = p.w * 4; ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (p.pts.length === 1) ctx.lineTo(p.pts[0][0] + .1, p.pts[0][1]); ctx.stroke(); }
    else if (p.k === 'rect') { const [a, b] = p.pts; ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
    else if (p.k === 'arrow') { const [a, b] = p.pts, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = p.w * 5 + 8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang - .45), b[1] - L * Math.sin(ang - .45)); ctx.lineTo(b[0] - L * Math.cos(ang + .45), b[1] - L * Math.sin(ang + .45)); ctx.closePath(); ctx.fill(); }
    else if (p.k === 'text') { ctx.font = `700 ${p.s}px "Mali","Prompt",sans-serif`; ctx.textBaseline = 'top'; ctx.lineWidth = p.s / 7; ctx.strokeStyle = p.c === '#ffffff' || p.c === '#ffd400' ? '#000a' : '#fffa'; ctx.strokeText(p.txt, p.x, p.y); ctx.fillText(p.txt, p.x, p.y); }
    ctx.restore();
  }
}
function camDraw() {
  const st = camEd, c = $('camCv'); if (!c) return; const b = camBase(); c.width = b.width; c.height = b.height;
  const x = c.getContext('2d'); x.drawImage(b, 0, 0); camPaint(x, st, b.width);
  if (st.tool === 'crop' && st.crop) { const [a, bb] = st.crop, rx = Math.min(a[0], bb[0]), ry = Math.min(a[1], bb[1]), rw = Math.abs(a[0] - bb[0]), rh = Math.abs(a[1] - bb[1]); x.save(); x.fillStyle = '#0008'; x.beginPath(); x.rect(0, 0, c.width, c.height); x.rect(rx, ry, rw, rh); x.fill('evenodd'); x.strokeStyle = '#fff'; x.setLineDash([10, 6]); x.lineWidth = Math.max(2, c.width / 400); x.strokeRect(rx, ry, rw, rh); x.restore(); }
}
function camDown(e) {
  const st = camEd, p = camPt(e), W = camBase().width; e.preventDefault();
  if (st.tool === 'text') { camText(e, p, W); return; }
  $('camCv').setPointerCapture?.(e.pointerId);
  if (st.tool === 'crop') { st.crop = [p, p]; st.cur = 'crop'; return; }
  const op = { k: st.tool, c: st.col, w: camW(st, W), pts: [p] }; if (st.tool === 'rect' || st.tool === 'arrow') op.pts.push(p);
  st.ops.push(op); st.cur = op; camDraw();
}
function camMove(e) {
  const st = camEd; if (!st || !st.cur) return; const p = camPt(e);
  if (st.cur === 'crop') st.crop[1] = p; else if (st.cur.k === 'pen' || st.cur.k === 'hl') st.cur.pts.push(p); else st.cur.pts[1] = p;
  camDraw();
}
function camUp() {
  const st = camEd; if (!st || !st.cur) return;
  if (st.cur === 'crop') { const [a, b] = st.crop; if (Math.abs(a[0] - b[0]) > 12 && Math.abs(a[1] - b[1]) > 12) $('camApply').hidden = false; else st.crop = null; }
  st.cur = null; camDraw();
}
function camText(e, p, W) {
  document.getElementById('camTxt')?.remove(); const wrap = $('camWrap'), r = wrap.getBoundingClientRect();
  const i = h('input', { id: 'camTxt', maxlength: 60, placeholder: 'พิมพ์ข้อความแล้วกด Enter' }); i.style.left = Math.max(0, Math.min(e.clientX - r.left, r.width - 180)) + 'px'; i.style.top = (e.clientY - r.top) + 'px'; i.style.color = camEd.col;
  wrap.append(i); setTimeout(() => i.focus(), 30);
  const done = () => { const v = i.value.trim(); i.remove(); if (v) { camEd.ops.push({ k: 'text', c: camEd.col, x: p[0], y: p[1], s: Math.round(W / 26 * (1 + camEd.size * .45)), txt: v }); camDraw(); } };
  i.addEventListener('keydown', k => { if (k.key === 'Enter') done(); if (k.key === 'Escape') i.remove(); }); i.addEventListener('blur', done);
}
function camFinal(maxW = 1000) {
  const st = camEd, b = camBase(), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const x = c.getContext('2d'); x.drawImage(b, 0, 0); camPaint(x, st, b.width);
  if (c.width <= maxW) return c; const s = maxW / c.width, d = document.createElement('canvas'); d.width = maxW; d.height = Math.round(c.height * s); d.getContext('2d').drawImage(c, 0, 0, d.width, d.height); return d;
}
function camAct(a, o) {
  const st = camEd;
  if (a === 'undo') { if (st.ops.length) st.ops.pop(); else if (st.bases.length > 1) st.bases.pop(); st.crop = null; $('camApply').hidden = true; camDraw(); return; }
  if (a === 'applycrop') { const [p, q] = st.crop, b = camBase(), rx = Math.round(Math.min(p[0], q[0])), ry = Math.round(Math.min(p[1], q[1])), rw = Math.round(Math.abs(p[0] - q[0])), rh = Math.round(Math.abs(p[1] - q[1]));
    const full = document.createElement('canvas'); full.width = b.width; full.height = b.height; const fx = full.getContext('2d'); fx.drawImage(b, 0, 0); camPaint(fx, st, b.width);
    const nb = document.createElement('canvas'); nb.width = rw; nb.height = rh; nb.getContext('2d').drawImage(full, rx, ry, rw, rh, 0, 0, rw, rh); st.bases.push(nb); st.ops = []; st.crop = null; $('camApply').hidden = true; camDraw(); return; }
  if (a === 'cancel') { camClose(); return; }
  if (a === 'dl') { const url = camFinal().toDataURL('image/jpeg', .85), l = document.createElement('a'); l.href = url; l.download = `cute-office-${Date.now()}.jpg`; document.body.append(l); l.click(); l.remove(); return; }
  if (a === 'save') {
    const isScr = st.kind === 'screen', tag = isScr ? 'แคปหน้าจอ' : 'ภาพถ่าย';
    if (FILES.filter(f => f.tag === 'แคปหน้าจอ' || f.tag === 'ภาพถ่าย').length >= CAM_MAX) { S.toast('📁 รูปแคป/ถ่ายเต็มแล้ว ลบรูปเก่าในโฟลเดอร์ "รูปภาพ" ก่อนนะ', 3); return; }
    const n = FILES.filter(f => f.tag === tag).length + 1, f = { id: 'u' + (++uid), name: `${tag}-${n}.jpg`, type: 'jpg', kind: 'img', src: camFinal().toDataURL('image/jpeg', .72), tag, loc: 'pics' };
    FILES.push(f); try { renderDesktop(); } catch (e) {} camClose(); S.toast(`📸 บันทึก ${f.name} ในโฟลเดอร์ "รูปภาพ" แล้ว`, 2.6); try { complete('n12cam'); } catch (e) {}
  }
}
function camClose() { $('camEd')?.remove(); window.removeEventListener('pointerup', camUp); camEd = null; }
