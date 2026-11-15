"use strict";
// office-beta: เสี่ยงโดนไล่ออก → ตกงาน (คอมที่บ้าน บรรยากาศมืด) · โอกาสสมัครงานไม่ 100% · ป๊อปอัพเงินเหลือ 1,000 · แอปหุ้น · แอปหวย
const jl = { heat: 0, day: 0, lastCnt: null, doneBase: 0, late: {}, warn: 0, lowArm: true, lowAt: 0, modal: false, take: null, why: '', missToday: 0, px: {}, port: {}, news: [], tix: [], hist: [], won: 0 };
const fm2 = v => v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- small modal (works with no window open) ---------- */
function jlModal(html, btns, cls) {
  return new Promise(res => {
    const el = h('div', { class: 'jlm ' + (cls || '') }, `<div class="jlc">${html}<div class="jlb">${btns.map(([t, v, c], i) => `<button class="btn2 ${c || ''}" data-i="${i}">${t}</button>`).join('')}</div></div>`);
    document.body.append(el); jl.modal = true;
    el.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; el.remove(); jl.modal = false; res(btns[+b.dataset.i][1]); });
  });
}

/* ---------- the "jobless" career: only home-PC apps ---------- */
CAREERS.jl = {
  label: 'ตกงาน', co: 'อยู่บ้าน', e: '🏚️', salary: 0, color: '#2b2f4a', pos: 'ว่างงาน (กำลังหางาน)', people: {}, titles: {}, hide: ['boss', 'bear', 'bun', 'duck', 'cust', 'hr', 'g'], docs: false, apps: [], client: '', where: '', tags: [],
  desc: 'ตกงาน นั่งหางานใหม่ที่บ้านด้วยคอมส่วนตัว ประหยัดเงินและอย่าให้เงินหมด',
  book: '<p>คุณตกงานแล้ว ตอนนี้ใช้คอมที่บ้าน มีแค่แอปที่จำเป็น</p><ul><li>อัปเดตเรซูเม่ในแคนวาน้อย แล้วสมัครงานในจ๊อบน้อย</li><li>เงินเดือนยิ่งสูง โอกาสได้งานยิ่งต่ำ</li><li>เงินเหลือน้อยให้ขอยืมคนรู้จักหรือกู้เงินด่วน</li><li>หุ้นกับหวยเป็นเกมจำลอง เสี่ยงเอง</li></ul>',
  tasks: [{ id: 'jl_apply', t: 'สมัครงานใหม่ในจ๊อบน้อย (เงินเดือนสูง = โอกาสติดต่ำ)' }, { id: 'jl_offer', t: 'ได้ข้อเสนองาน แล้วกด “ตอบรับ” ในจ๊อบน้อย' }],
};
const JL_APPS = new Set(['app-design', 'app-jobs', 'app-excel', 'app-word', 'app-slack', 'app-calc', 'app-bank', 'app-cal', 'app-stock', 'app-lotto']);
const _sync = syncApps; syncApps = function () { _sync(); if (career.id === 'jl') { const k = APPS.filter(a => JL_APPS.has(a.id)); APPS.length = 0; APPS.push(...k); } const ids = new Set(APPS.map(a => a.id)); Object.keys(deskPos).filter(x => x.startsWith('app-') && !ids.has(x)).forEach(x => delete deskPos[x]); };
function jlTheme() {  let v = $('jlVeil'); if (career.id === 'jl') { if (!v) { v = h('div', { id: 'jlVeil' }); $('screen').append(v); } } else if (v) v.remove(); }
const _ac = applyCareer; applyCareer = function (id) { _ac(id); if (career.id === 'jl') { const k = TASKS.filter(t => !['hr', 'call'].includes(t.id)); TASKS.length = 0; TASKS.push(...k); try { renderTasks(); } catch (e) {} } jlTheme(); };
const _sw = switchCareer;
switchCareer = function (id, q) {
  _sw(id, q);
  if (id !== 'jl') { jl.heat = 0; jl.warn = 0; jl.late = {}; jl.doneBase = done.size; if (jl.take && jl.take.career === id) { hr.base = jl.take.sal; } jl.take = null; try { careerChip(); } catch (e) {} }
};
const _salary = salaryDay; salaryDay = function () { if (career.id === 'jl') return; _salary(); };
const _ring = ring; ring = function () { if (career.id === 'jl') { call.next = gnow().getTime() + 5 * 3600000; return; } _ring(); };

