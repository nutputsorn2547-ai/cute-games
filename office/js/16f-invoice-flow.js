"use strict";
// Office game — the invoice job (finance chat → stamp "paid" → scan → email the supplier) and writing new emails.
// Everything is made up: the people, companies and addresses (all .test) do not exist.
const EMAIL_DIR = { boss: 'meow.boss@mewnoi.test', hr: 'hr.people@mewnoi.test', fin: 'finance@mewnoi.test', sup: 'sales@maletdee.test' };
Object.assign(PEOPLE, { fin: { n: 'พี่นกฮูก (การเงิน)', c: '#d6f0e0', e: '🦉' }, sup: { n: 'คุณเมล็ด (บ.เมล็ดดี)', c: '#f4e3c8', e: '🌰' } });
const invFlow = { asked: false, orig: 'desk', xls: false, paid: false, stamped: false, busy: false, miss: '', closed: false };
mail.sent = mail.sent || [];
function ensureFlowChats() {
  if (!chat.list.some(c => c.id === 'fin')) chat.list.splice(2, 0, { id: 'fin', n: 'ฝ่ายการเงิน', members: ['fin'], unread: 1, msgs: [{ from: 'fin', text: 'สวัสดีค่ะ ฝ่ายการเงินนะคะ 💼 มีรายการต้องจ่ายเงินหรือเอกสารการเงิน ส่งมาทางนี้ได้เลยค่ะ' }] });
  if (!chat.list.some(c => c.id === 'sup')) chat.list.splice(3, 0, { id: 'sup', n: 'บ.เมล็ดดี (คู่ค้า)', members: ['sup'], unread: 1, msgs: [{ from: 'sup', text: 'สวัสดีค่ะ จากบริษัท เมล็ดดี จำกัด ส่งใบแจ้งหนี้ INV-0425 มาให้แล้วนะคะ รบกวนชำระภายใน 30 วันค่ะ 🙏' }] });
}
ensureFlowChats();

