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
    { id: 'novel', t: 'app', n: 'นักตรวจนิยาย', e: '📖', loc: 'sj' }, { id: 'code', t: 'app', n: 'นักแก้โค้ด', e: '💻', loc: 'sj' },
    { id: 'fin', t: 'app', n: 'การเงินและรายได้เสริม', e: '💰', loc: 'desk' }, { id: 'msg', t: 'app', n: 'ข้อความลูกค้า', e: '💬', loc: 'desk' },
    { id: 'hist', t: 'app', n: 'ประวัติงานเสริม', e: '🗂️', loc: 'desk' }, { id: 'pet', t: 'app', n: 'มุมสัตว์เลี้ยงและบรรยากาศ', e: '🐾', loc: 'desk' }, { id: 'clock', t: 'app', n: 'นาฬิกา', e: '🕐', loc: 'desk' },
  ];
  const H = { on: false, bed: false, warnDay: -1, side: 0, hist: [], msgs: [], skill: { novel: 0, code: 0 }, job: null, items: DEF_ITEMS(), full: false, uid: 0, last: -1, pets: { cat: false, dog: false }, amb: '', lamp: 0, nextPet: 0, petAt: 0 };
  const fixItems = () => {
    const def = DEF_ITEMS(), ids = new Set(H.items.map(x => x.id)); def.forEach(d => { if (!ids.has(d.id)) H.items.push(d); });
    H.items = H.items.filter((x, i, a) => x && x.id && a.findIndex(y => y.id === x.id) === i);
    const dirs = new Set(H.items.filter(x => x.t === 'dir').map(x => x.id)); H.items.forEach(x => { if (x.loc !== 'desk' && !dirs.has(x.loc)) { x.loc = 'desk'; delete x.p; } });
  };
  CG.Save.register('home', {
    def: () => ({ on: false, bed: false, warnDay: -1, side: 0, hist: [], msgs: [], skill: { novel: 0, code: 0 }, job: null, items: DEF_ITEMS(), full: false, uid: 0, last: -1, pets: { cat: false, dog: false }, amb: '', lamp: 0 }),
    get: () => ({ on: H.on, bed: H.bed, warnDay: H.warnDay, side: H.side, hist: H.hist.slice(-120), msgs: H.msgs.slice(0, 40), skill: H.skill, job: H.job, items: H.items, full: H.full, uid: H.uid, last: H.last, pets: H.pets, amb: H.amb, lamp: H.lamp }),
    set: d => {
      d = d || {}; H.on = !!d.on; H.bed = !!d.bed; H.warnDay = Number.isFinite(d.warnDay) ? d.warnDay : -1; H.side = +d.side || 0; H.hist = Array.isArray(d.hist) ? d.hist : []; H.msgs = Array.isArray(d.msgs) ? d.msgs : [];
      H.skill = { novel: +(d.skill && d.skill.novel) || 0, code: +(d.skill && d.skill.code) || 0 }; H.job = d.job && typeof d.job.pid === 'number' ? d.job : null; H.items = Array.isArray(d.items) && d.items.length ? d.items : DEF_ITEMS(); H.full = !!d.full; H.uid = +d.uid || 0; H.last = Number.isFinite(d.last) ? d.last : -1; H.pets = { cat: !!(d.pets && d.pets.cat), dog: !!(d.pets && d.pets.dog) }; H.amb = d.amb === 'rain' || d.amb === 'night' ? d.amb : ''; H.lamp = [0, 1, 2].includes(d.lamp) ? d.lamp : 0;
      fixItems(); setTimeout(sync, 700);
    },
  });

  /* ---- levels: 1..10, pay x1 .. x3 ---- */
  const TH = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
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
  const N_BASE = 200, N_EXP = 45, N_MIN = 45;

  /* ---- code debugger puzzles: a line starting with ! is buggy; text after § is the fix ---- */
  const CODES = [
    ['หาค่าเฉลี่ยของตัวเลข', `function average(nums) {
  let sum = 0;
!  for (let i = 0; i <= nums.length; i++) {§ ต้องเป็น i < nums.length (ไม่เช่นนั้นอ่านเกินตัวสุดท้าย)
    sum += nums[i];
  }
  return sum / nums.length;
}`],
    ['เช็กว่าเป็นเลขคู่', `function isEven(n) {
!  if (n % 2 = 0) {§ ต้องใช้ === เพื่อเปรียบเทียบ ไม่ใช่ = (กำหนดค่า)
    return true;
  }
  return false;
}`],
    ['หาค่ามากที่สุดในลิสต์', `function maxOf(list) {
  let best = list[0];
  for (const x of list) {
!    if (x < best) {§ ต้องเป็น x > best เพื่อหาค่ามากที่สุด
      best = x;
    }
  }
  return best;
}`],
    ['คิดราคาหลังลด', `function finalPrice(price, percent) {
!  const discount = price * percent;§ ต้องหาร 100 ก่อน: price * percent / 100
  return price - discount;
}`],
    ['นับถอยหลังก่อนเริ่มเกม', `let n = 5;
while (n > 0) {
  console.log(n);
!  n++;§ ต้องเป็น n-- ไม่เช่นนั้นวนไม่รู้จบ
}
console.log("เริ่ม!");`],
    ['บวกเลข 1 ถึง n', `function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
!  total;§ ต้อง return total; ไม่เช่นนั้นได้ค่า undefined
}`],
    ['ทักทายผู้ใช้', `const name = "Kun";
!const msg = "สวัสดี " + nam;§ ชื่อตัวแปรผิด ต้องเป็น name
console.log(msg);`],
    ['ตรวจรหัสผ่าน', `// รหัสผ่านต้องยาวอย่างน้อย 8 ตัวถึงจะผ่าน
function checkPass(pw) {
  if (pw.length < 8) {
!    return true;§ สั้นเกินไปต้อง return false
  }
!  return false;§ ยาวพอแล้วต้อง return true
}`],
    ['เอาของออกจากตะกร้า', `const cart = ["นม", "ไข่", "ขนมปัง"];
cart.push("ชา");
// ต้องการเอา "ไข่" ออก 1 ชิ้น
!cart.splice(1, 0);§ ต้องเป็น splice(1, 1) (ลบ 1 ชิ้น)
console.log(cart.length);`],
    ['นับคนอายุ 18 ปีขึ้นไป', `# นับคนที่อายุ 18 ปีขึ้นไป
ages = [12, 20, 18, 30, 9]
count = 0
for a in ages:
!    if a > 18:§ ต้องเป็น a >= 18 (รวมคนอายุ 18 ด้วย)
        count += 1
print(count)`],
    ['แปลงองศาเซลเซียสเป็นฟาเรนไฮต์', `function toFahrenheit(c) {
!  return c * 9 / 5 - 32;§ ต้องเป็น + 32
}`],
    ['ส่งฟรีสำหรับสมาชิกหรือยอดเกิน 500', `// สมาชิก "หรือ" ซื้อเกิน 500 ได้ส่งฟรี
function freeShip(isMember, total) {
!  if (isMember && total > 500) {§ ต้องใช้ || (หรือ) ไม่ใช่ && (และ)
    return true;
  }
  return false;
}`],
  ].map(([title, raw]) => { const lines = raw.split('\n').map(l => { if (l[0] === '!') { const [t, f] = l.slice(1).split('§'); return { t, bug: true, fix: (f || '').trim() }; } return { t: l, bug: false }; }); return { title, lines, n: lines.filter(x => x.bug).length }; });
  const C_BASE = 260, C_EXP = 50, C_MIN = 50;
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
  function openWin(k, ref) {
    const id = k + ':' + ref; let w = W.find(x => x.id === id);
    if (w) { w.min = false; focus(w); renderWins(); return; }
    const d = dims(), small = d.w < 720, n = W.length; w = { id, k, ref, x: 120 + (n % 5) * 26, y: 14 + (n % 5) * 24, w: Math.min(k === 'dir' ? 420 : 520, d.w - 140), h: Math.min(k === 'dir' ? 300 : 400, d.h - 30), z: ++zTop, min: false, max: small };
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
    if (r === 'fin') { const mk = monthKey(gd()), mo = H.hist.filter(x => x.amt > 0 && monthKey(x.d) === mk).reduce((a, x) => a + x.amt, 0), sal = Math.round(hr.base || 0); return `${row('🏦 เงินในบัญชีหลัก', '฿' + baht(bank.bal))}${row('💼 เงินเดือนประจำ', sal ? '฿' + baht(sal) + ' / เดือน' : 'ไม่มี')}<hr>${row('✨ บัญชีรายได้เสริม', '฿' + baht(H.side))}${row('📅 รายได้เสริมเดือนนี้', '฿' + baht(mo))}<p class="hps">รายได้เสริมแยกจากเงินเดือนหลัก ดูได้ชัดว่าเงินเดือนเท่าไหร่ รายได้เสริมเท่าไหร่</p>`; }
    if (r === 'msg') return H.msgs.length ? H.msgs.map(m => `<div class="hpm1"><b>${esc2(m.from)}</b> <small>${esc2(m.at)}</small><p>${esc2(m.text)}</p></div>`).join('') : empty('📭', 'ยังไม่มีข้อความจากลูกค้า', 'เมื่อส่งงานเสริมสำเร็จ ลูกค้าจะตอบกลับที่นี่');
    if (r === 'hist') return H.hist.length ? H.hist.slice(-30).reverse().map(x => row(esc2(x.job || 'งานเสริม') + ` <small>${esc2(thDate(T0 + x.d * DAY, { day: 'numeric', month: 'short' }))}${x.exp ? ' · +' + x.exp + ' EXP' : ''}</small>`, (x.amt < 0 ? '−฿' + baht(-x.amt) : '+฿' + baht(x.amt)))).join('') : empty('🗂️', 'ยังไม่มีประวัติงานเสริม', 'งานที่ส่งสำเร็จจะมาอยู่ที่นี่');
    if (r === 'clock') { const g = gnow(), L = leftMin(); return `<div class="hpc">${hm(g)}</div><div class="hps" style="text-align:center">${esc2(thDate(g, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>${row('🌙 เวลานอน', '00:00')}${row('⏳ เหลือเวลาส่วนตัว', `${Math.floor(L / 60)} ชม. ${L % 60} นาที <small>(≈ ${Math.ceil(L / 12)} นาทีจริง)</small>`)}` + (confirmSleep ? `<div class="hpq"><p>จะข้ามเวลาที่เหลือของวันนี้ไปเข้านอนเลย<br><small>เวลาส่วนตัวที่เหลือจะไม่ได้ใช้ ไม่มีโทษและไม่มีโบนัสพิเศษ</small></p><button class="go" data-hp="sleepyes">ยืนยัน เข้านอน</button><button data-hp="sleepno">ยกเลิก</button></div>` : `<div class="hpq"><button class="go" data-hp="sleepask">🌙 เข้านอนเลย</button></div>`); }
    return '';
  }
  function novelHtml() {
    const l = level('novel'), x = H.skill.novel, lo = TH[l - 1], hi = TH[l] || TH[9], pc = l >= 10 ? 100 : Math.round((x - lo) / (hi - lo) * 100);
    const head = `<div class="hpl2"><b>เลเวล ${l}${l >= 10 ? ' (สูงสุด)' : ''}</b> <small>EXP ${x}${l >= 10 ? '' : ' / ' + hi}</small> <span class="hpx">ค่าตอบแทน ×${mult(l).toFixed(2)}</span><div class="hpbar2"><i style="width:${pc}%"></i></div></div>`;
    if (res && res.k !== 'code') return head + `<div class="hpres"><h3>${res.acc >= .9 ? '🌟 ตรวจได้ยอดเยี่ยม' : res.acc >= .6 ? '👍 ตรวจได้ดี' : '🙂 ส่งงานแล้ว'}</h3>${row('ตรวจเจอ', `${res.found}/${res.n} จุด`)}${res.fp ? row('ทำเครื่องหมายผิดที่', res.fp + ' จุด', 'warn') : ''}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<p class="hps">เฉลย: ${res.rev.length ? res.rev.map(c => `<s>${esc2(c.w)}</s> → <b>${esc2(c.r)}</b>`).join(' · ') : '-'}</p><div class="hpq"><button class="go" data-hp="nnext">งานต่อไป</button></div></div>`;
    if (H.job && H.job.k === 'code') return head + '<p class="hps">💻 ตอนนี้มีงานแก้โค้ดที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    if (H.job) {
      const p = PASS[H.job.pid]; if (!p) { H.job = null; return novelHtml(); }
      return head + `<h3 class="hpjt">📖 ${esc2(p.title)}</h3><p class="hps">แตะคำที่เขียนผิด (มีผิด ${p.n} จุด) แตะซ้ำเพื่อยกเลิกเครื่องหมาย</p><div class="hptx">${p.chunks.map((c, i) => c.sp ? '<span class="hpsp"></span>' : `<button class="hpck${H.job.marks.includes(i) ? ' hpmk' : ''}" data-hp="mark" data-i="${i}">${esc2(c.t)}</button>`).join('')}</div><div class="hpq"><span class="hps">ทำเครื่องหมายแล้ว ${H.job.marks.length} จุด</span><br><button class="go" data-hp="nsubmit">📨 ส่งงาน</button><button data-hp="ncancel">ยกเลิกงาน (ไม่เสียอะไร)</button></div>`;
    }
    const can = leftMin() >= N_MIN;
    return head + `<div class="hpjob"><h3>📖 งานตรวจคำผิดนิยาย</h3><p>ตรวจต้นฉบับสั้นๆ แล้วหาคำที่สะกดผิดให้ครบ<br><small>ประมาณ ${N_MIN} นาทีเกม (≈ ${Math.round(N_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(N_BASE * mult(l)))}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="naccept">✅ รับงาน</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">ไม่มีโทษถ้าไม่รับงาน งานที่ทำค้างไว้ตอนเข้านอนจะถูกเก็บไว้ให้</p></div>`;
  }
  function novelAccept() {
    if (H.job || leftMin() < N_MIN) return; let i; do { i = Math.floor(Math.random() * PASS.length); } while (PASS.length > 1 && i === H.last); H.last = i; H.job = { pid: i, marks: [] }; res = null; refreshApp('novel');
  }
  function novelSubmit() {
    if (!H.job) return; const p = PASS[H.job.pid], m = H.job.marks, found = m.filter(i => p.chunks[i].err).length, fp = m.length - found, acc = clamp((found - fp * .5) / p.n, 0, 1), l0 = level('novel');
    const pay = Math.round(N_BASE * mult(l0) * acc), exp = Math.round(N_EXP * (.4 + .6 * acc)); H.skill.novel = Math.min(TH[9], H.skill.novel + exp); const l1 = level('novel');
    H.side += pay; H.hist.push({ d: gd(), job: 'ตรวจนิยาย: ' + p.title, amt: pay, exp }); const at = hm(gnow());
    const txt = acc >= .9 ? 'ละเอียดมากเลยค่ะ ขอบคุณที่ช่วยตรวจนะคะ 🥰 โอนค่าตอบแทนให้แล้วนะคะ' : acc >= .6 ? 'ตรวจได้ดีเลยค่ะ มีหลุดไปนิดหน่อยแต่ไม่เป็นไร ไว้ฝากงานอีกนะคะ' : 'ขอบคุณที่ช่วยกันนะคะ ยังมีที่ตกหล่นอยู่บ้าง รอบหน้าลองดูอีกทีนะ 🙂';
    H.msgs.unshift({ from: pick(FROM), at, text: txt, unread: true }); if (l1 > l0) H.msgs.unshift({ from: 'คุณแพร (บรรณาธิการ)', at, text: `เห็นว่าฝีมือพัฒนาขึ้นมากเลย ตอนนี้เลเวล ${l1} แล้ว ค่าตอบแทนขึ้นให้นะคะ ฝากงานต่อไปด้วย 💪`, unread: true });
    res = { found, n: p.n, fp, pay, exp, acc, lv: l1 > l0 ? l1 : 0, rev: p.chunks.filter(c => c.err) }; H.job = null;
    try { if (l1 > l0) { S.big('🎉 นักตรวจนิยาย เลเวล ' + l1, 2.6, '#f0a020'); S.jingle(); } else S.tone(660, 880, .15, .08); S.toast('💬 ลูกค้าตอบกลับแล้ว', 2); } catch (e) {}
    CG.Bus.emit('sidejob.done', { job: 'novel', pay, exp }); renderDesk(); refreshApp('novel'); refreshApp('fin'); refreshApp('msg'); refreshApp('hist');
  }

  /* ================= atmosphere: pet sounds (stress -10% of current), ambient sound, room lamp ================= */
  const PET_COST = 300, PET_CD = 30000;
  const meow = () => { try { S.tone(650, 1000, .16, .09, 'triangle'); setTimeout(() => S.tone(1000, 560, .3, .09, 'triangle'), 170); } catch (e) {} };
  const bark = () => { try { [0, 230].forEach(t => setTimeout(() => { S.noise(.07, 900, .1); S.tone(320, 180, .1, .1, 'square'); }, t)); } catch (e) {} };
  function petSound(kind, manual) {
    if (!H.on || !hp || !H.pets[kind]) return false; const now = Date.now();
    if (manual && now - H.petAt < PET_CD) { try { S.toast(`${kind === 'cat' ? '🐱' : '🐶'} กำลังพักอยู่ รออีก ${Math.ceil((PET_CD - (now - H.petAt)) / 1000)} วิ`, 1.6); } catch (e) {} return false; }
    H.petAt = now; kind === 'cat' ? meow() : bark();
    const before = Math.round(life.stress); life.stress = Math.max(0, life.stress * .9); try { stressHud(); } catch (e) {}
    try { S.toast(`${kind === 'cat' ? '🐱 เหมียว~' : '🐶 โฮ่ง โฮ่ง!'} ความเครียดลด 10% (${before} → ${Math.round(life.stress)})`, 2.2); } catch (e) {}
    CG.Bus.emit('pet.sound', { kind }); return true;
  }
  function petHtml() {
    const own = k => H.pets[k], cd = Math.max(0, Math.ceil((PET_CD - (Date.now() - H.petAt)) / 1000));
    const pet = (k, e, n) => own(k) ? `<div class="hppet">${e} <b>${n}</b> <small>ร้องเองเป็นครั้งคราว</small><button class="go" data-hp="petcall" data-k="${k}">เรียกให้ร้อง</button></div>` : `<div class="hppet">${e} <b>${n}</b> <small>฿${baht(PET_COST)}</small><button class="go" data-hp="petbuy" data-k="${k}">ซื้อ</button></div>`;
    const opt = (a, v, cur, t) => `<button class="${cur === v ? 'go' : ''}" data-hp="${a}" data-v="${v}">${t}</button>`;
    return `<h3 class="hpjt">🐾 สัตว์เลี้ยง</h3><p class="hps">ไม่มีตัวจริงให้ดูแล มีแค่เสียงน่ารักๆ ทุกครั้งที่ร้อง ความเครียดจะลด 10% ของค่าปัจจุบัน · ซื้อด้วยบัญชีรายได้เสริม (มี ฿${baht(H.side)})</p>${pet('cat', '🐱', 'เสียงแมว')}${pet('dog', '🐶', 'เสียงหมา')}<hr><h3 class="hpjt">🎧 เสียงบรรยากาศ</h3><div class="hpq" style="margin-top:6px">${opt('amb', '', H.amb, '🔇 ปิด')}${opt('amb', 'rain', H.amb, '🌧️ ฝนตก')}${opt('amb', 'night', H.amb, '🌙 จิ้งหรีดยามค่ำ')}</div><hr><h3 class="hpjt">💡 แสงในห้อง</h3><div class="hpq" style="margin-top:6px">${opt('lamp', '0', String(H.lamp), '☀️ สว่าง')}${opt('lamp', '1', String(H.lamp), '🕯️ อบอุ่น')}${opt('lamp', '2', String(H.lamp), '🌑 มืดสลัว')}</div>`;
  }
  function applyLamp() { if (hp) { hp.classList.toggle('lamp1', H.lamp === 1); hp.classList.toggle('lamp2', H.lamp === 2); } }
  let ambN = 0;
  setInterval(() => {
    if (!H.on || !hp || H.bed) return; ambN++;
    try { if (H.amb === 'rain') S.noise(.5, 2600, .018); else if (H.amb === 'night' && ambN % 3 === 0) { S.tone(4300, 4400, .04, .012); setTimeout(() => S.tone(4300, 4400, .04, .012), 90); } } catch (e) {}
    const now = Date.now(); if (!H.nextPet) H.nextPet = now + 45000 + Math.random() * 60000;
    if (now >= H.nextPet) { H.nextPet = now + 60000 + Math.random() * 90000; const ks = ['cat', 'dog'].filter(k => H.pets[k]); if (ks.length) petSound(pick(ks), false); }
  }, 1000);

  /* ================= side job 2: code debugger ================= */
  function codeHtml() {
    const l = level('code'), x = H.skill.code, lo = TH[l - 1], hi = TH[l] || TH[9], pc = l >= 10 ? 100 : Math.round((x - lo) / (hi - lo) * 100);
    const head = `<div class="hpl2"><b>เลเวล ${l}${l >= 10 ? ' (สูงสุด)' : ''}</b> <small>EXP ${x}${l >= 10 ? '' : ' / ' + hi}</small> <span class="hpx">ค่าตอบแทน ×${mult(l).toFixed(2)}</span><div class="hpbar2"><i style="width:${pc}%"></i></div></div>`;
    if (res && res.k === 'code') return head + `<div class="hpres"><h3>${res.acc >= .9 ? '🌟 แก้บั๊กได้เกลี้ยง' : res.acc >= .6 ? '👍 แก้ได้ดี' : '🙂 ส่งงานแล้ว'}</h3>${row('เจอบั๊ก', `${res.found}/${res.n} จุด`)}${res.fp ? row('ชี้ผิดบรรทัด', res.fp + ' บรรทัด', 'warn') : ''}${row('ได้เงิน', '+฿' + baht(res.pay))}${row('ได้ EXP', '+' + res.exp)}${res.lv ? `<p class="hpup">🎉 เลื่อนเป็นเลเวล ${res.lv} แล้ว!</p>` : ''}<div class="hps">เฉลย:${res.rev.map(c => `<div class="hpfx"><code>${esc2(c.t.trim())}</code><br>→ ${esc2(c.fix)}</div>`).join('')}</div><div class="hpq"><button class="go" data-hp="cnext">งานต่อไป</button></div></div>`;
    if (H.job && H.job.k === 'code') {
      const p = CODES[H.job.pid]; if (!p) { H.job = null; return codeHtml(); }
      return head + `<h3 class="hpjt">💻 ${esc2(p.title)}</h3><p class="hps">โค้ดนี้มีบั๊ก ${p.n} จุด แตะบรรทัดที่ผิด แตะซ้ำเพื่อยกเลิก</p><div class="hpcode">${p.lines.map((c, i) => `<button class="hpcl${H.job.marks.includes(i) ? ' hpmk' : ''}" data-hp="cmark" data-i="${i}"><i>${i + 1}</i>${esc2(c.t)}</button>`).join('')}</div><div class="hpq"><span class="hps">เลือกแล้ว ${H.job.marks.length} บรรทัด</span><br><button class="go" data-hp="csubmit">📨 ส่งงาน</button><button data-hp="ccancel">ยกเลิกงาน (ไม่เสียอะไร)</button></div>`;
    }
    if (H.job) return head + '<p class="hps">📖 ตอนนี้มีงานตรวจนิยายที่ยังทำค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อนนะ</p>';
    const can = leftMin() >= C_MIN;
    return head + `<div class="hpjob"><h3>💻 งานแก้บั๊กโค้ด</h3><p>อ่านโค้ดสั้นๆ แล้วหาบรรทัดที่มีบั๊กให้ครบ<br><small>ประมาณ ${C_MIN} นาทีเกม (≈ ${Math.round(C_MIN / 12)} นาทีจริง) · ค่าตอบแทนสูงสุด ฿${baht(Math.round(C_BASE * mult(l)))}</small></p>${can ? '<div class="hpq"><button class="go" data-hp="caccept">✅ รับงาน</button><button data-hp="x">พักก่อน</button></div>' : '<p class="hps">⏳ เวลาส่วนตัววันนี้เหลือไม่พอสำหรับงานนี้ ไว้พรุ่งนี้นะ</p>'}<p class="hps">ไม่มีโทษถ้าไม่รับงาน งานที่ทำค้างไว้ตอนเข้านอนจะถูกเก็บไว้ให้</p></div>`;
  }
  function codeAccept() {
    if (H.job || leftMin() < C_MIN) return; let i; do { i = Math.floor(Math.random() * CODES.length); } while (CODES.length > 1 && i === H.lastC); H.lastC = i; H.job = { k: 'code', pid: i, marks: [] }; res = null; refreshApp('code');
  }
  function codeSubmit() {
    if (!H.job || H.job.k !== 'code') return; const p = CODES[H.job.pid], m = H.job.marks, found = m.filter(i => p.lines[i].bug).length, fp = m.length - found, acc = clamp((found - fp * .5) / p.n, 0, 1), l0 = level('code');
    const pay = Math.round(C_BASE * mult(l0) * acc), exp = Math.round(C_EXP * (.4 + .6 * acc)); H.skill.code = Math.min(TH[9], H.skill.code + exp); const l1 = level('code');
    H.side += pay; H.hist.push({ d: gd(), job: 'แก้โค้ด: ' + p.title, amt: pay, exp }); const at = hm(gnow());
    const txt = acc >= .9 ? 'เยี่ยมมากครับ เจอบั๊กครบเลย แอปรันได้แล้ว 🎉 โอนค่าจ้างให้แล้วนะครับ' : acc >= .6 ? 'ใช้ได้ครับ ยังเหลือบั๊กหลุดไปนิดหน่อย เดี๋ยวผมดูต่อเอง ขอบคุณครับ' : 'ขอบคุณที่ช่วยดูครับ ยังมีบั๊กอยู่อีก รอบหน้าลองใหม่นะครับ 🙂';
    H.msgs.unshift({ from: pick(FROM_C), at, text: txt, unread: true }); if (l1 > l0) H.msgs.unshift({ from: 'คุณนุ่น (หัวหน้าทีมเว็บ)', at, text: `ฝีมือแก้บั๊กพัฒนาขึ้นเยอะเลย ตอนนี้เลเวล ${l1} แล้ว ค่าจ้างขึ้นให้นะครับ ฝากงานต่อด้วย 💪`, unread: true });
    res = { k: 'code', found, n: p.n, fp, pay, exp, acc, lv: l1 > l0 ? l1 : 0, rev: p.lines.filter(c => c.bug) }; H.job = null;
    try { if (l1 > l0) { S.big('🎉 นักแก้โค้ด เลเวล ' + l1, 2.6, '#f0a020'); S.jingle(); } else S.tone(660, 880, .15, .08); S.toast('💬 ลูกค้าตอบกลับแล้ว', 2); } catch (e) {}
    CG.Bus.emit('sidejob.done', { job: 'code', pay, exp }); renderDesk(); refreshApp('code'); refreshApp('fin'); refreshApp('msg'); refreshApp('hist');
  }

  /* ================= build / render ================= */
  function build() {
    if (hp) return; hp = h('div', { id: 'homePC' }, `<div class="hpl"></div><div class="hpm"><div class="hpd" data-drop="desk"></div><div class="hpwl"></div><div class="hpbarT"><span class="hptask"></span><button class="hpfs" data-hp="full" title="เต็มจอ">⛶</button><b id="hpClk">${hm(gnow())}</b></div><div class="hpbedw"></div></div><div class="hpdesk"></div>`);
    document.body.append(hp); mon = hp.querySelector('.hpm'); dsk = hp.querySelector('.hpd'); wl = hp.querySelector('.hpwl'); W = []; sel = null; res = null;
    try { closePhone(); } catch (e) {} hp.classList.toggle('full', isFull()); applyLamp(); renderDesk(); renderWins(); renderBed();
    hp.addEventListener('click', onClick); hp.addEventListener('dblclick', onDbl); hp.addEventListener('contextmenu', onCtx); hp.addEventListener('pointerdown', onDown);
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
    const a = item(id); if (!a) return false; if (loc !== 'desk') { const d = item(loc); if (!d || d.t !== 'dir' || loc === id || inside(loc, id)) { try { S.toast('ย้ายโฟลเดอร์เข้าไปในตัวมันเองไม่ได้', 1.6); } catch (e) {} return false; } }
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
    if (tgt) { sel = tgt.id; const m = [['📂 เปิด', () => openItem(tgt.id)], ['✏️ เปลี่ยนชื่อ', () => { if (tgt.sys || tgt.t === 'app') { try { S.toast('ไอคอนของระบบเปลี่ยนชื่อไม่ได้', 1.6); } catch (x) {} } else startRename(tgt.id); }]]; if (tgt.t === 'dir' && !tgt.sys) m.push(['🗑️ ลบโฟลเดอร์ (ของข้างในย้ายออกมา)', () => delDir(tgt.id)]); showMenu(e.clientX, e.clientY, m); return; }
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
    else if (a === 'full') setFull(!isFull()); else if (a === 'up') { const t = b.dataset.to; if (o && t) { closeWin(o.id); openWin('dir', t); } } else if (a === 'newdir') newDir(b.dataset.in);
    else if (a === 'sleepask') { confirmSleep = true; refreshApp('clock'); } else if (a === 'sleepno') { confirmSleep = false; refreshApp('clock'); } else if (a === 'sleepyes') skipToBed(); else if (a === 'bedgo') { if (CG.goHome) CG.goHome.begin({ msg: 'เตรียมเข้านอน…' }); }
    else if (a === 'naccept') novelAccept(); else if (a === 'ncancel') { H.job = null; refreshApp('novel'); refreshApp('code'); } else if (a === 'nnext') { res = null; refreshApp('novel'); refreshApp('code'); }
    else if (a === 'mark') { if (H.job) { const i = +b.dataset.i, k = H.job.marks.indexOf(i); if (k >= 0) H.job.marks.splice(k, 1); else H.job.marks.push(i); b.classList.toggle('hpmk'); const cnt = hp.querySelector('.hpq .hps'); if (cnt) cnt.textContent = `ทำเครื่องหมายแล้ว ${H.job.marks.length} จุด`; } }
    else if (a === 'nsubmit') novelSubmit();
    else if (a === 'petbuy') { const k = b.dataset.k; if (H.pets[k]) return; if (H.side < PET_COST) { try { S.toast('บัญชีรายได้เสริมมีไม่พอ ไปทำงานเสริมก่อนนะ', 2); } catch (e) {} } else { H.side -= PET_COST; H.pets[k] = true; H.hist.push({ d: gd(), job: 'ซื้อ' + (k === 'cat' ? 'แมว' : 'หมา') + ' (เสียง)', amt: -PET_COST, exp: 0 }); try { S.tone(660, 990, .15, .09); } catch (e) {} refreshApp('pet'); refreshApp('fin'); refreshApp('hist'); petSound(k, false); } }
    else if (a === 'petcall') { petSound(b.dataset.k, true); refreshApp('pet'); }
    else if (a === 'amb') { H.amb = b.dataset.v; refreshApp('pet'); } else if (a === 'lamp') { H.lamp = +b.dataset.v; applyLamp(); refreshApp('pet'); }
    else if (a === 'caccept') codeAccept(); else if (a === 'ccancel') { H.job = null; refreshApp('code'); refreshApp('novel'); } else if (a === 'cnext') { res = null; refreshApp('code'); refreshApp('novel'); } else if (a === 'csubmit') codeSubmit();
    else if (a === 'cmark') { if (H.job && H.job.k === 'code') { const i = +b.dataset.i, k = H.job.marks.indexOf(i); if (k >= 0) H.job.marks.splice(k, 1); else H.job.marks.push(i); b.classList.toggle('hpmk'); const cnt = hp.querySelector('.hpq .hps'); if (cnt) cnt.textContent = `เลือกแล้ว ${H.job.marks.length} บรรทัด`; } }
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
    enter, exit, on: () => H.on, bed: () => H.bed, open: openItem, newDir, setFull, state: () => ({ on: H.on, bed: H.bed, side: H.side, hist: H.hist.slice(), job: H.job, skill: { ...H.skill }, items: H.items.map(x => ({ ...x })), wins: W.map(w => ({ id: w.id, min: w.min, max: w.max })), full: isFull() }),
    petSound, pets: () => ({ ...H.pets }), buyPet: k => { H.pets[k] = true; }, petCost: PET_COST, addSide: (job, amt, exp) => { H.side += amt; H.hist.push({ d: gd(), job, amt, exp: exp || 0 }); refreshApp('fin'); refreshApp('hist'); },
    addExp: (k, n) => { H.skill[k] = Math.min(TH[9], (H.skill[k] || 0) + n); refreshApp(k); }, level, mult, codeBugs: i => CODES[i].lines.map((l, k) => l.bug ? k : -1).filter(k => k >= 0), passages: () => PASS.length, pass: i => PASS[i],
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
    + '#homePC .hpi{position:absolute;width:92px;border:none;background:none;color:#e8e6ff;cursor:pointer;font:inherit;padding:6px 2px;border-radius:10px;text-align:center}#homePC .hpgrid .hpi,#homePC .hpghost{position:relative}#homePC .hpi:hover{background:#ffffff14}#homePC .hpi.sel{background:#6c63ff55;outline:1px solid #9d97ff}#homePC .hpi i{display:block;font-style:normal;font-size:34px;pointer-events:none}#homePC .hpi span{font-size:12px;line-height:1.25;display:block;pointer-events:none;word-break:break-word}#homePC .hpi.hpdrag{opacity:.35}'
    + '.hpghost{position:fixed!important;width:92px;pointer-events:none;z-index:200;color:#fff;text-align:center;opacity:.85;font-family:var(--font)}.hpghost i{display:block;font-style:normal;font-size:34px}.hpghost span{font-size:12px}'
    + '#homePC .hpbd{position:absolute;right:10px;top:2px;background:#ff5d73;color:#fff;border-radius:10px;padding:0 6px;font-size:11px}#homePC .hprn{width:86px;font:inherit;font-size:12px;border-radius:5px;border:1px solid #9d97ff;background:#fff;color:#222;text-align:center}'
    + '#homePC .hpbarT{position:absolute;left:0;right:0;bottom:0;height:38px;background:#0b0a22e6;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:13px;z-index:30}#homePC .hptask{flex:1;display:flex;gap:6px;overflow:hidden}#homePC .hptask button,#homePC .hpfs{border:1px solid #4a4496;background:#1c1840;color:#e8e6ff;border-radius:8px;padding:3px 10px;font:inherit;cursor:pointer;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}#homePC .hptask button.on{background:#4a40b8}#homePC .hpbarT b{font-variant-numeric:tabular-nums}'
    + '#homePC .hpw{position:absolute;background:#15122b;border:2px solid #4a4496;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 30px #0008}#homePC .hpt{display:flex;align-items:center;gap:5px;padding:6px 10px;background:#26205a;cursor:move;touch-action:none}#homePC .hpt b{flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#homePC .hpt button,#homePC button.go,#homePC .hpq button,#homePC .hpnav button{border:2px solid #5a54a8;background:#221e45;color:#fff;border-radius:9px;padding:3px 10px;font:inherit;cursor:pointer}#homePC .hpt button{padding:0 9px}#homePC .hpb{padding:12px;overflow:auto;flex:1}#homePC .hprz{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 55%,#9d97ff 55%);touch-action:none}'
    + '#homePC .hpnav{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}#homePC .hpnav span{flex:1;color:#aaa6d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#homePC .hpnav button:disabled{opacity:.3}#homePC .hpgrid{display:flex;flex-wrap:wrap;gap:8px;min-height:120px;align-content:flex-start}'
    + '#homePC .hpr{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-bottom:1px solid #ffffff14;font-size:14px}#homePC .hpr small,#homePC .hps small,#homePC .hpe small{opacity:.65;font-weight:400}#homePC .hpr.warn b{color:#ff9b8a}#homePC .hps{color:#aaa6d8;font-size:13px;margin:10px 0 0}#homePC hr{border:none;border-top:1px dashed #ffffff30;margin:10px 0}'
    + '#homePC .hpe{text-align:center;padding:26px 10px;font-size:34px;color:#cfcaf0}#homePC .hpe p{font-size:14px;margin:8px 0 0}#homePC .hpc{font-size:50px;text-align:center;font-weight:700;letter-spacing:2px;color:#ffe9b0}#homePC .hpq{margin-top:12px;text-align:center}#homePC .hpq p{margin:0 0 10px;font-size:14px}#homePC button.go,#homePC .hpq .go{background:#6c63ff;border-color:#9d97ff;font-weight:700;padding:7px 16px}#homePC .hpq button{margin:4px}'
    + '#homePC .hpm1{background:#1f1a45;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px}#homePC .hpm1 p{margin:4px 0 0;color:#dcd8ff}#homePC .hpl2{margin-bottom:8px;font-size:14px}#homePC .hpx{float:right;color:#ffd98a;font-size:13px}#homePC .hpbar2{height:8px;border-radius:6px;background:#ffffff1f;margin-top:5px;overflow:hidden}#homePC .hpbar2 i{display:block;height:100%;background:linear-gradient(90deg,#7d6dff,#ffd98a)}'
    + '#homePC .hpjt{margin:6px 0 0;font-size:15px;color:#ffd98a}#homePC .hptx{margin-top:10px;line-height:2.1;font-size:16px}#homePC .hpck{border:none;background:none;color:#f1efff;font:inherit;cursor:pointer;padding:1px 1px;border-radius:5px}#homePC .hpsp{display:inline-block;width:.6em}#homePC .hpck:hover{background:#ffffff18}#homePC .hpck.hpmk{color:#a9a5d8;background:#ffffff1c;box-shadow:inset 0 -2px 0 #9d97ff}#homePC .hpcode{margin-top:10px;background:#0c0a1f;border-radius:10px;padding:6px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;overflow-x:auto}#homePC .hpcl{display:block;width:100%;text-align:left;white-space:pre;border:none;background:none;color:#e8e6ff;font:inherit;padding:2px 10px 2px 0;cursor:pointer}#homePC .hpcl i{display:inline-block;width:2.4em;text-align:right;margin-right:1em;color:#6f6aa8;font-style:normal}#homePC .hpcl:hover{background:#ffffff14}#homePC .hpcl.hpmk{color:#a9a5d8;background:#ffffff1c;box-shadow:inset 3px 0 0 #9d97ff}#homePC .hpfx{margin-top:8px;font-size:13px;color:#dcd8ff}#homePC .hpfx code{background:#0c0a1f;padding:1px 5px;border-radius:5px;color:#ffd98a}#homePC .hppet{display:flex;align-items:center;gap:8px;padding:8px 2px;border-bottom:1px solid #ffffff14;font-size:15px}#homePC .hppet small{opacity:.65;flex:1}#homePC.lamp1 .hpm{filter:sepia(.45) brightness(.85) saturate(1.2)}#homePC.lamp2 .hpm{filter:sepia(.3) brightness(.55)}#homePC .hpup{color:#ffd98a;font-weight:700;text-align:center}#homePC .hpres h3,#homePC .hpjob h3{margin:0 0 8px;color:#ffd98a}'
    + '#homePC .hpmenu{position:absolute;z-index:100;background:#1c1840;border:2px solid #5a54a8;border-radius:10px;padding:4px;min-width:160px;box-shadow:0 8px 24px #000a}#homePC .hpmenu button{display:block;width:100%;text-align:left;background:none;border:none;color:#fff;font:inherit;font-size:13px;padding:7px 10px;border-radius:7px;cursor:pointer}#homePC .hpmenu button:hover{background:#6c63ff66}'
    + '#homePC .hpbedw{display:none;position:absolute;inset:0;z-index:50}#homePC .hpbedw.on{display:block}#homePC .hpbed{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;background:#070716f2}#homePC .hpbi{font-size:54px}#homePC .hpbed h2{margin:6px 0;color:#ffd98a}#homePC .hpbed p{max-width:420px;color:#cfcaf0;font-size:14px}';
  document.head.append(css);
})();
