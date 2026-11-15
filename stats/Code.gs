// Google Apps Script — วางในชีต: ส่วนขยาย > Apps Script
// แท็บ "sessions": 1 แถว = 1 ครั้งที่เข้าเล่น (อัปเดตทับแถวเดิมตอนเข้า / ระหว่างเล่นทุก 3 นาที / ตอนออก)
//   sid | vid | game | role | plat | start | last | act_min | phones_max | ended
// แท็บ "rtt": แถวความหน่วงของมือถือที่เชื่อม (เพิ่มเฉพาะตอนมีมือถือเชื่อมอยู่ ทุก 3 นาที)
//   time | vid | sid | game | plat | phones | rtt_med | rtt_max | rtt_n
// แท็บ "log" เดิม (แถวต่อนาที) ไม่ใช้แล้ว — รัน migrate() ครั้งเดียวเพื่อย้ายข้อมูลเก่ามาไว้ในรูปแบบใหม่ แล้วลบแท็บ log ทิ้งได้
const KEY = 'ตั้งรหัสของคุณตรงนี้'; // รหัสสำหรับเปิดดูหน้า stats — ใส่รหัสเดิมของคุณ
const S_HEAD = ['sid', 'vid', 'game', 'role', 'plat', 'start', 'last', 'act_min', 'phones_max', 'ended'];
const R_HEAD = ['time', 'vid', 'sid', 'game', 'plat', 'phones', 'rtt_med', 'rtt_max', 'rtt_n'];

function tab_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); }
  return s;
}
const cut_ = v => String(v == null ? '' : v).slice(0, 40);

function rowOf_(s, sid) {
  const cache = CacheService.getScriptCache(), c = cache.get('r' + sid);
  if (c && s.getRange(+c, 1).getValue() === sid) return +c;
  const f = s.getRange(2, 1, Math.max(1, s.getLastRow() - 1), 1).createTextFinder(sid).matchEntireCell(true).findNext();
  if (f) { cache.put('r' + sid, f.getRow(), 21600); return f.getRow(); }
  return 0;
}

function upsert_(p) { // p: {sid, vid, game, role, plat, act, ph, end, inc}
  const s = tab_('sessions', S_HEAD), now = Date.now(), r = rowOf_(s, p.sid);
  if (!r) {
    s.appendRow([p.sid, p.vid, p.game, p.role, p.plat, now, now, +p.act || 0, +p.ph || 0, p.end ? 1 : 0]);
    CacheService.getScriptCache().put('r' + p.sid, s.getLastRow(), 21600);
    return;
  }
  const old = s.getRange(r, 7, 1, 4).getValues()[0]; // last, act_min, phones_max, ended
  const act = p.inc ? (+old[1] || 0) + p.inc : Math.max(+old[1] || 0, +p.act || 0);
  s.getRange(r, 7, 1, 4).setValues([[now, Math.round(act * 10) / 10, Math.max(+old[2] || 0, +p.ph || 0), (p.end || +old[3] === 1) ? 1 : 0]]);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (Array.isArray(d)) { // รูปแบบเก่า (หน้าเกมที่ยังค้างแคช): [kind,vid,sid,game,role,plat,phones,med,max,n]
      if (d.length !== 10) return ContentService.createTextOutput('bad');
      const [kind, vid, sid, game, role, plat, phones, med, max, n] = d.map(cut_);
      if (kind === 'rtt') tab_('rtt', R_HEAD).appendRow([Date.now(), vid, sid, game, plat, phones, med, max, n]);
      else upsert_({ sid, vid, game, role, plat, ph: phones, inc: kind === 'hb' ? 1 : 0, end: kind === 'leave' });
    } else if (d.k === 'rtt') {
      tab_('rtt', R_HEAD).appendRow([Date.now(), cut_(d.vid), cut_(d.sid), cut_(d.game), cut_(d.plat), cut_(d.phones), cut_(d.med), cut_(d.max), cut_(d.n)]);
    } else if (d.sid) {
      upsert_({ sid: cut_(d.sid), vid: cut_(d.vid), game: cut_(d.game), role: cut_(d.role), plat: cut_(d.plat), act: d.act, ph: d.ph, end: d.k === 'end' });
    } else return ContentService.createTextOutput('bad');
    CacheService.getScriptCache().remove('sum');
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== KEY) return ContentService.createTextOutput(JSON.stringify({ error: 'forbidden' })).setMimeType(ContentService.MimeType.JSON);
  const cache = CacheService.getScriptCache();
  let out = cache.get('sum');
  if (!out) {
    const tail = (s, w, max) => { const last = s.getLastRow(), n = Math.min(Math.max(last - 1, 0), max); return n ? s.getRange(last - n + 1, 1, n, w).getValues() : []; };
    out = JSON.stringify({ sessions: tail(tab_('sessions', S_HEAD), S_HEAD.length, 8000), rtt: tail(tab_('rtt', R_HEAD), R_HEAD.length, 20000) });
    if (out.length < 90000) cache.put('sum', out, 20);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

// รันครั้งเดียวด้วยมือ (เลือกฟังก์ชัน migrate > เรียกใช้): แปลงแท็บ "log" เก่าเป็นแท็บ sessions + rtt
function migrate() {
  const old = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log'); if (!old || old.getLastRow() < 2) return;
  const rows = old.getRange(2, 1, old.getLastRow() - 1, 11).getValues(), ses = new Map(), rtt = [];
  for (const [t, kind, vid, sid, game, role, plat, phones, med, max, n] of rows) {
    if (kind === 'rtt') { rtt.push([t, vid, sid, game, plat, phones, med, max, n]); continue; }
    const x = ses.get(sid) || { sid, vid, game, role, plat, start: t, last: t, act: 0, ph: 0, ended: 0 };
    x.start = Math.min(x.start, t); x.last = Math.max(x.last, t);
    if (kind === 'hb') x.act++; if (kind === 'leave') x.ended = 1; x.ph = Math.max(x.ph, +phones || 0); ses.set(sid, x);
  }
  const S = tab_('sessions', S_HEAD), R = tab_('rtt', R_HEAD);
  const sv = [...ses.values()].sort((a, b) => a.start - b.start).map(x => [x.sid, x.vid, x.game, x.role, x.plat, x.start, x.last, x.act, x.ph, x.ended]);
  if (sv.length) S.getRange(S.getLastRow() + 1, 1, sv.length, S_HEAD.length).setValues(sv);
  if (rtt.length) R.getRange(R.getLastRow() + 1, 1, rtt.length, R_HEAD.length).setValues(rtt);
}
