# 02 — Code Walkthrough

> The last chapter drew the map. This one walks the territory. We'll read the actual
> code, file by file, and stop at each pattern worth knowing. The goal isn't to
> memorize this codebase — it's to recognize these *shapes* when you meet them again
> somewhere else.

Keep the source open beside this. Every heading points at a real file.

---

## Reading order inside a file

A useful habit when you open any unfamiliar file: **read it outside-in.**

1. First, what does it *export*? (For our modules, scroll to the `return { ... }` at
   the bottom — that's the public API, the whole point of the file.)
2. Then, what are its main *data structures* near the top?
3. Only *then* dig into individual functions, and only the ones you care about.

You almost never need to read a file top-to-bottom like a novel. Find the surface,
then dive where you have a question.

---

## `data.js` — start here, it's the easiest

[`data.js`](../js/data.js) is the gentlest file: almost no logic, just carefully
organized facts. Read it first to learn the game's vocabulary.

```js
const DATA = (() => {
  const weapons = {
    fists:   { name: 'Fists',         dmg: 5,  dex: 5,  rng: 5,  icon: 'icon_fists', sound: 'melee' },
    rifle:   { name: 'Hunting Rifle', dmg: 15, dex: 5,  rng: 10, icon: 'icon_rifle', sound: 'rifle' },
    // ...
  };
  // items, classes, enemyTypes, shopStock, introSlides, questText ...
  return { weapons, items, classes, enemyTypes, shopStock, introSlides, questText };
})();
```

Two coding lessons hide in this simple file:

**1. Reference by name, not by copy.** A weapon carries `icon: 'icon_rifle'` and
`sound: 'rifle'` — *strings*, not the actual sprite or sound. The real sprite lives in
`sprites.js`, the real sound in `audio.js`. `data.js` just holds a *label* that other
systems look up. This is **loose coupling**: `data.js` doesn't need to import graphics
or audio; it only needs to agree on names. If you rename a sprite, you fix it in two
string-places, not by untangling object references. (Databases do exactly this with
"foreign keys" — a row points at another row *by id*, not by embedding it.)

**2. Objects-of-objects keyed by id.** Notice `weapons` is an object like
`{ fists: {...}, rifle: {...} }`, not an array `[ {...}, {...} ]`. That means code can
say `DATA.weapons.rifle` or `DATA.weapons[someId]` — an instant, readable lookup by
name. Compare the original version of this game, which used arrays and referred to
`weapons[1]` — a "magic number" you had to decode. **Naming things beats numbering
them.** When you find yourself writing `array[3]` and having to remember what 3 is,
reach for a keyed object instead.

---

## `game.js` — the engine

This is the big one (~900 lines) and the conductor of everything. We won't read all of
it; we'll hit the load-bearing patterns.

### The player and the flags: your two "state" objects

```js
const player = {
  x: 0, y: 0, dir: 'down', frame: 0, moving: false,
  xp: 0, level: 0, gold: 0,
  health: 100, maxHealth: 100, atk: 10, def: 10, spd: 10,
  inventory: [], currentWeapon: DATA.weapons.fists,
  classId: 'none', className: 'None'
};

const flags = {
  quest: 0, enteredTown: false,
  opened: {},    // which chests are looted, by id
  defeated: {},  // which unique enemies are dead, by id
  websBurned: false, factoryUnlocked: false
};
```

There are two kinds of state here, and separating them is deliberate:

- `player` is **who you are right now** — stats, position, pack. It changes constantly.
- `flags` is **what has happened in the story** — irreversible world facts. Did you
  open that chest? Kill that boss? Burn those webs?

Why split them? Because they have different *lifetimes and meanings*. `flags` is what
makes the world remember you. When you loot a chest, `flags.opened[id] = true`, and
forever after the render code draws it open and the interaction code refuses to give
loot twice. This is the difference between a world that *reacts* and one that resets —
and it's just a plain object used as a set of "things that are true now."

> **Pattern: an object as a set.** `flags.opened = {}` then `flags.opened['cityKey'] =
> true`. Checking `if (flags.opened[id])` asks "has this happened?" Using an object's
> keys as a set of ids is a cheap, everywhere-useful trick.

### The game loop and delta time (the heart)

We met this in chapter 1, but here's the coding detail:

```js
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  update(dt, ts);
  render(ts);
  requestAnimationFrame(loop);
}
```

`requestAnimationFrame(loop)` is the browser saying *"I'll call your function right
before I next paint the screen, and I'll pass you a timestamp."* By calling it again at
the end of `loop`, we create a self-sustaining cycle — the game's heartbeat. Two
details worth internalizing:

- `(ts - lastTs) / 1000` converts milliseconds-between-frames into **seconds**, so all
  our speeds can be written in friendly units like "85 pixels per second."
- `|| 0.016` is a guard for the *very first frame*, when `lastTs` is 0 and the math
  would be nonsense. `0.016` ≈ one 60fps frame. Small defensive touches like this are
  the difference between code that works in the demo and code that works.

### Movement + collision: the "feet hitbox"

Reading input into a direction is straightforward:

```js
let dx = 0, dy = 0;
if (keys.ArrowUp || keys.w) dy = -1;
else if (keys.ArrowDown || keys.s) dy = 1;
if (keys.ArrowLeft || keys.a) dx = -1;
else if (keys.ArrowRight || keys.d) dx = 1;
```

The interesting part is collision. A sprite is 16×16 pixels, but the character's *body*
is drawn in the top two-thirds and their *feet* at the bottom. If we blocked movement
whenever any part of the 16×16 box touched a wall, you couldn't stand with your head
"in front of" a tree you're really standing below. So collision only checks the **feet**:

```js
// feet hitbox: 10px wide, 6px tall at the bottom of the 16px sprite
function blocked(x, y) {
  return solidAt(x + 3, y + 10) || solidAt(x + 12, y + 10) ||
         solidAt(x + 3, y + 15) || solidAt(x + 12, y + 15);
}
```

Four points — the corners of a little rectangle around the feet. If any of them lands
on a solid tile, that move is blocked. This is a simplified **AABB** (axis-aligned
bounding box) collision check, and the "only the feet collide" trick is standard in
top-down games because it matches how depth *looks*. The lesson: **collision shape and
visual shape are allowed to differ**, and choosing the collision shape is a design
decision about how the game should *feel*.

There's a second subtlety — axes are resolved *separately*:

```js
moveEntity(player, dx * spd, 0);   // try horizontal
moveEntity(player, 0, dy * spd);   // then vertical, independently
```

Why? So that if you're walking diagonally into a wall, the blocked axis stops but the
free one keeps going — you *slide along* the wall instead of sticking to it. Try
changing it to move both at once and you'll immediately feel how much worse it is.
This is a great example of a two-line change that transforms game *feel.*

### Rendering with a camera and depth sorting

The world is bigger than the screen, so we draw through a **camera** that follows the
player and clamps to the map edges (so you never see past the border):

```js
cam.x = Math.max(0, Math.min(world.w * TILE - VIEW_W, player.x + 8 - VIEW_W / 2));
```

Read that inside-out: "center the camera on the player (`player.x - halfscreen`), but
never less than 0 and never more than (map width − screen width)." That
`Math.max(0, Math.min(limit, value))` sandwich is the **clamp** idiom — pinning a
number into a range — and you'll write it a thousand times in your career.

Then the clever bit: **y-sorting for fake depth.** In a top-down view, something
"lower" on the screen should appear *in front of* something higher. So we gather every
drawable thing into one list, sort by their y position, and draw back-to-front:

```js
const draws = [];
// ...push chests, props, npcs, enemies, and the player, each with its y...
draws.sort((a, b) => a.y - b.y);      // lowest y first (drawn first = behind)
draws.forEach(d => ctx.drawImage(d.spr, ...));
```

This is the **painter's algorithm**: draw far things first, near things last, let
later paint cover earlier paint. It's how you get a 2D game to *look* like it has depth
— walk above a barrel and you're behind it; walk below and you're in front. One
`.sort()` buys the whole illusion.

### The dialogue system: a mini state machine inside the big one

Dialogue is its own little world. It has a queue of lines, a typewriter effect, and it
freezes the game while it's up. Look at how `say()` works:

```js
function say(lines, onDone) {
  dlg.lines = lines; dlg.idx = 0; dlg.onDone = onDone || null;
  state = 'dialogue';                 // ← freezes movement (chapter 1's gate)
  showLine();
  document.getElementById('dialogue-box').classList.remove('hidden');
}
```

Passing `onDone` — a function to run *after* the last line — is that callback pattern
again. It's how a quest can say three lines and *then* grant a reward, in order:

```js
say([
  { name, text: 'Clear the dark woods for me. Take my old lighter.' }
], () => {                    // this runs only after the player clicks through
  addItem('lighter');
  flags.quest = 1;
});
```

The typewriter effect is a `setInterval` revealing two characters at a time, playing a
blip every few characters. Notice the *skip*: if you press interact while text is still
typing, it dumps the full line instantly instead of advancing. That's a small courtesy
that every text game needs, and it's a nice example of handling "the user is faster
than the animation."

### The save system: serialize, don't snapshot

Saving is one of the most instructive functions in the codebase:

```js
function saveGame() {
  if (!world || player.classId === 'none') return;   // don't save a non-game
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    player: { classId, xp, level, gold, health, maxHealth, atk, def, spd,
              inventory: player.inventory,
              weapon: Object.keys(DATA.weapons).find(k => DATA.weapons[k] === player.currentWeapon) },
    flags,
    map: world.id,
    x: Math.round(player.x / TILE), y: Math.round(player.y / TILE)
  }));
}
```

Several real lessons packed in here:

- **You save the minimum to *reconstruct*, not a photograph of memory.** We don't save
  the entire `world` object (its tile grid, its sprites — huge, and rebuildable). We
  save the map's *id* and the player's *tile* coordinates. On load, `loadMap('city',
  x, y)` rebuilds everything from that. **Store the seed, not the tree.**
- **`JSON.stringify` needs plain data.** `player.currentWeapon` is a *reference* to a
  weapon object — that can't be meaningfully saved. So we convert it to its key
  (`'rifle'`) with that `Object.keys(...).find(...)` line, and on load we look the key
  back up. Turning live references into stable ids for storage, and back again, is
  called **serialization**, and it's a daily task in real backends (saving to a
  database is the same problem).
