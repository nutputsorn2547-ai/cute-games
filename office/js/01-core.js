"use strict";
// Office game — tasks, pictures, files, folders, context menu, wallpaper. Files load in order and share one global scope (see office/index.html).
const { setupShell, shellMarkup } = window.__shellLib;

shellMarkup({
  title: 'ออฟฟิศจำลอง',
  blurb: 'เริ่มวันแรกของปี 1 ม.ค. 2569 เวลา 8 โมงเช้า: จัดไฟล์ ทำตาราง หาที่พักทริปปีใหม่ เตรียมเอกสารประชุม สั่งงานน้องเอไอ แชทกับทีมและครอบครัว จัดการเงินในธนาคาร ย้ายหอ หางานใหม่ และเล่นเกม',
  steps: ['มือถือจะกลายเป็น <b>ทัชแพด</b> กับ <b>คีย์บอร์ด</b>', 'ลาก 1 นิ้ว = เลื่อนเมาส์ · แตะ = คลิก · แตะสองที = ดับเบิลคลิก (บนที่ว่างของจอจะมีเมนู) · 2 นิ้ว = เลื่อนหน้า'],
});
const S = setupShell({ game: 'office' });
const pad = S.pad, $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const baht = n => n.toLocaleString('th-TH');
const pick = a => a[Math.random() * a.length | 0];
const svgURI = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const hash = s => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
let clip = ''; // in-game clipboard (also copied to the real one when allowed)
function copy(t) { clip = t; try { navigator.clipboard?.writeText(t).catch(() => {}); } catch (e) {} S.toast('คัดลอกแล้ว · วางได้ด้วย Ctrl+V หรือปุ่ม "วาง" บนมือถือ', 2.2); }

