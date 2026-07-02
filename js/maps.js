// ============ NUCLEAR WINTER — world maps ============
// Maps are built procedurally from a seeded rng so layouts are stable.

const Maps = (() => {

  const SOLID = new Set([
    'tree', 'pine', 'deadtree', 'water', 'wall', 'wallvine', 'roof',
    'plank', 'fence', 'rubble', 'wallin', 'crate', 'tent'
  ]);

  function rngFor(seed) {
    let a = seed;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Builder {
    constructor(w, h, base) {
      this.w = w; this.h = h;
      this.g = Array.from({ length: h }, () => Array(w).fill(base));
    }
    set(x, y, id) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = id; }
    get(x, y) { return this.g[y] && this.g[y][x]; }
    rect(x, y, w, h, id) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, id); }
    border(id) {
      this.rect(0, 0, this.w, 1, id); this.rect(0, this.h - 1, this.w, 1, id);
      this.rect(0, 0, 1, this.h, id); this.rect(this.w - 1, 0, 1, this.h, id);
    }
    scatter(id, density, rng, pred) {
      for (let y = 1; y < this.h - 1; y++) for (let x = 1; x < this.w - 1; x++) {
        if (rng() < density && (!pred || pred(x, y))) this.set(x, y, id);
      }
    }
    // roofed building with a face wall on the bottom row; some vines
    building(x, y, w, h, rng) {
      this.rect(x, y, w, h - 1, 'roof');
      for (let i = x; i < x + w; i++) {
        this.set(i, y + h - 1, rng && rng() < 0.3 ? 'wallvine' : 'wall');
      }
    }
  }

  // ---------------- map definitions ----------------
  const MAPS = {};

  // ============ THE WASTES — Act 1 hub ============
  MAPS.wastes = {
    name: 'THE WASTES', w: 44, h: 34,
    tint: 'rgba(179, 80, 46, 0.14)', // sunset
    music: 'wastes',
    build() {
      const b = new Builder(44, 34, 'grass');
      const r = rngFor(101);
      b.scatter('dry', 0.12, r);
      b.scatter('ash', 0.05, r);
      b.scatter('tree', 0.07, r);
      b.scatter('pine', 0.05, r);
      b.scatter('deadtree', 0.02, r);
      b.border('pine');
      // pond
      b.rect(33, 25, 5, 3, 'water'); b.rect(34, 24, 3, 5, 'water');
      // factory
      b.rect(15, 9, 14, 9, 'grass');
      b.building(16, 10, 12, 7, r);
      b.rect(15, 17, 14, 1, 'debris');
      b.rect(17, 9, 3, 1, 'rubble'); b.rect(24, 9, 4, 1, 'rubble');
      // road east
      b.rect(28, 17, 16, 2, 'road');
      for (let x = 29; x < 44; x += 2) b.set(x, 17, 'roadline');
      // north corridor to the dead city
      b.rect(19, 0, 5, 10, 'dry');
      b.rect(19, 0, 1, 10, 'pine'); b.rect(23, 0, 1, 10, 'pine');
      b.rect(20, 0, 3, 10, 'dry');
      // south corridor to the woods
      b.rect(11, 25, 5, 9, 'grass');
      b.rect(11, 25, 1, 9, 'pine'); b.rect(15, 25, 1, 9, 'pine');
      b.rect(12, 25, 3, 9, 'dirt');
      // west shack
      b.rect(2, 13, 8, 8, 'grass');
      b.rect(3, 14, 5, 3, 'plank');
      b.rect(3, 14, 5, 2, 'roof');
      b.set(5, 17, 'debris');
      // clearing around player start & factory approach
      b.rect(20, 18, 6, 6, 'grass');
      b.rect(8, 18, 12, 2, 'dirt'); // path to shack
      return b;
    },
    playerStart: { x: 22, y: 20 },
    portals: [
      { x: 43, y: 16, w: 1, h: 4, map: 'road', tx: 1, ty: 6, name: 'THE LONELY ROAD' },
      { x: 19, y: 0, w: 5, h: 1, map: 'city', tx: 21, ty: 27,
        cond: () => Game.flags.quest >= 2,
        msg: 'The dead city lies north. The elder warned everyone away from it — you have no reason to go... yet.' },
      { x: 11, y: 33, w: 5, h: 1, map: 'woods', tx: 17, ty: 1, name: 'THE DARK WOODS' }
    ],
    props: [
      { type: 'door', x: 21, y: 16, id: 'factoryDoor' },
      { type: 'car', x: 30, y: 14 },
      { type: 'barrel', x: 27, y: 18 },
      { type: 'barrel', x: 14, y: 11 },
      { type: 'sign', x: 27, y: 19, text: 'EAST: the old road. You vaguely remember this area.' }
    ],
    chests: [
      { id: 'shackMedkit', x: 5, y: 18, loot: { items: ['medkit'] },
        text: 'You found a Medkit! You put it in your pack.' }
    ],
    enemies: [
      { type: 'raider', x: 21, y: 3, id: 'northRaider' }
    ],
    triggers: [
      { id: 'north_figure', x: 19, y: 6, w: 5, h: 2, once: true,
        lines: [{ text: 'You walk north... there seems to be a figure in the distance.' }] },
      { id: 'south_hmm', x: 11, y: 26, w: 5, h: 2, once: true,
        lines: [{ text: "You walk south towards some trees ...hmm, this doesn't look right. The dark swallows the path ahead." }] },
      { id: 'west_shack', x: 8, y: 18, w: 3, h: 2, once: true,
        lines: [{ text: 'You walk west and find a random shack. Someone left in a hurry.' }] }
    ]
  };

  // ============ THE LONELY ROAD ============
  MAPS.road = {
    name: 'THE LONELY ROAD', w: 52, h: 14,
    tint: 'rgba(179, 80, 46, 0.16)',
    build() {
      const b = new Builder(52, 14, 'dry');
      const r = rngFor(202);
      b.scatter('grass', 0.3, r);
      b.scatter('deadtree', 0.05, r);
      b.scatter('ash', 0.06, r);
      b.border('deadtree');
      b.rect(0, 6, 52, 2, 'road');
      for (let x = 1; x < 52; x += 2) b.set(x, 6, 'roadline');
      b.rect(0, 5, 52, 1, 'debris');
      b.rect(0, 8, 52, 1, 'debris');
      return b;
    },
    playerStart: { x: 2, y: 6 },
    portals: [
      { x: 0, y: 5, w: 1, h: 4, map: 'wastes', tx: 41, ty: 17, name: 'THE WASTES' },
      { x: 51, y: 5, w: 1, h: 4, map: 'town', tx: 2, ty: 12, name: 'HOMESTEAD' }
    ],
    props: [
      { type: 'car', x: 14, y: 4 },
      { type: 'car', x: 30, y: 8 },
      { type: 'barrel', x: 22, y: 5 },
      { type: 'sign', x: 40, y: 5, text: 'HOMESTEAD — 1 MILE. TRAVELERS WELCOME. RAIDERS SHOT.' }
    ],
    chests: [],
    enemies: [
      { type: 'hound', x: 26, y: 7, respawn: true }
    ],
    triggers: [
      { id: 'long_road', x: 4, y: 5, w: 2, h: 4, once: true,
        lines: [{ text: 'The road seems to go on for a while... but you believe you are going the right way, so you keep going.' }] },
      { id: 'town_sight', x: 44, y: 5, w: 2, h: 4, once: true,
        lines: [{ text: 'After walking that long road, you see your town. The guards spot you from afar and start opening the gate.' }] }
    ]
  };

  // ============ HOMESTEAD (town) ============
  MAPS.town = {
    name: 'HOMESTEAD', w: 38, h: 26,
    tint: 'rgba(217, 164, 65, 0.08)',
    build() {
      const b = new Builder(38, 26, 'grass');
      const r = rngFor(303);
      b.scatter('dry', 0.1, r);
      b.border('fence');
      b.rect(0, 11, 1, 4, 'dirt'); // west gate opening
      // main dirt street
      b.rect(1, 12, 30, 2, 'dirt');
      b.rect(14, 4, 2, 18, 'dirt');
      // elder hall (north)
      b.building(10, 3, 10, 5, r);
      // trader shop
      b.building(23, 9, 7, 4, r);
      // houses
      b.building(4, 5, 5, 4, r);
      b.building(5, 17, 6, 4, r);
      b.building(20, 17, 6, 4, r);
      b.building(29, 17, 6, 4, r);
      // well
      b.rect(17, 10, 2, 2, 'water');
      b.set(16, 10, 'rubble'); b.set(19, 10, 'rubble');
      b.set(16, 11, 'rubble'); b.set(19, 11, 'rubble');
      // crop rows
      b.rect(31, 3, 5, 1, 'dirt'); b.rect(31, 5, 5, 1, 'dirt'); b.rect(31, 7, 5, 1, 'dirt');
      return b;
    },
    playerStart: { x: 2, y: 12 },
    portals: [
      { x: 0, y: 11, w: 1, h: 4, map: 'road', tx: 49, ty: 6, name: 'THE LONELY ROAD' }
    ],
    props: [
      { type: 'sign', x: 24, y: 13, text: "MIRA'S SALVAGE — if it fires, floats, or heals, it's for sale." },
      { type: 'barrel', x: 30, y: 13 },
      { type: 'barrel', x: 12, y: 8 }
    ],
    chests: [],
    enemies: [],
    npcs: [
      { sprite: 'npc_guard', x: 2, y: 11, name: 'GATE GUARD', talk: 'gateGuard' },
      { sprite: 'npc_guard', x: 2, y: 14, name: 'GATE GUARD', talk: 'gateGuard2' },
      { sprite: 'npc_elder', x: 14, y: 9, name: 'ELDER ROOK', talk: 'elder' },
      { sprite: 'npc_trader', x: 25, y: 14, name: 'MIRA', talk: 'trader' },
      { sprite: 'npc_villager', x: 17, y: 13, name: 'VILLAGER', talk: 'villager1' },
      { sprite: 'npc_kid', x: 32, y: 9, name: 'FARMHAND', talk: 'villager2' }
    ],
    triggers: []
  };

  // ============ THE DARK WOODS ============
  MAPS.woods = {
    name: 'THE DARK WOODS', w: 36, h: 28,
    dark: true,
    build() {
      const b = new Builder(36, 28, 'grass');
      const r = rngFor(404);
      b.scatter('pine', 0.30, r);
      b.scatter('tree', 0.12, r);
      b.scatter('dry', 0.08, r);
      b.border('pine');
      // entrance from the north
      b.rect(16, 0, 3, 5, 'dirt');
      // winding path to the clearing
      b.rect(16, 4, 3, 6, 'dirt');
      b.rect(10, 9, 9, 3, 'dirt');
      b.rect(10, 11, 3, 6, 'dirt');
      b.rect(10, 16, 12, 3, 'dirt');
      // the clearing — something screams here at night
      b.rect(14, 12, 10, 8, 'grass');
      b.rect(15, 13, 8, 6, 'dry');
      // side nook with a chest
      b.rect(25, 8, 5, 4, 'grass'); b.rect(22, 9, 4, 2, 'dirt');
      // deep south path, webbed shut — pinch it to one tile at the webs
      b.rect(17, 19, 3, 9, 'dirt');
      b.set(17, 22, 'pine'); b.set(19, 22, 'pine');
      return b;
    },
    playerStart: { x: 17, y: 1 },
    portals: [
      { x: 16, y: 0, w: 3, h: 1, map: 'wastes', tx: 13, ty: 31, name: 'THE WASTES' },
      { x: 17, y: 27, w: 3, h: 1, map: 'camp', tx: 16, ty: 1, name: 'SOUTHERN FACTION CAMP' }
    ],
    props: [
      { type: 'web', x: 18, y: 22, id: 'webs' },
      { type: 'barrel', x: 26, y: 9 }
    ],
    chests: [
      { id: 'woodsCache', x: 27, y: 10, loot: { gold: 40, items: ['flashbang'] },
        text: 'A scavver cache! 40 gold and a Flashbang inside.' }
    ],
    enemies: [
      { type: 'deer', x: 18, y: 15, id: 'mutantDeer' },
      { type: 'hound', x: 12, y: 17, respawn: true }
    ],
    triggers: [
      { id: 'woods_enter', x: 16, y: 2, w: 3, h: 2, once: true,
        lines: [{ text: 'The pines close over your head. Whatever light was left dies here. Something moves between the trunks.' }] },
      { id: 'clearing', x: 15, y: 12, w: 8, h: 2, once: true,
        lines: [{ text: 'Bones litter the clearing. Deer bones — and the thing that left them is still here.' }] }
    ]
  };

  // ============ THE DEAD CITY ============
  MAPS.city = {
    name: 'THE DEAD CITY', w: 44, h: 30,
    tint: 'rgba(60, 50, 90, 0.16)',
    build() {
      const b = new Builder(44, 30, 'grass');
      const r = rngFor(505);
      b.scatter('dry', 0.15, r);
      b.scatter('rubble', 0.06, r);
      b.scatter('debris', 0.1, r);
      b.scatter('tree', 0.04, r);
      b.border('rubble');
      // overgrown avenue grid
      b.rect(0, 14, 44, 3, 'road');
      b.rect(20, 0, 3, 30, 'road');
      for (let x = 1; x < 44; x += 2) b.set(x, 15, 'roadline');
      // dead towers (roofs standing in for collapsed blocks)
      b.building(4, 3, 8, 7, r);
      b.building(26, 4, 9, 6, r);
      b.building(5, 19, 7, 6, r);
      b.building(28, 19, 10, 7, r);
      b.building(14, 5, 5, 5, r);
      // machine shop — key inside a broken storefront
      b.building(36, 10, 6, 4, r);
      b.rect(37, 12, 2, 2, 'floor'); // collapsed wall gap
      // vines everywhere: convert some walls
      for (let y = 0; y < 30; y++) for (let x = 0; x < 44; x++) {
        if (b.get(x, y) === 'wall' && r() < 0.45) b.set(x, y, 'wallvine');
      }
      // clear exit corridor south
      b.rect(20, 27, 3, 3, 'road');
      return b;
    },
    playerStart: { x: 21, y: 27 },
    portals: [
      { x: 20, y: 29, w: 3, h: 1, map: 'wastes', tx: 21, ty: 1, name: 'THE WASTES' }
    ],
    props: [
      { type: 'car', x: 10, y: 14 },
      { type: 'car', x: 30, y: 15 },
      { type: 'car', x: 22, y: 8 },
      { type: 'barrel', x: 19, y: 18 },
      { type: 'sign', x: 24, y: 17, text: 'Faded lettering: WELCO_E TO D__UTH — POP. 86,____' }
    ],
    chests: [
      { id: 'cityKey', x: 38, y: 12, loot: { items: ['key'], gold: 25 },
        text: 'Inside a rusted lockbox: a heavy pre-war Key, and 25 gold in trade coins.' },
      { id: 'cityCache', x: 6, y: 21, loot: { gold: 60 },
        text: 'A skeleton clutches a satchel. 60 gold. They won\'t miss it.' }
    ],
    enemies: [
      { type: 'hound', x: 12, y: 12, respawn: true },
      { type: 'hound', x: 30, y: 22, respawn: true },
      { type: 'raider', x: 24, y: 5, respawn: true },
      { type: 'raider', x: 38, y: 20, respawn: true }
    ],
    triggers: [
      { id: 'city_enter', x: 20, y: 25, w: 3, h: 2, once: true,
        lines: [{ text: 'Towers of glass and bone. Vines strangle every wall — the forest is taking the city back, one street at a time.' }] }
    ]
  };

  // ============ FACTORY FLOOR (interior) ============
  MAPS.factory = {
    name: 'FACTORY FLOOR', w: 26, h: 18,
    dark: true, indoor: true,
    build() {
      const b = new Builder(26, 18, 'floor');
      const r = rngFor(606);
      b.border('wallin');
      b.rect(0, 0, 26, 2, 'wallin');
      // machine rows
      b.rect(4, 4, 6, 2, 'crate'); b.rect(4, 8, 6, 2, 'crate');
      b.rect(15, 4, 2, 6, 'crate');
      b.rect(19, 12, 4, 2, 'crate');
      b.set(8, 13, 'crate'); b.set(9, 13, 'crate');
      b.scatter('debris', 0, r); // no-op keeps signature obvious
      // exit gap at the bottom
      b.rect(12, 17, 2, 1, 'floor');
      return b;
    },
    playerStart: { x: 12, y: 16 },
    portals: [
      { x: 12, y: 17, w: 2, h: 1, map: 'wastes', tx: 21, ty: 18, name: 'THE WASTES' }
    ],
    props: [
      { type: 'barrel', x: 3, y: 14 },
      { type: 'barrel', x: 22, y: 3 }
    ],
    chests: [
      { id: 'partsChest', x: 21, y: 4, loot: { items: ['parts'], gold: 30 },
        text: 'Beneath a tarp: pristine Purifier Parts, still in factory grease. And 30 gold in a toolbox.' },
      { id: 'factoryMed', x: 4, y: 12, loot: { items: ['medkit'] },
        text: 'A first-aid station, untouched for 150 years. One usable Medkit.' }
    ],
    enemies: [
      { type: 'bear', x: 18, y: 8, id: 'factoryBear' }
    ],
    triggers: [
      { id: 'factory_enter', x: 11, y: 14, w: 4, h: 2, once: true,
        lines: [{ text: 'The dark inside is absolute. Something enormous breathes in the machine rows... and it has heard the door.' }] }
    ]
  };

  // ============ SOUTHERN FACTION CAMP ============
  MAPS.camp = {
    name: 'SOUTHERN FACTION CAMP', w: 34, h: 24,
    tint: 'rgba(20, 16, 50, 0.30)', // night
    build() {
      const b = new Builder(34, 24, 'dry');
      const r = rngFor(707);
      b.scatter('grass', 0.2, r);
      b.scatter('deadtree', 0.06, r);
      b.border('pine');
      // entry from the north
      b.rect(15, 0, 3, 5, 'dirt');
      // palisade
      b.rect(6, 6, 22, 1, 'fence'); b.rect(6, 20, 22, 1, 'fence');
      b.rect(6, 6, 1, 15, 'fence'); b.rect(27, 6, 1, 15, 'fence');
      b.rect(15, 6, 3, 1, 'dirt'); // gate gap
      // tents
      b.rect(9, 9, 3, 2, 'tent'); b.rect(9, 15, 3, 2, 'tent');
      b.rect(22, 9, 3, 2, 'tent'); b.rect(22, 15, 3, 2, 'tent');
      // fire pit center
      b.rect(16, 12, 2, 2, 'dirt');
      b.set(16, 12, 'rubble');
      return b;
    },
    playerStart: { x: 16, y: 1 },
    portals: [
      { x: 15, y: 0, w: 3, h: 1, map: 'woods', tx: 18, ty: 25, name: 'THE DARK WOODS' }
    ],
    props: [
      { type: 'barrel', x: 13, y: 8 },
      { type: 'barrel', x: 20, y: 18 },
      { type: 'sign', x: 14, y: 5, text: 'Crude paint on scrap metal: SOUTH ROADS RISE. THE NORTH TOWN BURNS NEXT.' }
    ],
    chests: [
      { id: 'campLoot', x: 10, y: 10, loot: { gold: 80, items: ['medkit'] },
        text: 'The faction war chest: 80 gold and a field Medkit.' }
    ],
    enemies: [
      { type: 'campRaider', x: 12, y: 12, id: 'campGuard1' },
      { type: 'campRaider', x: 21, y: 13, id: 'campGuard2' },
      { type: 'hound', x: 16, y: 8, id: 'campHound' },
      { type: 'leader', x: 16, y: 17, id: 'factionLeader' }
    ],
    triggers: [
      { id: 'camp_enter', x: 15, y: 2, w: 3, h: 2, once: true,
        lines: [{ text: 'Cookfires. Gun oil. Voices with a southern drawl. This is the camp the elder feared — and the man who runs it is here.' }] }
    ]
  };

  function isSolid(id) { return SOLID.has(id); }

  return { MAPS, isSolid };
})();
