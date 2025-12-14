/**
 * BUBBLE ATTACK - Gestore Audio
 * 
 * Sistema audio completo:
 * - Musica di sottofondo
 * - Effetti sonori
 * - Audio 3D spaziale
 * - Controllo volume
 */

export class GestoreAudio {
    constructor(scene) {
        this.scene = scene;

        // Stato audio
        this.abilitato = true;
        this.musicaAbilitata = true;
        this.effettiAbilitati = true;

        // Volumi (0-1)
        this.volumeGenerale = 0.8;
        this.volumeMusica = 0.5;
        this.volumeEffetti = 0.7;

        // Cache audio
        this.suoni = new Map();
        this.musicaCorrente = null;

        // Pool effetti sonori
        this.poolEffetti = new Map();
        this.maxIstanzePool = 5;

        // Definizioni audio
        this.definizioni = this.caricaDefinizioni();

        // Stato
        this.inizializzato = false;
        this.contestoAudio = null;
    }

    /**
     * Inizializza il sistema audio (richiede interazione utente)
     */
    async inizializza() {
        if (this.inizializzato) return;

        try {
            // Babylon gestisce internamente il contesto audio
            BABYLON.Engine.audioEngine.unlock();

            this.inizializzato = true;
            console.log('🔊 Sistema audio inizializzato');

        } catch (e) {
            console.warn('Errore inizializzazione audio:', e);
        }
    }

    /**
     * Definizioni tutti i suoni del gioco
     */
    caricaDefinizioni() {
        return {
            // ==================== MUSICA ====================
            musiche: {
                menu: {
                    nome: 'Tema Menu',
                    loop: true,
                    volume: 0.6
                },
                caverna: {
                    nome: 'Caverna Primordiale',
                    loop: true,
                    volume: 0.5
                },
                foresta: {
                    nome: 'Foresta Cristallo',
                    loop: true,
                    volume: 0.5
                },
                vulcano: {
                    nome: 'Vulcano Abisso',
                    loop: true,
                    volume: 0.5
                },
                cielo: {
                    nome: 'Cielo Tempestoso',
                    loop: true,
                    volume: 0.5
                },
                ombra: {
                    nome: 'Regno Ombra',
                    loop: true,
                    volume: 0.5
                },
                boss: {
                    nome: 'Battaglia Boss',
                    loop: true,
                    volume: 0.7
                },
                vittoria: {
                    nome: 'Vittoria',
                    loop: false,
                    volume: 0.8
                },
                sconfitta: {
                    nome: 'Sconfitta',
                    loop: false,
                    volume: 0.6
                }
            },

            // ==================== EFFETTI ====================
            effetti: {
                // Bolle
                bollaSparo: {
                    frequenza: 440,
                    durata: 0.15,
                    tipo: 'sine',
                    volume: 0.3
                },
                bollaScoppio: {
                    frequenza: 880,
                    durata: 0.1,
                    tipo: 'triangle',
                    volume: 0.4
                },
                bollaCattura: {
                    frequenza: [523, 659, 784],  // Accordo ascendente
                    durata: 0.3,
                    tipo: 'sine',
                    volume: 0.4
                },

                // Combattimento
                colpoNemico: {
                    frequenza: 200,
                    durata: 0.08,
                    tipo: 'sawtooth',
                    volume: 0.35
                },
                morteNemico: {
                    frequenza: [400, 200, 100],
                    durata: 0.25,
                    tipo: 'square',
                    volume: 0.4
                },
                esplosione: {
                    frequenza: 60,
                    durata: 0.5,
                    tipo: 'sawtooth',
                    volume: 0.5,
                    noise: true
                },

                // Giocatore
                salto: {
                    frequenza: [300, 500],
                    durata: 0.15,
                    tipo: 'sine',
                    volume: 0.3
                },
                danno: {
                    frequenza: [200, 150, 100],
                    durata: 0.2,
                    tipo: 'sawtooth',
                    volume: 0.5
                },
                morte: {
                    frequenza: [400, 300, 200, 100],
                    durata: 0.8,
                    tipo: 'square',
                    volume: 0.6
                },
                guarigione: {
                    frequenza: [523, 659, 784, 1047],
                    durata: 0.4,
                    tipo: 'sine',
                    volume: 0.4
                },

                // Raccolta
                raccoltaOro: {
                    frequenza: 1047,
                    durata: 0.1,
                    tipo: 'sine',
                    volume: 0.25
                },
                raccoltaGemma: {
                    frequenza: [1047, 1319, 1568],
                    durata: 0.2,
                    tipo: 'sine',
                    volume: 0.35
                },
                raccoltaFrutta: {
                    frequenza: 880,
                    durata: 0.12,
                    tipo: 'triangle',
                    volume: 0.3
                },
                raccoltaPowerup: {
                    frequenza: [523, 659, 784, 1047],
                    durata: 0.3,
                    tipo: 'sine',
                    volume: 0.5
                },

                // UI
                click: {
                    frequenza: 800,
                    durata: 0.05,
                    tipo: 'sine',
                    volume: 0.2
                },
                errore: {
                    frequenza: [200, 150],
                    durata: 0.15,
                    tipo: 'square',
                    volume: 0.3
                },
                conferma: {
                    frequenza: [523, 784],
                    durata: 0.15,
                    tipo: 'sine',
                    volume: 0.3
                },
                acquisto: {
                    frequenza: [523, 659, 784, 1047, 1319],
                    durata: 0.5,
                    tipo: 'sine',
                    volume: 0.4
                },

                // Speciali
                levelUp: {
                    frequenza: [523, 659, 784, 1047, 1319, 1568],
                    durata: 0.8,
                    tipo: 'sine',
                    volume: 0.6
                },
                sblocco: {
                    frequenza: [392, 523, 659, 784],
                    durata: 0.5,
                    tipo: 'triangle',
                    volume: 0.5
                },
                pausa: {
                    frequenza: 300,
                    durata: 0.2,
                    tipo: 'sine',
                    volume: 0.3
                },

                // Armi
                elettrico: {
                    frequenza: [2000, 3000, 1500],
                    durata: 0.1,
                    tipo: 'sawtooth',
                    volume: 0.35
                },
                fuoco: {
                    frequenza: 100,
                    durata: 0.3,
                    tipo: 'sawtooth',
                    volume: 0.4,
                    noise: true
                },
                ghiaccio: {
                    frequenza: [1500, 2000, 1800],
                    durata: 0.2,
                    tipo: 'sine',
                    volume: 0.3
                },
                gravita: {
                    frequenza: [100, 80, 60],
                    durata: 0.4,
                    tipo: 'sine',
                    volume: 0.35
                }
            }
        };
    }

