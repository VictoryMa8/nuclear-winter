// ============ NUCLEAR WINTER — turn-based combat ============
// The original damage formula lives on: weapon dmg/dex/rng + atk vs def,
// with a speed bonus and a random kicker.

const Combat = (() => {
  const overlay = () => document.getElementById('combat-overlay');
  const canvas = () => document.getElementById('combat-canvas');
  const log = (msg) => { document.getElementById('combat-log').textContent = msg; };

  let active = false;
  let enemy = null;
  let opts = null;
  let backdrop = null;
  let raf = null;
  let anim = { shakeUntil: 0, flashUntil: 0, hurtUntil: 0, muzzleUntil: 0, t: 0, dying: false, dieStart: 0 };
  let busy = true;
  let itemMenuOpen = false;

  // ---- original formula (min damage softened from 20 so stats matter) ----
  function calculateDamage(attacker, defender) {
    const w = attacker.currentWeapon;
    const weaponDamage = w.dmg + (w.dex / 2) + (w.rng / 3);
    let baseDamage = (attacker.atk - defender.def) * 2 + weaponDamage;
    if (attacker.spd > defender.spd) baseDamage += attacker.spd / 3;
    const randomDamage = (Math.floor(Math.random() * 10) + 1) + baseDamage;
    return Math.floor(Math.max(8, randomDamage));
  }

  function setButtons(enabled) {
    busy = !enabled;
    ['btn-attack', 'btn-item', 'btn-flee'].forEach(id => {
      document.getElementById(id).disabled = !enabled;
    });
    if (!enabled) closeItemMenu();
  }

  function updateEnemyBar() {
    document.getElementById('combat-enemy-name').textContent = enemy.name;
    document.getElementById('enemy-hp-fill').style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
    document.getElementById('enemy-hp-num').textContent = `${enemy.health}/${enemy.maxHealth}`;
  }

  // ---------------- scene rendering ----------------
  function render(ts) {
    if (!active) return;
    anim.t = ts;
    const cv = canvas();
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(backdrop, 0, 0);

    const spr = Sprites.get(enemy.sprite);
    const scale = enemy.sprite === 'enemy_bear' ? 7 : 8;
    const w = spr.width * scale, h = spr.height * scale;
    const groundY = Math.floor(cv.height * 0.85);
    let x = (cv.width - w) / 2;
    let y = groundY - h + Math.sin(ts / 400) * 3; // idle breathing bob

    if (ts < anim.shakeUntil) x += Math.sin(ts / 18) * 6;

    if (anim.dying) {
      const p = Math.min(1, (ts - anim.dieStart) / 700);
      ctx.globalAlpha = 1 - p;
      y += p * 20;
    }
    ctx.drawImage(spr, Math.floor(x), Math.floor(y), w, h);
    ctx.globalAlpha = 1;

    // white hit-flash on the enemy
    if (ts < anim.flashUntil) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // muzzle flash from the player's side
    if (ts < anim.muzzleUntil) {
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(30, cv.height - 40, 26, 10);
      ctx.fillRect(40, cv.height - 48, 10, 26);
      ctx.fillStyle = 'rgba(255,210,74,0.25)';
      ctx.fillRect(0, 0, cv.width, cv.height);
    }

    // red wash when the player takes a hit
    if (ts < anim.hurtUntil) {
      ctx.fillStyle = 'rgba(158,43,37,0.35)';
      ctx.fillRect(0, 0, cv.width, cv.height);
    }

    raf = requestAnimationFrame(render);
  }

  // ---------------- turn logic ----------------
  function playerAttack() {
    if (busy || !active) return;
    setButtons(false);
    const p = Game.player;
    AudioSys.sfx.fire(p.currentWeapon.sound);
    anim.muzzleUntil = anim.t + 120;

    setTimeout(() => {
      const dmg = calculateDamage(p, enemy);
      enemy.health = Math.max(0, enemy.health - dmg);
      anim.shakeUntil = anim.t + 300;
      anim.flashUntil = anim.t + 140;
      AudioSys.sfx.enemyHit();
      updateEnemyBar();
      log(`You dealt ${dmg} damage to the ${enemy.name}.`);
      setTimeout(() => {
        if (enemy.health <= 0) winSequence();
        else enemyTurn();
      }, 900);
    }, 200);
  }

  function enemyTurn() {
    log(`The ${enemy.name} is coming at you...`);
    setTimeout(() => {
      const p = Game.player;
      const dmg = calculateDamage(enemy, p);
      p.health = Math.max(0, p.health - dmg);
      AudioSys.sfx.fire(enemy.currentWeapon.sound);
      AudioSys.sfx.hurt();
      anim.hurtUntil = anim.t + 260;
      Game.updateHUD();
      log(`${enemy.name} dealt ${dmg} damage with their ${enemy.currentWeapon.name}!`);
      setTimeout(() => {
        if (p.health <= 0) loseSequence();
        else setButtons(true);
      }, 900);
    }, 800);
  }

  function winSequence() {
    anim.dying = true;
    anim.dieStart = anim.t;
    AudioSys.sfx.death();
    const type = DATA.enemyTypes[enemy.typeId];
    log(`You have defeated the ${enemy.name}!`);
    setTimeout(() => {
      AudioSys.sfx.victory();
      const msgs = Game.gainRewards(type.xp, type.gold);
      log(`+${type.xp} XP, +${type.gold} gold.` + (msgs ? ' ' + msgs : ''));
      setTimeout(() => close(true), 1800);
    }, 900);
  }

  function loseSequence() {
    log('Everything goes dark...');
    AudioSys.sfx.death();
    setTimeout(() => close(false), 1400);
  }

  function attemptFlee() {
    if (busy || !active) return;
    if (DATA.enemyTypes[enemy.typeId].boss) {
      log('There is no running from this.');
      AudioSys.sfx.denied();
      return;
    }
    setButtons(false);
    const p = Game.player;
    const chance = Math.max(0.15, Math.min(0.9, 0.45 + (p.spd - enemy.spd) * 0.02));
    setTimeout(() => {
      if (Math.random() < chance) {
        log('You slip away into the wastes.');
        AudioSys.sfx.step();
        setTimeout(() => close(null), 800);
      } else {
        log(`The ${enemy.name} cuts off your escape!`);
        AudioSys.sfx.denied();
        setTimeout(enemyTurn, 700);
      }
    }, 500);
  }

  // ---------------- combat items ----------------
  function openItemMenu() {
    if (busy || !active) return;
    const box = document.getElementById('combat-items');
    if (itemMenuOpen) { closeItemMenu(); return; }
    const usable = Game.player.inventory.filter(id => DATA.items[id].combat);
    box.innerHTML = '';
    if (!usable.length) {
      log('Nothing in your pack helps here.');
      AudioSys.sfx.denied();
      return;
    }
    const counted = {};
    usable.forEach(id => counted[id] = (counted[id] || 0) + 1);
    Object.entries(counted).forEach(([id, n]) => {
      const btn = document.createElement('button');
      btn.textContent = `${DATA.items[id].name} x${n}`;
      btn.onclick = () => useItem(id);
      box.appendChild(btn);
    });
    box.classList.remove('hidden');
    itemMenuOpen = true;
  }
  function closeItemMenu() {
    document.getElementById('combat-items').classList.add('hidden');
    itemMenuOpen = false;
  }

  function useItem(id) {
    if (busy || !active) return;
    setButtons(false);
    const p = Game.player;
    Game.removeItem(id);
    if (id === 'medkit') {
      const heal = Math.min(75, p.maxHealth - p.health);
      p.health += heal;
      AudioSys.sfx.heal();
      Game.updateHUD();
      log(`The medkit knits you back together. +${heal} HP.`);
      setTimeout(enemyTurn, 900);
    } else if (id === 'flashbang') {
      AudioSys.sfx.flash();
      anim.flashUntil = anim.t + 500;
      log(`The flashbang pops — the ${enemy.name} reels, blind!`);
      setTimeout(() => {
        log('You bolt while it claws at its eyes.');
        setTimeout(() => close(null), 800);
      }, 900);
    }
  }

  // ---------------- lifecycle ----------------
  // outcome: true = won, false = died, null = fled
  function start(typeId, options) {
    const type = DATA.enemyTypes[typeId];
    opts = options || {};
    enemy = {
      typeId,
      name: type.name,
      sprite: type.sprite,
      health: type.maxHealth,
      maxHealth: type.maxHealth,
      atk: type.atk, def: type.def, spd: type.spd,
      currentWeapon: DATA.weapons[type.weapon]
    };
    active = true;
    busy = true;
    anim = { shakeUntil: 0, flashUntil: 0, hurtUntil: 0, muzzleUntil: 0, t: 0, dying: false, dieStart: 0 };

    const cv = canvas();
    backdrop = Sprites.cnv(cv.width, cv.height);
    Sprites.drawBackdrop(backdrop.getContext('2d'), cv.width, cv.height, opts.env || 'wastes');

    updateEnemyBar();
    const article = /^[aeiou]/i.test(enemy.name) ? 'An' : 'A';
    log(type.boss
      ? `${enemy.name} turns to face you. "So the north town sent a ${Game.player.className}."`
      : `${article} ${enemy.name} blocks your path! You ready your ${Game.player.currentWeapon.name}.`);
    overlay().classList.remove('hidden');
    AudioSys.sfx.growl();
    AudioSys.startCombatPulse();
    setButtons(false);
    setTimeout(() => setButtons(true), 1100);
    raf = requestAnimationFrame(render);
  }

  function close(outcome) {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    AudioSys.stopCombatPulse();
    overlay().classList.add('hidden');
    closeItemMenu();
    const cb = outcome === false ? opts.onLose : opts.onEnd;
    if (cb) cb(outcome);
  }

  function bindUI() {
    document.getElementById('btn-attack').onclick = playerAttack;
    document.getElementById('btn-item').onclick = openItemMenu;
    document.getElementById('btn-flee').onclick = attemptFlee;
  }

  function handleKey(key) {
    if (key === '1') playerAttack();
    else if (key === '2') openItemMenu();
    else if (key === '3') attemptFlee();
  }

  return { start, bindUI, handleKey, calculateDamage, get active() { return active; } };
})();
