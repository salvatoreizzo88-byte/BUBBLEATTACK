/**
 * BUBBLE ATTACK - Gestore Economia
 * 
 * Gestisce tutte le valute, acquisti e progressione economica.
 * Sincronizza con Firebase per persistenza.
 */

export class GestoreEconomia {
    constructor(gestoreSalvataggi = null) {
        this.gestoreSalvataggi = gestoreSalvataggi;

        // Valute
        this.valute = {
            oro: 0,
            gemme: 0,
            stelleNova: 0  // Valuta premium rara
        };

        // Moltiplicatori
        this.moltiplicatori = {
            oro: 1.0,
            esperienza: 1.0,
            drop: 1.0
        };

        // Progressione giocatore
        this.progressione = {
            livelloGiocatore: 1,
            esperienza: 0,
            esperienzaProssimoLivello: 100,
            livelloMaxRaggiunto: 1,
            biomaMaxSbloccato: 1
        };

        // Statistiche di gioco
        this.statistiche = {
            nemiciSconfitti: 0,
            bolleSpara: 0,
            mortiTotali: 0,
            tempoGiocato: 0,  // Secondi
            oroTotaleRaccolto: 0,
            livelliCompletati: 0
        };

        // Sblocchi
        this.sblocchi = {
            armi: ['BollaFulmine'],  // Armi sbloccate
            accessori: [],
            skin: ['drago_base'],
            biomi: ['caverna_primordiale']
        };

        // Livelli armi
        this.livelliArmi = {
            BollaFulmine: 1,
            OndaMareale: 0,  // 0 = non sbloccata
            TrivellaPerforante: 0,
            TorrenteNapalm: 0,
            AncoraGravitazionale: 0,
            CongelaTempo: 0,
            VuotoSingolarita: 0,
            DardoElio: 0,
            CometaRimbalzante: 0
        };

        // Prezzi base
        this.prezzi = {
            sbloccoArmi: {
                OndaMareale: 1000,
                TrivellaPerforante: 2000,
                TorrenteNapalm: 1200,
                AncoraGravitazionale: 1500,
                CongelaTempo: 2500,
                VuotoSingolarita: 3000,
                DardoElio: 800,
                CometaRimbalzante: 1800
            },
            upgradeArmi: {
                // Costo per livello [Lv2, Lv3]
                base: [500, 1500]
            },
            vite: {
                extra: 500,
                pacchetto3: 1200
            },
            potenziamenti: {
                scudoTemporaneo: 300,
                velocitaX2: 400,
                dannoX2: 500
            }
        };

        // Callbacks
        this.onValutaAggiornata = null;
        this.onLivelloUp = null;
        this.onSblocco = null;
    }

    // ==================== VALUTE ====================

    /**
     * Aggiungi oro
     */
    aggiungiOro(quantita) {
        const oroEffettivo = Math.floor(quantita * this.moltiplicatori.oro);
        this.valute.oro += oroEffettivo;
        this.statistiche.oroTotaleRaccolto += oroEffettivo;

        this.notificaAggiornamento('oro', oroEffettivo);
        this.salvaAutomatico();

        return oroEffettivo;
    }

    /**
     * Rimuovi oro (per acquisti)
     */
    rimuoviOro(quantita) {
        if (this.valute.oro < quantita) {
            console.warn('Oro insufficiente!');
            return false;
        }

        this.valute.oro -= quantita;
        this.notificaAggiornamento('oro', -quantita);
        this.salvaAutomatico();

        return true;
    }

    /**
     * Aggiungi gemme
     */
    aggiungiGemme(quantita) {
        this.valute.gemme += quantita;
        this.notificaAggiornamento('gemme', quantita);
        this.salvaAutomatico();
    }

    /**
     * Controlla se può permettersi un acquisto
     */
    puoPermettersi(valuta, costo) {
        return this.valute[valuta] >= costo;
    }

    // ==================== ESPERIENZA ====================

