/* ================= Counting ================= */
(() => {
'use strict';
const screen = addScreen('count', `
<div class="tray" id="cTray"></div>
<div class="cstage">
  <div class="prompt" id="cPrompt"></div>
  <div class="board" id="cBoard"></div>
  <div class="crow">
    <div id="cPoppy"></div>
    <div class="cright" id="cRight"></div>
  </div>
</div>
`);

const C_TYPES = ['howmany', 'give', 'howmany', 'add', 'give', 'howmany', 'add'];
const MAX_N = [5, 7, 10]; // grows each time the star tray fills
const cPrompt = $('#cPrompt'), cBoard = $('#cBoard'), cRight = $('#cRight');
const cPoppy = makePoppy($('#cPoppy'), 'idle');
const C = { tray: makeTray($('#cTray'), 5), level: 0, round: 0, tok: 0, timers: [], busy: false, type: '', fruit: null, answer: 0, counted: 0, filled: 0, wrong: 0, lastN: 0, question: '' };
const cLater = (fn, ms) => { const tok = C.tok; C.timers.push(setTimeout(() => { if (tok === C.tok) fn(); }, ms)); };
const cClear = () => { C.timers.forEach(clearTimeout); C.timers = []; C.tok++; };

function pickN(lo, hi) {
  let n, tries = 0;
  do { n = randInt(lo, hi); } while (n === C.lastN && hi > lo && ++tries < 6);
  C.lastN = n;
  return n;
}
function makeGroup(n, emoji, cols, pile) {
  const g = document.createElement('div');
  g.className = 'grp';
  g.style.setProperty('--cols', cols);
  for (let i = 0; i < n; i++) {
    const t = document.createElement('button');
    t.className = 'tok';
    t.textContent = emoji;
    t.setAttribute('aria-label', C.fruit.one);
    t.style.animationDelay = i * 60 + 'ms';
    if (pile) t.style.setProperty('--r', rand(-14, 14).toFixed(1) + 'deg');
    t.addEventListener('click', () => (C.type === 'give' ? giveTok(t) : countTok(t)));
    g.appendChild(t);
  }
  return g;
}
function plusSign() { const d = document.createElement('div'); d.className = 'plus'; d.textContent = '+'; return d; }
function setPrompt(html) {
  cPrompt.innerHTML = html + `<button class="again" aria-label="Hear it again">${ICON_ON}</button>`;
  cPrompt.querySelector('.again').addEventListener('click', () => say(C.question));
  cPrompt.style.animation = 'none'; void cPrompt.offsetWidth; cPrompt.style.animation = '';
}

/* tap-to-count helper: every fruit you touch gets the next number */
function markCounted(t, k) {
  t.classList.add('counted');
  const b = document.createElement('span');
  b.className = 'badge'; b.textContent = k;
  t.appendChild(b);
  countTone(k);
}
function countTok(t) {
  if (C.busy || t.classList.contains('counted')) return;
  markCounted(t, ++C.counted);
  say(Word(C.counted) + '!');
}
function clearCounts() {
  C.counted = 0;
  cBoard.querySelectorAll('.tok').forEach(t => { t.classList.remove('counted', 'lit'); const b = t.querySelector('.badge'); if (b) b.remove(); });
}
function autoCount(done) {
  clearCounts();
  const toks = [...cBoard.querySelectorAll('.tok')];
  toks.forEach((t, i) => cLater(() => {
    markCounted(t, i + 1);
    C.counted = i + 1;
    t.classList.add('lit');
    setTimeout(() => t.classList.remove('lit'), 380);
    say(Word(i + 1) + '!');
  }, 500 + i * 750));
  cLater(done, 500 + toks.length * 750 + 300);
}

function showAnswers(correct) {
  const opts = new Set([correct]);
  const lo = Math.max(1, Math.min(correct - 2, 8)), hi = Math.min(10, Math.max(correct + 2, 3));
  let guard = 0;
  while (opts.size < 3 && guard++ < 60) opts.add(randInt(lo, hi));
  cRight.innerHTML = '';
  [...opts].sort((a, b) => a - b).forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'ans';
    b.dataset.v = v;
    b.setAttribute('aria-label', String(v));
    b.style.setProperty('--abg', ANS_COLORS[i][0]);
    b.style.setProperty('--ash', ANS_COLORS[i][1]);
    b.style.animationDelay = 200 + i * 90 + 'ms';
    b.innerHTML = `<b>${v}</b>${dotsSVG(v)}`;
    b.addEventListener('click', () => answer(b, v));
    cRight.appendChild(b);
  });
}
function answer(btn, v) {
  if (C.busy || btn.classList.contains('wrong')) return;
  if (v === C.answer) {
    C.busy = true;
    btn.classList.add('right');
    cRight.querySelectorAll('.ans').forEach(b => { if (b !== btn) b.style.opacity = '.4'; });
    win(`Yes! ${Word(v)} ${nm(C.fruit, v)}!`, btn);
    return;
  }
  C.wrong++;
  btn.classList.add('wrong');
  sfx.boing();
  if (C.wrong === 1) {
    C.busy = true;
    say("Hmm, let's count together!");
    cLater(() => autoCount(() => { C.busy = false; say(`${Word(C.answer)}! Which one is ${WORDS[C.answer]}?`); }), 1200);
  } else {
    say(`Not that one! Which one is ${WORDS[C.answer]}?`);
  }
}

