/**
 * BUBBLE ATTACK - Torrente Napalm
 * 
 * Arma di fuoco. Crea particelle di danno continuo.
 * Lv1: 20 particelle danno
 * Lv2: 40 particelle + rallenta nemici
 * Lv3: Solidifica in ponti di lava
 * 
 * Categoria: Fuoco
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class TorrenteNapalm extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 0.5,  // Danno per particella
            velocitaBase: 12,
            durataBase: 3,
            raggioBase: 0.15,
            cooldownBase: 0.8,
            costoSblocco: 1200,
            costoUpgrade: [700, 2000, 4500],
            ...opzioni
        });

        this.tipo = TipiArma.TORRENTE_NAPALM;
        this.categoria = CategorieArma.FUOCO;
        this.nomeVisualizzato = 'Torrente Napalm';
        this.descrizione = 'Fiamme che bruciano tutto sul loro cammino';
        this.icona = '🔥';

        // Effetti per livello
        this.effettiLivello = {
            1: ['dannoFuoco'],
            2: ['dannoFuoco', 'rallenta'],
            3: ['dannoFuoco', 'rallenta', 'pontiLava']
        };

        // Parametri specifici
        this.numParticelle = [20, 40, 60];  // Per livello
        this.fattoreRallentamento = 0.5;
        this.durataPonte = 5;

        // Sistema particelle
        this.sistemaParticelle = null;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_napalm_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        materiale.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
        materiale.alpha = 0.9;
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.y += 0.5;
        spawn.addInPlace(direzione.scale(1));

        // Spara torrente di particelle
        this.creaTorrente(spawn, direzione);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaTorrente(posizione, direzione) {
        const numParticelle = this.numParticelle[this.livello - 1];

        // Crea particelle di fuoco
        for (let i = 0; i < numParticelle; i++) {
            setTimeout(() => {
                this.creaParticellaFuoco(posizione.clone(), direzione, i);
            }, i * 30);  // Delay tra particelle
        }

        // Livello 3: Crea ponte di lava
        if (this.livello >= 3) {
            setTimeout(() => {
                this.creaPonteLava(posizione, direzione);
            }, numParticelle * 30);
        }
    }

    creaParticellaFuoco(posizione, direzione, indice) {
        // Variazione casuale nella direzione
        const variazione = new BABYLON.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.3
        );
        const dirFinale = direzione.add(variazione).normalize();

        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `napalm_${Date.now()}_${indice}`,
            { diameter: this.raggio * 2 },
            this.scene
        );
        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();

        // Fisica leggera con gravità
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 0.02, friction: 0, restitution: 0.3 },
            this.scene
        );

        aggregato.body.setLinearVelocity(dirFinale.scale(this.velocita));
        aggregato.body.setLinearDamping(0.5);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            opzioni: {
                fuoco: true,
                rallenta: this.livello >= 2
            }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);
    }

    creaPonteLava(posizione, direzione) {
        // Crea segmenti di ponte
        const lunghezzaPonte = 8;
        const numSegmenti = 10;

        for (let i = 0; i < numSegmenti; i++) {
            const segmento = BABYLON.MeshBuilder.CreateBox(
                `ponte_lava_${i}`,
                { width: 1.5, height: 0.2, depth: 1 },
                this.scene
            );

            const offset = direzione.scale(i * (lunghezzaPonte / numSegmenti));
            segmento.position = posizione.add(offset);
            segmento.position.y = 0.1;

            const mat = new BABYLON.StandardMaterial('mat_ponte', this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0);
            mat.emissiveColor = new BABYLON.Color3(0.6, 0.2, 0);
            segmento.material = mat;

            // Fisica statica (calpestabile)
            new BABYLON.PhysicsAggregate(
                segmento,
                BABYLON.PhysicsShapeType.BOX,
                { mass: 0, friction: 0.8, restitution: 0 },
                this.scene
            );

            // Rimuovi dopo durata
            setTimeout(() => {
                // Dissolvenza
                let alpha = 1;
                const dissolvi = setInterval(() => {
                    alpha -= 0.1;
                    mat.alpha = alpha;
                    if (alpha <= 0) {
                        clearInterval(dissolvi);
                        segmento.dispose();
                    }
                }, 100);
            }, this.durataPonte * 1000);
        }

        console.log(`🌉 Ponte di lava creato!`);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        // Effetto fiamma (cambia colore)
        if (proiettile.mesh && proiettile.mesh.material) {
            const flicker = 0.8 + Math.random() * 0.2;
            proiettile.mesh.material.emissiveColor = new BABYLON.Color3(
                flicker,
                0.3 * flicker,
                0
            );
        }
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Danno fuoco
        super.onCollisioneNemico(proiettile, nemico);

        // Livello 2+: Rallenta
        if (this.livello >= 2 && proiettile.opzioni.rallenta) {
            nemico.velocitaMovimento *= this.fattoreRallentamento;

            // Ripristina dopo 2 secondi
            setTimeout(() => {
                if (nemico.vivo) {
                    nemico.velocitaMovimento /= this.fattoreRallentamento;
                }
            }, 2000);
        }
    }
}
