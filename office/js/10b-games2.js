"use strict";
// Office game — more mini games: ป๊อกเด้ง (cards vs the office), sudoku, typing race (Thai / English).
// Hooks into the เกมน้อย window from 10-jobs-games.js (gm, gameMenu, gameClick, updateGame, openGames).
const gbox = () => gm.W && gm.W.body.firstChild;
const fmtSec = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ================= ป๊อกเด้ง (points only, no real money) ================= */
const SUITS = ['♠', '♥', '♦', '♣'], RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cdPts = c => c.r >= 10 ? 0 : c.r, cdPt = h => h.reduce((s, c) => s + cdPts(c), 0) % 10, cdPok = h => h.length === 2 && cdPt(h) >= 8;
function cdDeng(h) {
  if (h.length === 2) return (h[0].s === h[1].s || h[0].r === h[1].r) ? 2 : 1;
  const rs = h.map(c => c.r).sort((a, b) => a - b);
  if (rs[0] === rs[1] && rs[1] === rs[2]) return 5;
  if (h.every(c => c.s === h[0].s)) return 3;
  if (h.every(c => c.r >= 11)) return 3;
  if (rs[1] === rs[0] + 1 && rs[2] === rs[1] + 1) return 3;
  return 1;
}
function cdCmp(a, b) { const pa = cdPok(a), pb = cdPok(b); if (pa !== pb) return pa ? 1 : -1; return Math.sign(cdPt(a) - cdPt(b)); }
const cdHtml = (c, hide) => hide ? '<span class="pc bk"></span>' : `<span class="pc ${c.s === '♥' || c.s === '♦' ? 'rd' : ''}">${RK[c.r]}${c.s}</span>`;
const cdLabel = h => (cdPok(h) ? `ป๊อก ${cdPt(h)}` : `${cdPt(h)} แต้ม`) + (cdDeng(h) > 1 ? ` · ${cdDeng(h)} เด้ง` : '');
function startCard() {
  gm.mode = 'card'; if (!gm.cd) gm.cd = { chips: 1000, bet: 100 };
  Object.assign(gm.cd, { ph: 'bet', dl: [], me: [], bots: [], msg: 'วางเดิมพันแล้วแจกไพ่เลย (ใช้แต้มสมมุติ ไม่ใช่เงินจริง)' }); cdRender();
}
function cdDeal() {
  const c = gm.cd; if (c.chips <= 0) c.chips = 1000; c.bet = Math.min(c.bet, c.chips);
  c.deck = shuf(SUITS.flatMap(s => Array.from({ length: 13 }, (_, i) => ({ s, r: i + 1 }))));
  const two = () => [c.deck.pop(), c.deck.pop()];
  c.dl = two(); c.me = two(); c.bots = [['bear', '🐻', 'น้องหมี'], ['bun', '🐰', 'พี่กระต่าย'], ['duck', '🐥', 'เป็ดน้อย']].map(([id, e, n]) => ({ id, e, n, h: two() }));
  c.ph = 'play'; c.msg = 'ไพ่ของคุณ ขอใบที่ 3 หรือพอ?'; if (cdPok(c.dl) || cdPok(c.me)) cdResolve(false); else cdRender();
}
function cdResolve(draw) {
  const c = gm.cd;
  if (draw !== null && !(cdPok(c.dl) || cdPok(c.me))) {
    if (draw) c.me.push(c.deck.pop());
    c.bots.forEach(b => { if (!cdPok(b.h) && cdPt(b.h) <= 4) b.h.push(c.deck.pop()); });
    if (cdPt(c.dl) <= 3) c.dl.push(c.deck.pop());
  }
  const r = cdCmp(c.me, c.dl); let d = 0;
  if (r > 0) { d = c.bet * cdDeng(c.me); c.msg = `🎉 ชนะ! +${d} แต้ม`; } else if (r < 0) { d = -c.bet * cdDeng(c.dl); c.msg = `😿 แพ้ ${d} แต้ม`; } else c.msg = '🤝 เสมอ';
  c.chips += d; c.bots.forEach(b => { b.r = cdCmp(b.h, c.dl); });
  c.ph = 'done'; if (c.chips > gm.best.cards) gm.best.cards = c.chips; if (r > 0) { complete('game'); S.jingle(); } else S.tone(400, 250, .12, .08);
  cdRender();
}
function cdRender() {
  const c = gm.cd, done = c.ph === 'done', show = done || (c.ph === 'play' && false);
  const row = (h, hide) => h.map((x, i) => cdHtml(x, hide)).join('');
  gbox().innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>ป๊อกเด้ง · เจ้ามือหัวหน้าแมว</span><b>🪙 ${c.chips}</b></div><div class="cd">
    <div class="rowc"><span class="who">🐱 เจ้ามือ</span>${c.dl.length ? row(c.dl, !done) : '<span class="res">รอแจกไพ่</span>'}${done ? `<span class="res">${cdLabel(c.dl)}</span>` : ''}</div>
    ${c.bots.length ? `<div class="bots">${c.bots.map(b => `<div class="bot"><span>${b.e} ${b.n}</span><span>${row(b.h, !done)}</span><span class="res">${done ? `${cdLabel(b.h)} · ${b.r > 0 ? '✅ ชนะเจ้ามือ' : b.r < 0 ? '❌ แพ้' : '🤝 เสมอ'}` : 'รอเปิดไพ่'}</span></div>`).join('')}</div>` : ''}
    <div class="rowc"><span class="who">🙂 คุณ (เดิมพัน ${c.bet})</span>${c.me.length ? row(c.me, false) : ''}${c.me.length ? `<span class="res">${cdLabel(c.me)}</span>` : ''}</div>
    <div class="big">${esc(c.msg)}</div>
    <div class="acts">${c.ph === 'play' ? '<button class="btn2 pri" data-hit>🃏 ขอไพ่ใบที่ 3</button><button class="btn2" data-stand>✋ พอ</button>'
      : `${[50, 100, 200].map(b => `<button class="btn2 ${c.bet === b ? 'pri' : ''}" data-bet="${b}" ${b > c.chips && c.chips > 0 ? 'disabled' : ''}>${b}</button>`).join('')}<button class="btn2 grn" data-deal>${done ? '🔄 รอบต่อไป' : '🃏 แจกไพ่'}</button>`}</div>
    <small style="color:var(--soft)">เด้ง: ไพ่สองใบดอกเดียวกันหรือเลขเหมือนกัน ×2 · สามใบดอกเดียวกัน/เรียง/สามเหลือง ×3 · ตอง ×5 · ป๊อก 8–9 ชนะทันที${c.chips <= 0 ? ' · หมดตัวแล้ว กดแจกไพ่เพื่อเริ่มใหม่ 1000 แต้ม' : ''}</small></div>`;
}

/* ================= sudoku ================= */
function sdkCands(g, i) {
  const r = i / 9 | 0, c = i % 9, used = new Set();
  for (let k = 0; k < 9; k++) { used.add(g[r * 9 + k]); used.add(g[k * 9 + c]); }
  const br = r - r % 3, bc = c - c % 3; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) used.add(g[(br + a) * 9 + bc + b]);
  const out = []; for (let v = 1; v <= 9; v++) if (!used.has(v)) out.push(v); return out;
}
function sdkNext(g) { let best = -1, bc = null; for (let i = 0; i < 81; i++) { if (g[i]) continue; const c = sdkCands(g, i); if (!bc || c.length < bc.length) { best = i; bc = c; if (c.length <= 1) break; } } return [best, bc]; }
function sdkFill(g) { const [i, c] = sdkNext(g); if (i < 0) return true; if (!c.length) return false; for (const v of shuf(c)) { g[i] = v; if (sdkFill(g)) return true; } g[i] = 0; return false; }
function sdkCount(g, limit) { const [i, c] = sdkNext(g); if (i < 0) return 1; let n = 0; for (const v of c) { g[i] = v; n += sdkCount(g, limit - n); g[i] = 0; if (n >= limit) break; } return n; }
function sdkGen(remove) {
  const sol = Array(81).fill(0); sdkFill(sol); const puz = sol.slice(); let n = 0;
  for (const i of shuf([...Array(81).keys()])) { if (n >= remove) break; const v = puz[i]; puz[i] = 0; if (sdkCount(puz.slice(), 2) !== 1) puz[i] = v; else n++; }
  return { sol, puz };
}
const SDK_LV = { easy: [36, 'ง่าย'], mid: [46, 'กลาง'], hard: [53, 'ยาก'] };
function startSudoku(lv = 'mid') {
  const { sol, puz } = sdkGen(SDK_LV[lv][0]);
  gm.mode = 'sudoku'; gm.sd = { sol, puz, cur: puz.slice(), sel: -1, t0: performance.now(), hints: 3, lv }; sdkRender();
}
function sdkBad(cur) {
  const bad = new Set();
  for (let i = 0; i < 81; i++) { const v = cur[i]; if (!v) continue; const r = i / 9 | 0, c = i % 9;
    for (let j = 0; j < 81; j++) { if (j === i || cur[j] !== v) continue; const r2 = j / 9 | 0, c2 = j % 9; if (r === r2 || c === c2 || (r / 3 | 0) === (r2 / 3 | 0) && (c / 3 | 0) === (c2 / 3 | 0)) { bad.add(i); break; } } }
  return bad;
}
function sdkRender() {
  const s = gm.sd, bad = sdkBad(s.cur), grid = s.cur.map((v, i) => `<button class="${s.puz[i] ? 'g' : ''} ${i === s.sel ? 'sel' : ''} ${bad.has(i) ? 'bad' : ''} ${i % 9 % 3 === 2 && i % 9 < 8 ? 'c3' : ''} ${(i / 9 | 0) % 3 === 2 && i < 72 ? 'r3' : ''}" data-sc="${i}">${v || ''}</button>`).join('');
  gbox().innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>ซูโดกุ ระดับ${SDK_LV[s.lv][1]}</span><b class="sdt">${fmtSec((performance.now() - s.t0) / 1000)}</b></div><div class="sdk"><div class="sgrid">${grid}</div>
    <div class="sp"><div class="snum">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-sn="${n}">${n}</button>`).join('')}<button data-sn="0">ลบ</button><button data-shint style="grid-column:span 2;font-size:14px">💡 ใบ้ (${s.hints})</button></div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${Object.entries(SDK_LV).map(([k, [, n]]) => `<button class="btn2" data-sdiff="${k}" style="padding:3px 8px">เกมใหม่: ${n}</button>`).join('')}</div>
    <small style="color:var(--soft);max-width:180px">เลือกช่อง แล้วกดเลข (หรือพิมพ์เลขบนคีย์บอร์ด) เลขซ้ำแถว/คอลัมน์/กล่องจะเป็นสีแดง</small></div></div>`;
}
function sdkSet(v) {
  const s = gm.sd; if (gm.mode !== 'sudoku' || s.sel < 0 || s.puz[s.sel]) return;
  s.cur[s.sel] = v; S.tone(600 + v * 40, 700, .04, .05); sdkRender();
  if (s.cur.every(x => x) && !sdkBad(s.cur).size) sdkWin();
}
function sdkWin() {
  const s = gm.sd, t = (performance.now() - s.t0) / 1000; gm.mode = 'over'; complete('game'); S.jingle();
  if (s.lv === 'mid' || s.lv === 'hard') gm.best.sudoku = gm.best.sudoku ? Math.min(gm.best.sudoku, Math.round(t)) : Math.round(t);
  gbox().innerHTML = `<div class="menu2" style="flex-direction:column;gap:8px"><div style="font-size:52px">🏆</div><b style="font-size:22px">ซูโดกุสำเร็จ!</b><span>ใช้เวลา ${fmtSec(t)} · ระดับ${SDK_LV[s.lv][1]}</span><div style="display:flex;gap:8px"><button data-sdiff="${s.lv}" style="min-width:auto;padding:8px 16px">เล่นอีก</button><button data-g="menu" style="min-width:auto;padding:8px 16px">เมนู</button></div></div>`;
}

/* ================= typing race vs coworkers ================= */
const TYPE_TXT = {
  th: ['วันนี้อากาศดี ไปกินข้าวกลางวันกันเถอะ', 'ใบแจ้งหนี้ฉบับนี้ต้องส่งให้ลูกค้าก่อนเที่ยงวัน', 'หัวหน้าแมวชอบกาแฟร้อนและขนมหวานทุกวันศุกร์', 'กรุณาตรวจสอบยอดเงินในสมุดบัญชีอีกครั้งก่อนปิดงบ', 'ประชุมวันจันทร์เช้าอย่าลืมนำเอกสารมาให้ครบ', 'ขอบคุณที่ช่วยกันทำงานจนเสร็จทันเวลานะคะ'],
  en: ['The quick brown fox jumps over the lazy dog.', 'Please send the invoice to the customer before noon.', 'Our team meeting starts at ten on Monday morning.', 'A good accountant checks every number twice.', 'Coffee and sweet snacks make the office happy.', 'Thank you all for finishing the report on time.'],
};
const TYPE_OPP = { th: [['bear', '🐻', 'น้องหมี', 1.5], ['bun', '🐰', 'พี่กระต่าย', 2.3], ['duck', '🐥', 'เป็ดน้อย', 3.1]], en: [['bear', '🐻', 'น้องหมี', 2.1], ['bun', '🐰', 'พี่กระต่าย', 3.1], ['duck', '🐥', 'เป็ดน้อย', 4.1]] };
function startType(lang) {
  const text = pick(TYPE_TXT[lang]);
  gm.mode = 'type'; gm.ty = { lang, text, t0: performance.now() + 3200, typed: '', go: false, opps: TYPE_OPP[lang].map(([id, e, n, c]) => ({ id, e, n, cps: c * (.88 + Math.random() * .24) })) };
  const t = gm.ty;
  gbox().innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>${lang === 'th' ? 'พิมพ์เร็วภาษาไทย' : 'Typing race (English)'}</span><b class="cdn">เตรียมตัว…</b></div><div class="tp">
    ${t.opps.map(o => `<div class="track" data-o="${o.id}"><b>${o.e} ${o.n}</b><div class="lane"><i style="width:0"></i></div><small></small></div>`).join('')}
    <div class="track me"><b>🙂 คุณ</b><div class="lane"><i style="width:0"></i></div><small></small></div>
    <div class="tpt"></div><input type="text" autocomplete="off" spellcheck="false" autocapitalize="off" disabled onpaste="return false" placeholder="${lang === 'th' ? 'พิมพ์ข้อความด้านบนให้ตรงทุกตัว' : 'Type the text above exactly'}"></div>`;
  tyText();
}
function tyText() {
  const t = gm.ty, box = gbox().querySelector('.tpt'); let ok = 0; while (ok < t.typed.length && t.typed[ok] === t.text[ok]) ok++;
  box.innerHTML = [...t.text].map((ch, i) => i < ok ? `<span class="ok">${esc(ch)}</span>` : i < t.typed.length ? `<span class="no">${esc(ch)}</span>` : i === t.typed.length ? `<span class="cur">${esc(ch)}</span>` : esc(ch)).join('');
  t.ok = ok; return ok;
}
function tyBars(elapsed) {
  const t = gm.ty, root = gbox(); let allDone = true;
  t.opps.forEach(o => { const p = Math.min(1, Math.max(0, elapsed) * o.cps / t.text.length), el = root.querySelector(`[data-o="${o.id}"]`); if (!el) return; el.querySelector('i').style.width = p * 100 + '%'; if (p >= 1) el.querySelector('small').textContent = (t.text.length / o.cps).toFixed(1) + ' วิ'; else allDone = false; });
  root.querySelector('.track.me i').style.width = (t.ok || 0) / t.text.length * 100 + '%';
  return allDone;
}
function tyFinish(now) {
  const t = gm.ty, time = (now - t.t0) / 1000, cpm = Math.round(t.text.length / time * 60), key = 'type' + t.lang;
  const rows = [...t.opps.map(o => ({ n: `${o.e} ${o.n}`, time: t.text.length / o.cps })), { n: '🙂 คุณ', time, me: 1 }].sort((a, b) => a.time - b.time), place = rows.findIndex(r => r.me) + 1;
  gm.mode = 'over'; if (cpm > gm.best[key]) gm.best[key] = cpm; complete('game'); S.jingle();
  gbox().innerHTML = `<div class="menu2" style="flex-direction:column;gap:6px"><div style="font-size:46px">${place === 1 ? '🏆' : place === 4 ? '🐢' : '🏁'}</div><b style="font-size:22px">${t.lang === 'th' ? `ได้อันดับ ${place} จาก 4` : `Place ${place} of 4`}</b><span>${cpm} ${t.lang === 'th' ? 'ตัวอักษร/นาที' : 'chars/min'} · ${time.toFixed(1)} s</span>
    <div style="background:#fff;border-radius:12px;padding:8px 14px;min-width:220px">${rows.map((r, i) => `<div style="display:flex;justify-content:space-between;gap:14px;${r.me ? 'font-weight:600;color:#e8678a' : ''}"><span>${i + 1}. ${r.n}</span><span>${r.time.toFixed(1)} s</span></div>`).join('')}</div>
    <div style="display:flex;gap:8px"><button data-g="type${t.lang}" style="min-width:auto;padding:8px 16px">แข่งอีก</button><button data-g="menu" style="min-width:auto;padding:8px 16px">เมนู</button></div></div>`;
}
function g2Input(e) {
  if (gm.mode !== 'type' || !e.target.matches('.tp input')) return; const t = gm.ty;
  if (!t.go) { e.target.value = ''; return; } t.typed = e.target.value; tyText();
  if (t.typed === t.text) tyFinish(performance.now());
}
function g2Tick(now) {
  const root = gbox(); if (!root) return;
  if (gm.mode === 'sudoku') { const el = root.querySelector('.sdt'); if (el) el.textContent = fmtSec((now - gm.sd.t0) / 1000); return; }
  const t = gm.ty, el = (now - t.t0) / 1000, cd = root.querySelector('.cdn'); if (!cd) return;
  if (el < 0) { cd.textContent = `เริ่มใน ${Math.ceil(-el)}…`; return; }
  if (!t.go) { t.go = true; const inp = root.querySelector('.tp input'); inp.disabled = false; inp.focus(); S.tone(900, 1200, .12, .1); }
  cd.textContent = `${el.toFixed(1)} วิ`; tyBars(el); if (el > 150) tyFinishTimeout();
}
function tyFinishTimeout() { gm.mode = 'over'; gbox().innerHTML = `<div class="menu2" style="flex-direction:column;gap:8px"><b>หมดเวลา 😅</b><button data-g="menu" style="min-width:auto;padding:8px 16px">เมนู</button></div>`; }

