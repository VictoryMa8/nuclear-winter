# 05 — Exercises & Extension Roadmap

> Reading about code is like reading about swimming. Useful up to a point, then you
> have to get in the water. This chapter is the water. The exercises are ordered from
> "change one number" to "design a whole subsystem," and each one names the skill it's
> secretly training. Do them in order — each assumes you've felt the ones before it.

**The one rule:** after every change, *run the game and look.* Edit → refresh → observe.
If it broke, open the browser console (F12) and read the error before changing anything
else. Diagnosing beats guessing, every time.

---

## Tier 0 — Orientation (find your footing)

These build the muscle of *navigating* a codebase, which is 90% of real work.

1. **Find the number.** The player walks at a certain speed. Find where that speed is
   set in [`js/game.js`](../js/game.js) (hint: search the file for `spd =` or the
   comment "pixels"). Change it, refresh, feel the difference. Put it back.
   *Skill: locating behavior in unfamiliar code.*

2. **Follow a string.** In [`js/data.js`](../js/data.js) the Hunting Rifle has
   `sound: 'rifle'`. Trace that string: where does `'rifle'` get *used*? (Search
   `sound` in `combat.js`, then `fire(` in `audio.js`.) You've just followed data
   across three files. *Skill: tracing how loosely-coupled systems connect.*

3. **Read the state machine live.** Open the console and type `Game.flags` while
   playing, then `Game.player`. Watch them change as you play. You're inspecting live
   program state — exactly what a debugger does. *Skill: observing runtime state.*

---

## Tier 1 — Tuning (change data, not logic)

This whole tier is editing [`js/data.js`](../js/data.js) — no engine code. That's the
point: **good architecture lets you change the game without touching the machine.**

4. **Rebalance a weapon.** Make the Revolver hit harder — bump its `dmg`. Fight
   something and confirm. Now ask: did you change any logic? (No. You changed a fact,
   and `calculateDamage` picked it up.) *Skill: feeling data-driven design from the
   inside.*

5. **Add a brand-new weapon.** Add an entry to `weapons`, give it an existing `icon`
   and `sound`, then add it to `shopStock` so you can buy it. Play, buy it, wield it.
   You added content with *zero* new logic. *Skill: extending a system through its
   data, not its code.*

6. **Invent an enemy.** Add an entry to `enemyTypes` reusing an existing `sprite`. Then
   place it in a map: in [`js/maps.js`](../js/maps.js), add it to some area's `enemies`
   array. Walk into it. *Skill: understanding how content (data) and placement (maps)
   combine.*

7. **Write a new sign.** Find a `sign` prop in a map's `props` array and change its
   `text`, or add a new one. Read your words in-game. *Skill: the content-authoring
   loop.*

---

## Tier 2 — Small logic changes (touch the engine gently)

Now you edit behavior, but in contained, low-risk spots.

8. **Make medkits heal a percentage.** Medkits currently heal a flat amount. Find where
   (search `heal` in `game.js` and `combat.js`) and change it to heal, say, 40% of max
   HP instead. *Skill: locating and safely modifying a single behavior that lives in
   two places — and noticing it lives in two places.*

9. **Add a new pixel-art icon.** In [`js/sprites.js`](../js/sprites.js), copy the
   `icon_medkit` block, rename it, and redraw the ASCII grid into something new (a
   canteen? a grenade?). Point a new item at it in `data.js`. *Skill: editing generated
   art; seeing that "art" here is just data you can author.*

10. **Design a new sound.** In [`js/audio.js`](../js/audio.js), add a case to the
    `fire()` switch (or a new `sfx` entry) that layers a `tone` and a `noise`. Wire a
    weapon's `sound` to it. *Skill: composing an effect from primitives; hearing the
    tones-and-noise model from chapter 3.*

11. **Tune the fear.** In a dark map, the light radius without a lighter is `48`. Find
    it in `game.js` (`renderDarkness`) and make the darkness tighter or looser. *Skill:
    connecting a single constant to the whole feel of an area.*

---

## Tier 3 — New features (design a little)

These require adding something that wasn't there. Sketch your plan on paper first —
*what states change, what gets drawn, what the player does* — before you type.

12. **A stamina/sprint mechanic.** Hold Shift to move faster but drain a stamina bar;
    walking refills it. You'll touch input (`onKeyDown`), the update loop (movement +
    drain), the player object (a `stamina` field), and the HUD (a new bar). *Skill:
    threading one feature through every layer — the most realistic exercise here.*

