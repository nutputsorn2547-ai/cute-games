"use strict";
// Office game (beta) 1.3.0 — S4: monthly performance review, delivered as an HR e-mail on the 1st.
// It only informs: no effect on salary or position. Real sick leave never lowers the score. History is kept in ext.rev for the promotion work in 1.3.2.
(() => {
  const CG = window.CG; if (!CG || !CG.Save) return;
  const R = { last: null, list: [] };
  CG.Save.register('rev', { def: () => ({ last: null, list: [] }), get: () => ({ last: R.last, list: R.list }), set: d => { R.last = d && Number.isFinite(d.last) ? d.last : null; R.list = Array.isArray(d && d.list) ? d.list : []; } });
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gymNow = () => { const g = gnow(); return g.getFullYear() * 12 + g.getMonth(); };
  const gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const monthName = ym => new Date(Math.floor(ym / 12), ym % 12, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const GR = [[85, 'A', 'ยอดเยี่ยม', '#2bb673'], [70, 'B', 'ดี', '#4a90e2'], [50, 'C', 'พอใช้', '#f2a93b'], [0, 'D', 'ควรพัฒนา', '#e5536f']];

  const measure = ym => {
    const m = t => CG.ctr.month(t, ym), ok = m('mail.ok') + m('call.ok'), miss = m('mail.miss') + m('call.miss'), tasks = m('task.done'), sick = m('sick.start');
    const reliab = ok + miss ? Math.round(ok / (ok + miss) * 100) : null, output = Math.min(100, 35 + tasks * 5);
    let score = Math.round(reliab == null ? output : .6 * reliab + .4 * output), shielded = false; const raw = score;
    if (sick > 0 && score < 75) { score = 75; shielded = true; }          // valid sick leave must not hurt the score
    const g = GR.find(x => score >= x[0]);
    return { ym, score, grade: g[1], gname: g[2], color: g[3], tasks, ok, miss, sick, bills: m('bill.paid'), meet: m('meeting.done'), reliab, output, shielded, raw };
  };
  const advice = (r, prot) => {
    const a = [];
    if (r.sick >= 3) a.push('🩺 เดือนนี้ลาป่วยหลายครั้ง ดูแลสุขภาพและพักผ่อนให้พอนะ ไม่มีผลเสียต่อคะแนน');
    else if (r.sick) a.push('🤒 เดือนนี้มีลาป่วย ซึ่งเป็นเรื่องปกติ ไม่นับเป็นข้อเสียในการประเมิน');
    if (r.reliab != null && r.reliab < 70) a.push(prot ? '📞 ลองดูแถบสายเข้าและอีเมลสำคัญให้บ่อยขึ้นหน่อยนะ ตอนนี้ยังอยู่ในช่วงเรียนรู้ ไม่ต้องกังวล' : '📞 รับสายและตอบอีเมลสำคัญให้ทันมากขึ้น จะช่วยให้คะแนนดีขึ้นเยอะ');
    if (r.output < 60) a.push('✅ ลองทำงานในรายการให้เสร็จเพิ่มอีกนิด ทีละอย่างก็พอ');
    if (!a.length) a.push(r.score >= 85 ? '🌟 เก่งมาก รักษามาตรฐานนี้ไว้นะ' : '👍 ทำได้ดี ค่อยๆ พัฒนาต่อไป');
    return a;
  };
  const mailBody = (r, co, pos, prot, test) => `<p>เรียน พนักงาน${test ? ' <b>(ฉบับทดสอบ)</b>' : ''}</p><p>ฝ่ายบุคคล ${esc2(co)} ขอแจ้งผลสรุปการทำงานประจำเดือน <b>${esc2(monthName(r.ym))}</b> ตำแหน่ง ${esc2(pos)}</p>
    <div style="text-align:center;margin:10px 0"><div style="display:inline-block;border:3px solid ${r.color};border-radius:16px;padding:8px 26px"><div style="font-size:34px;font-weight:700;color:${r.color}">${r.score}</div><div style="font-weight:700;color:${r.color}">เกรด ${r.grade} · ${r.gname}</div></div></div>
    <ul><li>งานที่ทำเสร็จ: <b>${r.tasks}</b> งาน</li><li>รับสาย/ตอบอีเมลสำคัญทัน: <b>${r.ok}</b> · พลาด: <b>${r.miss}</b>${r.reliab != null ? ` (ตรงเวลา ${r.reliab}%)` : ''}</li><li>ประชุม: ${r.meet} ครั้ง · จ่ายบิล: ${r.bills} ครั้ง · ลาป่วย: ${r.sick} ครั้ง</li></ul>
    <p><b>ข้อแนะนำ</b></p><ul>${advice(r, prot).map(x => `<li>${esc2(x)}</li>`).join('')}</ul>${prot ? '<p>🌱 เดือนนี้ยังอยู่ในช่วงเรียนรู้งาน หัวหน้าและทีมพร้อมช่วยเสมอ</p>' : ''}
    <p style="color:#777;font-size:12px">ℹ️ ผลนี้ใช้เพื่อการพัฒนาตนเองเท่านั้น <b>ไม่มีผลต่อเงินเดือนหรือตำแหน่ง</b> และการลาป่วยที่ถูกต้องไม่ถูกนับเป็นข้อเสีย</p><p>ขอบคุณที่ตั้งใจทำงานค่ะ<br>ฝ่ายบุคคล</p>`;

  /* was the reviewed month (even partly) inside a protection period? */
  const wasProt = ym => {
    try {
      const i = CG.prot.info(), d0 = Math.round((new Date(Math.floor(ym / 12), ym % 12, 1) - dayStart(T0)) / DAY), d1 = Math.round((new Date(Math.floor(ym / 12), ym % 12 + 1, 1) - dayStart(T0)) / DAY) - 1;
      return i.base + 31 > d0 || (i.join != null && i.join + 7 > d0 && i.join <= d1);
    } catch (e) { return false; }
  };
  const review = (ym, test) => {
    const r = measure(ym), cj = career.cur && JOBS.find(j => j.id === career.cur), pos = cj ? cj.pos : (careerOf().pos || careerOf().label), prot = wasProt(ym);
    const company = cj ? cj.co : careerOf().co;
    mailPush(null, 'HR ' + company, `📊 ผลสรุปการทำงานประจำเดือน ${monthName(ym)}${test ? ' (ทดสอบ)' : ''}`, mailBody(r, company, pos, prot, test), 'news', gnow().getTime(), { review: 1 });
    if (!test) { R.list.push({ ym, score: r.score, raw: r.raw, shielded: r.shielded, grade: r.grade, tasks: r.tasks, ok: r.ok, miss: r.miss, sick: r.sick, bills: r.bills, prot, co: company, pos, at: gd() }); while (R.list.length > 36) R.list.shift(); CG.Bus.emit('review.done', { ym, score: r.score }); }
    S.toast(`📧 มีอีเมลจากฝ่ายบุคคล: ผลสรุปประจำเดือน ${monthName(ym)}`, 3.6); try { renderMail?.(); } catch (e) {} return r;
  };
  let busy = false;
  const check = () => {
    if (busy || CG.Bus.loading) return; busy = true;
    try {
      const now = gymNow();
      if (R.last == null) { R.last = now; return; }                       // first time: start counting from this month, nothing is invented about the past
      if (now > R.last) { const prev = now - 1; R.last = now; if (career.id !== 'jl') review(prev, false); }
      else if (now < R.last) R.last = now;                                   // clock moved back (slot change etc.)
    } finally { busy = false; }
  };
  CG.Bus.on('day.new', () => setTimeout(check, 100)); setInterval(check, 4000); setTimeout(check, 2800);
  CG.rev = { list: () => R.list.slice(), measure, review: ym => review(ym ?? gymNow() - 1, true), check };
  if (CG.Dev) CG.Dev.add('📊 รีวิวรายเดือน', box => { box.innerHTML = `<p>เก็บประวัติแล้ว ${R.list.length} เดือน</p><button data-r="t">ส่งอีเมลรีวิวเดือนที่แล้ว (ทดสอบ ไม่บันทึก)</button>`; box.addEventListener('click', e => { if (e.target.closest('[data-r="t"]')) CG.rev.review(); }); });
})();
