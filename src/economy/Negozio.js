/**
 * BUBBLE ATTACK - Negozio
 * 
 * Sistema negozio in-game con categorie, oggetti e acquisti.
 * Tutto in italiano.
 */

export class Negozio {
    constructor(gestoreEconomia, gestoreArsenale = null) {
        this.gestoreEconomia = gestoreEconomia;
        this.gestoreArsenale = gestoreArsenale;

        // Stato negozio
        this.aperto = false;
        this.categoriaCorrente = 'armi';

        // Catalogo completo
        this.catalogo = {
            armi: this.generaCatalogoArmi(),
            potenziamenti: this.generaCatalogoPotenziamenti(),
            accessori: this.generaCatalogoAccessori(),
            pacchetti: this.generaCatalogoPacchetti()
        };

        // Callbacks
        this.onAcquisto = null;
        this.onApri = null;
        this.onChiudi = null;
    }

    generaCatalogoArmi() {
        return [
            {
                id: 'OndaMareale',
                nome: 'Onda Mareale',
                descrizione: 'Onde d\'acqua che spingono via i nemici',
                icona: '🌊',
                tipo: 'arma',
                prezzo: 1000,
                valuta: 'oro',
                livelloRichiesto: 2
            },
            {
                id: 'TorrenteNapalm',
                nome: 'Torrente Napalm',
                descrizione: 'Fiamme devastanti con effetto bruciatura',
                icona: '🔥',
                tipo: 'arma',
                prezzo: 1200,
                valuta: 'oro',
                livelloRichiesto: 3
            },
            {
                id: 'AncoraGravitazionale',
                nome: 'Ancora Gravitazionale',
                descrizione: 'Ancora pesante che attrae e fa cadere',
                icona: '⚓',
                tipo: 'arma',
                prezzo: 1500,
                valuta: 'oro',
                livelloRichiesto: 4
            },
            {
                id: 'TrivellaPerforante',
                nome: 'Trivella Perforante',
                descrizione: 'Trapano che perfora scudi e corazzature',
                icona: '🔧',
                tipo: 'arma',
                prezzo: 2000,
                valuta: 'oro',
                livelloRichiesto: 5
            },
            {
                id: 'DardoElio',
                nome: 'Dardo Elio',
                descrizione: 'Palloncini colorati che sollevano i nemici',
                icona: '🎈',
                tipo: 'arma',
                prezzo: 800,
                valuta: 'oro',
                livelloRichiesto: 2
            },
            {
                id: 'CometaRimbalzante',
                nome: 'Cometa Rimbalzante',
                descrizione: 'Proiettile che rimbalza tra i nemici',
                icona: '☄️',
                tipo: 'arma',
                prezzo: 1800,
                valuta: 'oro',
                livelloRichiesto: 4
            },
            {
                id: 'CongelaTempo',
                nome: 'Congela Tempo',
                descrizione: 'Ferma il tempo per i nemici nell\'area',
                icona: '⏱️',
                tipo: 'arma',
                prezzo: 2500,
                valuta: 'oro',
                livelloRichiesto: 6
            },
            {
                id: 'VuotoSingolarita',
                nome: 'Vuoto Singolarità',
                descrizione: 'Mini buco nero che attrae e comprime',
                icona: '🌀',
                tipo: 'arma',
                prezzo: 3000,
                valuta: 'oro',
                livelloRichiesto: 8
            }
        ];
    }

    generaCatalogoPotenziamenti() {
        return [
            {
                id: 'scudo_temporaneo',
                nome: 'Scudo Temporaneo',
                descrizione: 'Protezione per 30 secondi',
                icona: '🛡️',
                tipo: 'potenziamento',
                prezzo: 300,
                valuta: 'oro',
                durata: 30,
                effetto: { tipo: 'scudo', valore: 1 }
            },
            {
                id: 'velocita_x2',
                nome: 'Velocità x2',
                descrizione: 'Raddoppia la velocità per 60 secondi',
                icona: '⚡',
                tipo: 'potenziamento',
                prezzo: 400,
                valuta: 'oro',
                durata: 60,
                effetto: { tipo: 'velocita', valore: 2 }
            },
            {
                id: 'danno_x2',
                nome: 'Danno x2',
                descrizione: 'Raddoppia il danno per 60 secondi',
                icona: '💪',
                tipo: 'potenziamento',
                prezzo: 500,
                valuta: 'oro',
                durata: 60,
                effetto: { tipo: 'danno', valore: 2 }
            },
            {
                id: 'oro_x2',
                nome: 'Oro x2',
                descrizione: 'Raddoppia l\'oro raccolto per tutto il livello',
                icona: '💰',
                tipo: 'potenziamento',
                prezzo: 600,
                valuta: 'oro',
                durata: -1,  // Tutto il livello
                effetto: { tipo: 'moltiplicatoreOro', valore: 2 }
            },
            {
                id: 'vita_extra',
                nome: 'Vita Extra',
                descrizione: '+1 vita aggiuntiva',
                icona: '❤️',
                tipo: 'potenziamento',
                prezzo: 500,
                valuta: 'oro',
                durata: -1,
                effetto: { tipo: 'vita', valore: 1 }
            },
            {
                id: 'magnete_loot',
                nome: 'Magnete Loot',
                descrizione: 'Attrae automaticamente oro e oggetti',
                icona: '🧲',
                tipo: 'potenziamento',
                prezzo: 350,
                valuta: 'oro',
                durata: 120,
                effetto: { tipo: 'magnete', valore: 5 }
            }
        ];
    }

