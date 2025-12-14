/**
 * BUBBLE ATTACK - Razza-Nuvola
 * 
 * Manta volante con corpo segmentato. Crea blocco elettrico al passaggio.
 * Categoria: Volante
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class RazzaNuvola extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 12,
            rangoRilevamento: 12,
            rangoAttacco: 5,
            puntiVita: 3,
            colpiPerCattura: 3,
            dannoContatto: 2,
            velocitaMovimento: 5.0,
            puntiUccisione: 280,
            dropOro: { min: 5, max: 12 },
            dropFrutta: 'pesca',
            cooldownAttacco: 2.0,
            durataStordimento: 1.5,
            ...opzioni
        });

        this.tipo = TipiNemico.RAZZA_NUVOLA;
        this.categoria = CategorieNemico.VOLANTE;
        this.nomeVisualizzato = 'Razza-Nuvola';

        // Parametri specifici
        this.massa = 0.4;
        this.attrito = 0;
        this.rimbalzo = 0.2;
        this.gravitaScale = 0;

        // Volo
        this.altezzaVolo = opzioni.altezzaVolo || 4;
        this.oscillazione = 0;

        // Corpo segmentato
        this.segmenti = [];
        this.numSegmenti = 5;
        this.distanzaSegmenti = 0.6;

        // Blocco elettrico
        this.sciaElettrica = [];
        this.durataSciaElettrica = 3;
    }

    async crea() {
        // Testa (segmento principale)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameterX: 1.2, diameterY: 0.4, diameterZ: 1.5 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();
        this.mesh.position.y = this.altezzaVolo;

        // Materiale nuvoloso/elettrico
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.8);
        materiale.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        materiale.alpha = 0.9;
        this.mesh.material = materiale;

        // Crea segmenti del corpo
        this.creaSegmenti();

        // Fisica volante
        this.creaFisicaVolante();

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'RazzaNuvola',
            istanza: this
        };

        console.log(`🌩️ ${this.nomeVisualizzato} creata!`);

        return this;
    }

    creaSegmenti() {
        let posPrecedente = this.mesh.position.clone();

        for (let i = 0; i < this.numSegmenti; i++) {
            const scala = 1 - (i * 0.15);  // Segmenti sempre più piccoli

            const segmento = BABYLON.MeshBuilder.CreateSphere(
                `${this.id}_seg_${i}`,
                {
                    diameterX: 0.8 * scala,
                    diameterY: 0.3 * scala,
                    diameterZ: 1.0 * scala
                },
                this.scene
            );

            segmento.position = posPrecedente.clone();
            segmento.position.z -= this.distanzaSegmenti;
            posPrecedente = segmento.position.clone();

            // Stesso materiale ma più trasparente
            const matSeg = this.mesh.material.clone(`mat_seg_${i}`);
            matSeg.alpha = 0.9 - (i * 0.1);
            segmento.material = matSeg;

            this.segmenti.push({
                mesh: segmento,
                posizioneTarget: segmento.position.clone()
            });
        }
    }

    creaFisicaVolante() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: this.massa, friction: 0, restitution: this.rimbalzo },
            this.scene
        );

        this.aggregatoFisico.body.setAngularDamping(30);
        this.aggregatoFisico.body.setLinearDamping(1.5);
        this.aggregatoFisico.body.setGravityFactor(0);
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Oscillazione
        this.oscillazione += deltaTime * 2;
        const offsetY = Math.sin(this.oscillazione) * 0.2;

        // Hover
        if (this.aggregatoFisico && !this.catturato) {
            const altezzaTarget = this.altezzaVolo + offsetY;
            const diff = altezzaTarget - this.mesh.position.y;
            const forzaHover = new BABYLON.Vector3(0, diff * this.massa * 30, 0);
            this.aggregatoFisico.body.applyForce(forzaHover, this.mesh.position);
        }

        // Aggiorna segmenti (seguono la testa con ritardo)
        this.aggiornaSegmenti(deltaTime);

        // Aggiorna scia elettrica
        this.aggiornaSciaElettrica(deltaTime);

        super.update(deltaTime, giocatore);
    }

    aggiornaSegmenti(deltaTime) {
        let posPrecedente = this.mesh.position.clone();

        for (let i = 0; i < this.segmenti.length; i++) {
            const seg = this.segmenti[i];

            // Segui con ritardo (effetto serpente)
            const direzione = posPrecedente.subtract(seg.mesh.position);
            const distanza = direzione.length();

            if (distanza > this.distanzaSegmenti) {
                direzione.normalize();
                seg.mesh.position.addInPlace(
                    direzione.scale((distanza - this.distanzaSegmenti) * 0.5)
                );
            }

            // Ruota verso la posizione precedente
            const angolo = Math.atan2(direzione.x, direzione.z);
            seg.mesh.rotation.y = angolo;

            posPrecedente = seg.mesh.position.clone();
        }
    }

    /**
     * Override inseguimento - movimento sinuoso
     */
    eseguiInseguimento(deltaTime, giocatore) {
        if (!giocatore) return;

        const target = giocatore.position.clone();
        target.y = this.altezzaVolo;

        // Movimento sinuoso
        const offset = Math.sin(this.oscillazione * 2) * 2;
        target.x += offset;

        this.muoviVerso(target, this.velocitaMovimento);
    }

    /**
     * Override attacco - crea scia elettrica
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;

        this.creaSciaElettricaAttacco();
        this.timerAttacco = this.cooldownAttacco;
    }

    creaSciaElettricaAttacco() {
        // Crea blocchi elettrici lungo il percorso
        const posizioni = [this.mesh.position.clone()];
        this.segmenti.forEach(s => posizioni.push(s.mesh.position.clone()));

        posizioni.forEach((pos, i) => {
            const blocco = BABYLON.MeshBuilder.CreateSphere(
                `scia_${this.id}_${Date.now()}_${i}`,
                { diameter: 0.5 },
                this.scene
            );
            blocco.position = pos.clone();

            const mat = new BABYLON.StandardMaterial('mat_scia', this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
            mat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.8);
            mat.alpha = 0.6;
            blocco.material = mat;
            blocco.isPickable = false;

            this.sciaElettrica.push({
                mesh: blocco,
                timer: this.durataSciaElettrica
            });
        });

        console.log(`⚡ ${this.nomeVisualizzato} crea scia elettrica!`);
    }

    aggiornaSciaElettrica(deltaTime) {
        for (let i = this.sciaElettrica.length - 1; i >= 0; i--) {
            const scia = this.sciaElettrica[i];
            scia.timer -= deltaTime;

            // Dissolvenza
            if (scia.mesh.material) {
                scia.mesh.material.alpha = scia.timer / this.durataSciaElettrica * 0.6;
            }

            if (scia.timer <= 0) {
                scia.mesh.dispose();
                this.sciaElettrica.splice(i, 1);
            }
        }
    }

    distruggi() {
        // Pulisci segmenti
        for (const seg of this.segmenti) {
            seg.mesh.dispose();
        }
        this.segmenti = [];

        // Pulisci scia
        for (const scia of this.sciaElettrica) {
            scia.mesh.dispose();
        }
        this.sciaElettrica = [];

        super.distruggi();
    }
}
