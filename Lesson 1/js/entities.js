/**
 * SIEGE OF ELDORIA - GAME ENTITIES
 * Enemies, Towers, Projectiles, and Melee Defenders (Soldiers).
 */

class Enemy {
    constructor(typeId, pathWaypoints, waveNumber = 1) {
        const template = ENEMY_DATA[typeId];
        this.typeId = typeId;
        this.name = template.name;
        this.isBoss = template.isBoss || false;
        this.isFlying = template.isFlying || false;
        this.icon = template.icon;
        this.portrait = template.portrait || null;
        this.color = template.color;
        this.radius = template.radius;
        this.gold = template.gold;
        this.score = template.score;
        this.damageToGate = template.damageToGate;
        this.armor = template.armor || 0;
        this.magicResist = template.magicResist || 0;
        this.regen = template.regen || 0;

        // Scaling with wave number
        const waveScale = 1 + (waveNumber - 1) * 0.08;
        this.maxHp = Math.round(template.hp * waveScale);
        this.hp = this.maxHp;
        this.baseSpeed = template.speed;
        this.speed = this.baseSpeed;

        // Path navigation
        this.path = pathWaypoints;
        this.waypointIndex = 0;
        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.distanceTraveled = 0;
        this.angle = 0;

        // Status effects
        this.slowTimer = 0;
        this.slowFactor = 0;
        this.frozenTimer = 0;
        this.burnTimer = 0;
        this.burnDps = 0;

        // Combat state
        this.blockedBy = null;
        this.attackCooldown = 0;
        this.isDead = false;
        this.reachedEnd = false;

        // Boss timer
        this.bossAbilityTimer = 4.0;
    }

