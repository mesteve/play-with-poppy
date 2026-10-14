/* ================= Poppy's Bakery ================= */
/* Animal customers come in with an order, and each order is a little math task:
   counting on, fair sharing, quick look (seeing a number without counting),
   shapes, and putting things in size order. Every customer pays a coin; coins
   buy things for Poppy to wear (by counting coins out). The bakery levels up
   every 8 customers and the orders get a tiny bit harder. */
(() => {
'use strict';
const screen = addScreen('bakery', `
<div class="kstat" id="kStat"></div>
<div class="tray" id="kTray"></div>
<div class="cstage kstage">
  <div class="kcust" id="kCust"></div>
  <div class="kcounter" id="kCounter"></div>
  <div class="crow">
    <div id="kPoppy"></div>
    <div class="cright" id="kRight"></div>
  </div>
</div>
<button class="round kshopbtn" id="kShopBtn" aria-label="Poppy's shop"><span>🛍️</span></button>
<div class="kshop" id="kShop"></div>
`);

const SAVE_KEY = 'poppy-bakery';
const PER_LEVEL = 8;
const CUSTOMERS = [
  { e: '🐻', pitch: 0.7 }, { e: '🐰', pitch: 1.8 }, { e: '🐷', pitch: 1.2 }, { e: '🐱', pitch: 1.7 },
  { e: '🐶', pitch: 1.1 }, { e: '🐼', pitch: 0.9 }, { e: '🐨', pitch: 1.0 }, { e: '🐯', pitch: 0.8 },
  { e: '🦁', pitch: 0.6 }, { e: '🐮', pitch: 0.75 }, { e: '🐸', pitch: 1.3 }, { e: '🐵', pitch: 1.5 }
];
const TREATS = [
  { e: '🧁', one: 'cupcake', many: 'cupcakes' }, { e: '🍩', one: 'donut', many: 'donuts' },
  { e: '🍪', one: 'cookie', many: 'cookies' }, { e: '🥐', one: 'croissant', many: 'croissants' },
  { e: '🍓', one: 'strawberry', many: 'strawberries' }, { e: '🍒', one: 'cherry', many: 'cherries' }
];
const CAKES = [{ e: '🎂', many: 'cakes' }, { e: '🧁', many: 'cupcakes' }, { e: '🍩', many: 'donuts' }];
const TYPES = ['make', 'share', 'look', 'shape', 'order'];
const COIN = '🪙';

/* ---- saved progress ---- */
let save = loadData(SAVE_KEY, {});
save = {
  served: Math.max(0, save.served | 0),
  coins: Math.max(0, save.coins | 0),
  owned: Array.isArray(save.owned) ? save.owned.filter(id => OUTFIT[id]) : []
};
const persist = () => saveData(SAVE_KEY, save);
const level = () => 1 + Math.floor(save.served / PER_LEVEL);
const tier = () => Math.min(2, level() - 1);  // 0, 1, 2: how hard the orders are

const kStat = $('#kStat'), kCust = $('#kCust'), kCounter = $('#kCounter'), kRight = $('#kRight');
const kShop = $('#kShop'), kShopBtn = $('#kShopBtn');
const kPoppy = makePoppy($('#kPoppy'), 'idle');
const tray = makeTray($('#kTray'), PER_LEVEL);
const K = { tok: 0, timers: [], busy: false, wrong: 0, type: '', lastType: '', custs: [], cust: null, item: null, last: 0, question: '', answer: null, rightEl: null, greeted: false };
const kLater = (fn, ms) => { const tok = K.tok; K.timers.push(setTimeout(() => { if (tok === K.tok) fn(); }, ms)); };
const kClear = () => { K.timers.forEach(clearTimeout); K.timers = []; K.tok++; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function pItem(list) { let it; do { it = pick(list); } while (it === K.item); return (K.item = it); }
function pNum(lo, hi) { let n, t = 0; do { n = randInt(lo, hi); } while (n === K.last && hi > lo && ++t < 6); return (K.last = n); }
const custSay = text => say(text, { pitch: K.cust ? K.cust.pitch : 1.45 });
const coinSound = () => { tone(988, 0.08, 'square', 0.07); tone(1319, 0.3, 'square', 0.07, 0.08); };
const shakeIt = e => { e.classList.remove('nope'); void e.offsetWidth; e.classList.add('nope'); };

function renderStat() {
  kStat.innerHTML = `<span class="klv" aria-label="Bakery level">👩‍🍳<b>${level()}</b></span><span class="kc" aria-label="Coins">${COIN}<b>${save.coins}</b></span>`;
  const canBuy = Object.entries(OUTFIT).some(([id, o]) => !save.owned.includes(id) && o.price <= save.coins);
  kShopBtn.classList.toggle('ready', canBuy);
}

/* ================= Customers ================= */
function newCustomer(first) {
  kClear();
  K.busy = false; K.wrong = 0; K.answer = null; K.rightEl = null;
  kCounter.innerHTML = ''; kCounter.className = 'kcounter'; kRight.innerHTML = '';
  const type = first ? 'make' : pick(TYPES.filter(t => t !== K.lastType));
  K.type = K.lastType = type;
  const n = type === 'share' ? (tier() === 2 && Math.random() < 0.5 ? 3 : 2) : 1;
  K.custs = shuffle(CUSTOMERS).slice(0, n);
  K.cust = K.custs[0];
  kCust.innerHTML = `<div class="kfaces">${K.custs.map((c, i) => `<span class="kface" style="animation-delay:${i * 120}ms">${c.e}</span>`).join('')}</div><div class="kbubble" id="kBubble"></div>`;
  if (!ORDERS[type](tier())) kLater(() => custSay(K.question), 800);
}
function setBubble(html) {
  const b = $('#kBubble');
  b.innerHTML = html + `<button class="again" aria-label="Hear it again">${ICON_ON}</button>`;
  b.querySelector('.again').addEventListener('click', () => custSay(K.question));
}
/* light things up one by one with a number badge */
function countAlong(items, done) {
  items.forEach(t => { const b = t.querySelector('.badge'); if (b) b.remove(); });
  items.forEach((t, i) => kLater(() => {
    t.classList.add('lit');
    setTimeout(() => t.classList.remove('lit'), 360);
    const b = el('span', 'badge', String(i + 1));
    t.appendChild(b);
    countTone(i + 1);
    say(Word(i + 1) + '!');
  }, 300 + i * 650));
  kLater(done, 300 + items.length * 650 + 250);
}
function numberAnswers(correct, lo, hi) {
  const opts = new Set([correct]);
  let guard = 0;
  while (opts.size < 3 && guard++ < 80) { const v = correct + randInt(-2, 2); if (v >= lo && v <= hi) opts.add(v); }
  while (opts.size < 3) opts.add(randInt(lo, hi));
  [...opts].sort((a, b) => a - b).forEach((v, i) => {
    const b = el('button', 'ans', `<b>${v}</b>`);
    b.dataset.v = v;
    b.setAttribute('aria-label', String(v));
    b.style.setProperty('--abg', ANS_COLORS[i][0]);
    b.style.setProperty('--ash', ANS_COLORS[i][1]);
    b.style.animationDelay = 100 + i * 90 + 'ms';
    b.addEventListener('click', () => K.onAnswer(b, v));
    if (v === correct) K.rightEl = b;
    kRight.appendChild(b);
  });
}

const ORDERS = {
  /* Counting on: some treats are already in the box, add more to reach the number */
  make(t) {
    const it = pItem(TREATS);
    const want = pNum([3, 4, 5][t], [5, 7, 10][t]), have = randInt(t === 2 ? 2 : 1, want - 1);
    const box = el('div', 'kbox'), stock = el('button', 'kstock', `<span>${it.e}</span><b>+</b>`);
    stock.setAttribute('aria-label', 'Add one ' + it.one);
    const items = () => [...box.children];
    const clearBadges = () => items().forEach(x => { x.classList.remove('lit'); const b = x.querySelector('.badge'); if (b) b.remove(); });
    const addOne = pre => {
      const x = el('button', 'kitm', it.e);
      x.setAttribute('aria-label', 'Take out one ' + it.one);
      x.addEventListener('click', () => {
        if (K.busy) return;
        clearBadges();
        x.remove();
        sfx.blip();
        say(Word(items().length) + '!');
      });
      box.appendChild(x);
      if (!pre) { clearBadges(); countTone(items().length); say(Word(items().length) + '!'); }
    };
    for (let i = 0; i < have; i++) addOne(true);
    stock.addEventListener('click', () => { if (!K.busy && items().length < 12) { sfx.blip(); addOne(false); } });
    kCounter.append(box, stock);
    const bell = el('button', 'kbell', '<span>🛎️</span>');
    bell.setAttribute('aria-label', 'Ring the bell when the box is ready');
    bell.addEventListener('click', () => {
      if (K.busy) return;
      const c = items().length;
      if (c === want) { serve(box); return; }
      K.wrong++;
      K.busy = true;
      sfx.boing();
      shakeIt(bell);
      countAlong(items(), () => {
        K.busy = false;
        custSay(c < want
          ? `That's ${WORDS[c] || c}. I wanted ${WORDS[want]}. ${want - c === 1 ? 'One more' : 'Some more'}, please!`
          : `Oops, that's too many! I only want ${WORDS[want]}.`);
      });
    });
    kRight.appendChild(bell);
    setBubble(`<b>${want}</b><span>${it.e}</span>`);
    K.question = `Hello! I'd like ${WORDS[want]} ${nm(it, want)}, please. There ${have === 1 ? 'is' : 'are'} already ${WORDS[have]} in the box!`;
  },

  /* Fair sharing: give every friend the same number (early division) */
  share(t) {
    const friends = K.custs.length, it = pItem(TREATS);
    const total = friends === 3 ? pick([6, 9]) : pick([[4, 6], [6, 8], [8, 10]][t]);
    kCounter.classList.add('kcol');
    const pile = el('div', 'kpile'), plates = el('div', 'kplates');
    plates.style.setProperty('--np', friends);
    const pileAdd = () => pile.appendChild(el('span', 'kitm still', it.e));
    for (let i = 0; i < total; i++) pileAdd();
    const grids = () => [...plates.children].map(p => p.querySelector('.kpgrid'));
    const counts = () => grids().map(g => g.children.length);
    let guide = false;  // after a mistake, the friend who should get the next one glows
    const refresh = () => {
      [...plates.children].forEach((p, i) => { p.querySelector('.kpnum').textContent = counts()[i]; p.classList.remove('glow'); });
      if (guide && pile.children.length) { const c = counts(); plates.children[c.indexOf(Math.min(...c))].classList.add('glow'); }
    };
    K.custs.forEach(c => {
      const p = el('button', 'kplate', `<span class="kpface">${c.e}</span><div class="kpgrid"></div><b class="kpnum">0</b>`);
      p.setAttribute('aria-label', 'Give one to ' + c.e);
      p.style.setProperty('--pc', Math.min(5, total / friends));
      p.addEventListener('click', () => {
        if (K.busy || !pile.children.length) return;
        pile.lastChild.remove();
        p.querySelector('.kpgrid').appendChild(el('span', 'kitm still', it.e));
        refresh();
        countTone(p.querySelector('.kpgrid').children.length);
        if (!pile.children.length) kLater(check, 500);
      });
      plates.appendChild(p);
    });
    function check() {
      const c = counts();
      if (c.every(v => v === c[0])) { serve(plates); return; }
      K.wrong++;
      K.busy = true;
      sfx.boing();
      custSay(friends === 2 ? `Hmm, that's not fair! ${Word(c[0])} and ${WORDS[c[1]]}.` : "Hmm, that's not fair! We don't have the same.");
      kLater(() => {
        grids().forEach(g => { g.innerHTML = ''; });
        for (let i = 0; i < total; i++) pileAdd();
        sfx.blip();
        guide = true;
        refresh();
        K.busy = false;
        say("Let's try again! One for each friend, one at a time.");
      }, 3000);
    }
    kCounter.append(pile, plates);
    setBubble(`<b>${total}</b><span>${it.e}</span><span class="kfair">${K.custs.map(c => c.e).join('<i>=</i>')}</span>`);
    K.question = `Hello! We are ${WORDS[friends]} friends. Please share these ${WORDS[total]} ${it.many}, so we all get the same!`;
  },

  /* Quick look: a card flashes, say how many without counting one by one */
  look(t) {
    const it = pItem(TREATS);
    let parts;
    if (t === 2) { const a = randInt(2, 5); parts = [a, randInt(1, Math.min(5, 9 - a))]; }
    else parts = [pNum(1, t === 0 ? 4 : 6)];
    const n = parts.reduce((a, b) => a + b, 0);
    K.answer = n;
    const wrap = el('button', 'kcards back');
    wrap.setAttribute('aria-label', 'Peek at the card again');
    parts.forEach((p, i) => {
      if (i) wrap.appendChild(el('span', 'kplus', '+'));
      const card = el('div', 'kcard');
      for (let c = 0; c < 9; c++) card.appendChild(el('span', DICE[p].includes(c) ? 'kdot' : 'kgap', DICE[p].includes(c) ? it.e : ''));
      wrap.appendChild(card);
    });
    const dots = () => [...wrap.querySelectorAll('.kdot')];
    let peeking = false;
    wrap.addEventListener('click', () => {
      if (K.busy || peeking || !wrap.classList.contains('back')) return;
      peeking = true;
      wrap.classList.remove('back');
      sfx.tap();
      kLater(() => { wrap.classList.add('back'); peeking = false; }, 1500);
    });
    kCounter.appendChild(wrap);
    K.busy = true;
    setBubble(`<span>${it.e}</span><span class="q">?</span>`);
    K.question = `How many ${it.many} were on my ${parts.length > 1 ? 'cards' : 'card'}?`;
    kLater(() => custSay(`Look quickly! How many ${it.many}?`), 700);
    kLater(() => { wrap.classList.remove('back'); sfx.chime(); }, 1300);
    kLater(() => {
      wrap.classList.add('back');
      numberAnswers(n, 1, t === 0 ? 5 : t === 1 ? 7 : 10);
      K.busy = false;
      custSay(K.question);
    }, 1300 + [2600, 2200, 2800][t]);
    K.onAnswer = (b, v) => {
      if (K.busy || b.classList.contains('wrong')) return;
      if (v === n) { b.classList.add('right'); wrap.classList.remove('back'); serve(b); return; }
      K.wrong++;
      b.classList.add('wrong');
      sfx.boing();
      if (K.wrong === 1) {
        K.busy = true;
        wrap.classList.remove('back');
        custSay("Let's count them together!");
        kLater(() => countAlong(dots(), () => { K.busy = false; custSay(`${Word(n)}! Which one is ${WORDS[n]}?`); }), 1000);
      } else { custSay('Try this one!'); if (K.rightEl) K.rightEl.classList.add('glow'); }
    };
    return true;
  },

  /* Shapes: by name first, then by their corners */
  shape(t) {
    let target, ids, attr = null;
    if (t === 0) { ids = shuffle(['circle', 'square', 'triangle']); target = pick(ids); }
    else if (t === 1 || Math.random() < 0.5) {
      target = pick(Object.keys(SHAPES));
      ids = shuffle([target, ...shuffle(Object.keys(SHAPES).filter(k => k !== target)).slice(0, 2)]);
    } else {
      attr = pick(ATTRS);
      target = pick(attr.fits);
      const others = Object.keys(SHAPES).filter(k => !attr.fits.includes(k) && !(attr.not || []).includes(k));
      ids = shuffle([target, ...shuffle(others).slice(0, 2)]);
    }
    K.answer = target;
    ids.forEach((id, i) => {
      const b = el('button', 'kcookie', cookieSVG(id));
      b.setAttribute('aria-label', SHAPES[id].name + ' cookie');
      b.style.animationDelay = i * 90 + 'ms';
      if (id === target) K.rightEl = b;
      b.addEventListener('click', () => {
        if (K.busy || b.classList.contains('wrong')) return;
        if (id === target) { b.classList.add('right'); serve(b); return; }
        K.wrong++;
        b.classList.add('wrong');
        sfx.boing();
        if (K.wrong === 1) {
          const s = SHAPES[id];
          custSay(`That one is a ${s.name}${attr ? `. It has ${s.says}` : ''}. Can you find ${attr ? 'the one with ' + attr.says : 'the ' + SHAPES[target].name}?`);
        } else { custSay('Try this one!'); K.rightEl.classList.add('glow'); }
      });
      kCounter.appendChild(b);
    });
    if (attr) {
      setBubble(`<b>${attr.n}</b><span class="kicon">${CORNER_ICON}</span>`);
      K.question = `Can I have the cookie with ${attr.says}, please?`;
    } else {
      setBubble(t === 0 ? `<span class="kshape">${outlineSVG(target)}</span>` : `<span class="w">${SHAPES[target].name}</span>`);
      K.question = `Can I have a ${SHAPES[target].name} cookie, please?`;
    }
  },

  /* Size order: line things up from smallest to biggest (or the other way) */
  order(t) {
    const n = t === 2 ? 4 : 3, desc = t === 2 && Math.random() < 0.5, it = pick(CAKES);
    const sizes = n === 3 ? [0.5, 0.75, 1] : [0.42, 0.62, 0.81, 1];
    kCounter.classList.add('kcol');
    const line = el('div', 'kline'), slots = el('div', 'kslots');
    for (let i = 0; i < n; i++) slots.appendChild(el('div', 'kslot'));
    let next = 0;
    const expected = () => (desc ? n - 1 - next : next);
    const cakes = [];
    shuffle([...Array(n).keys()]).forEach((si, i) => {
      const b = el('button', 'kcake', it.e);
      b.style.setProperty('--sz', sizes[si]);
      b.style.animationDelay = i * 90 + 'ms';
      b.setAttribute('aria-label', ['smallest', 'small', 'big', 'biggest'][n === 3 ? [0, 2, 3][si] : si] + ' ' + it.many.slice(0, -1));
      cakes[si] = b;
      b.addEventListener('click', () => {
        if (K.busy || b.classList.contains('placed')) return;
        if (si === expected()) {
          b.classList.remove('glow', 'nope');
          b.classList.add('placed');
          slots.children[next].appendChild(b);
          countTone(next + 1);
          next++;
          if (next === n) serve(slots);
          return;
        }
        K.wrong++;
        shakeIt(b);
        sfx.boing();
        if (K.wrong === 1) custSay(desc ? 'Look for the biggest one!' : 'Look for the smallest one!');
        else cakes[expected()].classList.add('glow');
      });
      line.appendChild(b);
    });
    kCounter.append(line, slots);
    const shown = (desc ? [...sizes].reverse() : sizes).map(s => `<span class="ksz" style="--sz:${s}">${it.e}</span>`).join('');
    setBubble(`<span class="kszrow">${shown}</span>`);
    K.question = `Please line up my ${it.many}, from the ${desc ? 'biggest to the smallest' : 'smallest to the biggest'}!`;
  }
};

/* ---- shapes for the cookie orders ---- */
const starPath = (() => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 19 : 45, a = -Math.PI / 2 + i * Math.PI / 5;
    d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (54 + r * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
})();
const SHAPES = {
  circle:    { name: 'circle', says: 'no corners', d: '<circle cx="50" cy="50" r="42"/>', chips: [[38, 42], [60, 40], [50, 62], [66, 60]] },
  square:    { name: 'square', says: 'four corners', d: '<rect x="11" y="11" width="78" height="78" rx="5"/>', chips: [[34, 34], [64, 38], [40, 64], [66, 66]] },
  triangle:  { name: 'triangle', says: 'three corners', d: '<path d="M50 7L94 88H6Z"/>', chips: [[50, 42], [38, 70], [62, 68]] },
  rectangle: { name: 'rectangle', says: 'four corners', d: '<rect x="4" y="24" width="92" height="52" rx="5"/>', chips: [[24, 40], [50, 58], [76, 40]] },
  star:      { name: 'star', says: 'five points', d: `<path d="${starPath}"/>`, chips: [[50, 50], [42, 64], [58, 63]] },
  heart:     { name: 'heart', says: 'a pointy bottom', d: '<path d="M50 90C22 70 6 52 10 32C14 14 36 10 50 28C64 10 86 14 90 32C94 52 78 70 50 90Z"/>', chips: [[34, 36], [64, 36], [50, 58]] }
};
const ATTRS = [
  { n: 3, says: 'three corners', fits: ['triangle'] },
  { n: 4, says: 'four corners', fits: ['square', 'rectangle'] },
  { n: 0, says: 'no corners', fits: ['circle'], not: ['heart'] },
  { n: 5, says: 'five points', fits: ['star'] }
];
const CORNER_ICON = '<svg viewBox="0 0 40 40"><path d="M6 34L20 8L34 34" fill="none" stroke="#ff7a3d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="8" r="5" fill="#ff7a3d"/></svg>';
function cookieSVG(id) {
  const s = SHAPES[id];
  return `<svg viewBox="0 0 100 100"><g class="kdough">${s.d}</g>${s.chips.map(([x, y]) => `<circle class="kchip" cx="${x}" cy="${y}" r="4.5"/>`).join('')}</svg>`;
}
function outlineSVG(id) { return `<svg viewBox="0 0 100 100"><g class="kline-shape">${SHAPES[id].d}</g></svg>`; }

/* ================= Serving, coins and levels ================= */
function serve(atEl) {
  K.busy = true;
  kClear();
  kRight.querySelectorAll('.glow').forEach(g => g.classList.remove('glow'));
  sfx.tada();
  const p = pointIn(atEl, 0.5, 0.3);
  confetti(p.x, p.y, 45);
  jump(kPoppy);
  kCust.querySelectorAll('.kface').forEach(f => f.classList.add('happy'));
  custSay(pick(['Yum! Thank you!', 'Thank you, Poppy!', 'Delicious! Thank you!', 'Yummy yummy!']));
  kLater(() => flyCoin(kCust.querySelector('.kface'), () => {
    save.coins++;
    save.served++;
    persist();
    renderStat();
    const c = tray.add();
    if (save.served % PER_LEVEL === 0 || c === PER_LEVEL) kLater(levelUp, 500);
    else kLater(leave, 700);
  }), 900);
}
function flyCoin(from, done) {
  const a = pointIn(from), target = kStat.querySelector('.kc'), b = pointIn(target);
  const d = el('div', 'flyer kcoinfly', COIN);
  d.style.left = a.x + 'px'; d.style.top = a.y + 'px';
  fx.appendChild(d);
  coinSound();
  const dx = b.x - a.x, dy = b.y - a.y;
  d.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(1.3)` },
    { transform: `translate(${dx}px,${dy}px) scale(.7)` }
  ], { duration: 750, easing: 'ease-in-out' }).onfinish = () => {
    d.remove();
    done();
    const c = kStat.querySelector('.kc');
    if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  };
}
function levelUp() {
  bigCelebrate();
  jump(kPoppy);
  say(`Hooray! Your bakery is now level ${level()}! Here are three bonus coins!`);
  for (let i = 0; i < 3; i++) kLater(() => flyCoin(kPoppy, () => { save.coins++; persist(); renderStat(); }), 1400 + i * 350);
  kLater(() => tray.reset(), 2600);
  kLater(leave, 4200);
}
function leave() {
  kCust.querySelectorAll('.kface').forEach(f => f.classList.add('leave'));
  kLater(() => newCustomer(false), 800);
}

/* ================= The shop: buy things for Poppy by counting out coins ================= */
function openShop() {
  kClear();
  K.busy = true;
  kShop.classList.add('show');
  renderShop();
  say('Welcome to the shop! What would you like for Poppy?');
}
function closeShop() {
  kShop.classList.remove('show');
  kShop.innerHTML = '';
}
function shopFrame(inner) {
  kShop.innerHTML = `<div class="kpanel"><div class="kshead"><span class="kc">${COIN}<b>${save.coins}</b></span>
    <button class="round kclose" aria-label="Back to the bakery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="kshopbody"><div class="kshoppoppy"></div>${inner}</div></div>`;
  kShop.querySelector('.kclose').addEventListener('click', () => { sfx.tap(); closeShop(); newCustomer(false); });
  return makePoppy(kShop.querySelector('.kshoppoppy'), 'idle');
}
function renderShop() {
  const pop = shopFrame('<div class="kitems"></div>');
  const box = kShop.querySelector('.kitems');
  Object.entries(OUTFIT).forEach(([id, o], i) => {
    const owned = save.owned.includes(id), worn = poppyWear[o.slot] === id, locked = !owned && o.price > save.coins;
    const b = el('button', 'kitem' + (owned ? ' owned' : '') + (worn ? ' worn' : '') + (locked ? ' locked' : ''),
      `<span class="ke">${o.e}</span>` + (owned ? (worn ? '<b class="kwear">✓</b>' : '') : `<span class="kprice"><b>${o.price}</b>${COIN}</span>`));
    b.style.animationDelay = i * 50 + 'ms';
    b.setAttribute('aria-label', o.name + (owned ? (worn ? ', wearing' : ', owned') : `, ${o.price} coins`));
    b.addEventListener('click', () => {
      if (owned) {
        setWear(o.slot, worn ? null : id);
        sfx.tap();
        say(worn ? 'Off it goes!' : pick(['Looking good!', 'So pretty!', 'Wow, Poppy!', 'I love it!']));
        renderShop();
        jump(kShop.querySelector('.kshoppoppy'));
      } else if (locked) {
        shakeIt(b);
        sfx.boing();
        say(`The ${o.name} costs ${o.price} coins. You have ${save.coins}. Help more customers to earn coins!`);
      } else pay(id);
    });
    box.appendChild(b);
  });
  return pop;
}
function pay(id) {
  const o = OUTFIT[id];
  shopFrame(`<div class="kpay"><div class="kpitem">${o.e}</div><div class="ktill"></div><div class="kpurse"></div></div>`);
  const till = kShop.querySelector('.ktill'), purse = kShop.querySelector('.kpurse');
  for (let i = 0; i < o.price; i++) till.appendChild(el('span', 'kslotc'));
  let paid = 0;
  for (let i = 0; i < Math.min(save.coins, o.price + 3); i++) {
    const c = el('button', 'kcoin', COIN);
    c.setAttribute('aria-label', 'Pay one coin');
    c.addEventListener('click', () => {
      if (paid >= o.price) return;
      c.remove();
      const s = till.children[paid++];
      s.textContent = COIN;
      s.classList.add('full');
      coinSound();
      say(Word(paid) + '!');
      if (paid === o.price) setTimeout(() => buy(id), 700);
    });
    purse.appendChild(c);
  }
  say(`The ${o.name} costs ${WORDS[o.price]} coins. Tap ${WORDS[o.price]} coins to pay!`);
}
function buy(id) {
  const o = OUTFIT[id];
  if (!kShop.classList.contains('show') || save.owned.includes(id) || save.coins < o.price) return;
  save.coins -= o.price;
  save.owned.push(id);
  persist();
  setWear(o.slot, id);
  renderStat();
  sfx.tada();
  bigCelebrate();
  const pop = renderShop();
  jump(pop);
  say(`Thank you! Poppy loves the ${o.name}!`);
}
kShopBtn.addEventListener('click', () => { sfx.tap(); openShop(); });

/* ================= Start / stop ================= */
function startBakery() {
  closeShop();
  renderStat();
  tray.reset();
  for (let i = 0; i < save.served % PER_LEVEL; i++) tray.add();
  kCust.innerHTML = ''; kCounter.innerHTML = ''; kRight.innerHTML = '';
  kClear();
  const first = !K.greeted;
  K.greeted = true;
  say(first ? "Welcome to Poppy's bakery! Let's help the customers!" : 'Back to the bakery! Here comes a customer!');
  kLater(() => newCustomer(first), 2200);
}
function stopBakery() { kClear(); closeShop(); }

registerGame({
  id: 'bakery', label: 'Bakery', say: "Poppy's bakery!", cardClass: 'c-bakery',
  icon: `<svg viewBox="0 0 100 100">
    <path d="M14 40h72l-6 14H20z" fill="#ff8fb3"/><path d="M14 40l8-16h56l8 16" fill="#fff" stroke="#ff8fb3" stroke-width="4" stroke-linejoin="round"/>
    <path d="M26 40v-16M40 40V24M54 40V24M68 40V24" stroke="#ff8fb3" stroke-width="4"/>
    <rect x="20" y="54" width="60" height="34" rx="4" fill="#ffe7c2"/>
    <path d="M38 76h24l-3 10H41z" fill="#ff7ab6"/><path d="M37 76q0-11 13-11t13 11z" fill="#fff6e8" stroke="#f2c38b" stroke-width="2"/>
    <circle cx="50" cy="63" r="3.5" fill="#ff5d5d"/>
  </svg>`,
  start: startBakery, stop: stopBakery,
  /* Home closes the shop first */
  onHome() {
    if (!kShop.classList.contains('show')) return false;
    closeShop();
    newCustomer(false);
    return true;
  },
  /* number keys pick an answer */
  onKey(e) {
    if (!/^[0-9]$/.test(e.key)) return;
    const b = kRight.querySelector(`.ans[data-v="${e.key === '0' ? 10 : e.key}"]`);
    if (b) b.click();
  }
});
})();
