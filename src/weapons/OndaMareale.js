/**
 * BUBBLE ATTACK - Onda Mareale
 * 
 * Arma acquatica. Crea onde che spingono i nemici.
 * Lv1: Spinge nemici leggeri
 * Lv2: Sposta anche nemici pesanti
 * Lv3: Risacca che attira il loot
 * 
 * Categoria: Acqua
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class OndaMareale extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 0.5,
            velocitaBase: 12,
            durataBase: 2,
            raggioBase: 2,
            cooldownBase: 1.0,
            costoSblocco: 1000,
            costoUpgrade: [600, 1800, 4000],
            ...opzioni
        });

        this.tipo = TipiArma.ONDA_MAREALE;
        this.categoria = CategorieArma.ACQUA;
        this.nomeVisualizzato = 'Onda Mareale';
        this.descrizione = 'Onda d\'acqua che spinge via i nemici';
        this.icona = '🌊';

        // Effetti per livello
        this.effettiLivello = {
            1: ['spingi'],
            2: ['spingi', 'spingiPesanti'],
            3: ['spingi', 'spingiPesanti', 'risacca']
        };

        // Parametri specifici
        this.forzaSpinta = 20;
        this.forzaSpintaPesante = 40;
        this.raggioRisacca = 8;
        this.forzaRisacca = 5;
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_onda_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8);
        materiale.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
        materiale.alpha = 0.6;
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        // Posizione spawn
        const spawn = this.giocatore.position.clone();
        spawn.addInPlace(direzione.scale(1.5));

        // Crea onda
        this.creaOnda(spawn, direzione);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaOnda(posizione, direzione) {
        // Crea mesh onda (disco deformato)
        const larghezza = this.raggio * 2;
        const altezza = 1.5;

        const mesh = BABYLON.MeshBuilder.CreateBox(
            `onda_${Date.now()}`,
            { width: larghezza, height: altezza, depth: 0.5 },
            this.scene
        );

        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();

        // Orienta verso la direzione
        const angolo = Math.atan2(direzione.x, direzione.z);
        mesh.rotation.y = angolo;

        // Fisica
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 5, friction: 0, restitution: 0.3 },
            this.scene
        );

        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setGravityFactor(0);
        aggregato.body.setLinearDamping(1.5);
        aggregato.body.setAngularDamping(100);

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            direzione: direzione.clone(),
            opzioni: { spingi: true }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        // Effetto particelle acqua
        this.creaParticelleAcqua(mesh);

        return proiettile;
    }

    creaParticelleAcqua(mesh) {
        const particelle = new BABYLON.ParticleSystem(`acqua_${mesh.name}`, 100, this.scene);

        particelle.particleTexture = new BABYLON.Texture(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AHMP7//x+fNKMyAQANqQT/p7p4JAAAAABJRU5ErkJggg==',
            this.scene
        );

        particelle.emitter = mesh;
        particelle.minSize = 0.1;
        particelle.maxSize = 0.3;
        particelle.minLifeTime = 0.2;
        particelle.maxLifeTime = 0.5;
        particelle.emitRate = 150;
        particelle.color1 = new BABYLON.Color4(0.3, 0.6, 0.9, 1);
        particelle.color2 = new BABYLON.Color4(0.5, 0.8, 1, 0.3);
        particelle.minEmitPower = 2;
        particelle.maxEmitPower = 4;
        particelle.gravity = new BABYLON.Vector3(0, -2, 0);

        particelle.start();

        setTimeout(() => particelle.stop(), this.durata * 1000);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        // L'onda cresce man mano che avanza
        if (proiettile.mesh) {
            const crescita = 1 + deltaTime * 0.5;
            proiettile.mesh.scaling.x *= crescita;
            proiettile.mesh.scaling.x = Math.min(proiettile.mesh.scaling.x, 3);
        }
    }

    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Calcola forza spinta
        let forzaSpinta = this.forzaSpinta;

        // Livello 2+: può spingere anche i pesanti
        if (this.livello >= 2 && nemico.massa > 10) {
            forzaSpinta = this.forzaSpintaPesante;
        } else if (nemico.massa > 10 && this.livello < 2) {
            // Non può spingere i pesanti
            console.log(`🌊 ${nemico.nomeVisualizzato} è troppo pesante!`);
            return;
        }

        // Applica spinta
        if (nemico.aggregatoFisico) {
            const direzione = proiettile.direzione.clone();
            direzione.y = 0.3;  // Solleva un po'

            nemico.aggregatoFisico.body.applyImpulse(
                direzione.scale(forzaSpinta * nemico.massa),
                nemico.mesh.position
            );
        }

        // Danno minimo
        super.onCollisioneNemico(proiettile, nemico);
    }

    /**
     * Attiva risacca (Livello 3) - attira il loot
     */
    attivaRisacca() {
        if (this.livello < 3) return;

        console.log(`🌀 Risacca attivata!`);

        // Trova tutti i collezionabili nella scena
        const collezionabili = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'collezionabile'
        );

        const posGiocatore = this.giocatore.position;

        collezionabili.forEach(coll => {
            const distanza = BABYLON.Vector3.Distance(coll.position, posGiocatore);

            if (distanza <= this.raggioRisacca) {
                // Attira verso il giocatore
                const direzione = posGiocatore.subtract(coll.position).normalize();

                if (coll.physicsAggregate) {
                    coll.physicsAggregate.body.applyForce(
                        direzione.scale(this.forzaRisacca),
                        coll.position
                    );
                } else {
                    // Movimento semplice senza fisica
                    coll.position.addInPlace(direzione.scale(0.5));
                }
            }
        });
    }

    spara(direzione) {
        const result = super.spara?.(direzione) ?? this.sparaBase(direzione);

        // Livello 3: Attiva risacca dopo lo sparo
        if (this.livello >= 3) {
            setTimeout(() => this.attivaRisacca(), 500);
        }

        return result;
    }

    sparaBase(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.addInPlace(direzione.scale(1.5));

        this.creaOnda(spawn, direzione);
        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }
}
