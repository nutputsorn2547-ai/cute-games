// Virtual mouse for the PC games.
// While free it follows the real cursor; while pointer-locked it moves by raw deltas,
// so dragging is no longer stopped by the edge of the browser window or the monitor.
//   lock: 'press'   -> locked only while the left button is held (grab, pull, pour)
//         'session' -> locked from the first click on the scene until Esc
// x, y are in screen NDC (-1..1, y grows downward), clamped to ±limit.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class VMouse {
  constructor(el, { lock = 'press', limit = 1, enabled = () => true } = {}) {
    Object.assign(this, { el, lock, limit, enabled, x: 0, y: 0, down: false, moved: false });
    addEventListener('mousemove', e => {
      if (this.locked) {
        // some browsers report one bogus jump right when the lock starts: skip deltas bigger than ~40% of the window
        if (Math.abs(e.movementX) > innerWidth * .4 || Math.abs(e.movementY) > innerHeight * .4) return;
        this.x += e.movementX / innerWidth * 2; this.y += e.movementY / innerHeight * 2;
      }
      else { this.x = e.clientX / innerWidth * 2 - 1; this.y = e.clientY / innerHeight * 2 - 1; }
      this.x = clamp(this.x, -this.limit, this.limit); this.y = clamp(this.y, -this.limit, this.limit);
      this.moved = true;
    });
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      this.down = true;
      if (!this.locked && this.enabled()) this.grab();
    });
    addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      this.down = false;
      if (this.lock === 'press') this.release();
    });
  }
  get locked() { return document.pointerLockElement === this.el; }
  grab() { try { const p = this.el.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  release() { if (this.locked) document.exitPointerLock(); }
}
