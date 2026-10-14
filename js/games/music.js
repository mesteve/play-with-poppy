/* ================= Music ================= */
(() => {
'use strict';
const screen = addScreen('music', `
<div id="mPoppy"></div>
<button class="round song" id="songBtn" aria-label="Play a song">
  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>
</button>
<div class="xylo" id="xylo"><div class="rail r1"></div><div class="rail r2"></div></div>
`);

const mPoppy = makePoppy($('#mPoppy'), 'idle');
const NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
const HUES = [0, 28, 46, 130, 175, 212, 250, 295];
const xylo = $('#xylo'), songBtn = $('#songBtn');
const bars = [];
let danceTimer = null, songTok = 0;
HUES.forEach((h, i) => {
  const b = document.createElement('button');
  b.className = 'bar';
  b.style.setProperty('--h', h);
  b.style.setProperty('--hgt', 100 - i * 5 + '%');
  b.setAttribute('aria-label', 'Note ' + (i + 1));
  b.addEventListener('pointerdown', e => { e.preventDefault(); playBar(i); });
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); playBar(i); } });
  xylo.appendChild(b);
  bars.push(b);
});
function playBar(i) {
  sfx.note(NOTES[i]);
  const b = bars[i];
  b.classList.add('hit');
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('hit'), 160);
  const p = pointIn(b, 0.5, 0);
  floatNote(p.x, p.y, `hsl(${HUES[i]},85%,55%)`);
  mPoppy.classList.add('dance');
  clearTimeout(danceTimer); danceTimer = setTimeout(() => mPoppy.classList.remove('dance'), 700);
}
// Twinkle Twinkle Little Star (traditional melody): [bar, beats]
const TWINKLE = [[0,1],[0,1],[4,1],[4,1],[5,1],[5,1],[4,2],[3,1],[3,1],[2,1],[2,1],[1,1],[1,1],[0,2],
  [4,1],[4,1],[3,1],[3,1],[2,1],[2,1],[1,2],[4,1],[4,1],[3,1],[3,1],[2,1],[2,1],[1,2],
  [0,1],[0,1],[4,1],[4,1],[5,1],[5,1],[4,2],[3,1],[3,1],[2,1],[2,1],[1,1],[1,1],[0,2]];
songBtn.addEventListener('click', () => {
  if (songBtn.classList.contains('playing')) return;
  const tok = ++songTok;
  songBtn.classList.add('playing');
  let i = 0;
  const step = () => {
    if (tok !== songTok) return;
    if (i >= TWINKLE.length) {
      songBtn.classList.remove('playing');
      jump(mPoppy);
      say('Yay! Now you play!');
      return;
    }
    const [n, beats] = TWINKLE[i++];
    playBar(n);
    setTimeout(step, 430 * beats);
  };
  step();
});
function startMusic() { say("Let's make music! Tap the colors!"); }
function stopMusic() { songTok++; songBtn.classList.remove('playing'); mPoppy.classList.remove('dance'); }

registerGame({
  id: 'music', label: 'Music', say: 'Music!', cardClass: 'c-music',
  icon: `<svg viewBox="0 0 100 100">
    <rect x="12" y="42" width="17" height="48" rx="5" fill="#ff5d5d"/>
    <rect x="33" y="46" width="17" height="40" rx="5" fill="#ffc93d"/>
    <rect x="54" y="50" width="17" height="32" rx="5" fill="#5ccf6a"/>
    <rect x="75" y="54" width="17" height="24" rx="5" fill="#4d9dff"/>
    <ellipse cx="56" cy="30" rx="8" ry="6" fill="#7d6bff" transform="rotate(-20 56 30)"/>
    <path d="M63 28V7q9 2 13 10" stroke="#7d6bff" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`,
  start: startMusic, stop: stopMusic,
  /* every key plays a note */
  onKey(e) {
    e.preventDefault();
    if (e.repeat) return;
    const code = e.key.length === 1 ? e.key.toLowerCase().charCodeAt(0) : e.keyCode;
    playBar(code % 8);
  },
  onHide() { songTok++; songBtn.classList.remove('playing'); }
});
})();
