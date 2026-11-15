// Google Apps Script — paste into the sheet: Extensions > Apps Script
// Columns on sheet "log": time(ms) | kind | vid | sid | game | role | plat | phones | rtt_med | rtt_max | rtt_n | ver
const SHEET = 'log';
const KEY = 'ตั้งรหัสของคุณตรงนี้'; // รหัสสำหรับเปิดดูหน้า stats — เปลี่ยนเป็นรหัสที่คุณตั้งเอง
const HEAD = ['time', 'kind', 'vid', 'sid', 'game', 'role', 'plat', 'phones', 'rtt_med', 'rtt_max', 'rtt_n', 'ver'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEAD); s.setFrozenRows(1); }
  if (s.getRange(1, HEAD.length).getValue() !== 'ver') s.getRange(1, HEAD.length).setValue('ver'); // เพิ่มหัวคอลัมน์ ver ให้ชีตเดิมอัตโนมัติ
  return s;
}

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
    if (!Array.isArray(row) || (row.length !== 10 && row.length !== 11)) return ContentService.createTextOutput('bad');
    sheet_().appendRow([Date.now()].concat(row.map(v => String(v).slice(0, 40))));
    CacheService.getScriptCache().remove('sum');
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
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
