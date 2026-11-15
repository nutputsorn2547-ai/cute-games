// Remote "force refresh": the stats page can ask every open game page to reload (see stats/Code.gs: bump / ?r=1).
import { ENDPOINT } from './stats.js';
if (ENDPOINT) {
  let t0 = null, done = false, msg = '';
  const ask = async () => { try { const j = await (await fetch(ENDPOINT + '?r=1&_=' + Date.now())).json(); msg = String(j.m || ''); return String(j.r); } catch (e) { return null; } };
  const check = async () => {
    if (done) return; const r = await ask(); if (r == null) return;
    if (t0 === null) { t0 = r; return; }
    if (r === t0) return;
    done = true; try { window.saveGame && window.saveGame(); } catch (e) {}
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#1d2036cc;display:flex;align-items:center;justify-content:center;font:16px system-ui,sans-serif;color:#fff;text-align:center;padding:20px';
    el.innerHTML = '<div style="background:#3b2a4d;border-radius:18px;padding:22px 26px;max-width:340px"><div style="font-size:40px">🔄</div><b>มีอัปเดตใหม่!</b><div id="rfmsg" style="margin:8px 0;white-space:pre-wrap;font-size:15px"></div>เซฟเกมให้แล้ว กำลังรีเฟรชหน้า…</div>';
    if (msg) el.querySelector('#rfmsg').textContent = msg; // textContent = ปลอดภัยจากโค้ดแปลกปลอม
    document.body.append(el);
    setTimeout(() => { const u = new URL(location.href); u.searchParams.set('rf', r); location.replace(u.href); }, msg ? 5000 : 2500);
  };
  setTimeout(check, 3000); setInterval(check, 90000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
