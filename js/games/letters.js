/* ================= ABC: letters and first words (French / English) ================= */
/* Each round brings one new letter ("M comme Maison"), then 5 little questions that mix
   it with the letters already learned: find the letter, pop all the balloons of a letter,
   find the first letter of a word, and copy a short word. The round ends with a gift to
   tap open: it holds the new letter's card, which goes into the ABC album. Cards earn up
   to 3 stars as the child practices that letter. Progress is shared by both languages. */
(() => {
'use strict';
const screen = addScreen('letters', `
<button class="llang" id="lLang" aria-label="Change language"></button>
<div class="tray" id="lTray"></div>
<div class="cstage lstage">
  <div class="prompt" id="lPrompt"></div>
  <div class="board" id="lBoard"></div>
  <div class="crow">
    <div id="lPoppy"></div>
    <div class="cright" id="lRight"></div>
  </div>
</div>
<button class="round lalbumbtn" id="lAlbumBtn" aria-label="ABC album"><span>📖</span><b id="lAlbumCount"></b></button>
<div class="loverlay" id="lOver"></div>
`);

/* Learning order: vowels and easy, distinct shapes first; tricky ones (Q, X, W, Y) last */
const ORDER = 'AOIMPLSTERUBDCNFVGJHKZWYXQ'.split('');
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const XYLO = '<svg viewBox="0 0 100 100"><rect x="12" y="38" width="17" height="48" rx="5" fill="#ff5d5d"/><rect x="33" y="42" width="17" height="40" rx="5" fill="#ffc93d"/><rect x="54" y="46" width="17" height="32" rx="5" fill="#5ccf6a"/><rect x="75" y="50" width="17" height="24" rx="5" fill="#4d9dff"/><path d="M20 30L60 6" stroke="#9a6440" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="5" r="6" fill="#9a6440"/></svg>';

/* Each letter's card word (always starts with the letter), plus a few more words for variety */
const LANG = {
  fr: {
    flag: '🇫🇷', code: 'FR', hello: 'Français !',
    names: { A: 'a', B: 'bé', C: 'cé', D: 'dé', E: 'eu', F: 'effe', G: 'gé', H: 'ache', I: 'i', J: 'ji', K: 'ka', L: 'elle', M: 'emme', N: 'enne', O: 'o', P: 'pé', Q: 'cu', R: 'erre', S: 'esse', T: 'té', U: 'u', V: 'vé', W: 'double vé', X: 'ixe', Y: 'i grec', Z: 'zède' },
    cards: { A: ['avion', '✈️'], B: ['banane', '🍌'], C: ['carotte', '🥕'], D: ['dauphin', '🐬'], E: ['escargot', '🐌'], F: ['fraise', '🍓'], G: ['gâteau', '🎂'], H: ['hibou', '🦉'], I: ['île', '🏝️'], J: ['jus', '🧃'], K: ['koala', '🐨'], L: ['lapin', '🐰'], M: ['maison', '🏠'], N: ['nuage', '☁️'], O: ['orange', '🍊'], P: ['pomme', '🍎'], Q: ['quille', '🎳'], R: ['renard', '🦊'], S: ['soleil', '☀️'], T: ['tortue', '🐢'], U: ['usine', '🏭'], V: ['vélo', '🚲'], W: ['wagon', '🚃'], X: ['xylophone', XYLO], Y: ['yoyo', '🪀'], Z: ['zèbre', '🦓'] },
    more: { A: [['ananas', '🍍']], B: [['bateau', '⛵']], C: [['cochon', '🐷']], D: [['dinosaure', '🦕']], E: [['éléphant', '🐘']], F: [['fleur', '🌸']], G: [['gorille', '🦍']], H: [['hérisson', '🦔']], K: [['kiwi', '🥝']], L: [['lune', '🌙']], M: [['moto', '🏍️']], N: [['nez', '👃']], O: [['ours', '🐻']], P: [['poisson', '🐟']], R: [['robot', '🤖']], S: [['serpent', '🐍']], T: [['tomate', '🍅']], V: [['vache', '🐄']] },
    spell: [['CHAT', '🐱'], ['LUNE', '🌙'], ['LOUP', '🐺'], ['OURS', '🐻'], ['BUS', '🚌'], ['NEZ', '👃'], ['LIT', '🛏️'], ['RAT', '🐀'], ['ROI', '👑'], ['PAIN', '🍞'], ['MOTO', '🏍️'], ['PAPA', '👨'], ['MAMAN', '👩'], ['LAIT', '🥛'], ['SAC', '👜'], ['BOL', '🥣'], ['FEU', '🔥'], ['MER', '🌊'], ['KIWI', '🥝'], ['ROSE', '🌹']],
    praise: ['Bravo !', 'Super !', 'Génial !', 'Oui, bien joué !', 'Tu es trop fort !'],
    welcome: 'Le jeu des lettres ! On y va ?',
    intro: (n, w) => `Voici une nouvelle lettre : ${n} ! ${n}, comme ${w} ! Touche la lettre !`,
    find: n => `Trouve la lettre ${n} !`,
    pop: n => `Éclate toutes les lettres ${n} !`,
    first: w => `${w} ! ${w} commence par quelle lettre ?`,
    spellIt: w => `Écris ${w} ! Touche les lettres dans l'ordre.`,
    notThis: n => `Ça, c'est la lettre ${n}.`,
    look: n => `Cherche la lettre ${n}. Elle est en haut !`,
    listen: w => `Écoute bien : ${w}.`,
    startsWith: (w, n) => `${w} commence par ${n} !`,
    next: n => `Cherche la lettre ${n} !`,
    gift: 'Un cadeau ! Touche-le pour l\'ouvrir !',
    got: (n, w) => `La lettre ${n} ! ${n}, comme ${w} ! Elle va dans ton album.`,
    allDone: 'Tu connais toutes les lettres ! Bravo !',
    album: k => `Ton album des lettres ! Tu as ${k} lettre${k > 1 ? 's' : ''}.`,
    card: (n, w) => `${n}, comme ${w}`,
    locked: 'Cette lettre est encore cachée !'
  },
  en: {
    flag: '🇬🇧', code: 'EN', hello: 'English!',
    names: { A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'ef', G: 'jee', H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee' },
    cards: { A: ['apple', '🍎'], B: ['banana', '🍌'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'], G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['ice cream', '🍦'], J: ['juice', '🧃'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['octopus', '🐙'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rabbit', '🐰'], S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['violin', '🎻'], W: ['whale', '🐳'], X: ['xylophone', XYLO], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'] },
    more: { A: [['ant', '🐜']], B: [['bear', '🐻']], C: [['car', '🚗']], D: [['duck', '🦆']], E: [['elephant', '🐘']], F: [['frog', '🐸']], G: [['goat', '🐐']], H: [['horse', '🐴']], K: [['key', '🔑']], L: [['leaf', '🍃']], M: [['mouse', '🐭']], O: [['owl', '🦉']], P: [['pizza', '🍕']], R: [['robot', '🤖']], S: [['snake', '🐍']], T: [['tiger', '🐯']], W: [['watch', '⌚']] },
    spell: [['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['BUS', '🚌'], ['PIG', '🐷'], ['HAT', '🎩'], ['BEE', '🐝'], ['CAR', '🚗'], ['COW', '🐄'], ['FOX', '🦊'], ['OWL', '🦉'], ['BED', '🛏️'], ['KEY', '🔑'], ['ANT', '🐜'], ['MOON', '🌙'], ['FISH', '🐟'], ['MOM', '👩'], ['DAD', '👨'], ['CAKE', '🎂'], ['FROG', '🐸']],
    praise: ['Well done!', 'Super!', 'Great job!', 'Yes!', 'You got it!'],
    welcome: "Let's play with letters!",
    intro: (n, w) => `Here is a new letter: ${n}! ${n}, like ${w}! Tap the letter!`,
    find: n => `Find the letter ${n}!`,
    pop: n => `Pop all the ${n} balloons!`,
    first: w => `${w}! What letter does ${w} start with?`,
    spellIt: w => `Let's write ${w}! Tap the letters in order.`,
    notThis: n => `That one is the letter ${n}.`,
    look: n => `Look for the letter ${n}. It's at the top!`,
    listen: w => `Listen: ${w}.`,
    startsWith: (w, n) => `${w} starts with ${n}!`,
    next: n => `Look for the letter ${n}!`,
    gift: 'A present! Tap it to open it!',
    got: (n, w) => `The letter ${n}! ${n}, like ${w}! It goes in your album.`,
    allDone: 'You know all the letters! Well done!',
    album: k => `Your letter album! You have ${k} letter${k > 1 ? 's' : ''}.`,
    card: (n, w) => `${n}, like ${w}`,
    locked: 'This letter is still hiding!'
  }
};
/* letters that look alike, used to make "pop the balloons" a real looking game */
const LOOKALIKE = { A: 'HV', B: 'PDR', C: 'OG', D: 'OB', E: 'FB', F: 'EP', G: 'CO', H: 'NA', I: 'LTJ', J: 'IU', K: 'XR', L: 'IT', M: 'NW', N: 'MH', O: 'QCD', P: 'RBF', Q: 'OG', R: 'PB', S: 'Z', T: 'IL', U: 'VJ', V: 'UY', W: 'MV', X: 'KY', Y: 'VX', Z: 'S' };
const STAR_AT = [3, 6, 10];
/* balloons and tiles get random colors, so the child has to recognize the letter's shape, not its color */
const TILE_HUES = [0, 22, 42, 130, 172, 200, 228, 268, 300, 330];  // correct answers on a letter needed for its 1st, 2nd, 3rd star

/* ---- saved progress ---- */
let save = loadData('poppy-letters', {});
save = {
  got: Array.isArray(save.got) ? save.got.filter(l => ABC.includes(l)) : [],
  practice: save.practice && typeof save.practice === 'object' ? save.practice : {},
  lang: save.lang === 'en' || save.lang === 'fr' ? save.lang : (/^fr/i.test(navigator.language || '') ? 'fr' : 'en')
};
const persist = () => saveData('poppy-letters', save);
const T = () => LANG[save.lang];
const nameOf = l => T().names[l];
const talk = text => say(text, { lang: save.lang });
const cap = w => w[0].toUpperCase() + w.slice(1);
const hue = l => Math.round(ABC.indexOf(l) * 360 / 26);
const starsOf = l => STAR_AT.filter(n => (save.practice[l] || 0) >= n).length;
const pic = e => (e.startsWith('<svg') ? `<span class="lsvg">${e}</span>` : e);

const lPrompt = $('#lPrompt'), lBoard = $('#lBoard'), lRight = $('#lRight'), lOver = $('#lOver');
const lLang = $('#lLang'), lAlbumBtn = $('#lAlbumBtn'), lAlbumCount = $('#lAlbumCount');
const lPoppy = makePoppy($('#lPoppy'), 'idle');
const tray = makeTray($('#lTray'), 5);
const S = { tok: 0, timers: [], busy: false, wrong: 0, q: 0, types: [], newL: null, pool: [], target: null, rightEl: null, lastSpell: null };
const lLater = (fn, ms) => { const tok = S.tok; S.timers.push(setTimeout(() => { if (tok === S.tok) fn(); }, ms)); };
const lClear = () => { S.timers.forEach(clearTimeout); S.timers = []; S.tok++; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shakeIt = e => { e.classList.remove('nope'); void e.offsetWidth; e.classList.add('nope'); };

function renderTop() {
  lLang.innerHTML = `<span>${T().flag}</span><b>${T().code}</b>`;
  lAlbumCount.textContent = `${save.got.length}/26`;
}
function setPrompt(html) {
  lPrompt.innerHTML = html + `<button class="again" aria-label="Hear it again">${ICON_ON}</button>`;
  lPrompt.querySelector('.again').addEventListener('click', () => talk(S.question));
  lPrompt.style.animation = 'none'; void lPrompt.offsetWidth; lPrompt.style.animation = '';
}
/* a few letters that are not the target: some look-alikes, the rest at random */
function others(target, n) {
  const pickFrom = shuffle([...(LOOKALIKE[target] || '')]).slice(0, Math.ceil(n / 2));
  const rest = shuffle(ABC.filter(l => l !== target && !pickFrom.includes(l)));
  return [...pickFrom, ...rest].slice(0, n);
}
function letterTile(l, cls, onTap) {
  const b = el('button', cls, `<b>${l}</b>`);
  b.dataset.l = l;
  b.style.setProperty('--h', pick(TILE_HUES));
  b.setAttribute('aria-label', 'Letter ' + l);
  b.addEventListener('click', () => onTap(b, l));
  return b;
}

/* ================= A round ================= */
function startRound() {
  lClear();
  closeOverlay();
  S.q = 0;
  tray.reset();
  S.newL = ORDER.find(l => !save.got.includes(l)) || null;
  S.pool = [...save.got, S.newL].filter(Boolean);
  const k = save.got.length;
  S.types = k < 2 ? ['find', 'pop', 'first', 'find', 'pop'] : ['find', ...shuffle(['pop', 'first', 'spell', pick(['find', 'first', 'pop'])])];
  if (S.newL) intro(); else ask();
}
function clearStage() {
  lBoard.innerHTML = ''; lRight.innerHTML = ''; lBoard.className = 'board';
  S.busy = false; S.wrong = 0; S.rightEl = null;
}
/* meet the new letter */
function intro() {
  clearStage();
  const l = S.newL, [w, e] = T().cards[l];
  lBoard.classList.add('lcenter');
  const card = el('button', 'lmeet', `<b>${l}</b><span class="lpic">${pic(e)}</span><span class="lword">${w.toUpperCase()}</span>`);
  card.style.setProperty('--h', hue(l));
  card.setAttribute('aria-label', 'Letter ' + l);
  card.addEventListener('click', () => {
    if (S.busy) return;
    S.busy = true;
    sfx.chime();
    jump(lPoppy);
    card.classList.add('go');
    lLater(ask, 900);
  });
  lBoard.appendChild(card);
  setPrompt(`<span class="lnew">✨</span><b class="lbig" style="--h:${hue(l)}">${l}</b>`);
  S.question = T().intro(nameOf(l), w);
  lLater(() => talk(S.question), 400);
}
function ask() {
  clearStage();
  const type = S.types[S.q];
  S.target = S.q === 0 && S.newL ? S.newL : (S.newL && Math.random() < 0.5 ? S.newL : pick(S.pool));
  Q[type](S.target);
}
function correct(atEl, letter) {
  S.busy = true;
  lRight.querySelectorAll('.glow').forEach(g => g.classList.remove('glow'));
  if (letter) save.practice[letter] = (save.practice[letter] || 0) + 1;
  persist();
  sfx.tada();
  const p = pointIn(atEl, 0.5, 0.3);
  confetti(p.x, p.y, 45);
  jump(lPoppy);
  const c = tray.add();
  S.q++;
  lLater(c === tray.n ? giftTime : ask, c === tray.n ? 1800 : 2600);
}
/* first wrong tap: a spoken hint; after that the right answer glows */
function oops(tile, hint) {
  S.wrong++;
  sfx.boing();
  if (tile) { shakeIt(tile); if (tile.classList.contains('ltile') || tile.classList.contains('lball')) tile.classList.add('wrong'); }
  if (S.wrong === 1) hint();
  else if (S.rightEl) S.rightEl.classList.add('glow');
}

const Q = {
  /* Find the letter among a few balloons */
  find(l) {
    const n = save.got.length >= 10 ? 4 : 3;
    lBoard.classList.add('lcenter');
    shuffle([l, ...others(l, n - 1)]).forEach((x, i) => {
      const b = letterTile(x, 'lball', (b, x) => {
        if (S.busy || b.classList.contains('wrong')) return;
        if (x === l) { b.classList.add('fly'); talk(pick(T().praise)); correct(b, l); return; }
        oops(b, () => {
          setPrompt(`<span>🔍</span><b class="lbig" style="--h:${hue(l)}">${l}</b>`);
          talk(T().notThis(nameOf(x)) + ' ' + T().look(nameOf(l)));
        });
      });
      b.style.animationDelay = `${i * 90}ms, ${i * 0.4}s`;
      if (x === l) S.rightEl = b;
      lBoard.appendChild(b);
    });
    setPrompt(`<span>🔍</span><span class="q">?</span>`);
    S.question = T().find(nameOf(l));
    lLater(() => talk(S.question), 300);
  },
  /* Pop every balloon with this letter */
  pop(l) {
    const total = save.got.length >= 8 ? 10 : 8, targets = 3;
    const letters = shuffle([l, l, l, ...Array.from({ length: total - targets }, () => pick(others(l, 4)))]);
    lBoard.classList.add('lsky');
    let popped = 0;
    letters.forEach((x, i) => {
      const b = letterTile(x, 'lball small', (b, x) => {
        if (S.busy || b.classList.contains('popped')) return;
        if (x !== l) { S.wrong++; sfx.boing(); shakeIt(b); if (S.wrong === 1) talk(T().notThis(nameOf(x))); return; }
        b.classList.add('popped');
        sfx.pop();
        const p = pointIn(b);
        splash(p.x, p.y, hue(l));
        popped++;
        counter.children[popped - 1].classList.add('on');
        countTone(popped);
        if (popped === targets) { talk(pick(T().praise)); correct(counter, l); }
      });
      b.style.animationDelay = `${i * 60}ms, ${(i % 4) * 0.35}s`;
      lBoard.appendChild(b);
    });
    setPrompt(`<b class="lbig" style="--h:${hue(l)}">${l}</b><span class="lcount" id="lCount">${'<i></i>'.repeat(targets)}</span>`);
    const counter = $('#lCount');
    S.question = T().pop(nameOf(l));
    lLater(() => talk(S.question), 300);
  },
  /* Which letter does this word start with? */
  first(l) {
    const words = [T().cards[l], ...(T().more[l] || [])];
    const [w, e] = pick(words);
    const up = w.toUpperCase();
    lBoard.classList.add('lcol');
    const word = el('div', 'lwordrow');
    [...up].forEach((ch, i) => word.appendChild(el('span', i === 0 ? 'lslot' : (ch === ' ' || ch === '-' ? 'lgap' : 'lch'), i === 0 ? '?' : (ch === ' ' ? '' : ch))));
    lBoard.append(el('div', 'lpic big', pic(e)), word);
    const n = save.got.length >= 10 ? 4 : 3;
    shuffle([l, ...others(l, n - 1)]).forEach((x, i) => {
      const b = letterTile(x, 'ltile', (b, x) => {
        if (S.busy || b.classList.contains('wrong')) return;
        if (x === l) {
          const slot = word.querySelector('.lslot');
          slot.textContent = up[0];
          slot.classList.add('full');
          b.classList.add('right');
          talk(T().startsWith(cap(w), nameOf(l)));
          correct(b, l);
          return;
        }
        oops(b, () => talk(T().notThis(nameOf(x)) + ' ' + T().listen(w)));
      });
      b.style.animationDelay = 150 + i * 90 + 'ms';
      if (x === l) S.rightEl = b;
      lRight.appendChild(b);
    });
    setPrompt(`<span class="lpicsm">${pic(e)}</span><span class="q">?</span>`);
    S.question = T().first(cap(w));
    lLater(() => talk(S.question), 300);
  },
  /* Copy a short word, letter by letter */
  spell() {
    const k = save.got.length;
    const list = T().spell.filter(([w]) => (k < 10 ? w.length <= 3 : true) && w !== S.lastSpell);
    const [w, e] = pick(list.length ? list : T().spell);
    S.lastSpell = w;
    lBoard.classList.add('lcol');
    const row = el('div', 'lwordrow');
    const slots = [...w].map(ch => { const s = el('span', 'lslot ghost', ch); row.appendChild(s); return s; });
    lBoard.append(el('div', 'lpic big', pic(e)), row);
    const extra = k < 6 ? 0 : k < 14 ? 1 : 2;
    let next = 0;
    slots[0].classList.add('now');
    const tiles = shuffle([...w, ...others(w[0], 8).filter(x => !w.includes(x)).slice(0, extra)]);
    tiles.forEach((x, i) => {
      const b = letterTile(x, 'ltile', (b, x) => {
        if (S.busy || b.classList.contains('used')) return;
        if (x === w[next]) {
          b.classList.add('used');
          const s = slots[next];
          s.classList.remove('ghost', 'now');
          s.classList.add('full');
          s.style.setProperty('--h', hue(x));
          talk(nameOf(x));
          countTone(next + 1);
          S.wrong = 0;
          lRight.querySelectorAll('.glow').forEach(g => g.classList.remove('glow'));
          next++;
          if (next < w.length) { slots[next].classList.add('now'); return; }
          S.busy = true;
          lLater(() => talk([...w].map(nameOf).join(', ') + '... ' + w.toLowerCase() + ' !'), 700);
          lLater(() => correct(row, null), 600);
          return;
        }
        S.rightEl = [...lRight.children].find(t => t.dataset.l === w[next] && !t.classList.contains('used'));
        oops(b, () => talk(T().next(nameOf(w[next]))));
      });
      b.style.animationDelay = 150 + i * 80 + 'ms';
      lRight.appendChild(b);
    });
    setPrompt(`<span class="lpicsm">${pic(e)}</span><span class="lspell">✏️</span>`);
    S.question = T().spellIt(w.toLowerCase());
    lLater(() => talk(S.question), 300);
  }
};

/* ================= Rewards: the gift and the ABC album ================= */
function giftTime() {
  lClear();
  lOver.className = 'loverlay show';
  lOver.innerHTML = `<button class="lgift" aria-label="Open the present"><span>🎁</span></button>`;
  const gift = lOver.querySelector('.lgift');
  let taps = 0;
  gift.addEventListener('click', () => {
    taps++;
    tone(440 * Math.pow(2, taps / 4), 0.2, 'triangle', 0.25);
    gift.style.setProperty('--grow', 1 + taps * 0.12);
    shakeIt(gift);
    if (taps === 3) openGift();
  });
  talk(T().gift);
}
function openGift() {
  const r = app.getBoundingClientRect();
  confetti(r.width / 2, r.height * 0.45, 70);
  sfx.chime();
  const isNew = !!S.newL;
  const l = isNew ? S.newL : pick(save.got);
  if (isNew && !save.got.includes(l)) { save.got.push(l); persist(); }
  const [w, e] = T().cards[l];
  lOver.innerHTML = `<div class="lreveal">${cardHTML(l, true)}<button class="play lnext" aria-label="Play again"><svg viewBox="0 0 24 24"><path fill="#fff" d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z"/></svg></button></div>`;
  talk(isNew ? T().got(nameOf(l), w) + (save.got.length === 26 ? ' ' + T().allDone : '') : T().card(nameOf(l), w));
  renderTop();
  lOver.querySelector('.lnext').addEventListener('click', () => {
    sfx.tap();
    const card = lOver.querySelector('.lcard');
    const a = pointIn(card), b = pointIn(lAlbumBtn);
    card.animate([{ transform: 'none' }, { transform: `translate(${b.x - a.x}px,${b.y - a.y}px) scale(.15) rotate(20deg)`, opacity: 0.4 }], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    lLater(() => { lAlbumBtn.classList.remove('bump'); void lAlbumBtn.offsetWidth; lAlbumBtn.classList.add('bump'); startRound(); }, 650);
  });
}
function cardHTML(l, big) {
  const [w, e] = T().cards[l], st = starsOf(l);
  return `<div class="lcard${big ? ' big' : ''}" style="--h:${hue(l)}"><b>${l}<i>${l.toLowerCase()}</i></b><span class="lpic">${pic(e)}</span><span class="lword">${w.toUpperCase()}</span>`
    + `<span class="lstars">${[1, 2, 3].map(k => `<em class="${k <= st ? 'on' : ''}">${STAR}</em>`).join('')}</span></div>`;
}
function openAlbum() {
  lClear();
  lOver.className = 'loverlay show';
  lOver.innerHTML = `<div class="lpanel"><div class="lhead"><span class="lalbumtitle">📖 <b>${save.got.length}</b> / 26</span>
    <button class="round lclose" aria-label="Back to the game"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="lgrid"></div></div>`;
  const grid = lOver.querySelector('.lgrid');
  ABC.forEach((l, i) => {
    const has = save.got.includes(l);
    const b = el('button', 'lslotcard' + (has ? '' : ' locked'), has ? cardHTML(l, false) : `<div class="lcard hidden"><b>?</b></div>`);
    b.style.animationDelay = i * 25 + 'ms';
    b.setAttribute('aria-label', has ? 'Letter ' + l : 'Hidden letter');
    b.addEventListener('click', () => {
      if (!has) { shakeIt(b); sfx.boing(); talk(T().locked); return; }
      sfx.tap();
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      talk(T().card(nameOf(l), T().cards[l][0]));
    });
    grid.appendChild(b);
  });
  lOver.querySelector('.lclose').addEventListener('click', () => { sfx.tap(); startRound(); });
  talk(T().album(save.got.length));
}
function closeOverlay() { lOver.className = 'loverlay'; lOver.innerHTML = ''; }

lAlbumBtn.addEventListener('click', () => { sfx.tap(); openAlbum(); });
lLang.addEventListener('click', () => {
  save.lang = save.lang === 'fr' ? 'en' : 'fr';
  persist();
  renderTop();
  sfx.tap();
  talk(T().hello);
  lLater(startRound, 1200);
});

function startLetters() {
  renderTop();
  closeOverlay();
  lClear();
  clearStage();
  lPrompt.innerHTML = '';
  talk(T().welcome);
  lLater(startRound, 1900);
}
function stopLetters() { lClear(); closeOverlay(); }

registerGame({
  group: 'words', id: 'letters', label: 'ABC', say: 'A, B, C!', cardClass: 'c-letters',
  icon: `<svg viewBox="0 0 100 100">
    <rect x="8" y="34" width="28" height="30" rx="7" fill="#ff7a7a" transform="rotate(-8 22 49)"/><text x="22" y="57" class="ico-num" transform="rotate(-8 22 49)">A</text>
    <rect x="36" y="44" width="28" height="30" rx="7" fill="#5ccf6a"/><text x="50" y="67" class="ico-num">B</text>
    <rect x="64" y="32" width="28" height="30" rx="7" fill="#4d9dff" transform="rotate(8 78 47)"/><text x="78" y="55" class="ico-num" transform="rotate(8 78 47)">C</text>
    <path d="M24 82h52" stroke="#ffb13d" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  start: startLetters, stop: stopLetters,
  /* Home closes the album or the gift first */
  onHome() {
    if (!lOver.classList.contains('show')) return false;
    startRound();
    return true;
  },
  /* typing a letter on a keyboard taps it */
  onKey(e) {
    if (!/^[a-z]$/i.test(e.key)) return;
    const k = e.key.toUpperCase();
    const b = [...screen.querySelectorAll('.lball, .ltile')].find(t => t.dataset.l === k && !t.classList.contains('wrong') && !t.classList.contains('used') && !t.classList.contains('popped'));
    if (b) b.click();
  }
});
})();