/* ================= tasks ================= */
// staged unlocking is off: everything (tasks, apps, chats) is available from day 1.
// A task may carry `due` (game day it is ideally finished by); it is only a reminder, nothing is locked or penalised.
const DAYPLAN = { tasks: {}, apps: {}, bar: {}, chats: {} };
let unlockedDay = 1;
const TASKS = [
  { id: 'rec', due: 7, t: 'ย้ายใบเสร็จ 3 ไฟล์ ไปไว้ในโฟลเดอร์ "บัญชี"' },
  { id: 'pic', due: 7, t: 'ย้ายรูป 2 รูป ไปไว้ในโฟลเดอร์ "รูปภาพ"' },
  { id: 'newf', due: 7, t: 'ดับเบิลคลิกที่ว่างบนจอ แล้วสร้างโฟลเดอร์ใหม่' },
  { id: 'wall', due: 7, t: 'เปลี่ยนวอลเปเปอร์ (ลองโหลดรูปจากเสิร์ชน้อยมาตั้งก็ได้)' },
  { id: 'sum', due: 7, t: 'เปิด ค่าใช้จ่าย.xlsx ใส่สูตรรวมยอดที่ B8 (=SUM(B2:B6))' },
  { id: 'fmt', due: 7, t: 'ตกแต่งตาราง ทำตัวหนาหรือใส่สี แล้วกดบันทึก' },
  { id: 'hotel', t: 'อ่านเอกสาร "ทริปปีใหม่" บนโต๊ะ แล้วหาที่พักในเสิร์ชน้อย แท็บที่พัก' },
  { id: 'trip', t: 'กรอกที่พักลง ทริปปีใหม่.xlsx แล้วใส่สูตรคำนวณราคารวม' },
  { id: 'mail', due: 7, t: 'สร้างอีเมลสมมุติในเสิร์ชน้อย (แท็บอีเมล) แล้วจดลงโพสต์อิท' },
  { id: 'signup', due: 7, t: 'สมัครแชทน้อยด้วยอีเมลที่สร้างเอง' },
  { id: 'propose', t: 'เสนอที่พักในกลุ่มแชท "ทีมบัญชีน่ารัก"' },
  { id: 'boss', t: 'ส่งไฟล์ ทริปปีใหม่.xlsx ให้หัวหน้าแมวทางแชท' },
  { id: 'food', t: 'สั่งข้าวเที่ยงในแอปหิวแล้ว (ปักหมุดที่อยู่ก่อนสั่ง)' },
  { id: 'hl', due: 7, t: 'หยิบเอกสารบนโต๊ะมาอ่าน แล้วไฮไลท์ตรงที่สำคัญ' },
  { id: 'postit', due: 7, t: 'กด "📝 โพสต์อิท" แปะจดอะไรก็ได้ บนจอคอมหรือบนโต๊ะ' },
  { id: 'note', due: 7, t: 'จดอะไรก็ได้ลงสมุดโน้ต' },
  { id: 'cal', due: 7, t: 'เปิดปฏิทินน้อย แล้วเร่งวันไปถึงอีเวนต์ถัดไป (ย้อนกลับไม่ได้!)' },
  { id: 'meet', t: 'เตรียมเอกสารใส่โฟลเดอร์ "เอกสารประชุม" ให้ครบก่อนวันประชุม (ดูในปฏิทิน)' },
  { id: 'eat', t: 'สั่งข้าวมากินช่วงเที่ยง (11:00–14:00) ก่อนหิวจนทำงานไม่ได้ (ดูแถบ 🍚 ข้างนาฬิกา)' },
  { id: 'call', t: 'รับสายที่โทรเข้ามา แล้วตอบลูกค้าให้ถูกใจ 1 สาย' },
  { id: 'word', t: 'เปิดเวิร์ดน้อย สร้างเอกสารจากเทมเพลต (รายงาน/จดหมายเชิญ/ขอร่วมงาน/ข้อตกลงการค้า) แล้วกดบันทึก' },
  { id: 'pdf', t: 'ในเวิร์ดน้อยหรือบัญชีน้อย (Excel) กด “📄 เซฟ PDF” ให้ได้ไฟล์ .pdf' },
  { id: 'print', t: 'กด “🖨️ ปริ้น” เอกสารออกมาเป็นกระดาษบนโต๊ะ' },
  { id: 'sign', t: 'หยิบปากกาเซ็นชื่อบนกระดาษที่ปริ้น แล้วกด “🖨️ สแกนเข้าคอม” (แนบส่งอีเมลได้)' },
  { id: 'inv1', t: 'อ่านใบแจ้งหนี้ INV-0425 บนโต๊ะ แล้วแชทบอก “ฝ่ายการเงิน” ให้โอนเงินจ่ายคู่ค้า (บ.เมล็ดดี)' },
  { id: 'inv2', t: 'ส่งใบแจ้งหนี้ตัวจริง (ปุ่ม 📤 ตอนหยิบกระดาษ) และไฟล์ Excel สรุปยอด (ส่งในแชท) ให้ฝ่ายการเงิน' },
  { id: 'inv3', t: 'เมื่อการเงินโอนแล้ว หยิบตราปั๊มที่โต๊ะ ปั๊ม “จ่ายแล้ว” บนใบแจ้งหนี้ แล้วสแกนเข้าเครื่อง' },
  { id: 'inv4', t: 'ถามอีเมลคู่ค้าในแชท จดไว้เอง แล้ว “✍️ เขียนอีเมล” แนบใบแจ้งหนี้ที่ปั๊มแล้ว + หลักฐานโอน' },
  { id: 'mailboss', t: 'เขียนอีเมลถึงหัวหน้าพร้อมแนบเอกสารประชุม (ต้องถามอีเมลหัวหน้าในแชทก่อน)' },
  { id: 'mailhr', t: 'เขียนอีเมลขอสลิปเงินเดือนแบบทางการจากพี่ HR (ถามอีเมล HR ในแชทก่อน)' },
  { id: 'mreply', t: 'เปิดเมลน้อย ตอบอีเมลที่มี ⭐ (สำคัญ) ให้ทัน ไม่งั้นลูกค้าโทรตาม' },
  { id: 'ai', t: 'สั่งน้องเอไอ "ทำสรุปทริป" (ลากเทมเพลตและไฟล์ที่หามาให้ครบ)' },
  { id: 'work', t: 'ดาวน์โหลดเอกสารจากแชทลูกค้า แล้วบันทึกในโปรแกรมบัญชีน้อยให้ถูก 3 ใบ' },
  { id: 'scan', due: 7, t: 'หยิบเอกสารบนโต๊ะ กด "ถือไว้ข้างจอ" หรือ "สแกนเข้าคอม"' },
  { id: 'junior', t: 'ตอบคำถามรุ่นน้องให้ถูก 3 ข้อ (น้องทักมาทุก 3 ชั่วโมงในเกม)' },
  { id: 'phone', t: 'หยิบมือถือบนโต๊ะขึ้นมาดูแชท', me: 1 },
  { id: 'family', t: 'ตอบแชทครอบครัว (แม่ พ่อ น้องสาว หรือพี่ชาย)', me: 1 },
  { id: 'gossip', t: 'เม้าท์กับเพื่อนในกลุ่ม "แก๊งเม้าท์มอย" (ระวังส่งผิดห้อง!)', me: 1 },
  { id: 'hr', t: 'คุยกับพี่ HR ขอขึ้นเงินเดือน (ขอเยอะไปจะโดนต่อรองนะ)', me: 1 },
  { id: 'resume', t: 'แก้เรซูเม่ในแคนวาน้อย แล้วกด "ส่งออก PDF"', me: 1 },
  { id: 'apply', t: 'สมัครงานใหม่ในจ๊อบน้อย โดยแนบเรซูเม่', me: 1 },
  { id: 'game', t: 'เล่นเกมน้อย: ทุบตุ่นให้ได้ 15 แต้ม จับคู่การ์ดให้ครบ ชนะป๊อกเด้ง ซูโดกุ หรือพิมพ์เร็ว', me: 1 },
  { id: 'time', t: 'กดนาฬิกามุมขวาล่างของจอ แล้วเปลี่ยนเวลา', me: 1 },
  { id: 'bank', t: 'จ่ายบิลหรือโอนเงินในแอปธนาคารน้อย', me: 1 },
  { id: 'move', t: 'หาหอพักใหม่ในเสิร์ชน้อย แท็บหอพัก แล้วย้ายเข้า', me: 1 },
  { id: 'borrow', t: 'ลองพิมพ์ขอยืมเงินคนในแชท (มีทั้งให้และไม่ให้!)', me: 1 },
];
const done = new Set();
function renderTasks() {
  $('taskHead').innerHTML = `<span>งาน · วันที่ ${unlockedDay}</span><span>${TASKS.filter(t => (DAYPLAN.tasks[t.id] || 1) <= unlockedDay && done.has(t.id)).length}/${TASKS.filter(t => (DAYPLAN.tasks[t.id] || 1) <= unlockedDay).length} ${$('tasks').classList.contains('min') ? '▸' : '▾'}</span>`;
  const vis = TASKS.filter(t => (DAYPLAN.tasks[t.id] || 1) <= unlockedDay);
  const dueTxt = t => { if (!t.due || done.has(t.id)) return ''; const late = t.due < unlockedDay; return `<small class="due${late ? ' late' : ''}">${late ? 'เลยกำหนดแล้ว' : 'ภายใน'} ${new Date(2026, 0, t.due).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</small>`; };
  const li = list => list.map(t => `<li class="${done.has(t.id) ? 'done' : ''}">${esc(t.t)}${dueTxt(t)}</li>`).join('');
  const later = TASKS.length - vis.length;
  $('taskList').innerHTML = `<div class="tsec">💼 งานบริษัท</div><ol>${li(vis.filter(t => !t.me))}</ol>${vis.some(t => t.me) ? `<div class="tsec">🏠 เรื่องส่วนตัว</div><ol>${li(vis.filter(t => t.me))}</ol>` : ''}${later ? `<div class="tsoon">🔒 อีก ${later} งานจะเปิดในวันถัดๆ ไป</div>` : ''}`;
}
$('taskHead').addEventListener('click', () => { $('tasks').classList.toggle('min'); renderTasks(); });
function complete(id) {
  if (done.has(id)) return; done.add(id); renderTasks(); S.tone(660, 990, .12, .1, 'triangle'); S.vib([20, 40, 20]);
  if (done.size === TASKS.length) { S.big('เสร็จงานครบแล้ว เลิกงานได้!', 3, '#5a78e6'); S.jingle(); } else S.toast('เยี่ยม! ทำเสร็จไปอีกข้อ', 1.6);
}
renderTasks();

