# Nuclear Winter — Developer's Learning Guide

Welcome. This folder is not just "how the game works" — it's a **teaching guide**
built around a real, complete codebase. If you're a junior developer trying to level
up in **coding**, **DevOps**, and **system design**, the idea is simple: you learn
those three things best by reading real code that already works, understanding *why*
it's shaped the way it is, and then changing it yourself.

Nuclear Winter is a good specimen to learn from because it's:

- **Small enough to hold in your head** — ~2,500 lines across 6 JavaScript files.
- **Complete** — title screen, save system, combat, quests, an ending. Nothing is faked.
- **Zero-dependency** — no framework, no build step, no `node_modules`. Every line
  is code you can read. Nothing is hidden behind a library.
- **Honest about its patterns** — it uses the same ideas (game loop, state machine,
  data-driven design, module boundaries) that scale up to much bigger software.

## The three lenses

You'll see the same codebase explained through three different lenses. They overlap
on purpose — that overlap *is* the lesson. Good code, good ops, and good design are
not separate activities; they're the same decisions viewed from different distances.

| Lens | Question it asks | Where in these docs |
| --- | --- | --- |
| **Coding** | *How is this line written, and why that way?* | [02-code-walkthrough](02-code-walkthrough.md) |
| **System design** | *Why is the code split into these pieces?* | [01-system-design](01-system-design.md) |
| **DevOps** | *How does it get from my editor to a player?* | [04-devops](04-devops.md) |

## Suggested reading order

1. **[01 — System Design](01-system-design.md)** — the map before the territory.
   How the whole thing fits together, the module boundaries, the state machine that
   drives everything. Read this first even though it's the most abstract — the rest
   makes more sense once you have the shape in your head.

2. **[02 — Code Walkthrough](02-code-walkthrough.md)** — the territory. A guided tour
   of each file, the patterns used (the game loop, delta time, collision, y-sorting,
   the module pattern, the save system), with real excerpts and the reasoning behind them.

3. **[03 — Graphics & Audio](03-graphics-and-audio.md)** — the "how did they make art
   and sound with no asset files?" chapter. Canvas drawing, seeded random number
   generators for procedural art, and synthesizing sound from math with Web Audio.

4. **[04 — DevOps](04-devops.md)** — how code becomes a running thing other people can
   use. Version control, the "no build step" philosophy and its trade-offs, serving,
   deploying to the web for free, and a starter CI pipeline.

5. **[05 — Exercises](05-exercises.md)** — you don't learn by reading, you learn by
   changing things and watching them break. Graded exercises from "change a number"
   to "design a new subsystem," plus how to debug when it goes wrong.

## How to use this guide

- **Keep the code open next to the docs.** Every reference like
  [`js/game.js`](../js/game.js) is a real file. When a doc quotes a function, go find
  it in the source and read the lines around it.
- **Run it constantly.** Instructions are in the top-level [README](../README.md).
  Change something small, refresh the browser, see what happened. That loop — edit,
  run, observe — is the single most important habit in this whole guide.
- **Don't try to memorize.** The goal is to recognize patterns. The next time you
  meet a "game loop" or a "state machine" or a "seeded RNG" in a different codebase,
  you'll think *oh, I've seen this shape before.* That recognition is the whole point.

## A note on scope and honesty

This is a learning codebase, not production software for a team of 50. Some choices
here (global `IIFE` modules, `localStorage` saves, no automated tests) are perfectly
right for a solo browser game and would be wrong for a banking backend. Where that's
true, the docs say so and point at what you'd do instead at scale. Learning to tell
those two situations apart is more valuable than any single technique.

Created by Victory Ma · Documentation for learners.
