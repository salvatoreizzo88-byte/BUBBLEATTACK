/**
 * BUBBLE ATTACK - Gestore UI
 * 
 * Gestisce tutta l'interfaccia utente del gioco.
 * HUD, menu, popup, tutto in italiano.
 */

export class GestoreUI {
    constructor(gestoreEconomia = null) {
        this.gestoreEconomia = gestoreEconomia;

        // Stato UI
        this.menuCorrente = null;
        this.hudVisibile = false;
        this.inPausa = false;

        // Elementi DOM
        this.elementi = {};

        // Callbacks
        this.onPausa = null;
        this.onRiprendi = null;
        this.onMenuPrincipale = null;
        this.onGiocaNuovo = null;

        // Inizializza
        this.creaStruttura();
    }

    /**
     * Crea la struttura HTML base
     */
    creaStruttura() {
        // Container principale UI
        const container = document.createElement('div');
        container.id = 'ui-container';
        container.innerHTML = `
            <!-- HUD -->
            <div id="hud" class="hud nascosto">
                <div class="hud-top">
                    <div class="hud-vite">
                        <span id="hud-cuori">❤️❤️❤️</span>
                    </div>
                    <div class="hud-livello">
                        <span id="hud-nome-livello">Livello 1</span>
                    </div>
                    <div class="hud-valute">
                        <span class="valuta-oro">💰 <span id="hud-oro">0</span></span>
                        <span class="valuta-gemme">💎 <span id="hud-gemme">0</span></span>
                    </div>
                </div>
                
                <div class="hud-bottom">
                    <div class="hud-armi">
                        <div class="slot-arma selezionato" id="slot-arma-0">⚡</div>
                        <div class="slot-arma" id="slot-arma-1">-</div>
                        <div class="slot-arma" id="slot-arma-2">-</div>
                    </div>
                    <div class="hud-xp">
                        <div class="xp-barra">
                            <div class="xp-riempimento" id="hud-xp-barra" style="width: 0%"></div>
                        </div>
                        <span id="hud-livello-giocatore">Lv.1</span>
                    </div>
                    <button id="btn-pausa" class="btn-hud">⏸️</button>
                </div>
            </div>
            
            <!-- Menu Pausa -->
            <div id="menu-pausa" class="menu-overlay nascosto">
                <div class="menu-box">
                    <h2>⏸️ PAUSA</h2>
                    <button id="btn-riprendi" class="btn-menu">▶️ Riprendi</button>
                    <button id="btn-negozio" class="btn-menu">🛒 Negozio</button>
                    <button id="btn-impostazioni" class="btn-menu">⚙️ Impostazioni</button>
                    <button id="btn-esci" class="btn-menu">🚪 Menu Principale</button>
                </div>
            </div>
            
            <!-- Menu Principale -->
            <div id="menu-principale" class="menu-overlay nascosto">
                <div class="menu-box grande">
                    <h1>🐉 BUBBLE ATTACK</h1>
                    <p class="sottotitolo">Il Drago delle Bolle</p>
                    <button id="btn-gioca" class="btn-menu primario">🎮 GIOCA</button>
                    <button id="btn-continua" class="btn-menu">▶️ Continua</button>
                    <button id="btn-livelli" class="btn-menu">📍 Seleziona Livello</button>
                    <button id="btn-negozio-main" class="btn-menu">🛒 Negozio</button>
                    <button id="btn-statistiche" class="btn-menu">📊 Statistiche</button>
                    <div class="info-versione">v1.0.0</div>
                </div>
            </div>
            
            <!-- Popup Vittoria -->
            <div id="popup-vittoria" class="popup nascosto">
                <div class="popup-box vittoria">
                    <h2>🏆 LIVELLO COMPLETATO!</h2>
                    <div class="stelle">
                        <span class="stella" id="stella-1">⭐</span>
                        <span class="stella" id="stella-2">⭐</span>
                        <span class="stella" id="stella-3">⭐</span>
                    </div>
                    <div class="ricompense">
                        <p>💰 <span id="vittoria-oro">0</span> Oro</p>
                        <p>⭐ <span id="vittoria-xp">0</span> XP</p>
                    </div>
                    <button id="btn-prossimo" class="btn-menu primario">➡️ Prossimo Livello</button>
                    <button id="btn-rigioca" class="btn-menu">🔄 Rigioca</button>
                </div>
            </div>
            
            <!-- Popup Sconfitta -->
            <div id="popup-sconfitta" class="popup nascosto">
                <div class="popup-box sconfitta">
                    <h2>💀 SCONFITTA</h2>
                    <p>Non arrenderti, riprova!</p>
                    <button id="btn-riprova" class="btn-menu primario">🔄 Riprova</button>
                    <button id="btn-rivivi" class="btn-menu">💎 Rivivi (50 Gemme)</button>
                    <button id="btn-esci-sconfitta" class="btn-menu">🚪 Esci</button>
                </div>
            </div>
            
            <!-- Schermata Negozio -->
            <div id="schermata-negozio" class="menu-overlay nascosto">
                <div class="negozio-box">
                    <div class="negozio-header">
                        <h2>🛒 NEGOZIO</h2>
                        <div class="negozio-valute">
                            <span class="valuta-oro">💰 <span id="negozio-oro">0</span></span>
                            <span class="valuta-gemme">💎 <span id="negozio-gemme">0</span></span>
                        </div>
                        <button id="btn-chiudi-negozio" class="btn-chiudi-x">✖</button>
                    </div>
                    
                    <div class="negozio-tabs">
                        <button class="tab-btn attivo" data-categoria="armi">⚔️ Armi</button>
                        <button class="tab-btn" data-categoria="potenziamenti">💪 Potenziamenti</button>
                        <button class="tab-btn" data-categoria="accessori">👓 Accessori</button>
                        <button class="tab-btn" data-categoria="pacchetti">📦 Pacchetti</button>
                    </div>
                    
                    <div id="negozio-griglia" class="negozio-griglia">
                        <!-- Generato dinamicamente -->
                    </div>
                </div>
            </div>
            
            <!-- Schermata Upgrade Armi -->
            <div id="schermata-upgrade" class="menu-overlay nascosto">
                <div class="upgrade-box">
                    <div class="upgrade-header">
                        <h2>⚔️ POTENZIA ARMI</h2>
                        <div class="negozio-valute">
                            <span class="valuta-oro">💰 <span id="upgrade-oro">0</span></span>
                        </div>
                        <button id="btn-chiudi-upgrade" class="btn-chiudi-x">✖</button>
                    </div>
                    
                    <div class="upgrade-lista">
                        <div id="upgrade-armi-lista" class="armi-lista">
                            <!-- Generato dinamicamente -->
                        </div>
                        
                        <div id="upgrade-dettagli" class="upgrade-dettagli">
                            <div class="arma-icona-grande" id="upgrade-icona">⚡</div>
                            <h3 id="upgrade-nome-arma">Bolla Fulmine</h3>
                            <p id="upgrade-descrizione">Descrizione arma</p>
                            
                            <div class="upgrade-livelli">
                                <div class="livello-punto attivo">Lv.1</div>
                                <div class="livello-linea"></div>
                                <div class="livello-punto">Lv.2</div>
                                <div class="livello-linea"></div>
                                <div class="livello-punto">Lv.3</div>
                            </div>
                            
                            <div id="upgrade-stats" class="upgrade-stats">
                                <!-- Stats generate dinamicamente -->
                            </div>
                            
                            <button id="btn-potenzia" class="btn-menu primario">
                                ⬆️ Potenzia (1000 💰)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Schermata Impostazioni -->
            <div id="schermata-impostazioni" class="menu-overlay nascosto">
                <div class="menu-box grande">
                    <h2>⚙️ IMPOSTAZIONI</h2>
                    
                    <div class="impostazione-riga">
                        <span>🎵 Musica</span>
                        <input type="range" id="slider-musica" min="0" max="100" value="80" class="slider">
                        <span id="val-musica">80%</span>
                    </div>
                    
                    <div class="impostazione-riga">
                        <span>🔊 Effetti</span>
                        <input type="range" id="slider-effetti" min="0" max="100" value="80" class="slider">
                        <span id="val-effetti">80%</span>
                    </div>
                    
                    <div class="impostazione-riga">
                        <span>📳 Vibrazioni</span>
                        <label class="switch">
                            <input type="checkbox" id="toggle-vibrazioni" checked>
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                    
                    <div class="impostazione-riga">
                        <span>🎮 Sensibilità Touch</span>
                        <input type="range" id="slider-sensibilita" min="50" max="150" value="100" class="slider">
                        <span id="val-sensibilita">100%</span>
                    </div>
                    
                    <button id="btn-reset-impostazioni" class="btn-menu">🔄 Ripristina Default</button>
                    <button id="btn-chiudi-impostazioni" class="btn-menu primario">✓ Salva e Chiudi</button>
                </div>
            </div>
            
            <!-- Schermata Statistiche -->
            <div id="schermata-statistiche" class="menu-overlay nascosto">
                <div class="menu-box grande">
                    <h2>📊 STATISTICHE</h2>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-icona">🎮</span>
                            <span class="stat-valore" id="stat-livello-max">1</span>
                            <span class="stat-nome">Livello Massimo</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icona">💀</span>
                            <span class="stat-valore" id="stat-nemici">0</span>
                            <span class="stat-nome">Nemici Sconfitti</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icona">🔵</span>
                            <span class="stat-valore" id="stat-bolle">0</span>
                            <span class="stat-nome">Bolle Sparate</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icona">⏱️</span>
                            <span class="stat-valore" id="stat-tempo">0h</span>
                            <span class="stat-nome">Tempo di Gioco</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icona">💰</span>
                            <span class="stat-valore" id="stat-oro-totale">0</span>
                            <span class="stat-nome">Oro Raccolto</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icona">⭐</span>
                            <span class="stat-valore" id="stat-stelle">0</span>
                            <span class="stat-nome">Stelle Totali</span>
                        </div>
                    </div>
                    
                    <button id="btn-chiudi-statistiche" class="btn-menu primario">✓ Chiudi</button>
                </div>
            </div>
            
            <!-- Toast Notifiche -->
            <div id="toast-container"></div>
        `;

        document.body.appendChild(container);

        // Salva riferimenti elementi
        this.elementi = {
            container: container,
            hud: document.getElementById('hud'),
            menuPausa: document.getElementById('menu-pausa'),
            menuPrincipale: document.getElementById('menu-principale'),
            popupVittoria: document.getElementById('popup-vittoria'),
            popupSconfitta: document.getElementById('popup-sconfitta'),
            toastContainer: document.getElementById('toast-container'),

            // HUD
            cuori: document.getElementById('hud-cuori'),
            nomeLivello: document.getElementById('hud-nome-livello'),
            oro: document.getElementById('hud-oro'),
            gemme: document.getElementById('hud-gemme'),
            xpBarra: document.getElementById('hud-xp-barra'),
            livelloGiocatore: document.getElementById('hud-livello-giocatore'),
            slotArmi: [
                document.getElementById('slot-arma-0'),
                document.getElementById('slot-arma-1'),
                document.getElementById('slot-arma-2')
            ]
        };

        // Aggiungi event listeners
        this.collegaEventi();

        // Aggiungi stili
        this.aggiungiStili();
    }

