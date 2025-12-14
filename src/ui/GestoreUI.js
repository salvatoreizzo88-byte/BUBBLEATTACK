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
}