- **The guard clause `if (!world ...) return;`** refuses to save nonsense (like the
  title screen). Guarding the entry of a function against states it can't handle keeps
  the rest of the function simple.

`loadGame()` is the mirror image: parse the JSON, copy fields back onto `player` and
`flags`, re-resolve the weapon key, and `loadMap` to the saved position. Save/load
being symmetric mirror functions is a sign you've drawn the boundary well.

### Input handling: normalize early

```js
function onKeyDown(ev) {
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  // ...now everything downstream compares against a clean `k`...
}
```

Browsers report `'A'` vs `'a'` depending on Shift, and multi-character names like
`'ArrowUp'`. Rather than handle every case everywhere, we **normalize once at the
entrance** — lowercase single letters, leave named keys alone. Downstream code stays
simple because the mess was cleaned up at the door. "Normalize input at the boundary,
keep the core clean" is a principle that scales from keypresses to API request
parsing.

---

## `combat.js` — a self-contained subsystem

[`combat.js`](../js/combat.js) is worth studying as a model of a **cohesive module**:
everything about fighting is here and nothing else is. Its public surface is tiny —
`start()`, `bindUI()`, `handleKey()`, `calculateDamage()` — and everything else is
private.

### The damage formula: preserved from the original game

```js
function calculateDamage(attacker, defender) {
  const w = attacker.currentWeapon;
  const weaponDamage = w.dmg + (w.dex / 2) + (w.rng / 3);
  let baseDamage = (attacker.atk - defender.def) * 2 + weaponDamage;
  if (attacker.spd > defender.spd) baseDamage += attacker.spd / 3;
  const randomDamage = (Math.floor(Math.random() * 10) + 1) + baseDamage;
  return Math.floor(Math.max(8, randomDamage));
}
```

