/* Play with Poppy: shared building blocks used by every game.
   Loaded first; games in js/games/ register themselves with registerGame(),
   and js/main.js wires up the menu and navigation. */
'use strict';
const $ = s => document.querySelector(s);
const app = $('#app'), fx = $('#fx');
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const COLORS = ['#ff5d5d', '#ffb13d', '#ffd23d', '#5ccf6a', '#3fc7c2', '#4d9dff', '#a77bff', '#ff7ab6'];


/* ================= Sound ================= */
let ctx = null, master = null, soundOn = true;
try { soundOn = localStorage.getItem('poppy-sound') !== 'off'; } catch (e) {}

function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = soundOn ? 0.7 : 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}
function tone(freq, dur = 0.4, type = 'sine', vol = 0.3, when = 0, slideTo = null) {
  if (!ctx || !soundOn) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  pop() { tone(rand(520, 760), 0.16, 'sine', 0.45, 0, 160); tone(1400, 0.05, 'triangle', 0.08); },
  blip() { tone(380, 0.14, 'sine', 0.2, 0, 720); },
  boing() { tone(180, 0.4, 'triangle', 0.35, 0, 480); tone(90, 0.25, 'sine', 0.2); },
  giggle() { [880, 1046, 932, 1175, 988].forEach((f, i) => tone(f, 0.09, 'triangle', 0.18, i * 0.075)); },
  chime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.22, i * 0.09)); },
  tada() { [392, 523.25, 659.25].forEach((f, i) => tone(f, 0.18, 'square', 0.07, i * 0.09)); tone(783.99, 0.7, 'triangle', 0.28, 0.27); tone(1046.5, 0.7, 'sine', 0.14, 0.27); },
  note(f) { tone(f, 1.1, 'sine', 0.38); tone(f * 2, 0.5, 'sine', 0.1); tone(f * 3, 0.18, 'triangle', 0.05); },
  tap() { tone(660, 0.08, 'sine', 0.18, 0, 990); }
};

/* Poppy's voice (uses the browser's built-in speech) */
const canSpeak = 'speechSynthesis' in window;
let voice = null, sayTimer = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    voice = vs.find(v => /samantha|aria|jenny|google us english|zira|karen|moira|tessa|victoria|female/i.test(v.name)) || vs[0] || null;
  } catch (e) {}
}
if (canSpeak) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text) {
  if (!soundOn || !canSpeak) return;
  try {
    clearTimeout(sayTimer);
    speechSynthesis.cancel();
    sayTimer = setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
      u.pitch = 1.45; u.rate = 1.02;
      speechSynthesis.speak(u);
    }, 50);
  } catch (e) {}
}

/* ================= Poppy the fox ================= */
const POPPY_SVG = `<svg viewBox="0 0 200 240" aria-hidden="true"><g class="p-all">
<g class="p-tail"><path class="f-fox" d="M128 196C121.5 167 142.8 133.1 173.9 130.5C182.1 160.6 157.5 192.2 128 196Z"/><path class="f-cream" d="M149.4 140.2Q162.3 129.6 173.9 130.5Q178.6 141.1 173.2 156.8Q164.7 143.6 149.4 140.2Z"/></g>
<ellipse class="f-dark" cx="80" cy="226" rx="17" ry="10"/><ellipse class="f-dark" cx="120" cy="226" rx="17" ry="10"/>
<ellipse class="f-fox" cx="100" cy="186" rx="46" ry="42"/><ellipse class="f-cream" cx="100" cy="197" rx="27" ry="27"/>
<ellipse class="f-dark" cx="60" cy="188" rx="11" ry="21" transform="rotate(16 60 188)"/>
<path class="f-scarf" d="M62 146Q100 168 138 146L140 159Q100 182 60 159Z"/><path class="f-scarf2" d="M110 164L124 194L108 196L100 168Z"/>
<g class="p-head">
<path class="f-fox s-fox" d="M50 76L64 20L98 58Z"/><path class="f-ink" opacity=".8" d="M60 66L67 37L85 58Z"/>
<path class="f-fox s-fox" d="M150 76L136 20L102 58Z"/><path class="f-ink" opacity=".8" d="M140 66L133 37L115 58Z"/>
<ellipse class="f-fox" cx="100" cy="98" rx="58" ry="48"/>
<path class="f-cream" d="M44 102Q60 140 100 143Q140 140 156 102Q128 120 100 113Q72 120 44 102Z"/>
<ellipse class="f-blush" cx="68" cy="122" rx="8" ry="5"/><ellipse class="f-blush" cx="132" cy="122" rx="8" ry="5"/>
<g class="p-eyes"><ellipse class="f-ink" cx="78" cy="92" rx="8" ry="10"/><ellipse class="f-ink" cx="122" cy="92" rx="8" ry="10"/><circle class="f-white" cx="81" cy="88" r="3"/><circle class="f-white" cx="125" cy="88" r="3"/></g>
<ellipse class="f-ink" cx="100" cy="114" rx="9" ry="6.5"/><path class="p-mouth" d="M100 120V124M90 124Q100 133 110 124"/>
</g>
<g class="p-arm"><ellipse class="f-dark" cx="140" cy="188" rx="11" ry="21" transform="rotate(-16 140 188)"/></g>
</g></svg>`;

