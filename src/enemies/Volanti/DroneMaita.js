/**
 * BUBBLE ATTACK - Drone-Maita
 * 
 * Nemico cecchino volante. Mantiene distanza e spara massi rotolanti.
 * Categoria: Volante
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class DroneMaita extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 8,
            rangoRilevamento: 15,
            rangoAttacco: 12,
            puntiVita: 1,
            colpiPerCattura: 1,
            dannoContatto: 1,
            velocitaMovimento: 4.0,
            puntiUccisione: 180,
            dropOro: { min: 2, max: 6 },
            dropFrutta: 'ciliegia',
            cooldownAttacco: 2.5,
            ...opzioni
        });

        this.tipo = TipiNemico.DRONE_MAITA;
        this.categoria = CategorieNemico.VOLANTE;
        this.nomeVisualizzato = 'Drone-Maita';

        // Parametri specifici
        this.massa = 0.5;  // Leggero
        this.attrito = 0;
        this.rimbalzo = 0.3;
        this.gravitaScale = 0;  // Zero gravità

        // Volo
        this.altezzaVolo = opzioni.altezzaVolo || 4;
        this.distanzaMinima = 5;  // Mantieni distanza dal giocatore
        this.velocitaHover = 1.0;
        this.oscillazione = 0;

        // Proiettili
        this.proiettiliAttivi = [];
        this.maxProiettili = 3;
        this.velocitaProiettile = 8;
    }

    async crea() {
        // Corpo drone (disco con antenna)
        this.mesh = BABYLON.MeshBuilder.CreateCylinder(
            this.id,
            { height: 0.3, diameter: 1.2 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();
        this.mesh.position.y = this.altezzaVolo;

        // Antenna
        const antenna = BABYLON.MeshBuilder.CreateCylinder(
            `${this.id}_antenna`,
            { height: 0.5, diameter: 0.1 },
            this.scene
        );
        antenna.position.y = 0.4;
        antenna.parent = this.mesh;

        // Sfera in cima
        const sfera = BABYLON.MeshBuilder.CreateSphere(
            `${this.id}_sfera`,
            { diameter: 0.2 },
            this.scene
        );
        sfera.position.y = 0.6;
        sfera.parent = this.mesh;

        // Materiale
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
        materiale.specularColor = new BABYLON.Color3(1, 1, 1);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        this.mesh.material = materiale;
        antenna.material = materiale;

        const matSfera = new BABYLON.StandardMaterial(`mat_sfera_${this.id}`, this.scene);
        matSfera.emissiveColor = new BABYLON.Color3(1, 0.3, 0.3);
        sfera.material = matSfera;

        // Fisica senza gravità
        this.creaFisicaVolante();

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattugliaVolante();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'DroneMaita',
            istanza: this
        };

        console.log(`🚁 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    creaFisicaVolante() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            {
                mass: this.massa,
                friction: 0,
                restitution: this.rimbalzo
            },
            this.scene
        );

        // Blocca rotazione
        this.aggregatoFisico.body.setAngularDamping(100);
        this.aggregatoFisico.body.setLinearDamping(2);

        // Disabilita gravità
        this.aggregatoFisico.body.setGravityFactor(0);
    }

    generaPuntiPattugliaVolante() {
        const centro = this.posizioneIniziale;
        const raggio = this.rangoPatuglia;
        const altezza = this.altezzaVolo;

        this.puntiPattuglia = [
            new BABYLON.Vector3(centro.x + raggio, altezza, centro.z),
            new BABYLON.Vector3(centro.x, altezza, centro.z + raggio),
            new BABYLON.Vector3(centro.x - raggio, altezza, centro.z),
            new BABYLON.Vector3(centro.x, altezza, centro.z - raggio)
        ];
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Oscillazione hover
        this.oscillazione += deltaTime * 2;
        const offsetY = Math.sin(this.oscillazione) * 0.2;

        // Mantieni altezza
        if (this.aggregatoFisico && !this.catturato) {
            const altezzaTarget = this.altezzaVolo + offsetY;
            const altezzaCorrente = this.mesh.position.y;
            const diff = altezzaTarget - altezzaCorrente;

            const forzaHover = new BABYLON.Vector3(0, diff * this.massa * 20, 0);
            this.aggregatoFisico.body.applyForce(forzaHover, this.mesh.position);
        }

        // Aggiorna proiettili
        this.aggiornaProiettili(deltaTime);

        super.update(deltaTime, giocatore);
    }

    /**
     * Override inseguimento - mantiene distanza
     */
    eseguiInseguimento(deltaTime, giocatore) {
        if (!giocatore) return;

        const distanza = BABYLON.Vector3.Distance(this.mesh.position, giocatore.position);

        if (distanza < this.distanzaMinima) {
            // Troppo vicino, allontanati
            const direzione = this.mesh.position.subtract(giocatore.position);
            direzione.y = 0;
            direzione.normalize();

            const forza = direzione.scale(this.massa * this.velocitaMovimento * 30);
            this.aggregatoFisico.body.applyForce(forza, this.mesh.position);
        } else if (distanza > this.rangoAttacco) {
            // Troppo lontano, avvicinati
            this.muoviVerso(giocatore.position, this.velocitaMovimento * 0.5);
        }

        // Guarda sempre il giocatore
        const direzione = giocatore.position.subtract(this.mesh.position);
        direzione.y = 0;
        if (direzione.length() > 0.1) {
            this.direzioneCorrente = direzione.normalize();
            this.mesh.rotation.y = Math.atan2(direzione.x, direzione.z);
        }
    }

    /**
     * Override attacco - spara masso rotolante
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;
        if (this.proiettiliAttivi.length >= this.maxProiettili) return;

        // Crea masso
        const masso = BABYLON.MeshBuilder.CreateSphere(
            `masso_${this.id}_${Date.now()}`,
            { diameter: 0.6 },
            this.scene
        );
        masso.position = this.mesh.position.clone();
        masso.position.y -= 0.5;

        const matMasso = new BABYLON.StandardMaterial(`mat_masso`, this.scene);
        matMasso.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        masso.material = matMasso;

        // Direzione verso giocatore
        const direzione = giocatore.position.subtract(this.mesh.position);
        direzione.normalize();

        // Fisica masso
        const aggregatoMasso = new BABYLON.PhysicsAggregate(
            masso,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 1, friction: 0.5, restitution: 0.6 },
            this.scene
        );

        // Lancia
        const velocita = direzione.scale(this.velocitaProiettile);
        aggregatoMasso.body.setLinearVelocity(velocita);

        // Aggiungi alla lista
        this.proiettiliAttivi.push({
            mesh: masso,
            aggregato: aggregatoMasso,
            timer: 5  // 5 secondi di vita
        });

        this.timerAttacco = this.cooldownAttacco;

        console.log(`🪨 ${this.nomeVisualizzato} lancia un masso!`);
    }

    aggiornaProiettili(deltaTime) {
        for (let i = this.proiettiliAttivi.length - 1; i >= 0; i--) {
            const p = this.proiettiliAttivi[i];
            p.timer -= deltaTime;

            if (p.timer <= 0 || p.mesh.position.y < -10) {
                p.aggregato.dispose();
                p.mesh.dispose();
                this.proiettiliAttivi.splice(i, 1);
            }
        }
    }

    distruggi() {
        // Pulisci proiettili
        for (const p of this.proiettiliAttivi) {
            p.aggregato.dispose();
            p.mesh.dispose();
        }
        this.proiettiliAttivi = [];

        super.distruggi();
    }
}
