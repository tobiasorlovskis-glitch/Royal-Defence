/**
 * SIEGE OF ELDORIA - GAME DATA DEFINITIONS
 * Tower blueprints, upgrade paths, enemy stats, map topologies, and tech tree perks.
 */

const TOWER_DATA = {
    archer: {
        id: 'archer',
        name: 'Royal Watchtower',
        role: 'Physical Single Target',
        cost: 100,
        range: 150,
        damage: 28,
        rate: 0.75, // shots per second = 1.33s cooldown
        bulletSpeed: 9,
        type: 'physical',
        color: '#48cae4',
        icon: '🏹',
        lore: 'Sharpshooters trained in the High Forest, capable of picking off priority targets with piercing bodkin arrows.',
        upgrades: [
            { level: 2, cost: 90, damage: 45, range: 170, rate: 0.9, name: 'Reinforced Tower' },
            { level: 3, cost: 160, damage: 75, range: 195, rate: 1.1, critChance: 0.2, name: 'Marksman Garrison' }
        ],
        branches: {
            sniper: {
                name: 'Longbow Sharpshooter',
                cost: 260,
                damage: 190,
                range: 250,
                rate: 0.65,
                critChance: 0.35,
                critMulti: 2.5,
                special: 'Extreme range and lethal critical headshots.',
                color: '#0077b6'
            },
            elven: {
                name: 'Elven Windrunner',
                cost: 240,
                damage: 55,
                range: 180,
                rate: 2.2, // very fast
                multishot: 3,
                special: 'Fires bursts of 3 enchanted arrows simultaneously.',
                color: '#2ec4b6'
            }
        }
    },
    mage: {
        id: 'mage',
        name: 'Arcane Spire',
        role: 'Armor Piercing Magic',
        cost: 140,
        range: 135,
        damage: 55,
        rate: 0.8,
        bulletSpeed: 7,
        type: 'magic',
        color: '#9d4edd',
        icon: '🔮',
        lore: 'Siphons pure raw mana from the ley lines. Its mystic energy disintegrates armor with ease.',
        upgrades: [
            { level: 2, cost: 120, damage: 85, range: 150, rate: 0.95, name: 'Leyline Channeler' },
            { level: 3, cost: 190, damage: 135, range: 170, rate: 1.1, name: 'Archmage Sanctum' }
        ],
        branches: {
            disintegrator: {
                name: 'Aether Death Ray',
                cost: 310,
                damage: 280,
                range: 175,
                rate: 1.25,
                penetration: true,
                special: 'Fires a concentrated beam that ignores 100% of enemy armor and magic resistance.',
                color: '#d90429'
            },
            chain: {
                name: 'Stormcaller Spire',
                cost: 290,
                damage: 120,
                range: 165,
                rate: 0.9,
                chainTargets: 4,
                special: 'Unleashes chain lightning jumping between up to 4 nearby enemies.',
                color: '#7209b7'
            }
        }
    },
    catapult: {
        id: 'catapult',
        name: 'Brimstone Bombard',
        role: 'Heavy Artillery & AoE',
        cost: 175,
        range: 175,
        damage: 90,
        splash: 65,
        rate: 0.45, // slow firing
        bulletSpeed: 4.5,
        type: 'physical_aoe',
        color: '#e76f51',
        icon: '💣',
        lore: 'Iron-forged siege artillery firing flaming brimstone payloads to wipe out concentrated enemy swarms.',
        upgrades: [
            { level: 2, cost: 140, damage: 140, range: 190, splash: 75, rate: 0.5, name: 'Heavy Siege Mortar' },
            { level: 3, cost: 220, damage: 210, range: 210, splash: 90, rate: 0.55, burnGround: true, name: 'Dragonfire Mortar' }
        ],
        branches: {
            napalm: {
                name: 'Infernal Calamity',
                cost: 330,
                damage: 320,
                range: 225,
                splash: 105,
                rate: 0.55,
                napalmDuration: 4.0,
                special: 'Leaves a pool of blazing magma on the road that incinerates enemies over time.',
                color: '#f77f00'
            },
            cluster: {
                name: 'Cluster Shrapnel Cannon',
                cost: 310,
                damage: 240,
                range: 220,
                splash: 80,
                rate: 0.65,
                clusterCount: 4,
                special: 'Shell splits into 4 sub-bombs covering massive battlefield radius.',
                color: '#d62828'
            }
        }
    },
    frost: {
        id: 'frost',
        name: 'Glacial Obelisk',
        role: 'Crowd Control & Slow',
        cost: 120,
        range: 130,
        damage: 25,
        slowPercent: 0.4,
        slowDuration: 2.5,
        rate: 1.1,
        bulletSpeed: 6.5,
        type: 'frost',
        color: '#a0c4ff',
        icon: '❄️',
        lore: 'Carved from primordial iceberg crystals. Freezes enemy momentum to buy vital time for your defenses.',
        upgrades: [
            { level: 2, cost: 95, damage: 40, range: 145, slowPercent: 0.5, rate: 1.2, name: 'Permafrost Pillar' },
            { level: 3, cost: 160, damage: 65, range: 165, slowPercent: 0.6, rate: 1.3, name: 'Cryo Citadel' }
        ],
        branches: {
            blizzard: {
                name: 'Vortex of Nilfheim',
                cost: 275,
                damage: 90,
                range: 180,
                rate: 1.3,
                freezeAura: true,
                special: 'Periodically triggers an instant flash freeze stopping all enemies in range for 2 seconds.',
                color: '#00b4d8'
            },
            icicle: {
                name: 'Glacial Impaler',
                cost: 255,
                damage: 160,
                range: 165,
                rate: 1.4,
                slowPercent: 0.7,
                bonusToFrozen: 1.5,
                special: 'Launches piercing icicles that shatter slowed enemies for 50% bonus damage.',
                color: '#48cae4'
            }
        }
    },
    paladin: {
        id: 'paladin',
        name: 'Paladin Sanctum',
        role: 'Road Blocker & Buff Aura',
        cost: 190,
        range: 125,
        damage: 30, // Melee attack
        soldierCount: 2,
        soldierHP: 350,
        soldierArmor: 25,
        soldierRespawn: 10,
        auraBonus: 0.15, // +15% dmg to adjacent towers
        type: 'melee_block',
        color: '#ffd166',
        icon: '🛡️',
        lore: 'Houses stalwart holy knights who advance onto the road to directly engage and block invaders with tower shields.',
        upgrades: [
            { level: 2, cost: 130, damage: 50, soldierHP: 550, soldierArmor: 35, auraBonus: 0.20, name: 'Templar Garrison' },
            { level: 3, cost: 210, damage: 80, soldierHP: 850, soldierArmor: 45, auraBonus: 0.25, name: 'Grand Sanctuary' }
        ],
        branches: {
            crusader: {
                name: 'Aegis of the Sun',
                cost: 300,
                damage: 120,
                soldierHP: 1400,
                soldierArmor: 60,
                auraBonus: 0.30,
                holyHealing: true,
                special: 'Holy warriors with unbreakable armor who heal themselves and nearby allies.',
                color: '#ffb703'
            },
            inquisitor: {
                name: 'Avenging Brotherhood',
                cost: 290,
                damage: 180,
                soldierCount: 3,
                soldierHP: 900,
                soldierArmor: 40,
                auraBonus: 0.25,
                smiteAoe: true,
                special: 'Deploys 3 swift knights that deal holy smite splash damage with every strike.',
                color: '#fb8500'
            }
        }
    }
};

