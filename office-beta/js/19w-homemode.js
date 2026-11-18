"use strict";
// Office game (beta) 1.3.1-h2 — Home Computer Mode: a small desktop of its own (movable/resizable windows, nested + new folders,
// rename/delete, drag-and-drop, full-screen), the novel-proofreader side job with EXP/levels, customer messages, side-income account.
// The office UI stays untouched underneath; all new code lives in this IIFE and is exposed as window.CG.home.
(() => {
  const CG = window.CG; if (!CG || !CG.Save) return;
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gd = () => Math.round((dayStart(gnow()) - dayStart(T0)) / DAY);
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const min = () => { const g = gnow(); return g.getHours() * 60 + g.getMinutes(); };
  const leftMin = () => Math.max(0, 24 * 60 - min());
  const sleepWin = () => { const g = gnow(); return g.getHours() === 23 && g.getMinutes() >= 59; };
  const monthKey = d => { const t = new Date(T0 + d * DAY); return t.getFullYear() + '-' + t.getMonth(); };

  /* ================= data ================= */
  const DEF_ITEMS = () => [
    { id: 'sj', t: 'dir', n: 'อาชีพเสริม', e: '📂', loc: 'desk', sys: 1 },
    { id: 'novel', t: 'app', n: 'นักตรวจนิยาย', e: '📖', loc: 'sj' }, { id: 'code', t: 'app', n: 'นักแก้โค้ด', e: '💻', loc: 'sj' }, { id: 'rev', t: 'app', n: 'นักรีวิว', e: '⭐', loc: 'sj' }, { id: 'det', t: 'app', n: 'นักสืบ', e: '🔍', loc: 'sj' }, { id: 'dtools', t: 'dir', n: 'เครื่องมือนักสืบ', e: '🧰', loc: 'sj', sys: 1 }, { id: 'rcpt', t: 'app', n: 'ค้นหาใบเสร็จ', e: '🧾', loc: 'dtools' }, { id: 'trk', t: 'app', n: 'ติดตามพัสดุ', e: '🚚', loc: 'dtools' }, { id: 'pic', t: 'app', n: 'รูปพัสดุ', e: '📷', loc: 'dtools' },
    { id: 'fin', t: 'app', n: 'การเงินและรายได้เสริม', e: '💰', loc: 'desk' }, { id: 'msg', t: 'app', n: 'ข้อความลูกค้า', e: '💬', loc: 'desk' },
    { id: 'hist', t: 'app', n: 'ประวัติงานเสริม', e: '🗂️', loc: 'desk' }, { id: 'pet', t: 'app', n: 'มุมสัตว์เลี้ยงและบรรยากาศ', e: '🐾', loc: 'desk' }, { id: 'clock', t: 'app', n: 'นาฬิกา', e: '🕐', loc: 'desk' },
  ];
  const H = { on: false, bed: false, warnDay: -1, side: 0, hist: [], msgs: [], skill: { novel: 0, code: 0, rev: 0, det: 0 }, cred: 50, revs: [], merged: true, job: null, items: DEF_ITEMS(), full: false, uid: 0, last: -1, pets: { cat: false, dog: false }, amb: '', lamp: 0, nextPet: 0, petAt: 0 };
  const fixItems = () => {
    const def = DEF_ITEMS(), ids = new Set(H.items.map(x => x.id)); def.forEach(d => { if (!ids.has(d.id)) H.items.push(d); });
    H.items = H.items.filter((x, i, a) => x && x.id && a.findIndex(y => y.id === x.id) === i);
    const dirs = new Set(H.items.filter(x => x.t === 'dir').map(x => x.id)); H.items.forEach(x => { if (x.loc !== 'desk' && !dirs.has(x.loc)) { x.loc = 'desk'; delete x.p; } });
  };
  CG.Save.register('home', {
    def: () => ({ on: false, bed: false, warnDay: -1, side: 0, hist: [], msgs: [], skill: { novel: 0, code: 0, rev: 0, det: 0 }, cred: 50, revs: [], merged: true, job: null, items: DEF_ITEMS(), full: false, uid: 0, last: -1, pets: { cat: false, dog: false }, amb: '', lamp: 0 }),
    get: () => ({ on: H.on, bed: H.bed, warnDay: H.warnDay, side: H.side, hist: H.hist.slice(-120), msgs: H.msgs.slice(0, 40), skill: H.skill, merged: H.merged, cred: H.cred, revs: H.revs.slice(0, 15), job: H.job, items: H.items, full: H.full, uid: H.uid, last: H.last, pets: H.pets, amb: H.amb, lamp: H.lamp }),
    set: d => {
      d = d || {}; H.on = !!d.on; H.bed = !!d.bed; H.warnDay = Number.isFinite(d.warnDay) ? d.warnDay : -1; H.side = +d.side || 0; H.hist = Array.isArray(d.hist) ? d.hist : []; H.msgs = Array.isArray(d.msgs) ? d.msgs : [];
      H.skill = { novel: +(d.skill && d.skill.novel) || 0, code: +(d.skill && d.skill.code) || 0, rev: +(d.skill && d.skill.rev) || 0, det: +(d.skill && d.skill.det) || 0 }; H.merged = d.merged === true; H.cred = Number.isFinite(d.cred) ? clamp(d.cred, 0, 100) : 50; H.revs = Array.isArray(d.revs) ? d.revs : []; H.job = d.job && typeof d.job.pid === 'number' ? d.job : null; H.items = Array.isArray(d.items) && d.items.length ? d.items : DEF_ITEMS(); H.full = !!d.full; H.uid = +d.uid || 0; H.last = Number.isFinite(d.last) ? d.last : -1; H.pets = { cat: !!(d.pets && d.pets.cat), dog: !!(d.pets && d.pets.dog) }; H.amb = d.amb === 'rain' || d.amb === 'night' ? d.amb : ''; H.lamp = [0, 1, 2].includes(d.lamp) ? d.lamp : 0;
      fixItems(); setTimeout(sync, 700); setTimeout(() => { if (!H.merged) { H.merged = true; if (H.side > 0) { try { bankTx('💼 ย้ายรายได้เสริมเดิมเข้าบัญชีหลัก', H.side); } catch (e) {} } } }, 1500);
    },
  });

  /* ---- levels: 1..10, pay x1 .. x3 ---- */
  const TH = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
  /* the office #hint toast sits under the home overlay, so home messages get their own toast inside it */
  let toastEl = null, toastT = 0;
  function toast(t, sec = 2) { try { if (!hp) { S.toast(t, sec); return; } if (!toastEl || !toastEl.isConnected) { toastEl = h('div', { class: 'hptoast' }); hp.append(toastEl); } toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl && toastEl.classList.remove('on'), sec * 1000); } catch (e) {} }
  const level = k => { const x = H.skill[k] || 0; let l = 1; TH.forEach((t, i) => { if (x >= t) l = i + 1; }); return l; };
  const mult = l => 1 + (l - 1) * 2 / 9;

  /* ---- novel passages: {wrong|right} marks a mistake; chunks are separated by spaces ---- */
  /* passages are split into WORDS by hand: a word is one tap, `_` = a gap between phrases, {wrong|right} = a misspelled word */
  const PASS = [
    ['ร้านขนมริมทาง', 'เมื่อ วัน {อาทิต|อาทิตย์} ที่ แล้ว _ ฉัน แวะ ไป ที่ ร้าน ขนมปัง เล็กๆ _ ใกล้ บ้าน _ ร้าน นี้ มี บรรยากาศ อบอุ่น _ ลูกค้า {สังเกตุ|สังเกต} เห็น กลิ่น เนย หอม ตั้งแต่ หน้า ประตู _ เจ้าของ ร้าน {อนุญาติ|อนุญาต} ให้ ชิม ขนม ได้ ฟรี _ ฉัน จึง ซื้อ กลับ บ้าน หลาย ชิ้น'],
    ['นักเขียนกับกำหนดส่ง', 'นักเขียน หนุ่ม นั่ง ทำงาน อยู่ ใน ห้อง เล็กๆ ริม หน้าต่าง _ เขา ต้อง {คำนวน|คำนวณ} เวลา ส่ง ต้นฉบับ ให้ ทัน ก่อน สิ้น เดือน _ บรรณาธิการ โทร มา อย่าง {กระทันหัน|กะทันหัน} _ ขอ ให้ แก้ ตอนจบ ใหม่ _ เขา จึง ไม่ ได้ {โอกาศ|โอกาส} พักผ่อน เลย ทั้ง คืน'],
    ['เมืองโบราณ', 'ผู้กล้า เดินทาง มาถึง เมือง โบราณ {ไกล้|ใกล้} ชายป่า _ ชาวเมือง เล่า ว่า ใน {บริเวน|บริเวณ} นั้น มี {ทรัพ|ทรัพย์} สิน ล้ำค่า ซ่อน อยู่ _ เขา จึง ตัดสินใจ ค้นหา ให้ ได้'],
    ['ร้านอาหารยามค่ำ', 'คุณ ลูกค้า คะ _ ขออภัย ที่ ให้ รอ นาน _ ตอนนี้ ร้าน อยู่ ใน {สถานการ|สถานการณ์} ที่ มี คน เยอะ มาก _ พนักงาน จะ รีบ จัด โต๊ะ ให้ ที่ {สดวก|สะดวก} ที่สุด _ ไม่ ทราบ ว่า ต้องการ สั่ง อะไร เพิ่ม ไหม {ค่ะ|คะ}'],
    ['กองเอกสาร', 'เขา เซ็น ชื่อ บน เอกสาร _ แล้ว {ลายเซ็นต์|ลายเซ็น} ของ เขา ก็ ดู หวัดๆ _ จน ผู้จัดการ {สังเกตุ|สังเกต} เห็น _ {ปริมาน|ปริมาณ} งาน ที่ กอง อยู่ บน โต๊ะ มี มาก เกินไป _ ผู้จัดการ จึง {อนุญาติ|อนุญาต} ให้ พัก ครึ่ง วัน'],
    ['เรื่องเล่าข้างกองไฟ', 'พระอาทิตย์ เริ่ม ตกดิน _ ทุกคน รวมตัว กัน {บริเวน|บริเวณ} ลาน กว้าง _ เด็กๆ นั่ง {ไกล้|ใกล้} กองไฟ _ เพื่อ ฟัง เรื่อง เล่า จาก ผู้เฒ่า _ ผู้เฒ่า บอก ว่า {ประโยชน|ประโยชน์} ของ การ เล่าเรื่อง _ คือ การ ส่งต่อ ความทรงจำ'],
    ['นักสืบกับรอยนิ้วมือ', 'นักสืบ หนุ่ม เปิด แฟ้ม คดี ออกมา _ แล้ว {สังเกตุ|สังเกต} ว่า มี รอย นิ้วมือ อยู่ ใน {บริเวน|บริเวณ} ประตู _ เขา โทร หา ตำรวจ {กระทันหัน|กะทันหัน} _ เพราะ ไม่ อยาก เสีย {โอกาศ|โอกาส} จับ คนร้าย'],
    ['โรงแรมริมทะเล', 'ยินดี ต้อนรับ สู่ โรงแรม ริมทะเล _ โรงแรม ของ เรา มี {บรรยากาส|บรรยากาศ} เงียบสงบ _ ห้องพัก ทุก ห้อง มี ความ {สดวก|สะดวก} ครบครัน _ ท่าน จะ มี {โอกาศ|โอกาส} ชม พระอาทิตย์ ตกดิน จาก ระเบียง'],
    ['ความลับในห้องสมุดเก่า', 'บ่าย วัน ฝน พรำ _ ณ _ ห้อง สมุด ประจำ เมือง ที่ เงียบ สงบ _ เด็ก สาว คน หนึ่ง เดิน ลัด เลาะ ไป ตาม ชั้น หนังสือ ไม้ สัก เก่า แก่ _ เธอ เอื้อม มือ ไป หยิบ สมุด บันทึก เล่ม หนา ที่ ซ่อน อยู่ ด้าน ใน สุด _ เมื่อ เปิด ออก ดู ก็ พบ แผนที่ โบราณ ที่ วาด ด้วย หมึก สี ดำ สนิท _ หัวใจ ของ เธอ เต้น แรง ด้วย ความ _ ตื่น เต้น _ ก่อน จะ รีบ จด บันทึก _ ราย ละเอียด _ สำคัญ ลง ใน สมุด ของ ตัว เอง _ เพื่อ ออก ตาม หา _ {สมบัด|สมบัติ} _ ที่ สาบสูญ ไป นาน แสน นาน'],
    ['ร้านกาแฟยามเช้า', 'แสง แดด อ่อนๆ _ ยาม เช้า สาด ส่อง ผ่าน กระจก บาน ใหญ่ เข้า มา ใน ร้าน กาแฟ เล็กๆ _ ริม ถนน _ บา ริ สต้า หนุ่ม กำลัง ตั้งใจ บด เมล็ด กาแฟ คั่ว สด ใหม่ _ กลิ่น หอม กรุ่น ลอย ฟุ้ง ไป ทั่ว ร้าน เพื่อ ต้อนรับ ลูกค้า คน แรก ของ วัน _ หญิง สาว ใน ชุด ทำงาน เดิน เข้า มา สั่ง เครื่อง ดื่ม แก้ว โปรด _ เธอ นั่ง จิบ กาแฟ พลาง มอง ดู ผู้คน ที่ เดิน ผ่าน ไป มา อย่าง เร่ง รีบ _ บรรยากาศ ที่ อบอุ่น ช่วย ให้ เช้า วัน จันทร์ ที่ แสน วุ่นวาย ของ เธอ _ ผ่อน คลาย _ และ เริ่ม ต้น วัน ใหม่ ได้ อย่าง _ ราบ รื่น _ โดย ไม่มี อะไร มา _ {รบกวณ|รบกวน} _ จิตใจ'],
    ['นักสืบในคืนพายุเข้า', 'เสียง ฟ้าร้อง คำราม กึกก้อง ไป ทั่ว ท้องฟ้า ใน ค่ำคืน ที่ มืด มิด _ นักสืบ เอกชน ยืน มอง รอย เท้า ปริศนา ที่ เปื้อน โคลน อยู่ บริเวณ หน้าต่าง บาน ใหญ่ _ เขา หยิบ แว่น ขยาย ขึ้น มา ส่อง ดู อย่าง ละเอียด เพื่อ หา เบาะแส ของ คนร้าย ที่ แอบ ลักลอบ เข้า มา ขโมย ภาพ วาด ล้ำค่า _ แม้ หลัก ฐาน จะ เหลือ น้อย เต็มที _ แต่ เขา ก็ ไม่ ยอม แพ้ และ มั่นใจ ว่า จะ สามารถ _ คลี่คลาย _ คดี นี้ ได้ ก่อน รุ่ง สาง _ เพื่อ นำ ตัวผู้ กระทำ ผิด มา ลงโทษ ตาม _ {กฏหมาย|กฎหมาย} _ ให้ จง ได้'],
    ['การเดินทางของนักดนตรีพเนจร', 'ชาย หนุ่ม สะพาย กีตาร์ โปร่ง คู่ใจ เดิน ไป ตาม ถนน คน เดิน ที่ เต็ม ไป ด้วย แสง สี และ ผู้คน _ เขา หยุด ยืน ตรง มุม ถนน เล็กๆ _ แล้ว เริ่ม ดีด สาย กีตาร์ บรรเลง บทเพลง ที่ แต่ง ขึ้น เอง _ เสียง ดนตรี ที่ ไพเราะ และ นุ่ม นวล ทำให้ ผู้คน ที่ เดิน ผ่าน ไป มา ต่าง พา กัน หยุด ฟัง ด้วย ความ ประทับ ใจ _ บาง คน ถึง กับ ปรบ มือ ให้ กำลัง ใจ และ หย่อน เงิน ลง ใน กล่อง กีตาร์ _ ทำให้ เขา รู้สึก _ ภาค ภูมิใจ _ ใน ความ สามารถ ของ ตัว เอง _ และ มี แรง บันดาล ใจ ที่ จะ สร้างสรรค์ _ {ผลงาณ|ผลงาน} _ ดีๆ _ ต่อ ไป อย่าง ไม่ ย่อท้อ'],
    ['เชฟฝึกหัดกับจานพิเศษ', 'ภายใน ห้อง ครัว ของ โรงแรม หรู ที่ เต็ม ไป ด้วย ความ วุ่นวาย _ เชฟ ฝึกหัด หนุ่ม กำลัง ยืน หน้า เตา ด้วย สีหน้า เคร่งเครียด _ วัน นี้ เขา ได้ รับ มอบ หมาย ให้ ปรุง อาหาร จาน หลัก สำหรับ แขก คน สำคัญ เป็น ครั้ง แรก _ เขา บรรจง เลือก _ {วัถถุดิบ|วัตถุดิบ} _ ชั้น ดี และ ควบคุม ไฟ อย่าง ระมัดระวัง ที่สุด _ เมื่อ อาหาร เสร็จ สมบูรณ์ และ ถูก จัด วาง ลง บน จาน อย่าง _ {ประนีต|ประณีต} _ กลิ่น หอม ของ เครื่อง เทศ ก็ เรียก คำ ชม จาก หัวหน้า เชฟ ได้ ใน ทันที'],
    ['คืนแห่งดวงดาวบนยอดดอย', 'นัก ท่อง เที่ยว กลุ่ม หนึ่ง ช่วย กัน กาง เต็นท์ บน ลาน กว้าง ยอด ดอย สูง _ ท่ามกลาง อากาศ ที่ หนาว เย็น จน แทบ จับ ขั้ว หัวใจ _ เมื่อ ความ มืด เข้าปก คลุม _ ท้องฟ้า เบื้อง บน ก็ เต็ม ไป ด้วย ดวงดาว นับ ล้าน ดวง ที่ ส่อง แสง ระยิบ ระยับ ราวกับ เพชร _ ทุก คน ต่าง นั่ง ล้อมวง ผิง ไฟ _ พูด คุย แลก เปลี่ยน เรื่อง ราว ชีวิต กัน อย่าง สนุกสนาน _ เป็น ค่ำคืน ที่ แสน _ {มหัสจรรย์|มหัศจรรย์} _ และ สร้าง ความ _ {ประทับไจ|ประทับใจ} _ ให้ กับ ทุก คนจน ยาก ที่ จะ ลืม เลือน'],
    ['ช่างซ่อมนาฬิกาผู้เฒ่า', 'ใน ตรอก เล็กๆ _ ท้าย ตลาด _ มี ร้าน ซ่อม นาฬิกา เก่า แก่ ที่ เปิด ให้ บริการ มา นาน กว่า ห้า สิบ ปี _ ชาย ชรา เจ้าของ ร้าน สวม แว่น ขยาย ข้าง เดียว _ กำลัง ใช้ คีม ขนาด เล็ก คีบ ฟัน เฟือง ตัว จิ๋ว ใส่ เข้าไป ใน เรือน นาฬิกา โบราณ อย่าง เบามือ _ เขา มี ความ อดทน และ _ {พิถีพิถัญ|พิถีพิถัน} _ ใน ทุก ขั้น ตอน _ เพราะ เชื่อ ว่า นาฬิกา ทุก เรือน ล้วน มี ชีวิต และ ความ ทรง จำ ของ เจ้าของ ซ่อน อยู่ _ เมื่อ เข็ม วินาที กลับ มา เดิน อีก ครั้ง _ รอย ยิ้ม แห่ง ความ _ {สุขสัน|สุขสันต์} _ ก็ ปรากฏ ขึ้น บน ใบหน้า ที่ มี ริ้ว รอย ของ เขา'],
    ['ภารกิจกู้ภัยกลางทะเลคลั่ง', 'คลื่น ยักษ์ ซัด กระหน่ำ เข้า ใส่ เรือ ประมง ลำ เล็ก ที่ กำลัง ลอยลำ อยู่ กลาง ทะเล ท่ามกลาง พายุ ฝน _ ทีม กู้ภัย ทาง ทะเล รีบ นำ เรือ ตรวจการณ์ ฝ่า กระแส ลม แรง ออก ไป ให้ ความ ช่วย เหลือ อย่าง เร่ง ด่วน _ กัปตัน เรือ บังคับ พวง มาลัย อย่าง _ {คล่องแคล้ว|คล่องแคล่ว} _ และ แม่นยำ _ เพื่อ เข้า เทียบ ข้าง เรือ ที่ กำลัง จะ จม _ ใน ที่สุด ลูก เรือ ทุก คน ก็ได้ รับ การ ช่วย เหลือ ขึ้น มา ได้ อย่าง _ {ปลอดไภย|ปลอดภัย} _ ท่ามกลาง เสียง โห่ ร้อง ด้วย ความ ดีใจ ของ เจ้า หน้าที่ ทุก นาย'],
    ['สวนดอกไม้ของคุณยาย', 'ทุกๆ _ เช้า ตรู่ _ คุณ ยาย จะ เดิน ถือ บัว รดน้ำ ออก มา ดูแล แปลง ดอกไม้ หลัง บ้าน ด้วย ความ รัก _ ดอก กุหลาบ หลาก สีสัน และ ดอก มะลิ สี ขาว บริสุทธิ์ ต่าง พา กัน ชู ช่อ รับ แสงแดด และ ส่ง กลิ่น หอม ฟุ้ง ไป ทั่ว บริเวณ _ ผีเสื้อ ตัว น้อย บิน โฉบ ไป มา อย่าง อิสระ _ คุณ ยาย นั่ง มอง สวน สวย ของ ตัว เอง พร้อม กับ จิบ น้ำ ชา อุ่นๆ _ รู้สึก ว่า ธรรมชาติ รอบ ตัว ช่าง _ {งดงาน|งดงาม} _ และ ช่วย เติม เต็ม ความ _ {สดชืน|สดชื่น} _ ให้ กับ ชีวิต ใน วัย เกษียณ ได้ เป็น อย่าง ดี'],
    ['ความฝันของนักบินอวกาศ', 'เด็ก ชาย ตัว น้อย นั่ง มอง ท้องฟ้า ยาม ค่ำคืน ผ่าน กล้องโทรทรรศน์ ตัว โปรด ที่ พ่อ ซื้อ ให้ เป็น ของ ขวัญ วัน เกิด _ เขา มอง เห็น หลุม อุกกาบาต บน ดวง จันทร์ ได้ อย่าง ชัดเจน จน รู้สึก ตื่น ตา ตื่น ใจ _ ใน สมุด วาด เขียน ของ เขา เต็ม ไป ด้วย ภาพ วาด ยาน อวกาศ และ มนุษย์ ต่าง ดาว ตาม จินตนาการ _ เขา ตั้ง ปณิธาน ไว้ ว่า จะ ตั้งใจ เรียน หนังสือ และ ออก กำลัง กาย ให้ แข็ง แรง _ เพื่อ ที่ วัน หนึ่ง จะ ได้ เดิน ทาง ไป _ {สำรวด|สำรวจ} _ อวกาศ อัน กว้าง ใหญ่ ไพศาล เหมือน กับ นักบิน อวกาศ ใน ดวงใจ'],
  ].map(([title, raw]) => { const chunks = raw.split(' ').map(c => { if (c === '_') return { sp: true, t: ' ' }; const m = c.match(/^\{([^|]+)\|([^}]+)\}$/); return m ? { t: m[1], err: true, w: m[1], r: m[2] } : { t: c, err: false }; }); return { title, chunks, n: chunks.filter(c => c.err).length }; });
  const N_BASE = 120, N_EXP = 45, N_MIN = 45;

  /* ---- code review job in plain Thai: find the setting line that causes the problem and pick the correct value ---- */
  /* line = [name, value, bug?]; bug = { fix, d: [wrong distractors], sym: what the player sees while it is still wrong, why } */
  const CODES = [
    { title: 'เกมยิงซอมบี้ — กระสุนพุ่งใส่ตัวเอง', diff: 1, sym: 'ยิงปืนแล้ว กระสุนพุ่งไปโดนผู้เล่นเอง ซอมบี้ไม่เป็นอะไรเลย', head: '[ปืน_01]', lines: [['เป้าหมาย', '"ผู้เล่น"', { fix: '"ซอมบี้"', d: ['"กำแพง"', '"ปืน_01"'], sym: 'กระสุนพุ่งใส่ผู้เล่นเอง', why: 'เป้าหมายของปืนต้องเป็นซอมบี้ ไม่ใช่ผู้เล่น' }], ['ความเร็วการยิง', '10'], ['ระยะการมองเห็น', '50 เมตร'], ['ดาเมจ', '40 หน่วย'], ['เริ่ม', 'เมื่อเริ่มเกม']] },
    { title: 'เกมแข่งรถ — รถวิ่งถอยหลัง', diff: 1, sym: 'กดคันเร่งแล้ว รถแดงวิ่งถอยหลังตลอด', head: '[รถ_แดง]', lines: [['ทิศทาง', '"ถอยหลัง"', { fix: '"เดินหน้า"', d: ['"เลี้ยวซ้าย"', '"จอดนิ่ง"'], sym: 'รถวิ่งถอยหลัง', why: 'ทิศทางต้องเป็นเดินหน้า' }], ['ความเร็วสูงสุด', '120 กม./ชม.'], ['เกียร์', '"อัตโนมัติ"'], ['เริ่ม', 'เมื่อกดปุ่มเริ่ม']] },
    { title: 'เกมฟาร์ม — ต้นข้าวไม่โตสักที', diff: 1, sym: 'ผ่านไปหลายวัน ต้นข้าวเหี่ยวเฉา ไม่โตเลย', head: '[ต้นข้าว_01]', lines: [['น้ำที่รดต่อวัน', '0 ลิตร', { fix: '5 ลิตร', d: ['500 ลิตร', '-5 ลิตร'], sym: 'ต้นข้าวไม่ได้รับน้ำ', why: 'น้ำที่รดต่อวันเป็น 0 ต้นข้าวจึงไม่โต ต้องมีน้ำพอเหมาะ' }], ['แสงแดดที่ต้องการ', '6 ชั่วโมง'], ['ระยะเวลาโตเต็มที่', '10 วัน'], ['เก็บเกี่ยว', 'เมื่อโตเต็มที่']] },
    { title: 'เกมแมวเก็บปลา — ปลาไม่หายและไม่ได้คะแนน', diff: 1, sym: 'แมวเดินชนปลาแล้ว ไม่มีอะไรเกิดขึ้น', head: '[ปลา_01]', lines: [['เมื่อแมวแตะ', '"ไม่ทำอะไร"', { fix: '"ปลาหายและเพิ่มคะแนน"', d: ['"ปลาเพิ่มจำนวน"', '"จบเกม"'], sym: 'แมวแตะปลาแล้วไม่เกิดอะไร', why: 'เมื่อแมวแตะปลา ปลาต้องหายไปและเพิ่มคะแนน' }], ['คะแนนต่อปลา', '10'], ['เวลาเกิดใหม่', '5 วินาที']] },
    { title: 'เกมร้านกาแฟ — ลูกค้าไม่จ่ายเงิน', diff: 2, sym: 'ลูกค้ารับกาแฟแล้วเดินออก เงินในร้านไม่เพิ่ม และบางครั้งกลับลดลง', head: '[ลูกค้า_01]', lines: [['สั่งเครื่องดื่ม', '"ลาเต้"'], ['ราคากาแฟ', '-50 บาท', { fix: '50 บาท', d: ['5 บาท', '500 บาท'], sym: 'เงินในร้านลดลง', why: 'ราคาติดลบ ลูกค้าจึงได้รับเงินแทนที่จะจ่าย' }], ['จ่ายเงิน', '"ไม่"', { fix: '"ใช่"', d: ['"บางครั้ง"', '"ลืม"'], sym: 'ลูกค้าไม่จ่ายเงิน', why: 'ค่าจ่ายเงินเป็น "ไม่" ลูกค้าจึงไม่จ่าย' }], ['ทิป', '0 บาท']] },
    { title: 'เกมกระโดด — ตัวละครกระโดดไม่ขึ้น', diff: 2, sym: 'กดปุ่มกระโดดแล้ว ตัวละครแทบไม่ลอยขึ้น และตกลงมาเร็วมาก', head: '[ตัวละคร_01]', lines: [['แรงกระโดด', '0', { fix: '12', d: ['1', '1200'], sym: 'ไม่มีแรงกระโดด', why: 'แรงกระโดดเป็น 0 จึงไม่ลอยขึ้นเลย' }], ['แรงโน้มถ่วง', '100', { fix: '10', d: ['0', '1000'], sym: 'ตกเร็วเกินไป', why: 'แรงโน้มถ่วงสูงเกินไป ตัวละครจึงดึงลงเร็วมาก' }], ['ความเร็วเดิน', '5'], ['กระโดดได้', 'เมื่อยืนบนพื้น']] },
    { title: 'เกมเลี้ยงน้องหมา — หมาหิวตลอดเวลา', diff: 2, sym: 'น้องหมาร้องหิวทุกครั้งที่เปิดเกม ให้อาหารแล้วก็ไม่อิ่ม', head: '[สุนัข_01]', lines: [['ความหิวเพิ่มทุก', '1 วินาที', { fix: '60 วินาที', d: ['0 วินาที', '1 ชั่วโมง'], sym: 'หิวเร็วเกินไป', why: 'ความหิวเพิ่มทุก 1 วินาที เร็วเกินไป ควรเป็นทุก 60 วินาที' }], ['ปริมาณอาหารที่ให้', '0 ถ้วย', { fix: '2 ถ้วย', d: ['20 ถ้วย', '-2 ถ้วย'], sym: 'ให้อาหารแล้วไม่อิ่ม', why: 'ให้อาหารครั้งละ 0 ถ้วย จึงไม่อิ่มเลย' }], ['เวลานอน', '22:00'], ['ความสุขเริ่มต้น', '5']] },
    { title: 'เกมอวกาศ — ยานชนแล้วไม่ตาย', diff: 2, sym: 'ยานชนอุกกาบาตแล้วได้คะแนนเพิ่ม และเกมจบทันทีตั้งแต่เริ่ม', head: '[ยานเล็ก]', lines: [['เมื่อชนอุกกาบาต', '"ได้คะแนนเพิ่ม"', { fix: '"เสียพลังชีวิต"', d: ['"ยานเร็วขึ้น"', '"ได้เหรียญ"'], sym: 'ชนแล้วได้คะแนน', why: 'ชนอุกกาบาตต้องเสียพลังชีวิต ไม่ใช่ได้คะแนน' }], ['พลังชีวิตเริ่มต้น', '0', { fix: '3', d: ['300', '-3'], sym: 'เกมจบทันที', why: 'พลังชีวิตเริ่มต้นเป็น 0 เกมจึงจบทันที' }], ['ความเร็วยาน', '8'], ['อาวุธ', '"เลเซอร์"']] },
    { title: 'เกมจับเวลา — เวลาเดินผิดทาง', diff: 2, sym: 'เวลานับเพิ่มขึ้นเรื่อยๆ ไม่เคยหมด เกมจึงไม่จบ', head: '[นาฬิกาเกม]', lines: [['เวลาเริ่มต้น', '60 วินาที'], ['นับเวลา', '"เพิ่มขึ้นทีละ 1"', { fix: '"ลดลงทีละ 1"', d: ['"หยุดนิ่ง"', '"เพิ่มขึ้นทีละ 10"'], sym: 'เวลาไม่ลดลง', why: 'การนับเวลาถอยหลังต้องลดลงทีละ 1' }], ['เมื่อเวลาเป็น 0', '"จบเกม"']] },
    { title: 'เกมทำอาหาร — อาหารไหม้ทุกจาน', diff: 2, sym: 'ทอดอะไรก็ไหม้เกรียมทุกครั้ง', head: '[กระทะ_01]', lines: [['ระดับไฟ', '"แรงสุด"', { fix: '"ปานกลาง"', d: ['"ปิดไฟ"', '"แรงสุดสองเท่า"'], sym: 'ไฟแรงเกินไป', why: 'ไฟแรงสุดทำให้อาหารไหม้ ควรใช้ไฟปานกลาง' }], ['เวลาทอด', '600 วินาที', { fix: '60 วินาที', d: ['6 วินาที', '6000 วินาที'], sym: 'ทอดนานเกินไป', why: 'ทอดนานถึง 600 วินาที อาหารจึงไหม้' }], ['น้ำมัน', '2 ช้อนโต๊ะ'], ['เมื่อเสร็จ', '"เสิร์ฟ"']] },
    { title: 'เกมป้องกันป้อม — ศัตรูเดินทะลุกำแพง', diff: 3, sym: 'ศัตรูเดินทะลุกำแพงเข้าป้อมได้ แถมไม่เสียพลังเมื่อโดนยิง และมาถึงเร็วผิดปกติ', head: '[ศัตรู_01]', lines: [['เดินผ่านกำแพงได้', '"ได้"', { fix: '"ไม่ได้"', d: ['"บางครั้ง"', '"เมื่อฝนตก"'], sym: 'ศัตรูทะลุกำแพง', why: 'ศัตรูต้องเดินผ่านกำแพงไม่ได้' }], ['พลังชีวิต', '100'], ['ความเร็วเดิน', '3'], ['รับดาเมจจากหอคอย', '0%', { fix: '100%', d: ['1000%', '-100%'], sym: 'ศัตรูไม่เสียพลังเมื่อโดนยิง', why: 'รับดาเมจ 0% ศัตรูจึงไม่เป็นอะไรเลย' }], ['ระยะมองเห็น', '30 เมตร'], ['เป้าหมาย', '"ป้อม"']] },
    { title: 'เกมซอมบี้ภาค 2 — ซอมบี้ไม่ยอมตาย', diff: 3, sym: 'ยิงซอมบี้จนกระสุนหมดแล้วก็ยังไม่ล้ม และกระสุนหมดเร็วผิดปกติ', head: '[ซอมบี้_01]', lines: [['พลังชีวิต', '99999', { fix: '100', d: ['10', '9'], sym: 'ซอมบี้อึดเกินไป', why: 'พลังชีวิต 99999 ทำให้ซอมบี้ไม่ตาย ควรเป็นประมาณ 100' }], ['ดาเมจที่รับจากปืน', '1'], ['ความเร็วเดิน', '2'], ['เมื่อพลังชีวิตเป็น 0', '"ล้ม"'], ['กระสุนต่อแม็ก', '3', { fix: '30', d: ['0', '300'], sym: 'กระสุนหมดเร็ว', why: 'กระสุนต่อแม็ก 3 นัดน้อยเกินไป ควรเป็นประมาณ 30' }], ['ระยะมองเห็น', '50 เมตร']] },
  ].map(p => { const pool = p.lines.map(l => l[1]); const lines = p.lines.map(([n, v, bug], i) => { const alts = bug ? [bug.fix, ...bug.d] : (() => { const m = String(v).match(/^(-?\d+)(.*)$/); const o = m ? [String(+m[1] * 2 + 1) + m[2], String(Math.max(1, Math.round(+m[1] / 2))) + m[2], String((+m[1] || 0) + 10) + m[2]] : pool.filter(x => x !== v).slice(0, 3); return o.filter(x => x !== v).slice(0, 3); })(); const opts = [v, ...alts].filter((x, k, a) => a.indexOf(x) === k).map((x, k) => [(k * 7 + i * 3 + p.title.length) % 11, x]).sort((a, b) => a[0] - b[0]).map(x => x[1]); return { n, v, bug, opts }; }); return { title: p.title, diff: p.diff, sym: p.sym, head: p.head, lines, nb: lines.filter(l => l.bug).length }; });
  const C_BASE = 160, C_EXP = 50, C_MIN = 50;
  const FROM_C = ['คุณก้อง (เจ้าของแอป)', 'คุณฟ้า (สตาร์ตอัพเล็กๆ)', 'คุณโอม (นักศึกษาฝึกเขียนโค้ด)', 'คุณนุ่น (หัวหน้าทีมเว็บ)'];
  const FROM = ['คุณนิรัตน์ (นักเขียนนิยายออนไลน์)', 'คุณมะลิ (สำนักพิมพ์เล็ก)', 'คุณพีท (นักเขียนมือใหม่)', 'คุณแพร (บรรณาธิการ)'];

  /* ================= keep the office quiet while at home ================= */
  const WORKERS = ['boss', 'bear', 'bun', 'duck', 'cust', 'hr', 'g'];
  const _say = say; say = function (c, who, ...r) { if (H.on && c && (WORKERS.includes(c.id) || WORKERS.includes(who))) return; return _say.call(this, c, who, ...r); };
  const _pm = pushMsg; pushMsg = function (c, who, ...r) { if (H.on && (WORKERS.includes(c && c.id || c) || WORKERS.includes(who))) return; return _pm.call(this, c, who, ...r); };
  const _ring = ring; ring = function () { if (H.on) { call.next = gnow().getTime() + 20 * 60000; return; } return _ring.apply(this, arguments); };
  const _scam = scamRing; scamRing = function () { if (H.on) { scam.next = gnow().getTime() + 3600000; return; } return _scam.apply(this, arguments); };

  /* ================= window manager ================= */
  let hp = null, mon = null, dsk = null, wl = null, W = [], zTop = 10, wid = 0, sel = null, menu = null, busy = false, res = null, confirmSleep = false, cdrag = null;
  const item = id => H.items.find(x => x.id === id);
  const kids = id => H.items.filter(x => x.loc === id);
  const inside = (id, anc) => { for (let c = item(id), n = 0; c && n < 30; c = item(c.loc), n++) { if (c.id === anc) return true; } return false; };
  const path = id => { const p = []; for (let c = item(id), n = 0; c && n < 30; c = item(c.loc), n++) p.unshift(c.n); return '🏠 ' + p.join(' › '); };
  const isFull = () => H.full || (typeof fsMode !== 'undefined' && fsMode.on);
  const dims = () => ({ w: mon ? mon.clientWidth : 800, h: mon ? mon.clientHeight - 38 : 480 });
  const CW = 100, CH = 96;
  const cap = () => { const d = dims(); return { c: Math.max(1, Math.floor((d.w - 10) / CW)), r: Math.max(1, Math.floor((d.h - 10) / CH)) }; };
  const occ = (c, r, but) => H.items.some(x => x.loc === 'desk' && x.p && x.id !== but && x.p.c === c && x.p.r === r);
  function freeCell(but, c0 = 0, r0 = 0) { const k = cap(); let best = null, bd = 1e9; for (let c = 0; c < k.c; c++) for (let r = 0; r < k.r; r++) { if (occ(c, r, but)) continue; const d = Math.abs(c - c0) * 1.5 + Math.abs(r - r0); if (d < bd) { bd = d; best = { c, r }; } } return best || { c: 0, r: 0 }; }
  function layoutDesk() { const k = cap(); H.items.filter(x => x.loc === 'desk').forEach(x => { if (!x.p || x.p.c >= k.c || x.p.r >= k.r) x.p = freeCell(x.id, 0, 0); }); }

  const badge = a => (a.id === 'msg' && H.msgs.some(m => m.unread)) ? `<b class="hpbd">${H.msgs.filter(m => m.unread).length}</b>` : '';
  const iconHtml = (a, pos) => `<button class="hpi${sel === a.id ? ' sel' : ''}" data-id="${a.id}" data-t="${a.t}" ${pos ? `style="left:${10 + a.p.c * CW}px;top:${10 + a.p.r * CH}px"` : ''}><i>${a.t === 'dir' ? (a.sys ? a.e : '📁') : a.e}</i><span>${esc2(a.n)}</span>${badge(a)}</button>`;
  function renderDesk() { if (!dsk) return; layoutDesk(); dsk.innerHTML = H.items.filter(x => x.loc === 'desk').map(a => iconHtml(a, true)).join(''); }

  const winTitle = w => w.k === 'dir' ? (item(w.ref) ? item(w.ref).e === '📂' ? '📂 ' + item(w.ref).n : '📁 ' + item(w.ref).n : '') : (item(w.ref) ? item(w.ref).e + ' ' + item(w.ref).n : '');
  const JOBAPPS = ['novel', 'code', 'rev', 'det', 'rcpt', 'trk', 'pic'];
  function openWin(k, ref) {
    const id = k + ':' + ref; let w = W.find(x => x.id === id);
    if (w) { w.min = false; focus(w); renderWins(); return; }
    const d = dims(), small = d.w < 720, n = W.length; w = { id, k, ref, x: 120 + (n % 5) * 26, y: 14 + (n % 5) * 24, w: Math.min(k === 'dir' ? 420 : JOBAPPS.includes(ref) ? 620 : 520, d.w - 140), h: Math.min(k === 'dir' ? 300 : JOBAPPS.includes(ref) ? 470 : 400, d.h - 30), z: ++zTop, min: false, max: small };
    if (small) { w.x = 0; w.y = 0; } W.push(w); renderWins(); if (ref === 'msg') { H.msgs.forEach(m => m.unread = false); renderDesk(); } 
  }
  const focus = w => { w.z = ++zTop; };
  function closeWin(id) { W = W.filter(x => x.id !== id); renderWins(); }
  function renderWins() {
    if (!wl) return; const d = dims();
    wl.innerHTML = W.filter(w => !w.min).map(w => { const mx = w.max, st = mx ? 'left:0;top:0;width:100%;height:100%' : `left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px`; return `<div class="hpw" data-w="${w.id}" style="${st};z-index:${w.z}"><div class="hpt"><b>${esc2(winTitle(w))}</b><button data-hp="min">–</button><button data-hp="max">${mx ? '❐' : '□'}</button><button data-hp="x">✕</button></div><div class="hpb" data-drop="${w.k === 'dir' ? w.ref : ''}">${bodyHtml(w)}</div>${mx ? '' : '<div class="hprz"></div>'}</div>`; }).join('');
    const tb = hp.querySelector('.hptask'); if (tb) tb.innerHTML = W.map(w => `<button class="${w.min ? '' : 'on'}" data-hp="tb" data-w="${w.id}">${esc2(winTitle(w))}</button>`).join('');
  }
  const refreshBody = id => { const w = W.find(x => x.id === id); const el = wl && wl.querySelector(`[data-w="${id}"] .hpb`); if (w && el) el.innerHTML = bodyHtml(w); };
  const refreshApp = ref => W.filter(w => w.k === 'app' && w.ref === ref).forEach(w => refreshBody(w.id));
  const refreshDirs = () => W.filter(w => w.k === 'dir').forEach(w => { if (!item(w.ref)) closeWin(w.id); else refreshBody(w.id); });

  /* ================= window bodies ================= */
  const row = (t, v, c = '') => `<div class="hpr ${c}"><span>${t}</span><b>${v}</b></div>`;
  const empty = (e, t, s) => `<div class="hpe">${e}<p>${t}${s ? `<br><small>${s}</small>` : ''}</p></div>`;
  function dirHtml(w) {
    const k = kids(w.ref), cur = item(w.ref), up = cur && cur.loc !== 'desk' ? cur.loc : null;
    return `<div class="hpnav"><button data-hp="up" data-to="${up || ''}" ${up ? '' : 'disabled'}>◀</button><span>${esc2(path(w.ref))}</span><button data-hp="newdir" data-in="${w.ref}">＋📁 โฟลเดอร์ใหม่</button></div><div class="hpgrid">${k.length ? k.map(a => iconHtml(a, false)).join('') : '<p class="hps">โฟลเดอร์ว่าง — ลากไอคอนมาวางได้ หรือคลิกขวาเพื่อสร้างโฟลเดอร์</p>'}</div>`;
  }
  function bodyHtml(w) {
    if (w.k === 'dir') return dirHtml(w);
    const r = w.ref;
    if (r === 'novel') return novelHtml();
    if (r === 'code') return codeHtml();
    if (r === 'pet') return petHtml();
    if (r === 'rev') return revHtml();
    if (r === 'det') return detHtml();
    if (r === 'rcpt' || r === 'trk' || r === 'pic') return toolHtml(r);
    if (r === 'fin') { const mk = monthKey(gd()), mo = H.hist.filter(x => x.amt > 0 && monthKey(x.d) === mk).reduce((a, x) => a + x.amt, 0), sal = Math.round(hr.base || 0); return `${row('🏦 เงินในบัญชี (เงินเดือน + รายได้เสริม)', '฿' + baht(bank.bal))}${row('💼 เงินเดือนประจำ', sal ? '฿' + baht(sal) + ' / เดือน' : 'ไม่มี')}<hr>${row('✨ รายได้เสริมเดือนนี้', '฿' + baht(mo))}${row('📈 รายได้เสริมสะสมทั้งหมด', '฿' + baht(H.side))}<p class="hps">เงินจากงานเสริมเข้าบัญชีเดียวกับเงินเดือน รวมกันในยอดเงินด้านบน ดูรายการแยกได้ที่ประวัติงานเสริม หรือรายการเดินบัญชีของธนาคาร</p>`; }
    if (r === 'msg') return H.msgs.length ? H.msgs.map(m => `<div class="hpm1"><b>${esc2(m.from)}</b> <small>${esc2(m.at)}</small><p>${esc2(m.text)}</p></div>`).join('') : empty('📭', 'ยังไม่มีข้อความจากลูกค้า', 'เมื่อส่งงานเสริมสำเร็จ ลูกค้าจะตอบกลับที่นี่');
    if (r === 'hist') return H.hist.length ? H.hist.slice(-30).reverse().map(x => row(esc2(x.job || 'งานเสริม') + ` <small>${esc2(thDate(T0 + x.d * DAY, { day: 'numeric', month: 'short' }))}${x.exp ? ' · +' + x.exp + ' EXP' : ''}</small>`, (x.amt < 0 ? '−฿' + baht(-x.amt) : '+฿' + baht(x.amt)))).join('') : empty('🗂️', 'ยังไม่มีประวัติงานเสริม', 'งานที่ส่งสำเร็จจะมาอยู่ที่นี่');
    if (r === 'clock') { const g = gnow(), L = leftMin(); return `<div class="hpc">${hm(g)}</div><div class="hps" style="text-align:center">${esc2(thDate(g, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>${row('🌙 เวลานอน', '00:00')}${row('⏳ เหลือเวลาส่วนตัว', `${Math.floor(L / 60)} ชม. ${L % 60} นาที <small>(≈ ${Math.ceil(L / 12)} นาทีจริง)</small>`)}` + (confirmSleep ? `<div class="hpq"><p>จะข้ามเวลาที่เหลือของวันนี้ไปเข้านอนเลย<br><small>เวลาส่วนตัวที่เหลือจะไม่ได้ใช้ ไม่มีโทษและไม่มีโบนัสพิเศษ</small></p><button class="go" data-hp="sleepyes">ยืนยัน เข้านอน</button><button data-hp="sleepno">ยกเลิก</button></div>` : `<div class="hpq"><button class="go" data-hp="sleepask">🌙 เข้านอนเลย</button></div>`); }
    return '';
  }
  function novelHtml() {
    const l = level('novel'), x = H.skill.novel, lo = TH[l - 1], hi = TH[l] || TH[9], pc = l >= 10 ? 100 : Math.round((x - lo) / (hi - lo) * 100);
    const head = `<div class="hpl2"><b>เลเวล ${l}${l >= 10 ? ' (สูงสุด)' : ''}</b> <small>EXP ${x}${l >= 10 ? '' : ' / ' + hi}</small> <span class="hpx">ค่าตอบแทน ×${mult(l).toFixed(2)}</span><div class="hpbar2"><i style="width:${pc}%"></i></div></div>`;
    if (res && !res.k) return head + `<div class="hpres"><h3>${res.acc >= .9 ? '🌟 ตรวจได้ยอดเยี่ยม' : res.acc >= .6 ? '👍 ตรวจได้ดี' : '🙂 ส่งงานแล้ว'}</h3>${row('ตรวจเจอและพิมพ์คำถูกต้อง', `${res.found}/${res.n} จุด`)}${res.half ? row('เจอคำผิดแต่พิมพ์คำแก้ไม่ตรง', res.half + ' จุด', 'warn') : ''}${res.fp ? row('ทำเครื่องหมายผิดที่', res.fp + ' จุด', 'warn') : ''}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<p class="hps">เฉลย: ${res.rev.length ? res.rev.map(c => `<s>${esc2(c.w)}</s> → <b>${esc2(c.r)}</b>`).join(' · ') : '-'}</p><div class="hpq"><button class="go" data-hp="nnext">งานต่อไป</button></div></div>`;
    if (H.job && H.job.k) return head + '<p class="hps">ตอนนี้มีงานอื่นที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    if (H.job) {
      const p = PASS[H.job.pid]; if (!p) { H.job = null; return novelHtml(); }
      return head + `<h3 class="hpjt">📖 ${esc2(p.title)}</h3><p class="hps">แตะคำที่คิดว่าเขียนผิด แล้วพิมพ์คำที่ถูกต้องในช่องด้านล่าง (มีผิด ${p.n} จุด) แตะซ้ำเพื่อยกเลิก</p><div class="hptx">${p.chunks.map((c, i) => c.sp ? '<span class="hpsp"></span>' : `<button class="hpck${H.job.marks.includes(i) ? ' hpmk' : ''}" data-hp="mark" data-i="${i}">${esc2(c.t)}</button>`).join('')}</div><div class="hpfix">${fixHtml()}</div><div class="hpq"><span class="hps" id="hpmc">ทำเครื่องหมายแล้ว ${H.job.marks.length} จุด</span><br><button class="go" data-hp="nsubmit">📨 ส่งงาน</button><button data-hp="ncancel">ยกเลิกงาน (ไม่เสียอะไร)</button></div>`;
    }
    const can = leftMin() >= N_MIN;
    return head + `<div class="hpjob"><h3>📖 งานตรวจคำผิดนิยาย</h3><p>ตรวจต้นฉบับสั้นๆ แล้วหาคำที่สะกดผิดให้ครบ<br><small>ประมาณ ${N_MIN} นาทีเกม (≈ ${Math.round(N_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(N_BASE * mult(l)))}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="naccept">✅ รับงาน</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">ไม่มีโทษถ้าไม่รับงาน งานที่ทำค้างไว้ตอนเข้านอนจะถูกเก็บไว้ให้</p></div>`;
  }
  function novelAccept() {
    if (H.job || leftMin() < N_MIN) return; let i; do { i = Math.floor(Math.random() * PASS.length); } while (PASS.length > 1 && i === H.last); H.last = i; H.job = { pid: i, marks: [] }; res = null; refreshApp('novel');
  }
  const normW = t => String(t || '').normalize('NFC').replace(/[\s\u200b]+/g, '');
  function fixHtml() {
    const j = H.job; if (!j || j.k) return ''; const p = PASS[j.pid]; if (!p) return ''; j.fix = j.fix || {};
    return j.marks.length ? j.marks.slice().sort((a, b) => a - b).map(i => `<label class="hpfr"><s>${esc2(p.chunks[i].t)}</s> → <input data-fx="${i}" value="${esc2(j.fix[i] || '')}" placeholder="พิมพ์คำที่ถูกต้อง" autocomplete="off" spellcheck="false"></label>`).join('') : '<p class="hps">ยังไม่ได้เลือกคำ</p>';
  }
  function novelSubmit() {
    if (!H.job) return; const p = PASS[H.job.pid], m = H.job.marks, fx = H.job.fix || {}, hit = m.filter(i => p.chunks[i].err), found = hit.filter(i => normW(fx[i]) === normW(p.chunks[i].r)).length, half = hit.length - found, fp = m.length - hit.length, acc = clamp((found + half * .25 - fp * .5) / p.n, 0, 1), l0 = level('novel');
    const pay = Math.round(N_BASE * mult(l0) * acc), exp = Math.round(N_EXP * (.4 + .6 * acc)); H.skill.novel = Math.min(TH[9], H.skill.novel + exp); const l1 = level('novel');
    earn(pay, 'ตรวจนิยาย: ' + p.title); H.hist.push({ d: gd(), job: 'ตรวจนิยาย: ' + p.title, amt: pay, exp }); const at = hm(gnow());
    const txt = acc >= .9 ? 'ละเอียดมากเลยค่ะ ขอบคุณที่ช่วยตรวจนะคะ 🥰 โอนค่าตอบแทนให้แล้วนะคะ' : acc >= .6 ? 'ตรวจได้ดีเลยค่ะ มีหลุดไปนิดหน่อยแต่ไม่เป็นไร ไว้ฝากงานอีกนะคะ' : 'ขอบคุณที่ช่วยกันนะคะ ยังมีที่ตกหล่นอยู่บ้าง รอบหน้าลองดูอีกทีนะ 🙂';
    H.msgs.unshift({ from: pick(FROM), at, text: txt, unread: true }); if (l1 > l0) H.msgs.unshift({ from: 'คุณแพร (บรรณาธิการ)', at, text: `เห็นว่าฝีมือพัฒนาขึ้นมากเลย ตอนนี้เลเวล ${l1} แล้ว ค่าตอบแทนขึ้นให้นะคะ ฝากงานต่อไปด้วย 💪`, unread: true });
    res = { found, half, n: p.n, fp, pay, exp, acc, lv: l1 > l0 ? l1 : 0, rev: p.chunks.filter(c => c.err) }; H.job = null;
    try { if (l1 > l0) { S.big('🎉 นักตรวจนิยาย เลเวล ' + l1, 2.6, '#f0a020'); S.jingle(); } else S.tone(660, 880, .15, .08); toast('💬 ลูกค้าตอบกลับแล้ว', 2); } catch (e) {}
    CG.Bus.emit('sidejob.done', { job: 'novel', pay, exp }); renderDesk(); refreshApp('novel'); refreshApp('fin'); refreshApp('msg'); refreshApp('hist');
  }

  /* side income goes straight into the main bank balance (one account); H.side only counts lifetime side income */
  const earn = (amt, job) => { H.side += amt; if (amt > 0) { try { bankTx('💼 งานเสริม: ' + job, amt); } catch (e) {} } };
  /* ================= atmosphere: pet sounds (stress -10% of current), ambient sound, room lamp ================= */
  const PET_COST = 300, PET_CD = 30000;
  const meow = () => { try { S.tone(650, 1000, .16, .09, 'triangle'); setTimeout(() => S.tone(1000, 560, .3, .09, 'triangle'), 170); } catch (e) {} };
  const bark = () => { try { [0, 230].forEach(t => setTimeout(() => { S.noise(.07, 900, .1); S.tone(320, 180, .1, .1, 'square'); }, t)); } catch (e) {} };
  function petSound(kind, manual) {
    if (!H.on || !hp || !H.pets[kind]) return false; const now = Date.now();
    if (manual && now - H.petAt < PET_CD) { try { toast(`${kind === 'cat' ? '🐱' : '🐶'} กำลังพักอยู่ รออีก ${Math.ceil((PET_CD - (now - H.petAt)) / 1000)} วิ`, 1.6); } catch (e) {} return false; }
    H.petAt = now; kind === 'cat' ? meow() : bark();
    const before = Math.round(life.stress); life.stress = Math.max(0, life.stress * .9); try { stressHud(); } catch (e) {}
    try { toast(`${kind === 'cat' ? '🐱 เหมียว~' : '🐶 โฮ่ง โฮ่ง!'} ความเครียดลด 10% (${before} → ${Math.round(life.stress)})`, 2.2); } catch (e) {}
    CG.Bus.emit('pet.sound', { kind }); return true;
  }
  function petHtml() {
    const own = k => H.pets[k], cd = Math.max(0, Math.ceil((PET_CD - (Date.now() - H.petAt)) / 1000));
    const pet = (k, e, n) => own(k) ? `<div class="hppet">${e} <b>${n}</b> <small>ร้องเองเป็นครั้งคราว</small><button class="go" data-hp="petcall" data-k="${k}">เรียกให้ร้อง</button></div>` : `<div class="hppet">${e} <b>${n}</b> <small>฿${baht(PET_COST)}${bank.bal < PET_COST ? ' · เงินในบัญชียังไม่พอ (มี ฿' + baht(bank.bal) + ')' : ''}</small><button class="${bank.bal < PET_COST ? 'hpdis' : 'go'}" data-hp="petbuy" data-k="${k}">ซื้อ</button></div>`;
    const opt = (a, v, cur, t) => `<button class="${cur === v ? 'go' : ''}" data-hp="${a}" data-v="${v}">${t}</button>`;
    return `<h3 class="hpjt">🐾 สัตว์เลี้ยง</h3><p class="hps">ไม่มีตัวจริงให้ดูแล มีแค่เสียงน่ารักๆ ทุกครั้งที่ร้อง ความเครียดจะลด 10% ของค่าปัจจุบัน · ซื้อด้วยเงินในบัญชี (มี ฿${baht(H.side)})</p>${pet('cat', '🐱', 'เสียงแมว')}${pet('dog', '🐶', 'เสียงหมา')}<hr><h3 class="hpjt">🎧 เสียงบรรยากาศ</h3><div class="hpq" style="margin-top:6px">${opt('amb', '', H.amb, '🔇 ปิด')}${opt('amb', 'rain', H.amb, '🌧️ ฝนตก')}${opt('amb', 'night', H.amb, '🌙 จิ้งหรีดยามค่ำ')}</div><hr><h3 class="hpjt">💡 แสงในห้อง</h3><div class="hpq" style="margin-top:6px">${opt('lamp', '0', String(H.lamp), '☀️ สว่าง')}${opt('lamp', '1', String(H.lamp), '🕯️ อบอุ่น')}${opt('lamp', '2', String(H.lamp), '🌑 มืดสลัว')}</div>`;
  }
  function applyLamp() { if (!hp) return; hp.classList.toggle('lamp1', H.lamp === 1); hp.classList.toggle('lamp2', H.lamp === 2); let o = hp.querySelector('.hplamp'); if (!o) { o = h('div', { class: 'hplamp' }); hp.append(o); } o.style.background = H.lamp === 1 ? 'radial-gradient(ellipse at 85% 10%,rgba(255,200,120,.42),rgba(255,150,70,.36) 70%)' : H.lamp === 2 ? 'rgba(6,6,28,.62)' : 'transparent'; o.style.mixBlendMode = H.lamp === 1 ? 'multiply' : 'normal'; }
  let ambN = 0;
  setInterval(() => {
    if (!H.on || !hp || H.bed || (typeof lk !== 'undefined' && lk.on)) return; ambN++;
    try { if (H.amb === 'rain') S.noise(.5, 2600, .018); else if (H.amb === 'night' && ambN % 3 === 0) { S.tone(4300, 4400, .04, .012); setTimeout(() => S.tone(4300, 4400, .04, .012), 90); } } catch (e) {}
    const now = Date.now(); if (!H.nextPet) H.nextPet = now + 45000 + Math.random() * 60000;
    if (now >= H.nextPet) { H.nextPet = now + 60000 + Math.random() * 90000; const ks = ['cat', 'dog'].filter(k => H.pets[k]); if (ks.length) petSound(pick(ks), false); }
  }, 1000);

  /* ================= side job 2: code review in plain Thai (called "นักแก้โค้ด") ================= */
  const codeJob = () => (H.job && H.job.k === 'code' && Array.isArray(H.job.marks)) ? H.job : null;
  function codeFixHtml(j, p) {
    return j.marks.length ? j.marks.slice().sort((a, b) => a - b).map(i => { const l = p.lines[i], cur = (j.fix || {})[i]; return `<label class="hpfr"><b>${esc2(l.n)}</b> = <select data-cf="${i}"><option value="">— เลือกค่าที่ถูกต้อง —</option>${l.opts.map(o => `<option value="${esc2(o)}"${cur === o ? ' selected' : ''}>${esc2(o)}</option>`).join('')}</select></label>`; }).join('') : '<p class="hps">ยังไม่ได้เลือกบรรทัดที่คิดว่ามีปัญหา</p>';
  }
  function codeEval(j) {
    const p = CODES[j.pid], fx = j.fix || {}, bugs = p.lines.map((l, i) => l.bug ? i : -1).filter(i => i >= 0), good = bugs.filter(i => j.marks.includes(i) && fx[i] === p.lines[i].bug.fix), wrong = bugs.filter(i => j.marks.includes(i) && fx[i] !== p.lines[i].bug.fix), fp = j.marks.filter(i => !p.lines[i].bug).length;
    return { good, wrong, fp, left: bugs.filter(i => !good.includes(i)) };
  }
  function codeHtml() {
    const head = head2('code');
    if (res && res.k === 'code') return head + `<div class="hpres"><h3>${res.acc >= .9 ? '🌟 แก้ได้ครบ เกมทำงานปกติแล้ว' : res.acc >= .5 ? '👍 แก้ได้บางส่วน' : '🙂 ส่งงานแล้ว'}</h3>${row('แก้ถูกต้อง', `${res.good}/${res.n} จุด`)}${res.wrong ? row('เจอจุดผิดแต่เลือกค่าไม่ถูก', res.wrong + ' จุด', 'warn') : ''}${res.fp ? row('ชี้ผิดบรรทัดที่ไม่มีปัญหา', res.fp + ' จุด', 'warn') : ''}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<div class="hps">เฉลย:${res.rev.map(b => `<div class="hpfx"><code>${esc2(b.n)} = ${esc2(b.v)}</code> → <b>${esc2(b.bug.fix)}</b><br>${esc2(b.bug.why)}</div>`).join('')}</div><div class="hpq"><button class="go" data-hp="jnext">งานต่อไป</button></div></div>`;
    if (H.job && H.job.k === 'code') {
      const j = H.job, p = CODES[j.pid]; if (!p || !Array.isArray(j.marks)) { H.job = null; return codeHtml(); } j.fix = j.fix || {};
      return head + `<h3 class="hpjt">💻 ${esc2(p.title)} <small>${'★'.repeat(p.diff)}${'☆'.repeat(3 - p.diff)}</small></h3><p class="hps">อาการ: ${esc2(p.sym)}<br>มีจุดผิด ${p.nb} จุด แตะบรรทัดที่คิดว่ามีปัญหา แล้วเลือกค่าที่ถูกต้องในช่องด้านล่าง</p><div class="hpcode"><div class="hpch">${esc2(p.head)}</div>${p.lines.map((l, i) => `<button class="hpcl${j.marks.includes(i) ? ' hpmk' : ''}" data-hp="cmark" data-i="${i}"><b>${esc2(l.n)}</b> = ${esc2(l.v)}</button>`).join('')}</div><div class="hpfix">${codeFixHtml(j, p)}</div><div class="hprun">${j.out || ''}</div><div class="hpq"><span class="hps" id="hpmc">เลือกแล้ว ${j.marks.length} บรรทัด</span><br><button data-hp="crun">▶ ทดลองรัน (เหลือ ${j.runs} ครั้ง)</button><button class="go" data-hp="csubmit">📨 ส่งงาน</button><button data-hp="jcancel">ยกเลิกงาน (ไม่เสียอะไร)</button></div>`;
    }
    if (H.job) return head + '<p class="hps">ตอนนี้มีงานอื่นที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    const can = leftMin() >= C_MIN, mx = level('code') >= 7 ? 3 : level('code') >= 4 ? 2 : 1;
    return head + `<div class="hpjob"><h3>💻 งานตรวจโค้ด (ภาษาไทย)</h3><p>ลูกค้าส่งสคริปต์ตั้งค่าเกมที่ทำงานผิดปกติมาให้ ช่วยหาบรรทัดที่เป็นสาเหตุ แล้วเลือกค่าที่ถูกต้อง ไม่ต้องรู้ภาษาโปรแกรมเลย<br><small>ประมาณ ${C_MIN} นาทีเกม (≈ ${Math.round(C_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(C_BASE * mult(level('code'))))} · ตอนนี้รับงานระดับ ${'★'.repeat(mx)}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="caccept">✅ รับงาน</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">มีปุ่มทดลองรันดูอาการได้ 3 ครั้งก่อนส่งงาน เลเวลสูงขึ้นจะเจองานที่มีจุดผิดหลายจุดมากขึ้น</p></div>`;
  }
  function codeAccept() {
    if (H.job || leftMin() < C_MIN) return; const mx = level('code') >= 7 ? 3 : level('code') >= 4 ? 2 : 1, pool = CODES.map((d, i) => i).filter(i => CODES[i].diff <= mx); let i; do { i = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && i === H.lastC); H.lastC = i;
    H.job = { k: 'code', pid: i, marks: [], fix: {}, runs: 3, out: '' }; res = null; refreshJobs();
  }
  function codeMark(i) { const j = codeJob(); if (!j) return; const k = j.marks.indexOf(i); if (k >= 0) { j.marks.splice(k, 1); delete j.fix[i]; } else j.marks.push(i); j.out = ''; refreshApp('code'); }
  function codeRun() {
    const j = codeJob(); if (!j) return; if (j.runs <= 0) { toast('ใช้สิทธิ์ทดลองรันครบแล้ว ลองคิดให้ดี แล้วส่งงานได้เลย', 2); return; }
    j.runs--; const p = CODES[j.pid], e = codeEval(j);
    j.out = e.left.length ? `<div class="hprs bad">▶ รันแล้ว ยังมีปัญหา: ${esc2(p.lines[e.left[0]].bug.sym)}${e.left.length > 1 ? ' (และอาจมีปัญหาอื่นอีก)' : ''}</div>` : '<div class="hprs ok">▶ รันแล้ว เกมทำงานปกติ ไม่พบปัญหา ✅</div>';
    try { if (e.left.length) S.tone(330, 260, .15, .06); else S.tone(660, 990, .15, .07); } catch (x) {} refreshApp('code');
  }
  function codeSubmit() {
    const j = codeJob(); if (!j) return; const p = CODES[j.pid], e = codeEval(j), acc = clamp((e.good.length + e.wrong.length * .25 - e.fp * .5) / p.nb, 0, 1), l0 = level('code');
    const pay = Math.round(C_BASE * mult(l0) * acc), exp = Math.round(C_EXP * (.4 + .6 * acc));
    const lv = finishJob('code', 'ตรวจโค้ด', p.title, pay, exp, acc, { name: 'นักแก้โค้ด', from: FROM_C, good: 'เยี่ยมเลยครับ เกมกลับมาทำงานปกติแล้ว ขอบคุณมากครับ 🎉 โอนค่าจ้างให้แล้ว', ok: 'ใช้ได้ครับ แต่ยังมีบางจุดที่ผิดอยู่ เดี๋ยวผมดูต่อเอง ขอบคุณที่ช่วยครับ', bad: 'รอบนี้เกมยังไม่ทำงานเลยครับ ลองอ่านอาการแล้วหาบรรทัดที่ผิดใหม่อีกทีนะครับ 🙂', up: 'ฝีมือตรวจโค้ดพัฒนาขึ้นเยอะเลย ตอนนี้เลเวล {L} แล้ว ค่าจ้างขึ้นให้นะครับ 💪' });
    res = { k: 'code', n: p.nb, good: e.good.length, wrong: e.wrong.length, fp: e.fp, pay, exp, acc, lv, rev: p.lines.filter(l => l.bug) }; H.job = null; refreshJobs();
  }

  /* ================= side job 3: reviewer ================= */
  const R_BASE = 150, R_EXP = 40, R_MIN = 40, D_BASE = 240, D_EXP = 60, D_MIN = 60;
  const REVS = [
    ['ร้านกาแฟ Morning Day', '☕', [['รสชาติกาแฟ', 'ดีมาก'], ['ราคา', 'ค่อนข้างสูง'], ['บรรยากาศ', 'เงียบสงบ'], ['บริการ', 'พนักงานสุภาพ']], 4.2, 4, [['รสชาติกาแฟดีมาก', 1], ['บรรยากาศเงียบสงบ พนักงานสุภาพ', 1], ['ราคาค่อนข้างสูง ถือเป็นข้อเสียเล็กน้อย', 1], ['บริการช้าและพนักงานไม่สุภาพ', 0], ['บรรยากาศวุ่นวาย เสียงดัง', 0]]],
    ['หูฟังไร้สาย SoundBee', '🎧', [['คุณภาพเสียง', 'ดี'], ['แบตเตอรี่', 'อยู่ได้แค่ราว 3 ชั่วโมง'], ['ความสบายตอนใส่', 'ใส่สบาย'], ['ราคา', '590 บาท']], 3.1, 3, [['เสียงดีและใส่สบาย', 1], ['แบตเตอรี่อยู่ได้แค่ราว 3 ชั่วโมง ถือว่าน้อย', 1], ['ราคา 590 บาท ไม่ถูกแต่ไม่แพงเกินไป', 1], ['แบตเตอรี่อึดมาก ใช้ได้ทั้งวัน', 0], ['เสียงแย่ ฟังไม่ได้เลย', 0]]],
    ['ภาพยนตร์ Last Lantern', '🎬', [['เนื้อเรื่อง', 'ตื่นเต้นช่วงต้น แต่ตอนจบรีบจบ'], ['ภาพและดนตรี', 'สวยมาก'], ['นักแสดง', 'เล่นดี'], ['ความยาว', '2 ชม. 40 นาที ช่วงกลางยืด']], 3.8, 4, [['ภาพและดนตรีสวยมาก', 1], ['ช่วงกลางเรื่องยืด และตอนจบรีบไปหน่อย', 1], ['นักแสดงเล่นได้ดี', 1], ['เนื้อเรื่องแน่นตลอด ไม่มีจุดอ่อนเลย', 0], ['ภาพไม่สวยเลย', 0]]],
    ['ก๋วยเตี๋ยวเรือ ป้าแก้ว', '🍜', [['รสชาติ', 'อร่อยมาก'], ['ราคา', '40 บาทต่อชาม ถูก'], ['ความสะอาด', 'โต๊ะเหนียวนิดหน่อย'], ['การรอคิว', 'ประมาณ 25 นาที']], 4.5, 4, [['อร่อยมากและราคาถูก', 1], ['คิวนานประมาณ 25 นาที', 1], ['โต๊ะยังเหนียว ควรปรับปรุงความสะอาด', 1], ['ราคาแพงเกินคุณภาพ', 0], ['ไม่ต้องรอคิวเลย', 0]]],
    ['โรงแรม Seaview', '🏨', [['ห้องพัก', 'สะอาด วิวทะเลสวย'], ['อาหารเช้า', 'น้อยและรสจืด'], ['แอร์', 'เสียงดังรบกวนตอนนอน'], ['ที่ตั้ง', 'เดินถึงหาด 2 นาที']], 3.0, 3, [['วิวทะเลสวยและห้องสะอาด', 1], ['แอร์เสียงดัง รบกวนการนอน', 1], ['อาหารเช้ามีน้อยและรสจืด', 1], ['อาหารเช้าหลากหลายและอร่อย', 0], ['อยู่ไกลจากหาดมาก', 0]]],
    ['แอปจดโน้ต NoteNest', '📝', [['ความง่าย', 'ใช้ง่ายมาก'], ['ฟีเจอร์', 'ครบ'], ['ความเสถียร', 'แอปเด้งออก 3 ครั้งใน 1 วัน'], ['ราคา', 'ฟรี']], 2.6, 3, [['ใช้ง่ายและมีฟีเจอร์ครบ', 1], ['แอปเด้งออกบ่อย กระทบการใช้งาน', 1], ['ใช้ฟรี', 1], ['แอปเสถียรมาก ไม่เคยเด้ง', 0], ['ใช้ยาก ต้องเรียนนาน', 0]]],
    ['ชุดเครื่องครัว ChefPro', '🍳', [['คุณภาพ', 'แข็งแรงมาก'], ['ราคา', '4,500 บาท แพงมาก'], ['การจัดส่ง', 'ล่าช้า 2 สัปดาห์ กล่องบุบ'], ['ของที่ได้รับ', 'ครบทุกชิ้น']], 2.8, 3, [['ตัวสินค้าแข็งแรงและครบทุกชิ้น', 1], ['ราคา 4,500 บาท สูงมาก', 1], ['จัดส่งช้า 2 สัปดาห์ และกล่องบุบ', 1], ['จัดส่งเร็วมาก', 0], ['สินค้าไม่ครบหลายชิ้น', 0]]],
    ['เว็บเรียนออนไลน์ LearnLoop', '🎓', [['เนื้อหา', 'ชัดเจน เหมาะกับผู้เริ่มต้น'], ['วิดีโอ', 'ภาพคมชัด เสียงเบาไปนิด'], ['ราคา', '990 บาทต่อปี'], ['ฝ่ายช่วยเหลือ', 'ตอบช้า ประมาณ 3 วัน']], 4.0, 4, [['เนื้อหาชัด เหมาะกับผู้เริ่มต้น', 1], ['ราคาปีละ 990 บาท คุ้มค่า', 1], ['ฝ่ายช่วยเหลือตอบช้า ประมาณ 3 วัน', 1], ['เนื้อหายากเกินไปสำหรับมือใหม่', 0], ['ภาพวิดีโอไม่ชัดเลย', 0]]],
  ].map(([title, e, facts, avg, best, opts]) => ({ title, e, facts, avg, best, opts }));
  const FROM_R = ['คุณมิ้นท์ (บรรณาธิการเว็บรีวิว)', 'คุณบอส (เจ้าของร้าน)', 'คุณแป้ง (ทีมการตลาด)'];
  const lastJ = { rev: -1, det: -1 };
  const refreshJobs = () => ['novel', 'code', 'rev', 'det'].forEach(refreshApp);
  const head2 = k => { const l = level(k), x = H.skill[k], lo = TH[l - 1], hi = TH[l] || TH[9], pc = l >= 10 ? 100 : Math.round((x - lo) / (hi - lo) * 100); return `<div class="hpl2"><b>เลเวล ${l}${l >= 10 ? ' (สูงสุด)' : ''}</b> <small>EXP ${x}${l >= 10 ? '' : ' / ' + hi}</small> <span class="hpx">ค่าตอบแทน ×${mult(l).toFixed(2)}</span><div class="hpbar2"><i style="width:${pc}%"></i></div></div>`; };
  const credMul = () => .8 + .4 * H.cred / 100;
  const pickCase = (arr, k) => { let i; do { i = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && i === lastJ[k]); lastJ[k] = i; return i; };
  const finishJob = (k, label, title, pay, exp, acc, msgs) => {
    const l0 = level(k); H.skill[k] = Math.min(TH[9], H.skill[k] + exp); const l1 = level(k), at = hm(gnow());
    earn(pay, label + ': ' + title); H.hist.push({ d: gd(), job: label + ': ' + title, amt: pay, exp });
    H.msgs.unshift({ from: pick(msgs.from), at, text: acc >= .8 ? msgs.good : acc >= .5 ? msgs.ok : msgs.bad, unread: true });
    if (l1 > l0) H.msgs.unshift({ from: msgs.from[0], at, text: msgs.up.replace('{L}', l1), unread: true });
    try { if (l1 > l0) { S.big('🎉 ' + msgs.name + ' เลเวล ' + l1, 2.6, '#f0a020'); S.jingle(); } else if (acc >= .5) S.tone(660, 880, .15, .08); else S.noise(.25, 500, .08); toast('💬 ลูกค้าตอบกลับแล้ว', 2); } catch (e) {}
    CG.Bus.emit('sidejob.done', { job: k, pay, exp }); renderDesk(); refreshJobs(); refreshApp('fin'); refreshApp('msg'); refreshApp('hist');
    return l1 > l0 ? l1 : 0;
  };
  function revHtml() {
    const head = head2('rev') + `<div class="hpl2"><b>ความน่าเชื่อถือ ${Math.round(H.cred)}%</b> <span class="hpx">ค่าจ้าง ×${credMul().toFixed(2)}</span><div class="hpbar2"><i style="width:${H.cred}%"></i></div></div>`;
    if (res && res.k === 'rev') return head + `<div class="hpres"><h3>${res.acc >= .8 ? '🌟 รีวิวน่าเชื่อถือมาก' : res.acc >= .5 ? '👍 รีวิวใช้ได้' : '🙂 รีวิวยังไม่ค่อยตรงกับข้อมูล'}</h3>${row('ดาวที่ให้', '⭐'.repeat(res.stars) + ` <small>(เหมาะสม ≈ ${res.best} ดาว)</small>`)}${row('เหตุผลที่ตรงข้อมูล', res.good + '/2')}${res.bad ? row('เหตุผลที่ขัดกับข้อมูล', res.bad, 'warn') : ''}${row('ความน่าเชื่อถือ', (res.dc > 0 ? '+' : '') + res.dc + '%')}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<div class="hpq"><button class="go" data-hp="jnext">งานต่อไป</button></div></div>`;
    if (H.job && H.job.k === 'rev') {
      const p = REVS[H.job.pid]; if (!p) { H.job = null; return revHtml(); } const j = H.job;
      return head + `<h3 class="hpjt">${p.e} รีวิว: ${esc2(p.title)}</h3><div class="hpfacts">${p.facts.map(f => row(esc2(f[0]), esc2(f[1]))).join('')}${row('คะแนนเฉลี่ยจากคนอื่น', p.avg.toFixed(1) + ' / 5')}</div><p class="hps">1) ให้ดาว</p><div class="hpq" style="margin-top:2px">${[1, 2, 3, 4, 5].map(n => `<button class="${j.stars === n ? 'go' : ''}" data-hp="rstar" data-v="${n}">${n}⭐</button>`).join('')}</div><p class="hps">2) เลือกเหตุผลที่ตรงกับข้อมูลให้ครบ 2 ข้อ (เลือกแล้ว ${j.picks.length}/2)</p><div class="hpsteps">${p.opts.map((o, i) => `<button class="hpstp${j.picks.includes(i) ? ' sel' : ''}" data-hp="rpick" data-i="${i}">${esc2(o[0])}</button>`).join('')}</div><div class="hpq"><button class="go" data-hp="rsubmit">📨 ส่งรีวิว</button><button data-hp="jcancel">ยกเลิกงาน (ไม่เสียอะไร)</button></div>`;
    }
    if (H.job) return head + '<p class="hps">ตอนนี้มีงานอื่นที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    const can = leftMin() >= R_MIN, last = H.revs.slice(0, 5).map(x => row(esc2(x.t), '⭐'.repeat(x.st) + ` <small>${Math.round(x.acc * 100)}%</small>`)).join('');
    return head + `<div class="hpjob"><h3>⭐ งานรีวิว</h3><p>อ่านข้อมูลสินค้าหรือร้าน แล้วให้ดาวและเหตุผลที่ตรงกับความจริง ไม่ให้สูงหรือต่ำเกินไป<br><small>ประมาณ ${R_MIN} นาทีเกม (≈ ${Math.round(R_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(R_BASE * mult(level('rev')) * credMul()))}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="raccept">✅ รับงาน</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">รีวิวตรงความจริงจะเพิ่มความน่าเชื่อถือ ค่าจ้างจะสูงขึ้นตาม ส่วนรีวิวที่เกินจริงจะทำให้ลดลง</p></div>${last ? '<h3 class="hpjt">ประวัติรีวิวล่าสุด</h3>' + last : ''}`;
  }
  function revAccept() { if (H.job || leftMin() < R_MIN) return; H.job = { k: 'rev', pid: pickCase(REVS, 'rev'), stars: 0, picks: [] }; res = null; refreshJobs(); }
  function revPick(i) { const j = H.job; if (!j || j.k !== 'rev') return; const k = j.picks.indexOf(i); if (k >= 0) j.picks.splice(k, 1); else if (j.picks.length < 2) j.picks.push(i); else { try { toast('เลือกได้แค่ 2 ข้อ แตะข้อที่เลือกไว้เพื่อยกเลิกก่อน', 1.8); } catch (e) {} } refreshApp('rev'); }
  function revSubmit() {
    const j = H.job; if (!j || j.k !== 'rev') return; if (!j.stars || j.picks.length < 2) { try { toast('ให้ดาวและเลือกเหตุผลให้ครบ 2 ข้อก่อนส่ง', 1.8); } catch (e) {} return; }
    const p = REVS[j.pid], d = Math.abs(j.stars - p.best), sp = d === 0 ? 1 : d === 1 ? .6 : 0, g = j.picks.filter(i => p.opts[i][1]).length, bd = 2 - g, rp = clamp((g - bd) / 2, 0, 1), acc = .5 * sp + .5 * rp;
    const pay = Math.round(R_BASE * mult(level('rev')) * acc * credMul()), exp = Math.round(R_EXP * (.4 + .6 * acc)), dc = acc >= .8 ? 6 : acc >= .5 ? 0 : -8, c0 = H.cred; H.cred = clamp(H.cred + dc, 0, 100);
    H.revs.unshift({ t: p.title, st: j.stars, acc }); H.revs = H.revs.slice(0, 15);
    const lv = finishJob('rev', 'รีวิว', p.title, pay, exp, acc, { name: 'นักรีวิว', from: FROM_R, good: 'รีวิวละเอียดและตรงความจริงมากค่ะ ขอบคุณนะคะ 🥰 โอนค่าจ้างให้แล้วค่ะ', ok: 'รีวิวใช้ได้ค่ะ มีบางจุดที่ยังไม่ตรงกับข้อมูลนิดหน่อย ไว้ฝากงานอีกนะคะ', bad: 'รีวิวรอบนี้ยังไม่ค่อยตรงกับข้อมูลเลยค่ะ ลองอ่านรายละเอียดให้รอบคอบขึ้นอีกนิดนะคะ', up: 'ฝีมือรีวิวพัฒนาขึ้นมากเลยค่ะ ตอนนี้เลเวล {L} แล้ว ค่าตอบแทนขึ้นให้นะคะ 💪' });
    res = { k: 'rev', stars: j.stars, best: p.best, good: g, bad: bd, dc: Math.round(H.cred - c0), pay, exp, acc, lv }; H.job = null; refreshJobs();
  }

  /* ================= side job 4: detective (real lookups in receipt / courier / photo apps, 20 templated cases) ================= */
  const ITM = [['หูฟังไร้สาย', '🎧', 590], ['พัดลมพกพา', '🌀', 290], ['กระติกน้ำ', '🥤', 350], ['ตุ๊กตาแมว', '🧸', 250], ['หนังสือนิยาย', '📚', 320], ['กระเป๋าผ้า', '👜', 420], ['โคมไฟตั้งโต๊ะ', '💡', 680], ['แก้วเซรามิก', '☕', 180], ['กล้องฟิล์ม', '📷', 1500], ['รองเท้าวิ่ง', '👟', 1290], ['นาฬิกาปลุก', '⏰', 390], ['กระถางต้นไม้', '🪴', 220]];
  const SHP = ['ร้านแมวเหมียวช็อป', 'ร้านบ้านสวนของใช้', 'ร้านมุมสบาย', 'ร้านของฝากริมคลอง', 'ร้านเฮงเฮงออนไลน์'];
  const CUS = ['คุณสมศรี', 'คุณวิชัย', 'คุณนภา', 'คุณปกรณ์', 'คุณอรทัย', 'คุณธนา', 'คุณมาลี', 'คุณประเสริฐ', 'คุณวรรณา', 'คุณสุรชัย', 'คุณกัลยา', 'คุณอนุชา', 'คุณพิมพ์', 'คุณเอกชัย', 'คุณรัตนา', 'คุณภานุ', 'คุณจิตรา', 'คุณทวี', 'คุณสุดา', 'คุณบุญช่วย'];
  const CAR = ['ส่งไวไปรษณีย์', 'ขนส่งเร็วใจ', 'ลูกแก้วเอ็กซ์เพรส', 'กระต่ายคูเรียร์'];
  const rcNo = i => 'R-' + (24100 + i * 37), rc2No = i => 'R-' + (24105 + i * 37), trNo = i => 'TH' + (781000000 + i * 12347), decNo = i => 'TH' + (781000000 + i * 12347 + 111);
  const mkRc = (no, shop, date, time, cust, addr, lines, extra) => ({ no, shop, date, time, cust, addr, lines, total: lines.reduce((a, l) => a + l[1] * l[2], 0), ...extra });
  const mkTr = (no, car, parcels, events, extra) => ({ no, car, parcels, events, ...extra });
  const ADDR = ['45/2 ซอยสุขใจ', '12/8 ถนนริมน้ำ', '88/17 ซอยบางกอก', '7/3 หมู่บ้านสวนสน', '23/5 ซอยร่มเย็น'];
  const swapDigits = a => a.replace(/^(\d)(\d)/, '$2$1');
  function buildDet(i) {
    const fam = Math.floor(i / 4), v = i % 4, cu = CUS[i], sh = SHP[(i + v) % 5], car = CAR[(i + fam) % 4], ad = ADDR[i % 5], rno = rcNo(i), tno = trNo(i);
    const it = k => ITM[(i * 2 + k) % 12], d = (n) => `${10 + (i % 17)}/11/2569`;
    let c = { id: i, fam, rc: {}, tr: {}, pics: {}, brief: [], need: [], opts: [], ok: 0, req: '', title: '', diff: 1, why: '' };
    const put = (r, t, ph) => { if (r) c.rc[r.no] = r; if (t) c.tr[t.no] = t; if (ph) c.pics[ph.no] = ph; };
    const shuffle = (arr, okText) => { const o = arr.slice(); const sft = (i + v) % 3; const rot = o.map((_, k) => o[(k + sft) % 3]); c.opts = rot; c.ok = rot.indexOf(okText); };
    if (fam === 0) { // parcels incomplete
      const N = [3, 4, 3, 2][v], M = [2, 3, 2, 1][v], items = Array.from({ length: N }, (_, k) => it(k)), sent = items.slice(0, M), left = items.slice(M);
      c.title = 'พัสดุมาไม่ครบ'; c.diff = 1; c.req = `ฉันสั่งของ ${N} ชิ้น แต่ได้รับแค่ ${M} ชิ้น ช่วยตรวจสอบให้หน่อยว่าของที่เหลือไปอยู่ที่ไหน`;
      put(mkRc(rno, sh, d(), '10:05', cu, ad, items.map(x => [x[0], 1, x[2]]), {}),
        mkTr(tno, car, M, [['จัดส่งสำเร็จ', `ผู้รับเซ็นรับ ${M} กล่อง`], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง'], ['รับพัสดุจากร้าน', `${M} กล่อง`]], { status: 'จัดส่งสำเร็จ' }),
        { no: rno, photos: [{ label: 'รูปตอนแพ็กของที่ร้าน', items: sent, note: `ร้านแพ็ก ${M} ชิ้นใส่กล่อง` }, { label: 'ชั้นวางสินค้าหลังแพ็กเสร็จ', items: left, note: 'ของที่ยังไม่ได้หยิบ' }] });
      c.brief = [['rc', rno, 'ใบเสร็จสั่งซื้อ'], ['tr', tno, 'พัสดุ']]; c.need = ['rc:' + rno, 'tr:' + tno, 'pic:' + rno];
      shuffle([`ร้านแพ็กของไม่ครบ ส่งไปแค่ ${M} ชิ้น ส่วนที่เหลือยังอยู่ที่ร้าน`, 'พัสดุหายระหว่างขนส่ง', `ลูกค้าสั่งของแค่ ${M} ชิ้น`], `ร้านแพ็กของไม่ครบ ส่งไปแค่ ${M} ชิ้น ส่วนที่เหลือยังอยู่ที่ร้าน`);
      c.why = `ใบเสร็จมี ${N} ชิ้น ขนส่งส่งสำเร็จ ${M} กล่อง และรูปตอนแพ็กมีแค่ ${M} ชิ้น ของที่เหลือยังอยู่บนชั้นที่ร้าน`;
    } else if (fam === 1) { // charged twice
      const dup = v % 2 === 0, a = it(0), b = dup ? a : it(3), r2 = rc2No(i);
      c.title = 'โดนตัดเงินสองครั้ง'; c.diff = 2; c.req = `ฉันโดนตัดเงินสองครั้ง ใบเสร็จเลข ${rno} และ ${r2} ช่วยตรวจสอบหน่อยว่าตัดซ้ำหรือเปล่า`;
      put(mkRc(rno, sh, d(), '14:20', cu, ad, [[a[0], 1, a[2]]], { txn: 'TX' + (5000 + i) }));
      put(mkRc(r2, sh, dup ? d() : `${12 + (i % 15)}/11/2569`, dup ? '14:20' : '09:45', cu, dup ? ad : ADDR[(i + 2) % 5], [[b[0], 1, b[2]]], { txn: 'TX' + (6000 + i) }));
      c.brief = [['rc', rno, 'ใบเสร็จใบแรก'], ['rc', r2, 'ใบเสร็จใบที่สอง']]; c.need = ['rc:' + rno, 'rc:' + r2];
      const okT = dup ? 'ตัดเงินซ้ำจริง (สินค้าเดียวกัน เวลาเดียวกัน) ควรคืนเงิน 1 ใบ' : 'เป็นสองออเดอร์ที่สั่งแยกกันจริง (คนละวัน คนละสินค้า)';
      shuffle([okT, dup ? 'เป็นสองออเดอร์ที่สั่งแยกกันจริง' : 'ตัดเงินซ้ำ ควรคืนเงิน 1 ใบ', 'ร้านคิดราคาผิด'], okT);
      c.why = dup ? 'ทั้งสองใบเป็นสินค้าเดียวกัน ที่อยู่เดียวกัน เวลาเดียวกัน จึงเป็นการตัดเงินซ้ำ' : 'สองใบเป็นคนละวัน คนละสินค้า และคนละที่อยู่ ลูกค้าสั่งแยกกันจริง';
    } else if (fam === 2) { // wrong item
      const x = it(0), y = it((v % 2) + 5 > 11 ? 5 : (v % 2) + 5), yy = x[0] === y[0] ? it(7) : y;
      c.title = 'ได้ของผิดชิ้น'; c.diff = 1; c.req = `ฉันสั่ง${x[0]} แต่ของที่ได้รับดูเหมือนไม่ใช่ ช่วยตรวจสอบว่าเกิดอะไรขึ้น`;
      put(mkRc(rno, sh, d(), '11:30', cu, ad, [[x[0], 1, x[2]]], {}), mkTr(tno, car, 1, [['จัดส่งสำเร็จ', 'ผู้รับเซ็นรับ 1 กล่อง'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง'], ['รับพัสดุจากร้าน', '1 กล่อง']], { status: 'จัดส่งสำเร็จ' }),
        { no: rno, photos: [{ label: 'รูปตอนแพ็กของที่ร้าน', items: [yy], note: `ในกล่องคือ ${yy[0]}` }, { label: 'รูปกล่องที่ลูกค้าได้รับ', items: [yy], note: 'กล่องเดียว ไม่มีของอื่น' }] });
      c.brief = [['rc', rno, 'ใบเสร็จสั่งซื้อ'], ['tr', tno, 'พัสดุ']]; c.need = ['rc:' + rno, 'pic:' + rno];
      shuffle(['ร้านแพ็กผิดชิ้น ส่งสินค้าไม่ตรงกับใบเสร็จ', 'ขนส่งสลับกล่องกับผู้รับคนอื่น', 'ลูกค้าสั่งผิดรุ่นเอง'], 'ร้านแพ็กผิดชิ้น ส่งสินค้าไม่ตรงกับใบเสร็จ');
      c.why = `ใบเสร็จระบุ ${x[0]} แต่รูปตอนแพ็กที่ร้านถ่ายไว้เป็น ${yy[0]} และพัสดุมีกล่องเดียว ขนส่งไม่ได้สลับกล่อง`;
    } else if (fam === 3) { // address / delivery
      const x = it(0); c.title = 'พัสดุไปไหน'; c.diff = 2;
      const n1 = ad.split(' ')[0], rest = ad.slice(n1.length), wrong = swapDigits(n1) === n1 ? n1 + 'A' : swapDigits(n1);
      if (v === 0 || v === 1) { // carrier delivered to wrong house
        c.req = `ระบบบอกว่าส่งพัสดุสำเร็จแล้ว แต่ฉันไม่ได้รับของเลย บ้านฉันอยู่ ${n1}${rest} ช่วยตรวจสอบหน่อย`;
        put(mkRc(rno, sh, d(), '16:10', cu, `${n1}${rest}`, [[x[0], 1, x[2]]], {}), mkTr(tno, car, 1, [['จัดส่งสำเร็จ', `ส่งที่ ${wrong}${rest} ผู้รับ: คนข้างบ้านรับแทน`], ['ออกส่งพัสดุ', 'พนักงานจัดส่งกำลังนำจ่าย'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง']], { status: 'จัดส่งสำเร็จ' }));
        shuffle(['ขนส่งส่งผิดบ้าน (เลขที่ไม่ตรงกับในใบสั่งซื้อ)', 'ลูกค้ากรอกที่อยู่ผิดเอง', 'ร้านยังไม่ได้ส่งของ'], 'ขนส่งส่งผิดบ้าน (เลขที่ไม่ตรงกับในใบสั่งซื้อ)'); c.why = `ใบสั่งซื้อลงที่อยู่ ${n1}${rest} แต่ขนส่งส่งที่ ${wrong}${rest} จึงเป็นความผิดพลาดของขนส่ง`;
      } else if (v === 2) { // customer typo on receipt
        c.req = `ฉันไม่ได้รับของ ทั้งที่ระบบบอกว่าส่งสำเร็จแล้ว บ้านฉันอยู่ ${n1}${rest} ช่วยตรวจสอบหน่อย`;
        put(mkRc(rno, sh, d(), '16:10', cu, `${wrong}${rest}`, [[x[0], 1, x[2]]], {}), mkTr(tno, car, 1, [['จัดส่งสำเร็จ', `ส่งที่ ${wrong}${rest} ผู้รับเซ็นรับ`], ['ออกส่งพัสดุ', 'พนักงานจัดส่งกำลังนำจ่าย'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง']], { status: 'จัดส่งสำเร็จ' }));
        shuffle(['ลูกค้ากรอกที่อยู่ในใบสั่งซื้อผิดเอง ขนส่งส่งตามที่อยู่ที่ระบุแล้ว', 'ขนส่งส่งผิดบ้าน', 'ร้านยังไม่ได้ส่งของ'], 'ลูกค้ากรอกที่อยู่ในใบสั่งซื้อผิดเอง ขนส่งส่งตามที่อยู่ที่ระบุแล้ว'); c.why = `ใบสั่งซื้อลงที่อยู่ ${wrong}${rest} ขนส่งส่งตามนั้นถูกต้อง แต่บ้านจริงของลูกค้าคือ ${n1}${rest}`;
      } else { // returned: nobody home
        c.req = `ฉันรอพัสดุมาหลายวันแล้ว ยังไม่ได้ของ ช่วยตรวจสอบหน่อยว่าเกิดอะไรขึ้น`;
        put(mkRc(rno, sh, d(), '16:10', cu, `${n1}${rest}`, [[x[0], 1, x[2]]], {}), mkTr(tno, car, 1, [['ตีกลับร้านค้า', 'พัสดุกำลังเดินทางกลับ'], ['พยายามส่งครั้งที่ 3', 'ไม่มีผู้รับ'], ['พยายามส่งครั้งที่ 2', 'ไม่มีผู้รับ โทรไม่ติด'], ['พยายามส่งครั้งที่ 1', 'ไม่มีผู้รับ'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง']], { status: 'ตีกลับ' }));
        shuffle(['ขนส่งพยายามส่ง 3 ครั้งแต่ไม่มีผู้รับ พัสดุจึงตีกลับร้าน', 'ขนส่งส่งผิดบ้าน', 'ร้านไม่ได้ส่งของ'], 'ขนส่งพยายามส่ง 3 ครั้งแต่ไม่มีผู้รับ พัสดุจึงตีกลับร้าน'); c.why = 'ที่อยู่ถูกต้อง แต่ขนส่งพยายามส่ง 3 ครั้งไม่มีผู้รับ จึงตีกลับร้าน';
      }
      c.brief = [['rc', rno, 'ใบเสร็จสั่งซื้อ'], ['tr', tno, 'พัสดุ']]; c.need = ['rc:' + rno, 'tr:' + tno];
    } else { // damaged
      const x = it(1), dmgCarrier = v < 2, dn = decNo(i);
      c.title = 'ของแตกเสียหาย'; c.diff = 3; c.req = `ฉันสั่ง${x[0]} แต่ได้รับของแตกเสียหาย ต้องการให้ร้านรับผิดชอบ ช่วยตรวจสอบหน่อยว่าใครผิด`;
      put(mkRc(rno, sh, d(), '13:00', cu, ad, [[x[0], 1, x[2]]], {}), mkTr(tno, car, 1, dmgCarrier ? [['จัดส่งสำเร็จ', 'ผู้รับเซ็นรับ 1 กล่อง'], ['พบความเสียหาย', v === 0 ? 'กล่องถูกกดทับและบุบระหว่างขนส่ง' : 'พัสดุเปียกน้ำฝนระหว่างขนส่ง'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง']] : [['จัดส่งสำเร็จ', 'ผู้รับเซ็นรับ 1 กล่อง'], ['ถึงศูนย์กระจายสินค้า', 'ปลายทาง'], ['รับพัสดุจากร้าน', '1 กล่อง สภาพปกติ']], { status: 'จัดส่งสำเร็จ' }),
        { no: rno, photos: [{ label: 'รูปตอนแพ็กของที่ร้าน', items: dmgCarrier ? [x, ['🫧', 'ห่อกันกระแทก']] : [x], note: dmgCarrier ? 'ห่อกันกระแทกหนา 2 ชั้น' : 'ใส่กล่องเปล่า ไม่มีกันกระแทก' }, { label: 'รูปของที่ลูกค้าได้รับ', items: [['💥', x[0] + ' แตกเสียหาย']], note: 'ของแตกในกล่อง' }] });
      put(null, mkTr(dn, car, 1, [['จัดส่งสำเร็จ', 'ผู้รับเซ็นรับ 1 กล่อง สภาพปกติ']], { status: 'จัดส่งสำเร็จ' }));
      c.brief = [['rc', rno, 'ใบเสร็จสั่งซื้อ'], ['tr', tno, 'พัสดุของลูกค้า'], ['tr', dn, 'พัสดุอีกกล่อง (ลูกค้าเคยได้รับก่อนหน้านี้)']]; c.need = ['tr:' + tno, 'pic:' + rno];
      const okT = dmgCarrier ? 'ของเสียหายระหว่างขนส่ง ควรเคลมกับขนส่ง' : 'ร้านแพ็กไม่ดี ไม่มีกันกระแทก ร้านควรรับผิดชอบ'; shuffle([okT, dmgCarrier ? 'ร้านแพ็กไม่ดี ไม่มีกันกระแทก' : 'ของเสียหายระหว่างขนส่ง', 'ลูกค้าทำของเสียหายเอง'], okT);
      c.why = dmgCarrier ? 'ร้านห่อกันกระแทกหนา 2 ชั้น แต่ขนส่งบันทึกว่ากล่องเสียหายระหว่างทาง จึงเคลมกับขนส่ง' : 'รูปตอนแพ็กไม่มีกันกระแทกเลย และขนส่งไม่มีบันทึกความเสียหาย ร้านต้องรับผิดชอบ';
    }
    return c;
  }
  const DETS = Array.from({ length: 20 }, (_, i) => buildDet(i));
  const DB = { rc: {}, tr: {}, pic: {} }; DETS.forEach(c => { Object.assign(DB.rc, c.rc); Object.assign(DB.tr, c.tr); Object.assign(DB.pic, c.pics); });
  const FROM_D = ['คุณธีร์ (ร้านค้าออนไลน์)', 'คุณมีนา (ผู้ว่าจ้าง)', 'คุณชาติ (เจ้าของกิจการ)'];
  const normNo = t => String(t || '').toUpperCase().replace(/[\s\-_]/g, '');
  const dbFind = (kind, q) => { const n = normNo(q); if (!n) return null; for (const k in DB[kind]) if (normNo(k) === n) return DB[kind][k]; return null; };
  const TS = { rcpt: null, trk: null, pic: null };
  const KEYK = { rcpt: 'rc', trk: 'tr', pic: 'pic' };
  function toolSearch(t, q) {
    const kind = KEYK[t], rec = dbFind(kind, q); TS[t] = { q, found: !!rec, rec };
    if (rec) { const j = H.job; if (j && j.k === 'det' && Array.isArray(j.seen)) { const key = kind + ':' + (kind === 'pic' ? rec.no : rec.no); if (!j.seen.includes(key)) j.seen.push(key); } }
    refreshApp(t); if (H.job && H.job.k === 'det') refreshApp('det');
  }
  function toolHtml(t) {
    const st = TS[t], ph = t === 'rcpt' ? 'เช่น R-24100' : t === 'trk' ? 'เช่น TH781000000' : 'พิมพ์เลขใบเสร็จ เช่น R-24100', lab = t === 'rcpt' ? 'เลขที่ใบเสร็จ' : t === 'trk' ? 'เลขพัสดุ' : 'เลขใบเสร็จของออเดอร์';
    const title = t === 'rcpt' ? '🧾 ระบบค้นหาใบเสร็จ' : t === 'trk' ? '🚚 ติดตามพัสดุ' : '📷 คลังรูปพัสดุ (รูปตอนแพ็ก / รูปที่ลูกค้าได้รับ)';
    let out = '<p class="hps">พิมพ์เลขที่แล้วกดค้นหา ข้อมูลในระบบมีหลายรายการ ต้องพิมพ์ให้ตรงเป๊ะ</p>';
    if (st) {
      if (!st.found) out = `<div class="hprs bad">ไม่พบข้อมูลของเลข "${esc2(st.q)}" ลองตรวจตัวเลขอีกครั้ง</div>`;
      else if (t === 'rcpt') { const r = st.rec; out = `<div class="hpcard"><b>${esc2(r.shop)}</b><br><small>เลขที่ ${esc2(r.no)} · ${esc2(r.date)} ${esc2(r.time)}</small>${row('ลูกค้า', esc2(r.cust))}${row('ที่อยู่จัดส่ง', esc2(r.addr))}${r.lines.map(l => row(esc2(l[0]) + ' × ' + l[1], '฿' + baht(l[1] * l[2]))).join('')}${row('รวมทั้งสิ้น', '฿' + baht(r.total))}${r.txn ? row('รหัสธุรกรรม', esc2(r.txn)) : ''}${row('สถานะ', 'ชำระเงินแล้ว')}</div>`; }
      else if (t === 'trk') { const r = st.rec; out = `<div class="hpcard"><b>${esc2(r.car)}</b><br><small>เลขพัสดุ ${esc2(r.no)}</small>${row('สถานะล่าสุด', esc2(r.status || ''))}${row('จำนวนพัสดุ', r.parcels + ' กล่อง')}<div class="hptl">${r.events.map(e => `<div><b>${esc2(e[0])}</b><br><small>${esc2(e[1])}</small></div>`).join('')}</div></div>`; }
      else out = st.rec.photos.map(p2 => `<div class="hpcard"><b>${esc2(p2.label)}</b><div class="hpphoto">${p2.items.map(x => `<span title="${esc2(x[1])}"><i>${x[0]}</i><small>${esc2(x[1])}</small></span>`).join('')}</div><small>${esc2(p2.note)}</small></div>`).join('');
    }
    return `<h3 class="hpjt">${title}</h3><div class="hpsrch"><input data-tq="${t}" value="${esc2(st ? st.q : '')}" placeholder="${ph}" autocomplete="off" spellcheck="false" aria-label="${lab}"><button class="go" data-hp="tsearch" data-t="${t}">🔎 ค้นหา</button></div>${out}`;
  }
  const D_NEED_LABEL = { rc: 'ใบเสร็จ', tr: 'พัสดุ', pic: 'รูป' };
  function detHtml() {
    const head = head2('det');
    if (res && res.k === 'det') return head + `<div class="hpres"><h3>${res.okAns ? (res.acc >= .9 ? '🕵️ ไขคดีได้เรียบร้อย' : '🕵️ ไขคดีได้ แต่ตรวจหลักฐานยังไม่ครบ') : '🙂 สรุปคดีผิด'}</h3>${row('คำตอบ', res.okAns ? 'ถูกต้อง ✅' : 'ไม่ถูกต้อง ❌', res.okAns ? '' : 'warn')}${row('ตรวจหลักฐานสำคัญ', res.kf + '/' + res.nk)}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<p class="hps">เฉลย: ${esc2(res.why)}</p><div class="hpq"><button class="go" data-hp="jnext">คดีต่อไป</button></div></div>`;
    if (H.job && H.job.k === 'det') {
      const j = H.job, p = DETS[j.pid]; if (!p || !Array.isArray(j.seen)) { H.job = null; return detHtml(); }
      const tools = [['rcpt', '🧾 ค้นหาใบเสร็จ'], ['trk', '🚚 ติดตามพัสดุ'], ['pic', '📷 รูปพัสดุ']];
      return head + `<h3 class="hpjt">🔍 คดี: ${esc2(p.title)} <small>${'★'.repeat(p.diff)}${'☆'.repeat(3 - p.diff)}</small></h3><div class="hpcard"><small>ผู้ว่าจ้าง: ${esc2(CUS[p.id])}</small><br>"${esc2(p.req)}"</div><p class="hps">เลขอ้างอิงในคดี (พิมพ์ลงในแอปค้นหาเพื่อดูข้อมูลจริง):</p><div class="hpnums">${p.brief.map(b => `<div class="${j.seen.includes(b[0] + ':' + b[1]) ? 'seen' : ''}"><code>${esc2(b[1])}</code> <small>${esc2(b[2])}${j.seen.includes(b[0] + ':' + b[1]) ? ' ✓ ตรวจแล้ว' : ''}</small></div>`).join('')}</div><div class="hpq" style="margin-top:6px">${tools.map(x => `<button data-hp="dtool" data-t="${x[0]}">${x[1]}</button>`).join('')}</div><p class="hps">📒 สมุดข้อสังเกต</p><textarea class="hpnote" data-note="1" placeholder="จดสิ่งที่พบไว้ตรงนี้ (ไม่มีผลต่อคะแนน)">${esc2(j.note || '')}</textarea><p class="hps">สรุปคดี</p><div class="hpsteps">${p.opts.map((o, i) => `<button class="hpstp${j.ans === i ? ' sel' : ''}" data-hp="dans" data-i="${i}">${esc2(o)}</button>`).join('')}</div><div class="hpq"><button class="go" data-hp="dsubmit">📨 ส่งรายงาน</button><button data-hp="jcancel">ยกเลิกคดี (ไม่เสียอะไร)</button></div>`;
    }
    if (H.job) return head + '<p class="hps">ตอนนี้มีงานอื่นที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    const can = leftMin() >= D_MIN, mx = level('det') >= 7 ? 3 : level('det') >= 4 ? 2 : 1;
    return head + `<div class="hpjob"><h3>🔍 งานนักสืบ</h3><p>รับคดีจากลูกค้า แล้วใช้แอปในโฟลเดอร์ "เครื่องมือนักสืบ" ค้นหาข้อมูลจริง ได้แก่ ใบเสร็จ ติดตามพัสดุ และรูปพัสดุ จากนั้นสรุปว่าเกิดอะไรขึ้น<br><small>ประมาณ ${D_MIN} นาทีเกม (≈ ${Math.round(D_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(D_BASE * mult(level('det'))))} · ตอนนี้รับคดีระดับ ${'★'.repeat(mx)}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="daccept">✅ รับคดี</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">คะแนนมาจากสรุปคดีถูกต้อง (60%) และการตรวจหลักฐานที่จำเป็นครบ (40%) · มี 20 คดี เลเวลสูงขึ้นจะเจอคดียากขึ้น</p></div>`;
  }
  function detAccept() {
    if (H.job || leftMin() < D_MIN) return; const mx = level('det') >= 7 ? 3 : level('det') >= 4 ? 2 : 1, pool = DETS.map((d, i) => i).filter(i => DETS[i].diff <= mx); let i; do { i = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && i === lastJ.det); lastJ.det = i;
    H.job = { k: 'det', pid: i, seen: [], ans: -1, note: '' }; res = null; TS.rcpt = TS.trk = TS.pic = null; refreshJobs(); ['rcpt', 'trk', 'pic'].forEach(refreshApp);
  }
  function detSubmit() {
    const j = H.job; if (!j || j.k !== 'det') return; if (j.ans < 0) { toast('เลือกคำตอบสรุปคดีก่อนส่งรายงาน', 1.8); return; }
    const p = DETS[j.pid], okAns = j.ans === p.ok, kf = p.need.filter(k => j.seen.includes(k)).length, acc = (okAns ? .6 : 0) + .4 * kf / p.need.length;
    const pay = Math.round(D_BASE * mult(level('det')) * acc), exp = Math.round(D_EXP * (.4 + .6 * acc));
    const lv = finishJob('det', 'นักสืบ', p.title, pay, exp, acc, { name: 'นักสืบ', from: FROM_D, good: 'ยอดเยี่ยมครับ ไขคดีได้ตรงประเด็นมาก ขอบคุณที่ช่วยนะครับ 🙏 โอนค่าจ้างให้แล้ว', ok: 'ได้เรื่องราวพอสมควรครับ แต่ยังมีบางจุดที่ไม่ตรง ขอบคุณที่ช่วยดูให้', bad: 'รายงานรอบนี้ยังไม่ตรงกับความจริงครับ รอบหน้าลองตรวจข้อมูลให้ละเอียดขึ้นนะครับ', up: 'ฝีมือสืบพัฒนาขึ้นเยอะเลย ตอนนี้เลเวล {L} แล้ว ค่าจ้างและคดีที่ให้จะดีขึ้นครับ 💪' });
    res = { k: 'det', okAns, kf, nk: p.need.length, pay, exp, acc, lv, why: p.why }; H.job = null; refreshJobs();
  }

  /* ================= build / render ================= */
  function build() {
    if (hp) return; hp = h('div', { id: 'homePC' }, `<div class="hpl"></div><div class="hpm"><div class="hpd" data-drop="desk"></div><div class="hpwl"></div><div class="hpbarT"><span class="hptask"></span><button class="hpfs" data-hp="pause" title="พักเกม (หยุดเวลา)">⏸ พักเกม</button><button class="hpfs" data-hp="full" title="เต็มจอ">⛶</button><b id="hpClk">${hm(gnow())}</b></div><div class="hpbedw"></div></div><div class="hpdesk"></div>`);
    document.body.append(hp); mon = hp.querySelector('.hpm'); dsk = hp.querySelector('.hpd'); wl = hp.querySelector('.hpwl'); W = []; sel = null; res = null;
    try { closePhone(); } catch (e) {} hp.classList.toggle('full', isFull()); applyLamp(); renderDesk(); renderWins(); renderBed();
    hp.addEventListener('change', e => { const sl = e.target.closest && e.target.closest('[data-cf]'); const j = codeJob(); if (sl && j) { j.fix[sl.dataset.cf] = sl.value; j.out = ''; const rn = hp.querySelector('.hprun'); if (rn) rn.innerHTML = ''; } }); hp.addEventListener('input', e => { const nt = e.target.closest && e.target.closest('[data-note]'); if (nt && H.job && H.job.k === 'det') H.job.note = nt.value;  const t = e.target.closest && e.target.closest('[data-fx]'); if (t && H.job) { (H.job.fix = H.job.fix || {})[t.dataset.fx] = t.value; } }); hp.addEventListener('keydown', e => { const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') { e.stopPropagation(); if (e.key === 'Enter' && e.target.dataset && e.target.dataset.tq) toolSearch(e.target.dataset.tq, e.target.value); } }); hp.addEventListener('click', onClick); hp.addEventListener('dblclick', onDbl); hp.addEventListener('contextmenu', onCtx); hp.addEventListener('pointerdown', onDown);
    new ResizeObserver(() => { if (!mon) return; renderDesk(); fitWins(); }).observe(mon);
  }
  function destroy() { if (hp) { hp.remove(); hp = null; mon = dsk = wl = null; } W = []; menu = null; confirmSleep = false; if (document.fullscreenElement && H.full && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }
  function sync() { if (H.on && !hp) { build(); light(); } else if (!H.on && hp) destroy(); }
  function renderBed() { const b = hp && hp.querySelector('.hpbedw'); if (!b) return; b.className = 'hpbedw' + (H.bed ? ' on' : ''); b.innerHTML = H.bed ? `<div class="hpbed"><div class="hpbi">🌙</div><h2>ถึงเวลานอนแล้ว</h2><p>งานเสริมวันนี้ปิดรับแล้ว ${H.job ? 'งานตรวจนิยายที่ทำค้างไว้ถูกเก็บไว้ให้ ทำต่อพรุ่งนี้ได้' : 'ไม่มีงานค้าง'} ไม่มีโทษอะไรทั้งสิ้น</p><button class="go" data-hp="bedgo">😴 ดูสรุปประจำวัน แล้วนอนหลับ</button></div>` : ''; }
  function fitWins() { const d = dims(); W.forEach(w => { w.w = Math.min(w.w, d.w - 8); w.h = Math.min(w.h, d.h - 4); w.x = clamp(w.x, 0, Math.max(0, d.w - w.w)); w.y = clamp(w.y, 0, Math.max(0, d.h - w.h)); }); renderWins(); }
  function setFull(on) {
    H.full = on; if (hp) hp.classList.toggle('full', isFull());
    try { if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); else if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
    setTimeout(() => { renderDesk(); fitWins(); }, 200);
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && H.full && hp) { H.full = false; hp.classList.toggle('full', isFull()); setTimeout(() => { renderDesk(); fitWins(); }, 200); } });

  /* ---- folders: create / rename / delete / move ---- */
  function newDir(parent) {
    let n = 'โฟลเดอร์ใหม่', k = 2; while (H.items.some(x => x.n === n)) n = 'โฟลเดอร์ใหม่ ' + k++;
    const it = { id: 'u' + (++H.uid), t: 'dir', n, e: '📁', loc: parent || 'desk' }; if (it.loc === 'desk') it.p = freeCell(it.id, 0, 0); H.items.push(it); renderDesk(); refreshDirs(); sel = it.id; startRename(it.id); return it;
  }
  function startRename(id) {
    const a = item(id); if (!a) return; const el = hp.querySelector(`.hpi[data-id="${id}"] span`); if (!el) return; const inp = document.createElement('input'); inp.value = a.n; inp.maxLength = 28; inp.className = 'hprn'; el.replaceWith(inp); inp.focus(); inp.select();
    const done = ok => { if (!inp.isConnected) return; if (ok && inp.value.trim()) a.n = inp.value.trim().slice(0, 28); renderDesk(); refreshDirs(); renderWins(); };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); }); inp.addEventListener('blur', () => done(true)); inp.addEventListener('click', e => e.stopPropagation()); inp.addEventListener('dblclick', e => e.stopPropagation());
  }
  function delDir(id) { const a = item(id); if (!a || a.sys || a.t !== 'dir') return; kids(id).forEach(x => { x.loc = a.loc; if (a.loc === 'desk') x.p = freeCell(x.id, 0, 0); else delete x.p; }); H.items.splice(H.items.indexOf(a), 1); W = W.filter(w => !(w.k === 'dir' && w.ref === id)); renderDesk(); renderWins(); refreshDirs(); }
  function moveTo(id, loc, at) {
    const a = item(id); if (!a) return false; if (loc !== 'desk') { const d = item(loc); if (!d || d.t !== 'dir' || loc === id || inside(loc, id)) { try { toast('ย้ายโฟลเดอร์เข้าไปในตัวมันเองไม่ได้', 1.6); } catch (e) {} return false; } }
    a.loc = loc; if (loc === 'desk') a.p = at ? freeCell(id, at.c, at.r) : freeCell(id, 0, 0); else delete a.p; renderDesk(); refreshDirs(); return true;
  }

  /* ---- context menu ---- */
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; } };
  function showMenu(x, y, items) {
    closeMenu(); const r = mon.getBoundingClientRect(); menu = h('div', { class: 'hpmenu' }, items.map((m, i) => `<button data-mi="${i}">${m[0]}</button>`).join('')); mon.append(menu);
    menu.style.left = clamp(x - r.left, 0, r.width - 170) + 'px'; menu.style.top = clamp(y - r.top, 0, r.height - items.length * 34 - 40) + 'px';
    menu.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (!b) return; e.stopPropagation(); const f = items[+b.dataset.mi][1]; closeMenu(); f(); });
  }
  function onCtx(e) {
    e.preventDefault(); const ic = e.target.closest('.hpi'), tgt = ic ? item(ic.dataset.id) : null, dirId = (e.target.closest('.hpw .hpb[data-drop]') || {dataset: {}}).dataset.drop || '', here = dirId || 'desk';
    if (tgt) { sel = tgt.id; const m = [['📂 เปิด', () => openItem(tgt.id)], ['✏️ เปลี่ยนชื่อ', () => { if (tgt.sys || tgt.t === 'app') { try { toast('ไอคอนของระบบเปลี่ยนชื่อไม่ได้', 1.6); } catch (x) {} } else startRename(tgt.id); }]]; if (tgt.t === 'dir' && !tgt.sys) m.push(['🗑️ ลบโฟลเดอร์ (ของข้างในย้ายออกมา)', () => delDir(tgt.id)]); showMenu(e.clientX, e.clientY, m); return; }
    if (e.target.closest('.hpm') && (e.target.closest('.hpd') || dirId)) showMenu(e.clientX, e.clientY, [['📁 โฟลเดอร์ใหม่', () => newDir(here === 'desk' ? null : here)], ['🔄 จัดไอคอนใหม่', () => { H.items.filter(x => x.loc === 'desk').forEach(x => delete x.p); renderDesk(); }], [isFull() ? '🗗 ออกจากเต็มจอ' : '⛶ เต็มจอ', () => setFull(!isFull())]]);
  }
  function openItem(id) { const a = item(id); if (!a) return; if (a.t === 'dir') openWin('dir', id); else openWin('app', id); }

  /* ---- pointer: drag icons / move + resize windows ---- */
  function onDown(e) {
    if (e.button > 0) return; closeMenu();
    const ic = e.target.closest('.hpi'); if (ic && !e.target.closest('input')) {
      const id = ic.dataset.id, sx = e.clientX, sy = e.clientY; let g = null, moved = false;
      const mv = ev => { if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 7) return; moved = true; if (!g) { g = ic.cloneNode(true); g.classList.add('hpghost'); document.body.append(g); ic.classList.add('hpdrag'); } g.style.left = ev.clientX - 40 + 'px'; g.style.top = ev.clientY - 36 + 'px'; };
      const up = ev => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g) { g.remove(); ic.classList.remove('hpdrag'); } if (!moved) return; cdrag = performance.now(); dropAt(id, ev); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); return;
    }
    const t = e.target.closest('.hpt'), w = e.target.closest('.hpw'); if (w) { const o = W.find(x => x.id === w.dataset.w); if (o) { if (o.z !== zTop) { o.z = ++zTop; w.style.zIndex = o.z; } if (t && !e.target.closest('button') && !o.max) startMove(o, w, e); else if (e.target.closest('.hprz')) startResize(o, w, e); } }
  }
  function startMove(o, el, e) { const sx = e.clientX, sy = e.clientY, ox = o.x, oy = o.y, d = dims(); const mv = ev => { o.x = clamp(ox + ev.clientX - sx, -o.w + 80, d.w - 80); o.y = clamp(oy + ev.clientY - sy, 0, d.h - 30); el.style.left = o.x + 'px'; el.style.top = o.y + 'px'; }; const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }; document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  function startResize(o, el, e) { e.preventDefault(); const sx = e.clientX, sy = e.clientY, ow = o.w, oh = o.h; const mv = ev => { o.w = Math.max(260, ow + ev.clientX - sx); o.h = Math.max(180, oh + ev.clientY - sy); el.style.width = o.w + 'px'; el.style.height = o.h + 'px'; }; const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }; document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  function dropAt(id, ev) {
    const els = document.elementsFromPoint(ev.clientX, ev.clientY), dirIc = els.find(x => x.classList && x.classList.contains('hpi') && x.dataset.t === 'dir' && x.dataset.id !== id);
    if (dirIc) { if (moveTo(id, dirIc.dataset.id)) try { S.tone(520, 780, .1, .08, 'triangle'); } catch (x) {} return; }
    const win = els.find(x => x.classList && x.classList.contains('hpb') && x.dataset.drop); if (win) { moveTo(id, win.dataset.drop); return; }
    const d = els.find(x => x.classList && x.classList.contains('hpd')); if (d) { const r = d.getBoundingClientRect(); moveTo(id, 'desk', { c: clamp(Math.floor((ev.clientX - r.left - 5) / CW), 0, cap().c - 1), r: clamp(Math.floor((ev.clientY - r.top - 5) / CH), 0, cap().r - 1) }); }
  }

  /* ---- clicks ---- */
  function onDbl(e) { const ic = e.target.closest('.hpi'); if (ic && !e.target.closest('input')) openItem(ic.dataset.id); }
  function onClick(e) {
    if (cdrag && performance.now() - cdrag < 250) return; if (!e.target.closest('.hpmenu')) closeMenu();
    const ic = e.target.closest('.hpi'); if (ic && !e.target.closest('input')) { sel = ic.dataset.id; hp.querySelectorAll('.hpi.sel').forEach(x => x.classList.remove('sel')); ic.classList.add('sel'); return; }
    const b = e.target.closest('[data-hp]'); if (!b) { if (!e.target.closest('.hpw')) { sel = null; hp.querySelectorAll('.hpi.sel').forEach(x => x.classList.remove('sel')); } return; }
    const a = b.dataset.hp, w = e.target.closest('.hpw'), o = w && W.find(x => x.id === w.dataset.w);
    if (a === 'x') { if (o) closeWin(o.id); } else if (a === 'min') { if (o) { o.min = true; renderWins(); } } else if (a === 'max') { if (o) { o.max = !o.max; renderWins(); } }
    else if (a === 'tb') { const t = W.find(x => x.id === b.dataset.w); if (t) { if (!t.min && t.z === zTop) t.min = true; else { t.min = false; focus(t); } renderWins(); } }
    else if (a === 'pause') { try { lockStart(); } catch (e) { toast('พักเกมไม่ได้ในตอนนี้', 1.6); } } else if (a === 'full') setFull(!isFull()); else if (a === 'up') { const t = b.dataset.to; if (o && t) { closeWin(o.id); openWin('dir', t); } } else if (a === 'newdir') newDir(b.dataset.in);
    else if (a === 'sleepask') { confirmSleep = true; refreshApp('clock'); } else if (a === 'sleepno') { confirmSleep = false; refreshApp('clock'); } else if (a === 'sleepyes') skipToBed(); else if (a === 'bedgo') { if (CG.goHome) CG.goHome.begin({ msg: 'เตรียมเข้านอน…' }); }
    else if (a === 'naccept') novelAccept(); else if (a === 'ncancel') { H.job = null; refreshApp('novel'); refreshApp('code'); } else if (a === 'nnext') { res = null; refreshApp('novel'); refreshApp('code'); }
    else if (a === 'mark') { if (H.job) { const i = +b.dataset.i, k = H.job.marks.indexOf(i); if (k >= 0) H.job.marks.splice(k, 1); else H.job.marks.push(i); b.classList.toggle('hpmk'); const cnt = hp.querySelector('#hpmc'); if (cnt) cnt.textContent = `ทำเครื่องหมายแล้ว ${H.job.marks.length} จุด`; const fe = hp.querySelector('.hpfix'); if (fe) fe.innerHTML = fixHtml(); } }
    else if (a === 'nsubmit') novelSubmit();
    else if (a === 'petbuy') { const k = b.dataset.k; if (H.pets[k]) return; if (bank.bal < PET_COST) { try { toast('เงินในบัญชีไม่พอ ไปทำงานเสริมหรือรอเงินเดือนก่อนนะ', 2); } catch (e) {} } else { bankTx('🐾 ซื้อเสียง' + (k === 'cat' ? 'แมว' : 'หมา'), -PET_COST); H.pets[k] = true; H.hist.push({ d: gd(), job: 'ซื้อ' + (k === 'cat' ? 'แมว' : 'หมา') + ' (เสียง)', amt: -PET_COST, exp: 0 }); try { S.tone(660, 990, .15, .09); } catch (e) {} refreshApp('pet'); refreshApp('fin'); refreshApp('hist'); petSound(k, false); } }
    else if (a === 'petcall') { petSound(b.dataset.k, true); refreshApp('pet'); }
    else if (a === 'amb') { H.amb = b.dataset.v; refreshApp('pet'); } else if (a === 'lamp') { H.lamp = +b.dataset.v; applyLamp(); refreshApp('pet'); }
    else if (a === 'caccept') codeAccept(); else if (a === 'ccancel') { H.job = null; refreshApp('code'); refreshApp('novel'); } else if (a === 'cnext') { res = null; refreshApp('code'); refreshApp('novel'); } else if (a === 'csubmit') codeSubmit();
    else if (a === 'raccept') revAccept(); else if (a === 'rstar') { if (H.job && H.job.k === 'rev') { H.job.stars = +b.dataset.v; refreshApp('rev'); } } else if (a === 'rpick') revPick(+b.dataset.i); else if (a === 'rsubmit') revSubmit();
    else if (a === 'daccept') detAccept(); else if (a === 'dans') { if (H.job && H.job.k === 'det') { H.job.ans = +b.dataset.i; refreshApp('det'); } } else if (a === 'dsubmit') detSubmit();
    else if (a === 'dtool') openWin('app', b.dataset.t); else if (a === 'tsearch') { const inp = hp.querySelector(`[data-tq="${b.dataset.t}"]`); toolSearch(b.dataset.t, inp ? inp.value : ''); }
    else if (a === 'jcancel') { H.job = null; refreshJobs(); } else if (a === 'jnext') { res = null; refreshJobs(); }
    else if (a === 'crun') codeRun(); else if (a === 'cmark') { if (codeJob()) { const i = +b.dataset.i; codeMark(i); } }
  }
  addEventListener('keydown', e => { if (!hp || !H.on) return; if (e.key === 'F2' && sel) { const a = item(sel); if (a && a.t === 'dir' && !a.sys) startRename(sel); } else if (e.key === 'Delete' && sel && !(e.target && e.target.tagName === 'INPUT')) delDir(sel); else if (e.key === 'Escape') closeMenu(); });

  /* ================= time: warning 23:30, pinned at 23:59, bedtime ================= */
  function pin() { const g = gnow(); if (g.getHours() !== 23 || g.getMinutes() < 59) return; const lim = new Date(g); lim.setHours(23, 59, 0, 0); timeOff -= g.getTime() - lim.getTime(); lastMin = ''; }
  function skipToBed() { const g = gnow(), t = new Date(g); t.setHours(23, 59, 0, 0); if (t > g) { timeOff += t.getTime() - g.getTime(); lastMin = ''; try { enforceDate(); } catch (e) {} } confirmSleep = false; bedtime(); }
  function bedtime() { if (H.bed) return; H.bed = true; try { S.tone(330, 220, .35, .06); } catch (e) {} renderBed(); }
  function light() { if (!hp) return; const m = min(), k = m < 19 * 60 ? .4 : Math.max(.1, .4 - (m - 19 * 60) / 300 * .3); hp.style.setProperty('--lamp', k.toFixed(2)); }
  let lastClock = '';
  function tick() {
    if (!H.on) return; const g = gnow();
    if (!H.bed) { if (sleepWin()) { pin(); bedtime(); } else if (g.getHours() < 5) bedtime(); } else if (sleepWin()) pin();
    if (!H.bed && min() >= 23 * 60 + 30 && H.warnDay !== gd()) { H.warnDay = gd(); try { S.big('🌙 อีก 30 นาทีจะถึงเวลานอน', 3, '#7d6dff'); } catch (e) {} }
    light(); const c = hp && hp.querySelector('#hpClk'); if (c) c.textContent = hm(gnow());
    if (hp) { const k = hm(g) + '|' + confirmSleep; if (k !== lastClock) { lastClock = k; refreshApp('clock'); } if (isFull() !== hp.classList.contains('full')) hp.classList.toggle('full', isFull()); }
  }
  setInterval(tick, 500);

  /* ================= enter / exit ================= */
  function enter() {
    if (busy || hp) return; busy = true; H.on = true; H.bed = false;
    const fade = h('div', { id: 'homeFade' }, `<div class="hfi">🌙<br>กลับถึงบ้านแล้ว…<br><small>${hm(gnow())}</small></div>`); document.body.append(fade);
    try { complete('n12home'); } catch (e) {}
    setTimeout(() => { build(); light(); if (min() >= 23 * 60 + 59) { pin(); bedtime(); } fade.classList.add('out'); }, 1300);
    setTimeout(() => { fade.remove(); busy = false; tick(); }, 3000);
  }
  function exit() { H.on = false; H.bed = false; destroy(); CG.Bus.emit('home.exit'); }
  CG.Bus.on('sleep.done', () => { if (H.on) exit(); });
  CG.home = {
    enter, exit, on: () => H.on, bed: () => H.bed, open: openItem, newDir, setFull, state: () => ({ on: H.on, bed: H.bed, bal: bank.bal, cred: H.cred, side: H.side, hist: H.hist.slice(), job: H.job, skill: { ...H.skill }, items: H.items.map(x => ({ ...x })), wins: W.map(w => ({ id: w.id, min: w.min, max: w.max })), full: isFull() }),
    petSound, pets: () => ({ ...H.pets }), buyPet: k => { H.pets[k] = true; }, petCost: PET_COST, addSide: (job, amt, exp) => { earn(amt, job); H.hist.push({ d: gd(), job, amt, exp: exp || 0 }); refreshApp('fin'); refreshApp('hist'); },
    addExp: (k, n) => { H.skill[k] = Math.min(TH[9], (H.skill[k] || 0) + n); refreshApp(k); }, level, mult, detCase: i => DETS[i], detCount: () => DETS.length, toolSearch, revCase: i => REVS[i], codeCase: i => CODES[i], codeCount: () => CODES.length, passages: () => PASS.length, pass: i => PASS[i],
  };
  if (CG.Dev) CG.Dev.add('🏠 Home Mode', box => {
    box.innerHTML = '<button data-h="in">เข้าบ้านทันที (ไม่เสียค่ารถ)</button> <button data-h="t2325">23:25</button> <button data-h="t2355">23:55</button> <button data-h="t2000">20:00</button> <button data-h="exp">+500 EXP นิยาย</button> <button data-h="out">ออกจาก Home Mode</button>';
    const set = (hh, mm) => { const g = gnow(), t = new Date(g); t.setHours(hh, mm, 0, 0); timeOff += t.getTime() - g.getTime(); lastMin = ''; try { enforceDate(); } catch (e) {} };
    box.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (!b) return; const a = b.dataset.h; if (a === 'in') enter(); else if (a === 'out') exit(); else if (a === 'exp') CG.home.addExp('novel', 500); else if (a === 't2325') set(23, 25); else if (a === 't2355') set(23, 55); else if (a === 't2000') set(20, 0); });
  });

  const css = document.createElement('style');
  css.textContent = '#homeFade{position:fixed;inset:0;z-index:90;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--font);animation:hfin .8s ease-out;transition:opacity .8s}#homeFade.out{opacity:0}@keyframes hfin{from{opacity:0}to{opacity:1}}#homeFade .hfi{font-size:26px;line-height:1.8}#homeFade small{font-size:15px;opacity:.6}'
    + '#homePC{--lamp:.4;position:fixed;inset:0;z-index:70;font-family:var(--font);color:#e8e6ff;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 88% 12%,rgba(255,186,96,var(--lamp)),transparent 46%),linear-gradient(#0a0a1c,#14112b 70%,#1b1330);user-select:none}'
    + '#homePC .hpl{position:absolute;top:4%;right:5%;width:70px;height:70px;border-radius:50%;background:radial-gradient(#ffd596,#ffb85c55 55%,transparent 70%);filter:blur(2px);opacity:calc(var(--lamp)*2)}#homePC .hpdesk{position:absolute;left:0;right:0;bottom:0;height:16%;background:linear-gradient(#2a1d25,#150e14)}'
    + '#homePC .hpm{position:relative;width:min(900px,94vw);height:min(540px,76vh);border:14px solid #1b1830;border-radius:18px;background:linear-gradient(145deg,#1d2c5c,#2b2060);box-shadow:0 0 90px #6c8cff55,0 0 0 2px #2c2860;overflow:hidden;z-index:2}'
    + '#homePC.full .hpm{position:fixed;inset:0;width:auto;height:auto;border:none;border-radius:0;box-shadow:none}#homePC.full .hpl,#homePC.full .hpdesk{display:none}#homePC.full .hpbarT{padding-left:130px}'
    + '#homePC .hpd{position:absolute;left:0;top:0;right:0;bottom:38px}#homePC .hpwl{position:absolute;left:0;top:0;right:0;bottom:38px;pointer-events:none}#homePC .hpwl>*{pointer-events:auto}'
    + '#homePC .hpi{position:absolute;width:92px;border:none;background:none;color:#e8e6ff;cursor:pointer;font:inherit;padding:6px 2px;border-radius:10px;text-align:center}#homePC .hpgrid .hpi,#homePC .hpi:hover{background:#ffffff14}#homePC .hpi.sel{background:#6c63ff55;outline:1px solid #9d97ff}#homePC .hpi i{display:block;font-style:normal;font-size:34px;pointer-events:none}#homePC .hpi span{font-size:12px;line-height:1.25;display:block;pointer-events:none;word-break:break-word}#homePC .hpi.hpdrag{opacity:.35}'
    + '.hpghost{position:fixed!important;width:92px;pointer-events:none;z-index:200;color:#fff;text-align:center;opacity:.85;font-family:var(--font)}.hpghost i{display:block;font-style:normal;font-size:34px}.hpghost span{font-size:12px}'
    + '#homePC .hpbd{position:absolute;right:10px;top:2px;background:#ff5d73;color:#fff;border-radius:10px;padding:0 6px;font-size:11px}#homePC .hprn{width:86px;font:inherit;font-size:12px;border-radius:5px;border:1px solid #9d97ff;background:#fff;color:#222;text-align:center}'
    + '#homePC .hpbarT{position:absolute;left:0;right:0;bottom:0;height:38px;background:#0b0a22e6;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:13px;z-index:30}#homePC .hptask{flex:1;display:flex;gap:6px;overflow:hidden}#homePC .hptask button,#homePC .hpfs{border:1px solid #4a4496;background:#1c1840;color:#e8e6ff;border-radius:8px;padding:3px 10px;font:inherit;cursor:pointer;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}#homePC .hptask button.on{background:#4a40b8}#homePC .hpbarT b{font-variant-numeric:tabular-nums}'
    + '#homePC .hpw{position:absolute;background:#15122b;border:2px solid #4a4496;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 30px #0008}#homePC .hpt{display:flex;align-items:center;gap:5px;padding:6px 10px;background:#26205a;cursor:move;touch-action:none}#homePC .hpt b{flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#homePC .hpt button,#homePC button.go,#homePC .hpq button,#homePC .hpnav button{border:2px solid #5a54a8;background:#221e45;color:#fff;border-radius:9px;padding:3px 10px;font:inherit;cursor:pointer}#homePC .hpt button{padding:0 9px}#homePC .hpb{padding:12px;overflow:auto;flex:1}#homePC .hprz{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 55%,#9d97ff 55%);touch-action:none}'
    + '#homePC .hpnav{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}#homePC .hpnav span{flex:1;color:#aaa6d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#homePC .hpnav button:disabled{opacity:.3}#homePC .hpgrid{display:flex;flex-wrap:wrap;gap:8px;min-height:120px;align-content:flex-start}'
    + '#homePC .hpr{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-bottom:1px solid #ffffff14;font-size:14px}#homePC .hpr small,#homePC .hps small,#homePC .hpe small{opacity:.65;font-weight:400}#homePC .hpr.warn b{color:#ff9b8a}#homePC .hps{color:#aaa6d8;font-size:13px;margin:10px 0 0}#homePC hr{border:none;border-top:1px dashed #ffffff30;margin:10px 0}'
    + '#homePC .hpe{text-align:center;padding:26px 10px;font-size:34px;color:#cfcaf0}#homePC .hpe p{font-size:14px;margin:8px 0 0}#homePC .hpc{font-size:50px;text-align:center;font-weight:700;letter-spacing:2px;color:#ffe9b0}#homePC .hpq{margin-top:12px;text-align:center}#homePC .hpq p{margin:0 0 10px;font-size:14px}#homePC button.go,#homePC .hpq .go{background:#6c63ff;border-color:#9d97ff;font-weight:700;padding:7px 16px}#homePC .hpq button{margin:4px}'
    + '#homePC .hpm1{background:#1f1a45;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px}#homePC .hpm1 p{margin:4px 0 0;color:#dcd8ff}#homePC .hpl2{margin-bottom:8px;font-size:14px}#homePC .hpx{float:right;color:#ffd98a;font-size:13px}#homePC .hpbar2{height:8px;border-radius:6px;background:#ffffff1f;margin-top:5px;overflow:hidden}#homePC .hpbar2 i{display:block;height:100%;background:linear-gradient(90deg,#7d6dff,#ffd98a)}'
    + '#homePC .hpjt{margin:6px 0 0;font-size:15px;color:#ffd98a}#homePC .hptx{margin-top:10px;line-height:2.1;font-size:16px}#homePC .hpck{border:none;background:none;color:#f1efff;font:inherit;cursor:pointer;padding:1px 1px;border-radius:5px}#homePC .hpsp{display:inline-block;width:.6em}#homePC .hpck:hover{background:#ffffff18}#homePC .hpck.hpmk{color:#a9a5d8;background:#ffffff1c;box-shadow:inset 0 -2px 0 #9d97ff}#homePC .hpsteps{margin-top:10px;display:flex;flex-direction:column;gap:6px}#homePC .hpstp{display:block;width:100%;text-align:left;border:2px solid #4a4496;background:#1c1840;color:#f1efff;font:inherit;font-size:14px;padding:8px 10px;border-radius:10px;cursor:pointer}#homePC .hpstp i{display:inline-block;width:1.8em;color:#9d97ff;font-style:normal;font-weight:700}#homePC .hpstp:hover{background:#26205a}#homePC .hpstp.sel{border-color:#ffd98a;background:#3a3270}#homePC .hpht{background:#2a2450;border-radius:10px;padding:8px 10px;font-size:13px;color:#ffe9b0;margin:10px 0 0}#homePC .hpol{margin:6px 0 0;padding-left:1.4em;color:#dcd8ff;font-size:13px}#homePC .hpfacts{margin:8px 0}#homePC .hpstp b{color:#ffd98a}#homePC .hptoast{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);max-width:80%;background:#0b0a22f2;border:2px solid #9d97ff;color:#fff;border-radius:12px;padding:8px 16px;font-size:14px;z-index:120;opacity:0;pointer-events:none;transition:opacity .2s;text-align:center}#homePC .hptoast.on{opacity:1}#homePC .hpdis{opacity:.5;border:2px solid #5a54a8;background:#221e45;color:#fff;border-radius:9px;padding:3px 10px;font:inherit;cursor:pointer}#homePC .hplamp{position:absolute;inset:0;z-index:5;pointer-events:none;transition:background .4s}#homePC .hpfix{margin-top:10px}#homePC .hpfr{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:14px}#homePC .hpfr s{color:#ff9b8a;min-width:5em}#homePC .hpfr input{flex:1;min-width:0;font:inherit;font-size:14px;padding:6px 8px;border-radius:8px;border:2px solid #5a54a8;background:#0c0a1f;color:#fff}#homePC .hpph{font-size:12px;color:#aaa6d8}#homePC .hpcw{flex:1;min-width:230px}#homePC .hpdg{opacity:.5;margin-right:2px}#homePC .hpx2{margin-left:auto;background:#00000033;border:none;color:#fff;border-radius:6px;cursor:pointer;padding:0 7px}#homePC .hpemp{color:#8a86b8;font-size:12px;margin:8px 4px;text-align:center}#homePC .hpcode{background:#0c0a1f;border:2px solid #4a4496;border-radius:12px;padding:8px;margin-top:8px;font-family:monospace}#homePC .hpch{color:#ffd98a;font-weight:700;margin-bottom:4px}#homePC .hpcl{display:block;width:100%;text-align:left;background:none;border:1px solid transparent;color:#e8e6ff;font:inherit;font-size:14px;padding:5px 8px;border-radius:8px;cursor:pointer}#homePC .hpcl:hover{background:#ffffff14}#homePC .hpcl.hpmk{background:#ff7b7b25;border-color:#ff7b7b}#homePC .hpfx{margin:6px 0;padding:6px 8px;border-radius:8px;background:#ffffff10;font-size:13px}#homePC .hprun{margin-top:8px}#homePC .hprs{font-size:13px;padding:5px 8px;border-radius:8px;margin:4px 0;background:#ffffff10}#homePC .hprs.ok{border-left:4px solid #5ad08a}#homePC .hprs.bad{border-left:4px solid #ff7b7b}#homePC .hpcard{background:#1f1a45;border-radius:10px;padding:8px 10px;margin:8px 0;font-size:13px}#homePC .hpnums{display:flex;flex-wrap:wrap;gap:6px}#homePC .hpnums div{background:#0c0a1f;border:1px solid #4a4496;border-radius:8px;padding:4px 8px;font-size:12px}#homePC .hpnums div.seen{border-color:#5ad08a}#homePC .hpnums code{color:#ffd98a;font-size:13px}#homePC .hpnote{width:100%;box-sizing:border-box;min-height:54px;font:inherit;font-size:13px;background:#0c0a1f;color:#fff;border:2px solid #4a4496;border-radius:8px;padding:6px}#homePC .hpsrch{display:flex;gap:8px;margin:8px 0}#homePC .hpsrch input{flex:1;min-width:0;font:inherit;font-size:14px;padding:7px 9px;border-radius:8px;border:2px solid #5a54a8;background:#0c0a1f;color:#fff}#homePC .hptl{margin-top:6px;border-left:2px solid #4a4496;padding-left:10px}#homePC .hptl div{margin:6px 0;font-size:13px}#homePC .hpphoto{display:flex;flex-wrap:wrap;gap:10px;background:#0c0a1f;border:2px dashed #4a4496;border-radius:10px;padding:10px;margin:6px 0;justify-content:center}#homePC .hpphoto span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;max-width:90px;text-align:center}#homePC .hpphoto i{font-style:normal;font-size:34px}#homePC .hpup{color:#ffd98a;font-weight:700;text-align:center}#homePC .hpres h3,#homePC .hpjob h3{margin:0 0 8px;color:#ffd98a}'
    + '#homePC .hpmenu{position:absolute;z-index:100;background:#1c1840;border:2px solid #5a54a8;border-radius:10px;padding:4px;min-width:160px;box-shadow:0 8px 24px #000a}#homePC .hpmenu button{display:block;width:100%;text-align:left;background:none;border:none;color:#fff;font:inherit;font-size:13px;padding:7px 10px;border-radius:7px;cursor:pointer}#homePC .hpmenu button:hover{background:#6c63ff66}'
    + '#homePC .hpbedw{display:none;position:absolute;inset:0;z-index:50}#homePC .hpbedw.on{display:block}#homePC .hpbed{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;background:#070716f2}#homePC .hpbi{font-size:54px}#homePC .hpbed h2{margin:6px 0;color:#ffd98a}#homePC .hpbed p{max-width:420px;color:#cfcaf0;font-size:14px}';
  document.head.append(css);
})();
