'use strict';
/* Office game 1.2.0 (beta) — home room as a decorating game (isometric, transparent PNG kit).
   3 room sizes (by rent). Half-tile... quarter-tile lattice drawn on the room picture. Rules: footprint on the floor, no overlap,
   base must touch a wall on at least one side (rug + pets exempt). Flip = mirror + swap footprint. Wall / floor colours via blend overlays. */
const HMR = {"A":{"img":"roomA","w":1347,"h":983,"o":[573,413],"rows":["1111111111111111","1111111111111111","1111111111111111","1111111111111111","111111111111","111111111111","111111111111","111111111111","11111111","11111111","11111111","11111111"],"tile0":12},"B":{"img":"roomB","w":1158,"h":983,"o":[384,413],"rows":["1111111111111111","1111111111111111","1111111111111111","1111111111111111","111111111111","111111111111","111111111111","111111111111"],"tile0":12},"C":{"img":"roomC","w":1107,"h":998,"o":[448,473],"rows":["11111111111111","11111111111111","11111111111111","11111111111111","11111111111111","111111111","111111111","111111111","111111111"],"tile0":9}};
const HM_C = 47.25, HM_S = 0.577, HM_SCALE = 1.1;
const HM_NAT = {"deskpc":[223,224],"fridge":[147,244],"bed":[254,225],"washer":[143,189],"counter":[243,212],"ward":[145,226],"sofa":[235,201],"desk":[221,206],"tv":[180,204],"petbed":[252,151],"parrot":[120,160],"corgi":[95,127],"turtle":[173,133],"snake":[166,137],"rabbit":[77,110],"rug":[189,101],"cat":[99,75],"shower":[91,138]};
const HMI = { // w,d = footprint in quarter-tiles · fn = what "use" does · wall:false = free-standing · flat = lies on floor
  bed: { n: 'เตียง', w: 3, d: 3, fn: 'sleep', uniq: 1 },
  fridge: { n: 'ตู้เย็น', w: 2, d: 2, fn: 'fridge', uniq: 1 },
  counter: { n: 'ครัว/ซิงก์', w: 4, d: 2, fn: 'dishes', uniq: 1 },
  washer: { n: 'เครื่องซักผ้า', w: 2, d: 2, fn: 'laundry', uniq: 1 },
  shower: { n: 'ห้องอาบน้ำ', w: 2, d: 2, fn: 'bath', uniq: 1, sw: 150 },
  deskpc: { n: 'โต๊ะคอม', w: 3, d: 2, fn: 'pc', uniq: 1 },
  desk: { n: 'โต๊ะ', w: 3, d: 2 },
  ward: { n: 'ตู้เสื้อผ้า', w: 2, d: 1 },
  sofa: { n: 'โซฟา', w: 4, d: 2, fn: 'sofa' },
  tv: { n: 'ทีวี', w: 3, d: 1, fn: 'tv' },
  petbed: { n: 'ที่นอนสัตว์เลี้ยง', w: 3, d: 3 },
  rug: { n: 'พรม', w: 3, d: 2, flat: 1, wall: false },
  corgi: { n: 'หมา', w: 1, d: 1, pet: 'dog', wall: false },
  cat: { n: 'แมว', w: 1, d: 1, pet: 'cat', wall: false },
  rabbit: { n: 'กระต่าย', w: 1, d: 1, pet: 'rabbit', wall: false },
  parrot: { n: 'นกแก้ว', w: 2, d: 1, pet: 'parrot', wall: false },
  snake: { n: 'งู (ตู้)', w: 2, d: 2, pet: 'snake', wall: false },
  turtle: { n: 'เต่า (ตู้)', w: 2, d: 2, pet: 'turtle', wall: false },
};
for (const k in HMI) { const n = HM_NAT[k]; HMI[k].nat = n; HMI[k].sw = HMI[k].sw || Math.round(n[0] * HM_SCALE); }
const HM_PETKEY = { dog: 'corgi', cat: 'cat', rabbit: 'rabbit', parrot: 'parrot', snake: 'snake', turtle: 'turtle' };
const HM_WALLC = [null, '#c3d4ff', '#e8a3ff', '#ffbfbf', '#eb9a92', '#ffdb78', '#c1ffb0', '#999999', '#eeeeee'];
const HM_FLOORC = [null, { c: '#f7c9a6', m: '#ffffff', n: 'พีช' }, { c: '#a5714d', m: '#c0a592', n: 'น้ำตาล' }, { c: '#857a72', m: '#b9b0a8', n: 'เทาเข้ม' }, { c: '#f06a96', m: '#ffffff', n: 'ชมพู' }, { c: '#6fa8d8', m: '#ffffff', n: 'ฟ้า' }, { c: '#9a9a9a', m: '#d5d5d5', n: 'เทา' }, { c: '#ffffff', m: '#ffffff', n: 'ขาว' }];
HM_PETS.rabbit = { e: '🐇', n: 'กระต่าย', adopt: 900, food: 70 };
const HM_MAXIT = 26;
hm.lays = null; hm.lay = null; hm.sel = null; hm.deco = false; hm.seq = 0; hm.rest = 0; hm.sc = 1; hm.wc = 0; hm.fc = 0;

