/**
 * BUBBLE ATTACK - Gestore Arsenale
 * 
 * Gestisce tutte le armi/power-up del giocatore.
 * Sblocco, equipaggiamento, potenziamento e utilizzo.
 */

import { ArmaBase, TipiArma, CategorieArma } from './ArmaBase.js';

export class GestoreArsenale {
    constructor(scene, giocatore) {
        this.scene = scene;
        this.giocatore = giocatore;

        // Armi registrate
        this.armiDisponibili = new Map();

        // Armi sbloccate dal giocatore
        this.armiSbloccate = new Map();

        // Arma corrente equipaggiata
        this.armaCorrente = null;
        this.indiceArmaCorrente = 0;

        // Lista armi equipaggiate (max 3 slot)
        this.slotArmi = [null, null, null];
        this.maxSlot = 3;

        // Statistiche
        this.statistiche = {
            colpiSparati: 0,
            colpiAndati: 0,
            nemiciUccisi: 0,
            dannoTotale: 0
        };

        // Callbacks
        this.onArmaEquipaggiata = null;
        this.onArmaCambiata = null;
    }

    /**
     * Registra una classe arma nel sistema
     */
    registraArma(tipo, classe) {
        this.armiDisponibili.set(tipo, classe);
        console.log(`🔫 Arma registrata: ${tipo}`);
    }

    /**
     * Sblocca un'arma per il giocatore
     */
    sbloccaArma(tipo, livello = 1) {
        if (!this.armiDisponibili.has(tipo)) {
            console.warn(`Arma non trovata: ${tipo}`);
            return null;
        }

        if (this.armiSbloccate.has(tipo)) {
            console.log(`${tipo} già sbloccata`);
            return this.armiSbloccate.get(tipo);
        }

        const ClasseArma = this.armiDisponibili.get(tipo);
        const arma = new ClasseArma(this.scene, this.giocatore, { livello });
        arma.sblocca();
        arma.inizializza();

        // Configura callbacks
        arma.onColpito = (a, p, n) => this.gestisciColpo(a, p, n);
        arma.onUccisione = (a, n) => this.gestisciUccisione(a, n);

        this.armiSbloccate.set(tipo, arma);

        console.log(`🔓 ${arma.nomeVisualizzato} sbloccata!`);

        return arma;
    }

    /**
     * Equipaggia un'arma in uno slot
     */
    equipaggiaArma(tipo, slot = 0) {
        if (slot < 0 || slot >= this.maxSlot) {
            console.warn(`Slot non valido: ${slot}`);
            return false;
        }

        const arma = this.armiSbloccate.get(tipo);
        if (!arma) {
            console.warn(`Arma non sbloccata: ${tipo}`);
            return false;
        }

        // Rimuovi da slot precedente se già equipaggiata
        for (let i = 0; i < this.slotArmi.length; i++) {
            if (this.slotArmi[i] === arma) {
                this.slotArmi[i] = null;
            }
        }

        this.slotArmi[slot] = arma;

        // Se è il primo slot, equipaggia come corrente
        if (slot === 0 || !this.armaCorrente) {
            this.selezionaSlot(slot);
        }

        if (this.onArmaEquipaggiata) {
            this.onArmaEquipaggiata(arma, slot);
        }

        console.log(`⚔️ ${arma.nomeVisualizzato} equipaggiata in slot ${slot + 1}`);

        return true;
    }

    /**
     * Seleziona lo slot arma corrente
     */
    selezionaSlot(slot) {
        if (slot < 0 || slot >= this.maxSlot) return;

        // Disattiva arma precedente
        if (this.armaCorrente) {
            this.armaCorrente.disattiva();
        }

        this.indiceArmaCorrente = slot;
        this.armaCorrente = this.slotArmi[slot];

        // Attiva nuova arma
        if (this.armaCorrente) {
            this.armaCorrente.attiva();

            if (this.onArmaCambiata) {
                this.onArmaCambiata(this.armaCorrente, slot);
            }
        }
    }

    /**
     * Passa all'arma successiva
     */
    armaSuccessiva() {
        let nuovoSlot = this.indiceArmaCorrente;

        // Trova prossimo slot con arma
        for (let i = 1; i <= this.maxSlot; i++) {
            const slot = (this.indiceArmaCorrente + i) % this.maxSlot;
            if (this.slotArmi[slot]) {
                nuovoSlot = slot;
                break;
            }
        }

        this.selezionaSlot(nuovoSlot);
    }

    /**
     * Passa all'arma precedente
     */
    armaPrecedente() {
        let nuovoSlot = this.indiceArmaCorrente;

        for (let i = 1; i <= this.maxSlot; i++) {
            const slot = (this.indiceArmaCorrente - i + this.maxSlot) % this.maxSlot;
            if (this.slotArmi[slot]) {
                nuovoSlot = slot;
                break;
            }
        }

        this.selezionaSlot(nuovoSlot);
    }

    /**
     * Spara con l'arma corrente
     */
    spara(direzione) {
        if (!this.armaCorrente) return false;

        const sparato = this.armaCorrente.spara(direzione);

        if (sparato) {
            this.statistiche.colpiSparati++;
        }

        return sparato;
    }

    /**
     * Update di tutte le armi
     */
    update(deltaTime) {
        // Aggiorna tutte le armi sbloccate (per cooldown, proiettili, etc.)
        for (const [tipo, arma] of this.armiSbloccate) {
            arma.update(deltaTime);
        }
    }

    /**
     * Potenzia un'arma
     */
    potenziaArma(tipo) {
        const arma = this.armiSbloccate.get(tipo);
        if (!arma) {
            console.warn(`Arma non sbloccata: ${tipo}`);
            return false;
        }

        return arma.potenzia();
    }

    /**
     * Gestisce quando un colpo va a segno
     */
    gestisciColpo(arma, proiettile, nemico) {
        this.statistiche.colpiAndati++;
        this.statistiche.dannoTotale += proiettile.danno;
    }

    /**
     * Gestisce quando un nemico viene ucciso
     */
    gestisciUccisione(arma, nemico) {
        this.statistiche.nemiciUccisi++;
    }

    /**
     * Ottieni arma corrente
     */
    ottieniArmaCorrente() {
        return this.armaCorrente;
    }

    /**
     * Ottieni lista armi sbloccate
     */
    ottieniArmiSbloccate() {
        return Array.from(this.armiSbloccate.values());
    }

    /**
     * Ottieni armi in slot
     */
    ottieniSlot() {
        return this.slotArmi.map((arma, i) => ({
            slot: i,
            arma: arma,
            selezionato: i === this.indiceArmaCorrente
        }));
    }

    /**
     * Ottieni statistiche
     */
    ottieniStatistiche() {
        return {
            ...this.statistiche,
            precisione: this.statistiche.colpiSparati > 0
                ? (this.statistiche.colpiAndati / this.statistiche.colpiSparati * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    /**
     * Ottieni costo potenziamento
     */
    ottieniCostoPotenziamento(tipo) {
        const arma = this.armiSbloccate.get(tipo);
        if (!arma || arma.livello >= arma.livelloMax) return Infinity;

        return arma.costoUpgrade[arma.livello - 1] || 0;
    }

    /**
     * Pulisci risorse
     */
    distruggi() {
        for (const [tipo, arma] of this.armiSbloccate) {
            arma.distruggi();
        }
        this.armiSbloccate.clear();
        this.slotArmi = [null, null, null];
        this.armaCorrente = null;
    }
}
