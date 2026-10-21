// Shared page shell for the PC games: room link + pairing card + toast/hint/big text.
import { hostRoom } from './link.js?v=3';
import { PadInput, drawQr } from './padinput.js?v=3';

const $ = id => document.getElementById(id);

export function setupShell({ game, minCutoff, beta }) {
  const pad = new PadInput({ minCutoff, beta });
  const shell = { pad, usingMouse: false, link: null };
  let toastT = 0, bigT = 0;
  shell.toast = (t, sec = 1.6) => { $('hint').textContent = t; $('hint').hidden = false; toastT = sec; };
  shell.hint = t => { if (toastT <= 0) { $('hint').textContent = t; $('hint').hidden = !t; } };
  shell.big = (t, sec = 1.4, color = '') => { const b = $('bigMsg'); b.textContent = t; b.style.color = color; b.hidden = false; bigT = sec; };
  shell.tick = dt => {
    pad.update(dt);
    toastT -= dt; if (toastT <= 0 && toastT > -dt * 1.5) $('hint').hidden = true;
    bigT -= dt; if (bigT <= 0) $('bigMsg').hidden = true;
  };
  shell.pairing = () => !$('pair').hidden;
  pad.onRecal = () => shell.toast('ตั้งศูนย์แล้ว');
  shell.link = hostRoom({
    game,
    onStatus: s => {
      if (s.code) { $('code').textContent = s.code; drawQr($('qr'), s.padUrl); }
      const live = s.phones > 0;
      $('dot').classList.toggle('ok', live);
      $('chipText').textContent = live ? `มือถือเชื่อมแล้ว · ห้อง ${s.code}` : s.state === 'offline' ? 'ต่อเซิร์ฟเวอร์ไม่ได้ เช็กอินเทอร์เน็ต' : s.code ? `ห้อง ${s.code} · รอมือถือ` : 'กำลังเปิดห้อง…';
      if (live) { $('pair').hidden = true; shell.usingMouse = false; }
    },
    onData: d => pad.feed(d),
  });
  shell.vib = p => shell.link.send({ vib: p });
  $('showPair').onclick = () => { $('pair').hidden = false; };
  $('mousePlay').onclick = () => { $('pair').hidden = true; shell.usingMouse = true; shell.audio(); };
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'c' && pad.live) pad.needCal = true; });

  // tiny synth
  let ac = null;
  shell.audio = () => { if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  addEventListener('pointerdown', shell.audio); addEventListener('keydown', shell.audio);
  const on = () => ac && ac.state === 'running';
  shell.tone = (f0, f1, dur, vol = .12, type = 'sine', delay = 0) => {
    if (!on()) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  };
  shell.noise = (dur, freq, vol, type = 'lowpass') => {
    if (!on()) return; const n = ac.sampleRate * dur | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = type; f.frequency.value = freq; g.gain.value = vol;
    s.buffer = b; s.connect(f).connect(g).connect(ac.destination); s.start();
  };
  shell.jingle = () => [523, 659, 784, 1047].forEach((f, i) => shell.tone(f, f * 1.01, .18, .1, 'triangle', i * .11));
  $('pair').hidden = false;
  return shell;
}

/** Standard chrome markup every game page includes (call before setupShell). */
export function shellMarkup({ title, blurb, steps }) {
  const html = `
<div class="chip"><span class="dot" id="dot"></span><span id="chipText">กำลังเปิดห้อง…</span><button id="showPair">ต่อมือถือ</button></div>
<div class="big-msg" id="bigMsg" hidden></div>
<div class="hint" id="hint" hidden></div>
<div class="overlay" id="pair" hidden>
  <div class="card">
    <div class="qr" id="qr">…</div>
    <div>
      <h1>${title}</h1>
      <p>${blurb}</p>
      <ol>
        <li>สแกน QR หรือเปิด <b>pad.html</b> แล้วใส่รหัส <span class="code" id="code">·····</span></li>
        ${steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <div class="btns"><button class="btn ghost" id="mousePlay">เล่นด้วยเมาส์ก่อน</button></div>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
