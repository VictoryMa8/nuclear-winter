# 01 — System Design

> *System design is the art of deciding where to draw the lines.* Before a single
> line is written, someone decides what the pieces are, what each piece is
> responsible for, and how they're allowed to talk to each other. Get those lines
> right and the code almost writes itself. Get them wrong and every change fights you.

This chapter is about those lines. We'll look at Nuclear Winter from far away first,
then zoom in on the two ideas that hold it together: **module boundaries** and the
**state machine**.

---

## 1. The 10,000-foot view

Nuclear Winter is a **browser game**. That single fact decides a huge amount:

- It runs entirely on the player's machine (the "client"). There is **no server**
  doing game logic, no database, no network calls during play.
- Its "platform" is the browser's three built-in engines: the **DOM** (page
  structure), **Canvas** (a 2D drawing surface), and **Web Audio** (a sound
  synthesizer). Everything the game does is orchestrating those three.
- Its "storage" is the browser's `localStorage` — a tiny key-value box that survives
  page reloads.

Here's the whole system on one diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                         THE BROWSER                          │
│                                                              │
│   index.html  ──loads──►  6 JavaScript files (the game)      │
│       │                          │                           │
│       │ defines                  │ drives                    │
│       ▼                          ▼                           │
│   ┌────────┐   ┌──────────┐   ┌───────────┐   ┌───────────┐  │
│   │  DOM   │   │  Canvas  │   │ Web Audio │   │localStorage│ │
│   │(HUD,   │   │(the game │   │(all sound │   │(the saved │  │
│   │overlays)│  │ world)   │   │ effects)  │   │  game)    │  │
│   └────────┘   └──────────┘   └───────────┘   └───────────┘  │
└─────────────────────────────────────────────────────────────┘
             ▲                                    ▲
             │ keyboard / clicks                  │ pixels + sound
             │                                    │
          ┌──┴──────────────────────────────────┴──┐
          │                THE PLAYER               │
          └─────────────────────────────────────────┘
```

Notice what's **not** there: no backend, no build tools, no external services. This
is the simplest possible shape a piece of interactive software can have, which is
exactly why it's a good place to learn. Every arrow on that diagram is something you
can point at in the code.

---

## 2. The files, and why there are six of them

Open [`index.html`](../index.html) and look at the bottom:

```html
<script src="js/audio.js"></script>
<script src="js/sprites.js"></script>
<script src="js/data.js"></script>
<script src="js/maps.js"></script>
<script src="js/combat.js"></script>
<script src="js/game.js"></script>
```

Six files, loaded in that order. That order is not an accident — **it's the
dependency graph made physical.** A file can only use things defined in files loaded
*before* it. So the order tells you the layers:

```
        ┌───────────────────────────────────────────┐
        │  game.js   ← the conductor (top layer)     │
        │  the engine: loop, world, input, UI, saves │
        └───────────────────────────────────────────┘
                 │ uses      │ uses       │ uses
                 ▼           ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │combat.js │  │ maps.js  │  │ data.js  │   ← content & subsystems
        └──────────┘  └──────────┘  └──────────┘
                 │           │            │
                 ▼           ▼            ▼
        ┌──────────────┐          ┌──────────────┐
        │  sprites.js  │          │   audio.js   │   ← foundation
        │ (all pixels) │          │ (all sound)  │   (depend on nothing)
        └──────────────┘          └──────────────┘