/* ---------- finance & supplier chats ---------- */
const sheetHas = (B, n) => Object.keys(B.cells).some(k => { const v = value(B, k); return typeof v === 'number' && Math.abs(v - n) < .005; });
function slipBody() {
  const d = thDate(gnow().getTime(), { day: 'numeric', month: 'long', year: 'numeric' });
  return `<h2 style="text-align:center;margin:0 0 6px">หลักฐานการโอนเงิน</h2><p style="text-align:center;color:#2a8a4a"><b>✅ ทำรายการสำเร็จ</b></p><table class="pdft"><tr><td>วันที่</td><td>${d}</td></tr><tr><td>จาก</td><td>บริษัท เมฆน้อย จำกัด</td></tr><tr><td>ถึง</td><td>บริษัท เมล็ดดี จำกัด</td></tr><tr><td>จำนวนเงิน</td><td><b>10,165.00 บาท</b></td></tr><tr><td>อ้างอิง</td><td>ใบแจ้งหนี้ INV-0425</td></tr><tr><td>ผู้ทำรายการ</td><td>ฝ่ายการเงิน</td></tr></table><p style="color:#999;font-size:11px;margin-top:16px">เอกสารสมมุติในเกม ไม่ใช่หลักฐานจริง</p>`;
}
function finMissing() { const m = []; if (invFlow.orig !== 'fin') m.push('ใบแจ้งหนี้ตัวจริง (กดปุ่ม “📤 ส่งตัวจริงให้การเงิน” ตอนหยิบกระดาษที่โต๊ะ)'); if (!invFlow.xls) m.push('ไฟล์ Excel สรุปยอดใบแจ้งหนี้ (ส่งในแชทนี้)'); return m; }
function finTry(ms = 1500) {
  const c = chat.list.find(x => x.id === 'fin'); if (!c || invFlow.paid || invFlow.busy || !invFlow.asked) return;
  const miss = finMissing();
  if (miss.length) { const k = miss.join('|'); if (invFlow.miss !== k) { invFlow.miss = k; say(c, 'fin', 'ตอนนี้ยังขาด: ' + miss.join(' และ ') + ' นะคะ', ms + 1200); } return; }
  complete('inv2'); invFlow.busy = true; invFlow.miss = '';
  say(c, 'fin', 'ตรวจเอกสารครบแล้วค่ะ ✅ กำลังโอนเงิน 10,165 บาทให้ บ.เมล็ดดี…', ms + 1500);
  later(c, ms + 7000, () => finPay(c));
}
function finPay(c) {
  const id = 'slip-inv0425', body = slipBody();
  let f = FILES.find(x => x.id === id);
  if (!f) { f = { id, name: 'หลักฐานการโอนเงิน-INV-0425.pdf', type: 'pdf', kind: 'pdfdoc', loc: 'down', invSlip: true }; FILES.push(f); }
  f.body = body; f.html = `<div class="scanv"><div class="pdfpage">${body}</div></div>`;
  invFlow.paid = true; invFlow.busy = false; invFlow.orig = 'desk'; showInvPaper(); renderDesktop();
  say(c, 'fin', 'โอนเรียบร้อยค่ะ 💸 ส่งหลักฐานการโอนให้แล้ว (เก็บไว้ในโฟลเดอร์ “ดาวน์โหลด”) และเอาใบแจ้งหนี้ตัวจริงไปคืนที่โต๊ะแล้วนะคะ ปั๊มตรา “จ่ายแล้ว” แล้วส่งให้คู่ค้าได้เลยค่ะ', 1200, { file: { id, name: f.name, type: 'pdf' } });
  later(c, 1400, () => { S.big('ฝ่ายการเงินโอนเงินแล้ว 💸', 2.2, '#2a8a4a'); S.jingle(); });
}
Object.assign(PERSONAL, {
  fin(c, m) {
    const t = m.text || '';
    if (m.file) {
      const f = FILES.find(x => x.id === m.file.id);
      if (invFlow.paid) return say(c, 'fin', 'เรื่อง INV-0425 เรียบร้อยแล้วนะคะ 😊', 1500);
      if (f && f.kind === 'sheet' && sheetHas(f.book, 10165)) { invFlow.xls = true; say(c, 'fin', 'ได้รับไฟล์สรุปยอดแล้วค่ะ ยอดรวม 10,165 บาท ตรงกับใบแจ้งหนี้ ✅', 1500); finTry(1500); }
      else say(c, 'fin', f && f.kind === 'sheet' ? 'ในไฟล์นี้ไม่เห็นยอดรวม 10,165 บาทของ INV-0425 เลยค่ะ สรุปรายการ (8,000 + 1,500 + VAT 665) ให้รวมเป็นยอดเดียวแล้วส่งมาใหม่นะคะ' : 'ฝ่ายการเงินขอเป็นไฟล์ Excel สรุปยอดใบแจ้งหนี้นะคะ ไฟล์นี้ใช้ไม่ได้ค่ะ', 1500);
      return;
    }
    if (/โอน|จ่าย|ชำระ|ใบแจ้งหนี้|INV/i.test(t)) {
      if (invFlow.paid) return say(c, 'fin', 'รายการ INV-0425 โอนไปแล้วนะคะ ✅', 1400);
      if (!/เมล็ดดี|10,?165|INV-?0?425/i.test(t)) return say(c, 'fin', 'โอนให้ใครคะ? บอกชื่อบริษัท ยอดเงิน และเลขที่ใบแจ้งหนี้ด้วยนะคะ', 1400);
      if (!invFlow.asked) { invFlow.asked = true; complete('inv1'); }
      const miss = finMissing();
      say(c, 'fin', 'รับเรื่องค่ะ 🙏 จะโอนให้ บ.เมล็ดดี ยอด 10,165 บาท ขอเอกสาร 2 อย่างก่อนนะคะ: 1) ใบแจ้งหนี้ตัวจริง (ส่งที่โต๊ะ) 2) ไฟล์ Excel สรุปยอดใบแจ้งหนี้ ส่งในแชทนี้', 1500);
      if (miss.length) invFlow.miss = miss.join('|'); else finTry(1500);
      return;
    }
    say(c, 'fin', pick(['ฝ่ายการเงินค่ะ 💼 ถ้ามีรายการต้องจ่าย แจ้งชื่อบริษัท ยอดเงิน และเลขที่ใบแจ้งหนี้มาได้เลย', 'รับทราบค่ะ ถ้าเป็นเรื่องจ่ายเงิน อย่าลืมแนบเอกสารนะคะ']), 1500);
  },
  sup(c, m) {
    if (m.file) return say(c, 'sup', 'รบกวนส่งเอกสารทางอีเมลนะคะ ขอที่อยู่อีเมลได้เลยค่ะ 📧', 1500);
    say(c, 'sup', invFlow.paid ? 'ถ้าชำระแล้ว ส่งใบแจ้งหนี้ที่ปั๊ม “จ่ายแล้ว” พร้อมหลักฐานการโอนมาทางอีเมลนะคะ 🙏' : 'ถ้าชำระแล้ว ส่งหลักฐานการโอนมาทางอีเมลได้เลยค่ะ (ถามอีเมลได้นะคะ)', 1500);
  },
});

