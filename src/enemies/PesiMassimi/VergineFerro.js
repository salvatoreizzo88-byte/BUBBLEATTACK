/**
 * BUBBLE ATTACK - Vergine-Ferro
 * 
 * Nemico statico pesantissimo. Si apre per attaccare e congela il tempo quando aperto.
 * Categoria: Peso Massimo
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class VergineFerro extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: false,  // Statico!
            rangoRilevamento: 6,
            rangoAttacco: 4,
            puntiVita: 4,
            colpiPerCattura: -1,  // Non catturabile normalmente
            dannoContatto: 4,
            velocitaMovimento: 0,  // Non si muove
            puntiUccisione: 400,
            dropOro: { min: 8, max: 20 },
            dropFrutta: 'ananas',
            cooldownAttacco: 4.0,
            durataStordimento: 4.0,
            ...opzioni
        });

        this.tipo = TipiNemico.VERGINE_FERRO;
        this.categoria = CategorieNemico.PESO_MASSIMO;
        this.nomeVisualizzato = 'Vergine-Ferro';

        // Parametri specifici
        this.massa = 200.0;  // IMMOBILE
        this.attrito = 10;
        this.rimbalzo = 0;

        // Stati apertura
        this.aperto = false;
        this.durataApertura = 2.0;
        this.timerApertura = 0;

        // Effetto congela tempo
        this.congelaTempoAttivo = false;
        this.raggioCongelamento = 6;

        // Mesh parti
        this.portaSinistra = null;
        this.portaDestra = null;
        this.interno = null;
    }

    async crea() {
        // Corpo principale (sarcofago)
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            this.id,
            { width: 1.5, height: 3, depth: 1 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Porta sinistra
        this.portaSinistra = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_portaSx`,
            { width: 0.1, height: 2.8, depth: 0.9 },
            this.scene
        );
        this.portaSinistra.position = new BABYLON.Vector3(-0.75, 0, 0.05);
        this.portaSinistra.setPivotPoint(new BABYLON.Vector3(0.05, 0, 0));
        this.portaSinistra.parent = this.mesh;

        // Porta destra
        this.portaDestra = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_portaDx`,
            { width: 0.1, height: 2.8, depth: 0.9 },
            this.scene
        );
        this.portaDestra.position = new BABYLON.Vector3(0.75, 0, 0.05);
        this.portaDestra.setPivotPoint(new BABYLON.Vector3(-0.05, 0, 0));
        this.portaDestra.parent = this.mesh;

        // Interno pericoloso (spuntoni)
        this.interno = BABYLON.MeshBuilder.CreateBox(
            `${this.id}_interno`,
            { width: 1.3, height: 2.8, depth: 0.1 },
            this.scene
        );
        this.interno.position = new BABYLON.Vector3(0, 0, 0);
        this.interno.parent = this.mesh;

        // Spuntoni
        for (let y = -1; y <= 1; y += 0.5) {
            for (let x = -0.4; x <= 0.4; x += 0.4) {
                const spuntone = BABYLON.MeshBuilder.CreateCylinder(
                    `spuntone_${x}_${y}`,
                    { height: 0.4, diameterTop: 0, diameterBottom: 0.1 },
                    this.scene
                );
                spuntone.position = new BABYLON.Vector3(x, y, 0.2);
                spuntone.rotation.x = -Math.PI / 2;
                spuntone.parent = this.interno;
            }
        }

        // Materiale ferro arrugginito
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        materiale.specularColor = new BABYLON.Color3(0.4, 0.35, 0.3);
        this.mesh.material = materiale;
        this.portaSinistra.material = materiale;
        this.portaDestra.material = materiale;

        const matInterno = new BABYLON.StandardMaterial(`mat_interno_${this.id}`, this.scene);
        matInterno.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        matInterno.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.05);
        this.interno.material = matInterno;
        this.interno.getChildMeshes().forEach(m => m.material = matInterno);

        // Nascondi interno inizialmente
        this.interno.setEnabled(false);

        // Fisica (statica)
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0 },  // Massa 0 = statico
            this.scene
        );

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'VergineFerro',
            istanza: this
        };

        console.log(`⚔️ ${this.nomeVisualizzato} creata!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Timer apertura
        if (this.aperto) {
            this.timerApertura -= deltaTime;
            if (this.timerApertura <= 0) {
                this.chiudi();
            }
        }

        // Non chiama super.update per movimento (è statico)
        // Ma controlla il giocatore
        if (giocatore && !this.aperto) {
            const distanza = BABYLON.Vector3.Distance(
                this.mesh.position,
                giocatore.position
            );

            if (distanza <= this.rangoAttacco && this.timerAttacco <= 0) {
                this.apri();
            }
        }

        // Timer attacco
        if (this.timerAttacco > 0) {
            this.timerAttacco -= deltaTime;
        }
    }

    apri() {
        if (this.aperto) return;
        this.aperto = true;
        this.timerApertura = this.durataApertura;

        // Mostra interno
        this.interno.setEnabled(true);

        // Animazione apertura porte
        this.animaPorte(true);

        // Attiva effetto congela tempo
        this.attivaCongelaTempo();

        console.log(`🚪 ${this.nomeVisualizzato} si apre!`);
    }

    chiudi() {
        if (!this.aperto) return;
        this.aperto = false;

        // Nascondi interno
        this.interno.setEnabled(false);

        // Animazione chiusura porte
        this.animaPorte(false);

        // Disattiva congela tempo
        this.disattivaCongelaTempo();

        this.timerAttacco = this.cooldownAttacco;

        console.log(`🚪 ${this.nomeVisualizzato} si chiude!`);
    }

    animaPorte(aprire) {
        const angoloTarget = aprire ? Math.PI / 3 : 0;
        const passi = 10;
        let passo = 0;

        const angoloInizialeSx = this.portaSinistra.rotation.y;
        const angoloInizialeDx = this.portaDestra.rotation.y;

        const intervallo = setInterval(() => {
            passo++;
            const t = passo / passi;

            this.portaSinistra.rotation.y = angoloInizialeSx + ((-angoloTarget) - angoloInizialeSx) * t;
            this.portaDestra.rotation.y = angoloInizialeDx + (angoloTarget - angoloInizialeDx) * t;

            if (passo >= passi) {
                clearInterval(intervallo);
            }
        }, 50);
    }

    attivaCongelaTempo() {
        this.congelaTempoAttivo = true;

        // Effetto visivo area congelamento
        const zona = BABYLON.MeshBuilder.CreateSphere(
            `${this.id}_zona_congelo`,
            { diameter: this.raggioCongelamento * 2 },
            this.scene
        );
        zona.position = this.mesh.position.clone();

        const mat = new BABYLON.StandardMaterial('mat_congelo', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.8);
        mat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        mat.alpha = 0.2;
        zona.material = mat;
        zona.isPickable = false;

        this.zonaCongelamento = zona;

        // TODO: Implementare rallentamento effettivo del giocatore
        console.log(`❄️ Campo di congelamento attivo!`);
    }

    disattivaCongelaTempo() {
        this.congelaTempoAttivo = false;

        if (this.zonaCongelamento) {
            this.zonaCongelamento.dispose();
            this.zonaCongelamento = null;
        }
    }

    /**
     * Override - vulnerabile solo quando aperto
     */
    colpitoDaBolla(bolla) {
        if (!this.aperto) {
            console.log(`⚔️ ${this.nomeVisualizzato} è chiusa! Attendi che si apra!`);
            return false;
        }

        // Quando aperta, può essere colpita
        this.puntiVita--;
        this.stordisci();
        this.chiudi();

        console.log(`💥 ${this.nomeVisualizzato} colpita! Vita: ${this.puntiVita}/${this.puntiVitaMax}`);

        if (this.puntiVita <= 0) {
            this.muori();
            return true;
        }

        return false;
    }

    distruggi() {
        this.disattivaCongelaTempo();
        super.distruggi();
    }
}
