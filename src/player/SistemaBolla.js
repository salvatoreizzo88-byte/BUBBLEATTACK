/**
 * BUBBLE ATTACK - Sistema Bolla
 * 
 * Gestisce la creazione, fisica e comportamento delle bolle.
 * Le bolle sono oggetti fisici complessi con antigravità e logica "one-way".
 */

export class SistemaBolla {
    constructor(scene, controllerDrago, gestoreGravita) {
        this.scene = scene;
        this.controllerDrago = controllerDrago;
        this.gestoreGravita = gestoreGravita;

        // Pool di bolle attive
        this.bolleAttive = [];
        this.maxBolle = 30;  // Limite per performance mobile

        // Parametri fisici della bolla (da specifica)
        this.parametri = {
            massa: 0.05,           // kg - ultraleggera
            massaConNemico: 5.0,   // kg - quando cattura un nemico
            gravita: -0.16666,     // Antigravità (galleggia verso l'alto)
            gravitaConNemico: 0.1, // Gravità quando contiene nemico
            rimbalzo: 0.9,         // Alta restitution
            smorzamento: 0.8,      // Frena subito dopo lo sparo
            raggio: 0.6,           // Raggio della bolla
            velocitaSparo: 15,     // Velocità iniziale
            raggioCatena: 1.5,     // Raggio per reazione a catena
            durataVita: 8,         // Secondi prima di scoppiare
            rinculoGiocatore: 0.5  // Forza di rinculo sul giocatore
        };

        // Cooldown sparo
        this.cooldownSparo = 0.2;  // Secondi tra uno sparo e l'altro
        this.timerCooldown = 0;

        // Materiali
        this.materialeBolla = null;
        this.creaMateriali();
    }

    /**
     * Crea i materiali per le bolle
     */
    creaMateriali() {
        // Materiale bolla base (trasparente e lucido)
        this.materialeBolla = new BABYLON.StandardMaterial('matBolla', this.scene);
        this.materialeBolla.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
        this.materialeBolla.specularColor = new BABYLON.Color3(1, 1, 1);
        this.materialeBolla.specularPower = 128;
        this.materialeBolla.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.3);
        this.materialeBolla.alpha = 0.7;
        this.materialeBolla.backFaceCulling = false;

