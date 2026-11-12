// Chess AI worker: searches off the main thread so the board keeps animating.
import { search } from '../lib/chess.js?v=2';
self.onmessage = e => {
  const { st, level, id } = e.data;
  const t0 = performance.now(), move = search(st, level);
  // never answer instantly: a short think pause feels more natural
  const wait = Math.max(0, [500, 700, 400][level] - (performance.now() - t0));
  setTimeout(() => self.postMessage({ id, move }), wait);
};
