"use strict";
// Office game — clock and personal chats. Files load in order and share one global scope (see office/index.html).
/* ================= clock / time settings ================= */
let timeOff = 0, lastMin = '', nightMsgSent = false;
const p2 = n => String(n).padStart(2, '0');
const T0 = new Date(2026, 0, 1, 8, 0, 0).getTime(); // game starts 1 ม.ค. 2569 08:00
let R0 = Date.now(), loadOff = 0; // loadOff = game time already played (from a save)
const SPEED = 24; // 1 game day = 1 real hour
const gnow = () => new Date(T0 + loadOff + (Date.now() - R0) * SPEED + dayOff * 86400000 + timeOff);
const gHour = () => gnow().getHours();
$('clock').addEventListener('click', openTime);
$('clock').title = 'กดเพื่อตั้งเวลา';
function openTime() { const W = openWin('time', 'ตั้งเวลาเครื่อง', h('div', { class: 'tm' }), 420, 370, '#eef6ff'); renderTime(W); }
function renderTime(W = wins.get('time')) {
  if (!W) return; const d = gnow(), box = W.body.firstChild;
  box.innerHTML = `<div class="big"><div class="col"><button class="btn2" data-t="60" aria-label="เพิ่มชั่วโมง">▲</button><span class="hh">${p2(d.getHours())}</span><button class="btn2" data-t="-60" aria-label="ลดชั่วโมง">▼</button></div><span>:</span><div class="col"><button class="btn2" data-t="5" aria-label="เพิ่มนาที">▲</button><span class="mm">${p2(d.getMinutes())}</span><button class="btn2" data-t="-5" aria-label="ลดนาที">▼</button></div></div>
    <div class="pre">${[['🌅 เช้า', 8, 30], ['🍚 เที่ยง', 12, 0], ['🏃 เลิกงาน', 17, 30], ['🌙 ดึก', 22, 0]].map(([n, hh, mm]) => `<button class="btn2" data-h="${hh}" data-m="${mm}">${n} ${p2(hh)}:${p2(mm)}</button>`).join('')}</div>
    <div class="pre"><button class="btn2 pri" data-real>เวลาตามปกติ</button><button class="btn2" data-cal>📅 ข้ามวันในปฏิทิน</button></div><small style="color:var(--soft)">${thDate(d)} · ${timeOff ? 'ใช้เวลาที่ตั้งเอง' : 'เวลาเดินตามปกติ'} · ย้อนวันไม่ได้<br>เวลาในเกม 1 วัน = 1 ชั่วโมงจริง</small>`;
  box.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const g = gnow(), cur = g.getHours() * 60 + g.getMinutes();
    let want = null;
    if (b.dataset.t) { want = cur + +b.dataset.t; if (want < 0 || want > 1439) { S.toast(want < 0 ? 'ย้อนไปเมื่อวานไม่ได้นะ ⏳' : 'อยากข้ามวัน ใช้ปฏิทินน้อยได้เลย 📅', 1.8); want = clamp(want, 0, 1439); } }
    else if (b.dataset.h) want = +b.dataset.h * 60 + +b.dataset.m;
    else if ('real' in b.dataset) timeOff = 0;
    else if ('cal' in b.dataset) { openCal(); return; }
    if (want !== null) { const t = new Date(g); t.setHours(0, 0, 0, 0); timeOff += t.getTime() + want * 60000 + (g.getSeconds() * 1000) - g.getTime(); }
    enforceDate(); S.tone(700, 900, .04, .05); lastMin = ''; renderFood(); renderTime(W); renderCal(); if (Math.abs(timeOff) > 30000) complete('time');
  };
}
function applyTime() {
  const hh = gHour(); screen.classList.toggle('eve', hh >= 17 && hh < 19); screen.classList.toggle('night', hh >= 19 || hh < 6);
  if ((hh >= 21 || hh < 5) && !nightMsgSent) { nightMsgSent = true; pushMsg('mom', 'mom', 'ดึกแล้วนะลูก ยังไม่กลับบ้านอีกเหรอ 🌙 อย่าทำงานดึกนัก', 2500); }
}