This function is a whole design in miniature. Read what it *says*: your weapon's
dexterity and range matter less than its raw damage (they're divided down); attack
fights defense (and is doubled, so stats swing hard); being faster than your foe adds a
bonus; and there's a random `1–10` kicker so fights aren't perfectly deterministic. The
final `Math.max(8, ...)` guarantees every hit does *something* so battles can't stall.

The lesson isn't the arithmetic — it's that **game balance lives in one readable
function.** All the "feel" of combat is here, tunable, in ten lines. When you build
systems, try to concentrate the tunable "policy" into small, named, findable places
rather than smearing magic numbers across the codebase.

### The turn loop: driven by `setTimeout`, gated by `busy`

Combat is turn-based, but it *animates*, so turns can't happen instantly — the muzzle
flash, the hit, the enemy's counterattack all need to breathe. The code uses
`setTimeout` to space events out in time, and a `busy` flag to lock the buttons while
an animation plays:

```js
function playerAttack() {
  if (busy || !active) return;   // ignore clicks mid-animation
  setButtons(false);             // lock the UI
  AudioSys.sfx.fire(player.currentWeapon.sound);
  setTimeout(() => {
    const dmg = calculateDamage(player, enemy);
    enemy.health = Math.max(0, enemy.health - dmg);
    // ...flash, shake, sound, update the bar...
    setTimeout(() => {
      if (enemy.health <= 0) winSequence();
      else enemyTurn();          // hand the turn to the enemy
    }, 900);
  }, 200);
}
```

The `if (busy) return` guard at the top is doing important defensive work: without it,
a player mashing the attack button would fire five overlapping turns and corrupt the
fight. **Guarding against re-entry while an async operation is in flight** is a bug
class you'll fight for your whole career (double-submitted forms, double-charged
payments). Here it's one boolean, checked at every entry point.

