"use strict";
// Mini games 3: match-3 (ผลไม้), XO vs bot, Klondike solitaire (เรียงไพ่)
const G3 = { m3: startM3, xo: startXO, sol: startSol };
const g3box = () => gm.W && gm.W.body.firstChild;
function g3Win(key, extra) { gm.best[key] = Math.max(gm.best[key] || 0, extra); complete('game'); S.jingle(); }

/* ---------- match-3 ---------- */
const M3E = ['🍓', '🍋', '🍇', '🍊', '🍏', '🫐'], M3N = 7;
function startM3() {
  const b = []; for (let i = 0; i < M3N * M3N; i++) { let k; do k = Math.floor(Math.random() * 5); while ((i % M3N >= 2 && b[i - 1] === k && b[i - 2] === k) || (i >= M3N * 2 && b[i - M3N] === k && b[i - 2 * M3N] === k)); b.push(k); }
  gm.mode = 'm3'; gm.m3 = { b, sel: -1, score: 0, moves: 20, goal: 400, busy: false, over: false }; m3Render();
}
function m3Render(msg) {
  const m = gm.m3, box = g3box(); if (!box) return;
  box.innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>${msg || `เป้าหมาย ${m.goal} แต้ม`}</span><b class="sc">${m.score} แต้ม · เหลือ ${m.moves} ครั้ง</b></div><div class="m3">${m.b.map((k, i) => `<button class="m3c${i === m.sel ? ' on' : ''}${k < 0 ? ' em' : ''}" data-m3="${i}">${k < 0 ? '' : M3E[k]}</button>`).join('')}</div>`;
}
function m3Find(b) {
  const hit = new Set();
  for (let r = 0; r < M3N; r++) for (let c = 0; c < M3N; c++) {
    const i = r * M3N + c, k = b[i]; if (k < 0) continue;
    if (c < M3N - 2 && b[i + 1] === k && b[i + 2] === k) { let j = c; while (j < M3N && b[r * M3N + j] === k) hit.add(r * M3N + j++); }
    if (r < M3N - 2 && b[i + M3N] === k && b[i + 2 * M3N] === k) { let j = r; while (j < M3N && b[j * M3N + c] === k) hit.add(j++ * M3N + c); }
  }
  return hit;
}
function m3Gravity(b) {
  for (let c = 0; c < M3N; c++) { let w = M3N - 1; for (let r = M3N - 1; r >= 0; r--) if (b[r * M3N + c] >= 0) { b[w * M3N + c] = b[r * M3N + c]; if (w !== r) b[r * M3N + c] = -1; w--; } for (; w >= 0; w--) b[w * M3N + c] = Math.floor(Math.random() * 5); }
}
function m3Click(i) {
  const m = gm.m3; if (!m || m.busy || m.over) return;
  if (m.sel < 0) { m.sel = i; m3Render(); return; }
  const a = m.sel, dr = Math.abs(((a / M3N) | 0) - ((i / M3N) | 0)), dc = Math.abs(a % M3N - i % M3N);
  if (a === i) { m.sel = -1; m3Render(); return; }
  if (dr + dc !== 1) { m.sel = i; m3Render(); return; }
  const sw = () => { [m.b[a], m.b[i]] = [m.b[i], m.b[a]]; };
  sw(); m.sel = -1;
  if (!m3Find(m.b).size) { sw(); m3Render('สลับแล้วไม่เกิดแถว 3 ตัว ลองใหม่'); S.tone(300, 200, .15, .06); return; }
  m.moves--; m.busy = true; m3Render(); setTimeout(() => m3Step(1), 250);
}
function m3Step(mult) {
  const m = gm.m3; if (!m || gm.mode !== 'm3') return; const hit = m3Find(m.b);
  if (!hit.size) { m.busy = false; if (m.score >= m.goal) return m3End(true); if (m.moves <= 0) return m3End(false); m3Render(); return; }
  hit.forEach(i => m.b[i] = -1); m.score += hit.size * 10 * mult; S.tone(600 + mult * 120, 900 + mult * 120, .08, .06, 'triangle'); m3Render(mult > 1 ? `คอมโบ ×${mult}! 🔥` : undefined);
  setTimeout(() => { if (gm.mode !== 'm3') return; m3Gravity(m.b); m3Render(); setTimeout(() => m3Step(mult + 1), 280); }, 260);
}
function m3End(win) {
  const m = gm.m3, box = g3box(); m.over = true; if (win) g3Win('m3', m.score); else S.tone(300, 150, .4, .08);
  m3Render(win ? `🎉 ชนะ! ได้ ${m.score} แต้ม` : `หมดตาแล้ว (${m.score}/${m.goal})`);
  box.insertAdjacentHTML('beforeend', `<div class="g3end"><b>${win ? '🎉 ผ่านด่าน!' : '😵 ยังไม่ถึงเป้า'}</b><button class="btn2 grn" data-g="m3">เล่นอีกครั้ง</button></div>`);
}

/* ---------- XO ---------- */
const XOL = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const xoWin = b => { for (const l of XOL) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return l; return null; };
function xoBest(b, p) { // minimax; returns [score, move]
  const w = xoWin(b); if (w) return [b[w[0]] === 'O' ? 1 : -1, -1]; if (b.every(Boolean)) return [0, -1];
  let best = p === 'O' ? [-2, -1] : [2, -1];
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = p; const s = xoBest(b, p === 'O' ? 'X' : 'O')[0]; b[i] = ''; if (p === 'O' ? s > best[0] : s < best[0]) best = [s, i]; }
  return best;
}
function startXO() { gm.mode = 'xo'; gm.xo = { b: Array(9).fill(''), end: null, st: gm.xo ? gm.xo.st : { w: 0, d: 0, l: 0 } }; xoRender(); }
function xoRender() {
  const x = gm.xo, box = g3box(), w = x.end && x.end.line, st = x.st;
  box.innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>คุณ = ❌ · เพื่อนร่วมงาน = ⭕</span><b class="sc">ชนะ ${st.w} · เสมอ ${st.d} · แพ้ ${st.l}</b></div><div class="xo">${x.b.map((v, i) => `<button class="xoc${w && w.includes(i) ? ' win' : ''}" data-xo="${i}">${v === 'X' ? '❌' : v === 'O' ? '⭕' : ''}</button>`).join('')}</div>${x.end ? `<div class="g3end"><b>${x.end.t}</b><button class="btn2 grn" data-g="xo">เล่นอีกตา</button></div>` : ''}`;
}
function xoClick(i) {
  const x = gm.xo; if (!x || x.end || x.b[i]) return;
  x.b[i] = 'X'; S.tone(700, 800, .05, .05); if (xoCheck()) return; xoRender();
  setTimeout(() => {
    if (gm.mode !== 'xo' || x.end) return; const free = x.b.map((v, k) => v ? -1 : k).filter(k => k >= 0);
    const mv = Math.random() < .75 ? xoBest(x.b.slice(), 'O')[1] : pick(free); x.b[mv] = 'O'; S.tone(500, 560, .05, .05); if (!xoCheck()) xoRender();
  }, 380);
}
function xoCheck() {
  const x = gm.xo, l = xoWin(x.b);
  if (l) { const won = x.b[l[0]] === 'X'; x.end = { line: l, t: won ? '🎉 คุณชนะ!' : '😅 เพื่อนร่วมงานชนะ' }; won ? (x.st.w++, g3Win('xo', x.st.w)) : (x.st.l++, S.tone(300, 150, .3, .07)); }
  else if (x.b.every(Boolean)) { x.end = { t: '🤝 เสมอ' }; x.st.d++; } else return false;
  xoRender(); return true;
}

