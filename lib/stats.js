// Anonymous usage stats -> Google Sheet via an Apps Script web app (see stats/Code.gs).
// No personal data: a random id kept in this browser, the game name, device type and link latency.
export const ENDPOINT = 'https://script.google.com/macros/s/AKfycbziQmIbQLje9GZ-ESw__QUnngwx_J_pFojNBTZ6CZX-d2MsV4trxivKaAITbwHN_vI/exec'; // <-- paste the Apps Script web-app URL (ends with /exec) here

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
const GAME = game === 'cute-games' ? 'home' : game; // landing page of the site

// 1 session (= 1 visit of a page) = 1 sheet row, updated in place: on enter, every 3 min while playing, on leave.
// Latency samples go to a separate small "rtt" tab, only while a phone is linked.
let actMs = 0, vis = document.hidden ? 0 : Date.now(), ph = 0, curPh = 0; // actMs = time the page was really being played
function post(o) { if (!ENDPOINT) return; try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(o) }); } catch (e) {} }
const flush = () => { if (vis) { const n = Date.now(); actMs += Math.min(n - vis, 6 * 60000); vis = n; } };
const sess = k => post({ k, sid, vid, game: GAME, role, plat: PLAT, act: Math.round(actMs / 6000) / 10, ph });

// link.js registers itself here so heartbeats can report phone count + latency of the phone<->PC link
const NOTRACK = /\/stats\//.test(location.pathname); // the dashboard itself is not a player
const reg = (window.__cgStats = { link: null });
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

function beat() {
  const L = reg.link ? reg.link() : null; curPh = L ? L.phones : 0; ph = Math.max(ph, curPh);
  if (NOTRACK) return;
  flush();
  if (!(vis || curPh)) return; // hidden tab still counts while a phone is linked
  sess('beat');
  if (L && L.rtt) for (const [p, arr] of Object.entries(L.rtt)) {
    if (arr.length) post({ k: 'rtt', vid, sid, game: GAME, plat: p, phones: L.phones, med: Math.round(med(arr)), max: Math.round(Math.max(...arr)), n: arr.length });
  }
}
if (!NOTRACK) sess('start');
addEventListener('visibilitychange', () => { if (NOTRACK) return; flush(); vis = (!document.hidden || curPh) ? Date.now() : 0; });
// leaving the page -> close the session row right away
addEventListener('pagehide', () => { if (NOTRACK) return; flush(); sess('end'); });
setTimeout(beat, 4000);
setInterval(beat, 180000);