const ENEMY_DATA = {
    goblin: {
        name: 'Goblin Pillager',
        hp: 85,
        speed: 1.7,
        gold: 7,
        score: 10,
        damageToGate: 1,
        armor: 0,
        magicResist: 0,
        radius: 12,
        color: '#55a630',
        icon: '👺',
        desc: 'Fast and swarming. Fragile against physical and splash damage.'
    },
    goblin_runner: {
        name: 'Goblin Scout',
        hp: 60,
        speed: 2.3,
        gold: 6,
        score: 12,
        damageToGate: 1,
        armor: 0,
        magicResist: 0,
        radius: 10,
        color: '#70e000',
        icon: '🦗',
        desc: 'Extremely swift runner. Prioritize with Watchtowers and Glacial slows.'
    },
    orc_vanguard: {
        name: 'Orcish Vanguard',
        hp: 240,
        speed: 1.1,
        gold: 15,
        score: 25,
        damageToGate: 2,
        armor: 0.35, // 35% physical reduction
        magicResist: 0,
        radius: 16,
        color: '#b08968',
        icon: '👹',
        desc: 'Heavily armored frontliner. Resistant to arrows, weak to Arcane magic.'
    },
    orc_berserker: {
        name: 'Orc Berserker',
        hp: 340,
        speed: 1.35,
        gold: 22,
        score: 35,
        damageToGate: 2,
        armor: 0.15,
        magicResist: 0.1,
        radius: 17,
        color: '#9d0208',
        icon: '🪓',
        desc: 'High health and vicious fury that accelerates when taking damage.'
    },
    shadow_wraith: {
        name: 'Dusk Wraith',
        hp: 170,
        speed: 1.5,
        gold: 18,
        score: 30,
        damageToGate: 2,
        armor: 0,
        magicResist: 0.6, // 60% magic reduction
        radius: 14,
        color: '#7b2cbf',
        icon: '👻',
        desc: 'Ethereal spirit. High magic resistance, vulnerable to arrows and siege artillery.'
    },
    troll: {
        name: 'Mountain Troll',
        hp: 750,
        speed: 0.75,
        gold: 45,
        score: 60,
        damageToGate: 4,
        armor: 0.25,
        magicResist: 0.15,
        regen: 18, // HP regenerated per second
        radius: 20,
        color: '#2b9348',
        icon: '🧌',
        desc: 'Towering beast that rapidly regenerates wounds. Focus fire required.'
    },
    siege_golem: {
        name: 'Iron Siege Golem',
        hp: 1400,
        speed: 0.55,
        gold: 80,
        score: 100,
        damageToGate: 6,
        armor: 0.50,
        magicResist: 0.30,
        radius: 24,
        color: '#495057',
        icon: '🗿',
        desc: 'Massive animated siege engine. Devastates castle gates if not halted.'
    },
    boss_warlord: {
        name: 'Gorgar the Desolator',
        isBoss: true,
        hp: 4200,
        speed: 0.7,
        gold: 300,
        score: 500,
        damageToGate: 10,
        armor: 0.35,
        magicResist: 0.25,
        radius: 28,
        color: '#d00000',
        icon: '💀',
        portrait: 'assets/orc_warlord.jpg',
        desc: 'Warlord of the Black Iron Horde. Roars to inspire and hasten his legion!'
    },
    boss_dragon: {
        name: 'Pyrax the Crimson Wyrm',
        isBoss: true,
        isFlying: true,
        hp: 7500,
        speed: 0.85,
        gold: 500,
        score: 1000,
        damageToGate: 15,
        armor: 0.3,
        magicResist: 0.4,
        radius: 32,
        color: '#dc2f02',
        icon: '🐉',
        desc: 'Ancient flame dragon soaring above ground obstacles, unleashing cataclysmic dragonfire.'
    }
};

