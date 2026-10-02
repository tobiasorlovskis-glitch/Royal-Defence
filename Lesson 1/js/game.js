/**
 * SIEGE OF ELDORIA - CORE GAME ENGINE
 * Map management, wave spawner, hero abilities, combat loops, and canvas drawing.
 */

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.currentMapIndex = 0;
        this.currentMap = MAP_CONFIGS[0];

        // Player resources & stats
        this.gold = this.currentMap.startGold;
        this.lives = this.currentMap.startLives;
        this.mana = this.currentMap.startMana;
        this.maxMana = 150;
        this.score = 0;

        // Wave state
        this.currentWave = 0;
        this.waveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveCooldown = 0;
        this.totalWaves = this.currentMap.totalWaves;

        // Entities
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.soldiers = [];

        // Selection & targeting
        this.selectedSlot = null;
        this.selectedTower = null;
        this.activeSpellId = null;
        this.hoverPos = { x: -100, y: -100 };

        // Game speed & loop
        this.gameSpeed = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.lastTime = performance.now();

        // Hero Spells cooldowns
        this.spellCooldowns = {
            meteor: 0,
            freeze: 0,
            knights: 0,
            tithe: 0
        };

        // Saved Meta Perks & Stars
        this.stars = parseInt(localStorage.getItem('eldoria_stars') || '8', 10);
        this.unlockedPerks = JSON.parse(localStorage.getItem('eldoria_perks') || '[]');
        this.perks = this.calculatePerks();

        // Animation decorative elements
        this.animTick = 0;

        this.initEventListeners();
        this.applyStartingBonuses();
    }

    calculatePerks() {
        const effects = {};
        for (const perkId of this.unlockedPerks) {
            const p = ARMORY_PERKS.find(x => x.id === perkId);
            if (p && p.effect) {
                Object.assign(effects, p.effect);
            }
        }
        return effects;
    }

    applyStartingBonuses() {
        if (this.perks.bonusStartGold) {
            this.gold += this.perks.bonusStartGold;
        }
    }

    loadMap(index) {
        this.currentMapIndex = index;
        this.currentMap = MAP_CONFIGS[index];
        this.totalWaves = this.currentMap.totalWaves;
        this.canvas.width = this.currentMap.canvasWidth;
        this.canvas.height = this.currentMap.canvasHeight;
        this.restart();
    }

    restart() {
        this.gold = this.currentMap.startGold;
        this.lives = this.currentMap.startLives;
        this.mana = this.currentMap.startMana;
        this.score = 0;
        this.currentWave = 0;
        this.waveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveCooldown = 0;

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.soldiers = [];
        this.selectedSlot = null;
        this.selectedTower = null;
        this.activeSpellId = null;

        this.isGameOver = false;
        this.isVictory = false;

        this.spellCooldowns = { meteor: 0, freeze: 0, knights: 0, tithe: 0 };
        window.particleEngine.reset();
        this.applyStartingBonuses();

        if (window.uiManager) {
            window.uiManager.updateHUD();
            window.uiManager.hideSelectionPanels();
        }
    }

    initEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.hoverPos.x = (e.clientX - rect.x) * scaleX;
            this.hoverPos.y = (e.clientY - rect.y) * scaleY;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPos.x = -100;
            this.hoverPos.y = -100;
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clickX = (e.clientX - rect.x) * scaleX;
            const clickY = (e.clientY - rect.y) * scaleY;

            this.handleClick(clickX, clickY);
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            } else if (e.key === '1') {
                this.setSpeed(1);
            } else if (e.key === '2') {
                this.setSpeed(2);
            } else if (e.key === '3') {
                this.setSpeed(4);
            } else if (e.key.toLowerCase() === 'q') {
                this.castSpell('meteor');
            } else if (e.key.toLowerCase() === 'w') {
                this.castSpell('freeze');
            } else if (e.key.toLowerCase() === 'e') {
                this.castSpell('knights');
            } else if (e.key.toLowerCase() === 'r') {
                this.castSpell('tithe');
            }
        });
    }

    handleClick(x, y) {
        // If a hero spell requiring targeting is active
        if (this.activeSpellId) {
            this.executeTargetedSpell(this.activeSpellId, x, y);
            this.activeSpellId = null;
            if (window.uiManager) window.uiManager.clearActiveSpell();
            return;
        }

        // Check if clicked an existing tower
        for (const tower of this.towers) {
            if (Math.hypot(tower.x - x, tower.y - y) <= 28) {
                this.selectedTower = tower;
                this.selectedSlot = null;
                if (window.uiManager) window.uiManager.showTowerInspectPanel(tower);
                return;
            }
        }

        // Check if clicked an empty build slot
        for (const slot of this.currentMap.buildSlots) {
            if (Math.hypot(slot.x - x, slot.y - y) <= 24) {
                const towerAtSlot = this.towers.find(t => t.slot.id === slot.id);
                if (towerAtSlot) {
                    this.selectedTower = towerAtSlot;
                    this.selectedSlot = null;
                    if (window.uiManager) window.uiManager.showTowerInspectPanel(towerAtSlot);
                } else {
                    this.selectedSlot = slot;
                    this.selectedTower = null;
                    if (window.uiManager) window.uiManager.showBuildWheel(slot);
                }
                return;
            }
        }

        // Clicked empty ground: deselect
        this.selectedTower = null;
        this.selectedSlot = null;
        if (window.uiManager) window.uiManager.hideSelectionPanels();
    }

    buildTower(slot, typeId) {
        const config = TOWER_DATA[typeId];
        let cost = config.cost;

        // Armory discount for mage spires
        if (this.perks.mageCostDiscount && typeId === 'mage') {
            cost = Math.round(cost * (1 - this.perks.mageCostDiscount));
        }

        if (this.gold < cost) {
            if (window.uiManager) window.uiManager.showToast('Not enough Gold to construct!', 'error');
            return false;
        }

        this.gold -= cost;
        const newTower = new Tower(slot, typeId, this);
        this.towers.push(newTower);

        window.soundEngine.play('playBuild');
        window.particleEngine.addArcaneRings(slot.x, slot.y, config.color);
        window.particleEngine.addFloatingText('CONSTRUCTED!', slot.x, slot.y - 20, '#ffd166', 14);

        this.selectedSlot = null;
        this.selectedTower = newTower;

        if (window.uiManager) {
            window.uiManager.updateHUD();
            window.uiManager.showTowerInspectPanel(newTower);
        }
        return true;
    }

    sellTower(tower) {
        const idx = this.towers.indexOf(tower);
        if (idx !== -1) {
            tower.sell(this);
            this.towers.splice(idx, 1);
            this.selectedTower = null;
            if (window.uiManager) {
                window.uiManager.updateHUD();
                window.uiManager.hideSelectionPanels();
            }
        }
    }

    startNextWave() {
        if (this.waveActive || this.currentWave >= this.totalWaves) return;

        const waveData = this.currentMap.waves[this.currentWave];
        this.currentWave++;
        this.waveActive = true;

        // Build spawn queue
        this.spawnQueue = [];
        for (const grp of waveData.enemies) {
            for (let i = 0; i < grp.count; i++) {
                this.spawnQueue.push({
                    type: grp.type,
                    delay: grp.interval
                });
            }
        }

        window.soundEngine.play('playWarHorn');

        if (waveData.isBossWave) {
            window.soundEngine.play('playWarHorn');
            if (window.uiManager) {
                window.uiManager.showBossBanner(waveData.bossTitle || 'WARLORD BOSS INCOMING!');
            }
        } else {
            if (window.uiManager) {
                window.uiManager.showToast(`Wave ${this.currentWave} Commenced!`, 'info');
            }
        }

        if (window.uiManager) window.uiManager.updateHUD();
    }

    callWaveEarly() {
        if (this.waveActive) return;
        const bonusGold = 25;
        this.gold += bonusGold;
        window.particleEngine.addFloatingText(`+${bonusGold}g EARLY RUSH!`, this.canvas.width / 2, 80, '#ffd166', 18, true);
        this.startNextWave();
    }

    castSpell(spellId) {
        const spell = HERO_SPELLS_DATA[spellId];
        if (this.activeSpellId === spellId) {
            this.activeSpellId = null;
            if (window.uiManager) {
                window.uiManager.clearActiveSpell();
                window.uiManager.showToast('Targeting cancelled.', 'info');
            }
            return;
        }

        if (this.spellCooldowns[spellId] > 0) {
            if (window.uiManager) window.uiManager.showToast(`${spell.name} on cooldown!`, 'warning');
            return;
        }

        if (this.mana < spell.costMana) {
            if (window.uiManager) window.uiManager.showToast(`Requires ${spell.costMana} Mana!`, 'warning');
            return;
        }

        // Instant spells
        if (spellId === 'freeze') {
            this.mana -= spell.costMana;
            let cd = spell.cooldown;
            if (this.perks.spellCooldownReduction) cd *= (1 - this.perks.spellCooldownReduction);
            this.spellCooldowns[spellId] = cd;

            window.soundEngine.play('playFrostFreeze');
            window.particleEngine.addFrostBurst(this.canvas.width / 2, this.canvas.height / 2, 280);
            window.particleEngine.addFloatingText('CHRONO STASIS!', this.canvas.width / 2, this.canvas.height / 2, '#90e0ef', 26, true);

            for (const enemy of this.enemies) {
                enemy.applyFreeze(spell.duration);
            }
            if (window.uiManager) window.uiManager.updateHUD();
        } else if (spellId === 'tithe') {
            this.mana -= spell.costMana;
            let cd = spell.cooldown;
            if (this.perks.spellCooldownReduction) cd *= (1 - this.perks.spellCooldownReduction);
            this.spellCooldowns[spellId] = cd;

            this.gold += spell.goldGain;
            window.soundEngine.play('playCoin');
            window.particleEngine.addFloatingText(`+${spell.goldGain}g TITHE!`, this.canvas.width / 2, 120, '#ffd166', 22, true);
            if (window.uiManager) window.uiManager.updateHUD();
        } else {
            // Targeted spells: Enter targeting mode
            this.activeSpellId = spellId;
            if (window.uiManager) {
                window.uiManager.setActiveSpell(spellId);
                window.uiManager.showToast(`Click target location for ${spell.name}!`, 'info');
            }
        }
    }

    executeTargetedSpell(spellId, x, y) {
        const spell = HERO_SPELLS_DATA[spellId];
        this.mana -= spell.costMana;
        let cd = spell.cooldown;
        if (this.perks.spellCooldownReduction) cd *= (1 - this.perks.spellCooldownReduction);
        this.spellCooldowns[spellId] = cd;

        if (spellId === 'meteor') {
            window.soundEngine.play('playMeteorSpell');
            window.particleEngine.addBurnDecal(x, y, spell.radius, 4.5);
            window.particleEngine.addExplosion(x, y, spell.radius, '#e85d04');
            window.particleEngine.addFloatingText('METEOR IMPACT!', x, y - 30, '#ffba08', 22, true);

            for (const enemy of this.enemies) {
                if (enemy.isDead || enemy.reachedEnd) continue;
                const d = Math.hypot(enemy.x - x, enemy.y - y);
                if (d <= spell.radius) {
                    enemy.takeDamage(spell.damage, 'physical', this);
                    enemy.applyBurn(50, 4.0);
                }
            }
        } else if (spellId === 'knights') {
            window.soundEngine.play('playWarHorn');
            window.particleEngine.addArcaneRings(x, y, '#ffd166');
            window.particleEngine.addFloatingText('PALADIN VANGUARD!', x, y - 25, '#ffd166', 20, true);

            for (let i = 0; i < spell.knightCount; i++) {
                const knight = new Soldier(x, y, 3, true);
                this.soldiers.push(knight);
            }
        }

        if (window.uiManager) window.uiManager.updateHUD();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (window.uiManager) window.uiManager.updatePauseState(this.isPaused);
    }

    setSpeed(speed) {
        this.gameSpeed = speed;
        if (window.uiManager) window.uiManager.updateSpeedButtons(speed);
    }

    update(dt) {
        if (this.isPaused || this.isGameOver || this.isVictory) return;

        const effectiveDt = dt * this.gameSpeed;
        this.animTick += effectiveDt;

        // Mana passive regeneration (2 mana per second)
        this.mana = Math.min(this.maxMana, this.mana + 2.2 * effectiveDt);

        // Spell cooldowns countdown
        for (const k in this.spellCooldowns) {
            if (this.spellCooldowns[k] > 0) {
                this.spellCooldowns[k] = Math.max(0, this.spellCooldowns[k] - effectiveDt);
            }
        }

        // Spawn queue processing
        if (this.waveActive && this.spawnQueue.length > 0) {
            this.spawnTimer -= effectiveDt;
            if (this.spawnTimer <= 0) {
                const next = this.spawnQueue.shift();
                this.spawnTimer = next.delay;

                // Alternate paths if available
                let pathChoice = this.currentMap.path;
                if (this.currentMap.altPath && Math.random() < 0.5) {
                    pathChoice = this.currentMap.altPath;
                }
                const enemy = new Enemy(next.type, pathChoice, this.currentWave);
                this.enemies.push(enemy);
            }
        }

        // Check if wave is cleared
        if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.waveActive = false;
            const reward = this.currentMap.waves[this.currentWave - 1].reward;
            this.gold += reward;
            window.soundEngine.play('playCoin');
            window.particleEngine.addFloatingText(`+${reward}g WAVE BONUS!`, this.canvas.width / 2, 100, '#ffd166', 20, true);

            // Check if victory condition met
            if (this.currentWave >= this.totalWaves) {
                this.handleVictory();
                return;
            }

            if (window.uiManager) window.uiManager.updateHUD();
        }

        // Update Towers
        for (const tower of this.towers) {
            tower.update(effectiveDt, this);
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(effectiveDt, this);
            if (p.isFinished) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update Soldiers
        for (let i = this.soldiers.length - 1; i >= 0; i--) {
            const s = this.soldiers[i];
            s.update(effectiveDt, this);
            if (s.isHeroVanguard && s.isDead) {
                this.soldiers.splice(i, 1);
            }
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(effectiveDt, this);

            if (e.reachedEnd) {
                this.lives -= e.damageToGate;
                window.soundEngine.play('playExplosion');
                window.particleEngine.addExplosion(e.x, e.y, 40, '#d90429');
                window.particleEngine.addFloatingText(`-${e.damageToGate} LIVES!`, e.x - 30, e.y, '#e71d36', 18, true);
                this.enemies.splice(i, 1);

                if (this.lives <= 0) {
                    this.handleDefeat();
                    return;
                }
            } else if (e.isDead) {
                this.enemies.splice(i, 1);
            }
        }

        // Update Particles & Combat FX
        window.particleEngine.update(effectiveDt);

        if (window.uiManager) window.uiManager.updateHUD();
    }

    handleVictory() {
        this.isVictory = true;
        const starsAwarded = this.lives >= 18 ? 3 : (this.lives >= 10 ? 2 : 1);
        this.stars += starsAwarded;
        localStorage.setItem('eldoria_stars', this.stars);

        window.soundEngine.play('playVictory');
        if (window.uiManager) {
            window.uiManager.showEndgameModal(true, starsAwarded, this.score);
        }
    }

    handleDefeat() {
        this.isGameOver = true;
        window.soundEngine.play('playDefeat');
        if (window.uiManager) {
            window.uiManager.showEndgameModal(false, 0, this.score);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Map Terrain & Pathways
        this.drawMapTerrain();

        // 2. Draw Ground Burn Decals
        window.particleEngine.drawGroundDecals(this.ctx);

        // 3. Draw Build Slots
        this.drawBuildSlots();

        // 4. Draw Soldiers
        for (const soldier of this.soldiers) {
            soldier.draw(this.ctx);
        }

        // 5. Draw Enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // 6. Draw Towers
        for (const tower of this.towers) {
            tower.draw(this.ctx, tower === this.selectedTower);
        }

        // 7. Draw Projectiles
        for (const p of this.projectiles) {
            p.draw(this.ctx);
        }

        // 8. Draw Particles & Floating Damage Numbers
        window.particleEngine.draw(this.ctx);

        // 9. Draw Targeting Cursor for Active Hero Spell
        if (this.activeSpellId) {
            this.drawSpellTargetReticle();
        }
    }

    drawMapTerrain() {
        const isVolcano = this.currentMap.id === 'molten_chasm';

        // Background terrain base
        this.ctx.fillStyle = isVolcano ? '#1f1315' : '#1b3a27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Decorative terrain patches (grass / obsidian rock tiles)
        this.ctx.fillStyle = isVolcano ? '#2d181b' : '#225738';
        for (let x = 30; x < this.canvas.width; x += 110) {
            for (let y = 30; y < this.canvas.height; y += 110) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, 28, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Draw Road Pathway
        const drawRoad = (pathWaypoints, isLavaRiver = false) => {
            if (!pathWaypoints || pathWaypoints.length < 2) return;

            // Outer road borders / stone curb
            this.ctx.beginPath();
            this.ctx.moveTo(pathWaypoints[0].x, pathWaypoints[0].y);
            for (let i = 1; i < pathWaypoints.length; i++) {
                this.ctx.lineTo(pathWaypoints[i].x, pathWaypoints[i].y);
            }
            this.ctx.strokeStyle = isVolcano ? '#590d22' : '#5c4d3c';
            this.ctx.lineWidth = 44;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();

            // Inner cobblestone or molten flow
            this.ctx.beginPath();
            this.ctx.moveTo(pathWaypoints[0].x, pathWaypoints[0].y);
            for (let i = 1; i < pathWaypoints.length; i++) {
                this.ctx.lineTo(pathWaypoints[i].x, pathWaypoints[i].y);
            }
            this.ctx.strokeStyle = isVolcano ? '#d90429' : '#b79d84';
            this.ctx.lineWidth = 36;
            this.ctx.stroke();

            // Cobblestone dashes or lava glow
            this.ctx.beginPath();
            this.ctx.moveTo(pathWaypoints[0].x, pathWaypoints[0].y);
            for (let i = 1; i < pathWaypoints.length; i++) {
                this.ctx.lineTo(pathWaypoints[i].x, pathWaypoints[i].y);
            }
            this.ctx.strokeStyle = isVolcano ? '#ffb703' : 'rgba(255, 255, 255, 0.25)';
            this.ctx.lineWidth = 6;
            this.ctx.setLineDash([12, 16]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        };

        drawRoad(this.currentMap.path);
        if (this.currentMap.altPath) {
            drawRoad(this.currentMap.altPath);
        }

        // Castle Gate Parapet at end of path
        const lastPt = this.currentMap.path[this.currentMap.path.length - 1];
        this.ctx.save();
        this.ctx.translate(lastPt.x - 20, lastPt.y);
        this.ctx.fillStyle = '#343a40';
        this.ctx.fillRect(-15, -45, 30, 90);
        this.ctx.fillStyle = '#ffd166';
        this.ctx.font = '22px sans-serif';
        this.ctx.fillText('🏰', -12, 8);
        this.ctx.restore();
    }

    drawBuildSlots() {
        for (const slot of this.currentMap.buildSlots) {
            const hasTower = this.towers.some(t => t.slot.id === slot.id);
            if (hasTower) continue; // Tower will draw its own base

            const isHovered = Math.hypot(slot.x - this.hoverPos.x, slot.y - this.hoverPos.y) <= 24;
            const isSelected = this.selectedSlot && this.selectedSlot.id === slot.id;

            this.ctx.save();
            this.ctx.translate(slot.x, slot.y);

            // Foundation ring
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? 'rgba(72, 202, 228, 0.35)' : 'rgba(20, 25, 35, 0.75)';
            this.ctx.fill();

            // Gold/blue ornate border
            this.ctx.strokeStyle = isSelected ? '#ffd166' : (isHovered ? '#48cae4' : '#6c757d');
            this.ctx.lineWidth = isSelected || isHovered ? 2.5 : 1.5;
            this.ctx.setLineDash(isSelected ? [4, 4] : []);
            this.ctx.stroke();

            // Hammer/build icon
            this.ctx.fillStyle = isHovered ? '#ffd166' : '#ced4da';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚒️', 0, 0);

            this.ctx.restore();
        }
    }

    drawSpellTargetReticle() {
        const spell = HERO_SPELLS_DATA[this.activeSpellId];
        const radius = spell.radius || 60;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.hoverPos.x, this.hoverPos.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#e63946';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([8, 8]);
        this.ctx.stroke();

        // Crosshairs
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.hoverPos.x - radius, this.hoverPos.y);
        this.ctx.lineTo(this.hoverPos.x + radius, this.hoverPos.y);
        this.ctx.moveTo(this.hoverPos.x, this.hoverPos.y - radius);
        this.ctx.lineTo(this.hoverPos.x, this.hoverPos.y + radius);
        this.ctx.stroke();

        // Spell label
        this.ctx.font = 'bold 14px "Cinzel", serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(spell.name, this.hoverPos.x, this.hoverPos.y - radius - 10);
        this.ctx.restore();
    }

    startLoop() {
        const loop = (currentTime) => {
            const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
