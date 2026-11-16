'use strict';
/* Office game (beta): photo frames on the work desk. A frame can show a real photo from the player's
   device/phone (file picker or camera), or any picture already in the game (รูปภาพ, search results, screenshots). */
const dfr = { list: [{ id: 1, x: 54, y: 76, r: -4, file: null, cap: '' }], seq: 1, sel: null, els: {} };
const DFR_MAX = 4, DFR_SPOT = [[54, 76, -4], [36, 2, 3], [88, 74, 6], [30, 58, -2]];
const dfrSrc = f => { const x = f && f.file ? FILES.find(i => i.id === f.file && i.loc !== 'trash') : null; return x ? x.src : ''; };
function dfrBuild() {
  const keep = new Set(dfr.list.map(f => f.id));
  for (const k in dfr.els) if (!keep.has(+k)) { dfr.els[k].remove(); delete dfr.els[k]; }
  for (const f of dfr.list) {
    let el = dfr.els[f.id];
    if (!el) {
      el = dfr.els[f.id] = deskItem('', f.x, f.y, f.r, '', 'deco'); el.classList.add('dfrit'); el.style.zIndex = 3;
      el.addEventListener('pointerdown', e => dfrDown(e, f, el)); el.addEventListener('click', e => { if (el._moved) { el._moved = false; return; } dfrOpen(f.id); });
    }
    const s = dfrSrc(f); el.style.left = f.x + '%'; el.style.top = f.y + '%'; el.style.transform = `rotate(${f.r}deg)`;
    const h2 = `<div class="dfr${s ? '' : ' empty'}"><i class="tape"></i>${s ? `<img src="${esc(s)}" alt="" draggable="false">` : '<span>➕<br>ใส่รูป</span>'}${f.cap ? `<b>${esc(f.cap)}</b>` : ''}</div>`;
    if (el._h !== h2) { el._h = h2; el.innerHTML = h2; }
  }
}
function dfrDown(e, f, el) {
  const r = desk.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, l = f.x, t = f.y; el._moved = false; el.setPointerCapture?.(e.pointerId);
  const mv = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!el._moved && Math.hypot(dx, dy) < 8) return; el._moved = true; f.x = Math.max(0, Math.min(92, l + dx / r.width * 100)); f.y = Math.max(0, Math.min(84, t + dy / r.height * 100)); el.style.left = f.x + '%'; el.style.top = f.y + '%'; };
  const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); if (el._moved) setTimeout(() => { el._moved = false; }, 60); };
  el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
}
let dfrEl = null;
function dfrOpen(id) {
  dfr.sel = id; if (!dfrEl) { dfrEl = h('div', { id: 'dfPanel' }); document.body.append(dfrEl); dfrEl.addEventListener('click', dfrClick); dfrEl.addEventListener('change', dfrChange); dfrEl.addEventListener('input', e => { if (e.target.id === 'dfCap') { const f = dfr.list.find(x => x.id === dfr.sel); if (f) { f.cap = e.target.value.slice(0, 24); dfrBuild(); } } }); }
  dfrRender();
}
function dfrClose() { dfrEl?.remove(); dfrEl = null; }
function dfrPics() { return FILES.filter(f => f.src && f.loc !== 'trash' && /^(png|jpg)$/.test(f.type)); }
function dfrRender() {
  if (!dfrEl) return; const f = dfr.list.find(x => x.id === dfr.sel); if (!f) return dfrClose();
  const pics = dfrPics(), cur = dfrSrc(f);
  dfrEl.innerHTML = `<div class="dfp"><button class="dfx" data-d="x">✕</button><h3>🖼️ รูปบนโต๊ะ <small>(กรอบ ${dfr.list.indexOf(f) + 1}/${dfr.list.length})</small></h3>
  <div class="dfrow"><label class="btn2 pri dfup">📱 เลือกรูปจากเครื่อง / ถ่ายด้วยโทรศัพท์<input type="file" accept="image/*" hidden id="dfFile"></label><button class="btn2" data-d="search">🔎 หารูปในเสิร์ชน้อย</button></div>
  <p class="soft">หรือเลือกจากรูปที่มีในเกม (รูปภาพ · ดาวน์โหลดจากเสิร์ชน้อย · รูปแคป/ถ่ายด้วยแคปน้อย)</p>
  <div class="dfg">${pics.map(p => `<button class="${p.id === f.file ? 'on' : ''}" data-d="pick" data-id="${esc(p.id)}" title="${esc(p.name)}"><img src="${esc(p.src)}" alt="" loading="lazy"></button>`).join('') || '<span class="soft">ยังไม่มีรูปในเกม</span>'}</div>
  <label class="soft">ข้อความใต้รูป <input id="dfCap" maxlength="24" value="${esc(f.cap || '')}" placeholder="เช่น ทริปทะเล 🌊"></label>
  <div class="dfrow">${cur ? '<button class="btn2" data-d="clear">เอารูปออก</button>' : ''}${dfr.list.length < DFR_MAX ? '<button class="btn2" data-d="add">➕ เพิ่มกรอบรูป</button>' : ''}${dfr.list.length > 1 ? '<button class="btn2" data-d="del">🗑️ เอากรอบนี้ออก</button>' : ''}<button class="btn2 pri" data-d="x">เสร็จ</button></div></div>`;
}
function dfrSet(f, fileId) { f.file = fileId; dfrBuild(); dfrRender(); S.tone(700, 1000, .08, .06, 'triangle'); S.toast('🖼️ ตั้งรูปบนโต๊ะแล้ว (ลากกรอบเพื่อย้ายที่ได้)', 2.2); try { complete('n12frame'); } catch (e) {} }
function dfrClick(e) {
  if (e.target === dfrEl) { dfrClose(); return; }
  const b = e.target.closest('[data-d]'); if (!b) return; const a = b.dataset.d, f = dfr.list.find(x => x.id === dfr.sel);
  if (a === 'x') dfrClose();
  else if (a === 'search') { dfrClose(); try { openSearch('img'); } catch (x) { openSearch(); } S.toast('🔎 ค้นรูป แล้วกดดาวน์โหลด จากนั้นกลับมาเลือกที่กรอบรูปบนโต๊ะนะ', 3.4); }
  else if (a === 'pick' && f) dfrSet(f, b.dataset.id);
  else if (a === 'clear' && f) { f.file = null; dfrBuild(); dfrRender(); }
  else if (a === 'add') { const n = { id: ++dfr.seq, x: 40, y: 40, r: 0, file: null, cap: '' }, s = DFR_SPOT[dfr.list.length % DFR_SPOT.length]; [n.x, n.y, n.r] = s; dfr.list.push(n); dfr.sel = n.id; dfrBuild(); dfrRender(); }
  else if (a === 'del' && f) { dfr.list.splice(dfr.list.indexOf(f), 1); dfr.sel = dfr.list[0].id; dfrBuild(); dfrRender(); }
}
function dfrChange(e) {
  if (e.target.id !== 'dfFile') return; const file = e.target.files && e.target.files[0], f = dfr.list.find(x => x.id === dfr.sel); if (!file || !f) return;
  if (!/^image\//.test(file.type)) { S.toast('เลือกไฟล์รูปภาพเท่านั้นนะ', 2); return; }
  const rd = new FileReader();
  rd.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, 720 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    const n = FILES.filter(i => i.tag === 'รูปของฉัน').length + 1, nf = { id: 'u' + (++uid), name: `รูปของฉัน-${n}.jpg`, type: 'jpg', kind: 'img', src: c.toDataURL('image/jpeg', .8), tag: 'รูปของฉัน', loc: 'pics' };
    FILES.push(nf); try { renderDesktop(); } catch (er) {} dfrSet(f, nf.id);
  }; im.onerror = () => S.toast('เปิดรูปนี้ไม่ได้ ลองรูปอื่นนะ', 2); im.src = rd.result; };
  rd.readAsDataURL(file);
}
dfrBuild();
const _snap9 = snapshot; snapshot = () => ({ ..._snap9(), dfr: { list: dfr.list, seq: dfr.seq } });
const _load9 = loadGame;
loadGame = function () { const ok = _load9(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.dfr && s.dfr.list && s.dfr.list.length) { dfr.list = s.dfr.list; dfr.seq = s.dfr.seq || dfr.list.length; } } catch (e) {} dfrBuild(); } return ok; };
