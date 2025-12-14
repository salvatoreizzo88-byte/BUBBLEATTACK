/**
 * BUBBLE ATTACK - Congela Tempo
 * 
 * Arma temporale. Rallenta/ferma i nemici.
 * Lv1: Nemici al 10% velocità
 * Lv2: Nemici completamente fermi
 * Lv3: Danno accumulato rilasciato alla fine
 * 
 * Categoria: Tempo
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class CongelaTempo extends ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        super(scene, giocatore, {
            dannoBase: 0,  // Non fa danno diretto
            velocitaBase: 20,
            durataBase: 3,
            raggioBase: 3,
            cooldownBase: 5.0,  // Cooldown lungo
            costoSblocco: 2500,
            costoUpgrade: [1500, 4000, 8000],
            ...opzioni
        });

        this.tipo = TipiArma.CONGELA_TEMPO;
        this.categoria = CategorieArma.TEMPO;
        this.nomeVisualizzato = 'Congela Tempo';
        this.descrizione = 'Ferma il tempo per i nemici nell\'area';
        this.icona = '⏱️';

        // Effetti per livello
        this.effettiLivello = {
            1: ['rallentamento90'],
            2: ['rallentamento90', 'stop'],
            3: ['rallentamento90', 'stop', 'dannoAccumulato']
        };

        // Parametri specifici
        this.fattoreRallentamento = [0.1, 0, 0];  // Per livello
        this.nemiciCongelati = [];
        this.dannoAccumulato = new Map();
    }

    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_tempo_${Date.now()}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
        materiale.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.5);
        materiale.alpha = 0.6;
        return materiale;
    }

    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;

        const spawn = this.giocatore.position.clone();
        spawn.addInPlace(direzione.scale(2));

        // Crea onda temporale
        this.creaOndaTemporale(spawn);

        this.cooldownCorrente = this.cooldown;

        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    creaOndaTemporale(posizione) {
        // Sfera che si espande
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `tempo_${Date.now()}`,
            { diameter: 0.5, segments: 16 },
            this.scene
        );
        mesh.position = posizione.clone();
        mesh.material = this.creaMaterialeProiettile();
        mesh.isPickable = false;

        const proiettile = {
            mesh: mesh,
            aggregato: null,  // Nessuna fisica, solo visivo
            timer: this.durata,
            danno: 0,
            tipo: this.tipo,
            proprietario: this,
            raggioCorrente: 0.5,
            opzioni: { tempo: true }
        };

        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        // Espandi e congela
        this.espandiOndaTemporale(proiettile);

        return proiettile;
    }

    espandiOndaTemporale(proiettile) {
        const velocitaEspansione = this.raggio / 0.5;  // Raggio finale in 0.5 secondi

        const espandi = setInterval(() => {
            if (!proiettile.mesh) {
                clearInterval(espandi);
                return;
            }

            proiettile.raggioCorrente += velocitaEspansione * 0.05;
            proiettile.mesh.scaling = new BABYLON.Vector3(
                proiettile.raggioCorrente,
                proiettile.raggioCorrente,
                proiettile.raggioCorrente
            );

            // Congela nemici nel raggio
            this.congelaNemiciInRaggio(proiettile);

            if (proiettile.raggioCorrente >= this.raggio) {
                clearInterval(espandi);
            }
        }, 50);
    }

    congelaNemiciInRaggio(proiettile) {
        if (!proiettile.mesh) return;

        const centro = proiettile.mesh.position;
        const raggio = proiettile.raggioCorrente;

        // Trova nemici nella scena
        const meshNemici = this.scene.meshes.filter(m =>
            m.metadata && m.metadata.tipo === 'nemico'
        );

        meshNemici.forEach(meshNemico => {
            const nemico = meshNemico.metadata.istanza;
            if (!nemico || !nemico.vivo) return;

            const distanza = BABYLON.Vector3.Distance(centro, meshNemico.position);

            if (distanza <= raggio && !this.nemiciCongelati.includes(nemico)) {
                this.congelaNemico(nemico);
            }
        });
    }

    congelaNemico(nemico) {
        this.nemiciCongelati.push(nemico);

        // Salva velocità originale
        const velOriginale = nemico.velocitaMovimento;
        nemico._velOriginale = velOriginale;

        // Applica rallentamento in base al livello
        const fattore = this.fattoreRallentamento[this.livello - 1];
        nemico.velocitaMovimento = velOriginale * fattore;

        // Se livello 2+, ferma completamente
        if (this.livello >= 2 && nemico.aggregatoFisico) {
            nemico.aggregatoFisico.body.setLinearVelocity(BABYLON.Vector3.Zero());
            nemico.aggregatoFisico.body.setAngularVelocity(BABYLON.Vector3.Zero());
            nemico._massaOriginale = nemico.massa;
            nemico.aggregatoFisico.body.setMassProperties({ mass: 0 });
        }

        // Effetto visivo congelamento
        if (nemico.mesh && nemico.mesh.material) {
            nemico._coloreOriginale = nemico.mesh.material.diffuseColor.clone();
            nemico.mesh.material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
            nemico.mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        }

        // Livello 3: Traccia danno
        if (this.livello >= 3) {
            this.dannoAccumulato.set(nemico.id, 0);
        }

        console.log(`⏱️ ${nemico.nomeVisualizzato} congelato!`);

        // Scongela dopo durata
        setTimeout(() => {
            this.scongelaNemico(nemico);
        }, this.durata * 1000);
    }

    scongelaNemico(nemico) {
        const indice = this.nemiciCongelati.indexOf(nemico);
        if (indice === -1) return;

        this.nemiciCongelati.splice(indice, 1);

        if (!nemico.vivo) return;

        // Ripristina velocità
        if (nemico._velOriginale !== undefined) {
            nemico.velocitaMovimento = nemico._velOriginale;
        }

        // Ripristina fisica
        if (this.livello >= 2 && nemico.aggregatoFisico && nemico._massaOriginale) {
            nemico.aggregatoFisico.body.setMassProperties({ mass: nemico._massaOriginale });
        }

        // Ripristina colore
        if (nemico.mesh && nemico.mesh.material && nemico._coloreOriginale) {
            nemico.mesh.material.diffuseColor = nemico._coloreOriginale;
            nemico.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }

        // Livello 3: Rilascia danno accumulato
        if (this.livello >= 3 && this.dannoAccumulato.has(nemico.id)) {
            const danno = this.dannoAccumulato.get(nemico.id);
            if (danno > 0) {
                console.log(`💥 Rilascio ${danno} danni accumulati su ${nemico.nomeVisualizzato}!`);

                // Applica danno
                for (let i = 0; i < Math.floor(danno); i++) {
                    nemico.colpitoDaBolla({ tipo: 'CongelaTempo' });
                }
            }
            this.dannoAccumulato.delete(nemico.id);
        }

        console.log(`⏱️ ${nemico.nomeVisualizzato} scongelato!`);
    }

    /**
     * Accumula danno per nemico congelato (Livello 3)
     */
    accumulaDanno(nemico, danno) {
        if (this.livello < 3) return;
        if (!this.dannoAccumulato.has(nemico.id)) return;

        const dannoCorrente = this.dannoAccumulato.get(nemico.id);
        this.dannoAccumulato.set(nemico.id, dannoCorrente + danno);
    }

    aggiornaProiettile(proiettile, deltaTime) {
        // Effetto pulsante
        if (proiettile.mesh) {
            const pulso = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            proiettile.mesh.scaling.scaleInPlace(1.001);  // Leggera espansione continua

            if (proiettile.mesh.material) {
                proiettile.mesh.material.alpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
            }
        }
    }

    distruggi() {
        // Scongela tutti i nemici
        for (const nemico of this.nemiciCongelati) {
            this.scongelaNemico(nemico);
        }
        this.nemiciCongelati = [];
        this.dannoAccumulato.clear();

        super.distruggi();
    }
}
