/**
 * BUBBLE ATTACK - Gestore Nemici
 * 
 * Gestisce tutti i nemici attivi nella scena.
 * Spawning, update, interazione con bolle, e eliminazione.
 */

import { NemicoBase, TipiNemico, CategorieNemico, creaNemico } from './NemicoBase.js';

// Import dei nemici specifici
// I moduli vengono importati dinamicamente quando necessario

export class GestoreNemici {
    constructor(scene, giocatore) {
        this.scene = scene;
        this.giocatore = giocatore;

        // Lista nemici attivi
        this.nemiciAttivi = [];
        this.maxNemici = 50;

        // Pool per riutilizzo
        this.poolNemici = new Map();

        // Statistiche
        this.statistiche = {
            nemiciSpawnati: 0,
            nemiciSconfitti: 0,
            nemiciCatturati: 0,
            puntiTotali: 0
        };

        // Callbacks
        this.onNemicoMorto = null;
        this.onNemicoCatturato = null;
        this.onTuttiNemiciSconfitti = null;

        // Classi nemici registrate
        this.classiNemici = new Map();
    }

    /**
     * Registra una classe nemico
     */
    registraNemico(tipo, classe) {
        this.classiNemici.set(tipo, classe);
        console.log(`📝 Nemico registrato: ${tipo}`);
    }

    /**
     * Crea un nemico di un tipo specifico
     */
    async creaNemico(tipo, posizione, opzioni = {}) {
        if (this.nemiciAttivi.length >= this.maxNemici) {
            console.warn('Limite nemici raggiunto!');
            return null;
        }

        let nemico;

        // Cerca nella pool
        if (this.poolNemici.has(tipo) && this.poolNemici.get(tipo).length > 0) {
            nemico = this.poolNemici.get(tipo).pop();
            nemico.mesh.position = posizione.clone();
            nemico.vivo = true;
            nemico.catturato = false;
            nemico.puntiVita = nemico.puntiVitaMax;
            nemico.colpiRicevuti = 0;
        } else {
            // Crea nuovo nemico
            const ClasseNemico = this.classiNemici.get(tipo);

            if (ClasseNemico) {
                nemico = new ClasseNemico(this.scene, posizione, opzioni);
            } else {
                // Fallback a nemico base
                nemico = new NemicoBase(this.scene, posizione, opzioni);
                nemico.tipo = tipo;
            }

            await nemico.crea();
        }

        // Configura callbacks
        nemico.onMorte = (n) => this.gestisciMorteNemico(n);
        nemico.onCattura = (n, b) => this.gestisciCatturaNemico(n, b);

        this.nemiciAttivi.push(nemico);
        this.statistiche.nemiciSpawnati++;

        return nemico;
    }

    /**
     * Spawna più nemici in posizioni specificate
     */
    async spawnaNemici(listaSpawn) {
        const promesse = listaSpawn.map(spawn =>
            this.creaNemico(
                spawn.tipo || TipiNemico.ZEN_ROBOT,
                new BABYLON.Vector3(spawn.x, spawn.y, spawn.z),
                spawn.opzioni || {}
            )
        );

        return Promise.all(promesse);
    }

    /**
     * Update di tutti i nemici
     */
    update(deltaTime) {
        for (let i = this.nemiciAttivi.length - 1; i >= 0; i--) {
            const nemico = this.nemiciAttivi[i];

            if (nemico.vivo) {
                nemico.update(deltaTime, this.giocatore);
            } else {
                // Rimuovi nemico morto
                this.rimuoviNemico(i);
            }
        }
    }

    /**
     * Gestisce la morte di un nemico
     */
    gestisciMorteNemico(nemico) {
        this.statistiche.nemiciSconfitti++;
        this.statistiche.puntiTotali += nemico.puntiUccisione;

        // Spawn drop
        this.spawnaDrop(nemico);

        console.log(`💀 ${nemico.nomeVisualizzato} sconfitto! Totale: ${this.statistiche.nemiciSconfitti}`);

        if (this.onNemicoMorto) {
            this.onNemicoMorto(nemico);
        }

        // Controlla se tutti i nemici sono sconfitti
        const nemiciVivi = this.nemiciAttivi.filter(n => n.vivo && !n.catturato).length;
        if (nemiciVivi === 0 && this.onTuttiNemiciSconfitti) {
            this.onTuttiNemiciSconfitti();
        }
    }

