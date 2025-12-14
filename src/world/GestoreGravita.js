/**
 * BUBBLE ATTACK - Gestore Gravità
 * 
 * Gestisce il sistema di gravità variabile del gioco.
 * Supporta gravità lineare, puntiforme e transizioni fluide.
 */

// Tipi di gravità
export const TipoGravita = {
    LINEARE: 'LINEARE',        // Vettore costante (es. giù, destra)
    PUNTO: 'PUNTO',            // Attrazione verso un centro
    ZERO: 'ZERO'               // Nessuna gravità
};

export class GestoreGravita {
    constructor(scene) {
        this.scene = scene;

        // Gravità corrente e target
        this.gravitaCorrente = new BABYLON.Vector3(0, -9.81, 0);
        this.gravitaTarget = new BABYLON.Vector3(0, -9.81, 0);

        // Parametri di transizione
        this.velocitaTransizione = 0.05;  // Lerp factor
        this.inTransizione = false;

        // Gravità puntiforme (per pianeti)
        this.tipoCorrente = TipoGravita.LINEARE;
        this.centroGravita = null;  // Per gravità puntiforme
        this.magnitudinePunto = 9.81;

        // Direzioni cached
        this._direzioneSu = new BABYLON.Vector3(0, 1, 0);
        this._direzioneGiu = new BABYLON.Vector3(0, -1, 0);
    }

    /**
     * Update del gestore gravità (chiamato ogni frame)
     */
    update(deltaTime) {
        if (this.tipoCorrente === TipoGravita.PUNTO) {
            // Gravità puntiforme: calcola verso il centro
            this.calcolaGravitaPuntiforme();
        } else if (this.inTransizione) {
            // Gravità lineare: interpola verso target
            this.interpolaGravita();
        }

        // Applica gravità alla scena
        this.applicaGravitaScena();

        // Aggiorna direzioni cached
        this.aggiornaDirezioni();
    }

    /**
     * Interpola la gravità corrente verso quella target
     */
    interpolaGravita() {
        this.gravitaCorrente = BABYLON.Vector3.Lerp(
            this.gravitaCorrente,
            this.gravitaTarget,
            this.velocitaTransizione
        );

        // Controlla se la transizione è completata
        const distanza = BABYLON.Vector3.Distance(this.gravitaCorrente, this.gravitaTarget);
        if (distanza < 0.01) {
            this.gravitaCorrente = this.gravitaTarget.clone();
            this.inTransizione = false;
        }
    }

    /**
     * Calcola gravità puntiforme (per gravità sferica/pianeta)
     */
    calcolaGravitaPuntiforme() {
        if (!this.centroGravita || !window.gioco?.controllerDrago?.mesh) {
            return;
        }

        const posGiocatore = window.gioco.controllerDrago.mesh.position;

        // Direzione dal giocatore al centro
        const direzione = this.centroGravita.subtract(posGiocatore);
        direzione.normalize();

        // Gravità = direzione * magnitudine
        this.gravitaCorrente = direzione.scale(this.magnitudinePunto);
    }

    /**
     * Applica la gravità alla scena Havok
     */
    applicaGravitaScena() {
        const motore = this.scene.getPhysicsEngine();
        if (motore) {
            motore.setGravity(this.gravitaCorrente);
        }
    }

    /**
     * Aggiorna le direzioni cached
     */
    aggiornaDirezioni() {
        // Direzione "giù" = direzione della gravità normalizzata
        this._direzioneGiu = this.gravitaCorrente.normalize();

        // Direzione "su" = opposta
        this._direzioneSu = this._direzioneGiu.scale(-1);
    }

    /**
     * Imposta gravità lineare
     */
    impostaGravitaLineare(vettore, istantanea = false) {
        this.tipoCorrente = TipoGravita.LINEARE;
        this.gravitaTarget = vettore.clone();

        if (istantanea) {
            this.gravitaCorrente = vettore.clone();
            this.inTransizione = false;
        } else {
            this.inTransizione = true;
        }

        console.log(`🌍 Gravità: ${this.descriviVettore(vettore)}`);
    }

    /**
     * Imposta gravità puntiforme (pianeta)
     */
    impostaGravitaPunto(centroMondo, magnitudine = 9.81) {
        this.tipoCorrente = TipoGravita.PUNTO;
        this.centroGravita = centroMondo.clone();
        this.magnitudinePunto = magnitudine;

        console.log(`🪐 Gravità puntiforme verso (${centroMondo.x}, ${centroMondo.y}, ${centroMondo.z})`);
    }

    /**
     * Imposta gravità zero
     */
    impostaGravitaZero(istantanea = false) {
        this.impostaGravitaLineare(BABYLON.Vector3.Zero(), istantanea);
        this.tipoCorrente = TipoGravita.ZERO;

        console.log('🚀 Gravità zero!');
    }