    /**
     * Collega eventi ai pulsanti
     */
    collegaEventi() {
        // Pausa
        document.getElementById('btn-pausa')?.addEventListener('click', () => this.apriPausa());
        document.getElementById('btn-riprendi')?.addEventListener('click', () => this.chiudiPausa());
        document.getElementById('btn-esci')?.addEventListener('click', () => {
            this.chiudiPausa();
            this.apriMenuPrincipale();
        });

        // Negozio (da menu pausa e principale)
        document.getElementById('btn-negozio')?.addEventListener('click', () => {
            this.chiudiPausa();
            this.apriNegozio();
        });
        document.getElementById('btn-negozio-main')?.addEventListener('click', () => {
            this.chiudiMenuPrincipale();
            this.apriNegozio();
        });

        // Impostazioni
        document.getElementById('btn-impostazioni')?.addEventListener('click', () => {
            this.chiudiPausa();
            this.apriImpostazioni();
        });

        // Statistiche
        document.getElementById('btn-statistiche')?.addEventListener('click', () => {
            this.chiudiMenuPrincipale();
            this.apriStatistiche();
        });

        // Selettore livelli
        document.getElementById('btn-livelli')?.addEventListener('click', () => {
            this.chiudiMenuPrincipale();
            if (this.onApriLivelli) this.onApriLivelli();
        });

        // Menu principale
        document.getElementById('btn-gioca')?.addEventListener('click', () => {
            if (this.onGiocaNuovo) this.onGiocaNuovo();
            this.chiudiMenuPrincipale();
            this.mostraHUD();
        });
        document.getElementById('btn-continua')?.addEventListener('click', () => {
            this.chiudiMenuPrincipale();
            this.mostraHUD();
        });

        // Popup vittoria
        document.getElementById('btn-prossimo')?.addEventListener('click', () => {
            this.chiudiPopupVittoria();
            // Il gioco gestirà il prossimo livello
        });
        document.getElementById('btn-rigioca')?.addEventListener('click', () => {
            this.chiudiPopupVittoria();
        });

        // Popup sconfitta
        document.getElementById('btn-riprova')?.addEventListener('click', () => {
            this.chiudiPopupSconfitta();
        });
    }

