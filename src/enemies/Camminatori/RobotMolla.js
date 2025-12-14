/**
 * BUBBLE ATTACK - Robot-Molla
 * 
 * Nemico saltatore. Salta verso il giocatore con alta restitution.
 * Categoria: Camminatore
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class RobotMolla extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 4,
            rangoRilevamento: 10,
            rangoAttacco: 3,
            puntiVita: 1,
            colpiPerCattura: 1,
            dannoContatto: 1,
            velocitaMovimento: 2.0,
            puntiUccisione: 150,
            dropOro: { min: 2, max: 5 },
            dropFrutta: 'arancia',
            ...opzioni
        });

        this.tipo = TipiNemico.ROBOT_MOLLA;
        this.categoria = CategorieNemico.CAMMINATORE;
        this.nomeVisualizzato = 'Robot-Molla';

        // Parametri specifici
        this.massa = 0.8;
        this.attrito = 0.5;
        this.rimbalzo = 1.2;  // Super rimbalzante!

        // Salto
        this.forzaSalto = 15;
        this.cooldownSalto = 2.0;
        this.timerSalto = 0;
        this.aTerra = false;
    }

    async crea() {
        // Corpo a molla (cilindro + sfera)
        const corpo = BABYLON.MeshBuilder.CreateCylinder(
            this.id,
            { height: 0.6, diameterTop: 0.4, diameterBottom: 0.6 },
            this.scene
        );

        const testa = BABYLON.MeshBuilder.CreateSphere(
            `${this.id}_testa`,
            { diameter: 0.7 },
            this.scene
        );
        testa.position.y = 0.5;
        testa.parent = corpo;

        this.mesh = corpo;
        this.mesh.position = this.posizioneIniziale.clone();

        // Materiale colorato
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
        materiale.specularColor = new BABYLON.Color3(1, 1, 1);
        this.mesh.material = materiale;

        const matTesta = new BABYLON.StandardMaterial(`mat_testa_${this.id}`, this.scene);
        matTesta.diffuseColor = new BABYLON.Color3(0.3, 0.9, 0.4);
        matTesta.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1);
        testa.material = matTesta;

        // Fisica con alto rimbalzo
        this.creaFisica();

        // Override rimbalzo per aggegato
        // (nota: già incluso nei parametri base)

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'RobotMolla',
            istanza: this
        };

        console.log(`🦘 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Timer salto
        if (this.timerSalto > 0) this.timerSalto -= deltaTime;

        // Check terra
        const ray = new BABYLON.Ray(this.mesh.position, new BABYLON.Vector3(0, -1, 0), 1);
        const hit = this.scene.pickWithRay(ray, (m) => m !== this.mesh && m.isPickable);
        this.aTerra = hit && hit.hit;

        // Chiama update base
        super.update(deltaTime, giocatore);
    }

    /**
     * Override attacco - salta verso il giocatore
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerSalto > 0 || !this.aTerra) return;

        // Calcola direzione e salta
        const direzione = giocatore.position.subtract(this.mesh.position);
        direzione.normalize();

        const forzaSalto = new BABYLON.Vector3(
            direzione.x * this.forzaSalto * 0.7,
            this.forzaSalto,
            direzione.z * this.forzaSalto * 0.7
        );

        this.aggregatoFisico.body.applyImpulse(
            forzaSalto.scale(this.massa),
            this.mesh.position
        );

        this.timerSalto = this.cooldownSalto;
        this.timerAttacco = this.cooldownAttacco;
    }

    /**
     * Override inseguimento - salta invece di camminare
     */
    eseguiInseguimento(deltaTime, giocatore) {
        if (!giocatore) return;

        if (this.aTerra && this.timerSalto <= 0) {
            // Piccolo salto verso giocatore
            const direzione = giocatore.position.subtract(this.mesh.position);
            direzione.normalize();

            const forzaSalto = new BABYLON.Vector3(
                direzione.x * this.forzaSalto * 0.4,
                this.forzaSalto * 0.6,
                direzione.z * this.forzaSalto * 0.4
            );

            this.aggregatoFisico.body.applyImpulse(
                forzaSalto.scale(this.massa),
                this.mesh.position
            );

            this.timerSalto = this.cooldownSalto * 0.5;
        }
    }
}
