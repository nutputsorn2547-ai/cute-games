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
    if (!silent) { if (x.health) S.toast(`🩺 ${x.t} — ช่วงนี้ป่วยบ่อย พักผ่อนให้พอนะ`, 4); else { S.big(`${x.e} แสตมป์ใหม่: ${x.t} — ดูที่สมุดบนโต๊ะ`, 3, '#f2a93b'); S.jingle?.(); } }
    CG.Bus.emit('stamp.got', { id: x.id }); try { refresh(); } catch (e) {} return true;
  };
  let busy = false;
  const check = () => {
    if (busy || CG.Bus.loading || (typeof lk !== 'undefined' && lk.on)) return; busy = true;
    try {
      const first = !A.retro; let k = 0;
      for (const x of LIST) { let ok = false; try { ok = x.c(); } catch (e) {} if (ok && award(x, first)) k++; }
      if (first) { A.retro = true; if (k) S.toast(`🏅 ได้แสตมป์ย้อนหลัง ${k} ดวง จากที่เคยทำไว้ — เปิดดูที่สมุดแสตมป์บนโต๊ะ`, 4.5); }
    } finally { busy = false; }
  };
  CG.Bus.on('career.switch', e => { if (e.data.id !== 'jl') CG.ctr.add('career.chosen'); }); // being let go is not a career change the player chose
  setInterval(check, 3000); setTimeout(check, 2500);
  CG.Bus.on('*', () => setTimeout(check, 50));

  /* ---- UI: a real book lying on the desk; click it to open a full-page two-page spread ---- */
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PER = 8, st = { on: false, pg: 0, el: null, seen: {} };
  const gotN = () => LIST.filter(x => A.got[x.id] != null).length;
  const pages = () => Math.ceil(LIST.length / PER);
  const rot = id => ((id.charCodeAt(0) * 7 + id.length * 13) % 11) - 5;       // fixed tilt per sticker, so it never jumps around
  function bookHtml() {
    const items = LIST.slice(st.pg * PER, st.pg * PER + PER);
    const left = items.map(x => { const g = A.got[x.id] != null; return `<li class="${g ? 'on' : ''} ${x.health ? 'hl' : ''}" data-id="${x.id}"><span class="ck">${g ? '✓' : ''}</span><div><b>${esc2(g ? x.t : '??? ยังไม่ได้รับ')}</b><small>${esc2(x.d)}</small></div></li>`; }).join('');
    const right = items.map(x => { const g = A.got[x.id] != null, nw = g && !st.seen[x.id]; return `<button class="sk ${g ? 'on' : 'off'} ${x.health ? 'hl' : ''} ${nw ? 'nw' : ''}" data-id="${x.id}" style="--r:${rot(x.id)}deg"><i>${x.e}</i>${g ? `<small>${esc2(x.t)}</small>` : ''}</button>`; }).join('');
    return `<div class="stcl"><button class="stx" data-b="x" aria-label="ปิดสมุด">✕</button><div class="stbk"><section class="pgL"><h2>แสตมป์ความสำเร็จ</h2><p class="stsub">สะสมแล้ว <b>${gotN()}</b> / ${LIST.length} ดวง</p><ul>${left}</ul></section><i class="ring"></i><section class="pgR"><div class="sheet">${right}</div><p class="stpg">หน้า ${st.pg + 1} / ${pages()}</p></section></div>
      <button class="stnav l" data-b="prev" ${st.pg ? '' : 'disabled'} aria-label="หน้าก่อน">◀</button><button class="stnav r" data-b="next" ${st.pg < pages() - 1 ? '' : 'disabled'} aria-label="หน้าถัดไป">▶</button></div>`;
  }
  function draw() { if (!st.el) return; st.el.innerHTML = bookHtml(); }
  function openBook() {
    if (st.on) return; st.on = true; st.pg = 0;
    st.el = h('div', { id: 'stBook' }); document.body.append(st.el); draw();
    st.el.addEventListener('click', e => {
      const b = e.target.closest('[data-b]'); if (b) { const a = b.dataset.b; if (a === 'x') closeBook(); else if (a === 'prev' && st.pg > 0) { st.pg--; draw(); } else if (a === 'next' && st.pg < pages() - 1) { st.pg++; draw(); } return; }
      const c = e.target.closest('[data-id]'); if (c) { const x = byId[c.dataset.id]; if (x) S.toast(`${A.got[x.id] != null ? x.e + ' ' + x.t + ' — ' : '🔒 '}${x.d}`, 3.4); }
      else if (e.target === st.el) closeBook();
    });
    setTimeout(() => { LIST.forEach(x => { if (A.got[x.id] != null) st.seen[x.id] = 1; }); deskBadge(); }, 1500);   // "new" glow fades after you have looked
  }
  function closeBook() { st.on = false; if (st.el) { st.el.remove(); st.el = null; } deskBadge(); }
  addEventListener('keydown', e => { if (e.key === 'Escape' && st.on) closeBook(); });
  function refresh() { if (st.on) draw(); deskBadge(); }
  /* the book on the desk */
  let deskEl = null;
  const newCount = () => LIST.filter(x => A.got[x.id] != null && !st.seen[x.id]).length;
  function deskBadge() { if (!deskEl) return; deskEl.querySelector('.stc').textContent = `${gotN()}/${LIST.length}`; deskEl.classList.toggle('has-new', newCount() > 0 && !st.on); }
  try {
    deskEl = h('div', { class: 'item stbookdesk', 'data-id': 'deco', title: 'สมุดแสตมป์ — กดเพื่อเปิดดู' }, '<div class="cov"><i class="rg"></i><i class="rg r2"></i><i class="rg r3"></i><span class="em">🏅</span><b>สมุดแสตมป์</b><em class="stc">0/0</em><u class="dot"></u></div>');
    deskEl.style.left = '76%'; deskEl.style.top = '40%'; deskEl.style.transform = 'rotate(-5deg)'; desk.append(deskEl);
    deskEl.addEventListener('click', e => { e.stopPropagation(); openBook(); }); deskBadge();
  } catch (e) { console.error('[stamps] desk', e); }
  const css = document.createElement('style');
  css.textContent = `.stbookdesk{cursor:pointer!important;z-index:2}.stbookdesk .cov{position:relative;width:104px;height:128px;border-radius:6px 14px 14px 6px;background:linear-gradient(135deg,#ff9a6b,#ff6f61);border:3px solid #e2553f;box-shadow:inset 0 0 0 4px #ffd2b8;text-align:center;padding-top:16px;box-sizing:border-box;color:#fff;transition:transform .15s}.stbookdesk:hover .cov{transform:translateY(-3px) rotate(1deg)}
  .stbookdesk .rg{position:absolute;left:-9px;top:14px;width:20px;height:9px;border-radius:6px;background:#a8dadc;border:2px solid #5aa4aa}.stbookdesk .r2{top:50px}.stbookdesk .r3{top:86px}
  .stbookdesk .em{display:block;font-size:34px;font-style:normal;filter:drop-shadow(0 2px 2px #0003)}.stbookdesk b{display:block;font-size:12px;margin-top:4px;text-shadow:0 1px 2px #0004}.stbookdesk .stc{display:inline-block;margin-top:6px;font-style:normal;font-size:11px;background:#fff;color:#e2553f;border-radius:10px;padding:1px 8px;font-weight:700}.stbookdesk .dot{display:none;position:absolute;right:-6px;top:-6px;width:16px;height:16px;border-radius:50%;background:#35c27a;border:2px solid #fff;animation:stpulse 1.1s infinite}.stbookdesk.has-new .dot{display:block}@keyframes stpulse{50%{transform:scale(1.3)}}
  #stBook{position:fixed;inset:0;z-index:46;background:radial-gradient(circle at 50% 30%,#f5efe0cc,#3a2b4acc);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:var(--font);animation:hmin .3s ease-out}
  #stBook .stcl{position:relative;width:min(960px,96vw);max-height:94vh}#stBook .stx{position:absolute;right:-6px;top:-14px;z-index:3;width:36px;height:36px;border-radius:50%;border:2px solid #e2553f;background:#fff;color:#e2553f;font-size:16px;cursor:pointer}
  #stBook .stbk{display:grid;grid-template-columns:minmax(0,1fr) 18px minmax(0,1fr);background:#ff7b63;border-radius:22px;padding:14px;box-shadow:0 20px 40px #0006;height:min(600px,84vh)}
  #stBook .ring{display:block;background:repeating-linear-gradient(#0000 0 34px,#a8dadc 34px 52px,#0000 52px 70px);border-radius:8px;margin:0 -6px;z-index:2;border-left:3px solid #5aa4aa55;border-right:3px solid #5aa4aa55}
  #stBook section{background:#fff7e8;padding:20px 22px;overflow:auto;box-sizing:border-box}#stBook .pgL{border-radius:12px 0 0 12px}#stBook .pgR{border-radius:0 12px 12px 0;background:#eaf6ee;display:flex;flex-direction:column}
  #stBook h2{margin:0;text-align:center;color:#2e8a6e;font-size:20px;background:#e7d7b8;border-radius:12px;padding:10px;border:3px solid #cdb98f}#stBook .stsub{text-align:center;color:#8a7a50;margin:8px 0 12px;font-size:13px}
  #stBook ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}#stBook li{display:flex;gap:10px;align-items:center;background:#f1e3c4;border:2px solid #d9c394;border-radius:10px;padding:6px 10px;opacity:.7}#stBook li.on{opacity:1;background:#fff0c9}#stBook li.hl.on{background:#dcf3ee}
  #stBook li .ck{flex:none;width:24px;height:24px;border-radius:50%;border:2px solid #b9a577;background:#fff;color:#2bb673;font-weight:900;display:flex;align-items:center;justify-content:center}#stBook li.on .ck{border-color:#2bb673}#stBook li b{display:block;font-size:13px;color:#5c4a22}#stBook li small{display:block;font-size:11px;color:#8a7a50;line-height:1.25}
  #stBook .sheet{flex:1;min-width:0;width:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:10px;background:linear-gradient(#bfe6ff,#e6f6ff 60%,#8fd18a 60%);border:5px solid #62c6a6;border-radius:12px;padding:12px}
  #stBook .sk{border:0;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(var(--r));font:inherit}#stBook .sk i{font-style:normal;font-size:44px;line-height:1;width:76px;height:76px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;box-shadow:0 0 0 4px #fff,0 6px 10px #0004}
  #stBook .sk.off i{background:#ffffff66;box-shadow:0 0 0 3px #ffffffaa;filter:grayscale(1) brightness(.4) opacity(.55);border:2px dashed #fff}#stBook .sk small{margin-top:8px;font-size:11px;font-weight:700;background:#fff;border-radius:8px;padding:1px 7px;color:#5c4a22}#stBook .sk.hl.on i{box-shadow:0 0 0 4px #bfeee3,0 6px 10px #0004}
  #stBook .sk.nw i{animation:stpop .8s ease-out}@keyframes stpop{0%{transform:scale(1.6) rotate(-20deg);opacity:0}60%{transform:scale(.9)}100%{transform:none;opacity:1}}
  #stBook .stpg{text-align:center;margin:8px 0 0;font-size:12px;color:#5c8a77}
  #stBook .stnav{position:absolute;top:50%;width:40px;height:40px;margin-top:-20px;border-radius:50%;border:3px solid #fff;background:#ff9a6b;color:#fff;font-size:16px;cursor:pointer;z-index:3}#stBook .stnav.l{left:-14px}#stBook .stnav.r{right:-14px}#stBook .stnav:disabled{opacity:.35;cursor:default}
  @media(max-width:760px){#stBook .stbk{grid-template-columns:1fr;height:auto;max-height:90vh;overflow:auto}#stBook .ring{display:none}#stBook section{border-radius:12px!important}#stBook .sheet{min-height:380px}}`;
  document.head.append(css);

  /* viewer in the developer panel */
  CG.Dev.add('🏅 แสตมป์ / ถ้วยรางวัล', box => {
    box.innerHTML = `<p>ได้แล้ว ${gotN()}/${LIST.length}</p><button data-s="open">เปิดสมุดแสตมป์</button> <button data-s="all">ปลดล็อกทุกดวง (ทดสอบ)</button> <button data-s="clear">ล้างแสตมป์</button>`;
    box.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; if (b.dataset.s === 'open') openBook(); else if (b.dataset.s === 'all') { LIST.forEach(x => award(x, true)); S.toast('🏅 ปลดล็อกทุกดวงแล้ว', 2); } else { A.got = {}; A.retro = false; refresh(); S.toast('ล้างแสตมป์แล้ว (จะย้อนหลังใหม่ตามข้อมูลจริง)', 2.4); } box.parentElement && box.closest('.devp') && setTimeout(() => { try { CG.Dev.rerender?.(); } catch (e2) {} }, 0); });
  });
  CG.stamps = { list: () => LIST.map(x => ({ id: x.id, got: A.got[x.id] ?? null })), check, award: id => award(byId[id], true) };
})();
