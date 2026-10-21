// Orientation helpers shared by the pad and the games.
const D2R = Math.PI / 180;

// W3C deviceorientation (alpha, beta, gamma in degrees, ZXY order) -> quaternion [w,x,y,z]
export function eulerToQuat(alpha, beta, gamma) {
  const x = beta * D2R / 2, y = gamma * D2R / 2, z = alpha * D2R / 2;
  const cX = Math.cos(x), cY = Math.cos(y), cZ = Math.cos(z), sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
  return [cX*cY*cZ - sX*sY*sZ, sX*cY*cZ - cX*sY*sZ, cX*sY*cZ + sX*cY*sZ, cX*cY*sZ + sX*sY*cZ];
}

export function rotate(q, v) {
  const [w, x, y, z] = q, [vx, vy, vz] = v;
  const tx = 2 * (y*vz - z*vy), ty = 2 * (z*vx - x*vz), tz = 2 * (x*vy - y*vx);
  return [vx + w*tx + (y*tz - z*ty), vy + w*ty + (z*tx - x*tz), vz + w*tz + (x*ty - y*tx)];
}

export function nlerp(a, b, t) {
  const d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3], s = d < 0 ? -1 : 1;
  const r = a.map((v, i) => v + (s * b[i] - v) * t), n = Math.hypot(...r) || 1;
  return r.map(v => v / n);
}

export const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// Phone held screen-up, top edge pointing at the PC screen (like a remote).
// yaw: turn left/right, pitch: nose up/down, roll: twist.
// axis: which device axis points "forward". [0,1,0] = top edge (phone flat like a remote),
// [0,0,-1] = back camera (phone upright like a viewfinder). Pick it with bestForwardAxis().
export function pointerAngles(q, axis = [0, 1, 0]) {
  const f = rotate(q, axis), r = rotate(q, [1, 0, 0]);
  return {
    yaw: Math.atan2(f[0], f[1]),
    pitch: Math.asin(Math.max(-1, Math.min(1, f[2]))),
    roll: Math.asin(Math.max(-1, Math.min(1, -r[2]))),
  };
}

// Choose whichever forward axis is closer to horizontal right now, so both grips aim sensibly
// and yaw never comes from a near-vertical vector (which makes it spin and flip).
export function bestForwardAxis(q) {
  const top = rotate(q, [0, 1, 0]), back = rotate(q, [0, 0, -1]);
  return Math.abs(top[2]) <= Math.abs(back[2]) ? [0, 1, 0] : [0, 0, -1];
}

// One Euro filter: heavy smoothing when the hand is still, little lag when it moves fast.
export class OneEuro {
  constructor(minCutoff = 0.4, beta = 1.2, dCutoff = 1.5) { Object.assign(this, { minCutoff, beta, dCutoff }); this.x = null; this.dx = 0; }
  static alpha(cutoff, dt) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  reset(v) { this.x = v; this.dx = 0; }
  filter(v, dt) {
    if (this.x === null || !(dt > 0)) { this.reset(v); return v; }
    const dv = (v - this.x) / dt;
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dv - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (v - this.x);
    return this.x;
  }
}
