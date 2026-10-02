/**
 * SIEGE OF ELDORIA - PARTICLE & COMBAT FX SYSTEM
 * Handles explosions, sparks, smoke, runes, floating combat numbers, and spell effects.
 */

class ParticleEngine {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.groundDecals = [];
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.groundDecals = [];
    }

    addSpark(x, y, color = '#ffd166', count = 6, speed = 2.5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = (Math.random() * 0.7 + 0.3) * speed;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color,
                size: Math.random() * 2.5 + 1.5,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02,
                type: 'spark'
            });
        }
    }

    addExplosion(x, y, radius = 40, color = '#e76f51') {
        // Shockwave ring
        this.particles.push({
            x,
            y,
            radius: 5,
            maxRadius: radius,
            color: '#ffbe0b',
            alpha: 0.9,
            decay: 0.05,
            type: 'shockwave'
        });

        // Fire embers
        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (radius * 0.85);
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x + Math.cos(angle) * (dist * 0.3),
                y: y + Math.sin(angle) * (dist * 0.3),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                color: i % 2 === 0 ? '#d00000' : (i % 3 === 0 ? '#ffba08' : '#e85d04'),
                size: Math.random() * 4 + 3,
                alpha: 1,
                decay: Math.random() * 0.035 + 0.02,
                type: 'smoke'
            });
        }

        // Smoke puffs
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.5 + 0.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.8,
                color: 'rgba(80, 80, 80, 0.6)',
                size: Math.random() * 8 + 6,
                alpha: 0.7,
                decay: 0.015,
                type: 'smoke'
            });
        }
    }

    addFrostBurst(x, y, radius = 35) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? '#e0fbfc' : '#90e0ef',
                size: Math.random() * 3 + 2,
                alpha: 1,
                decay: 0.03,
                type: 'spark'
            });
        }
    }

    addArcaneRings(x, y, color = '#b5179e') {
        this.particles.push({
            x,
            y,
            radius: 2,
            maxRadius: 38,
            color,
            alpha: 1,
            decay: 0.04,
            type: 'shockwave'
        });
    }

    addBurnDecal(x, y, radius = 45, duration = 4.0) {
        this.groundDecals.push({
            x,
            y,
            radius,
            duration,
            maxDuration: duration,
            color: 'rgba(230, 57, 70, 0.45)'
        });
    }

    addFloatingText(text, x, y, color = '#ffffff', fontSize = 14, isCrit = false) {
        this.floatingTexts.push({
            text,
            x: x + (Math.random() * 16 - 8),
            y: y - 10,
            vy: isCrit ? -1.8 : -1.2,
            color,
            fontSize: isCrit ? fontSize * 1.35 : fontSize,
            alpha: 1,
            decay: 0.022,
            isCrit
        });
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'shockwave') {
                p.radius += (p.maxRadius - p.radius) * 0.15;
                p.alpha -= p.decay;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;
                if (p.type === 'smoke') {
                    p.size += 0.2;
                }
            }
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= ft.decay;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update ground decals
        for (let i = this.groundDecals.length - 1; i >= 0; i--) {
            const gd = this.groundDecals[i];
            gd.duration -= dt;
            if (gd.duration <= 0) {
                this.groundDecals.splice(i, 1);
            }
        }
    }

    drawGroundDecals(ctx) {
        for (const gd of this.groundDecals) {
            const ratio = Math.max(0, gd.duration / gd.maxDuration);
            ctx.save();
            ctx.beginPath();
            ctx.arc(gd.x, gd.y, gd.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(230, 57, 70, ${ratio * 0.35})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 183, 3, ${ratio * 0.7})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sizzling embers
            if (Math.random() < 0.25) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * gd.radius;
                this.addSpark(gd.x + Math.cos(angle) * r, gd.y + Math.sin(angle) * r, '#ffb703', 1, 0.5);
            }
            ctx.restore();
        }
    }

    draw(ctx) {
        // Draw Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            if (p.type === 'shockwave') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw Floating Texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `${ft.isCrit ? '900' : 'bold'} ${Math.round(ft.fontSize)}px 'Cinzel', serif`;
            ctx.textAlign = 'center';
            // Dark outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            // Main text
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }
}

window.particleEngine = new ParticleEngine();
