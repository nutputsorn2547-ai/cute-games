'use strict';
/* Office game 1.2.0 (beta) — home room as a decorating game (isometric).
   Items snap to a half-tile lattice drawn on the room picture. Rules: footprint must be on the floor (wall + floor edge limit it),
   cannot overlap other items, and its base must touch a wall on at least one side (rug + pets are exempt). Flip = mirror + swap footprint. */
const HMZ = {
  room: { o: [212, 119], ca: [14, 8.89], cb: [-14, 6.02], I: 17, J: 15, wi: true, wj: true,
    cell: (i, j) => (i >= 0 && j >= 0) && ((i < 10 && j < 14) || (i >= 10 && i < 16 && j < 7)), blocked: (i, j) => i >= 11 && i <= 13 && j <= 1 },
  bath: { o: [463, 140], ca: [13, 6.11], cb: [-13, 6.11], I: 9, J: 11, wi: true, wj: true,
    cell: (i, j) => i >= 0 && j >= 0 && i < 8 && j < 10 && i >= j, blocked: () => false },
};
const HM_IMG = k => 'img/home/' + k + '.png';
const HMI = { // w,d = footprint in half-tiles · sw = drawn width px · nh = natural height ratio filled in at runtime
  bed: { n: 'เตียง', w: 5, d: 3, sw: 118, fn: 'sleep', uniq: 1, nat: [150, 136] },
  fridge: { n: 'ตู้เย็น', w: 2, d: 2, sw: 60, fn: 'fridge', uniq: 1, nat: [86, 142] },
  counter: { n: 'ครัว/ซิงก์', w: 6, d: 2, sw: 118, fn: 'dishes', uniq: 1, nat: [153, 138] },
  washer: { n: 'เครื่องซักผ้า', w: 2, d: 2, sw: 56, fn: 'laundry', uniq: 1, nat: [84, 109] },
  shower: { n: 'ห้องอาบน้ำ', w: 2, d: 2, sw: 60, fn: 'bath', uniq: 1, nat: [93, 140] },
  deskpc: { n: 'โต๊ะคอม', w: 6, d: 3, sw: 126, fn: 'pc', uniq: 1, nat: [126, 122] },
  desk: { n: 'โต๊ะ', w: 6, d: 3, sw: 126, nat: [130, 120] },
  chair: { n: 'เก้าอี้', w: 2, d: 2, sw: 46, nat: [72, 115] },
  sofa: { n: 'โซฟา', w: 6, d: 3, sw: 122, fn: 'sofa', nat: [134, 114] },
  tv: { n: 'ทีวี', w: 4, d: 2, sw: 80, fn: 'tv', nat: [107, 119] },
  ward1: { n: 'ตู้เสื้อผ้า (สูง)', w: 2, d: 2, sw: 52, nat: [75, 128] },
  ward2: { n: 'ตู้เสื้อผ้า (บานคู่)', w: 3, d: 2, sw: 68, nat: [87, 128] },
  ward3: { n: 'ตู้เสื้อผ้า (เปิด)', w: 3, d: 2, sw: 78, nat: [109, 128] },
  ward4: { n: 'ตู้เสื้อผ้า (ม่วง)', w: 3, d: 2, sw: 70, nat: [92, 128] },
  ward6: { n: 'ตู้กระจก', w: 4, d: 2, sw: 88, nat: [125, 128] },
  dresser: { n: 'ตู้ลิ้นชัก', w: 6, d: 2, sw: 108, nat: [132, 127] },
  petbed: { n: 'ที่นอนสัตว์เลี้ยง', w: 3, d: 3, sw: 84, nat: [147, 89] },
  cattree: { n: 'คอนแมว', w: 2, d: 2, sw: 60, nat: [128, 120] },
  cage: { n: 'กรงนก', w: 2, d: 2, sw: 50, nat: [98, 127] },
  rug: { n: 'พรม', w: 6, d: 4, sw: 124, flat: 1, wall: false, nat: [142, 79] },
  corgi: { n: 'หมา', w: 2, d: 2, sw: 46, pet: 'dog', wall: false, nat: [91, 117] },
  cat: { n: 'แมว', w: 2, d: 2, sw: 56, pet: 'cat', wall: false, nat: [125, 93] },
  rabbit: { n: 'กระต่าย', w: 2, d: 2, sw: 42, pet: 'rabbit', wall: false, nat: [84, 120] },
  parrot: { n: 'นกแก้ว', w: 2, d: 2, sw: 50, pet: 'parrot', wall: false, nat: [97, 126] },
  snake: { n: 'งู (ตู้)', w: 4, d: 3, sw: 90, pet: 'snake', wall: false, nat: [145, 117] },
  turtle: { n: 'เต่า (ตู้)', w: 3, d: 3, sw: 74, pet: 'turtle', wall: false, nat: [129, 98] },
};
const HM_PETKEY = { dog: 'corgi', cat: 'cat', rabbit: 'rabbit', parrot: 'parrot', snake: 'snake', turtle: 'turtle' };
HM_PETS.rabbit = { e: '🐇', n: 'กระต่าย', adopt: 900, food: 70 };
const HM_MAXIT = 26;
hm.lay = null; hm.sel = null; hm.deco = false; hm.seq = 0; hm.rest = 0; hm.sc = 1;