/* ---------- Klondike solitaire ---------- */
const SU = ['♠', '♣', '♥', '♦'], SR = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const slRed = c => c.s >= 2;
function startSol() {
  const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s, up: false }); shuf(d);
  const tab = Array.from({ length: 7 }, (_, c) => { const col = d.splice(0, c + 1); col[c].up = true; return col; });
  gm.mode = 'sol'; gm.sl = { stock: d, waste: [], found: [[], [], [], []], tab, sel: null, moves: 0, t0: performance.now(), won: false }; slRender();
}
function slCard(c, extra, at) {
  if (!c.up) return `<div class="sc bk" ${at}></div>`.replace('class="sc', `class="slc${extra}`);
  return `<div class="slc${extra}${slRed(c) ? ' rd' : ''}" ${at}><b>${SR[c.r]}</b><i>${SU[c.s]}</i></div>`;
}
function slRender() {
  const s = gm.sl, box = g3box(); if (!box) return; const sel = s.sel;
  const isSel = (k, i) => sel && sel.k === k && (k === 'w' || i >= sel.i);
  const top = a => a[a.length - 1];
  box.innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>คลิกไพ่ แล้วคลิกที่วาง · คลิกไพ่ที่เลือกซ้ำ = ส่งขึ้นกอง</span><b class="sc">${s.moves} ครั้ง</b></div>
<div class="sl"><div class="slt"><div class="slp" data-sl="stock">${s.stock.length ? '<div class="slc bk"></div>' : '<div class="slc em">↻</div>'}</div><div class="slp" data-sl="waste">${s.waste.length ? slCard(top(s.waste), isSel('w') ? ' on' : '', 'data-sl="waste"') : ''}</div><div class="slgap"></div>${s.found.map((f, k) => `<div class="slp" data-sl="f${k}">${f.length ? slCard(top(f), '', `data-sl="f${k}"`) : '<div class="slc em">🂠</div>'}</div>`).join('')}</div>
<div class="slb">${s.tab.map((col, c) => `<div class="slcol" data-sl="t${c}" data-i="-1" style="height:${col.length * 18 + col.filter(x => x.up).length * 8 + 70}px">${col.map((cd, i) => slCard(cd, isSel('t' + c, i) ? ' on' : '', `data-sl="t${c}" data-i="${i}" style="top:${i * 18 + (col.slice(0, i).filter(x => x.up).length * 8)}px"`)).join('')}</div>`).join('')}</div></div>${s.won ? `<div class="g3end"><b>🎉 เรียงไพ่ครบ!</b><button class="btn2 grn" data-g="sol">ตาใหม่</button></div>` : ''}`;
}
function slCan(card, dest) {
  const s = gm.sl;
  if (dest[0] === 'f') { const f = s.found[+dest[1]], t = f[f.length - 1]; return t ? t.s === card.s && card.r === t.r + 1 : card.r === 1; }
  const col = s.tab[+dest[1]], t = col[col.length - 1]; return t ? t.up && slRed(t) !== slRed(card) && t.r === card.r + 1 : card.r === 13;
}
function slClick(el) {
  const s = gm.sl; if (!s || s.won) return; const k = el.dataset.sl, i = el.dataset.i === undefined ? -1 : +el.dataset.i;
  if (k === 'stock') { s.sel = null; if (s.stock.length) { const c = s.stock.pop(); c.up = true; s.waste.push(c); } else { s.stock = s.waste.reverse().map(c => (c.up = false, c)); s.waste = []; } s.moves++; S.tone(600, 650, .03, .04); return slRender(); }
  const src = s.sel;
  const cards = src ? (src.k === 'w' ? [s.waste[s.waste.length - 1]] : s.tab[+src.k.slice(1)].slice(src.i)) : null;
  if (!src) {
    if (k === 'waste' && s.waste.length) s.sel = { k: 'w', i: 0 };
    else if (k[0] === 't' && i >= 0 && s.tab[+k[1]][i].up) s.sel = { k, i };
    return slRender();
  }
  // same card again → send to foundation
  if (src.k === k && (k === 'w' || k === 'waste' || src.i === i)) {
    if (cards.length === 1) { for (let f = 0; f < 4; f++) if (slCan(cards[0], 'f' + f)) return slMove(cards, 'f' + f); } s.sel = null; return slRender();
  }
  if (k === 'waste' && src.k !== 'w') { s.sel = s.waste.length ? { k: 'w', i: 0 } : null; return slRender(); }
  const dest = k[0] === 'f' ? 'f' + k[1] : k[0] === 't' ? k : null;
  if (!dest) { s.sel = null; return slRender(); }
  if (dest[0] === 'f') { if (cards.length === 1) for (const f of [+dest[1], 0, 1, 2, 3]) if (slCan(cards[0], 'f' + f)) return slMove(cards, 'f' + f); }
  else if (slCan(cards[0], dest)) return slMove(cards, dest);
  // invalid: reselect clicked card if possible
  if (k[0] === 't' && i >= 0 && s.tab[+k[1]][i].up) s.sel = { k, i }; else { s.sel = null; S.tone(300, 220, .1, .05); } slRender();
}
function slMove(cards, dest) {
  const s = gm.sl, src = s.sel; s.sel = null;
  if (src.k === 'w') s.waste.pop(); else { const col = s.tab[+src.k.slice(1)]; col.splice(src.i); const t = col[col.length - 1]; if (t && !t.up) t.up = true; }
  if (dest[0] === 'f') s.found[+dest[1]].push(...cards); else s.tab[+dest[1]].push(...cards);
  s.moves++; S.tone(700, 900, .05, .05);
  if (s.found.every(f => f.length === 13)) { s.won = true; const sec = Math.round((performance.now() - s.t0) / 1000); gm.best.sol = gm.best.sol ? Math.min(gm.best.sol, sec) : sec; complete('game'); S.jingle(); S.big('เรียงไพ่ครบแล้ว! 🎉'); }
  slRender();
}

function g3Click(e) {
  const t = e.target; let b;
  if ((b = t.closest('[data-m3]'))) { if (gm.mode === 'm3') m3Click(+b.dataset.m3); return true; }
  if ((b = t.closest('[data-xo]'))) { if (gm.mode === 'xo') xoClick(+b.dataset.xo); return true; }
  if (gm.mode === 'sol' && (b = t.closest('[data-sl]'))) { slClick(b); return true; }
  return false;
}