    generaCatalogoAccessori() {
        return [
            {
                id: 'occhiali_spettrali',
                nome: 'Occhiali Spettrali',
                descrizione: 'Rivela nemici nascosti e Forzieri-Mimo',
                icona: '👓',
                tipo: 'accessorio',
                prezzo: 2000,
                valuta: 'oro',
                passivo: true,
                effetto: { tipo: 'rivelaNascosti', valore: true }
            },
            {
                id: 'stivali_antigravita',
                nome: 'Stivali Antigravità',
                descrizione: 'Salto più alto e caduta rallentata',
                icona: '👢',
                tipo: 'accessorio',
                prezzo: 2500,
                valuta: 'oro',
                passivo: true,
                effetto: { tipo: 'saltoMoltiplicatore', valore: 1.5 }
            },
            {
                id: 'amuleto_fortuna',
                nome: 'Amuleto della Fortuna',
                descrizione: '+20% drop rari da nemici',
                icona: '🍀',
                tipo: 'accessorio',
                prezzo: 3000,
                valuta: 'oro',
                passivo: true,
                effetto: { tipo: 'dropRari', valore: 0.2 }
            }
        ];
    }

    generaCatalogoPacchetti() {
        return [
            {
                id: 'pacchetto_starter',
                nome: 'Pacchetto Starter',
                descrizione: '5000 Oro + 3 Potenziamenti casuali',
                icona: '📦',
                tipo: 'pacchetto',
                prezzo: 100,
                valuta: 'gemme',
                contenuto: {
                    oro: 5000,
                    potenziamentiCasuali: 3
                }
            },
            {
                id: 'pacchetto_guerriero',
                nome: 'Pacchetto Guerriero',
                descrizione: '2 Armi casuali sbloccate',
                icona: '⚔️',
                tipo: 'pacchetto',
                prezzo: 250,
                valuta: 'gemme',
                contenuto: {
                    armiCasuali: 2
                }
            },
            {
                id: 'pacchetto_leggenda',
                nome: 'Pacchetto Leggenda',
                descrizione: 'Tutte le armi + 10000 Oro',
                icona: '👑',
                tipo: 'pacchetto',
                prezzo: 500,
                valuta: 'gemme',
                contenuto: {
                    tutteLeArmi: true,
                    oro: 10000
                }
            }
        ];
    }

    // ==================== INTERFACCIA ====================

    apri(categoria = 'armi') {
        this.aperto = true;
        this.categoriaCorrente = categoria;

        if (this.onApri) {
            this.onApri(categoria);
        }

        console.log(`🛒 Negozio aperto - ${categoria}`);
    }

    chiudi() {
        this.aperto = false;

        if (this.onChiudi) {
            this.onChiudi();
        }

        console.log('🛒 Negozio chiuso');
    }

    cambiaCategoria(categoria) {
        if (this.catalogo[categoria]) {
            this.categoriaCorrente = categoria;
        }
    }

    // ==================== ACQUISTI ====================

    /**
     * Acquista un oggetto
     */
    acquista(idOggetto) {
        const oggetto = this.trovaOggetto(idOggetto);

        if (!oggetto) {
            console.warn(`Oggetto non trovato: ${idOggetto}`);
            return { successo: false, errore: 'Oggetto non trovato' };
        }

        // Controlla livello richiesto
        if (oggetto.livelloRichiesto) {
            const livelloGiocatore = this.gestoreEconomia.progressione.livelloGiocatore;
            if (livelloGiocatore < oggetto.livelloRichiesto) {
                return {
                    successo: false,
                    errore: `Richiesto livello ${oggetto.livelloRichiesto}`
                };
            }
        }

        // Controlla se già posseduto (per armi)
        if (oggetto.tipo === 'arma') {
            if (this.gestoreEconomia.livelliArmi[idOggetto] > 0) {
                return { successo: false, errore: 'Già sbloccato!' };
            }
        }

        // Controlla valuta
        if (!this.gestoreEconomia.puoPermettersi(oggetto.valuta, oggetto.prezzo)) {
            return {
                successo: false,
                errore: `${oggetto.valuta.charAt(0).toUpperCase() + oggetto.valuta.slice(1)} insufficiente!`
            };
        }

        // Effettua acquisto
        if (oggetto.valuta === 'oro') {
            this.gestoreEconomia.rimuoviOro(oggetto.prezzo);
        } else if (oggetto.valuta === 'gemme') {
            this.gestoreEconomia.valute.gemme -= oggetto.prezzo;
        }

        // Applica acquisto
        this.applicaAcquisto(oggetto);

        console.log(`💳 Acquistato: ${oggetto.nome}`);

        if (this.onAcquisto) {
            this.onAcquisto(oggetto);
        }

        return { successo: true, oggetto: oggetto };
    }

