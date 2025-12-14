/**
 * BUBBLE ATTACK - Controller Drago
 * 
 * Controller del giocatore (il Drago) con macchina a stati finiti (FSM).
 * Gestisce movimento, salto, planata e schianto meteora secondo le specifiche.
 */

// Stati del giocatore
export const StatiDrago = {
    INATTIVO: 'INATTIVO',
    CORSA: 'CORSA',
    DERAPATA: 'DERAPATA',
    SALTO: 'SALTO',
    PLANATA: 'PLANATA',
    CADUTA: 'CADUTA',
    SCHIANTO_METEORA: 'SCHIANTO_METEORA'
};

export class ControllerDrago {
    constructor(scene, gestoreGravita, sistemaInput) {
        this.scene = scene;
        this.gestoreGravita = gestoreGravita;
        this.sistemaInput = sistemaInput;

        // Mesh e fisica
        this.mesh = null;
        this.aggregatoFisico = null;

        // Stato corrente
        this.statoCorrente = StatiDrago.INATTIVO;
        this.statoPrecedente = StatiDrago.INATTIVO;

        // Parametri fisici (da specifica)
        this.parametri = {
            massa: 80,                    // kg
            velocitaMovimento: 8.0,       // unità/s
            forzaSalto: 12.0,             // impulso
            dampingInattivo: 0.9111,      // "Snappy" stop
            dampingCorsa: 0.0,            // Nessun damping in movimento
            sogliaVelocitaDerapata: 8.0,  // Soglia per derapata
            angoloDerapata: Math.PI / 2,  // 90 gradi
            durataDerapata: 0.2,          // secondi
            gravitaPlanata: 0.2,          // Scala gravità durante planata
            forzaSchiantoMeteora: 50,     // Impulso verso il basso
            dampingSchianto: 0.0          // Nessun damping durante schianto
        };

        // Stato interno
        this.aTerra = false;
        this.velocitaPrecedente = new BABYLON.Vector3();
        this.direzionePrecedente = new BABYLON.Vector3(0, 0, 1);
        this.timerDerapata = 0;
        this.timerDopoSalto = 0;
        this.saltoPremuto = false;
        this.sparoPremuto = false;

        // Raycast per terreno
        this.lunghezzaRaycast = 1.2;  // Distanza per rilevare il terreno
    }

