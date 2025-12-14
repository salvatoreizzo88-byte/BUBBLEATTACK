/**
 * BUBBLE ATTACK - Fuoco-Buco-Nero
 * 
 * Nemico ladro che mangia le bolle! Solo attacchi fisici funzionano.
 * Categoria: Anomalia
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class FuocoBucoNero extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 8,
            rangoRilevamento: 10,
            rangoAttacco: 4,
            puntiVita: 3,
            colpiPerCattura: -1,  // Non catturabile con bolle!
            dannoContatto: 2,
            velocitaMovimento: 3.5,
            puntiUccisione: 350,
            dropOro: { min: 8, max: 20 },
            dropFrutta: 'stellaNera',
            cooldownAttacco: 1.5,
            ...opzioni
        });

        this.tipo = TipiNemico.FUOCO_BUCO_NERO;
        this.categoria = CategorieNemico.ANOMALIA;
        this.nomeVisualizzato = 'Fuoco-Buco-Nero';

        // Parametri specifici
        this.massa = 0.5;  // Leggero ma potente
        this.attrito = 0;
        this.rimbalzo = 0;
        this.gravitaScale = 0;

        // Buco nero
        this.raggioAspirazione = 4;
        this.forzaAspirazione = 5;
        this.bolleAssorbite = 0;
        this.maxBolleAssorbite = 5;  // Dopo 5 bolle, esplode!

        // Fluttuazione
        this.altezza = opzioni.altezza || 2;
        this.tempoFlutt = 0;
    }

    async crea() {
        // Disco accrezione (anello intorno al buco nero)
        const disco = BABYLON.MeshBuilder.CreateTorus(
            `${this.id}_disco`,
            { diameter: 1.5, thickness: 0.2, tessellation: 32 },
            this.scene
        );
        disco.position = this.posizioneIniziale.clone();
        disco.position.y = this.altezza;
        disco.rotation.x = Math.PI / 2;

        // Nucleo (sfera nera)
        const nucleo = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameter: 0.8 },
            this.scene
        );
        nucleo.position = disco.position.clone();
        this.mesh = nucleo;

        disco.parent = this.mesh;
        disco.position = BABYLON.Vector3.Zero();
        this.disco = disco;

        // Materiale buco nero
        const matNucleo = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        matNucleo.diffuseColor = new BABYLON.Color3(0.05, 0.02, 0.1);
        matNucleo.emissiveColor = new BABYLON.Color3(0.02, 0.01, 0.05);
        matNucleo.specularColor = new BABYLON.Color3(0, 0, 0);
        this.mesh.material = matNucleo;

        // Materiale disco (luminoso)
        const matDisco = new BABYLON.StandardMaterial('mat_disco', this.scene);
        matDisco.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.1);
        matDisco.emissiveColor = new BABYLON.Color3(0.9, 0.4, 0.1);
        disco.material = matDisco;

        // Fisica
        this.creaFisicaVolante();

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiFluttuanti();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'FuocoBucoNero',
            istanza: this
        };

        console.log(`🕳️ ${this.nomeVisualizzato} creato!`);

        return this;
    }

    creaFisicaVolante() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: this.massa, friction: 0, restitution: 0 },
            this.scene
        );

        this.aggregatoFisico.body.setAngularDamping(5);
        this.aggregatoFisico.body.setLinearDamping(2);
        this.aggregatoFisico.body.setGravityFactor(0);
    }

    generaPuntiFluttuanti() {
        const centro = this.posizioneIniziale;
        const raggio = this.rangoPatuglia;

        this.puntiPattuglia = [
            new BABYLON.Vector3(centro.x + raggio, this.altezza, centro.z),
            new BABYLON.Vector3(centro.x, this.altezza + 1, centro.z + raggio),
            new BABYLON.Vector3(centro.x - raggio, this.altezza, centro.z),
            new BABYLON.Vector3(centro.x, this.altezza - 1, centro.z - raggio)
        ];
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Rotazione disco
        if (this.disco) {
            this.disco.rotation.z += deltaTime * 3;
        }

        // Fluttuazione
        this.tempoFlutt += deltaTime;
        const offsetY = Math.sin(this.tempoFlutt) * 0.3;

        // Hover
        if (this.aggregatoFisico && !this.catturato) {
            const altezzaTarget = this.altezza + offsetY;
            const diff = altezzaTarget - this.mesh.position.y;
            const forzaHover = new BABYLON.Vector3(0, diff * this.massa * 30, 0);
            this.aggregatoFisico.body.applyForce(forzaHover, this.mesh.position);
        }

        // Scala in base alle bolle assorbite
        const scala = 1 + this.bolleAssorbite * 0.15;
        this.mesh.scaling = new BABYLON.Vector3(scala, scala, scala);

        // Controlla esplosione
        if (this.bolleAssorbite >= this.maxBolleAssorbite) {
            this.esplodi();
        }

        super.update(deltaTime, giocatore);
    }

    /**
     * Override - MANGIA le bolle invece di essere colpito!
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        // Assorbe la bolla!
        this.bolleAssorbite++;

        console.log(`🕳️ ${this.nomeVisualizzato} assorbe la bolla! (${this.bolleAssorbite}/${this.maxBolleAssorbite})`);

        // Effetto visivo
        if (this.mesh.material) {
            const intensita = this.bolleAssorbite / this.maxBolleAssorbite;
            this.disco.material.emissiveColor = new BABYLON.Color3(
                0.9 + intensita * 0.1,
                0.4 - intensita * 0.3,
                0.1
            );
        }

        // Distruggi la bolla
        if (bolla && bolla.timer !== undefined) {
            bolla.timer = 0;  // La bolla verrà distrutta nel prossimo update
        }

        return false;  // Non viene catturato
    }

    /**
     * Danneggiabile solo con attacchi fisici
     */
    colpitoDaSchiantoMeteora(danno = 2) {
        if (!this.vivo) return;

        this.puntiVita -= danno;
        this.stordisci();

        console.log(`💥 ${this.nomeVisualizzato} colpito fisicamente! Vita: ${this.puntiVita}/${this.puntiVitaMax}`);

        if (this.puntiVita <= 0) {
            this.esplodi();
        }
    }

    esplodi() {
        console.log(`💥🕳️ ${this.nomeVisualizzato} ESPLODE!`);

        // Effetto esplosione
        const esplosione = BABYLON.MeshBuilder.CreateSphere(
            'esplosione_bn',
            { diameter: this.raggioAspirazione * 2 },
            this.scene
        );
        esplosione.position = this.mesh.position.clone();

        const mat = new BABYLON.StandardMaterial('mat_exp_bn', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.1, 0, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.8);
        mat.alpha = 0.8;
        esplosione.material = mat;
        esplosione.isPickable = false;

        // Animazione
        let scala = 0.1;
        const expand = setInterval(() => {
            scala += 0.3;
            esplosione.scaling = new BABYLON.Vector3(scala, scala, scala);
            mat.alpha -= 0.08;

            if (scala >= 2) {
                clearInterval(expand);
                esplosione.dispose();
            }
        }, 50);

        // Rilascia le bolle assorbite come loot
        // (In una implementazione completa, spawnerebbero monete extra)

        this.muori();
    }

    /**
     * Attira le bolle nel raggio
     */
    attiraBolle(listaBolle) {
        if (!this.mesh) return;

        for (const bolla of listaBolle) {
            if (!bolla.mesh) continue;

            const distanza = BABYLON.Vector3.Distance(
                this.mesh.position,
                bolla.mesh.position
            );

            if (distanza <= this.raggioAspirazione && distanza > 0.5) {
                // Attira verso il buco nero
                const direzione = this.mesh.position.subtract(bolla.mesh.position);
                direzione.normalize();

                const forza = direzione.scale(this.forzaAspirazione / distanza);

                if (bolla.aggregato && bolla.aggregato.body) {
                    bolla.aggregato.body.applyForce(forza, bolla.mesh.position);
                }
            }
        }
    }
}
