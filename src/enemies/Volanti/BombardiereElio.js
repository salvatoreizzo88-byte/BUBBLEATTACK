/**
 * BUBBLE ATTACK - Bombardiere-Elio
 * 
 * Nemico volante che galleggia sopra il giocatore e sgancia mine AoE.
 * Categoria: Volante
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class BombardiereElio extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 10,
            rangoRilevamento: 15,
            rangoAttacco: 8,
            puntiVita: 2,
            colpiPerCattura: 2,
            dannoContatto: 1,
            velocitaMovimento: 3.0,
            puntiUccisione: 200,
            dropOro: { min: 3, max: 8 },
            dropFrutta: 'uva',
            cooldownAttacco: 3.0,
            ...opzioni
        });

        this.tipo = TipiNemico.BOMBARDIERE_ELIO;
        this.categoria = CategorieNemico.VOLANTE;
        this.nomeVisualizzato = 'Bombardiere-Elio';

        // Parametri specifici
        this.massa = 0.3;
        this.attrito = 0;
        this.rimbalzo = 0.5;
        this.gravitaScale = 0;

        // Volo
        this.altezzaVolo = opzioni.altezzaVolo || 6;
        this.oscillazione = 0;

        // Mine
        this.mineAttive = [];
        this.maxMine = 3;
        this.raggioEsplosione = 3;
        this.tempoArmo = 1.5;  // Secondi prima che la mina sia attiva
    }

    async crea() {
        // Corpo pallone (sferoide)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameterX: 1.5, diameterY: 2, diameterZ: 1.5 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();
        this.mesh.position.y = this.altezzaVolo;

        // Gondola sotto
        const gondola = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_gondola`,
            { width: 0.6, height: 0.4, depth: 0.6 },
            this.scene
        );
        gondola.position.y = -1.2;
        gondola.parent = this.mesh;

        // Cavi
        for (let i = 0; i < 4; i++) {
            const cavo = BABYLON.MeshBuilder.CreateCylinder(
                `${this.id}_cavo_${i}`,
                { height: 0.8, diameter: 0.03 },
                this.scene
            );
            const angolo = (i / 4) * Math.PI * 2;
            cavo.position = new BABYLON.Vector3(
                Math.cos(angolo) * 0.3,
                -0.8,
                Math.sin(angolo) * 0.3
            );
            cavo.parent = this.mesh;
        }

        // Materiale
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.8);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        this.mesh.material = materiale;

        const matGondola = new BABYLON.StandardMaterial(`mat_gondola_${this.id}`, this.scene);
        matGondola.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        gondola.material = matGondola;

        // Fisica volante
        this.creaFisicaVolante();

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'BombardiereElio',
            istanza: this
        };

        console.log(`🎈 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    creaFisicaVolante() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: this.massa, friction: 0, restitution: this.rimbalzo },
            this.scene
        );

        this.aggregatoFisico.body.setAngularDamping(50);
        this.aggregatoFisico.body.setLinearDamping(2);
        this.aggregatoFisico.body.setGravityFactor(0);
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Oscillazione hover
        this.oscillazione += deltaTime * 1.5;
        const offsetY = Math.sin(this.oscillazione) * 0.3;

        // Mantieni altezza
        if (this.aggregatoFisico && !this.catturato) {
            const altezzaTarget = this.altezzaVolo + offsetY;
            const diff = altezzaTarget - this.mesh.position.y;
            const forzaHover = new BABYLON.Vector3(0, diff * this.massa * 25, 0);
            this.aggregatoFisico.body.applyForce(forzaHover, this.mesh.position);
        }

        // Aggiorna mine
        this.aggiornaMine(deltaTime);

        super.update(deltaTime, giocatore);
    }

    /**
     * Override inseguimento - resta sopra il giocatore
     */
    eseguiInseguimento(deltaTime, giocatore) {
        if (!giocatore) return;

        // Posizione target: sopra il giocatore
        const target = giocatore.position.clone();
        target.y = this.altezzaVolo;

        const direzione = target.subtract(this.mesh.position);
        direzione.y = 0;

        if (direzione.length() > 1) {
            const forza = direzione.normalize().scale(this.massa * this.velocitaMovimento * 20);
            this.aggregatoFisico.body.applyForce(forza, this.mesh.position);
        }
    }

    /**
     * Override attacco - sgancia mina
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;
        if (this.mineAttive.length >= this.maxMine) return;

        this.sgianciaMina();
        this.timerAttacco = this.cooldownAttacco;
    }

    sgianciaMina() {
        // Crea mina
        const mina = BABYLON.MeshBuilder.CreateSphere(
            `mina_${this.id}_${Date.now()}`,
            { diameter: 0.5 },
            this.scene
        );
        mina.position = this.mesh.position.clone();
        mina.position.y -= 1.5;

        const matMina = new BABYLON.StandardMaterial('mat_mina', this.scene);
        matMina.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        matMina.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        mina.material = matMina;

        // Fisica mina
        const aggregato = new BABYLON.PhysicsAggregate(
            mina,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 1, friction: 0.8, restitution: 0.3 },
            this.scene
        );

        const minaObj = {
            mesh: mina,
            aggregato: aggregato,
            timerArmo: this.tempoArmo,
            armata: false,
            esplosa: false
        };

        this.mineAttive.push(minaObj);

        console.log(`💣 ${this.nomeVisualizzato} sgancia mina!`);
    }

    aggiornaMine(deltaTime) {
        for (let i = this.mineAttive.length - 1; i >= 0; i--) {
            const mina = this.mineAttive[i];

            // Timer armo
            if (!mina.armata) {
                mina.timerArmo -= deltaTime;
                if (mina.timerArmo <= 0) {
                    mina.armata = true;
                    // Cambia colore quando armata
                    if (mina.mesh.material) {
                        mina.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                    }
                }
            }

            // Controlla prossimità giocatore
            if (mina.armata && !mina.esplosa) {
                // La logica di esplosione andrebbe gestita dal game loop
                // Per ora la mina esplode dopo 5 secondi
                mina.timerArmo -= deltaTime;
                if (mina.timerArmo <= -5) {
                    this.esplodiMina(mina);
                }
            }

            // Rimuovi se esplosa
            if (mina.esplosa) {
                this.mineAttive.splice(i, 1);
            }
        }
    }

    esplodiMina(mina) {
        if (mina.esplosa) return;
        mina.esplosa = true;

        const posizione = mina.mesh.position.clone();

        // Effetto esplosione
        const esplosione = BABYLON.MeshBuilder.CreateSphere(
            'esplosione',
            { diameter: this.raggioEsplosione * 2 },
            this.scene
        );
        esplosione.position = posizione;

        const matEsplosione = new BABYLON.StandardMaterial('mat_exp', this.scene);
        matEsplosione.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        matEsplosione.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
        matEsplosione.alpha = 0.7;
        esplosione.material = matEsplosione;
        esplosione.isPickable = false;

        // Animazione espansione/dissolvenza
        let scala = 0.1;
        const expand = setInterval(() => {
            scala += 0.2;
            esplosione.scaling = new BABYLON.Vector3(scala, scala, scala);
            matEsplosione.alpha -= 0.1;

            if (scala >= 1) {
                clearInterval(expand);
                esplosione.dispose();
            }
        }, 50);

        // Pulisci mina
        mina.aggregato.dispose();
        mina.mesh.dispose();

        console.log(`💥 Mina esplosa!`);
    }

    distruggi() {
        // Pulisci mine
        for (const mina of this.mineAttive) {
            if (mina.aggregato) mina.aggregato.dispose();
            if (mina.mesh) mina.mesh.dispose();
        }
        this.mineAttive = [];

        super.distruggi();
    }
}
