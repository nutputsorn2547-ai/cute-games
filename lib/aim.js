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
export function pointerAngles(q) {
  const f = rotate(q, [0, 1, 0]), r = rotate(q, [1, 0, 0]);
  return {
    yaw: Math.atan2(f[0], f[1]),
    pitch: Math.asin(Math.max(-1, Math.min(1, f[2]))),
    roll: Math.asin(Math.max(-1, Math.min(1, -r[2]))),
  };
}
