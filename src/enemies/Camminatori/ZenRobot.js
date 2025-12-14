/**
 * BUBBLE ATTACK - Zen-Robot
 * 
 * Nemico base tipo "Soldato". Pattuglia e inverte direzione ai burroni.
 * Categoria: Camminatore
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class ZenRobot extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 5,
            rangoRilevamento: 8,
            rangoAttacco: 1.5,
            puntiVita: 1,
            colpiPerCattura: 1,
            dannoContatto: 1,
            velocitaMovimento: 3.0,
            puntiUccisione: 100,
            dropOro: { min: 1, max: 3 },
            dropFrutta: 'mela',
            ...opzioni
        });

        this.tipo = TipiNemico.ZEN_ROBOT;
        this.categoria = CategorieNemico.CAMMINATORE;
        this.nomeVisualizzato = 'Zen-Robot';

        // Parametri specifici
        this.massa = 1.0;
        this.attrito = 1.0;
    }

    async crea() {
        // Corpo principale (cubo con testa)
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            this.id,
            { width: 0.8, height: 1.2, depth: 0.6 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Materiale metallico
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
        materiale.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        this.mesh.material = materiale;

        // Occhio (sfera luminosa)
        const occhio = BABYLON.MeshBuilder.CreateSphere(
            `${this.id}_occhio`,
            { diameter: 0.25 },
            this.scene
        );
        occhio.position = new BABYLON.Vector3(0, 0.3, 0.35);
        occhio.parent = this.mesh;

        const matOcchio = new BABYLON.StandardMaterial(`mat_occhio_${this.id}`, this.scene);
        matOcchio.emissiveColor = new BABYLON.Color3(1, 0, 0);
        occhio.material = matOcchio;

        // Fisica
        this.creaFisica();

        // Genera punti pattuglia
        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        // Metadata
        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'ZenRobot',
            istanza: this
        };

        console.log(`🤖 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    /**
     * Override attacco - carica frontale
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;

        // Carica verso il giocatore
        const direzione = giocatore.position.subtract(this.mesh.position);
        direzione.y = 0;
        direzione.normalize();

        const forzaCarica = direzione.scale(this.massa * 500);
        this.aggregatoFisico.body.applyImpulse(forzaCarica, this.mesh.position);

        this.timerAttacco = this.cooldownAttacco;
    }
}