### Rendering the battle: a second independent loop

Combat runs its *own* `requestAnimationFrame` loop (`render`) while it's active,
separate from the world loop. It draws the backdrop, the enemy sprite bobbing, and
layers on timed effects — a white hit-flash, a screen shake, a red "you got hurt" wash
— each controlled by a little "until" timestamp:

```js
if (ts < anim.shakeUntil) x += Math.sin(ts / 18) * 6;   // shake if we're still within the window
```

The pattern — *"do this effect until time T"* — is a clean way to fire-and-forget an
animation without tracking it frame by frame. You set `anim.shakeUntil = now + 300`
and the render loop naturally stops shaking 300ms later. Time-based, not frame-counted,
so it's frame-rate independent just like movement.

---

## `maps.js` — a tiny builder DSL

[`maps.js`](../js/maps.js) shows off a different technique: a small **builder** helper
that makes describing a map readable.

```js
class Builder {
  constructor(w, h, base) {
    this.g = Array.from({ length: h }, () => Array(w).fill(base));  // a grid full of `base`
  }
  rect(x, y, w, h, id) { /* fill a rectangle of the grid with tile `id` */ }
  building(x, y, w, h, rng) { /* roof + a wall face, with some vines */ }
  scatter(id, density, rng) { /* randomly sprinkle a tile */ }
}
```

With that vocabulary, a whole area reads almost like English:

```js
const b = new Builder(38, 26, 'grass');
b.border('fence');           // wrap the map in fence
b.rect(1, 12, 30, 2, 'dirt'); // main street
b.building(10, 3, 10, 5, r); // the elder's hall
b.rect(17, 10, 2, 2, 'water'); // the well
```

This is a **domain-specific language (DSL)** in miniature — a small set of building
blocks tuned to one problem (drawing tile maps) so the actual content is short and
clear. You didn't need a fancy library; a class with four good methods gave you a
readable way to express dozens of maps. When you notice yourself writing the same
low-level pattern over and over, **build the vocabulary that makes it disappear.**

Each map is also a plain data object describing its portals, props, chests, enemies,
and triggers:

```js
portals: [
  { x: 43, y: 16, w: 1, h: 4, map: 'road', tx: 1, ty: 6, name: 'THE LONELY ROAD' },
  { x: 19, y: 0,  w: 5, h: 1, map: 'city', tx: 21, ty: 27,
    cond: () => Game.flags.quest >= 2,     // ← a locked exit
    msg: 'The dead city lies north...' }
]
```

That `cond` is elegant: a portal can carry a *function* that decides whether it's open
yet. The engine just checks `if (p.cond && !p.cond()) { ...block... }`. Story gating —
"you can't go north until quest 2" — becomes **data**, not a special case buried in
engine code. New gated area? Add a portal with a `cond`. This is the data-driven
philosophy from chapter 1 paying off concretely.

---

## Cross-cutting habits you should steal

Zooming out, notice the small disciplines that repeat across every file:

- **Guard clauses first.** Functions bail out early on bad/irrelevant state
  (`if (busy) return;`, `if (!world) return;`) so the main logic runs unindented and
  unworried.
- **Name your constants.** `TILE = 16`, `VIEW_W = 480`. The number `16` appears
  conceptually everywhere, but you can change the tile size in *one* place.
- **Reference by id, resolve late.** Weapons, sprites, sounds, maps — all referred to
  by string name and looked up when needed, never hard-wired.
- **One responsibility per function.** `calculateDamage` only calculates damage.
  `saveGame` only saves. `blocked` only answers "is this spot solid?" Small,
  single-purpose functions compose into big behavior and stay easy to reason about.
- **Time, not frames.** Everything that moves or animates is scaled by real time, so
  the game behaves identically on any hardware.

None of these are clever. That's the point. **Most good code is not clever — it's a
hundred small, boring, consistent decisions** that add up to something you can still
understand six months later.

---

**Next:** [03 — Graphics & Audio](03-graphics-and-audio.md), the "wait, there are no
image or sound files?" chapter — how pixels and sound are conjured from pure code.
