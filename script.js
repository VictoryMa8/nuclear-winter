// STARTING WEAPONS
// damage, dexterity, and range (must total to 30)
const weapons = [
  { name: "Fists", dmg: 5, dex: 5, rng: 5 }, // 0
  { name: "Hunting Rifle", dmg: 15, dex: 5, rng: 10 }, // 1
  { name: "Sawed-off Shotgun", dmg: 15, dex: 10, rng: 5 }, // etc...
  { name: "Submachine Gun", dmg: 10, dex: 15, rng: 5 },
  { name: "Revolver", dmg: 10, dex: 10, rng: 10 }
]

// ITEMS
// name, description, and combat (whether the item can be used in combat or not)
const items = [
  { name: "Medkit", desc: "Heals the player greatly when injured.", combat: true},
  { name: "Key", desc: "Unlocks a door... to somewhere.", combat: false},
  { name: "Flashbang", desc: "Allows the player to incapacitate the enemy and quickly escape combat.", combat: true},
  { name: "Lighter", desc: "Allows the player to see in dark places or burn cobwebs.", combat: false}
]

/* 
CHARACTER CLASSES
attributes for a class should add up to 100 'points'
attack, defense, and speed are worth 1 point each
health is worth 0.25 points
*/
const classes = [
  { name: "None", maxHealth: 100, atk: 10, def: 10, spd: 10, weapon: weapons[0],
    desc: ""
   },
  { name: "Survivalist", maxHealth: 200, atk: 25, def: 20, spd: 5, weapon: weapons[1], 
    desc: "a tough and experienced wilderness expert who can withstand the elements, they sport a powerful hunting rifle"
   },
  { name: "Raider", maxHealth: 160, atk: 25, def: 10, spd: 25, weapon: weapons[2],
    desc: "a quick and crafty outlaw with a sawed-off shotgun ...that is usually aimed at unexpecting victims"
   },
  { name: "Alchemist", maxHealth: 120, atk: 25, def: 25, spd: 20, weapon: weapons[3],
    desc: "an intelligent potion maker who knows much about the world... they also happen to wield a submachine gun"
   },
  { name: "Wanderer", maxHealth: 160, atk: 20, def: 20, spd: 20, weapon: weapons[4],
    desc: "a quiet and introspective person, an expert of post-nuclear society, and effective with their revolver"
   }
]

// PLAYER
const player = {
  // xp, level, and gold
  xp: 0,
  level: 0,
  xpToNextLevel: 10,
  gold: 0,
  // statistical attributes
  health: 100,
  maxHealth: 100,
  atk: 10,
  def: 10,
  spd: 10,
  // inventory and current weapon
  inventory: [],
  currentWeapon: weapons[0],
  class: "None",
  classDesc: ""
}

// ENEMIES
const enemies = [
  {
    name: "Hostile Raider",
    health: 150,
    maxHealth: 150,
    atk: 15,
    def: 15,
    spd: 15,
    currentWeapon: { name: "Makeshift Dagger", dmg: 5, dex: 5, rng: 5 }
  },
  {
    name: "Mutated Deer",
    health: 200,
    maxHealth: 200,
    atk: 10,
    def: 10,
    spd: 10,
    currentWeapon: { name: "Hoof", dmg: 5, dex: 10, rng: 5 }
  },
  {
    name: "Irradiated Bear",
    health: 250,
    maxHealth: 250,
    atk: 20,
    def: 20,
    spd: 5,
    currentWeapon: { name: "Claws", dmg: 10, dex: 10, rng: 5 }
  },
  {
    name: "Southern Faction Leader",
    health: 300,
    maxHealth: 300,
    atk: 20,
    def: 20,
    spd: 20,
    currentWeapon: { name: "AK-47", dmg: 10, dex: 10, rng: 10 }
  }
];

// SET USER CLASS
function setPlayerClass(classIndex) {
  const selectedClass = classes[classIndex];
  player.health = selectedClass.maxHealth;
  player.maxHealth = selectedClass.maxHealth;
  player.atk = selectedClass.atk;
  player.def = selectedClass.def;
  player.spd = selectedClass.spd;
  player.currentWeapon = selectedClass.weapon;
  player.class = selectedClass.name;
  player.classDesc = selectedClass.desc;
  updatePlayerStatsDisplay();
}

// HAS USER BEEN TO A CERTAIN SCREEN ALREADY?
let beenTo11 = false;
let beenTo12 = false;
let beenTo15 = false;
// SPECIAL CONDITIONAL FOR SCREEN 16
let message16 = "After walking that long road you come across your town.";