const hmDim = (it, f) => { const d = HMI[it.k]; return f ? [d.d, d.w] : [d.w, d.d]; };
function hmPt(z, p, q) { const Z = HMZ[z]; return [Z.o[0] + p * Z.ca[0] + q * Z.cb[0], Z.o[1] + p * Z.ca[1] + q * Z.cb[1]]; }
function hmInv(z, x, y) { const Z = HMZ[z], rx = x - Z.o[0], ry = y - Z.o[1], det = Z.ca[0] * Z.cb[1] - Z.ca[1] * Z.cb[0]; return [(rx * Z.cb[1] - ry * Z.cb[0]) / det, (Z.ca[0] * ry - Z.ca[1] * rx) / det]; }
function hmOk(k, z, i, j, f, ex) {
  const Z = HMZ[z], d = HMI[k], [w, dd] = f ? [d.d, d.w] : [d.w, d.d];
  for (let a = 0; a < w; a++) for (let b = 0; b < dd; b++) if (!Z.cell(i + a, j + b) || Z.blocked(i + a, j + b)) return false;
  if (!d.flat) for (const o of hm.lay) {
    if (o.id === ex || o.z !== z || HMI[o.k].flat) continue; const [ow, od] = hmDim(o, o.f);
    if (i < o.i + ow && o.i < i + w && j < o.j + od && o.j < j + dd) return false;
  }
  if (d.wall !== false && !((i === 0 && Z.wi) || (j === 0 && Z.wj))) return false;
  return true;
}
function hmNearest(k, z0, ti, tj, f, ex) {
  let best = null;
  for (const z of z0 === 'room' ? ['room', 'bath'] : ['bath', 'room']) {
    const Z = HMZ[z];
    for (let i = 0; i < Z.I; i++) for (let j = 0; j < Z.J; j++) {
      if (!hmOk(k, z, i, j, f, ex)) continue;
      const sc = (z === z0 ? (i - ti) ** 2 + (j - tj) ** 2 : 400 + (i - ti) ** 2 + (j - tj) ** 2);
      if (!best || sc < best.sc) best = { z, i, j, sc };
    }
  }
  return best;
}
function hmAdd(k, z, i, j, f) { const b = hmNearest(k, z, i, j, f || 0, -1); if (!b) return null; const it = { id: ++hm.seq, k, z: b.z, i: b.i, j: b.j, f: f || 0 }; hm.lay.push(it); return it; }
function hmEnsure() {
  if (!hm.lay) {
    hm.lay = []; hm.seq = 0;
    hmAdd('bed', 'room', 0, 0); hmAdd('counter', 'room', 5, 0); hmAdd('fridge', 'room', 14, 0); hmAdd('deskpc', 'room', 0, 3, 1); hmAdd('washer', 'bath', 4, 0); hmAdd('shower', 'bath', 6, 0);
  }
  for (const pk in hm.pets) if (hm.pets[pk].have) { const k = HM_PETKEY[pk]; if (k && !hm.lay.some(o => o.k === k)) hmAdd(k, 'room', 4, 8); }
}
const hmAnchor = it => { const [w, d] = hmDim(it, it.f); return hmPt(it.z, it.i + w, it.j + d); };