/* ---------- getting fired ---------- */
function jlWarn(n) {
  const b = n === 1 ? ['นี่เป็นการเตือนครั้งที่ 1 นะ ช่วงนี้งานพลาด/ล่าช้าเยอะเกินไป ปรับปรุงด่วน 😾', 'หนังสือเตือนครั้งที่ 1'] : ['เตือนครั้งสุดท้ายแล้วนะ ถ้ายังเป็นแบบนี้ ต้องคุยเรื่องเลิกจ้างจริงๆ 😡', 'หนังสือเตือนครั้งสุดท้าย'];
  pushMsg('boss', 'boss', b[0], 800); mailPush(null, 'ฝ่ายบุคคล', b[1], `<p>เรียนพนักงาน</p><p>${esc(b[0])}</p><p>สาเหตุที่พบ: ${esc(jl.why || 'ผลงานต่ำกว่าเกณฑ์')}</p>`, 'work');
  S.big(n === 1 ? '⚠️ โดนเตือนครั้งที่ 1' : '🚨 เตือนครั้งสุดท้าย!', 2.6, '#e5536f'); S.tone(300, 200, .3, .08, 'sawtooth');
}
function jlFired(why) {
  if (career.id === 'jl' || jl.firing) return; jl.firing = true;
  const from = careerOf(), sev = Math.round(hr.base * .5 / 10) * 10;
  [...wins.keys()].forEach(k => { try { closeWin(k, true); } catch (e) {} }); try { closePhone(); } catch (e) {} try { closeOverlay(); } catch (e) {}
  life.music = null; life.play = null; try { musicStopAll(); } catch (e) {}
  switchCareer('jl', true); hr.base = 0; hr.pending = 0; jl.heat = 0; jl.warn = 0; jl.lowArm = true; jl.lowAt = 0;
  if (sev > 0) bankTx('💼 เงินเดือนงวดสุดท้าย (ค้างจ่ายครึ่งเดือน)', sev); try { renderBank(); careerChip(); } catch (e) {}
  mailPush(null, 'ฝ่ายบุคคล ' + from.co, 'หนังสือเลิกจ้าง', `<p>เรียนพนักงาน</p><p>บริษัทขอเลิกจ้างคุณมีผลทันที เหตุผล: ${esc(why)}</p><p>บริษัทโอนเงินเดือนงวดสุดท้ายให้ ${baht(sev)} บาท</p>`, 'work');
  jlModal(`<div class="jlbig">📄</div><h2>คุณถูกเลิกจ้าง</h2><p>เหตุผล: ${esc(why)}</p><p>ตั้งแต่วันนี้คุณนั่งทำงานที่บ้านด้วยคอมส่วนตัว<br>ได้เงินเดือนงวดสุดท้าย ${baht(sev)} บาท<br><b>รีบอัปเดตเรซูเม่แล้วหางานใหม่ในจ๊อบน้อย!</b></p>`, [['รับทราบ…', 'ok', 'pri']], 'dark').then(() => { jl.firing = false; S.tone(220, 120, .6, .08, 'sawtooth'); });
}
function jlDaily(d) {
  if (career.id === 'jl' || unlockedDay < 3) { jl.doneBase = done.size; return; }
  const wd = new Date(d - 12 * 3600000).getDay(), work = wd >= 1 && wd <= 5, prog = done.size - jl.doneBase, all = TASKS.every(t => done.has(t.id));
  if (work && !all && prog === 0) { jl.heat += 12; jl.why = 'ไม่มีผลงานเลยในวันทำงาน'; }
  else if (work && !jl.missToday) jl.heat -= 8;
  jl.missToday = 0; jl.doneBase = done.size;
}
let jlLastHeat = -1;
function jlTick() {
  if (lk.on) return; const t = dayStart(gnow()); if (!jl.day) jl.day = t;
  for (let i = 0; jl.day < t && i < 40; i++) { jl.day = dayStart(jl.day + DAY + 3 * 3600000); jlDaily(jl.day); }
  const nowT = gnow().getTime(); [...new Set(jl.tix.filter(x => nowT >= x.d + 15 * 3600000).map(x => x.d))].sort().forEach(d => { try { lottoDraw(d); } catch (e) { console.error(e); } });
  if (career.id === 'jl') { jlLow(); return; }
  const cnt = (perf.callMiss || 0) + (perf.mailMiss || 0) + (career[career.id]?.wrong || 0) + (career.tax?.late || 0);
  if (jl.lastCnt === null) jl.lastCnt = cnt; if (cnt > jl.lastCnt) { jl.heat += 14 * (cnt - jl.lastCnt); jl.missToday += cnt - jl.lastCnt; jl.why = 'รับสาย/ตอบอีเมลสำคัญพลาดหลายครั้ง'; } jl.lastCnt = cnt;
  if (unlockedDay >= 3) TASKS.filter(x => x.due && x.due < unlockedDay && !done.has(x.id) && !jl.late[x.id]).forEach(x => { jl.late[x.id] = 1; jl.heat += 10; jl.missToday++; jl.why = 'ส่งงานเลยกำหนดหลายรายการ'; });
  jl.heat = clamp(jl.heat, 0, 100); if (jl.heat < 30) jl.warn = 0;
  if (jl.heat >= 100) return jlFired(jl.why || 'ผลงานต่ำกว่าเกณฑ์อย่างต่อเนื่อง');
  if (jl.heat >= 75 && jl.warn < 2) { jl.warn = 2; jlWarn(2); } else if (jl.heat >= 45 && jl.warn < 1) { jl.warn = 1; jlWarn(1); }
  if (Math.round(jl.heat) !== jlLastHeat) { jlLastHeat = Math.round(jl.heat); try { careerChip(); } catch (e) {} }
}
setInterval(jlTick, 2000);
const _cc = careerChip;
careerChip = function () {
  _cc(); const el = $('careerChip'); if (!el) return; el.querySelectorAll('.jlh').forEach(x => x.remove());
  if (career.id === 'jl') el.insertAdjacentHTML('beforeend', `<button class="jlh jlsos" data-jlsos>🆘 ขอยืมเงิน / กู้เงิน</button>`);
  else if (unlockedDay >= 3) el.insertAdjacentHTML('beforeend', `<div class="jlh jlheat" title="ถ้าพลาดงานหรือไม่ทำงานบ่อยๆ หัวหน้าจะไม่พอใจจนไล่ออกได้"><i style="width:${Math.round(jl.heat)}%"></i></div><small class="jlh">😾 ความไม่พอใจของหัวหน้า ${Math.round(jl.heat)}%</small>`);
};
document.addEventListener('click', e => { if (e.target.closest('[data-jlsos]')) { e.stopPropagation(); jlHelp(); } }, true);