    /**
     * Aggiungi stili CSS
     */
    aggiungiStili() {
        const stili = document.createElement('style');
        stili.textContent = `
            #ui-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            #ui-container * {
                pointer-events: auto;
            }
            
            .nascosto {
                display: none !important;
            }
            
            /* HUD */
            .hud {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 15px;
                pointer-events: none;
            }
            
            .hud > * {
                pointer-events: auto;
            }
            
            .hud-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 15px;
            }
            
            .hud-vite {
                font-size: 1.5em;
            }
            
            .hud-livello {
                font-size: 1.2em;
                color: white;
                font-weight: bold;
            }
            
            .hud-valute {
                display: flex;
                gap: 20px;
                font-size: 1.2em;
                color: white;
            }
            
            .valuta-oro {
                color: #ffd700;
            }
            
            .valuta-gemme {
                color: #00bfff;
            }
            
            .hud-bottom {
                position: absolute;
                bottom: 15px;
                left: 15px;
                right: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 15px;
            }
            
            .hud-armi {
                display: flex;
                gap: 10px;
            }
            
            .slot-arma {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .slot-arma.selezionato {
                background: rgba(0, 200, 255, 0.4);
                border-color: #00c8ff;
                box-shadow: 0 0 15px rgba(0, 200, 255, 0.5);
            }
            
            .hud-xp {
                flex: 1;
                max-width: 200px;
                margin: 0 20px;
            }
            
            .xp-barra {
                height: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                overflow: hidden;
            }
            
            .xp-riempimento {
                height: 100%;
                background: linear-gradient(90deg, #4ade80, #22c55e);
                transition: width 0.3s;
            }
            
            .btn-hud {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 10px;
                font-size: 1.5em;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .btn-hud:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            /* Menu Overlay */
            .menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .menu-box {
                background: linear-gradient(180deg, #2d3748, #1a202c);
                padding: 40px 50px;
                border-radius: 20px;
                text-align: center;
                color: white;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                min-width: 300px;
            }
            
            .menu-box.grande {
                min-width: 400px;
            }
            
            .menu-box h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #ffd700, #ff6b35);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .menu-box h2 {
                font-size: 1.8em;
                margin-bottom: 20px;
            }
            
            .sottotitolo {
                color: #a0aec0;
                margin-bottom: 30px;
            }
            
            .btn-menu {
                display: block;
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                color: white;
                font-size: 1.1em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-menu:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.02);
            }
            
            .btn-menu.primario {
                background: linear-gradient(135deg, #4ade80, #22c55e);
                border: none;
                font-weight: bold;
            }
            
            .btn-menu.primario:hover {
                background: linear-gradient(135deg, #22c55e, #16a34a);
            }
            
            /* Popup */
            .popup {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .popup-box {
                background: linear-gradient(180deg, #2d3748, #1a202c);
                padding: 40px 50px;
                border-radius: 20px;
                text-align: center;
                color: white;
                min-width: 350px;
            }
            
            .popup-box.vittoria {
                border: 3px solid #ffd700;
            }
            
            .popup-box.sconfitta {
                border: 3px solid #ef4444;
            }
            
            .stelle {
                font-size: 3em;
                margin: 20px 0;
            }
            
            .stella {
                opacity: 0.3;
                transition: opacity 0.3s;
            }
            
            .stella.attiva {
                opacity: 1;
            }
            
            .ricompense {
                font-size: 1.3em;
                margin: 20px 0;
            }
            
            /* Toast */
            #toast-container {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 2000;
            }
            
            .toast {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                margin-bottom: 10px;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .toast.successo {
                border-left: 4px solid #4ade80;
            }
            
            .toast.errore {
                border-left: 4px solid #ef4444;
            }
            
            .toast.info {
                border-left: 4px solid #3b82f6;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .info-versione {
                margin-top: 30px;
                color: #4a5568;
                font-size: 0.9em;
            }
            
            /* ==================== NEGOZIO ==================== */
            .negozio-box {
                background: linear-gradient(180deg, #2d3748, #1a202c);
                border-radius: 20px;
                padding: 25px;
                width: 90%;
                max-width: 700px;
                max-height: 85vh;
                overflow-y: auto;
                color: white;
            }
            
            .negozio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .negozio-header h2 {
                margin: 0;
            }
            
            .negozio-valute {
                display: flex;
                gap: 20px;
                font-size: 1.2em;
            }
            
            .btn-chiudi-x {
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                font-size: 1.5em;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-chiudi-x:hover {
                background: rgba(239, 68, 68, 0.5);
            }
            
            .negozio-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .tab-btn {
                flex: 1;
                min-width: 120px;
                padding: 12px 15px;
                background: rgba(255,255,255,0.1);
                border: 2px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                color: white;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .tab-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .tab-btn.attivo {
                background: linear-gradient(135deg, #4ade80, #22c55e);
                border-color: transparent;
            }
            
            .negozio-griglia {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
            }
            
            .oggetto-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 15px;
                text-align: center;
                transition: all 0.2s;
            }
            
            .oggetto-card:hover {
                background: rgba(255,255,255,0.1);
                transform: translateY(-3px);
            }
            
            .oggetto-card.posseduto {
                border-color: #22c55e;
                opacity: 0.7;
            }
            
            .oggetto-card.bloccato {
                opacity: 0.5;
            }
            
            .oggetto-icona {
                font-size: 2.5em;
                display: block;
                margin-bottom: 10px;
            }
            
            .oggetto-nome {
                font-weight: bold;
                font-size: 0.95em;
                margin-bottom: 5px;
            }
            
            .oggetto-prezzo {
                font-size: 1.1em;
                color: #ffd700;
                margin-bottom: 10px;
            }
            
            .oggetto-prezzo.gemme {
                color: #00bfff;
            }
            
            .btn-acquista {
                width: 100%;
                padding: 8px;
                background: linear-gradient(135deg, #4ade80, #22c55e);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-acquista:hover {
                background: linear-gradient(135deg, #22c55e, #16a34a);
            }
            
            .btn-acquista:disabled {
                background: #4a5568;
                cursor: not-allowed;
            }
            
            /* ==================== UPGRADE ARMI ==================== */
            .upgrade-box {
                background: linear-gradient(180deg, #2d3748, #1a202c);
                border-radius: 20px;
                padding: 25px;
                width: 90%;
                max-width: 800px;
                max-height: 85vh;
                overflow-y: auto;
                color: white;
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .upgrade-lista {
                display: flex;
                gap: 20px;
            }
            
            .armi-lista {
                width: 200px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .arma-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .arma-item:hover, .arma-item.selezionato {
                background: rgba(255,255,255,0.15);
                border-color: #4ade80;
            }
            
            .arma-item .icona {
                font-size: 1.5em;
            }
            
            .upgrade-dettagli {
                flex: 1;
                background: rgba(255,255,255,0.05);
                border-radius: 15px;
                padding: 25px;
                text-align: center;
            }
            
            .arma-icona-grande {
                font-size: 4em;
                margin-bottom: 15px;
            }
            
            .upgrade-livelli {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin: 20px 0;
            }
            
            .livello-punto {
                padding: 8px 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                font-size: 0.9em;
            }
            
            .livello-punto.attivo {
                background: linear-gradient(135deg, #4ade80, #22c55e);
            }
            
            .livello-punto.corrente {
                border: 2px solid #ffd700;
            }
            
            .livello-linea {
                width: 30px;
                height: 3px;
                background: rgba(255,255,255,0.2);
            }
            
            .upgrade-stats {
                text-align: left;
                padding: 15px;
                background: rgba(0,0,0,0.2);
                border-radius: 10px;
                margin-bottom: 20px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
            }
            
            /* ==================== IMPOSTAZIONI ==================== */
            .impostazione-riga {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .slider {
                -webkit-appearance: none;
                width: 150px;
                height: 8px;
                border-radius: 4px;
                background: rgba(255,255,255,0.2);
                outline: none;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4ade80;
                cursor: pointer;
            }
            
            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .switch-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.2);
                border-radius: 26px;
                transition: 0.3s;
            }
            
            .switch-slider:before {
                content: "";
                position: absolute;
                width: 20px;
                height: 20px;
                left: 3px;
                bottom: 3px;
                background: white;
                border-radius: 50%;
                transition: 0.3s;
            }
            
            .switch input:checked + .switch-slider {
                background: #4ade80;
            }
            
            .switch input:checked + .switch-slider:before {
                transform: translateX(24px);
            }
            
            /* ==================== STATISTICHE ==================== */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .stat-card {
                background: rgba(255,255,255,0.05);
                border-radius: 15px;
                padding: 20px 15px;
                text-align: center;
            }
            
            .stat-icona {
                font-size: 2em;
                display: block;
                margin-bottom: 10px;
            }
            
            .stat-valore {
                font-size: 1.8em;
                font-weight: bold;
                display: block;
                color: #4ade80;
            }
            
            .stat-nome {
                font-size: 0.85em;
                color: #a0aec0;
            }
            
            @media (max-width: 600px) {
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .upgrade-lista {
                    flex-direction: column;
                }
                .armi-lista {
                    width: 100%;
                    flex-direction: row;
                    overflow-x: auto;
                }
            }
        `;

        document.head.appendChild(stili);
    }

