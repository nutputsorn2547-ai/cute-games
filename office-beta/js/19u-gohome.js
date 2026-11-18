"use strict";
// Office game (beta) 1.3.0 — "go home" = black screen + summary of the day, then sleep (skip to morning).
// Replaces the decorated home-room page. Old save data under `hm` (pets, furniture...) is carried through untouched.
(() => {
  const CG = window.CG; if (!CG || !CG.Save) return;
  const gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* keep whatever the old home mode saved (nothing reads it now, nothing deletes it) */
  let hmKeep = null;
  const _snap = snapshot; snapshot = () => { const s = _snap(); if (hmKeep) s.hm = hmKeep; return s; };
  const _load = loadGame;
  loadGame = function () { const ok = _load.apply(this, arguments); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); hmKeep = (s && s.hm) || null; } catch (e) {} ['n12chore', 'n12deco'].forEach(id => done.delete(id)); } return ok; };

  /* per-day history: money at the start of each day + the summaries we have shown */
  const D = { day: -1, bal0: 0, list: [] };
  CG.Save.register('days', { def: () => ({ day: -1, bal0: 0, list: [] }), get: () => ({ day: D.day, bal0: D.bal0, list: D.list }), set: d => { D.day = d && Number.isFinite(d.day) ? d.day : -1; D.bal0 = (d && +d.bal0) || 0; D.list = Array.isArray(d && d.list) ? d.list : []; } });
  const ensureDay = () => { const g = gd(); if (D.day !== g) { D.day = g; D.bal0 = bank.bal; } };
  CG.Bus.on('day.new', ensureDay); setTimeout(ensureDay, 1500);

  const today = () => {
    ensureDay(); const g = gd(), c = t => CG.ctr.today(t);
    const stamps = CG.stamps ? CG.stamps.list().filter(x => x.got === g).length : 0, certs = CG.certs ? CG.certs.list().filter(x => x.day === g).length : 0;
    const r = { d: g, tasks: c('task.done'), tasksAll: done.size, tasksTotal: TASKS.length, mail: c('mail.sent'), ok: c('mail.ok') + c('call.ok'), miss: c('mail.miss') + c('call.miss'), meet: c('meeting.done'), bills: c('bill.paid'), sick: c('sick.start'), lunch: c('lunch.start') > 0, stamps, certs, money: Math.round(bank.bal - D.bal0), bal: Math.round(bank.bal), stress: Math.round(life.stress), prot: !!(CG.prot && CG.prot.active()), left: CG.prot ? CG.prot.left() : 0 };
    return r;
  };
  const note = r => {
    if (r.sick) return '🤒 วันนี้ลาป่วย พักให้เต็มที่นะ พรุ่งนี้ค่อยว่ากัน';
    if (r.prot) return r.miss ? '🌱 วันนี้มีพลาดบ้างไม่เป็นไรนะ ยังอยู่ในช่วงปรับตัว พรุ่งนี้ลองดูใหม่' : '🌱 วันนี้ทำได้ดีในช่วงปรับตัว พรุ่งนี้สู้ต่อนะ';
    if (r.miss >= 2) return '😮‍💨 วันนี้พลาดหลายอย่าง พรุ่งนี้ลองไล่ดูสายเข้ากับอีเมลสำคัญให้ทัน';
    if (r.stress >= 70) return '🫠 วันนี้เครียดสูง นอนพักให้เต็มที่ ความเครียดจะลดลงมาก';
    return r.tasks ? '😊 วันนี้ทำงานได้เรียบร้อย พักผ่อนแล้วไปต่อพรุ่งนี้' : '🙂 วันนี้ยังไม่มีงานที่เสร็จ พรุ่งนี้ค่อยเริ่มใหม่ก็ได้';
  };
  const save = r => { const i = D.list.findIndex(x => x.d === r.d); if (i >= 0) D.list[i] = r; else D.list.push(r); D.list.sort((a, b) => a.d - b.d); while (D.list.length > 31) D.list.shift(); };

  /* ---- screens ---- */
  let ov = null, view = 0;
  const close = () => { if (ov) { ov.remove(); ov = null; } };
  const row = (e, t, v, cls = '') => `<div class="ghr ${cls}"><i>${e}</i><span>${t}</span><b>${v}</b></div>`;
  const card = r => `<div class="ghc"><h2>📋 สรุป${esc2(thDate(T0 + r.d * DAY, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</h2>
    ${row('✅', 'งานที่เสร็จวันนี้', `${r.tasks} งาน <small>(รวมทั้งหมด ${r.tasksAll}/${r.tasksTotal})</small>`)}
    ${row('✉️', 'ส่งอีเมล', `${r.mail} ฉบับ`)}${row('📞', 'รับสาย/ตอบอีเมลสำคัญทัน', `${r.ok}`)}${row('⚠️', 'พลาดสาย/อีเมลสำคัญ', `${r.miss}`, r.miss ? 'warn' : '')}
    ${r.meet ? row('👥', 'ประชุม', `${r.meet} ครั้ง`) : ''}${r.bills ? row('🧾', 'จ่ายบิล', `${r.bills} ครั้ง`) : ''}${row('🍱', 'พักเที่ยง', r.lunch ? 'ได้พักแล้ว' : 'ยังไม่ได้พัก')}
    ${row('💰', 'เงินวันนี้', `${r.money >= 0 ? '+' : '−'}${baht(Math.abs(r.money))} <small>(คงเหลือ ${baht(r.bal)})</small>`, r.money < 0 ? 'warn' : '')}${row('😣', 'ความเครียด', `${r.stress}/100`, r.stress >= 70 ? 'warn' : '')}
    ${r.stamps || r.certs ? row('🏅', 'ได้วันนี้', `${r.stamps ? r.stamps + ' แสตมป์ ' : ''}${r.certs ? r.certs + ' เกียรติบัตร' : ''}`) : ''}
    ${r.prot ? row('🌱', 'ช่วงเรียนรู้งาน', `เหลือ ${r.left} วัน`) : ''}<p class="ghn">${esc2(note(r))}</p></div>`;
  function showSummary() {
    const cur = today(), hist = D.list.filter(x => x.d !== cur.d), all = [...hist, cur]; if (view < 0 || view >= all.length) view = all.length - 1; const r = all[view];
    ov.innerHTML = `<div class="ghw"><div class="ghnav"><button data-g="prev" ${view > 0 ? '' : 'disabled'}>◀ วันก่อน</button><span>${view === all.length - 1 ? 'วันนี้' : 'ย้อนดู'}</span><button data-g="next" ${view < all.length - 1 ? '' : 'disabled'}>วันถัดไป ▶</button></div>${card(r)}
      <div class="ghb">${view === all.length - 1 ? '<button class="go" data-g="sleep">😴 นอนหลับ (ข้ามไปเช้า)</button>' : ''}<button data-g="back">↩ ยังไม่นอน</button></div></div>`;
  }
  function ask(left) {
    ov = h('div', { id: 'goHome', class: 'ask' }, `<div class="ghw"><div class="ghc"><h2>🏠 กลับบ้านเลย?</h2><p style="text-align:center;margin:6px 0">ค่ารถ <b>${baht(fare())}</b> บาท · ใช้เวลา ~${mins()} นาที${left ? `<br><small>ยังมีงานที่ยังไม่เสร็จ ${left} รายการ</small>` : ''}</p></div><div class="ghb"><button class="go" data-g="gook">🚕 กลับบ้าน</button><button data-g="no">ยังก่อน</button></div></div>`); document.body.append(ov);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; if (b.dataset.g === 'no') close(); else if (b.dataset.g === 'gook') { if (!bankPay(fare(), '🚕 ค่ารถกลับบ้าน')) return; timeOff += mins() * 60000; lastMin = ''; enforceDate(); close(); begin(); } });
  }
  function begin(opts = {}) {
    if (ov) return; ov = h('div', { id: 'goHome' }, `<div class="ghi">🌙<br>${opts.msg || 'กลับถึงบ้านแล้ว…'}</div>`); document.body.append(ov);
    try { complete('n12home'); } catch (e) {}
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b || b.disabled) return; const a = b.dataset.g;
      if (a === 'prev') { view--; showSummary(); } else if (a === 'next') { view++; showSummary(); } else if (a === 'back') close(); else if (a === 'sleep') sleep();
    });
    setTimeout(() => { if (!ov) return; ov.classList.add('sum'); view = 9999; showSummary(); }, 1700);
  }
  function sleep() {
    save(today()); try { complete('n12sleep'); } catch (e) {}
    ov.classList.remove('sum'); ov.innerHTML = '<div class="ghi">😴<br>กำลังนอนหลับ...<br><small>Zzz</small></div>';
    setTimeout(() => {
      const g = gnow(), t = new Date(g); t.setHours(7, 0, 0, 0); if (g.getHours() >= 5) t.setDate(t.getDate() + 1);
      timeOff += t.getTime() - g.getTime(); lastMin = ''; nightMsgSent = false; enforceDate();
      life.stress = Math.round(life.stress * .2); try { renderTime(); updateDeskCal(); } catch (e) {}
      S.big?.('☀️ ตื่นนอนแล้ว ความเครียดลด 80%', 2.4, '#f0a020'); S.jingle?.();
      if (ov) { ov.classList.add('out'); setTimeout(close, 700); }
    }, 1800);
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && ov && ov.classList.contains('sum')) close(); });

  /* ---- phone app tile "กลับบ้าน" ---- */
  const _rp = renderPhone;
  renderPhone = function () {
    _rp.apply(this, arguments);
    try { if (!phone.open || !phone.el || phone.app || phone.cur) return; const g = phone.el.querySelector('.phg'); if (!g || g.querySelector('[data-gh]')) return; g.insertAdjacentHTML('beforeend', '<button data-gh="go"><i style="background:#8a6df0">🏠</i>กลับบ้าน</button>'); } catch (e) { console.error(e); }
  };
  const fare = () => Math.max(10, Math.round(((bank.home && bank.home.km) || 1) * 12)), mins = () => Math.round(((bank.home && bank.home.km) || 1) * 3);
  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-gh="go"]')) return; try { closePhone(); } catch (x) {}
    if (ov) return; const jl = career.id === 'jl', left = TASKS.filter(t => !done.has(t.id)).length;
    if (!jl) { ask(left); return; }
    begin();
  });
  CG.goHome = { begin, today, history: () => D.list.slice() };
  if (CG.Dev) CG.Dev.add('🌙 กลับบ้าน / สรุปวัน', box => { box.innerHTML = '<button data-h="go">ดูหน้าจอดำ + สรุปวัน (ไม่เสียค่ารถ)</button>'; box.addEventListener('click', e => { if (e.target.closest('[data-h="go"]')) begin(); }); });

  const css = document.createElement('style');
  css.textContent = '#goHome{position:fixed;inset:0;z-index:80;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--font);animation:ghin .9s ease-out;transition:opacity .6s}#goHome.out{opacity:0}@keyframes ghin{from{opacity:0}to{opacity:1}}#goHome.ask{background:#000a;animation:none}#goHome .ghi{font-size:26px;line-height:1.8;animation:ghin 1.2s ease-out}#goHome .ghi small{font-size:14px;opacity:.6}'
    + '#goHome .ghw{width:min(520px,94vw);max-height:94vh;overflow:auto;animation:ghin .8s ease-out}#goHome .ghc{background:#15122b;border:2px solid #3a3470;border-radius:18px;padding:16px 18px;text-align:left}#goHome h2{margin:0 0 10px;font-size:17px;text-align:center;color:#ffd98a}'
    + '#goHome .ghr{display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid #ffffff14;font-size:14px}#goHome .ghr i{font-style:normal;width:24px;text-align:center}#goHome .ghr span{flex:1;color:#cfcaf0}#goHome .ghr b{color:#fff}#goHome .ghr small{font-weight:400;opacity:.65}#goHome .ghr.warn b{color:#ff9b8a}'
    + '#goHome .ghn{margin:12px 0 2px;text-align:center;color:#bfe9d4;font-size:14px}#goHome .ghnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;color:#9d97d6;font-size:13px}#goHome button{border:2px solid #5a54a8;background:#221e45;color:#fff;border-radius:12px;padding:6px 12px;font:inherit;cursor:pointer}#goHome button:disabled{opacity:.3;cursor:default}'
    + '#goHome .ghb{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap}#goHome .ghb .go{background:#6c63ff;border-color:#9d97ff;padding:9px 18px;font-weight:700}';
  document.head.append(css);
})();