/* ================= pictures ================= */
const PIC_SVG = {
  cat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#ffe9c7"/><circle cx="200" cy="150" r="80" fill="#ffa64d"/><path d="M135 105 L150 40 L185 85 Z M265 105 L250 40 L215 85 Z" fill="#ffa64d"/><circle cx="172" cy="145" r="9" fill="#3a3245"/><circle cx="228" cy="145" r="9" fill="#3a3245"/><path d="M190 170 Q200 180 210 170" stroke="#3a3245" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="150" cy="172" rx="13" ry="7" fill="#ff8fab88"/><ellipse cx="250" cy="172" rx="13" ry="7" fill="#ff8fab88"/></svg>`,
  sea: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#9fd8ff"/><circle cx="320" cy="60" r="30" fill="#ffe27a"/><path d="M0 150 Q50 135 100 150 T200 150 T300 150 T400 150 V260 H0 Z" fill="#3fa4e8"/><path d="M0 185 Q50 170 100 185 T200 185 T300 185 T400 185 V260 H0 Z" fill="#2b86cc"/><path d="M0 225 Q120 205 260 225 T400 220 V260 H0 Z" fill="#ffe0a8"/></svg>`,
};
const FLOWER = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#fff4c2"/>${[[80, 120], [200, 100], [320, 120]].map(([x, y], i) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-28" rx="17" ry="28" fill="${['#ff8fab', '#ffb84d', '#c39bff'][i]}" transform="rotate(${a})"/>`).join('')}<circle r="15" fill="#ffe066"/></g>`).join('')}<text x="200" y="226" text-anchor="middle" font-family="Mitr,sans-serif" font-size="34" fill="#d8467a">สวัสดีวันศุกร์</text></svg>`);
// offline stand-in picture for a search word: soft sky, hills and a sun, tinted by the word
function artFor(q, i) {
  const hu = (hash(q) + i * 47) % 360, h2 = (hu + 40) % 360;
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hu},80%,86%)"/><stop offset="1" stop-color="hsl(${h2},80%,93%)"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><circle cx="${80 + i * 50 % 260}" cy="70" r="30" fill="hsl(${(hu + 180) % 360},90%,80%)"/><path d="M0 200 Q100 ${140 + i * 9 % 40} 200 190 T400 180 V260 H0Z" fill="hsl(${hu},45%,70%)"/><path d="M0 230 Q140 200 260 230 T400 220 V260 H0Z" fill="hsl(${h2},45%,60%)"/><text x="200" y="135" text-anchor="middle" font-family="Mitr,sans-serif" font-size="30" fill="#fff" opacity=".9">${esc(q)}</text></svg>`);
}
const ANIMAL = /แมว|หมา|สุนัข|กระต่าย|นก|เป็ด|ไก่|ช้าง|ม้า|วัว|หมู|ปลา|เพนกวิน|หมี|แพนด้า|จิ้งจอก|สัตว์|cat|kitten|dog|pupp|bunny|rabbit|bird|duck|panda|bear|penguin|fox|animal|hamster|แฮมสเตอร์/i;

