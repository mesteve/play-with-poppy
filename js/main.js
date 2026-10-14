/* Play with Poppy: start screen, game menu, navigation and the top-bar buttons.
   Loaded last, after js/core.js and every file in js/games/. */
'use strict';
(() => {
const startPoppy = makePoppy($('#startPoppy'), 'idle wave');
const menuPoppy = makePoppy($('#menuPoppy'), 'idle wave');

/* ================= Menu cards (one per registered game) ================= */
const cards = $('#cards');
let lastHover = 0;
GAMES.forEach(g => {
  const card = document.createElement('button');
  card.className = 'card ' + g.cardClass;
  card.innerHTML = `${g.icon}<span>${g.label}</span>`;
  card.addEventListener('click', () => { sfx.tap(); go(g.id); });
  card.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    const now = Date.now();
    if (now - lastHover < 900) return;
    lastHover = now; say(g.say);
  });
  cards.appendChild(card);
});

/* ================= Navigation ================= */
const homeBtn = $('#homeBtn');
const gameById = id => GAMES.find(g => g.id === id);
let menuVisits = 0;
function go(name) {
  const leaving = gameById(NAV.current);
  if (leaving) leaving.stop();
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === name));
  homeBtn.hidden = name === 'start' || name === 'menu';
  NAV.current = name;
  if (name === 'menu') say(menuVisits++ === 0 ? "Hi! I'm Poppy! What shall we play?" : 'What shall we play next?');
  const entering = gameById(name);
  if (entering) entering.start();
}
$('#playBtn').addEventListener('click', () => { ensureAudio(); sfx.chime(); go('menu'); });
/* a game can handle Home itself (e.g. go back to its own map) by returning true */
homeBtn.addEventListener('click', () => {
  sfx.tap();
  const g = gameById(NAV.current);
  if (!(g && g.onHome && g.onHome())) go('menu');
});

/* ================= Sound + fullscreen buttons ================= */
const soundBtn = $('#soundBtn');
function renderSound() { soundBtn.innerHTML = soundOn ? ICON_ON : ICON_OFF; if (master) master.gain.value = soundOn ? 0.7 : 0; }
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem('poppy-sound', soundOn ? 'on' : 'off'); } catch (e) {}
  if (!soundOn && canSpeak) { try { speechSynthesis.cancel(); } catch (e) {} }
  renderSound();
  if (soundOn) sfx.tap();
});
renderSound();
const fsBtn = $('#fsBtn');
if (!document.fullscreenEnabled) fsBtn.hidden = true;
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
});

/* ================= Keyboard mashing welcome ================= */
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab' || e.key === 'Escape') return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('button')) return;
  ensureAudio();
  const g = gameById(NAV.current);
  if (g && g.onKey) g.onKey(e);
});

/* Unlock audio on any touch or click; quiet things down if the tab is hidden */
document.addEventListener('pointerdown', ensureAudio, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  GAMES.forEach(g => g.onHide && g.onHide());
  if (canSpeak) { try { speechSynthesis.cancel(); } catch (e) {} }
});
document.addEventListener('contextmenu', e => e.preventDefault());
})();
