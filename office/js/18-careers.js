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
  const OLD = ['r1', 'r2', 'r3', 'p1', 'p2', 'x1', 'd1', 'x2', 'tpl1', 'tpl2'];
  FILES.forEach(f => { if (!OLD.includes(f.id)) return; if (career.id === 'acct') { if (f.locKeep) { f.loc = f.locKeep; delete f.locKeep; } } else if (!f.locKeep) { f.locKeep = f.loc; f.loc = 'career-hidden'; } });
  FILES.filter(f => f.careerFile && f.careerFile !== career.id).forEach(f => { f.loc = 'career-hidden'; });
  FILES.filter(f => f.careerFile === career.id && f.loc === 'career-hidden').forEach(f => { f.loc = 'desk'; });
  try { syncApps(); handbookFile(); renderDesktop(); renderTasks(); renderChat(); syncTaskbar(); careerChip(); renderCareerWin(); } catch (e) { console.error(e); }
}
function handbookFile() {
  const C = careerOf(), id = 'handbook-' + career.id;
  FILES.filter(f => f.handbook && f.id !== id).forEach(f => { f.loc = 'career-hidden'; });
  let f = FILES.find(x => x.id === id);
  const steps = (C.tasks || (career.id === 'acct' ? TASKS0 : [])).filter(t => !t.me).map((t, i) => `<li>${esc(t.t)}</li>`).join('');
  const body = `<h2 style="text-align:center;margin:0 0 4px">📘 คู่มือการทำงาน</h2><p style="text-align:center;margin:0 0 10px">${esc(C.pos || C.label)} · ${esc(C.co)}</p><h3>ภาพรวมงาน</h3><p>${esc(C.desc || 'ทำบัญชีให้ลูกค้า บันทึกเอกสารและส่งงานให้หัวหน้า')}</p><h3>ขั้นตอนที่ต้องทำ</h3><ol>${steps}</ol><h3>กฎและวิธีทำงาน</h3>${C.book}${C.contacts ? `<h3>ติดต่อใครได้บ้าง (อีเมล)</h3><table class="pdft">${C.contacts.map(c => `<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td></tr>`).join('')}</table><p><small>ต้องพิมพ์อีเมลผู้รับเองในเมลน้อย (ไม่มีสมุดที่อยู่)</small></p>` : ''}`;
  const html = `<div class="scanv"><div class="pdfpage">${body}</div></div>`;
  if (!f) { f = { id, name: `คู่มือการทำงาน-${C.label}.pdf`, type: 'pdf', kind: 'pdfdoc', loc: 'desk', handbook: 1 }; FILES.push(f); }
  f.html = html; f.body = body; f.name = `คู่มือการทำงาน-${C.label}.pdf`; if (f.loc === 'career-hidden') f.loc = 'desk';
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
const CAREER_APPS = {}, APPS0 = APPS.slice(), GENERAL_APPS = [];
function tbButton(app, emoji, name, color, forCareer, fn) {
  if (forCareer) { CAREER_APPS['app-' + app] = { career: forCareer, fn, a: { id: 'app-' + app, n: name, e: emoji, c: color } }; return; }
  const b = h('button', { 'data-app': app, title: name, class: forCareer ? 'cb cb-' + forCareer : 'cb' }, `<i class="ab" style="--c:${color}">${emoji}</i><span class="lb">${name}</span>`);
  $('taskbar').insertBefore(b, $('clock')); b.addEventListener('click', fn); return b;
}
function syncApps() {
  const keep = APPS0.filter(a => a.id !== 'app-food' && (career.id === 'acct' || a.id !== 'app-work'));
  const mine = Object.values(CAREER_APPS).filter(x => x.career === career.id).map(x => x.a);
  const next = [...keep, ...GENERAL_APPS, ...mine], ids = new Set(next.map(a => a.id));
  Object.keys(deskPos).filter(k => k.startsWith('app-') && !ids.has(k)).forEach(k => delete deskPos[k]);
  APPS.length = 0; APPS.push(...next);
}
const _openItem = openItem;
openItem = id => { const c = CAREER_APPS[id]; if (c) return c.fn(); const g = GENERAL_APPS.find(a => a.id === id); if (g && g.fn) return g.fn(); return _openItem(id); };
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
react = function (c, m) {
  const C = careerOf();
  if (career.id !== 'acct' && c.id === 'boss' && C.boss) { C.boss(c, m); return; }
  if (career.id !== 'acct' && c.id === 'cust' && C.cust) { C.cust(c, m); return; }
  if (career.id !== 'acct' && ['gang', 'bear', 'bun', 'duck', 'g'].includes(c.id) && C.chat) { if (C.chat(c, m) !== false) return; }
  _react(c, m);
};
/* emails sent to the addresses of this job (see "คู่มือการทำงาน" PDF) */
const _mailRoute = mailRoute;
mailRoute = function (m) {
  const C = careerOf(), r = (C.routes || []).find(x => x.addr === m.to);
  if (career.id === 'acct' || !r) return _mailRoute(m);
  const me = mail.accounts[0].email, txt = r.reply(m) || '';
  mailPush(me, r.from, 'Re: ' + m.subj, `<p>${esc(txt)}</p>`, 'work', gnow().getTime() + (10 + Math.random() * 15) * 60000);
  r.onSend?.(m); setTimeout(() => S.toast('📬 ส่งแล้ว รอผู้รับตอบกลับสักครู่', 2.2), 900);
};
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