```

Read that from the bottom up:

| File | Responsibility | Depends on |
| --- | --- | --- |
| [`audio.js`](../js/audio.js) | Turn math into sound. Knows nothing about the game. | nothing |
| [`sprites.js`](../js/sprites.js) | Turn code into pixel art. Knows nothing about the game. | nothing |
| [`data.js`](../js/data.js) | The *nouns*: weapons, classes, enemies, items, story text. | nothing |
| [`maps.js`](../js/maps.js) | The *places*: how each area's tile grid is built. | (uses sprite tile names, but by string) |
| [`combat.js`](../js/combat.js) | The *battle rules*: turns, damage, win/lose. | data, sprites, audio |
| [`game.js`](../js/game.js) | The *conductor*: the loop, movement, dialogue, quests, saves, UI. | everything |

### The single most important design rule here

**Dependencies point downward, never upward.** `audio.js` never reaches up into
`game.js`. `sprites.js` doesn't know combat exists. The foundation layers are
*ignorant* of the layers above them.

Why does this matter so much? Because it means the lower layers are **reusable and
testable in isolation.** You could lift `audio.js` out of this game and drop it into a
completely different project unchanged, because it has no idea it's in "Nuclear
Winter." That property — *low-level code doesn't depend on high-level code* — is one
of the most important ideas in all of software. In big systems it has a name (the
**Dependency Inversion Principle**), but the instinct is the same at every scale:
**the thing that changes rarely should not depend on the thing that changes often.**

Weapons stats change often (balance tweaks). The sound engine changes rarely. So
`data.js` may depend on ideas from `audio.js`, but never the reverse. If you ever feel
tempted to make `audio.js` "just quickly check the player's health," stop — that
arrow points the wrong way, and it's the first crack that eventually makes a codebase
impossible to change.

### Data vs. code

Look at the split between [`data.js`](../js/data.js) / [`maps.js`](../js/maps.js) and
everything else. This is **data-driven design**, and it's worth naming explicitly.

`data.js` contains no behavior — it's just facts:

```js
survivalist: { name: 'Survivalist', maxHealth: 200, atk: 25, def: 20, spd: 5, weapon: 'rifle', ... }
```

`game.js` and `combat.js` contain behavior, but they don't hard-code any specific
weapon or enemy — they read from `data.js`. This separation means **you can change
the game without changing the engine.** Want a new enemy? Add an object to
`enemyTypes`. You wrote no new logic; you added a fact, and the existing logic picks
it up. Designers (or you, wearing your designer hat) can tune the whole game by
editing data, and the risky engine code stays untouched. Every big game engine, from
tiny ones to Unreal, is built on this same divide.

---

## 3. The module pattern: how six files avoid stepping on each other

All six files load into the *same* global browser scope. Without discipline, they'd
collide — two files both defining a variable called `x` would clobber each other.
The game avoids this with the **IIFE module pattern** (Immediately Invoked Function
Expression). Every file looks like this:

```js
const Game = (() => {
  // ...lots of private variables and functions...
  let player = { ... };          // private — nobody outside can touch this
  function update(dt) { ... }    // private

  return {                       // the public "API" — the only doors in
    get player() { return player; },
    updateHUD, gainRewards, addItem, /* ... */
  };
})();
```

Unpack that:

- `(() => { ... })()` defines a function and immediately calls it. Everything inside
  is in its own private scope.
- Whatever the function `return`s becomes the module's **public interface.** Here,
  the outside world gets `Game.player`, `Game.updateHUD()`, etc. — and *nothing else.*
- Everything not returned (like the internal `update` loop) is **private.** It
  literally cannot be reached from another file.

So each file exposes exactly one global: `AudioSys`, `Sprites`, `DATA`, `Maps`,
`Combat`, `Game`. Six names in the global scope, each a clean container. This is the
1990s–2010s browser answer to "how do I make modules without a module system." Modern
projects use `import`/`export` (ES modules) instead — see the DevOps chapter for why
this project deliberately doesn't — but the *goal* is identical: **hide your internals,
expose a small deliberate surface.**

> **The lesson that outlives the syntax:** a module's value is as much in what it
> *hides* as what it shows. `Combat` exposes `start()` and `bindUI()`. It hides the
> dozen helper functions and the animation state that make combat work. Someone using
> `Combat` needs to know "call start with an enemy type"; they do not need to know how
> the muzzle flash is timed. **A good interface is a small one.**

---

## 4. The state machine: the game's brain

Here's the most important runtime concept in the whole codebase. At any instant, the
game is in exactly **one** of a handful of *states*, and that state decides what input
does and what gets drawn. In [`game.js`](../js/game.js):

```js
let state = 'title'; // title | class | intro | world | dialogue | combat | dead | ending
```

That one variable is the game's brain. This is a **finite state machine (FSM)**: a
finite list of states, with defined rules for moving between them.

```
        ┌───────┐  New Game   ┌───────┐  pick class  ┌───────┐
        │ title │ ──────────► │ class │ ───────────► │ intro │
        └───────┘             └───────┘              └───────┘
            ▲                                            │ last slide
            │ Continue (load save)                       ▼
            │                                        ┌───────┐
            └────────────────────────────────────── │ world │ ◄──┐
                                                     └───────┘    │
                          enter tile / talk / read sign  │  ▲     │ win / flee
                                                          ▼  │     │
                                                     ┌──────────┐  │
                                                     │ dialogue │  │
                                                     └──────────┘  │
                                        touch an enemy  │          │
                                                        ▼          │
                                                   ┌────────┐──────┘
                                                   │ combat │
                                                   └────────┘
                                                        │ player HP = 0
                                                        ▼
                                                   ┌────────┐  Get Up  ┌───────┐
                                                   │  dead  │ ───────► │ world │
                                                   └────────┘          └───────┘
