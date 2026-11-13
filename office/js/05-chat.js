"use strict";
// Office game — chat app. Files load in order and share one global scope (see office/index.html).
/* ================= chat app ================= */
const PEOPLE = { boss: { n: 'หัวหน้าแมว', c: '#ffd2a6', e: '🐱' }, bear: { n: 'น้องหมี', c: '#e8cfb4', e: '🐻' }, bun: { n: 'พี่กระต่าย', c: '#ffd6e3', e: '🐰' }, duck: { n: 'เป็ดน้อย', c: '#fff1a8', e: '🐥' }, mom: { n: 'แม่', c: '#ffd6e3', e: '👩' }, dad: { n: 'พ่อ', c: '#d9ecff', e: '👨' }, sis: { n: 'น้องสาว', c: '#ffe1f0', e: '👧' }, bro: { n: 'พี่ชาย', c: '#dfe8ff', e: '🧑' }, hr: { n: 'พี่ HR', c: '#e6dcff', e: '👩‍💼' }, cust: { n: 'คุณขนม (ลูกค้า)', c: '#ffe1ec', e: '🍰' }, jib: { n: 'น้องเจี๊ยบ (รุ่นน้อง)', c: '#fff6c2', e: '🐣' }, fon: { n: 'ฝน (ฝ่ายขาย)', c: '#ffe0c8', e: '🦊' }, mint: { n: 'มิ้นท์ (การตลาด)', c: '#e0f5e0', e: '🐼' } };
const chat = {
  account: null, cur: 'g', W: null,
  list: [
    { id: 'g', n: 'ทีมบัญชีน่ารัก', group: true, members: ['boss', 'bear', 'bun', 'duck'], unread: 2, msgs: [{ from: 'boss', text: 'ทุกคน ปีใหม่นี้ไปเที่ยวกัน 🎉 ใครหาที่พักได้ ส่งมาในกลุ่มเลยนะ งบรวมไม่เกิน 40,000' }, { from: 'duck', text: 'เย้ๆๆ อยากไปทะเล 🏖️' }] },
    { id: 'boss', n: 'หัวหน้าแมว', members: ['boss'], unread: 1, msgs: [{ from: 'boss', text: 'หาที่พักเสร็จแล้ว ส่งไฟล์สรุปราคามาให้พี่ทางนี้นะ' }] },
    { id: 'cust', n: 'ลูกค้า: ร้านขนมอร่อย', members: ['cust'], unread: 4, msgs: [{ from: 'cust', text: 'สวัสดีค่ะ ส่งเอกสารเดือน ม.ค. มาให้นะคะ ฝากบันทึกด้วยค่ะ 🙏' }, ...['c1', 'c2', 'c3'].map(id => ({ from: 'cust', file: { id, name: { c1: 'ใบแจ้งหนี้-แป้งนุ่ม.pdf', c2: 'ใบเสร็จ-เครื่องเขียนดาวเรือง.pdf', c3: 'บิลค่าน้ำมัน-ปั๊มใจดี.pdf' }[id], type: 'pdf' } }))] },
    { id: 'jib', n: 'น้องเจี๊ยบ (รุ่นน้อง)', members: ['jib'], unread: 1, msgs: [{ from: 'jib', text: 'สวัสดีค่ะพี่ หนูเจี๊ยบ เด็กใหม่ฝ่ายบัญชีค่ะ 🐣 ถ้าสงสัยอะไรจะทักมาถามเรื่อยๆ นะคะ ขอบคุณล่วงหน้าค่ะ 🙏' }] },
    { id: 'bear', n: 'น้องหมี', members: ['bear'], unread: 1, msgs: [{ from: 'bear', text: 'พี่ๆ เที่ยงนี้กินอะไรดี 🍜 สั่งในแอปหิวแล้วกันไหม' }] },
    { id: 'gang', n: 'แก๊งเม้าท์มอย', group: true, e: '🤫', members: ['fon', 'mint'], unread: 2, msgs: [{ from: 'fon', text: 'เมื่อเช้าหัวหน้าแมวมาสายอีกแล้ว แต่ไปดุคนอื่นเรื่องมาสาย 🙄' }, { from: 'mint', text: 'ชู่ว เบาๆ 555 แกระวังส่งผิดห้องนะ' }] },
    { id: 'hr', n: 'พี่ HR', members: ['hr'], unread: 1, msgs: [{ from: 'hr', text: 'สวัสดีค่ะ ช่วงนี้ประเมินผลประจำปีแล้วนะคะ ถ้าอยากคุยเรื่องปรับเงินเดือน พิมพ์มาได้เลยค่ะ 😊' }] },
    { id: 'mom', n: 'แม่ 💕', members: ['mom'], unread: 2, msgs: [{ from: 'mom', text: 'ลูก กินข้าวเที่ยงยัง 🍚' }, { from: 'mom', text: 'วันหยุดกลับบ้านไหม แม่จะทำแกงเขียวหวานให้' }] },
    { id: 'dad', n: 'พ่อ', members: ['dad'], unread: 2, msgs: [{ from: 'dad', img: FLOWER }, { from: 'dad', text: 'สวัสดีวันศุกร์ครับ ขอให้ลูกมีความสุข' }] },
    { id: 'sis', n: 'น้องสาว', members: ['sis'], unread: 1, msgs: [{ from: 'sis', text: 'พี่ๆ ปีใหม่ซื้อตุ๊กตาหมีให้หน่อยได้ม้าย 🥺 มีในเสิร์ชน้อยแท็บช็อปปิ้งเลย' }] },
    { id: 'bro', n: 'พี่ชาย', members: ['bro'], unread: 1, msgs: [{ from: 'bro', text: 'คืนนี้ว่างป่าว ทุบตุ่นใน "เกมน้อย" พี่ได้ 30 แต้มนะ 😎 แข่งกันมะ' }] },
  ],
};
const curChat = () => chat.list.find(c => c.id === chat.cur);
function openChat() {
  if (chat.W && wins.has('chat')) focusWin(chat.W);
  else {
    chat.W = openWin('chat', 'แชทน้อย', h('div', { class: 'chwrap' }), 640, 430, '#d9f5e2'); chat.W.chat = true;
    chat.W.onClose = () => { chat.W = null; };
    chat.account ? buildChat() : buildSignup();
  }
  if (!chat.account) { S.toast('ต้องสมัครแชทน้อยก่อนนะ ใช้อีเมลที่สร้างเองในเสิร์ชน้อย (แท็บอีเมล)', 2.6); return false; }
  return true;
}
function buildSignup() {
  const box = chat.W.body.firstChild; box.innerHTML = `<form class="signup" autocomplete="off"><div class="lg">แชทน้อย</div><div style="color:var(--soft)">สมัครด้วยอีเมลที่สร้างในเสิร์ชน้อย (แท็บอีเมล)</div>${WARN_BIG}
    <input name="em" type="text" placeholder="อีเมล เช่น ชื่อ@mewnoi.test" spellcheck="false" autocapitalize="off"><input name="pw" type="password" placeholder="รหัสผ่าน"><input name="nm" type="text" placeholder="ชื่อที่แสดง เช่น น้องใหม่" spellcheck="false">
    <div class="err"></div><button class="btn2 grn" type="submit">สร้างบัญชีใหม่</button><button class="btn2" type="button" data-desk>📧 ยังไม่มีอีเมล? ไปสร้างในเสิร์ชน้อย</button></form>`;
  const fm = box.querySelector('form');
  fm.addEventListener('submit', e => { e.preventDefault(); trySignup(fm); });
  fm.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); const ins = [...fm.querySelectorAll('input')], i = ins.indexOf(e.target); if (i < ins.length - 1) ins[i + 1].focus(); else trySignup(fm); } });
  fm.querySelector('[data-desk]').addEventListener('click', () => openSearch('mail'));
  setTimeout(() => fm.em.focus(), 60);
}
function trySignup(fm) {
  const em = fm.em.value.trim().toLowerCase(), pw = fm.pw.value.trim(), err = fm.querySelector('.err');
  if (!em || !pw) { err.textContent = 'กรอกอีเมลกับรหัสผ่านก่อนนะ'; return; }
  const acc = mail.accounts.find(a => a.email === em), no = t => { err.textContent = t; S.tone(300, 200, .15, .08); };
  if (!mail.accounts.length) return no('ยังไม่มีอีเมลในเกมเลย ไปสร้างในเสิร์ชน้อย แท็บอีเมลก่อนนะ');
  if (!em.endsWith('@' + MAIL_DOMAIN)) return no(`ใช้อีเมลสมมุติที่สร้างในเกมเท่านั้น (ลงท้าย @${MAIL_DOMAIN}) ห้ามใช้อีเมลจริง`);
  if (!acc) return no('ไม่พบอีเมลนี้ในเมลน้อย ลองดูโพสต์อิทที่จดไว้');
  if (pw !== acc.pass) return no('รหัสผ่านไม่ตรงกับที่ตั้งไว้ ลองดูโพสต์อิทที่จดไว้');
  chat.account = { email: em, name: fm.nm.value.trim() || 'น้องใหม่' };
  mailPush(em, 'แชทน้อย', 'ยืนยันการสมัครแชทน้อย ✅', `<p>สมัครแชทน้อยเรียบร้อยแล้ว ชื่อที่แสดงคือ <b>${esc(chat.account.name)}</b></p><p>ทีมบัญชีน่ารักรออยู่ในกลุ่มแล้วนะ 💚</p>`);
  S.jingle(); complete('signup'); buildChat(); syncTaskbar(); S.toast(`สมัครสำเร็จ! ยินดีต้อนรับ ${chat.account.name}`, 2);
}
function buildChat() {
  const box = chat.W.body.firstChild;
  box.innerHTML = `<div class="ch"><div class="side"><div class="meb"><div class="av" style="--c:#c8f0d4">🙂</div><div><b>${esc(chat.account.name)}</b><small style="display:block;color:var(--soft);font-size:11px">${esc(chat.account.email)}</small></div></div><div class="lst"></div></div>
    <div class="conv"><div class="ttl"></div><div class="msgs"></div><div class="typing"></div><div class="comp"><button class="att" title="แนบรูปหรือไฟล์">📎</button><input type="text" placeholder="พิมพ์ข้อความ…" spellcheck="false"><button class="snd">ส่ง</button></div></div></div>`;
  const inp = box.querySelector('.comp input');
  const send = () => { const t = inp.value.trim(); if (!t) return; inp.value = ''; sendMsg({ text: t }); };
  box.querySelector('.snd').addEventListener('click', send);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  box.querySelector('.att').addEventListener('click', togglePicker);
  box.addEventListener('click', e => { const d = e.target.closest('[data-dl]'); if (d) downloadChatFile(d.dataset.dl); });
  box.querySelector('.lst').addEventListener('click', e => { const it = e.target.closest('[data-c]'); if (it) { chat.cur = it.dataset.c; renderChat(); inp.focus(); } });
  renderChat();
}
function togglePicker() {
  const comp = chat.W.body.querySelector('.comp'), old = comp.querySelector('.pick'); if (old) { old.remove(); return; }
  const files = FILES.filter(f => f.loc !== 'trash'), imgs = files.filter(f => f.src), docs = files.filter(f => !f.src);
  const row = f => `<button data-f="${f.id}">${f.src ? `<img src="${esc(f.src)}" style="width:28px;height:22px;object-fit:cover;border-radius:4px" referrerpolicy="no-referrer">` : `<i class="ab" style="--c:${TYPES[f.type][1]}">${TYPES[f.type][0]}</i>`}<span>${esc(f.name)}</span></button>`;
  const p = h('div', { class: 'pick' }, `<h5>ไฟล์งาน</h5>${docs.map(row).join('')}<h5>รูปภาพ</h5>${imgs.map(row).join('')}`);
  p.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { p.remove(); sendFile(FILES.find(f => f.id === b.dataset.f)); } });
  comp.append(p);
}
function msgHTML(m) {
  let body = '';
  if (m.text) body = esc(m.text);
  if (m.img) body = `<img src="${esc(m.img)}" alt="" referrerpolicy="no-referrer">`;
  if (m.file) body = `<div class="fl"><i class="ab" style="--c:${TYPES[m.file.type][1]};width:30px;height:30px;line-height:30px">${TYPES[m.file.type][0]}</i><div><b style="font-weight:500">${esc(m.file.name)}</b><br>${m.from !== 'me' && CDOCS[m.file.id] ? `<button class="dl" data-dl="${m.file.id}">⬇ ดาวน์โหลด</button>` : '<small style="color:var(--soft)">ไฟล์แนบ</small>'}</div></div>`;
  if (m.hotel) { const x = HOTELS.find(y => y.id === m.hotel); body = `<div class="hcard">${hotelArt(x.art)}<b style="font-weight:500">${esc(x.name)}</b><span><span class="pr">฿${baht(x.price)}</span> / ห้อง / คืน</span></div>`; }
  const p = PEOPLE[m.from], mine = m.from === 'me';
  return `<div class="m ${mine ? 'mine' : ''}">${mine ? '' : `<div class="av" style="--c:${p.c}">${p.e}</div>`}<div class="col">${mine ? '' : `<div class="who">${p.n}</div>`}<div class="bb">${body}</div>${m.likes && m.likes.length ? `<span class="lk">❤️ ${m.likes.length} · ${m.likes.map(k => PEOPLE[k].e).join('')}</span>` : ''}</div></div>`;
}
function chatListHTML(cur, attr) {
  return chat.list.filter(x => !x.hidden).map(x => { const last = x.msgs[x.msgs.length - 1]; const lt = !last ? '' : last.text || (last.img ? '[รูปภาพ]' : last.file ? '[ไฟล์] ' + last.file.name : last.hotel ? '[ที่พัก]' : ''); const P = PEOPLE[x.id]; return `<div class="it ${x.id === cur ? 'on' : ''}" ${attr}="${x.id}"><div class="av" style="--c:${x.group ? '#c8f0d4' : P.c}">${x.group ? x.e || '👥' : P.e}</div><div><b style="font-weight:500">${esc(x.n)}</b><small>${esc(lt)}</small></div>${x.unread ? `<span class="badge">${x.unread}</span>` : ''}</div>`; }).join('');
}
function renderChat() {
  renderPhone(); syncTaskbar(); if (!chat.W || !chat.account) return;
  const box = chat.W.body, c = curChat(); c.unread = 0; syncTaskbar();
  box.querySelector('.lst').innerHTML = chatListHTML(chat.cur, 'data-c');
  box.querySelector('.ttl').textContent = c.n + (c.group ? ` (${c.members.length + 1})` : '');
  const ms = box.querySelector('.msgs'); ms.innerHTML = c.msgs.map(msgHTML).join(''); ms.scrollTop = ms.scrollHeight;
  box.querySelector('.typing').textContent = c.typing ? `${PEOPLE[c.typing].n} กำลังพิมพ์…` : '';
}
function sendFile(f) {
  if (!chat.account) { openChat(); return; }
  if (f.src) sendMsg({ img: f.src, tag: f.tag || f.name }); else sendMsg({ file: { id: f.id, name: f.name, type: f.type } });
}
function sendMsg(m, c = curChat()) {
  if (!c) return; m.from = 'me'; m.likes = []; c.msgs.push(m); renderChat(); S.tone(900, 1200, .06, .06);
  react(c, m);
}
// friendly bot replies: likes + a few words, a short "typing…" first
function later(c, ms, fn) { setTimeout(fn, ms); }
function say(c, who, text, at, extra = {}) {
  later(c, at - 900, () => { c.typing = who; if (chat.cur === c.id) renderChat(); });
  later(c, at, () => {
    c.typing = null; c.msgs.push({ from: who, text, likes: [], ...extra }); if (c.hidden) { c.hidden = false; c.forced = true; }
    if (!viewing(c)) { c.unread++; S.toast(`💬 ${PEOPLE[who].n}: ${text}`, 2.4); phoneBuzz(); }
    renderChat(); S.tone(1046, 1318, .07, .07, 'triangle');
  });
}
function like(c, m, who, at) { later(c, at, () => { if (!m.likes.includes(who)) m.likes.push(who); renderChat(); S.tone(1200, 1500, .05, .05); }); }
const viewing = c => (chat.W && chat.account && chat.cur === c.id) || (phone.open && phone.cur === c.id);
function react(c, m) {
  if (typeof emailAsk === 'function' && emailAsk(c, m)) return;
  if (m.text && /ยืม/.test(m.text) && !/คืน|ให้ยืม/.test(m.text) && !['hr', 'cust'].includes(c.id) && !c.id.startsWith('co-')) { borrowAsk(c, m); return; }
  const H = PERSONAL[c.id] || (c.id.startsWith('co-') ? PERSONAL.co : null); if (H) { H(c, m); return; }
  if (c.id === 'g' && m.text && /หัวหน้า/.test(m.text) && /สาย|ดุ|บ่น|นินทา|ขี้|เม้าท์|เบื่อ|เหวี่ยง|งานเยอะ/.test(m.text)) { say(c, 'boss', 'พี่อ่านอยู่นะ 👀', 1700); say(c, 'duck', '😳😳😳', 2800); say(c, 'bun', 'ส่งผิดห้องป่าวเนี่ย 555', 4000); return; }
  const ppl = c.members, hotelId = m.hotel || (m.text && HOTELS.find(x => m.text.includes(x.key))?.id);
  if (hotelId) {
    const x = HOTELS.find(y => y.id === hotelId), tot = HOTEL_TOTAL(x);
    if (c.group) {
      ['bun', 'duck', 'bear'].forEach((k, i) => like(c, m, k, 700 + i * 500));
      say(c, 'duck', 'เริ่ด! 😍', 1800); say(c, 'bun', 'ดีเลย 👍 ที่นี่น่าไปมาก', 3300); say(c, 'bear', 'ลองดูๆ ใครจองห้องติดกันบ้าง', 4800);
      like(c, m, 'boss', 5600);
      say(c, 'boss', tot <= 40000 ? `6 ห้อง 2 คืน รวม ${baht(tot)} บาท อยู่ในงบ เยี่ยมมาก 👍 ส่งไฟล์สรุปมาที่แชทพี่ด้วยนะ` : `สวยนะ แต่ 6 ห้อง 2 คืน รวม ${baht(tot)} บาท เกินงบ 40,000 ไปหน่อย ลองหาอีกที่ไหม`, 7000);
      complete('propose'); if (tot <= 40000) tripHotel = x;
    } else say(c, ppl[0], 'น่าไปมาก! ส่งในกลุ่มทีมด้วยสิ ทุกคนจะได้เห็น', 1600);
    return;
  }
  if (m.img) {
    const cute = ANIMAL.test(m.tag || '') || ANIMAL.test(EN[m.tag] || '');
    ppl.slice(0, 3).forEach((k, i) => like(c, m, k, 600 + i * 450));
    if (cute) { say(c, c.group ? 'duck' : ppl[0], 'น่ารักกกก 😻 ใจละลาย', 1700); if (c.group) say(c, 'bun', 'ขอเซฟไปตั้งหน้าจอนะ 🥰', 3200); }
    else say(c, c.group ? 'bun' : ppl[0], pick(['สวยจัง ✨', 'รูปนี้ดีมาก', 'อยากไปที่นี่บ้าง']), 1800);
    return;
  }
  if (m.file) {
    const f = FILES.find(x => x.id === m.file.id);
    if (c.id === 'boss') {
      like(c, m, 'boss', 800);
      if (f && f.book && f.book.tpl === 'trip') {
        const t = tripTotal(f.book);
        if (t) { say(c, 'boss', `รับเอกสารแล้วนะ ทำได้ดีมาก 👍 ${t.ho.name} รวม ${baht(t.total)} บาท เดี๋ยวพี่เอาไปเสนอผู้บริหารเลย`, 2200); complete('boss'); }
        else say(c, 'boss', 'รับเอกสารแล้วนะ แต่ในไฟล์ยังไม่มีชื่อที่พักกับสูตรราคารวมเลย กรอกให้ครบแล้วส่งมาใหม่นะ 😺', 2200);
      } else say(c, 'boss', pick(['รับเอกสารแล้วนะ ทำได้ดี 👍', 'ได้รับแล้ว ขอบใจมาก เดี๋ยวพี่ตรวจให้นะ']), 2000);
    } else if (c.group) say(c, 'boss', 'เรื่องงานส่งมาที่แชทพี่ตรงๆ ได้เลยนะ 😺', 1900);
    else say(c, ppl[0], 'ได้รับไฟล์แล้ว ขอบคุณน้า 🙏', 1700);
    return;
  }
  const t = m.text || '';
  if (/สวัสดี|หวัดดี|hello|hi\b/i.test(t)) { say(c, c.group ? 'duck' : ppl[0], 'สวัสดีจ้า 👋 ยินดีต้อนรับน้องใหม่', 1500); if (c.group) say(c, 'bun', 'หวัดดีๆ 😊', 2800); return; }
  if (/กิน|ข้าว|หิว|ก๋วยเตี๋ยว|ส้มตำ|ชาไข่มุก/.test(t)) { say(c, c.group ? 'bear' : ppl[0], 'หิวเหมือนกัน 🤤 สั่งในแอปหิวแล้วเลย!', 1600); return; }
  if (/ขอบคุณ|ขอบใจ|thank/i.test(t)) { like(c, m, ppl[0], 700); say(c, ppl[0], 'ด้วยความยินดีจ้า 💕', 1600); return; }
  if (c.id === 'boss') { say(c, 'boss', pick(['รับทราบ 👍', 'โอเคจ้า', 'ได้เลย สู้ๆ นะ 💪']), 1600); return; }
  if (Math.random() < .75) { const k = pick(ppl); if (Math.random() < .5) like(c, m, k, 700); say(c, k, pick(['555 จริง', 'เห็นด้วย 👍', 'โอเคเลย', 'น่าสนใจ ✨', 'จ้า 😊']), 1700); }
}
