/**
 * BUBBLE ATTACK - Dardo Elio
 * 
 * Arma aerea. Solleva i nemici con palloncini.
 * Lv1: Solleva 1 nemico
 * Lv2: 3 dardi contemporaneamente
 * Lv3: Può sollevare massi e oggetti pesanti
 * 
 * Categoria: Aria
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class DardoElio extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 0.5,
            velocitaBase: 18,
            durataBase: 6,
            raggioBase: 0.3,
            cooldownBase: 1.0,
            costoSblocco: 800,
            costoUpgrade: [500, 1200, 2500],
            ...opzioni
        });

        this.tipo = TipiArma.DARDO_ELIO;
        this.categoria = CategorieArma.ARIA;
        this.nomeVisualizzato = 'Dardo Elio';
        this.descrizione = 'Palloncini che sollevano i nemici in aria';
        this.icona = '🎈';

        // Effetti per livello
        this.effettiLivello = {
            1: ['solleva'],
            2: ['solleva', 'multiDardo'],
            3: ['solleva', 'multiDardo', 'sollevaPesanti']
        };

        // Parametri specifici
        this.numDardi = [1, 3, 3];  // Per livello
        this.forzaSollevamento = 15;
        this.massaMaxSollevabile = [10, 10, 100];  // Per livello
        this.coloriPalloncino = [
            new BABYLON.Color3(1, 0.2, 0.2),    // Rosso
            new BABYLON.Color3(0.2, 1, 0.2),    // Verde
            new BABYLON.Color3(0.2, 0.2, 1),    // Blu
            new BABYLON.Color3(1, 1, 0.2),      // Giallo
            new BABYLON.Color3(1, 0.2, 1)       // Rosa
        ];
    }

    creaMaterialeProiettile(indice = 0) {
        const colore = this.coloriPalloncino[indice % this.coloriPalloncino.length];

        const materiale = new BABYLON.StandardMaterial(`mat_elio_${Date.now()}_${indice}`, this.scene);
        materiale.diffuseColor = colore;
        materiale.emissiveColor = colore.scale(0.3);
        materiale.specularPower = 64;
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.y += 0.5;
        spawn.addInPlace(direzione.scale(1));

        const numDardi = this.numDardi[this.livello - 1];

        // Spara più dardi (spread)
        for (let i = 0; i < numDardi; i++) {
            const angolo = (i - (numDardi - 1) / 2) * 0.3;  // Spread angolare
            const dirDardo = this.ruotaDirezione(direzione, angolo);

            this.creaDardo(spawn.clone(), dirDardo, i);
        }

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaDardo(posizione, direzione, indice) {
        // Palloncino
        const palloncino = BABYLON.MeshBuilder.CreateSphere(
            `elio_${Date.now()}_${indice}`,
            { diameterX: this.raggio * 2, diameterY: this.raggio * 2.5, diameterZ: this.raggio * 2 },
            this.scene
        );
        palloncino.position = posizione.clone();
        palloncino.material = this.creaMaterialeProiettile(indice);

        // Filo
        const filo = BABYLON.MeshBuilder.CreateCylinder(
            `filo_${indice}`,
            { height: 0.5, diameter: 0.02 },
            this.scene
        );
        filo.position.y = -0.4;
        filo.parent = palloncino;

        const matFilo = new BABYLON.StandardMaterial('mat_filo', this.scene);
        matFilo.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        filo.material = matFilo;

        this.mesh = palloncino;

        // Fisica leggera con antigravità
        const aggregato = new BABYLON.PhysicsAggregate(
            palloncino,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 0.01, friction: 0, restitution: 0.8 },
            this.scene
        );

        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setGravityFactor(-0.3);  // Antigravità
        aggregato.body.setLinearDamping(0.5);

        const proiettile = {
            mesh: palloncino,
            filo: filo,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            nemicoAttaccato: null,
            opzioni: {
                solleva: true,
                massaMax: this.massaMaxSollevabile[this.livello - 1]
            }
        };

        palloncino.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        return proiettile;
    }

    ruotaDirezione(direzione, angolo) {
        const cos = Math.cos(angolo);
        const sin = Math.sin(angolo);

        return new BABYLON.Vector3(
            direzione.x * cos - direzione.z * sin,
            direzione.y,
            direzione.x * sin + direzione.z * cos
        );
    }

    aggiornaProiettile(proiettile, deltaTime) {
        if (!proiettile.mesh) return;

        // Oscillazione leggera
        proiettile.mesh.rotation.z = Math.sin(Date.now() * 0.003) * 0.1;

        // Se ha un nemico attaccato, sollevalo
        if (proiettile.nemicoAttaccato) {
            this.sollevaNemico(proiettile, deltaTime);
        }
    }

    sollevaNemico(proiettile, deltaTime) {
        const nemico = proiettile.nemicoAttaccato;

        if (!nemico || !nemico.vivo || !nemico.mesh) {
            proiettile.nemicoAttaccato = null;
            return;
        }

        // Posiziona il palloncino sopra il nemico
        if (proiettile.mesh) {
            proiettile.mesh.position = nemico.mesh.position.clone();
            proiettile.mesh.position.y += 1.5;
        }

        // Applica forza verso l'alto
        if (nemico.aggregatoFisico) {
            const forzaSu = new BABYLON.Vector3(0, this.forzaSollevamento * nemico.massa, 0);
            nemico.aggregatoFisico.body.applyForce(forzaSu, nemico.mesh.position);
        }
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Controlla se può sollevare questo nemico
        const massaMax = proiettile.opzioni.massaMax;

        if (nemico.massa > massaMax) {
            console.log(`🎈 ${nemico.nomeVisualizzato} è troppo pesante!`);
            // Scoppia il palloncino
            proiettile.timer = 0;
            return;
        }

        // Attacca al nemico
        proiettile.nemicoAttaccato = nemico;

        // Disabilita fisica del proiettile (ora segue il nemico)
        if (proiettile.aggregato) {
            proiettile.aggregato.body.setLinearVelocity(BABYLON.Vector3.Zero());
            proiettile.aggregato.body.setMassProperties({ mass: 0 });
        }

        // Riduci gravità del nemico
        if (nemico.aggregatoFisico) {
            nemico.aggregatoFisico.body.setGravityFactor(-0.5);
        }

        console.log(`🎈 ${nemico.nomeVisualizzato} sollevato!`);

        // Ripristina dopo durata
        setTimeout(() => {
            if (nemico.vivo && nemico.aggregatoFisico) {
                nemico.aggregatoFisico.body.setGravityFactor(1);
                console.log(`🎈 ${nemico.nomeVisualizzato} cade!`);
            }
        }, this.durata * 1000);
    }

    distruggiProiettile(proiettile) {
        // Rilascia nemico se attaccato
        if (proiettile.nemicoAttaccato) {
            const nemico = proiettile.nemicoAttaccato;
            if (nemico.vivo && nemico.aggregatoFisico) {
                nemico.aggregatoFisico.body.setGravityFactor(1);
            }
        }

        if (proiettile.filo) {
            proiettile.filo.dispose();
        }

        super.distruggiProiettile(proiettile);
    }
}