// GAME SCREENS
const screens = [
  { 
    name: "0. Start game",
    text1: "Welcome to the nuclear wasteland.", 
    text2: "Press start to begin.",
    buttonTexts: ["Start", "Start", "Start", "Start", "Start"],
    nextScreens: [1, 1, 1, 1, 1]
  },
  { 
    name: "1. Select class",
    text1: "Choose your class before you go into the wasteland: ",
    text2: "You can choose between a Survivalist, Raider, Alchemist, or Wanderer.",
    buttonTexts: [classes[1].name, classes[2].name, classes[3].name, classes[4].name, "Back"],
    nextScreens: [2, 2, 2, 2, 0],
    classChoices: [1, 2, 3, 4, undefined]
  },
  {
    name: "2. Class selected",
    text1: () => `You are the ${player.class}, who is ${player.classDesc}.`,
    text2: () => "Press continue to start the game or go back to change your selection.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Back"],
    nextScreens: [3, 3, 3, 3, 1]
  },
  { 
    name: "3. Game explanation - 1",
    text1: "You must be wondering what is happening right now.", 
    text2: "The year is 2174, it has been 150 years since the world was plunged into darkness.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Continue"],
    nextScreens: [4, 4, 4, 4, 4]
  },
  { 
    name: "4. Game explanation - 2",
    text1: "The 'Last War' ended in nuclear annihilation. It is unclear how many people died, experts estimate more than 90% of the world population did not survive the fallout.", 
    text2: "Many of the rich and wealthy hid in their bunkers, while the average working civilian perished.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Back"],
    nextScreens: [5, 5, 5, 5, 3]
  },
  { 
    name: "5. Game explanation - 3",
    text1: "Due to the conflict of the 'Last War', major cities such as New York, Los Angeles, London, and Tokyo, were completely wiped off the map.", 
    text2: "The surviving population of Earth reside in areas where the nukes never reached, and where the nuclear radiation is least potent.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Back"],
    nextScreens: [6, 6, 6, 6, 4]
  },
  { 
    name: "6. Game explanation - 4",
    text1: "It is believed that places such as central Mongolia, Siberia, the Amazon Rainforest, Polynesia, the Sahara Desert, and Northern Canada are the safest for humans to inhabit.", 
    text2: "Over the decades after the war, tribes started to form and society tried to rebuild itself in these areas.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Back"],
    nextScreens: [7, 7, 7, 7, 5]
  },
  { 
    name: "7. Game explanation - 5",
    text1: () => `You are a ${player.class} who lives in North America. Your ancestors lived in what used to be Minnesota of the United States.`,
    text2: "You are apart of a tribe that lives in what used to be a small town in Ontario, not too far from what was the U.S. border.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Back"],
    nextScreens: [8, 8, 8, 8, 6]
  },
  { 
    name: "8. Game explanation - 6",
    text1: "Not many people leave the town, because it is dangerous out in the wilderness. You are currently out collecting supplies from a nearby factory",
    text2: "The sun is setting. Try to find a way back before it gets too dark.",
    buttonTexts: ["Walk North", "Walk East", "Walk South", "Walk West", "---"],
    nextScreens: [9, 10, 11, 12, 8]
  },
  { 
    name: "9. Wilderness - 1",
    text1: "You walk north, there seems to be a figure in the distance.",
    text2: "Keep walking in this direction?",
    buttonTexts: ["Yes", "Yes", "Yes", "Yes", "Turn Back"],
    nextScreens: [13, 13, 13, 13, 8]
  },
  { 
    name: "10. Wilderness - 2",
    text1: "You walk east towards a road.. you vaguely remember this area.",
    text2: "Keep going this direction?",
    buttonTexts: ["Yes", "Yes", "Yes", "Yes", "Turn Back"],
    nextScreens: [14, 14, 14, 14, 8]
  },
  { 
    name: "11. Wilderness - 3",
    text1: "You walk south towards some trees ...hmm this doesn't look right.",
    text2: "You suspect that turning back is the safest option.",
    buttonTexts: ["Turn Back", "Turn Back", "Turn Back", "Turn Back", "Turn Back"],
    nextScreens: [8, 8, 8, 8, 8]
  },
  { 
    name: "12. Wilderness - 4",
    text1: "You walk west and find a random shack",
    text2: "You found a Medkit! You decide to put it in your backpack and go back.",
    buttonTexts: ["Go Back", "Go Back", "Go Back", "Go Back", "Go Back"],
    nextScreens: [8, 8, 8, 8, 8]
  },
  { 
    name: "13. Encounter - 1",
    text1: "The figure turns out to be an unfriendly raider!",
    text2: "You decide that you must fight in order to survive.",
    buttonTexts: ["Enter Combat", "Enter Combat", "Enter Combat", "Enter Combat", "Enter Combat"],
    nextScreens: [15, 15, 15, 15, 15]
  },
  { 
    name: "14. Lonely Road",
    text1: "The road seems to go on for a while...",
    text2: "You believe that you are going the right direction though, so you keep going.",
    buttonTexts: ["Continue Forward", "Continue Forward", "Continue Forward", "Continue Forward", "Continue Forward"],
    nextScreens: [16, 16, 16, 16, 16]
  },
  { 
    name: "15. Encounter - 2",
    text1: () => `You ready your ${player.currentWeapon.name} for a fight!`,
    text2: () => `Combat commencing soon...`,
    buttonTexts: ["...", "...", "...", "...", "..."],
    nextScreens: [15, 15, 15, 15, 15]
  },
  { 
    name: "16. Convergence of 'Encounter' and 'Lonely Road'",
    text1: () => `${message16}`,
    text2: () => `You decide to keep moving forward.`,
    buttonTexts: ["Keep Going", "Keep Going", "Keep Going", "Keep Going", "Keep Going"],
    nextScreens: [17, 17, 17, 17, 17]
  },
  { 
    name: "17. Back In Town",
    text1: "The guards see you from afar and start opening the gate to town.",
    text2: "Relief sets in as you walk towards them.",
    buttonTexts: ["Onward", "Onward", "Onward", "Onward", "Onward"],
    nextScreens: [18, 18, 18, 18, 18]
  },
  { 
    name: "18. Welcome Back",
    text1: "'It's nice to see you back and alive!' said one of the guards.",
    text2: "You begin to walk toward the town square.",
    buttonTexts: ["Continue", "Continue", "Continue", "Continue", "Continue"],
    nextScreens: [19, 19, 19, 19, 19]
  },
];