/* ---------- money low popup: borrow from people / quick online loan ---------- */
const JL_FR = { mom: ['แม่', .92, 3000], dad: ['พ่อ', .8, 3000], sis: ['น้องสาว', .7, 2000], fon: ['ฝน', .6, 1500], mint: ['มิ้นท์', .5, 1500] };
function jlLow() {
  if (jl.modal || lk.on || phone.open === 'x') return; const b = bank.bal, d = dayStart(gnow());
  if (b > 1500) jl.lowArm = true;
  if (b <= 1000 && (jl.lowArm || (jl.lowAt && d - jl.lowAt >= 2 * DAY))) { jl.lowArm = false; jl.lowAt = d; jlHelp(true); }
}
async function jlHelp(auto) {
  if (jl.modal) return;
  const v = await jlModal(`<div class="jlbig">💸</div><h2>${auto ? 'เงินในบัญชีเหลือไม่ถึง 1,000 บาท!' : 'ขอความช่วยเหลือเรื่องเงิน'}</h2><p>ตอนนี้มี <b>฿${baht(bank.bal)}</b> · ค่าเช่าและบิลยังต้องจ่ายต่อ<br>จะทำอย่างไรดี?</p>`, [['🤝 ขอยืมเงินคนรู้จัก', 'fr', 'pri'], ['📲 กู้เงินด่วนออนไลน์ (ดอกแพง)', 'loan'], ['ไว้ก่อน', null]], 'dark');
  if (v === 'loan') {
    const ok = await jlModal(`<h2>📲 เงินกู้ด่วนออนไลน์</h2><p>ได้เงินเข้าบัญชีทันที <b>฿4,500</b><br>แต่ตั้งหนี้ <b>฿5,000</b> (หักค่าธรรมเนียม 10% ล่วงหน้า) และมีดอกเบี้ยทบเดือนละ 1%<br><small>ชำระคืนได้ในแอปธนาคารน้อย แท็บสินเชื่อ</small></p>`, [['กู้เลย', 'y', 'pri'], ['ไม่กู้', null]], 'dark');
    if (ok) { bank.loan += 5000; bankTx('📲 กู้เงินด่วนออนไลน์', 4500); renderBank(); S.jingle(); S.toast('เงินกู้เข้าบัญชีแล้ว ฿4,500 (หนี้ ฿5,000)', 2.6); }
  } else if (v === 'fr') {
    const k = await jlModal(`<h2>ขอยืมใครดี?</h2><p>ยืมแล้วต้องโอนคืนภายหลังที่ธนาคารน้อย (แท็บโอนเงิน)</p>`, [...Object.keys(JL_FR).map(k => [`${JL_FR[k][0]} · ฿${baht(JL_FR[k][2])}`, k]), ['ยกเลิก', null]], 'dark');
    if (k) {
      const [n, p, amt] = JL_FR[k];
      if ((debts[k] || 0) >= amt * 2 || Math.random() > p) { pushMsg(chatOf(k), k, (debts[k] || 0) >= amt * 2 ? `ยืมไปตั้งเยอะแล้วนะ คืนก่อนค่อยว่ากัน` : pick(['ตอนนี้เองก็ไม่ค่อยมีเลยอ่ะ ขอโทษนะ 🥲', 'ขอโทษทีนะ เดือนนี้ก็ตึงเหมือนกัน', 'รอก่อนได้ไหม เดี๋ยวดูให้นะ']), 1500); S.toast(`${n} ไม่สะดวกให้ยืม`, 2.4); }
      else { bankTx(`🤝 ยืมเงินจาก${n}`, amt); debts[k] = (debts[k] || 0) + amt; renderBank(); pushMsg(chatOf(k), k, pick([`โอนให้แล้วนะ ${baht(amt)} บาท สู้ๆ นะ 💪`, `ส่งให้แล้ว ${baht(amt)} บาท ไม่ต้องรีบคืนก็ได้`]), 1500); S.jingle(); S.toast(`${n} โอนให้ ${baht(amt)} บาท`, 2.6); }
    }
  }
}

