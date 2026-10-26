/* ================= Number path (1 and 2) ================= */
/* One engine, several paths: makeNumberPath() builds a map of stepping stones from a list of levels. */
(() => {
'use strict';
const HARD = { more: { max: 8, fewer: true }, match: { max: 10 }, pattern: { kinds: ['ABC', 'AAB', 'ABB'] }, missing: { max: 10 }, takeaway: { max: 8 }, bigger: { max: 10 } };
/* stones 13-20: the same questions with slightly bigger numbers and longer patterns */
const HARDER = { more: { max: 10, fewer: true }, match: { max: 12 }, pattern: { kinds: ['AABB', 'ABCC', 'ABAC'] }, missing: { max: 15 }, takeaway: { max: 10 }, bigger: { max: 15 } };
const PAT = FRUITS.filter(f => ['🍎', '🍌', '🐟', '🌸', '🥕', '🍪'].includes(f.e));
const CREATURES = [
  { e: '🦆', one: 'duck', many: 'ducks', v1: 'swims away', vn: 'swim away' },
  { e: '🐦', one: 'bird', many: 'birds', v1: 'flies away', vn: 'fly away' },
  { e: '🦋', one: 'butterfly', many: 'butterflies', v1: 'flies away', vn: 'fly away' },
  { e: '🐸', one: 'frog', many: 'frogs', v1: 'hops away', vn: 'hop away' },
  { e: '🐰', one: 'bunny', many: 'bunnies', v1: 'hops away', vn: 'hop away' },
  { e: '🐝', one: 'bee', many: 'bees', v1: 'buzzes away', vn: 'buzz away' }
];
const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z"/></svg>';

function makeNumberPath(cfg) {
const screen = addScreen(cfg.id, `
<div class="pview" data-r="pMapView">
  <div class="pstat" data-r="pStat"></div>
  <div class="pmap" data-r="pMap">
    <svg class="pline" data-r="pLine" aria-hidden="true"></svg>
    <div class="pstones" data-r="pStones"></div>
    <div class="pmappoppy" data-r="pMapPoppy"></div>
  </div>
  <button class="round preset" data-r="pReset" aria-label="Hold to start the path over" title="Grown-ups: hold to start over">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/></svg>
  </button>
</div>
<div class="pview" data-r="pLevel" hidden>
  <div class="tray" data-r="pTray"></div>
  <div class="cstage pstage">
    <div class="prompt" data-r="pPrompt"></div>
    <div class="board pboard" data-r="pBoard"></div>
    <div class="crow">
      <div class="ppoppy" data-r="pPoppy"></div>
      <div class="cright" data-r="pRight"></div>
    </div>
  </div>
</div>
<div class="presult" data-r="pResult"></div>
`);
const q = r => screen.querySelector(`[data-r="${r}"]`);

/* A map of stepping stones. Each stone is a 5-question level that earns 1-3 stars
   and a sticker; finishing a stone unlocks the next. Progress lives in localStorage. */

let pSave = { stars: [] };
try {
  const s = JSON.parse(localStorage.getItem(cfg.key));
  if (s && Array.isArray(s.stars)) pSave.stars = s.stars.slice(0, cfg.levels.length).map(n => clamp(n | 0, 0, 3));
} catch (e) {}
function savePath() { try { localStorage.setItem(cfg.key, JSON.stringify(pSave)); } catch (e) {} }
const starsOf = i => pSave.stars[i] || 0;
function nextLevel() { for (let i = 0; i < cfg.levels.length; i++) if (!starsOf(i)) return i; return -1; }

const pMapView = q('pMapView'), pLevelEl = q('pLevel'), pMap = q('pMap'), pStones = q('pStones'), pLine = q('pLine'), pStat = q('pStat'), pResult = q('pResult');
const pPrompt = q('pPrompt'), pBoard = q('pBoard'), pRight = q('pRight');
const pPoppy = makePoppy(q('pPoppy'), 'idle'), pMapPoppy = makePoppy(q('pMapPoppy'), 'idle');
const P = { view: 'map', level: 0, mistakes: 0, wrong: 0, busy: false, answer: null, rightEl: null, hint: null, onRight: null,
  question: '', tok: 0, timers: [], tray: makeTray(q('pTray'), 5), lastType: '', lastN: 0, item: null, greeted: false };
const pLater = (fn, ms) => { const tok = P.tok; P.timers.push(setTimeout(() => { if (tok === P.tok) fn(); }, ms)); };
const pClear = () => { P.timers.forEach(clearTimeout); P.timers = []; P.tok++; };
function pRand(lo, hi) {
  let n, tries = 0;
  do { n = randInt(lo, hi); } while (n === P.lastN && hi > lo && ++tries < 6);
  return (P.lastN = n);
}
function pItem(list) {
  let it;
  do { it = pick(list); } while (it === P.item);
  return (P.item = it);
}

/* ---- the map ---- */
function showMap(from) {
  pClear();
  P.view = 'map';
  pLevelEl.hidden = true; pMapView.hidden = false;
  pResult.classList.remove('show');
  renderMap(from);
  const nx = nextLevel();
  const line = nx < 0 ? 'You finished the whole path! Play any stone again!'
    : !P.greeted ? cfg.welcome
    : from != null ? 'Hooray! A new stone!' : pick(["Let's go! Tap the orange stone!", 'Where next? Tap the orange stone!']);
  P.greeted = true;
  pLater(() => say(line), 300);
}
function renderMap(from) {
  const nx = nextLevel(), total = pSave.stars.reduce((a, b) => a + (b || 0), 0);
  pStat.innerHTML = `${STAR}<b>${total}</b><span>/ ${cfg.levels.length * 3}</span>`;
  pStones.innerHTML = '';
  cfg.levels.forEach((L, i) => {
    const st = starsOf(i), locked = nx >= 0 && i > nx;
    const b = document.createElement('button');
    b.className = 'stone' + (st ? ' done' : '') + (i === nx ? ' current' : '') + (locked ? ' locked' : '');
    b.style.animationDelay = i * 40 + 'ms';
    b.setAttribute('aria-label', `Level ${i + 1}` + (locked ? ', locked' : st ? `, ${st} stars` : ''));
    b.innerHTML = `<b>${i + 1}</b>`
      + (st ? `<span class="stk">${cfg.stickers[i]}</span><span class="sst">${[1, 2, 3].map(k => `<i class="${k <= st ? 'on' : ''}">${STAR}</i>`).join('')}</span>` : '')
      + (locked ? `<span class="lock">${LOCK}</span>` : '');
    b.addEventListener('click', () => tapStone(i, b, locked));
    pStones.appendChild(b);
  });
  layoutMap(from);
}
/* Stones snake back and forth across the rows; a dotted trail joins them */
function layoutMap(from) {
  const W = pMap.clientWidth, H = pMap.clientHeight;
  if (!W || !H) return;
  const big = cfg.levels.length > 20;
  const cols = W > H * 2.2 ? (big ? 10 : 7) : W > H * 1.1 ? (big ? 6 : 5) : (big ? 5 : 4), rows = Math.ceil(cfg.levels.length / cols);
  /* stones shrink to leave room for Poppy above and the stars below */
  pStones.style.setProperty('--s', Math.round(clamp(Math.min((W / cols) * 0.62, (H / rows) * 0.5), 40, 110)) + 'px');
  pStones.style.setProperty('--pc', cols);
  pStones.style.setProperty('--pr', rows);
  [...pStones.children].forEach((s, i) => {
    const r = Math.floor(i / cols);
    let c = i % cols;
    if (r % 2) c = cols - 1 - c;
    s.style.gridRow = r + 1; s.style.gridColumn = c + 1;
  });
  const m = pMap.getBoundingClientRect();
  const pts = [...pStones.children].map(s => { const r = s.getBoundingClientRect(); return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2 }; });
  const f = v => v.toFixed(1), bulge = (W / cols) * 0.5;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    if (Math.abs(p.y - q.y) < 2) d += ` L${f(q.x)} ${f(q.y)}`;
    else { const o = p.x > W / 2 ? bulge : -bulge; d += ` C${f(p.x + o)} ${f(p.y)} ${f(q.x + o)} ${f(q.y)} ${f(q.x)} ${f(q.y)}`; }
  }
  pLine.setAttribute('viewBox', `0 0 ${W} ${H}`);
  pLine.innerHTML = `<path class="road" d="${d}"/><path class="dash" d="${d}"/>`;
  const nx = nextLevel(), target = nx < 0 ? cfg.levels.length - 1 : nx;
  if (from != null && from !== target) {
    placePoppy(from, false);
    pLater(() => {
      placePoppy(target, true);
      jump(pMapPoppy);
      sfx.chime();
      pStones.children[target].classList.add('new');
    }, 700);
  } else placePoppy(target, false);
}
/* Poppy stands on top of a stone */
function placePoppy(i, animate) {
  const s = pStones.children[i];
  if (!s) return;
  const m = pMap.getBoundingClientRect(), r = s.getBoundingClientRect();
  const h = s.offsetWidth * 1.05, w = h * 200 / 240;
  const el = pMapPoppy;
  el.style.transition = animate ? 'left .9s ease-in-out, top .9s ease-in-out' : 'none';
  el.style.height = h + 'px';
  el.style.left = r.left - m.left + r.width / 2 - w / 2 + 'px';
  el.style.top = r.top - m.top + r.height * 0.22 - h + 'px';
}
function tapStone(i, el, locked) {
  if (locked) {
    el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
    sfx.boing();
    say('Not yet! Tap the orange stone!');
    return;
  }
  sfx.tap();
  startLevel(i);
}
window.addEventListener('resize', () => { if (NAV.current === cfg.id && P.view === 'map') layoutMap(); });

/* Grown-ups: press and hold the little button to start the path over */
const pReset = q('pReset');
let holdTimer = null;
pReset.addEventListener('pointerdown', e => {
  e.preventDefault();
  pReset.classList.add('holding');
  holdTimer = setTimeout(() => {
    pReset.classList.remove('holding');
    pSave = { stars: [] };
    savePath();
    sfx.chime();
    renderMap();
    say('A brand new adventure!');
  }, 1500);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => pReset.addEventListener(ev, () => { clearTimeout(holdTimer); pReset.classList.remove('holding'); }));

/* ---- a level ---- */
function startLevel(i) {
  pClear();
  P.view = 'level'; P.level = i; P.mistakes = 0; P.lastType = '';
  P.tray.reset();
  pMapView.hidden = true; pLevelEl.hidden = false;
  pResult.classList.remove('show');
  pRound(true);
}
function pRound(first) {
  pClear();
  P.busy = false; P.wrong = 0; P.answer = null; P.rightEl = null; P.hint = null; P.onRight = null;
  pBoard.innerHTML = ''; pRight.innerHTML = '';
  const L = cfg.levels[P.level];
  let t = L.t, opt = L;
  if (t === 'mix') { t = pick(Object.keys(L.set).filter(k => k !== P.lastType)); opt = L.set[t]; }
  P.lastType = t;
  const intro = first ? `Level ${P.level + 1}! ` : '';
  if (!BUILD[t](opt, intro)) pLater(() => say(intro + P.question), 350);
}
function pSetPrompt(html) {
  pPrompt.innerHTML = html + `<button class="again" aria-label="Hear it again">${ICON_ON}</button>`;
  pPrompt.querySelector('.again').addEventListener('click', () => say(P.question));
  pPrompt.style.animation = 'none'; void pPrompt.offsetWidth; pPrompt.style.animation = '';
}
function dotGroup(n, emoji) {
  const g = document.createElement('div');
  g.className = 'pgrid';
  g.style.setProperty('--cols', Math.min(n, 5));
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'ptok'; s.textContent = emoji; g.appendChild(s); }
  return g;
}
function pickBtn(v, label, ...content) {
  const b = document.createElement('button');
  b.className = 'pick';
  b.dataset.v = v;
  b.setAttribute('aria-label', label);
  b.style.animationDelay = pBoard.children.length * 90 + 'ms';
  b.append(...content);
  b.addEventListener('click', () => pAnswer(b, v));
  if (v === P.answer) P.rightEl = b;
  pBoard.appendChild(b);
  return b;
}
function tileRow(items, size) {
  const g = document.createElement('div');
  g.className = 'grp';
  g.style.setProperty('--cols', size || items.length);
  if (items.length > 5) g.style.setProperty('--tok', `clamp(28px,calc((min(94vw,920px) - 60px) / ${items.length} - 14px),86px)`);
  const tiles = items.map((txt, i) => {
    const t = document.createElement('div');
    t.className = 'tok still' + (txt === '?' ? ' blank' : '');
    t.textContent = txt;
    t.style.animationDelay = i * 60 + 'ms';
    g.appendChild(t);
    return t;
  });
  pBoard.appendChild(g);
  return tiles;
}
function numAnswers(correct, lo, hi, dots) {
  const opts = new Set([correct]);
  let guard = 0;
  while (opts.size < 3 && guard++ < 80) { const v = correct + randInt(-2, 2); if (v >= lo && v <= hi) opts.add(v); }
  while (opts.size < 3) opts.add(randInt(lo, hi));
  [...opts].sort((a, b) => a - b).forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'ans';
    b.dataset.v = v;
    b.setAttribute('aria-label', String(v));
    b.style.setProperty('--abg', ANS_COLORS[i][0]);
    b.style.setProperty('--ash', ANS_COLORS[i][1]);
    b.style.animationDelay = 200 + i * 90 + 'ms';
    b.innerHTML = `<b>${v}</b>` + (dots ? dotsSVG(v) : '');
    b.addEventListener('click', () => pAnswer(b, v));
    if (v === correct) P.rightEl = b;
    pRight.appendChild(b);
  });
}
function emojiAnswers(items, correct) {
  shuffle(items).forEach((it, i) => {
    const b = document.createElement('button');
    b.className = 'ans';
    b.dataset.e = it.e;
    b.setAttribute('aria-label', it.one);
    b.style.setProperty('--abg', ANS_COLORS[i][0]);
    b.style.setProperty('--ash', ANS_COLORS[i][1]);
    b.style.animationDelay = 200 + i * 90 + 'ms';
    b.innerHTML = `<b>${it.e}</b>`;
    b.addEventListener('click', () => pAnswer(b, it.e));
    if (it === correct) P.rightEl = b;
    pRight.appendChild(b);
  });
}
function showCounts() {
  pBoard.querySelectorAll('.pick').forEach(b => { if (!b.querySelector('.pcount')) b.insertAdjacentHTML('beforeend', `<b class="pcount">${b.dataset.v}</b>`); });
}
/* light tiles up one by one with a number badge, like counting with a finger */
function countAlong(tiles, done) {
  tiles.forEach((t, i) => pLater(() => {
    t.classList.add('counted', 'lit');
    setTimeout(() => t.classList.remove('lit'), 380);
    const b = document.createElement('span');
    b.className = 'badge'; b.textContent = i + 1;
    t.appendChild(b);
    countTone(i + 1);
    say(Word(i + 1) + '!');
  }, 400 + i * 700));
  pLater(done, 400 + tiles.length * 700 + 200);
}
function flyAway(t, emoji) {
  const p = pointIn(t);
  t.classList.add('away');
  sfx.blip();
  const d = document.createElement('div');
  d.className = 'critter';
  d.textContent = emoji;
  d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
  fx.appendChild(d);
  const dx = rand(-120, 120);
  d.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.4}px,-90px) scale(1.1) rotate(${dx > 0 ? 10 : -10}deg)`, opacity: 1, offset: 0.4 },
    { transform: `translate(${dx}px,-260px) scale(.8)`, opacity: 0 }
  ], { duration: 1400, easing: 'ease-in' }).onfinish = () => d.remove();
}

const BUILD = {
  /* Which group has more (or fewer)? */
  more(o) {
    const minDiff = o.max <= 5 ? 2 : 1;
    let a, b;
    do { a = randInt(1, o.max); b = randInt(1, o.max); } while (Math.abs(a - b) < minDiff);
    const fewer = o.fewer && Math.random() < 0.5, f = pItem(FRUITS), word = fewer ? 'fewer' : 'more';
    P.answer = fewer ? Math.min(a, b) : Math.max(a, b);
    [a, b].forEach(n => pickBtn(n, `${n} ${nm(f, n)}`, dotGroup(n, f.e)));
    pSetPrompt(`<span class="w">${fewer ? 'Fewer' : 'More'}</span><span>${f.e}</span><span class="q">?</span>`);
    P.question = `Which has ${word} ${f.many}?`;
    P.hint = () => { showCounts(); say(`Let's count! ${Word(a)}, and ${WORDS[b]}. Which has ${word}?`); };
  },
  /* A written number, no dots: find the group that has that many */
  match(o) {
    const n = pRand(1, o.max), f = pItem(FRUITS);
    const opts = new Set([n]);
    while (opts.size < 3) { const v = n + randInt(-3, 3); if (v >= 1 && v <= o.max) opts.add(v); }
    P.answer = n;
    shuffle([...opts]).forEach(v => pickBtn(v, `${v} ${nm(f, v)}`, dotGroup(v, f.e)));
    pSetPrompt(`<span>${n}</span><span>${f.e}</span>`);
    P.question = `Find ${WORDS[n]} ${nm(f, n)}!`;
    P.hint = () => { showCounts(); say(`Let's count them! Which one has ${WORDS[n]}?`); };
  },
  /* What comes next in the pattern? */
  pattern(o) {
    const kind = pick(o.kinds), items = shuffle(PAT).slice(0, 5);
    const unit = kind.split('').map(ch => items[ch.charCodeAt(0) - 65]);
    const len = unit.length === 4 ? randInt(6, 8) : unit.length * 2 + randInt(0, 1), seq = [];
    for (let i = 0; i < len; i++) seq.push(unit[i % unit.length]);
    const ans = unit[len % unit.length];
    const choices = [...new Set(unit)];
    if (choices.length < 3) choices.push(items[3]);
    /* four different things in the pattern: offer the answer and two others */
    if (choices.length > 3) choices.splice(choices.findIndex(c => c !== ans), 1);
    P.answer = ans.e;
    const tiles = tileRow([...seq.map(x => x.e), '?']);
    const blank = tiles[tiles.length - 1];
    emojiAnswers(choices, ans);
    pSetPrompt(`<span class="w">Next</span><span class="q">?</span>`);
    P.question = 'What comes next?';
    P.onRight = () => { blank.textContent = ans.e; blank.classList.remove('blank'); };
    P.hint = () => {
      say(seq.map(x => x.one).join(', ') + '... What comes next?');
      tiles.slice(0, -1).forEach((t, i) => pLater(() => {
        t.classList.add('lit'); setTimeout(() => t.classList.remove('lit'), 360);
        tone(392 * Math.pow(2, PAT.indexOf(seq[i]) / 6), 0.2, 'triangle', 0.22);
      }, 200 + i * 520));
      pLater(() => blank.classList.add('glow'), 200 + len * 520);
    };
  },
  /* A row of numbers with a gap */
  missing(o) {
    const L = o.max <= 5 ? 4 : 5, start = pRand(1, o.max - L + 1), idx = randInt(1, L - 1);
    /* o.down: the row counts down (5, 4, ?, 2) */
    const nums = Array.from({ length: L }, (_, i) => start + i);
    if (o.down) nums.reverse();
    const ans = nums[idx];
    P.answer = ans;
    const tiles = tileRow(nums.map((n, i) => (i === idx ? '?' : String(n))));
    tiles.forEach(t => t.classList.add('num'));
    numAnswers(ans, 1, o.max, false);
    pSetPrompt(`<span class="w">Missing</span><span class="q">?</span>` + (o.down ? '<span class="w">⬇</span>' : ''));
    P.question = o.down ? "Let's count down! Which number is missing?" : 'Which number is missing?';
    P.onRight = () => { tiles[idx].textContent = ans; tiles[idx].classList.remove('blank'); };
    P.hint = () => {
      say(nums.slice(0, idx).map(Word).join(', ') + '... What comes next?');
      tiles.slice(0, idx).forEach((t, i) => pLater(() => {
        t.classList.add('lit'); setTimeout(() => t.classList.remove('lit'), 360);
        countTone(nums[i]);
      }, 200 + i * 560));
      pLater(() => tiles[idx].classList.add('glow'), 200 + idx * 560);
    };
  },
  /* A little story: some animals leave, how many are left? */
  takeaway(o, intro) {
    const total = pRand(2, o.max), k = randInt(1, Math.min(o.k || 3, total - 1)), left = total - k, c = pItem(CREATURES);
    const verb = k === 1 ? c.v1 : c.vn;
    P.answer = left;
    P.busy = true;
    const tiles = tileRow(Array(total).fill(c.e), Math.min(total, 5));
    pSetPrompt(`<span>${total}</span><span>${c.e}</span><span>−</span><span>${k}</span><span class="q">?</span>`);
    P.question = `${Word(total)} ${nm(c, total)}. ${Word(k)} ${verb}. How many are left?`;
    pLater(() => say(intro + `${Word(total)} ${nm(c, total)}.`), 350);
    pLater(() => {
      tiles.slice(-k).forEach((t, j) => setTimeout(() => flyAway(t, c.e), j * 260));
      say(`${Word(k)} ${verb}!`);
    }, 2700);
    pLater(() => { say('How many are left?'); numAnswers(left, 1, o.max, true); P.busy = false; }, 4900);
    P.hint = () => {
      P.busy = true;
      say("Let's count who stayed!");
      pLater(() => countAlong(tiles.slice(0, left), () => { P.busy = false; say(`${Word(left)}! Which one is ${WORDS[left]}?`); }), 900);
    };
    return true;
  },
  /* Two groups: how many altogether? (first additions) */
  add(o) {
    const total = pRand(2, o.max), a = randInt(1, total - 1), b = total - a, f = pItem(FRUITS);
    P.answer = total;
    const left = tileRow(Array(a).fill(f.e), Math.min(a, 5));
    const plus = document.createElement('div');
    plus.className = 'plus'; plus.textContent = '+';
    pBoard.appendChild(plus);
    const right = tileRow(Array(b).fill(f.e), Math.min(b, 5));
    numAnswers(total, 2, o.max, true);
    pSetPrompt(`<span>${a}</span><span>${f.e}</span><span>+</span><span>${b}</span><span class="q">?</span>`);
    P.question = `${Word(a)} ${nm(f, a)}, and ${WORDS[b]} more. How many altogether?`;
    P.hint = () => {
      P.busy = true;
      say("Let's count them all!");
      pLater(() => countAlong([...left, ...right], () => { P.busy = false; say(`${Word(total)}! Which one is ${WORDS[total]}?`); }), 900);
    };
  },
  /* Two written numbers: which is bigger? */
  bigger(o) {
    let a, b;
    do { a = randInt(1, o.max); b = randInt(1, o.max); } while (a === b);
    P.answer = Math.max(a, b);
    const btns = [a, b].map(n => {
      const num = document.createElement('b');
      num.textContent = n;
      const btn = pickBtn(n, String(n), num);
      btn.classList.add('bignum');
      return btn;
    });
    pSetPrompt(`<span class="w">Bigger</span><span class="q">?</span>`);
    P.question = 'Which number is bigger?';
    P.hint = () => { btns.forEach(btn => btn.insertAdjacentHTML('beforeend', dotsSVG(+btn.dataset.v))); say('Look at the dots! Which one has more?'); };
  }
};

