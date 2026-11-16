'use strict';
/* Office game (beta): 📸 screenshot of the simulated monitor, 📷 photo of the desk.
   The picture becomes a .jpg file in the "รูปภาพ" folder (viewable, sendable, wallpaper-able). */
const CAM_LIB = '../lib/html2canvas.min.js', CAM_MAX = 40;
let camBusy = false, camLoad = null;
const camScript = () => camLoad || (camLoad = new Promise((ok, no) => {
  if (window.html2canvas) return ok(window.html2canvas);
  const s = document.createElement('script'); s.src = CAM_LIB; s.onload = () => ok(window.html2canvas); s.onerror = () => { camLoad = null; no(new Error('load')); }; document.head.append(s);
}));
function camFlash() {
  const f = h('div', { id: 'camFlash' }); document.body.append(f); setTimeout(() => f.remove(), 450);
  try { S.noise(.08, 3500, .08, 'highpass'); S.tone(1800, 900, .06, .05, 'square'); } catch (e) {}
}
async function camShoot(kind) {
  if (camBusy) return; camBusy = true;
  const isScr = kind === 'screen', el = isScr ? $('screen') : $('desk');
  const btns = document.querySelectorAll('.camb'); btns.forEach(b => b.disabled = true);
  try {
    const h2c = await camScript(); camFlash();
    const r = el.getBoundingClientRect(), sc = Math.min(1, 900 / r.width);
    const cv = await h2c(el, { scale: sc, backgroundColor: null, logging: false, useCORS: true, allowTaint: false, ignoreElements: n => n.classList && (n.classList.contains('camb') || n.id === 'camFlash' || n.id === 'camPrev' || n.id === 'hmChip' || n.id === 'monEdge') });
    const url = cv.toDataURL('image/jpeg', .72);
    const n = FILES.filter(f => f.tag === (isScr ? 'แคปหน้าจอ' : 'ภาพถ่าย')).length + 1;
    if (FILES.filter(f => f.tag === 'แคปหน้าจอ' || f.tag === 'ภาพถ่าย').length >= CAM_MAX) { S.toast('📁 รูปแคป/ถ่ายเต็มแล้ว ลบรูปเก่าในโฟลเดอร์ "รูปภาพ" ก่อนนะ', 3); return; }
    const f = { id: 'u' + (++uid), name: `${isScr ? 'แคปหน้าจอ' : 'ภาพถ่าย'}-${n}.jpg`, type: 'jpg', kind: 'img', src: url, tag: isScr ? 'แคปหน้าจอ' : 'ภาพถ่าย', loc: 'pics' };
    FILES.push(f); try { renderDesktop(); } catch (e) {}
    camPreview(f);
  } catch (e) { console.error(e); S.toast('⚠️ ถ่ายไม่สำเร็จ ลองใหม่อีกครั้งนะ', 2.4); }
  finally { camBusy = false; btns.forEach(b => b.disabled = false); }
}
function camPreview(f) {
  $('camPrev')?.remove();
  const p = h('div', { id: 'camPrev' }, `<img src="${f.src}" alt=""><div><b>${esc(f.name)}</b><small>บันทึกในโฟลเดอร์ "รูปภาพ" แล้ว</small><div class="r"><button class="btn2" data-c="open">เปิดดู</button><button class="btn2" data-c="dl">⬇️ บันทึกลงเครื่อง</button></div></div><button class="x" data-c="x">✕</button>`);
  p.addEventListener('click', e => {
    const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return;
    if (c === 'open') { try { openFile(f); } catch (x) {} p.remove(); }
    if (c === 'dl') { const a = document.createElement('a'); a.href = f.src; a.download = f.name; document.body.append(a); a.click(); a.remove(); }
    if (c === 'x') p.remove();
  });
  document.body.append(p); setTimeout(() => p.isConnected && p.classList.add('out'), 6000); setTimeout(() => p.remove(), 6600);
  S.toast(`📸 ${f.name} อยู่ในโฟลเดอร์ "รูปภาพ"`, 2.4);
}
function camInit() {
  const mk = (par, kind, txt, cls) => { if (!par || par.querySelector('.camb')) return; const b = h('button', { class: 'camb ' + cls, type: 'button', 'aria-label': txt }, txt); b.addEventListener('click', e => { e.stopPropagation(); camShoot(kind); }); par.append(b); };
  mk($('vScreen'), 'screen', '📸 แคปหน้าจอ', 'scr'); mk($('vDesk'), 'desk', '📷 ถ่ายรูปโต๊ะ', 'dsk');
}
camInit();
