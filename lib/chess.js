// Small chess engine: full rules (castling, en passant, promotion, check, mate, stalemate,
// 50-move rule, bare kings) and an alpha-beta search with quiescence and piece-square tables.
// Squares: 0 = a8 ... 7 = h8, 56 = a1 ... 63 = h1. White pieces uppercase, black lowercase, '.' empty.

export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const file = s => s & 7, rank = s => 8 - (s >> 3);
export const sqName = s => 'abcdefgh'[file(s)] + rank(s);
const isW = p => p >= 'A' && p <= 'Z', isB = p => p >= 'a' && p <= 'z';
const colorOf = p => p === '.' ? null : isW(p) ? 'w' : 'b';

export function fromFEN(fen) {
  const [pos, turn, cas, ep, half, full] = fen.split(' ');
  const b = [];
  for (const ch of pos.replace(/\//g, '')) { if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push('.'); else b.push(ch); }
  const epSq = ep === '-' ? -1 : 'abcdefgh'.indexOf(ep[0]) + (8 - +ep[1]) * 8;
  return { b, turn, cas: { K: cas.includes('K'), Q: cas.includes('Q'), k: cas.includes('k'), q: cas.includes('q') }, ep: epSq, half: +half || 0, full: +full || 1, hist: [] };
}
export function key(st) { return st.b.join('') + st.turn + (st.cas.K ? 'K' : '') + (st.cas.Q ? 'Q' : '') + (st.cas.k ? 'k' : '') + (st.cas.q ? 'q' : '') + st.ep; }

const N_OFF = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const K_OFF = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const B_DIR = [[-1, -1], [-1, 1], [1, -1], [1, 1]], R_DIR = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const at = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8 ? r * 8 + f : -1; // r = row from top

export function attacked(b, sq, by) { // is square attacked by color `by`
  const r = sq >> 3, f = sq & 7;
  const pawn = by === 'w' ? 'P' : 'p', dr = by === 'w' ? 1 : -1;
  for (const df of [-1, 1]) { const s = at(r + dr, f + df); if (s >= 0 && b[s] === pawn) return true; }
  const kn = by === 'w' ? 'N' : 'n'; for (const [a, c] of N_OFF) { const s = at(r + a, f + c); if (s >= 0 && b[s] === kn) return true; }
  const kg = by === 'w' ? 'K' : 'k'; for (const [a, c] of K_OFF) { const s = at(r + a, f + c); if (s >= 0 && b[s] === kg) return true; }
  const bq = by === 'w' ? 'BQ' : 'bq', rq = by === 'w' ? 'RQ' : 'rq';
  for (const [a, c] of B_DIR) for (let k = 1; k < 8; k++) { const s = at(r + a * k, f + c * k); if (s < 0) break; if (b[s] !== '.') { if (bq.includes(b[s])) return true; break; } }
  for (const [a, c] of R_DIR) for (let k = 1; k < 8; k++) { const s = at(r + a * k, f + c * k); if (s < 0) break; if (b[s] !== '.') { if (rq.includes(b[s])) return true; break; } }
  return false;
}
export function inCheck(st, color = st.turn) {
  const k = st.b.indexOf(color === 'w' ? 'K' : 'k');
  return k >= 0 && attacked(st.b, k, color === 'w' ? 'b' : 'w');
}

function pseudo(st, capsOnly = false) {
  const { b, turn } = st, out = [], mine = turn === 'w' ? isW : isB, opp = turn === 'w' ? 'b' : 'w';
  const add = (from, to, extra) => { const cap = b[to]; if (capsOnly && cap === '.' && !(extra && (extra.ep || extra.promo))) return; out.push({ from, to, piece: b[from], cap, ...extra }); };
  for (let s = 0; s < 64; s++) {
    const p = b[s]; if (p === '.' || !mine(p)) continue;
    const r = s >> 3, f = s & 7, P = p.toUpperCase();
    if (P === 'P') {
      const dr = turn === 'w' ? -1 : 1, startR = turn === 'w' ? 6 : 1, lastR = turn === 'w' ? 0 : 7;
      const one = at(r + dr, f);
      if (one >= 0 && b[one] === '.') {
        if (r + dr === lastR) add(s, one, { promo: turn === 'w' ? 'Q' : 'q' });
        else { if (!capsOnly) add(s, one); const two = at(r + 2 * dr, f); if (r === startR && b[two] === '.' && !capsOnly) add(s, two, { double: true }); }
      }
      for (const df of [-1, 1]) {
        const t = at(r + dr, f + df); if (t < 0) continue;
        if (b[t] !== '.' && colorOf(b[t]) === opp) add(s, t, r + dr === lastR ? { promo: turn === 'w' ? 'Q' : 'q' } : undefined);
        else if (t === st.ep) add(s, t, { ep: true });
      }
    } else if (P === 'N' || P === 'K') {
      for (const [a, c] of P === 'N' ? N_OFF : K_OFF) { const t = at(r + a, f + c); if (t >= 0 && (b[t] === '.' || colorOf(b[t]) === opp)) add(s, t); }
      if (P === 'K' && !capsOnly) {
        const home = turn === 'w' ? 60 : 4;
        if (s === home && !attacked(b, s, opp)) {
          const ks = turn === 'w' ? st.cas.K : st.cas.k, qs = turn === 'w' ? st.cas.Q : st.cas.q;
          if (ks && b[s + 1] === '.' && b[s + 2] === '.' && !attacked(b, s + 1, opp) && !attacked(b, s + 2, opp)) add(s, s + 2, { castle: 'K' });
          if (qs && b[s - 1] === '.' && b[s - 2] === '.' && b[s - 3] === '.' && !attacked(b, s - 1, opp) && !attacked(b, s - 2, opp)) add(s, s - 2, { castle: 'Q' });
        }
      }
    } else {
      const dirs = P === 'B' ? B_DIR : P === 'R' ? R_DIR : [...B_DIR, ...R_DIR];
      for (const [a, c] of dirs) for (let k = 1; k < 8; k++) { const t = at(r + a * k, f + c * k); if (t < 0) break; if (b[t] === '.') add(s, t); else { if (colorOf(b[t]) === opp) add(s, t); break; } }
    }
  }
  return out;
}
export function makeMove(st, m) {
  const b = st.b.slice(), turn = st.turn, opp = turn === 'w' ? 'b' : 'w';
  b[m.to] = m.promo || b[m.from]; b[m.from] = '.';
  if (m.ep) b[m.to + (turn === 'w' ? 8 : -8)] = '.';
  if (m.castle === 'K') { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = '.'; }
  if (m.castle === 'Q') { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = '.'; }
  const cas = { ...st.cas };
  const touch = s => { if (s === 60) cas.K = cas.Q = false; if (s === 4) cas.k = cas.q = false; if (s === 63) cas.K = false; if (s === 56) cas.Q = false; if (s === 7) cas.k = false; if (s === 0) cas.q = false; };
  touch(m.from); touch(m.to);
  const reset = m.piece.toUpperCase() === 'P' || m.cap !== '.' || m.ep;
  return { b, turn: opp, cas, ep: m.double ? (m.from + m.to) / 2 : -1, half: reset ? 0 : st.half + 1, full: st.full + (turn === 'b' ? 1 : 0), hist: st.hist };
}
export function legalMoves(st, capsOnly = false) {
  return pseudo(st, capsOnly).filter(m => !inCheck(makeMove(st, m), st.turn));
}
/** 'checkmate' | 'stalemate' | 'fifty' | 'material' | 'repetition' | null */
export function outcome(st, repeats = 0) {
  const moves = legalMoves(st);
  if (!moves.length) return inCheck(st) ? 'checkmate' : 'stalemate';
  if (st.half >= 100) return 'fifty';
  const rest = st.b.filter(p => p !== '.' && p.toUpperCase() !== 'K');
  if (!rest.length || (rest.length === 1 && 'NBnb'.includes(rest[0]))) return 'material';
  if (repeats >= 3) return 'repetition';
  return null;
}
export function san(st, m) {
  const P = m.piece.toUpperCase();
  if (m.castle) return m.castle === 'K' ? 'O-O' : 'O-O-O';
  let s = (P === 'P' ? (m.cap !== '.' || m.ep ? 'abcdefgh'[file(m.from)] : '') : P) + (m.cap !== '.' || m.ep ? 'x' : '') + sqName(m.to) + (m.promo ? '=Q' : '');
  const nx = makeMove(st, m); if (inCheck(nx)) s += legalMoves(nx).length ? '+' : '#';
  return s;
}

/* ---------------- evaluation & search ---------------- */
const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
// piece-square tables from white's point of view, index 0 = a8
const PST = {
  P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};
export function evaluate(st) { // from the side to move
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = st.b[i]; if (p === '.') continue;
    const P = p.toUpperCase(), v = VAL[P] + PST[P][isW(p) ? i : (7 - (i >> 3)) * 8 + (i & 7)];
    s += isW(p) ? v : -v;
  }
  return st.turn === 'w' ? s : -s;
}
const order = ms => ms.sort((a, c) => ((c.cap !== '.' ? VAL[c.cap.toUpperCase()] * 10 - VAL[c.piece.toUpperCase()] : 0) + (c.promo ? 800 : 0)) - ((a.cap !== '.' ? VAL[a.cap.toUpperCase()] * 10 - VAL[a.piece.toUpperCase()] : 0) + (a.promo ? 800 : 0)));
let nodes = 0, deadline = 0, stop = false;
function quiesce(st, alpha, beta, qd = 0) {
  if ((++nodes & 1023) === 0 && performance.now() > deadline) stop = true;
  const stand = evaluate(st);
  if (stand >= beta) return beta; if (alpha < stand) alpha = stand;
  if (qd > 6) return alpha;
  for (const m of order(legalMoves(st, true))) {
    const sc = -quiesce(makeMove(st, m), -beta, -alpha, qd + 1);
    if (stop) return alpha;
    if (sc >= beta) return beta; if (sc > alpha) alpha = sc;
  }
  return alpha;
}
function negamax(st, depth, alpha, beta, ply) {
  if ((++nodes & 1023) === 0 && performance.now() > deadline) stop = true;
  if (depth === 0) return quiesce(st, alpha, beta);
  const moves = order(legalMoves(st));
  if (!moves.length) return inCheck(st) ? -100000 + ply : 0;
  if (st.half >= 100) return 0;
  for (const m of moves) {
    const sc = -negamax(makeMove(st, m), depth - 1, -beta, -alpha, ply + 1);
    if (stop) return alpha;
    if (sc >= beta) return beta;
    if (sc > alpha) alpha = sc;
  }
  return alpha;
}
/** level 0 easy, 1 medium, 2 hard. Returns a legal move. */
export function search(st, level = 1) {
  const moves = order(legalMoves(st)); if (!moves.length) return null;
  if (level === 0 && Math.random() < .35) return moves[Math.floor(Math.random() * moves.length)];
  const maxDepth = [1, 2, 5][level], budget = [150, 600, 1800][level];
  deadline = performance.now() + budget; stop = false; nodes = 0;
  let best = moves[0], bestScore = -Infinity;
  for (let d = 1; d <= maxDepth; d++) {
    let curBest = null, curScore = -Infinity, alpha = -Infinity;
    // search the previous best first
    const list = [best, ...moves.filter(m => m !== best)];
    for (const m of list) {
      // easy/medium search every root move with a full window so the small random bonus is added to exact scores
      // (with a narrowed window the other moves only return bounds, and noise on a bound picks bad moves)
      const exact = level < 2, raw = -negamax(makeMove(st, m), d - 1, -Infinity, exact ? Infinity : -alpha, 1);
      const sc = raw + (level === 0 ? Math.random() * 60 : level === 1 ? Math.random() * 12 : 0);
      if (stop) break;
      if (sc > curScore) { curScore = sc; curBest = m; }
      if (sc > alpha) alpha = sc;
    }
    if (stop && !curBest) break;
    if (curBest) { best = curBest; bestScore = curScore; }
    if (stop || bestScore > 90000) break;
  }
  return best;
}
