"use strict";
// Office game — phone on the desk. Files load in order and share one global scope (see office/index.html).
/* ================= phone on the desk ================= */
const phone = { open: false, cur: null, el: null };
const phoneItem = deskItem('', 24, 4, -8, '<div class="phone"><div class="scr"><span class="pt"></span><small>แตะเพื่อ<br>ดูแชท</small></div></div>', 'phone');
function phoneBadge() { const n = chat.list.reduce((s, c) => s + (c.hidden ? 0 : c.unread), 0), ph = phoneItem.querySelector('.phone'); ph.querySelector('.nb2')?.remove(); if (n) ph.append(h('span', { class: 'nb2' }, String(n))); }
function phoneBuzz() { phoneItem.classList.remove('buzz'); void phoneItem.offsetWidth; phoneItem.classList.add('buzz'); S.vib(30); }
function openPhone() {
  closeOverlay(); closePhone(); phone.open = true; phone.cur = null;
  phone.el = h('div', { class: 'phov' }, '<div class="pframe"><div class="pscr"></div></div><button class="btn2" data-pclose style="position:absolute;right:24px;top:24px">วางมือถือ ✕</button>');
  phone.el.addEventListener('click', e => {
    if (e.target === phone.el || e.target.closest('[data-pclose]')) { closePhone(); return; }
    const dl = e.target.closest('[data-dl]'); if (dl) { downloadChatFile(dl.dataset.dl); return; }
    const it = e.target.closest('[data-pc]'); if (it) { phone.cur = it.dataset.pc; renderPhone(); phone.el.querySelector('.pc2 input')?.focus(); S.tone(900, 1000, .03, .04); return; }
    if (e.target.closest('[data-pback]')) { phone.cur = null; renderPhone(); return; }
    if (e.target.closest('[data-psend]')) phoneSend();
  });
  phone.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.pc2 input')) { e.preventDefault(); phoneSend(); } });
  document.body.append(phone.el); renderPhone(); complete('phone'); S.tone(900, 1200, .06, .05);
}
function closePhone() { if (phone.el) { phone.el.remove(); phone.el = null; } phone.open = false; phone.cur = null; }
function phoneSend() { const inp = phone.el.querySelector('.pc2 input'), t = inp.value.trim(); if (!t) return; inp.value = ''; sendMsg({ text: t }, chatById(phone.cur)); }
function renderPhone() {
  phoneBadge(); if (!phone.open || !phone.el) return;
  const scr = phone.el.querySelector('.pscr'), old = scr.querySelector('.pc2 input'), keep = old ? old.value : '', hadFocus = old && document.activeElement === old;
  const d = gnow(), sb = `<div class="sb"><span>${p2(d.getHours())}:${p2(d.getMinutes())}</span><span>📶 🔋 87%</span></div>`;
  if (!phone.cur) { scr.innerHTML = sb + `<div class="ph">💬 แชท</div><div class="pl">${chatListHTML(null, 'data-pc')}</div>`; return; }
  const c = chatById(phone.cur); c.unread = 0;
  scr.innerHTML = sb + `<div class="ph"><button data-pback aria-label="กลับ">‹</button>${esc(c.n)}</div><div class="pm">${c.msgs.map(msgHTML).join('')}</div><div style="font-size:11px;padding:2px 12px;color:#556;min-height:14px">${c.typing ? PEOPLE[c.typing].n + ' กำลังพิมพ์…' : ''}</div><div class="pc2"><input type="text" placeholder="พิมพ์ข้อความ…" spellcheck="false"><button data-psend>ส่ง</button></div>`;
  const pm = scr.querySelector('.pm'); pm.scrollTop = pm.scrollHeight;
  const inp = scr.querySelector('.pc2 input'); inp.value = keep; if (hadFocus) inp.focus();
  phoneBadge(); syncTaskbar();
}
phoneBadge();