    // ==================== CONTROLLI HUD ====================

    mostraHUD() {
        this.elementi.hud.classList.remove('nascosto');
        this.hudVisibile = true;
        this.aggiornaHUD();
    }

    nascondiHUD() {
        this.elementi.hud.classList.add('nascosto');
        this.hudVisibile = false;
    }

    aggiornaHUD() {
        if (!this.gestoreEconomia) return;

        const eco = this.gestoreEconomia;

        // Valute
        this.elementi.oro.textContent = eco.valute.oro.toLocaleString();
        this.elementi.gemme.textContent = eco.valute.gemme.toLocaleString();

        // XP
        const percentualeXP = (eco.progressione.esperienza / eco.progressione.esperienzaProssimoLivello) * 100;
        this.elementi.xpBarra.style.width = `${percentualeXP}%`;
        this.elementi.livelloGiocatore.textContent = `Lv.${eco.progressione.livelloGiocatore}`;
    }

    aggiornaVite(vite, viteMax = 3) {
        const cuori = '❤️'.repeat(vite) + '🖤'.repeat(viteMax - vite);
        this.elementi.cuori.textContent = cuori;
    }

    aggiornaNomeLivello(nome) {
        this.elementi.nomeLivello.textContent = nome;
    }

    aggiornaSlotArmi(slot, icona, selezionato = false) {
        if (slot < 0 || slot >= 3) return;

        const elemento = this.elementi.slotArmi[slot];
        elemento.textContent = icona || '-';

        // Aggiorna selezione
        this.elementi.slotArmi.forEach((s, i) => {
            s.classList.toggle('selezionato', i === slot && selezionato);
        });
    }