function pAnswer(el, v) {
  if (P.busy || el.classList.contains('wrong') || P.answer === null) return;
  if (v === P.answer) {
    P.busy = true;
    pBoard.querySelectorAll('.glow').forEach(g => g.classList.remove('glow'));
    el.classList.remove('glow');
    el.classList.add('right');
    if (P.onRight) P.onRight();
    sfx.tada();
    const p = pointIn(el, 0.5, 0.3);
    confetti(p.x, p.y, 45);
    jump(pPoppy);
    say(pick(['Yes!', 'Well done!', 'You got it!', 'Super!', 'Great job!']));
    const c = P.tray.add();
    pLater(c === P.tray.n ? finishLevel : () => pRound(false), c === P.tray.n ? 1500 : 2300);
    return;
  }
  P.wrong++; P.mistakes++;
  el.classList.add('wrong');
  sfx.boing();
  if (P.wrong === 1 && P.hint) P.hint();
  else { say('Almost! Try this one!'); if (P.rightEl) P.rightEl.classList.add('glow'); }
}

/* Stars depend on how many tries it took; a sticker the first time a stone is finished */
function finishLevel() {
  pClear();
  P.busy = true;
  const i = P.level, st = P.mistakes <= 1 ? 3 : P.mistakes <= 3 ? 2 : 1, firstTime = !starsOf(i);
  pSave.stars[i] = Math.max(starsOf(i), st);
  savePath();
  const allDone = nextLevel() < 0;
  bigCelebrate();
  pResult.innerHTML = `<div class="rcard"><div class="rstars">${('<div class="slot">' + STAR + '</div>').repeat(3)}</div>`
    + (firstTime ? `<div class="rsticker">${cfg.stickers[i]}</div>` : '')
    + `<button class="play rnext" aria-label="Back to the path">${PLAY_ICON}</button></div>`;
  pResult.classList.add('show');
  const slots = pResult.querySelectorAll('.slot');
  for (let k = 0; k < st; k++) pLater(() => { slots[k].classList.add('on'); tone(660 * Math.pow(2, k * 4 / 12), 0.35, 'triangle', 0.25); }, 500 + k * 380);
  const msg = (st === 3 ? 'Wow! Three stars!' : st === 2 ? 'Great job! Two stars!' : 'You did it! One star!')
    + (firstTime && allDone ? ' You finished the whole path! You are a number champion!' : firstTime ? ' And a new sticker!' : '');
  pLater(() => say(msg), 400);
  pResult.querySelector('.rnext').addEventListener('click', () => { sfx.tap(); showMap(firstTime ? i : undefined); });
}
function startPath() { showMap(); }
function stopPath() { pClear(); P.view = 'map'; pResult.classList.remove('show'); }