        // Effetto Fresnel per bordi brillanti
        this.materialeBolla.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        this.materialeBolla.emissiveFresnelParameters.bias = 0.6;
        this.materialeBolla.emissiveFresnelParameters.power = 4;
        this.materialeBolla.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
        this.materialeBolla.emissiveFresnelParameters.rightColor = new BABYLON.Color3(0, 0.5, 1);
    }

    /**
     * Update loop del sistema bolle
     */
    update(deltaTime) {
        // Gestisci cooldown
        if (this.timerCooldown > 0) {
            this.timerCooldown -= deltaTime;
        }

        // Controlla input sparo
        const input = window.gioco?.sistemaInput?.getInput();
        if (input?.sparo && this.timerCooldown <= 0) {
            this.sparaBolla();
            this.timerCooldown = this.cooldownSparo;
        }

        // Aggiorna tutte le bolle attive
        for (let i = this.bolleAttive.length - 1; i >= 0; i--) {
            const bolla = this.bolleAttive[i];

            // Aggiorna timer vita
            bolla.timerVita -= deltaTime;

            // Controlla se deve scoppiare
            if (bolla.timerVita <= 0) {
                this.scoppiaBolla(bolla);
                continue;
            }

            // Applica antigravità personalizzata
            this.applicaAntigravita(bolla);

            // Controlla collisione "one-way" col giocatore
            this.controllaCollisioneGiocatore(bolla);
        }
    }

    /**
     * Spara una nuova bolla
     */
    sparaBolla() {
        // Limita numero bolle
        if (this.bolleAttive.length >= this.maxBolle) {
            // Rimuovi la più vecchia
            this.scoppiaBolla(this.bolleAttive[0]);
        }

        // Ottieni posizione e direzione dal drago
        const posizioneDrago = this.controllerDrago.ottieniPosizione();
        const direzioneDrago = this.controllerDrago.ottieniDirezioneForward();

        // Posizione di spawn (davanti al drago)
        const posizioneSpawn = posizioneDrago.add(direzioneDrago.scale(1.5));
        posizioneSpawn.y += 0.5;  // Leggermente più in alto

        // Crea la mesh della bolla
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `bolla_${Date.now()}`,
            { diameter: this.parametri.raggio * 2, segments: 16 },
            this.scene
        );
        mesh.position = posizioneSpawn;
        mesh.material = this.materialeBolla;

        // Crea fisica
        const aggregatoFisico = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            {
                mass: this.parametri.massa,
                friction: 0.0,
                restitution: this.parametri.rimbalzo
            },
            this.scene
        );

        // Imposta damping
        aggregatoFisico.body.setLinearDamping(this.parametri.smorzamento);

        // Applica velocità iniziale
        const velocitaIniziale = direzioneDrago.scale(this.parametri.velocitaSparo);
        aggregatoFisico.body.setLinearVelocity(velocitaIniziale);

        // Crea oggetto bolla
        const bolla = {
            mesh: mesh,
            aggregatoFisico: aggregatoFisico,
            timerVita: this.parametri.durataVita,
            contienNemico: false,
            nemicoContenuto: null,
            solida: false  // Per logica one-way
        };

        this.bolleAttive.push(bolla);

        // Applica rinculo al giocatore (terza legge di Newton)
        this.applicaRinculoGiocatore(direzioneDrago);

        // Suono sparo
        // TODO: Aggiungere effetto audio

        console.log('🫧 Bolla sparata!');
    }

    /**
     * Applica rinculo al giocatore quando spara
     */
    applicaRinculoGiocatore(direzioneSparo) {
        if (!this.controllerDrago.aggregatoFisico) return;

        const corpo = this.controllerDrago.aggregatoFisico.body;

        // Solo se in aria
        if (!this.controllerDrago.isATerra()) {
            const forzaRinculo = direzioneSparo.scale(-this.parametri.rinculoGiocatore);
            corpo.applyImpulse(forzaRinculo, this.controllerDrago.mesh.position);
        }
    }

    /**
     * Applica antigravità personalizzata
     */
    applicaAntigravita(bolla) {
        const corpo = bolla.aggregatoFisico.body;

        // Calcola forza antigravitazionale
        // F = m * g * (1 + antigrav_factor)
        const gravitaTarget = bolla.contienNemico
            ? this.parametri.gravitaConNemico
            : this.parametri.gravita;

        const forzaAntigrav = this.gestoreGravita.ottieniDirezioneSu()
            .scale(bolla.aggregatoFisico.body.getMassProperties().mass * 9.81 * (1 - gravitaTarget));

        corpo.applyForce(forzaAntigrav, bolla.mesh.position);
    }

    /**
     * Controlla collisione "one-way" col giocatore
     */
    controllaCollisioneGiocatore(bolla) {
        if (!this.controllerDrago.mesh) return;

        const posGiocatore = this.controllerDrago.mesh.position;
        const posBolla = bolla.mesh.position;
        const velocitaGiocatore = this.controllerDrago.aggregatoFisico?.body.getLinearVelocity();

        if (!velocitaGiocatore) return;

        // Calcola distanza
        const distanza = BABYLON.Vector3.Distance(posGiocatore, posBolla);
        const raggioCollisione = this.parametri.raggio + 0.5;  // Raggio bolla + raggio drago

        if (distanza < raggioCollisione * 1.5) {
            // Logica "one-way":
            // - FANTASMA se giocatore sale da sotto (velocitaY > 0) O se sopra la bolla
            // - SOLIDA se giocatore cade da sopra (velocitaY <= 0) E sopra la bolla

            const giocatoreSopra = posGiocatore.y > posBolla.y;
            const giocatoreSale = velocitaGiocatore.y > 0.5;

            if (giocatoreSopra && !giocatoreSale) {
                // Bolla solida - può essere usata come piattaforma
                bolla.solida = true;

                // Se il giocatore atterra sulla bolla, effetto trampolino
                if (distanza < raggioCollisione && velocitaGiocatore.y < -2) {
                    this.effettoTrampolino(bolla);
                }
            } else {
                // Bolla fantasma - il giocatore passa attraverso
                bolla.solida = false;
            }
        }
    }

    /**
     * Effetto trampolino quando si salta su una bolla
     */
    effettoTrampolino(bolla) {
        const corpo = this.controllerDrago.aggregatoFisico.body;
        const velocita = corpo.getLinearVelocity();

        // Inverti e aumenta velocità verticale (restitution > 1)
        const nuovaVelocitaY = Math.abs(velocita.y) * 1.2;
        corpo.setLinearVelocity(new BABYLON.Vector3(velocita.x, nuovaVelocitaY, velocita.z));

        // Scuoti un po' la bolla
        bolla.aggregatoFisico.body.applyImpulse(
            new BABYLON.Vector3(0, -2, 0),
            bolla.mesh.position
        );

        console.log('🦘 Trampolino bolla!');
    }

    /**
     * Scoppia una bolla con reazione a catena
     */
    scoppiaBolla(bolla) {
        // Rimuovi dalla lista
        const indice = this.bolleAttive.indexOf(bolla);
        if (indice > -1) {
            this.bolleAttive.splice(indice, 1);
        }

        // Effetto visivo
        this.creaEffettoScoppio(bolla.mesh.position);

        // Reazione a catena
        this.reazioneACatena(bolla.mesh.position);

        // Rilascia nemico se presente
        if (bolla.contienNemico && bolla.nemicoContenuto) {
            // TODO: Rilasciare nemico o distruggerlo
        }

        // Distruggi fisica e mesh
        bolla.aggregatoFisico.dispose();
        bolla.mesh.dispose();

        // Camera shake leggero
        if (window.gioco?.gestoreCamera) {
            window.gioco.gestoreCamera.aggiungiTrauma(0.1);
        }
    }

    /**
     * Crea effetto visivo di scoppio
     */
    creaEffettoScoppio(posizione) {
        // Particelle semplici
        const particelle = new BABYLON.ParticleSystem('scoppioBolle', 20, this.scene);
        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVQYV2NkYGD4z4AEGBl+M+ACGMIBAPh0AqcAAAAASUVORK5CYII=',
            this.scene
        );

        particelle.emitter = posizione;
        particelle.minSize = 0.1;
        particelle.maxSize = 0.3;
        particelle.minLifeTime = 0.1;
        particelle.maxLifeTime = 0.3;
        particelle.emitRate = 0;
        particelle.manualEmitCount = 20;
        particelle.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particelle.direction2 = new BABYLON.Vector3(1, 1, 1);
        particelle.minEmitPower = 2;
        particelle.maxEmitPower = 5;

        particelle.color1 = new BABYLON.Color4(0.5, 0.8, 1, 1);
        particelle.color2 = new BABYLON.Color4(1, 1, 1, 0.5);

        particelle.start();

        // Auto-distruzione dopo animazione
        setTimeout(() => {
            particelle.dispose();
        }, 500);
    }

    /**
     * Reazione a catena - scoppia bolle vicine
     */
    reazioneACatena(posizione) {
        const bolleDaScoppiare = [];

        for (const bolla of this.bolleAttive) {
            const distanza = BABYLON.Vector3.Distance(posizione, bolla.mesh.position);
            if (distanza < this.parametri.raggioCatena) {
                bolleDaScoppiare.push(bolla);
            }
        }

        // Scoppia con ritardo sequenziale
        bolleDaScoppiare.forEach((bolla, index) => {
            setTimeout(() => {
                if (this.bolleAttive.includes(bolla)) {
                    this.scoppiaBolla(bolla);
                }
            }, index * 100);  // 0.1s di ritardo tra ogni scoppio
        });
    }

    /**
     * Cattura un nemico in una bolla
     */
    catturaNemico(bolla, nemico) {
        if (bolla.contienNemico) return;

        bolla.contienNemico = true;
        bolla.nemicoContenuto = nemico;

        // Aumenta massa
        bolla.aggregatoFisico.body.setMassProperties({
            mass: this.parametri.massaConNemico
        });

        // TODO: Attaccare nemico alla bolla (LockJoint)
        // TODO: Animazione cattura

        console.log('🔒 Nemico catturato!');
    }

    /**
     * Ottiene tutte le bolle attive
     */
    ottieniBolleAttive() {
        return this.bolleAttive;
    }
}
