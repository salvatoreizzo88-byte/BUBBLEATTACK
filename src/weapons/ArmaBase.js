/**
 * BUBBLE ATTACK - Classe Base Arma/Power-Up
 * 
 * Classe astratta per tutte le armi e power-up.
 * Ogni arma ha 3 livelli di potenziamento.
 */

// Tipi di armi
export const TipiArma = {
    BOLLA_FULMINE: 'BollaFulmine',
    TORRENTE_NAPALM: 'TorrenteNapalm',
    ONDA_MAREALE: 'OndaMareale',
    ANCORA_GRAVITAZIONALE: 'AncoraGravitazionale',
    CONGELA_TEMPO: 'CongelaTempo',
    VUOTO_SINGOLARITA: 'VuotoSingolarita',
    DARDO_ELIO: 'DardoElio',
    TRIVELLA_PERFORANTE: 'TrivellaPerforante',
    COMETA_RIMBALZANTE: 'CometaRimbalzante'
};

// Categorie armi
export const CategorieArma = {
    ELETTRICO: 'Elettrico',
    FUOCO: 'Fuoco',
    ACQUA: 'Acqua',
    GRAVITA: 'Gravità',
    TEMPO: 'Tempo',
    SPAZIO: 'Spazio',
    ARIA: 'Aria',
    MECCANICO: 'Meccanico',
    CINETICO: 'Cinetico'
};

export class ArmaBase {
    constructor(scene, giocatore, opzioni = {}) {
        this.scene = scene;
        this.giocatore = giocatore;
        this.opzioni = opzioni;

        // Identificazione
        this.id = opzioni.id || TipiArma.BOLLA_FULMINE;
        this.tipo = TipiArma.BOLLA_FULMINE;
        this.categoria = CategorieArma.ELETTRICO;
        this.nomeVisualizzato = 'Arma Base';
        this.descrizione = 'Descrizione arma';
        this.icona = '⚡';

        // Livello (1-3)
        this.livello = opzioni.livello || 1;
        this.livelloMax = 3;

        // Statistiche base (scalano con il livello)
        this.dannoBase = opzioni.dannoBase || 1;
        this.velocitaBase = opzioni.velocitaBase || 15;
        this.durataBase = opzioni.durataBase || 5;
        this.raggioBase = opzioni.raggioBase || 1;

        // Moltiplicatori per livello
        this.moltiplicatoriLivello = {
            danno: [1, 1.5, 2.5],
            velocita: [1, 1.2, 1.5],
            durata: [1, 1.3, 2],
            raggio: [1, 1.5, 2]
        };

        // Cooldown
        this.cooldownBase = opzioni.cooldownBase || 0.5;
        this.cooldownCorrente = 0;

        // Munizioni (se applicabile)
        this.usaMunizioni = opzioni.usaMunizioni || false;
        this.munizioniMax = opzioni.munizioniMax || 10;
        this.munizioniCorrenti = this.munizioniMax;

        // Costo sblocco/upgrade
        this.costoSblocco = opzioni.costoSblocco || 1000;
        this.costoUpgrade = opzioni.costoUpgrade || [500, 1500, 3000];

        // Stato
        this.sbloccata = opzioni.sbloccata || false;
        this.attiva = false;

        // Proiettili attivi
        this.proiettiliAttivi = [];
        this.maxProiettili = 20;

        // Effetti speciali per livello
        this.effettiLivello = {
            1: [],
            2: [],
            3: []
        };

        // Callbacks
        this.onSparo = opzioni.onSparo || null;
        this.onColpito = opzioni.onColpito || null;
        this.onUccisione = opzioni.onUccisione || null;
    }

    // ==================== GETTERS CON SCALING ====================

    get danno() {
        return this.dannoBase * this.moltiplicatoriLivello.danno[this.livello - 1];
    }

    get velocita() {
        return this.velocitaBase * this.moltiplicatoriLivello.velocita[this.livello - 1];
    }

    get durata() {
        return this.durataBase * this.moltiplicatoriLivello.durata[this.livello - 1];
    }

    get raggio() {
        return this.raggioBase * this.moltiplicatoriLivello.raggio[this.livello - 1];
    }

    get cooldown() {
        // Cooldown diminuisce con il livello
        return this.cooldownBase / (1 + (this.livello - 1) * 0.2);
    }

    // ==================== METODI PRINCIPALI ====================

    /**
     * Inizializza l'arma
     */
    async inizializza() {
        console.log(`🔧 ${this.nomeVisualizzato} inizializzata (Lv.${this.livello})`);
        return this;
    }

    /**
     * Attiva l'arma (equipaggiata)
     */
    attiva() {
        this.attiva = true;
        console.log(`✨ ${this.nomeVisualizzato} attivata!`);
    }

    /**
     * Disattiva l'arma
     */
    disattiva() {
        this.attiva = false;
    }

    /**
     * Spara/usa l'arma (override nelle sottoclassi)
     */
    spara(direzione) {
        if (this.cooldownCorrente > 0) return false;
        if (this.usaMunizioni && this.munizioniCorrenti <= 0) return false;

        // Consuma munizioni
        if (this.usaMunizioni) {
            this.munizioniCorrenti--;
        }

        // Reset cooldown
        this.cooldownCorrente = this.cooldown;

        // Callback
        if (this.onSparo) {
            this.onSparo(this, direzione);
        }

        return true;
    }

    /**
     * Crea un proiettile base
     */
    creaProiettile(posizione, direzione, opzioniProiettile = {}) {
        // Limita numero proiettili
        if (this.proiettiliAttivi.length >= this.maxProiettili) {
            const vecchio = this.proiettiliAttivi.shift();
            this.distruggiProiettile(vecchio);
        }

        // Crea mesh proiettile (sphere di default)
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `proiettile_${this.id}_${Date.now()}`,
            { diameter: this.raggio },
            this.scene
        );
        mesh.position = posizione.clone();

