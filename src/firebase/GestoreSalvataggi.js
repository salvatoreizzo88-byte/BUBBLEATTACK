/**
 * BUBBLE ATTACK - Gestore Salvataggi Firebase
 * 
 * Gestisce i salvataggi utente su Firestore.
 * Struttura: utenti/{userId}/profilo, progressi, impostazioni
 */

import { ottieniFirestore, ottieniAuth } from './ConfigFirebase.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    signInAnonymously,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export class GestoreSalvataggi {
    constructor() {
        this.db = null;
        this.auth = null;
        this.utenteCorrente = null;
        this.profiloLocale = null;

        // Schema profilo utente (IT)
        this.profiloDefault = {
            nome_giocatore: 'Drago Senza Nome',
            statistiche: {
                oro_corrente: 0,
                gemme_correnti: 0,
                livello_massimo: 1,
                nemici_sconfitti: 0,
                bolle_sparate: 0,
                tempo_gioco_totale: 0
            },
            progressione: {
                bioma_corrente: 1,
                livelli_completati: [],
                boss_sconfitti: [],
                armi_sbloccate: ['bolla_base'],
                equipaggiamento: {}
            },
            salvadanaio: {
                contenuto_gemme: 0,
                capienza_massima: 3000,
                pieno: false
            },
            impostazioni: {
                lingua: 'it',
                volume_musica: 0.8,
                volume_effetti: 0.8,
                vibrazioni: true,
                tutorial_completato: false
            },
            data_creazione: null,
            ultimo_accesso: null
        };
    }

    /**
     * Inizializza il gestore e autentica l'utente
     */
    async inizializza() {
        try {
            this.db = ottieniFirestore();
            this.auth = ottieniAuth();

            // Ascolta cambi di autenticazione
            return new Promise((resolve) => {
                onAuthStateChanged(this.auth, async (utente) => {
                    if (utente) {
                        this.utenteCorrente = utente;
                        console.log(`👤 Utente autenticato: ${utente.uid}`);
                        await this.caricaProfilo();
                        resolve(true);
                    } else {
                        // Accesso anonimo automatico
                        await this.accessoAnonimo();
                        resolve(true);
                    }
                });
            });

        } catch (errore) {
            console.error('❌ Errore inizializzazione salvataggi:', errore);
            return false;
        }
    }

    /**
     * Accesso anonimo (per nuovi utenti)
     */
    async accessoAnonimo() {
        try {
            const credenziali = await signInAnonymously(this.auth);
            this.utenteCorrente = credenziali.user;
            console.log(`🎭 Accesso anonimo: ${this.utenteCorrente.uid}`);

            // Crea profilo per nuovo utente
            await this.creaProfilo();

            return this.utenteCorrente;

        } catch (errore) {
            console.error('❌ Errore accesso anonimo:', errore);
            throw errore;
        }
    }

    /**
     * Crea profilo per nuovo utente
     */
    async creaProfilo() {
        if (!this.utenteCorrente) return;

        const docRef = doc(this.db, 'utenti', this.utenteCorrente.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Nuovo utente - crea profilo
            const nuovoProfilo = {
                ...this.profiloDefault,
                data_creazione: new Date().toISOString(),
                ultimo_accesso: new Date().toISOString()
            };

            await setDoc(docRef, nuovoProfilo);
            this.profiloLocale = nuovoProfilo;

            console.log('📝 Nuovo profilo creato');
        }
    }

    /**
     * Carica profilo utente da Firestore
     */
    async caricaProfilo() {
        if (!this.utenteCorrente) return null;

        try {
            const docRef = doc(this.db, 'utenti', this.utenteCorrente.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.profiloLocale = docSnap.data();

                // Aggiorna ultimo accesso
                await updateDoc(docRef, {
                    ultimo_accesso: new Date().toISOString()
                });

                console.log('📖 Profilo caricato');
                return this.profiloLocale;
            } else {
                // Profilo non esiste, crealo
                await this.creaProfilo();
                return this.profiloLocale;
            }

        } catch (errore) {
            console.error('❌ Errore caricamento profilo:', errore);
            return null;
        }
    }

    /**
     * Salva profilo su Firestore
     */
    async salvaProfilo() {
        if (!this.utenteCorrente || !this.profiloLocale) return false;

        try {
            const docRef = doc(this.db, 'utenti', this.utenteCorrente.uid);
            await setDoc(docRef, this.profiloLocale);

            console.log('💾 Profilo salvato');
            return true;

        } catch (errore) {
            console.error('❌ Errore salvataggio profilo:', errore);
            return false;
        }
    }

    /**
     * Aggiorna statistiche specifiche
     */
    async aggiornaStatistiche(modifiche) {
        if (!this.profiloLocale) return;

        Object.assign(this.profiloLocale.statistiche, modifiche);
        await this.salvaProfilo();
    }

    /**
     * Aggiungi oro
     */
    async aggiungiOro(quantita) {
        if (!this.profiloLocale) return;

        this.profiloLocale.statistiche.oro_corrente += quantita;
        await this.salvaProfilo();

        return this.profiloLocale.statistiche.oro_corrente;
    }

    /**
     * Aggiungi gemme
     */
    async aggiungiGemme(quantita) {
        if (!this.profiloLocale) return;

        this.profiloLocale.statistiche.gemme_correnti += quantita;
        await this.salvaProfilo();

        return this.profiloLocale.statistiche.gemme_correnti;
    }

    /**
     * Completa un livello
     */
    async completaLivello(numeroLivello, stelle = 3, punteggio = 0) {
        if (!this.profiloLocale) return;

        // Aggiungi ai livelli completati
        if (!this.profiloLocale.progressione.livelli_completati.includes(numeroLivello)) {
            this.profiloLocale.progressione.livelli_completati.push(numeroLivello);
        }

        // Aggiorna livello massimo
        if (numeroLivello > this.profiloLocale.statistiche.livello_massimo) {
            this.profiloLocale.statistiche.livello_massimo = numeroLivello;
        }

        // Aggiorna bioma corrente
        this.profiloLocale.progressione.bioma_corrente = Math.floor(numeroLivello / 100) + 1;

        await this.salvaProfilo();
    }

    /**
     * Sconfiggi un boss
     */
    async sconfittoBoss(idBoss) {
        if (!this.profiloLocale) return;

        if (!this.profiloLocale.progressione.boss_sconfitti.includes(idBoss)) {
            this.profiloLocale.progressione.boss_sconfitti.push(idBoss);
        }

        await this.salvaProfilo();
    }

    /**
     * Sblocca un'arma
     */
    async sbloccaArma(idArma) {
        if (!this.profiloLocale) return;

        if (!this.profiloLocale.progressione.armi_sbloccate.includes(idArma)) {
            this.profiloLocale.progressione.armi_sbloccate.push(idArma);
        }

        await this.salvaProfilo();
    }

    /**
     * Aggiungi gemme al salvadanaio
     */
    async aggiungiAlSalvadanaio(quantita) {
        if (!this.profiloLocale) return;

        const salvadanaio = this.profiloLocale.salvadanaio;
        salvadanaio.contenuto_gemme = Math.min(
            salvadanaio.contenuto_gemme + quantita,
            salvadanaio.capienza_massima
        );

        salvadanaio.pieno = salvadanaio.contenuto_gemme >= salvadanaio.capienza_massima;

        await this.salvaProfilo();

        return salvadanaio;
    }

    /**
     * Rompi il salvadanaio (richiede acquisto)
     */
    async rompiSalvadanaio() {
        if (!this.profiloLocale) return 0;

        const gemmeOttenute = this.profiloLocale.salvadanaio.contenuto_gemme;

        this.profiloLocale.statistiche.gemme_correnti += gemmeOttenute;
        this.profiloLocale.salvadanaio.contenuto_gemme = 0;
        this.profiloLocale.salvadanaio.pieno = false;

        await this.salvaProfilo();

        return gemmeOttenute;
    }

    /**
     * Aggiorna impostazioni
     */
    async aggiornaImpostazioni(nuoveImpostazioni) {
        if (!this.profiloLocale) return;

        Object.assign(this.profiloLocale.impostazioni, nuoveImpostazioni);
        await this.salvaProfilo();
    }

    /**
     * Ottieni classifica globale
     */
    async ottieniClassifica(limite = 10) {
        try {
            const classificaRef = collection(this.db, 'utenti');
            const q = query(
                classificaRef,
                orderBy('statistiche.livello_massimo', 'desc'),
                limit(limite)
            );

            const querySnapshot = await getDocs(q);
            const classifica = [];

            querySnapshot.forEach((doc) => {
                const dati = doc.data();
                classifica.push({
                    uid: doc.id,
                    nome: dati.nome_giocatore,
                    livello: dati.statistiche.livello_massimo,
                    nemici: dati.statistiche.nemici_sconfitti
                });
            });

            return classifica;

        } catch (errore) {
            console.error('❌ Errore caricamento classifica:', errore);
            return [];
        }
    }

    // ==================== GETTER ====================

    ottieniProfilo() {
        return this.profiloLocale;
    }

    ottieniOro() {
        return this.profiloLocale?.statistiche.oro_corrente || 0;
    }

    ottieniGemme() {
        return this.profiloLocale?.statistiche.gemme_correnti || 0;
    }

    ottieniLivelloMassimo() {
        return this.profiloLocale?.statistiche.livello_massimo || 1;
    }

    ottieniBiomaCorrente() {
        return this.profiloLocale?.progressione.bioma_corrente || 1;
    }

    ottieniArmiSbloccate() {
        return this.profiloLocale?.progressione.armi_sbloccate || ['bolla_base'];
    }

    ottieniUserId() {
        return this.utenteCorrente?.uid || null;
    }
}

// Singleton
let istanza = null;

export function getGestoreSalvataggi() {
    if (!istanza) {
        istanza = new GestoreSalvataggi();
    }
    return istanza;
}