/* ---------- job odds: higher salary = lower chance ---------- */
const jobChance = j => clamp(.75 - (j.min - 22000) * .0000225, .1, .75);
const chanceWord = c => c >= .55 ? 'สูง' : c >= .3 ? 'ปานกลาง' : 'ต่ำ';
[['j1', 'acct'], ['j2', 'acct'], ['j3', 'tax'], ['j4', 'acct'], ['j5', 'cafe']].forEach(([id, c]) => { const j = JOBS.find(x => x.id === id); if (j && !j.career) j.career = c; });
[['jl1', '🧾', '#ffe8c7', 'บริษัท ใบเสร็จสุขใจ จำกัด', 'ผู้ช่วยนักบัญชี', 18000, 21000, 'บางกะปิ', ['บัญชี'], 'acct'], ['jl2', '📞', '#e3f3ff', 'บริษัท โทรหาได้ จำกัด', 'เจ้าหน้าที่ดูแลลูกค้า', 16000, 19000, 'ลาดพร้าว', ['บริการ'], 'cs'], ['jl3', '☕', '#f0e2d0', 'ร้านกาแฟเมฆ สาขา 2', 'พนักงานร้านกาแฟ', 13000, 15000, 'ฝั่งธน', ['บริการ'], 'cafe'], ['jl4', '🏦', '#dff5ea', 'บริษัท มั่งคั่งทรัพย์ จำกัด', 'หัวหน้าแผนกบัญชี', 48000, 60000, 'สีลม · ไฮบริด', ['บัญชี', 'การเงิน'], 'acct'], ['jl5', '🧮', '#e6dcff', 'สำนักงานภาษี ตรงเวลา', 'ผู้จัดการฝ่ายภาษี', 38000, 46000, 'พระราม 9', ['ภาษี'], 'tax'], ['jl6', '👑', '#fff1b8', 'บริษัท ทองคำโฮลดิ้ง', 'ผู้อำนวยการฝ่ายการเงิน (CFO)', 85000, 110000, 'สาทร', ['การเงิน'], 'acct']]
  .forEach(([id, e, c, co, pos, min, max, where, tags, career]) => JOBS.push({ id, e, c, co, pos, min, max, where, tags, career, desc: `ต้องการ ${pos} มาร่วมงานกับ ${co} เริ่มงานได้ทันที`, need: ['ขยัน ซื่อสัตย์', 'ทำงานเป็นทีมได้'], perks: ['ประกันสังคม', 'โบนัสตามผลงาน'] }));
