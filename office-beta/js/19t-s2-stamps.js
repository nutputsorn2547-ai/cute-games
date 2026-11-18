"use strict";
// Office game (beta) 1.3.0 — S2: stamp book (achievements).
// Retroactive stamps come only from real data already in the save (counters backfilled in S0); everything else counts from now on.
// Awards are stored once in ext.ach.got {id: game day}; re-checking can never award twice.
(() => {
  const CG = window.CG; if (!CG || !CG.Save || !CG.Dev) return;
  const A = { got: {}, retro: false };
  CG.Save.register('ach', { def: () => ({ got: {}, retro: false }), get: () => ({ got: A.got, retro: A.retro }), set: d => { A.got = (d && d.got) || {}; A.retro = !!(d && d.retro); } });
  const n = t => CG.ctr.n(t), gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const tenure = () => { const i = CG.prot ? CG.prot.info() : null; return i ? gd() - i.base : 0; };

  /* c = condition from real data; health = a gentle reminder, not a celebration */
  const LIST = [
    { id: 'task1', e: '✅', t: 'งานแรก', d: 'ทำงานในรายการเสร็จ 1 งาน', c: () => n('task.done') >= 1 },
    { id: 'task25', e: '🏃', t: 'มือใหม่ไฟแรง', d: 'ทำงานเสร็จ 25 งาน', c: () => n('task.done') >= 25 },
    { id: 'task100', e: '🏆', t: 'ตัวจริงสายงาน', d: 'ทำงานเสร็จ 100 งาน', c: () => n('task.done') >= 100 },
    { id: 'mail1', e: '✉️', t: 'ส่งอีเมลแรก', d: 'ส่งอีเมล 1 ฉบับ', c: () => n('mail.sent') >= 1 },
    { id: 'mail20', e: '📬', t: 'นักเขียนอีเมล', d: 'ส่งอีเมล 20 ฉบับ', c: () => n('mail.sent') >= 20 },
    { id: 'mailok10', e: '⚡', t: 'ตอบไว ไม่ตกหล่น', d: 'ตอบอีเมลสำคัญทัน 10 ฉบับ', c: () => n('mail.ok') >= 10 },
    { id: 'call5', e: '📞', t: 'เสียงใสรับสาย', d: 'รับสายลูกค้าสำเร็จ 5 สาย', c: () => n('call.ok') >= 5 },
    { id: 'bill3', e: '🧾', t: 'จ่ายบิลตรงเวลา', d: 'จ่ายบิล 3 ครั้ง', c: () => n('bill.paid') >= 3 },
    { id: 'meet1', e: '👥', t: 'เข้าประชุมครั้งแรก', d: 'ผ่านการประชุม 1 ครั้ง', c: () => n('meeting.done') >= 1 },
    { id: 'guide1', e: '🙋', t: 'กล้าถาม', d: 'เปิดคู่มือ/ขอความช่วยเหลือ 1 ครั้ง', c: () => n('guide.used') >= 1 },
    { id: 'job1', e: '💼', t: 'ได้งานใหม่', d: 'ตอบรับข้อเสนองาน 1 ครั้ง', c: () => n('job.accepted') >= 1 },
    { id: 'switch1', e: '🔀', t: 'เปลี่ยนสายอาชีพ', d: 'เปลี่ยนอาชีพ 1 ครั้ง', c: () => n('career.chosen') >= 1 },
    { id: 'lunch1', e: '🍱', t: 'พักเที่ยงอย่างมีความสุข', d: 'ผ่านช่วงพักเที่ยง 1 ครั้ง', c: () => n('lunch.start') >= 1 },
    { id: 'ten7', e: '🌱', t: 'ครบสัปดาห์แรก', d: 'เล่นครบ 7 วันในเกม', c: () => tenure() >= 7 },
    { id: 'ten31', e: '🌳', t: 'จบช่วงเรียนรู้งาน', d: 'ครบ 31 วันในเกม', c: () => tenure() >= 31 },
    { id: 'sick3', e: '🩺', t: 'ดูแลสุขภาพหน่อยนะ', d: 'ลาป่วย 3 ครั้งขึ้นไปในเดือนเดียว — ไม่ใช่รางวัล แต่เป็นตัวเตือนให้พักผ่อน', health: 1, c: () => CG.ctr.month('sick.start') >= 3 },
  ];
  const byId = Object.fromEntries(LIST.map(x => [x.id, x]));

  const award = (x, silent) => {
    if (A.got[x.id] != null) return false; A.got[x.id] = gd();
    if (!silent) { if (x.health) S.toast(`🩺 ${x.t} — ช่วงนี้ป่วยบ่อย พักผ่อนให้พอนะ`, 4); else { S.big(`${x.e} แสตมป์ใหม่: ${x.t}`, 2.6, '#f2a93b'); S.jingle?.(); } }
    CG.Bus.emit('stamp.got', { id: x.id }); try { refresh(); } catch (e) {} return true;
  };
  let busy = false;
  const check = () => {
    if (busy || CG.Bus.loading || (typeof lk !== 'undefined' && lk.on)) return; busy = true;
    try {
      const first = !A.retro; let k = 0;
      for (const x of LIST) { let ok = false; try { ok = x.c(); } catch (e) {} if (ok && award(x, first)) k++; }
      if (first) { A.retro = true; if (k) S.toast(`🏅 ได้แสตมป์ย้อนหลัง ${k} ดวง จากที่เคยทำไว้ — เปิดดูที่ “สมุดแสตมป์”`, 4.5); }
    } finally { busy = false; }
  };
  CG.Bus.on('career.switch', e => { if (e.data.id !== 'jl') CG.ctr.add('career.chosen'); }); // being let go is not a career change the player chose
  setInterval(check, 3000); setTimeout(check, 2500);
  CG.Bus.on('*', () => setTimeout(check, 50));

  /* ---- UI ---- */
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function refresh() { const W = wins.get('stamps'); if (W) draw(W.body.firstChild); }
  function draw(root) {
    const got = LIST.filter(x => A.got[x.id] != null).length;
    root.innerHTML = `<div class="sbk"><h3>🏅 สมุดแสตมป์</h3><p class="soft">สะสมแล้ว <b>${got}</b> / ${LIST.length} ดวง</p><div class="sgrid">${LIST.map(x => { const g = A.got[x.id] != null; return `<div class="stp ${g ? 'on' : ''} ${x.health ? 'hl' : ''}" data-id="${x.id}" title="${esc2(x.d)}"><i>${g ? x.e : '🔒'}</i><b>${esc2(g ? x.t : '???')}</b><small>${esc2(g ? '' : x.d)}</small></div>`; }).join('')}</div></div>`;
  }
  const openStamps = () => {
    if (wins.has('stamps')) { focusWin(wins.get('stamps')); refresh(); return; }
    const W = openWin('stamps', 'สมุดแสตมป์', h('div', { class: 'stamps' }), 420, 520, '#fff8e6'); draw(W.body.firstChild);
    W.body.firstChild.addEventListener('click', e => { const c = e.target.closest('.stp'); if (!c) return; const x = byId[c.dataset.id]; S.toast(`${A.got[x.id] != null ? x.e + ' ' + x.t + ' — ' : '🔒 '}${x.d}`, 3.4); });
  };
  GENERAL_APPS.push({ id: 'app-stamps', n: 'สมุดแสตมป์', e: '🏅', c: '#f2a93b', fn: openStamps });
  const css = document.createElement('style');
  css.textContent = '.stamps .sbk{padding:12px 14px}.stamps h3{margin:0 0 2px}.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.stp{background:#fff;border:2px dashed #e0d3b0;border-radius:14px;padding:8px 4px;text-align:center;opacity:.65;cursor:pointer}.stp.on{opacity:1;border:2px solid #f2a93b;background:#fffdf3}.stp.hl.on{border-color:#6fb7a8;background:#f1fbf8}.stp i{display:block;font-style:normal;font-size:28px}.stp b{display:block;font-size:12px}.stp small{display:block;font-size:10px;color:#8a7a50}';
  document.head.append(css);

  /* viewer in the developer panel */
  CG.Dev.add('🏅 แสตมป์ / ถ้วยรางวัล', box => {
    box.innerHTML = `<p>ได้แล้ว ${LIST.filter(x => A.got[x.id] != null).length}/${LIST.length}</p><button data-s="open">เปิดสมุดแสตมป์</button> <button data-s="all">ปลดล็อกทุกดวง (ทดสอบ)</button> <button data-s="clear">ล้างแสตมป์</button>`;
    box.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; if (b.dataset.s === 'open') openStamps(); else if (b.dataset.s === 'all') { LIST.forEach(x => award(x, true)); S.toast('🏅 ปลดล็อกทุกดวงแล้ว', 2); } else { A.got = {}; A.retro = false; refresh(); S.toast('ล้างแสตมป์แล้ว (จะย้อนหลังใหม่ตามข้อมูลจริง)', 2.4); } box.parentElement && box.closest('.devp') && setTimeout(() => { try { CG.Dev.rerender?.(); } catch (e2) {} }, 0); });
  });
  CG.stamps = { list: () => LIST.map(x => ({ id: x.id, got: A.got[x.id] ?? null })), check, award: id => award(byId[id], true) };
})();
