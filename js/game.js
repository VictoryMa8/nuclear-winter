// ============ NUCLEAR WINTER — engine, world & story ============

const Game = (() => {
  const TILE = 16;
  const VIEW_W = 480, VIEW_H = 320;

  let canvas, ctx;
  let state = 'title'; // title | class | intro | world | dialogue | combat | dead | ending
  let keys = {};
  let lastTs = 0;
  let combatCooldown = 0;
  let stepTimer = 0;
  let fade = { alpha: 0, dir: 0, cb: null };

  // ---------------- player ----------------
  const player = {
    x: 0, y: 0, dir: 'down', frame: 0, animT: 0, moving: false,
    xp: 0, level: 0, xpToNextLevel: 10, gold: 0,
    health: 100, maxHealth: 100, atk: 10, def: 10, spd: 10,
    inventory: [], currentWeapon: DATA.weapons.fists,
    classId: 'none', className: 'None', classDesc: ''
  };

  // story flags
  const flags = {
    quest: 0,
    enteredTown: false,
    opened: {},    // chest ids
    fired: {},     // trigger ids
    defeated: {},  // unique enemy ids
    websBurned: false,
    factoryUnlocked: false
  };

  // ---------------- world state ----------------
  const builtGrids = {};
  let world = null; // { id, def, grid, w, h, npcs, enemies, props, chests }
  let cam = { x: 0, y: 0 };
  let ash = [];

  function buildGrid(id) {
    if (!builtGrids[id]) builtGrids[id] = Maps.MAPS[id].build().g;
    return builtGrids[id];
  }

  function loadMap(id, tx, ty, silent) {
    const def = Maps.MAPS[id];
    const grid = buildGrid(id);
    world = {
      id, def, grid, w: def.w, h: def.h,
      npcs: (def.npcs || []).map(n => Object.assign({}, n, { px: n.x * TILE, py: n.y * TILE })),
      chests: (def.chests || []).map(c => Object.assign({}, c)),
      props: (def.props || []).filter(p => {
        if (p.id === 'webs' && flags.websBurned) return false;
        return true;
      }).map(p => Object.assign({}, p)),
      enemies: (def.enemies || []).filter(e => !(e.id && flags.defeated[e.id])).map(e => ({
        typeId: e.type, id: e.id, respawn: e.respawn,
        x: e.x * TILE, y: e.y * TILE, homeX: e.x * TILE, homeY: e.y * TILE,
        dir: 'down', moveT: 0, vx: 0, vy: 0, frame: 0
      }))
    };
    player.x = tx * TILE;
    player.y = ty * TILE;
    ash = [];
    for (let i = 0; i < 40; i++) {
      ash.push({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, vy: 8 + Math.random() * 14, vx: -4 + Math.random() * 8, s: Math.random() < 0.3 ? 2 : 1 });
    }
    if (!silent) {
      toast(def.name);
      saveGame();
    }
  }

  // ---------------- collision ----------------
  function solidAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) return true;
    if (Maps.isSolid(world.grid[ty][tx])) return true;
    // solid props / chests occupy their tile
    for (const p of world.props) {
      if (p.type === 'sign') continue;
      const pw = p.type === 'car' ? 2 : 1;
      if (tx >= p.x && tx < p.x + pw && ty === p.y) return true;
    }
    for (const c of world.chests) if (c.x === tx && c.y === ty) return true;
    for (const n of world.npcs) if (n.x === tx && n.y === ty) return true;
    return false;
  }

  // feet hitbox: 10px wide, 6px tall at the bottom of the 16px sprite
  function blocked(x, y) {
    return solidAt(x + 3, y + 10) || solidAt(x + 12, y + 10) ||
           solidAt(x + 3, y + 15) || solidAt(x + 12, y + 15);
  }

  function moveEntity(e, dx, dy) {
    if (dx && !blocked(e.x + dx, e.y)) e.x += dx;
    else if (dx) return false;
    if (dy && !blocked(e.x, e.y + dy)) e.y += dy;
    else if (dy) return false;
    return true;
  }

  // ---------------- update ----------------
  function update(dt, ts) {
    if (fade.dir !== 0) {
      fade.alpha += fade.dir * dt * 3;
      if (fade.dir > 0 && fade.alpha >= 1) { fade.alpha = 1; fade.dir = -1; if (fade.cb) { fade.cb(); fade.cb = null; } }
      if (fade.dir < 0 && fade.alpha <= 0) { fade.alpha = 0; fade.dir = 0; }
    }

    // ash falls in every state that shows the world
    ash.forEach(a => {
      a.y += a.vy * dt; a.x += a.vx * dt + Math.sin(ts / 900 + a.y * 0.05) * 0.2;
      if (a.y > VIEW_H) { a.y = -2; a.x = Math.random() * VIEW_W; }
      if (a.x < 0) a.x += VIEW_W; if (a.x > VIEW_W) a.x -= VIEW_W;
    });

    if (state !== 'world') return;
    combatCooldown = Math.max(0, combatCooldown - dt);

    // --- player movement ---
    let dx = 0, dy = 0;
    if (keys.ArrowUp || keys.w) dy = -1;
    else if (keys.ArrowDown || keys.s) dy = 1;
    if (keys.ArrowLeft || keys.a) dx = -1;
    else if (keys.ArrowRight || keys.d) dx = 1;

    player.moving = !!(dx || dy);
    if (player.moving) {
      if (dy < 0) player.dir = 'up'; else if (dy > 0) player.dir = 'down';
      if (dx < 0) player.dir = 'left'; else if (dx > 0) player.dir = 'right';
      const spd = 85 * dt;
      const norm = dx && dy ? 0.7071 : 1;
      moveEntity(player, Math.round(dx * spd * norm * 10) / 10, 0);
      moveEntity(player, 0, Math.round(dy * spd * norm * 10) / 10);
      player.animT += dt;
      if (player.animT > 0.16) { player.animT = 0; player.frame = 1 - player.frame; }
      stepTimer -= dt;
      if (stepTimer <= 0) { AudioSys.sfx.step(); stepTimer = 0.28; }
    } else {
      player.frame = 0;
    }

    const ptx = Math.floor((player.x + 8) / TILE), pty = Math.floor((player.y + 12) / TILE);

    // --- portals ---
    for (const p of world.def.portals || []) {
      if (ptx >= p.x && ptx < p.x + (p.w || 1) && pty >= p.y && pty < p.y + (p.h || 1)) {
        if (p.cond && !p.cond()) {
          // push back and explain
          player.y += p.y === 0 ? 6 : -6;
          if (!flags.fired['deny_' + p.map]) {
            flags.fired['deny_' + p.map] = true;
            say([{ text: p.msg }]);
          }
          return;
        }
        transition(() => loadMap(p.map, p.tx, p.ty));
        return;
      }
    }

    // --- triggers ---
    for (const t of world.def.triggers || []) {
      if (t.once && flags.fired[t.id]) continue;
      if (ptx >= t.x && ptx < t.x + t.w && pty >= t.y && pty < t.y + t.h) {
        flags.fired[t.id] = true;
        say(t.lines);
        return;
      }
    }

    // --- enemies ---
    for (const e of world.enemies) {
      const type = DATA.enemyTypes[e.typeId];
      const distX = (player.x - e.x), distY = (player.y - e.y);
      const dist = Math.hypot(distX, distY);

      if (dist < TILE * 5.5) {
        // chase
        const sp = (type.spd * 1.6 + 18) * dt;
        const nx = e.x + (distX / dist) * sp;
        const ny = e.y + (distY / dist) * sp;
        if (!blocked(nx, e.y)) e.x = nx;
        if (!blocked(e.x, ny)) e.y = ny;
        e.dir = Math.abs(distX) > Math.abs(distY) ? (distX < 0 ? 'left' : 'right') : (distY < 0 ? 'up' : 'down');
      } else {
        // shamble around home
        e.moveT -= dt;
        if (e.moveT <= 0) {
          e.moveT = 1 + Math.random() * 2;
          const ang = Math.random() * Math.PI * 2;
          e.vx = Math.cos(ang) * 18; e.vy = Math.sin(ang) * 18;
          if (Math.random() < 0.4 || Math.hypot(e.x - e.homeX, e.y - e.homeY) > TILE * 4) {
            const bx = e.homeX - e.x, by = e.homeY - e.y, bd = Math.hypot(bx, by) || 1;
            e.vx = (bx / bd) * 18; e.vy = (by / bd) * 18;
          }
        }
        const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
        if (!blocked(nx, e.y)) e.x = nx; else e.vx *= -1;
        if (!blocked(e.x, ny)) e.y = ny; else e.vy *= -1;
      }
      e.frame = Math.floor(ts / 250) % 2;

      if (dist < 14 && combatCooldown <= 0) {
        startCombat(e);
        return;
      }
    }
  }

  function transition(cb) {
    fade.dir = 1;
    fade.cb = cb;
  }

  // ---------------- combat glue ----------------
  const MAP_ENV = { wastes: 'wastes', road: 'wastes', town: 'wastes', woods: 'woods', city: 'city', factory: 'factory', camp: 'camp' };

  function startCombat(e) {
    state = 'combat';
    // special narrative beat for the very first raider
    if (e.id === 'northRaider' && !flags.fired.raiderIntro) {
      flags.fired.raiderIntro = true;
    }
    Combat.start(e.typeId, {
      env: MAP_ENV[world.id] || 'wastes',
      onEnd: (outcome) => {
        state = 'world';
        combatCooldown = 1.6;
        if (outcome === true) {
          if (e.id) flags.defeated[e.id] = true;
          world.enemies = world.enemies.filter(x => x !== e);
          afterVictory(e);
          saveGame();
        } else {
          // fled: shove the enemy back home so it doesn't instantly re-engage
          e.x = e.homeX; e.y = e.homeY;
        }
        updateHUD();
      },
      onLose: () => die()
    });
  }

  function afterVictory(e) {
    switch (e.id) {
      case 'northRaider':
        say([{ text: 'The raider drops. After that rough battle, you catch your breath — and see smoke from your town, far to the east.' }]);
        break;
      case 'mutantDeer':
        say([{ text: 'The two-headed thing shudders and lies still. The woods fall silent for the first time in weeks. Elder Rook will want to hear of this.' }]);
        break;
      case 'factoryBear':
        say([{ text: 'The bear collapses between the machine rows, glowing eyes going dark. The factory floor is yours to strip.' }]);
        break;
      case 'factionLeader':
        flags.quest = 4;
        state = 'dialogue';
        say([
          { text: '"...should have stayed... behind your fence..." The Southern Faction Leader falls beside his own war chest.' },
          { text: 'Without their leader, the soldiers scatter into the night. The southern threat is broken.' }
        ], () => showEnding());
        return;
    }
  }

  function die() {
    state = 'dead';
    AudioSys.sfx.death();
    const lost = Math.floor(player.gold / 2);
    player.gold -= lost;
    document.getElementById('death-text').textContent = flags.enteredTown
      ? `A scavver dragged you back to Homestead... minus ${lost} gold for the trouble.`
      : `You wake in the dirt where you fell. Someone went through your pockets: ${lost} gold, gone.`;
    document.getElementById('death-overlay').classList.remove('hidden');
  }

  function respawn() {
    player.health = player.maxHealth;
    document.getElementById('death-overlay').classList.add('hidden');
    if (flags.enteredTown) loadMap('town', 4, 12);
    else loadMap('wastes', 22, 20);
    state = 'world';
    updateHUD();
  }

  // ---------------- progression ----------------
  function gainRewards(xp, gold) {
    player.xp += xp;
    player.gold += gold;
    let msg = '';
    while (player.xp >= player.xpToNextLevel) {
      player.xp -= player.xpToNextLevel;
      player.level++;
      player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.6);
      player.maxHealth += 20;
      player.atk += 3; player.def += 3; player.spd += 2;
      player.health = player.maxHealth;
      msg = `LEVEL UP! You are now level ${player.level}. All wounds close.`;
      AudioSys.sfx.levelup();
    }
    updateHUD();
    return msg;
  }

  function addItem(id) { player.inventory.push(id); updateHUD(); }
  function removeItem(id) {
    const i = player.inventory.indexOf(id);
    if (i >= 0) player.inventory.splice(i, 1);
    updateHUD();
  }
  function hasItem(id) { return player.inventory.includes(id); }

  // ---------------- dialogue ----------------
  let dlg = { lines: [], idx: 0, shown: 0, timer: null, onDone: null, prevState: 'world' };

  function say(lines, onDone) {
    dlg.lines = lines; dlg.idx = 0; dlg.onDone = onDone || null;
    if (state === 'world') dlg.prevState = 'world';
    state = 'dialogue';
    showLine();
    document.getElementById('dialogue-box').classList.remove('hidden');
  }

  function showLine() {
    const line = dlg.lines[dlg.idx];
    const nameEl = document.getElementById('dialogue-name');
    nameEl.textContent = line.name || '';
    nameEl.style.display = line.name ? 'block' : 'none';
    const textEl = document.getElementById('dialogue-text');
    textEl.textContent = '';
    dlg.shown = 0;
    document.getElementById('dialogue-more').style.visibility = 'hidden';
    clearInterval(dlg.timer);
    dlg.timer = setInterval(() => {
      dlg.shown += 2;
      textEl.textContent = line.text.slice(0, dlg.shown);
      if (dlg.shown % 6 === 0) AudioSys.sfx.talk();
      if (dlg.shown >= line.text.length) {
        clearInterval(dlg.timer);
        document.getElementById('dialogue-more').style.visibility = 'visible';
      }
    }, 18);
  }

  function advanceDialogue() {
    const line = dlg.lines[dlg.idx];
    if (dlg.shown < line.text.length) { // skip typewriter
      clearInterval(dlg.timer);
      dlg.shown = line.text.length;
      document.getElementById('dialogue-text').textContent = line.text;
      document.getElementById('dialogue-more').style.visibility = 'visible';
      return;
    }
    dlg.idx++;
    AudioSys.sfx.click();
    if (dlg.idx < dlg.lines.length) { showLine(); return; }
    document.getElementById('dialogue-box').classList.add('hidden');
    state = 'world';
    const cb = dlg.onDone; dlg.onDone = null;
    if (cb) cb();
  }

  // ---------------- interaction ----------------
  function interactTarget() {
    // the tile the player faces, plus a forgiving radius
    const fx = player.x + 8 + (player.dir === 'left' ? -TILE : player.dir === 'right' ? TILE : 0);
    const fy = player.y + 12 + (player.dir === 'up' ? -TILE : player.dir === 'down' ? TILE : 0);
    const ftx = Math.floor(fx / TILE), fty = Math.floor(fy / TILE);
    const near = (tx, ty, w) => {
      w = w || 1;
      if (ftx >= tx && ftx < tx + w && fty === ty) return true;
      const cx = (tx + w / 2) * TILE, cy = ty * TILE + 8;
      return Math.hypot(player.x + 8 - cx, player.y + 12 - cy) < TILE * 1.4;
    };
    for (const n of world.npcs) if (near(n.x, n.y)) return { kind: 'npc', obj: n };
    for (const c of world.chests) if (near(c.x, c.y)) return { kind: 'chest', obj: c };
    for (const p of world.props) {
      if (near(p.x, p.y, p.type === 'car' ? 2 : 1)) {
        if (p.type === 'sign' || p.type === 'web' || (p.type === 'door' && p.id === 'factoryDoor')) return { kind: p.type, obj: p };
      }
    }
    return null;
  }

  function interact() {
    const t = interactTarget();
    if (!t) return;
    if (t.kind === 'npc') return talkTo(t.obj);
    if (t.kind === 'sign') { AudioSys.sfx.click(); return say([{ name: 'SIGN', text: t.obj.text }]); }
    if (t.kind === 'chest') return openChest(t.obj);
    if (t.kind === 'web') return tryBurnWebs(t.obj);
    if (t.kind === 'door') return tryFactoryDoor();
  }

  function openChest(c) {
    if (flags.opened[c.id]) { AudioSys.sfx.denied(); return say([{ text: 'Empty. You already stripped it.' }]); }
    flags.opened[c.id] = true;
    AudioSys.sfx.pickup();
    (c.loot.items || []).forEach(addItem);
    if (c.loot.gold) { player.gold += c.loot.gold; AudioSys.sfx.coin(); }
    updateHUD();
    saveGame();
    say([{ text: c.text }]);
  }

  function tryBurnWebs(p) {
    if (hasItem('lighter')) {
      AudioSys.sfx.burn();
      flags.websBurned = true;
      world.props = world.props.filter(x => x !== p);
      saveGame();
      say([{ text: 'You put the lighter to the webs. They catch instantly, hissing away in green flame. The deep path south lies open.' }]);
    } else {
      AudioSys.sfx.denied();
      say([{ text: 'Thick, ropey webs seal the path — mutated silk, tough as cable. If only you had a flame...' }]);
    }
  }

  function tryFactoryDoor() {
    if (flags.factoryUnlocked) {
      transition(() => loadMap('factory', 12, 15));
      return;
    }
    if (hasItem('key')) {
      AudioSys.sfx.unlock();
      removeItem('key');
      flags.factoryUnlocked = true;
      saveGame();
      say([{ text: 'The pre-war Key grinds, fights you, then turns. The factory door swings open onto pure darkness.' },
           { text: '(Press E on the door again to head inside.)' }]);
    } else if (flags.quest >= 2) {
      AudioSys.sfx.denied();
      say([{ text: 'Locked — a heavy pre-war mechanism. Rook said the machine shop in the dead city kept the key.' }]);
    } else {
      AudioSys.sfx.denied();
      say([{ text: "The factory's steel door is locked tight. Whatever's inside has been sealed in for 150 years." }]);
    }
  }

  // ---------------- NPC talk handlers ----------------
  const TALKS = {
    gateGuard(n) {
      if (!flags.enteredTown) {
        flags.enteredTown = true;
        saveGame();
        return say([
          { name: n.name, text: "It's nice to see you back and alive! Gate's open — get in before dark." },
          { name: n.name, text: 'Elder Rook was asking after you. He\'s by the hall, north side of the square. Sounded serious.' }
        ]);
      }
      say([{ name: n.name, text: flags.quest >= 4 ? 'Word is you broke the southern camp single-handed. Drinks are on the town. Forever.' : 'Stay sharp out there. The wastes don\'t forgive twice.' }]);
    },
    gateGuard2(n) {
      say([{ name: n.name, text: flags.quest >= 3 ? 'Southern scouts were spotted past the treeline. Whatever you\'re doing, do it fast.' : 'Not many people leave town. It\'s dangerous out in the wilderness.' }]);
    },
    villager1(n) {
      say([{ name: n.name, text: flags.quest >= 3 ? 'The purifier hums like new! First clean water in months.' : 'The purifier water tastes like rust lately. Rook says the machine is dying.' }]);
    },
    villager2(n) {
      say([{ name: n.name, text: flags.quest >= 2 ? 'You went in the DEAD CITY? What was it like? Were there ghosts?' : 'I saw green lights in the south woods at night. Ma says I\'m lying. I\'m NOT.' }]);
    },
    trader() {
      openShop();
    },
    elder(n) {
      const name = n.name;
      switch (flags.quest) {
        case 0:
          say([
            { name, text: `So the ${player.className} made it home. Good. Sit — there is no easy way to say this.` },
            { name, text: 'The water purifier is dying, and something in the south woods has been screaming at night. Scouts won\'t go near it. Wildlife\'s gone wrong.' },
            { name, text: 'Clear the dark woods for me. Take my old lighter — it\'s black as a mine down there.' }
          ], () => {
            addItem('lighter');
            flags.quest = 1;
            AudioSys.sfx.pickup();
            toast('QUEST: CLEAR THE DARK WOODS');
            saveGame();
          });
          break;
        case 1:
          if (flags.defeated.mutantDeer) {
            say([
              { name, text: 'The screaming stopped. You actually did it... What WAS it? No — don\'t tell me. I sleep badly enough.' },
              { name, text: 'Now the harder ask. The purifier needs pre-war parts. The machine shop in the dead city, north past the factory, kept spares under lock.' },
              { name, text: 'Find the key in the city ruins, open the old factory floor, and bring me those parts. Watch the streets — things den in the towers now.' }
            ], () => {
              flags.quest = 2;
              toast('QUEST: PARTS FOR THE PURIFIER');
              saveGame();
            });
          } else {
            say([{ name, text: 'The woods still scream at night. Whatever is down there, it isn\'t getting friendlier.' }]);
          }
          break;
        case 2:
          if (hasItem('parts')) {
            say([
              { name, text: 'By the old world... actual factory-grease parts. The purifier will outlive us both.' },
              { name, text: 'But I have one more thing, and it\'s the worst one. The Southern Faction has a camp beyond the deep woods. They mean to burn us out come spring.' },
              { name, text: 'Their strength is one man — their leader. Burn through the webs on the south path and cut the head off the snake. End this.' }
            ], () => {
              removeItem('parts');
              player.gold += 100;
              AudioSys.sfx.coin();
              flags.quest = 3;
              toast('QUEST: THE SOUTHERN CAMP  (+100 GOLD)');
              saveGame();
            });
          } else {
            say([{ name, text: flags.factoryUnlocked ? 'The parts should be on the factory floor. Mind whatever moved in there.' : 'The key first — the dead city, north of the wastes. Then the factory floor.' }]);
          }
          break;
        case 3:
          say([{ name, text: 'The camp lies south, past the webs in the deep woods. Gear up with Mira first. Come back alive — that\'s an order.' }]);
          break;
        default:
          say([{ name, text: 'You saved this town twice over. Whatever winters come... we\'ll see them through.' }]);
      }
    }
  };

  function talkTo(n) {
    // face each other
    AudioSys.sfx.click();
    const h = TALKS[n.talk];
    if (h) h(n); else say([{ name: n.name, text: '...' }]);
  }

  // ---------------- shop ----------------
  function openShop() {
    state = 'dialogue'; // block movement under the panel
    document.getElementById('shop-gold').textContent = player.gold;
    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    DATA.shopStock.forEach(entry => {
      const def = entry.kind === 'item' ? DATA.items[entry.id] : DATA.weapons[entry.id];
      const row = document.createElement('div');
      row.className = 'shop-item';
      const owned = entry.kind === 'weapon' && player.currentWeapon.name === def.name;
      const desc = entry.kind === 'item' ? def.desc : `DMG ${def.dmg} / DEX ${def.dex} / RNG ${def.rng} — replaces your ${player.currentWeapon.name}`;
      row.innerHTML = `
        <img src="${Sprites.toURL(def.icon)}" alt="">
        <div class="shop-info">
          <div class="shop-name">${def.name}</div>
          <div class="shop-desc">${desc}</div>
        </div>
        <div class="shop-price">${entry.price}g</div>`;
      const btn = document.createElement('button');
      btn.textContent = owned ? 'HELD' : 'BUY';
      btn.disabled = owned || player.gold < entry.price;
      btn.onclick = () => {
        if (player.gold < entry.price) return;
        player.gold -= entry.price;
        if (entry.kind === 'item') addItem(entry.id);
        else player.currentWeapon = DATA.weapons[entry.id];
        AudioSys.sfx.coin();
        updateHUD();
        saveGame();
        openShop(); // re-render
      };
      row.appendChild(btn);
      list.appendChild(row);
    });
    document.getElementById('shop-overlay').classList.remove('hidden');
  }

  // ---------------- inventory / quest panels ----------------
  function openInventory() {
    if (state !== 'world') return;
    state = 'dialogue';
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    const counted = {};
    player.inventory.forEach(id => counted[id] = (counted[id] || 0) + 1);
    const entries = Object.entries(counted);
    for (let i = 0; i < Math.max(8, entries.length); i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      if (entries[i]) {
        const [id, n] = entries[i];
        const def = DATA.items[id];
        slot.innerHTML = `<img src="${Sprites.toURL(def.icon)}" alt=""><span>${def.name}</span><span class="inv-count">x${n}</span>`;
        slot.title = def.desc;
        slot.onclick = () => useItemFromPack(id);
      } else {
        slot.classList.add('empty');
      }
      grid.appendChild(slot);
    }
    const w = player.currentWeapon;
    document.getElementById('inv-weapon-row').innerHTML =
      `<img src="${Sprites.toURL(w.icon)}" alt=""><span>${w.name}</span><span class="weapon-stats">DMG ${w.dmg} / DEX ${w.dex} / RNG ${w.rng}</span>`;
    document.getElementById('inventory-overlay').classList.remove('hidden');
  }

  function useItemFromPack(id) {
    if (id === 'medkit') {
      if (player.health >= player.maxHealth) { AudioSys.sfx.denied(); return; }
      removeItem(id);
      player.health = Math.min(player.maxHealth, player.health + 75);
      AudioSys.sfx.heal();
      updateHUD();
      closePanels();
    } else {
      AudioSys.sfx.click();
    }
  }

  function openQuestLog() {
    if (state !== 'world') return;
    state = 'dialogue';
    document.getElementById('quest-text').textContent = DATA.questText[flags.quest];
    document.getElementById('quest-overlay').classList.remove('hidden');
  }

  function closePanels() {
    ['inventory-overlay', 'quest-overlay', 'shop-overlay'].forEach(id =>
      document.getElementById(id).classList.add('hidden'));
    if (state === 'dialogue' && dlg.idx >= dlg.lines.length) state = 'world';
    if (state === 'dialogue' && document.getElementById('dialogue-box').classList.contains('hidden')) state = 'world';
  }

  // ---------------- HUD ----------------
  function updateHUD() {
    document.getElementById('hud-class').textContent = player.className.toUpperCase();
    document.getElementById('hud-level').textContent = `LV ${player.level}`;
    const hpPct = (player.health / player.maxHealth) * 100;
    const hpFill = document.getElementById('hp-fill');
    hpFill.style.width = `${hpPct}%`;
    hpFill.classList.toggle('low', hpPct < 30);
    document.getElementById('hp-num').textContent = `${player.health}/${player.maxHealth}`;
    document.getElementById('xp-fill').style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
    document.getElementById('xp-num').textContent = `${player.xp}/${player.xpToNextLevel}`;
    document.getElementById('hud-gold').textContent = player.gold;
    document.getElementById('hud-weapon-icon').src = Sprites.toURL(player.currentWeapon.icon);
    document.getElementById('hud-weapon-name').textContent = player.currentWeapon.name;
  }

  function toast(text) {
    const el = document.getElementById('area-toast');
    el.textContent = text;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth; // restart animation
    el.style.animation = '';
  }

  // ---------------- rendering ----------------
  function render(ts) {
    ctx.imageSmoothingEnabled = false;

    if (state === 'title' || state === 'class' || state === 'intro') {
      Sprites.drawTitleScene(ctx, VIEW_W, VIEW_H, ts);
      drawAsh();
      return;
    }
    if (!world) return;

    // camera
    cam.x = Math.max(0, Math.min(world.w * TILE - VIEW_W, player.x + 8 - VIEW_W / 2));
    cam.y = Math.max(0, Math.min(world.h * TILE - VIEW_H, player.y + 8 - VIEW_H / 2));
    const cx = Math.floor(cam.x), cy = Math.floor(cam.y);

    // tiles
    const tx0 = Math.floor(cx / TILE), ty0 = Math.floor(cy / TILE);
    for (let ty = ty0; ty <= ty0 + VIEW_H / TILE; ty++) {
      for (let tx = tx0; tx <= tx0 + VIEW_W / TILE; tx++) {
        if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) continue;
        const t = Sprites.tile(world.grid[ty][tx], tx, ty);
        if (t) ctx.drawImage(t, tx * TILE - cx, ty * TILE - cy);
      }
    }

    // drawables, y-sorted
    const draws = [];
    world.chests.forEach(c => draws.push({
      y: c.y * TILE, spr: Sprites.get(flags.opened[c.id] ? 'chest_open' : 'chest'), x: c.x * TILE, py: c.y * TILE
    }));
    world.props.forEach(p => {
      const sprName = { web: 'web', barrel: 'barrel', sign: 'sign', door: 'door_metal', car: 'car' }[p.type];
      const spr = Sprites.get(sprName);
      draws.push({ y: p.y * TILE + (p.type === 'car' ? 4 : 0), spr, x: p.x * TILE, py: p.y * TILE + (p.type === 'car' ? -4 : 0) });
    });
    world.npcs.forEach(n => draws.push({
      y: n.y * TILE, spr: Sprites.get(`${n.sprite}_down_0`) || Sprites.get(n.sprite), x: n.x * TILE, py: n.y * TILE
    }));
    world.enemies.forEach(e => {
      const spr = Sprites.get(DATA.enemyTypes[e.typeId].sprite);
      draws.push({ y: e.y, spr, x: e.x - (spr.width - 16) / 2, py: e.y - (spr.height - 16), bob: e.frame });
    });
    const pspr = Sprites.get(`player_${player.classId}_${player.dir}_${player.frame}`);
    draws.push({ y: player.y, spr: pspr, x: player.x, py: player.y });

    draws.sort((a, b) => a.y - b.y);
    draws.forEach(d => {
      if (d.spr) ctx.drawImage(d.spr, Math.floor(d.x - cx), Math.floor(d.py - cy - (d.bob ? 1 : 0)));
    });

    // interaction prompt
    if (state === 'world') {
      const t = interactTarget();
      if (t) {
        const ix = t.obj.x * TILE - cx + 4, iy = t.obj.y * TILE - cy - 12 + Math.sin(ts / 200) * 2;
        ctx.fillStyle = '#17130e';
        ctx.fillRect(ix - 1, iy - 1, 10, 10);
        ctx.fillStyle = '#d9a441';
        ctx.fillRect(ix, iy, 8, 8);
        ctx.fillStyle = '#17130e';
        ctx.font = '8px monospace';
        ctx.fillText('E', ix + 2, iy + 7);
      }
    }

    // darkness with a lighter-lit hole
    if (world.def.dark) {
      const dark = renderDarkness();
      ctx.drawImage(dark, 0, 0);
    }
    // atmosphere tint
    if (world.def.tint) {
      ctx.fillStyle = world.def.tint;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    drawAsh();

    if (fade.alpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade.alpha})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  let darkCanvas = null;
  function renderDarkness() {
    if (!darkCanvas) darkCanvas = Sprites.cnv(VIEW_W, VIEW_H);
    const d = darkCanvas.getContext('2d');
    d.clearRect(0, 0, VIEW_W, VIEW_H);
    d.fillStyle = 'rgba(2, 4, 8, 0.93)';
    d.fillRect(0, 0, VIEW_W, VIEW_H);
    const px = player.x + 8 - Math.floor(cam.x), py = player.y + 8 - Math.floor(cam.y);
    const r = hasItem('lighter') ? 95 : 48;
    const g = d.createRadialGradient(px, py, r * 0.2, px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.globalCompositeOperation = 'destination-out';
    d.fillStyle = g;
    d.fillRect(0, 0, VIEW_W, VIEW_H);
    d.globalCompositeOperation = 'source-over';
    // warm flame tinge at the center
    if (hasItem('lighter')) {
      const wg = d.createRadialGradient(px, py, 2, px, py, r);
      wg.addColorStop(0, 'rgba(230, 150, 60, 0.12)');
      wg.addColorStop(1, 'rgba(230, 150, 60, 0)');
      d.fillStyle = wg;
      d.fillRect(px - r, py - r, r * 2, r * 2);
    }
    return darkCanvas;
  }

  function drawAsh() {
    ctx.fillStyle = 'rgba(205, 205, 195, 0.5)';
    ash.forEach(a => ctx.fillRect(Math.floor(a.x), Math.floor(a.y), a.s, a.s));
  }

  // ---------------- flow: title → class → intro → world ----------------
  function showClassSelect() {
    document.getElementById('title-overlay').classList.add('hidden');
    const cards = document.getElementById('class-cards');
    cards.innerHTML = '';
    DATA.classes.forEach(c => {
      const w = DATA.weapons[c.weapon];
      const card = document.createElement('div');
      card.className = 'class-card';
      card.innerHTML = `
        <img src="${Sprites.toURL(`player_${c.id}_down_0`)}" alt="${c.name}">
        <h3>${c.name.toUpperCase()}</h3>
        <div class="class-desc">${c.desc}</div>
        <div class="class-stats">
          <b>HP</b> ${c.maxHealth} &nbsp;<b>ATK</b> ${c.atk}<br>
          <b>DEF</b> ${c.def} &nbsp;<b>SPD</b> ${c.spd}<br>
          <b>${w.name}</b>
        </div>`;
      card.onclick = () => {
        AudioSys.sfx.pickup();
        setPlayerClass(c);
        document.getElementById('class-overlay').classList.add('hidden');
        showIntro();
      };
      cards.appendChild(card);
    });
    document.getElementById('class-overlay').classList.remove('hidden');
    state = 'class';
  }

  function setPlayerClass(c) {
    player.classId = c.id;
    player.className = c.name;
    player.classDesc = c.desc;
    player.maxHealth = c.maxHealth; player.health = c.maxHealth;
    player.atk = c.atk; player.def = c.def; player.spd = c.spd;
    player.currentWeapon = DATA.weapons[c.weapon];
  }

  let introIdx = 0;
  function showIntro() {
    state = 'intro';
    introIdx = 0;
    document.getElementById('intro-overlay').classList.remove('hidden');
    renderIntroSlide();
  }

  function renderIntroSlide() {
    const cv = document.getElementById('intro-canvas');
    Sprites.drawIntroScene(cv.getContext('2d'), cv.width, cv.height, introIdx);
    let text = DATA.introSlides[introIdx];
    text = text.replace('{class}', player.className);
    document.getElementById('intro-text').textContent = text;
    document.getElementById('btn-intro-next').textContent =
      introIdx === DATA.introSlides.length - 1 ? 'STEP INTO THE WASTES' : 'CONTINUE';
  }

  function nextIntro() {
    AudioSys.sfx.click();
    introIdx++;
    if (introIdx >= DATA.introSlides.length) {
      document.getElementById('intro-overlay').classList.add('hidden');
      beginGame();
    } else {
      renderIntroSlide();
    }
  }

  function beginGame() {
    document.getElementById('hud').classList.remove('hidden');
    const start = Maps.MAPS.wastes.playerStart;
    loadMap('wastes', start.x, start.y);
    state = 'world';
    updateHUD();
    setTimeout(() => {
      say([{ text: 'You are out collecting supplies from the old factory. The sun is setting — find a way back to town before it gets too dark.' }]);
    }, 700);
  }

  // ---------------- ending ----------------
  function showEnding() {
    state = 'ending';
    saveGame();
    AudioSys.sfx.victory();
    document.getElementById('ending-text').innerHTML =
      `You walk the long road home under falling ash. The gate opens before you reach it — the whole town is waiting.<br><br>
       The purifier hums. The woods are quiet. The south is broken. For the first time in 150 years, Homestead plans for spring.
       <span class="ending-stats">${player.className} — LEVEL ${player.level} — ${player.gold} GOLD REMAINING</span>`;
    document.getElementById('ending-overlay').classList.remove('hidden');
  }

  // ---------------- save / load ----------------
  const SAVE_KEY = 'nuclear-winter-save';

  function saveGame() {
    if (!world || player.classId === 'none') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        player: {
          classId: player.classId, className: player.className, classDesc: player.classDesc,
          xp: player.xp, level: player.level, xpToNextLevel: player.xpToNextLevel, gold: player.gold,
          health: player.health, maxHealth: player.maxHealth, atk: player.atk, def: player.def, spd: player.spd,
          inventory: player.inventory, weapon: Object.keys(DATA.weapons).find(k => DATA.weapons[k] === player.currentWeapon)
        },
        flags, map: world.id,
        x: Math.round(player.x / TILE), y: Math.round(player.y / TILE)
      }));
    } catch (e) { /* private mode etc. */ }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      Object.assign(player, s.player);
      player.currentWeapon = DATA.weapons[s.player.weapon] || DATA.weapons.fists;
      Object.assign(flags, s.flags);
      document.getElementById('title-overlay').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      loadMap(s.map, s.x, s.y, true);
      toast(Maps.MAPS[s.map].name);
      state = 'world';
      updateHUD();
      return true;
    } catch (e) { return false; }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function resetToNewGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    location.reload();
  }

  // ---------------- input ----------------
  const MOVE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '];

  function onKeyDown(ev) {
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (MOVE_KEYS.includes(k)) ev.preventDefault();
    keys[k] = true;

    if (state === 'combat') { Combat.handleKey(k); return; }
    if (k === 'm') {
      const muted = AudioSys.toggleMute();
      toast(muted ? 'SOUND OFF' : 'SOUND ON');
      return;
    }
    if (state === 'dialogue') {
      if (k === 'e' || k === ' ' || k === 'Enter') {
        if (!document.getElementById('dialogue-box').classList.contains('hidden')) advanceDialogue();
      }
      if (k === 'Escape' || k === 'i' || k === 'q') closePanels();
      return;
    }
    if (state !== 'world') return;
    if (k === 'e' || k === 'Enter') interact();
    if (k === 'i') openInventory();
    if (k === 'q') openQuestLog();
  }

  function onKeyUp(ev) {
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    keys[k] = false;
  }

  // ---------------- boot ----------------
  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt, ts);
    render(ts);
    requestAnimationFrame(loop);
  }

  function init() {
    Sprites.init();
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    Combat.bindUI();

    // title ash for atmosphere before any map loads
    for (let i = 0; i < 50; i++) {
      ash.push({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, vy: 8 + Math.random() * 14, vx: -4 + Math.random() * 8, s: Math.random() < 0.3 ? 2 : 1 });
    }

    document.getElementById('btn-newgame').onclick = () => {
      AudioSys.ensure(); AudioSys.startAmbient(); AudioSys.sfx.click();
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      showClassSelect();
    };
    const contBtn = document.getElementById('btn-continue');
    if (hasSave()) contBtn.classList.remove('hidden');
    contBtn.onclick = () => {
      AudioSys.ensure(); AudioSys.startAmbient(); AudioSys.sfx.click();
      if (!loadGame()) showClassSelect();
    };
    document.getElementById('btn-intro-next').onclick = nextIntro;
    document.getElementById('btn-respawn').onclick = () => { AudioSys.sfx.click(); respawn(); };
    document.getElementById('btn-restart').onclick = resetToNewGame;

    document.getElementById('btn-inventory').onclick = () => openInventory();
    document.getElementById('btn-quest').onclick = () => openQuestLog();
    document.getElementById('btn-mute').onclick = () => {
      AudioSys.ensure();
      const muted = AudioSys.toggleMute();
      toast(muted ? 'SOUND OFF' : 'SOUND ON');
    };
    document.querySelectorAll('.panel-close').forEach(b => b.onclick = () => { AudioSys.sfx.click(); closePanels(); });

    // clicking the dialogue box advances it
    document.getElementById('dialogue-box').onclick = () => { if (state === 'dialogue') advanceDialogue(); };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', init);

  return {
    get player() { return player; },
    get flags() { return flags; },
    updateHUD, gainRewards, addItem, removeItem, hasItem, say, loadMap
  };
})();