    /**
     * Crea il mesh e la fisica del drago
     */
    async crea() {
        // Crea mesh temporaneo (capsula/sfera per ora)
        // In futuro sarà sostituito dal modello 3D del drago
        this.mesh = BABYLON.MeshBuilder.CreateCapsule(
            'drago',
            {
                height: 2.0,
                radius: 0.5,
                tessellation: 16,
                subdivisions: 4
            },
            this.scene
        );

        // Posizione iniziale
        this.mesh.position = new BABYLON.Vector3(0, 3, 0);

        // Materiale del drago (viola brillante)
        const materialeDrago = new BABYLON.StandardMaterial('matDrago', this.scene);
        materialeDrago.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.8);
        materialeDrago.specularColor = new BABYLON.Color3(0.8, 0.8, 1);
        materialeDrago.specularPower = 32;
        materialeDrago.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.15);
        this.mesh.material = materialeDrago;

        // Inizializza quaternione per rotazione
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();

        // Aggiungi fisica con Havok
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.CAPSULE,
            {
                mass: this.parametri.massa,
                friction: 0.0,  // Gestito manualmente
                restitution: 0.0
            },
            this.scene
        );

        // Blocca rotazione su X e Z (solo Y libero)
        const corpo = this.aggregatoFisico.body;
        corpo.setMassProperties({
            inertia: new BABYLON.Vector3(0, 1, 0)
        });

        // Disabilita rotazione fisica
        corpo.setAngularDamping(100);

        console.log('🐉 Drago creato!');
    }

    /**
     * Update del controller (chiamato ogni frame)
     */
    update(deltaTime) {
        if (!this.aggregatoFisico) return;

        const corpo = this.aggregatoFisico.body;
        const velocitaCorrente = corpo.getLinearVelocity();

        // Aggiorna timer
        if (this.timerDopoSalto > 0) {
            this.timerDopoSalto -= deltaTime;
        }
        if (this.timerDerapata > 0) {
            this.timerDerapata -= deltaTime;
        }

        // Controlla se a terra
        this.controllaTerreno();

        // Leggi input
        const input = this.sistemaInput.getInput();
        const inputMovimento = new BABYLON.Vector3(input.x, 0, input.y);

        // Macchina a stati
        this.aggiornaStato(inputMovimento, velocitaCorrente, input);

        // Esegui logica dello stato corrente
        this.eseguiStato(deltaTime, inputMovimento, velocitaCorrente);

        // Rotazione verso la direzione di movimento
        this.aggiornaRotazione(inputMovimento, deltaTime);

        // Salva per il prossimo frame
        this.velocitaPrecedente = velocitaCorrente.clone();
        this.saltoPremuto = input.salto;
        this.sparoPremuto = input.sparo;
    }

    /**
     * Controlla se il drago è a terra usando raycast
     */
    controllaTerreno() {
        // Skip raycast subito dopo il salto per permettere il distacco
        if (this.timerDopoSalto > 0) {
            this.aTerra = false;
            return;
        }

        const origine = this.mesh.position.clone();
        // Direzione verso il basso (opposta alla gravità corrente)
        const direzioneBasso = this.gestoreGravita.ottieniDirezioneGiu();

        const ray = new BABYLON.Ray(origine, direzioneBasso, this.lunghezzaRaycast);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh !== this.mesh && mesh.isPickable;
        });

        this.aTerra = hit && hit.hit;
    }

    /**
     * Aggiorna lo stato basandosi sulle condizioni
     */
    aggiornaStato(inputMovimento, velocita, input) {
        this.statoPrecedente = this.statoCorrente;

        const magnitudineInput = inputMovimento.length();
        const velocitaY = velocita.y;
        const velocitaOrizz = new BABYLON.Vector3(velocita.x, 0, velocita.z).length();

        // --- Logica di transizione ---

        // Schianto Meteora: GIÙ + Salto in aria
        if (!this.aTerra && input.giu && input.salto && this.statoCorrente !== StatiDrago.SCHIANTO_METEORA) {
            this.statoCorrente = StatiDrago.SCHIANTO_METEORA;
            this.iniziaSchiantoMeteora();
            return;
        }

        // Se attualmente in Schianto Meteora
        if (this.statoCorrente === StatiDrago.SCHIANTO_METEORA) {
            if (this.aTerra) {
                // Impatto! Trigger effetti
                this.impattoSchiantoMeteora();
                this.statoCorrente = StatiDrago.INATTIVO;
            }
            return;
        }

        // A TERRA
        if (this.aTerra) {
            // Salto
            if (input.salto && !this.saltoPremuto) {
                this.statoCorrente = StatiDrago.SALTO;
                this.eseguiSalto();
                return;
            }

            // Derapata: velocità alta + cambio direzione brusco
            if (magnitudineInput > 0.1 && velocitaOrizz > this.parametri.sogliaVelocitaDerapata) {
                const angoloTra = this.calcolaAngoloCambioDirezione(inputMovimento);
                if (angoloTra > this.parametri.angoloDerapata) {
                    this.statoCorrente = StatiDrago.DERAPATA;
                    this.timerDerapata = this.parametri.durataDerapata;
                    return;
                }
            }

            // Se in derapata, mantieni fino a timer
            if (this.statoCorrente === StatiDrago.DERAPATA && this.timerDerapata > 0) {
                return;
            }

            // Corsa o Inattivo
            if (magnitudineInput > 0.1) {
                this.statoCorrente = StatiDrago.CORSA;
            } else {
                this.statoCorrente = StatiDrago.INATTIVO;
            }
        }
        // IN ARIA
        else {
            // Planata: tasto salto tenuto premuto durante la caduta
            if (velocitaY < 0 && input.salto) {
                this.statoCorrente = StatiDrago.PLANATA;
            }
            // Caduta normale
            else if (velocitaY < -0.5) {
                this.statoCorrente = StatiDrago.CADUTA;
            }
            // Ancora in salto (salendo)
            else if (velocitaY > 0.5) {
                this.statoCorrente = StatiDrago.SALTO;
            }
        }
    }

    /**
     * Esegue la logica dello stato corrente
     */
    eseguiStato(deltaTime, inputMovimento, velocitaCorrente) {
        const corpo = this.aggregatoFisico.body;

        switch (this.statoCorrente) {
            case StatiDrago.INATTIVO:
                // Frenata snappy
                corpo.setLinearDamping(this.parametri.dampingInattivo);
                break;

            case StatiDrago.CORSA:
                corpo.setLinearDamping(this.parametri.dampingCorsa);
                this.applicaMovimento(inputMovimento);
                break;

            case StatiDrago.DERAPATA:
                // Forza centrifuga opposta
                this.applicaDerapata(inputMovimento, velocitaCorrente);
                break;

            case StatiDrago.SALTO:
                corpo.setLinearDamping(0);
                // Controllo aereo ridotto
                this.applicaMovimentoAereo(inputMovimento, 0.5);
                break;

            case StatiDrago.PLANATA:
                corpo.setLinearDamping(0);
                // Modifica la gravità percepita
                this.applicaPlanata();
                this.applicaMovimentoAereo(inputMovimento, 0.7);
                break;

            case StatiDrago.CADUTA:
                corpo.setLinearDamping(0);
                this.applicaMovimentoAereo(inputMovimento, 0.3);
                break;

            case StatiDrago.SCHIANTO_METEORA:
                corpo.setLinearDamping(this.parametri.dampingSchianto);
                // Impulso verso il basso gestito in iniziaSchiantoMeteora
                break;
        }
    }

    /**
     * Applica movimento a terra
     */
    applicaMovimento(inputMovimento) {
        if (inputMovimento.length() < 0.1) return;

        const corpo = this.aggregatoFisico.body;

        // Converti input in direzione mondo (relativo alla camera)
        const direzioneMondo = this.sistemaInput.convertiInputInDirezioneCamera(inputMovimento);

        // Normalizza e scala per velocità
        direzioneMondo.normalize();
        direzioneMondo.scaleInPlace(this.parametri.velocitaMovimento);

        // Applica forza/impulso
        corpo.applyForce(
            new BABYLON.Vector3(direzioneMondo.x * 100, 0, direzioneMondo.z * 100),
            this.mesh.position
        );
    }

    /**
     * Applica movimento in aria (controllo ridotto)
     */
    applicaMovimentoAereo(inputMovimento, moltiplicatore) {
        if (inputMovimento.length() < 0.1) return;

        const corpo = this.aggregatoFisico.body;

        const direzioneMondo = this.sistemaInput.convertiInputInDirezioneCamera(inputMovimento);
        direzioneMondo.normalize();
        direzioneMondo.scaleInPlace(this.parametri.velocitaMovimento * moltiplicatore);

        corpo.applyForce(
            new BABYLON.Vector3(direzioneMondo.x * 50, 0, direzioneMondo.z * 50),
            this.mesh.position
        );
    }

    /**
     * Esegue il salto
     */
    eseguiSalto() {
        const corpo = this.aggregatoFisico.body;

        // Direzione opposta alla gravità (verso l'alto locale)
        const direzioneAlto = this.gestoreGravita.ottieniDirezioneSu();

        // Impulso istantaneo
        corpo.applyImpulse(
            direzioneAlto.scale(this.parametri.forzaSalto),
            this.mesh.position
        );

        // Timer per disabilitare raycast
        this.timerDopoSalto = 0.1;

        console.log('🦘 Salto!');
    }

    /**
     * Applica effetto planata (gravità ridotta)
     */
    applicaPlanata() {
        const corpo = this.aggregatoFisico.body;
        const velocita = corpo.getLinearVelocity();

        // Solo se stiamo scendendo
        if (velocita.y < 0) {
            // Applica forza antigravitazionale parziale
            const forzaAntigrav = this.gestoreGravita.ottieniDirezioneSu()
                .scale(this.parametri.massa * 9.81 * (1 - this.parametri.gravitaPlanata));

            corpo.applyForce(forzaAntigrav, this.mesh.position);

            // Damping verticale per rallentare la caduta
            const velocitaNuova = new BABYLON.Vector3(
                velocita.x,
                velocita.y * 0.95,  // Rallenta caduta
                velocita.z
            );
            corpo.setLinearVelocity(velocitaNuova);
        }
    }

    /**
     * Applica derapata (forza centrifuga opposta)
     */
    applicaDerapata(inputMovimento, velocitaCorrente) {
        const corpo = this.aggregatoFisico.body;

        // Direzione opposta alla velocità corrente
        const velocitaOrizz = new BABYLON.Vector3(velocitaCorrente.x, 0, velocitaCorrente.z);
        velocitaOrizz.normalize();

        // Forza centrifuga
        const forzaFrenata = velocitaOrizz.scale(-200);
        corpo.applyForce(forzaFrenata, this.mesh.position);

        // Continua a muoversi nella nuova direzione
        this.applicaMovimento(inputMovimento);
    }

    /**
     * Inizia lo schianto meteora
     */
    iniziaSchiantoMeteora() {
        const corpo = this.aggregatoFisico.body;

        // Reset velocità orizzontale
        const velocita = corpo.getLinearVelocity();
        corpo.setLinearVelocity(new BABYLON.Vector3(0, velocita.y, 0));

        // Impulso massiccio verso il basso
        const direzioneGiu = this.gestoreGravita.ottieniDirezioneGiu();
        corpo.applyImpulse(
            direzioneGiu.scale(this.parametri.forzaSchiantoMeteora),
            this.mesh.position
        );

        // Abilita CCD per evitare tunneling
        // (In Havok/Babylon, gestito automaticamente per alte velocità)

        console.log('☄️ Schianto Meteora!');
    }

    /**
     * Impatto dello schianto meteora
     */
    impattoSchiantoMeteora() {
        // Trigger camera shake
        if (window.gioco && window.gioco.gestoreCamera) {
            window.gioco.gestoreCamera.aggiungiTrauma(0.8);
        }

        // TODO: Creare onda d'urto fisica
        // TODO: Suono impatto

        console.log('💥 Impatto Schianto Meteora!');
    }

    /**
     * Calcola l'angolo di cambio direzione
     */
    calcolaAngoloCambioDirezione(inputMovimento) {
        if (inputMovimento.length() < 0.1 || this.direzionePrecedente.length() < 0.1) {
            return 0;
        }

        const inputNorm = inputMovimento.normalize();
        const precNorm = this.direzionePrecedente.normalize();

        const dot = BABYLON.Vector3.Dot(inputNorm, precNorm);
        return Math.acos(Math.max(-1, Math.min(1, dot)));
    }

    /**
     * Aggiorna la rotazione del drago verso la direzione di movimento
     */
    aggiornaRotazione(inputMovimento, deltaTime) {
        if (inputMovimento.length() < 0.1) return;

        const direzioneMondo = this.sistemaInput.convertiInputInDirezioneCamera(inputMovimento);
        if (direzioneMondo.length() < 0.1) return;

        // Calcola quaternion target
        const target = new BABYLON.Vector3(direzioneMondo.x, 0, direzioneMondo.z);
        target.normalize();

        // Angolo rispetto a forward
        const angolo = Math.atan2(target.x, target.z);
        const quatTarget = BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), angolo);

        // Slerp verso il target
        this.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(
            this.mesh.rotationQuaternion,
            quatTarget,
            0.15  // Velocità di rotazione
        );

        // Salva direzione
        this.direzionePrecedente = target.clone();
    }

    /**
     * Ottiene lo stato corrente
     */
    ottieniStato() {
        return this.statoCorrente;
    }

    /**
     * Controlla se il drago è a terra
     */
    isATerra() {
        return this.aTerra;
    }

    /**
     * Ottiene la posizione del drago
     */
    ottieniPosizione() {
        return this.mesh.position.clone();
    }

    /**
     * Ottiene la direzione forward del drago
     */
    ottieniDirezioneForward() {
        const forward = new BABYLON.Vector3(0, 0, 1);
        return forward.rotateByQuaternionToRef(this.mesh.rotationQuaternion, new BABYLON.Vector3());
    }
}
