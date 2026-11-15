"use strict";
// Office game (beta) — full-screen mode for phones/tablets: the fake monitor fills the device, the task note folds into a top bar,
// and a double-tap on touch screens counts as a double-click.
const fsMode = { on: false, api: false };
const fsTyping = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
function fsFit(force) {
  if (fsTyping() && force !== true) return; // กำลังพิมพ์: แป้นพิมพ์ทำให้ขนาดจอเปลี่ยน ห้ามจัดหน้าใหม่ (ไม่งั้นแป้นเด้งออก)
  const small = fsMode.on && (innerWidth < 900 || innerHeight < 600); 
  const sr = screen.getBoundingClientRect();
  for (const W of wins.values()) {
    const el = W.el, w = Math.min(el.offsetWidth, sr.width - 8), hg = Math.min(el.offsetHeight, sr.height - 52);
    if (w !== el.offsetWidth) el.style.width = w + 'px'; if (hg !== el.offsetHeight) el.style.height = hg + 'px';
    el.style.left = clamp(el.offsetLeft, 0, Math.max(0, sr.width - w)) + 'px'; el.style.top = clamp(el.offsetTop, 0, Math.max(0, sr.height - hg - 44)) + 'px';
  }
  const cols = Math.max(1, Math.floor((icons.clientWidth - 20) / CELLW)), rows = Math.max(1, Math.floor((icons.clientHeight - 10) / CELLH)); for (const k in deskPos) if (deskPos[k][0] >= cols || deskPos[k][0] < 0 || deskPos[k][1] >= rows) delete deskPos[k];
  renderDesktop();
}
let fsT = 0; const fsLater = () => { clearTimeout(fsT); fsT = setTimeout(fsFit, 120); };
let fsLay = {};
function fsLayExport() { const o = { ...fsLay }; o[fsMode.on ? 'fs' : 'n'] = deskPos; return JSON.parse(JSON.stringify(o)); }
function fsLayLoad(l) { fsLay = l && typeof l === 'object' ? l : {}; delete fsLay.n; if (fsMode.on && fsLay.fs) deskPos = JSON.parse(JSON.stringify(fsLay.fs)); }
function fsSet(on, viaApi) {
  if (window.__setScale) window.__setScale(on ? .49 : .7);
  if (fsMode.on === on) return;
  fsLay[fsMode.on ? 'fs' : 'n'] = JSON.parse(JSON.stringify(deskPos)); // จำการจัดไอคอนของโหมดที่ออกจาก
  fsMode.on = on; if (fsLay[on ? 'fs' : 'n']) deskPos = JSON.parse(JSON.stringify(fsLay[on ? 'fs' : 'n'])); // คืนการจัดของโหมดที่เข้า
  document.body.classList.toggle('fs', on);
  $('tasks').classList.remove('fsopen'); renderTasks();
  const de = document.documentElement;
  if (on) {
    if (viaApi !== false && de.requestFullscreen) de.requestFullscreen({ navigationUI: 'hide' }).then(() => { fsMode.api = true; try { window.screen.orientation && window.screen.orientation.lock && window.screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
    if (innerHeight > innerWidth) S.toast('📱 หมุนมือถือเป็นแนวนอนจะเล่นง่ายกว่านะ', 3.2);
  } else {
    try { window.screen.orientation && window.screen.orientation.unlock && window.screen.orientation.unlock(); } catch (e) {}
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); fsMode.api = false;
  }
  setTimeout(fsFit, 60); setTimeout(fsFit, 450);
}
$('fsBtn').addEventListener('click', () => fsSet(true));
$('fsExit').addEventListener('click', () => fsSet(false));
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && fsMode.api && fsMode.on) { fsMode.api = false; fsSet(false, false); } });
addEventListener('resize', fsLater); addEventListener('orientationchange', fsLater);
/* touch: double-tap = double-click (open files, desktop menu, edit a sheet cell) */
let lastTap = null;
document.addEventListener('pointerup', e => {
  if (e.pointerType !== 'touch') return; const now = performance.now(), t = e.target;
  if (lastTap && now - lastTap.t < 380 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 28) { lastTap = null; t.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, view: window })); }
  else lastTap = { t: now, x: e.clientX, y: e.clientY };
}, true);

// จัดไอคอนใหม่ทุกครั้งที่พื้นที่เดสก์ท็อปเปลี่ยนขนาด (กันซ้อนกัน)
(function () {
  let t = 0, lw = 0, lh = 0;
  const go = () => { clearTimeout(t); t = setTimeout(() => { if (fsTyping()) return; const w = icons.clientWidth, h = icons.clientHeight; if (w < 120 || h < 120 || (w === lw && h === lh)) return; lw = w; lh = h; renderDesktop(); }, 120); };
  if (window.ResizeObserver) new ResizeObserver(go).observe(icons);
  addEventListener('resize', go);
})();

// แจ้งเตือน (toast) ขึ้นบนจอจำลองมุมขวาบนเมื่ออยู่มุมมองจอ; มุมมองโต๊ะใช้ตำแหน่งเดิม
setInterval(() => {
  const hn = $('hint'), want = currentView === 'desk' ? document.body : screen;
  if (hn && hn.parentNode !== want) want.append(hn);
  hn && hn.classList.toggle('onscr', want === screen);
}, 250);

addEventListener('focusout', () => setTimeout(() => { if (!fsTyping()) fsFit(); }, 350));
