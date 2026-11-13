"use strict";
// Office game — job site and mini games. Files load in order and share one global scope (see office/index.html).
/* ================= job site ================= */
const JOBS = [
  { id: 'j1', co: 'บริษัท ขนมหวาน จำกัด', e: '🍰', c: '#ffe1ec', pos: 'นักบัญชีอาวุโส', min: 30000, max: 38000, where: 'กรุงเทพฯ · ไฮบริด', tags: ['บัญชี'], desc: 'ดูแลปิดงบรายเดือน ตรวจเอกสาร และทำงานร่วมกับผู้สอบบัญชี', need: ['ปริญญาตรีสาขาบัญชี', 'ประสบการณ์ 3 ปีขึ้นไป', 'ใช้ Excel คล่อง'], perks: ['ทำงานที่บ้านได้ 2 วัน/สัปดาห์', 'ขนมฟรีทุกวัน 🍩', 'โบนัสปีละ 2 เดือน'] },
  { id: 'j2', co: 'สำนักงานบัญชี ดาวเด่น', e: '⭐', c: '#fff1b8', pos: 'ผู้ช่วยผู้สอบบัญชี', min: 25000, max: 32000, where: 'นนทบุรี', tags: ['บัญชี'], desc: 'ช่วยตรวจสอบงบการเงินลูกค้า เตรียมกระดาษทำการ', need: ['จบสาขาบัญชี', 'อยากเป็นผู้สอบบัญชีรับอนุญาต', 'ขับรถได้'], perks: ['สนับสนุนค่าติวสอบ', 'ประกันสุขภาพ'] },
  { id: 'j3', co: 'บริษัท ปลาทอง โลจิสติกส์', e: '🐟', c: '#d9ecff', pos: 'เจ้าหน้าที่ภาษี', min: 28000, max: 35000, where: 'สมุทรปราการ', tags: ['ภาษี'], desc: 'ดูแลภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย และยื่นแบบออนไลน์', need: ['รู้เรื่องภาษีอากร', 'ละเอียดรอบคอบ'], perks: ['รถรับส่งพนักงาน', 'ข้าวกลางวันฟรี'] },
  { id: 'j4', co: 'บริษัท ช้างน้อย เทค', e: '🐘', c: '#e6dcff', pos: 'นักวิเคราะห์การเงิน', min: 40000, max: 50000, where: 'กรุงเทพฯ · ใกล้รถไฟฟ้า', tags: ['การเงิน'], desc: 'วิเคราะห์งบประมาณ ทำรายงานและแดชบอร์ดให้ผู้บริหาร', need: ['ภาษาอังกฤษดี', 'Excel ขั้นสูง'], perks: ['เวลาทำงานยืดหยุ่น', 'งบเรียนคอร์สออนไลน์'] },
  { id: 'j5', co: 'ร้านกาแฟเมฆ', e: '☕', c: '#f0e2d0', pos: 'ผู้จัดการร้าน', min: 22000, max: 26000, where: 'เชียงใหม่', tags: ['บริการ'], desc: 'ดูแลร้าน จัดตารางพนักงาน สรุปยอดขายรายวัน', need: ['ชอบกาแฟ', 'ใจดีกับลูกค้า'], perks: ['กาแฟฟรีไม่อั้น ☕'] },
];
const jobs = { W: null, q: '', f: 'all', view: null, applied: new Set() };
function openJobs() {
  if (jobs.W && wins.has('jobs')) { focusWin(jobs.W); return jobs.W; }
  const root = h('div', { class: 'jb' }, `<div class="hdr"><b>💼 จ๊อบน้อย</b><input type="text" placeholder="ค้นหาตำแหน่ง บริษัท จังหวัด…" spellcheck="false"></div><div class="flt">${[['all', 'ทั้งหมด'], ['บัญชี', 'บัญชี'], ['ภาษี', 'ภาษี'], ['การเงิน', 'การเงิน'], ['30k', 'เงินเดือน 30,000+']].map(([k, n]) => `<button data-f="${k}">${n}</button>`).join('')}</div><div class="lst2"></div>`);
  jobs.W = openWin('jobs', 'จ๊อบน้อย — หางานใหม่', root, 660, 450, '#dde5ff'); jobs.W.onClose = () => { jobs.W = null; }; jobs.W.body.style.overflow = 'hidden';
  const q = root.querySelector('.hdr input'); q.addEventListener('input', () => { jobs.q = q.value.trim(); jobs.view = null; renderJobs(); });
  root.addEventListener('click', jobsClick); renderJobs();
  return jobs.W;
}
function renderJobs() {
  if (!jobs.W) return; const root = jobs.W.body.firstChild, box = root.querySelector('.lst2');
  root.querySelectorAll('.flt [data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === jobs.f));
  if (jobs.view) {
    const j = JOBS.find(x => x.id === jobs.view), resumes = FILES.filter(f => f.kind === 'resume' && f.loc !== 'trash'), ap = jobs.applied.has(j.id);
    box.innerHTML = `<p style="margin:0"><a data-jback style="color:#3b5bdb;cursor:pointer">← กลับไปรายการงาน</a></p><div class="jd"><div class="job" style="border:0;padding:0;cursor:default"><div class="lg" style="--c:${j.c}">${j.e}</div><div><h4>${esc(j.pos)}</h4>${esc(j.co)}</div></div>
      <div><span class="sal">฿${baht(j.min)} – ${baht(j.max)}</span> ต่อเดือน · 📍 ${esc(j.where)}</div>
      ${ap ? '<b style="color:#2f9d5a">✓ ส่งใบสมัครแล้ว รอบริษัทติดต่อกลับทางแชท</b>' : resumes.length ? `<label>แนบเรซูเม่<select>${resumes.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></label><button class="btn2 pri" data-apply="${j.id}" style="align-self:flex-start">📨 ส่งใบสมัคร</button>` : `<div style="background:#fff6e0;border-radius:10px;padding:8px 10px">ต้องแนบเรซูเม่เป็นไฟล์ PDF ก่อนนะ เปิดแคนวาน้อย แก้เรซูเม่ แล้วกด "ส่งออก PDF"</div><button class="btn2 pri" data-opendz style="align-self:flex-start">🎨 เปิดแคนวาน้อย</button>`}
      <hr style="border:0;border-top:1px solid #eef"><div>${esc(j.desc)}</div>
      <b style="font-weight:500">คุณสมบัติ</b><ul style="margin:0;padding-left:1.2em">${j.need.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b style="font-weight:500">สวัสดิการ</b><ul style="margin:0;padding-left:1.2em">${j.perks.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
</div>`;
    return;
  }
  const q = jobs.q, list = JOBS.filter(j => (jobs.f === 'all' || (jobs.f === '30k' ? j.min >= 30000 : j.tags.includes(jobs.f))) && (!q || [j.pos, j.co, j.where, ...j.tags].some(x => x.includes(q))));
  box.innerHTML = `<p style="margin:0;color:var(--soft);font-size:12px">พบ ${list.length} ตำแหน่ง · เว็บหางานในเกม</p>` + (list.map(j => `<div class="job" data-job="${j.id}"><div class="lg" style="--c:${j.c}">${j.e}</div><div style="flex:1;min-width:0"><h4>${esc(j.pos)}${jobs.applied.has(j.id) ? '<span class="tag2">สมัครแล้ว</span>' : ''}</h4><div>${esc(j.co)} · 📍 ${esc(j.where)}</div><span class="sal">฿${baht(j.min)} – ${baht(j.max)}</span></div></div>`).join('') || '<p>ไม่พบงานที่ตรงกัน ลองคำอื่นนะ</p>');
}
function jobsClick(e) {
  const t = e.target, fb = t.closest('.flt [data-f]'); if (fb) { jobs.f = fb.dataset.f; jobs.view = null; renderJobs(); return; }
  const jb = t.closest('[data-job]'); if (jb) { jobs.view = jb.dataset.job; renderJobs(); jobs.W.body.querySelector('.lst2').scrollTop = 0; return; }
  if (t.closest('[data-jback]')) { jobs.view = null; renderJobs(); return; }
  if (t.closest('[data-opendz]')) { openDesign(FILES.find(f => f.id === 'cv')); return; }
  const ap = t.closest('[data-apply]'); if (ap) { const j = JOBS.find(x => x.id === ap.dataset.apply), rf = FILES.find(f => f.id === jobs.W.body.querySelector('.jd select').value); applyJob(j, rf); }
}
function applyJob(j, rf) {
  jobs.applied.add(j.id); renderJobs(); S.jingle(); S.toast(`ส่งใบสมัคร ${j.pos} พร้อม ${rf.name} แล้ว`, 2.4); complete('apply');
  const pid = 'co-' + j.id; PEOPLE[pid] = { n: 'HR ' + j.co, c: j.c, e: j.e };
  if (!chatById(pid)) chat.list.unshift({ id: pid, n: j.co, members: [pid], unread: 0, msgs: [] });
  pushMsg(pid, pid, `สวัสดีค่ะ ได้รับใบสมัครตำแหน่ง${j.pos}แล้วนะคะ เรซูเม่สวยมาก 😊 สะดวกมาสัมภาษณ์วันจันทร์ 10:00 น. ไหมคะ`, 6000);
  pushMsg('gang', 'fon', 'ได้ข่าวว่าแกไปสมัครงานที่ใหม่เหรอ 👀 อย่าทิ้งกันน้า', 11000);
  const mon = new Date(dayStart(gnow()) + DAY + 3 * 3600000); while (mon.getDay() !== 1) mon.setDate(mon.getDate() + 1);
  addEvent(mon, '🤝', 'สัมภาษณ์งาน ' + j.co, 'interview', { a: j.id }); renderCal();
  mailPush(null, 'HR ' + j.co, `ได้รับใบสมัครตำแหน่ง ${j.pos} แล้ว`, `<p>เรียนผู้สมัคร</p><p>ทาง ${esc(j.co)} ได้รับใบสมัครและเรซูเม่ (${esc(rf.name)}) ของคุณแล้ว กำลังพิจารณาคุณสมบัติ จะติดต่อกลับภายใน 3 วันทำการ</p><p>ขอบคุณที่สนใจร่วมงานกับเรา ${j.e}</p>`, 'job');
  mailPush(null, 'HR ' + j.co, `นัดสัมภาษณ์งาน ${j.pos}`, `<p>ยินดีด้วย! คุณผ่านการคัดเลือกเบื้องต้น</p><p>ขอนัดสัมภาษณ์ <b>${thDate(mon.getTime(), { weekday: 'long', day: 'numeric', month: 'long' })} เวลา 10:00 น.</b> ที่ ${esc(j.where)}</p><p>โปรดเตรียมเอกสารประกอบการสมัครมาด้วย</p>`, 'job');
  renderChat();
}

/* ================= mini games ================= */
const gm = { W: null, mode: null, best: { whack: 0, mem: 0, typeth: 0, typeen: 0, sudoku: 0, cards: 1000 } };
function openGames() {
  if (gm.W && wins.has('game')) { focusWin(gm.W); return gm.W; }
  gm.W = openWin('game', 'เกมน้อย', h('div', { class: 'gm' }), 580, 500, '#ffe8f0'); gm.W.onClose = () => { gm.W = null; gm.mode = null; };
  gm.W.body.style.overflow = 'hidden'; gm.W.body.style.containerType = 'inline-size';
  const box = gm.W.body.firstChild; box.addEventListener('click', gameClick); box.addEventListener('pointerdown', gameDown); box.addEventListener('input', e => g2Input(e)); box.addEventListener('keydown', e => g2Key(e));
  gameMenu(); return gm.W;
}
function gameMenu() {
  gm.mode = null;
  gm.W.body.firstChild.innerHTML = `<div class="menu2"><button data-g="whack"><span>🔨</span><b>ทุบตุ่น</b><small>30 วินาที · สถิติ ${gm.best.whack} แต้ม</small></button><button data-g="mem"><span>🃏</span><b>จับคู่การ์ด</b><small>${gm.best.mem ? 'ดีที่สุด ' + gm.best.mem + ' ครั้ง' : 'ยังไม่เคยเล่น'}</small></button><button data-g="card"><span>♠️</span><b>ป๊อกเด้ง</b><small>แต้มสูงสุด ${gm.best.cards}</small></button><button data-g="sudoku"><span>🔢</span><b>ซูโดกุ</b><small>${gm.best.sudoku ? 'เร็วสุด ' + fmtSec(gm.best.sudoku) : 'ยังไม่เคยชนะ'}</small></button><button data-g="typeth"><span>⌨️</span><b>พิมพ์เร็วไทย</b><small>${gm.best.typeth ? 'สถิติ ' + gm.best.typeth + ' ตัว/นาที' : 'แข่งกับเพื่อนร่วมงาน'}</small></button><button data-g="typeen"><span>🔤</span><b>Typing English</b><small>${gm.best.typeen ? 'best ' + gm.best.typeen + ' cpm' : 'แข่งกับเพื่อนร่วมงาน'}</small></button></div>`;
}
function startWhack() {
  gm.mode = 'whack'; gm.score = 0; gm.t0 = performance.now(); gm.next = 0; gm.holes = Array.from({ length: 9 }, () => ({ up: 0, until: 0, k: '🐹', hit: 0 }));
  gm.W.body.firstChild.innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>ทุบ 🐹 +1 · อย่าทุบแมว 🐱 −3</span><b class="sc">0 แต้ม · 30 วิ</b></div><div class="holes">${gm.holes.map((_, i) => `<button class="hole" data-h="${i}" aria-label="หลุม ${i + 1}"><span>🐹</span></button>`).join('')}</div>`;
}
function updateGame(now) {
  if (gm.W && (gm.mode === 'type' || gm.mode === 'sudoku')) { g2Tick(now); return; }
  if (!gm.W || gm.mode !== 'whack') return;
  const left = 30 - (now - gm.t0) / 1000, box = gm.W.body.firstChild; if (left <= 0) { endWhack(); return; }
  const lvl = 30 - left;
  if (now > gm.next) {
    const free = gm.holes.map((x, i) => i).filter(i => !gm.holes[i].up), i = pick(free);
    if (i !== undefined) Object.assign(gm.holes[i], { up: 1, hit: 0, k: Math.random() < .18 ? '🐱' : '🐹', until: now + 900 + Math.random() * 400 - lvl * 12 });
    gm.next = now + 520 + Math.random() * 360 - lvl * 7;
  }
  gm.holes.forEach((x, i) => {
    if (x.up && now > x.until) x.up = 0;
    const el = box.querySelector(`[data-h="${i}"]`); if (!el) return;
    el.classList.toggle('up', !!x.up); el.classList.toggle('hit', !!x.hit); if (el.firstChild.textContent !== x.k) el.firstChild.textContent = x.k;
  });
  box.querySelector('.sc').textContent = `${gm.score} แต้ม · ${Math.ceil(left)} วิ`;
}
function gameDown(e) {
  if (gm.mode !== 'whack') return; const ho = e.target.closest('.hole'); if (!ho) return;
  const x = gm.holes[+ho.dataset.h]; if (!x.up || x.hit) return;
  x.hit = 1; x.until = performance.now() + 220;
  if (x.k === '🐱') { gm.score = Math.max(0, gm.score - 3); S.tone(300, 180, .15, .08); S.toast('อุ๊ย ทุบโดนแมว! −3', 1); }
  else { gm.score++; S.tone(900, 500, .07, .09, 'square'); S.vib(15); }
}
function endWhack() {
  const s = gm.score; gm.mode = 'over'; gm.best.whack = Math.max(gm.best.whack, s); if (s >= 15) complete('game');
  gm.W.body.firstChild.innerHTML = `<div class="menu2" style="flex-direction:column;gap:8px"><div style="font-size:52px">${s >= 15 ? '🏆' : '🔨'}</div><b style="font-size:22px">ได้ ${s} แต้ม</b><span>${s >= 15 ? 'เก่งมาก!' : 'ลองอีกที ต้องได้ 15 แต้มนะ'}</span><div style="display:flex;gap:8px"><button data-g="whack" style="min-width:auto;padding:8px 16px">เล่นอีก</button><button data-g="menu" style="min-width:auto;padding:8px 16px">เมนู</button></div></div>`;
  S.jingle();
  if (s > 30) pushMsg('bro', 'bro', `เฮ้ย ${s} แต้ม! ชนะพี่ได้ไง 😱`, 2500);
  else if (!broTold && s > 0) { broTold = true; pushMsg('bro', 'bro', `เห็นนะ ได้ ${s} แต้มเอง พี่ได้ 30 😎`, 2500); }
}
function startMem() {
  const em = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐥', '🐸', '🐙'];
  gm.mode = 'mem'; gm.cards = [...em, ...em].map(e => ({ e, st: 0 })).sort(() => Math.random() - .5); gm.open = []; gm.moves = 0; gm.lock = false; renderMem();
}
function renderMem() {
  gm.W.body.firstChild.innerHTML = `<div class="bar2"><button class="btn2" data-g="menu">← เมนู</button><span>เปิดทีละ 2 ใบ หาคู่ให้ครบ</span><b>${gm.moves} ครั้ง</b></div><div class="cards">${gm.cards.map((c, i) => `<button class="card2 ${c.st === 1 ? 'op' : c.st === 2 ? 'ok' : ''}" data-c2="${i}">${c.st ? c.e : '?'}</button>`).join('')}</div>`;
}
function gameClick(e) {
  if (g2Click(e)) return;
  const b = e.target.closest('[data-g]'); if (b) { ({ whack: startWhack, mem: startMem, menu: gameMenu })[b.dataset.g](); S.tone(700, 900, .05, .05); return; }
  const cb = e.target.closest('[data-c2]'); if (!cb || gm.mode !== 'mem' || gm.lock) return;
  const card = gm.cards[+cb.dataset.c2]; if (card.st) return;
  card.st = 1; gm.open.push(card); S.tone(800, 900, .04, .05);
  if (gm.open.length === 2) {
    gm.moves++; const [a, c2] = gm.open;
    if (a.e === c2.e) { a.st = c2.st = 2; gm.open = []; S.tone(900, 1300, .1, .08, 'triangle'); if (gm.cards.every(x => x.st === 2)) setTimeout(endMem, 450); }
    else { gm.lock = true; setTimeout(() => { a.st = c2.st = 0; gm.open = []; gm.lock = false; if (gm.mode === 'mem' && gm.W) renderMem(); }, 750); }
  }
  renderMem();
}
function endMem() {
  if (!gm.W) return; gm.best.mem = gm.best.mem ? Math.min(gm.best.mem, gm.moves) : gm.moves; gm.mode = 'over'; complete('game'); S.jingle();
  gm.W.body.firstChild.innerHTML = `<div class="menu2" style="flex-direction:column;gap:8px"><div style="font-size:52px">🎉</div><b style="font-size:22px">จับคู่ครบแล้ว!</b><span>ใช้ไป ${gm.moves} ครั้ง</span><div style="display:flex;gap:8px"><button data-g="mem" style="min-width:auto;padding:8px 16px">เล่นอีก</button><button data-g="menu" style="min-width:auto;padding:8px 16px">เมนู</button></div></div>`;
}