function hmSceneHtml() {
  hmEnsure(); const items = [...hm.lay].sort((a, b) => (HMI[b.k].flat ? 1 : 0) - (HMI[a.k].flat ? 1 : 0) || hmAnchor(a)[1] - hmAnchor(b)[1] + (a.z === 'bath' ? 0 : 0));
  const day = hmToday();
  const els = items.map((it, n) => {
    const d = HMI[it.k], [x, y] = hmAnchor(it), sw = d.sw, sh = sw * d.nat[1] / d.nat[0];
    const bd = it.k === 'counter' && hm.dirtyD >= 6 ? '<i class="hmbd">🍽️</i>' : it.k === 'washer' && hm.dirtyL >= 2 ? '<i class="hmbd">🧺</i>' : (d.pet && hm.pets[d.pet] && hm.pets[d.pet].fed < day ? '<i class="hmbd">💭</i>' : '');
    return `<div class="hmit${hm.sel === it.id ? ' sel' : ''}${d.flat ? ' flat' : ''}" data-it="${it.id}" style="left:${(x - sw / 2).toFixed(1)}px;top:${(y - sh + 2).toFixed(1)}px;width:${sw}px;z-index:${d.flat ? 1 : 10 + Math.round(y)}"><img src="${HM_IMG(it.k)}" alt="" draggable="false" style="${it.f ? 'transform:scaleX(-1)' : ''}">${bd}</div>`;
  }).join('');
  return `<div class="hmscene" id="hmScene"><img class="hmroomimg" src="${HM_IMG('room')}" alt="" draggable="false">${els}</div>`;
}
function hmBarHtml() {
  const it = hm.lay.find(o => o.id === hm.sel); if (!it) return `<p class="soft hmtip">💡 แตะของเพื่อเลือก · ลากเพื่อย้าย (ของจะชิดขอบกำแพง) · กด “🛋️ ตกแต่ง” เพื่อเพิ่มเฟอร์นิเจอร์${hm.msg ? `<br><b>${esc(hm.msg)}</b>` : ''}</p>`;
  const d = HMI[it.k], fnl = { sleep: '😴 นอน', fridge: '🧊 เปิดตู้เย็น', dishes: '🍽️ ล้างจาน', laundry: '🧺 ซักผ้า', bath: '🚿 อาบน้ำ', pc: '🖥️ นั่งคอม', sofa: '🛋️ นั่งพัก', tv: '📺 ดูทีวี' }[d.fn] || (d.pet ? '🥣 ให้อาหาร' : '');
  return `<div class="hmbar"><b>${esc(d.n)}</b>${fnl ? `<button class="btn2" data-hm="use">${fnl}</button>` : ''}<button class="btn2 ghost" data-hm="flip">🔄 พลิก</button>${d.pet ? '' : '<button class="btn2 ghost" data-hm="store">📦 เก็บ</button>'}</div>${hm.msg ? `<p class="soft hmtip"><b>${esc(hm.msg)}</b></p>` : ''}`;
}
function hmDecoHtml() {
  const have = k => hm.lay.filter(o => o.k === k).length;
  const list = Object.keys(HMI).filter(k => !HMI[k].pet || (hm.pets[HMI[k].pet] && hm.pets[HMI[k].pet].have)).map(k => {
    const d = HMI[k], no = (d.uniq || d.pet) && have(k) >= 1;
    return `<button class="hmcat${no ? ' off' : ''}" data-hm="add" data-k="${k}"${no ? ' disabled' : ''}><img src="${HM_IMG(k)}" alt=""><small>${esc(d.n)}${no ? ' · วางแล้ว' : ''}</small></button>`;
  }).join('');
  return `<div class="hmdeco"><div class="hmdt">🛋️ เฟอร์นิเจอร์ <small>(${hm.lay.length}/${HM_MAXIT} ชิ้น · แตะเพื่อวางในห้อง)</small></div><div class="hmcats">${list}</div></div>`;
}
hmRoomHtml = function (st, jl) {
  const home = bank.home; hmEnsure();
  const conf = hm.ask === 'sleep' ? `<div class="hmask in"><div class="hmbig">😴</div><h3>นอนพักเลยไหม?</h3><p>ข้ามไปเช้า 07:00 ของวันถัดไป · ความเครียดลด 80% (จาก ${st} เหลือ ~${Math.round(st * .2)})</p><p class="soft">ระหว่างข้ามวัน ค่าข้าว/บิลรายวันจะคิดตามปกติ · สัตว์เลี้ยงที่ยังไม่ได้กินจะเครียดนะ</p><div class="hmrow"><button class="btn2" data-hm="sleepok">💤 ยืนยันนอน</button><button class="btn2 ghost" data-hm="x2">ยังไม่นอน</button></div></div>` : '';
  return `<button class="hmx" data-hm="close">✕</button>
  <div class="hmhead"><div><h3>🏠 ${esc(home.name)}</h3><small>ค่าเช่า ${baht(home.rent)} บาท/เดือน · ห่างออฟฟิศ ${home.km} กม.</small></div><div class="hmst" data-lv="${st >= 80 ? 'bad' : st >= 50 ? 'mid' : 'ok'}">${st >= 80 ? '🤯' : st >= 50 ? '😣' : '🙂'} เครียด ${st}</div></div>
  <div class="hmstage dec" id="hmStage">${hmSceneHtml()}${conf}</div>${hmBarHtml()}${hm.deco ? hmDecoHtml() : ''}
  <div class="hmrow"><button class="btn2${hm.deco ? '' : ' ghost'}" data-hm="deco">🛋️ ตกแต่ง${hm.deco ? ' (ปิด)' : ''}</button><button class="btn2" data-hm="chores">🧹 ทำงานบ้าน${hm.dirtyD >= 6 || hm.dirtyL >= 2 ? ' ⚠️' : ''}</button>${jl ? '' : `<button class="btn2 ghost" data-hm="toWork">🚌 ไปออฟฟิศ (${baht(hmFare())}฿)</button>`}</div>`;
};
const _hmRenderDeco = hmRender;
hmRender = function () { _hmRenderDeco(); try { hmFit(); } catch (e) { console.error(e); } };
function hmFit() { const st = $('hmStage'), sc = $('hmScene'); if (!st || !sc) return; hm.sc = st.clientWidth / 572; sc.style.transform = `scale(${hm.sc})`; }
window.addEventListener('resize', () => { if (hm.on) hmFit(); });