function makePoppy(el, classes) {
  el.classList.add('poppy');
  classes.split(' ').filter(Boolean).forEach(c => el.classList.add(c));
  el.innerHTML = POPPY_SVG;
  el.addEventListener('pointerdown', e => { e.stopPropagation(); tickle(el); });
  return el;
}
function jump(el) {
  el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump');
  clearTimeout(el._jt); el._jt = setTimeout(() => el.classList.remove('jump'), 1300);
}
function tickle(el) { jump(el); sfx.giggle(); say(pick(['Hee hee!', 'That tickles!', 'Hello!', 'Boop!'])); }


/* ================= Effects ================= */
function pointIn(el, fxp = 0.5, fyp = 0.5) {
  const r = el.getBoundingClientRect(), a = app.getBoundingClientRect();
  return { x: r.left - a.left + r.width * fxp, y: r.top - a.top + r.height * fyp };
}
function confetti(x, y, n = 45) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'confetti';
    const w = rand(8, 14), h = w * rand(0.45, 1);
    Object.assign(d.style, { width: w + 'px', height: h + 'px', left: x + 'px', top: y + 'px', marginLeft: -w / 2 + 'px', marginTop: -h / 2 + 'px', background: pick(COLORS) });
    if (Math.random() < 0.4) d.style.borderRadius = '50%';
    fx.appendChild(d);
    const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05), sp = rand(170, 420);
    const dx = Math.cos(ang) * sp, dy = Math.sin(ang) * sp, rot = rand(-720, 720);
    d.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.75}px,${dy * 0.75}px) rotate(${rot * 0.5}deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px,${dy + 340}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: rand(1200, 1900), easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => d.remove();
  }
}
function bigCelebrate() {
  const r = app.getBoundingClientRect();
  [0.2, 0.5, 0.8].forEach((f, i) => setTimeout(() => confetti(r.width * f, r.height * 0.4, 40), i * 170));
  sfx.chime();
}
function splash(x, y, hue) {
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('div');
    d.className = 'drop';
    const s = rand(6, 12);
    Object.assign(d.style, { width: s + 'px', height: s + 'px', left: x + 'px', top: y + 'px', marginLeft: -s / 2 + 'px', marginTop: -s / 2 + 'px', background: `hsl(${hue},90%,72%)` });
    fx.appendChild(d);
    const a = (i / 10) * Math.PI * 2 + rand(-0.2, 0.2), r = rand(40, 85);
    d.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.3)`, opacity: 0 }
    ], { duration: 450, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
  }
}
const CRITTERS = ['🦋', '🐦', '🐞', '🐸', '🐌', '🐝', '🐛'];
function critter(x, y) {
  const d = document.createElement('div');
  d.className = 'critter';
  d.textContent = pick(CRITTERS);
  d.style.left = x + 'px'; d.style.top = y + 'px';
  fx.appendChild(d);
  const dx = rand(-90, 90);
  d.animate([
    { transform: 'translate(0,0) scale(.3)', opacity: 0 },
    { transform: 'translate(0,-40px) scale(1.15)', opacity: 1, offset: 0.2 },
    { transform: `translate(${dx * 0.5}px,-120px) rotate(${dx > 0 ? 12 : -12}deg)`, opacity: 1, offset: 0.6 },
    { transform: `translate(${dx}px,-220px)`, opacity: 0 }
  ], { duration: 1500, easing: 'ease-out' }).onfinish = () => d.remove();
}
function floatNote(x, y, color) {
  const d = document.createElement('div');
  d.className = 'fnote';
  d.innerHTML = `<svg viewBox="0 0 40 40"><ellipse cx="14" cy="30" rx="8" ry="6" fill="${color}" transform="rotate(-20 14 30)"/><path d="M21 28V6q9 2 13 10" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  d.style.left = x + 'px'; d.style.top = y + 'px';
  fx.appendChild(d);
  const dx = rand(-50, 50);
  d.animate([
    { transform: 'translate(0,0) scale(.6)', opacity: 0 },
    { transform: `translate(${dx * 0.4}px,-50px) scale(1.1) rotate(-10deg)`, opacity: 1, offset: 0.25 },
    { transform: `translate(${dx}px,-170px) scale(1) rotate(10deg)`, opacity: 0 }
  ], { duration: 1300, easing: 'ease-out' }).onfinish = () => d.remove();
}

