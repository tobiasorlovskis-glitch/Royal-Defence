/**
 * SIEGE OF ELDORIA - UI MANAGER
 * Handles HUD bindings, modals (Bestiary, Armory, Level Select),
 * Tower build menu, upgrade inspections, spell dock, and audio controls.
 */

class UIManager {
    constructor(game) {
        this.game = game;

        // Elements
        this.goldEl = document.getElementById('hudGold');
        this.livesEl = document.getElementById('hudLives');
        this.manaEl = document.getElementById('hudMana');
        this.manaBarEl = document.getElementById('hudManaBarFill');
        this.waveEl = document.getElementById('hudWave');
        this.scoreEl = document.getElementById('hudScore');
        this.starsEl = document.getElementById('hudStars');

        // Selection Panels
        this.buildMenuEl = document.getElementById('buildMenuPanel');
        this.inspectPanelEl = document.getElementById('towerInspectPanel');

        // Modals
        this.codexModal = document.getElementById('codexModal');
        this.armoryModal = document.getElementById('armoryModal');
        this.mapModal = document.getElementById('mapSelectModal');
        this.endgameModal = document.getElementById('endgameModal');
        this.bossBannerEl = document.getElementById('bossAlertBanner');

        // Toasts
        this.toastContainer = document.getElementById('toastContainer');

        this.initUI();
    }