registerGame({
  id: cfg.id, label: cfg.label, say: cfg.say, cardClass: cfg.cardClass, group: 'numbers', icon: cfg.icon,
  start: startPath, stop: stopPath,
  /* inside a level, Home goes back to the map */
  onHome() {
    if (P.view === 'map') return false;
    showMap();
    return true;
  },
  /* number keys pick an answer */
  onKey(e) {
    if (!/^[0-9]$/.test(e.key)) return;
    const v = e.key === '0' ? 10 : e.key;
    const b = pRight.querySelector(`.ans[data-v="${v}"]`) || pBoard.querySelector(`.pick[data-v="${v}"]`);
    if (b) b.click();
  }
});
}

/* ---------------- the paths ---------------- */
const P1 = [
  { t: 'more', max: 5 }, { t: 'match', max: 5 }, { t: 'pattern', kinds: ['AB'] }, { t: 'missing', max: 5 },
  { t: 'takeaway', max: 5 }, { t: 'more', ...HARD.more }, { t: 'match', ...HARD.match }, { t: 'pattern', ...HARD.pattern },
  { t: 'missing', ...HARD.missing }, { t: 'takeaway', ...HARD.takeaway }, { t: 'bigger', ...HARD.bigger }, { t: 'mix', set: HARD },
  { t: 'more', ...HARDER.more }, { t: 'match', ...HARDER.match }, { t: 'pattern', ...HARDER.pattern }, { t: 'missing', ...HARDER.missing },
  { t: 'takeaway', ...HARDER.takeaway }, { t: 'bigger', ...HARDER.bigger }, { t: 'missing', max: 20 }, { t: 'mix', set: HARDER }
];
/* Number path 2: 30 stones in 5 steps of 6. It starts a little below where path 1 ends and gets
   harder very slowly. New along the way: adding two groups, counting down, take-aways of 4,
   and patterns with 4 different things. The 6th stone of each step mixes everything of that step. */
