"use strict";
// Office game (beta) 1.3.0 — S1: beginner protection (boss coaches instead of scolding) + lunch break 12:00-13:00.
// Everything lives in this IIFE; only CG.prot and CG.lunch are exposed. Penalty spots in the old files ask CG.prot.active() / CG.lunch.on().
(() => {
  const CG = window.CG; if (!CG || !CG.Save) return;
  const PROT_DAYS = 31, JOIN_DAYS = 7;
  const gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const P = { base: null, join: null, co: null }, L = { bonusDay: -1 };
  CG.Save.register('prot', { def: () => ({ base: null, join: null, co: null }), get: () => ({ ...P }), set: d => Object.assign(P, { base: null, join: null, co: null }, d || {}) });
  CG.Save.register('lunch', { def: () => ({ bonusDay: -1 }), get: () => ({ ...L }), set: d => Object.assign(L, { bonusDay: -1 }, d || {}) });

  const base = () => { if (P.base == null) { const b = (typeof bank !== 'undefined' && Number.isFinite(bank.start)) ? Math.round((bank.start - dayStart(T0)) / DAY) : gd(); P.base = b; } return P.base; };
  const curCo = () => { const cj = career.cur && JOBS.find(j => j.id === career.cur); return cj ? cj.co : careerOf().co; };
  const prot = CG.prot = { force: null };
  prot.left = () => { const g = gd(); return Math.max(0, base() + PROT_DAYS - g, P.join != null ? P.join + JOIN_DAYS - g : 0); };
  prot.active = () => { try { return prot.force !== null ? !!prot.force : prot.left() > 0; } catch (e) { return false; } };
  prot.info = () => ({ active: prot.active(), left: prot.left(), base: base(), join: P.join, co: P.co });

  /* new company => 7 more protected days (a new position in the same company does not count) */
  const badge = () => { try { careerChip(); } catch (e) {} };
  let chk = 0;
  const check = () => { clearTimeout(chk); chk = setTimeout(() => {
    if (career.id === 'jl') return; // being jobless is not joining a company
    const co = curCo(); if (P.co == null) { P.co = co; return; } if (co === P.co) return;
    P.co = co; P.join = gd(); S.big('🌱 ช่วงปรับตัว 7 วัน — หัวหน้าจะช่วยสอนงานนะ', 3, '#4caf7d'); badge(); try { saveGame(); } catch (e) {}
  }, 0); };
  CG.Bus.on('career.switch', check); CG.Bus.on('job.accepted', check);
  CG.Bus.on('day.new', badge);
  setTimeout(() => { if (P.co == null && career.id !== 'jl') P.co = curCo(); base(); }, 1500);

  /* the boss coaches while protected: swap scolding lines (they all contain 😾) for gentle ones */
  const coach = t => {
    if (/ลาป่วย|ไม่สบาย|ไข้/.test(t)) return 'ดูแลสุขภาพก่อนนะ 🌱 ช่วงนี้ยังเป็นช่วงปรับตัว ไม่ต้องกังวลเรื่องงาน หายดีแล้วค่อยกลับมาคุยกัน';
    if (/สาย|ลูกค้า.*โทร|โทร/.test(t)) return 'พลาดสายไม่เป็นไรนะ 🌱 ครั้งหน้าลองเหลือบดูสายเข้าไว้ ถ้าติดงานพี่ช่วยรับให้ได้';
    if (/ประชุม|เอกสาร/.test(t)) return 'ประชุมวันนี้เอกสารยังไม่ครบนะ 🌱 ไม่เป็นไร ลองไล่เช็กรายการเอกสารอีกรอบ ไม่แน่ใจตรงไหนมาถามพี่ได้เลย';
    if (/เมล|อีเมล|ตอบ/.test(t)) return 'มีอีเมลสำคัญที่ยังไม่ได้ตอบนะ 🌱 ไม่ต้องตกใจ เปิดตอบตอนนี้ยังทัน มีอะไรไม่แน่ใจถามพี่ได้';
    if (/ค้าง|งาน.*เยอะ|รายการ/.test(t)) return 'งานเริ่มเยอะแล้วนะ 🌱 ลองทำทีละอย่าง เอาอันด่วนก่อน ไม่ไหวบอกพี่ได้ พี่ช่วยแบ่ง';
    if (/อู้|เล่น|ทำงานหรือยัง/.test(t)) return 'พักบ้างก็ดีนะ 🌱 แต่อย่าลืมงานหลักด้วยล่ะ ถ้าติดอะไรมาถามพี่ได้';
    return 'ช่วงนี้ยังเป็นช่วงปรับตัว 🌱 ไม่ต้องกดดันตัวเองนะ ติดตรงไหนมาถามพี่ได้เลย';
  };
  const soft = (who, t) => (who === 'boss' && typeof t === 'string' && t.includes('😾') && prot.active()) ? coach(t) : t;
  const _say = say; say = function (c, who, text, at, extra) { return _say.call(this, c, who, soft(who, text), at, extra); };
  const _push = pushMsg; pushMsg = function (id, who, text, ...r) { return _push.call(this, id, who, soft(who, text), ...r); };

  /* header badge */
  const _chip = careerChip;
  careerChip = function () { _chip.apply(this, arguments); const el = $('careerChip'); if (!el) return; el.querySelectorAll('.protBadge').forEach(x => x.remove()); if (prot.active()) el.append(h('em', { class: 'protBadge', title: 'ช่วงปรับตัว: หัวหน้าสอนงานแทนการตำหนิ ไม่หักคะแนน' }, prot.force !== null ? '🌱 ช่วงเรียนรู้งาน (ทดสอบ)' : `🌱 ช่วงเรียนรู้งาน เหลือ ${prot.left()} วัน`)); };

  /* ================= lunch break ================= */
  const lunch = CG.lunch = { force: null };
  lunch.on = () => { try { if (lunch.force !== null) return !!lunch.force; return career.id !== 'jl' && gnow().getHours() === 12; } catch (e) { return false; } };
  lunch.left = () => { const g = gnow(); return Math.max(0, 60 - g.getMinutes()); };
  let was = null;
  const pill = () => { let el = $('lunchHud'); const on = lunch.on(); if (!on) { el?.remove(); return; } if (!el) { el = h('div', { id: 'lunchHud' }); document.body.append(el); } el.textContent = `🍱 พักเที่ยง · เหลือ ${lunch.left()} นาที`; };
  setInterval(() => {
    try {
      const on = lunch.on(); if (was === null) { was = on; pill(); return; }
      if (on && !was) { was = true; if (life.boss) life.boss = null; S.toast('🍱 พักเที่ยงแล้ว (12:00–13:00) กินข้าว พักผ่อน เล่นได้เต็มที่ หัวหน้าไม่ตรวจนะ', 4); CG.Bus.emit('lunch.start', { day: gd() }); }
      else if (!on && was) { was = false; S.toast('⏰ หมดพักเที่ยงแล้ว กลับมาลุยงานกันต่อ', 3); CG.Bus.emit('lunch.end', { day: gd() }); }
      pill();
    } catch (e) {}
  }, 1000);

  /* a call that rings during lunch and is not picked up is not a missed call */
  const _end = endCall;
  endCall = function (how, ok) {
    const c = call.active;
    if (c && how === 'miss' && lunch.on()) {
      clearTimeout(c.to); call.next = gnow().getTime() + (1 + Math.random()) * 3600000; try { c.el.remove(); } catch (e) {} call.active = null;
      S.toast('📞 สายเข้าช่วงพักเที่ยง ไม่นับว่าพลาด', 2.4); CG.ctr?.add?.('call.lunchSkip'); return;
    }
    return _end.apply(this, arguments);
  };

  /* ordering lunch during the break relaxes you a little (once a day) */
  CG.Bus.on('task.done', e => {
    if (e.data.id !== 'eat' || !lunch.on() || L.bonusDay === gd()) return; L.bonusDay = gd();
    life.stress = Math.max(0, life.stress - 5); S.toast('😋 กินข้าวพักเที่ยง ความเครียดลดลง', 2.4);
  });

  const css = document.createElement('style');
  css.textContent = '#lunchHud{position:fixed;left:12px;bottom:56px;z-index:60;background:#fff7dc;color:#7a5a00;border:2px solid #ffd96b;border-radius:14px;padding:4px 12px;font-size:12px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.15)}.protBadge{display:block;font-style:normal;font-size:10px;color:#2e8a57;font-weight:700;margin-top:2px}';
  document.head.append(css);
})();