/* ================= shared click / key routing ================= */
function g2Click(e) {
  const t = e.target, g = t.closest('[data-g]');
  if (g) { const k = g.dataset.g, m = { card: startCard, sudoku: () => startSudoku('mid'), typeth: () => startType('th'), typeen: () => startType('en') }[k]; if (m) { m(); S.tone(700, 900, .05, .05); return true; } return false; }
  let b;
  if ((b = t.closest('[data-bet]'))) { if (gm.mode === 'card' && gm.cd.ph !== 'play') { gm.cd.bet = +b.dataset.bet; cdRender(); } return true; }
  if (t.closest('[data-deal]')) { if (gm.mode === 'card') { gm.cd.ph = 'bet'; cdDeal(); S.tone(500, 800, .06, .06); } return true; }
  if (t.closest('[data-hit]')) { if (gm.mode === 'card' && gm.cd.ph === 'play') cdResolve(true); return true; }
  if (t.closest('[data-stand]')) { if (gm.mode === 'card' && gm.cd.ph === 'play') cdResolve(false); return true; }
  if ((b = t.closest('[data-sc]'))) { if (gm.mode === 'sudoku') { gm.sd.sel = +b.dataset.sc; sdkRender(); } return true; }
  if ((b = t.closest('[data-sn]'))) { sdkSet(+b.dataset.sn); return true; }
  if ((b = t.closest('[data-sdiff]'))) { startSudoku(b.dataset.sdiff); return true; }
  if (t.closest('[data-shint]')) { const s = gm.sd; if (gm.mode === 'sudoku' && s.hints > 0 && s.sel >= 0 && !s.puz[s.sel]) { s.hints--; sdkSet(s.sol[s.sel]); } else if (gm.mode === 'sudoku') S.toast('เลือกช่องว่างก่อนกดใบ้นะ', 1.4); return true; }
  return false;
}
function g2Key(e) {
  if (gm.mode !== 'sudoku' || e.target.tagName === 'INPUT') return; const s = gm.sd;
  if (/^[1-9]$/.test(e.key)) { sdkSet(+e.key); e.preventDefault(); } else if (/^(Backspace|Delete|0)$/.test(e.key)) { sdkSet(0); e.preventDefault(); }
  else if (/^Arrow/.test(e.key) && s.sel >= 0) { const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key], n = s.sel + d; if (n >= 0 && n < 81 && !(Math.abs(d) === 1 && (n / 9 | 0) !== (s.sel / 9 | 0))) { s.sel = n; sdkRender(); } e.preventDefault(); }
}