const S2 = [
  { more: { max: 10, fewer: true }, match: { max: 10 }, pattern: { kinds: ['ABC', 'AAB', 'ABB'] }, missing: { max: 12 }, takeaway: { max: 8 }, bigger: { max: 12 }, add: { max: 5 } },
  { more: { max: 10, fewer: true }, match: { max: 12 }, pattern: { kinds: ['AABB', 'ABAC', 'ABCC'] }, missing: { max: 15 }, takeaway: { max: 10 }, bigger: { max: 15 }, add: { max: 6 } },
  { more: { max: 12, fewer: true }, match: { max: 12 }, pattern: { kinds: ['ABCD', 'AABB', 'ABBC'] }, missing: { max: 20 }, takeaway: { max: 10 }, bigger: { max: 20 }, add: { max: 7 } },
  { more: { max: 12, fewer: true }, match: { max: 15 }, pattern: { kinds: ['ABCD', 'AABC', 'ABBC'] }, missing: { max: 10, down: true }, takeaway: { max: 12, k: 4 }, bigger: { max: 20 }, add: { max: 8 } },
  { more: { max: 15, fewer: true }, match: { max: 15 }, pattern: { kinds: ['ABCD', 'AABC', 'ABCC'] }, missing: { max: 20, down: true }, takeaway: { max: 12, k: 4 }, bigger: { max: 20 }, add: { max: 10 } }
];
const P2 = [
  { t: 'add', ...S2[0].add }, { t: 'more', ...S2[0].more }, { t: 'pattern', ...S2[0].pattern }, { t: 'missing', ...S2[0].missing }, { t: 'add', ...S2[0].add }, { t: 'mix', set: S2[0] },
  { t: 'match', ...S2[1].match }, { t: 'add', ...S2[1].add }, { t: 'pattern', ...S2[1].pattern }, { t: 'takeaway', ...S2[1].takeaway }, { t: 'bigger', ...S2[1].bigger }, { t: 'mix', set: S2[1] },
  { t: 'add', ...S2[2].add }, { t: 'missing', ...S2[2].missing }, { t: 'more', ...S2[2].more }, { t: 'pattern', ...S2[2].pattern }, { t: 'bigger', ...S2[2].bigger }, { t: 'mix', set: S2[2] },
  { t: 'missing', ...S2[3].missing }, { t: 'add', ...S2[3].add }, { t: 'takeaway', ...S2[3].takeaway }, { t: 'match', ...S2[3].match }, { t: 'pattern', ...S2[3].pattern }, { t: 'mix', set: S2[3] },
  { t: 'add', ...S2[4].add }, { t: 'missing', ...S2[4].missing }, { t: 'more', ...S2[4].more }, { t: 'takeaway', ...S2[4].takeaway }, { t: 'pattern', ...S2[4].pattern }, { t: 'mix', set: S2[4] }
];

