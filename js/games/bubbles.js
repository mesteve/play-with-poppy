/* ================= Bubbles ================= */
(() => {
'use strict';
const screen = addScreen('bubbles', `
<div class="tray" id="bTray"></div>
<div id="bPoppy"></div>
<div class="field" id="bField"></div>
`);

const field = $('#bField');
const bPoppy = makePoppy($('#bPoppy'), 'idle');
const B = { list: [], running: false, tok: 0, last: 0, acc: 0, tray: makeTray($('#bTray'), 10) };
const B_HUES = [200, 170, 280, 330, 40, 120, 10];
const TREATS = ['⭐', '🐟', '🍓', '🌸', '🦆', '🍎', '🐞', '🦋', '🍪'];
const NUM = ['', 'One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten! Hooray!'];

function placeBubble(b) { b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0)`; }
function spawnBubble(cx, cy, size) {
  const W = field.clientWidth, H = field.clientHeight, base = Math.min(W, H);
  const s = size || rand(Math.max(72, base * 0.13), Math.max(104, base * 0.21));
  const el = document.createElement('div');
  el.className = 'bubble';
  const hue = pick(B_HUES);
  el.style.setProperty('--h', hue);
  el.style.width = el.style.height = s + 'px';
  if (Math.random() < 0.4) { const sp = document.createElement('span'); sp.textContent = pick(TREATS); sp.style.fontSize = s * 0.42 + 'px'; el.appendChild(sp); }
  const x0 = cx != null ? cx - s / 2 : rand(8, Math.max(9, W - s - 8));
  const b = { el, s, hue, x0, x: x0, y: cy != null ? cy - s / 2 : H + rand(0, 30), vy: rand(42, 80), amp: rand(8, 26), ph: rand(0, 6.28), t: 0, popped: false };
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); popBubble(b); });
  field.appendChild(el); B.list.push(b); placeBubble(b);
  return b;
}
function popBubble(b) {
  if (b.popped) return;
  b.popped = true;
  sfx.pop();
  const f = field.getBoundingClientRect(), a = app.getBoundingClientRect();
  const cx = f.left - a.left + b.x + b.s / 2, cy = f.top - a.top + b.y + b.s / 2;
  b.el.style.transition = 'transform .18s ease-out, opacity .18s';
  b.el.style.transform += ' scale(1.35)';
  b.el.style.opacity = '0';
  setTimeout(() => b.el.remove(), 220);
  splash(cx, cy, b.hue);
  const c = B.tray.add();
  if (!c) return;
  say(NUM[c]);
  if (c === B.tray.n) {
    sfx.tada(); bigCelebrate(); jump(bPoppy);
    setTimeout(() => { if (NAV.current === 'bubbles') B.tray.reset(); }, 2600);
  } else if (c % 3 === 0) jump(bPoppy);
}
function bubbleLoop(tok, now) {
  if (!B.running || tok !== B.tok) return;
  const dt = Math.min(0.05, (now - B.last) / 1000);
  B.last = now;
  B.acc += dt * 1000;
  const W = field.clientWidth;
  const live = B.list.filter(b => !b.popped).length;
  if (B.acc > 850 && live < (W < 600 ? 6 : 9)) { B.acc = 0; spawnBubble(); }
  for (const b of B.list) {
    if (b.popped) continue;
    b.t += dt;
    b.y -= b.vy * dt;
    b.x = clamp(b.x0 + Math.sin(b.t * 1.3 + b.ph) * b.amp, 0, Math.max(0, W - b.s));
    placeBubble(b);
    if (b.y < -b.s - 20) { b.popped = true; b.el.remove(); }
  }
  B.list = B.list.filter(b => !b.popped);
  requestAnimationFrame(t => bubbleLoop(tok, t));
}
function startBubbles() {
  field.innerHTML = ''; B.list = []; B.tray.reset();
  B.running = true; B.acc = 0; B.last = performance.now();
  const tok = ++B.tok;
  requestAnimationFrame(() => {
    const H = field.clientHeight;
    for (let i = 0; i < 3; i++) { const b = spawnBubble(); b.y = rand(H * 0.45, H * 0.85); placeBubble(b); }
    requestAnimationFrame(t => { B.last = t; bubbleLoop(tok, t); });
  });
  say('Pop the bubbles!');
}
function stopBubbles() { B.running = false; B.tok++; field.innerHTML = ''; B.list = []; }
screen.addEventListener('pointerdown', e => {
  if (e.target.closest('.bubble,.poppy')) return;
  if (B.list.filter(b => !b.popped).length >= 16) return;
  const r = field.getBoundingClientRect();
  spawnBubble(e.clientX - r.left, e.clientY - r.top, rand(64, 84));
  sfx.blip();
});

registerGame({
  id: 'bubbles', label: 'Bubbles', say: 'Bubbles!', cardClass: 'c-bubbles',
  icon: `<svg viewBox="0 0 100 100">
    <circle cx="38" cy="60" r="25" fill="#cfe9ff" stroke="#4d9dff" stroke-width="4"/>
    <circle cx="70" cy="32" r="17" fill="#f3d9ff" stroke="#b46bff" stroke-width="4"/>
    <circle cx="76" cy="74" r="11" fill="#d6fff3" stroke="#2fbf9b" stroke-width="4"/>
    <path d="M24 52a16 16 0 0 1 10-12M62 24a9 9 0 0 1 6-5" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`,
  start: startBubbles, stop: stopBubbles,
  /* any key pops a bubble */
  onKey(e) {
    e.preventDefault();
    if (e.repeat) return;
    const live = B.list.filter(b => !b.popped);
    if (live.length) popBubble(pick(live));
  }
});
})();
