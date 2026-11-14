"use strict";
// Office game — search browser. Files load in order and share one global scope (see office/index.html).
/* ================= search ================= */
const HOTELS = [
  { id: 'h1', key: 'เมฆหมอก', name: 'รีสอร์ตเมฆหมอก เขาใหญ่', where: 'นครราชสีมา', price: 2800, rate: 4.7, feat: ['สระว่ายน้ำ วิวภูเขา', 'ทะเลหมอกตอนเช้า', 'ปิ้งย่างริมลานได้', 'ห้องพักได้ 2 คน'], art: 'mist' },
  { id: 'h2', key: 'ทะเลสีฟ้า', name: 'บ้านทะเลสีฟ้า หัวหิน', where: 'ประจวบคีรีขันธ์', price: 3200, rate: 4.6, feat: ['เดินไปชายหาดได้', 'รวมอาหารเช้า', 'ห้องคาราโอเกะ', 'ห้องพักได้ 2 คน'], art: 'sea' },
  { id: 'h3', key: 'ฟ้าใส', name: 'ปายฟ้าใส โฮมสเตย์', where: 'แม่ฮ่องสอน', price: 1900, rate: 4.8, feat: ['บ้านไม้กลางทุ่ง', 'ก่อกองไฟตอนกลางคืน', 'ปั่นจักรยานฟรี', 'ห้องพักได้ 2 คน'], art: 'hill' },
  { id: 'h4', key: 'เกาะแก้ว', name: 'เกาะแก้ว พูลวิลล่า', where: 'ระยอง', price: 4500, rate: 4.9, feat: ['สระส่วนตัวทุกหลัง', 'เรือรับส่งฟรี', 'ดำน้ำดูปะการัง', 'ห้องพักได้ 2 คน'], art: 'island' },
  { id: 'h5', key: 'ภูดอย', name: 'ภูดอย แคมป์ปิ้ง', where: 'เชียงใหม่', price: 1200, rate: 4.4, feat: ['เต็นท์นอนดูดาว', 'อากาศหนาวสุดๆ', 'ห้องน้ำรวม', 'เต็นท์ละ 2 คน'], art: 'camp' },
];
function hotelArt(k) {
  const A = {
    mist: '<rect width="300" height="190" fill="#dfe9ff"/><path d="M0 120 L70 50 L130 110 L200 40 L300 130 V190 H0Z" fill="#8fbf9a"/><path d="M0 130 Q75 110 150 130 T300 125 V190 H0Z" fill="#ffffffcc"/><rect x="110" y="120" width="80" height="44" rx="6" fill="#ffd6a5"/><path d="M104 122 L150 96 L196 122Z" fill="#e8846b"/>',
    sea: '<rect width="300" height="190" fill="#a9e2ff"/><circle cx="240" cy="45" r="22" fill="#ffe27a"/><path d="M0 110 Q75 98 150 110 T300 108 V190 H0Z" fill="#3fa4e8"/><path d="M0 150 Q100 135 200 150 T300 145 V190 H0Z" fill="#ffe0a8"/><rect x="40" y="96" width="70" height="44" rx="6" fill="#fff"/><path d="M34 98 L75 72 L116 98Z" fill="#5fb6ea"/>',
    hill: '<rect width="300" height="190" fill="#ffe9c7"/><path d="M0 130 Q80 70 160 120 T300 100 V190 H0Z" fill="#b8e6a0"/><path d="M0 160 Q120 130 300 155 V190 H0Z" fill="#8fd18a"/><rect x="170" y="100" width="70" height="40" rx="4" fill="#c99a6b"/><path d="M162 102 L205 76 L248 102Z" fill="#9c6b43"/><circle cx="60" cy="50" r="18" fill="#ffb84d"/>',
    island: '<rect width="300" height="190" fill="#7fd6ff"/><path d="M0 120 H300 V190 H0Z" fill="#2fb3d6"/><ellipse cx="150" cy="122" rx="90" ry="22" fill="#ffe0a8"/><path d="M150 120 Q146 80 156 60" stroke="#8a5a2b" stroke-width="6" fill="none"/><path d="M156 60 Q130 50 118 66 M156 60 Q180 46 194 62 M156 60 Q158 40 172 34" stroke="#3faa5a" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="190" y="98" width="46" height="24" rx="4" fill="#fff"/>',
    camp: '<rect width="300" height="190" fill="#2b2d5e"/><circle cx="60" cy="40" r="2" fill="#fff"/><circle cx="120" cy="25" r="2" fill="#fff"/><circle cx="220" cy="35" r="2" fill="#fff"/><circle cx="250" cy="60" r="14" fill="#fff6c2"/><path d="M0 140 Q150 110 300 140 V190 H0Z" fill="#3f6b4f"/><path d="M110 150 L150 90 L190 150Z" fill="#ff9f5a"/><path d="M150 90 L150 150" stroke="#c96a2b" stroke-width="3"/>',
  };
  return `<svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice">${A[k]}</svg>`;
}
const PRODUCTS = [
  ['แก้วกาแฟลายแมว', 189, '☕', 'แก้ว กาแฟ แมว ของขวัญ'], ['ตุ๊กตาหมีนุ่มนิ่ม', 359, '🧸', 'ตุ๊กตา หมี ของเล่น ของขวัญ'], ['ปากกาเจลสีพาสเทล 12 สี', 129, '🖊️', 'ปากกา เครื่องเขียน สำนักงาน'],
  ['สมุดโน้ตปกกระต่าย', 79, '📒', 'สมุด เครื่องเขียน กระต่าย'], ['หูฟังไร้สายสีชมพู', 990, '🎧', 'หูฟัง ไอที มือถือ'], ['ต้นไม้จิ๋วตั้งโต๊ะ', 149, '🪴', 'ต้นไม้ ตกแต่ง โต๊ะ'],
  ['หมอนรองคอรูปเป็ด', 259, '🦆', 'หมอน เป็ด เดินทาง เที่ยว'], ['กระเป๋าเดินทางใบเล็ก', 1290, '🧳', 'กระเป๋า เดินทาง เที่ยว ปีใหม่'], ['ชุดของขวัญปีใหม่', 499, '🎁', 'ของขวัญ ปีใหม่ กระเช้า'],
  ['เมาส์ไร้สายรูปแมว', 299, '🖱️', 'เมาส์ ไอที แมว คอม'], ['ร่มพับลายดาว', 219, '☂️', 'ร่ม ฝน'], ['ขนมคุกกี้รวมรส', 159, '🍪', 'ขนม คุกกี้ ของกิน'],
];
const EN = { แมว: 'cat', ลูกแมว: 'kitten', หมา: 'dog', สุนัข: 'dog', ลูกหมา: 'puppy', กระต่าย: 'rabbit', นก: 'bird', เป็ด: 'duck', แพนด้า: 'panda', หมี: 'bear', เพนกวิน: 'penguin', ปลา: 'fish', จิ้งจอก: 'fox', แฮมสเตอร์: 'hamster', ทะเล: 'beach', ภูเขา: 'mountain', ดอกไม้: 'flower', ซากุระ: 'cherry blossom', ท้องฟ้า: 'sky', อวกาศ: 'galaxy', ดาว: 'stars night sky', ป่า: 'forest', กาแฟ: 'coffee', ขนม: 'dessert', เค้ก: 'cake', เมือง: 'city', หิมะ: 'snow', พระอาทิตย์ตก: 'sunset', น้ำตก: 'waterfall', ทุ่งดอกไม้: 'flower field', ทะเลหมอก: 'sea of mist' };
const TABS = [['all', 'ทั้งหมด'], ['img', 'รูปภาพ'], ['shop', 'ช็อปปิ้ง'], ['hotel', 'ที่พัก'], ['dorm', 'หอพัก'], ['mail', 'อีเมล']];
const HOTEL_WORD = /ที่พัก|โรงแรม|รีสอร์[ทต]|โฮมสเตย์|เที่ยว|ปีใหม่|hotel|resort/i;
const se = { W: null, tab: 'all', q: '', imgs: [], cart: [], token: 0 };
function openSearch(tab) {
  if (se.W && wins.has('search')) { focusWin(se.W); if (tab) setTab(tab); return se.W; }
  const root = h('div', { class: 'se landing' }, `<div class="head"><div class="logo"><i style="color:#7c9cff">เสิร์ช</i><i style="color:#ff8fab">น้</i><i style="color:#f2b24a">อ</i><i style="color:#5fc28e">ย</i></div>
    <div class="sbar"><input class="q" type="text" placeholder="พิมพ์คำที่อยากค้นหา เช่น แมว, ที่พักปีใหม่, ตุ๊กตา" autocomplete="off"><button class="go">ค้นหา</button><button class="cartb" hidden>🛒 <b>0</b></button></div>
    <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}">${n}</button>`).join('')}</div>
    <div class="chips">ลองค้นหา: ${['แมว', 'ทะเล', 'ที่พักปีใหม่', 'หอพักใกล้ออฟฟิศ', 'ของขวัญ'].map(x => `<button data-q="${x}">${x}</button>`).join('')}</div></div><div class="out"><div class="res"></div></div>`);
  se.W = openWin('search', 'เสิร์ชน้อย — เบราว์เซอร์', root, 700, 460, '#eef1ff'); se.root = root; se.W.body.style.overflow = 'hidden';
  se.W.onClose = () => { se.W = null; };
  const q = root.querySelector('.q');
  root.querySelector('.go').addEventListener('click', () => runSearch(q.value));
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(q.value); } });
  root.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  root.querySelector('.chips').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; q.value = b.dataset.q; if (b.dataset.q === 'ที่พักปีใหม่') setTab('hotel'); else if (b.dataset.q === 'หอพักใกล้ออฟฟิศ') setTab('dorm'); else runSearch(b.dataset.q); });
  root.querySelector('.cartb').addEventListener('click', showCart);
  root.querySelector('.out').addEventListener('click', onResultClick);
  syncTabs(); if (tab) setTab(tab); else setTimeout(() => q.focus(), 50);
  return se.W;
}
function syncTabs() { se.root.querySelectorAll('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === se.tab)); const cb = se.root.querySelector('.cartb'); cb.hidden = !se.cart.length; cb.querySelector('b').textContent = se.cart.length; }
function setTab(t) {
  se.tab = t; syncTabs(); const q = se.root.querySelector('.q').value.trim();
  if (t === 'mail') { se.root.classList.remove('landing'); mail.open = null; showMail('auto'); return; }
  if (q || t === 'hotel' || t === 'shop' || t === 'dorm') runSearch(q); else se.root.querySelector('.q').focus();
}
const res = () => se.root.querySelector('.res');
async function runSearch(q) {
  q = (q || '').trim(); if (!se.root) return;
  if (!q && se.tab !== 'hotel' && se.tab !== 'shop' && se.tab !== 'dorm') return;
  if (q && se.tab === 'all' && DORM_WORD.test(q)) { se.tab = 'dorm'; syncTabs(); }
  if (q && /อีเมล|อีเมล์|สมัครเมล|email|e-mail/i.test(q)) { setTab('mail'); return; }
  if (se.tab === 'mail') { se.tab = 'all'; syncTabs(); }
  if (q && HOTEL_WORD.test(q) && se.tab === 'all' && !/[a-z]/i.test(q) && /ที่พัก|โรงแรม|รีสอร์/.test(q)) { se.tab = 'hotel'; syncTabs(); }
  se.q = q; se.root.classList.remove('landing'); const tok = ++se.token;
  se.root.querySelector('.out').scrollTop = 0;
  if (se.tab === 'hotel') return showHotels(q);
  if (se.tab === 'shop') return showShop(q);
  if (se.tab === 'dorm') return showDorms(q);
  res().innerHTML = '<p class="note">กำลังค้นหา…</p>';
  if (se.tab === 'img') return showImages(q, tok);
  const promo = (/หางาน|สมัครงาน|งานใหม่|ย้ายงาน|job/i.test(q) ? `<div class="promo" data-openapp="jobs"><b>💼 หางานใหม่ที่ จ๊อบน้อย</b><br><small>เปิดรับ ${JOBS.length} ตำแหน่ง กดเพื่อเปิดเว็บหางาน</small></div>` : '') + (HOTEL_WORD.test(q) ? `<div class="promo" data-go="hotel"><b>🏨 ที่พักแนะนำสำหรับ "${esc(q)}"</b><br><small>ดูที่พัก ${HOTELS.length} แห่ง ราคาต่อห้องต่อคืน กดเพื่อไปแท็บที่พัก</small></div>` : '');
  for (const lang of ['th', 'en']) {
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=6`);
      const j = await r.json(), list = j.query?.search || []; if (tok !== se.token) return;
      if (!list.length) continue;
      res().innerHTML = promo + `<p class="note">ผลการค้นหา "${esc(q)}" · ข้อมูลจากวิกิพีเดีย${lang === 'en' ? ' (ภาษาอังกฤษ)' : ''}</p>` + list.map(x => `<div><small>${lang}.wikipedia.org › ${esc(x.title)}</small><br><a data-lang="${lang}" data-title="${esc(x.title)}">${esc(x.title)}</a><p>${esc(x.snippet.replace(/<[^>]+>/g, ''))}…</p></div>`).join('');
      return;
    } catch (e) { break; }
  }
  if (tok === se.token) res().innerHTML = promo + `<p class="note">ตอนนี้ต่ออินเทอร์เน็ตไม่ได้ หรือไม่พบผลลัพธ์ของ "${esc(q)}" ลองคำอื่น หรือลองแท็บรูปภาพ / ช็อปปิ้ง / ที่พักดูนะ</p>`;
}
async function showImages(q, tok) {
  const term = EN[q] || q; let list = [];
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent('filetype:bitmap ' + term)}&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=330&format=json&origin=*`);
    const j = await r.json(); list = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index).map(p => p.imageinfo?.[0]).filter(x => x && x.thumburl).map(x => ({ thumb: x.thumburl, big: x.thumburl.replace(/\/\d+px-/, '/1280px-') }));
  } catch (e) { list = []; }
  if (tok !== se.token) return;
  const online = list.length > 0;
  if (!online) list = Array.from({ length: 9 }, (_, i) => { const u = artFor(q, i); return { thumb: u, big: u }; });
  se.imgs = list;
  res().innerHTML = `<p class="note">รูปภาพของ "${esc(q)}" · ${online ? 'จากวิกิมีเดียคอมมอนส์' : 'ต่อเน็ตไม่ได้ เลยวาดรูปตัวอย่างให้แทน'} · กดที่รูปเพื่อดาวน์โหลดหรือตั้งเป็นวอลเปเปอร์</p><div class="ig">${list.map((x, i) => `<button data-img="${i}"><img src="${esc(x.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>`;
}
function showImage(i) {
  const x = se.imgs[i];
  res().innerHTML = `<p class="note"><a data-back="img">← กลับไปรูปทั้งหมด</a></p><div class="iv"><div class="acts"><button class="btn2 pri" data-act="wall" data-i="${i}">🖼️ ตั้งเป็นวอลเปเปอร์</button><button class="btn2" data-act="dl" data-i="${i}">⬇ ดาวน์โหลดเก็บไว้</button><button class="btn2 grn" data-act="chat" data-i="${i}">💬 ส่งในแชท</button></div><img src="${esc(x.big)}" alt="" referrerpolicy="no-referrer"></div>`;
  const im = res().querySelector('.iv img'); im.addEventListener('error', () => { if (im.src !== x.thumb) im.src = x.thumb; }, { once: true });
}
function downloadImg(i, quiet) {
  const x = se.imgs[i], ex = FILES.find(f => f.src === x.big); if (ex) { if (!quiet) S.toast('รูปนี้ดาวน์โหลดไว้แล้ว อยู่ในโฟลเดอร์ ' + FOLDERS.find(fo => fo.id === ex.loc)?.name, 2); return ex; }
  const n = FILES.filter(f => f.tag === se.q && f.kind === 'img').length + 1;
  const f = { id: 'u' + (++uid), name: `${se.q}-${n}.jpg`, type: 'jpg', kind: 'img', src: x.big, tag: se.q, loc: 'down' };
  FILES.push(f); renderDesktop(); if (!quiet) { S.toast(`ดาวน์โหลด "${f.name}" แล้ว อยู่ในโฟลเดอร์ ดาวน์โหลด`, 2.2); S.tone(400, 900, .2, .07, 'triangle'); }
  return f;
}
function showShop(q) {
  let list = PRODUCTS.filter(p => !q || p[0].includes(q) || p[3].split(' ').some(t => q.includes(t) || t.includes(q)));
  if (!list.length) list = ['รุ่นน่ารัก', 'สีพาสเทล', 'เซ็ตคู่', 'ไซซ์มินิ', 'รุ่นพรีเมียม', 'ลดพิเศษ'].map((v, i) => [`${q} ${v}`, 99 + (hash(q + v) % 30) * 20, ['🛍️', '🎀', '✨', '💝', '⭐', '🏷️'][i], q]);
  se.shop = list;
  res().innerHTML = `<p class="note">${q ? `สินค้า "${esc(q)}"` : 'สินค้าแนะนำวันนี้'} · ร้านค้าในเกม ไม่ได้ซื้อจริง</p><div class="pgr">${list.map((p, i) => `<div class="pc"><div class="art" style="--c:hsl(${hash(p[0]) % 360},85%,92%)">${p[2]}</div><b>${esc(p[0])}</b><span class="pr">฿${baht(p[1])}</span><span class="st">⭐ ${(4 + hash(p[0]) % 10 / 10).toFixed(1)} · ขายแล้ว ${hash(p[0]) % 900 + 50} ชิ้น</span><button class="btn2 pri" data-buy="${i}">ใส่ตะกร้า</button></div>`).join('')}</div>`;
}
function showCart() {
  se.root.classList.remove('landing');
  const tot = se.cart.reduce((s, p) => s + p[1], 0);
  res().innerHTML = `<p class="note"><a data-back="shop">← กลับไปช็อปต่อ</a></p><div class="cartbox"><b>🛒 ตะกร้าของฉัน</b>${se.cart.map(p => `<div><span>${p[2]} ${esc(p[0])}</span><span>฿${baht(p[1])}</span></div>`).join('') || '<div>ยังว่างอยู่</div>'}<div style="border-top:1px dashed #f3b3c8;margin-top:6px;padding-top:6px"><b>รวม</b><b class="pr">฿${baht(tot)}</b></div>${se.cart.length ? '<button class="btn2 pri" data-pay style="margin-top:8px">สั่งซื้อเลย</button>' : ''}</div>`;
}
function showHotels(q) {
  const list = HOTELS.filter(x => !q || HOTEL_WORD.test(q) || x.name.includes(q) || x.where.includes(q) || q.includes(x.key));
  const show2 = list.length ? list : HOTELS;
  res().innerHTML = `<p class="note">ที่พักสำหรับทริป 30 ธ.ค. – 1 ม.ค. (2 คืน) · ราคาต่อห้องต่อคืน · เว็บที่พักในเกม</p><div class="hlist">${show2.map(x => `<div class="hc" data-hotel="${x.id}">${hotelArt(x.art)}<div><h4>${esc(x.name)}</h4><small>📍 ${esc(x.where)} · ⭐ ${x.rate}</small><p>${esc(x.feat.slice(0, 2).join(' · '))}</p><span class="pr">฿${baht(x.price)}</span> <small>/ ห้อง / คืน</small></div></div>`).join('')}</div>`;
}
function showHotel(id) {
  const x = HOTELS.find(y => y.id === id); complete('hotel');
  res().innerHTML = `<p class="note"><a data-back="hotel">← กลับไปรายการที่พัก</a></p><div class="hd">${hotelArt(x.art)}<h3>${esc(x.name)}</h3><small>📍 จ.${esc(x.where)} · ⭐ ${x.rate} จาก 5</small><div><span class="pr" style="font-size:20px">฿${baht(x.price)}</span> ต่อห้อง ต่อคืน</div><ul>${x.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul><div class="iv"><div class="acts"><button class="btn2" data-copy="${x.id}">📋 คัดลอกชื่อและราคา</button><button class="btn2" data-savehotel="${x.id}">💾 บันทึกข้อมูลที่พัก</button><button class="btn2 grn" data-share="${x.id}">💬 แชร์ไปกลุ่มแชท</button></div></div></div>`;
}
async function onResultClick(e) {
  if (se.tab === 'mail' && mailClick(e)) return;
  const t = e.target;
  const back = t.closest('[data-back]'); if (back) { se.tab = back.dataset.back; syncTabs(); runSearch(se.q); return; }
  const go = t.closest('[data-go]'); if (go) { setTab(go.dataset.go); return; }
  const dm = t.closest('[data-dorm]'); if (dm) { showDorm(dm.dataset.dorm); return; }
  const sv = t.closest('[data-savehotel]'); if (sv) { saveInfo('hotelinfo', HOTELS.find(x => x.id === sv.dataset.savehotel)); return; }
  const sd = t.closest('[data-savedorm]'); if (sd) { saveInfo('dorminfo', DORMS.find(x => x.id === sd.dataset.savedorm)); return; }
  const mvb = t.closest('[data-move]'); if (mvb) { moveTo(DORMS.find(x => x.id === mvb.dataset.move)); return; }
  if (t.closest('[data-openapp]')) { openJobs(); return; }
  const im = t.closest('[data-img]'); if (im) { showImage(+im.dataset.img); return; }
  const act = t.closest('[data-act]');
  if (act) { const i = +act.dataset.i; if (act.dataset.act === 'wall') { const f = downloadImg(i, true); setWallpaper(f.src); S.toast('ตั้งเป็นวอลเปเปอร์แล้ว (เก็บรูปไว้ในโฟลเดอร์ ดาวน์โหลด ด้วย)', 2.2); } if (act.dataset.act === 'dl') downloadImg(i); if (act.dataset.act === 'chat') { const f = downloadImg(i, true); if (openChat()) sendFile(f); } return; }
  const buy = t.closest('[data-buy]'); if (buy) { se.cart.push(se.shop[+buy.dataset.buy]); syncTabs(); S.tone(880, 1320, .08, .07, 'triangle'); S.toast('ใส่ตะกร้าแล้ว 🛒', 1.2); return; }
  if (t.closest('[data-pay]')) { const tot = se.cart.reduce((s, p) => s + p[1], 0), bear = se.cart.some(p => /ตุ๊กตา/.test(p[0])); if (!bankPay(tot, '🛒 ช็อปปิ้งเสิร์ชน้อย')) return; se.cart = []; if (bear && !sisBear) { sisBear = true; pushMsg('sis', 'sis', 'พี่!! เห็นว่าสั่งตุ๊กตาหมีให้แล้ว 🥹🧸 รักพี่ที่สุดในโลก', 3500); } syncTabs(); S.jingle(); res().innerHTML = `<div class="cartbox" style="text-align:center"><div style="font-size:48px;justify-content:center">📦</div><b>สั่งซื้อสำเร็จ!</b><p>ยอดชำระ ฿${baht(tot)} · ของจะมาส่งที่ออฟฟิศ (ในเกมนะ)</p></div>`; return; }
  const hc = t.closest('[data-hotel]'); if (hc) { showHotel(hc.dataset.hotel); return; }
  const cp = t.closest('[data-copy]'); if (cp) { const x = HOTELS.find(y => y.id === cp.dataset.copy); copy(`${x.name} ราคา ${baht(x.price)} บาท/ห้อง/คืน`); return; }
  const sh = t.closest('[data-share]'); if (sh) { if (openChat()) { chat.cur = 'g'; renderChat(); sendMsg({ hotel: sh.dataset.share }); } return; }
  const a = t.closest('a[data-title]'); if (!a) return;
  const lang = a.dataset.lang, title = a.dataset.title; res().innerHTML = '<p class="note">กำลังเปิดหน้า…</p>';
  try {
    const j = await (await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)).json();
    res().innerHTML = `<p class="note"><a data-back="all">← กลับไปผลการค้นหา</a></p><div>${j.thumbnail ? `<img class="wimg" src="${esc(j.thumbnail.source)}" alt="">` : ''}<h3 style="margin:0 0 6px">${esc(j.title)}</h3><p style="font-size:14px;color:#333">${esc(j.extract || 'ไม่มีบทสรุปของหน้านี้')}</p><p class="note">ที่มา: วิกิพีเดีย</p></div>`;
  } catch (err) { res().innerHTML = '<p class="note"><a data-back="all">← กลับ</a> · เปิดหน้านี้ไม่ได้ ลองใหม่อีกครั้ง</p>'; }
}