    /**
     * Gestisce la cattura di un nemico
     */
    gestisciCatturaNemico(nemico, bolla) {
        this.statistiche.nemiciCatturati++;

        console.log(`🫧 ${nemico.nomeVisualizzato} catturato!`);

        if (this.onNemicoCatturato) {
            this.onNemicoCatturato(nemico, bolla);
        }
    }

    /**
     * Rimuove un nemico dalla lista attivi
     */
    rimuoviNemico(indice) {
        const nemico = this.nemiciAttivi[indice];

        // Aggiungi alla pool per riutilizzo
        if (!this.poolNemici.has(nemico.tipo)) {
            this.poolNemici.set(nemico.tipo, []);
        }

        // Nascondi invece di distruggere
        if (nemico.mesh) {
            nemico.mesh.setEnabled(false);
        }

        this.poolNemici.get(nemico.tipo).push(nemico);
        this.nemiciAttivi.splice(indice, 1);
    }

    /**
     * Spawna drop (monete, frutta) dal nemico
     */
    spawnaDrop(nemico) {
        if (!nemico.dropOro) return;

        const posizione = nemico.mesh ? nemico.mesh.position.clone() : nemico.posizioneIniziale;

        // Calcola quantità oro
        const quantitaOro = Math.floor(
            Math.random() * (nemico.dropOro.max - nemico.dropOro.min + 1) + nemico.dropOro.min
        );

        // TODO: Creare mesh monete/frutta e aggiungerle alla scena
        // Per ora log
        console.log(`💰 Drop: ${quantitaOro} oro, ${nemico.dropFrutta}`);
    }

    /**
     * Trova nemici in un raggio
     */
    trovaNemiciInRaggio(centro, raggio) {
        return this.nemiciAttivi.filter(nemico => {
            if (!nemico.vivo || !nemico.mesh) return false;

            const distanza = BABYLON.Vector3.Distance(centro, nemico.mesh.position);
            return distanza <= raggio;
        });
    }

    /**
     * Controlla collisione con una bolla
     */
    controllaCollisioneBolla(bolla) {
        if (!bolla || !bolla.mesh) return null;

        const raggioBolla = bolla.raggio || 0.6;

        for (const nemico of this.nemiciAttivi) {
            if (!nemico.vivo || nemico.catturato || !nemico.mesh) continue;

            const distanza = BABYLON.Vector3.Distance(
                bolla.mesh.position,
                nemico.mesh.position
            );

            const raggioNemico = 0.8;  // Approssimazione

            if (distanza < raggioBolla + raggioNemico) {
                return nemico;
            }
        }

        return null;
    }

    /**
     * Ottieni nemico per ID
     */
    ottieniNemicoPerId(id) {
        return this.nemiciAttivi.find(n => n.id === id);
    }

    /**
     * Ottieni numero nemici vivi
     */
    contaNemiciVivi() {
        return this.nemiciAttivi.filter(n => n.vivo && !n.catturato).length;
    }

    /**
     * Ottieni statistiche
     */
    ottieniStatistiche() {
        return {
            ...this.statistiche,
            nemiciAttivi: this.nemiciAttivi.length,
            nemiciVivi: this.contaNemiciVivi()
        };
    }

    /**
     * Pulisci tutti i nemici
     */
    pulisciTutto() {
        for (const nemico of this.nemiciAttivi) {
            nemico.distruggi();
        }
        this.nemiciAttivi = [];

        for (const [tipo, pool] of this.poolNemici) {
            for (const nemico of pool) {
                nemico.distruggi();
            }
        }
        this.poolNemici.clear();
    }
}
