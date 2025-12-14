/**
 * BUBBLE ATTACK - Gestore Filebase
 * 
 * Client per interagire con il bucket Filebase (S3-compatibile).
 * Gestisce upload/download di livelli e salvataggi.
 */

import { FILEBASE_CONFIG, isConfigurato, getFileUrl } from './ConfigFilebase.js';

export class GestoreFilebase {
    constructor() {
        this.config = FILEBASE_CONFIG;
        this.inizializzato = false;

        // Cache locale per ridurre richieste
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000;  // 5 minuti
    }

    /**
     * Inizializza il client (verifica configurazione)
     */
    async inizializza() {
        if (!isConfigurato()) {
            console.warn('⚠️ Filebase non configurato. Usa modalità offline.');
            this.inizializzato = false;
            return false;
        }

        // Test connessione
        try {
            await this.testConnessione();
            this.inizializzato = true;
            console.log('☁️ Filebase connesso con successo');
            return true;
        } catch (errore) {
            console.error('❌ Errore connessione Filebase:', errore);
            this.inizializzato = false;
            return false;
        }
    }

    /**
     * Test della connessione al bucket
     */
    async testConnessione() {
        const url = `${this.config.endpoint}/${this.config.bucket}`;

        const risposta = await fetch(url, {
            method: 'HEAD',
            headers: this.getAuthHeaders('HEAD', '')
        });

        if (!risposta.ok && risposta.status !== 403) {
            throw new Error(`Bucket non accessibile: ${risposta.status}`);
        }

        return true;
    }

    /**
     * Genera headers di autenticazione AWS Signature v4 (semplificato)
     * Nota: Per produzione usare aws-sdk o libreria dedicata
     */
    getAuthHeaders(method, path, contentType = null) {
        // Per richieste pubbliche in lettura, non servono auth headers
        // Per upload useremo URL pre-firmati o un backend
        const headers = {};

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
    }

    /**
     * Scarica un file dal bucket
     */
    async scaricaFile(percorso) {
        // Controlla cache
        const cacheKey = percorso;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const url = getFileUrl(percorso);

        try {
            const risposta = await fetch(url);

            if (!risposta.ok) {
                throw new Error(`Errore download: ${risposta.status}`);
            }

            const dati = await risposta.text();

            // Salva in cache
            this.cache.set(cacheKey, {
                data: dati,
                timestamp: Date.now()
            });

            return dati;

        } catch (errore) {
            console.error(`Errore scaricamento ${percorso}:`, errore);
            throw errore;
        }
    }

    /**
     * Scarica e parse un file JSON
     */
    async scaricaJSON(percorso) {
        const contenuto = await this.scaricaFile(percorso);
        return JSON.parse(contenuto);
    }

    /**
     * Scarica un livello specifico
     */
    async scaricaLivello(numeroLivello, bioma) {
        const percorso = `${this.config.paths.livelli}${bioma}/livello_${numeroLivello}.json`;

        try {
            return await this.scaricaJSON(percorso);
        } catch (errore) {
            console.warn(`Livello ${numeroLivello} non trovato su Filebase`);
            return null;
        }
    }

    /**
     * Ottieni lista livelli disponibili per un bioma
     */
    async ottieniListaLivelli(bioma) {
        // Filebase/S3 non supporta listing diretto senza auth
        // Usiamo un file indice
        const percorso = `${this.config.paths.livelli}${bioma}/indice.json`;

        try {
            return await this.scaricaJSON(percorso);
        } catch {
            return { livelli: [] };
        }
    }

    /**
     * Carica un salvataggio utente (richiede auth)
     */
    async caricaSalvataggio(idUtente) {
        if (!this.inizializzato) {
            console.warn('Filebase non inizializzato');
            return null;
        }

        const percorso = `${this.config.paths.salvataggi}${idUtente}.json`;

        try {
            return await this.scaricaJSON(percorso);
        } catch {
            return null;  // Nessun salvataggio trovato
        }
    }

    /**
     * Salva i progressi utente (richiede backend o URL pre-firmato)
     */
    async salvaSalvataggio(idUtente, dati) {
        // NOTA: Upload diretto richiede AWS Signature v4
        // In produzione, usare un backend o URL pre-firmati

        console.warn('Upload diretto non implementato. Usa backend.');

        // Per ora salva in localStorage come fallback
        const chiave = `salvataggio_${idUtente}`;
        localStorage.setItem(chiave, JSON.stringify(dati));

        return true;
    }

    /**
     * Pulisci cache locale
     */
    pulisciCache() {
        this.cache.clear();
    }

    /**
     * Pulisci elementi scaduti dalla cache
     */
    pulisciCacheScaduta() {
        const ora = Date.now();
        for (const [chiave, valore] of this.cache) {
            if (ora - valore.timestamp > this.cacheTTL) {
                this.cache.delete(chiave);
            }
        }
    }

    /**
     * Ottieni statistiche cache
     */
    ottieniStatisticheCache() {
        return {
            elementi: this.cache.size,
            ttl: this.cacheTTL / 1000 + 's'
        };
    }

    /**
     * Verifica se il servizio è disponibile
     */
    isDisponibile() {
        return this.inizializzato;
    }

    /**
     * Ottieni URL diretto per un asset (per img src, etc.)
     */
    ottieniUrlAsset(nomeAsset) {
        return getFileUrl(`${this.config.paths.assets}${nomeAsset}`);
    }
}

// Istanza singleton
let istanza = null;

export function getGestoreFilebase() {
    if (!istanza) {
        istanza = new GestoreFilebase();
    }
    return istanza;
}
