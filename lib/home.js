// Floating "back to the game list" button shared by every game page.
(() => {
  const a = document.createElement('a');
  a.href = '../'; a.className = 'home-btn'; a.textContent = '← หน้าหลัก';
  a.title = 'กลับไปหน้าหลักเพื่อเปลี่ยนเกม';
  const st = document.createElement('style');
  st.textContent = `.home-btn{position:fixed;left:18px;bottom:18px;z-index:9999;font:500 15px "Mitr","Noto Sans Thai",system-ui,sans-serif;color:#3a3245;background:#fff;border:1px solid #e6e0ee;border-radius:999px;padding:9px 16px;text-decoration:none;box-shadow:0 8px 20px -12px rgba(0,0,0,.4);transition:transform .15s}
.home-btn:hover{transform:translateY(-2px)}.home-btn:focus-visible{outline:3px solid #8467e0;outline-offset:2px}`;
  document.head.append(st); document.body.append(a);
})();
