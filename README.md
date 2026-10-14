# 🦊 Play with Poppy

A gentle little playroom for toddlers and preschoolers, hosted by Poppy the fox.

**▶ Play now: [mesteve.github.io/play-with-poppy](https://mesteve.github.io/play-with-poppy/)**

## The goal

Play with Poppy gives young children a calm, safe place to play on a phone, tablet or computer, while practicing a few early skills: cause and effect, finding hidden things, making music and counting.

Kids don't need to read anything. Poppy says every instruction out loud, and every tap gets a sound, an animation or a cheer.

A few rules the game follows:

- **No reading needed.** Poppy speaks every question, and a speaker button replays it.
- **No way to fail.** A wrong tap gets a friendly "boing" and a hint, never a "game over".
- **Made for little hands.** Big buttons, big targets, and mashing the keyboard does something fun.
- **Nothing to sign up for.** No ads, no accounts, no analytics. The only things saved, on the device itself, are whether the sound is on, the Number path and Bakery progress, and what Poppy is wearing.

## The games

| | Game | How it plays | Practices |
|---|---|---|---|
| 🫧 | **Bubbles** | Pop the floating bubbles, some with a treat inside. Poppy counts each pop up to ten. Tap empty space to blow more. | Cause and effect, hand–eye coordination |
| 🌳 | **Hide and seek** | Poppy hides behind a bush, a box, a pot or a playhouse. If you need help, Poppy's tail peeks out as a hint. | Looking carefully, finding hidden things |
| 🎵 | **Music** | Tap an 8-note rainbow xylophone while Poppy dances, or press the star to hear *Twinkle Twinkle Little Star*. | Rhythm, sounds, free play |
| 🍎 | **Counting** | "How many apples?", "Give me three strawberries" and simple additions. Numbers go up to 5, then 7, then 10 as the child gets better. | Counting, number recognition, first additions |
| ⭐ | **Number path** | A trail of 20 stepping stones, each a short level of 5 questions. Finishing a stone earns 1 to 3 stars, a sticker, and unlocks the next one. | Comparing amounts, reading numbers, patterns, number order, first take-aways |
| 🧁 | **Bakery** | Animal customers come to Poppy's bakery with orders. Each one served pays a coin, and coins buy things for Poppy to wear. | Counting on, fair sharing, seeing numbers at a glance, shapes, ordering by size |

Each game has a star tray that fills up as the child plays, followed by a big confetti celebration.

### The Number path levels

Number path is a step up from Counting, for children around 4 who are ready for a little challenge. The stones get harder along the way:

| Stones | Question |
|---|---|
| 1 and 6 | Which group has more? (later: which has *fewer*?) |
| 2 and 7 | Find the group that matches a written number, up to 5, then up to 10 |
| 3 and 8 | What comes next in the pattern? (🍎🍌🍎🍌, then 🍎🍌🐟 or 🍎🍎🍌) |
| 4 and 9 | Which number is missing? (2, 3, ?, 5) |
| 5 and 10 | Little take-away stories: "Five ducks. Two swim away. How many are left?" |
| 11 | Which number is bigger? (just the numbers, no dots) |
| 12 | A mix of everything |
| 13 to 19 | The same questions again with numbers a little higher: more/fewer up to 10, matching up to 12, longer patterns (🍎🍎🍌🍌, 🍎🍌🍎🐟), missing numbers up to 15 then 20, take-aways up to 10, bigger number up to 15 |
| 20 | A mix of everything, with the bigger numbers |

A wrong answer is never a failure. The first one brings a hint (Poppy counts along, or shows the dots), and the second one makes the right answer glow. Stars only reflect how many tries it took: 3 stars for at most one slip, 2 for a few, 1 otherwise. Any finished stone can be replayed to earn more stars.

### The Bakery orders

The Bakery practices skills the other games don't, still at the level of a 4-year-old. Customers order one of five things:

| Order | What the child does | Why it matters |
|---|---|---|
| 📦 **Fill the box** | "I'd like six cupcakes. There are already four in the box!" Add treats, then ring the bell. | Counting on from a number instead of starting again at one, the first step toward adding |
| 🍪 **Share fairly** | Two or three friends want the same number of cookies. Give them out, one tap at a time. | Equal sharing, the idea behind division |
| 👀 **Quick look** | A card shows some cherries for two seconds, then turns over. How many were there? | Seeing small amounts at a glance without counting one by one (*subitizing*) |
| 🔺 **Shapes** | "Can I have a triangle cookie?", later "the cookie with four corners". | Naming shapes, then describing them by their corners |
| 🎂 **Line up** | Put the cakes in order from smallest to biggest (or the other way). | Comparing and ordering by size |

Every 8 customers the bakery goes up a level, with 3 bonus coins, and the orders get a tiny bit harder: bigger numbers, three friends to share between, two cards to add up at a glance, and shapes by their corners.

Coins are spent in the shop (the pink bag button) on a bow, a flower, sunglasses, a cap, a sun hat, a top hat or a crown, from 3 to 10 coins. To pay, the child taps the right number of coins, so even shopping is counting. Poppy then wears the new item **in every game**, and tapping an item in the shop puts it on or takes it off.

## Tips for grown-ups

- **Add it to the home screen.** On iPhone or iPad, open the link in Safari, then tap Share → *Add to Home Screen*. It opens like an app.
- **Go full screen** with the corner button so little fingers stay in the game.
- **Sound on.** Poppy's voice uses the device's built-in speech, so make sure the device isn't muted.
- **Progress is saved on this device** (Number path stars, Bakery coins and level, Poppy's outfit), in this browser's local storage. It doesn't follow the child to another device, and clearing the browser's data erases it. On iPhone and iPad, adding the game to the Home Screen keeps it safest: Safari may clear storage for websites that haven't been opened in a while.
- **To start the path over**, press and hold the small ↺ button in the bottom corner of the map for a second and a half.

## How it's built

Plain HTML, CSS and JavaScript, with no build step and no dependencies. Every drawing is inline SVG or emoji, the sounds are generated in the browser with the Web Audio API, and Poppy's voice comes from the Web Speech API.

```
index.html          the page shell: backdrop, top bar, start screen and menu
js/core.js          shared pieces: sound, voice, Poppy and her outfit, effects, star trays, saving
js/games/*.js       one file per game
js/main.js          builds the menu from the games and handles navigation
css/main.css        shared styles
css/games/*.css     one stylesheet per game
```

Each game file creates its own screen, brings its own menu card and calls `registerGame({ id, label, ..., start, stop })`. To add a game, add a `js/games/` file and a `css/games/` file, then list both in `index.html`.

To run it locally, just open `index.html` in a browser.

Every push to `main` is published automatically with GitHub Pages.
