"use strict";
// Office game (beta) — full-screen mode for phones/tablets: the fake monitor fills the device, the task note folds into a top bar,
// and a double-tap on touch screens counts as a double-click.
const fsMode = { on: false, api: false };
function fsFit() {
  const small = fsMode.on && (innerWidth < 900 || innerHeight < 600); document.body.classList.toggle('fs-sm', small); CELLW = small ? 76 : 100; CELLH = small ? 80 : 104;
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
function fsSet(on, viaApi) {
  if (fsMode.on === on) return; fsMode.on = on; document.body.classList.toggle('fs', on);
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
