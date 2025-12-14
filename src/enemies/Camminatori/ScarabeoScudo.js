/**
 * BUBBLE ATTACK - Scarabeo-Scudo
 * 
 * Nemico corazzato. Ha uno scudo frontale che respinge le bolle.
 * Bisogna colpirlo da dietro o dai lati.
 * Categoria: Camminatore
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class ScarabeoScudo extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 6,
            rangoRilevamento: 8,
            rangoAttacco: 2,
            puntiVita: 1,
            colpiPerCattura: 1,
            dannoContatto: 2,  // Più danno
            velocitaMovimento: 2.5,
            puntiUccisione: 200,
            dropOro: { min: 3, max: 8 },
            dropFrutta: 'melone',
            cooldownAttacco: 2.0,
            ...opzioni
        });

        this.tipo = TipiNemico.SCARABEO_SCUDO;
        this.categoria = CategorieNemico.CAMMINATORE;
        this.nomeVisualizzato = 'Scarabeo-Scudo';

        // Parametri specifici
        this.massa = 2.0;  // Più pesante
        this.attrito = 1.5;
        this.rimbalzo = 0.0;

        // Scudo
        this.scudoAttivo = true;
        this.angoloScudo = Math.PI / 3;  // 60° di protezione frontale
        this.restitutionScudo = 2.0;

        // Carica
        this.inCarica = false;
        this.velocitaCarica = 12;
        this.durataCarica = 0.5;
        this.timerCarica = 0;
    }

    async crea() {
        // Corpo scarabeo (ellissoide schiacciato)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameterX: 1.2, diameterY: 0.6, diameterZ: 1.0 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Scudo frontale
        const scudo = BABYLON.MeshBuilder.CreateDisc(
            `${this.id}_scudo`,
            { radius: 0.6 },
            this.scene
        );
        scudo.position = new BABYLON.Vector3(0, 0.1, 0.55);
        scudo.rotation.x = Math.PI / 2;
        scudo.parent = this.mesh;

        // Materiale corazza
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        materiale.specularColor = new BABYLON.Color3(0.6, 0.5, 0.3);
        this.mesh.material = materiale;

        const matScudo = new BABYLON.StandardMaterial(`mat_scudo_${this.id}`, this.scene);
        matScudo.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.3);
        matScudo.specularColor = new BABYLON.Color3(1, 1, 0.8);
        matScudo.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.05);
        scudo.material = matScudo;
        this.meshScudo = scudo;

        // Fisica più pesante
        this.creaFisica();

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'ScarabeoScudo',
            istanza: this
        };

        console.log(`🪲 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    /**
     * Override per controllare se la bolla colpisce lo scudo
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        // Controlla angolo di impatto
        if (this.scudoAttivo && bolla && bolla.mesh) {
            const direzioneBolla = bolla.mesh.position.subtract(this.mesh.position);
            direzioneBolla.y = 0;
            direzioneBolla.normalize();

            // Angolo rispetto alla direzione del nemico
            const angolo = Math.acos(BABYLON.Vector3.Dot(this.direzioneCorrente, direzioneBolla));

            if (angolo < this.angoloScudo) {
                // Colpo sullo scudo! Respingi la bolla
                console.log(`🛡️ ${this.nomeVisualizzato} blocca con lo scudo!`);

                // Rimbalza la bolla
                if (bolla.aggregato && bolla.aggregato.body) {
                    const rimbalzo = direzioneBolla.scale(-this.restitutionScudo * 10);
                    bolla.aggregato.body.applyImpulse(rimbalzo, bolla.mesh.position);
                }

                return false;  // Bolla respinta
            }
        }

        // Colpito da dietro o dai lati
        return super.colpitoDaBolla(bolla);
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Timer carica
        if (this.timerCarica > 0) {
            this.timerCarica -= deltaTime;
            if (this.timerCarica <= 0) {
                this.inCarica = false;
            }
        }

        super.update(deltaTime, giocatore);
    }

    /**
     * Override attacco - carica frontale con scudo
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0 || this.inCarica) return;

        // Inizia carica
        this.inCarica = true;
        this.timerCarica = this.durataCarica;

        const direzione = giocatore.position.subtract(this.mesh.position);
        direzione.y = 0;
        direzione.normalize();

        const forzaCarica = direzione.scale(this.massa * this.velocitaCarica * 50);
        this.aggregatoFisico.body.applyImpulse(forzaCarica, this.mesh.position);

        // Effetto visivo scudo
        if (this.meshScudo && this.meshScudo.material) {
            this.meshScudo.material.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.1);
            setTimeout(() => {
                if (this.meshScudo && this.meshScudo.material) {
                    this.meshScudo.material.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.05);
                }
            }, this.durataCarica * 1000);
        }

        this.timerAttacco = this.cooldownAttacco;
    }
}