    update(dt, game) {
        if (this.isDead || this.reachedEnd) return;

        // Handle Status Effects
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            this.speed = 0;
        } else if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * (1 - this.slowFactor);
        } else {
            this.speed = this.baseSpeed;
        }

        // Handle Burn DoT
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            const burnDmg = this.burnDps * dt;
            this.takeDamage(burnDmg, 'burn', game, false);
            if (Math.random() < 0.2) {
                window.particleEngine.addSpark(this.x, this.y, '#f77f00', 1, 1.2);
            }
        }

        // Regeneration (Trolls)
        if (this.regen > 0 && this.hp < this.maxHp && this.hp > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
        }

        // Boss Ability: Warlord Warcry
        if (this.typeId === 'boss_warlord') {
            this.bossAbilityTimer -= dt;
            if (this.bossAbilityTimer <= 0) {
                this.bossAbilityTimer = 7.0;
                window.soundEngine.play('playWarHorn');
                window.particleEngine.addFloatingText('WARCRY!', this.x, this.y - 20, '#d90429', 18, true);
                window.particleEngine.addArcaneRings(this.x, this.y, '#d90429');
                // Buff all nearby allies
                for (const other of game.enemies) {
                    const dist = Math.hypot(other.x - this.x, other.y - this.y);
                    if (dist < 200) {
                        other.speed = other.baseSpeed * 1.5;
                        other.slowTimer = 0;
                    }
                }
            }
        }

        // Melee combat engagement
        if (this.blockedBy && !this.blockedBy.isDead) {
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                this.attackCooldown = 1.0;
                this.blockedBy.takeDamage(18, game);
                window.soundEngine.play('playSwordClash');
                window.particleEngine.addSpark(this.x, this.y, '#ffffff', 4, 1.5);
            }
            return; // Blocked: don't move forward
        } else {
            this.blockedBy = null;
        }

        if (this.frozenTimer > 0) return;

        // Path Movement
        if (this.waypointIndex < this.path.length - 1) {
            const target = this.path[this.waypointIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            this.angle = Math.atan2(dy, dx);

            const moveStep = this.speed * 60 * dt;

            if (dist <= moveStep) {
                this.x = target.x;
                this.y = target.y;
                this.waypointIndex++;
                if (this.waypointIndex >= this.path.length - 1) {
                    this.reachedEnd = true;
                }
            } else {
                this.x += (dx / dist) * moveStep;
                this.y += (dy / dist) * moveStep;
                this.distanceTraveled += moveStep;
            }
        } else {
            this.reachedEnd = true;
        }
    }

    takeDamage(rawDamage, type, game, showNumber = true) {
        if (this.isDead) return;

        let finalDamage = rawDamage;

        // Apply resistance modifiers
        if (type === 'physical') {
            finalDamage = rawDamage * (1 - this.armor);
        } else if (type === 'magic') {
            finalDamage = rawDamage * (1 - this.magicResist);
        } else if (type === 'burn') {
            finalDamage = rawDamage;
        }

        // Check if frozen damage bonus applies
        if (this.frozenTimer > 0 && type === 'frost_shatter') {
            finalDamage *= 1.5;
        }

        finalDamage = Math.max(1, finalDamage);
        this.hp -= finalDamage;

        if (showNumber) {
            const isCrit = rawDamage > 120;
            const color = type === 'magic' ? '#c77dff' : (type === 'frost' ? '#90e0ef' : (isCrit ? '#ffba08' : '#ffffff'));
            window.particleEngine.addFloatingText(Math.round(finalDamage), this.x, this.y, color, isCrit ? 16 : 13, isCrit);
        }

        if (this.hp <= 0) {
            this.die(game);
        }
    }

    applySlow(percent, duration) {
        if (this.isBoss && percent > 0.35) percent = 0.35; // Bosses resist high slows
        if (percent >= this.slowFactor || this.slowTimer <= 0) {
            this.slowFactor = percent;
            this.slowTimer = duration;
        }
    }

    applyFreeze(duration) {
        if (this.isBoss) duration *= 0.4;
        this.frozenTimer = Math.max(this.frozenTimer, duration);
        window.particleEngine.addFrostBurst(this.x, this.y, this.radius + 10);
    }

    applyBurn(dps, duration) {
        this.burnDps = Math.max(this.burnDps, dps);
        this.burnTimer = Math.max(this.burnTimer, duration);
    }

    die(game) {
        if (this.isDead) return;
        this.isDead = true;

        // Disengage blocker
        if (this.blockedBy) {
            this.blockedBy.engagedEnemy = null;
            this.blockedBy = null;
        }

        // Reward gold & score
        game.gold += this.gold;
        game.score += this.score;

        window.soundEngine.play('playCoin');
        window.particleEngine.addFloatingText(`+${this.gold}g`, this.x, this.y - 12, '#ffd166', 15, true);
        window.particleEngine.addExplosion(this.x, this.y, this.radius * 1.5, this.color);

        if (this.isBoss) {
            window.soundEngine.play('playVictory');
            window.particleEngine.addArcaneRings(this.x, this.y, '#ffd166');
            window.particleEngine.addFloatingText('BOSS SLAIN!', this.x, this.y - 30, '#ffd166', 22, true);
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Frozen aura overlay
        if (this.frozenTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(144, 224, 239, 0.45)';
            ctx.fill();
            ctx.strokeStyle = '#caf0f8';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.slowTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(144, 224, 239, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw Character Base Circle
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = this.isBoss ? 3.5 : 2;
        ctx.strokeStyle = this.isBoss ? '#ffd166' : '#1b263b';
        ctx.stroke();

        // Draw Icon / Face
        ctx.font = `${Math.round(this.radius * 1.35)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 1);

        // Draw Boss Crown / Banner
        if (this.isBoss) {
            ctx.font = '16px sans-serif';
            ctx.fillText('👑', 0, -this.radius - 8);
        }

        // Draw Flying Shadow if flying
        if (this.isFlying) {
            ctx.beginPath();
            ctx.ellipse(0, 20, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fill();
        }

        ctx.restore();

        // Draw Health Bar
        const barWidth = Math.max(28, this.radius * 2 + 4);
        const barHeight = this.isBoss ? 8 : 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - (this.isBoss ? 20 : 12);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Fill HP
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const hpColor = hpPercent > 0.5 ? '#2ec4b6' : (hpPercent > 0.25 ? '#ff9f1c' : '#e71d36');
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        ctx.strokeStyle = this.isBoss ? '#ffd166' : '#495057';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    }
}

class Soldier {
    constructor(x, y, level = 1, isHeroVanguard = false) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 20 - 10);
        this.originX = x;
        this.originY = y;
        this.level = level;
        this.isHeroVanguard = isHeroVanguard;

        this.maxHp = isHeroVanguard ? 600 : (280 + (level - 1) * 200);
        this.hp = this.maxHp;
        this.damage = isHeroVanguard ? 45 : (25 + (level - 1) * 22);
        this.armor = isHeroVanguard ? 0.35 : (0.2 + (level - 1) * 0.1);
        this.radius = 12;
        this.attackCooldown = 0;
        this.engagedEnemy = null;
        this.isDead = false;
        this.respawnTimer = 0;
    }

    update(dt, game) {
        if (this.isDead) {
            if (!this.isHeroVanguard) {
                this.respawnTimer -= dt;
                if (this.respawnTimer <= 0) {
                    this.isDead = false;
                    this.hp = this.maxHp;
                    this.x = this.originX + (Math.random() * 16 - 8);
                    this.y = this.originY + (Math.random() * 16 - 8);
                    window.particleEngine.addArcaneRings(this.x, this.y, '#ffd166');
                }
            }
            return;
        }

        // Look for enemy to block if not currently engaged
        if (!this.engagedEnemy || this.engagedEnemy.isDead || this.engagedEnemy.reachedEnd) {
            this.engagedEnemy = null;
            let closest = null;
            let minDist = 75; // Engagement range
            for (const enemy of game.enemies) {
                if (enemy.isDead || enemy.reachedEnd || enemy.isFlying || enemy.blockedBy) continue;
                const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d < minDist) {
                    minDist = d;
                    closest = enemy;
                }
            }

            if (closest) {
                this.engagedEnemy = closest;
                closest.blockedBy = this;
            }
        }

        // Attack engaged enemy
        if (this.engagedEnemy && !this.engagedEnemy.isDead) {
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                this.attackCooldown = 0.9;
                window.soundEngine.play('playSwordClash');
                window.particleEngine.addSpark(this.engagedEnemy.x, this.engagedEnemy.y, '#ffd166', 5, 2.0);
                this.engagedEnemy.takeDamage(this.damage, 'physical', game);
            }
        }
    }

    takeDamage(dmg, game) {
        if (this.isDead) return;
        const finalDmg = dmg * (1 - this.armor);
        this.hp -= finalDmg;
        window.particleEngine.addFloatingText(`-${Math.round(finalDmg)}`, this.x, this.y - 10, '#e71d36', 11);

        if (this.hp <= 0) {
            this.isDead = true;
            if (this.engagedEnemy) {
                this.engagedEnemy.blockedBy = null;
                this.engagedEnemy = null;
            }
            this.respawnTimer = 10.0;
            window.particleEngine.addExplosion(this.x, this.y, 20, '#ffd166');
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Knight Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isHeroVanguard ? '#ffd166' : '#48cae4';
        ctx.fill();
        ctx.strokeStyle = '#03045e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);

        ctx.restore();

        // HP bar
        const barWidth = 24;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 8;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#2ec4b6';
        ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
    }
}

class Projectile {
    constructor(opts) {
        this.type = opts.type;
        this.x = opts.x;
        this.y = opts.y;
        this.startX = opts.x;
        this.startY = opts.y;
        this.target = opts.target;
        this.targetX = opts.target ? opts.target.x : opts.targetX;
        this.targetY = opts.target ? opts.target.y : opts.targetY;
        this.damage = opts.damage;
        this.speed = opts.speed;
        this.splash = opts.splash || 0;
        this.color = opts.color || '#ffffff';
        this.slowPercent = opts.slowPercent || 0;
        this.slowDuration = opts.slowDuration || 0;
        this.isCrit = opts.isCrit || false;
        this.burnGround = opts.burnGround || false;
        this.chainTargets = opts.chainTargets || 0;

        // Ballistic trajectory for boulders
        this.isBallistic = opts.isBallistic || false;
        this.totalDistance = Math.hypot(this.targetX - this.startX, this.targetY - this.startY);
        this.distanceCovered = 0;
        this.arcHeight = Math.min(100, this.totalDistance * 0.35);

        this.isFinished = false;
    }

    update(dt, game) {
        if (this.isFinished) return;

        // If target exists and not dead, track dynamic position
        if (this.target && !this.target.isDead) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);
        const step = this.speed * 60 * dt;

        if (this.isBallistic) {
            this.distanceCovered += step;
            const progress = Math.min(1, this.distanceCovered / this.totalDistance);
            this.x = this.startX + (this.targetX - this.startX) * progress;
            this.y = this.startY + (this.targetY - this.startY) * progress;

            if (progress >= 1) {
                this.hit(game);
            }
        } else {
            if (dist <= step) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.hit(game);
            } else {
                this.x += (dx / dist) * step;
                this.y += (dy / dist) * step;
            }
        }
    }

    hit(game) {
        this.isFinished = true;

        if (this.splash > 0) {
            // Area splash damage
            window.soundEngine.play('playExplosion');
            window.particleEngine.addExplosion(this.x, this.y, this.splash, this.color);

            if (this.burnGround) {
                window.particleEngine.addBurnDecal(this.x, this.y, this.splash * 0.9, 4.0);
            }

            for (const enemy of game.enemies) {
                if (enemy.isDead || enemy.reachedEnd) continue;
                const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d <= this.splash) {
                    const falloff = 1 - (d / this.splash) * 0.4;
                    enemy.takeDamage(this.damage * falloff, 'physical', game);
                    if (this.burnGround) {
                        enemy.applyBurn(35, 3.5);
                    }
                }
            }
        } else if (this.type === 'chain') {
            // Chain lightning
            window.soundEngine.play('playArcaneZap');
            window.particleEngine.addArcaneRings(this.x, this.y, '#7209b7');
            let currentTarget = this.target;
            let hits = 0;
            const hitList = new Set();

            while (currentTarget && hits < this.chainTargets) {
                currentTarget.takeDamage(this.damage * Math.pow(0.85, hits), 'magic', game);
                hitList.add(currentTarget);
                hits++;

                // Find next nearest enemy
                let nextTarget = null;
                let minDist = 120;
                for (const e of game.enemies) {
                    if (e.isDead || e.reachedEnd || hitList.has(e)) continue;
                    const d = Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y);
                    if (d < minDist) {
                        minDist = d;
                        nextTarget = e;
                    }
                }
                if (nextTarget) {
                    // Visual spark line
                    window.particleEngine.addSpark((currentTarget.x + nextTarget.x)/2, (currentTarget.y + nextTarget.y)/2, '#b5179e', 8, 3);
                }
                currentTarget = nextTarget;
            }
        } else {
            // Single target hit
            if (this.target && !this.target.isDead) {
                if (this.type === 'arrow') {
                    window.soundEngine.play('playArrowHit');
                    window.particleEngine.addSpark(this.x, this.y, '#ffffff', 4, 1.8);
                    this.target.takeDamage(this.damage, 'physical', game);
                } else if (this.type === 'magic') {
                    window.soundEngine.play('playArcaneZap');
                    window.particleEngine.addArcaneRings(this.x, this.y, this.color);
                    this.target.takeDamage(this.damage, 'magic', game);
                } else if (this.type === 'frost') {
                    window.soundEngine.play('playFrostFreeze');
                    window.particleEngine.addFrostBurst(this.x, this.y, 25);
                    this.target.takeDamage(this.damage, 'magic', game);
                    this.target.applySlow(this.slowPercent, this.slowDuration);
                }
            }
        }
    }

    draw(ctx) {
        if (this.isFinished) return;

        ctx.save();
        if (this.isBallistic) {
            const progress = Math.min(1, this.distanceCovered / this.totalDistance);
            const currentArc = Math.sin(progress * Math.PI) * this.arcHeight;

            // Draw ground shadow
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, 8, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fill();

            // Draw flying boulder
            ctx.beginPath();
            ctx.arc(this.x, this.y - currentArc, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#e76f51';
            ctx.fill();
            ctx.strokeStyle = '#264653';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Fire sparks trailing behind
            if (Math.random() < 0.4) {
                window.particleEngine.addSpark(this.x, this.y - currentArc, '#ffb703', 1, 1);
            }
        } else if (this.type === 'arrow') {
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.strokeStyle = '#e0a96d';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();

            // Arrow head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(3, -3);
            ctx.lineTo(3, 3);
            ctx.fill();
        } else {
            // Magic or Frost orb
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
        }
        ctx.restore();
    }
}

class Tower {
    constructor(slot, typeId, game) {
        this.slot = slot;
        this.x = slot.x;
        this.y = slot.y;
        this.typeId = typeId;
        this.config = TOWER_DATA[typeId];

        this.level = 1;
        this.branch = null; // 'sniper', 'elven', etc.
        this.targetPriority = 'first'; // 'first', 'last', 'strongest', 'weakest', 'closest'

        this.damage = this.config.damage;
        this.range = this.config.range;
        this.rate = this.config.rate;
        this.splash = this.config.splash || 0;
        this.slowPercent = this.config.slowPercent || 0;
        this.slowDuration = this.config.slowDuration || 0;
        this.critChance = 0;
        this.critMulti = 2.0;

        this.cooldownTimer = 0;
        this.totalSpent = this.config.cost;
        this.kills = 0;
        this.damageDealt = 0;

        // Visual effects
        this.targetAngle = 0;
        this.beamTarget = null;
        this.pulseTime = 0;

        // Apply Armory Perks
        if (game.perks.archerDmg && typeId === 'archer') {
            this.damage *= (1 + game.perks.archerDmg);
            this.range *= (1 + game.perks.archerRange);
        }
        if (game.perks.splashRadiusBonus && typeId === 'catapult') {
            this.splash *= (1 + game.perks.splashRadiusBonus);
        }
        if (game.perks.frostSlowBonus && typeId === 'frost') {
            this.slowPercent = Math.min(0.85, this.slowPercent + game.perks.frostSlowBonus);
        }

        // Spawn Soldiers if Paladin Sanctum
        this.soldiers = [];
        if (typeId === 'paladin') {
            this.spawnSoldiers(game);
        }
    }

    spawnSoldiers(game) {
        // Find nearest path point to station defenders
        let nearestPathPoint = game.currentMap.path[0];
        let minDist = Infinity;
        for (const pt of game.currentMap.path) {
            const d = Math.hypot(pt.x - this.x, pt.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearestPathPoint = pt;
            }
        }
        const count = this.branch === 'inquisitor' ? 3 : 2;
        for (let i = 0; i < count; i++) {
            const soldier = new Soldier(nearestPathPoint.x, nearestPathPoint.y, this.level);
            this.soldiers.push(soldier);
            game.soldiers.push(soldier);
        }
    }

    upgrade(branchChoice = null, game) {
        if (branchChoice) {
            // Specializing into branch
            const branchData = this.config.branches[branchChoice];
            if (!branchData || game.gold < branchData.cost) return false;

            game.gold -= branchData.cost;
            this.totalSpent += branchData.cost;
            this.branch = branchChoice;
            this.damage = branchData.damage;
            this.range = branchData.range;
            this.rate = branchData.rate;
            if (branchData.splash) this.splash = branchData.splash;
            if (branchData.critChance) this.critChance = branchData.critChance;
            if (branchData.critMulti) this.critMulti = branchData.critMulti;
            if (branchData.slowPercent) this.slowPercent = branchData.slowPercent;

            window.soundEngine.play('playUpgrade');
            window.particleEngine.addArcaneRings(this.x, this.y, branchData.color);
            window.particleEngine.addFloatingText('MASTERED!', this.x, this.y - 25, '#ffd166', 15, true);
            return true;
        } else if (this.level < 3) {
            // Level 2 or 3 standard upgrade
            const nextLvlData = this.config.upgrades[this.level - 1];
            if (!nextLvlData || game.gold < nextLvlData.cost) return false;

            game.gold -= nextLvlData.cost;
            this.totalSpent += nextLvlData.cost;
            this.level++;
            this.damage = nextLvlData.damage;
            this.range = nextLvlData.range;
            this.rate = nextLvlData.rate;
            if (nextLvlData.splash) this.splash = nextLvlData.splash;
            if (nextLvlData.slowPercent) this.slowPercent = nextLvlData.slowPercent;
            if (nextLvlData.critChance) this.critChance = nextLvlData.critChance;

            // Upgrade stationed soldiers if Paladin
            for (const s of this.soldiers) {
                s.level = this.level;
                s.maxHp += 200;
                s.hp = s.maxHp;
                s.damage += 22;
            }

            window.soundEngine.play('playUpgrade');
            window.particleEngine.addArcaneRings(this.x, this.y, '#00b4d8');
            window.particleEngine.addFloatingText(`LEVEL ${this.level}!`, this.x, this.y - 25, '#ffd166', 15, true);
            return true;
        }
        return false;
    }

    sell(game) {
        const refund = Math.round(this.totalSpent * 0.7);
        game.gold += refund;
        window.soundEngine.play('playCoin');
        window.particleEngine.addFloatingText(`+${refund}g`, this.x, this.y, '#ffd166', 14);

        // Remove linked soldiers
        for (const s of this.soldiers) {
            s.isDead = true;
            const idx = game.soldiers.indexOf(s);
            if (idx !== -1) game.soldiers.splice(idx, 1);
        }
        return refund;
    }

    update(dt, game) {
        this.cooldownTimer -= dt;
        this.pulseTime += dt * 3;

        // Disintegrator Continuous Beam logic
        if (this.branch === 'disintegrator' && this.beamTarget && !this.beamTarget.isDead && Math.hypot(this.beamTarget.x - this.x, this.beamTarget.y - this.y) <= this.range) {
            const dps = this.damage * dt;
            this.beamTarget.takeDamage(dps, 'magic', game, false);
            this.damageDealt += dps;
            if (Math.random() < 0.25) {
                window.particleEngine.addSpark(this.beamTarget.x, this.beamTarget.y, '#d90429', 2, 2.5);
            }
            return;
        } else {
            this.beamTarget = null;
        }

        // Paladins don't shoot ranged projectiles directly
        if (this.typeId === 'paladin') return;

        // Find candidate targets in range
        const inRange = [];
        for (const enemy of game.enemies) {
            if (enemy.isDead || enemy.reachedEnd) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range) {
                inRange.push({ enemy, dist });
            }
        }

        if (inRange.length === 0) return;

        // Sort by chosen priority rule
        if (this.targetPriority === 'first') {
            inRange.sort((a, b) => b.enemy.distanceTraveled - a.enemy.distanceTraveled);
        } else if (this.targetPriority === 'last') {
            inRange.sort((a, b) => a.enemy.distanceTraveled - b.enemy.distanceTraveled);
        } else if (this.targetPriority === 'strongest') {
            inRange.sort((a, b) => b.enemy.hp - a.enemy.hp);
        } else if (this.targetPriority === 'weakest') {
            inRange.sort((a, b) => a.enemy.hp - b.enemy.hp);
        } else if (this.targetPriority === 'closest') {
            inRange.sort((a, b) => a.dist - b.dist);
        }

        const primaryTarget = inRange[0].enemy;
        this.targetAngle = Math.atan2(primaryTarget.y - this.y, primaryTarget.x - this.x);

        // Continuous beam assignment
        if (this.branch === 'disintegrator') {
            this.beamTarget = primaryTarget;
            return;
        }

        // Check if ready to fire
        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = 1 / this.rate;
            this.shoot(primaryTarget, game);
        }
    }

    shoot(target, game) {
        let isCrit = false;
        let finalDamage = this.damage;
        if (this.critChance > 0 && Math.random() < this.critChance) {
            isCrit = true;
            finalDamage *= this.critMulti;
        }

        if (this.typeId === 'archer') {
            window.soundEngine.play('playArrowShoot');
            if (this.branch === 'elven') {
                // Triple burst arrows
                for (let i = -1; i <= 1; i++) {
                    setTimeout(() => {
                        if (!target || target.isDead) return;
                        game.projectiles.push(new Projectile({
                            type: 'arrow',
                            x: this.x,
                            y: this.y,
                            target: target,
                            damage: finalDamage,
                            speed: this.config.bulletSpeed,
                            isCrit
                        }));
                    }, (i + 1) * 70);
                }
            } else {
                game.projectiles.push(new Projectile({
                    type: 'arrow',
                    x: this.x,
                    y: this.y,
                    target: target,
                    damage: finalDamage,
                    speed: this.config.bulletSpeed,
                    isCrit
                }));
            }
        } else if (this.typeId === 'mage') {
            if (this.branch === 'chain') {
                game.projectiles.push(new Projectile({
                    type: 'chain',
                    x: this.x,
                    y: this.y,
                    target: target,
                    damage: finalDamage,
                    speed: 12,
                    chainTargets: 4,
                    color: '#9d4edd'
                }));
            } else {
                window.soundEngine.play('playArcaneZap');
                game.projectiles.push(new Projectile({
                    type: 'magic',
                    x: this.x,
                    y: this.y,
                    target: target,
                    damage: finalDamage,
                    speed: this.config.bulletSpeed,
                    color: this.config.color,
                    isCrit
                }));
            }
        } else if (this.typeId === 'catapult') {
            game.projectiles.push(new Projectile({
                type: 'boulder',
                x: this.x,
                y: this.y,
                target: null,
                targetX: target.x,
                targetY: target.y,
                damage: finalDamage,
                speed: this.config.bulletSpeed,
                splash: this.splash,
                isBallistic: true,
                burnGround: this.branch === 'napalm' || this.level === 3,
                color: '#e76f51'
            }));
        } else if (this.typeId === 'frost') {
            if (this.branch === 'blizzard') {
                // Instant Blizzard Freeze AoE
                window.soundEngine.play('playFrostFreeze');
                window.particleEngine.addFrostBurst(this.x, this.y, this.range);
                for (const e of game.enemies) {
                    if (e.isDead || e.reachedEnd) continue;
                    if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) {
                        e.applyFreeze(2.0);
                        e.takeDamage(finalDamage, 'magic', game);
                    }
                }
            } else {
                game.projectiles.push(new Projectile({
                    type: 'frost',
                    x: this.x,
                    y: this.y,
                    target: target,
                    damage: finalDamage,
                    speed: this.config.bulletSpeed,
                    slowPercent: this.slowPercent,
                    slowDuration: this.slowDuration,
                    color: '#a0c4ff'
                }));
            }
        }
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Selection / Range Circle
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(72, 202, 228, 0.12)';
            ctx.fill();
            ctx.strokeStyle = '#48cae4';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Stone Base Foundation
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#2b2d42';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffd166' : '#8d99ae';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Tower Inner Body
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.config.color;
        ctx.fill();
        ctx.strokeStyle = '#1b263b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tower Icon
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, 0, 0);

        // Level Badges (Stars)
        for (let i = 0; i < this.level; i++) {
            const starOffset = (i - (this.level - 1) / 2) * 8;
            ctx.fillStyle = this.branch ? '#ff0054' : '#ffd166';
            ctx.beginPath();
            ctx.arc(starOffset, -22, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw Disintegrator Death Ray
        if (this.beamTarget && !this.beamTarget.isDead) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 12);
            ctx.lineTo(this.beamTarget.x, this.beamTarget.y);
            ctx.strokeStyle = '#d90429';
            ctx.lineWidth = 3 + Math.sin(this.pulseTime) * 1.5;
            ctx.shadowColor = '#ff4d6d';
            ctx.shadowBlur = 10;
            ctx.stroke();

            // Inner white core
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 12);
            ctx.lineTo(this.beamTarget.x, this.beamTarget.y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }
    }
}