    // ==================== EFFETTI SONORI ====================

    /**
     * Riproduci un effetto sonoro
     */
    riproduciEffetto(nome, opzioni = {}) {
        if (!this.abilitato || !this.effettiAbilitati) return;

        const def = this.definizioni.effetti[nome];
        if (!def) {
            console.warn(`Effetto sonoro non trovato: ${nome}`);
            return;
        }

        // Sintesi audio procedural
        this.sintetizzaSuono(def, opzioni);
    }

    /**
     * Sintetizza un suono proceduralmente
     */
    sintetizzaSuono(definizione, opzioni = {}) {
        try {
            const ctx = BABYLON.Engine.audioEngine.audioContext;
            if (!ctx) return;

            const volume = (definizione.volume || 0.5) * this.volumeEffetti * this.volumeGenerale;
            const frequenze = Array.isArray(definizione.frequenza)
                ? definizione.frequenza
                : [definizione.frequenza];

            const durata = definizione.durata || 0.2;
            const now = ctx.currentTime;

            frequenze.forEach((freq, i) => {
                const delay = i * (durata / frequenze.length);

                // Oscillatore
                const osc = ctx.createOscillator();
                osc.type = definizione.tipo || 'sine';
                osc.frequency.setValueAtTime(freq, now + delay);

                // Gain
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(volume, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + durata / frequenze.length);

                // Connetti
                osc.connect(gain);
                gain.connect(ctx.destination);

                // Avvia e ferma
                osc.start(now + delay);
                osc.stop(now + delay + durata / frequenze.length + 0.1);
            });

            // Aggiungi rumore per esplosioni
            if (definizione.noise) {
                this.aggiungiRumore(ctx, volume * 0.5, durata);
            }

        } catch (e) {
            console.warn('Errore sintesi audio:', e);
        }
    }

