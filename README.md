# NUCLEAR WINTER

*the wasteland remembers*

A grungy, post-apocalyptic pixel-art RPG set in the year 2174, 150 years after the
"Last War" ended the old world. Nature has reclaimed the cities; your tribe holds
a small town in old Ontario, and tonight you're out scavenging as the sun goes down.

This is a full remake of the original text-based *Nuclear Wasteland* — same classes,
weapons, enemies, and story, rebuilt as a top-down explorable world and expanded
with a second act.

## Play

No build step and no dependencies.

```sh
python3 -m http.server 8642
# then visit http://localhost:8642
```

(Any static file server works — it just needs to be served over http for fonts/audio.)

## Controls


| Key           | Action                           |
| ------------- | -------------------------------- |
| WASD / Arrows | Move                             |
| E / Enter     | Interact, advance dialogue       |
| I             | Pack (inventory)                 |
| Q             | Quest log                        |
| M             | Sound on/off                     |
| 1 / 2 / 3     | Attack / Item / Flee (in combat) |


Progress auto-saves at map transitions and quest beats — use **CONTINUE** on the
title screen to pick up where you left off.

## The game

- **4 classes** — Survivalist, Raider, Alchemist, Wanderer — each with their own stats and starting weapon.
- **7 areas** — the sunset Wastes, the Lonely Road, Homestead, the Dark Woods, the vine-strangled Dead City, the sealed Factory Floor, and the Southern Faction Camp.
- **Turn-based combat** using the original damage formula (weapon DMG/DEX/RNG, ATK vs DEF, speed bonus), now with animated battle scenes.
- **XP, levels, and gold that matter** — level up for stats, spend gold at Mira's Salvage on medkits, flashbangs, and upgraded weapons.
- **A quest chain** from the elder: clear the woods, restore the water purifier, and break the Southern Faction before spring.



## Learning the Codebase

If you're using this project to learn, there's a full **Developer's Learning Guide**
in `[docs/](docs/README.md)` — a junior-dev walkthrough of the coding patterns, system
design, and DevOps behind the game, ending in graded exercises. Read it online as
Markdown, or grab the single-file
[PDF](docs/Nuclear-Winter-Developer-Guide.pdf) (regenerate it with
`[docs/build-pdf.sh](docs/build-pdf.sh)`).

## Tech

Vanilla JavaScript + Canvas. Every asset is generated in code:

- `js/sprites.js` — all pixel art (tiles, characters, enemies, icons, backdrops)
drawn programmatically at load time. No image files.
- `js/audio.js` — all sound synthesized with the Web Audio API: per-weapon
gunshots, ambient wind and drone, combat drums, UI blips. No audio files.
- `js/maps.js` — maps built procedurally from seeded RNG so layouts are stable.
- `js/data.js` — weapons, items, classes, enemies, story text.
- `js/combat.js` — turn-based battles.
- `js/game.js` — engine: movement, collision, camera, lighting, dialogue,
quests, shop, saves.

Created by Victory Ma