makeNumberPath({
  id: 'path', key: 'poppy-path', label: 'Number path', say: 'Number path!', cardClass: 'c-path', levels: P1,
  welcome: 'Welcome to the number path! Tap the orange stone!',
  stickers: ['🐞', '🌻', '🐢', '🍓', '🦋', '🌈', '🐙', '🚀', '🦄', '🍦', '🐳', '👑', '🐬', '🍉', '🎈', '🦖', '🐧', '🌟', '🦩', '🏆'],
  icon: `<svg viewBox="0 0 100 100">
    <path d="M18 82Q34 84 44 68T70 50Q84 44 82 26" stroke="#f08fb0" stroke-width="5" stroke-dasharray="1 9" stroke-linecap="round" fill="none"/>
    <circle cx="18" cy="82" r="12" fill="#ffb13d"/><circle cx="44" cy="66" r="12" fill="#ff7a3d"/><circle cx="70" cy="50" r="12" fill="#ff5d8a"/>
    <text x="18" y="87" class="ico-num s">1</text><text x="44" y="71" class="ico-num s">2</text><text x="70" y="55" class="ico-num s">3</text>
    <path d="M82 9l3.6 7.6 8.2 1-6 5.7 1.6 8.2L82 27.4l-7.4 4.1 1.6-8.2-6-5.7 8.2-1z" fill="#ffcf33" stroke="#e09a00" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,
});
makeNumberPath({
  id: 'path2', key: 'poppy-path2', label: 'Number path 2', say: 'Number path two!', cardClass: 'c-path2', levels: P2,
  welcome: 'Welcome to number path two! Tap the orange stone!',
  stickers: ['🐨', '🦁', '🐯', '🐼', '🦒', '🐘', '🦓', '🦔', '🐿️', '🦉', '🐊', '🦜', '🐠', '🦀', '🐌', '🌵', '🍄', '🌺', '🍒', '🥝', '🍩', '🍭', '🎨', '🪁', '🚂', '🛸', '🏰', '🎠', '🌋', '🥇'],
  icon: `<svg viewBox="0 0 100 100">
    <path d="M14 80Q30 86 40 70T66 56Q80 50 80 32" stroke="#7fb3f0" stroke-width="5" stroke-dasharray="1 9" stroke-linecap="round" fill="none"/>
    <circle cx="14" cy="80" r="11" fill="#5cc0ff"/><circle cx="40" cy="70" r="11" fill="#4d9dff"/><circle cx="66" cy="56" r="11" fill="#7d6bff"/>
    <text x="14" y="85" class="ico-num s">4</text><text x="40" y="75" class="ico-num s">5</text><text x="66" y="61" class="ico-num s">6</text>
    <rect x="66" y="6" width="28" height="26" rx="8" fill="#ff7a3d"/><text x="80" y="25" class="ico-num">2</text>
  </svg>`
});
})();
