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
- **Nothing to sign up for.** No ads, no accounts, no analytics. The only thing saved is whether the sound is on.

## The games

| | Game | How it plays | Practices |
|---|---|---|---|
| 🫧 | **Bubbles** | Pop the floating bubbles, some with a treat inside. Poppy counts each pop up to ten. Tap empty space to blow more. | Cause and effect, hand–eye coordination |
| 🌳 | **Hide and seek** | Poppy hides behind a bush, a box, a pot or a playhouse. If you need help, Poppy's tail peeks out as a hint. | Looking carefully, finding hidden things |
| 🎵 | **Music** | Tap an 8-note rainbow xylophone while Poppy dances, or press the star to hear *Twinkle Twinkle Little Star*. | Rhythm, sounds, free play |
| 🍎 | **Counting** | "How many apples?", "Give me three strawberries" and simple additions. Numbers go up to 5, then 7, then 10 as the child gets better. | Counting, number recognition, first additions |

Each game has a star tray that fills up as the child plays, followed by a big confetti celebration.

## Tips for grown-ups

- **Add it to the home screen.** On iPhone or iPad, open the link in Safari, then tap Share → *Add to Home Screen*. It opens like an app.
- **Go full screen** with the corner button so little fingers stay in the game.
- **Sound on.** Poppy's voice uses the device's built-in speech, so make sure the device isn't muted.

## How it's built

The whole game is one file, [`index.html`](index.html): plain HTML, CSS and JavaScript, with no build step and no dependencies. Every drawing is inline SVG, the sounds are generated in the browser with the Web Audio API, and Poppy's voice comes from the Web Speech API.

To run it locally, just open `index.html` in a browser.

Every push to `main` is published automatically with GitHub Pages.
