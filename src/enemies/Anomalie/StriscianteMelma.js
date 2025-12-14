/**
 * BUBBLE ATTACK - Strisciante-Melma
 * 
 * Nemico fluido che rallenta il movimento del 90%.
 * Debolezza: Onda Mareale.
 * Categoria: Anomalia
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class StriscianteMelma extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 5,
            rangoRilevamento: 8,
            rangoAttacco: 2,
            puntiVita: 2,
            colpiPerCattura: 2,
            dannoContatto: 1,
            velocitaMovimento: 1.5,  // Lento
            puntiUccisione: 160,
            dropOro: { min: 2, max: 6 },
            dropFrutta: 'limone',
            cooldownAttacco: 0.5,
            ...opzioni
        });

        this.tipo = TipiNemico.STRISCIANTE_MELMA;
        this.categoria = CategorieNemico.ANOMALIA;
        this.nomeVisualizzato = 'Strisciante-Melma';

        // Parametri specifici
        this.massa = 2.0;
        this.attrito = 0.1;  // Scivolosa
        this.rimbalzo = 0.8;

        // Effetto rallentamento
        this.fattoreRallentamento = 0.1;  // 90% di riduzione
        this.raggioRallentamento = 2;

        // Debolezza
        this.deboleA = ['OndaMareale'];

        // Animazione blob
        this.tempoBlob = 0;
        this.scalaOriginale = new BABYLON.Vector3(1, 1, 1);
    }

    async crea() {
        // Corpo blob (sfera schiacciata irregolare)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameterX: 1.5, diameterY: 0.8, diameterZ: 1.3 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Occhi (2 sfere sulla superficie)
        const occhioSx = BABYLON.MeshBuilder.CreateSphere(
            `${this.id}_occhioSx`,
            { diameter: 0.25 },
            this.scene
        );
        occhioSx.position = new BABYLON.Vector3(-0.3, 0.3, 0.5);
        occhioSx.parent = this.mesh;

        const occhioDx = occhioSx.clone(`${this.id}_occhioDx`);
        occhioDx.position.x = 0.3;
        occhioDx.parent = this.mesh;

        // Materiale gelatinoso
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1);
        materiale.alpha = 0.85;
        materiale.specularPower = 128;
        this.mesh.material = materiale;

        const matOcchio = new BABYLON.StandardMaterial('mat_occhio_melma', this.scene);
        matOcchio.diffuseColor = new BABYLON.Color3(1, 1, 1);
        matOcchio.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        occhioSx.material = matOcchio;
        occhioDx.material = matOcchio;

        // Fisica
        this.creaFisica();

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        this.scalaOriginale = this.mesh.scaling.clone();

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'StriscianteMelma',
            istanza: this
        };

        console.log(`🟢 ${this.nomeVisualizzato} creata!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Animazione blob pulsante
        this.tempoBlob += deltaTime * 3;
        const pulso = 1 + Math.sin(this.tempoBlob) * 0.1;
        this.mesh.scaling = new BABYLON.Vector3(
            this.scalaOriginale.x * pulso,
            this.scalaOriginale.y / pulso,
            this.scalaOriginale.z * pulso
        );

        // Lascia scia di melma
        if (Math.random() < 0.05) {
            this.lasciaScia();
        }

        super.update(deltaTime, giocatore);
    }

    lasciaScia() {
        const scia = BABYLON.MeshBuilder.CreateDisc(
            `scia_${Date.now()}`,
            { radius: 0.3 },
            this.scene
        );
        scia.position = this.mesh.position.clone();
        scia.position.y = 0.01;
        scia.rotation.x = Math.PI / 2;

        const mat = new BABYLON.StandardMaterial('mat_scia_melma', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.15, 0.6, 0.2);
        mat.alpha = 0.5;
        scia.material = mat;
        scia.isPickable = false;

        // Dissolvenza
        let alpha = 0.5;
        const dissolvi = setInterval(() => {
            alpha -= 0.05;
            mat.alpha = alpha;
            if (alpha <= 0) {
                clearInterval(dissolvi);
                scia.dispose();
            }
        }, 200);
    }

    /**
     * Controlla se il giocatore è nel raggio di rallentamento
     */
    controllaRallentamentoGiocatore(giocatore) {
        if (!giocatore || !this.mesh) return false;

        const distanza = BABYLON.Vector3.Distance(
            this.mesh.position,
            giocatore.position
        );

        return distanza <= this.raggioRallentamento;
    }

    /**
     * Override - debolezza a Onda Mareale
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        // Danno extra da Onda Mareale
        if (bolla && bolla.tipo === 'OndaMareale') {
            console.log(`🌊 ${this.nomeVisualizzato} è debole all'Onda Mareale!`);
            this.puntiVita -= 2;  // Danno doppio

            if (this.puntiVita <= 0) {
                this.muori();
                return true;
            }

            this.stordisci();
            return false;
        }

        return super.colpitoDaBolla(bolla);
    }
}