    /**
     * Aggiungi rumore bianco
     */
    aggiungiRumore(ctx, volume, durata) {
        const bufferSize = ctx.sampleRate * durata;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durata);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
    }

    // ==================== MUSICA ====================

    /**
     * Avvia musica di sottofondo
     */
    avviaMusica(nome, fadeIn = 1) {
        if (!this.abilitato || !this.musicaAbilitata) return;

        const def = this.definizioni.musiche[nome];
        if (!def) {
            console.warn(`Musica non trovata: ${nome}`);
            return;
        }

        // Ferma musica precedente
        this.fermaMusica(fadeIn * 0.5);

        // In un gioco reale qui si caricherebbe il file audio
        // Per ora simuliamo con un placeholder
        console.log(`🎵 Avvio musica: ${def.nome}`);

        this.musicaCorrente = {
            nome: nome,
            definizione: def,
            volume: def.volume * this.volumeMusica * this.volumeGenerale
        };
    }

    /**
     * Ferma la musica
     */
    fermaMusica(fadeOut = 1) {
        if (this.musicaCorrente) {
            console.log(`🎵 Stop musica: ${this.musicaCorrente.definizione.nome}`);
            this.musicaCorrente = null;
        }
    }

    /**
     * Pausa musica
     */
    pausaMusica() {
        // Implementazione con file audio reali
        console.log('🎵 Musica in pausa');
    }

    /**
     * Riprendi musica
     */
    riprendiMusica() {
        // Implementazione con file audio reali
        console.log('🎵 Musica ripresa');
    }

    // ==================== CONTROLLI VOLUME ====================

    /**
     * Imposta volume generale
     */
    setVolumeGenerale(volume) {
        this.volumeGenerale = Math.max(0, Math.min(1, volume));
    }

    /**
     * Imposta volume musica
     */
    setVolumeMusica(volume) {
        this.volumeMusica = Math.max(0, Math.min(1, volume));
    }

    /**
     * Imposta volume effetti
     */
    setVolumeEffetti(volume) {
        this.volumeEffetti = Math.max(0, Math.min(1, volume));
    }

    /**
     * Muto/unmuto tutto
     */
    toggleMuto() {
        this.abilitato = !this.abilitato;
        console.log(`🔊 Audio: ${this.abilitato ? 'ON' : 'OFF'}`);
        return this.abilitato;
    }

    /**
     * Muto/unmuto musica
     */
    toggleMusica() {
        this.musicaAbilitata = !this.musicaAbilitata;
        if (!this.musicaAbilitata) {
            this.fermaMusica(0.5);
        }
        return this.musicaAbilitata;
    }

    /**
     * Muto/unmuto effetti
     */
    toggleEffetti() {
        this.effettiAbilitati = !this.effettiAbilitati;
        return this.effettiAbilitati;
    }

    // ==================== UTILITY ====================

    /**
     * Ottieni impostazioni correnti
     */
    ottieniImpostazioni() {
        return {
            abilitato: this.abilitato,
            musicaAbilitata: this.musicaAbilitata,
            effettiAbilitati: this.effettiAbilitati,
            volumeGenerale: this.volumeGenerale,
            volumeMusica: this.volumeMusica,
            volumeEffetti: this.volumeEffetti
        };
    }

    /**
     * Carica impostazioni
     */
    caricaImpostazioni(impostazioni) {
        if (!impostazioni) return;

        this.abilitato = impostazioni.abilitato ?? this.abilitato;
        this.musicaAbilitata = impostazioni.musicaAbilitata ?? this.musicaAbilitata;
        this.effettiAbilitati = impostazioni.effettiAbilitati ?? this.effettiAbilitati;
        this.volumeGenerale = impostazioni.volumeGenerale ?? this.volumeGenerale;
        this.volumeMusica = impostazioni.volumeMusica ?? this.volumeMusica;
        this.volumeEffetti = impostazioni.volumeEffetti ?? this.volumeEffetti;
    }
}