    /**
     * Aggiungi esperienza
     */
    aggiungiEsperienza(quantita) {
        const xpEffettiva = Math.floor(quantita * this.moltiplicatori.esperienza);
        this.progressione.esperienza += xpEffettiva;

        // Controlla level up
        while (this.progressione.esperienza >= this.progressione.esperienzaProssimoLivello) {
            this.levelUp();
        }

        this.salvaAutomatico();

        return xpEffettiva;
    }

    /**
     * Level up del giocatore
     */
    levelUp() {
        this.progressione.esperienza -= this.progressione.esperienzaProssimoLivello;
        this.progressione.livelloGiocatore++;

        // Formula XP progressiva
        this.progressione.esperienzaProssimoLivello = Math.floor(
            100 * Math.pow(1.5, this.progressione.livelloGiocatore - 1)
        );

        // Ricompense level up
        const ricompensa = this.progressione.livelloGiocatore * 50;
        this.aggiungiOro(ricompensa);

        console.log(`🎉 Level Up! Livello ${this.progressione.livelloGiocatore}! +${ricompensa} oro`);

        if (this.onLivelloUp) {
            this.onLivelloUp(this.progressione.livelloGiocatore);
        }
    }

    // ==================== ACQUISTI ====================

    /**
     * Sblocca un'arma
     */
    sbloccaArma(nomeArma) {
        if (this.livelliArmi[nomeArma] > 0) {
            console.log(`${nomeArma} già sbloccata!`);
            return false;
        }

        const prezzo = this.prezzi.sbloccoArmi[nomeArma];
        if (!prezzo) {
            console.warn(`Arma non trovata: ${nomeArma}`);
            return false;
        }

        if (!this.rimuoviOro(prezzo)) {
            console.log('Oro insufficiente!');
            return false;
        }

        this.livelliArmi[nomeArma] = 1;
        this.sblocchi.armi.push(nomeArma);

        console.log(`🔓 ${nomeArma} sbloccata!`);

        if (this.onSblocco) {
            this.onSblocco('arma', nomeArma);
        }

        this.salvaAutomatico();
        return true;
    }

    /**
     * Potenzia un'arma
     */
    potenziaArma(nomeArma) {
        const livelloCorrente = this.livelliArmi[nomeArma];

        if (livelloCorrente === 0) {
            console.log(`${nomeArma} non sbloccata!`);
            return false;
        }

        if (livelloCorrente >= 3) {
            console.log(`${nomeArma} già al livello massimo!`);
            return false;
        }

        const costo = this.prezzi.upgradeArmi.base[livelloCorrente - 1];

        if (!this.rimuoviOro(costo)) {
            console.log('Oro insufficiente!');
            return false;
        }

        this.livelliArmi[nomeArma]++;

        console.log(`⬆️ ${nomeArma} potenziata a Lv.${this.livelliArmi[nomeArma]}!`);

        this.salvaAutomatico();
        return true;
    }

    /**
     * Ottieni costo potenziamento arma
     */
    ottieniCostoUpgrade(nomeArma) {
        const livello = this.livelliArmi[nomeArma];
        if (livello === 0 || livello >= 3) return null;
        return this.prezzi.upgradeArmi.base[livello - 1];
    }

    // ==================== PROGRESSIONE LIVELLI ====================

    /**
     * Completa un livello
     */
    completaLivello(numeroLivello, stelle = 1, tempo = 0) {
        this.statistiche.livelliCompletati++;

        // Aggiorna max raggiunto
        if (numeroLivello > this.progressione.livelloMaxRaggiunto) {
            this.progressione.livelloMaxRaggiunto = numeroLivello;
        }

        // Calcola ricompense
        const oroBase = 100 + (numeroLivello * 20);
        const bonusStelle = stelle * 50;
        const bonusTempo = tempo > 0 ? Math.max(0, 300 - tempo) : 0;

        const oroTotale = oroBase + bonusStelle + bonusTempo;
        const xp = 50 + (numeroLivello * 10);

        this.aggiungiOro(oroTotale);
        this.aggiungiEsperienza(xp);

        console.log(`✅ Livello ${numeroLivello} completato! +${oroTotale} oro, +${xp} XP`);

        this.salvaAutomatico();

        return {
            oro: oroTotale,
            xp: xp,
            stelle: stelle
        };
    }

