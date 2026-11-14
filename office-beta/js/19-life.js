"use strict";
// Office game (beta) — screen lock (pause the game with a PIN), calculator, stress meter and the "slack off" corner.
const life = { stress: 18, boss: null, music: null, play: null, lastCnt: 0, caughtAt: 0, tab: 'home', swipes: 0, matches: 0 };
const pinStore = { get() { try { return localStorage.getItem('cute-office-beta-pin') || window.__pin || ''; } catch (e) { return window.__pin || ''; } }, set(v) { window.__pin = v; try { localStorage.setItem('cute-office-beta-pin', v); } catch (e) {} } };

/* ================= pause the game with a PIN ================= */
const lk = { on: false, el: null, t: 0, game: 0, iv: null, since: 0 };
function lockButton() {
  const b = h('button', { id: 'pwrBtn', title: 'พักเกม (ล็อกจอ)', 'aria-label': 'พักเกม' }, '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="2" fill="#fff"/></svg>');
  document.querySelector('.monitor').append(b); b.addEventListener('click', () => lockStart());
}
lockButton();
function lockStart() {
  if (lk.on) return;
  if (!pinStore.get()) return pinSetup(() => lockStart());
  lk.on = true; lk.since = Date.now(); lk.game = loadOff + (Date.now() - R0) * SPEED;
  lk.iv = setInterval(() => { loadOff = lk.game; R0 = Date.now(); }, 50);
  try { saveGame(); } catch (e) {}
  lk.el = h('div', { id: 'lockVeil' }, `<div class="lkc"><div class="lki">⏸️</div><h2>พักเกมอยู่</h2><p>เวลาในเกมหยุดเดินแล้ว ใส่รหัสเพื่อเล่นต่อ</p><input type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="รหัส"><div class="lke"></div><button class="btn2 pri">▶ เล่นต่อ</button><small class="lkt"></small></div>`);
  document.body.append(lk.el); const inp = lk.el.querySelector('input'), err = lk.el.querySelector('.lke');
  const go = () => { if (inp.value === pinStore.get()) lockEnd(); else { err.textContent = 'รหัสไม่ถูกต้อง ลองอีกครั้ง'; inp.value = ''; lk.el.querySelector('.lkc').classList.remove('shake'); void lk.el.offsetWidth; lk.el.querySelector('.lkc').classList.add('shake'); S.tone(300, 200, .15, .08); } };
  lk.el.querySelector('button').addEventListener('click', go); inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); e.stopPropagation(); }); setTimeout(() => inp.focus(), 50);
  lk.tick = setInterval(() => { const s = Math.round((Date.now() - lk.since) / 1000); const t = lk.el?.querySelector('.lkt'); if (t) t.textContent = `พักมาแล้ว ${Math.floor(s / 60)} นาที ${s % 60} วินาที`; }, 1000);
}
function lockEnd() { clearInterval(lk.iv); clearInterval(lk.tick); lk.on = false; R0 = Date.now(); loadOff = lk.game; lk.el?.remove(); lk.el = null; S.tone(600, 1000, .1, .06, 'triangle'); S.toast('▶ เล่นต่อแล้ว', 1.4); }
function pinSetup(done) {
  const el = h('div', { id: 'lockVeil' }, `<div class="lkc"><div class="lki">🔑</div><h2>ตั้งรหัสพักเกม</h2><p>ยังไม่เคยตั้งรหัส ตั้งก่อนแล้วจะพักเกมได้ (ตัวเลข/ตัวอักษร 4–12 ตัว) รหัสเก็บไว้ในเครื่องนี้เท่านั้น</p><input type="password" class="p1" autocomplete="off" maxlength="12" placeholder="รหัสใหม่"><input type="password" class="p2" autocomplete="off" maxlength="12" placeholder="ยืนยันรหัสอีกครั้ง"><div class="lke"></div><div class="lkr"><button class="btn2" data-x>ยกเลิก</button><button class="btn2 pri" data-ok>ตั้งรหัสและพักเกม</button></div></div>`);
  document.body.append(el); const a = el.querySelector('.p1'), b = el.querySelector('.p2'), err = el.querySelector('.lke'); a.focus();
  const ok = () => { if (a.value.length < 4) { err.textContent = 'รหัสสั้นไป ต้องอย่างน้อย 4 ตัว'; return; } if (a.value !== b.value) { err.textContent = 'รหัสสองช่องไม่ตรงกัน'; return; } pinStore.set(a.value); el.remove(); done(); };
  el.querySelector('[data-ok]').addEventListener('click', ok); el.querySelector('[data-x]').addEventListener('click', () => el.remove()); el.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); e.stopPropagation(); });
}

