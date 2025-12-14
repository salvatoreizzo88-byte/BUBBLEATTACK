/**
 * BUBBLE ATTACK - Bolla Fulmine
 * 
 * Arma elettrica. Spara raggi penetranti che stordiscono i nemici.
 * Lv1: Raggio penetrante
 * Lv2: +2 raggi a 45°
 * Lv3: Campo di stasi
 * 
 * Categoria: Elettrico
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class BollaFulmine extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 1,
            velocitaBase: 25,
            durataBase: 3,
            raggioBase: 0.3,
            cooldownBase: 0.4,
            costoSblocco: 800,
            costoUpgrade: [500, 1500, 3000],
            ...opzioni
        });

        this.tipo = TipiArma.BOLLA_FULMINE;
        this.categoria = CategorieArma.ELETTRICO;
        this.nomeVisualizzato = 'Bolla Fulmine';
        this.descrizione = 'Raggio elettrico penetrante che attraversa i nemici';
        this.icona = '⚡';

        // Effetti per livello
        this.effettiLivello = {
            1: ['penetrante'],
            2: ['penetrante', 'multiRaggio'],
            3: ['penetrante', 'multiRaggio', 'campoStasi']
        };

        // Parametri specifici
        this.angoloMultiRaggio = Math.PI / 4;  // 45°
        this.raggioStasi = 3;
        this.durataStasi = 2;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_fulmine_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.3, 0.7, 1);
        materiale.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1);
        materiale.alpha = 0.9;
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        // Posizione spawn
        const spawn = this.giocatore.position.clone();
        spawn.y += 0.5;
        spawn.addInPlace(direzione.scale(1));

        // Raggio principale
        this.creaRaggio(spawn, direzione);

        // Livello 2+: Raggi laterali
        if (this.livello >= 2) {
            // Raggio sinistro
            const dirSx = this.ruotaVettore(direzione, this.angoloMultiRaggio);
            this.creaRaggio(spawn, dirSx);

            // Raggio destro
            const dirDx = this.ruotaVettore(direzione, -this.angoloMultiRaggio);
            this.creaRaggio(spawn, dirDx);
        }

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaRaggio(posizione, direzione) {
        // Crea mesh allungata per il raggio
        const lunghezza = 2;
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            `fulmine_${Date.now()}`,
            { height: lunghezza, diameter: this.raggio },
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

        // Fisica leggera
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.CYLINDER,
            { mass: 0.05, friction: 0, restitution: 0 },
            this.scene
        );

        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setGravityFactor(0);
        aggregato.body.setLinearDamping(0);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            opzioni: { penetrante: true }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        // Effetto scia elettrica
        this.creaSciaElettrica(mesh);

        return proiettile;
    }

    creaSciaElettrica(mesh) {
        // Particelle per la scia
        const particelle = new BABYLON.ParticleSystem(`scia_${mesh.name}`, 50, this.scene);

        // Usa texture procedurale
        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AHMP7//x+fNKMyAQANqQT/p7p4JAAAAABJRU5ErkJggg==',
            this.scene
        );

        particelle.emitter = mesh;
        particelle.minSize = 0.1;
        particelle.maxSize = 0.2;
        particelle.minLifeTime = 0.1;
        particelle.maxLifeTime = 0.3;
        particelle.emitRate = 100;
        particelle.color1 = new BABYLON.Color4(0.3, 0.7, 1, 1);
        particelle.color2 = new BABYLON.Color4(0.8, 0.9, 1, 0.5);
        particelle.minEmitPower = 0.5;
        particelle.maxEmitPower = 1;

        particelle.start();

        // Stop quando il proiettile muore
        setTimeout(() => particelle.stop(), this.durata * 1000);
    }

    ruotaVettore(vettore, angolo) {
        // Ruota attorno all'asse Y
        const cos = Math.cos(angolo);
        const sin = Math.sin(angolo);

        return new BABYLON.Vector3(
            vettore.x * cos - vettore.z * sin,
            vettore.y,
            vettore.x * sin + vettore.z * cos
        );
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Stordisci invece di catturare normalmente
        nemico.stordisci();

        // Livello 3: Campo di stasi
        if (this.livello >= 3) {
            this.creaCampoStasi(nemico.mesh.position);
        }

        super.onCollisioneNemico(proiettile, nemico);

        // Il proiettile penetra (non si distrugge)
    }

    creaCampoStasi(posizione) {
        // Crea sfera di stasi
        const campo = BABYLON.MeshBuilder.CreateSphere(
            `stasi_${Date.now()}`,
            { diameter: this.raggioStasi * 2 },
            this.scene
        );
        campo.position = posizione.clone();

        const matStasi = new BABYLON.StandardMaterial('mat_stasi', this.scene);
        matStasi.diffuseColor = new BABYLON.Color3(0.3, 0.5, 1);
        matStasi.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
        matStasi.alpha = 0.3;
        campo.material = matStasi;

        // Nessuna fisica, solo visivo
        campo.isPickable = false;

        // Rimuovi dopo durata
        setTimeout(() => {
            campo.dispose();
        }, this.durataStasi * 1000);

        console.log(`⚡ Campo di stasi attivato!`);
    }
}