// COMBAT FUNCTIONALITY
let inCombat = false;

// PUSH USER INTO 'IN COMBAT' STATUS
function startCombatWith(enemy) {
  inCombat = true;
  $("#text-1").text(`Enemy: ${enemy.name} | Health: ${enemy.health}/${enemy.maxHealth}`);
  $("#text-2").text("Combat has begun!");
  // SPECIAL SCREEN FOR COMBAT
  enablePlayerAttack(enemy);
}

// ENABLE THE USER TO INTERACT WITH COMBAT BUTTONS
function enablePlayerAttack(enemy) {
  $("#text-1").text(`Enemy: ${enemy.name} | Health: ${enemy.health}/${enemy.maxHealth}`);
  $("#text-2").text(`Attack with your ${player.currentWeapon.name}!`);
  for (let i = 0; i < 5; i++) {
    const currButton = $(`#btn-${i+1}`);
    currButton.off("click");
    currButton.text("Attack");
    currButton.on("click", () => playerAttack(enemy));
  }
}

// CALCULATE DAMAGE
function calculateDamage(attacker, defender) {
  // TOTAL WEAPON DAMAGE:  WEAPON DAMAGE + WEAPON DEXTERITY + WEAPON RANGE
  let weaponDamage = attacker.currentWeapon.dmg + (attacker.currentWeapon.dex / 2) + (attacker.currentWeapon.rng / 3);
  // BASE ATTACKER DAMAGE: ATTACKER ATTACK - DEFENDER DEFENSE + TOTAL WEAPON DAMAGE
  let baseDamage = (attacker.atk - defender.def) * 2 + weaponDamage;
  // BASE ATTACKER DAMAGE IS INCREASED IF ATTACKER IS FASTER
  if (attacker.spd > defender.spd) {
    baseDamage += (attacker.spd / 3)
  }
  // RANDOMIZATION OF RETURNED DAMAGE
  let randomDamage = (Math.floor(Math.random() * 10) + 1) + baseDamage;
  return Math.floor(Math.max(20, randomDamage));
}

// USER ATTACKS (IN COMBAT SCREEN)
function playerAttack(enemy) {
  // CALL calculateDamage
  let damage = calculateDamage(player, enemy);
  enemy.health = Math.max(0, enemy.health - damage);
  // UPDATE COMBAT TEXT
  $("#text-1").text(`Enemy: ${enemy.name} | Health: ${enemy.health}/${enemy.maxHealth}`);
  $("#text-2").text(`You dealt ${damage} damage to ${enemy.name}...`);
  updateScreenContent();
  // UPDATE BUTTONS FOR COMBAT
  for (let i = 0; i < 5; i++) {
    const currButton = $(`#btn-${i+1}`);
    currButton.off("click");
    currButton.text("...");
  }
  // AFTER TWO SECONDS, ENEMY ATTACKS
  setTimeout(() => {
    if (enemy.health <= 0) {
      endCombat(enemy);
    } else {
      enemyAttack(enemy);
    }
  }, 2000)
}