    /**
     * Preset: Gravità normale (giù)
     */
    gravitaNormale(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(0, -9.81, 0), istantanea);
    }

    /**
     * Preset: Gravità invertita (su)
     */
    gravitaInvertita(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(0, 9.81, 0), istantanea);
    }

    /**
     * Preset: Gravità verso destra
     */
    gravitaDestra(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(9.81, 0, 0), istantanea);
    }

    /**
     * Preset: Gravità verso sinistra
     */
    gravitaSinistra(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(-9.81, 0, 0), istantanea);
    }

    /**
     * Preset: Bassa gravità (Luna/Spazio)
     */
    gravitaBassa(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(0, -2.94, 0), istantanea);  // 0.3g
    }

    /**
     * Preset: Alta gravità
     */
    gravitaAlta(istantanea = false) {
        this.impostaGravitaLineare(new BABYLON.Vector3(0, -19.62, 0), istantanea);  // 2g
    }

    /**
     * Ottiene la direzione "su" (opposta alla gravità)
     */
    ottieniDirezioneSu() {
        return this._direzioneSu.clone();
    }

    /**
     * Ottiene la direzione "giù" (stessa della gravità)
     */
    ottieniDirezioneGiu() {
        return this._direzioneGiu.clone();
    }

    /**
     * Ottiene la gravità corrente
     */
    ottieniGravitaCorrente() {
        return this.gravitaCorrente.clone();
    }

    /**
     * Ottiene la magnitudine della gravità
     */
    ottieniMagnitudineGravita() {
        return this.gravitaCorrente.length();
    }

    /**
     * Controlla se siamo in transizione
     */
    isInTransizione() {
        return this.inTransizione;
    }

    /**
     * Imposta la velocità di transizione (0.01 = lento, 0.1 = veloce)
     */
    impostaVelocitaTransizione(velocita) {
        this.velocitaTransizione = Math.max(0.01, Math.min(0.2, velocita));
    }

    /**
     * Descrivi il vettore gravità in modo leggibile
     */
    descriviVettore(vettore) {
        const soglia = 5;

        if (vettore.length() < 0.1) return 'Zero';
        if (vettore.y < -soglia) return 'Normale (Giù)';
        if (vettore.y > soglia) return 'Invertita (Su)';
        if (vettore.x > soglia) return 'Verso Destra';
        if (vettore.x < -soglia) return 'Verso Sinistra';
        if (vettore.z > soglia) return 'Verso Avanti';
        if (vettore.z < -soglia) return 'Verso Indietro';

        return `Personalizzata (${vettore.x.toFixed(1)}, ${vettore.y.toFixed(1)}, ${vettore.z.toFixed(1)})`;
    }

    /**
     * Crea zona trigger per cambio gravità
     * Ritorna la mesh trigger da posizionare nel livello
     */
    creaZonaGravita(posizione, dimensioni, tipoGravita, datiGravita) {
        // Crea box invisibile
        const zonaBox = BABYLON.MeshBuilder.CreateBox(
            `zonaGravita_${Date.now()}`,
            {
                width: dimensioni.x,
                height: dimensioni.y,
                depth: dimensioni.z
            },
            this.scene
        );
        zonaBox.position = posizione;
        zonaBox.isVisible = false;
        zonaBox.isPickable = false;

        // Crea trigger fisico
        const aggregato = new BABYLON.PhysicsAggregate(
            zonaBox,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, isTrigger: true },
            this.scene
        );

        // Observer per quando il giocatore entra
        aggregato.body.setCollisionCallbackEnabled(true);

        // Salva dati sulla zona
        zonaBox.metadata = {
            tipoZona: 'GRAVITA',
            tipoGravita: tipoGravita,
            datiGravita: datiGravita
        };

        return zonaBox;
    }

    /**
     * Gestisce l'entrata del giocatore in una zona gravità
     */
    gestisciEntrataZona(zona) {
        if (!zona.metadata || zona.metadata.tipoZona !== 'GRAVITA') return;

        const { tipoGravita, datiGravita } = zona.metadata;

        switch (tipoGravita) {
            case TipoGravita.LINEARE:
                this.impostaGravitaLineare(new BABYLON.Vector3(
                    datiGravita.x || 0,
                    datiGravita.y || -9.81,
                    datiGravita.z || 0
                ));
                break;

            case TipoGravita.PUNTO:
                this.impostaGravitaPunto(
                    new BABYLON.Vector3(
                        datiGravita.centroX,
                        datiGravita.centroY,
                        datiGravita.centroZ
                    ),
                    datiGravita.magnitudine || 9.81
                );
                break;

            case TipoGravita.ZERO:
                this.impostaGravitaZero();
                break;
        }
    }
}
