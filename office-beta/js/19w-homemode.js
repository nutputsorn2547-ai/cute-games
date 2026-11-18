"use strict";
// Office game (beta) 1.3.1-h1 — Home Computer Mode (step H1): separate home screen, 3s black transition,
// side-job folder, clock + bedtime (00:00, clock pinned at 23:59), finance split (main vs side income).
// Side jobs themselves arrive in H2/H3; here the apps are placeholders. Office UI stays untouched underneath.
(() => {
  const CG = window.CG; if (!CG || !CG.Save) return;
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const H = { on: false, bed: false, warnDay: -1, side: 0, hist: [] };
  CG.Save.register('home', {
    def: () => ({ on: false, bed: false, warnDay: -1, side: 0, hist: [] }),
    get: () => ({ on: H.on, bed: H.bed, warnDay: H.warnDay, side: H.side, hist: H.hist.slice(-120) }),
    set: d => { H.on = !!(d && d.on); H.bed = !!(d && d.bed); H.warnDay = d && Number.isFinite(d.warnDay) ? d.warnDay : -1; H.side = (d && +d.side) || 0; H.hist = Array.isArray(d && d.hist) ? d.hist : []; setTimeout(sync, 700); },
  });

  let hp = null, win = null, confirmSleep = false, busy = false;
  const min = () => { const g = gnow(); return g.getHours() * 60 + g.getMinutes(); };
  const leftMin = () => Math.max(0, 24 * 60 - min());
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const sleepWin = () => { const g = gnow(); return g.getHours() === 23 && g.getMinutes() >= 59; };
  const monthKey = d => { const t = new Date(T0 + d * DAY); return t.getFullYear() + '-' + t.getMonth(); };

  /* ---- keep the office quiet while the player is at home ---- */
  const WORKERS = ['boss', 'bear', 'bun', 'duck', 'cust', 'hr', 'g'];
  const _say = say; say = function (c, who, ...r) { if (H.on && c && (WORKERS.includes(c.id) || WORKERS.includes(who))) return; return _say.call(this, c, who, ...r); };
  const _pm = pushMsg; pushMsg = function (c, who, ...r) { if (H.on && (WORKERS.includes(c && c.id || c) || WORKERS.includes(who))) return; return _pm.call(this, c, who, ...r); };
  const _ring = ring; ring = function () { if (H.on) { call.next = gnow().getTime() + 20 * 60000; return; } return _ring.apply(this, arguments); };

  const _scam = scamRing; scamRing = function () { if (H.on) { scam.next = gnow().getTime() + 3600000; return; } return _scam.apply(this, arguments); };

  /* ---- screens ---- */
  const APPS_HOME = [['fold', '📂', 'อาชีพเสริม'], ['fin', '💰', 'การเงินและรายได้เสริม'], ['msg', '💬', 'ข้อความลูกค้า'], ['hist', '🗂️', 'ประวัติงานเสริม'], ['clock', '🕐', 'นาฬิกา']];
  const SUB = { novel: ['📖', 'นักตรวจนิยาย'], code: ['💻', 'นักแก้โค้ด'] };
  const tile = (id, e, t) => `<button class="hpi" data-hp="${id}"><i>${e}</i><span>${t}</span></button>`;
  const winBox = (title, body, back) => `<div class="hpw"><div class="hpt"><b>${title}</b>${back ? `<button data-hp="${back}">◀</button>` : ''}<button data-hp="x">✕</button></div><div class="hpb">${body}</div></div>`;
  const row = (t, v, c = '') => `<div class="hpr ${c}"><span>${t}</span><b>${v}</b></div>`;
  function winHtml() {
    if (win === 'fold') return winBox('📂 อาชีพเสริม', `<div class="hpg">${tile('novel', ...SUB.novel)}${tile('code', ...SUB.code)}</div><p class="hps">งานเสริมทำตอนไหนก็ได้ตามใจ ไม่มีใครบังคับ และไม่มีโทษถ้าวันนี้พัก</p>`);
    if (win === 'novel' || win === 'code') return winBox(SUB[win][0] + ' ' + SUB[win][1], `<div class="hpe">🛠️<p>งานนี้ยังไม่เปิดให้รับ<br><small>จะมาในอัปเดตถัดไป (ขั้น H2)</small></p></div>`, 'fold');
    if (win === 'fin') {
      const mk = monthKey(gd()), mo = H.hist.filter(x => monthKey(x.d) === mk).reduce((a, x) => a + x.amt, 0), sal = Math.round(hr.base || 0);
      return winBox('💰 การเงินและรายได้เสริม', `${row('🏦 เงินในบัญชีหลัก', '฿' + baht(bank.bal))}${row('💼 เงินเดือนประจำ', sal ? '฿' + baht(sal) + ' / เดือน' : 'ไม่มี')}<hr>${row('✨ บัญชีรายได้เสริม', '฿' + baht(H.side))}${row('📅 รายได้เสริมเดือนนี้', '฿' + baht(mo))}<p class="hps">รายได้เสริมแยกจากเงินเดือนหลัก ดูได้ชัดว่าเงินเดือนเท่าไหร่ รายได้เสริมเท่าไหร่</p>`);
    }
    if (win === 'msg') return winBox('💬 ข้อความลูกค้า', `<div class="hpe">📭<p>ยังไม่มีข้อความจากลูกค้า<br><small>เมื่อส่งงานเสริมสำเร็จ ลูกค้าจะตอบกลับที่นี่</small></p></div>`);
    if (win === 'hist') return winBox('🗂️ ประวัติงานเสริม', H.hist.length ? H.hist.slice(-30).reverse().map(x => row(esc2(x.job || 'งานเสริม') + ` <small>${esc2(thDate(T0 + x.d * DAY, { day: 'numeric', month: 'short' }))}</small>`, '+฿' + baht(x.amt))).join('') : `<div class="hpe">🗂️<p>ยังไม่มีประวัติงานเสริม<br><small>งานที่ส่งสำเร็จจะมาอยู่ที่นี่</small></p></div>`);
    if (win === 'clock') {
      const g = gnow(), L = leftMin(), real = Math.ceil(L / 12);
      return winBox('🕐 นาฬิกา', `<div class="hpc">${hm(g)}</div><div class="hps" style="text-align:center">${esc2(thDate(g, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>${row('🌙 เวลานอน', '00:00')}${row('⏳ เหลือเวลาส่วนตัว', `${Math.floor(L / 60)} ชม. ${L % 60} นาที <small>(≈ ${real} นาทีจริง)</small>`)}`
        + (confirmSleep ? `<div class="hpq"><p>จะข้ามเวลาที่เหลือของวันนี้ไปเข้านอนเลย<br><small>เวลาส่วนตัวที่เหลือจะไม่ได้ใช้ ไม่มีโทษและไม่มีโบนัสพิเศษ</small></p><button class="go" data-hp="sleepyes">ยืนยัน เข้านอน</button><button data-hp="sleepno">ยกเลิก</button></div>` : `<div class="hpq"><button class="go" data-hp="sleepask">🌙 เข้านอนเลย</button></div>`));
    }
    return '';
  }
  function bedHtml() { return `<div class="hpbed"><div class="hpbi">🌙</div><h2>ถึงเวลานอนแล้ว</h2><p>งานเสริมวันนี้ปิดรับแล้ว งานที่ทำค้างไว้เก็บไว้ให้หรือยกเลิกให้อย่างปลอดภัย ไม่มีโทษ</p><button class="go" data-hp="bedgo">😴 ดูสรุปประจำวัน แล้วนอนหลับ</button></div>`; }
  function render() {
    if (!hp) return; const sc = hp.querySelector('.hps0'); if (!sc) return;
    if (H.bed) { sc.innerHTML = bedHtml(); return; }
    sc.innerHTML = `<div class="hpd">${APPS_HOME.map(a => tile(...a)).join('')}</div>${win ? winHtml() : ''}<div class="hpbar"><span>🏠 บ้าน</span><b id="hpClk">${hm(gnow())}</b></div>`;
  }
  function build() {
    if (hp) return; hp = h('div', { id: 'homePC' }, `<div class="hpl"></div><div class="hpm"><div class="hps0"></div></div><div class="hpst"></div><div class="hpdesk"></div>`);
    document.body.append(hp); try { closePhone(); } catch (e) {}
    hp.addEventListener('click', onClick); render();
  }
  function destroy() { if (hp) { hp.remove(); hp = null; } win = null; confirmSleep = false; }
  function sync() { if (H.on && !hp) { build(); light(); } else if (!H.on && hp) destroy(); }
  function onClick(e) {
    const b = e.target.closest('[data-hp]'); if (!b) return; const a = b.dataset.hp;
    if (a === 'x') { win = null; confirmSleep = false; } else if (a === 'sleepask') confirmSleep = true; else if (a === 'sleepno') confirmSleep = false;
    else if (a === 'sleepyes') { skipToBed(); return; } else if (a === 'bedgo') { if (CG.goHome) CG.goHome.begin({ msg: 'เตรียมเข้านอน…' }); return; } else { win = a; confirmSleep = false; }
    render();
  }

  /* ---- time: warning 23:30, pinned at 23:59, bedtime ---- */
  function pin() { const g = gnow(); if (g.getHours() !== 23 || g.getMinutes() < 59) return; const lim = new Date(g); lim.setHours(23, 59, 0, 0); timeOff -= g.getTime() - lim.getTime(); lastMin = ''; }
  function skipToBed() { const g = gnow(), t = new Date(g); t.setHours(23, 59, 0, 0); if (t > g) { timeOff += t.getTime() - g.getTime(); lastMin = ''; try { enforceDate(); } catch (e) {} } confirmSleep = false; bedtime(); }
  function bedtime() { if (H.bed) return; H.bed = true; win = null; try { S.tone(330, 220, .35, .06); } catch (e) {} render(); }
  function light() { if (!hp) return; const m = min(), k = m < 19 * 60 ? .4 : Math.max(.1, .4 - (m - 19 * 60) / 300 * .3); hp.style.setProperty('--lamp', k.toFixed(2)); }
  function tick() {
    if (!H.on) return; const g = gnow();
    if (!H.bed) { if (sleepWin()) { pin(); bedtime(); } else if (g.getHours() < 5) bedtime(); }
    else if (sleepWin()) pin();
    if (!H.bed && min() >= 23 * 60 + 30 && H.warnDay !== gd()) { H.warnDay = gd(); try { S.big('🌙 อีก 30 นาทีจะถึงเวลานอน', 3, '#7d6dff'); } catch (e) {} }
    light(); const c = hp && hp.querySelector('#hpClk'); if (c) c.textContent = hm(gnow());
    if (hp && win === 'clock' && !confirmSleep) { const body = hp.querySelector('.hpw'); if (body) { const n = document.createElement('div'); n.innerHTML = winHtml(); const nb = n.firstElementChild; if (nb) body.replaceWith(nb); } }
  }
  setInterval(tick, 500);

  /* ---- enter / exit ---- */
  function enter(opts = {}) {
    if (busy || hp) return; busy = true; H.on = true; H.bed = false;
    const fade = h('div', { id: 'homeFade' }, `<div class="hfi">🌙<br>กลับถึงบ้านแล้ว…<br><small>${hm(gnow())}</small></div>`); document.body.append(fade);
    try { complete('n12home'); } catch (e) {}
    setTimeout(() => { build(); light(); if (min() >= 23 * 60 + 59) { pin(); bedtime(); } fade.classList.add('out'); }, 1300);
    setTimeout(() => { fade.remove(); busy = false; tick(); }, 3000);
  }
  function exit() { H.on = false; H.bed = false; destroy(); CG.Bus.emit('home.exit'); }
  CG.Bus.on('sleep.done', () => { if (H.on) exit(); });
  CG.home = {
    enter, exit, on: () => H.on, bed: () => H.bed, state: () => ({ on: H.on, bed: H.bed, win, side: H.side, hist: H.hist.slice() }),
    addSide: (job, amt, exp) => { H.side += amt; H.hist.push({ d: gd(), job, amt, exp: exp || 0 }); if (win) render(); },
  };

  /* ---- dev panel ---- */
  if (CG.Dev) CG.Dev.add('🏠 Home Mode', box => {
    box.innerHTML = '<button data-h="in">เข้าบ้านทันที (ไม่เสียค่ารถ)</button> <button data-h="t2325">ตั้งเวลา 23:25</button> <button data-h="t2355">ตั้งเวลา 23:55</button> <button data-h="t2000">ตั้งเวลา 20:00</button> <button data-h="out">ออกจาก Home Mode</button>';
    const set = (hh, mm) => { const g = gnow(), t = new Date(g); t.setHours(hh, mm, 0, 0); timeOff += t.getTime() - g.getTime(); lastMin = ''; try { enforceDate(); } catch (e) {} };
    box.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (!b) return; const a = b.dataset.h; if (a === 'in') enter(); else if (a === 'out') exit(); else if (a === 't2325') set(23, 25); else if (a === 't2355') set(23, 55); else if (a === 't2000') set(20, 0); });
  });

  const css = document.createElement('style');
  css.textContent = '#homeFade{position:fixed;inset:0;z-index:90;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--font);animation:hfin .8s ease-out;transition:opacity .8s}#homeFade.out{opacity:0}@keyframes hfin{from{opacity:0}to{opacity:1}}#homeFade .hfi{font-size:26px;line-height:1.8}#homeFade small{font-size:15px;opacity:.6}'
    + '#homePC{--lamp:.4;position:fixed;inset:0;z-index:70;font-family:var(--font);color:#e8e6ff;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 88% 12%,rgba(255,186,96,var(--lamp)),transparent 46%),linear-gradient(#0a0a1c,#14112b 70%,#1b1330)}'
    + '#homePC .hpl{position:absolute;top:4%;right:5%;width:70px;height:70px;border-radius:50%;background:radial-gradient(#ffd596,#ffb85c55 55%,transparent 70%);filter:blur(2px);opacity:calc(var(--lamp)*2)}#homePC .hpdesk{position:absolute;left:0;right:0;bottom:0;height:16%;background:linear-gradient(#2a1d25,#150e14)}'
    + '#homePC .hpm{position:relative;width:min(900px,94vw);height:min(540px,76vh);border:14px solid #1b1830;border-radius:18px;background:linear-gradient(145deg,#1d2c5c,#2b2060);box-shadow:0 0 90px #6c8cff55,0 0 0 2px #2c2860;overflow:hidden;z-index:2}#homePC .hps0{position:absolute;inset:0}'
    + '#homePC .hpd{position:absolute;left:14px;top:14px;display:flex;flex-direction:column;flex-wrap:wrap;gap:8px;max-height:calc(100% - 70px)}#homePC .hpi{width:92px;border:none;background:none;color:#e8e6ff;cursor:pointer;font:inherit;padding:6px 2px;border-radius:10px}#homePC .hpi:hover{background:#ffffff1a}#homePC .hpi i{display:block;font-style:normal;font-size:36px}#homePC .hpi span{font-size:12px;line-height:1.25;display:block}'
    + '#homePC .hpbar{position:absolute;left:0;right:0;bottom:0;height:38px;background:#0b0a22cc;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:14px}#homePC .hpbar b{font-variant-numeric:tabular-nums}'
    + '#homePC .hpw{position:absolute;left:120px;right:22px;top:16px;bottom:52px;background:#15122b;border:2px solid #4a4496;border-radius:14px;display:flex;flex-direction:column;overflow:hidden}#homePC .hpt{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#26205a}#homePC .hpt b{flex:1}#homePC .hpt button,#homePC button.go,#homePC .hpq button{border:2px solid #5a54a8;background:#221e45;color:#fff;border-radius:10px;padding:5px 12px;font:inherit;cursor:pointer}#homePC .hpb{padding:14px;overflow:auto;flex:1}'
    + '#homePC .hpg{display:flex;gap:12px;flex-wrap:wrap}#homePC .hpg .hpi{width:110px}#homePC .hpr{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-bottom:1px solid #ffffff14;font-size:14px}#homePC .hpr small,#homePC .hps small,#homePC .hpe small{opacity:.65;font-weight:400}#homePC .hps{color:#aaa6d8;font-size:13px;margin:12px 0 0}#homePC hr{border:none;border-top:1px dashed #ffffff30;margin:10px 0}'
    + '#homePC .hpe{text-align:center;padding:30px 10px;font-size:34px;color:#cfcaf0}#homePC .hpe p{font-size:14px;margin:8px 0 0}#homePC .hpc{font-size:54px;text-align:center;font-weight:700;letter-spacing:2px;color:#ffe9b0}#homePC .hpq{margin-top:14px;text-align:center}#homePC .hpq p{margin:0 0 10px;font-size:14px}#homePC button.go,#homePC .hpq .go{background:#6c63ff;border-color:#9d97ff;font-weight:700;padding:8px 16px}#homePC .hpq button{margin:0 4px}'
    + '#homePC .hpbed{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;background:#070716ee}#homePC .hpbi{font-size:54px}#homePC .hpbed h2{margin:6px 0;color:#ffd98a}#homePC .hpbed p{max-width:420px;color:#cfcaf0;font-size:14px}';
  document.head.append(css);
})();