/* ================= personal chats ================= */
const chatById = id => chat.list.find(c => c.id === id);
function pushMsg(id, who, text, at = 1500, extra) { const c = chatById(id); if (c) say(c, who, text, at, extra); }
let sisBear = false, broTold = false;
const hr = { base: 25000, cap: 10, done: false };
const GOSSIP = ['วันนี้หัวหน้าแมวสั่งงานตอนห้าโมงเย็นอีกแล้ว 😩', 'ประชุมสองชั่วโมง สรุปว่านัดประชุมใหม่ 🫠', 'หัวหน้าบอกงานง่ายๆ แต่ให้แก้ 7 รอบ 555', 'แต่หัวหน้าเลี้ยงขนมทุกวันศุกร์ ก็ใจดีอยู่นะ 🍰', 'เมื่อกี้หัวหน้าเดินผ่าน เกือบเห็นจอ 😱'];
const PERSONAL = {
  mom(c, m) {
    complete('family'); like(c, m, 'mom', 700); const t = m.text || '';
    if (/วันเกิด|สุขสันต์|hbd|happy birthday/i.test(t)) return say(c, 'mom', EVENTS.some(ev => ev.mom && ev.d === dayStart(gnow())) ? 'ขอบใจจ้าลูก จำวันเกิดแม่ได้ด้วย แม่ดีใจที่สุดเลย 🥹🎂❤️' : 'อ้าว วันเกิดแม่ยังไม่ถึงนะลูก 555 ดูในปฏิทินสิ', 1800);
    if (m.img) return say(c, 'mom', 'น่ารักจังลูก แม่ขอเซฟไปตั้งหน้าจอนะ 🥰', 1800);
    if (m.file) return say(c, 'mom', 'แม่เปิดไฟล์ไม่เป็นลูก 😅 ส่งเป็นรูปมาได้ไหม', 1800);
    if (/กิน|ข้าว/.test(t)) say(c, 'mom', 'ดีแล้วลูก กินเยอะๆ นะ อย่าลืมกินผักด้วย 🥦', 1800);
    else if (/กลับ|บ้าน|วันหยุด/.test(t)) say(c, 'mom', 'เย้ แม่จะทำแกงเขียวหวานรอนะลูก 🍛', 1800);
    else if (/รัก|คิดถึง/.test(t)) say(c, 'mom', 'แม่ก็รักลูกที่สุด ❤️', 1600);
    else if (/เหนื่อย|งานเยอะ|ท้อ/.test(t)) say(c, 'mom', 'สู้ๆ นะลูก เหนื่อยก็พักบ้าง แม่เป็นกำลังใจให้ 💪', 1800);
    else if (/ย้ายงาน|หางาน|ลาออก|สมัคร/.test(t)) say(c, 'mom', 'คิดให้ดีๆ นะลูก แม่สนับสนุนทุกทาง 😊', 1800);
    else if (/เงินเดือน/.test(t)) say(c, 'mom', 'ได้ขึ้นเงินเดือนเหรอลูก เก่งมาก แม่ภูมิใจ 🥹', 1800);
    else say(c, 'mom', pick(['จ้าลูก 😊', 'อย่าทำงานหนักเกินไปนะลูก', 'อากาศเย็นแล้ว ใส่เสื้อหนาวด้วยนะ', 'แม่ส่งกำลังใจให้ 💕']), 1700);
  },
  dad(c, m) {
    complete('family'); like(c, m, 'dad', 1000); const t = m.text || '';
    if (/เงิน|โอน|ค่า/.test(t)) return say(c, 'dad', 'โอนให้แล้วนะลูก 💸 ใช้ประหยัดๆ', 2200);
    if (m.img) { say(c, 'dad', 'สวยครับ 👍', 2000); say(c, 'dad', '', 3600, { img: FLOWER }); return; }
    say(c, 'dad', pick(['ครับ 👍', 'ดีมากลูก', 'พ่อภูมิใจในตัวลูกนะ', 'ขับรถกลับบ้านระวังๆ นะลูก']), 2200);
  },
  sis(c, m) {
    complete('family'); const t = m.text || '';
    if (m.img) return say(c, 'sis', ANIMAL.test(m.tag || '') ? 'น่ารักกก อยากเลี้ยงบ้าง 🥺' : 'สวยอะ ส่งมาอีกๆ', 1500);
    if (sisBear) return say(c, 'sis', pick(['ขอบคุณพี่อีกรอบ 🧸💕', 'กอดตุ๊กตาหมีทุกคืนเลย 🥰']), 1500);
    if (/ไม่ได้|ไม่ซื้อ|ไม่เอา/.test(t)) return say(c, 'sis', 'งื้ออออ 🥺 นะๆๆๆ', 1400);
    if (/ซื้อ|ได้|โอเค|ok|จัดให้|จ้า/i.test(t)) return say(c, 'sis', 'เย้ รักพี่ที่สุดในโลก 🥰 สั่งในเสิร์ชน้อยแท็บช็อปปิ้งเลยน้า', 1500);
    say(c, 'sis', pick(['พี่ขาาา ตุ๊กตาหมีน้า 🧸', 'ปีใหม่กลับบ้านไหมพี่', '555 พี่ตลกอะ']), 1500);
  },
  bro(c, m) {
    complete('family'); const t = m.text || '', n = t.replace(/,/g, '').match(/\d+/);
    if (n) return say(c, 'bro', +n[0] > 30 ? 'โม้ป่าว 😏 ไปเล่นให้ดูในเกมน้อยดิ' : `${n[0]} เองเหรอ พี่ได้ 30 นะ 😎`, 1600);
    if (/เกม|เล่น|ทุบ|แข่ง/.test(t)) return say(c, 'bro', 'เข้า "เกมน้อย" ในคอมดิ ทุบตุ่นมาแข่งกัน 🔨', 1600);
    say(c, 'bro', pick(['ว่าไงน้อง', 'คืนนี้ว่างป่าว', 'ได้ข่าวว่าจะย้ายงานเหรอ 👀', 'อย่าลืมโอนค่าเน็ตบ้านนะ 555']), 1600);
  },
  gang(c, m) {
    complete('gossip'); const t = m.text || '';
    if (m.img) { like(c, m, 'mint', 700); return say(c, 'fon', '555 อะไรเนี่ย น่ารักดี', 1500); }
    if (m.file) return say(c, 'mint', 'ส่งงานมาทำไมแก ห้องนี้ห้องเม้าท์ 555', 1500);
    if (/หัวหน้า|แมว/.test(t)) { like(c, m, 'fon', 600); say(c, 'fon', 'จริงงง 555 เห็นด้วยสุดๆ', 1500); say(c, 'mint', 'ชู่ว เบาๆ เดี๋ยวหัวหน้าเห็น 🤭', 2900); return; }
    if (/ย้ายงาน|หางาน|ลาออก|สมัคร/.test(t)) { say(c, 'fon', 'แกจะไปจริงดิ 😱 อย่าทิ้งกันน้า', 1500); say(c, 'mint', 'ไปแล้วชวนด้วย 555', 2900); return; }
    if (/เงินเดือน|ขึ้น/.test(t)) return say(c, 'mint', 'ได้ขึ้นเงินเดือนเลี้ยงหมูกระทะด้วยนะ 🥓', 1500);
    say(c, pick(['fon', 'mint']), pick(GOSSIP), 1600);
  },
  hr(c, m) {
    const t = m.text || '';
    if (m.file) { const f = FILES.find(x => x.id === m.file.id); return say(c, 'hr', f && f.kind === 'resume' ? 'เอ๊ะ ส่งเรซูเม่มาทำไมคะ 😳 จะสมัครงานที่อื่นเหรอ…' : 'ได้รับเอกสารแล้วค่ะ', 1800); }
    if (/เงินเดือน/.test(t) && /เท่าไร|เท่าไหร่|ปัจจุบัน|ตอนนี้|สลิป|ได้กี่/.test(t)) return say(c, 'hr', `ตอนนี้เงินเดือน ${baht(hr.base)} บาท/เดือน ออกทุกวันที่ 25 ค่ะ${hr.pending ? ` และจะปรับเป็น ${baht(hr.pending)} บาท ตั้งแต่ ${thDate(hr.eff, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''} 😊`, 1700);
    if (/ยืม|เบิก/.test(t)) return say(c, 'hr', 'บริษัทไม่มีให้เบิกเงินเดือนล่วงหน้านะคะ 😅 ลองดูสินเชื่อในแอป "ธนาคารน้อย" ค่ะ', 1700);
    if (/โบนัส/.test(t)) return say(c, 'hr', 'โบนัสพิจารณาปลายปีตามผลงานค่ะ ตั้งใจทำงานไว้นะคะ ✨', 1600);
    if (hr.done) return say(c, 'hr', `เรื่องปรับเงินเดือนเรียบร้อยแล้วนะคะ (${baht(hr.pending || hr.base)} บาท) มีอะไรถามได้ค่ะ 😊`, 1600);
    if (/ลาออก|ย้ายงาน|ที่ใหม่|ที่อื่น/.test(t)) { hr.cap = 15; return say(c, 'hr', 'อ้าว 😢 บริษัทไม่อยากเสียคนเก่งไปเลยค่ะ ถ้าอยู่ต่อ ปรับให้ได้สูงสุด 15% นะคะ', 2000); }
    if (/ลา|วันหยุด/.test(t)) return say(c, 'hr', 'วันลาพักร้อนเหลือ 6 วันค่ะ ลาผ่านระบบได้เลยนะคะ', 1600);
    const pm = t.match(/(\d+(?:\.\d+)?)\s*(%|เปอร์)/), am = t.replace(/,/g, '').match(/\d{3,}/);
    let pct = null;
    if (pm) pct = +pm[1]; else if (am) { const v = +am[0]; pct = v > hr.base ? (v - hr.base) / hr.base * 100 : v / hr.base * 100; }
    if (pct === null) {
      if (/เงินเดือน|ขึ้น|ปรับ|ขอ/.test(t)) return say(c, 'hr', `ตอนนี้เงินเดือน ${baht(hr.base)} บาท ผลงานปีนี้ได้เกรด A ค่ะ อยากปรับขึ้นกี่เปอร์เซ็นต์ หรือเป็นเงินเท่าไรคะ`, 1800);
      return say(c, 'hr', 'สวัสดีค่ะ มีเรื่องเงินเดือน สวัสดิการ หรือวันลา สอบถามได้เลยนะคะ', 1600);
    }
    if (pct <= 0) return say(c, 'hr', 'ขอเป็นตัวเลขที่มากกว่า 0 นะคะ 😅', 1500);
    if (pct > hr.cap) return say(c, 'hr', `ขึ้น ${+pct.toFixed(1)}% สูงไปหน่อยค่ะ 😅 รอบนี้ปรับได้สูงสุด ${hr.cap}% นะคะ ลองใหม่ได้ค่ะ`, 2000);
    const nw = Math.round(hr.base * (1 + pct / 100) / 10) * 10; hr.done = true; hr.newSal = nw; const g0 = gnow(), eff = new Date(g0.getFullYear(), g0.getMonth() + 1, 1); hr.pending = nw; hr.eff = eff.getTime(); addEvent(eff, '📈', 'เงินเดือนใหม่มีผล', 'raise'); renderCal(); renderBank();
    like(c, m, 'hr', 900); say(c, 'hr', `อนุมัติค่ะ 🎉 เงินเดือนใหม่ ${baht(nw)} บาท (ขึ้น ${+pct.toFixed(1)}%) มีผล ${thDate(eff, { day: 'numeric', month: 'short', year: 'numeric' })} นะคะ`, 2400); complete('hr');
    pushMsg('gang', 'mint', 'ได้ข่าวว่าได้ขึ้นเงินเดือน 👀 เลี้ยงหมูกระทะด้วยนะแก 🥓', 7000);
  },
  co(c, m) {
    const t = m.text || '', who = c.members[0];
    if (m.file) return say(c, who, 'ได้รับเอกสารเพิ่มเติมแล้วค่ะ ขอบคุณนะคะ', 1700);
    say(c, who, /สะดวก|ได้|โอเค|ok|ค่ะ|ครับ|ยินดี/i.test(t) ? 'เยี่ยมเลยค่ะ แล้วพบกันวันจันทร์ 10:00 น. นะคะ อย่าลืมพกเอกสารมาด้วย 📁' : 'ถ้าไม่สะดวก เลือกวันอื่นได้นะคะ 😊', 1800);
  },
};
