/**
 * BUBBLE ATTACK - Sentinella-Prisma
 * 
 * Torretta fissa che spara laser continuo.
 * Debolezza: rifrazione con bolle.
 * Categoria: Anomalia
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class SentinellaPrisma extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: false,  // Torretta fissa
            rangoRilevamento: 15,
            rangoAttacco: 12,
            puntiVita: 3,
            colpiPerCattura: 3,
            dannoContatto: 1,
            velocitaMovimento: 0,
            puntiUccisione: 250,
            dropOro: { min: 5, max: 15 },
            dropFrutta: 'cristallo',
            cooldownAttacco: 0.1,  // Laser continuo
            ...opzioni
        });

        this.tipo = TipiNemico.SENTINELLA_PRISMA;
        this.categoria = CategorieNemico.ANOMALIA;
        this.nomeVisualizzato = 'Sentinella-Prisma';

        // Parametri specifici
        this.massa = 50.0;
        this.attrito = 10;
        this.rimbalzo = 0;

        // Laser
        this.laserAttivo = false;
        this.meshLaser = null;
        this.lunghezzaLaser = 12;
        this.dannoPsLaser = 2;  // Danno per secondo

        // Rotazione
        this.velocitaRotazione = 0.5;  // Rad/s
        this.angoloCorrente = 0;
        this.modalitaTracciamento = true;  // Segue il giocatore
    }

    async crea() {
        // Base torretta
        const base = BABYLON.MeshBuilder.CreateCylinder(
            this.id,
            { height: 0.5, diameter: 1.5 },
            this.scene
        );
        base.position = this.posizioneIniziale.clone();
        this.mesh = base;

        // Colonna
        const colonna = BABYLON.MeshBuilder.CreateCylinder(
            `${this.id}_colonna`,
            { height: 1.5, diameter: 0.6 },
            this.scene
        );
        colonna.position.y = 1;
        colonna.parent = this.mesh;

        // Testa prisma (ottaedro)
        const testa = BABYLON.MeshBuilder.CreatePolyhedron(
            `${this.id}_testa`,
            { type: 1, size: 0.5 },  // Ottaedro
            this.scene
        );
        testa.position.y = 2;
        testa.parent = this.mesh;
        this.testa = testa;

        // Materiale cristallino
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        materiale.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        this.mesh.material = materiale;
        colonna.material = materiale;

        const matTesta = new BABYLON.StandardMaterial('mat_testa_prisma', this.scene);
        matTesta.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
        matTesta.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        matTesta.alpha = 0.9;
        matTesta.specularPower = 256;
        testa.material = matTesta;

        // Fisica (statica)
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            { mass: 0 },
            this.scene
        );

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'SentinellaPrisma',
            istanza: this
        };

        console.log(`💎 ${this.nomeVisualizzato} creata!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Rotazione testa
        if (this.testa) {
            this.testa.rotation.y += deltaTime * 2;
        }

        // Tracciamento giocatore
        if (giocatore && this.modalitaTracciamento) {
            const direzione = giocatore.position.subtract(this.mesh.position);
            direzione.y = 0;

            if (direzione.length() > 0.1) {
                const angoloTarget = Math.atan2(direzione.x, direzione.z);

                // Rotazione graduale
                let diff = angoloTarget - this.angoloCorrente;

                // Normalizza angolo
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;

                const rotazione = Math.sign(diff) * Math.min(Math.abs(diff), this.velocitaRotazione * deltaTime);
                this.angoloCorrente += rotazione;

                // Controlla se il giocatore è nel raggio
                const distanza = direzione.length();
                if (distanza <= this.rangoAttacco && Math.abs(diff) < 0.3) {
                    this.attivaLaser();
                } else {
                    this.disattivaLaser();
                }
            }
        }

        // Aggiorna posizione laser
        if (this.laserAttivo && this.meshLaser) {
            this.aggiornaLaser();
        }

        // Non chiama super.update (è statico)
    }

    attivaLaser() {
        if (this.laserAttivo) return;
        this.laserAttivo = true;

        // Crea mesh laser
        this.meshLaser = BABYLON.MeshBuilder.CreateCylinder(
            `${this.id}_laser`,
            { height: this.lunghezzaLaser, diameter: 0.1 },
            this.scene
        );

        const matLaser = new BABYLON.StandardMaterial('mat_laser_prisma', this.scene);
        matLaser.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        matLaser.emissiveColor = new BABYLON.Color3(1, 0, 0);
        matLaser.alpha = 0.8;
        this.meshLaser.material = matLaser;
        this.meshLaser.isPickable = false;

        console.log(`🔴 ${this.nomeVisualizzato} attiva laser!`);
    }

    disattivaLaser() {
        if (!this.laserAttivo) return;
        this.laserAttivo = false;

        if (this.meshLaser) {
            this.meshLaser.dispose();
            this.meshLaser = null;
        }
    }

    aggiornaLaser() {
        if (!this.meshLaser) return;

        const altezzaTesta = this.mesh.position.y + 2;

        // Direzione laser
        const direzione = new BABYLON.Vector3(
            Math.sin(this.angoloCorrente),
            0,
            Math.cos(this.angoloCorrente)
        );

        // Posizione laser (centro del cilindro)
        const centroLaser = this.mesh.position.clone();
        centroLaser.y = altezzaTesta;
        centroLaser.addInPlace(direzione.scale(this.lunghezzaLaser / 2));

        this.meshLaser.position = centroLaser;

        // Orientamento laser
        this.meshLaser.rotation.x = Math.PI / 2;
        this.meshLaser.rotation.y = this.angoloCorrente;
    }

    /**
     * Override - debolezza a bolle rifrattive
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        // Disattiva laser temporaneamente
        this.disattivaLaser();

        // Le bolle normali riflettono il laser (non la danneggiano subito)
        // Ma le bolle speciali la danneggiano
        if (bolla && bolla.tipo && ['BollaFulmine', 'TrivellaPerforante'].includes(bolla.tipo)) {
            return super.colpitoDaBolla(bolla);
        }

        console.log(`✨ La bolla riflette il laser!`);
        this.stordisci();
        return false;
    }

    distruggi() {
        this.disattivaLaser();
        super.distruggi();
    }
}