/* "Give me N" helpers: fruit flies into Poppy's basket */
function flyTo(src, dst, emoji, done) {
  const a = pointIn(src), b = pointIn(dst);
  const d = document.createElement('div');
  d.className = 'flyer';
  d.textContent = emoji;
  d.style.fontSize = src.getBoundingClientRect().width * 0.58 + 'px';
  d.style.left = a.x + 'px'; d.style.top = a.y + 'px';
  fx.appendChild(d);
  const dx = b.x - a.x, dy = b.y - a.y;
  d.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 90}px) scale(1.25)` },
    { transform: `translate(${dx}px,${dy}px) scale(.85)` }
  ], { duration: 560, easing: 'ease-in-out' }).onfinish = () => { d.remove(); done(); };
}
function giveTok(t) {
  if (C.busy || t.classList.contains('gone') || C.filled >= C.answer) return;
  const slot = cRight.querySelectorAll('.bslot')[C.filled];
  const k = ++C.filled, tok = C.tok, fruit = C.fruit;
  t.classList.add('gone');
  sfx.blip();
  flyTo(t, slot, fruit.e, () => {
    if (tok !== C.tok) return;
    slot.textContent = fruit.e;
    slot.classList.add('full');
    countTone(k);
    say(Word(k) + '!');
    if (k === C.answer) {
      C.busy = true;
      cLater(() => win(`Yum! ${Word(k)} ${nm(fruit, k)}! Thank you!`, slot.parentElement), 650);
    }
  });
}

function win(text, el) {
  sfx.tada();
  const p = pointIn(el, 0.5, 0.3);
  confetti(p.x, p.y, 50);
  jump(cPoppy);
  say(text);
  const c = C.tray.add();
  if (c === C.tray.n) {
    cLater(() => {
      bigCelebrate();
      say(C.level < MAX_N.length - 1 ? "You're a counting star! Let's try bigger numbers!" : "You're a counting star!");
      C.level = Math.min(MAX_N.length - 1, C.level + 1);
    }, 1900);
    cLater(cRound, 5800);
  } else {
    cLater(cRound, 3000);
  }
}

function cRound() {
  cClear();
  C.busy = false; C.counted = 0; C.filled = 0; C.wrong = 0;
  if (C.tray.count >= C.tray.n) C.tray.reset();
  C.type = C.round === 0 ? 'howmany' : C_TYPES[C.round % C_TYPES.length];
  C.round++;
  let f;
  do { f = pick(FRUITS); } while (f === C.fruit);
  C.fruit = f;
  cBoard.innerHTML = '';
  cRight.innerHTML = '';
  const max = MAX_N[C.level];

  if (C.type === 'howmany') {
    const n = pickN(1, max);
    C.answer = n;
    cBoard.appendChild(makeGroup(n, f.e, Math.min(n, 5)));
    setPrompt(`<span>${f.e}</span><span class="q">?</span>`);
    C.question = `How many ${f.many}?`;
    showAnswers(n);
  } else if (C.type === 'add') {
    const total = pickN(2, max), a = randInt(1, total - 1), b = total - a;
    C.answer = total;
    cBoard.append(makeGroup(a, f.e, Math.min(a, 3)), plusSign(), makeGroup(b, f.e, Math.min(b, 3)));
    setPrompt(`<span>${f.e}</span><span>+</span><span>${f.e}</span><span>=</span><span class="q">?</span>`);
    C.question = `${Word(a)} ${nm(f, a)}, and ${WORDS[b]} more. How many altogether?`;
    showAnswers(total);
  } else {
    const n = pickN(1, max), total = Math.min(n + randInt(2, 4), 14);
    C.answer = n;
    cBoard.appendChild(makeGroup(total, f.e, Math.min(total, 7), true));
    setPrompt(`<span>${f.e}</span><span>${n}</span>${dotsSVG(n)}`);
    const bk = document.createElement('div');
    bk.className = 'basket';
    bk.style.setProperty('--cols', Math.min(n, 5));
    for (let i = 0; i < n; i++) { const s = document.createElement('div'); s.className = 'bslot'; bk.appendChild(s); }
    cRight.appendChild(bk);
    C.question = `Can you give me ${WORDS[n]} ${nm(f, n)}?`;
  }
  cLater(() => say(C.question), 350);
}
function startCount() { C.round = 0; C.tray.reset(); cRound(); }
function stopCount() { cClear(); cBoard.innerHTML = ''; cRight.innerHTML = ''; }

registerGame({
  id: 'count', label: 'Counting', say: 'Counting!', cardClass: 'c-count',
  icon: `<svg viewBox="0 0 100 100">
    <circle cx="19.5" cy="32" r="4.5" fill="#ff5d5d"/>
    <circle cx="44.5" cy="32" r="4.5" fill="#f2a900"/><circle cx="55.5" cy="32" r="4.5" fill="#f2a900"/>
    <circle cx="74" cy="36" r="4.5" fill="#4d9dff"/><circle cx="87" cy="36" r="4.5" fill="#4d9dff"/><circle cx="80.5" cy="25" r="4.5" fill="#4d9dff"/>
    <rect x="6" y="50" width="27" height="31" rx="7" fill="#d94343"/><rect x="6" y="46" width="27" height="31" rx="7" fill="#ff5d5d"/>
    <rect x="36.5" y="50" width="27" height="31" rx="7" fill="#e0a800"/><rect x="36.5" y="46" width="27" height="31" rx="7" fill="#ffc93d"/>
    <rect x="67" y="50" width="27" height="31" rx="7" fill="#2f7fe0"/><rect x="67" y="46" width="27" height="31" rx="7" fill="#4d9dff"/>
    <text x="19.5" y="69" class="ico-num">1</text><text x="50" y="69" class="ico-num">2</text><text x="80.5" y="69" class="ico-num">3</text>
  </svg>`,
  start: startCount, stop: stopCount,
  /* number keys pick an answer */
  onKey(e) {
    if (!/^[0-9]$/.test(e.key)) return;
    const b = cRight.querySelector(`.ans[data-v="${e.key === '0' ? 10 : e.key}"]`);
    if (b) b.click();
  }
});
})();