const MAP_CONFIGS = [
    {
        id: 'whispering_glade',
        title: 'Map I: The Whispering Glade',
        difficulty: 'Normal',
        description: 'An enchanted ancient forest road. Defend the outer boundary against scouting warbands of the Goblin Horde.',
        bannerSubtitle: 'Outer Perimeter Defense',
        canvasWidth: 960,
        canvasHeight: 580,
        startGold: 320,
        startLives: 20,
        startMana: 100,
        totalWaves: 15,
        path: [
            { x: -20, y: 140 },
            { x: 260, y: 140 },
            { x: 260, y: 380 },
            { x: 540, y: 380 },
            { x: 540, y: 160 },
            { x: 780, y: 160 },
            { x: 780, y: 460 },
            { x: 990, y: 460 }
        ],
        buildSlots: [
            { id: 1, x: 130, y: 70 },
            { id: 2, x: 130, y: 220 },
            { id: 3, x: 340, y: 220 },
            { id: 4, x: 340, y: 310 },
            { id: 5, x: 440, y: 460 },
            { id: 6, x: 620, y: 260 },
            { id: 7, x: 620, y: 460 },
            { id: 8, x: 700, y: 80 },
            { id: 9, x: 860, y: 240 },
            { id: 10, x: 860, y: 390 },
            { id: 11, x: 440, y: 100 }
        ],
        waves: [
            // Wave 1-5: Intro
            { enemies: [{ type: 'goblin', count: 8, interval: 1.1 }], reward: 40 },
            { enemies: [{ type: 'goblin', count: 12, interval: 0.9 }, { type: 'goblin_runner', count: 4, interval: 1.2 }], reward: 45 },
            { enemies: [{ type: 'goblin', count: 10, interval: 0.8 }, { type: 'orc_vanguard', count: 4, interval: 1.8 }], reward: 55 },
            { enemies: [{ type: 'goblin_runner', count: 12, interval: 0.7 }, { type: 'orc_vanguard', count: 6, interval: 1.5 }], reward: 60 },
            { enemies: [{ type: 'shadow_wraith', count: 8, interval: 1.2 }, { type: 'goblin', count: 14, interval: 0.6 }], reward: 75 },
            // Wave 6-10: Mid-game
            { enemies: [{ type: 'orc_berserker', count: 6, interval: 1.4 }, { type: 'orc_vanguard', count: 8, interval: 1.2 }], reward: 80 },
            { enemies: [{ type: 'troll', count: 2, interval: 3.0 }, { type: 'goblin_runner', count: 15, interval: 0.5 }], reward: 90 },
            { enemies: [{ type: 'shadow_wraith', count: 12, interval: 0.9 }, { type: 'orc_berserker', count: 8, interval: 1.1 }], reward: 100 },
            { enemies: [{ type: 'siege_golem', count: 2, interval: 4.0 }, { type: 'orc_vanguard', count: 10, interval: 1.0 }], reward: 115 },
            { enemies: [{ type: 'troll', count: 4, interval: 2.2 }, { type: 'goblin', count: 20, interval: 0.4 }], reward: 130 },
            // Wave 11-14: Escalation
            { enemies: [{ type: 'siege_golem', count: 3, interval: 3.5 }, { type: 'shadow_wraith', count: 14, interval: 0.8 }], reward: 140 },
            { enemies: [{ type: 'orc_berserker', count: 16, interval: 0.8 }, { type: 'troll', count: 5, interval: 2.0 }], reward: 160 },
            { enemies: [{ type: 'siege_golem', count: 4, interval: 2.8 }, { type: 'goblin_runner', count: 25, interval: 0.4 }], reward: 180 },
            { enemies: [{ type: 'troll', count: 6, interval: 1.8 }, { type: 'shadow_wraith', count: 18, interval: 0.7 }], reward: 200 },
            // Wave 15: Boss Fight!
            { 
                isBossWave: true,
                bossTitle: 'Gorgar the Desolator Approaches!',
                enemies: [
                    { type: 'orc_vanguard', count: 12, interval: 0.8 },
                    { type: 'boss_warlord', count: 1, interval: 0 },
                    { type: 'orc_berserker', count: 10, interval: 1.0 },
                    { type: 'troll', count: 4, interval: 2.5 }
                ], 
                reward: 350 
            }
        ]
    },
    {
        id: 'molten_chasm',
        title: 'Map II: The Brimstone Chasm',
        difficulty: 'Hard',
        description: 'A perilous volcanic mountain bridge over rivers of molten magma. Multi-route tactical defense.',
        bannerSubtitle: 'Volcanic Fortification',
        canvasWidth: 960,
        canvasHeight: 580,
        startGold: 380,
        startLives: 20,
        startMana: 120,
        totalWaves: 18,
        path: [
            { x: -20, y: 290 },
            { x: 180, y: 290 },
            { x: 300, y: 130 },
            { x: 500, y: 130 },
            { x: 620, y: 290 },
            { x: 740, y: 440 },
            { x: 880, y: 440 },
            { x: 990, y: 290 }
        ],
        altPath: [
            { x: -20, y: 290 },
            { x: 180, y: 290 },
            { x: 300, y: 450 },
            { x: 500, y: 450 },
            { x: 620, y: 290 },
            { x: 740, y: 140 },
            { x: 880, y: 140 },
            { x: 990, y: 290 }
        ],
        buildSlots: [
            { id: 1, x: 240, y: 210 },
            { id: 2, x: 240, y: 370 },
            { id: 3, x: 400, y: 60 },
            { id: 4, x: 400, y: 210 },
            { id: 5, x: 400, y: 370 },
            { id: 6, x: 400, y: 520 },
            { id: 7, x: 560, y: 210 },
            { id: 8, x: 560, y: 370 },
            { id: 9, x: 680, y: 70 },
            { id: 10, x: 680, y: 510 },
            { id: 11, x: 810, y: 290 },
            { id: 12, x: 880, y: 60 },
            { id: 13, x: 880, y: 520 }
        ],
        waves: [
            { enemies: [{ type: 'goblin_runner', count: 14, interval: 0.8 }], reward: 50 },
            { enemies: [{ type: 'orc_vanguard', count: 8, interval: 1.2 }, { type: 'goblin', count: 10, interval: 0.8 }], reward: 60 },
            { enemies: [{ type: 'shadow_wraith', count: 10, interval: 1.0 }, { type: 'orc_berserker', count: 6, interval: 1.3 }], reward: 75 },
            { enemies: [{ type: 'troll', count: 3, interval: 2.2 }, { type: 'goblin_runner', count: 18, interval: 0.6 }], reward: 90 },
            { enemies: [{ type: 'siege_golem', count: 3, interval: 3.0 }, { type: 'orc_vanguard', count: 12, interval: 1.0 }], reward: 110 },
            { enemies: [{ type: 'shadow_wraith', count: 16, interval: 0.8 }, { type: 'orc_berserker', count: 12, interval: 0.9 }], reward: 125 },
            { enemies: [{ type: 'troll', count: 5, interval: 1.9 }, { type: 'siege_golem', count: 3, interval: 3.2 }], reward: 145 },
            { enemies: [{ type: 'goblin_runner', count: 30, interval: 0.4 }, { type: 'orc_berserker', count: 14, interval: 0.8 }], reward: 160 },
            { enemies: [{ type: 'siege_golem', count: 5, interval: 2.5 }, { type: 'troll', count: 6, interval: 1.7 }], reward: 180 },
            { enemies: [{ type: 'shadow_wraith', count: 24, interval: 0.6 }, { type: 'orc_vanguard', count: 16, interval: 0.8 }], reward: 200 },
            { enemies: [{ type: 'orc_berserker', count: 22, interval: 0.6 }, { type: 'troll', count: 8, interval: 1.5 }], reward: 220 },
            { enemies: [{ type: 'siege_golem', count: 6, interval: 2.0 }, { type: 'shadow_wraith', count: 20, interval: 0.7 }], reward: 240 },
            { enemies: [{ type: 'troll', count: 10, interval: 1.4 }, { type: 'goblin_runner', count: 35, interval: 0.35 }], reward: 260 },
            { enemies: [{ type: 'siege_golem', count: 8, interval: 1.8 }, { type: 'orc_berserker', count: 20, interval: 0.7 }], reward: 290 },
            { enemies: [{ type: 'shadow_wraith', count: 30, interval: 0.5 }, { type: 'troll', count: 8, interval: 1.4 }], reward: 320 },
            { enemies: [{ type: 'siege_golem', count: 10, interval: 1.5 }, { type: 'orc_berserker', count: 25, interval: 0.6 }], reward: 350 },
            { enemies: [{ type: 'troll', count: 12, interval: 1.2 }, { type: 'shadow_wraith', count: 32, interval: 0.5 }], reward: 380 },
            {
                isBossWave: true,
                bossTitle: 'Awakening of Pyrax the Crimson Wyrm!',
                enemies: [
                    { type: 'siege_golem', count: 6, interval: 2.0 },
                    { type: 'boss_dragon', count: 1, interval: 0 },
                    { type: 'orc_berserker', count: 18, interval: 0.8 },
                    { type: 'troll', count: 8, interval: 1.5 }
                ],
                reward: 600
            }
        ]
    }
];