/* ================= calculator ================= */
GENERAL_APPS.push({ id: 'app-calc', n: 'เครื่องคิดเลข', e: '🧮', c: '#6c63ff', fn: () => openCalc() });
function calcEval(x) {
  const t = x.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)'); if (!/^[0-9+\-*/().\s]+$/.test(t)) return NaN;
  try { const v = Function('"use strict";return (' + t + ')')(); return Number.isFinite(v) ? Math.round(v * 1e8) / 1e8 : NaN; } catch (e) { return NaN; }
}
function openCalc() {
  if (wins.has('calc')) { focusWin(wins.get('calc')); return; }
  const W = openWin('calc', 'เครื่องคิดเลข', h('div', { class: 'calc', tabindex: '0' }), 270, 400, '#ebe7ff'), root = W.body.firstChild; let ex = '', shown = '0', done = false;
  const keys = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '(', ')', '='];
  root.innerHTML = `<div class="cd"><small class="ce"></small><b class="cr">0</b></div><div class="ck">${keys.map(k => `<button data-k="${k}" class="${/[÷×−+=]/.test(k) ? 'op' : k === 'C' ? 'cl' : ''} ${k === '=' ? 'eq' : ''}">${k}</button>`).join('')}</div><p class="soft" style="margin:6px 8px;font-size:11px">พิมพ์ตัวเลขจากคีย์บอร์ดได้</p>`;
  const paint = () => { root.querySelector('.ce').textContent = ex || ' '; root.querySelector('.cr').textContent = shown; };
  const press = k => {
    if (k === 'C') { ex = ''; shown = '0'; done = false; } else if (k === '⌫') { ex = ex.slice(0, -1); shown = ex || '0'; }
    else if (k === '=') { const v = calcEval(ex); shown = isNaN(v) ? 'คำนวณไม่ได้' : v.toLocaleString('th-TH', { maximumFractionDigits: 8 }); if (!isNaN(v)) { ex = String(v); done = true; } }
    else { if (done && /[0-9.(]/.test(k)) { ex = ''; } done = false; ex += k; shown = ex; }
    paint(); S.tone(700, 760, .03, .03);
  };
  root.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  root.addEventListener('keydown', e => { const m = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C', '=': '=' }[e.key] || e.key; if (keys.includes(m)) { e.preventDefault(); press(m); } });
  setTimeout(() => root.focus(), 60);
}

/* ================= stress meter ================= */
const gHourNow = () => gnow().getHours();
function stressHud() {
  let el = $('stressHud'); if (!el) { el = h('span', { id: 'stressHud', title: 'ความเครียด: ยิ่งเครียดยิ่งหิวเร็ว หน้าจอจะแดงขึ้น พักด้วยมุมอู้ได้' }, '<span class="sv"></span>'); $('clock').before(el); el.addEventListener('click', () => openSlack()); }
  const v = Math.round(life.stress); el.dataset.lv = v >= 80 ? 'bad' : v >= 50 ? 'mid' : 'ok'; el.querySelector('.sv').textContent = (v >= 80 ? '🤯 ' : v >= 50 ? '😣 ' : '🙂 ') + v;
  let vl = $('stressVeil'); if (!vl) { vl = h('div', { id: 'stressVeil' }); $('screen').append(vl); }
  const a = Math.max(0, (life.stress - 35) / 65); vl.style.opacity = String(Math.min(.62, a * .62)); vl.classList.toggle('pulse', life.stress >= 85);
}
const slackActive = () => !!(life.play && performance.now() < life.play.end) || !!life.music || [...wins.keys()].some(k => /^game/.test(k)) || (phone.open && phone.app === 'date');
let stLast = performance.now();
function stressTick() {
  const now = performance.now(), dt = Math.min(5, (now - stLast) / 1000); stLast = now; if (lk.on) return;
  const hr = gHourNow(), working = hr >= 9 && hr < 19;
  if (working) life.stress += .015 * dt;
  const cnt = (perf.callMiss || 0) + (perf.mailMiss || 0) + (career[career.id]?.wrong || 0) + (career.tax?.late || 0); if (cnt > life.lastCnt) life.stress += 6 * (cnt - life.lastCnt); life.lastCnt = cnt;
  if (typeof hunger !== 'undefined' && hunger.v < STARVING) life.stress += .05 * dt;
  let rel = 0; if (life.play && now < life.play.end) rel += life.play.rate; if (life.music) rel += .5; if ([...wins.keys()].some(k => /^game/.test(k))) rel += .4; if (phone.open && phone.app === 'date') rel += .3;
  life.stress = clamp(life.stress - Math.min(1.3, rel) * dt, 0, 100);
  if (typeof hunger !== 'undefined' && hr >= 8 && hr < 22) hunger.v = Math.max(0, hunger.v - life.stress / 100 * 8 * SPEED / 3600 * dt);
  if (life.play && now >= life.play.end) { S.toast(`${life.play.e} ดูจบแล้ว สดชื่นขึ้นเยอะ`, 2); life.play = null; renderSlack(); }
  // the boss walks by while somebody is slacking
  if (life.boss) { if (now >= life.boss) { life.boss = null; if (slackActive()) { life.stress = Math.min(100, life.stress + 10); S.big('😾 หัวหน้าเห็นว่าอู้!', 2.2, '#e5536f'); pushMsg('boss', 'boss', pick(['เห็นนะว่าอู้อยู่ 😾 รีบกลับมาทำงาน', 'ทำงานหรือยังคะ/ครับ ตอนนี้ไม่ใช่เวลาเล่นนะ']), 800); } else S.toast('😮‍💨 รอดตัว! หัวหน้าเดินผ่านไป', 2); } }
  else if (slackActive() && hr >= 9 && hr < 19 && Math.random() < .004 * dt * 5) { life.boss = now + 4500; S.toast('👀 พี่หัวหน้ากำลังเดินมา! กด Esc หรือปุ่ม “หัวหน้ามา” เร็ว', 3.6); S.tone(500, 400, .3, .08); }
  stressHud();
}
function bossKey() { if (life.music) life.music = null; life.play = null; [...wins.keys()].filter(k => /^(slack|game)/.test(k)).forEach(k => closeWin(k, true)); if (phone.open && phone.app === 'date') closePhone(); if (life.boss) { life.boss = null; S.toast('😮‍💨 รอดตัว! หัวหน้าเดินผ่านไป', 2); } else S.toast('🫣 เก็บหน้าจออู้แล้ว', 1.4); }
addEventListener('keydown', e => { if (e.key === 'Escape' && !lk.on && (slackActive() || life.boss)) bossKey(); });
setInterval(stressTick, 1000);

/* ================= the slack-off corner ================= */
GENERAL_APPS.push({ id: 'app-slack', n: 'มุมอู้งาน', e: '🛋️', c: '#ff7aa8', fn: () => openSlack() });
const VIDEOS = [['แมวส้มกับกล่องกระดาษ 📦', 18], ['รวมคนทำบัญชีตอนปิดงบ 😭 (ตลก)', 22], ['ASMR ปั๊มตราปั๊มลายเซ็น 🔏', 20], ['วิธีพับกระดาษเป็นนกกระเรียน', 24], ['เป็ดเดินตามแม่ 🦆', 16], ['รีวิวกาแฟแก้วละ 5 บาท ☕', 22]];
const MOVIES = [['รักนี้ไม่มีใบกำกับภาษี 💕', 40], ['ปฏิบัติการล่าสต๊อกหาย 🕵️', 36], ['เจ้าหญิงเบเกอรี่ 👸🍰', 38], ['สงครามแมวกับหนู 🐱🐭', 34]];
function openSlack() {
  if (wins.has('slack')) { focusWin(wins.get('slack')); return; }
  const W = openWin('slack', 'มุมอู้งาน — พักสมองหน่อย', h('div', { class: 'slk' }), 560, 430, '#ffe9f0'); W.onClose = () => { life.play = null; life.music = null; };
  W.body.firstChild.addEventListener('click', e => {
    const t = e.target.closest('[data-sl]'); if (!t) return; const k = t.dataset.sl;
    if (k === 'boss') return bossKey(); if (k === 'stop') { life.play = null; return renderSlack(); } if (k === 'back') { life.tab = 'home'; return renderSlack(); }
    if (k === 'game') { openGames(); return; } if (k === 'date') { openPhone('date'); return; }
    if (k === 'music') { life.music = life.music ? null : 1; if (life.music) musicLoop(); return renderSlack(); }
    if (k === 'v' || k === 'm') { const [n, d] = (k === 'v' ? VIDEOS : MOVIES)[+t.dataset.i]; life.play = { e: k === 'v' ? '▶️' : '🎬', n, t0: performance.now(), end: performance.now() + d * 1000, rate: k === 'v' ? .9 : 1.1 }; return renderSlack(); }
    life.tab = k; renderSlack();
  });
  renderSlack();
}
function renderSlack() {
  const W = wins.get('slack'); if (!W) return; const b = W.body.firstChild, st = Math.round(life.stress);
  const top = `<div class="sltop"><span>ความเครียด <b>${st}</b>/100</span><div class="sbar"><i style="width:${st}%"></i></div><button class="btn2" data-sl="boss">🫣 หัวหน้ามา! (Esc)</button></div>`;
  let main;
  if (life.play) main = `<div class="slp"><h3>${life.play.e} กำลังดู: ${esc(life.play.n)}</h3><div class="plb"><i></i></div><p class="soft">ดูไปเรื่อยๆ ความเครียดจะลดลง แต่ระวังหัวหน้าเดินมานะ</p><button class="btn2" data-sl="stop">⏹ หยุด</button></div>`;
  else if (life.tab === 'v' || life.tab === 'm') main = `<button class="btn2" data-sl="back">← กลับ</button><div class="sll">${(life.tab === 'v' ? VIDEOS : MOVIES).map(([n, d], i) => `<button data-sl="${life.tab}" data-i="${i}"><b>${life.tab === 'v' ? '▶️' : '🎬'} ${esc(n)}</b><small>${d} วินาที</small></button>`).join('')}</div>`;
  else main = `<div class="slg"><button data-sl="v"><i>📺</i>เมี่ยวทูป<small>ดูคลิปสั้นๆ</small></button><button data-sl="music"><i>${life.music ? '⏸️' : '🎵'}</i>ฟังเพลง<small>${life.music ? 'กำลังเล่น… กดเพื่อหยุด' : 'เปิดเพลงชิลๆ'}</small></button><button data-sl="game"><i>🎮</i>เกมในคอม<small>เปิดเกมน้อย</small></button><button data-sl="m"><i>🎬</i>หนังน้อย<small>ดูหนังเรื่องยาวหน่อย</small></button><button data-sl="date"><i>💘</i>เลื่อนหาคู่<small>เปิดแอปในมือถือ</small></button></div><p class="soft">การอู้ช่วยลดความเครียด หน้าจอจะหายแดง และท้องไม่หิวเร็วเกินไป · ถ้าหัวหน้าเห็น จะเครียดกว่าเดิม!</p>`;
  b.innerHTML = top + main; const pb = b.querySelector('.plb i'); if (pb && life.play) pb.style.width = Math.min(100, (performance.now() - life.play.t0) / (life.play.end - life.play.t0) * 100) + '%';
}
setInterval(() => { if (life.play && wins.has('slack')) { const pb = wins.get('slack').body.querySelector('.plb i'); if (pb) pb.style.width = Math.min(100, (performance.now() - life.play.t0) / (life.play.end - life.play.t0) * 100) + '%'; } }, 500);
const MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047];
let mi = 0; function musicLoop() { if (!life.music) return; if (!lk.on) S.tone(MELODY[mi++ % MELODY.length], MELODY[mi % MELODY.length], .35, .04, 'sine'); setTimeout(musicLoop, 520); }
/* save / load the stress level */
const _snap2 = snapshot; snapshot = () => ({ ..._snap2(), life: { stress: life.stress } });
const _load2 = loadGame; loadGame = function () { const ok = _load2(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.life) life.stress = s.life.stress; } catch (e) {} } return ok; };
setTimeout(stressHud, 0);

setTimeout(() => { try { applyCareer(career.id); } catch (e) { console.error(e); } }, 0);
