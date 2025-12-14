/**
 * BUBBLE ATTACK - Invasore-X
 * 
 * Alieno a zero gravità che spara laser verticali.
 * Si muove in pattern geometrici.
 * Categoria: Volante
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class InvasoreX extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 10,
            rangoRilevamento: 12,
            rangoAttacco: 10,
            puntiVita: 2,
            colpiPerCattura: 2,  // Servono 2 bolle
            dannoContatto: 1,
            velocitaMovimento: 5.0,
            puntiUccisione: 250,
            dropOro: { min: 5, max: 12 },
            dropFrutta: 'fragola',
            cooldownAttacco: 3.0,
            durataStordimento: 1.0,
            ...opzioni
        });

        this.tipo = TipiNemico.INVASORE_X;
        this.categoria = CategorieNemico.VOLANTE;
        this.nomeVisualizzato = 'Invasore-X';

        // Parametri specifici
        this.massa = 0.3;
        this.attrito = 0;
        this.rimbalzo = 0;
        this.gravitaScale = 0;

        // Movimento pattern
        this.altezzaVolo = opzioni.altezzaVolo || 5;
        this.patternMovimento = 'sinusoidale';  // sinusoidale, quadrato, zigzag
        this.tempoPattern = 0;
        this.velocitaPattern = 2.0;
        this.ampiezzaPattern = 3.0;

        // Laser
        this.laserAttivo = false;
        this.durataLaser = 0.5;
        this.timerLaser = 0;
        this.meshLaser = null;
    }

    async crea() {
        // Corpo alieno (forma X stilizzata)
        const centro = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameter: 0.8 },
            this.scene
        );
        centro.position = this.posizioneIniziale.clone();
        centro.position.y = this.altezzaVolo;

        // Braccia (4 coni)
        const creaArm = (rotY, rotZ) => {
            const braccio = BABYLON.MeshBuilder.CreateCylinder(
                `${this.id}_arm_${rotY}`,
                { height: 0.8, diameterTop: 0.1, diameterBottom: 0.25 },
                this.scene
            );
            braccio.rotation.z = rotZ;
            braccio.rotation.y = rotY;
            braccio.position = new BABYLON.Vector3(
                Math.sin(rotY) * 0.4,
                0,
                Math.cos(rotY) * 0.4
            );
            braccio.parent = centro;
            return braccio;
        };

        creaArm(0, Math.PI / 4);
        creaArm(Math.PI / 2, Math.PI / 4);
        creaArm(Math.PI, Math.PI / 4);
        creaArm(-Math.PI / 2, Math.PI / 4);

        this.mesh = centro;

        // Materiale alieno
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
        materiale.specularColor = new BABYLON.Color3(0.5, 1, 0.5);
        this.mesh.material = materiale;

        // Applica materiale a tutti i figli
        this.mesh.getChildMeshes().forEach(child => {
            child.material = materiale;
        });

        // Fisica
        this.creaFisicaVolante();

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'InvasoreX',
            istanza: this
        };

        console.log(`👽 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    creaFisicaVolante() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            {
                mass: this.massa,
                friction: 0,
                restitution: 0
            },
            this.scene
        );

        this.aggregatoFisico.body.setAngularDamping(50);
        this.aggregatoFisico.body.setLinearDamping(3);
        this.aggregatoFisico.body.setGravityFactor(0);
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Movimento pattern
        this.tempoPattern += deltaTime * this.velocitaPattern;

        // Timer laser
        if (this.timerLaser > 0) {
            this.timerLaser -= deltaTime;
            if (this.timerLaser <= 0) {
                this.disattivaLaser();
            }
        }

        // Mantieni altezza
        if (this.aggregatoFisico && !this.catturato) {
            const altezzaTarget = this.altezzaVolo;
            const diff = altezzaTarget - this.mesh.position.y;
            const forzaHover = new BABYLON.Vector3(0, diff * this.massa * 30, 0);
            this.aggregatoFisico.body.applyForce(forzaHover, this.mesh.position);
        }

        // Rotazione continua
        this.mesh.rotation.y += deltaTime * 2;

        super.update(deltaTime, giocatore);
    }

    /**
     * Override pattuglia - movimento pattern
     */
    eseguiPattuglia(deltaTime) {
        if (!this.aggregatoFisico) return;

        let offsetX = 0, offsetZ = 0;

        switch (this.patternMovimento) {
            case 'sinusoidale':
                offsetX = Math.sin(this.tempoPattern) * this.ampiezzaPattern;
                offsetZ = Math.cos(this.tempoPattern * 0.7) * this.ampiezzaPattern;
                break;
            case 'quadrato':
                const fase = Math.floor(this.tempoPattern % 4);
                offsetX = [1, 1, -1, -1][fase] * this.ampiezzaPattern;
                offsetZ = [1, -1, -1, 1][fase] * this.ampiezzaPattern;
                break;
            case 'zigzag':
                offsetX = (Math.floor(this.tempoPattern) % 2 === 0 ? 1 : -1) * this.ampiezzaPattern;
                offsetZ = Math.sin(this.tempoPattern * 2) * this.ampiezzaPattern * 0.5;
                break;
        }

        const target = new BABYLON.Vector3(
            this.posizioneIniziale.x + offsetX,
            this.altezzaVolo,
            this.posizioneIniziale.z + offsetZ
        );

        const direzione = target.subtract(this.mesh.position);
        direzione.y = 0;

        if (direzione.length() > 0.1) {
            const forza = direzione.normalize().scale(this.massa * this.velocitaMovimento * 20);
            this.aggregatoFisico.body.applyForce(forza, this.mesh.position);
        }
    }

    /**
     * Override attacco - spara laser verticale
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0 || this.laserAttivo) return;

        // Posizionati sopra il giocatore
        const sopraGiocatore = giocatore.position.clone();
        sopraGiocatore.y = this.altezzaVolo;

        const distanza = BABYLON.Vector3.Distance(this.mesh.position, sopraGiocatore);

        if (distanza > 2) {
            // Muoviti sopra
            this.muoviVerso(sopraGiocatore, this.velocitaMovimento);
            return;
        }

        // Spara laser!
        this.attivaLaser();
        this.timerAttacco = this.cooldownAttacco;
    }

    attivaLaser() {
        this.laserAttivo = true;
        this.timerLaser = this.durataLaser;

        // Crea mesh laser
        this.meshLaser = BABYLON.MeshBuilder.CreateCylinder(
            `${this.id}_laser`,
            { height: this.altezzaVolo, diameter: 0.5 },
            this.scene
        );
        this.meshLaser.position = this.mesh.position.clone();
        this.meshLaser.position.y = this.altezzaVolo / 2;

        const matLaser = new BABYLON.StandardMaterial(`mat_laser_${this.id}`, this.scene);
        matLaser.diffuseColor = new BABYLON.Color3(0, 1, 0);
        matLaser.emissiveColor = new BABYLON.Color3(0, 1, 0);
        matLaser.alpha = 0.7;
        this.meshLaser.material = matLaser;

        console.log(`⚡ ${this.nomeVisualizzato} spara laser!`);
    }

    disattivaLaser() {
        this.laserAttivo = false;

        if (this.meshLaser) {
            this.meshLaser.dispose();
            this.meshLaser = null;
        }
    }

    distruggi() {
        this.disattivaLaser();
        super.distruggi();
    }
}