/* ================= files & folders ================= */
const TYPES = { dsg: ['DSN', '#00c4cc'], pdf: ['PDF', '#ff6b6b'], png: ['PNG', '#4fb3ff'], jpg: ['JPG', '#36a3d9'], xls: ['XLS', '#2f9d5a'], doc: ['DOC', '#7c6cff'] };
const FOLDERS = [{ id: 'acc', name: 'บัญชี', c: '#ffcf5a' }, { id: 'pics', name: 'รูปภาพ', c: '#8fd3ff', c2: '#5fb6ea' }, { id: 'work', name: 'งานด่วน', c: '#ffb0c8', c2: '#f08aa8' }, { id: 'trash', name: 'ถังขยะ', c: '#c9c3d6', c2: '#a9a1ba' }, { id: 'down', name: 'ดาวน์โหลด', c: '#b7e4a8', c2: '#8fcf7c' }];
const FOLDER_COLORS = [['#ffd6a5', '#f4b878'], ['#cdb4ff', '#a98bf0'], ['#a0e7e5', '#6fcfcc'], ['#ffc6ff', '#ee9cee'], ['#fdffb6', '#e6e88a']];
const FILES = [
  { id: 'r1', name: 'ใบเสร็จ-ค่าไฟ.pdf', type: 'pdf', kind: 'rec', lines: [['ค่าไฟฟ้า เดือนนี้', '1,240.00'], ['ภาษีมูลค่าเพิ่ม (รวมแล้ว)', '—']] },
  { id: 'r2', name: 'ใบเสร็จ-กาแฟ.pdf', type: 'pdf', kind: 'rec', lines: [['ลาเต้เย็น ×2', '120.00']] },
  { id: 'r3', name: 'ใบเสร็จ-แท็กซี่.pdf', type: 'pdf', kind: 'rec', lines: [['ค่าโดยสาร ไป-กลับ ลูกค้า', '260.00']] },
  { id: 'p1', name: 'แมวส้ม.png', type: 'png', kind: 'pic', src: svgURI(PIC_SVG.cat), tag: 'แมว' },
  { id: 'p2', name: 'ทะเลวันหยุด.png', type: 'png', kind: 'pic', src: svgURI(PIC_SVG.sea), tag: 'ทะเล' },
  { id: 'x1', name: 'ค่าใช้จ่าย.xlsx', type: 'xls', kind: 'sheet' },
  { id: 'd1', name: 'บันทึกประชุม.doc', type: 'doc', kind: 'doc' },
  { id: 'x2', name: 'ทริปปีใหม่.xlsx', type: 'xls', kind: 'sheet' },
];
let uid = 0;
const icons = $('icons'), screen = $('screen');
let deskPos = {}; // id -> [col,row] on the desktop
FOLDERS.slice(0, 4).forEach((f, i) => deskPos[f.id] = [0, i]);
FILES.forEach((f, i) => { f.loc = 'desk'; deskPos[f.id] = [1 + (i >> 2), i % 4]; });
FILES.push({ id: 'cv', name: 'เรซูเม่_ฉัน.design', type: 'dsg', kind: 'design', loc: 'desk' });
const APPS = [{ id: 'app-design', n: 'แคนวาน้อย', e: '🎨', c: '#00c4cc' }, { id: 'app-jobs', n: 'จ๊อบน้อย หางาน', e: '💼', c: '#3b5bdb' }, { id: 'app-game', n: 'เกมน้อย', e: '🎮', c: '#ff8fab' }, { id: 'app-food', n: 'หิวแล้ว', e: '🍱', c: '#ff8a3d' }, { id: 'app-cal', n: 'ปฏิทินน้อย', e: '📅', c: '#e8669a' }, { id: 'app-bank', n: 'ธนาคารน้อย', e: '🏦', c: '#1f9d6b' }, { id: 'app-ai', n: 'น้องเอไอ', e: '🤖', c: '#7c5cff' }, { id: 'app-work', n: 'บัญชีน้อย', e: '📒', c: '#5a78e6' }, { id: 'app-mail', n: 'เมลน้อย', e: '📧', c: '#3b82f6' }, { id: 'app-word', n: 'เวิร์ดน้อย', e: '📝', c: '#2b6cd9' }];
APPS.sort((a, b) => (DAYPLAN.apps[a.id] || 1) - (DAYPLAN.apps[b.id] || 1)); // first-unlocked apps take the top slots
deskPos.down = [3, 0];
const CELLW = 100, CELLH = 104;
const folderOnDesk = fo => !fo.loc || fo.loc === 'desk';
const foldPath = fo => { const p = []; for (let c = fo, n = 0; c && n < 20; c = FOLDERS.find(x => x.id === c.loc), n++) p.unshift(c.name); return p.join(' › '); };
const folderInside = (fo, anc) => { for (let c = fo, n = 0; c && n < 20; c = FOLDERS.find(x => x.id === c.loc), n++) if (c.id === anc) return true; return false; };
const onDesk = id => id.startsWith('app-') || FOLDERS.some(x => x.id === id && folderOnDesk(x)) || FILES.find(x => x.id === id)?.loc === 'desk';
function firstFree() {
  const cols = Math.max(1, Math.floor((icons.clientWidth - 20) / CELLW)), rows = Math.max(1, Math.floor((icons.clientHeight - 10) / CELLH));
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (!Object.entries(deskPos).some(([id, p]) => p[0] === c && p[1] === r && onDesk(id))) return [c, r];
  return [0, 0];
}
function fileIcon(f) {
  const [lab, c] = TYPES[f.type];
  const art = f.src ? `<div class="th"><img src="${esc(f.src)}" alt="" draggable="false" referrerpolicy="no-referrer"></div>` : `<div class="fi" style="--c:${c}"><b>${lab}</b></div>`;
  return h('div', { class: 'icon', 'data-id': f.id }, `${art}<span>${esc(f.name)}</span>`);
}
function folderIcon(fo) {
  const n = FILES.filter(f => f.loc === fo.id).length + FOLDERS.filter(x => x.loc === fo.id).length;
  return h('div', { class: 'icon', 'data-id': fo.id, 'data-folder': fo.id }, `<div class="fo" style="--c:${fo.c};--c2:${fo.c2 || '#f3b73a'}">${n ? `<i>${n}</i>` : ''}</div><span>${esc(fo.name)}</span>`);
}
function renderDesktop() {
  icons.innerHTML = '';
  for (const fo of FOLDERS) { if (!folderOnDesk(fo)) continue; const el = folderIcon(fo); place(el, fo.id); icons.append(el); }
  for (const f of FILES) if (f.loc === 'desk') { const el = fileIcon(f); place(el, f.id); icons.append(el); }
  for (const a of APPS) { if (!appOpen(a.id)) continue; const el = h('div', { class: 'icon', 'data-id': a.id }, `<div class="ap" style="--c:${a.c}">${a.e}</div><span>${esc(a.n)}</span>`); place(el, a.id); icons.append(el); }
  for (const w of wins.values()) if (w.folder) renderFolder(w);
  checkFiles();
}
function place(el, id) { if (!deskPos[id]) deskPos[id] = id.startsWith('app-') ? (() => { const i = APPS.findIndex(a => a.id === id), cols = Math.max(6, Math.floor((icons.clientWidth - 20) / CELLW)); return [cols - 1 - Math.floor(i / 5), i % 5]; })() : firstFree(); const [c, r] = deskPos[id]; el.style.left = (14 + c * CELLW) + 'px'; el.style.top = (12 + r * CELLH) + 'px'; }
function checkFiles() {
  if (FILES.filter(f => f.kind === 'rec').every(f => f.loc === 'acc')) complete('rec');
  if (FILES.filter(f => f.kind === 'pic').every(f => f.loc === 'pics')) complete('pic');
}
function moveFile(f, folder) {
  f.loc = folder; S.tone(520, 780, .1, .1, 'triangle'); S.vib(20);
  S.toast(`ย้าย "${f.name}" ไปที่ ${FOLDERS.find(x => x.id === folder).name} แล้ว`, 1.8);
}
// icon interaction: select, drag to folder / chat / around desktop, double click to open
let drag = null;
document.addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  const ic = e.target.closest('.icon'); if (!ic || !e.target.closest('#screen') || e.target.closest('input')) { if (e.target.closest('#screen') && !ic) selectIcon(null); return; }
  selectIcon(ic); drag = { id: ic.dataset.id, x0: e.clientX, y0: e.clientY, el: ic, ghost: null };
});
addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.ghost && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { drag.ghost = drag.el.cloneNode(true); drag.ghost.classList.add('dragghost'); drag.ghost.style.position = 'fixed'; document.body.append(drag.ghost); drag.el.style.opacity = .35; }
  if (drag.ghost) {
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    document.querySelectorAll('.icon.drop').forEach(x => x.classList.remove('drop'));
    const t = dropTarget(e.clientX, e.clientY); if (t && t.el) t.el.classList.add('drop');
  }
});
addEventListener('pointerup', e => {
  if (!drag) return; const d = drag; drag = null;
  document.querySelectorAll('.icon.drop').forEach(x => x.classList.remove('drop'));
  if (!d.ghost) return; d.ghost.remove(); d.el.style.opacity = '';
  const t = dropTarget(e.clientX, e.clientY), f = FILES.find(x => x.id === d.id);
  const fo2 = FOLDERS.find(x => x.id === d.id);
  if (t && t.folder && fo2) { if (fo2.id === 'trash') S.toast('ถังขยะย้ายไม่ได้นะ', 1.6); else if (folderInside(FOLDERS.find(x => x.id === t.folder), fo2.id)) S.toast('ย้ายโฟลเดอร์เข้าไปในตัวมันเองไม่ได้', 1.8); else if (fo2.loc !== t.folder) { fo2.loc = t.folder; S.tone(520, 780, .1, .1, 'triangle'); S.toast(`ย้ายโฟลเดอร์ "${fo2.name}" ไปไว้ใน ${FOLDERS.find(x => x.id === t.folder).name} แล้ว`, 1.8); } }
  else if (t && t.folder && f && t.folder !== d.id) { if (f.loc !== t.folder) moveFile(f, t.folder); }
  else if (t && t.chat && f) sendFile(f);
  else if (t && t.ai && f) aiAttach(f);
  else if (t && t.work && f) workPick(f);
  else if (t && t.desk) {
    const r = icons.getBoundingClientRect();
    const c = clamp(Math.round((e.clientX - r.left - 14 - 46) / CELLW), 0, Math.floor((r.width - 100) / CELLW)), row = clamp(Math.round((e.clientY - r.top - 12 - 40) / CELLH), 0, Math.floor((r.height - 100) / CELLH));
    if (f) f.loc = 'desk'; const fo2 = FOLDERS.find(x => x.id === d.id); if (fo2 && fo2.id !== 'trash') delete fo2.loc;
    const taken = Object.entries(deskPos).find(([id, p]) => id !== d.id && p[0] === c && p[1] === row && onDesk(id));
    if (!taken) deskPos[d.id] = [c, row];
  }
  renderDesktop();
});
function dropTarget(x, y) {
  const el = document.elementFromPoint(x, y); if (!el) return null;
  const ic = el.closest('.icon[data-folder]'); if (ic) return { folder: ic.dataset.folder, el: ic };
  const fw = el.closest('.win'); const W = fw && wins.get(fw.dataset.id);
  if (W && W.folder) return { folder: W.folder };
  if (W && W.chat) return { chat: true };
  if (W && W.ai) return { ai: true };
  if (W && W.work) return { work: true };
  if (el.closest('#icons')) return { desk: true };
  return null;
}
function selectIcon(ic) { document.querySelectorAll('.icon.sel').forEach(x => x.classList.remove('sel')); if (ic) ic.classList.add('sel'); }
document.addEventListener('dblclick', e => {
  const ic = e.target.closest('.icon');
  if (!ic) {
    if (e.target.closest('#icons')) desktopMenu(e.clientX, e.clientY);
    else { const tb = e.target.closest('.win .tb'); if (tb && !e.target.closest('button')) toggleMax(wins.get(tb.parentElement.dataset.id)); }
    return;
  }
  if (ic.querySelector('input')) return;
  openItem(ic.dataset.id);
});
function openItem(id) {
  const app = { 'app-design': () => openDesign(FILES.find(f => f.id === 'cv')), 'app-jobs': openJobs, 'app-game': openGames, 'app-food': openFood, 'app-cal': openCal, 'app-bank': () => openBank(), 'app-ai': openAI, 'app-work': openWork, 'app-mail': openMailApp, 'app-word': () => openWord() }[id]; if (app) { app(); return; }
  const fo = FOLDERS.find(x => x.id === id), f = FILES.find(x => x.id === id);
  if (fo) openFolder(fo); else if (f) openFile(f);
}
document.addEventListener('contextmenu', e => {
  if (!e.target.closest('#screen')) return; e.preventDefault();
  const ic = e.target.closest('.icon');
  if (ic) { selectIcon(ic); iconMenu(ic.dataset.id, e.clientX, e.clientY); }
  else if (e.target.closest('#icons')) desktopMenu(e.clientX, e.clientY);
});