/* ---------- paper handling: hand the original to finance, stamp, scan ---------- */
function showInvPaper() { const el = desk.querySelector('.item[data-id="doc:inv"]'); if (el) el.style.display = invFlow.orig === 'fin' ? 'none' : ''; }
function handOver() {
  if (invFlow.paid) { S.toast('จ่ายเงินเสร็จแล้ว ไม่ต้องส่งตัวจริงให้การเงินอีก', 2); return; }
  if (!invFlow.asked) S.toast('อย่าลืมแชทบอกฝ่ายการเงินให้โอนเงินด้วยนะ (ใบแจ้งหนี้ยังไม่มีคนจ่าย)', 3.2);
  if (!invFlow.scanned) S.toast('💡 ยังไม่ได้สแกนใบแจ้งหนี้เข้าเครื่องเก็บสำเนาไว้เลย (ส่งตัวจริงไปแล้วจะสแกนไม่ได้จนกว่าจะได้คืน)', 4.5);
  closeOverlay(); invFlow.orig = 'fin'; showInvPaper(); S.noise(.3, 1500, .06); S.tone(500, 700, .2, .06);
  S.toast('📤 ส่งใบแจ้งหนี้ตัวจริงให้ฝ่ายการเงินแล้ว', 2.4); finTry(1500);
}
function drawStamp(e) {
  const st = ov.state, d = st.doc; if (!d) { S.toast('ตราปั๊มใช้กับเอกสารเท่านั้นนะ', 1.8); return; }
  if (d.id === 'inv' && !invFlow.paid) { S.toast('ยังไม่ได้จ่ายเงินเลย อย่าเพิ่งปั๊ม “จ่ายแล้ว” 😅', 2.4); S.tone(300, 220, .1, .06); return; }
  const r = st.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = st.g;
  g.save(); g.translate(x, y); g.rotate(-.16); g.globalAlpha = .85; g.strokeStyle = g.fillStyle = '#d6304f'; g.lineWidth = 3; g.strokeRect(-78, -33, 156, 66); g.lineWidth = 1; g.strokeRect(-73, -28, 146, 56);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 30px Sarabun, Tahoma, sans-serif'; g.fillText('จ่ายแล้ว', 0, -8); g.font = '600 11px Sarabun, Tahoma, sans-serif'; g.fillText('PAID · ' + thDate(gnow().getTime(), { day: 'numeric', month: 'short', year: 'numeric' }), 0, 18); g.restore();
  d.stamped = true; if (d.id === 'inv') invFlow.stamped = true; S.noise(.08, 260, .14); S.tone(180, 110, .12, .1); S.toast('ปั๊ม “จ่ายแล้ว” แล้ว ✅ กดสแกนเข้าคอมต่อได้เลย', 2.4);
}

/* ---------- chat: asking someone for their email address ---------- */
function emailAsk(c, m) {
  const addr = EMAIL_DIR[c.id]; if (!addr || !m.text) return false;
  if (!/อีเมล|email|e-mail|เมล์|เมลล์|(?:^|\s)เมล(?:\s|$)/i.test(m.text) || !/ขอ|อะไร|ไหน|บอก|ที่อยู่|ทราบ|\?/.test(m.text)) return false;
  say(c, c.members[0], `ได้ค่ะ อีเมลคือ ${addr} นะคะ จดไว้ได้เลย 📝 (ใช้โพสต์อิทจดไว้ได้)`, 1500); return true;
}

