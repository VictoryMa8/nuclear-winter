// ============ NUCLEAR WINTER — game data ============
// The original weapons, classes, items and enemies live on here,
// joined by the Act 2 expansion content.

const DATA = (() => {

  // STARTING WEAPONS — damage, dexterity, and range (originals total 30)
  const weapons = {
    fists:    { name: 'Fists',             dmg: 5,  dex: 5,  rng: 5,  icon: 'icon_fists',    sound: 'melee' },
    rifle:    { name: 'Hunting Rifle',     dmg: 15, dex: 5,  rng: 10, icon: 'icon_rifle',    sound: 'rifle' },
    shotgun:  { name: 'Sawed-off Shotgun', dmg: 15, dex: 10, rng: 5,  icon: 'icon_shotgun',  sound: 'shotgun' },
    smg:      { name: 'Submachine Gun',    dmg: 10, dex: 15, rng: 5,  icon: 'icon_smg',      sound: 'smg' },
    revolver: { name: 'Revolver',          dmg: 10, dex: 10, rng: 10, icon: 'icon_revolver', sound: 'revolver' },
    // enemy weapons
    dagger:   { name: 'Makeshift Dagger',  dmg: 5,  dex: 5,  rng: 5,  icon: 'icon_fists',    sound: 'melee' },
    hoof:     { name: 'Hooves',            dmg: 5,  dex: 10, rng: 5,  icon: 'icon_fists',    sound: 'melee' },
    claws:    { name: 'Claws',             dmg: 10, dex: 10, rng: 5,  icon: 'icon_fists',    sound: 'melee' },
    fangs:    { name: 'Fangs',             dmg: 6,  dex: 12, rng: 3,  icon: 'icon_fists',    sound: 'melee' },
    ak47:     { name: 'AK-47',             dmg: 10, dex: 10, rng: 10, icon: 'icon_rifle',    sound: 'smg' },
    // trader stock — salvage-grade upgrades
    marksman: { name: 'Marksman Rifle',    dmg: 20, dex: 8,  rng: 14, icon: 'icon_rifle',    sound: 'rifle' },
    riot:     { name: 'Riot Shotgun',      dmg: 22, dex: 12, rng: 6,  icon: 'icon_shotgun',  sound: 'shotgun' },
    scavver:  { name: 'Scavver SMG',       dmg: 14, dex: 18, rng: 8,  icon: 'icon_smg',      sound: 'smg' }
  };

  // ITEMS — the original four, plus quest salvage
  const items = {
    medkit:    { name: 'Medkit',    desc: 'Heals the player greatly when injured.', combat: true,  icon: 'icon_medkit' },
    key:       { name: 'Key',       desc: 'Unlocks a door... to somewhere.',        combat: false, icon: 'icon_key' },
    flashbang: { name: 'Flashbang', desc: 'Blinds an enemy so you can escape combat.', combat: true, icon: 'icon_flashbang' },
    lighter:   { name: 'Lighter',   desc: 'Lets you see in dark places or burn cobwebs.', combat: false, icon: 'icon_lighter' },
    parts:     { name: 'Purifier Parts', desc: 'Pre-war machinery. The town water purifier needs these.', combat: false, icon: 'icon_parts' }
  };

  // CHARACTER CLASSES — attributes total 100 points (hp worth 0.25 each)
  const classes = [
    { id: 'survivalist', name: 'Survivalist', maxHealth: 200, atk: 25, def: 20, spd: 5, weapon: 'rifle',
      desc: 'a tough and experienced wilderness expert who can withstand the elements, sporting a powerful hunting rifle' },
    { id: 'raider', name: 'Raider', maxHealth: 160, atk: 25, def: 10, spd: 25, weapon: 'shotgun',
      desc: 'a quick and crafty outlaw with a sawed-off shotgun ...usually aimed at unsuspecting victims' },
    { id: 'alchemist', name: 'Alchemist', maxHealth: 120, atk: 25, def: 25, spd: 20, weapon: 'smg',
      desc: 'an intelligent potion maker who knows much about the world... they also happen to wield a submachine gun' },
    { id: 'wanderer', name: 'Wanderer', maxHealth: 160, atk: 20, def: 20, spd: 20, weapon: 'revolver',
      desc: 'a quiet and introspective person, an expert of post-nuclear society, effective with their revolver' }
  ];

  // ENEMIES — original four plus the wasteland's strays
  const enemyTypes = {
    raider: {
      name: 'Hostile Raider', sprite: 'enemy_raider',
      maxHealth: 150, atk: 15, def: 15, spd: 15, weapon: 'dagger',
      xp: 12, gold: 40
    },
    deer: {
      name: 'Mutated Deer', sprite: 'enemy_deer',
      maxHealth: 200, atk: 10, def: 10, spd: 10, weapon: 'hoof',
      xp: 18, gold: 35
    },
    bear: {
      name: 'Irradiated Bear', sprite: 'enemy_bear',
      maxHealth: 250, atk: 20, def: 20, spd: 5, weapon: 'claws',
      xp: 30, gold: 70
    },
    leader: {
      name: 'Southern Faction Leader', sprite: 'enemy_leader',
      maxHealth: 300, atk: 20, def: 20, spd: 20, weapon: 'ak47',
      xp: 60, gold: 200, boss: true
    },
    hound: {
      name: 'Feral Hound', sprite: 'enemy_hound',
      maxHealth: 80, atk: 12, def: 5, spd: 25, weapon: 'fangs',
      xp: 8, gold: 15
    },
    campRaider: {
      name: 'Faction Soldier', sprite: 'enemy_raider',
      maxHealth: 180, atk: 18, def: 16, spd: 16, weapon: 'ak47',
      xp: 16, gold: 55
    }
  };

  // TRADER STOCK
  const shopStock = [
    { kind: 'item', id: 'medkit',    price: 30 },
    { kind: 'item', id: 'flashbang', price: 25 },
    { kind: 'weapon', id: 'marksman', price: 150 },
    { kind: 'weapon', id: 'riot',     price: 150 },
    { kind: 'weapon', id: 'scavver',  price: 150 }
  ];

  // INTRO — the original explanation screens, one per slide
  const introSlides = [
    'You must be wondering what is happening right now. The year is 2174 — it has been 150 years since the world was plunged into darkness.',
    "The 'Last War' ended in nuclear annihilation. Experts estimated more than 90% of the world population did not survive the fallout. The rich hid in their bunkers, while the average working civilian perished.",
    'Major cities — New York, Los Angeles, London, Tokyo — were wiped off the map. The survivors reside where the nukes never reached, and where the radiation is least potent.',
    'Central Mongolia. Siberia. The Amazon. Polynesia. The Sahara. Northern Canada. Over the decades, tribes formed in these places, and society tried to rebuild itself.',
    'You live in North America. Your ancestors came from what used to be Minnesota. Your tribe holds a small town in old Ontario, not far from what was the U.S. border. Tonight you are out collecting supplies from a nearby factory... and the sun is setting.'
  ];

  // QUEST LOG text per stage
  const questText = [
    'The sun is setting over the wastes. Find your way back to town before dark. The road east felt familiar...',
    'Elder Rook wants the dark woods south of the factory cleared. Something big has been screaming down there at night. He gave you his old lighter — the woods are pitch black.',
    'The town water purifier is failing. Rook says the machine shop in the dead city north of the wastes kept spare parts under lock. Find the key in the city, then open the factory floor.',
    'The purifier hums again. Now the real problem: the Southern Faction is massing in a camp beyond the deep woods. Burn through the webs on the southern path and cut the head off the snake.',
    'The Southern Faction Leader is dead. The town is safe. Winter, for once, feels like just weather.'
  ];

  return { weapons, items, classes, enemyTypes, shopStock, introSlides, questText };
})();
