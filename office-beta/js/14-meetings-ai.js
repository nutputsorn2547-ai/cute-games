"use strict";
// Office game — meetings and AI helper. Files load in order and share one global scope (see office/index.html).
/* ================= meetings that need documents ================= */
FOLDERS.push({ id: 'meet', name: 'เอกสารประชุม', c: '#ffe08a', c2: '#f2c14e' });
FILES.push({ id: 'tpl1', name: 'เทมเพลต-สรุปทริป.doc', type: 'doc', kind: 'tpl', tplType: 'trip', loc: 'work', html: `<div class="paper"><h3>📄 เทมเพลตทีม: สรุปทริปบริษัท</h3><p>1. ที่พักที่เปรียบเทียบ: {{ตารางที่พัก}}<br>2. ที่พักที่เลือก: {{ที่พัก}} · ราคารวม {{ราคารวม}}<br>3. งบคงเหลือ: {{งบคงเหลือ}}<br>4. ข้อเสนอแนะ: {{ข้อเสนอ}}</p><p style="color:#888">วิธีใช้กับน้องเอไอ: ลากเทมเพลตนี้ + ทริปปีใหม่.xlsx + ไฟล์ข้อมูลที่พักทุกไฟล์ แล้วพิมพ์ "ทำสรุปทริป"</p></div>` });
FILES.push({ id: 'tpl2', name: 'เทมเพลต-วาระประชุม.doc', type: 'doc', kind: 'tpl', tplType: 'agenda', loc: 'work', html: `<div class="paper"><h3>📄 เทมเพลตทีม: วาระการประชุม</h3><p>หัวข้อ: {{ชื่อการประชุม}}<br>วันที่ / เวลา: {{วันเวลา}}<br>วาระ: {{รายการวาระ}}<br>เอกสารประกอบ: {{เอกสาร}}</p><p style="color:#888">วิธีใช้กับน้องเอไอ: ลากเทมเพลตนี้ไปให้ แล้วพิมพ์ "ทำวาระประชุม"</p></div>` });
const sumOk = f => f.id === 'x1' && (f.book.cells.B8 || '')[0] === '=' && value(f.book, 'B8') === 2059;
const MEETS = [
  { id: 'm1', t: 'ประชุมงบประมาณประจำเดือน', short: 'งบประมาณ', d: bank.start + 5 * DAY, agenda: ['สรุปค่าใช้จ่ายสำนักงานเดือนที่ผ่านมา', 'ติดตามใบเสร็จที่ยังไม่ส่ง', 'แผนลดค่าใช้จ่าย (เช่น ปิดแอร์ตอนพักเที่ยง)'],
    req: [{ n: 'ค่าใช้จ่าย.xlsx (ใส่สูตรรวมยอดที่ B8 แล้ว)', ok: sumOk }, { n: 'วาระประชุม-งบประมาณ.doc (ให้น้องเอไอทำ)', ok: f => f.agendaFor === 'm1' }] },
  { id: 'm2', t: 'ประชุมวางแผนทริปปีใหม่', short: 'ทริปปีใหม่', d: bank.start + 13 * DAY, agenda: ['เลือกที่พักทริปปีใหม่', 'สรุปงบประมาณค่าที่พัก', 'แบ่งหน้าที่จองรถและห้องพัก'],
    req: [{ n: 'ทริปปีใหม่.xlsx (มีชื่อที่พัก + สูตรราคารวม)', ok: f => f.book && f.book.tpl === 'trip' && !!tripTotal(f.book) }, { n: 'สรุปทริปปีใหม่.doc (ให้น้องเอไอทำ)', ok: f => !!f.aiTrip }, { n: 'วาระประชุม-ทริปปีใหม่.doc (ให้น้องเอไอทำ)', ok: f => f.agendaFor === 'm2' }] },
];
const meetMissing = mt => mt.req.filter(r => !FILES.some(f => f.loc === 'meet' && r.ok(f)));
function scheduleMeet(mt, d, late) {
  mt.d = d;
  addEvent(d - DAY, '📋', 'เตรียมเอกสาร: ' + mt.short, 'prep', { a: mt.id });
  addEvent(d, '👥', mt.t + (late ? ' (เลื่อน)' : '') + ' 10:00', 'meet', { a: mt.id, meet: mt });
}
function holdMeeting(mt) {
  if (mt.done) return; const miss = meetMissing(mt);
  if (!miss.length) { mt.done = true; pushMsg('g', 'boss', `${mt.t} เรียบร้อย เอกสารครบมาก เก่งมาก 👍`, 1500); pushMsg('g', 'bun', 'ประชุมจบไว ดีใจจัง 🎉', 3000); complete('meet'); return; }
  let nd = new Date(mt.d + 2 * DAY + 3 * 3600000); while (nd.getDay() === 0 || nd.getDay() === 6) nd = new Date(nd.getTime() + DAY);
  scheduleMeet(mt, dayStart(nd), true); renderCal();
  pushMsg('boss', 'boss', `เอกสาร${mt.t}ยังไม่ครบนะ 😾 ขาด: ${miss.map(r => r.n).join(', ')} · เลื่อนประชุมไป ${thDate(nd, { weekday: 'short', day: 'numeric', month: 'short' })} เตรียมให้ครบนะ`, 1500);
  pushMsg('gang', 'fon', 'โดนเลื่อนประชุมเหรอแก 😬 สู้ๆ', 3500);
}
MEETS.forEach(mt => scheduleMeet(mt, mt.d));