/* ---- context menu ---- */
let ctx = null;
function showCtx(x, y, items) {
  hideCtx(); const sr = screen.getBoundingClientRect();
  ctx = h('div', { class: 'ctx' });
  for (const it of items) {
    if (it === '-') { ctx.append(h('hr')); continue; }
    const b = h('button', {}, it.t); b.addEventListener('click', () => { hideCtx(); it.f(); }); ctx.append(b);
  }
  screen.append(ctx);
  ctx.style.left = clamp(x - sr.left, 4, sr.width - ctx.offsetWidth - 4) + 'px';
  ctx.style.top = clamp(y - sr.top, 4, sr.height - 48 - ctx.offsetHeight) + 'px';
  S.tone(700, 900, .04, .05);
}
function hideCtx() { if (ctx) { ctx.remove(); ctx = null; } }
document.addEventListener('pointerdown', e => { if (ctx && !e.target.closest('.ctx')) hideCtx(); }, true);
function desktopMenu(x, y) {
  showCtx(x, y, [
    { t: '📁 สร้างโฟลเดอร์ใหม่', f: newFolder },
    { t: '📝 แปะโพสต์อิทบนจอ', f: () => addNote('screen') },
    { t: '🖼️ เปลี่ยนวอลเปเปอร์…', f: openWallpaper },
    { t: '🔀 จัดเรียงไอคอน', f: arrangeIcons },
    '-',
    { t: '🔎 เปิดเสิร์ชน้อย', f: () => openSearch() },
    { t: '📊 สร้างตารางใหม่', f: newSheetFile },
  ]);
}
function iconMenu(id, x, y) {
  const fo = FOLDERS.find(x => x.id === id), f = FILES.find(x => x.id === id), items = [{ t: '📂 เปิด', f: () => openItem(id) }];
  if (f && f.src) items.push({ t: '🖼️ ตั้งเป็นวอลเปเปอร์', f: () => setWallpaper(f.src) });
  if (f) items.push({ t: '🤖 ส่งให้น้องเอไอ', f: () => aiAttach(f) });
  if (f && f.kind === 'cdoc') items.push({ t: '📒 เปิดในบัญชีน้อย', f: () => workPick(f) });
  if (f && chat.account) items.push({ t: '💬 ส่งในแชท', f: () => { openChat(); sendFile(f); } });
  if (f || (fo && fo.custom)) items.push({ t: '✏️ เปลี่ยนชื่อ', f: () => startRename(id) });
  if (f && f.loc !== 'trash') items.push({ t: '🗑️ ย้ายไปถังขยะ', f: () => { moveFile(f, 'trash'); renderDesktop(); } });
  if (fo && fo.custom) items.push({ t: '🗑️ ลบโฟลเดอร์', f: () => deleteFolder(fo) });
  if (id === 'trash' && FILES.some(x => x.loc === 'trash')) items.push({ t: '✨ ล้างถังขยะ', f: emptyTrash });
  showCtx(x, y, items);
}
function newFolder(parent) {
  parent = typeof parent === 'string' ? parent : null;
  const n = FOLDERS.filter(x => x.custom).length, [c, c2] = FOLDER_COLORS[n % FOLDER_COLORS.length];
  let name = 'โฟลเดอร์ใหม่', k = 2; while (FOLDERS.some(x => x.name === name)) name = 'โฟลเดอร์ใหม่ ' + k++;
  const fo = { id: 'u' + (++uid), name, c, c2, custom: true }; if (parent) fo.loc = parent; FOLDERS.push(fo); if (!parent) deskPos[fo.id] = firstFree();
  renderDesktop(); S.tone(600, 900, .08, .08, 'triangle'); complete('newf'); startRename(fo.id);
}
function deleteFolder(fo) {
  FILES.filter(f => f.loc === fo.id).forEach(f => { f.loc = 'desk'; deskPos[f.id] = firstFree(); });
  FOLDERS.filter(x => x.loc === fo.id).forEach(x => { x.loc = fo.loc || 'desk'; if (folderOnDesk(x)) deskPos[x.id] = firstFree(); });
  FOLDERS.splice(FOLDERS.indexOf(fo), 1); closeWin('files-' + fo.id, true); renderDesktop(); S.noise(.15, 1200, .05);
}
function emptyTrash() {
  const gone = FILES.filter(f => f.loc === 'trash' && f.kind !== 'rec' && f.kind !== 'pic');
  gone.forEach(f => FILES.splice(FILES.indexOf(f), 1)); renderDesktop(); S.noise(.3, 900, .06);
  S.toast(gone.length ? `ลบถาวร ${gone.length} ไฟล์` : 'ไฟล์งานสำคัญลบถาวรไม่ได้นะ ย้ายกลับไปที่เดิมก่อน', 2);
}
function arrangeIcons() {
  deskPos = {}; const ids = [...FOLDERS.filter(folderOnDesk).map(x => x.id), ...FILES.filter(f => f.loc === 'desk').map(f => f.id), ...APPS.map(a => a.id)];
  for (const id of ids) deskPos[id] = firstFree();
  renderDesktop(); S.noise(.15, 1400, .05);
}
function startRename(id) {
  const ic = icons.querySelector(`.icon[data-id="${id}"]`) || document.querySelector(`.fold .icon[data-id="${id}"]`); if (!ic) return;
  const obj = FOLDERS.find(x => x.id === id) || FILES.find(x => x.id === id), span = ic.querySelector('span');
  const inp = h('input', { class: 'rn', type: 'text', spellcheck: 'false' }); inp.value = obj.name; span.replaceWith(inp);
  inp.focus(); const dot = obj.name.lastIndexOf('.'); inp.setSelectionRange(0, dot > 0 && !FOLDERS.includes(obj) ? dot : obj.name.length);
  let fin = false;
  const end = ok => { if (fin) return; fin = true; const v = inp.value.trim(); if (ok && v) obj.name = v; if (obj.book) sheetTitle(obj); renderDesktop(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); end(true); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } });
  inp.addEventListener('blur', () => end(true));
}