/* ---------- writing a new email ---------- */
const mailDraftRead = box => { const w = mail.wr || (mail.wr = { to: '', subj: '', body: '', att: [] }); const g = q => box && box.querySelector(q); if (g('.mwto')) { w.to = g('.mwto').value; w.subj = g('.mwsub').value; w.body = g('.mwbody').value; } return w; };
function mailAttach(f) {
  if (!mail.accounts.length) { S.toast('ต้องสร้างอีเมลของตัวเองก่อนนะ', 2); return; }
  const box = wins.has('mail') ? wins.get('mail').body.firstChild : null, w = mailDraftRead(box);
  w.att = w.att || []; if (w.att.includes(f.id)) { S.toast('แนบไฟล์นี้ไว้แล้ว', 1.4); return; }
  w.att.push(f.id); mail.open = null; mail.compose = null; showMail('write'); S.tone(700, 1000, .08, .07); S.toast(`📎 แนบ "${f.name}" แล้ว`, 1.6);
}
function paintWrite(box) {
  const w = mail.wr || (mail.wr = { to: '', subj: '', body: '', att: [] }), atts = (w.att || []).map(id => FILES.find(f => f.id === id)).filter(Boolean);
  box.innerHTML = `<div class="mailw"><div class="mlogo">✍️ เขียนอีเมลใหม่ <small>จาก ${esc(mail.accounts[0]?.email || '')}</small></div>
    <div class="mcomp"><label class="mwl">ถึง<input class="mwto" type="text" spellcheck="false" autocapitalize="off" placeholder="พิมพ์อีเมลผู้รับเอง เช่น ชื่อ@โดเมน.test" value="${esc(w.to)}"></label>
    <label class="mwl">หัวข้อ<input class="mwsub" type="text" spellcheck="false" placeholder="หัวข้อ" value="${esc(w.subj)}"></label>
    <textarea class="mrt mwbody" rows="6" spellcheck="false" placeholder="พิมพ์ข้อความ (อย่างน้อย 10 ตัวอักษร)">${esc(w.body)}</textarea>
    <div class="mwdrop"><b>📎 ไฟล์แนบ</b> ${atts.length ? atts.map(f => `<span class="mwchip">${esc(f.name)} <button data-mwrm="${esc(f.id)}" aria-label="เอาออก">✕</button></span>`).join('') : '<small>ลากไฟล์จากหน้าจอคอมหรือโฟลเดอร์ มาวางในหน้าต่างอีเมลนี้ได้เลย</small>'}</div>
    <p class="note">ระบบไม่มีสมุดที่อยู่ ต้องถามอีเมลจากแต่ละคนในแชทแล้วจดเอง 📝</p>
    <div class="err"></div><div class="acts"><button class="btn2 pri" data-mwsend>📨 ส่งอีเมล</button><button class="btn2" data-mv="inbox">ยกเลิก</button></div></div></div>`;
}
function paintSent(box) {
  const op = mail.sopen != null ? mail.sent[mail.sopen] : null;
  const head = `<div class="mbar2"><button class="btn2 pri" data-mv="write">✍️ เขียนอีเมล</button><button class="btn2" data-mv="new">👤 สร้างบัญชีใหม่</button></div><div class="mchips">${MAIL_CATS.map(([k, n]) => `<button class="${mail.f === k ? 'on' : ''}" data-mf="${k}">${n}</button>`).join('')}</div>`;
  box.innerHTML = `<div class="mailw"><div class="mlogo">📧 เมลน้อย <small>${mail.accounts.map(a => esc(a.email)).join(' · ')}</small></div>${head}` + (op
    ? `<div class="mread"><a data-msback style="color:#3348b8;cursor:pointer">← กลับ</a><h3>${esc(op.subj)}</h3><small>ถึง ${esc(op.to)} · ${thDate(op.at, { day: 'numeric', month: 'short' })}</small><div class="mbody">${esc(op.body).replace(/\n/g, '<br>')}</div>${op.att.length ? `<div class="matts">📎 ${op.att.map(a => esc(a.name)).join(', ')}</div>` : ''}</div>`
    : `<div class="mlist">${mail.sent.map((m, i) => `<div class="mrow" data-msi="${i}"><b>ถึง ${esc(m.to)}</b><span>${esc(m.subj)}${m.att.length ? ' 📎' : ''}</span><small>${thDate(m.at, { day: 'numeric', month: 'short' })}</small></div>`).join('') || '<p class="note">ยังไม่ได้ส่งอีเมลฉบับไหนเลย กด “เขียนอีเมล” ได้เลย</p>'}</div>`) + '</div>';
}
function mailClick2(e) {
  const t = e.target; let b;
  if ((b = t.closest('[data-mwrm]'))) { const w = mailDraftRead(t.closest('.mailw')); w.att = (w.att || []).filter(i => i !== b.dataset.mwrm); showMail('write'); return true; }
  if (t.closest('[data-mwsend]')) { mailWriteSend(t.closest('.mailw')); return true; }
  if ((b = t.closest('[data-msi]'))) { mail.sopen = +b.dataset.msi; showMail('inbox'); return true; }
  if (t.closest('[data-msback]')) { mail.sopen = null; showMail('inbox'); return true; }
  if ((b = t.closest('[data-matt]'))) { const op = mail.inbox[mail.open], a = op && op.att && op.att[+b.dataset.matt]; if (a) saveAtt(a); return true; }
  if (t.closest('[data-mv="write"]')) { mail.open = null; mail.compose = null; mail.sopen = null; showMail('write'); return true; }
  if ((b = t.closest('[data-mf]')) && b.dataset.mf === 'sent') { mail.f = 'sent'; mail.open = null; mail.sopen = null; showMail('inbox'); return true; }
  return false;
}
function saveAtt(a) {
  let f = FILES.find(x => x.id === a.id);
  if (!f) { f = { id: a.id, name: a.name, type: 'pdf', kind: 'pdfdoc', loc: 'down', body: a.body, html: `<div class="scanv"><div class="pdfpage">${a.body}</div></div>`, official: !!a.official }; FILES.push(f); }
  else f.loc = f.loc === 'trash' ? 'down' : f.loc;
  renderDesktop(); S.tone(600, 900, .1, .06); S.toast(`💾 บันทึก "${a.name}" ไว้ในโฟลเดอร์ ดาวน์โหลดแล้ว`, 2.4);
}
function mailWriteSend(root) {
  const err = root.querySelector('.err'), bad = t => { err.textContent = t; S.tone(300, 200, .15, .08); };
  const w = mail.wr = { to: root.querySelector('.mwto').value.trim(), subj: root.querySelector('.mwsub').value.trim(), body: root.querySelector('.mwbody').value.trim(), att: (mail.wr && mail.wr.att) || [] };
  if (!mail.accounts.length) return bad('ต้องสร้างอีเมลของตัวเองก่อนนะ');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(w.to)) return bad('พิมพ์อีเมลผู้รับให้ถูกรูปแบบ เช่น ชื่อ@โดเมน.test (ต้องถามจากแต่ละคนแล้วจดเอง)');
  if (!w.subj) return bad('ใส่หัวข้ออีเมลด้วยนะ');
  if (w.body.length < 10) return bad('ข้อความสั้นไป พิมพ์ให้ครบอย่างน้อย 10 ตัวอักษรนะ');
  const att = w.att.map(id => { const f = FILES.find(x => x.id === id); return f ? { id, name: f.name } : null; }).filter(Boolean);
  const m = { to: w.to.toLowerCase(), subj: w.subj, body: w.body, att, at: gnow().getTime() };
  mail.sent.unshift(m); mail.wr = null; mail.f = 'sent'; mail.sopen = null; S.jingle(); S.toast('📨 ส่งอีเมลแล้ว', 1.6); showMail('inbox'); mailRoute(m);
}
function mailRoute(m) {
  const key = Object.keys(EMAIL_DIR).find(k => EMAIL_DIR[k] === m.to), me = mail.accounts[0].email;
  const reply = (from, body, extra, mins = 12 + Math.random() * 15, subj) => mailPush(me, from, subj || 'Re: ' + m.subj, body, 'work', gnow().getTime() + mins * 60000, extra);
  if (!key) return reply('ระบบส่งอีเมล (Mail Delivery)', `<p>ส่งไม่สำเร็จ ❌</p><p>ไม่พบที่อยู่ <b>${esc(m.to)}</b> ตรวจตัวสะกดอีกครั้ง หรือกลับไปถามอีเมลที่ถูกต้องจากคนนั้นในแชทแล้วจดไว้</p>`, {}, 3, 'ส่งไม่สำเร็จ: ' + m.to);
  const text = m.subj + ' ' + m.body;
  if (key === 'boss') {
    if (m.att.length) { reply('หัวหน้าแมว', '<p>ได้รับเอกสารแล้วนะ ขอบใจ 👍 เดี๋ยวพี่ตรวจให้</p>'); complete('mailboss'); }
    else reply('หัวหน้าแมว', '<p>พี่เห็นเมลแล้ว แต่ไม่เห็นไฟล์แนบเลยนะ 😾 แนบมาใหม่ด้วย</p>');
  } else if (key === 'hr') {
    if (/สลิป|เงินเดือน|รับรอง/.test(text)) {
      const base = (typeof hr !== 'undefined' && hr.base) || 25000, sso = 750, net = base - sso;
      const body = `<h2 style="text-align:center;margin:0">สลิปเงินเดือน (ฉบับทางการ)</h2><p style="text-align:center">ประจำเดือน มกราคม 2569 · บริษัท เมฆน้อย จำกัด</p><table class="pdft"><tr><td>เงินเดือน</td><td style="text-align:right">${base.toLocaleString('en-US')}.00</td></tr><tr><td>หัก ประกันสังคม</td><td style="text-align:right">${sso}.00</td></tr><tr><td><b>เงินได้สุทธิ</b></td><td style="text-align:right"><b>${net.toLocaleString('en-US')}.00</b></td></tr></table><p style="margin-top:24px">ลงชื่อ ........................ ฝ่ายบุคคล (HR)</p><p style="color:#999;font-size:11px">เอกสารสมมุติในเกม</p>`;
      reply('พี่ HR', '<p>ออกสลิปเงินเดือนแบบทางการให้แล้วค่ะ 📎 กดบันทึกไฟล์แนบได้เลย</p>', { att: [{ id: 'payslip-' + Date.now(), name: 'สลิปเงินเดือนทางการ-ม.ค.2569.pdf', body, official: true }] }); complete('mailhr');
    } else reply('พี่ HR', '<p>HR ได้รับเมลแล้วค่ะ แต่ไม่แน่ใจว่าต้องการอะไร ระบุเรื่องที่ขอให้ชัดเจนอีกนิดนะคะ (เช่น ขอสลิปเงินเดือนแบบทางการ)</p>');
  } else if (key === 'fin') reply('ฝ่ายการเงิน', '<p>ฝ่ายการเงินได้รับเมลแล้วค่ะ แต่เรื่องจ่ายเงินแจ้งทางแชทนะคะ จะได้ตามง่ายกว่า 😊</p>');
  else if (key === 'sup') {
    const fs = m.att.map(a => FILES.find(x => x.id === a.id)).filter(Boolean);
    const hasStamp = fs.some(f => f.stamped && f.docId === 'inv'), hasSlip = fs.some(f => f.invSlip);
    if (hasStamp && hasSlip) { reply('คุณเมล็ด บ.เมล็ดดี', '<p>ได้รับใบแจ้งหนี้ที่ปั๊ม “จ่ายแล้ว” และหลักฐานการโอนครบถ้วนแล้วค่ะ ขอบคุณมาก 🙏 ปิดรายการ INV-0425 เรียบร้อย</p>', { imp: 0 }); invFlow.closed = true; complete('inv4'); }
    else { const miss = []; if (!hasStamp) miss.push('ใบแจ้งหนี้ที่ปั๊ม “จ่ายแล้ว” แล้วสแกนเป็นไฟล์'); if (!hasSlip) miss.push('หลักฐานการโอนเงิน'); reply('คุณเมล็ด บ.เมล็ดดี', `<p>ได้รับเมลแล้วค่ะ แต่ยังไม่เห็น: ${miss.join(' และ ')} รบกวนแนบมาให้ครบนะคะ 🙏</p>`); }
  }
  setTimeout(() => S.toast('📬 ส่งแล้ว รอผู้รับตอบกลับสักครู่', 2.2), 900);
}
