// Beat tracking for an AudioBuffer (offline, in the browser) and note-map generation.

const SR = 22050, HOP = 512, FPS = SR / HOP;

async function bandEnvelope(buffer, type, freq) {
  const len = Math.ceil(buffer.duration * SR);
  const off = new OfflineAudioContext(1, len, SR);
  const src = off.createBufferSource(); src.buffer = buffer;
  const f = off.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = .7;
  src.connect(f).connect(off.destination); src.start();
  const x = (await off.startRendering()).getChannelData(0);
  const n = Math.floor(x.length / HOP), env = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let k = i * HOP, e = k + HOP; k < e; k++) s += x[k] * x[k]; env[i] = Math.sqrt(s / HOP); }
  return env;
}
function onsetFrom(env) {
  const n = env.length, o = new Float32Array(n);
  for (let i = 1; i < n; i++) o[i] = Math.max(0, Math.log1p(env[i] * 100) - Math.log1p(env[i - 1] * 100));
  // subtract a moving average so loud sections don't dominate
  const w = 16, out = new Float32Array(n); let acc = 0;
  for (let i = 0; i < n; i++) { acc += o[i]; if (i >= w) acc -= o[i - w]; out[i] = Math.max(0, o[i] - acc / Math.min(i + 1, w)); }
  return out;
}

/** -> { bpm, offset, beats:[sec], strength(t) } */
export async function analyzeBeats(buffer) {
  const [low, high] = await Promise.all([bandEnvelope(buffer, 'lowpass', 180), bandEnvelope(buffer, 'highpass', 1800)]);
  const lo = onsetFrom(low), hi = onsetFrom(high), n = Math.min(lo.length, hi.length);
  const on = new Float32Array(n); let mx = 1e-9;
  for (let i = 0; i < n; i++) { on[i] = lo[i] + .6 * hi[i]; mx = Math.max(mx, on[i]); }
  for (let i = 0; i < n; i++) on[i] /= mx;
  // tempo by autocorrelation, softly preferring ~120 BPM
  let bestL = 0, bestS = -1;
  const Lmin = Math.floor(60 / 185 * FPS), Lmax = Math.ceil(60 / 68 * FPS), score = [];
  for (let L = Lmin; L <= Lmax; L++) {
    let s = 0; for (let i = 0; i + L < n; i++) s += on[i] * on[i + L];
    const bpm = 60 * FPS / L, w = Math.exp(-.5 * (Math.log2(bpm / 120) / .9) ** 2);
    score[L] = s * w; if (score[L] > bestS) { bestS = score[L]; bestL = L; }
  }
  // parabolic refinement of the lag
  let Lr = bestL;
  if (score[bestL - 1] !== undefined && score[bestL + 1] !== undefined) {
    const a = score[bestL - 1], b = score[bestL], c = score[bestL + 1], den = a - 2 * b + c;
    if (den !== 0) Lr = bestL + .5 * (a - c) / den;
  }
  const period = Lr / FPS, bpm = 60 / period;
  // phase: comb filter over one period
  let bestPh = 0, bestPS = -1;
  for (let ph = 0; ph < Lr; ph += .5) {
    let s = 0; for (let t = ph; t < n; t += Lr) { const i = Math.round(t); s += on[i] + .5 * (on[i - 1] || 0) + .5 * (on[i + 1] || 0); }
    if (s > bestPS) { bestPS = s; bestPh = ph; }
  }
  const offset = bestPh / FPS;
  const strength = t => { const i = Math.round(t * FPS); let m = 0; for (let k = i - 2; k <= i + 2; k++) m = Math.max(m, on[k] || 0); return m; };
  const beats = []; for (let t = offset; t < buffer.duration; t += period) beats.push(t);
  return { bpm, offset, period, beats, strength, duration: buffer.duration };
}

const DIRS = ['down', 'up', 'left', 'right'];
/**
 * Build a note map. info: {period, offset, duration, strength?}
 * level: 0 easy, 1 normal, 2 hard
 */
export function makeNotes(info, level = 1, startAt = 2) {
  const notes = [], { period, offset, duration } = info;
  const thr = [.18, .1, .06][level], minGap = [period * 1.9, period * .95, period * .45][level];
  let lastT = -9, lastDir = 'up', col = 1, row = 0, k = 0;
  const strs = [];
  for (let t = offset; t < duration - 1; t += period / 2) strs.push(info.strength ? info.strength(t) : (Math.round((t - offset) / period * 2) % 2 === 0 ? .5 : .2));
  const sorted = strs.slice().sort((a, b) => a - b), p50 = sorted[Math.floor(sorted.length * .5)] || 0;
  for (let t = offset; t < duration - 1; t += period / 2, k++) {
    if (t < startAt) continue;
    const onBeat = k % 2 === 0, s = strs[k] - p50 * .5;
    const want = onBeat ? s > thr : (level === 2 && s > thr * 2.2);
    if (!want || t - lastT < minGap - 1e-3) continue;
    // natural swing flow: alternate down/up, sometimes a sideways pair
    let dir;
    if (Math.random() < .22) dir = Math.random() < .5 ? 'left' : 'right';
    else dir = lastDir === 'down' ? 'up' : 'down';
    if (level === 0 && Math.random() < .3) dir = 'any';
    col = Math.max(0, Math.min(2, col + (Math.random() < .5 ? -1 : 1) * (Math.random() < .6 ? 1 : 0)));
    row = dir === 'up' ? 0 : dir === 'down' ? 1 : Math.random() < .5 ? 0 : 1;
    notes.push({ t, dir, col, row });
    lastT = t; if (dir === 'up' || dir === 'down') lastDir = dir;
  }
  return notes;
}
export { DIRS };

/** A short synthesized demo track (so the game works without any song). */
export async function demoTrack(bpm = 112, bars = 24) {
  const sr = 44100, beat = 60 / bpm, dur = bars * 4 * beat + 1;
  const off = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
  const out = off.createGain(); out.gain.value = .7; out.connect(off.destination);
  const tone = (t, f, d, type, vol, f2) => { const o = off.createOscillator(), g = off.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(out); o.start(t); o.stop(t + d + .01); };
  const nbuf = off.createBuffer(1, sr * .3, sr), nd = nbuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = (t, d, freq, vol, type = 'highpass') => { const s = off.createBufferSource(), f = off.createBiquadFilter(), g = off.createGain(); s.buffer = nbuf; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + d); };
  const chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  const melody = [523, 587, 659, 784, 659, 587, 523, 440];
  for (let b = 0; b < bars * 4; b++) {
    const t = .5 + b * beat;
    tone(t, 150, .25, 'sine', .9, 45);                    // kick
    if (b % 2 === 1) noise(t, .18, 1500, .5, 'bandpass'); // snare
    noise(t + beat / 2, .05, 7000, .18);                  // off-beat hat
    noise(t, .04, 8000, .12);
    const ch = chords[Math.floor(b / 4) % 4];
    if (b % 4 === 0) for (const f of ch) tone(t, f, beat * 3.8, 'triangle', .06);
    tone(t, ch[0] / 2, beat * .9, 'square', .05);
    if (b >= 16 && b % 1 === 0) tone(t + beat / 2, melody[(b * 3) % 8], beat * .45, 'triangle', .07);
  }
  return off.startRendering();
}
