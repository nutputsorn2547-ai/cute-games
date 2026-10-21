// Phone <-> PC link over WebRTC (PeerJS public signalling server).
// The PC page "hosts" a short room code; the phone page joins it.
import './peerjs.min.js'; // defines window.Peer

const PREFIX = 'cutegames-v1-';
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const makeCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

/**
 * Host a room on the PC.
 * @param {{game:string, onData:(d:any)=>void, onStatus:(s:{state:string,code?:string,padUrl?:string,phones:number})=>void}} o
 */
export function hostRoom({ game, onData, onStatus }) {
  const conns = new Set();
  let peer = null, code = null;
  const padUrl = c => new URL(`../pad.html?room=${c}&game=${encodeURIComponent(game)}`, location.href).href;
  const status = state => onStatus({ state, code, padUrl: code && padUrl(code), phones: conns.size });

  function open(tries = 0) {
    code = makeCode();
    peer = new window.Peer(PREFIX + code);
    status('connecting');
    peer.on('open', () => status('ready'));
    peer.on('connection', conn => {
      conn.on('open', () => { conns.add(conn); conn.send({ hello: game }); status('ready'); });
      conn.on('data', d => onData(d));
      const drop = () => { conns.delete(conn); status('ready'); };
      conn.on('close', drop); conn.on('error', drop);
    });
    peer.on('disconnected', () => { status('reconnecting'); setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
    peer.on('error', err => {
      if (err.type === 'unavailable-id' && tries < 5) { peer.destroy(); open(tries + 1); return; }
      if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') status('offline');
    });
  }
  open();
  return {
    send(obj) { for (const c of conns) { try { c.open && c.send(obj); } catch (e) {} } },
    get phones() { return conns.size; },
  };
}

/** Join a room from the phone. */
export function joinRoom({ code, onData, onStatus }) {
  let peer = null, conn = null, closed = false;
  function connect() {
    if (closed) return;
    onStatus('connecting');
    if (!peer || peer.destroyed) {
      peer = new window.Peer();
      peer.on('open', dial);
      peer.on('error', err => { onStatus(err.type === 'peer-unavailable' ? 'no-room' : 'error'); setTimeout(retry, 2000); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
    } else dial();
  }
  function dial() {
    conn = peer.connect(PREFIX + code, { serialization: 'json' });
    conn.on('open', () => onStatus('connected'));
    conn.on('data', d => onData(d));
    conn.on('close', () => { onStatus('lost'); setTimeout(retry, 1200); });
  }
  function retry() { if (!conn || !conn.open) connect(); }
  connect();
  return {
    send(obj) { if (conn && conn.open) { try { conn.send(obj); return true; } catch (e) {} } return false; },
    get open() { return !!(conn && conn.open); },
    close() { closed = true; try { peer && peer.destroy(); } catch (e) {} },
  };
}
