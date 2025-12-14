/**
 * BUBBLE ATTACK - Golem-Geode
 * 
 * Gigante pesantissimo. Può essere sconfitto solo con Schianto Meteora o Trivella.
 * Categoria: Peso Massimo
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class GolemGeode extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 4,
            rangoRilevamento: 8,
            rangoAttacco: 3,
            puntiVita: 5,
            colpiPerCattura: -1,  // Non catturabile con bolle normali
            dannoContatto: 3,
            velocitaMovimento: 1.5,  // Molto lento
            puntiUccisione: 500,
            dropOro: { min: 10, max: 25 },
            dropFrutta: 'anguria',
            cooldownAttacco: 3.0,
            durataStordimento: 3.0,
            ...opzioni
        });

        this.tipo = TipiNemico.GOLEM_GEODE;
        this.categoria = CategorieNemico.PESO_MASSIMO;
        this.nomeVisualizzato = 'Golem-Geode';

        // Parametri specifici
        this.massa = 100.0;  // PESANTISSIMO
        this.attrito = 2.0;
        this.rimbalzo = 0;

        // Resistenze
        this.immuneBolleNormali = true;
        this.vulnerabileA = ['schiantoMeteora', 'trivella', 'bollaFulmineLv3'];

        // Attacco
        this.forzaPugno = 30;
        this.raggioOnda = 5;
    }

    async crea() {
        // Corpo massiccio (cubo grande con dettagli)
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            this.id,
            { width: 2, height: 2.5, depth: 1.5 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Testa piccola
        const testa = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_testa`,
            { width: 0.8, height: 0.6, depth: 0.6 },
            this.scene
        );
        testa.position.y = 1.5;
        testa.parent = this.mesh;

        // Braccia
        const braccioSx = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_braccioSx`,
            { width: 0.6, height: 1.5, depth: 0.6 },
            this.scene
        );
        braccioSx.position = new BABYLON.Vector3(-1.3, 0.3, 0);
        braccioSx.parent = this.mesh;

        const braccioDx = braccioSx.clone(`${this.id}_braccioDx`);
        braccioDx.position.x = 1.3;
        braccioDx.parent = this.mesh;

        // Materiale cristallino
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.5);
        materiale.specularColor = new BABYLON.Color3(0.8, 0.7, 1);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.15);
        this.mesh.material = materiale;

        // Materiale per parti (leggermente diverso)
        const matParti = materiale.clone(`mat_parti_${this.id}`);
        matParti.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.6);
        testa.material = matParti;
        braccioSx.material = matParti;
        braccioDx.material = matParti;

        // Cristalli decorativi
        for (let i = 0; i < 5; i++) {
            const cristallo = BABYLON.MeshBuilder.CreateCylinder(
                `${this.id}_cristallo_${i}`,
                { height: 0.4, diameterTop: 0, diameterBottom: 0.2 },
                this.scene
            );
            cristallo.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 2,
                0.8
            );
            cristallo.rotation.x = Math.random() * 0.5;
            cristallo.parent = this.mesh;

            const matCristallo = new BABYLON.StandardMaterial(`mat_crist_${i}`, this.scene);
            matCristallo.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.8);
            matCristallo.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.3);
            cristallo.material = matCristallo;
        }

        // Fisica pesante
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.BOX,
            {
                mass: this.massa,
                friction: this.attrito,
                restitution: 0
            },
            this.scene
        );

        this.aggregatoFisico.body.setAngularDamping(1000);

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'GolemGeode',
            istanza: this
        };

        console.log(`🗿 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    /**
     * Override - immune alle bolle normali
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        // Controlla se la bolla è un tipo speciale
        if (bolla && bolla.tipo) {
            if (this.vulnerabileA.includes(bolla.tipo)) {
                return super.colpitoDaBolla(bolla);
            }
        }

        // Bolla normale - respingi
        console.log(`🛡️ ${this.nomeVisualizzato} è immune! Usa Schianto Meteora o Trivella!`);

        if (bolla && bolla.aggregato) {
            const direzione = bolla.mesh.position.subtract(this.mesh.position).normalize();
            bolla.aggregato.body.applyImpulse(
                direzione.scale(20),
                bolla.mesh.position
            );
        }

        return false;
    }

    /**
     * Metodo speciale - danno da Schianto Meteora
     */
    colpitoDaSchiantoMeteora(danno = 2) {
        if (!this.vivo) return;

        this.puntiVita -= danno;
        this.stordisci();

        // Effetto visivo
        if (this.mesh.material) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.5);
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.15);
                }
            }, 500);
        }

        console.log(`💥 ${this.nomeVisualizzato} colpito! Vita: ${this.puntiVita}/${this.puntiVitaMax}`);

        if (this.puntiVita <= 0) {
            this.muori();
        }
    }

    /**
     * Override attacco - pugno a terra con onda d'urto
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;

        console.log(`👊 ${this.nomeVisualizzato} attacca!`);

        // Onda d'urto
        const distanza = BABYLON.Vector3.Distance(this.mesh.position, giocatore.position);

        if (distanza <= this.raggioOnda) {
            // Applica forza al giocatore
            const direzione = giocatore.position.subtract(this.mesh.position);
            direzione.y = 0.5;  // Solleva un po'
            direzione.normalize();

            // Simula onda d'urto
            // (Il giocatore controller dovrebbe gestire questo)
        }

        // Effetto visivo shake
        const posOriginale = this.mesh.position.clone();
        const shake = setInterval(() => {
            if (this.mesh) {
                this.mesh.position.x = posOriginale.x + (Math.random() - 0.5) * 0.2;
                this.mesh.position.z = posOriginale.z + (Math.random() - 0.5) * 0.2;
            }
        }, 50);

        setTimeout(() => {
            clearInterval(shake);
            if (this.mesh) {
                this.mesh.position = posOriginale;
            }
        }, 300);

        this.timerAttacco = this.cooldownAttacco;
    }
}