13. **A second boss.** Add an `enemyTypes` entry with `boss: true`, draw it a unique
    sprite, place it in a map with a unique `id`, and add an `afterVictory` case in
    `game.js` so beating it advances the story. *Skill: following an existing pattern
    end-to-end (the Faction Leader is your template).*

14. **A key-item puzzle.** Mirror the existing lighter-burns-webs or key-opens-door
    logic to gate a new area behind a new item. *Skill: recognizing and reusing an
    existing pattern instead of inventing a new one — a senior instinct.*

15. **A settings toggle.** Add an on-screen button to toggle the CRT scanline effect
    (it's a CSS `::after` in [`styles.css`](../styles.css)). *Skill: connecting a DOM
    control to a visual change; crossing the JS/CSS boundary.*

---

## Tier 4 — Architecture & Ops (think like a builder)

Now the meta-skills. These change how the project is *built and shipped*, not what it
does.

16. **Extract a module.** `game.js` is large. Pull all the shop code
    (`openShop` + related) into a new `js/shop.js` that exposes `Shop.open()`, and load
    it in `index.html` in the right order. Does the game still work? *Skill: drawing a
    new module boundary — and discovering the dependencies you didn't know were there.*

17. **Add real tests.** `calculateDamage` in `combat.js` is a pure function — perfect
    for testing. Set up Vitest, write tests asserting known inputs give expected
    ranges, and make them run. *Skill: the confidence-under-refactoring that automated
    tests buy.*

18. **Ship it.** Push to GitHub, enable GitHub Pages, and get a public URL someone else
    can play. Fix the relative-path issues if they appear (chapter 4 warned you).
    *Skill: the full outer loop — code to live URL.*

19. **Automate the check.** Add the CI workflow from [chapter 4](04-devops.md) so every
    push syntax-checks your JS. Push a deliberately broken file and watch CI catch it,
    then fix it. *Skill: building a safety net and seeing it work.*

20. **Migrate to ES modules.** The boss level. Convert the six IIFE files to real
    `import`/`export` modules and load with `<script type="module">`. You'll need a
    bundler (Vite) or careful path handling. *Skill: understanding what the module
    pattern was faking, and what modern module systems actually give you.*

---

## How to debug when it breaks (it will)

A repeatable method beats panic every time:

1. **Read the error.** Open the console (F12). An error names a *file and line*. Go
   there first. Half of all bugs are solved by actually reading the message instead of
   assuming.
2. **Reproduce it reliably.** Find the exact steps that trigger it. A bug you can
   summon on command is a bug you can fix; an intermittent one you can't reproduce is a
   nightmare. Make it reliable first.
3. **Narrow it down.** Add `console.log()` before and after the suspect line, or set a
   breakpoint. Confirm *what the values actually are*, versus what you assumed. Bugs
   live in the gap between those two.
4. **Change one thing.** Make a single change, test. If you change five things and it
   works, you don't know which fix mattered — and you may have added two new bugs.
5. **When truly stuck, explain it out loud.** Describe the problem, step by step, to a
   person or a rubber duck. You'll often catch the flaw mid-sentence. This is real; it's
   called *rubber-duck debugging* and professionals use it daily.

> The difference between a beginner and a pro isn't that the pro writes bug-free code.
> Both write bugs constantly. The pro has a *method* for finding them, stays calm, and
> reads the evidence instead of guessing. That method is entirely learnable, and every
> bug you fix with it makes you faster at the next one.

---

## Where to go after this codebase

You've now seen a complete, real program end to end. To keep growing:

- **Build your own tiny thing from scratch.** A different small game, a calculator, a
  to-do app. Starting from an empty file teaches what a finished codebase can't —
  you'll finally understand *why* each piece here exists, because you'll feel its
  absence.
- **Read code better than yours.** Find a small open-source project you admire and read
  it the outside-in way from chapter 2. Being able to *read* code is as important as
  writing it, and it's rarely taught.
- **Go deeper on whichever lens grabbed you.** Loved the graphics? Learn a real game
  engine or WebGL. Loved the structure? Read about design patterns and clean
  architecture. Loved the shipping? Learn Docker and cloud deployment. This game gave
  you a taste of all three so you could find out which one pulls at you.

The single most important habit, above every technique in these five documents: **keep
the edit → run → observe loop tight, and keep it turning.** Everything else is detail.

Good luck out there in the wasteland.
