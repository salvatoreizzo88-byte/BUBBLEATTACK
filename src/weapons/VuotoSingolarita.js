/**
 * BUBBLE ATTACK - Vuoto Singolarità
 * 
 * Arma spaziale. Crea mini buchi neri che attirano nemici.
 * Lv1: Attrae nemici
 * Lv2: Curva i proiettili nemici
 * Lv3: Comprime i nemici (danno nel tempo)
 * 
 * Categoria: Spazio
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class VuotoSingolarita extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 2,
            velocitaBase: 8,
            durataBase: 4,
            raggioBase: 4,
            cooldownBase: 4.0,
            costoSblocco: 3000,
            costoUpgrade: [2000, 5000, 10000],
            ...opzioni
        });

        this.tipo = TipiArma.VUOTO_SINGOLARITA;
        this.categoria = CategorieArma.SPAZIO;
        this.nomeVisualizzato = 'Vuoto Singolarità';
        this.descrizione = 'Mini buco nero che attrae e comprime tutto';
        this.icona = '🌀';

        // Effetti per livello
        this.effettiLivello = {
            1: ['attrazione'],
            2: ['attrazione', 'curvaProiettili'],
            3: ['attrazione', 'curvaProiettili', 'compressione']
        };

        // Parametri specifici
        this.forzaAttrazione = 15;
        this.dannoPsCompressione = 1;  // Danno per secondo
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_singolarita_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.1, 0, 0.15);
        materiale.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.5);
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.addInPlace(direzione.scale(3));

        // Crea singolarità
        this.creaSingolarita(spawn);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaSingolarita(posizione) {
        // Nucleo nero
        const nucleo = BABYLON.MeshBuilder.CreateSphere(
            `singolarita_${Date.now()}`,
            { diameter: 0.5 },
            this.scene
        );
        nucleo.position = posizione.clone();

        const matNucleo = new BABYLON.StandardMaterial('mat_nucleo_sing', this.scene);
        matNucleo.diffuseColor = new BABYLON.Color3(0, 0, 0);
        matNucleo.emissiveColor = new BABYLON.Color3(0.05, 0, 0.1);
        nucleo.material = matNucleo;

        // Disco di accrescimento
        const disco = BABYLON.MeshBuilder.CreateTorus(
            'disco_sing',
            { diameter: 2, thickness: 0.1, tessellation: 32 },
            this.scene
        );
        disco.rotation.x = Math.PI / 2;
        disco.parent = nucleo;

        const matDisco = new BABYLON.StandardMaterial('mat_disco_sing', this.scene);
        matDisco.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.8);
        matDisco.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.6);
        matDisco.alpha = 0.8;
        disco.material = matDisco;

        this.mesh = nucleo;

        const proiettile = {
            mesh: nucleo,
            disco: disco,
            aggregato: null,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            rotazione: 0,
            nemiciNelRaggio: new Set(),
            opzioni: { singolarita: true }
        };

        nucleo.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        // Effetto particelle aspirazione
        this.creaEffettoAspirazione(nucleo);

        return proiettile;
    }

    creaEffettoAspirazione(mesh) {
        const particelle = new BABYLON.ParticleSystem('aspirazione', 100, this.scene);

        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AHMP7//x+fNKMyAQANqQT/p7p4JAAAAABJRU5ErkJggg==',
            this.scene
        );

        // Emetti da anello esterno
        particelle.createSphereEmitter(this.raggio);

        particelle.emitter = mesh;
        particelle.minSize = 0.05;
        particelle.maxSize = 0.15;
        particelle.minLifeTime = 0.5;
        particelle.maxLifeTime = 1;
        particelle.emitRate = 80;
        particelle.color1 = new BABYLON.Color4(0.6, 0.2, 0.8, 1);
        particelle.color2 = new BABYLON.Color4(0.3, 0.1, 0.5, 0.5);

        // Velocità verso il centro (negativa)
        particelle.minEmitPower = -5;
        particelle.maxEmitPower = -3;

        particelle.start();

        setTimeout(() => particelle.stop(), this.durata * 1000);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        if (!proiettile.mesh) return;

        // Rotazione disco
        proiettile.rotazione += deltaTime * 3;
        if (proiettile.disco) {
            proiettile.disco.rotation.z = proiettile.rotazione;
        }

        // Attrazione nemici
        this.applicaAttrazione(proiettile, deltaTime);

        // Livello 2+: Curva proiettili nemici
        if (this.livello >= 2) {
            this.curvaProiettiliNemici(proiettile);
        }

        // Livello 3: Danno da compressione
        if (this.livello >= 3) {
            this.applicaCompressione(proiettile, deltaTime);
        }
    }

    applicaAttrazione(proiettile, deltaTime) {
        const centro = proiettile.mesh.position;

        // Trova nemici
        const meshNemici = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'nemico'
        );

        meshNemici.forEach(meshNemico => {
            const nemico = meshNemico.metadata.istanza;
            if (!nemico || !nemico.vivo || !nemico.aggregatoFisico) return;

            const distanza = BABYLON.Vector3.Distance(centro, meshNemico.position);

            if (distanza <= this.raggio && distanza > 0.5) {
                // Forza inversamente proporzionale alla distanza
                const direzione = centro.subtract(meshNemico.position).normalize();
                const forza = this.forzaAttrazione * (1 - distanza / this.raggio) * nemico.massa;

                nemico.aggregatoFisico.body.applyForce(
                    direzione.scale(forza),
                    meshNemico.position
                );

                proiettile.nemiciNelRaggio.add(nemico);
            } else {
                proiettile.nemiciNelRaggio.delete(nemico);
            }
        });
    }

    curvaProiettiliNemici(proiettile) {
        const centro = proiettile.mesh.position;

        // Trova proiettili nemici
        const proiettiliNemici = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'proiettile_nemico'
        );

        proiettiliNemici.forEach(meshProiettile => {
            const distanza = BABYLON.Vector3.Distance(centro, meshProiettile.position);

            if (distanza <= this.raggio * 1.5 && distanza > 0.5) {
                // Curva verso il centro
                const direzione = centro.subtract(meshProiettile.position).normalize();
                const forza = 10 * (1 - distanza / (this.raggio * 1.5));

                if (meshProiettile.physicsAggregate) {
                    meshProiettile.physicsAggregate.body.applyForce(
                        direzione.scale(forza),
                        meshProiettile.position
                    );
                }
            }
        });
    }

    applicaCompressione(proiettile, deltaTime) {
        // Danno continuo ai nemici vicini al centro
        const centro = proiettile.mesh.position;
        const raggioCompressione = 1.5;

        proiettile.nemiciNelRaggio.forEach(nemico => {
            if (!nemico.vivo || !nemico.mesh) return;

            const distanza = BABYLON.Vector3.Distance(centro, nemico.mesh.position);

            if (distanza <= raggioCompressione) {
                // Effetto visivo: rimpicciolisci
                const scala = 0.7 + (distanza / raggioCompressione) * 0.3;
                nemico.mesh.scaling = new BABYLON.Vector3(scala, scala, scala);

                // Accumula danno (applica periodicamente)
                if (!nemico._timerCompressione) {
                    nemico._timerCompressione = 0;
                }

                nemico._timerCompressione += deltaTime;

                if (nemico._timerCompressione >= 1) {
                    nemico.colpitoDaBolla({ tipo: 'VuotoSingolarita' });
                    nemico._timerCompressione = 0;
                }
            }
        });
    }

    distruggiProiettile(proiettile) {
        // Ripristina scala nemici
        proiettile.nemiciNelRaggio.forEach(nemico => {
            if (nemico.mesh) {
                nemico.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
            }
        });

        if (proiettile.disco) {
            proiettile.disco.dispose();
        }

        super.distruggiProiettile(proiettile);
    }
}
