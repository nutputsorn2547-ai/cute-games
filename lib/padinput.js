// Shared phone-controller input for the PC games: calibration, smoothing,
// flick detection, button/tap edges and the reel wheel.
import { pointerAngles, bestForwardAxis, wrap, OneEuro } from './aim.js?v=3';

export class PadInput {
  constructor({ minCutoff = 0.6, beta = 1.6 } = {}) {
    this.q = [1, 0, 0, 0];
    this.last = -1e9;
    this.cal = null; this.needCal = false;
    this.axis = [0, 1, 0];
    this.fYaw = new OneEuro(minCutoff, beta); this.fPitch = new OneEuro(minCutoff, beta); this.fRoll = new OneEuro(minCutoff, beta);
    this.yawU = 0; this.prevYaw = null;
    this.f = { yaw: 0, pitch: 0, roll: 0 };   // filtered absolute
    this.raw = { yaw: 0, pitch: 0, roll: 0 }; // unfiltered relative (low latency)
    this.btn = {}; this.taps = {}; this.tapEvents = {};
    this.reelAcc = 0; this.prevReel = null;
    this.lookAcc = [0, 0]; this.prevLook = null;
    this.hist = []; this.flickDown = 0; this.flickUp = 0; this.lastFlick = 0;
    this.onRecal = null;
  }
  get live() { return performance.now() - this.last < 1500; }
  reset() { this.cal = null; this.needCal = false; this.btn = {}; this.taps = {}; this.tapEvents = {}; this.prevReel = null; this.prevLook = null; this.last = -1e9; this.hist = []; }
  feed(d) {
    if (!d || !Array.isArray(d.q)) return;
    this.q = d.q.map(Number); this.last = performance.now();
    if (!this.cal) this.needCal = true;
    const taps = d.taps || {};
    for (const k in taps) {
      if (this.taps[k] !== undefined && taps[k] !== this.taps[k]) {
        if (k === 'recal') this.needCal = true;
        else this.tapEvents[k] = (this.tapEvents[k] || 0) + 1;
      }
    }
    this.taps = { ...taps };
    this.btn = d.b || {};
    if (typeof d.reel === 'number') { if (this.prevReel !== null) this.reelAcc += d.reel - this.prevReel; this.prevReel = d.reel; }
    if (Array.isArray(d.look)) { if (this.prevLook) { this.lookAcc[0] += d.look[0] - this.prevLook[0]; this.lookAcc[1] += d.look[1] - this.prevLook[1]; } this.prevLook = d.look.slice(); }
    if (this.cal) {
      const a = pointerAngles(this.q, this.axis), now = this.last;
      const p = a.pitch - this.cal.pitch;
      this.hist.push({ t: now, p }); while (this.hist.length && now - this.hist[0].t > 600) this.hist.shift();
      const back = this.hist.find(h => now - h.t <= 140);
      if (back && now - back.t > 40 && now - this.lastFlick > 220) {
        const rate = (p - back.p) / ((now - back.t) / 1000), peak = Math.max(...this.hist.map(h => h.p));
        if (rate < -3 && peak - p > .25) { this.flickDown = Math.max(this.flickDown, Math.min(1, (-rate - 2) / 7)); this.lastFlick = now; }
        else if (rate > 3.2) { this.flickUp = Math.max(this.flickUp, Math.min(1, (rate - 2) / 7)); this.lastFlick = now; }
      }
    }
  }
  _sample(dt, reset) {
    const a = pointerAngles(this.q, this.axis);
    if (this.prevYaw === null) this.yawU = a.yaw; else this.yawU += wrap(a.yaw - this.prevYaw);
    this.prevYaw = a.yaw;
    if (reset) { this.fYaw.reset(this.yawU); this.fPitch.reset(a.pitch); this.fRoll.reset(a.roll); this.f = { yaw: this.yawU, pitch: a.pitch, roll: a.roll }; }
    else this.f = { yaw: this.fYaw.filter(this.yawU, dt), pitch: this.fPitch.filter(a.pitch, dt), roll: this.fRoll.filter(a.roll, dt) };
    if (this.cal) this.raw = { yaw: this.yawU - this.cal.yaw, pitch: a.pitch - this.cal.pitch, roll: a.roll - this.cal.roll };
  }
  recalibrate() {
    this.axis = bestForwardAxis(this.q); this.prevYaw = null; this._sample(0, true);
    this.cal = { yaw: this.f.yaw, pitch: this.f.pitch, roll: this.f.roll }; this.hist = [];
    this.onRecal && this.onRecal();
  }
  /** call once per frame */
  update(dt) {
    if (!this.live) return;
    if (this.needCal) { this.needCal = false; this.recalibrate(); }
    else this._sample(dt, false);
  }
  /** smoothed aim relative to calibration */
  aim() { return this.cal ? { yaw: this.f.yaw - this.cal.yaw, pitch: this.f.pitch - this.cal.pitch, roll: this.f.roll - this.cal.roll } : { yaw: 0, pitch: 0, roll: 0 }; }
  tap(name) { const n = this.tapEvents[name] || 0; this.tapEvents[name] = 0; return n; }
  takeReel() { const r = this.reelAcc; this.reelAcc = 0; return r; }
  takeLook() { const l = this.lookAcc; this.lookAcc = [0, 0]; return l; }
  takeFlickDown() { const f = this.flickDown; this.flickDown = 0; return f; }
  takeFlickUp() { const f = this.flickUp; this.flickUp = 0; return f; }
}

/** Small shared pairing/QR helper. */
export function drawQr(el, url) {
  try { const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); el.innerHTML = qr.createSvgTag(5, 2); } catch (e) { el.textContent = url; }
}