const HERO_SPELLS_DATA = {
    meteor: {
        id: 'meteor',
        name: 'Meteor Strike',
        icon: '☄️',
        costMana: 40,
        cooldown: 35,
        radius: 110,
        damage: 480,
        desc: 'Calls down a fiery comet from the heavens dealing massive cataclysmic area damage.',
        burnTime: 3.0
    },
    freeze: {
        id: 'freeze',
        name: 'Glacial Stasis',
        icon: '❄️',
        costMana: 35,
        cooldown: 45,
        duration: 4.5,
        desc: 'Freezes all enemies on the battlefield completely solid for 4.5 seconds.'
    },
    knights: {
        id: 'knights',
        name: 'Royal Vanguard',
        icon: '⚔️',
        costMana: 30,
        cooldown: 30,
        knightCount: 3,
        duration: 25,
        hp: 600,
        damage: 45,
        desc: 'Summons three elite royal paladins directly onto the path to block the breach.'
    },
    tithe: {
        id: 'tithe',
        name: 'Royal Coffers',
        icon: '💰',
        costMana: 25,
        cooldown: 50,
        goldGain: 160,
        desc: 'The High Crown levies emergency funds, instantly granting +160 Gold.'
    }
};

const ARMORY_PERKS = [
    {
        id: 'sharpened_steel',
        name: 'Master Archery',
        icon: '🏹',
        costStars: 2,
        desc: '+15% Damage and +10% Range for all Watchtowers.',
        effect: { archerDmg: 0.15, archerRange: 0.10 }
    },
    {
        id: 'leyline_mastery',
        name: 'Arcane Affinity',
        icon: '🔮',
        costStars: 2,
        desc: '-15% Gold Cost for Arcane Spires and upgrades.',
        effect: { mageCostDiscount: 0.15 }
    },
    {
        id: 'alchemical_blast',
        name: 'Siege Engineering',
        icon: '💣',
        costStars: 3,
        desc: '+25% Explosion Splash Radius for Catapults.',
        effect: { splashRadiusBonus: 0.25 }
    },
    {
        id: 'deep_frost',
        name: 'Absolute Zero',
        icon: '❄️',
        costStars: 3,
        desc: 'Frost Towers slow enemies by an additional +15%.',
        effect: { frostSlowBonus: 0.15 }
    },
    {
        id: 'royal_treasury',
        name: 'Imperial Wealth',
        icon: '👑',
        costStars: 4,
        desc: 'Start every battle with +120 bonus starting Gold.',
        effect: { bonusStartGold: 120 }
    },
    {
        id: 'commanders_wrath',
        name: 'Divine Fervor',
        icon: '⚡',
        costStars: 4,
        desc: '-25% Cooldown on all Hero Commander spells.',
        effect: { spellCooldownReduction: 0.25 }
    }
];