    applicaAcquisto(oggetto) {
        switch (oggetto.tipo) {
            case 'arma':
                this.gestoreEconomia.sbloccaArma(oggetto.id);
                if (this.gestoreArsenale) {
                    this.gestoreArsenale.sbloccaArma(oggetto.id);
                }
                break;

            case 'potenziamento':
                // Potenziamenti vanno nell'inventario
                // o applicati immediatamente
                break;

            case 'accessorio':
                if (!this.gestoreEconomia.sblocchi.accessori.includes(oggetto.id)) {
                    this.gestoreEconomia.sblocchi.accessori.push(oggetto.id);
                }
                break;

            case 'pacchetto':
                this.apriPacchetto(oggetto);
                break;
        }

        this.gestoreEconomia.salvaAutomatico();
    }

    apriPacchetto(pacchetto) {
        const contenuto = pacchetto.contenuto;
        const risultati = [];

        if (contenuto.oro) {
            this.gestoreEconomia.aggiungiOro(contenuto.oro);
            risultati.push(`+${contenuto.oro} Oro`);
        }

        if (contenuto.tutteLeArmi) {
            Object.keys(this.gestoreEconomia.livelliArmi).forEach(arma => {
                if (this.gestoreEconomia.livelliArmi[arma] === 0) {
                    this.gestoreEconomia.livelliArmi[arma] = 1;
                    risultati.push(`+ ${arma}`);
                }
            });
        }

        if (contenuto.armiCasuali) {
            const armiNonSbloccate = Object.keys(this.gestoreEconomia.livelliArmi)
                .filter(a => this.gestoreEconomia.livelliArmi[a] === 0);

            for (let i = 0; i < contenuto.armiCasuali && armiNonSbloccate.length > 0; i++) {
                const indice = Math.floor(Math.random() * armiNonSbloccate.length);
                const arma = armiNonSbloccate.splice(indice, 1)[0];
                this.gestoreEconomia.livelliArmi[arma] = 1;
                risultati.push(`+ ${arma}`);
            }
        }

        console.log(`📦 Pacchetto aperto:`, risultati);
        return risultati;
    }

    // ==================== UTILITY ====================

    trovaOggetto(id) {
        for (const categoria of Object.values(this.catalogo)) {
            const oggetto = categoria.find(o => o.id === id);
            if (oggetto) return oggetto;
        }
        return null;
    }

    /**
     * Ottieni oggetti della categoria corrente con stato
     */
    ottieniOggettiCategoria() {
        const oggetti = this.catalogo[this.categoriaCorrente] || [];

        return oggetti.map(ogg => ({
            ...ogg,
            posseduto: this.oggettoPosseduto(ogg),
            acquistabile: this.oggettoAcquistabile(ogg),
            motivoBlocco: this.ottieniMotivoBlocco(ogg)
        }));
    }

    oggettoPosseduto(oggetto) {
        if (oggetto.tipo === 'arma') {
            return this.gestoreEconomia.livelliArmi[oggetto.id] > 0;
        }
        if (oggetto.tipo === 'accessorio') {
            return this.gestoreEconomia.sblocchi.accessori.includes(oggetto.id);
        }
        return false;
    }

    oggettoAcquistabile(oggetto) {
        if (this.oggettoPosseduto(oggetto)) return false;

        if (oggetto.livelloRichiesto) {
            if (this.gestoreEconomia.progressione.livelloGiocatore < oggetto.livelloRichiesto) {
                return false;
            }
        }

        return this.gestoreEconomia.puoPermettersi(oggetto.valuta, oggetto.prezzo);
    }

    ottieniMotivoBlocco(oggetto) {
        if (this.oggettoPosseduto(oggetto)) return 'Già posseduto';

        if (oggetto.livelloRichiesto) {
            const liv = this.gestoreEconomia.progressione.livelloGiocatore;
            if (liv < oggetto.livelloRichiesto) {
                return `Richiede Lv.${oggetto.livelloRichiesto}`;
            }
        }

        if (!this.gestoreEconomia.puoPermettersi(oggetto.valuta, oggetto.prezzo)) {
            return `${oggetto.valuta} insufficiente`;
        }

        return null;
    }
}
