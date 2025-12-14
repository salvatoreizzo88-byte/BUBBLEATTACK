/**
 * BUBBLE ATTACK - Gestore Effetti Visivi
 * 
 * Sistema centralizzato per tutti gli effetti visivi:
 * - Particelle
 * - Esplosioni
 * - Trail
 * - Screen shake
 * - Post-processing
 */

export class GestoreFX {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Pool di sistemi particellari
        this.sistemiParticelle = new Map();
        this.particelleAttive = [];

        // Effetti unici
        this.effettiAttivi = [];

        // Screen shake
        this.shake = {
            attivo: false,
            intensita: 0,
            durata: 0,
            timer: 0,
            posizioneOriginale: null
        };

        // Preset effetti
        this.presetEffetti = this.caricaPreset();

        // Materiali condivisi
        this.materiali = {};
        this.creaMaterialiCondivisi();
    }

    /**
     * Carica preset per tutti i tipi di effetti
     */
    caricaPreset() {
        return {
            // Effetti bolle
            bollaScoppio: {
                numParticelle: 50,
                vita: { min: 0.2, max: 0.5 },
                dimensione: { min: 0.1, max: 0.3 },
                velocita: { min: 3, max: 8 },
                colore1: new BABYLON.Color4(0.5, 0.8, 1, 1),
                colore2: new BABYLON.Color4(0.3, 0.6, 0.9, 0),
                gravita: -2,
                emissione: 'sfera'
            },

            bollaCreazione: {
                numParticelle: 20,
                vita: { min: 0.3, max: 0.6 },
                dimensione: { min: 0.05, max: 0.15 },
                velocita: { min: 1, max: 3 },
                colore1: new BABYLON.Color4(0.7, 0.9, 1, 1),
                colore2: new BABYLON.Color4(0.5, 0.8, 1, 0),
                gravita: 1,
                emissione: 'anello'
            },

            // Effetti combattimento
            colpo: {
                numParticelle: 30,
                vita: { min: 0.1, max: 0.3 },
                dimensione: { min: 0.05, max: 0.2 },
                velocita: { min: 5, max: 12 },
                colore1: new BABYLON.Color4(1, 1, 0.5, 1),
                colore2: new BABYLON.Color4(1, 0.5, 0, 0),
                gravita: 0,
                emissione: 'punto'
            },

            esplosione: {
                numParticelle: 100,
                vita: { min: 0.3, max: 0.8 },
                dimensione: { min: 0.2, max: 0.6 },
                velocita: { min: 5, max: 15 },
                colore1: new BABYLON.Color4(1, 0.6, 0.1, 1),
                colore2: new BABYLON.Color4(0.8, 0.2, 0, 0),
                gravita: -3,
                emissione: 'sfera'
            },

            esplosioneFuoco: {
                numParticelle: 80,
                vita: { min: 0.4, max: 1 },
                dimensione: { min: 0.3, max: 0.8 },
                velocita: { min: 3, max: 10 },
                colore1: new BABYLON.Color4(1, 0.4, 0, 1),
                colore2: new BABYLON.Color4(0.5, 0, 0, 0),
                gravita: 2,
                emissione: 'sfera'
            },

            elettrico: {
                numParticelle: 40,
                vita: { min: 0.05, max: 0.2 },
                dimensione: { min: 0.02, max: 0.1 },
                velocita: { min: 10, max: 20 },
                colore1: new BABYLON.Color4(0.5, 0.8, 1, 1),
                colore2: new BABYLON.Color4(0.2, 0.5, 1, 0),
                gravita: 0,
                emissione: 'punto'
            },

            ghiaccio: {
                numParticelle: 30,
                vita: { min: 0.5, max: 1 },
                dimensione: { min: 0.1, max: 0.25 },
                velocita: { min: 1, max: 4 },
                colore1: new BABYLON.Color4(0.8, 0.9, 1, 1),
                colore2: new BABYLON.Color4(0.5, 0.7, 0.9, 0),
                gravita: -1,
                emissione: 'sfera'
            },

            // Effetti raccolta
            raccoltaOro: {
                numParticelle: 15,
                vita: { min: 0.3, max: 0.6 },
                dimensione: { min: 0.1, max: 0.2 },
                velocita: { min: 2, max: 5 },
                colore1: new BABYLON.Color4(1, 0.85, 0.2, 1),
                colore2: new BABYLON.Color4(1, 0.7, 0, 0),
                gravita: 3,
                emissione: 'punto'
            },

            raccoltaXP: {
                numParticelle: 20,
                vita: { min: 0.4, max: 0.8 },
                dimensione: { min: 0.08, max: 0.15 },
                velocita: { min: 3, max: 6 },
                colore1: new BABYLON.Color4(0.4, 1, 0.4, 1),
                colore2: new BABYLON.Color4(0.2, 0.8, 0.2, 0),
                gravita: 5,
                emissione: 'punto'
            },

            // Effetti ambiente
            polvere: {
                numParticelle: 10,
                vita: { min: 0.5, max: 1.5 },
                dimensione: { min: 0.1, max: 0.3 },
                velocita: { min: 0.5, max: 2 },
                colore1: new BABYLON.Color4(0.6, 0.5, 0.4, 0.5),
                colore2: new BABYLON.Color4(0.5, 0.4, 0.3, 0),
                gravita: 0.5,
                emissione: 'punto'
            },

            fumo: {
                numParticelle: 30,
                vita: { min: 1, max: 3 },
                dimensione: { min: 0.3, max: 0.8 },
                velocita: { min: 0.5, max: 2 },
                colore1: new BABYLON.Color4(0.3, 0.3, 0.3, 0.6),
                colore2: new BABYLON.Color4(0.2, 0.2, 0.2, 0),
                gravita: 1,
                emissione: 'punto'
            },

            scintille: {
                numParticelle: 25,
                vita: { min: 0.2, max: 0.5 },
                dimensione: { min: 0.03, max: 0.08 },
                velocita: { min: 5, max: 15 },
                colore1: new BABYLON.Color4(1, 0.9, 0.5, 1),
                colore2: new BABYLON.Color4(1, 0.5, 0.2, 0),
                gravita: -5,
                emissione: 'punto'
            },

            // Effetti speciali
            teletrasporto: {
                numParticelle: 60,
                vita: { min: 0.5, max: 1 },
                dimensione: { min: 0.1, max: 0.25 },
                velocita: { min: 2, max: 6 },
                colore1: new BABYLON.Color4(0.8, 0.5, 1, 1),
                colore2: new BABYLON.Color4(0.5, 0.2, 0.8, 0),
                gravita: 0,
                emissione: 'cilindro'
            },

            guarigione: {
                numParticelle: 25,
                vita: { min: 0.5, max: 1 },
                dimensione: { min: 0.1, max: 0.2 },
                velocita: { min: 1, max: 3 },
                colore1: new BABYLON.Color4(0.2, 1, 0.5, 1),
                colore2: new BABYLON.Color4(0.1, 0.8, 0.3, 0),
                gravita: 2,
                emissione: 'anello'
            },

            levelUp: {
                numParticelle: 100,
                vita: { min: 0.8, max: 1.5 },
                dimensione: { min: 0.1, max: 0.3 },
                velocita: { min: 3, max: 8 },
                colore1: new BABYLON.Color4(1, 0.9, 0.3, 1),
                colore2: new BABYLON.Color4(1, 0.7, 0.1, 0),
                gravita: 3,
                emissione: 'cilindro'
            }
        };
    }

    /**
     * Crea materiali condivisi per efficienza
     */
    creaMaterialiCondivisi() {
        // Materiale base particella
        this.materiali.particellaBase = new BABYLON.StandardMaterial('mat_particella', this.scene);
        this.materiali.particellaBase.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.materiali.particellaBase.disableLighting = true;
    }

    /**
     * Crea un sistema particellare con preset
     */
    creaEffetto(nomePreset, posizione, opzioni = {}) {
        const preset = this.presetEffetti[nomePreset];
        if (!preset) {
            console.warn(`Preset effetto non trovato: ${nomePreset}`);
            return null;
        }

        // Merge opzioni con preset
        const config = { ...preset, ...opzioni };

        // Crea sistema particellare
        const sistema = new BABYLON.ParticleSystem(
            `fx_${nomePreset}_${Date.now()}`,
            config.numParticelle,
            this.scene
        );

        // Texture particella (generata proceduralmente)
        sistema.particleTexture = this.ottieniTextureParticella();

        // Emissione
        switch (config.emissione) {
            case 'sfera':
                sistema.createSphereEmitter(config.raggio || 0.5);
                break;
            case 'cilindro':
                sistema.createCylinderEmitter(config.raggio || 0.5, config.altezza || 2);
                break;
            case 'anello':
                sistema.createConeEmitter(config.raggio || 0.5, Math.PI / 4);
                break;
            default:
                sistema.createPointEmitter(
                    new BABYLON.Vector3(-1, 1, -1),
                    new BABYLON.Vector3(1, 1, 1)
                );
        }

        // Posizione
        sistema.emitter = posizione.clone();

        // Dimensioni
        sistema.minSize = config.dimensione.min;
        sistema.maxSize = config.dimensione.max;

        // Vita
        sistema.minLifeTime = config.vita.min;
        sistema.maxLifeTime = config.vita.max;

        // Velocità
        sistema.minEmitPower = config.velocita.min;
        sistema.maxEmitPower = config.velocita.max;

        // Colori
        sistema.color1 = config.colore1;
        sistema.color2 = config.colore2;
        sistema.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        // Gravità
        sistema.gravity = new BABYLON.Vector3(0, config.gravita, 0);

        // Emissione burst (tutte insieme)
        sistema.emitRate = config.numParticelle * 10;
        sistema.manualEmitCount = config.numParticelle;
        sistema.targetStopDuration = 0.1;

        // Avvia e ferma
        sistema.start();

        // Pulizia automatica
        const durataTotale = config.vita.max + 0.5;
        setTimeout(() => {
            sistema.dispose();
        }, durataTotale * 1000);

        this.particelleAttive.push(sistema);

        return sistema;
    }

    /**
     * Ottieni texture particella (cache)
     */
    ottieniTextureParticella() {
        if (this._textureParticella) return this._textureParticella;

        // Crea texture procedurale semplice
        this._textureParticella = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKoSURBVFiFxZe9bhNBEMd/e+eLz05IgUQRISFEQQEFJQ0NDQ0vwBPwCjwJJQ0FBQ0NJU1aREMBEhKIQCQCIYTtsO+7Y9l7Z3NWFJ/v7NidNNZJq/nPzM7szuwKVaWXEHu6+jNxYAdoCnwhRAJki6K4J8k0D4hHWq/X++ZkMvnTNE1bmtmkLMvi+mIuG8eRC+8sMHH0fD7/Xdf1d0nBzJRSqRQR2S9J05GWZWED/8pyWlX/EBFZlO39QFOnKww5HI/HLwDvgD/AkJmdr1QqPwE/wJgXCAJr8wohzMuQEQBHReQXwBGQxxg/A5cTjDFGgKcSY9wEfq+uru4H3IhqHAa4AvwAPgC3JEkOoYQxxnFJkuRA3TT1PYFAIOCqqjYAP4B7SZLE6nQ6fYwxrgOngKvAixjjHuBVkiT7ALcl7E9EZC/wHDgGPIkxPqi6rtthjLEDXARuAy8k7I1E5Cbw2jnXBu4DL4H3wKiqjqrqZ+AjcAJYD/wF3gNnReRNjDEHzgB/gG3ABeAn8NQ591lEbgKPgYtpmg6ADcAGYBtwBngdY2wAJ4Gfks6zNE3PisiVGONB4BNwD3iepukxYLOIbABWAi+dc0+Bv8BZ4K2E/UlE9gAvgOPAfefc4xjjHuADcFXC3kiS5CcAzrnHMcb9wFPgrKrukLAvisjvGOMB4C/wBLgH/AZuxxhPxxg3AX+Bx8AT4JaI7JS0P5Ikv2OM/0rYm4GNAE+AE8BTETlYdd1/Y4z/Ac+Ak8ALVd1Tda2qqg7qqqqqfSLy1Dm3G/gMHAS+AN+AncB74JWq7qmq6qSqjoGPwAHgK3AS+AacUdVPwBHn3MfE7X5VPQ98B04Dn4DDqvo5cfrNVO4+xpj2isgJ4LuqngG+AYeAL6p6HvgBHAW+/gcQvmxKoLhJpwAAAABJRU5ErkJggg==',
            this.scene
        );

        return this._textureParticella;
    }

    // ==================== EFFETTI SPECIFICI ====================

    /**
     * Effetto scoppio bolla
     */
    scoppioBolla(posizione, colore = null) {
        const opzioni = colore ? {
            colore1: new BABYLON.Color4(colore.r, colore.g, colore.b, 1),
            colore2: new BABYLON.Color4(colore.r * 0.5, colore.g * 0.5, colore.b * 0.5, 0)
        } : {};

        this.creaEffetto('bollaScoppio', posizione, opzioni);
    }

    /**
     * Effetto esplosione
     */
    esplosione(posizione, scala = 1) {
        this.creaEffetto('esplosione', posizione, {
            numParticelle: Math.floor(100 * scala),
            dimensione: { min: 0.2 * scala, max: 0.6 * scala }
        });

        // Shake camera
        this.scuotiCamera(0.3 * scala, 0.3);
    }

    /**
     * Effetto morte nemico
     */
    morteNemico(posizione, tipoNemico = 'normale') {
        this.creaEffetto('colpo', posizione);
        this.creaEffetto('fumo', posizione);
    }

    /**
     * Effetto raccolta oro
     */
    raccoltaOro(posizione, quantita = 1) {
        this.creaEffetto('raccoltaOro', posizione, {
            numParticelle: Math.min(quantita * 5, 50)
        });
    }

    /**
     * Effetto level up
     */
    levelUp(posizione) {
        this.creaEffetto('levelUp', posizione);
        this.scuotiCamera(0.2, 0.5);
    }

    /**
     * Effetto elettrico
     */
    effettoElettrico(posizione) {
        this.creaEffetto('elettrico', posizione);
    }

    /**
     * Effetto ghiaccio/congelamento
     */
    effettoGhiaccio(posizione) {
        this.creaEffetto('ghiaccio', posizione);
    }

    // ==================== SCREEN SHAKE ====================

    /**
     * Scuoti la camera
     */
    scuotiCamera(intensita = 0.5, durata = 0.3) {
        if (!this.camera) return;

        this.shake.attivo = true;
        this.shake.intensita = intensita;
        this.shake.durata = durata;
        this.shake.timer = 0;

        if (!this.shake.posizioneOriginale) {
            this.shake.posizioneOriginale = this.camera.position.clone();
        }
    }

    /**
     * Update screen shake (chiamare ogni frame)
     */
    updateShake(deltaTime) {
        if (!this.shake.attivo || !this.camera) return;

        this.shake.timer += deltaTime;

        if (this.shake.timer >= this.shake.durata) {
            // Ripristina posizione
            this.camera.position = this.shake.posizioneOriginale.clone();
            this.shake.attivo = false;
            this.shake.posizioneOriginale = null;
            return;
        }

        // Calcola offset casuale
        const progresso = this.shake.timer / this.shake.durata;
        const intensitaCorrente = this.shake.intensita * (1 - progresso);

        const offsetX = (Math.random() - 0.5) * 2 * intensitaCorrente;
        const offsetY = (Math.random() - 0.5) * 2 * intensitaCorrente;

        // Applica shake
        this.camera.position.x = this.shake.posizioneOriginale.x + offsetX;
        this.camera.position.y = this.shake.posizioneOriginale.y + offsetY;
    }

    // ==================== TRAIL ====================

    /**
     * Crea trail per un oggetto in movimento
     */
    creaTrail(mesh, opzioni = {}) {
        const config = {
            colore: new BABYLON.Color4(1, 1, 1, 0.5),
            lunghezza: 20,
            larghezza: 0.2,
            ...opzioni
        };

        // Usa TrailMesh di Babylon
        const trail = new BABYLON.TrailMesh(
            `trail_${mesh.name}`,
            mesh,
            this.scene,
            config.larghezza,
            config.lunghezza,
            true
        );

        const mat = new BABYLON.StandardMaterial('mat_trail', this.scene);
        mat.emissiveColor = new BABYLON.Color3(config.colore.r, config.colore.g, config.colore.b);
        mat.alpha = config.colore.a;
        mat.disableLighting = true;
        trail.material = mat;

        return trail;
    }

    // ==================== PULIZIA ====================

    /**
     * Update generale (chiamare ogni frame)
     */
    update(deltaTime) {
        this.updateShake(deltaTime);

        // Pulizia particelle finite
        this.particelleAttive = this.particelleAttive.filter(p => !p.isDisposed);
    }

    /**
     * Pulisci tutti gli effetti
     */
    pulisciTutto() {
        for (const sistema of this.particelleAttive) {
            if (!sistema.isDisposed) {
                sistema.dispose();
            }
        }
        this.particelleAttive = [];
    }
}