        // Materiale
        const materiale = this.creaMaterialeProiettile();
        mesh.material = materiale;

        // Fisica
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            {
                mass: 0.1,
                friction: 0,
                restitution: opzioniProiettile.rimbalzo || 0.5
            },
            this.scene
        );

        // Velocità iniziale
        aggregato.body.setLinearVelocity(direzione.scale(this.velocita));
        aggregato.body.setLinearDamping(opzioniProiettile.smorzamento || 0);

        // Se antigravità
        if (opzioniProiettile.antigravita) {
            aggregato.body.setGravityFactor(opzioniProiettile.antigravita);
        }

        const proiettile = {
            mesh: mesh,
            aggregato: aggregato,
            timer: this.durata,
            danno: this.danno,
            tipo: this.tipo,
            proprietario: this,
            opzioni: opzioniProiettile
        };

        // Metadata per collisioni
        mesh.metadata = {
            tipo: 'proiettile',
            arma: this.tipo,
            danno: this.danno,
            proiettile: proiettile
        };

        this.proiettiliAttivi.push(proiettile);

        return proiettile;
    }

    /**
     * Crea materiale per il proiettile (override per colori diversi)
     */
    creaMaterialeProiettile() {
        const materiale = new BABYLON.StandardMaterial(`mat_proj_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
        materiale.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.6);
        materiale.alpha = 0.8;
        return materiale;
    }

    /**
     * Update (chiamato ogni frame)
     */
    update(deltaTime) {
        // Cooldown
        if (this.cooldownCorrente > 0) {
            this.cooldownCorrente -= deltaTime;
        }

        // Aggiorna proiettili
        for (let i = this.proiettiliAttivi.length - 1; i >= 0; i--) {
            const p = this.proiettiliAttivi[i];
            p.timer -= deltaTime;

            // Logica specifica del proiettile
            this.aggiornaProiettile(p, deltaTime);

            // Rimuovi se scaduto o fuori mappa
            if (p.timer <= 0 || p.mesh.position.y < -50) {
                this.distruggiProiettile(p);
                this.proiettiliAttivi.splice(i, 1);
            }
        }
    }

    /**
     * Aggiorna logica proiettile (override per comportamenti speciali)
     */
    aggiornaProiettile(proiettile, deltaTime) {
        // Override nelle sottoclassi per homing, effetti, etc.
    }

    /**
     * Gestisce collisione proiettile con nemico
     */
    onCollisioneNemico(proiettile, nemico) {
        if (!nemico || !nemico.vivo) return;

        // Applica danno
        const catturato = nemico.colpitoDaBolla(proiettile);

        // Callback
        if (this.onColpito) {
            this.onColpito(this, proiettile, nemico);
        }

        if (catturato && this.onUccisione) {
            this.onUccisione(this, nemico);
        }

        // Alcuni proiettili si distruggono al contatto
        if (!proiettile.opzioni.penetrante) {
            proiettile.timer = 0;
        }
    }

    /**
     * Distruggi un proiettile
     */
    distruggiProiettile(proiettile) {
        if (proiettile.aggregato) {
            proiettile.aggregato.dispose();
        }
        if (proiettile.mesh) {
            proiettile.mesh.dispose();
        }
    }

    // ==================== UPGRADE ====================

    /**
     * Sblocca l'arma
     */
    sblocca() {
        this.sbloccata = true;
        console.log(`🔓 ${this.nomeVisualizzato} sbloccata!`);
    }

    /**
     * Potenzia l'arma al livello successivo
     */
    potenzia() {
        if (this.livello >= this.livelloMax) {
            console.log(`${this.nomeVisualizzato} è già al livello massimo!`);
            return false;
        }

        this.livello++;
        console.log(`⬆️ ${this.nomeVisualizzato} potenziata a Lv.${this.livello}!`);

        // Attiva effetti del nuovo livello
        this.attivaEffettiLivello();

        return true;
    }

    /**
     * Attiva effetti speciali del livello corrente
     */
    attivaEffettiLivello() {
        const effetti = this.effettiLivello[this.livello];
        // Override nelle sottoclassi
    }

    /**
     * Ricarica munizioni
     */
    ricarica(quantita = this.munizioniMax) {
        if (!this.usaMunizioni) return;

        this.munizioniCorrenti = Math.min(
            this.munizioniCorrenti + quantita,
            this.munizioniMax
        );
    }

    // ==================== INFO ====================

    /**
     * Ottieni statistiche per UI
     */
    ottieniStatistiche() {
        return {
            nome: this.nomeVisualizzato,
            livello: this.livello,
            danno: this.danno.toFixed(1),
            velocita: this.velocita.toFixed(1),
            durata: this.durata.toFixed(1) + 's',
            raggio: this.raggio.toFixed(1),
            cooldown: this.cooldown.toFixed(2) + 's',
            munizioni: this.usaMunizioni ? `${this.munizioniCorrenti}/${this.munizioniMax}` : '∞',
            sbloccata: this.sbloccata
        };
    }

    /**
     * Ottieni descrizione per livello
     */
    ottieniDescrizioneLivello(livello = this.livello) {
        const descrizioni = {
            1: this.descrizione,
            2: 'Effetti migliorati',
            3: 'Potere massimo!'
        };
        return descrizioni[livello] || this.descrizione;
    }

    /**
     * Pulisci risorse
     */
    distruggi() {
        for (const p of this.proiettiliAttivi) {
            this.distruggiProiettile(p);
        }
        this.proiettiliAttivi = [];
    }
}
