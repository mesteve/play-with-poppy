/* ================= Hide and seek ================= */
(() => {
'use strict';
const screen = addScreen('hide', `
<div class="tray" id="hTray"></div>
<div class="spots" id="spots"></div>
`);

function flower(cx, cy, col) {
  const pts = [[0, -7], [6.66, -2.16], [4.11, 5.66], [-4.11, 5.66], [-6.66, -2.16]];
  return pts.map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="5.5" fill="${col}"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#ffd34d"/>`;
}
const SHADOW = '<ellipse cx="60" cy="96" rx="52" ry="5" fill="rgba(0,0,0,.15)"/>';
const COVERS = [
  { name: 'bush', peek: { right: '-16%', bottom: '22%' }, svg: `<svg viewBox="0 0 120 100">${SHADOW}
    <circle cx="32" cy="64" r="28" fill="#3d9548"/><circle cx="88" cy="64" r="28" fill="#3d9548"/>
    <circle cx="60" cy="48" r="34" fill="#4caf57"/><circle cx="36" cy="72" r="24" fill="#4caf57"/><circle cx="84" cy="72" r="24" fill="#4caf57"/>
    <rect x="12" y="70" width="96" height="26" rx="13" fill="#4caf57"/><circle cx="50" cy="36" r="9" fill="#5cc067"/>
    <circle cx="44" cy="46" r="4.5" fill="#ff6b8a"/><circle cx="78" cy="56" r="4.5" fill="#ff6b8a"/>
    <circle cx="56" cy="78" r="4.5" fill="#ffd34d"/><circle cx="28" cy="62" r="4.5" fill="#ffd34d"/></svg>` },
  { name: 'box', peek: { right: '-16%', bottom: '18%' }, svg: `<svg viewBox="0 0 120 100">${SHADOW}
    <path d="M14 40 2 22H48L60 40Z" fill="#e7b072"/><path d="M106 40 118 22H72L60 40Z" fill="#c78748"/>
    <rect x="14" y="40" width="92" height="56" rx="4" fill="#d89a59"/><rect x="14" y="40" width="92" height="8" fill="#c48644"/>
    <rect x="52" y="48" width="16" height="48" fill="#ecc790" opacity=".85"/>
    <path d="M26 70l8-8 8 8M34 62v16" stroke="#a86f36" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { name: 'pot', peek: { right: '2%', bottom: '6%' }, svg: `<svg viewBox="0 0 120 100"><ellipse cx="60" cy="96" rx="40" ry="5" fill="rgba(0,0,0,.15)"/>
    <path d="M30 38Q26 24 20 16M90 38Q94 24 100 16" stroke="#3d9548" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M28 34Q16 26 10 30Q18 38 28 36Z" fill="#4caf57"/><path d="M92 34Q104 26 110 30Q102 38 92 36Z" fill="#4caf57"/>
    ${flower(20, 14, '#ff7aa8')}${flower(100, 14, '#a77bff')}
    <path d="M30 46H90L82 96H38Z" fill="#d9734a"/><rect x="24" y="34" width="72" height="15" rx="5" fill="#ea8a5e"/>
    <path d="M42 68h36" stroke="#c4633d" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="81" r="4" fill="#c4633d"/></svg>` },
  { name: 'playhouse', peek: { right: '-16%', bottom: '18%' }, svg: `<svg viewBox="0 0 120 100">${SHADOW}
    <rect x="18" y="44" width="84" height="52" rx="3" fill="#ffd166"/>
    <path d="M10 50 60 12 110 50Z" fill="#ef6f6c" stroke="#ef6f6c" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="60" cy="35" r="6" fill="#fff6e8"/>
    <path d="M48 96V74a12 12 0 0 1 24 0V96Z" fill="#9a6440"/><circle cx="67" cy="84" r="2" fill="#ffd166"/>
    <rect x="25" y="58" width="17" height="15" rx="2" fill="#9ad7ff" stroke="#fff" stroke-width="3"/>
    <rect x="78" y="58" width="17" height="15" rx="2" fill="#9ad7ff" stroke="#fff" stroke-width="3"/></svg>` }
];
const TAIL_PEEK = '<svg viewBox="0 0 70 40"><path class="f-fox" d="M0 26C14 6 46 2 70 18C52 38 18 40 0 26Z"/><path class="f-cream" d="M50 9C60 10 66 13 70 18C64 26 58 30 50 31C56 24 56 16 50 9Z"/></svg>';
const spotsEl = $('#spots');
const Hs = { target: -1, wrong: 0, busy: false, timers: [], tray: makeTray($('#hTray'), 5) };
const later = (fn, ms) => { Hs.timers.push(setTimeout(fn, ms)); };
const clearLater = () => { Hs.timers.forEach(clearTimeout); Hs.timers = []; };

function newRound(first) {
  clearLater();
  Hs.busy = false; Hs.wrong = 0;
  if (Hs.tray.count >= Hs.tray.n) Hs.tray.reset();
  Hs.target = Math.floor(Math.random() * 4);
  spotsEl.innerHTML = '';
  shuffle([0, 1, 2, 3]).forEach((ci, i) => {
    const c = COVERS[ci];
    const b = document.createElement('button');
    b.className = 'spot';
    b.setAttribute('aria-label', 'Look behind the ' + c.name);
    b.style.animationDelay = i * 90 + 'ms';
    const hider = document.createElement('div');
    hider.className = 'hider';
    makePoppy(hider, 'idle');
    const peek = document.createElement('div');
    peek.className = 'peek'; peek.innerHTML = TAIL_PEEK;
    peek.style.right = c.peek.right; peek.style.bottom = c.peek.bottom;
    const cover = document.createElement('div');
    cover.className = 'cover'; cover.innerHTML = c.svg;
    b.append(hider, peek, cover);
    b.addEventListener('click', () => tapSpot(i, b));
    spotsEl.appendChild(b);
  });
  later(() => say(first ? "Let's play hide and seek! Can you find me?" : pick(["Where's Poppy?", 'Can you find me?', 'Ready or not!'])), first ? 250 : 400);
  later(showHint, 8000);
}
function showHint() {
  const s = spotsEl.children[Hs.target];
  if (s && !Hs.busy && !s.classList.contains('hint')) { s.classList.add('hint'); sfx.giggle(); }
}
function tapSpot(i, el) {
  if (Hs.busy) return;
  const p = pointIn(el, 0.5, 0.15);
  if (i === Hs.target) {
    Hs.busy = true;
    clearLater();
    el.classList.remove('hint');
    el.classList.add('found');
    setTimeout(() => jump(el.querySelector('.hider')), 250);
    sfx.tada();
    confetti(p.x, p.y, 55);
    const c = Hs.tray.add();
    if (c === Hs.tray.n) {
      say('Hooray! You found me five times!');
      later(bigCelebrate, 400);
      later(() => newRound(false), 4300);
    } else {
      say(pick(['Boo! You found me!', 'You found me!', 'Peekaboo!']));
      later(() => newRound(false), 3000);
    }
  } else {
    Hs.wrong++;
    el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
    sfx.boing();
    critter(p.x, p.y);
    say(Hs.wrong === 1 ? pick(['Not here!', 'Hmm, not there!']) : 'Keep looking!');
    if (Hs.wrong >= 2) showHint();
  }
}
function startHide() { Hs.tray.reset(); newRound(true); }
function stopHide() { clearLater(); }

registerGame({
  id: 'hide', label: 'Hide & seek', say: 'Hide and seek!', cardClass: 'c-hide',
  icon: `<svg viewBox="0 0 100 100">
    <path class="f-fox" d="M30 46 38 16 54 38Z"/><path class="f-fox" d="M70 46 62 16 46 38Z"/>
    <path class="f-ink" opacity=".8" d="M35 40 39 25 47 36Z"/><path class="f-ink" opacity=".8" d="M65 40 61 25 53 36Z"/>
    <ellipse class="f-fox" cx="50" cy="48" rx="24" ry="15"/>
    <ellipse class="f-ink" cx="41" cy="46" rx="3.6" ry="4.6"/><ellipse class="f-ink" cx="59" cy="46" rx="3.6" ry="4.6"/>
    <circle cx="42.2" cy="44.2" r="1.3" fill="#fff"/><circle cx="60.2" cy="44.2" r="1.3" fill="#fff"/>
    <circle cx="26" cy="74" r="20" fill="#3d9548"/><circle cx="74" cy="74" r="20" fill="#3d9548"/>
    <circle cx="50" cy="72" r="21" fill="#4caf57"/><rect x="8" y="72" width="84" height="22" rx="11" fill="#4caf57"/>
    <circle cx="34" cy="80" r="3.5" fill="#ff6b8a"/><circle cx="64" cy="70" r="3.5" fill="#ffd34d"/>
  </svg>`,
  start: startHide, stop: stopHide
});
})();