    /**
     * Controlla se un livello è sbloccato
     */
    livelloSbloccato(numeroLivello) {
        return numeroLivello <= this.progressione.livelloMaxRaggiunto + 1;
    }

    /**
     * Sblocca bioma
     */
    sbloccaBioma(nomeBioma) {
        if (!this.sblocchi.biomi.includes(nomeBioma)) {
            this.sblocchi.biomi.push(nomeBioma);

            if (this.onSblocco) {
                this.onSblocco('bioma', nomeBioma);
            }

            this.salvaAutomatico();
        }
    }

    // ==================== STATISTICHE ====================

    /**
     * Aggiorna statistiche
     */
    aggiornaStatistica(nome, valore = 1) {
        if (this.statistiche[nome] !== undefined) {
            this.statistiche[nome] += valore;
        }
    }

    /**
     * Ottieni tutte le statistiche formattate
     */
    ottieniStatisticheFormattate() {
        const ore = Math.floor(this.statistiche.tempoGiocato / 3600);
        const minuti = Math.floor((this.statistiche.tempoGiocato % 3600) / 60);

        return {
            'Nemici Sconfitti': this.statistiche.nemiciSconfitti.toLocaleString(),
            'Bolle Sparate': this.statistiche.bolleSpara.toLocaleString(),
            'Livelli Completati': this.statistiche.livelliCompletati.toLocaleString(),
            'Oro Raccolto': this.statistiche.oroTotaleRaccolto.toLocaleString(),
            'Tempo Giocato': `${ore}h ${minuti}m`,
            'Morti Totali': this.statistiche.mortiTotali.toLocaleString()
        };
    }

    // ==================== SALVATAGGIO ====================

    /**
     * Salva automatico su Firebase
     */
    async salvaAutomatico() {
        if (!this.gestoreSalvataggi) return;

        try {
            const dati = this.esportaDati();
            await this.gestoreSalvataggi.salvaProgressione(dati);
        } catch (e) {
            console.warn('Errore salvataggio automatico:', e);
        }
    }

    /**
     * Esporta tutti i dati per salvataggio
     */
    esportaDati() {
        return {
            valute: { ...this.valute },
            progressione: { ...this.progressione },
            statistiche: { ...this.statistiche },
            sblocchi: { ...this.sblocchi },
            livelliArmi: { ...this.livelliArmi },
            moltiplicatori: { ...this.moltiplicatori },
            ultimoSalvataggio: Date.now()
        };
    }

    /**
     * Importa dati da salvataggio
     */
    importaDati(dati) {
        if (!dati) return;

        if (dati.valute) this.valute = { ...this.valute, ...dati.valute };
        if (dati.progressione) this.progressione = { ...this.progressione, ...dati.progressione };
        if (dati.statistiche) this.statistiche = { ...this.statistiche, ...dati.statistiche };
        if (dati.sblocchi) this.sblocchi = { ...this.sblocchi, ...dati.sblocchi };
        if (dati.livelliArmi) this.livelliArmi = { ...this.livelliArmi, ...dati.livelliArmi };
        if (dati.moltiplicatori) this.moltiplicatori = { ...this.moltiplicatori, ...dati.moltiplicatori };

        console.log('📥 Dati economia caricati');
    }

    // ==================== UTILITY ====================

    notificaAggiornamento(valuta, variazione) {
        if (this.onValutaAggiornata) {
            this.onValutaAggiornata(valuta, this.valute[valuta], variazione);
        }
    }

    /**
     * Ottieni riepilogo portafoglio
     */
    ottieniPortafoglio() {
        return {
            oro: this.valute.oro,
            gemme: this.valute.gemme,
            stelleNova: this.valute.stelleNova,
            livello: this.progressione.livelloGiocatore,
            xp: this.progressione.esperienza,
            xpNext: this.progressione.esperienzaProssimoLivello
        };
    }
}