/* ================= in-game AI helper ================= */
const ai = { W: null, tray: [], busy: false, msgs: [{ ai: 1, html: 'สวัสดีค่ะ น้องเอไอเอง 🤖✨ ช่วยทำเอกสารจากเทมเพลต เทียบราคา คำนวณ ปรึกษาทั่วไป หรือเล่นมุกก็ได้นะ<br><b>ลากไฟล์มาวางในหน้าต่างนี้</b> หรือกด 📎 เพื่อให้น้องใช้ไฟล์ได้' }] };
const AI_CHIPS = ['ช่วยอะไรได้บ้าง', 'ทำสรุปทริป', 'ทำวาระประชุม', 'เทียบราคา', 'เล่นมุกหน่อย', 'ชมหน่อย', 'ช่วยดูเรื่องเงิน', 'อยากย้ายหอ', 'คำนวณ 2800*6*2', 'ขอเคสลูกค้าใหม่'];
const JOKES = ['รู้ไหมทำไมเครื่องคิดเลขไม่เคยเหงา? เพราะมีคนมากด "บวก" ให้ทุกวัน ➕😆', 'Excel บอกคอลัมน์ว่าอะไร? "เธออยู่ในเซลล์ใจฉันเสมอ" 📊💕', 'หัวหน้าถามว่างานเสร็จยัง ฉันตอบว่า "เสร็จแล้วค่ะ… ในใจ" 🫠', 'ทำไมแมวชอบนั่งบนคีย์บอร์ด? เพราะอยากช่วยกด Ctrl+S ให้ไง 🐱💾', 'เงินเดือนออกวันที่ 25 แต่หายวันที่ 26 เพราะรีบไปหาเพื่อนชื่อ "บิล" 🧾💨', 'วันจันทร์กับกาแฟเป็นอะไรกัน? เป็นคู่ที่ขาดกันไม่ได้ ☕❤️', 'ประชุมที่ยาวที่สุดในโลกคือประชุมที่สรุปว่า "เดี๋ยวนัดประชุมใหม่" 😂'];
const PRAISE = ['วันนี้คุณทำงานเก่งมาก น้องเอไอยกนิ้วให้เลย 👍✨', 'ไฟล์เป็นระเบียบสุดๆ หัวหน้าต้องปลื้มแน่นอน 📁💖', 'คุณคือดาวเด่นของออฟฟิศวันนี้ 🌟', 'สูตร SUM ของคุณสวยที่สุดในตึก 📊😍', 'พักดื่มน้ำบ้างนะ คนเก่งต้องดูแลตัวเองด้วย 💧💕'];
function openAI() {
  if (ai.W && wins.has('ai')) { focusWin(ai.W); return ai.W; }
  const root = h('div', { class: 'aiw' }, `<div class="tray"></div><div class="ams"></div><div class="think"></div><div class="chips2">${AI_CHIPS.map(c => `<button data-aq="${c}">${c}</button>`).join('')}</div><div class="acomp"><button class="att" title="แนบไฟล์">📎</button><input type="text" placeholder="สั่งงานน้องเอไอ เช่น ทำสรุปทริป" spellcheck="false"><button class="snd">ส่ง</button></div>`);
  ai.W = openWin('ai', 'น้องเอไอ — ผู้ช่วยในเกม', root, 600, 470, '#efe6ff'); ai.W.ai = true; ai.W.onClose = () => { ai.W = null; }; ai.W.body.style.overflow = 'hidden';
  const inp = root.querySelector('.acomp input'), send = () => { const v = inp.value.trim(); if (!v) return; inp.value = ''; aiSend(v); };
  root.querySelector('.snd').addEventListener('click', send);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  root.addEventListener('click', e => {
    const t = e.target, q = t.closest('[data-aq]'); if (q) { aiSend(q.dataset.aq); return; }
    const rm = t.closest('[data-rm]'); if (rm) { ai.tray = ai.tray.filter(id => id !== rm.dataset.rm); renderAI(); return; }
    const op = t.closest('[data-open]'); if (op) { const f = FILES.find(x => x.id === op.dataset.open); if (f) openFile(f); return; }
    const tm = t.closest('[data-tomeet]'); if (tm) { const f = FILES.find(x => x.id === tm.dataset.tomeet); if (f) { moveFile(f, 'meet'); renderDesktop(); } return; }
    if (t.closest('.att')) aiPicker();
    const pf = t.closest('.pick [data-f]'); if (pf) { t.closest('.pick').remove(); aiAttach(FILES.find(f => f.id === pf.dataset.f)); }
  });
  renderAI(); setTimeout(() => inp.focus(), 50); return ai.W;
}
function aiPicker() {
  const comp = ai.W.body.querySelector('.acomp'), old = comp.querySelector('.pick'); if (old) { old.remove(); return; }
  const files = FILES.filter(f => f.loc !== 'trash' && !ai.tray.includes(f.id));
  comp.append(h('div', { class: 'pick' }, `<h5>เลือกไฟล์ให้น้องเอไอ</h5>${files.map(f => `<button data-f="${f.id}"><i class="ab" style="--c:${TYPES[f.type][1]}">${TYPES[f.type][0]}</i><span>${esc(f.name)}</span></button>`).join('')}`));
}
function aiAttach(f) {
  if (!f) return; openAI(); if (!ai.tray.includes(f.id)) ai.tray.push(f.id);
  S.tone(700, 1000, .06, .05); renderAI();
}
const trayFiles = () => ai.tray.map(id => FILES.find(f => f.id === id)).filter(Boolean);
function renderAI() {
  if (!ai.W) return; const root = ai.W.body.firstChild, tf = trayFiles();
  root.querySelector('.tray').innerHTML = tf.length ? '📂 ' + tf.map(f => `<span>${esc(f.name)}<button data-rm="${f.id}" aria-label="เอาออก">×</button></span>`).join('') : '<span class="hint2" style="background:none">📂 ลากไฟล์มาวางในหน้าต่างนี้ เพื่อให้น้องเอไอใช้</span>';
  const ms = root.querySelector('.ams');
  ms.innerHTML = ai.msgs.map(m => `<div class="am ${m.ai ? '' : 'me'}">${m.ai ? '<div class="av" style="--c:#e3d8ff">🤖</div>' : ''}<div class="bb">${m.ai ? m.html : esc(m.text)}</div></div>`).join('');
  ms.scrollTop = ms.scrollHeight;
  root.querySelector('.think').textContent = ai.busy ? 'น้องเอไอกำลังคิด…' : '';
}
function aiSend(text) {
  openAI(); ai.msgs.push({ text }); ai.busy = true; renderAI(); S.tone(900, 1100, .04, .04);
  setTimeout(() => { ai.busy = false; ai.msgs.push({ ai: 1, html: aiReply(text) }); renderAI(); S.tone(1046, 1318, .07, .06, 'triangle'); }, 700 + Math.random() * 600);
}
function aiDoc(name, html, extra) {
  let f = FILES.find(x => x.name === name && x.loc !== 'trash');
  if (!f) { f = { id: 'u' + (++uid), name, type: 'doc', kind: 'aidoc', loc: 'desk' }; FILES.push(f); deskPos[f.id] = firstFree(); }
  Object.assign(f, { html, ...extra }); closeWin('view-' + f.id, true); renderDesktop(); return f;
}
const docActs = f => `<div class="aacts"><button data-open="${f.id}">📄 เปิดดู</button><button data-tomeet="${f.id}">📁 ใส่โฟลเดอร์เอกสารประชุม</button></div>`;
function aiReply(raw) {
  const t = raw.trim(), tf = trayFiles();
  if (typeof csAIAsk === 'function') { const r = csAIAsk(t); if (r) return r; }
  if (/ช่วยอะไร|ทำอะไรได้|help|เมนู/i.test(t)) return 'น้องเอไอทำได้หลายอย่างเลย ✨<ul><li><b>ทำสรุปทริป</b> — ใช้เทมเพลตทีม + ทริปปีใหม่.xlsx + ไฟล์ข้อมูลที่พักทั้งหมด</li><li><b>ทำวาระประชุม</b> — ใช้เทมเพลตวาระประชุม กับนัดประชุมถัดไปในปฏิทิน</li><li><b>เทียบราคา</b> — ที่พักหรือหอพักจากไฟล์ที่ลากมา</li><li><b>คำนวณ</b> เช่น "คำนวณ 2800*6*2"</li><li>ปรึกษาเรื่องเงิน ย้ายหอ งาน หรือขอกำลังใจ เล่นมุก</li></ul>เทมเพลตอยู่ในโฟลเดอร์ <b>งานด่วน</b> นะ';
  if (/สรุป.*ทริป|ทริป.*สรุป/.test(t)) return aiTrip(tf);
  if (/วาระ|เอกสารประชุม|เตรียมประชุม/.test(t)) return aiAgenda(tf);
  if (/คำนวณ|^[\d\s.,+\-*/x×÷()]+$/.test(t) && /\d\s*[+\-*/x×÷]\s*\d/.test(t)) return aiCalc(t);
  if (/เทียบ|เปรียบเทียบ|ถูกสุด|ถูกที่สุด/.test(t)) return aiCompare(tf);
  if (/มุก|ตลก|ขำ|joke/i.test(t)) return pick(JOKES);
  if (/ชม|กำลังใจ|เก่งไหม/.test(t)) return pick(PRAISE);
  if (/เงิน|ออม|ใช้จ่าย|บิล|หนี้|งบ/.test(t)) return aiMoney();
  if (DORM_WORD.test(t) || /ย้าย/.test(t)) return aiDorm();
  if (/เหนื่อย|เครียด|ท้อ|เบื่อ/.test(t)) return 'เหนื่อยก็พักก่อนได้นะ 🫶 ลุกไปยืดเส้น ดื่มน้ำ แล้วค่อยทำต่อทีละอย่าง น้องเอไอเป็นกำลังใจให้เสมอ 💜';
  if (/หัวหน้า/.test(t)) return 'เรื่องหัวหน้า… น้องเอไอแนะนำให้คุยกันตรงๆ แบบสุภาพ และส่งงานให้ครบก่อนประชุมนะ 😺 แล้วอย่าเผลอนินทาในกลุ่มทีมล่ะ!';
  if (/งานใหม่|หางาน|ลาออก|สัมภาษณ์|เรซูเม่/.test(t)) return 'ถ้าจะหางานใหม่: อัปเดตเรซูเม่ในแคนวาน้อย → ส่งออก PDF → สมัครในจ๊อบน้อย 💼 ส่วนวันสัมภาษณ์จะขึ้นในปฏิทินให้เองนะ';
  if (/สวัสดี|หวัดดี|hello|hi\b/i.test(t)) return 'สวัสดีค่ะ 👋 วันนี้อยากให้น้องเอไอช่วยอะไรดี?';
  if (/ขอบคุณ|ขอบใจ|thank/i.test(t)) return 'ยินดีเสมอเลย 💜';
  return 'น้องเอไอเป็นผู้ช่วยในเกม ยังตอบเรื่องนี้ไม่ได้นะ 🙏 ลองพิมพ์ "ช่วยอะไรได้บ้าง" ดู';
}
function aiTrip(tf) {
  const tpl = tf.find(f => f.kind === 'tpl' && f.tplType === 'trip'), sheet = tf.find(f => f.book && f.book.tpl === 'trip'), hs = tf.filter(f => f.kind === 'hotelinfo'), miss = [];
  if (!tpl) miss.push('📄 เทมเพลต-สรุปทริป.doc (อยู่ในโฟลเดอร์ งานด่วน)');
  if (!sheet) miss.push('📊 ทริปปีใหม่.xlsx');
  else if (!tripTotal(sheet.book)) miss.push('📊 ทริปปีใหม่.xlsx ยังไม่มีชื่อที่พักกับสูตรราคารวม');
  if (hs.length < 2) miss.push(`🏨 ไฟล์ข้อมูลที่พักอย่างน้อย 2 แห่ง (ตอนนี้มี ${hs.length}) · กด "บันทึกข้อมูลที่พัก" ในเสิร์ชน้อย แท็บที่พัก`);
  if (miss.length) return `ยังทำไม่ได้นะ ไฟล์ยังไม่ครบ 🙏 ขาด:<ul>${miss.map(x => `<li>${x}</li>`).join('')}</ul>ลากไฟล์มาวางในหน้าต่างนี้ แล้วสั่งใหม่ได้เลย`;
  const tt = tripTotal(sheet.book), rows = hs.map(f => HOTELS.find(x => x.id === f.ref)).filter(Boolean).map(x => ({ x, tot: HOTEL_TOTAL(x) })).sort((a, b) => a.tot - b.tot);
  if (!rows.some(r => r.x.id === tt.ho.id)) rows.push({ x: tt.ho, tot: tt.total });
  const best = rows.find(r => r.tot <= 40000);
  const html = `<div class="paper"><h3>สรุปทริปปีใหม่บริษัท</h3><p style="color:#888;margin:0 0 8px">จากเทมเพลตทีม · จัดทำโดยน้องเอไอ · ${thDate(gnow(), { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    <p><b>1. ที่พักที่เปรียบเทียบ</b> (12 คน · 6 ห้อง · 2 คืน · งบ 40,000 บาท)</p><table><tr><th>ที่พัก</th><th>ห้อง/คืน</th><th>รวม</th></tr>${rows.map(r => `<tr><td>${esc(r.x.name)} ${r.tot <= 40000 ? '✅' : '❌ เกินงบ'}</td><td>${baht(r.x.price)}</td><td>${baht(r.tot)}</td></tr>`).join('')}</table>
    <p><b>2. ที่พักที่เลือก:</b> ${esc(tt.ho.name)} · ราคารวม ${baht(tt.total)} บาท</p><p><b>3. งบคงเหลือ:</b> ${baht(40000 - tt.total)} บาท ${tt.total > 40000 ? '(เกินงบ!)' : ''}</p>
    <p><b>4. ข้อเสนอแนะ:</b> ${best ? (best.x.id === tt.ho.id ? 'ที่พักที่เลือกถูกที่สุดในงบแล้ว เยี่ยมมาก 👍' : `ถ้าอยากประหยัด ${esc(best.x.name)} ถูกกว่า ${baht(tt.total - best.tot)} บาท`) : 'ทุกที่เกินงบ ลองหาที่พักเพิ่ม'}</p></div>`;
  const f = aiDoc('สรุปทริปปีใหม่.doc', html, { aiTrip: true }); complete('ai');
  return `เสร็จแล้ว! ✨ ทำ <b>สรุปทริปปีใหม่.doc</b> จากเทมเพลตทีมให้แล้ว (อยู่บนหน้าจอ)<br>เทียบ ${rows.length} ที่ · ที่เลือก ${esc(tt.ho.name)} รวม ${baht(tt.total)} บาท${docActs(f)}`;
}
function aiAgenda(tf) {
  const tpl = tf.find(f => f.kind === 'tpl' && f.tplType === 'agenda');
  if (!tpl) return 'ลากไฟล์ <b>เทมเพลต-วาระประชุม.doc</b> (อยู่ในโฟลเดอร์ งานด่วน) มาให้ก่อนนะ แล้วพิมพ์ "ทำวาระประชุม" อีกครั้ง 📄';
  const today = dayStart(gnow()), mt = MEETS.filter(m => !m.done && m.d >= today).sort((a, b) => a.d - b.d)[0];
  if (!mt) return 'ตอนนี้ไม่มีนัดประชุมในปฏิทินเลย 🎉';
  const html = `<div class="paper"><h3>วาระการประชุม: ${esc(mt.t)}</h3><p style="color:#888;margin:0 0 8px">จากเทมเพลตทีม · จัดทำโดยน้องเอไอ</p><p>วันที่ ${thDate(mt.d)} เวลา 10:00 น. · ห้องประชุมแมวเหมียว</p><p><b>วาระ</b></p><ol>${mt.agenda.map(a => `<li>${esc(a)}</li>`).join('')}</ol><p><b>เอกสารประกอบ</b></p><ul>${mt.req.map(r => `<li>${esc(r.n)}</li>`).join('')}</ul></div>`;
  const f = aiDoc(`วาระประชุม-${mt.short}.doc`, html, { agendaFor: mt.id });
  return `ทำ <b>วาระประชุม-${esc(mt.short)}.doc</b> ให้แล้ว 📋 สำหรับ ${esc(mt.t)} (${thDate(mt.d, { day: 'numeric', month: 'short' })})<br>อย่าลืมเอาเอกสารเหล่านี้ใส่โฟลเดอร์ <b>เอกสารประชุม</b>:<ul>${mt.req.map(r => `<li>${FILES.some(x => x.loc === 'meet' && r.ok(x)) ? '✅' : '⬜'} ${esc(r.n)}</li>`).join('')}</ul>${docActs(f)}`;
}
function aiCalc(t) {
  const ex = t.replace(/คำนวณ|เท่ากับ|=|\?/g, '').replace(/[x×]/g, '*').replace(/÷/g, '/').replace(/,/g, '').trim();
  if (!/^[\d\s.+\-*/()]+$/.test(ex)) return 'น้องเอไอคำนวณได้แค่ตัวเลขกับ + − × ÷ นะ เช่น "คำนวณ 2800*6*2"';
  try { const r = Function('"use strict";return (' + ex + ')')(); if (typeof r !== 'number' || !isFinite(r)) throw 0; return `${esc(ex)} = <b>${r.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</b> 🧮`; } catch (e) { return 'สูตรนี้น้องเอไออ่านไม่ออก ลองใหม่นะ 🙏'; }
}
function aiCompare(tf) {
  let hs = tf.filter(f => f.kind === 'hotelinfo').map(f => HOTELS.find(x => x.id === f.ref)).filter(Boolean);
  const ds = tf.filter(f => f.kind === 'dorminfo').map(f => DORMS.find(x => x.id === f.ref)).filter(Boolean);
  let out = '', note = '';
  if (!hs.length && !ds.length) { hs = HOTELS.slice(); note = '<small>(ยังไม่ได้ลากไฟล์มา เลยเทียบที่พักทั้งหมดจากเสิร์ชน้อยให้ก่อนนะ)</small><br>'; }
  if (hs.length) { const r = hs.map(x => ({ x, tot: HOTEL_TOTAL(x) })).sort((a, b) => a.tot - b.tot); out += `<b>🏨 ที่พักทริป (6 ห้อง × 2 คืน)</b><table>${r.map((o, i) => `<tr><td>${i === 0 ? '🥇 ' : ''}${esc(o.x.name)}</td><td>${baht(o.tot)}</td><td>${o.tot <= 40000 ? '✅' : '❌'}</td></tr>`).join('')}</table>ถูกสุดคือ <b>${esc(r[0].x.name)}</b>${r.find(o => o.tot <= 40000 && o.x.rate >= 4.7) ? ` · ถ้าเอาคะแนนดีด้วย ลอง ${esc(r.find(o => o.tot <= 40000 && o.x.rate >= 4.7).x.name)}` : ''}<br>`; }
  if (ds.length) { const r = ds.slice().sort((a, b) => a.rent - b.rent); out += `<b>🏠 หอพัก</b><table>${r.map((d, i) => `<tr><td>${i === 0 ? '🥇 ' : ''}${esc(d.name)}</td><td>${baht(d.rent)}/ด.</td><td>${d.km} กม.</td></tr>`).join('')}</table>ถูกสุด <b>${esc(r[0].name)}</b> · ใกล้ออฟฟิศสุด <b>${esc(ds.slice().sort((a, b) => a.km - b.km)[0].name)}</b>`; }
  return note + out;
}
function aiMoney() {
  const unpaid = bank.bills.filter(b => !b.paid), due = unpaid.reduce((s, b) => s + b.amt, 0);
  return `ข้อมูลจากธนาคารน้อย 🏦<ul><li>เงินในบัญชี <b>${baht(bank.bal)}</b> บาท</li><li>เงินเดือน ${baht(hr.base)} บาท/เดือน${hr.pending ? ` (จะเป็น ${baht(hr.pending)})` : ''}</li><li>ค่าเช่า ${baht(bank.home.rent)} บาท = ${Math.round(bank.home.rent / hr.base * 100)}% ของเงินเดือน</li><li>${unpaid.length ? `บิลค้าง ${unpaid.length} รายการ รวม ${baht(due)} บาท จ่ายก่อนครบกำหนดจะไม่โดนปรับ` : 'ไม่มีบิลค้าง เยี่ยม! 🎉'}</li>${Object.keys(debts).some(k => debts[k]) ? `<li>ยืมคนรู้จักอยู่ ${baht(Object.values(debts).reduce((a, b) => a + b, 0))} บาท อย่าลืมคืนนะ</li>` : ''}${bank.loan ? `<li>หนี้สินเชื่อ ${baht(bank.loan)} บาท ดอกเบี้ย 1%/เดือน รีบคืนได้จะดี</li>` : ''}</ul>ลองแบ่งเก็บ 10–20% ของเงินเดือน = ${baht(Math.round(hr.base * .1))}–${baht(Math.round(hr.base * .2))} บาท/เดือน 💰 <small>(คำแนะนำในเกมนะ)</small>`;
}
function aiDorm() {
  const cheap = DORMS.slice().sort((a, b) => a.rent - b.rent)[0], near = DORMS.slice().sort((a, b) => a.km - b.km)[0], pct = Math.round(bank.home.rent / hr.base * 100);
  return `ตอนนี้ค่าเช่า ${baht(bank.home.rent)} บาท = ${pct}% ของเงินเดือน ${pct > 30 ? '(ค่อนข้างสูงนะ)' : '(โอเคเลย)'}<br>หอที่ถูกสุด: <b>${esc(cheap.name)}</b> ${baht(cheap.rent)} บาท แต่ห่าง ${cheap.km} กม.<br>ใกล้ออฟฟิศสุด: <b>${esc(near.name)}</b> ${baht(near.rent)} บาท<br>ย้ายเข้าต้องเตรียมเงินประมาณ 3 เท่าของค่าเช่า + ค่าขนย้าย ดูได้ในเสิร์ชน้อย แท็บ <b>หอพัก</b> 🏠`;
}