const hmKey = () => { const r = (bank.home && bank.home.rent) || 6500; return r < 4000 ? 'C' : r < 8000 ? 'B' : 'A'; };
const hmRoom = () => HMR[hmKey()];
const hmCell = (R, i, j) => i >= 0 && j >= 0 && j < R.rows.length && R.rows[j][i] === '1';
const hmDim = (it, f) => { const d = HMI[it.k]; return f ? [d.d, d.w] : [d.w, d.d]; };
function hmPt(p, q) { const R = hmRoom(); return [R.o[0] + (p - q) * HM_C, R.o[1] + (p + q) * HM_C * HM_S]; }
function hmInv(x, y) { const R = hmRoom(), a = (x - R.o[0]) / HM_C, b = (y - R.o[1]) / (HM_C * HM_S); return [(a + b) / 2, (b - a) / 2]; }
function hmOk(k, i, j, f, ex) {
  const R = hmRoom(), d = HMI[k], [w, dd] = f ? [d.d, d.w] : [d.w, d.d];
  for (let a = 0; a < w; a++) for (let b = 0; b < dd; b++) if (!hmCell(R, i + a, j + b)) return false;
  if (!d.flat) for (const o of hm.lay) {
    if (o.id === ex || HMI[o.k].flat) continue; const [ow, od] = hmDim(o, o.f);
    if (i < o.i + ow && o.i < i + w && j < o.j + od && o.j < j + dd) return false;
  }
  if (d.wall !== false && !(i === 0 || j === 0)) return false;
  return true;
}
function hmNearest(k, ti, tj, f, ex) {
  const R = hmRoom(); let best = null;
  for (let j = 0; j < R.rows.length; j++) for (let i = 0; i < R.rows[0].length; i++) {
    if (!hmOk(k, i, j, f, ex)) continue; const sc = (i - ti) ** 2 + (j - tj) ** 2; if (!best || sc < best.sc) best = { i, j, sc };
  }
  return best;
}
function hmAdd(k, i, j, f) { const b = hmNearest(k, i, j, f || 0, -1); if (!b) return null; const it = { id: ++hm.seq, k, i: b.i, j: b.j, f: f || 0 }; hm.lay.push(it); return it; }
function hmEnsure() {
  const key = hmKey(); if (!hm.lays) hm.lays = {};
  if (!hm.lays[key]) {
    hm.lays[key] = []; hm.lay = hm.lays[key]; const t = HMR[key].tile0;
    hmAdd('bed', 0, 0); hmAdd('deskpc', 0, 3, 1); hmAdd('washer', t, 0); hmAdd('shower', t + 2, 0); hmAdd('fridge', t - 2, 0); hmAdd('counter', t - 6, 0);
  }
  hm.lay = hm.lays[key];
  for (const pk in hm.pets) if (hm.pets[pk].have) { const k = HM_PETKEY[pk]; if (k && !hm.lay.some(o => o.k === k)) hmAdd(k, 5, 5); }
}
const hmAnchor = it => { const [w, d] = hmDim(it, it.f); return hmPt(it.i + w, it.j + d); };
const hmSpr = (it) => { const d = HMI[it.k], [x, y] = hmAnchor(it), sw = d.sw, sh = sw * d.nat[1] / d.nat[0]; return { x: x - sw / 2, y: y - sh + 3, sw }; };

