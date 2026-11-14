// Google Apps Script — paste into the sheet: Extensions > Apps Script
// Columns on sheet "log": time(ms) | kind | vid | sid | game | role | plat | phones | rtt_med | rtt_max | rtt_n
const SHEET = 'log';
const HEAD = ['time', 'kind', 'vid', 'sid', 'game', 'role', 'plat', 'phones', 'rtt_med', 'rtt_max', 'rtt_n'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEAD); s.setFrozenRows(1); }
  return s;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = JSON.parse(e.postData.contents);
    if (!Array.isArray(row) || row.length !== 10) return ContentService.createTextOutput('bad');
    sheet_().appendRow([Date.now()].concat(row.map(v => String(v).slice(0, 40))));
    CacheService.getScriptCache().remove('sum');
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}

function doGet() {
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
