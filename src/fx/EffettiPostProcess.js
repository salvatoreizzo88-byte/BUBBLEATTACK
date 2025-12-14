/**
 * BUBBLE ATTACK - Effetti Post-Processing
 * 
 * Pipeline effetti visivi avanzati:
 * - Bloom
 * - Vignette
 * - Color grading per biomi
 * - Effetti speciali (danno, power-up)
 */

export class EffettiPostProcess {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Pipeline effetti
        this.pipeline = null;

        // Effetti
        this.bloom = null;
        this.chromaticAberration = null;
        this.grain = null;

        // Effetti overlay
        this.overlays = {};

        // Stato
        this.abilitato = true;
        this.biomaCorrente = null;

        // Inizializza
        this.inizializza();
    }

    inizializza() {
        if (!this.camera) return;

        // Crea pipeline di rendering
        this.pipeline = new BABYLON.DefaultRenderingPipeline(
            'defaultPipeline',
            true,
            this.scene,
            [this.camera]
        );

        // Bloom (luminosità oggetti brillanti)
        this.pipeline.bloomEnabled = true;
        this.pipeline.bloomThreshold = 0.8;
        this.pipeline.bloomWeight = 0.3;
        this.pipeline.bloomKernel = 64;
        this.pipeline.bloomScale = 0.5;

        // Antialiasing
        this.pipeline.fxaaEnabled = true;

        // Image processing
        this.pipeline.imageProcessingEnabled = true;
        this.pipeline.imageProcessing.toneMappingEnabled = true;
        this.pipeline.imageProcessing.contrast = 1.1;
        this.pipeline.imageProcessing.exposure = 1;

        // Vignette
        this.pipeline.imageProcessing.vignetteEnabled = true;
        this.pipeline.imageProcessing.vignetteWeight = 1.5;
        this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
        this.pipeline.imageProcessing.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;

        console.log('✨ Pipeline post-processing inizializzata');
    }

    // ==================== PRESET BIOMI ====================

    /**
     * Applica preset visivo per bioma
     */
    applicaPresetBioma(bioma) {
        this.biomaCorrente = bioma;

        const presets = {
            caverna_primordiale: {
                contrast: 1.1,
                exposure: 0.9,
                colorCurves: { shadows: [0.05, 0.04, 0.02], highlights: [0.1, 0.08, 0.05] },
                vignetteWeight: 2,
                bloomWeight: 0.2
            },
            foresta_cristallo: {
                contrast: 1.15,
                exposure: 1.1,
                colorCurves: { shadows: [0.02, 0.02, 0.05], highlights: [0.1, 0.05, 0.15] },
                vignetteWeight: 1.3,
                bloomWeight: 0.5
            },
            vulcano_abisso: {
                contrast: 1.2,
                exposure: 0.95,
                colorCurves: { shadows: [0.05, 0.01, 0.01], highlights: [0.15, 0.05, 0.02] },
                vignetteWeight: 1.8,
                bloomWeight: 0.4
            },
            cielo_tempesta: {
                contrast: 1.1,
                exposure: 1.05,
                colorCurves: { shadows: [0.02, 0.03, 0.05], highlights: [0.05, 0.08, 0.12] },
                vignetteWeight: 1.5,
                bloomWeight: 0.35
            },
            ombra_regno: {
                contrast: 1.3,
                exposure: 0.8,
                colorCurves: { shadows: [0.03, 0.02, 0.05], highlights: [0.05, 0.03, 0.08] },
                vignetteWeight: 2.5,
                bloomWeight: 0.25
            }
        };

        const preset = presets[bioma] || presets.caverna_primordiale;
        this.applicaPreset(preset);
    }

    applicaPreset(preset, transizione = 1) {
        if (!this.pipeline) return;

        // Applica valori (in un'app completa si userebbe animazione)
        this.pipeline.imageProcessing.contrast = preset.contrast;
        this.pipeline.imageProcessing.exposure = preset.exposure;
        this.pipeline.imageProcessing.vignetteWeight = preset.vignetteWeight;
        this.pipeline.bloomWeight = preset.bloomWeight;

        // Color curves se disponibili
        if (preset.colorCurves) {
            const cc = new BABYLON.ColorCurves();
            cc.globalSaturation = 1;

            if (preset.colorCurves.shadows) {
                cc.shadowsHue = 0;
                cc.shadowsDensity = preset.colorCurves.shadows[0] * 100;
            }

            this.pipeline.imageProcessing.colorCurves = cc;
        }
    }

    // ==================== EFFETTI SPECIALI ====================

    /**
     * Effetto danno (flash rosso)
     */
    effettoDanno(intensita = 1) {
        if (!this.pipeline || !this.abilitato) return;

        // Salva valori originali
        const contrastOriginale = this.pipeline.imageProcessing.contrast;
        const vignetteOriginale = this.pipeline.imageProcessing.vignetteWeight;
        const vignetteColorOriginale = this.pipeline.imageProcessing.vignetteColor.clone();

        // Applica effetto danno
        this.pipeline.imageProcessing.contrast = 1.4 * intensita;
        this.pipeline.imageProcessing.vignetteWeight = 4 * intensita;
        this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(1, 0, 0, 0);

        // Ritorna ai valori originali
        setTimeout(() => {
            this.pipeline.imageProcessing.contrast = contrastOriginale;
            this.pipeline.imageProcessing.vignetteWeight = vignetteOriginale;
            this.pipeline.imageProcessing.vignetteColor = vignetteColorOriginale;
        }, 150);
    }

    /**
     * Effetto guarigione (flash verde)
     */
    effettoGuarigione() {
        if (!this.pipeline || !this.abilitato) return;

        // Flash verde
        this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0.8, 0.3, 0);
        this.pipeline.imageProcessing.vignetteWeight = 3;

        setTimeout(() => {
            this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
            this.pipeline.imageProcessing.vignetteWeight = 1.5;
        }, 300);
    }

    /**
     * Effetto power-up (bloom aumentato + flash)
     */
    effettoPowerUp(colore = new BABYLON.Color4(1, 0.8, 0, 0)) {
        if (!this.pipeline || !this.abilitato) return;

        const bloomOriginale = this.pipeline.bloomWeight;

        this.pipeline.bloomWeight = 0.8;
        this.pipeline.imageProcessing.vignetteColor = colore;
        this.pipeline.imageProcessing.vignetteWeight = 2;

        setTimeout(() => {
            this.pipeline.bloomWeight = bloomOriginale;
            this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
            this.pipeline.imageProcessing.vignetteWeight = 1.5;
        }, 500);
    }

    /**
     * Effetto level up
     */
    effettoLevelUp() {
        if (!this.pipeline || !this.abilitato) return;

        const bloomOriginale = this.pipeline.bloomWeight;
        const exposureOriginale = this.pipeline.imageProcessing.exposure;

        // Flash luminoso
        this.pipeline.bloomWeight = 1.5;
        this.pipeline.imageProcessing.exposure = 1.5;
        this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(1, 0.9, 0.3, 0);

        // Ritorna gradualmente
        const step = 0.05;
        let progress = 0;

        const animazione = setInterval(() => {
            progress += step;
            const t = 1 - progress;

            this.pipeline.bloomWeight = bloomOriginale + (1.5 - bloomOriginale) * t;
            this.pipeline.imageProcessing.exposure = exposureOriginale + (1.5 - exposureOriginale) * t;

            if (progress >= 1) {
                clearInterval(animazione);
                this.pipeline.bloomWeight = bloomOriginale;
                this.pipeline.imageProcessing.exposure = exposureOriginale;
                this.pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
            }
        }, 50);
    }

    /**
     * Effetto tempo rallentato
     */
    effettoSlowMotion(attivo) {
        if (!this.pipeline || !this.abilitato) return;

        if (attivo) {
            this.pipeline.imageProcessing.contrast = 1.3;
            this.pipeline.imageProcessing.colorCurves = new BABYLON.ColorCurves();
            this.pipeline.imageProcessing.colorCurves.globalSaturation = -20;
        } else {
            this.pipeline.imageProcessing.contrast = 1.1;
            if (this.pipeline.imageProcessing.colorCurves) {
                this.pipeline.imageProcessing.colorCurves.globalSaturation = 0;
            }
        }
    }

    /**
     * Effetto morte (dissolvenza al nero)
     */
    effettoMorte(callback) {
        if (!this.pipeline) {
            if (callback) callback();
            return;
        }

        let progresso = 0;

        const fade = setInterval(() => {
            progresso += 0.02;

            this.pipeline.imageProcessing.exposure = 1 - progresso;
            this.pipeline.imageProcessing.contrast = 1 + progresso * 0.5;
            this.pipeline.imageProcessing.vignetteWeight = 1.5 + progresso * 10;

            if (progresso >= 1) {
                clearInterval(fade);
                if (callback) callback();
            }
        }, 50);
    }

    /**
     * Effetto respawn (dissolvenza dal nero)
     */
    effettoRespawn() {
        if (!this.pipeline) return;

        this.pipeline.imageProcessing.exposure = 0;

        let progresso = 0;

        const fadeIn = setInterval(() => {
            progresso += 0.03;

            this.pipeline.imageProcessing.exposure = progresso;
            this.pipeline.imageProcessing.vignetteWeight = 10 - progresso * 8.5;

            if (progresso >= 1) {
                clearInterval(fadeIn);
                this.pipeline.imageProcessing.exposure = 1;
                this.pipeline.imageProcessing.vignetteWeight = 1.5;
            }
        }, 30);
    }

    // ==================== CONTROLLI ====================

    /**
     * Abilita/disabilita effetti
     */
    setAbilitato(valore) {
        this.abilitato = valore;

        if (this.pipeline) {
            this.pipeline.bloomEnabled = valore;
            this.pipeline.fxaaEnabled = valore;
            this.pipeline.imageProcessing.vignetteEnabled = valore;
        }
    }

    /**
     * Imposta qualità effetti
     */
    setQualita(livello) {
        // livello: 'bassa', 'media', 'alta'
        if (!this.pipeline) return;

        const impostazioni = {
            bassa: {
                bloomEnabled: false,
                fxaaEnabled: false,
                bloomKernel: 32
            },
            media: {
                bloomEnabled: true,
                fxaaEnabled: true,
                bloomKernel: 64
            },
            alta: {
                bloomEnabled: true,
                fxaaEnabled: true,
                bloomKernel: 128
            }
        };

        const preset = impostazioni[livello] || impostazioni.media;

        this.pipeline.bloomEnabled = preset.bloomEnabled;
        this.pipeline.fxaaEnabled = preset.fxaaEnabled;
        this.pipeline.bloomKernel = preset.bloomKernel;
    }

    /**
     * Pulisci risorse
     */
    distruggi() {
        if (this.pipeline) {
            this.pipeline.dispose();
        }
    }
}