/* ---- wallpaper ---- */
const WALLS = [
  'linear-gradient(160deg,#bfe3ff,#ffd7ec 70%,#ffe9c7)', 'linear-gradient(160deg,#c9f2d4,#fff1b8)', 'linear-gradient(200deg,#2b2d5e,#6a4c9c 60%,#f58fb1)',
  'radial-gradient(circle at 30% 30%,#ffe0f0,#ffc2d9 40%,#c8b6ff)', 'repeating-linear-gradient(45deg,#ffe8a8 0 24px,#fff3cf 24px 48px)', 'linear-gradient(180deg,#8fd3ff,#e8f8ff 60%,#9be08f 60%,#6fc27b)',
];
let wallNow = WALLS[0];
function setWallpaper(v) {
  const css = v.startsWith('data:') || v.startsWith('http') ? `center/cover no-repeat url("${v}")` : v;
  screen.style.background = css; wallNow = v; S.tone(500, 900, .15, .08, 'triangle');
  if (v !== WALLS[0]) complete('wall');
  const W = wins.get('wall'); if (W) renderWallpaper(W);
}
function openWallpaper() {
  const W = openWin('wall', 'เปลี่ยนวอลเปเปอร์', h('div', { class: 'wp' }), 520, 380, '#fdeefe');
  renderWallpaper(W);
}
function renderWallpaper(W) {
  const box = W.body.querySelector('.wp'), imgs = FILES.filter(f => f.src);
  box.innerHTML = `<h4>แบบสำเร็จรูป</h4><div class="g">${WALLS.map((w, i) => `<button data-w="${i}" class="${w === wallNow ? 'on' : ''}" style="background:${w}" aria-label="แบบที่ ${i + 1}"></button>`).join('')}</div>
    <h4>รูปในเครื่อง (รวมรูปที่ดาวน์โหลดจากเสิร์ชน้อย)</h4><div class="g">${imgs.map(f => `<button data-f="${f.id}" class="${f.src === wallNow ? 'on' : ''}" style="background-image:url('${esc(f.src)}')" title="${esc(f.name)}"></button>`).join('')}</div>
    <button class="btn2 pri" data-go style="align-self:flex-start">🔎 ไปหารูปสวยๆ ในเสิร์ชน้อย</button>`;
  box.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.w) setWallpaper(WALLS[+b.dataset.w]);
    else if (b.dataset.f) setWallpaper(FILES.find(f => f.id === b.dataset.f).src);
    else if ('go' in b.dataset) openSearch('img');
  };
}