/* ================= Star trays ================= */
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
function makeTray(el, n) {
  el.style.setProperty('--n', n);
  const slots = [];
  for (let i = 0; i < n; i++) { const s = document.createElement('div'); s.className = 'slot'; s.innerHTML = STAR; el.appendChild(s); slots.push(s); }
  return {
    n, count: 0,
    add() { if (this.count >= n) return null; slots[this.count].classList.add('on'); return ++this.count; },
    reset() { this.count = 0; slots.forEach(s => s.classList.remove('on')); }
  };
}

const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M3.5 9h4l5-4v14l-5-4h-4z"/><path d="M16 9a4 4 0 0 1 0 6M18.6 6.4a7.6 7.6 0 0 1 0 11.2"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M3.5 9h4l5-4v14l-5-4h-4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

/* ================= Shared math bits ================= */
const FRUITS = [
  { e: '🍎', one: 'apple', many: 'apples' }, { e: '🍓', one: 'strawberry', many: 'strawberries' },
  { e: '🍌', one: 'banana', many: 'bananas' }, { e: '🍊', one: 'orange', many: 'oranges' },
  { e: '🥕', one: 'carrot', many: 'carrots' }, { e: '🐟', one: 'fish', many: 'fish' },
  { e: '🍪', one: 'cookie', many: 'cookies' }, { e: '🧁', one: 'cupcake', many: 'cupcakes' },
  { e: '🌸', one: 'flower', many: 'flowers' }, { e: '🐞', one: 'ladybug', many: 'ladybugs' }
];
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const Word = n => WORDS[n][0].toUpperCase() + WORDS[n].slice(1);
const nm = (f, n) => (n === 1 ? f.one : f.many);
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const DICE = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function dotsSVG(n, color = '#ff7a3d') {
  if (n <= 6) return `<svg class="dots" viewBox="0 0 30 30">${DICE[n].map(p => `<circle cx="${5 + (p % 3) * 10}" cy="${5 + Math.floor(p / 3) * 10}" r="3.7" fill="${color}"/>`).join('')}</svg>`;
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${5 + (i % 5) * 10}" cy="${5 + Math.floor(i / 5) * 10}" r="3.7" fill="${color}"/>`;
  return `<svg class="dots" viewBox="0 0 50 20">${s}</svg>`;
}
const ANS_COLORS = [['#ffe1e1', '#f08f8f'], ['#fff1c9', '#e9bf4f'], ['#dcefff', '#7fb8ec']];
const countTone = k => tone(392 * Math.pow(2, (k - 1) / 7), 0.18, 'triangle', 0.25);

/* ================= Games & screens ================= */
const NAV = { current: 'start' };
const GAMES = [];
/* A game calls this once: { id, label, say, cardClass, icon, start, stop, onKey?, onHome?, onHide? } */
function registerGame(game) { GAMES.push(game); }
/* Each game builds its own full-screen section from an HTML string */
function addScreen(id, html) {
  const s = document.createElement('section');
  s.id = id;
  s.className = 'screen';
  s.innerHTML = html;
  app.insertBefore(s, fx);
  return s;
}
/* Saved progress lives in localStorage; storage can be unavailable, so never let it throw */
function loadData(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
}
function saveData(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