function hmTint() {
  const R = hmRoom(), m = n => `-webkit-mask-image:url(img/home/${R.img}_${n}.png);mask-image:url(img/home/${R.img}_${n}.png)`;
  let h = ''; const wc = HM_WALLC[hm.wc], fc = HM_FLOORC[hm.fc];
  if (wc) h += `<div class="hmtint" style="${m('wall')};background:${wc};mix-blend-mode:color"></div>`;
  if (fc) h += `<div class="hmtint" style="${m('floor')};background:${fc.c};mix-blend-mode:color"></div>` + (fc.m !== '#ffffff' ? `<div class="hmtint" style="${m('floor')};background:${fc.m};mix-blend-mode:multiply"></div>` : '');
  return h;
}
function hmSceneHtml() {
  hmEnsure(); const R = hmRoom(), items = [...hm.lay].sort((a, b) => (HMI[b.k].flat ? 1 : 0) - (HMI[a.k].flat ? 1 : 0) || hmAnchor(a)[1] - hmAnchor(b)[1]);
  const day = hmToday();
  const els = items.map(it => {
    const d = HMI[it.k], s = hmSpr(it), y = hmAnchor(it)[1];
    const bd = it.k === 'counter' && hm.dirtyD >= 6 ? '<i class="hmbd">🍽️</i>' : it.k === 'washer' && hm.dirtyL >= 2 ? '<i class="hmbd">🧺</i>' : (d.pet && hm.pets[d.pet] && hm.pets[d.pet].fed < day ? '<i class="hmbd">💭</i>' : '');
    return `<div class="hmit${hm.sel === it.id ? ' sel' : ''}${d.flat ? ' flat' : ''}" data-it="${it.id}" style="left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;width:${s.sw}px;z-index:${d.flat ? 1 : 10 + Math.round(y)}"><img src="img/home/${it.k}.png" alt="" draggable="false" style="${it.f ? 'transform:scaleX(-1)' : ''}">${bd}</div>`;
  }).join('');
  return `<div class="hmscene" id="hmScene" style="width:${R.w}px;height:${R.h}px"><img class="hmroomimg" src="img/home/${R.img}.png" alt="" draggable="false" style="width:${R.w}px;height:${R.h}px">${hmTint()}${els}</div>`;
}
function hmBarHtml() {
  const it = hm.lay.find(o => o.id === hm.sel); if (!it) return `<p class="soft hmtip">💡 แตะของเพื่อเลือก · ลากเพื่อย้าย (ของจะชิดขอบกำแพง) · กด “🛋️ ตกแต่ง” เพื่อเพิ่มเฟอร์นิเจอร์/เปลี่ยนสี${hm.msg ? `<br><b>${esc(hm.msg)}</b>` : ''}</p>`;
  const d = HMI[it.k], fnl = { sleep: '😴 นอน', fridge: '🧊 เปิดตู้เย็น', dishes: '🍽️ ล้างจาน', laundry: '🧺 ซักผ้า', bath: '🚿 อาบน้ำ', pc: '🖥️ นั่งคอม', sofa: '🛋️ นั่งพัก', tv: '📺 ดูทีวี' }[d.fn] || (d.pet ? '🥣 ให้อาหาร' : '');
  return `<div class="hmbar"><b>${esc(d.n)}</b>${fnl ? `<button class="btn2" data-hm="use">${fnl}</button>` : ''}<button class="btn2 ghost" data-hm="flip">🔄 พลิก</button>${d.pet ? '' : '<button class="btn2 ghost" data-hm="store">📦 เก็บ</button>'}</div>${hm.msg ? `<p class="soft hmtip"><b>${esc(hm.msg)}</b></p>` : ''}`;
}
function hmDecoHtml() {
  const have = k => hm.lay.filter(o => o.k === k).length;
  const list = Object.keys(HMI).filter(k => !HMI[k].pet || (hm.pets[HMI[k].pet] && hm.pets[HMI[k].pet].have)).map(k => {
    const d = HMI[k], no = (d.uniq || d.pet) && have(k) >= 1;
    return `<button class="hmcat${no ? ' off' : ''}" data-hm="add" data-k="${k}"${no ? ' disabled' : ''}><img src="img/home/${k}.png" alt=""><small>${esc(d.n)}${no ? ' · วางแล้ว' : ''}</small></button>`;
  }).join('');
  const wd = HM_WALLC.map((c, n) => `<button class="hmdot${hm.wc === n ? ' on' : ''}" data-hm="wc" data-n="${n}" style="background:${c || 'repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)'}" title="${c ? 'สีผนัง' : 'สีเดิม'}"></button>`).join('');
  const fd = HM_FLOORC.map((c, n) => `<button class="hmdot${hm.fc === n ? ' on' : ''}" data-hm="fc" data-n="${n}" style="background:${c ? c.c : 'repeating-linear-gradient(45deg,#e9bd94 0 4px,#f4d6b8 4px 8px)'}" title="${c ? c.n : 'พื้นเดิม'}"></button>`).join('');
  return `<div class="hmdeco"><div class="hmcol"><span>🎨 ผนัง</span>${wd}</div><div class="hmcol"><span>🪵 พื้น</span>${fd}</div><div class="hmdt">🛋️ เฟอร์นิเจอร์ <small>(${hm.lay.length}/${HM_MAXIT} ชิ้น · แตะเพื่อวางในห้อง)</small></div><div class="hmcats">${list}</div></div>`;
}
hmRoomHtml = function (st, jl) {
  const home = bank.home; hmEnsure(); const R = hmRoom();
  const conf = hm.ask === 'sleep' ? `<div class="hmask in"><div class="hmbig">😴</div><h3>นอนพักเลยไหม?</h3><p>ข้ามไปเช้า 07:00 ของวันถัดไป · ความเครียดลด 80% (จาก ${st} เหลือ ~${Math.round(st * .2)})</p><p class="soft">ระหว่างข้ามวัน ค่าข้าว/บิลรายวันจะคิดตามปกติ · สัตว์เลี้ยงที่ยังไม่ได้กินจะเครียดนะ</p><div class="hmrow"><button class="btn2" data-hm="sleepok">💤 ยืนยันนอน</button><button class="btn2 ghost" data-hm="x2">ยังไม่นอน</button></div></div>` : '';
  return `<button class="hmx" data-hm="close">✕</button>
  <div class="hmhead"><div><h3>🏠 ${esc(home.name)}</h3><small>ค่าเช่า ${baht(home.rent)} บาท/เดือน · ห่างออฟฟิศ ${home.km} กม.</small></div><div class="hmst" data-lv="${st >= 80 ? 'bad' : st >= 50 ? 'mid' : 'ok'}">${st >= 80 ? '🤯' : st >= 50 ? '😣' : '🙂'} เครียด ${st}</div></div>
  <div class="hmstage dec" id="hmStage">${hmSceneHtml()}${conf}</div>${hmBarHtml()}${hm.deco ? hmDecoHtml() : ''}
  <div class="hmrow"><button class="btn2${hm.deco ? '' : ' ghost'}" data-hm="deco">🛋️ ตกแต่ง${hm.deco ? ' (ปิด)' : ''}</button><button class="btn2" data-hm="chores">🧹 ทำงานบ้าน${hm.dirtyD >= 6 || hm.dirtyL >= 2 ? ' ⚠️' : ''}</button>${jl ? '' : `<button class="btn2 ghost" data-hm="toWork">🚌 ไปออฟฟิศ (${baht(hmFare())}฿)</button>`}</div>`;
};
const _hmRenderDeco = hmRender;
hmRender = function () { _hmRenderDeco(); try { if (hmEl) { hmEl.classList.add('full'); const p = hmEl.firstElementChild; if (p) p.classList.toggle('room', hm.view === 'room' && hm.ask !== 'go'); } hmFit(); } catch (e) { console.error(e); } };
function hmFit() { const st = $('hmStage'), sc = $('hmScene'); if (!st || !sc) return; const R = hmRoom(), w = st.clientWidth, h = st.clientHeight; hm.sc = Math.max(.05, Math.min(w / R.w, h / R.h)); sc.style.transform = `translate(${(w - R.w * hm.sc) / 2}px,${(h - R.h * hm.sc) / 2}px) scale(${hm.sc})`; }
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
      if (a === 'wc') { hm.wc = +b.dataset.n; hmDecoDone(); hmRender(); return; }
      if (a === 'fc') { hm.fc = +b.dataset.n; hmDecoDone(); hmRender(); return; }
      if (a === 'add') { const k = b.dataset.k; if (hm.lay.length >= HM_MAXIT) { hm.msg = 'ห้องเต็มแล้ว เก็บของออกก่อนนะ'; hmRender(); return; } const d = HMI[k], t0 = hmRoom().tile0, f = d.fn === 'bath' || d.fn === 'laundry' ? hmAdd(k, t0, 0, 0) : hmAdd(k, 3, 6, 0); if (!f) { hm.msg = 'ไม่มีที่ว่างพอสำหรับชิ้นนี้'; S.toast('ไม่มีที่ว่างพอวางชิ้นนี้', 1.6); hmRender(); return; } hm.sel = f.id; hm.msg = ''; S.tone(600, 800, .05, .05); hmDecoDone(); hmRender(); return; }
      if (a === 'use' && it) { hmUse(it); return; }
      if (a === 'flip' && it) { const nf = it.f ? 0 : 1, bst = hmNearest(it.k, it.i, it.j, nf, it.id); if (!bst) { hm.msg = 'พลิกไม่ได้ ไม่มีที่ว่างพอ'; hmRender(); return; } it.f = nf; it.i = bst.i; it.j = bst.j; hm.msg = ''; S.tone(500, 700, .04, .05); hmDecoDone(); hmRender(); return; }
      if (a === 'store' && it) { hm.lays[hmKey()] = hm.lay = hm.lay.filter(o => o.id !== it.id); hm.sel = null; hm.msg = `เก็บ${HMI[it.k].n}ใส่กล่องแล้ว (เอากลับมาวางได้จาก “ตกแต่ง”)`; hmRender(); return; }
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
    const tx = px(ev.clientX) - dx0, ty = py(ev.clientY) - dy0, [w, d] = hmDim(it, it.f), [p, q] = hmInv(tx, ty);
    const b = hmNearest(it.k, p - w, q - d, it.f, it.id); if (!b) return; g.best = b;
    const [X, Y] = hmPt(b.i + w, b.j + d), d0 = HMI[it.k], sw = d0.sw, sh = sw * d0.nat[1] / d0.nat[0];
    el.style.left = (X - sw / 2) + 'px'; el.style.top = (Y - sh + 3) + 'px'; el.style.zIndex = 4000;
  };
  const up = () => {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
    if (g.moved && g.best) { it.i = g.best.i; it.j = g.best.j; hm.msg = ''; S.tone(520, 380, .06, .05); hmDecoDone(); }
    if (g.moved) setTimeout(() => { hm.dg = null; hmRender(); }, 0); else hm.dg = null;
  };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
};