```

Why is this such a big deal? Because **without** a state machine, you get a mess of
boolean flags: `isInCombat`, `isTalking`, `isPaused`, `isDead`... and then bugs like
"the player can walk around *during* a cutscene" because you forgot to check one of
five booleans in the movement code. With a single `state` variable, the rule is
simple and enforced in one place. Look at how movement is gated in the `update`
function:

```js
function update(dt, ts) {
  // ...ambient effects run in every state...
  if (state !== 'world') return;   // ← the ONE gate. No movement unless in 'world'.
  // ...player movement, enemy AI, portals, triggers...
}
```

One line. If we're not in the `world` state, movement code simply doesn't run.
Dialogue can't be walked out of; combat can't be strolled away from — not because we
remembered to check a flag everywhere, but because the whole category of behavior is
switched off by that single `return`. The rendering side does the same thing: `render`
looks at `state` and draws the title scene, or the world, accordingly.

Input routing works the same way — `onKeyDown` in `game.js` reads `state` and decides
what a keypress means:

```js
if (state === 'combat') { Combat.handleKey(k); return; }   // '1' = attack
if (state === 'dialogue') { /* advance the text */ return; }
if (state !== 'world') return;                             // title/intro ignore movement
// ...only here does 'E' mean "interact", 'I' mean "inventory", etc.
```

The same physical key press means different things in different states, and the state
machine is what makes that clean instead of chaotic.

> **Where you'll meet this again:** state machines are *everywhere* once you can see
> them. A checkout flow (cart → shipping → payment → confirmation). A network
> connection (connecting → open → closing → closed). A CI pipeline (queued → running →
> passed/failed). Any time something has "modes," an explicit state variable beats a
> pile of booleans.

---

## 5. Data flow: one frame, start to finish

System design isn't only about static structure — it's about how data *moves* while
the program runs. A game is the clearest possible example because it does the same
cycle 60 times a second. That cycle is the **game loop**, and it lives at the bottom
of `game.js`:

```js
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);  // seconds since last frame
  lastTs = ts;
  update(dt, ts);   // 1. change the world
  render(ts);       // 2. draw the world
  requestAnimationFrame(loop);  // 3. ask the browser to call us again next frame
}
```

Every frame is two phases, always in this order:

```
   INPUT                UPDATE                    RENDER
   (what the       (change game state             (draw the
    player is       based on input + time)         new state)
    holding)
      │                    │                          │
   keys{} ──────────► move player                     │
                      run enemy AI                     │
                      check collisions ───► world ────► paint tiles
                      check portals/triggers  state    paint sprites (y-sorted)
                      (maybe change `state`)           paint darkness/tint/ash
                                                       │
                                                 requestAnimationFrame ──┐
                                                       ▲                 │
                                                       └─────────────────┘
                                                        (repeat ~60×/sec)