// ENEMY ATTACKS (IN COMBAT SCREEN)
function enemyAttack(enemy) {
  // AFTER USER ATTACKS, ENEMY ATTACKS
  $("#text-2").text(`${enemy.name} is in the process of attacking you...`);
  // AFTER TWO SECONDS, SHOW RESULT OF ENEMY DAMAGE
  setTimeout(() => {
    let damage = calculateDamage(enemy, player);
    player.health = Math.max(0, player.health - damage);
    // UPDATE COMBAT TEXT
    $("#text-1").text(`Enemy: ${enemy.name} | Health: ${enemy.health}/${enemy.maxHealth}`);
    $("#text-2").text(`${enemy.name} dealt ${damage} damage to you with a ${enemy.currentWeapon.name}!`);
    updatePlayerStatsDisplay();
    // AFTER TWO SECONDS, PLAYER ATTACKS
    setTimeout(() => {
      if (player.health <= 0) {
        endCombat(enemy);
      } else {
        enablePlayerAttack(enemy);
      }
    }, 2000)
  }, 2000)
}

// END COMBAT AFTER USER OR ENEMY HEALTH EQUAL ZERO
function endCombat(enemy) {
  inCombat = false;
  if (player.health <= 0) {
    $("#text-2").text("You have been defeated... returning to main menu");
    setTimeout(() => {
      changeScreen(0);
    }, 3000);
  } else {
    $("#text-2").text(`You have defeated ${enemy.name}!`);
    setTimeout(() => {
      currentScreen++;
      changeScreen(currentScreen);
    }, 3000);
  }
}

// GAME STARTS ON SCREEN ZERO
let currentScreen = 0;
updateScreenContent();

// CHANGE SCREEN
function changeScreen(screenNumber, classIndex) {
  if (screenNumber >= 0 && screenNumber < screens.length) {
    currentScreen = screenNumber;

    // SET PLAYER CLASS
    if (classIndex !== undefined) {
      setPlayerClass(classIndex);
      console.log(`Player class set to ${player.class}`)
    }

    if (!beenTo11 && screenNumber === 11) {
      screens[8].buttonTexts[2] = "---";
      screens[8].nextScreens[2] = 8;
      beenTo11 = true;
    }

    if (!beenTo12 && screenNumber === 12) {
      addItemToInv(items[0]);
      screens[8].buttonTexts[3] = "---";
      screens[8].nextScreens[3] = 8;
      beenTo12 = true;
    }

    if (screenNumber === 15 && !inCombat) {
      message16 = "After that rough battle you see your town in the distance.";
      setTimeout(() => {
        startCombatWith(enemies[0]);
      }, 2000);
    }

    updatePlayerStatsDisplay();
    updateScreenContent();
  } else {
    console.log("Invalid screen number");
  }
}

// ADD ITEM TO USER INVENTORY
function addItemToInv(item) {
  player.inventory.push(item);
}

function updateScreenContent() {
  
  // CHANGE #text-1, #text-2, AND #currscre-text IF USER IS NOT IN COMBAT
  if (!inCombat) {
  $("#text-1").text(typeof screens[currentScreen].text1 === 'function' 
    ? screens[currentScreen].text1() 
    : screens[currentScreen].text1);
  
  $("#text-2").text(typeof screens[currentScreen].text2 === 'function' 
    ? screens[currentScreen].text2() 
    : screens[currentScreen].text2);

  $("#currscre-text").text(currentScreen);
    // CHANGE BUTTON FUNCTIONS AND TEXT WITH EACH SCREEN
    for (let i = 0; i < 5; i++) {
      const currButton = $(`#btn-${i+1}`);
      currButton.off("click");
      currButton.text(screens[currentScreen].buttonTexts[i] || "Error");
      currButton.on("click", () => changeScreen(
        screens[currentScreen].nextScreens[i],
        screens[currentScreen].classChoices ? screens[currentScreen].classChoices[i] : undefined
      ));
    }
  }
}

// UPDATE PLAYER STATISTICAL ATTRIBUTES
function updatePlayerStatsDisplay() {
  // UPDATE XP, XP TO NEXT LEVEL, AND GOLD
  $("#xp-text").text(player.xp);
  $("#xptnl-text").text(player.xpToNextLevel);
  $("#gold-text").text(player.gold);
  // UPDATE HEALTH AND MAXIMUM HEALTH
  $("#hp-text").text(player.health);
  $("#maxhp-text").text(player.maxHealth);
  // UPDATE ATTACK, DEFENSE, AND SPEED
  $("#atk-text").text(player.atk);
  $("#def-text").text(player.def);
  $("#spd-text").text(player.spd);
  // UPDATE INVENTORY AND USER CURRENT WEAPON
  $("#inv-text").text("");
  for (let i = 0; i < player.inventory.length; i++) {
    if (i !== player.inventory.length - 1) {
      $("#inv-text").append(`${player.inventory[i].name}, `);
    } else {
      $("#inv-text").append(player.inventory[i].name);
    }
  }
  $("#currweap-text").text(player.currentWeapon.name);
}