applyJob = function (j, rf) {
  jobs.applied.add(j.id); renderJobs(); S.jingle(); S.toast(`ส่งใบสมัคร ${j.pos} พร้อม ${rf.name} แล้ว`, 2.4); complete('apply'); complete('jl_apply');
  mailPush(null, 'HR ' + j.co, `ได้รับใบสมัครตำแหน่ง ${j.pos} แล้ว`, `<p>เรียนผู้สมัคร</p><p>${esc(j.co)} ได้รับใบสมัครและเรซูเม่ (${esc(rf.name)}) แล้ว กำลังพิจารณา จะแจ้งผลโดยเร็ว</p>`, 'news');
  const ok = Math.random() < jobChance(j); setTimeout(() => jobResult(j, ok), 8000 + Math.random() * 7000);
};
function jobResult(j, ok) {
  if (ok) {
    const pid = 'co-' + j.id; PEOPLE[pid] = PEOPLE[pid] || { n: 'HR ' + j.co, c: j.c, e: j.e }; if (!chatById(pid)) chat.list.unshift({ id: pid, n: j.co, members: [pid], unread: 0, msgs: [] });
    if (!career.offers.includes(j.id)) career.offers.push(j.id); complete('jl_offer');
    pushMsg(pid, pid, `ยินดีด้วยค่ะ 🎉 ${j.co} ขอเสนอตำแหน่ง ${j.pos} เงินเดือน ${baht(j.min)} บาทค่ะ ถ้าตกลง กด “ตอบรับข้อเสนอ” ในจ๊อบน้อยได้เลยนะคะ`, 500);
    mailPush(null, 'HR ' + j.co, `ข้อเสนองาน: ${j.pos}`, `<p>เรียนผู้สมัคร</p><p>${esc(j.co)} ยินดีเสนอตำแหน่ง <b>${esc(j.pos)}</b> เงินเดือน <b>${baht(j.min)} บาท</b> กรุณาตอบรับในแอปจ๊อบน้อย</p>`, 'news');
    S.big(`📨 ${j.co} ส่งข้อเสนองานมาแล้ว!`, 3, '#2f9d5a'); S.jingle();
  } else {
    const why = pick(['มีผู้สมัครที่ตรงกับตำแหน่งมากกว่า', 'งบประมาณเงินเดือนยังไม่ตรงกับที่ต้องการ', 'ประสบการณ์ยังไม่ตรงกับที่ตำแหน่งต้องการ', 'ตำแหน่งนี้ปิดรับสมัครแล้ว']);
    mailPush(null, 'HR ' + j.co, `ผลการสมัคร ${j.pos}`, `<p>เรียนผู้สมัคร</p><p>ขอบคุณที่สนใจ ${esc(j.co)} ครั้งนี้ทางบริษัทยังไม่สามารถเสนองานให้ได้ (${esc(why)}) ขอให้โชคดีนะคะ</p>`, 'news');
    jobs.applied.delete(j.id); S.toast(`😢 ${j.co}: ไม่ผ่านการคัดเลือก (${why}) — สมัครใหม่หรือหางานอื่นได้`, 4); S.tone(330, 200, .3, .08);
  }
  try { renderJobs(); } catch (e) {}
}
const _rj = renderJobs;
renderJobs = function () {
  _rj(); if (!jobs.W || !jobs.view) return; const j = JOBS.find(x => x.id === jobs.view), jd = jobs.W.body.querySelector('.jd'); if (!j || !jd || jd.querySelector('.jchance')) return;
  const c = jobChance(j); jd.insertAdjacentHTML('afterbegin', `<div class="jchance" style="font-size:12px;color:#7a6f8f">🎲 โอกาสได้งาน: <b>${chanceWord(c)}</b> (เงินเดือนยิ่งสูง โอกาสยิ่งต่ำ)</div>`);
};
const _jc = jobsClick;
jobsClick = function (e) { const g = e.target.closest('[data-career-go]'); if (g) { const j = JOBS.find(x => x.id === g.dataset.careerGo); if (j) jl.take = { career: j.career, sal: j.min }; } _jc(e); };

