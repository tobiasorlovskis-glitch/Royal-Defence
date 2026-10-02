/**
 * SIEGE OF ELDORIA - PROCEDURAL AUDIO ENGINE
 * Generates all medieval fantasy sound effects and ambient orchestral battle music
 * using pure Web Audio API without any external sound dependencies.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.4;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.notes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440]; // A Minor / Dorian
        this.musicStep = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(fnName, ...args) {
        if (this.isMuted) return;
        try {
            this.init();
            if (this[fnName]) {
                this[fnName](...args);
            }
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    // --- SOUND EFFECTS ---

    playArrowShoot() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playArrowHit() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playArcaneZap() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.22);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playExplosion() {
        const now = this.ctx.currentTime;
        // Low rumble sine
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        oscGain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        whiteNoise.start(now);
    }

    playFrostFreeze() {
        const now = this.ctx.currentTime;
        const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.25);
        });
    }

    playSwordClash() {
        const now = this.ctx.currentTime;
        [1100, 1550, 2200].forEach((f) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        });
    }

    playBuild() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playUpgrade() {
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.18);
        });
    }

    playCoin() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playWarHorn() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(196, now); // G3
        osc.frequency.linearRampToValueAtTime(220, now + 0.3); // A3
        osc.frequency.linearRampToValueAtTime(293.66, now + 0.7); // D4
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    playMeteorSpell() {
        const now = this.ctx.currentTime;
        // Descending whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        setTimeout(() => this.playExplosion(), 550);
    }

    playVictory() {
        const now = this.ctx.currentTime;
        const chordProgression = [
            [261.63, 329.63, 392.00], // C
            [293.66, 369.99, 440.00], // D
            [329.63, 415.30, 493.88], // E
            [523.25, 659.25, 783.99]  // High C
        ];
        chordProgression.forEach((chord, i) => {
            chord.forEach(f => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + i * 0.22);
                gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + i * 0.22);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.5);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.22);
                osc.stop(now + i * 0.22 + 0.55);
            });
        });
    }

    playDefeat() {
        const now = this.ctx.currentTime;
        const notes = [220, 207.65, 196, 185]; // A -> G# -> G -> F#
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + idx * 0.35);
            gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + idx * 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.35 + 0.6);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.35);
            osc.stop(now + idx * 0.35 + 0.65);
        });
    }

    // --- PROCEDURAL AMBIENT MUSIC ENGINE ---
    toggleMusic(enabled) {
        this.isMusicPlaying = enabled;
        if (enabled) {
            this.init();
            this.scheduleMusicStep();
        } else {
            if (this.musicTimer) {
                clearTimeout(this.musicTimer);
                this.musicTimer = null;
            }
        }
    }

    scheduleMusicStep() {
        if (!this.isMusicPlaying || this.isMuted) return;
        try {
            const now = this.ctx.currentTime;
            // Play ambient lute / harp plucked note
            const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]; // A Dorian
            const bass = [110, 130.81, 146.83, 164.81];

            // Drone chord every 8 steps
            if (this.musicStep % 8 === 0) {
                const bassNote = bass[Math.floor((this.musicStep / 8) % bass.length)];
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(bassNote, now);
                gain.gain.setValueAtTime(0.12 * this.musicVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 3.3);
            }

            // Arpeggio melody note
            const melodyNote = scale[Math.floor(Math.random() * scale.length)];
            const oscM = this.ctx.createOscillator();
            const gainM = this.ctx.createGain();
            oscM.type = 'sine';
            oscM.frequency.setValueAtTime(melodyNote, now);
            gainM.gain.setValueAtTime(0.08 * this.musicVolume, now);
            gainM.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            oscM.connect(gainM);
            gainM.connect(this.ctx.destination);
            oscM.start(now);
            oscM.stop(now + 0.48);

            this.musicStep++;
            this.musicTimer = setTimeout(() => this.scheduleMusicStep(), 400);
        } catch (e) {
            // handle audio suspension
        }
    }
}

// Global instance
window.soundEngine = new SoundEngine();
