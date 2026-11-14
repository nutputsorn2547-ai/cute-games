"use strict";
// Office game (beta) — careers: change jobs and the work changes with it (cafe / customer service / tax).
// Loaded after the other game files and before 17-main.js. It hooks into them instead of editing them.
const career = { id: 'acct', day: 1, offers: [], cafe: {}, cs: {}, tax: {}, au: {}, lg: {} };
const P0 = JSON.parse(JSON.stringify(PEOPLE)), CHAT0 = Object.fromEntries(chat.list.map(c => [c.id, c.n])), TASKS0 = TASKS.slice(), SUP0 = SUPPLIERS.slice();
const KEEP_TASKS = new Set(['eat', 'call']); // generic life tasks that stay in every job
const CAREERS = {
  acct: {
    label: 'นักบัญชี', co: 'ทีมบัญชีน่ารัก', e: '📒', salary: 25000, people: {}, titles: {}, hide: [], docs: true, apps: [], client: 'ร้านขนมอร่อย (ลูกค้าของเรา)',
    book: '<p>งานเดิมของคุณ: บันทึกเอกสารลูกค้า ทำไฟล์ให้หัวหน้า ดูงานในรายการด้านขวาได้เลย</p>',
  },
};
const CAREER_ORDER = ['acct', 'cafe', 'cs', 'tax', 'au', 'lg'];
const careerOf = () => CAREERS[career.id] || CAREERS.acct;
const _complete = complete; // ignore task ids that are not in the current job's list (no stray "done" counts)
complete = id => { if (TASKS.some(t => t.id === id)) _complete(id); };

function applyCareer(id) {
  const C = CAREERS[id] || CAREERS.acct; career.id = CAREERS[id] ? id : 'acct';
  document.body.dataset.career = career.id;
  for (const k in P0) PEOPLE[k] = { ...P0[k], ...(C.people[k] || {}) };
  chat.list.forEach(c => { if (c.id in CHAT0) { c.n = C.titles[c.id] || CHAT0[c.id]; c.hidden = C.hide.includes(c.id) || (career.id !== 'acct' && ['jib','fin','sup'].includes(c.id)); } });
  const personal = TASKS0.filter(t => t.me), generic = TASKS0.filter(t => KEEP_TASKS.has(t.id));
  const next = career.id === 'acct' ? TASKS0 : [...C.tasks, ...generic, ...personal];
  TASKS.length = 0; TASKS.push(...next);
  SUPPLIERS.length = 0; SUPPLIERS.push(...(C.suppliers || SUP0));
  try { renderTasks(); renderChat(); syncTaskbar(); careerChip(); renderCareerWin(); } catch (e) {}
}
function switchCareer(id, quiet) {
  const C = CAREERS[id]; if (!C) return;
  applyCareer(id); career.day = unlockedDay;
  hr.base = C.salary; hr.pending = 0; hr.done = false; hr.cap = 10;
  C.start?.(); try { careerChip(); renderCareerWin(); } catch (e) {}
  if (!quiet) { S.big(`${C.e} เริ่มงานใหม่: ${C.pos || C.label}`, 3, C.color || '#5a78e6'); S.jingle(); }
  try { saveGame(); } catch (e) {}
}
// hr + money: the first salary of a new job is paid on the usual 25th

/* ---- pieces of UI: header chip, taskbar buttons, "my job" window ---- */
function careerChip() {
  let el = $('careerChip'); const C = careerOf();
  if (!el) { el = h('div', { id: 'careerChip' }); $('tasks').prepend(el); el.addEventListener('click', () => openCareerWin()); }
  el.innerHTML = `<b>${C.e} ${esc(C.pos || C.label)}</b><small>${esc(C.co)} · เงินเดือน ${baht(hr.base)}</small>`;
}
function tbButton(app, emoji, name, color, forCareer, fn) {
  const b = h('button', { 'data-app': app, title: name, class: forCareer ? 'cb cb-' + forCareer : 'cb' }, `<i class="ab" style="--c:${color}">${emoji}</i><span class="lb">${name}</span>`);
  $('taskbar').insertBefore(b, $('clock')); b.addEventListener('click', fn); return b;
}
tbButton('career', '🏢', 'งานของฉัน', '#7c5cff', '', () => openCareerWin());
let careerWin = null;
function openCareerWin() {
  if (careerWin && wins.has('career')) { focusWin(careerWin); return careerWin; }
  careerWin = openWin('career', 'งานของฉัน — ที่ทำงานและกฎการทำงาน', h('div', { class: 'cr' }), 600, 460, '#e9e2ff'); careerWin.onClose = () => { careerWin = null; };
  careerWin.body.firstChild.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    if (b.dataset.go === career.id) return;
    dialog(careerWin, `ย้ายไปทำงาน <b>${esc(CAREERS[b.dataset.go].co)}</b> เลยไหม? (โหมดทดสอบ: ข้ามขั้นตอนสมัครงาน งานของที่เก่าจะถูกเปลี่ยนเป็นของที่ใหม่)`, [['ยกเลิก', null], ['ย้ายเลย', 'ok', 'pri']]).then(({ v }) => { if (v === 'ok') switchCareer(b.dataset.go); });
  });
  renderCareerWin(); return careerWin;
}
function renderCareerWin() {
  if (!careerWin || !wins.has('career')) return; const C = careerOf(), box = careerWin.body.firstChild;
  const team = ['boss', 'bear', 'bun', 'duck', 'cust'].filter(k => !(C.hide || []).includes(k)).map(k => `<span class="tm" style="--c:${PEOPLE[k].c}">${PEOPLE[k].e} ${esc(PEOPLE[k].n)}</span>`).join('');
  box.innerHTML = `<div class="crh" style="--c:${C.color || '#dde5ff'}"><div class="big">${C.e}</div><div><b>${esc(C.pos || C.label)}</b><br>${esc(C.co)}<br><small>เงินเดือน ${baht(hr.base)} บาท · เริ่มงานวันที่ ${career.day}</small></div></div>
    <h4>ทีมของคุณ</h4><div class="tms">${team}</div><h4>กฎและวิธีทำงาน</h4><div class="bk">${C.book}</div>
    <h4>🧪 โหมดทดสอบ: ลองสายงานอื่น</h4><div class="go">${CAREER_ORDER.filter(k => CAREERS[k]).map(k => `<button class="btn2 ${k === career.id ? 'pri' : ''}" data-go="${k}">${CAREERS[k].e} ${esc(CAREERS[k].label)}</button>`).join('')}</div>`;
}

