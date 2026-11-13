"use strict";
// Office game — "เมลน้อย" pretend email (a tab in เสิร์ชน้อย) and post-it notes that stick anywhere.
// Every address ends in .test, a domain reserved so it can never be a real mailbox. Nothing here leaves the browser.

/* ================= pretend email ================= */
const MAIL_DOMAIN = 'mewnoi.test';
const mail = { accounts: [], inbox: [], view: 'auto', open: null, f: 'all' };
const MAIL_CATS = [['all', 'ทั้งหมด'], ['imp', '⭐ ต้องตอบ'], ['job', '💼 สมัครงาน'], ['work', '📎 งานภายนอก'], ['news', '📰 ข่าว'], ['promo', '🏷️ โปรโมชั่น'], ['sent', '📤 ส่งแล้ว']];
const forMe = m => !m.to || mail.accounts.some(a => a.email === m.to); // mail with no address waits for whoever signs up first
const arrived = m => forMe(m) && m.at <= gnow().getTime(); // mail stamped later today is not in the inbox yet
const perf = { mailOk: 0, mailMiss: 0, callOk: 0, callMiss: 0 };
const catOk = m => mail.f === 'all' || (mail.f === 'imp' ? m.imp && !m.replied : m.cat === mail.f);
const WARN_BIG = `<div class="warnbig">⚠️ ใช้อีเมลสมมุติและรหัสผ่านสมมุติเท่านั้น<small>ห้ามใช้อีเมลหรือรหัสผ่านจริงของคุณ · ข้อมูลทั้งหมดอยู่ในเกมบนเครื่องนี้ ไม่มีการนำออกไปภายนอก แต่ขอให้ระมัดระวังไว้ก่อน</small></div>`;
function mailPush(to, from, subj, body, cat = 'news', at, extra) { mail.inbox.unshift({ to, from, subj, body, cat, at: at ?? gnow().getTime(), read: false, ...extra }); if (mail.inbox.length > 120) mail.inbox.length = 120; }
function mailBoxes() {
  const out = []; if (wins.has('mail')) out.push(wins.get('mail').body.firstChild);
  if (typeof se !== 'undefined' && se.root && se.root.isConnected && se.tab === 'mail') { const r = se.root.querySelector('.res'); if (r) out.push(r); }
  return out;
}
function showMail(view) { if (view) mail.view = view; mailBoxes().forEach(paintMail); }
function openMailApp() {
  const W = openWin('mail', 'เมลน้อย — อีเมล', h('div', { class: 'mailapp' }), 580, 460, '#e6efff');
  if (!W.body.firstChild.dataset.k) { W.body.firstChild.dataset.k = 1; W.body.style.overflow = 'auto'; W.body.firstChild.addEventListener('click', e => mailClick(e)); }
  showMail(); return W;
}
function paintMail(box) {
  const v = mail.view === 'auto' ? (mail.accounts.length ? 'inbox' : 'new') : mail.view;
  if (v === 'new') {
    box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย <small>อีเมลสมมุติในเกม</small></div>${WARN_BIG}
      <form class="mf" autocomplete="off"><label>ชื่อเล่น (สมมุติ)<input name="nm" type="text" placeholder="เช่น น้องกุ้ง" spellcheck="false"></label>
      <label>ชื่อผู้ใช้<span class="mu"><input name="user" type="text" placeholder="เช่น kungnoi" spellcheck="false" autocapitalize="off"><b>@${MAIL_DOMAIN}</b></span></label>
      <label>รหัสผ่าน (ตั้งแบบสมมุติ เช่น meow123)<input name="pw" type="text" spellcheck="false" autocapitalize="off"></label>
      <label>พิมพ์รหัสผ่านอีกครั้ง<input name="pw2" type="text" spellcheck="false" autocapitalize="off"></label>
      <label class="mok"><input name="ok" type="checkbox"> ฉันเข้าใจว่านี่คืออีเมลและรหัสผ่านสมมุติในเกมเท่านั้น</label>
      <div class="err"></div><button class="btn2 pri" type="submit">สร้างอีเมล</button>${mail.accounts.length ? '<button class="btn2" type="button" data-mv="inbox">← กลับไปกล่องจดหมาย</button>' : ''}</form></div>`;
    const fm = box.querySelector('.mf');
    fm.addEventListener('submit', e => { e.preventDefault(); createMail(fm); });
    fm.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); const ins = [...fm.querySelectorAll('input[type=text]')], i = ins.indexOf(e.target); if (i < ins.length - 1) ins[i + 1].focus(); else fm.ok.focus(); } });
    return;
  }
  if (v === 'write' && mail.accounts.length) return paintWrite(box);
  if (v === 'inbox' && mail.f === 'sent') return paintSent(box);
  if (v === 'done') {
    const a = mail.accounts[mail.accounts.length - 1];
    box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย</div><div class="mdone"><div style="font-size:40px">🎉</div><b>สร้างอีเมลสำเร็จ!</b><div class="mcard">อีเมล: <b>${esc(a.email)}</b><br>รหัสผ่าน: <b>${esc(a.pass)}</b></div>
      <p>อย่าลืม<b>จดลงโพสต์อิท</b>ไว้ จะได้ใช้สมัครแชทน้อย</p><div class="iv"><div class="acts"><button class="btn2 pri" data-mnote>📝 จดลงโพสต์อิท</button><button class="btn2 grn" data-mchat>💬 ไปสมัครแชทน้อย</button><button class="btn2" data-mv="inbox">📥 กล่องจดหมาย</button></div></div></div>${WARN_BIG}</div>`;
    return;
  }
  // inbox
  const mine = mail.inbox.filter(m => arrived(m) && catOk(m)).sort((a, b) => b.at - a.at), op = mail.open !== null ? mail.inbox[mail.open] : null;
  const cnt = k => mail.inbox.filter(m => arrived(m) && (k === 'imp' ? m.imp && !m.replied : !m.read && (k === 'all' || m.cat === k))).length;
  const dueTxt = m => m.replied ? '<span class="mtag ok">ตอบแล้ว ✓</span>' : m.missed ? '<span class="mtag bad">เลยกำหนด ⚠️</span>' : `<span class="mtag">⭐ ตอบก่อน ${thDate(m.due, { day: 'numeric', month: 'short' })}</span>`;
  box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย <small>${mail.accounts.map(a => esc(a.email)).join(' · ')}</small></div>
    <div class="mbar2"><button class="btn2 pri" data-mv="write">✍️ เขียนอีเมล</button><button class="btn2" data-mv="new">👤 สร้างบัญชีใหม่</button><span class="mperf">ตอบเมลสำคัญแล้ว ${perf.mailOk} · พลาด ${perf.mailMiss}</span></div>
    ${op ? '' : `<div class="mchips">${MAIL_CATS.map(([k, n]) => `<button class="${mail.f === k ? 'on' : ''}" data-mf="${k}">${n}${cnt(k) ? ` <i>${cnt(k)}</i>` : ''}</button>`).join('')}</div>`}
    ${op ? `<div class="mread"><a data-mback style="color:#3348b8;cursor:pointer">← กลับ</a><h3>${esc(op.subj)}</h3><small>จาก ${esc(op.from)} · ถึง ${esc(op.to || mail.accounts[0].email)} · ${thDate(op.at, { day: 'numeric', month: 'short' })}</small>${op.imp ? `<div>${dueTxt(op)}</div>` : ''}<div class="mbody">${op.body}</div>${op.att && op.att.length ? `<div class="matts">📎 ${op.att.map((a, i) => `<button class="btn2" data-matt="${i}">💾 ${esc(a.name)}</button>`).join(' ')}</div>` : ''}${op.replied ? `<div class="mrep"><b>↩️ คุณตอบไปว่า</b><div>${esc(op.replied.text).replace(/\n/g, '<br>')}</div>${op.replied.att ? `<small>📎 ${esc(op.replied.att)}</small>` : ''}</div>` : mail.compose === mail.open ? mailComposer(op) : `<div class="acts"><button class="btn2 pri" data-mreply>↩️ ตอบกลับ</button></div>`}</div>`
      : `<div class="mlist">${mine.map(m => `<div class="mrow ${m.read ? '' : 'new'}" data-mi="${mail.inbox.indexOf(m)}"><b>${m.imp && !m.replied ? '⭐ ' : ''}${esc(m.from)}</b><span>${esc(m.subj)}${m.imp ? ' ' + dueTxt(m) : ''}</span><small>${thDate(m.at, { day: 'numeric', month: 'short' })}</small></div>`).join('') || '<p class="note">ยังไม่มีจดหมาย</p>'}</div>`}
    <p class="note" style="margin-top:10px">อีเมลในเกมทั้งหมดลงท้าย @${MAIL_DOMAIN} ซึ่งเป็นโดเมนสมมุติที่ไม่มีอยู่จริง</p></div>`;
}
function createMail(fm) {
  const err = fm.querySelector('.err'), user = fm.user.value.trim().toLowerCase(), pw = fm.pw.value, pw2 = fm.pw2.value, nm = fm.nm.value.trim();
  const bad = t => { err.textContent = t; S.tone(300, 200, .15, .08); };
  if (/@/.test(user)) return bad('ใส่แค่ชื่อผู้ใช้ ไม่ต้องใส่ @ (และห้ามใช้อีเมลจริงนะ)');
  if (!/^[a-z0-9._]{3,20}$/.test(user)) return bad('ชื่อผู้ใช้ใช้ได้แค่ a-z ตัวเลข จุด หรือ _ ยาว 3–20 ตัว');
  if (mail.accounts.some(a => a.user === user)) return bad('ชื่อนี้มีคนใช้แล้วในเกม ลองชื่ออื่นนะ');
  if (pw.length < 4 || pw.length > 20) return bad('รหัสผ่านสมมุติยาว 4–20 ตัวนะ');
  if (pw !== pw2) return bad('รหัสผ่านสองช่องไม่ตรงกัน');
  if (!fm.ok.checked) return bad('ติ๊กยืนยันก่อนว่าเป็นอีเมลและรหัสผ่านสมมุติ');
  const a = { user, email: `${user}@${MAIL_DOMAIN}`, pass: pw, name: nm || user };
  mail.accounts.push(a);
  mailPush(a.email, 'ทีมเมลน้อย', 'ยินดีต้อนรับสู่เมลน้อย 🎉', `<p>สวัสดี ${esc(a.name)}!</p><p>อีเมลของคุณคือ <b>${esc(a.email)}</b> ใช้สมัครแอปต่างๆ ในเกมได้เลย</p><p>อย่าลืมว่านี่เป็นอีเมลสมมุติ ห้ามใช้ข้อมูลจริงนะ 😊</p>`);
  S.jingle(); showMail('done');
}
function mailClick(e) {
  if (typeof mailClick2 === 'function' && mailClick2(e)) return true;
  const t = e.target;
  const mv = t.closest('[data-mv]'); if (mv) { mail.open = null; showMail(mv.dataset.mv); return true; }
  const mf = t.closest('[data-mf]'); if (mf) { mail.f = mf.dataset.mf; showMail('inbox'); return true; }
  const mi = t.closest('[data-mi]'); if (mi) { mail.open = +mi.dataset.mi; mail.compose = null; mail.inbox[mail.open].read = true; showMail('inbox'); return true; }
  if (t.closest('[data-mback]')) { mail.open = null; mail.compose = null; showMail('inbox'); return true; }
  if (t.closest('[data-mreply]')) { mail.compose = mail.open; mail.draft = ''; showMail('inbox'); setTimeout(() => mailBoxes().forEach(b => b.querySelector('.mrt')?.focus()), 30); return true; }
  if (t.closest('[data-mcancel]')) { mail.compose = null; showMail('inbox'); return true; }
  const tp = t.closest('[data-mtpl]'); if (tp) { mailBoxes().forEach(b => { const ta = b.querySelector('.mrt'); if (ta) ta.value = MAIL_TPL(mail.inbox[mail.open])[+tp.dataset.mtpl]; }); return true; }
  if (t.closest('[data-msend]')) { mailSend(t.closest('.mailw')); return true; }
  if (t.closest('[data-mnote]')) { const a = mail.accounts[mail.accounts.length - 1]; addNote('screen', `บัญชีอีเมลในเกม (สมมุติ)\n${a.email}\nรหัส: ${a.pass}`); S.toast('แปะโพสต์อิทไว้บนจอแล้ว ลากย้ายได้', 2); return true; }
  if (t.closest('[data-mchat]')) { openChat(); return true; }
  return false;
}
const mailUnread = () => mail.inbox.filter(m => !m.read && arrived(m) && mail.accounts.length).length;
const MAIL_TPL = m => [
  `เรียน ${m.from}\n\nขอบคุณที่ติดต่อมานะคะ ทางเราได้รับเรื่อง "${m.subj}" แล้ว และจะดำเนินการให้เสร็จภายใน 2 วันทำการค่ะ\n\nขอแสดงความนับถือ`,
  `เรียน ${m.from}\n\nขออภัยที่ตอบช้า รับทราบเรื่อง "${m.subj}" แล้วค่ะ รบกวนส่งรายละเอียดเพิ่มเติมมาอีกนิด เพื่อให้เราตรวจสอบได้ครบถ้วนนะคะ\n\nขอบคุณค่ะ`,
  `เรียน ${m.from}\n\nยืนยันตามที่แจ้งมาเรื่อง "${m.subj}" ค่ะ หากมีข้อสงสัยเพิ่มเติม โทรหาได้ตลอดเวลาทำการเลยนะคะ\n\nด้วยความเคารพ`,
];
function mailComposer(op) {
  const docs = FILES.filter(f => ['worddoc', 'pdfdoc', 'scan'].includes(f.kind) && f.loc !== 'trash');
  return `<div class="mcomp"><b>✍️ ตอบถึง ${esc(op.from)}</b><div class="mchips">${['สุภาพ-รับเรื่อง', 'ขอข้อมูลเพิ่ม', 'ยืนยัน'].map((n, i) => `<button data-mtpl="${i}">${n}</button>`).join('')}</div>
    <textarea class="mrt" rows="6" spellcheck="false" placeholder="พิมพ์คำตอบ (อย่างน้อย 15 ตัวอักษร) หรือกดแม่แบบด้านบน">${esc(mail.draft || '')}</textarea>
    ${docs.length ? `<label class="matt">📎 แนบไฟล์ <select class="mat"><option value="">ไม่แนบ</option>${docs.map(f => `<option>${esc(f.name)}</option>`).join('')}</select></label>` : ''}
    <div class="err"></div><div class="acts"><button class="btn2 pri" data-msend>📨 ส่ง</button><button class="btn2" data-mcancel>ยกเลิก</button></div></div>`;
}
function mailSend(root) {
  const op = mail.inbox[mail.open], ta = root.querySelector('.mrt'), txt = ta.value.trim(), err = root.querySelector('.err');
  if (txt.length < 15) { err.textContent = 'สั้นไปหน่อย พิมพ์ให้สุภาพและครบความอย่างน้อย 15 ตัวอักษรนะ'; S.tone(300, 200, .15, .08); return; }
  const att = root.querySelector('.mat')?.value || '';
  op.replied = { text: txt, att, at: gnow().getTime() }; mail.compose = null; mail.draft = '';
  if (op.imp) { if (!op.missed) perf.mailOk++; complete('mreply'); }
  S.jingle(); S.toast('📨 ส่งอีเมลแล้ว', 1.6); showMail('inbox');
  if (op.imp) mailPush(null, op.from, 'Re: ' + op.subj, `<p>ขอบคุณสำหรับการตอบกลับ${att ? ' และไฟล์แนบ' : ''}นะคะ/ครับ 🙏 ได้รับข้อมูลแล้ว</p>`, 'work', gnow().getTime() + 2 * 3600000);
}
/* pop-up in the bottom-right of the computer screen when new mail arrives */
let mailLastTick = 0;
function mailTick() {
  const t = performance.now(); if (t - mailLastTick < 1000) return; mailLastTick = t;
  if (!mail.accounts.length) return; const now = gnow().getTime(); let shown = 0;
  for (const m of mail.inbox) {
    if (m.nt || !arrived(m)) continue; m.nt = 1;
    if (!shown && now - m.at < 4 * 3600000) { shown = 1; mailNotify(m); }
  }
  const mb = $('taskbar').querySelector('[data-app="mail"]'); if (mb) { mb.querySelector('.dot')?.remove(); const u = mailUnread(); if (u) mb.append(h('span', { class: 'dot' }, String(u))); }
}
function mailNotify(m) {
  document.querySelectorAll('.mnoti').forEach(x => x.remove());
  const el = h('div', { class: 'mnoti' }, `<i>📧</i><div><b>${m.imp ? '⭐ ' : ''}${esc(m.from)}</b><span>${esc(m.subj)}</span></div>`);
  el.addEventListener('click', () => { el.remove(); mail.open = mail.inbox.indexOf(m); mail.compose = null; m.read = true; mail.view = 'inbox'; openMailApp(); });
  $('screen').append(el); S.tone(880, 1320, .18, .07, 'triangle'); setTimeout(() => S.tone(1320, 1320, .12, .06, 'triangle'), 160);
  if (currentView === 'desk') S.toast('📧 มีอีเมลใหม่เข้าที่หน้าจอคอม', 2);
  setTimeout(() => el.remove(), 8000);
}
function mailOverdue(d) {
  for (const m of mail.inbox) if (m.imp && !m.replied && !m.missed && m.due && m.due <= d) {
    m.missed = true; perf.mailMiss++;
    pushMsg('boss', 'boss', `เมล "${m.subj}" จาก ${m.from} ยังไม่ได้ตอบเลยนะ เขาโทรมาตามแล้ว 😾 รีบตอบด้วย`, 2500);
  }
}

/* ---- daily mail from the outside world: promotions, news, and work mail from other companies (all made up) ---- */
const MAIL_PROMO = [
  () => ['ช้อปน้อย', `⚡ ลดแรง ${pick([30, 40, 50, 70])}% เฉพาะวันนี้`, '<p>สินค้าคัดมาให้เพียบ ตั้งแต่เครื่องเขียน แก้วกาแฟ ไปจนถึงเก้าอี้ออฟฟิศ</p><p>🎁 ใช้โค้ด <b>MEWNOI</b> ลดเพิ่มอีก 50 บาท</p><p><small>อีเมลโฆษณาในเกม ไม่มีลิงก์จริง</small></p>'],
  () => ['หิวแล้ว', '🍱 ส่งฟรีเมื่อสั่งครบ 200 บาท', '<p>มื้อเที่ยงนี้อยากกินอะไร? ร้านในแอปหิวแล้วส่งฟรีทุกวันจันทร์–ศุกร์</p><p>เปิดแอป หิวแล้ว ในคอมได้เลย 😋</p>'],
  () => ['โรงแรมเมฆหมอก', '🏨 พักสองจ่ายหนึ่ง ช่วงต้นปี', '<p>จองวันนี้ พักสองคืนจ่ายคืนเดียว พร้อมอาหารเช้า</p><p>เหมาะกับทริปทีมบัญชี ☁️</p>'],
  () => ['ร้านเครื่องเขียนดาวเรือง', '✏️ ปากกาเจล 3 ด้าม 25 บาท', '<p>ใครใช้ปากกาเยอะ ต้องมา! สมุดบัญชี แฟ้มเอกสาร ลดทุกชิ้น</p>'],
  () => ['คาเฟ่เมฆ', '☕ ซื้อ 1 แถม 1 วันศุกร์นี้', '<p>กาแฟแก้วที่สองฟรี เมื่อแสดงอีเมลนี้ที่ร้าน</p><p><small>(ในเกมเท่านั้น)</small></p>'],
  () => ['บัตรเครดิตน้อย', `💳 คืนเงิน ${pick([3, 5, 10])}% ค่าน้ำมัน`, '<p>สมัครบัตรวันนี้รับเครดิตเงินคืน ข้อมูลสมมุติ ไม่มีบัตรจริงในเกมนะ</p>'],
  () => ['สปาแมวหง่าว', '💆 นวดคลายเมื่อย ลด 35%', '<p>นั่งโต๊ะทำงานมาทั้งวัน ไหล่ตึงไหม? มานวดกันเถอะ</p>'],
];
const MAIL_NEWS = [
  () => ['ข่าวน้อย', '📰 ตลาดหุ้นเมืองแมวทรงตัว', '<p>นักลงทุนจับตาตัวเลขเศรษฐกิจรอบใหม่ ราคากาแฟและขนมหวานยังเป็นขาขึ้น</p><p><small>ข่าวสมมุติในเกม</small></p>'],
  () => ['ข่าวน้อย', '🌦️ พยากรณ์อากาศสัปดาห์นี้', `<p>ฟ้าใสสลับฝนโปรยในช่วงบ่าย พกร่มไว้ก็ดีนะ ☂️ อุณหภูมิ ${pick([27, 29, 31, 33])} องศา</p>`],
  () => ['นิตยสารมนุษย์ออฟฟิศ', '💡 5 วิธีจัดโต๊ะให้ทำงานไหลลื่น', '<p>1) เก็บของที่ไม่ใช้ 2) แปะโพสต์อิทเฉพาะเรื่องสำคัญ 3) แยกโฟลเดอร์ให้ชัด 4) จิบน้ำบ่อยๆ 5) ลุกยืดเส้นทุกชั่วโมง</p>'],
  () => ['ข่าวน้อย', '🚇 รถไฟฟ้าปรับเวลาเดินรถ', '<p>ช่วงสุดสัปดาห์นี้รถไฟฟ้าสายสีชมพูเดินรถถึงเที่ยงคืนครึ่ง วางแผนกลับบ้านกันด้วยนะ</p>'],
  () => ['เพื่อนบ้านใจดี', '🏘️ ประกาศจากนิติบุคคลหอพัก', '<p>ขอความร่วมมือลดเสียงหลัง 4 ทุ่ม และทิ้งขยะให้ตรงเวลา ขอบคุณค่ะ</p>'],
  () => ['จดหมายข่าวคนทำบัญชี', '🧮 เคล็ดลับ Excel วันนี้', '<p>ลองกด <b>Ctrl + ;</b> เพื่อใส่วันที่วันนี้ลงช่อง หรือใช้ <b>=SUM(B2:B6)</b> รวมยอดเร็วๆ</p>'],
];
const MAIL_WORK = [
  () => { const n = Math.round((3000 + Math.random() * 30000) / 10) * 10; return ['บริษัท แป้งนุ่ม จำกัด', `ขอใบแจ้งหนี้ล่วงหน้า ยอดประมาณ ${baht(n)} บาท`, `<p>เรียนทีมบัญชี</p><p>เดือนนี้ขอใบแจ้งหนี้ล่วงหน้า ยอดประมาณ <b>${baht(n)} บาท</b> ช่วยส่งให้ภายในสัปดาห์นี้ได้ไหมครับ</p><p>ขอบคุณครับ<br>ฝ่ายจัดซื้อ แป้งนุ่ม</p>`]; },
  () => ['สำนักงานสอบบัญชี ดาวเด่น', 'นัดตรวจสอบเอกสารปลายเดือน', '<p>สวัสดีค่ะ ทางเราขอนัดเข้าตรวจเอกสารต้นทุนและสต๊อกปลายเดือนนี้ รบกวนเตรียมไฟล์ใส่โฟลเดอร์ให้เรียบร้อยด้วยนะคะ 📂</p>'],
  () => ['ร้านเครื่องเขียนดาวเรือง', 'ใบเสร็จรับเงิน (ตัวสำเนา) แนบมาให้แล้ว', '<p>ส่งสำเนาใบเสร็จเดือนก่อนตามที่ขอ ตรวจสอบยอดแล้วแจ้งกลับได้เลยนะคะ</p>'],
  () => ['คุณขนม (ลูกค้า)', 'ขอเลื่อนส่งเอกสารไปวันพรุ่งนี้', '<p>ขอโทษด้วยนะคะ เอกสารยังไม่ครบ ขอส่งพรุ่งนี้ช่วงบ่ายได้ไหมคะ 🙏</p>'],
  () => ['บริษัท ปลาทอง โลจิสติกส์', 'สอบถามราคาบริการทำบัญชีรายเดือน', '<p>สนใจใช้บริการทำบัญชีและยื่นภาษีรายเดือน มีเอกสารประมาณ 80 ใบ/เดือน ขอใบเสนอราคาด้วยครับ</p>'],
  () => ['ธนาคารน้อย', 'แจ้งยอดบัญชีและรายการเดินบัญชี', '<p>รายการล่าสุดพร้อมให้ตรวจสอบในแอปธนาคารน้อยแล้วนะคะ</p><p><small>อีเมลสมมุติจากธนาคารสมมุติ ไม่มีลิงก์ให้กด</small></p>'],
  () => ['ช้างน้อย เทค', 'ขอนัดคุยงานบริการวิเคราะห์ข้อมูล', '<p>ทีมเรามีงานจัดทำแดชบอร์ดให้ลูกค้า สนใจร่วมงานไหมครับ ว่างวันไหนบอกได้เลย</p>'],
];
function mailDaily(d) {
  if (d < bank.start) return; const wd = new Date(d).getDay(), wk = wd !== 0 && wd !== 6, T = (h) => d + h * 3600000 + Math.random() * 3000000;
  const add = (tpl, cat) => { const [f, s, b] = tpl(), imp = cat === 'work' && Math.random() < .5, at = T(7 + Math.random() * 12); mailPush(null, f, s, imp ? b + '<p><b>⭐ เรื่องสำคัญ รบกวนตอบกลับภายใน 2 วันนะคะ</b></p>' : b, cat, at, imp ? { imp: 1, due: at + 2 * 86400000 } : undefined); };
  if (wk && Math.random() < .75) add(pick(MAIL_WORK), 'work');
  if (Math.random() < .55) add(pick(MAIL_PROMO), 'promo');
  if (Math.random() < .45) add(pick(MAIL_NEWS), 'news');
}

/* ================= post-it notes (screen view or desk) ================= */
const notes = []; let noteSeq = 0;
const NOTE_COLORS = ['#fff59a', '#ffd1e1', '#c9f2d4', '#cfe6ff', '#ffe0b8'];
function addNote(view = currentView, text = '', x, y) {
  const sx = view === 'desk' ? 36 + Math.random() * 20 : 72 + Math.random() * 10, sy = view === 'desk' ? 20 + Math.random() * 20 : 30 + Math.random() * 10; // on the screen, start near the bottom-right corner so windows stay visible
  const n = { id: ++noteSeq, view, x: x ?? +sx.toFixed(1), y: y ?? +sy.toFixed(1), text, c: NOTE_COLORS[noteSeq % NOTE_COLORS.length], r: +(Math.random() * 6 - 3).toFixed(1) };
  notes.push(n); renderNote(n); if (view !== currentView) setView(view);
  const ta = document.querySelector(`.pnote[data-n="${n.id}"] textarea`); if (ta && !text) setTimeout(() => ta.focus(), 50);
  complete('postit'); checkMailNote(); S.tone(700, 1000, .06, .06); return n;
}
function renderNote(n) {
  let el = document.querySelector(`.pnote[data-n="${n.id}"]`);
  if (!el) {
    el = h('div', { class: 'pnote', 'data-n': n.id }, '<div class="pnh"><span>📌</span><button data-pcol aria-label="เปลี่ยนสี" title="เปลี่ยนสี">🎨</button><button data-pdel aria-label="ทิ้งโพสต์อิท" title="ทิ้ง">✕</button></div><textarea spellcheck="false" placeholder="จดอะไรก็ได้…"></textarea><i class="prz" title="ลากเพื่อปรับขนาด"></i>');
    (n.view === 'desk' ? $('desk') : $('vScreen')).append(el);
    const ta = el.querySelector('textarea'); ta.value = n.text;
    ta.addEventListener('input', () => { n.text = ta.value; fitNote(n); checkMailNote(); });
    el.addEventListener('click', e => {
      if (e.target.closest('[data-pcol]')) { n.c = NOTE_COLORS[(NOTE_COLORS.indexOf(n.c) + 1) % NOTE_COLORS.length]; renderNote(n); }
      if (e.target.closest('[data-pdel]')) { notes.splice(notes.indexOf(n), 1); el.remove(); S.noise(.15, 2500, .05, 'highpass'); }
    });
  }
  el.style.left = n.x + '%'; el.style.top = n.y + '%'; el.style.background = n.c; el.style.transform = `rotate(${n.r}deg)`;
  fitNote(n);
}
// size: the note keeps the size the player dragged it to, and grows taller by itself so text never needs a scrollbar
function fitNote(n) {
  const el = document.querySelector(`.pnote[data-n="${n.id}"]`); if (!el) return;
  const ta = el.querySelector('textarea'), w = n.w || 160, hgt = n.h || 128;
  el.style.width = w + 'px'; ta.style.height = '0px';
  ta.style.height = Math.max(hgt - 34, ta.scrollHeight) + 'px';
}
let noteSize = null;
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.pnote .prz'); if (!hd) return;
  const el = hd.parentElement, n = notes.find(x => x.id === +el.dataset.n);
  noteSize = { n, el, x0: e.clientX, y0: e.clientY, w0: n.w || 160, h0: Math.max(n.h || 128, el.offsetHeight) }; e.preventDefault(); e.stopPropagation(); el.classList.add('lift');
}, true);
addEventListener('pointermove', e => {
  if (!noteSize) return; const { n, x0, y0, w0, h0 } = noteSize;
  n.w = Math.round(clamp(w0 + e.clientX - x0, 110, 520)); n.h = Math.round(clamp(h0 + e.clientY - y0, 80, 560)); fitNote(n);
});
addEventListener('pointerup', () => { if (noteSize) { noteSize.el.classList.remove('lift'); noteSize = null; } });
let noteDrag = null;
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.pnote .pnh'); if (!hd || e.target.closest('button')) return;
  const el = hd.parentElement, n = notes.find(x => x.id === +el.dataset.n), r = el.parentElement.getBoundingClientRect(), er = el.getBoundingClientRect();
  noteDrag = { n, el, r, dx: e.clientX - er.left, dy: e.clientY - er.top }; el.classList.add('lift'); e.preventDefault();
});
addEventListener('pointermove', e => {
  if (!noteDrag) return; const { n, r, dx, dy } = noteDrag;
  n.x = +clamp((e.clientX - dx - r.left) / r.width * 100, -2, 92).toFixed(2); n.y = +clamp((e.clientY - dy - r.top) / r.height * 100, 0, 88).toFixed(2); renderNote(n);
});
addEventListener('pointerup', () => { if (noteDrag) { noteDrag.el.classList.remove('lift'); noteDrag = null; S.noise(.05, 1800, .03); } });
function checkMailNote() { if (mail.accounts.some(a => notes.some(n => n.text.toLowerCase().includes(a.email)))) complete('mail'); }
$('noteBtn').addEventListener('click', () => addNote());
