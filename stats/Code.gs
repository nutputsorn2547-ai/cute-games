// Google Apps Script — paste into the sheet: Extensions > Apps Script
// Columns on sheet "log": time(ms) | kind | vid | sid | game | role | plat | phones | rtt_med | rtt_max | rtt_n | ver
const SHEET = 'log';
const KEY = 'ตั้งรหัสของคุณตรงนี้'; // รหัสสำหรับเปิดดูหน้า stats — เปลี่ยนเป็นรหัสที่คุณตั้งเอง
const INBOX = 'inbox'; // ข้อความ/ข้อเสนอแนะจากผู้เล่น + ที่ผู้สร้างตอบกลับ
const CHATBOX = 'gamechat'; // แชทตรงจากในเกม (แยกจากกล่องข้อเสนอแนะหน้าแรก)
const HEAD2 = ['time', 'mid', 'vid', 'name', 'from', 'games', 'text'];
const HEAD = ['time', 'kind', 'vid', 'sid', 'game', 'role', 'plat', 'phones', 'rtt_med', 'rtt_max', 'rtt_n', 'ver'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEAD); s.setFrozenRows(1); }
  if (s.getRange(1, HEAD.length).getValue() !== 'ver') s.getRange(1, HEAD.length).setValue('ver'); // เพิ่มหัวคอลัมน์ ver ให้ชีตเดิมอัตโนมัติ
  return s;
}

