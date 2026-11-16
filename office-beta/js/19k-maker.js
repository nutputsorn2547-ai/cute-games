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
const mkSay = (c, t) => setTimeout(() => { c.msgs.push({ from: 'maker', text: t, likes: [] }); renderChat(); }, 700);
function mkShrink(src) { // รูปไป Apps Script ได้ไม่เกิน ~250KB: ย่อ + ลดคุณภาพจนพอดี
  return new Promise((ok, no) => {
    const im = new Image(); im.onload = () => {
      try { for (const [mw, q] of [[1000, .72], [900, .6], [760, .55], [640, .5], [520, .45]]) { const s = Math.min(1, mw / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); const u = c.toDataURL('image/jpeg', q); if (u.length <= 230000) return ok(u); } no(new Error('big')); } catch (e) { no(e); }
    }; im.onerror = () => no(new Error('load')); im.src = src;
  });
}
PERSONAL.maker = (c, m) => {
  if (!m.text && !m.img) { setTimeout(() => mkSay(c, 'ส่งได้เฉพาะข้อความกับรูปภาพนะ 🙏'), 0); return; }
  let name = (mkStore.get('cg-name') || '').trim();
  if (!name) {
    if (!mkAskName) { mkAskName = true; c._mkHold = { text: m.text || '', img: m.img || '' }; mkSay(c, 'ขอชื่อที่อยากให้เรียกก่อนนะ (พิมพ์ชื่อสั้นๆ) แล้วข้อความแรกของคุณจะถูกส่งต่อให้เลย'); return; }
    if (!m.text) { mkSay(c, 'พิมพ์ชื่อเป็นตัวอักษรก่อนนะ'); return; }
    name = m.text.trim().slice(0, 30); mkStore.set('cg-name', name); mkAskName = false;
    const first = c._mkHold; c._mkHold = null; mkSay(c, `ยินดีที่ได้รู้จักค่ะ/ครับ คุณ ${name} 🥰 ส่งข้อความให้แล้ว`);
    if (first && (first.text || first.img)) mkSend(first.text, name, c, first.img); return;
  }
  mkSend(m.text || '', name, c, m.img || '');
};
async function mkSend(text, name, c, img) {
  try { complete('n12maker'); } catch (x) {}
  const L = await mkLoad(); if (!L) return; let data = '';
  if (img) { try { data = await mkShrink(img); } catch (e) { if (c) mkSay(c, '⚠️ รูปนี้ส่งไม่ได้ (อาจเป็นรูปจากเว็บภายนอกหรือไฟล์ใหญ่เกิน) ลองแคปหน้าจอด้วยแอปแคปน้อยแล้วส่งแทนนะ'); return; } }
  const id = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  try { await fetch(L.ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ chat: { id, vid: L.VID, name, text: String(text).slice(0, 600), img: data } }) }); }
  catch (e) { if (c) mkSay(c, '⚠️ ส่งไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่นะ'); }
}
async function mkPoll() {
  const L = await mkLoad(); if (!L || !mkStore.get('cg-name')) return;
  try {
    const j = await (await fetch(L.ENDPOINT + '?chatmine=' + encodeURIComponent(L.VID) + '&_=' + Date.now())).json(); if (!j.rows) return;
    let seen; try { seen = new Set(JSON.parse(mkStore.get(MK_KEY) || '[]')); } catch (e) { seen = new Set(); }
    const fresh = j.rows.filter(r => r[4] === 'admin' && r[2] === L.VID && !seen.has(r[0] + '|' + r[1]));
    if (!fresh.length) return; mkEnsure(); const c = chatById('maker');
    fresh.forEach((r, i) => { seen.add(r[0] + '|' + r[1]); setTimeout(() => say(c, 'maker', String(r[6] ?? ''), 900), i * 1200); });
    mkStore.set(MK_KEY, JSON.stringify([...seen].slice(-200)));
  } catch (e) {}
}
mkEnsure();
setInterval(mkPoll, 30000); setTimeout(mkPoll, 4000);
const _load8 = loadGame; loadGame = function () { const ok = _load8(); if (ok) mkEnsure(); return ok; };
