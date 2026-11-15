// ปุ่ม “ส่งข้อความถึงผู้สร้าง” บนหน้าแรก: เลือกเกม (ติ๊กได้หลายอัน/ทั้งหมด) ให้ดาวแยกแต่ละเกม พิมพ์ข้อความ
// ต้องใส่ชื่อผู้ส่ง — ชื่อถูกจำไว้ในเครื่องนี้ (ผูกกับรหัสเครื่อง VID) แล้วผู้สร้างตอบกลับได้ในแท็บ “ข้อความของฉัน”
// ข้อความไปที่ Apps Script (stats/Code.gs) → ชีต "inbox" → ผู้สร้างอ่าน/ตอบที่หน้า /stats/
import { ENDPOINT, VID } from './stats.js';
if (ENDPOINT) {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const games = [{ g: 'site', n: '🌐 ภาพรวมทั้งเว็บ' }, ...[...document.querySelectorAll('.grid a.game')].map(a => ({ g: (a.getAttribute('href') || '').replace(/\/+$/, '') || 'x', n: a.querySelector('h2')?.textContent.trim() || a.textContent.trim().slice(0, 30) }))];
  const st = { open: false, tab: 'send', sel: {}, rate: {}, text: '', name: store.get('cg-name'), msgs: [], pending: [], busy: false, note: '', lastSend: 0, loaded: false };

  const css = document.createElement('style');
  css.textContent = `
#fbBtn{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:900;border:0;border-radius:999px;padding:12px 18px;background:var(--pink-deep,#e8678a);color:#fff;font:500 16px var(--font,system-ui);cursor:pointer;box-shadow:0 10px 24px -8px #e8678a99}
#fbBtn:hover{filter:brightness(1.06)}#fbBtn b{position:absolute;right:-4px;top:-6px;background:#2fbf5a;color:#fff;border-radius:99px;font-size:12px;padding:1px 7px}
#fbBack{position:fixed;inset:0;z-index:1000;background:#3a2a1a88;display:flex;align-items:center;justify-content:center;padding:12px;font-family:var(--font,system-ui)}
#fbBox{position:relative;width:min(640px,100%);max-height:94vh;overflow:auto;background:#fffaf5;border-radius:24px;padding:18px 20px;box-shadow:0 30px 60px -20px #000a;color:var(--ink,#4a3a44)}
#fbBox h2{margin:0 0 4px;font-size:22px}#fbBox .sm{color:var(--soft,#9a8590);font-size:14px;line-height:1.5;margin:0 0 10px}
#fbBox .x{position:absolute;right:12px;top:10px;border:0;background:#0001;border-radius:99px;width:32px;height:32px;font-size:15px;cursor:pointer}
#fbBox .tabs{display:flex;gap:6px;margin:8px 0 12px}#fbBox .tabs button{flex:1;border:2px solid var(--line,#f1dcd3);background:#fff;border-radius:99px;padding:7px;font:inherit;font-size:15px;cursor:pointer;color:inherit}#fbBox .tabs button.on{background:var(--pink,#ff8fab);border-color:var(--pink,#ff8fab);color:#fff}
#fbBox label.nm{display:block;font-size:14px;margin-bottom:10px}#fbBox input[type=text],#fbBox textarea{width:100%;box-sizing:border-box;font:inherit;font-size:15px;border:2px solid var(--line,#f1dcd3);border-radius:14px;padding:8px 12px;background:#fff;color:inherit;margin-top:4px}
#fbBox textarea{min-height:96px;resize:vertical}
.fbg{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px}.fbg .all{font-size:14px;color:var(--soft,#9a8590);display:flex;align-items:center;gap:8px;cursor:pointer}
.fbg .row{background:#fff;border:2px solid var(--line,#f1dcd3);border-radius:14px;padding:7px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.fbg .row.on{border-color:var(--pink,#ff8fab)}
.fbg .row label{display:flex;align-items:center;gap:8px;flex:1;min-width:150px;cursor:pointer;font-size:15px}
.fbg input[type=checkbox]{width:18px;height:18px;accent-color:#e8678a}
.stars{display:flex;gap:2px}.stars button{border:0;background:none;font-size:24px;line-height:1;padding:0 1px;cursor:pointer;color:#d9ccc4}.stars button.on{color:#ffb800}.stars button:focus-visible{outline:2px solid #e8678a;border-radius:6px}
.fbsend{width:100%;border:0;border-radius:99px;padding:11px;background:var(--pink-deep,#e8678a);color:#fff;font:500 17px var(--font,system-ui);cursor:pointer;margin-top:10px}.fbsend:disabled{opacity:.5;cursor:default}
.fbnote{font-size:14px;margin-top:8px;min-height:20px}.fbnote.ok{color:#1a8a55}.fbnote.bad{color:#d6336c}
.thr{display:flex;flex-direction:column;gap:10px}.bub{max-width:88%;padding:9px 13px;border-radius:16px;font-size:15px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.bub.me{align-self:flex-end;background:#ffe1ea;border-bottom-right-radius:4px}.bub.ad{align-self:flex-start;background:#e1f5ea;border-bottom-left-radius:4px}.bub small{display:block;color:var(--soft,#9a8590);font-size:12px;margin-top:3px}
.bub .chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px}.bub .chips i{font-style:normal;font-size:12px;background:#fff;border-radius:99px;padding:1px 8px;color:#6a4a58}
`;
  document.head.append(css);

  const btn = document.createElement('button'); btn.id = 'fbBtn'; btn.type = 'button'; btn.innerHTML = '💌 ส่งข้อความถึงผู้สร้าง'; document.body.append(btn);
  const fmt = t => new Date(+t).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const unread = () => st.msgs.filter(m => m.from === 'admin' && +m.t > +store.get('cg-fb-seen', '0')).length;
  const badge = () => { const n = unread(); btn.innerHTML = '💌 ส่งข้อความถึงผู้สร้าง' + (n ? `<b>${n}</b>` : ''); };

  const stars = (g, n) => `<span class="stars" role="radiogroup" aria-label="ให้ดาว">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${esc(g)}" data-v="${i}" class="${i <= n ? 'on' : ''}" aria-label="${i} ดาว">★</button>`).join('')}</span>`;
  const chosen = () => games.filter(x => st.sel[x.g]);

  function render() {
    let b = $('#fbBox'); if (!st.open) { $('#fbBack')?.remove(); return; }
    if (!b) { const bk = document.createElement('div'); bk.id = 'fbBack'; bk.innerHTML = '<div id="fbBox" role="dialog" aria-modal="true" aria-label="ส่งข้อความถึงผู้สร้าง"></div>'; document.body.append(bk); bk.addEventListener('mousedown', e => { if (e.target === bk) close(); }); bk.addEventListener('click', onClick); bk.addEventListener('input', onInput); b = $('#fbBox'); }
    const keep = { y: b.scrollTop }; const tabs = `<div class="tabs"><button type="button" data-tab="send" class="${st.tab === 'send' ? 'on' : ''}">✍️ ส่งข้อความ</button><button type="button" data-tab="mine" class="${st.tab === 'mine' ? 'on' : ''}">📬 ข้อความของฉัน${unread() ? ` (${unread()})` : ''}</button></div>`;
    let body = '';
    if (st.tab === 'send') {
      const allOn = chosen().length === games.length;
      body = `<p class="sm">เล่นเกมไหนแล้วอยากบอกอะไร ติ๊กเลือกได้ทีละเกม หลายเกม หรือทั้งหมด ให้ดาวแยกแต่ละเกมได้ แล้วพิมพ์ข้อเสนอแนะหรือติชมมาได้เลยค่ะ</p>
      <label class="nm">ชื่อผู้ส่ง <small style="color:var(--soft,#9a8590)">(จำไว้ในเครื่องนี้ ใช้ตอบกลับให้ถูกคน)</small><input type="text" id="fbName" maxlength="30" value="${esc(st.name)}" placeholder="เช่น น้องมะนาว" autocomplete="nickname"></label>
      <div class="fbg"><label class="all"><input type="checkbox" data-all ${allOn ? 'checked' : ''}> เลือกทั้งหมด</label>${games.map(x => `<div class="row ${st.sel[x.g] ? 'on' : ''}"><label><input type="checkbox" data-g="${esc(x.g)}" ${st.sel[x.g] ? 'checked' : ''}> ${esc(x.n)}</label>${st.sel[x.g] ? stars(x.g, st.rate[x.g] || 0) : ''}</div>`).join('')}</div>
      <label class="nm">ข้อความ <small style="color:var(--soft,#9a8590)">(ไม่พิมพ์ก็ได้ ถ้าให้ดาวแล้ว)</small><textarea id="fbText" maxlength="600" placeholder="ชอบตรงไหน อยากให้แก้อะไร เจอบั๊กตรงไหน…">${esc(st.text)}</textarea></label>
      <button type="button" class="fbsend" data-send ${st.busy ? 'disabled' : ''}>${st.busy ? 'กำลังส่ง…' : 'ส่งข้อความ 💌'}</button><div class="fbnote ${st.note.startsWith('✅') ? 'ok' : st.note ? 'bad' : ''}">${esc(st.note)}</div>`;
    } else {
      const all = [...st.msgs, ...st.pending.filter(p => !st.msgs.some(m => m.mid === p.mid))].sort((a, c) => a.t - c.t);
      body = `${st.note.startsWith('✅') ? `<div class="fbnote ok">${esc(st.note)}</div>` : ''}<p class="sm">${st.loaded ? 'บทสนทนาระหว่างคุณกับผู้สร้างเกม (เฉพาะเครื่องนี้)' : 'กำลังโหลด…'}</p><div class="thr">${all.length ? all.map(m => `<div class="bub ${m.from === 'admin' ? 'ad' : 'me'}">${m.from === 'user' && m.games?.length ? `<div class="chips">${m.games.map(g => `<i>${esc(g.n)}${g.r ? ' ' + '★'.repeat(g.r) : ''}</i>`).join('')}</div>` : ''}${esc(m.text || (m.from === 'user' ? '(ให้ดาวอย่างเดียว)' : ''))}<small>${m.from === 'admin' ? '🧑‍💻 ผู้สร้าง' : esc(m.name || st.name)} · ${fmt(m.t)}${m.pend ? ' · กำลังส่ง…' : ''}</small></div>`).join('') : '<p class="sm">ยังไม่มีข้อความ ลองส่งข้อความแรกที่แท็บ “ส่งข้อความ” ดูนะ</p>'}</div>`;
    }
    b.innerHTML = `<button type="button" class="x" data-close aria-label="ปิด">✕</button><h2>💌 ส่งข้อความถึงผู้สร้าง</h2>${tabs}${body}`; b.scrollTop = keep.y;
  }
  function onInput(e) { if (e.target.id === 'fbName') st.name = e.target.value; else if (e.target.id === 'fbText') st.text = e.target.value; }
  function onClick(e) {
    const t = e.target; if (t.closest('[data-close]')) return close();
    const tb = t.closest('[data-tab]'); if (tb) { st.tab = tb.dataset.tab; if (st.tab === 'mine') { markSeen(); load(); } render(); return; }
    const gc = t.closest('[data-g]'); if (gc) { st.sel[gc.dataset.g] = gc.checked; if (!gc.checked) delete st.rate[gc.dataset.g]; render(); return; }
    if (t.closest('[data-all]')) { const on = t.closest('[data-all]').checked; games.forEach(x => { st.sel[x.g] = on; if (!on) delete st.rate[x.g]; }); render(); return; }
    const sr = t.closest('[data-star]'); if (sr) { const g = sr.dataset.star, v = +sr.dataset.v; st.rate[g] = st.rate[g] === v ? 0 : v; render(); return; }
    if (t.closest('[data-send]')) send();
  }
  function markSeen() { const m = st.msgs.filter(x => x.from === 'admin').reduce((a, x) => Math.max(a, +x.t), 0); if (m) store.set('cg-fb-seen', String(m)); badge(); }
  const parse = r => ({ t: +r[0], mid: String(r[1]), vid: r[2], name: r[3], from: r[4], games: (() => { try { return JSON.parse(r[5] || '[]'); } catch (e) { return []; } })(), text: String(r[6] ?? '') });
  async function load() {
    try { const j = await (await fetch(ENDPOINT + '?mine=' + encodeURIComponent(VID) + '&_=' + Date.now())).json(); if (!j.rows) return; st.msgs = j.rows.map(parse).filter(m => m.vid === VID); st.loaded = true; st.pending = st.pending.filter(p => !st.msgs.some(m => m.mid === p.mid) && Date.now() - p.t < 120000); if (st.open && st.tab === 'mine') { markSeen(); render(); } else badge(); } catch (e) {}
  }
  function open(tab) { st.open = true; st.tab = tab || st.tab; if (st.tab === 'mine') { markSeen(); } render(); load(); setTimeout(() => $('#fbName')?.focus(), 50); }
  function close() { st.open = false; render(); }
  async function send() {
    const name = st.name.trim(), sel = chosen(), text = st.text.trim(), rated = sel.some(x => st.rate[x.g]);
    const bad = m => { st.note = m; render(); };
    if (!name) return bad('ใส่ชื่อผู้ส่งก่อนนะคะ (ผูกกับเครื่องนี้ ไว้ให้ผู้สร้างตอบกลับถูกคน)');
    if (!sel.length) return bad('ติ๊กเลือกอย่างน้อย 1 เกมก่อนนะคะ');
    if (!text && !rated) return bad('พิมพ์ข้อความหรือให้ดาวอย่างน้อยอย่างใดอย่างหนึ่งนะคะ');
    if (Date.now() - st.lastSend < 20000) return bad('ส่งถี่ไปหน่อย รอสักครู่แล้วลองใหม่นะคะ');
    st.busy = true; st.note = ''; render(); st.lastSend = Date.now(); store.set('cg-name', name);
    const mid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), gl = sel.map(x => ({ g: x.g, n: x.n, r: st.rate[x.g] || 0 }));
    try { await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ msg: { id: mid, vid: VID, name, games: gl, text } }) }); } catch (e) { st.busy = false; return bad('ส่งไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่นะคะ'); }
    st.pending.push({ mid, t: Date.now(), from: 'user', name, games: gl, text, pend: 1 }); st.busy = false; st.text = ''; st.sel = {}; st.rate = {};
    st.note = '✅ ส่งแล้ว! ขอบคุณมากค่ะ ผู้สร้างตอบกลับได้ที่แท็บ “ข้อความของฉัน”'; st.tab = 'mine'; render(); setTimeout(load, 2500); setTimeout(load, 8000);
  }
  btn.addEventListener('click', () => open());
  addEventListener('keydown', e => { if (e.key === 'Escape' && st.open) close(); });
  if (st.name) { setTimeout(load, 2500); setInterval(() => { if (!document.hidden) load(); }, 90000); } // เคยส่งแล้ว → คอยดูว่ามีข้อความตอบกลับไหม
  window.__cgFeedback = { open, st };
}
