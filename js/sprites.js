// ============ NUCLEAR WINTER — generated pixel art ============
// Every sprite and tile is drawn in code at load time. No image files.

const Sprites = (() => {
  const store = {};   // named sprites: store['player_survivalist_down_0'] etc.
  const tiles = {};   // tiles['grass'] = [variant canvases]

  // deterministic rng so tile variants look the same every run
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cnv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // Build a canvas from an array of strings + palette map. Ragged rows are padded.
  function px(rows, pal, w) {
    const width = w || Math.max(...rows.map(r => r.length));
    const c = cnv(width, rows.length);
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  }

  function flipH(src) {
    const c = cnv(src.width, src.height);
    const ctx = c.getContext('2d');
    ctx.translate(src.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }

  // =====================================================
  //  CHARACTERS
  // =====================================================
  const BASE = {
    o: '#17130e', s: '#c9976b', e: '#17130e',
    P: '#3d3a33', B: '#26211a', A: '#5a4a35'
  };

  const HUMAN = {
    down0: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....osssssso....',
      '....osesseso....',
      '....osssssso....',
      '.....osssso.....',
      '....oJJJJJJo....',
      '...oJJJJJJJJo...',
      '...oKJJJJJJKo...',
      '...osKJJJJKso...',
      '....oJJJJJJo....',
      '....oPPooPPo....',
      '....oPPooPPo....',
      '....oBBooBBo....'
    ],
    down1: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....osssssso....',
      '....osesseso....',
      '....osssssso....',
      '.....osssso.....',
      '....oJJJJJJo....',
      '...oJJJJJJJJo...',
      '...oKJJJJJJKo...',
      '...osKJJJJKso...',
      '....oJJJJJJo....',
      '....oPPooPPo....',
      '...oPPo..oPPo...',
      '...oBBo..oBBo...'
    ],
    up0: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '.....ohhhho.....',
      '....oJJJJJJo....',
      '...oJAAAAAAJo...',
      '...oKAAAAAAKo...',
      '...osAAAAAAso...',
      '....oJJJJJJo....',
      '....oPPooPPo....',
      '....oPPooPPo....',
      '....oBBooBBo....'
    ],
    up1: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '.....ohhhho.....',
      '....oJJJJJJo....',
      '...oJAAAAAAJo...',
      '...oKAAAAAAKo...',
      '...osAAAAAAso...',
      '....oJJJJJJo....',
      '....oPPooPPo....',
      '...oPPo..oPPo...',
      '...oBBo..oBBo...'
    ],
    side0: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhsssso....',
      '....ohhsesso....',
      '....ohhsssso....',
      '.....osssso.....',
      '....oJJJJJJo....',
      '....oJJJJJJo....',
      '....oJJKKJJo....',
      '....oJJKKso.....',
      '....oJJJJJJo....',
      '....oPPPPPPo....',
      '.....oPPPPo.....',
      '.....oBBBBo.....'
    ],
    side1: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '....ohhhhhho....',
      '....ohhsssso....',
      '....ohhsesso....',
      '....ohhsssso....',
      '.....osssso.....',
      '....oJJJJJJo....',
      '....oJJJJJJo....',
      '....oJJKKJJo....',
      '....oJJKKso.....',
      '....oJJJJJJo....',
      '....oPPPPPPo....',
      '...oPPo..PPo....',
      '...oBBo...BBo...'
    ]
  };

  // Build all 6 directional frames (+mirrored left) for one palette
  function buildHuman(name, pal) {
    const p = Object.assign({}, BASE, pal);
    ['down0', 'down1', 'up0', 'up1', 'side0', 'side1'].forEach(k => {
      const c = px(HUMAN[k], p, 16);
      const dir = k.replace(/[01]/, '');
      const f = k.slice(-1);
      if (dir === 'side') {
        store[`${name}_right_${f}`] = c;
        store[`${name}_left_${f}`] = flipH(c);
      } else {
        store[`${name}_${dir}_${f}`] = c;
      }
    });
  }

  function buildCharacters() {
    // player classes (jacket J / shade K / hair h)
    buildHuman('player_none',        { J: '#5c5c52', K: '#45453d', h: '#3a332a' });
    buildHuman('player_survivalist', { J: '#6b5a3a', K: '#52432a', h: '#4a3b28' });
    buildHuman('player_raider',      { J: '#7a3b2e', K: '#5c2a20', h: '#2e2a26' });
    buildHuman('player_alchemist',   { J: '#4a3f66', K: '#37304d', h: '#33304a' });
    buildHuman('player_wanderer',    { J: '#3e5266', K: '#2e3e4d', h: '#33302b' });

    // town NPCs
    buildHuman('npc_guard',    { J: '#4a5d33', K: '#394926', h: '#2f3b21' }); // helmeted look via hair color
    buildHuman('npc_villager', { J: '#6d5c44', K: '#544733', h: '#5a4630' });
    buildHuman('npc_kid',      { J: '#7a6444', K: '#5e4c33', h: '#3f342a' });

    // elder — long grey robe
    store.npc_elder = px([
      '................',
      '.....oooooo.....',
      '....ogggggго....'.replace('г', 'g'),
      '....oggggggo....',
      '....osssssso....',
      '....osesseso....',
      '....ossssssо....'.replace('о', 'o'),
      '..W..osssso.....',
      '..WoRRRRRRRRo...',
      '..WoRRRRRRRRo...',
      '..WsRRRRRRRRs...',
      '..WoRRRRRRRRo...',
      '..WoRRRRRRRRo...',
      '...oRRRRRRRRo...',
      '...oRRRRRRRRo...',
      '...oBBBBBBBBo...'
    ], Object.assign({}, BASE, { g: '#9a948a', R: '#66665a', W: '#7a5a33' }), 16);

    // trader Mira — hat + apron
    store.npc_trader = px([
      '................',
      '....oTTTTTTo....',
      '...oTTTTTTTTo...',
      '....ohhhhhho....',
      '....osssssso....',
      '....osesseso....',
      '....osssssso....',
      '.....osssso.....',
      '....oJAAAAJo....',
      '...oJJAAAAJJo...',
      '...oKJAAAAJKo...',
      '...osJAAAAJso...',
      '....oJAAAAJo....',
      '....oPPooPPo....',
      '....oPPooPPo....',
      '....oBBooBBo....'
    ], Object.assign({}, BASE, { T: '#7a3b2e', h: '#4f3824', J: '#5d4a66', K: '#463755', A: '#b0a184' }), 16);
  }

  // =====================================================
  //  ENEMIES
  // =====================================================
  function buildEnemies() {
    // hostile raider — mohawk + face mask + makeshift armor
    store.enemy_raider = px([
      '.......MM.......',
      '.......MM.......',
      '....ohhMMhho....',
      '....ohhMMhho....',
      '....osssssso....',
      '....osesseso....',
      '....ommmmmmo....',
      '.....ommmmo.....',
      '....oJJJJJJo....',
      '...oJJJJJJJJo...',
      '...oKJJJJJJKo...',
      '...osKJJJJKso...',
      '....oJJJJJJo....',
      '....oPPooPPo....',
      '....oPPooPPo....',
      '....oBBooBBo....'
    ], Object.assign({}, BASE, { M: '#a03a2e', h: '#2a2622', m: '#4d4a44', J: '#59432e', K: '#443322' }), 16);

    // mutated deer — two heads, glowing eyes, growth spots
    store.enemy_deer = px([
      '.A..A......A..A.',
      '.AA.A......A.AA.',
      '..AAA......AAA..',
      '..oHHHo..oHHHo..',
      '..oHGHo..oHGHo..',
      '..oHHHo..oHHHo..',
      '...oHHo..oHHo...',
      '...oBBBBBBBBo...',
      '..oBBBBBBBBBBo..',
      '..oBBmBBBBmBBo..',
      '..oBBBBmBBBBBo..',
      '..oBBBBBBBBBBo..',
      '...oLoBBBBoLo...',
      '...oLo....oLo...',
      '...oLo....oLo...',
      '...ooo....ooo...'
    ], { o: '#17130e', A: '#cbb292', H: '#6b4c33', G: '#9ff23e', B: '#7a5a3d', m: '#79c24a', L: '#5c4229' }, 16);

    // irradiated bear — 24x24 hulk with raw patches
    store.enemy_bear = px([
      '........................',
      '....oo..........oo......',
      '...oBBo........oBBo.....',
      '...oBBBooooooooBBBo.....',
      '..oBBBBBBBBBBBBBBBo.....',
      '..oBGGBBBBBBBBBGGBo.....',
      '..oBBBBBBnnBBBBBBBo.....',
      '...oBBBBBnnnBBBBBo......',
      '..ooBBBBBBBBBBBBBoo.....',
      '.oBBBBBBBBBBBBBBBBBo....',
      '.oBBrrBBBBBBBBrrBBBo....',
      '.oBBrrBBBBBBBBBrBBBBo...',
      '.oBBBBBBBBBBBBBBBBBBo...',
      '.oBBBBBBBBBBBBBBBBBBo...',
      '..oBBBBBBBBBBBBBBBBo....',
      '..oBBBoBBBBBBoBBBBo.....',
      '..oBBo..oBBo..oBBo......',
      '..oCCo..oCCo..oCCo......',
      '..ooo....ooo...ooo......'
    ], { o: '#14100c', B: '#5c4a3a', G: '#9ff23e', n: '#2a2018', r: '#8c4a3e', C: '#c9c2ad' }, 24),

    // feral hound — low, ribby, glowing eye
    store.enemy_hound = px([
      '................',
      '................',
      '................',
      '............oo..',
      '...........oHHo.',
      '..ooooooooOHHHo.'.replace('O', 'o'),
      '.oBBBBBBBBBHGHo.',
      '.oBrBBrBBBBHHHo.',
      '.oBBBBBBBBBoHHo.',
      '.oBoBBBBoBBo.oo.',
      '.oBo....oBo.....',
      '.ooo....ooo.....'
    ], { o: '#14100c', B: '#4d4238', H: '#403830', G: '#e8b93e', r: '#6e5c4d' }, 16);

    // southern faction leader — black coat, red beret, rifle slung
    store.enemy_leader = px([
      '................',
      '....oFFFFFFo....',
      '...oFFFFFFFFo...',
      '....ohhhhhho....',
      '....osssssso....',
      '....osesseso....',
      '....osssssso....',
      '.....osssso.....',
      '....oDDDDDDo....',
      '...oDDDDDDDDo...',
      '...oDGGGGGGDo...',
      '...osDDDDDDso...',
      '....oDDDDDDo....',
      '....oDDooDDo....',
      '....oDDooDDo....',
      '....oBBooBBo....'
    ], Object.assign({}, BASE, { F: '#8c2e26', h: '#26221e', D: '#26262b', G: '#4a4a52' }), 16);
  }

  // =====================================================
  //  PROPS & ITEMS
  // =====================================================
  function buildProps() {
    store.chest = px([
      '................',
      '....oooooooo....',
      '...oCCCCCCCCo...',
      '...oCcCCCCcCo...',
      '...oCCCCCCCCo...',
      '...oooooooooо...'.replace('о', 'o'),
      '...oCCCyyCCCo...',
      '...oCCCyyCCCo...',
      '...oCcCCCCcCo...',
      '...oCCCCCCCCo...',
      '...oooooooooо...'.replace('о', 'o')
    ], { o: '#17130e', C: '#6e4f2f', c: '#59401f', y: '#d9a441' }, 16);

    store.chest_open = px([
      '...oooooooooо...'.replace('о', 'o'),
      '...o........o...',
      '...o........o...',
      '...oooooooooо...'.replace('о', 'o'),
      '...oxxxxxxxxo...',
      '...oCCCCCCCCo...',
      '...oCCCyyCCCo...',
      '...oCcCCCCcCo...',
      '...oCCCCCCCCo...',
      '...oooooooooо...'.replace('о', 'o')
    ], { o: '#17130e', C: '#6e4f2f', c: '#59401f', y: '#d9a441', x: '#0d0b08' }, 16);

    store.web = px([
      'W..w....w..W....',
      '.W..w..w..W.....',
      '..W..ww..W......',
      'w..W.ww.W..w....',
      '.w..WWWW..w.....',
      '..wwWWWWww......',
      '.w..WWWW..w.....',
      'w..W.ww.W..w....',
      '..W..ww..W......',
      '.W..w..w..W.....',
      'W..w....w..W....',
      '..w......w......'
    ], { W: '#cfd4c8', w: '#9aa094' }, 16);

    store.barrel = px([
      '....oooooooo....',
      '...oGGGGGGGGo...',
      '...oGrGGGGGGo...',
      '...ooooooooоo...'.replace('о', 'o'),
      '...oGGGGGrGGo...',
      '...oGGGGGGGGo...',
      '...oGrGGGGGGo...',
      '...ooooooooоo...'.replace('о', 'o'),
      '...oGGGrGGGGo...',
      '...oGGGGGGGGo...',
      '...oooooooоo....'.replace('о', 'o')
    ], { o: '#17130e', G: '#4d5c4a', r: '#8a4b2a' }, 16);

    store.door_metal = px([
      'oooooooooooooooo',
      'oGGGGGGGGGGGGGGo',
      'oGgggggggggggGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGyGGGGgGGo',
      'oGgGGGGyGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgGGGGGGGGGgGGo',
      'oGgggggggggggGGo',
      'oGGGGGGGGGGGGGGo',
      'oGGGrrGGGGGGGGGo',
      'oooooooooooooooo'
    ], { o: '#17130e', G: '#4a4a50', g: '#5c5c63', y: '#d9a441', r: '#8a4b2a' }, 16);

    store.sign = px([
      '................',
      '..oooooooooooo..',
      '..oWWWWWWWWWWo..',
      '..oWwwWwwwWWWo..',
      '..oWWWWWWWWWWo..',
      '..oWwwwWwwWWWo..',
      '..oWWWWWWWWWWo..',
      '..oooooooooooo..',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......'
    ], { o: '#17130e', W: '#6e5b3d', w: '#3d3222' }, 16);

    // rusted car wreck, 32x16, two tiles wide
    store.car = px([
      '................................',
      '................................',
      '..........oooooooooo............',
      '.........oCCCCCCCCCCoo..........',
      '........oCWWCCCCCCWWCCo.........',
      '...ooooooCCCCCCCCCCCCCooooo.....',
      '..oCCCCCCCCCCCCCCCCCCCCCCCCo....',
      '..oCCrrCCCCCCCCCCCrCCCCCCCCo....',
      '..oCCCCCCCCCCCCCCCCCCCCrrCCo....',
      '..ooCCoooCCCCCCCCCCCooоCCoo.....'.replace('о', 'o'),
      '...oooWWooooooooooоWWooo........'.replace('о', 'o'),
      '....oWWWWo........oWWWWo........',
      '....oWWWWo........oWWWWo........',
      '.....oooo..........oooo.........'
    ], { o: '#14100c', C: '#5c6e66', r: '#8a4b2a', W: '#2e2a26' }, 32);
  }

  const ICON_PAL = { o: '#17130e', W: '#d8d5c8', R: '#b3372e', y: '#d9a441', G: '#7a7a80', g: '#9a9aa0', F: '#e8862e', f: '#ffd24a', B: '#8a5a2e', M: '#5c5c63', D: '#3a3a40', T: '#6e4f2f' };

  function buildIcons() {
    store.icon_medkit = px([
      '................',
      '...oooooooooo...',
      '..oWWWWWWWWWWo..',
      '..oWWWWRRWWWWo..',
      '..oWWWWRRWWWWo..',
      '..oWWRRRRRRWWo..',
      '..oWWRRRRRRWWo..',
      '..oWWWWRRWWWWo..',
      '..oWWWWRRWWWWo..',
      '..oWWWWWWWWWWo..',
      '...oooooooooo...'
    ], ICON_PAL, 16);

    store.icon_key = px([
      '................',
      '.....oooo.......',
      '....oyyyyo......',
      '....oy..yo......',
      '....oyyyyo......',
      '......oyo.......',
      '......oyo.......',
      '......oyyo......',
      '......oyo.......',
      '......oyyo......',
      '......oyo.......',
      '.......o........'
    ], ICON_PAL, 16);

    store.icon_flashbang = px([
      '................',
      '......oyyo......',
      '.....oyооyo.....'.replace(/о/g, 'o'),
      '.....oGGGGo.....',
      '....oGggggGo....',
      '....oGggggGo....',
      '....oGggggGo....',
      '....oGggggGo....',
      '....oGggggGo....',
      '....oGGGGGGo....',
      '.....oooooo.....'
    ], ICON_PAL, 16);

    store.icon_lighter = px([
      '................',
      '.......f........',
      '......fFf.......',
      '......FFF.......',
      '.....oFFFo......',
      '....ooooooо.....'.replace('о', 'o'),
      '....oMMMMMo.....',
      '....oMggMMo.....',
      '....oMMMMMo.....',
      '....oMMMMMo.....',
      '....oMMMMMo.....',
      '.....ooooo......'
    ], ICON_PAL, 16);

    store.icon_parts = px([
      '................',
      '....oo..oo......',
      '...oGGooGGo.....',
      '....oGGGGo......',
      '..ooGGGGGGoo....',
      '..oGGGDDGGGo....',
      '..oGGDDDDGGo....',
      '..oGGDDDDGGo....',
      '..oGGGDDGGGo....',
      '..ooGGGGGGoo....',
      '....oGGGGo......',
      '...oGGooGGo.....',
      '....oo..oo......'
    ], ICON_PAL, 16);

    store.icon_fists = px([
      '................',
      '................',
      '....oooo........',
      '...oWWWWo.......',
      '..oWWWWWWo......',
      '..oWWWWWWoo.....',
      '..oWWWWWWWWo....',
      '..oWWWWWWWWo....',
      '...oWWWWWWo.....',
      '....oooooo......'
    ], Object.assign({}, ICON_PAL, { W: '#c9976b' }), 16);

    store.icon_rifle = px([
      '................',
      '................',
      '................',
      '..............o.',
      '.oooooooooooooGo',
      'oGGGGGGGGGGGGGGo',
      'oBBBoGGoooooooo.',
      '.oBBoGGo........',
      '..oBooGGo.......',
      '...o..oo........'
    ], ICON_PAL, 16);

    store.icon_shotgun = px([
      '................',
      '................',
      '................',
      '................',
      '..ooooooooooo...',
      '.oGGGGGGGGGGGo..',
      'oBBBBoGGooooo...',
      '.oBBBoGGo.......',
      '..oBBooGo.......',
      '...oo..o........'
    ], ICON_PAL, 16);

    store.icon_smg = px([
      '................',
      '................',
      '................',
      '....ooooooooo...',
      '...oGGGGGGGGGo..',
      '...oGGooooGGo...',
      '....oGGo.oGo....',
      '....oGGo..o.....',
      '....oGGo........',
      '.....oo.........'
    ], ICON_PAL, 16);

    store.icon_revolver = px([
      '................',
      '................',
      '................',
      '................',
      '...ooooooooo....',
      '..oGGGGGGGGGo...',
      '..oBBoGGoooo....',
      '...oBBoGo.......',
      '....oBoo........',
      '.....o..........'
    ], ICON_PAL, 16);

    store.icon_gold = px([
      '................',
      '.....oooooo.....',
      '....oyyyyyyo....',
      '...oyyffyyyyo...',
      '...oyfyyyyyyo...',
      '...oyyyyyyyyo...',
      '...oyyyyyyyyo...',
      '....oyyyyyyo....',
      '.....oooooo.....'
    ], ICON_PAL, 16);
  }

  // =====================================================
  //  TILES (procedural, with variants)
  // =====================================================
  function makeVariants(n, fn) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = cnv(16, 16);
      fn(c.getContext('2d'), mulberry32(i * 7919 + 17));
      out.push(c);
    }
    return out;
  }

  function fill(ctx, col) { ctx.fillStyle = col; ctx.fillRect(0, 0, 16, 16); }
  function speck(ctx, rng, colors, n) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
      ctx.fillRect(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1);
    }
  }

  function grassBase(ctx, rng, base, dark, light) {
    fill(ctx, base);
    speck(ctx, rng, [dark, dark, light], 26);
    // a few grass blades
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rng() * 15), y = 2 + Math.floor(rng() * 12);
      ctx.fillStyle = light;
      ctx.fillRect(x, y, 1, 2);
    }
  }

  function buildTiles() {
    tiles.grass = makeVariants(4, (c, r) => grassBase(c, r, '#3f4d2e', '#33401f', '#54663a'));
    tiles.dry   = makeVariants(3, (c, r) => {
      grassBase(c, r, '#4d5233', '#3d4226', '#636844');
      // ragged dry patch blended into the grass, not a hard square
      c.fillStyle = '#5e5c3c';
      for (let i = 0; i < 14; i++) c.fillRect(2 + Math.floor(r() * 11), 2 + Math.floor(r() * 11), 2, 2);
    });
    tiles.dirt  = makeVariants(3, (c, r) => { fill(c, '#55432f'); speck(c, r, ['#463726', '#63523c', '#3d2f21'], 30); });
    tiles.ash   = makeVariants(3, (c, r) => { grassBase(c, r, '#3f4d2e', '#33401f', '#54663a'); c.fillStyle = 'rgba(180,180,170,0.55)'; for (let i = 0; i < 12; i++) c.fillRect(Math.floor(r() * 14), Math.floor(r() * 14), 2, 1); });

    // cracked road, sometimes reclaimed by grass tufts
    tiles.road = makeVariants(4, (c, r) => {
      fill(c, '#45443f');
      speck(c, r, ['#3a3935', '#504e48'], 24);
      // crack: a dark random walk
      let x = Math.floor(r() * 16), y = 0;
      c.fillStyle = '#2e2d29';
      while (y < 16) { c.fillRect(x, y, 1, 2); y += 2; x = Math.max(0, Math.min(15, x + Math.floor(r() * 3) - 1)); }
      if (r() < 0.5) { // nature reclaiming
        c.fillStyle = '#54663a';
        const gx = Math.floor(r() * 13) + 1, gy = Math.floor(r() * 13) + 1;
        c.fillRect(gx, gy, 2, 1); c.fillRect(gx + 1, gy - 1, 1, 1);
      }
    });
    tiles.roadline = makeVariants(2, (c, r) => {
      fill(c, '#45443f');
      speck(c, r, ['#3a3935', '#504e48'], 20);
      c.fillStyle = '#8a8258';
      c.fillRect(7, 1, 2, 5); c.fillRect(7, 10, 2, 5);
    });

    tiles.water = makeVariants(3, (c, r) => {
      fill(c, '#24393b');
      speck(c, r, ['#1c2e30', '#2e4a4c'], 16);
      c.fillStyle = '#3a5c58';
      for (let i = 0; i < 3; i++) c.fillRect(Math.floor(r() * 10), 3 + Math.floor(r() * 10), 4, 1);
      if (r() < 0.4) { c.fillStyle = '#4f6b35'; c.fillRect(Math.floor(r() * 10), Math.floor(r() * 12), 3, 2); } // scum
    });

    tiles.tree = makeVariants(3, (c, r) => {
      grassBase(c, r, '#3f4d2e', '#33401f', '#54663a');
      c.fillStyle = '#3d2c1c'; c.fillRect(7, 11, 2, 4);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(4, 13, 8, 2); // ground shadow
      // rounded canopy built from stacked rows
      const dark = '#243420', mid = '#2e4025', light = '#3a5030';
      c.fillStyle = mid;
      c.fillRect(5, 1, 6, 1); c.fillRect(3, 2, 10, 2); c.fillRect(2, 4, 12, 5); c.fillRect(3, 9, 10, 2); c.fillRect(5, 11, 6, 1);
      c.fillStyle = dark;
      c.fillRect(3, 7, 10, 2); c.fillRect(5, 9, 8, 2); c.fillRect(9, 4, 4, 3);
      c.fillStyle = light;
      c.fillRect(4, 2, 4, 2); c.fillRect(3, 4, 3, 3); c.fillRect(8, 1, 2, 2);
      if (r() < 0.4) { c.fillStyle = '#79c24a'; c.fillRect(4 + Math.floor(r() * 8), 3 + Math.floor(r() * 6), 1, 1); } // mutant growth
    });

    tiles.pine = makeVariants(3, (c, r) => {
      grassBase(c, r, '#3f4d2e', '#33401f', '#54663a');
      c.fillStyle = '#3d2c1c'; c.fillRect(7, 12, 2, 3);
      const g = '#22331f', d = '#182615';
      c.fillStyle = g;
      c.fillRect(7, 0, 2, 2); c.fillRect(5, 2, 6, 3); c.fillRect(3, 5, 10, 4); c.fillRect(2, 9, 12, 3);
      c.fillStyle = d;
      c.fillRect(5, 4, 2, 1); c.fillRect(9, 7, 2, 1); c.fillRect(4, 10, 2, 1);
      if (r() < 0.4) { c.fillStyle = 'rgba(190,190,180,0.5)'; c.fillRect(4, 2, 3, 1); c.fillRect(8, 6, 3, 1); } // ash dusting
    });

    tiles.deadtree = makeVariants(2, (c, r) => {
      grassBase(c, r, '#6b6345', '#544d33', '#847a54');
      c.fillStyle = '#4a3a28';
      c.fillRect(7, 4, 2, 11);
      c.fillRect(4, 5, 3, 1); c.fillRect(9, 3, 4, 1); c.fillRect(3, 4, 1, 2); c.fillRect(12, 2, 1, 2);
      c.fillRect(6, 2, 1, 3); c.fillRect(10, 6, 2, 1);
    });

    // brick wall (building face) + vine-covered variant
    tiles.wall = makeVariants(3, (c, r) => {
      fill(c, '#4d3a30');
      c.fillStyle = '#5d463a';
      for (let y = 0; y < 16; y += 4) {
        const off = (y / 4) % 2 ? 4 : 0;
        for (let x = -4; x < 16; x += 8) c.fillRect(x + off, y, 7, 3);
      }
      speck(c, r, ['#3d2e26', '#6b5245'], 14);
    });
    tiles.wallvine = makeVariants(3, (c, r) => {
      tiles.wall[0].getContext && c.drawImage(tiles.wall[Math.floor(r() * 3)], 0, 0);
      c.fillStyle = '#4a6b3a';
      let x = Math.floor(r() * 12) + 2;
      for (let y = 0; y < 16; y += 2) {
        c.fillRect(x, y, 2, 2);
        if (r() < 0.5) c.fillRect(x + (r() < 0.5 ? -2 : 2), y, 2, 1);
        x = Math.max(1, Math.min(13, x + Math.floor(r() * 3) - 1));
      }
      c.fillStyle = '#66884a';
      speck(c, r, ['#66884a'], 6);
    });

    tiles.roof = makeVariants(3, (c, r) => {
      fill(c, '#3b3b40');
      c.fillStyle = '#33333a';
      for (let x = 0; x < 16; x += 4) c.fillRect(x, 0, 1, 16);
      speck(c, r, ['#2c2c30', '#47474e'], 10);
      if (r() < 0.6) { c.fillStyle = '#6e3b1f'; c.fillRect(Math.floor(r() * 12), Math.floor(r() * 12), 3, 2); } // rust patch
      if (r() < 0.3) { c.fillStyle = '#4a6b3a'; c.fillRect(Math.floor(r() * 12), Math.floor(r() * 12), 2, 2); } // moss
    });

    tiles.plank = makeVariants(2, (c, r) => {
      fill(c, '#5e4a30');
      c.fillStyle = '#4c3b25';
      for (let x = 0; x < 16; x += 4) c.fillRect(x, 0, 1, 16);
      speck(c, r, ['#6e5a3c', '#3f3120'], 12);
    });

    tiles.fence = makeVariants(2, (c, r) => {
      grassBase(c, r, '#3f4d2e', '#33401f', '#54663a');
      c.fillStyle = '#4a3a26';
      c.fillRect(2, 3, 2, 11); c.fillRect(12, 3, 2, 11);
      c.fillStyle = '#5c4a30';
      c.fillRect(0, 5, 16, 2); c.fillRect(0, 10, 16, 2);
    });

    tiles.rubble = makeVariants(3, (c, r) => {
      fill(c, '#44423c');
      const cols = ['#57544c', '#6b675c', '#38362f', '#2e2c26'];
      for (let i = 0; i < 9; i++) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.fillRect(Math.floor(r() * 12), Math.floor(r() * 12), 2 + Math.floor(r() * 4), 2 + Math.floor(r() * 3));
      }
      if (r() < 0.4) { c.fillStyle = '#54663a'; c.fillRect(Math.floor(r() * 12), Math.floor(r() * 12), 2, 2); }
    });

    tiles.debris = makeVariants(3, (c, r) => {
      grassBase(c, r, '#3f4d2e', '#33401f', '#54663a');
      c.fillStyle = '#57544c';
      for (let i = 0; i < 3; i++) c.fillRect(Math.floor(r() * 13), Math.floor(r() * 13), 2, 1);
      c.fillStyle = '#6e3b1f';
      c.fillRect(Math.floor(r() * 13), Math.floor(r() * 13), 2, 1);
    });

    tiles.floor = makeVariants(3, (c, r) => {
      fill(c, '#4b4b4b');
      speck(c, r, ['#414141', '#565656'], 20);
      if (r() < 0.5) { c.fillStyle = '#3a3a36'; c.fillRect(Math.floor(r() * 8), Math.floor(r() * 8), 5, 4); } // stain
      c.strokeStyle = '#3e3e3e'; c.strokeRect(0.5, 0.5, 15, 15);
    });

    tiles.wallin = makeVariants(2, (c, r) => {
      fill(c, '#2e2e33');
      c.fillStyle = '#38383f';
      c.fillRect(0, 2, 16, 4); c.fillRect(0, 9, 16, 4);
      speck(c, r, ['#26262b', '#44444c', '#6e3b1f'], 10);
    });

    tiles.crate = makeVariants(2, (c, r) => {
      fill(c, '#6e5637');
      c.strokeStyle = '#4c3b25'; c.strokeRect(0.5, 0.5, 15, 15);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(16, 16); c.moveTo(16, 0); c.lineTo(0, 16); c.stroke();
      speck(c, r, ['#7c6440', '#5b4830'], 8);
    });

    tiles.tent = makeVariants(2, (c, r) => {
      fill(c, '#3a4231');
      c.fillStyle = '#4c563e';
      c.beginPath();
      for (let x = 0; x < 16; x++) { const h = Math.abs(8 - x); c.fillRect(x, h / 1.4, 1, 16); }
      c.fillStyle = '#2c3325';
      c.fillRect(7, 8, 2, 8);
      speck(c, r, ['#57624a', '#333a2b'], 8);
    });
  }

  // =====================================================
  //  SCENE PAINTERS (combat backdrops, intro slides, title)
  // =====================================================
  function skyGrad(ctx, w, h, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function silhouetteSkyline(ctx, w, groundY, rng, col) {
    ctx.fillStyle = col;
    let x = 0;
    while (x < w) {
      const bw = 18 + Math.floor(rng() * 30);
      const bh = 20 + Math.floor(rng() * 70);
      ctx.fillRect(x, groundY - bh, bw, bh);
      // broken top
      if (rng() < 0.7) {
        ctx.clearRect ? null : null;
        ctx.fillStyle = col;
        for (let i = 0; i < 3; i++) {
          const nx = x + Math.floor(rng() * bw);
          ctx.fillRect(nx, groundY - bh - 4 - Math.floor(rng() * 6), 3, 6);
        }
      }
      // windows: dark holes
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      for (let wy = groundY - bh + 6; wy < groundY - 8; wy += 10) {
        for (let wx = x + 4; wx < x + bw - 4; wx += 8) {
          if (rng() < 0.6) ctx.fillRect(wx, wy, 3, 4);
        }
      }
      ctx.fillStyle = col;
      x += bw + 4 + Math.floor(rng() * 10);
    }
  }

  function deadTrees(ctx, w, groundY, rng, col, n) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rng() * w);
      const h = 20 + Math.floor(rng() * 26);
      ctx.fillRect(x, groundY - h, 2, h);
      ctx.fillRect(x - 5, groundY - h + 6, 5, 2);
      ctx.fillRect(x + 2, groundY - h + 12, 6, 2);
      ctx.fillRect(x - 3, groundY - h + 18, 3, 2);
    }
  }

  // combat / event backdrops by environment name
  function drawBackdrop(ctx, w, h, env) {
    const rng = mulberry32(env.length * 1337 + 42);
    const groundY = Math.floor(h * 0.78);
    switch (env) {
      case 'woods':
        skyGrad(ctx, w, h, [[0, '#0a0f0a'], [1, '#15200f']]);
        deadTrees(ctx, w, groundY, rng, '#0e150c', 14);
        ctx.fillStyle = '#131c0e'; ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = '#1c2a14';
        for (let i = 0; i < 40; i++) ctx.fillRect(Math.floor(rng() * w), groundY + Math.floor(rng() * (h - groundY)), 2, 1);
        break;
      case 'city':
        skyGrad(ctx, w, h, [[0, '#2b2330'], [0.7, '#4c3a33'], [1, '#5e4436']]);
        silhouetteSkyline(ctx, w, groundY, rng, '#191521');
        ctx.fillStyle = '#2a2a26'; ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = '#3d4a2c';
        for (let i = 0; i < 30; i++) ctx.fillRect(Math.floor(rng() * w), groundY + Math.floor(rng() * (h - groundY)), 3, 1);
        break;
      case 'factory':
        skyGrad(ctx, w, h, [[0, '#191920'], [1, '#26262d']]);
        // pipes and windows
        ctx.fillStyle = '#33333c';
        ctx.fillRect(0, 20, w, 8); ctx.fillRect(0, 46, w, 5);
        for (let x = 20; x < w; x += 60) { ctx.fillStyle = '#2c2c33'; ctx.fillRect(x, 0, 10, groundY); }
        ctx.fillStyle = '#141419'; ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = '#43434c';
        for (let i = 0; i < 20; i++) ctx.fillRect(Math.floor(rng() * w), groundY + Math.floor(rng() * (h - groundY)), 4, 1);
        break;
      case 'camp':
        skyGrad(ctx, w, h, [[0, '#0b0d14'], [0.8, '#1a1626'], [1, '#241a26']]);
        // moon
        ctx.fillStyle = '#cfd4c8'; ctx.fillRect(w - 70, 22, 14, 14);
        ctx.fillStyle = '#0b0d14'; ctx.fillRect(w - 66, 26, 6, 6);
        deadTrees(ctx, w, groundY, rng, '#0d0a12', 8);
        // tents
        ctx.fillStyle = '#1c2018';
        [[40, 34], [w - 130, 42]].forEach(([tx, tw]) => {
          ctx.beginPath();
          ctx.moveTo(tx, groundY); ctx.lineTo(tx + tw / 2, groundY - 26); ctx.lineTo(tx + tw, groundY);
          ctx.fill();
        });
        // fire glow
        const fg = ctx.createRadialGradient(w / 2, groundY, 4, w / 2, groundY, 60);
        fg.addColorStop(0, 'rgba(230,140,50,0.5)'); fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#141210'; ctx.fillRect(0, groundY, w, h - groundY);
        break;
      default: // wastes / road: irradiated sunset
        skyGrad(ctx, w, h, [[0, '#3a2330'], [0.55, '#8a4b2a'], [0.8, '#b3502e'], [1, '#c97a3a']]);
        // sun, low and sick
        ctx.fillStyle = '#e8b93e';
        ctx.fillRect(w * 0.68, groundY - 26, 22, 22);
        silhouetteSkyline(ctx, w * 0.45, groundY, rng, '#241a1c');
        deadTrees(ctx, w, groundY, rng, '#1e1512', 7);
        ctx.fillStyle = '#3a3226'; ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = '#4c4230';
        for (let i = 0; i < 30; i++) ctx.fillRect(Math.floor(rng() * w), groundY + Math.floor(rng() * (h - groundY)), 3, 1);
    }
    // ash motes
    ctx.fillStyle = 'rgba(200,200,190,0.35)';
    for (let i = 0; i < 24; i++) ctx.fillRect(Math.floor(rng() * w), Math.floor(rng() * h), 1, 1);
  }

  // intro slides: 0 war, 1 dead cities, 2 safe zones, 3 the tribe, 4 you
  function drawIntroScene(ctx, w, h, idx) {
    const rng = mulberry32(idx * 999 + 7);
    ctx.clearRect(0, 0, w, h);
    const groundY = Math.floor(h * 0.82);
    switch (idx) {
      case 0: { // the Last War: mushroom cloud on the horizon
        skyGrad(ctx, w, h, [[0, '#1a0d12'], [0.6, '#4c1f1a'], [1, '#8a3b1f']]);
        silhouetteSkyline(ctx, w, groundY, rng, '#120c10');
        const cx = w * 0.72;
        ctx.fillStyle = '#d9a441';
        ctx.fillRect(cx - 5, groundY - 60, 10, 60);
        ctx.fillRect(cx - 26, groundY - 78, 52, 20);
        ctx.fillRect(cx - 18, groundY - 88, 36, 12);
        ctx.fillStyle = '#f2d98c';
        ctx.fillRect(cx - 14, groundY - 74, 28, 10);
        ctx.fillStyle = '#0f0a0d'; ctx.fillRect(0, groundY, w, h - groundY);
        break;
      }
      case 1: { // 90% gone: ruined city, vines
        skyGrad(ctx, w, h, [[0, '#242030'], [1, '#4c3a33']]);
        silhouetteSkyline(ctx, w, groundY, rng, '#16121e');
        ctx.fillStyle = '#31402a';
        for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rng() * w), groundY - Math.floor(rng() * 60), 2, 3);
        ctx.fillStyle = '#232620'; ctx.fillRect(0, groundY, w, h - groundY);
        break;
      }
      case 2: { // the safe zones: wilderness horizon
        skyGrad(ctx, w, h, [[0, '#2c3340'], [0.7, '#5c5a44'], [1, '#6b6345']]);
        deadTrees(ctx, w, groundY, rng, '#20281c', 10);
        ctx.fillStyle = '#22301f';
        for (let x = 0; x < w; x += 8) {
          const hh = 8 + Math.floor(rng() * 10);
          ctx.fillRect(x, groundY - hh, 8, hh); // pine ridge
        }
        ctx.fillStyle = '#2c3a26'; ctx.fillRect(0, groundY, w, h - groundY);
        break;
      }
      case 3: { // the tribe: huts, fence, cookfire
        skyGrad(ctx, w, h, [[0, '#1c2130'], [0.75, '#5e4436'], [1, '#8a5a2e']]);
        ctx.fillStyle = '#2a2118';
        [[60, 40, 26], [150, 52, 32], [300, 44, 28]].forEach(([x, bw, bh]) => {
          ctx.fillRect(x, groundY - bh, bw, bh);
          ctx.beginPath(); ctx.moveTo(x - 4, groundY - bh); ctx.lineTo(x + bw / 2, groundY - bh - 14); ctx.lineTo(x + bw + 4, groundY - bh); ctx.fill();
        });
        const fg = ctx.createRadialGradient(w * 0.55, groundY - 4, 2, w * 0.55, groundY - 4, 40);
        fg.addColorStop(0, 'rgba(230,150,60,0.8)'); fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#3f3a28'; ctx.fillRect(0, groundY, w, h - groundY);
        ctx.fillStyle = '#4a3a26';
        for (let x = 4; x < w; x += 10) ctx.fillRect(x, groundY - 8, 2, 8);
        break;
      }
      default: { // you, alone at dusk by the factory
        drawBackdrop(ctx, w, h, 'wastes');
        // factory silhouette
        ctx.fillStyle = '#1c1614';
        ctx.fillRect(w * 0.1, groundY - 54, 90, 54);
        ctx.fillRect(w * 0.1 + 12, groundY - 78, 12, 26);
        ctx.fillRect(w * 0.1 + 40, groundY - 70, 10, 18);
        // tiny figure
        ctx.fillStyle = '#0e0b09';
        ctx.fillRect(w * 0.62, groundY - 12, 5, 12);
        ctx.fillRect(w * 0.62 + 1, groundY - 15, 3, 3);
      }
    }
    // ash
    ctx.fillStyle = 'rgba(200,200,190,0.4)';
    for (let i = 0; i < 30; i++) ctx.fillRect(Math.floor(rng() * w), Math.floor(rng() * h), 1, 1);
  }

  // slow parallax title scene, drawn every frame
  let titleCache = null;
  function drawTitleScene(ctx, w, h, t) {
    if (!titleCache) {
      titleCache = cnv(w, h);
      const c = titleCache.getContext('2d');
      const rng = mulberry32(2174);
      const groundY = Math.floor(h * 0.8);
      skyGrad(c, w, h, [[0, '#171223'], [0.55, '#4c2a26'], [0.85, '#8a4b2a'], [1, '#a05a2e']]);
      c.fillStyle = '#e0c26a'; c.fillRect(w * 0.62, groundY - 40, 18, 18); // dying sun
      silhouetteSkyline(c, w, groundY, rng, '#140f18');
      deadTrees(c, w, groundY, rng, '#100c0e', 9);
      c.fillStyle = '#241d16'; c.fillRect(0, groundY, w, h - groundY);
      c.fillStyle = '#332a1c';
      for (let i = 0; i < 40; i++) c.fillRect(Math.floor(rng() * w), groundY + Math.floor(rng() * (h - groundY)), 3, 1);
    }
    ctx.drawImage(titleCache, 0, 0);
  }

  function init() {
    buildCharacters();
    buildEnemies();
    buildProps();
    buildIcons();
    buildTiles();
  }

  function get(name) { return store[name]; }
  function tile(name, x, y) {
    const v = tiles[name];
    if (!v) return null;
    return v[((x * 7 + y * 13) >>> 0) % v.length];
  }
  function toURL(name) { const s = store[name]; return s ? s.toDataURL() : ''; }

  return { init, get, tile, toURL, drawBackdrop, drawIntroScene, drawTitleScene, px, cnv };
})();