/* ---------- use ---------- */
function hmUse(it) {
  const fn = HMI[it.k].fn, d = HMI[it.k];
  if (fn === 'sleep') { hm.ask = 'sleep'; hmRender(); return; }
  if (fn === 'fridge') { fdOpen(); return; }
  if (fn === 'dishes') { hm.view = 'chores'; hm.tab = 'dishes'; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (fn === 'laundry') { hm.view = 'chores'; hm.tab = 'laundry'; hm.g = null; hm.msg = ''; hmRender(); return; }
  if (fn === 'bath') { const dy = hmToday(); if (hm.shower >= dy) { hm.msg = 'วันนี้อาบน้ำไปแล้ว 🚿'; hmRender(); return; } hm.shower = dy; hmStress(-5); S.toast('🚿 อาบน้ำสบายตัว เครียด −5', 2); hm.msg = 'อาบน้ำสบายตัว เครียด −5'; hmRender(); return; }
  if (fn === 'pc') { hmClose(); hm.at = true; hmChip(); S.toast('🖥️ นั่งโต๊ะคอมที่บ้านแล้ว (ใช้คอมได้เหมือนปกติ · เปิดห้องพักได้จากมือถือ)', 3.2); return; }
  if (fn === 'sofa' || fn === 'tv') { const dy = hmToday(); if (hm.rest >= dy) { hm.msg = 'วันนี้พักผ่อนไปแล้ว 😌'; hmRender(); return; } hm.rest = dy; hmStress(-2); S.toast(fn === 'tv' ? '📺 ดูทีวีเพลินๆ เครียด −2' : '🛋️ นั่งพักบนโซฟา เครียด −2', 2); hm.msg = 'ได้พักผ่อน เครียด −2'; hmRender(); return; }
  if (d.pet) {
    const k = d.pet, s = hm.pets[k]; if (!s || !s.have) return;
    if (s.fed >= hmToday()) { hm.msg = `${HM_PETS[k].n}อิ่มแล้ววันนี้ 💚`; hmRender(); return; }
    if (s.food <= 0) { hm.msg = 'อาหารหมด! สั่งซื้อที่ 🧹 ทำงานบ้าน → สัตว์เลี้ยง'; hmRender(); return; }
    s.food--; s.fed = hmToday(); hmStress(-1); S.tone(600, 900, .08, .06); try { complete('n12chore'); } catch (x) {}
    hm.msg = `${HM_PETS[k].n}กินอาหารแล้ว ${HM_PETS[k].e}${s.food === 0 ? ' · อาหารหมดแล้ว ต้องสั่งซื้อ!' : ''}`; hmRender();
  }
}
const hmDecoDone = () => { try { complete('n12deco'); } catch (x) {} };

/* ---------- clicks ---------- */
const _hmClickDeco = hmClick;
hmClick = function (e) {
  if (hm.dg && hm.dg.moved) return;
  const t = e.target;
  if (hm.on && hm.view === 'room' && !hm.ask) {
    const b = t.closest('[data-hm]');
    if (b) {
      const a = b.dataset.hm, it = hm.lay && hm.lay.find(o => o.id === hm.sel);
      if (a === 'deco') { hm.deco = !hm.deco; hmRender(); return; }
      if (a === 'add') { const k = b.dataset.k; if (hm.lay.length >= HM_MAXIT) { hm.msg = 'ห้องเต็มแล้ว เก็บของออกก่อนนะ'; hmRender(); return; } const d = HMI[k], f = hmAdd(k, d.fn === 'bath' || d.fn === 'laundry' ? 'bath' : 'room', 3, 8, 0); if (!f) { hm.msg = 'ไม่มีที่ว่างพอสำหรับชิ้นนี้'; S.toast('ไม่มีที่ว่างพอวางชิ้นนี้', 1.6); hmRender(); return; } hm.sel = f.id; hm.msg = ''; S.tone(600, 800, .05, .05); hmDecoDone(); hmRender(); return; }
      if (a === 'use' && it) { hmUse(it); return; }
      if (a === 'flip' && it) { const nf = it.f ? 0 : 1, [w, d] = hmDim(it, nf), bst = hmNearest(it.k, it.z, it.i, it.j, nf, it.id); if (!bst) { hm.msg = 'พลิกไม่ได้ ไม่มีที่ว่างพอ'; hmRender(); return; } it.f = nf; it.z = bst.z; it.i = bst.i; it.j = bst.j; hm.msg = ''; S.tone(500, 700, .04, .05); hmDecoDone(); hmRender(); return; }
      if (a === 'store' && it) { hm.lay = hm.lay.filter(o => o.id !== it.id); hm.sel = null; hm.msg = `เก็บ${HMI[it.k].n}ใส่กล่องแล้ว (เอากลับมาวางได้จาก “ตกแต่ง”)`; hmRender(); return; }
    } else {
      const el = t.closest('[data-it]');
      if (el) { const id = +el.dataset.it; hm.sel = hm.sel === id ? null : id; hm.msg = ''; hmRender(); return; }
      if (t.closest('#hmScene') || t.id === 'hmStage') { if (hm.sel) { hm.sel = null; hmRender(); } return; }
    }
  }
  _hmClickDeco(e);
};

/* ---------- drag ---------- */
hmDown = function (e) {
  const el = e.target.closest('.hmit'); if (!el || !hm.on || hm.ask) return; const it = hm.lay.find(o => o.id === +el.dataset.it); if (!it) return;
  const sc = $('hmScene'); if (!sc) return; const r = sc.getBoundingClientRect(), s = hm.sc || 1;
  const px = x => (x - r.left) / s, py = y => (y - r.top) / s, [ax, ay] = hmAnchor(it);
  const dx0 = px(e.clientX) - ax, dy0 = py(e.clientY) - ay, x0 = e.clientX, y0 = e.clientY;
  const g = hm.dg = { it, moved: false, best: null };
  const mv = ev => {
    if (!g.moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
    if (!g.moved) { g.moved = true; el.classList.add('drag'); hm.sel = it.id; }
    const tx = px(ev.clientX) - dx0, ty = py(ev.clientY) - dy0, [w, d] = hmDim(it, it.f);
    let bz = null, bi = 0, bj = 0, bd = 1e9;
    for (const z in HMZ) { const [p, q] = hmInv(z, tx, ty), i = p - w, j = q - d, Z = HMZ[z]; const dd = Math.max(0, -i, i - Z.I, -j, j - Z.J); if (dd < bd) { bd = dd; bz = z; bi = i; bj = j; } }
    const b = hmNearest(it.k, bz, bi, bj, it.f, it.id); if (!b) return; g.best = b;
    const d0 = HMI[it.k], [X, Y] = hmPt(b.z, b.i + w, b.j + d), sw = d0.sw, sh = sw * d0.nat[1] / d0.nat[0];
    el.style.left = (X - sw / 2) + 'px'; el.style.top = (Y - sh + 2) + 'px'; el.style.zIndex = 400;
  };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
    if (g.moved && g.best) { it.z = g.best.z; it.i = g.best.i; it.j = g.best.j; hm.msg = ''; S.tone(520, 380, .06, .05); hmDecoDone(); }
    if (g.moved) setTimeout(() => { hm.dg = null; hmRender(); }, 0); else hm.dg = null;
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
};

/* ---------- save ---------- */
const _snapDeco = snapshot; snapshot = () => { const s = _snapDeco(); if (s.hm) { s.hm.lay = hm.lay; s.hm.seq = hm.seq; s.hm.rest = hm.rest; } return s; };
const _loadDeco = loadGame;
loadGame = function () {
  const ok = _loadDeco();
  if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); hm.lay = s && s.hm && Array.isArray(s.hm.lay) ? s.hm.lay.filter(o => HMI[o.k]) : null; hm.seq = (s && s.hm && s.hm.seq) || (hm.lay ? hm.lay.reduce((m, o) => Math.max(m, o.id), 0) : 0); hm.rest = (s && s.hm && s.hm.rest) || 0; } catch (e) {} }
  return ok;
};

/* ---------- mission ---------- */
try { const T = { id: 'n12deco', t: '✨ [ใหม่] ที่ห้องพัก กด “🛋️ ตกแต่ง” เพิ่มเฟอร์นิเจอร์ แล้วลาก/พลิกให้ชิดกำแพง' }; if (!NEW_TASKS.some(x => x.id === T.id)) NEW_TASKS.push(T); if (typeof TASKS !== 'undefined' && TASKS.some(x => x.id === 'n12cam') && !TASKS.some(x => x.id === T.id)) { TASKS.push(T); renderTasks(); } } catch (e) {}
