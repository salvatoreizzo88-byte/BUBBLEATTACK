/**
 * BUBBLE ATTACK - Gestore Camera
 * 
 * Gestisce effetti "Juice" della camera: trauma shake, FOV dinamico, smoothing.
 */

export class GestoreCamera {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Sistema Trauma/Shake
        this.trauma = 0;              // 0.0 a 1.0
        this.traumaDecay = 2.0;       // Velocità di decremento del trauma
        this.maxRotazioneShake = 0.05; // Rotazione massima in radianti
        this.maxPosizioneShake = 0.3;  // Offset massimo di posizione

        // FOV dinamico
        this.fovBase = 0.8;           // ~45 gradi
        this.fovMax = 1.0;            // ~57 gradi
        this.fovCorrente = this.fovBase;
        this.velocitaSoglia = 10.0;   // Velocità per iniziare effetto FOV
        this.fovLerpSpeed = 0.1;      // Velocità interpolazione FOV

        // Smoothing camera
        this.smoothingSpeed = 0.1;    // Velocità inseguimento del target

        // Stato originale per ripristino
        this.rotazioneOriginale = camera.rotation ? camera.rotation.clone() : null;
        this.posizioneOffset = BABYLON.Vector3.Zero();

        // Noise per shake più organico
        this.noiseTime = 0;
    }

    /**
     * Update del gestore camera (chiamato ogni frame)
     */
    update(deltaTime) {
        // Aggiorna tempo noise
        this.noiseTime += deltaTime * 10;

        // Decrementa trauma
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - deltaTime * this.traumaDecay);
            this.applicaShake();
        }

        // Aggiorna FOV in base alla velocità
        this.aggiornaFOV(deltaTime);

        // Smooth follow del target
        this.aggiornaSmoothing(deltaTime);
    }

    /**
     * Aggiunge trauma alla camera (per shake)
     */
    aggiungiTrauma(quantita) {
        this.trauma = Math.min(1.0, this.trauma + quantita);
    }

    /**
     * Applica shake basato su trauma
     */
    applicaShake() {
        // Calcolo quadratico del shake (più impatto per traumi alti)
        const shake = this.trauma * this.trauma;

        // Usa funzioni pseudo-random basate su time per effetto organico
        const noiseX = this.perlinNoise(this.noiseTime);
        const noiseY = this.perlinNoise(this.noiseTime + 100);
        const noiseZ = this.perlinNoise(this.noiseTime + 200);

        // Applica offset alla camera
        if (this.camera instanceof BABYLON.ArcRotateCamera) {
            // Per ArcRotateCamera, modifica alpha/beta leggermente
            const alphaOffset = noiseX * shake * this.maxRotazioneShake;
            const betaOffset = noiseY * shake * this.maxRotazioneShake;

            // Modifica temporanea
            this.camera.alpha += alphaOffset * 0.1;
            this.camera.beta += betaOffset * 0.1;
        } else if (this.camera.rotation) {
            // Per FreeCamera, modifica rotazione Z
            this.camera.rotation.z = noiseZ * shake * this.maxRotazioneShake;
        }

        // Offset posizione target
        if (this.camera.target) {
            const targetOffset = new BABYLON.Vector3(
                noiseX * shake * this.maxPosizioneShake,
                noiseY * shake * this.maxPosizioneShake * 0.5,
                noiseZ * shake * this.maxPosizioneShake
            );
            // L'offset viene gestito internamente dalla camera
        }
    }

    /**
     * Aggiorna FOV in base alla velocità del giocatore
     */
    aggiornaFOV(deltaTime) {
        // Ottieni velocità del giocatore
        let velocitaGiocatore = 0;
        if (window.gioco?.controllerDrago?.aggregatoFisico) {
            const vel = window.gioco.controllerDrago.aggregatoFisico.body.getLinearVelocity();
            velocitaGiocatore = vel.length();
        }

        // Calcola FOV target
        let fovTarget = this.fovBase;
        if (velocitaGiocatore > this.velocitaSoglia) {
            const eccesso = velocitaGiocatore - this.velocitaSoglia;
            fovTarget = Math.min(this.fovMax, this.fovBase + eccesso * 0.02);
        }

        // Interpola FOV
        this.fovCorrente = this.lerp(this.fovCorrente, fovTarget, this.fovLerpSpeed);

        // Applica FOV
        this.camera.fov = this.fovCorrente;
    }

    /**
     * Aggiorna smoothing della camera
     */
    aggiornaSmoothing(deltaTime) {
        // Per ArcRotateCamera, il follow è gestito da lockedTarget
        // Qui potremmo aggiungere smoothing aggiuntivo se necessario
    }

    /**
     * Semplice noise pseudo-random per shake
     */
    perlinNoise(t) {
        // Semplice implementazione basata su seno per effetto wave
        return Math.sin(t * 1.5) * Math.cos(t * 0.7) +
            Math.sin(t * 2.3) * 0.5 +
            Math.cos(t * 0.9) * 0.3;
    }

    /**
     * Interpolazione lineare
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Trigger shake per diversi eventi
     */
    shakeImpatto() {
        this.aggiungiTrauma(0.3);
    }

    shakeSchiantoMeteora() {
        this.aggiungiTrauma(0.8);
    }

    shakeScoppioBolla() {
        this.aggiungiTrauma(0.1);
    }

    shakeDanno() {
        this.aggiungiTrauma(0.5);
    }

    /**
     * Imposta la velocità di decadimento del trauma
     */
    impostaDecayTrauma(velocita) {
        this.traumaDecay = velocita;
    }

    /**
     * Ottiene il trauma corrente
     */
    ottieniTrauma() {
        return this.trauma;
    }

    /**
     * Resetta tutti gli effetti camera
     */
    reset() {
        this.trauma = 0;
        this.fovCorrente = this.fovBase;
        this.camera.fov = this.fovBase;
    }
}