/* ---- job site: new jobs, offer after applying, "accept" button ---- */
function addCareerJobs() {
  const mk = (id, k, extra) => JOBS.push({ id, career: k, co: CAREERS[k].co, e: CAREERS[k].e, c: CAREERS[k].color || '#eee', pos: CAREERS[k].pos, min: CAREERS[k].salary, max: CAREERS[k].salary + 4000, where: CAREERS[k].where, tags: CAREERS[k].tags, desc: CAREERS[k].desc, need: CAREERS[k].need, perks: CAREERS[k].perks, ...extra });
  ['cafe', 'cs', 'tax', 'au', 'lg'].filter(k => CAREERS[k]).forEach(k => mk('jc-' + k, k));
}
const _applyJob = applyJob;
applyJob = function (j, rf) {
  _applyJob(j, rf);
  if (!j.career) return;
  setTimeout(() => {
    if (!career.offers.includes(j.id)) career.offers.push(j.id);
    pushMsg('co-' + j.id, 'co-' + j.id, `ยินดีด้วยค่ะ 🎉 ${j.co} ขอเสนอตำแหน่ง ${j.pos} เงินเดือน ${baht(j.min)} บาทค่ะ ถ้าตกลง กด "ตอบรับข้อเสนอ" ในจ๊อบน้อยได้เลยนะคะ`, 500);
    mailPush(null, 'HR ' + j.co, `ข้อเสนองาน: ${j.pos}`, `<p>เรียนผู้สมัคร</p><p>${esc(j.co)} ยินดีเสนอตำแหน่ง <b>${esc(j.pos)}</b> เงินเดือน <b>${baht(j.min)} บาท</b> กรุณาตอบรับในแอปจ๊อบน้อย</p>`, 'news');
    S.toast(`📨 ${j.co} ส่งข้อเสนองานมาแล้ว`, 2.6); try { renderJobs(); } catch (e) {}
  }, 9000);
};
const _renderJobs = renderJobs;
renderJobs = function () {
  _renderJobs();
  if (!jobs.W || !jobs.view) return; const j = JOBS.find(x => x.id === jobs.view); if (!j || !j.career) return;
  const jd = jobs.W.body.querySelector('.jd'); if (!jd || jd.querySelector('[data-career-go]')) return;
  const offered = career.offers.includes(j.id), here = career.id === j.career;
  jd.insertAdjacentHTML('afterbegin', here ? '<b style="color:#2f9d5a">✓ คุณทำงานที่นี่อยู่</b>' : offered ? `<button class="btn2 pri" data-career-go="${j.id}" style="align-self:flex-start">✅ ตอบรับข้อเสนอ ย้ายไปทำงานที่นี่</button>` : '');
};
const _jobsClick = jobsClick;
jobsClick = function (e) {
  const g = e.target.closest('[data-career-go]');
  if (g) { const j = JOBS.find(x => x.id === g.dataset.careerGo); dialog(jobs.W, `ตอบรับตำแหน่ง <b>${esc(j.pos)}</b> ที่ ${esc(j.co)} และลาออกจากงานเดิม?`, [['คิดดูก่อน', null], ['ตอบรับ', 'ok', 'pri']]).then(({ v }) => { if (v === 'ok') { switchCareer(j.career); renderJobs(); } }); return; }
  _jobsClick(e);
};

/* ---- the boss answers differently in each job ---- */
const _react = react;
react = function (c, m) { if (career.id !== 'acct' && c.id === 'boss' && careerOf().boss) { careerOf().boss(c, m); return; } _react(c, m); };
const _dailyDocs = dailyDocs; dailyDocs = day => { if (careerOf().docs) _dailyDocs(day); };
const _cdocHTML = cdocHTML; cdocHTML = d => _cdocHTML(d).replace('ร้านขนมอร่อย (ลูกค้าของเรา)', esc(careerOf().client));

/* ---- save / load ---- */
const _snapshot = snapshot; snapshot = () => ({ ..._snapshot(), career: JSON.parse(JSON.stringify(career)) });
const _loadGame = loadGame;
loadGame = function () {
  const ok = _loadGame();
  if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.career) Object.assign(career, s.career); } catch (e) {} }
  applyCareer(career.id); CAREERS[career.id].resume?.(); return ok;
};
setTimeout(() => { addCareerJobs(); careerChip(); }, 0);
