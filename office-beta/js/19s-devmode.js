"use strict";
// Office game (BETA ONLY) — developer / test mode.
// Open the calculator and type  ++8424--++  to get a test panel: switch career, switch position, force protection / lunch, look at new systems.
// Later stages register their viewers with CG.Dev.add(title, render) (e.g. trophies in S2).
(() => {
  const CG = window.CG; if (!CG) return;
  const CODE = '++8424--++', KEY = 'cg-beta-dev';
  const Dev = CG.Dev = { secs: [], on: false, add: (title, render) => { Dev.secs.push({ title, render }); } };
  try { Dev.on = localStorage.getItem(KEY) === '1'; } catch (e) {}

  const mapKey = k => ({ '*': '×', '/': '÷', Enter: '=', Backspace: '⌫' }[k] || k);
  let buf = '';
  const feed = k => {
    if (!k || k.length > 1 && k !== '−') return; buf = (buf + (k === '−' ? '-' : k)).slice(-CODE.length);
    if (buf === CODE) { buf = ''; enter(); }
  };
  const _openCalc = openCalc;
  openCalc = function () {
    _openCalc.apply(this, arguments);
    const W = wins.get('calc'), root = W && W.body && W.body.firstChild; if (!root || root.dataset.devHook) return; root.dataset.devHook = 1;
    root.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) feed(b.dataset.k); }, true);
    root.addEventListener('keydown', e => feed(mapKey(e.key)), true);
  };

  function enter() {
    Dev.on = true; try { localStorage.setItem(KEY, '1'); } catch (e) {}
    S.big('🛠️ โหมดผู้พัฒนา เปิดแล้ว', 2, '#6c63ff'); fab(); openPanel();
  }
  function fab() {
    if (!Dev.on || $('devFab')) return;
    const b = h('button', { id: 'devFab', title: 'โหมดผู้พัฒนา (เฉพาะเบต้า)' }, '🛠️'); b.onclick = openPanel; document.body.append(b);
  }
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tri = v => v === null ? 'อัตโนมัติ' : v ? 'บังคับเปิด' : 'บังคับปิด';
  const next = v => v === null ? true : v === true ? false : null;

  function openPanel() {
    if (wins.has('dev')) { focusWin(wins.get('dev')); render(); return; }
    openWin('dev', '🛠️ โหมดผู้พัฒนา (เบต้า)', h('div', { class: 'devp' }), 400, 540, '#f4f2ff'); render();
    const root = wins.get('dev').body.firstChild;
    root.addEventListener('click', act); root.addEventListener('change', e => { if (e.target.id === 'devPos') root.dataset.pos = e.target.value; });
  }
  function render() {
    const W = wins.get('dev'); if (!W) return; const root = W.body.firstChild, pos = root.dataset.pos || JOBS[0]?.id;
    const p = CG.prot?.info?.() || {}, curJob = career.cur && JOBS.find(j => j.id === career.cur);
    root.innerHTML = `
    <h4>ตอนนี้</h4><p>อาชีพ: <b>${esc2(careerOf().label)}</b> · ตำแหน่ง: <b>${esc2(curJob ? curJob.pos : (careerOf().pos || careerOf().label))}</b> · บริษัท: ${esc2(curJob ? curJob.co : careerOf().co)}<br>วันที่ในเกม #${CG.diag ? '' : ''}${Math.round((dayStart(gnow()) - dayStart(T0)) / DAY)} · ${gnow().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
    <h4>เปลี่ยนอาชีพ</h4><div class="dg">${CAREER_ORDER.map(id => `<button data-a="career" data-id="${id}" class="${career.id === id ? 'on' : ''}">${CAREERS[id].e} ${esc2(CAREERS[id].label)}</button>`).join('')}</div>
    <h4>เปลี่ยนตำแหน่งงาน</h4><select id="devPos">${JOBS.map(j => `<option value="${j.id}" ${j.id === pos ? 'selected' : ''}>${j.e} ${esc2(j.pos)} · ${esc2(j.co)}</option>`).join('')}</select> <button data-a="job">ย้ายไปตำแหน่งนี้</button>
    <h4>ทดสอบระบบ S1</h4>
    <p>ช่วงคุ้มครองมือใหม่: <b>${p.active ? 'ทำงานอยู่ (เหลือ ' + p.left + ' วัน)' : 'หมดแล้ว'}</b> <button data-a="prot">โหมด: ${tri(CG.prot.force)}</button></p>
    <p>พักเที่ยง 12:00–13:00: <b>${CG.lunch.on() ? 'กำลังพัก' : 'ไม่ใช่เวลาพัก'}</b> <button data-a="lunch">โหมด: ${tri(CG.lunch.force)}</button></p>
    <h4>เปิดดูสิ่งที่อัปเดต</h4><div id="devSecs">${Dev.secs.length ? '' : '<p class="soft">ยังไม่มี (ถ้วยรางวัล/เกียรติบัตร ฯลฯ จะมาตอนขั้น S2–S4)</p>'}</div>
    <h4>ข้อมูลระบบ</h4><button data-a="diag">ดู CG.diag()</button><pre id="devDiag" style="white-space:pre-wrap;font-size:10px;max-height:140px;overflow:auto"></pre>
    <p style="margin-top:8px"><button data-a="off">ปิดโหมดผู้พัฒนา</button></p>`;
    const box = root.querySelector('#devSecs'); Dev.secs.forEach(s => { const d = h('div', { class: 'dsec' }); d.append(h('h5', {}, s.title)); try { s.render(d); } catch (e) { d.append('error: ' + e.message); } box.append(d); });
  }
  function act(e) {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, root = wins.get('dev').body.firstChild;
    if (a === 'career') switchCareer(b.dataset.id);
    else if (a === 'job') { const j = JOBS.find(x => x.id === (root.dataset.pos || JOBS[0]?.id)); if (j) acceptJob(j); }
    else if (a === 'prot') { CG.prot.force = next(CG.prot.force); try { careerChip(); } catch (e2) {} }
    else if (a === 'lunch') CG.lunch.force = next(CG.lunch.force);
    else if (a === 'diag') { root.querySelector('#devDiag').textContent = JSON.stringify(CG.diag?.() || {}, null, 1); return; }
    else if (a === 'off') { Dev.on = false; CG.prot.force = null; CG.lunch.force = null; try { localStorage.removeItem(KEY); } catch (e2) {} $('devFab')?.remove(); closeWin('dev', true); return; }
    render();
  }
  const css = document.createElement('style');
  css.textContent = '#devFab{position:fixed;right:12px;bottom:56px;z-index:60;width:38px;height:38px;border-radius:50%;border:2px solid #6c63ff;background:#fff;font-size:18px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2)}.devp{padding:10px 14px;font-size:12px;overflow:auto;height:100%;box-sizing:border-box}.devp h4{margin:10px 0 4px;color:#4a43c0}.devp .dg{display:flex;flex-wrap:wrap;gap:4px}.devp button{border:1.5px solid #b9b4ff;background:#fff;border-radius:8px;padding:3px 8px;cursor:pointer;font:inherit}.devp button.on{background:#6c63ff;color:#fff}.devp select{max-width:240px}';
  document.head.append(css);
  setTimeout(fab, 800);
})();