```

The golden rule, which this loop follows and which you should carry everywhere:
**update and render are separate phases.** First you figure out what the world *is*
now (update). *Then* you draw it (render). You never draw halfway through changing
things, because that produces flicker and tearing. "Compute the new state fully, then
display it" is a principle far bigger than games — it's why UIs use a "virtual DOM,"
why databases have transactions, why good systems separate *deciding* from *doing*.

### Why `dt` (delta time) matters — a real system-design decision

Look again at `dt` — the number of seconds since the last frame. Every movement in the
game is multiplied by it:

```js
const spd = 85 * dt;   // 85 pixels *per second*, scaled to this frame's slice of time
```

Here's the design problem it solves. Frames don't arrive at a fixed rate — a fast
gaming PC might render 144 per second, a tired laptop 30. If we moved the player "3
pixels per frame," the character would sprint on the fast machine and crawl on the
slow one. **The game's difficulty would depend on the player's hardware.** That's a
bug baked into the architecture.

By expressing movement as "85 pixels *per second*" and multiplying by `dt`, the player
covers the same ground per real-world second *regardless of frame rate*. Fast machine:
many small steps. Slow machine: fewer bigger steps. Same destination. This is called
being **frame-rate independent**, and deciding to build it in from the start (rather
than discovering the bug later on someone else's computer) is exactly the kind of
early structural call that "system design" means.

(Note the `Math.min(0.05, ...)` clamp: if the tab is backgrounded and `dt` would be
huge, we cap it so the player can't teleport through walls after you switch back. Small
line, real robustness thinking.)

---

## 6. How the subsystems collaborate (without tangling)

Let's trace one real interaction to see the boundaries doing their job. **The player
walks into an enemy.** Follow the responsibility as it hands off:

1. **`game.js` — `update()`** detects the collision (player and enemy overlap) and
   calls `startCombat(enemy)`.
2. **`game.js`** flips `state = 'combat'` and calls `Combat.start(typeId, options)`.
   Crucially, it passes **callbacks**: `onEnd`, `onLose`. It's saying *"run the fight;
   here's what to do when you're done — I don't want to know how you run it."*
3. **`combat.js`** takes over entirely: it reads the enemy's stats from `DATA`, draws
   battle scenes with `Sprites`, plays gunfire with `AudioSys`, runs the turn loop.
   `game.js` is not involved in any of that.
4. When the fight ends, `combat.js` calls the callback `game.js` gave it. Now
   `game.js` decides the *consequences* — award XP, remove the defeated enemy, maybe
   trigger a story beat, save the game.

See the clean seam? **Combat knows how to fight. The game knows what fighting
*means*.** They meet at a tiny interface — `start()` plus two callbacks. This pattern
(hand a subsystem a job plus "call me back when you're done") is called a **callback**
or **continuation**, and it's how you keep two complex things from growing into each
other. Combat could be rewritten from turn-based to real-time and `game.js` wouldn't
change a line, as long as it still calls `onEnd` when it's over.

> **The takeaway for design:** when two parts must cooperate, spend your effort making
> the *seam between them* as small and explicit as possible. The parts can be messy
> inside; the interface between them should be clean. Most "unmaintainable" codebases
> aren't bad because any one function is bad — they're bad because everything reaches
> into everything else and there are no seams left to cut along.

---

## 7. What you'd do differently at scale (and why it's fine here)

Part of learning system design is calibration: knowing when a "rule" applies and when
it doesn't. Here are honest trade-offs this project makes:

| This project does... | At bigger scale you'd... | Why it's right *here* |
| --- | --- | --- |
| Global IIFE modules | ES modules or a bundler | 6 files, one author, no name clashes in practice. |
| One big `game.js` (~900 lines) | Split into movement, dialogue, quests, UI files | Still fits in your head; splitting adds ceremony without payoff yet. |
| `localStorage` for saves | A real database + accounts | The save is one player's local progress; nobody else needs it. |
| No automated tests | Unit + integration test suites | You can eyeball the whole game in 10 minutes; a payments system you cannot. |
| No server at all | API + backend | There's no shared state between players to coordinate. |

None of these are "wrong." They're *proportionate.* The skill isn't "always use the
biggest hammer" — it's matching the structure to the problem's actual size and risk.
A junior engineer over-engineers a to-do app into microservices; a senior engineer
writes 200 honest lines and moves on. Learning to feel that difference is worth more
than any framework.

---

**Next:** [02 — Code Walkthrough](02-code-walkthrough.md), where we drop from the map
down into the territory and read the actual functions that implement all of this.