    // ==================== MENU ====================

    apriPausa() {
        this.elementi.menuPausa.classList.remove('nascosto');
        this.inPausa = true;

        if (this.onPausa) this.onPausa();
    }

    chiudiPausa() {
        this.elementi.menuPausa.classList.add('nascosto');
        this.inPausa = false;

        if (this.onRiprendi) this.onRiprendi();
    }

    apriMenuPrincipale() {
        this.elementi.menuPrincipale.classList.remove('nascosto');
        this.nascondiHUD();

        if (this.onMenuPrincipale) this.onMenuPrincipale();
    }

    chiudiMenuPrincipale() {
        this.elementi.menuPrincipale.classList.add('nascosto');
    }

    // ==================== POPUP ====================

    mostraVittoria(oro, xp, stelle = 3) {
        this.elementi.popupVittoria.classList.remove('nascosto');

        document.getElementById('vittoria-oro').textContent = oro.toLocaleString();
        document.getElementById('vittoria-xp').textContent = xp.toLocaleString();

        // Stelle
        for (let i = 1; i <= 3; i++) {
            const stella = document.getElementById(`stella-${i}`);
            stella.classList.toggle('attiva', i <= stelle);
        }
    }

    chiudiPopupVittoria() {
        this.elementi.popupVittoria.classList.add('nascosto');
    }

