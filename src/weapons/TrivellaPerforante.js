/**
 * BUBBLE ATTACK - Trivella Perforante
 * 
 * Arma meccanica. Trapana e rompe gli scudi.
 * Lv1: Rompe scudi nemici
 * Lv2: Crea tunnel temporaneo (3s)
 * Lv3: Onde sismiche al contatto
 * 
 * Categoria: Meccanico
 * NOTA: Unica arma che può danneggiare Golem-Geode e altri Pesi Massimi
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class TrivellaPerforante extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 2,
            velocitaBase: 18,
            durataBase: 4,
            raggioBase: 0.4,
            cooldownBase: 1.5,
            costoSblocco: 2000,
            costoUpgrade: [1000, 2500, 5000],
            ...opzioni
        });

        this.tipo = TipiArma.TRIVELLA_PERFORANTE;
        this.categoria = CategorieArma.MECCANICO;
        this.nomeVisualizzato = 'Trivella Perforante';
        this.descrizione = 'Trapano che perfora tutto, inclusi scudi e corazzature';
        this.icona = '🔧';

        // Flag speciale
        this.puoDanneggiareGolem = true;

        // Effetti per livello
        this.effettiLivello = {
            1: ['rompiScudi'],
            2: ['rompiScudi', 'creaTunnel'],
            3: ['rompiScudi', 'creaTunnel', 'ondeSismiche']
        };

        // Parametri specifici
        this.velocitaRotazione = 30;
        this.durataTunnel = 3;
        this.raggioSismica = 4;
        this.forzaSismica = 15;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_trivella_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
        materiale.specularColor = new BABYLON.Color3(0.9, 0.8, 0.7);
        materiale.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.05);
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        // Posizione spawn
        const spawn = this.giocatore.position.clone();
        spawn.y += 0.3;
        spawn.addInPlace(direzione.scale(1.2));

        // Crea trivella
        this.creaTrivella(spawn, direzione);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaTrivella(posizione, direzione) {
        // Crea mesh trivella (cono a spirale)
        const lunghezza = 1.5;
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            `trivella_${Date.now()}`,
            {
                height: lunghezza,
                diameterTop: 0,
                diameterBottom: this.raggio * 2,
                tessellation: 8
            },
            this.scene
        );

        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();

        // Orienta lungo la direzione
        const up = new BABYLON.Vector3(0, 1, 0);
        const angolo = Math.acos(BABYLON.Vector3.Dot(up, direzione));
        const asse = BABYLON.Vector3.Cross(up, direzione).normalize();
        if (asse.length() > 0.001) {
            mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(asse, angolo);
        }

        // Dettagli spirale
        for (let i = 0; i < 4; i++) {
            const spirale = BABYLON.MeshBuilder.CreateTorus(
                `spirale_${i}`,
                { diameter: this.raggio * 1.5, thickness: 0.05 },
                this.scene
            );
            spirale.position.y = -0.3 * i;
            spirale.rotation.x = Math.PI / 2;
            spirale.parent = mesh;
            spirale.material = mesh.material;
        }

        // Fisica penetrante
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            { mass: 2, friction: 0, restitution: 0 },
            this.scene
        );

        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setGravityFactor(0.3);
        aggregato.body.setLinearDamping(0.5);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: 'trivella',  // Tipo speciale per Golem
            proprietario: this,
            direzione: direzione.clone(),
            rotazione: 0,
            opzioni: { penetrante: true, rompiScudi: true }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile,
            speciale: 'trivella'
        };

        this.proiettiliAttivi.push(proiettile);

        // Effetto scintille
        this.creaScintille(mesh);

        return proiettile;
    }

    creaScintille(mesh) {
        const particelle = new BABYLON.ParticleSystem(`scintille_${mesh.name}`, 80, this.scene);

        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AHMP7//x+fNKMyAQANqQT/p7p4JAAAAABJRU5ErkJggg==',
            this.scene
        );

        particelle.emitter = mesh;
        particelle.minSize = 0.05;
        particelle.maxSize = 0.15;
        particelle.minLifeTime = 0.1;
        particelle.maxLifeTime = 0.3;
        particelle.emitRate = 200;
        particelle.color1 = new BABYLON.Color4(1, 0.8, 0.3, 1);
        particelle.color2 = new BABYLON.Color4(1, 0.5, 0.1, 0.5);
        particelle.minEmitPower = 3;
        particelle.maxEmitPower = 6;
        particelle.gravity = new BABYLON.Vector3(0, -5, 0);

        particelle.start();

        setTimeout(() => particelle.stop(), this.durata * 1000);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        // Rotazione continua
        if (proiettile.mesh && proiettile.mesh.rotationQuaternion) {
            proiettile.rotazione += deltaTime * this.velocitaRotazione;

            // Combina rotazione esistente con rotazione locale
            const rotLocale = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(0, 1, 0),
                proiettile.rotazione
            );

            // Mantieni orientamento originale ma aggiungi spin
            const direzione = proiettile.direzione;
            const up = new BABYLON.Vector3(0, 1, 0);
            const angolo = Math.acos(BABYLON.Vector3.Dot(up, direzione));
            const asse = BABYLON.Vector3.Cross(up, direzione).normalize();

            if (asse.length() > 0.001) {
                const rotDir = BABYLON.Quaternion.RotationAxis(asse, angolo);
                proiettile.mesh.rotationQuaternion = rotLocale.multiply(rotDir);
            }
        }
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Rompe scudi
        if (nemico.scudoAttivo !== undefined) {
            nemico.scudoAttivo = false;
            console.log(`🔧 Scudo di ${nemico.nomeVisualizzato} distrutto!`);
        }

        // Può danneggiare Golem
        if (nemico.tipo === 'GolemGeode' && nemico.colpitoDaSchiantoMeteora) {
            nemico.colpitoDaSchiantoMeteora(this.danno);
        } else {
            super.onCollisioneNemico(proiettile, nemico);
        }

        // Livello 3: Onde sismiche
        if (this.livello >= 3) {
            this.creaOndaSismica(proiettile.mesh.position);
        }
    }

    creaOndaSismica(posizione) {
        console.log(`💥 Onda sismica!`);

        // Effetto visivo
        const anello = BABYLON.MeshBuilder.CreateTorus(
            `sismica_${Date.now()}`,
            { diameter: 0.5, thickness: 0.1 },
            this.scene
        );
        anello.position = posizione.clone();
        anello.position.y = 0.1;
        anello.rotation.x = Math.PI / 2;

        const matSismica = new BABYLON.StandardMaterial('mat_sismica', this.scene);
        matSismica.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.3);
        matSismica.emissiveColor = new BABYLON.Color3(0.4, 0.3, 0.15);
        matSismica.alpha = 0.7;
        anello.material = matSismica;

        // Espandi anello
        let scala = 1;
        const espansione = setInterval(() => {
            scala += 0.5;
            anello.scaling = new BABYLON.Vector3(scala, scala, 1);
            matSismica.alpha -= 0.05;

            if (scala >= this.raggioSismica * 2) {
                clearInterval(espansione);
                anello.dispose();
            }
        }, 50);

        // Applica forza ai nemici nel raggio
        // (La logica andrebbe integrata col gestore nemici)
    }

    /**
     * Livello 2: Crea tunnel temporaneo in una parete
     */
    creaTunnel(posizione, direzione) {
        if (this.livello < 2) return;

        console.log(`🕳️ Tunnel creato per ${this.durataTunnel}s!`);

        // Crea mesh tunnel (cilindro invisibile)
        const tunnel = BABYLON.MeshBuilder.CreateCylinder(
            `tunnel_${Date.now()}`,
            { height: 2, diameter: 1.5 },
            this.scene
        );
        tunnel.position = posizione.clone();
        tunnel.rotation.z = Math.PI / 2;

        // Orienta
        const angolo = Math.atan2(direzione.x, direzione.z);
        tunnel.rotation.y = angolo;

        const matTunnel = new BABYLON.StandardMaterial('mat_tunnel', this.scene);
        matTunnel.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        matTunnel.alpha = 0.5;
        tunnel.material = matTunnel;

        // Il tunnel è attraversabile (niente fisica)
        tunnel.isPickable = false;

        // Rimuovi dopo durata
        setTimeout(() => {
            tunnel.dispose();
        }, this.durataTunnel * 1000);
    }
}
