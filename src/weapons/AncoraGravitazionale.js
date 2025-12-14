/**
 * BUBBLE ATTACK - Ancora Gravitazionale
 * 
 * Arma di gravità. Fa cadere i nemici volanti.
 * Lv1: Nemici volanti cadono
 * Lv2: Influenza ambiente (piattaforme mobili rallentano)
 * Lv3: Crea zona zero-G temporanea
 * 
 * Categoria: Gravità
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class AncoraGravitazionale extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 1,
            velocitaBase: 10,
            durataBase: 4,
            raggioBase: 0.5,
            cooldownBase: 2.0,
            costoSblocco: 1500,
            costoUpgrade: [900, 2500, 5500],
            ...opzioni
        });

        this.tipo = TipiArma.ANCORA_GRAVITAZIONALE;
        this.categoria = CategorieArma.GRAVITA;
        this.nomeVisualizzato = 'Ancora Gravitazionale';
        this.descrizione = 'Ancora pesante che attrae e fa cadere i nemici';
        this.icona = '⚓';

        // Effetti per livello
        this.effettiLivello = {
            1: ['cadutaVolanti'],
            2: ['cadutaVolanti', 'rallentaAmbiente'],
            3: ['cadutaVolanti', 'rallentaAmbiente', 'zonaZeroG']
        };

        // Parametri specifici
        this.raggioInfluenza = 5;
        this.forzaGravitazionale = 20;
        this.durataZeroG = 4;
        this.zonaZeroG = null;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_ancora_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.5);
        materiale.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        materiale.specularColor = new BABYLON.Color3(0.6, 0.6, 0.8);
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.y += 0.5;
        spawn.addInPlace(direzione.scale(1.5));

        // Crea ancora
        this.creaAncora(spawn, direzione);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaAncora(posizione, direzione) {
        // Corpo ancora (cono pesante)
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            `ancora_${Date.now()}`,
            { height: 1, diameterTop: 0.2, diameterBottom: this.raggio * 2 },
            this.scene
        );
        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();

        // Orienta verso il basso
        mesh.rotation.x = Math.PI;

        // Bracci dell'ancora
        for (let i = 0; i < 2; i++) {
            const braccio = BABYLON.MeshBuilder.CreateCylinder(
                `braccio_${i}`,
                { height: 0.4, diameter: 0.1 },
                this.scene
            );
            braccio.position = new BABYLON.Vector3(
                (i === 0 ? -1 : 1) * 0.3,
                -0.3,
                0
            );
            braccio.rotation.z = (i === 0 ? 1 : -1) * Math.PI / 4;
            braccio.parent = mesh;
            braccio.material = mesh.material;
        }

        // Fisica pesante
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            { mass: 5, friction: 0.5, restitution: 0 },
            this.scene
        );

        // Velocità iniziale in arco
        const velIniziale = direzione.scale(this.velocita);
        velIniziale.y = this.velocita * 0.5;  // Arco verso l'alto prima
        aggregato.body.setLinearVelocity(velIniziale);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            atterrato: false,
            opzioni: {
                gravita: true,
                raggioInfluenza: this.raggioInfluenza
            }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        return proiettile;
    }

    aggiornaProiettile(proiettile, deltaTime) {
        if (!proiettile.mesh || !proiettile.aggregato) return;

        const vel = proiettile.aggregato.body.getLinearVelocity();

        // Controlla se è atterrato
        if (!proiettile.atterrato && Math.abs(vel.y) < 0.5) {
            const ray = new BABYLON.Ray(
                proiettile.mesh.position,
                new BABYLON.Vector3(0, -1, 0),
                0.8
            );
            const hit = this.scene.pickWithRay(ray, (m) =>
                m !== proiettile.mesh && m.isPickable
            );

            if (hit && hit.hit) {
                proiettile.atterrato = true;
                this.attivaEffettoAncora(proiettile);
            }
        }

        // Attrazione continua quando atterrato
        if (proiettile.atterrato) {
            this.applicaAttrazione(proiettile);
        }
    }

    attivaEffettoAncora(proiettile) {
        console.log(`⚓ Ancora piantata!`);

        // Ferma l'ancora
        proiettile.aggregato.body.setLinearVelocity(BABYLON.Vector3.Zero());
        proiettile.aggregato.body.setMassProperties({ mass: 0 });

        // Effetto visivo area
        const areaEffetto = BABYLON.MeshBuilder.CreateSphere(
            'area_ancora',
            { diameter: this.raggioInfluenza * 2 },
            this.scene
        );
        areaEffetto.position = proiettile.mesh.position.clone();

        const mat = new BABYLON.StandardMaterial('mat_area_ancora', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.6);
        mat.alpha = 0.2;
        areaEffetto.material = mat;
        areaEffetto.isPickable = false;

        proiettile.areaEffetto = areaEffetto;

        // Livello 3: Zona Zero-G
        if (this.livello >= 3) {
            this.creaZonaZeroG(proiettile.mesh.position);
        }
    }

    applicaAttrazione(proiettile) {
        if (!proiettile.mesh) return;

        const centro = proiettile.mesh.position;

        // Trova tutti i nemici volanti nel raggio
        const meshNemici = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'nemico'
        );

        meshNemici.forEach(meshNemico => {
            const nemico = meshNemico.metadata.istanza;
            if (!nemico || !nemico.vivo || !nemico.aggregatoFisico) return;

            const distanza = BABYLON.Vector3.Distance(centro, meshNemico.position);

            if (distanza <= this.raggioInfluenza) {
                // Calcola forza di attrazione
                const direzione = centro.subtract(meshNemico.position).normalize();
                const forza = this.forzaGravitazionale * (1 - distanza / this.raggioInfluenza);

                // Per nemici volanti: aumenta gravità
                if (nemico.categoria === 'Volante') {
                    nemico.aggregatoFisico.body.setGravityFactor(3);
                }

                // Attrai verso l'ancora
                nemico.aggregatoFisico.body.applyForce(
                    direzione.scale(forza * nemico.massa),
                    meshNemico.position
                );
            }
        });
    }

    creaZonaZeroG(posizione) {
        console.log(`🌌 Zona Zero-G attivata!`);

        // Crea zona visiva
        this.zonaZeroG = BABYLON.MeshBuilder.CreateSphere(
            'zona_zerog',
            { diameter: this.raggioInfluenza * 1.5 },
            this.scene
        );
        this.zonaZeroG.position = posizione.clone();

        const mat = new BABYLON.StandardMaterial('mat_zerog', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.8);
        mat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.4);
        mat.alpha = 0.15;
        this.zonaZeroG.material = mat;
        this.zonaZeroG.isPickable = false;

        // Rimuovi dopo durata
        setTimeout(() => {
            if (this.zonaZeroG) {
                this.zonaZeroG.dispose();
                this.zonaZeroG = null;
            }
        }, this.durataZeroG * 1000);
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Danno da impatto
        super.onCollisioneNemico(proiettile, nemico);

        // Fa cadere i volanti
        if (nemico.categoria === 'Volante' && nemico.aggregatoFisico) {
            nemico.aggregatoFisico.body.setGravityFactor(5);

            setTimeout(() => {
                if (nemico.vivo && nemico.aggregatoFisico) {
                    nemico.aggregatoFisico.body.setGravityFactor(0);
                }
            }, 3000);
        }
    }

    distruggiProiettile(proiettile) {
        if (proiettile.areaEffetto) {
            proiettile.areaEffetto.dispose();
        }
        super.distruggiProiettile(proiettile);
    }
}