    mostraSconfitta() {
        this.elementi.popupSconfitta.classList.remove('nascosto');
    }

    chiudiPopupSconfitta() {
        this.elementi.popupSconfitta.classList.add('nascosto');
    }

    // ==================== TOAST ====================

    mostraToast(messaggio, tipo = 'info', durata = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.textContent = messaggio;

        this.elementi.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, durata);
    }

    // ==================== UTILITY ====================

    /**
     * Pulisci e rimuovi UI
     */
    distruggi() {
        if (this.elementi.container) {
            this.elementi.container.remove();
        }
    }

    // ==================== NEGOZIO ====================

    /**
     * Imposta riferimento al negozio
     */
    setNegozio(negozio) {
        this.negozio = negozio;
    }

    /**
     * Apre la schermata negozio
     */
    apriNegozio(categoria = 'armi') {
        const schermata = document.getElementById('schermata-negozio');
        schermata.classList.remove('nascosto');

        // Aggiorna valute
        this.aggiornaValuteNegozio();

        // Imposta categoria e popola
        this.cambiaCategoriaNegozo(categoria);

        // Collega eventi tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => this.cambiaCategoriaNegozo(btn.dataset.categoria);
        });

        // Pulsante chiudi
        document.getElementById('btn-chiudi-negozio').onclick = () => this.chiudiNegozio();

        console.log('🛒 Negozio aperto');
    }

    chiudiNegozio() {
        document.getElementById('schermata-negozio').classList.add('nascosto');
    }

    aggiornaValuteNegozio() {
        if (!this.gestoreEconomia) return;
        document.getElementById('negozio-oro').textContent =
            this.gestoreEconomia.valute.oro.toLocaleString();
        document.getElementById('negozio-gemme').textContent =
            this.gestoreEconomia.valute.gemme.toLocaleString();
    }

    cambiaCategoriaNegozo(categoria) {
        // Aggiorna tab attivo
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('attivo', btn.dataset.categoria === categoria);
        });

        // Popola griglia
        this.popolaGrigliaNegozio(categoria);
    }

    popolaGrigliaNegozio(categoria) {
        const griglia = document.getElementById('negozio-griglia');
        griglia.innerHTML = '';

        if (!this.negozio) {
            griglia.innerHTML = '<p style="color:#a0aec0">Negozio non disponibile</p>';
            return;
        }

        this.negozio.categoriaCorrente = categoria;
        const oggetti = this.negozio.ottieniOggettiCategoria();

        oggetti.forEach(ogg => {
            const card = document.createElement('div');
            card.className = 'oggetto-card';
            if (ogg.posseduto) card.classList.add('posseduto');
            if (!ogg.acquistabile && !ogg.posseduto) card.classList.add('bloccato');

            const prezzoClasse = ogg.valuta === 'gemme' ? 'gemme' : '';
            const simboloValuta = ogg.valuta === 'gemme' ? '💎' : '💰';

            card.innerHTML = `
                <span class="oggetto-icona">${ogg.icona}</span>
                <div class="oggetto-nome">${ogg.nome}</div>
                <div class="oggetto-prezzo ${prezzoClasse}">${simboloValuta} ${ogg.prezzo}</div>
                ${ogg.posseduto
                    ? '<span style="color:#4ade80">✓ Posseduto</span>'
                    : ogg.motivoBlocco
                        ? `<span style="color:#ef4444;font-size:0.8em">${ogg.motivoBlocco}</span>`
                        : `<button class="btn-acquista" data-id="${ogg.id}">Acquista</button>`
                }
            `;

            griglia.appendChild(card);
        });

        // Collega eventi acquisto
        griglia.querySelectorAll('.btn-acquista').forEach(btn => {
            btn.onclick = () => this.eseguiAcquisto(btn.dataset.id);
        });
    }

    eseguiAcquisto(idOggetto) {
        if (!this.negozio) return;

        const risultato = this.negozio.acquista(idOggetto);

        if (risultato.successo) {
            this.mostraToast(`✓ ${risultato.oggetto.nome} acquistato!`, 'successo');
            this.aggiornaValuteNegozio();
            this.popolaGrigliaNegozio(this.negozio.categoriaCorrente);
            this.aggiornaHUD();
        } else {
            this.mostraToast(`✗ ${risultato.errore}`, 'errore');
        }
    }

    // ==================== UPGRADE ARMI ====================

    /**
     * Imposta riferimento all'arsenale
     */
    setArsenale(arsenale) {
        this.arsenale = arsenale;
    }

    apriUpgradeArmi() {
        const schermata = document.getElementById('schermata-upgrade');
        schermata.classList.remove('nascosto');

        this.aggiornaOroUpgrade();
        this.popolaListaArmi();

        document.getElementById('btn-chiudi-upgrade').onclick = () => this.chiudiUpgradeArmi();

        console.log('⚔️ Upgrade armi aperto');
    }

    chiudiUpgradeArmi() {
        document.getElementById('schermata-upgrade').classList.add('nascosto');
    }

    aggiornaOroUpgrade() {
        if (!this.gestoreEconomia) return;
        document.getElementById('upgrade-oro').textContent =
            this.gestoreEconomia.valute.oro.toLocaleString();
    }

    popolaListaArmi() {
        const lista = document.getElementById('upgrade-armi-lista');
        lista.innerHTML = '';

        if (!this.gestoreEconomia) return;

        const armiInfo = {
            'BollaFulmine': { icona: '⚡', nome: 'Bolla Fulmine' },
            'OndaMareale': { icona: '🌊', nome: 'Onda Mareale' },
            'TrivellaPerforante': { icona: '🔧', nome: 'Trivella' },
            'TorrenteNapalm': { icona: '🔥', nome: 'Torrente Napalm' },
            'AncoraGravitazionale': { icona: '⚓', nome: 'Ancora Grav.' },
            'CongelaTempo': { icona: '⏱️', nome: 'Congela Tempo' },
            'VuotoSingolarita': { icona: '🌀', nome: 'Singolarità' },
            'DardoElio': { icona: '🎈', nome: 'Dardo Elio' },
            'CometaRimbalzante': { icona: '☄️', nome: 'Cometa' }
        };

        Object.entries(this.gestoreEconomia.livelliArmi).forEach(([id, livello]) => {
            if (livello > 0) {
                const info = armiInfo[id] || { icona: '❓', nome: id };
                const item = document.createElement('div');
                item.className = 'arma-item';
                item.innerHTML = `
                    <span class="icona">${info.icona}</span>
                    <span>${info.nome} Lv.${livello}</span>
                `;
                item.onclick = () => this.selezionaArmaUpgrade(id, info, livello);
                lista.appendChild(item);
            }
        });

        if (lista.children.length === 0) {
            lista.innerHTML = '<p style="color:#a0aec0;padding:20px">Nessuna arma sbloccata</p>';
        }
    }

    selezionaArmaUpgrade(id, info, livelloCorrente) {
        document.getElementById('upgrade-icona').textContent = info.icona;
        document.getElementById('upgrade-nome-arma').textContent = info.nome;
        document.getElementById('upgrade-descrizione').textContent = `Livello attuale: ${livelloCorrente}/3`;

        // Aggiorna indicatori livello
        const livelli = document.querySelectorAll('.livello-punto');
        livelli.forEach((el, i) => {
            el.classList.toggle('attivo', i < livelloCorrente);
            el.classList.toggle('corrente', i === livelloCorrente - 1);
        });

        // Pulsante potenzia
        const btn = document.getElementById('btn-potenzia');
        if (livelloCorrente >= 3) {
            btn.textContent = '✓ Livello Massimo';
            btn.disabled = true;
        } else {
            const costo = [500, 1500, 3000][livelloCorrente];
            btn.textContent = `⬆️ Potenzia (${costo} 💰)`;
            btn.disabled = false;
            btn.onclick = () => this.potenziaArma(id, costo);
        }

        // Evidenzia selezione
        document.querySelectorAll('.arma-item').forEach(el => el.classList.remove('selezionato'));
        event.currentTarget.classList.add('selezionato');
    }

    potenziaArma(idArma, costo) {
        if (!this.gestoreEconomia) return;

        if (this.gestoreEconomia.valute.oro >= costo) {
            this.gestoreEconomia.rimuoviOro(costo);
            this.gestoreEconomia.livelliArmi[idArma]++;
            this.mostraToast('⬆️ Arma potenziata!', 'successo');
            this.aggiornaOroUpgrade();
            this.popolaListaArmi();
            this.aggiornaHUD();
        } else {
            this.mostraToast('✗ Oro insufficiente!', 'errore');
        }
    }

    // ==================== IMPOSTAZIONI ====================

    apriImpostazioni() {
        const schermata = document.getElementById('schermata-impostazioni');
        schermata.classList.remove('nascosto');

        // Carica valori salvati
        const impostazioni = JSON.parse(localStorage.getItem('bubble-attack-settings') || '{}');

        document.getElementById('slider-musica').value = impostazioni.musica ?? 80;
        document.getElementById('slider-effetti').value = impostazioni.effetti ?? 80;
        document.getElementById('slider-sensibilita').value = impostazioni.sensibilita ?? 100;
        document.getElementById('toggle-vibrazioni').checked = impostazioni.vibrazioni ?? true;

        this.aggiornaValoriSlider();

        // Eventi
        document.getElementById('slider-musica').oninput = () => this.aggiornaValoriSlider();
        document.getElementById('slider-effetti').oninput = () => this.aggiornaValoriSlider();
        document.getElementById('slider-sensibilita').oninput = () => this.aggiornaValoriSlider();

        document.getElementById('btn-reset-impostazioni').onclick = () => this.resetImpostazioni();
        document.getElementById('btn-chiudi-impostazioni').onclick = () => this.salvaEChiudiImpostazioni();

        console.log('⚙️ Impostazioni aperte');
    }

    aggiornaValoriSlider() {
        document.getElementById('val-musica').textContent =
            document.getElementById('slider-musica').value + '%';
        document.getElementById('val-effetti').textContent =
            document.getElementById('slider-effetti').value + '%';
        document.getElementById('val-sensibilita').textContent =
            document.getElementById('slider-sensibilita').value + '%';
    }

    resetImpostazioni() {
        document.getElementById('slider-musica').value = 80;
        document.getElementById('slider-effetti').value = 80;
        document.getElementById('slider-sensibilita').value = 100;
        document.getElementById('toggle-vibrazioni').checked = true;
        this.aggiornaValoriSlider();
        this.mostraToast('🔄 Impostazioni ripristinate', 'info');
    }

    salvaEChiudiImpostazioni() {
        const impostazioni = {
            musica: parseInt(document.getElementById('slider-musica').value),
            effetti: parseInt(document.getElementById('slider-effetti').value),
            sensibilita: parseInt(document.getElementById('slider-sensibilita').value),
            vibrazioni: document.getElementById('toggle-vibrazioni').checked
        };

        localStorage.setItem('bubble-attack-settings', JSON.stringify(impostazioni));
        document.getElementById('schermata-impostazioni').classList.add('nascosto');

        // Applica impostazioni audio se disponibile
        if (window.gioco?.gestoreAudio) {
            window.gioco.gestoreAudio.impostaVolumeMusica(impostazioni.musica / 100);
            window.gioco.gestoreAudio.impostaVolumeEffetti(impostazioni.effetti / 100);
        }

        this.mostraToast('✓ Impostazioni salvate', 'successo');
    }

    // ==================== STATISTICHE ====================

    apriStatistiche() {
        const schermata = document.getElementById('schermata-statistiche');
        schermata.classList.remove('nascosto');

        if (this.gestoreEconomia) {
            const eco = this.gestoreEconomia;
            const stats = eco.statistiche || {};

            document.getElementById('stat-livello-max').textContent =
                eco.progressione?.livelloMaxRaggiunto || 1;
            document.getElementById('stat-nemici').textContent =
                (stats.nemiciSconfitti || 0).toLocaleString();
            document.getElementById('stat-bolle').textContent =
                (stats.bolleSparate || 0).toLocaleString();
            document.getElementById('stat-oro-totale').textContent =
                (stats.oroTotaleRaccolto || 0).toLocaleString();

            // Tempo di gioco
            const minuti = Math.floor((stats.tempoGioco || 0) / 60);
            const ore = Math.floor(minuti / 60);
            document.getElementById('stat-tempo').textContent =
                ore > 0 ? `${ore}h ${minuti % 60}m` : `${minuti}m`;

            // Stelle (simulazione)
            document.getElementById('stat-stelle').textContent =
                ((eco.progressione?.livelloMaxRaggiunto || 1) - 1) * 3;
        }

        document.getElementById('btn-chiudi-statistiche').onclick = () => {
            schermata.classList.add('nascosto');
        };

        console.log('📊 Statistiche aperte');
    }
}
