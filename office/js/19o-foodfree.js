'use strict';
/* Office game (beta): food on the desk is now one loose item per dish — drag each one anywhere on the desk.
   Positions (x,y in %) are stored on the item itself (lx.items) so they are saved with the game. Click = open the food panel. */
const fdEls = {};
function fdFreeDown(e, it, el) {
  e.stopPropagation(); const r = desk.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, l = it.x, t = it.y; el._moved = false; el.setPointerCapture?.(e.pointerId);
  const mv = ev => {
    const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!el._moved && Math.hypot(dx, dy) < 8) return;
    if (!el._moved) { el._moved = true; el.classList.add('lift'); el.style.zIndex = 40; }
    it.x = Math.max(0, Math.min(90, l + dx / r.width * 100)); it.y = Math.max(0, Math.min(82, t + dy / r.height * 100)); el.style.left = it.x + '%'; el.style.top = it.y + '%';
  };
  const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('lift'); if (el._moved) { el.style.zIndex = 6; setTimeout(() => { el._moved = false; }, 60); try { if (typeof saveGame === 'function') saveGame(); } catch (x) {} } };
  el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
fdBuildDesk = function () {
  if (!fdFridgeEl) { fdFridgeEl = _deskItem('', 91, 30, 0, `<div class="fdfr" title="ตู้เย็น (คลิกเพื่อเปิด)">${FRIDGE_SVG}</div>`, 'deco'); fdFridgeEl.addEventListener('click', () => fdOpen()); }
  if (fdBoxEl) { fdBoxEl.remove(); fdBoxEl = null; }
  const ds = fdDesk(), keep = new Set(ds.map(i => i.id));
  for (const k in fdEls) if (!keep.has(+k)) { fdEls[k].remove(); delete fdEls[k]; }
  ds.forEach((it, k) => {
    if (typeof it.x !== 'number') { it.x = 52 + (k % 4) * 10; it.y = 38 + Math.floor(k / 4) * 17 + (k % 2) * 3; it.r = +(Math.random() * 10 - 5).toFixed(1); }
    let el = fdEls[it.id];
    if (!el) {
      el = fdEls[it.id] = h('div', { class: 'item fdit', 'data-id': 'deco', title: 'ลากไปวางตรงไหนก็ได้ · คลิกเพื่อกิน/แช่ตู้เย็น' }); desk.append(el);
      el.addEventListener('pointerdown', e => fdFreeDown(e, it, el)); el.addEventListener('dblclick', e => e.stopPropagation());
      el.addEventListener('click', e => { e.stopPropagation(); if (el._moved) { el._moved = false; return; } fdOpen(); });
    }
    el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.transform = `rotate(${it.r || 0}deg)`; if (!el.style.zIndex) el.style.zIndex = 6;
    const html = fdImg(it) + (fdLeft(it)[1] ? '<i>ใกล้เสีย</i>' : ''); if (el._h !== html) { el._h = html; el.innerHTML = html; }
  });
};
// food loaded from a save: rebuild on the next tick (lx is restored by the loadGame wrapper)
setTimeout(() => { try { fdBuildDesk(); } catch (x) {} }, 600);