/* ---------- stock app ---------- */
const STK = [['KMEOW', 'แมวเหมียวเทค', 45, .012], ['BAKE', 'เบเกอรี่ฮอลดิ้ง', 28, .008], ['MOO', 'มูฟู้ดส์', 62, .009], ['TUK', 'ตุ๊กตุ๊กลอจิสติกส์', 15, .02], ['SIAM', 'สยามพลังงาน', 33, .011], ['BNK', 'ธนาคารน้อย', 120, .006]];
const stk = { W: null, sel: 'KMEOW' };
function stkInit() { STK.forEach(([s, , p0, v]) => { if (!jl.px[s] || !jl.px[s].length) { let p = p0; jl.px[s] = Array.from({ length: 40 }, () => (p = Math.max(1, +(p * (1 + (Math.random() - .5) * 2 * v * 2)).toFixed(2)))); } }); }
GENERAL_APPS.push({ id: 'app-stock', n: 'หุ้นน้อย', e: '📈', c: '#12a150', fn: () => openStock() }, { id: 'app-lotto', n: 'หวยน้อย', e: '🎟️', c: '#e5536f', fn: () => openLotto() });
const GOODN = ['ประกาศกำไรเกินคาด', 'ได้สัญญาใหญ่', 'นักลงทุนต่างชาติเข้าซื้อ', 'เปิดสาขาใหม่ ยอดขายพุ่ง'], BADN = ['กำไรต่ำกว่าคาด', 'ถูกตรวจสอบภายใน', 'ต้นทุนวัตถุดิบพุ่ง', 'ผู้บริหารลาออกกะทันหัน'];
function stkTick() {
  if (lk.on) return; stkInit();
  STK.forEach(([s, n, , v]) => {
    const a = jl.px[s]; let p = a[a.length - 1] * (1 + (Math.random() - .5) * 2 * v);
    if (Math.random() < .03) { const good = Math.random() < .6, mv = .03 + Math.random() * .05; p *= good ? 1 + mv : 1 - mv; jl.news.unshift({ t: `${good ? '📈' : '📉'} ${s}: ${pick(good ? GOODN : BADN)}`, g: good }); jl.news.length = Math.min(jl.news.length, 6); }
    a.push(Math.max(1, +p.toFixed(2))); if (a.length > 60) a.shift();
  });
  if (stk.W && wins.has('stock')) stkRender();
}
setInterval(stkTick, 4000);
const stkFee = .0025;
function openStock() {
  if (wins.has('stock')) { focusWin(wins.get('stock')); return; } stkInit();
  stk.W = openWin('stock', 'หุ้นน้อย — ตลาดหุ้นจำลอง', h('div', { class: 'stk' }), 600, 470, '#e3f7ea'); stk.W.onClose = () => { stk.W = null; };
  stk.W.body.firstChild.addEventListener('click', e => {
    const r = e.target.closest('[data-ss]'); if (r) { stk.sel = r.dataset.ss; return stkRender(); }
    const b = e.target.closest('[data-sb]'); if (!b) return; const [act, q] = b.dataset.sb.split(':'), s = stk.sel, a = jl.px[s], p = a[a.length - 1], pos = jl.port[s] || (jl.port[s] = { q: 0, cost: 0 });
    if (act === 'b') { const c = Math.round(p * +q * (1 + stkFee) * 100) / 100; if (!bankPay(Math.ceil(c), `📈 ซื้อหุ้น ${s} ${q} หุ้น`)) return; pos.q += +q; pos.cost += c; S.tone(700, 900, .08, .06); }
    else { const n = q === 'all' ? pos.q : Math.min(+q, pos.q); if (!n) return S.toast('ไม่มีหุ้นให้ขาย', 1.4); const get = Math.floor(p * n * (1 - stkFee)); pos.cost *= (pos.q - n) / pos.q; pos.q -= n; bankTx(`📈 ขายหุ้น ${s} ${n} หุ้น`, get); renderBank(); S.tone(900, 600, .08, .06); S.toast(`ขาย ${n} หุ้น ได้ ฿${baht(get)}`, 1.6); }
    stkRender();
  });
  stkRender();
}
function stkRender() {
  if (!stk.W) return; const box = stk.W.body.firstChild, s = stk.sel, a = jl.px[s], p = a[a.length - 1], pos = jl.port[s] || { q: 0, cost: 0 };
  const mx = Math.max(...a), mn = Math.min(...a), pts = a.map((v, i) => `${(i / (a.length - 1) * 300).toFixed(1)},${(70 - (v - mn) / ((mx - mn) || 1) * 64).toFixed(1)}`).join(' ');
  const rows = STK.map(([k, n]) => { const x = jl.px[k], l = x[x.length - 1], pv = x[x.length - 2] || l, ch = (l - pv) / pv * 100; return `<button class="srow ${k === s ? 'on' : ''}" data-ss="${k}"><b>${k}</b><span>${n}</span><em>${fm2(l)}</em><i class="${ch >= 0 ? 'up' : 'dn'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(2)}%</i></button>`; }).join('');
  const total = Object.keys(jl.port).reduce((t, k) => { const x = jl.px[k]; return t + (jl.port[k].q || 0) * (x ? x[x.length - 1] : 0); }, 0), pl = pos.q * p - pos.cost;
  box.innerHTML = `<div class="sl">${rows}</div><div class="sr"><h3>${s} · ${esc(STK.find(x => x[0] === s)[1])}</h3><div class="sp">฿${fm2(p)}</div><svg viewBox="0 0 300 74" class="sg"><polyline fill="none" stroke="${a[a.length - 1] >= a[0] ? '#12a150' : '#e5536f'}" stroke-width="2" points="${pts}"/></svg>
    <div class="shold">ถืออยู่ <b>${pos.q}</b> หุ้น${pos.q ? ` · ทุนเฉลี่ย ${fm2(pos.cost / pos.q)} · <b class="${pl >= 0 ? 'up' : 'dn'}">${pl >= 0 ? '+' : ''}${fm2(pl)}</b>` : ''}</div>
    <div class="sbt"><button class="btn2 grn" data-sb="b:10">ซื้อ 10</button><button class="btn2 grn" data-sb="b:100">ซื้อ 100</button><button class="btn2" data-sb="s:10">ขาย 10</button><button class="btn2" data-sb="s:all">ขายทั้งหมด</button></div>
    <small>เงินในบัญชี ฿${baht(bank.bal)} · มูลค่าหุ้นทั้งหมด ฿${baht(Math.round(total))} · ค่าธรรมเนียม 0.25%/ครั้ง</small>
    <div class="snw">${jl.news.map(n => `<div class="${n.g ? 'up' : 'dn'}">${esc(n.t)}</div>`).join('') || '<small>ยังไม่มีข่าว</small>'}</div><small class="sdis">เกมจำลอง · ข่าวดีออกบ่อยกว่าชีวิตจริงราว 20% (เฉพาะในเกม) แต่หุ้นขึ้นลงได้ทั้งคู่ เสี่ยงเอง</small></div>`;
}