/* ---------- save ---------- */
const _snapDeco = snapshot; snapshot = () => { const s = _snapDeco(); if (s.hm) { s.hm.lays = hm.lays; s.hm.seq = hm.seq; s.hm.rest = hm.rest; s.hm.wc = hm.wc; s.hm.fc = hm.fc; delete s.hm.lay; } return s; };
const _loadDeco = loadGame;
loadGame = function () {
  const ok = _loadDeco();
  if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'), h = s && s.hm || {}; hm.lays = h.lays || null; hm.lay = null; hm.seq = h.seq || 0; hm.rest = h.rest || 0; hm.wc = h.wc || 0; hm.fc = h.fc || 0; if (hm.lays) for (const k in hm.lays) { hm.lays[k] = hm.lays[k].filter(o => HMI[o.k]); hm.seq = Math.max(hm.seq, ...hm.lays[k].map(o => o.id), 0); } } catch (e) {} }
  return ok;
};

/* ---------- mission ---------- */
try { const T = { id: 'n12deco', t: '✨ [ใหม่] ที่ห้องพัก กด “🛋️ ตกแต่ง” เพิ่มเฟอร์นิเจอร์/เปลี่ยนสี แล้วลาก/พลิกให้ชิดกำแพง' }; if (!NEW_TASKS.some(x => x.id === T.id)) NEW_TASKS.push(T); if (typeof TASKS !== 'undefined' && TASKS.some(x => x.id === 'n12cam') && !TASKS.some(x => x.id === T.id)) { TASKS.push(T); renderTasks(); } } catch (e) {}
