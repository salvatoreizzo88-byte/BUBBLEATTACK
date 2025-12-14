/**
 * BUBBLE ATTACK - Forziere-Mimo
 * 
 * Trappola! Sembra un forziere normale ma attacca quando avvicinato.
 * Rilevabile con Occhiali Spettrali.
 * Categoria: Anomalia
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class ForziereMimo extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: false,  // Fermo finché non attivato
            rangoRilevamento: 3,
            rangoAttacco: 2,
            puntiVita: 2,
            colpiPerCattura: 2,
            dannoContatto: 3,
            velocitaMovimento: 6.0,  // Veloce quando attivato
            puntiUccisione: 300,
            dropOro: { min: 10, max: 25 },  // Molto oro!
            dropFrutta: 'diamante',  // Drop raro
            cooldownAttacco: 1.0,
            ...opzioni
        });

        this.tipo = TipiNemico.FORZIERE_MIMO;
        this.categoria = CategorieNemico.ANOMALIA;
        this.nomeVisualizzato = 'Forziere-Mimo';

        // Parametri specifici
        this.massa = 3.0;
        this.attrito = 0.8;
        this.rimbalzo = 0.2;

        // Stati mimo
        this.dormiente = true;
        this.risvegliato = false;
        this.tempoRisveglio = 0;

        // Rilevabilità
        this.rilevatoDaOcchiali = false;
    }

    async crea() {
        // Corpo forziere (box)
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            this.id,
            { width: 1.2, height: 0.8, depth: 0.8 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Coperchio
        this.coperchio = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_coperchio`,
            { width: 1.2, height: 0.2, depth: 0.8 },
            this.scene
        );
        this.coperchio.position = new BABYLON.Vector3(0, 0.5, 0);
        this.coperchio.setPivotPoint(new BABYLON.Vector3(0, 0, -0.4));
        this.coperchio.parent = this.mesh;

        // Lingua (nascosta inizialmente)
        this.lingua = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_lingua`,
            { width: 0.8, height: 0.1, depth: 0.5 },
            this.scene
        );
        this.lingua.position = new BABYLON.Vector3(0, 0.2, 0.3);
        this.lingua.parent = this.mesh;
        this.lingua.setEnabled(false);

        // Denti
        this.denti = [];
        for (let i = -0.4; i <= 0.4; i += 0.2) {
            const dente = BABYLON.MeshBuilder.CreateCylinder(
                `${this.id}_dente_${i}`,
                { height: 0.2, diameterTop: 0, diameterBottom: 0.1 },
                this.scene
            );
            dente.position = new BABYLON.Vector3(i, 0.4, 0.35);
            dente.rotation.x = Math.PI / 4;
            dente.parent = this.mesh;
            dente.setEnabled(false);
            this.denti.push(dente);
        }

        // Materiale legno
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.5, 0.35, 0.2);
        materiale.specularColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        this.mesh.material = materiale;
        this.coperchio.material = materiale;

        // Materiale lingua
        const matLingua = new BABYLON.StandardMaterial('mat_lingua', this.scene);
        matLingua.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.3);
        this.lingua.material = matLingua;

        // Materiale denti
        const matDenti = new BABYLON.StandardMaterial('mat_denti', this.scene);
        matDenti.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.9);
        this.denti.forEach(d => d.material = matDenti);

        // Dettagli decorativi (serratura, borchie)
        const serratura = BABYLON.MeshBuilder.CreateCylinder(
            `${this.id}_serratura`,
            { height: 0.1, diameter: 0.15 },
            this.scene
        );
        serratura.position = new BABYLON.Vector3(0, 0.1, 0.41);
        serratura.rotation.x = Math.PI / 2;
        serratura.parent = this.mesh;

        const matMetallo = new BABYLON.StandardMaterial('mat_metallo', this.scene);
        matMetallo.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.2);
        matMetallo.specularColor = new BABYLON.Color3(1, 0.9, 0.5);
        serratura.material = matMetallo;

        // Fisica (statica quando dormiente)
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0 },  // Statico inizialmente
            this.scene
        );

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'ForziereMimo',
            istanza: this,
            sembraForziere: true  // Per ingannare il giocatore
        };

        console.log(`📦 ${this.nomeVisualizzato} creato (in agguato)!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        if (this.dormiente && giocatore) {
            // Controlla se il giocatore è vicino
            const distanza = BABYLON.Vector3.Distance(
                this.mesh.position,
                giocatore.position
            );

            if (distanza <= this.rangoRilevamento) {
                this.risveglia();
            }
        }

        if (this.risvegliato) {
            // Animazione bocca
            this.tempoRisveglio += deltaTime;
            const apertura = Math.sin(this.tempoRisveglio * 5) * 0.3 + 0.3;
            this.coperchio.rotation.x = -apertura;

            // Insegui il giocatore
            super.update(deltaTime, giocatore);
        }
    }

    risveglia() {
        if (this.risvegliato) return;

        this.dormiente = false;
        this.risvegliato = true;
        this.pattuglia = false;  // Insegue invece di pattugliare

        // Mostra parti mostruose
        this.lingua.setEnabled(true);
        this.denti.forEach(d => d.setEnabled(true));

        // Rendi mobile
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setMassProperties({ mass: this.massa });
        }

        // Cambia colore (più scuro/sinistro)
        if (this.mesh.material) {
            this.mesh.material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.15);
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);
        }

        console.log(`👹 ${this.nomeVisualizzato} si risveglia!`);
    }

    /**
     * Override per attacco morso
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0 || this.dormiente) return;

        // Animazione morso
        const apriChiudi = setInterval(() => {
            this.coperchio.rotation.x = -0.8;
            setTimeout(() => {
                if (this.coperchio) this.coperchio.rotation.x = -0.2;
            }, 100);
        }, 200);

        setTimeout(() => clearInterval(apriChiudi), 500);

        this.timerAttacco = this.cooldownAttacco;
    }

    /**
     * Rileva con occhiali spettrali
     */
    rilevaConOcchiali() {
        if (this.rilevatoDaOcchiali) return;

        this.rilevatoDaOcchiali = true;

        // Effetto visivo rilevamento
        if (this.mesh.material) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        }

        console.log(`👓 ${this.nomeVisualizzato} rilevato!`);
    }
}