    initUI() {
        // Next Wave button
        const nextWaveBtn = document.getElementById('btnNextWave');
        if (nextWaveBtn) {
            nextWaveBtn.addEventListener('click', () => {
                if (!this.game.waveActive) {
                    this.game.startNextWave();
                }
            });
        }

        // Call Early button
        const callEarlyBtn = document.getElementById('btnCallEarly');
        if (callEarlyBtn) {
            callEarlyBtn.addEventListener('click', () => {
                this.game.callWaveEarly();
            });
        }

        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = parseFloat(btn.dataset.speed);
                this.game.setSpeed(spd);
            });
        });

        // Pause button
        const pauseBtn = document.getElementById('btnPause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.game.togglePause();
            });
        }

        // Spell buttons
        document.querySelectorAll('.spell-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spellId = btn.dataset.spell;
                this.game.castSpell(spellId);
            });
        });

        // Top Navigation Modal Triggers
        document.getElementById('btnOpenCodex')?.addEventListener('click', () => this.openCodex());
        document.getElementById('btnOpenArmory')?.addEventListener('click', () => this.openArmory());
        document.getElementById('btnOpenMaps')?.addEventListener('click', () => this.openMapSelect());

        // Audio controls
        const musicToggle = document.getElementById('toggleMusic');
        if (musicToggle) {
            musicToggle.addEventListener('change', (e) => {
                window.soundEngine.toggleMusic(e.target.checked);
            });
        }

        const sfxVol = document.getElementById('sfxVolume');
        if (sfxVol) {
            sfxVol.addEventListener('input', (e) => {
                window.soundEngine.sfxVolume = parseFloat(e.target.value);
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay').classList.add('hidden');
            });
        });

        this.renderBuildMenuItems();
        this.updateHUD();
    }

    updateHUD() {
        if (this.goldEl) this.goldEl.textContent = Math.round(this.game.gold);
        if (this.livesEl) this.livesEl.textContent = this.game.lives;
        if (this.manaEl) this.manaEl.textContent = `${Math.round(this.game.mana)} / ${this.game.maxMana}`;
        if (this.manaBarEl) {
            const pct = Math.max(0, Math.min(100, (this.game.mana / this.game.maxMana) * 100));
            this.manaBarEl.style.width = `${pct}%`;
        }
        if (this.waveEl) this.waveEl.textContent = `${this.game.currentWave} / ${this.game.totalWaves}`;
        if (this.scoreEl) this.scoreEl.textContent = this.game.score;
        if (this.starsEl) this.starsEl.textContent = this.game.stars;

        // Wave button state
        const nextWaveBtn = document.getElementById('btnNextWave');
        const callEarlyBtn = document.getElementById('btnCallEarly');
        if (nextWaveBtn && callEarlyBtn) {
            if (this.game.waveActive) {
                nextWaveBtn.disabled = true;
                nextWaveBtn.classList.add('disabled');
                callEarlyBtn.disabled = true;
                callEarlyBtn.classList.add('disabled');
            } else {
                nextWaveBtn.disabled = false;
                nextWaveBtn.classList.remove('disabled');
                callEarlyBtn.disabled = false;
                callEarlyBtn.classList.remove('disabled');
            }
        }

        // Update Spells UI
        for (const spellId in this.game.spellCooldowns) {
            const cd = this.game.spellCooldowns[spellId];
            const btn = document.querySelector(`.spell-btn[data-spell="${spellId}"]`);
            if (btn) {
                const overlay = btn.querySelector('.cooldown-overlay');
                const cdText = btn.querySelector('.cd-text');
                const spellData = HERO_SPELLS_DATA[spellId];

                if (cd > 0) {
                    btn.classList.add('on-cooldown');
                    if (overlay) overlay.style.height = `${(cd / spellData.cooldown) * 100}%`;
                    if (cdText) cdText.textContent = Math.ceil(cd);
                } else {
                    btn.classList.remove('on-cooldown');
                    if (overlay) overlay.style.height = '0%';
                    if (cdText) cdText.textContent = '';
                }

                // Check mana sufficiency
                if (this.game.mana < spellData.costMana) {
                    btn.classList.add('low-mana');
                } else {
                    btn.classList.remove('low-mana');
                }
            }
        }
    }

    renderBuildMenuItems() {
        const grid = document.getElementById('buildMenuGrid');
        if (!grid) return;
        grid.innerHTML = '';

        for (const key in TOWER_DATA) {
            const tower = TOWER_DATA[key];
            const item = document.createElement('div');
            item.className = 'build-card';
            item.innerHTML = `
                <div class="card-icon" style="color: ${tower.color}">${tower.icon}</div>
                <div class="card-details">
                    <div class="card-name">${tower.name}</div>
                    <div class="card-role">${tower.role}</div>
                    <div class="card-cost">🪙 ${tower.cost}g</div>
                </div>
            `;
            item.addEventListener('click', () => {
                if (this.game.selectedSlot) {
                    this.game.buildTower(this.game.selectedSlot, key);
                }
            });
            grid.appendChild(item);
        }
    }

    showBuildWheel(slot) {
        if (!this.buildMenuEl) return;
        this.hideSelectionPanels();
        this.buildMenuEl.classList.remove('hidden');

        // Check which items player can afford
        document.querySelectorAll('.build-card').forEach((card, idx) => {
            const towerKeys = Object.keys(TOWER_DATA);
            const t = TOWER_DATA[towerKeys[idx]];
            if (this.game.gold < t.cost) {
                card.classList.add('unaffordable');
            } else {
                card.classList.remove('unaffordable');
            }
        });
    }

    showTowerInspectPanel(tower) {
        if (!this.inspectPanelEl) return;
        this.hideSelectionPanels();
        this.inspectPanelEl.classList.remove('hidden');

        document.getElementById('inspectTowerIcon').textContent = tower.config.icon;
        document.getElementById('inspectTowerName').textContent = tower.branch ? tower.config.branches[tower.branch].name : `${tower.config.name} (Lvl ${tower.level})`;
        document.getElementById('inspectTowerDamage').textContent = Math.round(tower.damage);
        document.getElementById('inspectTowerRange').textContent = Math.round(tower.range);
        document.getElementById('inspectTowerRate').textContent = `${tower.rate.toFixed(2)} /s`;
        document.getElementById('inspectTowerKills').textContent = tower.kills;

        // Target Priority dropdown
        const prioritySelect = document.getElementById('selectTargetPriority');
        if (prioritySelect) {
            prioritySelect.value = tower.targetPriority;
            prioritySelect.onchange = (e) => {
                tower.targetPriority = e.target.value;
            };
        }

        // Upgrade Actions Container
        const actionsContainer = document.getElementById('inspectUpgradeActions');
        actionsContainer.innerHTML = '';

        if (!tower.branch && tower.level < 3) {
            // Standard level upgrade
            const nextLvl = tower.config.upgrades[tower.level - 1];
            const upgBtn = document.createElement('button');
            upgBtn.className = `btn-primary action-btn ${this.game.gold < nextLvl.cost ? 'disabled' : ''}`;
            upgBtn.innerHTML = `⭐ Upgrade to Lvl ${tower.level + 1} (🪙 ${nextLvl.cost}g)`;
            upgBtn.onclick = () => {
                if (tower.upgrade(null, this.game)) {
                    this.showTowerInspectPanel(tower);
                } else {
                    this.showToast('Insufficient Gold!', 'error');
                }
            };
            actionsContainer.appendChild(upgBtn);
        } else if (!tower.branch && tower.level === 3) {
            // Level 3 Branch Specializations
            const branchTitle = document.createElement('div');
            branchTitle.className = 'branch-title';
            branchTitle.textContent = 'Choose Master Specialization:';
            actionsContainer.appendChild(branchTitle);

            const branchesGrid = document.createElement('div');
            branchesGrid.className = 'branches-grid';

            for (const bKey in tower.config.branches) {
                const b = tower.config.branches[bKey];
                const bBtn = document.createElement('button');
                bBtn.className = `branch-btn ${this.game.gold < b.cost ? 'disabled' : ''}`;
                bBtn.innerHTML = `
                    <div class="branch-btn-name">${b.name}</div>
                    <div class="branch-btn-special">${b.special}</div>
                    <div class="branch-btn-cost">🪙 ${b.cost}g</div>
                `;
                bBtn.onclick = () => {
                    if (tower.upgrade(bKey, this.game)) {
                        this.showTowerInspectPanel(tower);
                    } else {
                        this.showToast('Insufficient Gold!', 'error');
                    }
                };
                branchesGrid.appendChild(bBtn);
            }
            actionsContainer.appendChild(branchesGrid);
        } else {
            // Already at max branch
            const maxLabel = document.createElement('div');
            maxLabel.className = 'max-mastery-label';
            maxLabel.innerHTML = '✨ Maximum Mastery Reached';
            actionsContainer.appendChild(maxLabel);
        }

        // Sell Button
        const refund = Math.round(tower.totalSpent * 0.7);
        const sellBtn = document.createElement('button');
        sellBtn.className = 'btn-danger action-btn';
        sellBtn.innerHTML = `🪙 Dismantle Tower (+${refund}g Refund)`;
        sellBtn.onclick = () => {
            this.game.sellTower(tower);
        };
        actionsContainer.appendChild(sellBtn);
    }

    hideSelectionPanels() {
        if (this.buildMenuEl) this.buildMenuEl.classList.add('hidden');
        if (this.inspectPanelEl) this.inspectPanelEl.classList.add('hidden');
    }

    setActiveSpell(spellId) {
        document.querySelectorAll('.spell-btn').forEach(btn => {
            if (btn.dataset.spell === spellId) {
                btn.classList.add('targeting-active');
            } else {
                btn.classList.remove('targeting-active');
            }
        });
    }

    clearActiveSpell() {
        document.querySelectorAll('.spell-btn').forEach(btn => {
            btn.classList.remove('targeting-active');
        });
    }

    updatePauseState(isPaused) {
        const pauseBtn = document.getElementById('btnPause');
        if (pauseBtn) {
            pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
            pauseBtn.classList.toggle('active', isPaused);
        }
        this.showToast(isPaused ? 'Battle Paused (Press Space to Resume)' : 'Battle Resumed', 'info');
    }

    updateSpeedButtons(speed) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            const btnSpeed = parseFloat(btn.dataset.speed);
            btn.classList.toggle('active', btnSpeed === speed);
        });
    }

    showBossBanner(title) {
        if (!this.bossBannerEl) return;
        this.bossBannerEl.textContent = `⚔️ ${title.toUpperCase()} ⚔️`;
        this.bossBannerEl.classList.remove('hidden');
        this.bossBannerEl.classList.add('banner-pulse');

        setTimeout(() => {
            this.bossBannerEl.classList.add('hidden');
            this.bossBannerEl.classList.remove('banner-pulse');
        }, 4000);
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `game-toast toast-${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 2600);
    }

    openCodex() {
        if (!this.codexModal) return;
        this.codexModal.classList.remove('hidden');
        this.renderCodexTowers();
        this.renderCodexBestiary();
    }

    renderCodexTowers() {
        const container = document.getElementById('codexTowersContainer');
        if (!container) return;
        container.innerHTML = '';

        for (const k in TOWER_DATA) {
            const t = TOWER_DATA[k];
            const card = document.createElement('div');
            card.className = 'codex-card';
            card.innerHTML = `
                <div class="codex-header">
                    <span class="codex-icon">${t.icon}</span>
                    <div>
                        <h4>${t.name}</h4>
                        <span class="role-pill">${t.role}</span>
                    </div>
                </div>
                <p class="codex-lore">${t.lore}</p>
                <div class="codex-stats">
                    <div>Damage: <b>${t.damage}</b></div>
                    <div>Range: <b>${t.range}</b></div>
                    <div>Cost: <b>🪙 ${t.cost}g</b></div>
                </div>
            `;
            container.appendChild(card);
        }
    }

    renderCodexBestiary() {
        const container = document.getElementById('codexBestiaryContainer');
        if (!container) return;
        container.innerHTML = '';

        for (const k in ENEMY_DATA) {
            const e = ENEMY_DATA[k];
            const card = document.createElement('div');
            card.className = `codex-card ${e.isBoss ? 'boss-card' : ''}`;
            card.innerHTML = `
                <div class="codex-header">
                    <span class="codex-icon">${e.icon}</span>
                    <div>
                        <h4>${e.name} ${e.isBoss ? '👑 (BOSS)' : ''}</h4>
                        <span class="role-pill">${e.isFlying ? 'Flying Wyrm' : 'Ground Infantry'}</span>
                    </div>
                </div>
                <p class="codex-lore">${e.desc}</p>
                <div class="codex-stats">
                    <div>Base HP: <b>${e.hp}</b></div>
                    <div>Speed: <b>${e.speed.toFixed(1)}</b></div>
                    <div>Armor: <b>${Math.round(e.armor * 100)}%</b></div>
                    <div>Magic Res: <b>${Math.round(e.magicResist * 100)}%</b></div>
                    <div>Bounty: <b>🪙 ${e.gold}g</b></div>
                </div>
            `;
            container.appendChild(card);
        }
    }

    openArmory() {
        if (!this.armoryModal) return;
        this.armoryModal.classList.remove('hidden');

        document.getElementById('armoryAvailableStars').textContent = this.game.stars;
        const grid = document.getElementById('armoryPerksGrid');
        grid.innerHTML = '';

        for (const perk of ARMORY_PERKS) {
            const isUnlocked = this.game.unlockedPerks.includes(perk.id);
            const canAfford = this.game.stars >= perk.costStars;

            const card = document.createElement('div');
            card.className = `armory-card ${isUnlocked ? 'unlocked' : (canAfford ? 'purchasable' : 'locked')}`;
            card.innerHTML = `
                <div class="armory-icon">${perk.icon}</div>
                <div class="armory-name">${perk.name}</div>
                <div class="armory-desc">${perk.desc}</div>
                <div class="armory-action">
                    ${isUnlocked 
                        ? '<span class="badge-unlocked">✓ Activated</span>' 
                        : `<button class="btn-primary btn-sm ${canAfford ? '' : 'disabled'}">⭐ Unlock (${perk.costStars} Stars)</button>`
                    }
                </div>
            `;

            if (!isUnlocked) {
                const btn = card.querySelector('button');
                btn.onclick = () => {
                    if (this.game.stars >= perk.costStars) {
                        this.game.stars -= perk.costStars;
                        this.game.unlockedPerks.push(perk.id);
                        localStorage.setItem('eldoria_stars', this.game.stars);
                        localStorage.setItem('eldoria_perks', JSON.stringify(this.game.unlockedPerks));
                        this.game.perks = this.game.calculatePerks();
                        window.soundEngine.play('playUpgrade');
                        this.showToast(`${perk.name} Activated!`, 'success');
                        this.openArmory();
                        this.updateHUD();
                    }
                };
            }
            grid.appendChild(card);
        }
    }

    openMapSelect() {
        if (!this.mapModal) return;
        this.mapModal.classList.remove('hidden');

        const list = document.getElementById('mapSelectList');
        list.innerHTML = '';

        MAP_CONFIGS.forEach((map, idx) => {
            const item = document.createElement('div');
            item.className = `map-select-item ${idx === this.game.currentMapIndex ? 'active-map' : ''}`;
            item.innerHTML = `
                <div class="map-info">
                    <h4>${map.title}</h4>
                    <span class="diff-badge diff-${map.difficulty.toLowerCase()}">${map.difficulty}</span>
                    <p>${map.description}</p>
                    <div class="map-meta">Waves: <b>${map.totalWaves}</b> | Starting Gold: <b>🪙 ${map.startGold}g</b></div>
                </div>
                <button class="btn-primary ${idx === this.game.currentMapIndex ? 'btn-active' : ''}">
                    ${idx === this.game.currentMapIndex ? 'Currently Playing' : 'Deploy Here'}
                </button>
            `;
            item.querySelector('button').onclick = () => {
                if (idx !== this.game.currentMapIndex) {
                    this.game.loadMap(idx);
                    this.mapModal.classList.add('hidden');
                    this.showToast(`Deployed to ${map.title}!`, 'info');
                }
            };
            list.appendChild(item);
        });
    }

    showEndgameModal(isVictory, stars, score) {
        if (!this.endgameModal) return;
        this.endgameModal.classList.remove('hidden');

        const title = document.getElementById('endgameTitle');
        const desc = document.getElementById('endgameDesc');
        const starsContainer = document.getElementById('endgameStars');
        const scoreVal = document.getElementById('endgameScore');

        if (isVictory) {
            title.textContent = '👑 VICTORY FOR THE REALM! 👑';
            title.className = 'endgame-title victory';
            desc.textContent = 'The invaders have been broken upon the battlements of Eldoria!';
            starsContainer.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        } else {
            title.textContent = '💀 DEFEAT - THE GATE HAS FALLEN 💀';
            title.className = 'endgame-title defeat';
            desc.textContent = 'The defenses collapsed before the merciless horde. Rally your troops and try again!';
            starsContainer.innerHTML = '☆☆☆';
        }

        scoreVal.textContent = score;

        document.getElementById('btnEndgameRestart').onclick = () => {
            this.endgameModal.classList.add('hidden');
            this.game.restart();
        };

        document.getElementById('btnEndgameMaps').onclick = () => {
            this.endgameModal.classList.add('hidden');
            this.openMapSelect();
        };
    }
}