/* ---------- lottery app: draws on the 1st and 16th ---------- */
const LOT_PRICE = 80, lot = { W: null };
function nextDraw() { const g = gnow(); let d = g.getHours() >= 15 ? dayStart(g) + DAY + 3 * 3600000 : dayStart(g) + 3 * 3600000; for (let i = 0; i < 20; i++) { const x = new Date(d).getDate(); if (x === 1 || x === 16) return dayStart(d); d += DAY; } return dayStart(d); }
const r6 = () => String(Math.floor(Math.random() * 1e6)).padStart(6, '0'), r3 = () => String(Math.floor(Math.random() * 1e3)).padStart(3, '0');
function prizesOf(n, D) {
  const pr = [], v = +n, F = +D.first;
  if (n === D.first) pr.push(['รางวัลที่ 1', 6000000]); else if (Math.abs(v - F) === 1) pr.push(['รางวัลเลขข้างเคียงรางวัลที่ 1', 100000]);
  if (D.s2.includes(n)) pr.push(['รางวัลที่ 2', 200000]); if (D.s3.includes(n)) pr.push(['รางวัลที่ 3', 80000]); if (D.s4.includes(n)) pr.push(['รางวัลที่ 4', 40000]); if (D.s5.includes(n)) pr.push(['รางวัลที่ 5', 20000]);
  if (D.f3.includes(n.slice(0, 3))) pr.push(['เลขหน้า 3 ตัว', 4000]); if (D.b3.includes(n.slice(3))) pr.push(['เลขท้าย 3 ตัว', 4000]); if (n.slice(4) === D.b2) pr.push(['เลขท้าย 2 ตัว', 2000]);
  return pr;
}
function lottoDraw(d) {
  const mine = jl.tix.filter(t => t.d <= d); if (!mine.length) return;
  const arr = (k, f) => Array.from({ length: k }, f), D = { first: r6(), s2: arr(5, r6), s3: arr(10, r6), s4: arr(50, r6), s5: arr(100, r6), f3: [r3(), r3()], b3: [r3(), r3()], b2: String(Math.floor(Math.random() * 100)).padStart(2, '0') };
  const lockF = [0, 0], lockB = [0, 0]; let lockB2 = 0;
  mine.forEach(t => { // game luck: about 20% more winning chances than real life (about 1.4% -> 1.7% of tickets win something)
    if (prizesOf(t.n, D).length || Math.random() >= .0028) return; const x = Math.random();
    if (x < .71) { if (!lockB2) { D.b2 = t.n.slice(4); lockB2 = 1; } } else if (x < .855) { const i = lockF.indexOf(0); if (i >= 0) { D.f3[i] = t.n.slice(0, 3); lockF[i] = 1; } } else { const i = lockB.indexOf(0); if (i >= 0) { D.b3[i] = t.n.slice(3); lockB[i] = 1; } }
  });
  let total = 0; const win = []; mine.forEach(t => prizesOf(t.n, D).forEach(([l, a]) => { total += a; win.push({ n: t.n, l, a }); }));
  jl.tix = jl.tix.filter(t => t.d > d); jl.hist.unshift({ d, first: D.first, f3: D.f3, b3: D.b3, b2: D.b2, win, total, cnt: mine.length }); jl.hist.length = Math.min(jl.hist.length, 6);
  if (total) { bankTx(`🎟️ ถูกสลาก งวด ${thDate(d, { day: 'numeric', month: 'short' })}`, total); jl.won += total; renderBank(); S.big(`🎉 ถูกสลาก ฿${baht(total)}!`, 3, '#e5536f'); S.jingle(); } else S.toast(`🎟️ ผลสลากงวด ${thDate(d, { day: 'numeric', month: 'short' })} ออกแล้ว — ไม่ถูกรางวัล`, 3.2);
  if (lot.W && wins.has('lotto')) lotRender();
}
function lotStall() { const nd = nextDraw(); if (!jl.stall || jl.stall.d !== nd) jl.stall = { d: nd, list: Array.from({ length: 24 }, r6) }; return jl.stall; }
function openLotto() {
  if (wins.has('lotto')) { focusWin(wins.get('lotto')); return; }
  lot.W = openWin('lotto', 'หวยน้อย — สลากกินแบ่งจำลอง', h('div', { class: 'lot' }), 520, 480, '#ffe9ee'); lot.W.onClose = () => { lot.W = null; };
  lot.W.body.firstChild.addEventListener('click', e => {
    const b = e.target.closest('[data-lb]'); if (!b) return; const st = lotStall(); let n = b.dataset.lb;
    if (n === 'rand') n = st.list[Math.floor(Math.random() * st.list.length)]; if (!n || !st.list.includes(n)) return lotRender();
    if (!bankPay(LOT_PRICE, `🎟️ ซื้อสลาก ${n}`)) return; st.list.splice(st.list.indexOf(n), 1); jl.tix.push({ n, d: st.d }); S.tone(600, 900, .08, .06); lotRender();
  });
  lotRender();
}
function ticketHTML(n, buy, d) { return `<${buy ? 'button data-lb="' + n + '"' : 'div'} class="tkt${buy ? '' : ' mine'}"><i>🎟️ สลากน้อย · งวด ${thDate(d || lotStall().d, { day: 'numeric', month: 'short' })}</i><b>${[...n].map(c => `<u>${c}</u>`).join('')}</b><small>${buy ? 'ใบละ ฿80 · กดเพื่อซื้อ' : 'ใบของฉัน'}</small></${buy ? 'button' : 'div'}>`; }
function lotRender() {
  if (!lot.W) return; const box = lot.W.body.firstChild, nd = nextDraw(), h0 = jl.hist[0];
  const tx = jl.tix.slice().reverse().slice(0, 30).map(t => ticketHTML(t.n, false, t.d)).join('');
  box.innerHTML = `<div class="lh"><b>งวดต่อไป ${thDate(nd, { day: 'numeric', month: 'long' })}</b><small>ออกรางวัลวันที่ 1 และ 16 ของเดือน เวลา 15:00 น. · ใบละ ฿${LOT_PRICE} · เงินในบัญชี ฿${baht(bank.bal)}</small></div>
    <h4>แผงสลากวันนี้ <small>(เลขสุ่มมาแล้ว เลือกได้เฉพาะที่มีในแผง)</small></h4><div class="tks stall tkg">${lotStall().list.map(n => ticketHTML(n, true)).join('') || '<small>สลากหมดแผงแล้ว</small>'}</div><div class="lbuy"><button class="btn2 pri" data-lb="rand">🎲 สุ่มซื้อ 1 ใบจากแผง</button></div>
    <h4>สลากของฉัน (${jl.tix.length} ใบ)</h4><div class="tks tkg">${tx || '<small>ยังไม่มีสลาก</small>'}</div>
    ${h0 ? `<h4>ผลงวด ${thDate(h0.d, { day: 'numeric', month: 'short' })}</h4><div class="lres">รางวัลที่ 1 <b>${h0.first}</b><br>เลขหน้า 3 ตัว ${h0.f3.join(' · ')} · เลขท้าย 3 ตัว ${h0.b3.join(' · ')} · เลขท้าย 2 ตัว <b>${h0.b2}</b><br>${h0.win.length ? h0.win.map(w => `🎉 ${w.n}: ${esc(w.l)} ฿${baht(w.a)}`).join('<br>') : `ซื้อ ${h0.cnt} ใบ ไม่ถูกรางวัล`}</div>` : ''}
    <small class="sdis">เกมจำลอง ไม่ใช่การพนันจริง · โอกาสถูกรางวัลในเกมสูงกว่าชีวิตจริงประมาณ 20% · ถูกรางวัลรวมทั้งหมดในเกม ฿${baht(jl.won)}</small>`;
}

/* ---------- save / load ---------- */
const _snap5 = snapshot; snapshot = () => ({ ..._snap5(), jl: { heat: jl.heat, day: jl.day, lastCnt: jl.lastCnt, doneBase: jl.doneBase, late: jl.late, warn: jl.warn, lowArm: jl.lowArm, lowAt: jl.lowAt, why: jl.why, px: jl.px, port: jl.port, tix: jl.tix, hist: jl.hist, won: jl.won, news: jl.news, stall: jl.stall } });
const _load5 = loadGame;
loadGame = function () { const ok = _load5(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.jl) Object.assign(jl, s.jl); } catch (e) {} } jlTheme(); try { careerChip(); } catch (e) {} return ok; };
setTimeout(() => { try { syncApps(); renderDesktop(); jlTheme(); } catch (e) { console.error(e); } }, 0);