function inbox_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(INBOX);
  if (!s) { s = ss.insertSheet(INBOX); s.appendRow(HEAD2); s.setFrozenRows(1); }
  return s;
}
function addMsg_(from, mid, vid, name, games, text) { inbox_().appendRow([Date.now(), mid, vid, name, from, JSON.stringify(games || []), text]); }
function inboxRows_(vid) { // ทุกแถวล่าสุด (หรือเฉพาะเครื่องที่ระบุ)
  const s = inbox_(), last = s.getLastRow(), n = Math.min(Math.max(last - 1, 0), 3000);
  const rows = n ? s.getRange(last - n + 1, 1, n, HEAD2.length).getValues() : [];
  return vid ? rows.filter(r => r[2] === vid) : rows;
}
function chat_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(CHATBOX);
  if (!s) { s = ss.insertSheet(CHATBOX); s.appendRow(HEAD2); s.setFrozenRows(1); }
  return s;
}
function addChat_(from, mid, vid, name, text) { chat_().appendRow([Date.now(), mid, vid, name, from, '[]', text]); }
function chatRows_(vid) {
  const s = chat_(), last = s.getLastRow(), n = Math.min(Math.max(last - 1, 0), 3000);
  const rows = n ? s.getRange(last - n + 1, 1, n, HEAD2.length).getValues() : [];
  return vid ? rows.filter(r => r[2] === vid) : rows;
}
const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = JSON.parse(e.postData.contents);
    if (row && row.bump !== undefined) { // ปุ่ม "บังคับรีเฟรช" ในหน้า stats
      if (row.bump !== KEY) return ContentService.createTextOutput('forbidden');
      PropertiesService.getScriptProperties().setProperty('refresh', String(Date.now()));
      return ContentService.createTextOutput('ok');
    }
    if (row && row.msg) { // ผู้เล่นส่งข้อความ/ดาวจากหน้าแรก
      const m = row.msg, vid = String(m.vid || '').slice(0, 40), name = String(m.name || '').trim().slice(0, 30), text = String(m.text || '').slice(0, 600);
      const games = (Array.isArray(m.games) ? m.games : []).slice(0, 20).map(g => ({ g: String(g.g || '').slice(0, 30), n: String(g.n || g.g || '').slice(0, 40), r: Math.max(0, Math.min(5, +g.r || 0)) }));
      if (vid.length < 8 || !name || !games.length || (!text && !games.some(g => g.r))) return ContentService.createTextOutput('bad');
      const c = CacheService.getScriptCache(), k = 'm_' + vid, cnt = +(c.get(k) || 0);
      if (cnt >= 30) return ContentService.createTextOutput('limit'); // กันสแปม: เครื่องละ 30 ข้อความ/ชั่วโมง
      c.put(k, String(cnt + 1), 3600); addMsg_('user', String(m.id || '').slice(0, 20), vid, name, games, text);
      return ContentService.createTextOutput('ok');
    }
    if (row && row.chat) { // ผู้เล่นพิมพ์ในแชท "ผู้สร้างเกม" ในเกม
      const m = row.chat, vid = String(m.vid || '').slice(0, 40), name = String(m.name || '').trim().slice(0, 30), text = String(m.text || '').slice(0, 600);
      if (vid.length < 8 || !name || !text) return ContentService.createTextOutput('bad');
      const c = CacheService.getScriptCache(), k = 'c_' + vid, cnt = +(c.get(k) || 0);
      if (cnt >= 40) return ContentService.createTextOutput('limit');
      c.put(k, String(cnt + 1), 3600); addChat_('user', String(m.id || '').slice(0, 20), vid, name, text);
      return ContentService.createTextOutput('ok');
    }
    if (row && row.chatreply) {
      const r = row.chatreply; if (r.key !== KEY) return ContentService.createTextOutput('forbidden');
      const vid = String(r.vid || '').slice(0, 40), text = String(r.text || '').slice(0, 800);
      if (vid.length < 8 || !text) return ContentService.createTextOutput('bad');
      addChat_('admin', String(r.id || '').slice(0, 20), vid, 'ผู้สร้าง', text);
      return ContentService.createTextOutput('ok');
    }
    if (row && row.reply) { // ผู้สร้างตอบกลับจากหน้า /stats/
      const r = row.reply; if (r.key !== KEY) return ContentService.createTextOutput('forbidden');
      const vid = String(r.vid || '').slice(0, 40), text = String(r.text || '').slice(0, 800);
      if (vid.length < 8 || !text) return ContentService.createTextOutput('bad');
      addMsg_('admin', String(r.id || '').slice(0, 20), vid, 'ผู้สร้าง', [], text);
      return ContentService.createTextOutput('ok');
    }
    if (!Array.isArray(row) || (row.length !== 10 && row.length !== 11)) return ContentService.createTextOutput('bad');
    sheet_().appendRow([Date.now()].concat(row.map(v => String(v).slice(0, 40))));
    CacheService.getScriptCache().remove('sum');
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.inbox !== undefined) return json_(p.inbox === KEY ? { rows: inboxRows_() } : { error: 'key' }); // ผู้สร้างอ่านกล่องข้อความทั้งหมด
  if (p.chatbox !== undefined) return json_(p.chatbox === KEY ? { rows: chatRows_() } : { error: 'key' });
  if (p.chatmine !== undefined) { const v = String(p.chatmine).slice(0, 40); return json_({ rows: v.length >= 8 ? chatRows_(v) : [] }); }
  if (p.mine !== undefined) { const v = String(p.mine).slice(0, 40); return json_({ rows: v.length >= 8 ? inboxRows_(v) : [] }); } // ผู้เล่นอ่านข้อความของเครื่องตัวเอง (รหัสเครื่องเป็นความลับพอสมควร)
  if (e && e.parameter && e.parameter.bump !== undefined) { // ปุ่ม "บังคับรีเฟรช" ในหน้า stats (ส่งเป็น GET เพื่อให้เห็นผลลัพธ์ชัดเจน)
    if (e.parameter.bump !== KEY) return ContentService.createTextOutput(JSON.stringify({ error: 'key' })).setMimeType(ContentService.MimeType.JSON);
    const t = String(Date.now()); const P = PropertiesService.getScriptProperties(); P.setProperty('refresh', t); P.setProperty('refmsg', String(e.parameter.msg || '').slice(0, 300));
    return ContentService.createTextOutput(JSON.stringify({ ok: 1, r: t })).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.r) return ContentService.createTextOutput(JSON.stringify({ r: PropertiesService.getScriptProperties().getProperty('refresh') || '0', m: PropertiesService.getScriptProperties().getProperty('refmsg') || '' })).setMimeType(ContentService.MimeType.JSON); // เกมถามว่ามีคำสั่งรีเฟรชไหม (ไม่ต้องใช้รหัส)
  if (!e || !e.parameter || e.parameter.key !== KEY) return ContentService.createTextOutput(JSON.stringify({ error: 'forbidden' })).setMimeType(ContentService.MimeType.JSON);
  const cache = CacheService.getScriptCache();
  let out = cache.get('sum');
  if (!out) {
    const s = sheet_();
    const last = s.getLastRow();
    const n = Math.min(Math.max(last - 1, 0), 30000);
    const rows = n ? s.getRange(last - n + 1, 1, n, HEAD.length).getValues() : [];
    out = JSON.stringify({ head: HEAD, rows: rows });
    if (out.length < 90000) cache.put('sum', out, 20);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}
