// Anonymous usage stats -> Google Sheet via an Apps Script web app (see stats/Code.gs).
// No personal data: a random id kept in this browser, the game name, device type and link latency.
export const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwSL7CmbSVoXGze64auoc5krWm1NSiWuEhpcmJ4Ec7mzAZvjkk0AcwOf89gnRHc8qfq/exec'; // <-- paste the Apps Script web-app URL (ends with /exec) here

const rid = () => Math.random().toString(36).slice(2, 10);
let vid = '';
try { vid = localStorage.getItem('cg-vid') || ''; if (!vid) { vid = rid() + rid(); localStorage.setItem('cg-vid', vid); } } catch (e) { vid = 'x' + rid(); }
const sid = rid();
const ua = navigator.userAgent || '';
export const PLAT = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios'
  : /Android/i.test(ua) ? 'android' : 'desktop';
const isPad = /pad\.html/.test(location.pathname);
const role = isPad ? 'phone' : 'pc';
const game = isPad ? (new URLSearchParams(location.search).get('game') || 'pad')
  : (location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean).pop() || 'home');

// row = [kind, vid, sid, game, role, plat, phones, rtt_med, rtt_max, rtt_n]
function send(kind, extra = {}) {
  if (!ENDPOINT) return;
  const row = [kind, vid, sid, extra.game || game, extra.role || role, extra.plat || PLAT,
    extra.phones ?? '', extra.med ?? '', extra.max ?? '', extra.n ?? ''];
  try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(row) }); } catch (e) {}
}

// link.js registers itself here so heartbeats can report phone count + latency of the phone<->PC link
const NOTRACK = /\/stats\//.test(location.pathname); // the dashboard itself is not a player
const reg = (window.__cgStats = { link: null });
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

function beat() {
  const L = reg.link ? reg.link() : null;
  if (NOTRACK || (document.hidden && !(L && L.phones))) return; // hidden tab still counts while a phone is linked
  send('hb', { phones: L ? L.phones : '' });
  if (L && L.rtt) for (const [plat, arr] of Object.entries(L.rtt)) {
    if (arr.length) send('rtt', { plat, phones: L.phones, med: Math.round(med(arr)), max: Math.round(Math.max(...arr)), n: arr.length });
  }
}
if (!NOTRACK) send('visit');
// closing / leaving the page -> mark this session as gone right away
addEventListener('pagehide', () => { if (!NOTRACK) send('leave'); });
setTimeout(beat, 4000);
setInterval(beat, 60000);
