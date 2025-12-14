/**
 * BUBBLE ATTACK - Cometa Rimbalzante
 * 
 * Arma cinetica. Proiettile che rimbalza tra i nemici.
 * Lv1: 5 rimbalzi
 * Lv2: Aim assist (cerca nemici vicini)
 * Lv3: Si divide in 2 ad ogni rimbalzo
 * 
 * Categoria: Cinetico
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class CometaRimbalzante extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 1.5,
            velocitaBase: 20,
            durataBase: 8,
            raggioBase: 0.4,
            cooldownBase: 1.2,
            costoSblocco: 1800,
            costoUpgrade: [1000, 3000, 6000],
            ...opzioni
        });

        this.tipo = TipiArma.COMETA_RIMBALZANTE;
        this.categoria = CategorieArma.CINETICO;
        this.nomeVisualizzato = 'Cometa Rimbalzante';
        this.descrizione = 'Proiettile che rimbalza tra i nemici';
        this.icona = '☄️';

        // Effetti per livello
        this.effettiLivello = {
            1: ['rimbalzo'],
            2: ['rimbalzo', 'aimAssist'],
            3: ['rimbalzo', 'aimAssist', 'divisione']
        };

        // Parametri specifici
        this.maxRimbalzi = [5, 7, 10];  // Per livello
        this.raggioAimAssist = 5;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_cometa_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(1, 0.8, 0.3);
        materiale.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.1);
        materiale.specularColor = new BABYLON.Color3(1, 1, 0.5);
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.y += 0.5;
        spawn.addInPlace(direzione.scale(1));

        // Crea cometa
        this.creaCometa(spawn, direzione, this.maxRimbalzi[this.livello - 1]);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaCometa(posizione, direzione, rimbalziRimanenti, dimensione = 1) {
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `cometa_${Date.now()}`,
            { diameter: this.raggio * 2 * dimensione },
            this.scene
        );
        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();

        // Scia luminosa
        this.creaScia(mesh);

        // Fisica rimbalzante
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 0.5, friction: 0, restitution: 1.2 },  // Alta restitution
            this.scene
        );

        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setGravityFactor(0);
        aggregato.body.setLinearDamping(0);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno * dimensione,
            tipo: this.tipo,
            proprietario: this,
            rimbalziRimanenti: rimbalziRimanenti,
            dimensione: dimensione,
            nemiciColpiti: new Set(),  // Evita di colpire lo stesso nemico due volte di fila
            opzioni: {
                rimbalzo: true,
                aimAssist: this.livello >= 2,
                divisione: this.livello >= 3
            }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: proiettile.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        return proiettile;
    }

    creaScia(mesh) {
        const particelle = new BABYLON.ParticleSystem(`scia_cometa_${mesh.name}`, 50, this.scene);

        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AHMP7//x+fNKMyAQANqQT/p7p4JAAAAABJRU5ErkJggg==',
            this.scene
        );

        particelle.emitter = mesh;
        particelle.minSize = 0.1;
        particelle.maxSize = 0.25;
        particelle.minLifeTime = 0.2;
        particelle.maxLifeTime = 0.4;
        particelle.emitRate = 60;
        particelle.color1 = new BABYLON.Color4(1, 0.8, 0.3, 1);
        particelle.color2 = new BABYLON.Color4(1, 0.5, 0.1, 0.5);
        particelle.minEmitPower = 0.5;
        particelle.maxEmitPower = 1;

        particelle.start();

        // Stop quando il proiettile muore
        setTimeout(() => particelle.stop(), this.durata * 1000);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        if (!proiettile.mesh || !proiettile.aggregato) return;

        // Livello 2+: Aim assist
        if (proiettile.opzioni.aimAssist) {
            this.applicaAimAssist(proiettile);
        }

        // Pulisci nemici colpiti dopo un po' (permette di ricolpirli dopo rimbalzo)
        if (proiettile.nemiciColpiti.size > 0) {
            // Reset dopo ogni rimbalzo
        }
    }

    applicaAimAssist(proiettile) {
        if (!proiettile.mesh) return;

        const posizione = proiettile.mesh.position;
        const velocita = proiettile.aggregato.body.getLinearVelocity();
        const direzioneCorrente = velocita.normalize();

        // Trova il nemico più vicino nella direzione di movimento
        let nemicoTarget = null;
        let distanzaMin = this.raggioAimAssist;

        const meshNemici = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'nemico'
        );

        meshNemici.forEach(meshNemico => {
            const nemico = meshNemico.metadata.istanza;
            if (!nemico || !nemico.vivo) return;
            if (proiettile.nemiciColpiti.has(nemico.id)) return;

            const direzioneVersoNemico = meshNemico.position.subtract(posizione);
            const distanza = direzioneVersoNemico.length();

            if (distanza > this.raggioAimAssist) return;

            // Controlla se è nella direzione di movimento (angolo < 60°)
            direzioneVersoNemico.normalize();
            const angolo = Math.acos(BABYLON.Vector3.Dot(direzioneCorrente, direzioneVersoNemico));

            if (angolo < Math.PI / 3 && distanza < distanzaMin) {
                nemicoTarget = nemico;
                distanzaMin = distanza;
            }
        });

        // Curva leggermente verso il target
        if (nemicoTarget && nemicoTarget.mesh) {
            const direzioneTarget = nemicoTarget.mesh.position.subtract(posizione).normalize();
            const nuovaDirezione = direzioneCorrente.add(direzioneTarget.scale(0.05)).normalize();

            proiettile.aggregato.body.setLinearVelocity(nuovaDirezione.scale(this.velocita));
        }
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;
        if (proiettile.nemiciColpiti.has(nemico.id)) return;

        // Danno
        super.onCollisioneNemico(proiettile, nemico);

        proiettile.nemiciColpiti.add(nemico.id);
        proiettile.rimbalziRimanenti--;

        console.log(`☄️ Rimbalzo! (${proiettile.rimbalziRimanenti} rimanenti)`);

        if (proiettile.rimbalziRimanenti <= 0) {
            proiettile.timer = 0;  // Fine
            return;
        }

        // Trova prossimo nemico
        const prossimoNemico = this.trovaProssimoNemico(proiettile, nemico);

        if (prossimoNemico) {
            // Rimbalza verso il prossimo nemico
            const nuovaDirezione = prossimoNemico.mesh.position
                .subtract(proiettile.mesh.position)
                .normalize();

            proiettile.aggregato.body.setLinearVelocity(nuovaDirezione.scale(this.velocita));
        } else {
            // Rimbalzo casuale
            const angoloCasuale = Math.random() * Math.PI * 2;
            const nuovaDirezione = new BABYLON.Vector3(
                Math.cos(angoloCasuale),
                0,
                Math.sin(angoloCasuale)
            );

            proiettile.aggregato.body.setLinearVelocity(nuovaDirezione.scale(this.velocita));
        }

        // Livello 3: Divisione
        if (proiettile.opzioni.divisione && proiettile.dimensione > 0.3) {
            this.dividiCometa(proiettile);
        }

        // Pulisci lista nemici colpiti dopo un po'
        setTimeout(() => {
            proiettile.nemiciColpiti.clear();
        }, 500);
    }

    trovaProssimoNemico(proiettile, nemicoEscluso) {
        const posizione = proiettile.mesh.position;
        let nemicoVicino = null;
        let distanzaMin = Infinity;

        const meshNemici = this.scene.meshes.filter(m =>
            m.metadata &&
            m.metadata.tipo === 'nemico' &&
            m.metadata.istanza !== nemicoEscluso
        );

        meshNemici.forEach(meshNemico => {
            const nemico = meshNemico.metadata.istanza;
            if (!nemico || !nemico.vivo) return;

            const distanza = BABYLON.Vector3.Distance(posizione, meshNemico.position);

            if (distanza < distanzaMin && distanza < 15) {
                nemicoVicino = nemico;
                distanzaMin = distanza;
            }
        });

        return nemicoVicino;
    }

    dividiCometa(proiettile) {
        if (!proiettile.mesh) return;

        const posizione = proiettile.mesh.position.clone();
        const nuovaDimensione = proiettile.dimensione * 0.6;
        const rimbalzi = Math.floor(proiettile.rimbalziRimanenti / 2);

        // Crea 2 comete più piccole
        for (let i = 0; i < 2; i++) {
            const angolo = (i === 0 ? 1 : -1) * Math.PI / 4;
            const vel = proiettile.aggregato.body.getLinearVelocity();
            const nuovaDirezione = this.ruotaDirezione(vel.normalize(), angolo);

            this.creaCometa(
                posizione.add(nuovaDirezione.scale(0.5)),
                nuovaDirezione,
                rimbalzi,
                nuovaDimensione
            );
        }

        console.log(`💫 Cometa divisa!`);
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
}
