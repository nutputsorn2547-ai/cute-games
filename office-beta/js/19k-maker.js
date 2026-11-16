'use strict';
/* Office game (beta): direct chat with the game maker. Messages go to the Apps Script inbox
   (its own sheet 'gamechat', separate from the landing-page feedback box); replies written on /stats/ come back here. */
PEOPLE.maker = { n: 'ผู้สร้างเกม', c: '#cdb8ff', e: '🧑‍💻' };
const MK_KEY = 'cg-mk-seen', MK_GAME = 0;
let mkLib = null, mkLast = 0, mkAskName = false;
const mkStore = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
const mkLoad = () => mkLib || (mkLib = import('../../lib/stats.js').catch(() => null));
function mkEnsure() {
  if (chatById('maker')) return;
  chat.list.push({ id: 'maker', n: 'ผู้สร้างเกม 🧑‍💻', members: ['maker'], unread: 1, msgs: [{ from: 'maker', text: 'สวัสดีค่ะ/ครับ 👋 ช่องทางนี้ส่งข้อความถึงผู้สร้างเกมโดยตรงเลยนะ ติชม เจอบั๊ก หรืออยากให้เพิ่มอะไร พิมพ์ได้เลย เดี๋ยวตอบกลับในแชทนี้ (ตอบเมื่อว่าง อาจใช้เวลาหน่อย 🙏)' }] });
  try { renderChat(); phoneBadge(); } catch (e) {}
}
/* ---- delivery status on my messages: กำลังส่ง… → ✓ ส่งแล้ว HH:MM → ✓✓ อ่านแล้ว HH:MM ---- */
const mkClock = t => { const d = new Date(t), hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); return new Date().toDateString() === d.toDateString() ? hh : `${d.getDate()}/${d.getMonth() + 1} ${hh}`; };
const _mh = msgHTML;
msgHTML = function (m) {
  let h0 = _mh(m); if (!m.mk) return h0; const k = m.mk;
  const st = k.st === 'read' ? `<span class="mks rd">✓✓ อ่านแล้ว ${mkClock(k.rt || k.t)} · ส่ง ${mkClock(k.t)}</span>` : k.st === 'sent' ? `<span class="mks">✓ ส่งแล้ว ${mkClock(k.t)}</span>` : k.st === 'fail' ? `<span class="mks bad" data-mkretry="${esc(k.id)}">⚠️ ส่งไม่สำเร็จ · แตะเพื่อส่งใหม่</span>` : `<span class="mks">⏳ กำลังส่ง… ${mkClock(k.t)}</span>`;
  return h0.replace(/<\/div><\/div>$/, st + '</div></div>');
};
const mkSay = (c, t) => setTimeout(() => { c.msgs.push({ from: 'maker', text: t, likes: [] }); renderChat(); }, 700);
function mkShrink(src) { // รูปไป Apps Script ได้ไม่เกิน ~250KB: ย่อ + ลดคุณภาพจนพอดี
  return new Promise((ok, no) => {
    const im = new Image(); im.onload = () => {
      try { for (const [mw, q] of [[1000, .72], [900, .6], [760, .55], [640, .5], [520, .45]]) { const s = Math.min(1, mw / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); const u = c.toDataURL('image/jpeg', q); if (u.length <= 230000) return ok(u); } no(new Error('big')); } catch (e) { no(e); }
    }; im.onerror = () => no(new Error('load')); im.src = src;
  });
}
PERSONAL.maker = (c, m) => {
  if (!m.text && !m.img) { mkSay(c, 'ส่งได้เฉพาะข้อความกับรูปภาพนะ 🙏'); return; }
  let name = (mkStore.get('cg-name') || '').trim();
  if (!name) {
    if (!mkAskName) { mkAskName = true; c._mkHold = m; mkSay(c, 'ขอชื่อที่อยากให้เรียกก่อนนะ (พิมพ์ชื่อสั้นๆ) แล้วข้อความแรกของคุณจะถูกส่งต่อให้เลย'); return; }
    if (!m.text) { mkSay(c, 'พิมพ์ชื่อเป็นตัวอักษรก่อนนะ'); return; }
    name = m.text.trim().slice(0, 30); mkStore.set('cg-name', name); mkAskName = false;
    const first = c._mkHold; c._mkHold = null; mkSay(c, `ยินดีที่ได้รู้จักค่ะ/ครับ คุณ ${name} 🥰 ส่งข้อความให้แล้ว`);
    if (first) mkSend(first, name, c); return;
  }
  mkSend(m, name, c);
};
async function mkSend(m, name, c) {
  try { complete('n12maker'); } catch (x) {}
  if (!m.mk) m.mk = { id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Date.now(), st: 'sending' }; else { m.mk.st = 'sending'; m.mk.t = Date.now(); }
  renderChat(); const L = await mkLoad(); if (!L) { m.mk.st = 'fail'; renderChat(); return; }
  let data = ''; if (m.img) { try { data = await mkShrink(m.img); } catch (e) { m.mk.st = 'fail'; m.mk.bad = 1; renderChat(); if (c) mkSay(c, '⚠️ รูปนี้ส่งไม่ได้ (อาจเป็นรูปจากเว็บภายนอกหรือไฟล์ใหญ่เกิน) ลองแคปหน้าจอด้วยแอปแคปน้อยแล้วส่งแทนนะ'); return; } }
  try { await fetch(L.ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ chat: { id: m.mk.id, vid: L.VID, name, text: String(m.text || '').slice(0, 600), img: data } }) }); }
  catch (e) { m.mk.st = 'fail'; renderChat(); return; }
  mkWatch(); [1500, 4000, 8000].forEach(d => setTimeout(mkPoll, d));
}
document.addEventListener('click', e => { const b = e.target.closest('[data-mkretry]'); if (!b) return; const c = chatById('maker'), m = c && c.msgs.find(x => x.mk && x.mk.id === b.dataset.mkretry); const name = (mkStore.get('cg-name') || '').trim(); if (m && name && !m.mk.bad) mkSend(m, name, c); });
/* ---- polling: replies from the maker + sent/read marks ---- */
let mkTimer = null; const mkPending = () => { const c = chatById('maker'); return !!(c && c.msgs.some(m => m.mk && m.mk.st !== 'read' && m.mk.st !== 'fail')); };
function mkWatch() { clearTimeout(mkTimer); mkTimer = setTimeout(async () => { await mkPoll(); mkWatch(); }, mkPending() ? 12000 : 45000); }
async function mkPoll() {
  const L = await mkLoad(); if (!L || !mkStore.get('cg-name')) return;
  try {
    const j = await (await fetch(L.ENDPOINT + '?chatmine=' + encodeURIComponent(L.VID) + '&_=' + Date.now())).json(); if (!j.rows) return;
    mkEnsure(); const c = chatById('maker'), mine = new Map(j.rows.filter(r => r[4] === 'user').map(r => [String(r[1]), +r[0]])), rd = +j.read || 0; let ch = false;
    for (const m of c.msgs) if (m.mk && m.mk.st !== 'fail' || (m.mk && m.mk.st === 'fail' && mine.has(m.mk.id))) {
      const t = mine.get(m.mk.id), was = m.mk.st;
      if (t) { m.mk.t = t; if (rd && rd >= t) { m.mk.st = 'read'; m.mk.rt = rd; } else if (m.mk.st !== 'read') m.mk.st = 'sent'; }
      else if (m.mk.st === 'sending' && Date.now() - m.mk.t > 90000) m.mk.st = 'fail';
      if (m.mk.st !== was) ch = true;
    }
    let seen; try { seen = new Set(JSON.parse(mkStore.get(MK_KEY) || '[]')); } catch (e) { seen = new Set(); }
    const fresh = j.rows.filter(r => r[4] === 'admin' && r[2] === L.VID && !seen.has(r[0] + '|' + r[1]));
    fresh.forEach((r, i) => { seen.add(r[0] + '|' + r[1]); setTimeout(() => say(c, 'maker', String(r[6] ?? ''), 900), i * 1200); });
    if (fresh.length) mkStore.set(MK_KEY, JSON.stringify([...seen].slice(-200)));
    if (ch) renderChat();
  } catch (e) {}
}
mkEnsure();
mkWatch(); setTimeout(mkPoll, 4000);
const _load8 = loadGame; loadGame = function () { const ok = _load8(); if (ok) { mkEnsure(); setTimeout(mkPoll, 1500); } return ok; };
