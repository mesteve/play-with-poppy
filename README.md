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
- **Nothing to sign up for.** No ads, no accounts, no analytics. The only things saved, on the device itself, are whether the sound is on and the Number path progress.

## The games

| | Game | How it plays | Practices |
|---|---|---|---|
| 🫧 | **Bubbles** | Pop the floating bubbles, some with a treat inside. Poppy counts each pop up to ten. Tap empty space to blow more. | Cause and effect, hand–eye coordination |
| 🌳 | **Hide and seek** | Poppy hides behind a bush, a box, a pot or a playhouse. If you need help, Poppy's tail peeks out as a hint. | Looking carefully, finding hidden things |
| 🎵 | **Music** | Tap an 8-note rainbow xylophone while Poppy dances, or press the star to hear *Twinkle Twinkle Little Star*. | Rhythm, sounds, free play |
| 🍎 | **Counting** | "How many apples?", "Give me three strawberries" and simple additions. Numbers go up to 5, then 7, then 10 as the child gets better. | Counting, number recognition, first additions |
| ⭐ | **Number path** | A trail of 12 stepping stones, each a short level of 5 questions. Finishing a stone earns 1 to 3 stars, a sticker, and unlocks the next one. | Comparing amounts, reading numbers, patterns, number order, first take-aways |

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

A wrong answer is never a failure. The first one brings a hint (Poppy counts along, or shows the dots), and the second one makes the right answer glow. Stars only reflect how many tries it took: 3 stars for at most one slip, 2 for a few, 1 otherwise. Any finished stone can be replayed to earn more stars.

## Tips for grown-ups

- **Add it to the home screen.** On iPhone or iPad, open the link in Safari, then tap Share → *Add to Home Screen*. It opens like an app.
- **Go full screen** with the corner button so little fingers stay in the game.
- **Sound on.** Poppy's voice uses the device's built-in speech, so make sure the device isn't muted.
- **Number path progress is saved on this device**, in this browser's local storage. It doesn't follow the child to another device, and clearing the browser's data erases it. On iPhone and iPad, adding the game to the Home Screen keeps it safest: Safari may clear storage for websites that haven't been opened in a while.
- **To start the path over**, press and hold the small ↺ button in the bottom corner of the map for a second and a half.

## How it's built

The whole game is one file, [`index.html`](index.html): plain HTML, CSS and JavaScript, with no build step and no dependencies. Every drawing is inline SVG, the sounds are generated in the browser with the Web Audio API, and Poppy's voice comes from the Web Speech API.

To run it locally, just open `index.html` in a browser.

Every push to `main` is published automatically with GitHub Pages.
