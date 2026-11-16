'use strict';
/* Office game (beta): polaroids. Each photo is its own sticker (like the post-its): make as many as you like with the
   "🖼️ โพลารอยด์" button, stick them on the desk, the computer screen or a notebook page, drag to move.
   Click a photo -> big viewer with a side bar (place / change photo / caption / remove). */
const dfr = { list: [], seq: 0, sel: null, els: {}, mode: 'view' };
const DFR_MAX = 12;
const dfrSrc = f => { const x = f && f.file ? FILES.find(i => i.id === f.file && i.loc !== 'trash') : null; return x ? x.src : ''; };
const dfrHost = f => f.place === 'screen' ? $('screen') : f.place === 'nb' ? (typeof ov !== 'undefined' && ov && ov.state && ov.state.isNb && f.pg === nbPage ? ov.state.sheet : null) : desk;
function dfrHtml(f) { const s = dfrSrc(f); return `<div class="dfr${s ? '' : ' empty'}"><i class="tape"></i>${s ? `<img src="${esc(s)}" alt="" draggable="false">` : '<span>🖼️</span>'}${f.cap ? `<b>${esc(f.cap)}</b>` : ''}</div>`; }
function dfrBuild() {
  const keep = new Set(dfr.list.map(f => f.id));
  for (const k in dfr.els) if (!keep.has(+k)) { dfr.els[k].remove(); delete dfr.els[k]; }
  for (const f of dfr.list) {
    f.place = f.place || 'desk'; const host = dfrHost(f); let el = dfr.els[f.id];
    if (el && (!host || el.parentElement !== host)) { el.remove(); delete dfr.els[f.id]; el = null; }
    if (!host) continue;
    if (!el) {
      el = dfr.els[f.id] = h('div', { class: 'item dfrit p-' + f.place, 'data-id': 'deco' }); host.append(el);
      el.addEventListener('pointerdown', e => dfrDown(e, f, el)); el.addEventListener('click', e => { e.stopPropagation(); if (el._moved) { el._moved = false; return; } dfrOpen(f.id); });
      el.addEventListener('dblclick', e => e.stopPropagation());
    }
    el.style.left = f.x + '%'; el.style.top = f.y + '%'; el.style.transform = `rotate(${f.r}deg)`; el.style.zIndex = 3 + (f.z || 0);
    const h2 = dfrHtml(f); if (el._h !== h2) { el._h = h2; el.innerHTML = h2; }
  }
}
function dfrDown(e, f, el) {
  e.stopPropagation(); const r = el.parentElement.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, l = f.x, t = f.y; el._moved = false; el.setPointerCapture?.(e.pointerId);
  const mv = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!el._moved && Math.hypot(dx, dy) < 8) return; el._moved = true; f.x = Math.max(0, Math.min(f.place === 'desk' ? 92 : 86, l + dx / r.width * 100)); f.y = Math.max(0, Math.min(f.place === 'desk' ? 84 : 78, t + dy / r.height * 100)); el.style.left = f.x + '%'; el.style.top = f.y + '%'; };
  const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); if (el._moved) setTimeout(() => { el._moved = false; }, 60); };
  el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
}
/* ---- create ---- */
function dfrNew() {
  if (dfr.list.length >= DFR_MAX) { S.toast(`ติดรูปได้สูงสุด ${DFR_MAX} ใบ · ลบใบเก่าออกก่อนนะ`, 2.4); return; }
  const view = typeof currentView !== 'undefined' ? currentView : 'screen', place = view === 'desk' ? 'desk' : 'screen';
  const f = { id: ++dfr.seq, x: place === 'desk' ? 40 + Math.random() * 20 : 60 + Math.random() * 14, y: place === 'desk' ? 30 + Math.random() * 20 : 12 + Math.random() * 18, r: +(Math.random() * 10 - 5).toFixed(1), file: null, cap: '', place, pg: 0, z: dfr.list.length, fresh: true };
  dfr.list.push(f); dfrBuild(); dfr.mode = 'pick'; dfrOpen(f.id, 'pick');
}
/* ---- viewer / picker ---- */
let dfrEl = null;
function dfrOpen(id, mode) {
  dfr.sel = id; const f = dfr.list.find(x => x.id === id); if (!f) return; dfr.mode = mode || (dfrSrc(f) ? 'view' : 'pick');
  if (!dfrEl) { dfrEl = h('div', { id: 'dfPanel' }); document.body.append(dfrEl); dfrEl.addEventListener('click', dfrClick); dfrEl.addEventListener('change', dfrChange); dfrEl.addEventListener('input', e => { if (e.target.id === 'dfCap') { const g = dfr.list.find(x => x.id === dfr.sel); if (g) { g.cap = e.target.value.slice(0, 24); dfrBuild(); } } }); }
  dfrRender();
}
function dfrClose() { const f = dfr.list.find(x => x.id === dfr.sel); if (f && !dfrSrc(f)) { dfr.list.splice(dfr.list.indexOf(f), 1); dfrBuild(); } else if (f) delete f.fresh; dfrEl?.remove(); dfrEl = null; }
const dfrPics = () => FILES.filter(f => f.src && f.loc !== 'trash' && /^(png|jpg)$/.test(f.type));
function dfrRender() {
  if (!dfrEl) return; const f = dfr.list.find(x => x.id === dfr.sel); if (!f) return dfrClose(); const cur = dfrSrc(f);
  if (dfr.mode === 'pick' || !cur) {
    const pics = dfrPics();
    dfrEl.innerHTML = `<div class="dfp"><button class="dfx" data-d="x">✕</button><h3>🖼️ เลือกรูปสำหรับโพลารอยด์</h3>
    <div class="dfrow"><label class="btn2 pri dfup">📱 เลือกรูปจากเครื่อง / ถ่ายด้วยโทรศัพท์<input type="file" accept="image/*" hidden id="dfFile"></label><button class="btn2" data-d="search">🔎 หารูปในเสิร์ชน้อย</button></div>
    <p class="soft">หรือเลือกจากรูปที่มีในเกม (รูปภาพ · ที่โหลดจากเสิร์ชน้อย · รูปจากแคปน้อย)</p>
    <div class="dfg">${pics.map(p => `<button class="${p.id === f.file ? 'on' : ''}" data-d="pick" data-id="${esc(p.id)}" title="${esc(p.name)}"><img src="${esc(p.src)}" alt="" loading="lazy"></button>`).join('') || '<span class="soft">ยังไม่มีรูปในเกม</span>'}</div>
    <div class="dfrow">${cur ? '<button class="btn2" data-d="back">← กลับ</button>' : ''}<button class="btn2" data-d="x">${cur ? 'เสร็จ' : 'ยกเลิก'}</button></div></div>`; return;
  }
  const nbp = f.place === 'nb' ? f.pg : nbPage;
  dfrEl.innerHTML = `<div class="dfv"><div class="dfbig"><div class="dfr big"><i class="tape"></i><img src="${esc(cur)}" alt="">${f.cap ? `<b>${esc(f.cap)}</b>` : ''}</div></div>
  <div class="dfside"><button class="dfx" data-d="x">✕</button><h4>🖼️ โพลารอยด์</h4>
    <small>ติดที่</small>${[['desk', '🪑 โต๊ะ'], ['screen', '🖥️ หน้าจอคอม'], ['nb', `📓 สมุดโน้ต หน้า ${nbp + 1}`]].map(([k, t]) => `<button class="${f.place === k ? 'on' : ''}" data-d="place" data-p="${k}">${t}</button>`).join('')}
    <small>ข้อความใต้รูป</small><input id="dfCap" maxlength="24" value="${esc(f.cap || '')}" placeholder="เช่น ทริปทะเล 🌊">
    <button data-d="change">🔄 เปลี่ยนรูป</button><button data-d="front">⬆️ วางทับบนสุด</button><button class="rm" data-d="del">🗑️ เอารูปนี้ออก</button><button class="pri" data-d="x">เสร็จ</button>
    <p class="soft">💡 ลากรูปเพื่อย้าย · ติดได้หลายใบ</p></div></div>`;
}
function dfrSet(f, fileId) { f.file = fileId; delete f.fresh; dfr.mode = 'view'; dfrBuild(); dfrRender(); S.tone(700, 1000, .08, .06, 'triangle'); S.toast('🖼️ ติดรูปแล้ว (ลากเพื่อย้ายได้ · ติดได้หลายใบ)', 2.2); try { complete('n12frame'); } catch (e) {} }
function dfrPlace(f, p) {
  if (f.place === p && (p !== 'nb' || f.pg === nbPage)) return;
  f.place = p; f.r = +(Math.random() * 8 - 4).toFixed(1);
  if (p === 'desk') { f.x = 40 + Math.random() * 20; f.y = 30 + Math.random() * 20; } else if (p === 'screen') { f.x = 62 + Math.random() * 14; f.y = 12 + Math.random() * 16; } else { f.pg = nbPage; f.x = 52 + Math.random() * 10; f.y = 8 + Math.random() * 6; }
  dfrBuild(); dfrRender(); S.tone(700, 1000, .08, .06, 'triangle');
  S.toast(p === 'desk' ? '🪑 วางบนโต๊ะแล้ว' : p === 'screen' ? '🖥️ ติดที่หน้าจอคอมแล้ว (ปิดหน้านี้แล้วลากย้ายได้)' : `📓 ติดที่สมุดโน้ต หน้า ${f.pg + 1} แล้ว (เปิดสมุด เลือก “พิมพ์/ย้ายรูป” เพื่อลากย้าย)`, 3);
  if (p !== 'desk') { try { complete('n12stick'); } catch (e) {} }
}
function dfrClick(e) {
  if (e.target === dfrEl) { dfrClose(); return; }
  const b = e.target.closest('[data-d]'); if (!b) return; const a = b.dataset.d, f = dfr.list.find(x => x.id === dfr.sel);
  if (a === 'x') dfrClose();
  else if (a === 'search') { dfrClose(); try { openSearch('img'); } catch (x) { openSearch(); } S.toast('🔎 ค้นรูป กดดาวน์โหลด แล้วกดปุ่ม 🖼️ โพลารอยด์ เพื่อเลือกรูปที่โหลดมา', 3.6); }
  else if (a === 'pick' && f) dfrSet(f, b.dataset.id);
  else if (a === 'back') { dfr.mode = 'view'; dfrRender(); }
  else if (a === 'change') { dfr.mode = 'pick'; dfrRender(); }
  else if (a === 'place' && f) dfrPlace(f, b.dataset.p);
  else if (a === 'front' && f) { f.z = Math.max(0, ...dfr.list.map(x => x.z || 0)) + 1; dfrBuild(); S.tone(600, 800, .05, .04); }
  else if (a === 'del' && f) { dfr.list.splice(dfr.list.indexOf(f), 1); dfr.sel = null; dfrBuild(); dfrEl?.remove(); dfrEl = null; S.toast('เอารูปออกแล้ว (ไฟล์ยังอยู่ในโฟลเดอร์ “รูปภาพ”)', 2); }
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
/* ---- button next to the post-it button ---- */
{ const b = h('button', { class: 'notebtn', id: 'dfBtn', title: 'ติดรูปโพลารอยด์' }, '🖼️<span class="bl"> โพลารอยด์</span>'); const nb = $('noteBtn'); if (nb && nb.parentElement) nb.parentElement.insertBefore(b, nb.nextSibling); b.addEventListener('click', dfrNew); }
/* ---- notebook pages ---- */
const _onb = openNotebook;
openNotebook = function () { _onb(); try { dfrBuild(); const t = ov.querySelector('[data-tool="type"] small'); if (t) t.textContent = 'คีย์บอร์ด/ย้ายรูป'; } catch (e) { console.error(e); } };
dfrBuild();
const _snap9 = snapshot; snapshot = () => ({ ..._snap9(), dfr: { list: dfr.list, seq: dfr.seq } });
const _load9 = loadGame;
loadGame = function () { const ok = _load9(); if (ok) { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.dfr && s.dfr.list) { dfr.list = s.dfr.list.filter(f => f.file); dfr.seq = Math.max(s.dfr.seq || 0, ...dfr.list.map(f => f.id), 0); } } catch (e) {} dfrBuild(); } return ok; };
